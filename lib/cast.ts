// The cast, and the one place its keys are defined.
//
// THE RENAME. On 2026-08-31 the founder renamed Mango to Barclay — same
// golden retriever, new name. Every batch, rating and plan written BEFORE
// that day keys him "mango", and those files are history: they are never
// rewritten. Instead, every reader folds the legacy key into the new one
// here, and every writer emits the new key. The old key converges out of
// live verdicts the next time the founder re-scores a panel; the history[]
// audit trail keeps it forever, which is correct.
//
// scripts/lib/cast.mjs is this file's twin for the plain-node scripts that
// cannot import TypeScript. Change one, change both.

export type CastName = "drew" | "barclay" | "abby";

export const CAST_KEYS: CastName[] = ["drew", "barclay", "abby"];

export const CAST_NAMES: Record<CastName, string> = {
  drew: "Drew",
  barclay: "Barclay",
  abby: "Abby",
};

/** Pre-rename data keys, folded to the character they name today. */
const LEGACY: Record<string, CastName> = { mango: "barclay" };

/** The canonical cast key for any raw string, or null for a stranger. */
export function canonCastKey(raw: unknown): CastName | null {
  const k = String(raw ?? "").toLowerCase().trim();
  const mapped = (LEGACY[k] ?? k) as CastName;
  return CAST_KEYS.includes(mapped) ? mapped : null;
}

/** Fold a characters score map (possibly legacy-keyed, possibly junk) into a
 *  clean canonical map. When a file somehow carries both keys for the same
 *  character, the canonical key wins. */
export function foldCastScores(raw: unknown): Partial<Record<CastName, number>> {
  const out: Partial<Record<CastName, number>> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const key = canonCastKey(k);
    if (!key) continue;
    const n = Math.round(Number(v));
    if (!Number.isFinite(n) || n < 1 || n > 10) continue;
    if (k.toLowerCase() in LEGACY && out[key] !== undefined) continue;
    out[key] = n;
  }
  return out;
}

/** Fold a characters LIST (plan.json arrays may say "mango") into canonical
 *  keys, deduped, order preserved. */
export function foldCastList(raw: unknown): CastName[] {
  const seen = new Set<CastName>();
  for (const item of Array.isArray(raw) ? raw : []) {
    const key = canonCastKey(item);
    if (key) seen.add(key);
  }
  return [...seen];
}
