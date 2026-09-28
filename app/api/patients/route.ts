import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit, ensureVisit, getSession, scopedHospitalId } from "@/lib/auth";
import { patientSchema } from "@/lib/validators";

function mrn() { return "MRN-" + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 90 + 10); }

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role === "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") ?? "").trim();
  const hid = await scopedHospitalId(s);
  if (hid && hid !== "__none__") {
    const searchOr = q
      ? [{ name: { contains: q } }, { mrn: { contains: q } }, { phone: { contains: q } }, { abhaId: { contains: q } }]
      : undefined;
    const patients = await prisma.patient.findMany({
      where: { visits: { some: { hospitalId: hid } }, ...(searchOr ? { OR: searchOr } : {}) },
      orderBy: { updatedAt: "desc" }, take: 100,
      include: { _count: { select: { consultations: true } }, visits: { where: { hospitalId: hid }, include: { hospital: true } } },
    });
    return NextResponse.json({ patients, hospitalId: hid });
  }
  if (s.role === "ADMIN") {
    const patients = await prisma.patient.findMany({
      where: q ? { OR: [{ name: { contains: q } }, { mrn: { contains: q } }, { phone: { contains: q } }, { abhaId: { contains: q } }] } : {},
      orderBy: { updatedAt: "desc" }, take: 100,
      include: { _count: { select: { consultations: true } }, visits: { include: { hospital: true } } },
    });
    return NextResponse.json({ patients, hospitalId: null });
  }
  return NextResponse.json({ patients: [], hospitalId: hid, needsHospital: true });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || (s.role !== "RECEPTIONIST" && s.role !== "NURSE" && s.role !== "ADMIN" && s.role !== "DOCTOR"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const p = patientSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const rawHid = p.data.hospitalId ?? (body as { hospitalId?: string }).hospitalId ?? (s.role === "ADMIN" ? undefined : await scopedHospitalId(s));
  if (s.role !== "ADMIN" && (!rawHid || rawHid === "__none__"))
    return NextResponse.json({ error: "Select your hospital first (dashboard or Settings)." }, { status: 400 });
  const cleanAbha = p.data.abhaId?.trim() || undefined;
  if (cleanAbha) {
    const dup = await prisma.patient.findUnique({ where: { abhaId: cleanAbha } });
    if (dup) return NextResponse.json({ error: "A patient with this ABHA ID already exists." }, { status: 409 });
  }
  const pt = await prisma.patient.create({ data: { name: p.data.name, age: p.data.age ?? undefined, sex: p.data.sex, phone: p.data.phone ?? undefined, location: p.data.location ?? undefined, language: p.data.language, mrn: p.data.mrn?.trim() || mrn(), allergies: p.data.allergies, emergencyName: p.data.emergencyName ?? undefined, emergencyPhone: p.data.emergencyPhone ?? undefined, consentGiven: p.data.consentGiven, abhaId: cleanAbha } });
  if (rawHid && rawHid !== "__none__") await ensureVisit(pt.id, rawHid);
  await audit("PATIENT_CREATE", "Patient", pt.id, s.id, undefined, rawHid ?? "");
  return NextResponse.json({ patient: pt }, { status: 201 });
}
