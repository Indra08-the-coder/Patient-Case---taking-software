import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit, hashPassword, signSession, COOKIE } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const p = registerSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const email = p.data.email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Account already exists — please sign in." }, { status: 409 });
  let hospitalId: string | undefined;
  if (p.data.hospitalId) {
    const h = await prisma.hospital.findUnique({ where: { id: p.data.hospitalId } });
    if (!h) return NextResponse.json({ error: "Selected hospital not found." }, { status: 400 });
    hospitalId = h.id;
  } else if (p.data.role !== "ADMIN" && p.data.role !== "PATIENT") {
    const first = await prisma.hospital.findFirst({ orderBy: { name: "asc" } });
    hospitalId = first?.id;
  }
  const user = await prisma.user.create({ data: { name: p.data.name.trim(), email, passwordHash: await hashPassword(p.data.password), role: p.data.role, hospitalId } });
  await audit("USER_REGISTER", "User", user.id, user.id, undefined, `${user.role}@${hospitalId ?? "all"}`);
  const token = await signSession({ id: user.id, role: user.role });
  const res = NextResponse.json({ ok: true, next: user.role === "PATIENT" ? "/my" : "/dashboard", user: { id: user.id, name: user.name, role: user.role } });
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7, secure: process.env.NODE_ENV === "production" });
  return res;
}
