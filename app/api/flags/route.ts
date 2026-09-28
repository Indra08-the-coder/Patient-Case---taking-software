import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const flags = await prisma.redFlag.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { consultation: { include: { patient: true } } } });
  return NextResponse.json({ flags });
}

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const f = await prisma.redFlag.update({ where: { id: String(id) }, data: { acknowledged: true } });
  return NextResponse.json({ flag: f });
}
