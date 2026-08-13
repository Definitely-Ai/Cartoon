// Auth for the Back Room: one owner, one password, one signed cookie.
// Web Crypto only, so the same code runs in edge middleware and node
// route handlers. The cookie value is HMAC-SHA256(AUTH_SECRET, DOOR_PHRASE)
// — no session store, nothing to expire server-side; rotating AUTH_SECRET
// logs every device out.

export const BACKROOM_COOKIE = "sd_backroom";
const DOOR_PHRASE = "backroom-door-v1";

export async function doorToken(secret: string): Promise<string> {
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

/** Constant-time-ish comparison (both strings are hex of fixed length). */
export function tokensEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isDoorOpen(cookieValue: string | undefined): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !cookieValue) return false;
  return tokensEqual(cookieValue, await doorToken(secret));
}
