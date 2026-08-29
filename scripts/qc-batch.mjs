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

// How much colour is "colour". A truly grayscale PNG scores 0. Engraving
// scans with warm paper tone score under 2. The red-circled receipt scored
// over 8 on this metric in the panel that shipped it.
const TINT_LIMIT = 2.0;

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
  const px = info.width * info.height;
  for (let i = 0; i < px; i++) {
    const r = data[i * info.channels];
    const g = data[i * info.channels + 1];
    const b = data[i * info.channels + 2];
    spread += Math.abs(r - g) + Math.abs(r - b);
  }
  const tint = spread / px;
  if (tint > TINT_LIMIT) {
    fail(panel.file, `colour detected (tint ${tint.toFixed(1)}, limit ${TINT_LIMIT}) — the strip is black and white`);
  }
}

const n = plan.panels.length;
if (failures === 0) {
  console.log(`qc-batch: all ${n} panels pass the mechanical checks.`);
} else {
  console.log(`qc-batch: ${failures} failure${failures === 1 ? "" : "s"} across ${n} panels.`);
  process.exit(1);
}
