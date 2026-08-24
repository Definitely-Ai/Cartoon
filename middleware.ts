// The lock on the whole studio. The entire site is private — one owner,
// one login. The only ways in without the cookie: the door itself
// (/login), the login/logout endpoints, and the MCP endpoint (which
// carries its own secret). Next's static assets are excluded so the door
// page can dress itself.
//
// DELIBERATELY DEPENDENCY-FREE. Vercel's Routing Middleware pipeline
// transpiles this file from source and executes it as a standalone Node ES
// module — outside Next's bundler, where "@/" aliases don't resolve, bare
// imports like "next/server" fail ESM resolution against the pruned
// node_modules, and relative imports would need emitted files that aren't
// there. Three production outages taught that lesson. So this file uses only
// web-standard Request/Response and inlines the cookie check; the same
// primitives run identically under `next start`.
//
// The auth logic here mirrors lib/backroom-auth.ts (which the login/logout
// routes still use). If one changes, change both — the constants and the
// HMAC construction must stay identical or every session logs out.

export const config = {
  matcher: [
    "/((?!login|api/backroom/login|api/backroom/logout|api/mcp|_next/static|_next/image|icon.svg|favicon.ico|og.png).*)",
  ],
  // Node runtime: Vercel's middleware wrapper is CommonJS-flavoured and
  // references Node globals, which crashed the default Edge runtime.
  runtime: "nodejs",
};

const BACKROOM_COOKIE = "sd_backroom";
const DOOR_PHRASE = "backroom-door-v1";

// AUTH_SECRET when set; otherwise derived from ADMIN_PASSWORD — same
// derivation as lib/backroom-auth.ts, byte for byte.
async function activeSecret(): Promise<string | null> {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`sd-derived-secret:${password}`)
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function doorToken(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(DOOR_PHRASE));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-time-ish comparison (both strings are hex of fixed length).
function tokensEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function cookieValue(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return undefined;
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const secret = await activeSecret();
  const cookie = cookieValue(request, BACKROOM_COOKIE);
  if (secret && cookie && tokensEqual(cookie, await doorToken(secret))) {
    // Door open — fall through to the app. Returning nothing means
    // "continue" under both Next's middleware contract and Vercel's.
    return undefined;
  }

  const url = new URL(request.url);
  url.pathname = "/login";
  url.search = process.env.ADMIN_PASSWORD ? "" : "?setup=1";
  return new Response(null, { status: 307, headers: { Location: url.toString() } });
}
