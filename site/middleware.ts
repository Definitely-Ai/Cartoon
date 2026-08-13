import { NextResponse, type NextRequest } from "next/server";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";

// The lock on the Back Room door. Everything under /backroom (the staff
// pages) and /backroom-assets (the option artwork copied by prebuild) is
// gated behind the signed cookie; the login page itself is the one
// exception. Public routes are never matched, so the public side stays
// fully static and middleware-free.

export const config = {
  matcher: ["/backroom", "/backroom/:path*", "/backroom-assets/:path*"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/backroom/login") return NextResponse.next();

  const open = await isDoorOpen(request.cookies.get(BACKROOM_COOKIE)?.value);
  if (open) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/backroom/login";
  url.search = process.env.AUTH_SECRET && process.env.ADMIN_PASSWORD ? "" : "?setup=1";
  return NextResponse.redirect(url);
}
