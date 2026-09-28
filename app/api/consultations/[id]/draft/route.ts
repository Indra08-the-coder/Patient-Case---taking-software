import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = await prisma.clinicalHistorySummary.findUnique({ where: { consultationId: (await params).id } });
  const full = await prisma.consultation.findUnique({ where: { id: (await params).id } });
  if (!c && !full) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const draft = c ? { chiefComplaint: c.chiefComplaint, presentIllness: c.presentIllness, pastMedicalHistory: c.pastMedicalHistory, medicationHistory: c.medicationHistory, allergies: c.allergies, familyHistory: c.familyHistory, socialHistory: c.socialHistory, reviewOfSystems: c.reviewOfSystems, missingInfo: c.missingInfo, conciseSummary: c.conciseSummary } : { chiefComplaint: full?.chiefComplaint ?? "" };
  return NextResponse.json({ draft });
}
