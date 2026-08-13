import { NextResponse, type NextRequest } from "next/server";
import { BACKROOM_COOKIE } from "@/lib/backroom-auth";

// Leave by the back door.

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(BACKROOM_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
