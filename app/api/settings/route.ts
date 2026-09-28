import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, audit } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(80), language: z.string().min(2).max(8),
  hospitalId: z.string().min(1).max(50).optional(),
  hospital: z.object({ hospitalName: z.string().max(120), tagline: z.string().max(200), consentText: z.string().max(2000), escalationNote: z.string().max(2000) }).optional(),
});

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  const data: { name: string; language: string; hospitalId?: string } = { name: p.data.name.trim(), language: p.data.language };
  if (p.data.hospitalId && s.role !== "PATIENT") {
    const h = await prisma.hospital.findUnique({ where: { id: p.data.hospitalId } });
    if (!h) return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    data.hospitalId = h.id;
  }
  await prisma.user.update({ where: { id: s.id }, data });
  if (p.data.hospital) {
    if (s.role !== "ADMIN") return NextResponse.json({ error: "Admins only" }, { status: 403 });
    const ex = await prisma.hospitalSetting.findFirst();
    if (ex) await prisma.hospitalSetting.update({ where: { id: ex.id }, data: p.data.hospital });
    else await prisma.hospitalSetting.create({ data: p.data.hospital });
  }
  await audit("SETTINGS_UPDATE", "Settings", s.id, s.id, undefined, data.hospitalId ?? "");
  return NextResponse.json({ ok: true });
}
