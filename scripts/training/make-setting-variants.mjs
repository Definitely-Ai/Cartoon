// Previews the setting-variant plan — the generated half of the training set.
//
// The images themselves are generated IN PRODUCTION by the login-gated route
// /api/backroom/variants, because that is where the Replicate token lives;
// each finished image is committed to scripts/training/setting-variants/
// beside its caption, and build-training-set.mjs folds them in from there.
// This script is the ground-truth preview of what that route will spend money
// on: every run id, the exact Kontext instruction, and the exact caption.
//
//   node scripts/training/make-setting-variants.mjs           # the full plan
//   node scripts/training/make-setting-variants.mjs --only barclay-boat
//
// The plan itself lives in lib/variant-plan.mjs, beside the reference-board
// recipe (make-variant-refs.mjs) and the place patterns the balance check
// counts with — one file, three consumers, no drift.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MAX_VARIANTS, VARIANT_DIR, caption, instruction, runs } from "./lib/variant-plan.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;

const existing = new Set(
  fs.existsSync(path.join(repoRoot, VARIANT_DIR))
    ? fs.readdirSync(path.join(repoRoot, VARIANT_DIR)).filter((f) => f.endsWith(".png")).map((f) => f.replace(/\.png$/, ""))
    : []
);

let pending = 0;
for (const run of runs()) {
  if (only && run.id !== only) continue;
  const done = existing.has(run.id);
  if (!done) pending++;
  console.log(`${done ? "have " : "need "} ${run.id}`);
  if (!done || only) {
    console.log(`  prompt:  ${instruction(run)}`);
    console.log(`  caption: ${caption(run)}\n`);
  }
}
console.log(
  `${pending} to generate (cap ${MAX_VARIANTS}) — sign in to the studio and open /api/backroom/variants?dry=1, ` +
    "then without dry=1 in waves. Estimated cost ~$0.06 per image."
);
