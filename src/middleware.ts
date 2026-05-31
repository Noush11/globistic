import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE = "globistic_token";
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-insecure-jwt-secret");

// Edge middleware: gate /account and /admin. Detailed role checks also happen
// in the server layouts/route handlers; this is defense-in-depth + fast redirect.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE)?.value;

  let payload: { role?: string } | null = null;
  if (token) {
    try {
      const { payload: p } = await jwtVerify(token, secret);
      payload = p as any;
    } catch {
      payload = null;
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!payload) return NextResponse.redirect(new URL("/login", req.url));
    if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/account")) {
    if (!payload) return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"]
};
