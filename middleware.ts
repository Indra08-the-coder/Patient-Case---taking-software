import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-change-me-please-1234567890");
const PROTECTED = ["/dashboard", "/patients", "/consultations", "/settings", "/admin", "/my"];
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!PROTECTED.some((p) => pathname.startsWith(p))) return NextResponse.next();
  const token = req.cookies.get("cliniq_session")?.value;
  if (!token) return NextResponse.redirect(new URL("/login?next=" + encodeURIComponent(pathname), req.url));
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    // Patients live in /my; staff live in /dashboard + clinical areas
    if (payload.role === "PATIENT" && (pathname.startsWith("/dashboard") || pathname.startsWith("/patients") || pathname.startsWith("/consultations") || pathname.startsWith("/admin"))) {
      return NextResponse.redirect(new URL("/my", req.url));
    }
    if (payload.role !== "PATIENT" && pathname.startsWith("/my")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }
  catch { return NextResponse.redirect(new URL("/login", req.url)); }
}
export const config = { matcher: ["/dashboard/:path*", "/patients/:path*", "/consultations/:path*", "/settings/:path*", "/admin/:path*", "/my/:path*"] };

