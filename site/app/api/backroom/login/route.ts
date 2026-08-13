import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { activeSecret, BACKROOM_COOKIE, doorToken } from "@/lib/backroom-auth";

// The knock. One owner, one password (ADMIN_PASSWORD env), one signed
// cookie. Wrong answers go back to the door with a dry note; missing env
// configuration goes back with setup instructions.

export const runtime = "nodejs";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against self to keep timing flat, then fail.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  const password = (await request.formData()).get("password");
  const expected = process.env.ADMIN_PASSWORD;
  const secret = await activeSecret();

  const door = new URL("/backroom/login", request.url);
  if (!expected || !secret) {
    door.search = "?setup=1";
    return NextResponse.redirect(door, 303);
  }
  if (typeof password !== "string" || !safeEqual(password, expected)) {
    door.search = "?wrong=1";
    return NextResponse.redirect(door, 303);
  }

  const response = NextResponse.redirect(new URL("/backroom", request.url), 303);
  response.cookies.set(BACKROOM_COOKIE, await doorToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // a month of nights
  });
  return response;
}
