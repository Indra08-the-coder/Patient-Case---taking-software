import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit, getSession } from "@/lib/auth";
import { voiceNoteSchema } from "@/lib/validators";

async function resolvePid(user: { role: string; patientId?: string | null; abhaId?: string | null }, pid?: string) {
  if (user.role === "PATIENT") {
    if (user.patientId) return user.patientId;
    const p = await prisma.patient.findUnique({ where: { abhaId: user.abhaId ?? "__none__" } });
    return p?.id ?? null;
  }
  return pid ?? null;
}

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pid = await resolvePid(s, new URL(req.url).searchParams.get("patientId") ?? undefined);
  if (!pid) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const notes = await prisma.voiceNote.findMany({ where: { patientId: pid }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const p = voiceNoteSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const pid = await resolvePid(s, p.data.patientId);
  if (!pid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const note = await prisma.voiceNote.create({ data: { ...p.data, patientId: pid, createdBy: s.id } });
  await audit("VOICE_NOTE_ADD", "Patient", pid, s.id, undefined, p.data.title ?? "Voice note");
  return NextResponse.json({ note }, { status: 201 });
}

export async function DELETE(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.voiceNote.delete({ where: { id } });
  await audit("VOICE_NOTE_DELETE", "VoiceNote", id, s.id);
  return NextResponse.json({ ok: true });
}
