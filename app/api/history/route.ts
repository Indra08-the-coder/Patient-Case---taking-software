import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit, getSession } from "@/lib/auth";
import { pastIllnessSchema } from "@/lib/validators";

async function myPatientId(user: { id: string; role: string; patientId?: string | null; abhaId?: string | null }, bodyPatientId?: string) {
  if (user.role === "PATIENT") {
    if (user.patientId) return user.patientId;
    const p = await prisma.patient.findUnique({ where: { abhaId: user.abhaId ?? "__none__" } });
    return p?.id ?? null;
  }
  return bodyPatientId ?? null;
}

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pid = await myPatientId(s, new URL(req.url).searchParams.get("patientId") ?? undefined);
  if (!pid) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  const items = await prisma.pastIllness.findMany({ where: { patientId: pid }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const p = pastIllnessSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const pid = await myPatientId(s, p.data.patientId);
  if (!pid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (s.role === "PATIENT") {
    const own = s.patientId === pid || (await prisma.patient.findUnique({ where: { id: pid } }))?.abhaId === s.abhaId;
    if (!own) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const item = await prisma.pastIllness.create({ data: { ...p.data, patientId: pid, source: s.role === "PATIENT" ? "self" : p.data.source ?? "clinician" } });
  await audit("PAST_ILLNESS_ADD", "Patient", pid, s.id, undefined, p.data.condition);
  return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const existing = await prisma.pastIllness.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (s.role === "PATIENT") {
    const own = s.patientId === existing.patientId || (await prisma.patient.findUnique({ where: { id: existing.patientId } }))?.abhaId === s.abhaId;
    if (!own) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.pastIllness.delete({ where: { id } });
  await audit("PAST_ILLNESS_DELETE", "Patient", existing.patientId, s.id, undefined, id);
  return NextResponse.json({ ok: true });
}
