import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public (unauthenticated) hospital directory for registration + ABHA login.
export async function GET() {
  const hospitals = await prisma.hospital.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ hospitals });
}
