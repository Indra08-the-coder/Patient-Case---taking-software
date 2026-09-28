import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, audit } from "@/lib/auth";
import { reviewSchema } from "@/lib/validators";

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const p = reviewSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "Invalid review payload" }, { status: 400 });
  if ((p.data.status === "APPROVED" || p.data.status === "ARCHIVED") && s.role !== "DOCTOR" && s.role !== "ADMIN")
    return NextResponse.json({ error: "Only doctors/admins can approve." }, { status: 403 });
  const c = await prisma.consultation.findUnique({ where: { id: p.data.consultationId }, include: { patient: { include: { visits: true } } } });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (s.role !== "ADMIN") {
    if (!s.hospitalId || (c.hospitalId && c.hospitalId !== s.hospitalId)) return NextResponse.json({ error: "Not your hospital's consultation." }, { status: 403 });
    if (!c.hospitalId && !c.patient.visits.some((v) => v.hospitalId === s.hospitalId)) return NextResponse.json({ error: "Not your hospital's consultation." }, { status: 403 });
  }
  const updated = await prisma.consultation.update({ where: { id: c.id }, data: { status: p.data.status, clinicianNotes: p.data.clinicianNotes ?? c.clinicianNotes, progress: p.data.status === "APPROVED" ? 100 : c.progress } });
  if (p.data.summary) {
    await prisma.clinicalHistorySummary.upsert({
      where: { consultationId: c.id },
      create: { consultationId: c.id, chiefComplaint: c.chiefComplaint, ...(p.data.summary as Record<string, string>), conciseSummary: (p.data.summary as Record<string, string>).conciseSummary ?? "" },
      update: { ...(p.data.summary as Record<string, string>), version: { increment: 1 }, approvedBy: p.data.status === "APPROVED" ? s.name : undefined, approvedAt: p.data.status === "APPROVED" ? new Date() : undefined },
    });
  } else if (p.data.status === "APPROVED") {
    await prisma.clinicalHistorySummary.updateMany({ where: { consultationId: c.id }, data: { approvedBy: s.name, approvedAt: new Date() } });
  }
  await audit(`CONSULT_${p.data.status}`, "Consultation", c.id, s.id, c.id);
  return NextResponse.json({ consultation: updated });
}
