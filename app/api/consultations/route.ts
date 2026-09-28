import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit, ensureVisit, getSession, patientInHospital, scopedHospitalId } from "@/lib/auth";
import { consultationSchema } from "@/lib/validators";
import { nextQuestion } from "@/lib/clinicalAi";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role === "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const p = consultationSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "Chief complaint required" }, { status: 400 });
  const patient = await prisma.patient.findUnique({ where: { id: p.data.patientId } });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  const hid = await scopedHospitalId(s);
  if (s.role !== "ADMIN") {
    if (!hid || hid === "__none__") return NextResponse.json({ error: "Select your hospital first." }, { status: 403 });
    if (!(await patientInHospital(patient.id, hid)))
      return NextResponse.json({ error: "Patient is not registered at your hospital. Register or link them first." }, { status: 403 });
  }
  const firstQ = nextQuestion(p.data.chiefComplaint, 0, p.data.language);
  const c = await prisma.consultation.create({
    data: {
      patientId: patient.id, clinicianId: s.id, hospitalId: s.role === "ADMIN" ? undefined : hid ?? undefined,
      chiefComplaint: p.data.chiefComplaint.trim(),
      language: p.data.language, status: "IN_PROGRESS", progress: 5,
      messages: { create: [{ role: "ASSISTANT", content: `Namaste ${patient.name.split(" ")[0]}! I will help document your history for the doctor. ${firstQ}`, language: p.data.language }] },
    },
  });
  if (hid && hid !== "__none__") await ensureVisit(patient.id, hid);
  await audit("CONSULT_CREATE", "Consultation", c.id, s.id, c.id, p.data.chiefComplaint);
  return NextResponse.json({ consultation: c }, { status: 201 });
}
