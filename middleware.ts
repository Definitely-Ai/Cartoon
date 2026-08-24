import { NextResponse, type NextRequest } from "next/server";
// Relative import on purpose: Vercel's Edge output transform has rejected the
// "@/" alias form of this exact import at deploy time ("referencing
// unsupported modules") even though next build bundles it cleanly. The
// middleware is the site's login wall — keep its import graph so plain that
// no packaging step can misread it.
import { BACKROOM_COOKIE, isDoorOpen } from "./lib/backroom-auth";

// The lock on the whole studio. The entire site is private — one owner,
// one login. The only ways in without the cookie: the door itself
// (/login), the login/logout endpoints, and the MCP endpoint (which
// carries its own secret). Next's static assets are excluded so the door
// page can dress itself.

export const config = {
  matcher: [
    "/((?!login|api/backroom/login|api/backroom/logout|api/mcp|_next/static|_next/image|icon.svg|favicon.ico|og.png).*)",
  ],
  // Node runtime, deliberately. Vercel's Routing Middleware pipeline began
  // wrapping edge middleware in a namespace module that references __dirname —
  // fatal on the Edge runtime, where this crashed production with
  // MIDDLEWARE_INVOCATION_FAILED. This middleware is pure Web Crypto and runs
  // identically on Node (crypto.subtle is global there), so nothing changes
  // except which pipeline packages it. Stable in Next 15.5.
  runtime: "nodejs",
};

export async function middleware(request: NextRequest) {
  const open = await isDoorOpen(request.cookies.get(BACKROOM_COOKIE)?.value);
  if (open) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = process.env.ADMIN_PASSWORD ? "" : "?setup=1";
  return NextResponse.redirect(url);
}
