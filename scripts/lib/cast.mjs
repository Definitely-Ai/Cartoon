// Twin of lib/cast.ts for plain-node scripts (read-ratings and friends),
// which cannot import TypeScript. Change one, change both — if the report
// ever shows Barclay with n=0 over a corpus that has scored panels, the fold
// is missing or drifted on one side.

export const CAST_KEYS = ["drew", "barclay", "abby"];

export const CAST_NAMES = { drew: "Drew", barclay: "Barclay", abby: "Abby" };

const LEGACY = { mango: "barclay" }; // pre-rename data (2026-08-31)

export function canonCastKey(raw) {
  const k = String(raw ?? "").toLowerCase().trim();
  const mapped = LEGACY[k] ?? k;
  return CAST_KEYS.includes(mapped) ? mapped : null;
}

export function foldCastScores(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw)) {
    const key = canonCastKey(k);
    if (!key) continue;
    const n = Math.round(Number(v));
    if (!Number.isFinite(n) || n < 1 || n > 10) continue;
    if (k.toLowerCase() in LEGACY && out[key] !== undefined) continue;
    out[key] = n;
  }
  return out;
}

export function foldCastList(raw) {
  const seen = new Set();
  for (const item of Array.isArray(raw) ? raw : []) {
    const key = canonCastKey(item);
    if (key) seen.add(key);
  }
  return [...seen];
}
