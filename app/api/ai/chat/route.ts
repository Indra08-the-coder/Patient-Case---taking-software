import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, audit } from "@/lib/auth";
import { chatSchema } from "@/lib/validators";
import { buildSummary, detectRedFlags, llmFollowUp, nextQuestion } from "@/lib/clinicalAi";

function sectionFor(turn: number, q: string, a: string): string {
  const t = `${q} ${a}`.toLowerCase();
  if (/medicine|tablet|dose|drug/.test(t)) return "medicationHistory";
  if (/allerg/.test(t)) return "allergies";
  if (/father|mother|family|parent|sibling/.test(t)) return "familyHistory";
  if (/smok|alcohol|tobacco|work|occupation|diet/.test(t)) return "socialHistory";
  if (/past|bp|diabetes|sugar|asthma|tb|heart|kidney|thyroid|operation|surgery/.test(t)) return "pastMedicalHistory";
  if (/fever|cough|pain|breath|sleep|appetite|weight|urine|stool/.test(t)) return "reviewOfSystems";
  return turn <= 2 ? "presentIllness" : "reviewOfSystems";
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role === "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const p = chatSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const c = await prisma.consultation.findUnique({ where: { id: p.data.consultationId }, include: { patient: { include: { visits: true } }, messages: { orderBy: { createdAt: "asc" } }, responses: true } });
  if (!c) return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
  if (s.role !== "ADMIN") {
    if (!s.hospitalId || (c.hospitalId && c.hospitalId !== s.hospitalId)) return NextResponse.json({ error: "Not your hospital's consultation." }, { status: 403 });
    if (!c.hospitalId && !c.patient.visits.some((v) => v.hospitalId === s.hospitalId)) return NextResponse.json({ error: "Not your hospital's consultation." }, { status: 403 });
  }

  const answer = p.data.content.trim().slice(0, 2000);
  const lastAssistant = [...c.messages].reverse().find((m) => m.role === "ASSISTANT");
  const userTurns = c.messages.filter((m) => m.role === "USER").length;

  await prisma.conversationMessage.create({ data: { consultationId: c.id, role: "USER", content: answer, language: p.data.language } });
  await prisma.historyResponse.create({
    data: { consultationId: c.id, section: sectionFor(userTurns, lastAssistant?.content ?? "", answer), question: (lastAssistant?.content ?? "Chief complaint").slice(0, 500), answer, language: p.data.language },
  });

  // Red flags (deterministic + LLM tag)
  const flags = detectRedFlags(`${lastAssistant?.content ?? ""} ${answer}`);
  // LLM follow-up (server-side only), fallback to rule engine
  const turns = [...c.messages.map((m) => ({ role: m.role, content: m.content })), { role: "USER", content: answer }];
  let follow: string | null = await llmFollowUp(c.chiefComplaint, turns, p.data.language);
  const llmTag = follow?.match(/\[RED FLAG:\s*([^\]]+)\]/i)?.[1];
  if (llmTag) flags.push({ label: llmTag.trim(), detail: "Flagged by AI intake â€” verify and escalate per SOP.", severity: "URGENT" as const });
  if (follow) follow = follow.replace(/\[RED FLAG:[^\]]+\]/i, "").trim();
  if (!follow) follow = nextQuestion(c.chiefComplaint, userTurns + 1, p.data.language);

  await prisma.conversationMessage.create({ data: { consultationId: c.id, role: "ASSISTANT", content: follow, language: p.data.language } });
  for (const f of flags) {
    const dup = await prisma.redFlag.findFirst({ where: { consultationId: c.id, label: f.label } });
    if (!dup) await prisma.redFlag.create({ data: { consultationId: c.id, label: f.label, detail: f.detail, severity: "URGENT" } });
  }

  const allResponses = await prisma.historyResponse.findMany({ where: { consultationId: c.id }, orderBy: { createdAt: "asc" } });
  const draft = buildSummary(c.chiefComplaint, allResponses.map((r) => ({ section: r.section, question: r.question, answer: r.answer })));
  await prisma.clinicalHistorySummary.upsert({
    where: { consultationId: c.id },
    create: { consultationId: c.id, ...draft },
    update: { ...draft, version: { increment: 1 } },
  });
  const progress = Math.min(95, 10 + allResponses.length * 12);
  await prisma.consultation.update({ where: { id: c.id }, data: { progress, status: c.status === "DRAFT" ? "IN_PROGRESS" : c.status, aiSummary: draft.conciseSummary } });
  await audit("AI_TURN", "Consultation", c.id, s.id, c.id, `turn ${userTurns + 1}, flags ${flags.length}`);

  return NextResponse.json({ reply: follow, redFlags: flags, progress });
}

