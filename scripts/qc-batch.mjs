// The free half of the inspection: every check a machine can make without
// looking at the drawing like a person. Runs in seconds and costs nothing,
// so it runs FIRST — before any panel is shown to the founder and before the
// vision inspection spends a token.
//
//   node scripts/qc-batch.mjs briefs/<batch-folder>
//
// Exits non-zero if any panel fails, printing one line per fault. The checks
// live here because each one shipped in a real panel:
//
//   COLOUR    red ovals appeared on a TV receipt in a black-and-white strip.
//             A panel is grayscale when every pixel's channels match; we allow
//             a whisper of tint for JPEG-ish artefacts and fail beyond it.
//   COMPLETE  a batch once went to review with panels silently missing — the
//             plan lists what must exist, so existence is checkable.
//   SIZE      a truncated download once produced a half-written PNG.
//
// The judgement calls — snouts, counters, invented bartenders — cannot be
// automated honestly; those belong to the inspect-batch workflow, which reads
// canon/INSPECTION.md as its rulebook.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const batchDir = process.argv[2];
if (!batchDir) {
  console.error("Which batch? node scripts/qc-batch.mjs briefs/<batch-folder>");
  process.exit(2);
}
const dir = path.resolve(repoRoot, batchDir);
const plan = JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8"));

// How much colour is "colour". Two measures, because a first threshold of
// mean-tint 2.0 flagged five panels whose maximum channel spread was 8-15 out
// of 255 with not one strongly-coloured pixel — a faint warm wash the eye
// reads as gray. A real leak is an OBJECT: the red-circled receipt had
// saturated pixels far past the wash. So the gate fails on either a visible
// fraction of strongly-coloured pixels, or a mean tint no wash reaches.
const STRONG_SPREAD = 25;      // per-pixel channel spread that reads as colour
const STRONG_FRACTION = 0.0005; // fraction of such pixels that fails the panel
const TINT_LIMIT = 6.0;        // mean tint no warm wash reaches

let failures = 0;
const fail = (file, what) => {
  failures++;
  console.log(`  FAIL ${file}  ${what}`);
};

for (const panel of plan.panels) {
  const file = path.join(dir, panel.file);

  if (!fs.existsSync(file)) {
    fail(panel.file, "missing — the plan lists it and it is not on disk");
    continue;
  }
  const bytes = fs.statSync(file).size;
  if (bytes < 100_000) {
    fail(panel.file, `suspiciously small (${bytes} bytes) — likely truncated`);
    continue;
  }

  // Mean per-pixel channel spread, on a downscale for speed. |R-G| + |R-B|
  // averaged over the image: zero for grayscale, large for real colour.
  const { data, info } = await sharp(file)
    .resize(256, 256, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let spread = 0;
  let strong = 0;
  const px = info.width * info.height;
  for (let i = 0; i < px; i++) {
    const r = data[i * info.channels];
    const g = data[i * info.channels + 1];
    const b = data[i * info.channels + 2];
    const s = Math.abs(r - g) + Math.abs(r - b);
    spread += s;
    if (s > STRONG_SPREAD) strong++;
  }
  const tint = spread / px;
  const strongFrac = strong / px;
  if (strongFrac > STRONG_FRACTION) {
    fail(panel.file, `coloured object detected (${(strongFrac * 100).toFixed(2)}% strong pixels) — the strip is black and white`);
  } else if (tint > TINT_LIMIT) {
    fail(panel.file, `global colour cast (mean tint ${tint.toFixed(1)}, limit ${TINT_LIMIT})`);
  }
}

const n = plan.panels.length;
if (failures === 0) {
  console.log(`qc-batch: all ${n} panels pass the mechanical checks.`);
} else {
  console.log(`qc-batch: ${failures} failure${failures === 1 ? "" : "s"} across ${n} panels.`);
  process.exit(1);
}
