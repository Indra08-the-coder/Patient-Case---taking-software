import bcrypt from "bcryptjs";
import * as jose from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-change-me-please-1234567890");
export const COOKIE = "cliniq_session";
export async function hashPassword(p: string) { return bcrypt.hash(p, 10); }
export async function verifyPassword(p: string, h: string) { return bcrypt.compare(p, h); }
export async function signSession(payload: { id: string; role: string }) {
  return await new jose.SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret);
}
export async function getSession() {
  try {
    const c = await cookies(); const token = c.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jose.jwtVerify(token, secret);
    const user = await prisma.user.findUnique({ where: { id: String(payload.id) }, include: { patientRecord: true, hospital: true } });
    if (!user) return null;
    const { passwordHash: _h, ...safe } = user;
    return safe;
  } catch { return null; }
}
// Hospital scoping: staff see only patients/consultations linked to their hospital.
// Admins bypass scoping. Patients see only their own record (unchanged).
export async function scopedHospitalId(user: { role: string; hospitalId?: string | null }) {
  if (user.role === "ADMIN") return null; // null = all hospitals
  return user.hospitalId ?? "__none__";
}
export async function patientInHospital(patientId: string, hospitalId: string | null) {
  if (!hospitalId || hospitalId === "__none__") return false;
  const v = await prisma.patientHospitalVisit.findUnique({ where: { patientId_hospitalId: { patientId, hospitalId } } });
  return !!v;
}
export async function ensureVisit(patientId: string, hospitalId: string) {
  await prisma.patientHospitalVisit.upsert({
    where: { patientId_hospitalId: { patientId, hospitalId } },
    update: {},
    create: { patientId, hospitalId, consent: true },
  });
}
export async function requireRole(roles: string[]) {
  const s = await getSession();
  if (!s) return null;
  if (!roles.includes(s.role)) return null;
  return s;
}
export async function audit(action: string, entity: string, entityId?: string, actorId?: string, consultationId?: string, metadata = "") {
  try { await prisma.auditLog.create({ data: { action, entity, entityId, actorId, consultationId, metadata } }); } catch {}
}
export const DISCLAIMER = "This tool supports documentation and clinical workflow. It does not diagnose, prescribe, or replace professional medical judgment.";
