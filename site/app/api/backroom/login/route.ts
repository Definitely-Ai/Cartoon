import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { activeSecret, BACKROOM_COOKIE, doorToken } from "@/lib/backroom-auth";

// The front desk. One owner, one username + password (ADMIN_USERNAME /
// ADMIN_PASSWORD env), one signed cookie. "Keep me signed in" decides
// whether the cookie lasts a year or ends when the browser closes.

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
  const form = await request.formData();
  const username = form.get("username");
  const password = form.get("password");
  const remember = form.get("remember") === "on";

  const expectedPassword = (process.env.ADMIN_PASSWORD ?? "").trim();
  const expectedUsername = (process.env.ADMIN_USERNAME ?? "").trim();
  const secret = await activeSecret();

  const door = new URL("/login", request.url);
  if (!expectedPassword || !secret) {
    door.search = "?setup=1";
    return NextResponse.redirect(door, 303);
  }

  // Phone keyboards add capital letters and stray spaces — forgive both
  // on the username, and stray spaces on the password.
  const passwordOk = typeof password === "string" && safeEqual(password.trim(), expectedPassword);
  const usernameOk =
    expectedUsername === "" || // until ADMIN_USERNAME is set, the password alone decides
    (typeof username === "string" &&
      safeEqual(username.trim().toLowerCase(), expectedUsername.toLowerCase()));

  if (!passwordOk || !usernameOk) {
    door.search = "?wrong=1";
    return NextResponse.redirect(door, 303);
  }

  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(BACKROOM_COOKIE, await doorToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Remembered: a year of nights on this device. Not remembered: the
    // visit ends with the browser.
    ...(remember ? { maxAge: 60 * 60 * 24 * 365 } : {}),
  });
  return response;
}
