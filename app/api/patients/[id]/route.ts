import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, audit } from "@/lib/auth";
import { patientSchema } from "@/lib/validators";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role === "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = (await params).id;
  // ABHA lookup: /api/patients/abha/<abhaId> is handled by the abha route; here id is patient id.
  const p = await prisma.patient.findUnique({ where: { id }, include: { visits: { include: { hospital: true } } } });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (s.role !== "ADMIN") {
    if (!s.hospitalId) return NextResponse.json({ error: "Select your hospital first." }, { status: 403 });
    const ok = p.visits.some((v) => v.hospitalId === s.hospitalId);
    if (!ok) return NextResponse.json({ error: "Patient is not registered at your hospital." }, { status: 403 });
  }
  return NextResponse.json({ patient: p });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role === "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = (await params).id;
  if (s.role !== "ADMIN") {
    if (!s.hospitalId) return NextResponse.json({ error: "Select your hospital first." }, { status: 403 });
    const v = await prisma.patientHospitalVisit.findUnique({ where: { patientId_hospitalId: { patientId: id, hospitalId: s.hospitalId } } });
    if (!v) return NextResponse.json({ error: "Patient is not registered at your hospital." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const v = patientSchema.partial().safeParse(body);
  if (!v.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { hospitalId: _h, ...data } = v.data as Record<string, unknown>;
  const p = await prisma.patient.update({ where: { id }, data: { ...(data as object), age: (v.data as { age?: number }).age ?? undefined } });
  await audit("PATIENT_UPDATE", "Patient", id, s.id);
  return NextResponse.json({ patient: p });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s || (s.role !== "ADMIN" && s.role !== "DOCTOR")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = (await params).id;
  await prisma.patient.delete({ where: { id } });
  await audit("PATIENT_DELETE", "Patient", id, s.id);
  return NextResponse.json({ ok: true });
}

