import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit, signSession, verifyPassword, COOKIE } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const p = loginSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email: p.data.email.toLowerCase().trim() } });
  if (!user || !(await verifyPassword(p.data.password, user.passwordHash)))
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  await audit("USER_LOGIN", "User", user.id, user.id);
  const token = await signSession({ id: user.id, role: user.role });
  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7, secure: process.env.NODE_ENV === "production" });
  return res;
}
