// Auth for the Back Room: one owner, one password, one signed cookie.
// Web Crypto only, so the same code runs in edge middleware and node
// route handlers. The cookie value is HMAC-SHA256(AUTH_SECRET, DOOR_PHRASE)
// — no session store, nothing to expire server-side; rotating AUTH_SECRET
// logs every device out.

export const BACKROOM_COOKIE = "sd_backroom";
const DOOR_PHRASE = "backroom-door-v1";

/**
 * The cookie-signing secret. AUTH_SECRET when set; otherwise derived from
 * ADMIN_PASSWORD. For a single-owner site the derivation adds no attack
 * surface — anyone who knows the password can simply log in — and it keeps
 * setup to two env vars. Set AUTH_SECRET explicitly to rotate sessions
 * independently of the password.
 */
export async function activeSecret(): Promise<string | null> {
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
  const secret = await activeSecret();
  if (!secret || !cookieValue) return false;
  return tokensEqual(cookieValue, await doorToken(secret));
}

// ---------------------------------------------------------------- trigger

// A second, single-purpose token derived from the same secret with a
// DIFFERENT phrase. It authorizes only the backroom action routes that accept
// it as a ?t= query parameter — a URL-carried key, same pattern as the MCP
// endpoint's ?key=. Deriving it separately means a URL that leaks into a
// request log never exposes the session cookie, and rotating the password (or
// AUTH_SECRET) rotates both.
const TRIGGER_PHRASE = "backroom-trigger-v1";

export async function triggerToken(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(TRIGGER_PHRASE));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** True when the ?t= value is the current trigger token. */
export async function isTriggerOpen(value: string | null | undefined): Promise<boolean> {
  const secret = await activeSecret();
  if (!secret || !value) return false;
  return tokensEqual(value, await triggerToken(secret));
}
