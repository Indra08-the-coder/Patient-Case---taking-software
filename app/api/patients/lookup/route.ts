import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit, getSession } from "@/lib/auth";

// GET /api/patients/lookup?abha=<abhaId>
// Doctor/staff flow: enter patient's ABHA ID -> get full patient file
// (profile, hospitals, consultations, past illnesses, docs, voice notes)
// Hospital-scoped: staff only see patients registered at THEIR hospital.
export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role === "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const abha = new URL(req.url).searchParams.get("abha")?.trim();
  if (!abha || abha.length < 3) return NextResponse.json({ error: "Enter a valid ABHA ID." }, { status: 400 });

  const p = await prisma.patient.findUnique({
    where: { abhaId: abha },
    include: {
      visits: { include: { hospital: true } },
      consultations: { orderBy: { updatedAt: "desc" }, take: 10, include: { redFlags: true, summary: true } },
      pastIllnesses: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" }, take: 10 },
      voiceNotes: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!p) return NextResponse.json({ error: "No patient found with this ABHA ID.", found: false }, { status: 404 });

  if (s.role !== "ADMIN") {
    if (!s.hospitalId) return NextResponse.json({ error: "Select your hospital first.", found: true, needsHospital: true }, { status: 403 });
    const linked = p.visits.some((v) => v.hospitalId === s.hospitalId);
    if (!linked) {
      await audit("ABHA_LOOKUP_DENIED", "Patient", p.id, s.id, undefined, abha);
      return NextResponse.json({
        error: `This patient is not registered at your hospital (${s.hospitalId}). Ask the patient to select your hospital in their app, or register them via reception.`,
        found: true, linked: false,
        hospitals: p.visits.map((v) => v.hospital.name),
      }, { status: 403 });
    }
  }

  await audit("ABHA_LOOKUP", "Patient", p.id, s.id, undefined, abha);
  const { documents, ...rest } = p as typeof p & { documents: (typeof p.documents)[number][] };
  return NextResponse.json({
    found: true, linked: true,
    patient: { ...rest, documents: documents.map((d) => ({ ...d, fileData: d.fileData ? "[stored]" : "" })) },
  });
}
