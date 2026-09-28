import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit, ensureVisit, signSession, COOKIE } from "@/lib/auth";
import { abhaLoginSchema } from "@/lib/validators";

// Demo ABHA flow (ABDM sandbox-style):
// Step 1: POST { abhaId } -> returns demo OTP hint + whether the ABHA is already linked.
// Step 2: POST { abhaId, otp, hospitalId? } -> verifies OTP (demo OTP is 123456),
// links/creates a PATIENT user + patient record, links the patient to the
// selected hospital (visit/consent), and signs them in.
const DEMO_OTP = "123456";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const p = abhaLoginSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Invalid ABHA ID" }, { status: 400 });
  const abhaId = p.data.abhaId.trim();
  const hospitalId = (body as { hospitalId?: string }).hospitalId;

  const existingUser = await prisma.user.findUnique({ where: { abhaId }, include: { patientRecord: true } });
  const existingPatient = existingUser ? null : await prisma.patient.findUnique({ where: { abhaId }, include: { visits: { include: { hospital: true } } } });

  // Step 1 — request OTP
  if (!p.data.otp) {
    const hospitals = await prisma.hospital.findMany({ orderBy: { name: "asc" } });
    await audit("ABHA_OTP_REQUEST", "User", existingUser?.id ?? abhaId, undefined, undefined, abhaId);
    return NextResponse.json({
      ok: true, otpSent: true,
      linked: !!(existingUser ?? existingPatient),
      hospitals,
      myHospitals: existingPatient?.visits.map((v) => v.hospital) ?? [],
      // NEVER do this in production — demo convenience only:
      demoOtp: DEMO_OTP,
      message: existingUser ?? existingPatient ? "ABHA found. Pick your hospital, then enter the OTP." : "ABHA not linked yet. Pick your hospital, enter OTP to create your account.",
    });
  }

  // Step 2 — verify OTP
  if (p.data.otp !== DEMO_OTP)
    return NextResponse.json({ error: "Incorrect OTP. Hint: demo OTP is 123456." }, { status: 401 });

  type AbhaUser = NonNullable<typeof existingUser>;
  let user: AbhaUser | null = existingUser;
  if (!user) {
    if (existingPatient) {
      const created = await prisma.user.create({
        data: { name: existingPatient.name, email: `abha-${Date.now().toString(36)}@cliniq.local`, passwordHash: "ABHA-OTP-ONLY-NO-PASSWORD", role: "PATIENT", abhaId, abhaVerified: true, patientId: existingPatient.id },
      });
      user = { ...created, patientRecord: null };
      await prisma.patient.update({ where: { id: existingPatient.id }, data: { abhaVerified: true } });
    } else {
      const mr = "MRN-" + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 90 + 10);
      const patient = await prisma.patient.create({
        data: { name: "ABHA Patient " + abhaId.slice(-4), mrn: mr, abhaId, abhaVerified: true, consentGiven: true, language: "en" },
      });
      const created = await prisma.user.create({
        data: { name: patient.name, email: `abha-${Date.now().toString(36)}@cliniq.local`, passwordHash: "ABHA-OTP-ONLY-NO-PASSWORD", role: "PATIENT", abhaId, abhaVerified: true, patientId: patient.id },
      });
      user = { ...created, patientRecord: patient };
    }
  } else if (!user.abhaVerified) {
    const updated = await prisma.user.update({ where: { id: user.id }, data: { abhaVerified: true } });
    user = { ...updated, patientRecord: user.patientRecord };
    if (user.patientId) await prisma.patient.update({ where: { id: user.patientId }, data: { abhaVerified: true } });
  }

  if (!user) return NextResponse.json({ error: "ABHA sign-in failed" }, { status: 500 });
  // Link patient <-> hospital (consent visit). Required so the doctor's
  // hospital-scoped dashboard can see this patient.
  let linkedHospital: { id: string; name: string } | null = null;
  if (hospitalId) {
    const h = await prisma.hospital.findUnique({ where: { id: String(hospitalId) } });
    if (!h) return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    const pid = user.patientId ?? existingPatient?.id;
    if (pid) {
      await ensureVisit(pid, h.id);
      linkedHospital = { id: h.id, name: h.name };
    }
  }
  await audit("ABHA_LOGIN", "User", user.id, user.id, undefined, linkedHospital ? `${abhaId} @ ${linkedHospital.name}` : abhaId);
  const token = await signSession({ id: user.id, role: user.role });
  const res = NextResponse.json({ ok: true, verified: true, next: "/my", needsHospital: !linkedHospital, hospital: linkedHospital, user: { id: user.id, name: user.name, role: user.role } });
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7, secure: process.env.NODE_ENV === "production" });
  return res;
}
