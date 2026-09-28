import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hospitals = await prisma.hospital.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ hospitals, mine: s.hospitalId ?? null });
}

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { hospitalId } = await req.json().catch(() => ({}));
  if (s.role === "PATIENT") {
    // Patient selects which hospital they are visiting (creates consent visit link).
    if (!hospitalId) return NextResponse.json({ error: "hospitalId required" }, { status: 400 });
    const h = await prisma.hospital.findUnique({ where: { id: String(hospitalId) } });
    if (!h) return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    const pid = s.patientId ?? (await prisma.patient.findUnique({ where: { abhaId: s.abhaId ?? "__none__" } }))?.id;
    if (!pid) return NextResponse.json({ error: "Patient record not found" }, { status: 404 });
    await prisma.patientHospitalVisit.upsert({
      where: { patientId_hospitalId: { patientId: pid, hospitalId: h.id } },
      update: { consent: true },
      create: { patientId: pid, hospitalId: h.id, consent: true },
    });
    await prisma.auditLog.create({ data: { action: "HOSPITAL_SELECT", entity: "Hospital", entityId: h.id, actorId: s.id, metadata: h.name } });
    return NextResponse.json({ ok: true, hospital: h });
  }
  // Staff select their working hospital (must exist).
  if (!hospitalId) return NextResponse.json({ error: "hospitalId required" }, { status: 400 });
  const h = await prisma.hospital.findUnique({ where: { id: String(hospitalId) } });
  if (!h) return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
  await prisma.user.update({ where: { id: s.id }, data: { hospitalId: h.id } });
  await prisma.auditLog.create({ data: { action: "HOSPITAL_SELECT", entity: "Hospital", entityId: h.id, actorId: s.id, metadata: h.name } });
  return NextResponse.json({ ok: true, hospital: h });
}
