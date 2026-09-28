import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit, getSession } from "@/lib/auth";
import { documentSchema } from "@/lib/validators";

async function resolvePid(user: { role: string; patientId?: string | null; abhaId?: string | null }, pid?: string) {
  if (user.role === "PATIENT") {
    if (user.patientId) return user.patientId;
    const p = await prisma.patient.findUnique({ where: { abhaId: user.abhaId ?? "__none__" } });
    return p?.id ?? null;
  }
  return pid ?? null;
}

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pid = await resolvePid(s, new URL(req.url).searchParams.get("patientId") ?? undefined);
  if (!pid) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const docs = await prisma.patientDocument.findMany({ where: { patientId: pid }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ docs: docs.map((d) => ({ ...d, fileData: d.fileData ? "[stored]" : "" })) });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const p = documentSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const pid = await resolvePid(s, p.data.patientId);
  if (!pid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const doc = await prisma.patientDocument.create({ data: { ...p.data, patientId: pid, uploadedBy: s.id } });
  await audit("DOCUMENT_UPLOAD", "Patient", pid, s.id, undefined, p.data.title);
  return NextResponse.json({ doc }, { status: 201 });
}

export async function DELETE(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.patientDocument.delete({ where: { id } });
  await audit("DOCUMENT_DELETE", "PatientDocument", id, s.id);
  return NextResponse.json({ ok: true });
}
