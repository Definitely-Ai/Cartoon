// Put two rolls side by side under labels, and print what actually differs.
//
//   node scripts/compare.mjs <fileA> <labelA> <fileB> <labelB> [out.png]
//
// Paths are relative to scripts/training/smoke/ unless they contain a slash.
// Written because a comparison nobody can label is not a comparison: two
// panels were drawn tonight to weigh medium against high and neither could be
// attributed afterwards.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const smokeDir = path.join(repoRoot, "scripts", "training", "smoke");

const [fileA, labelA, fileB, labelB, out = "comparison.png"] = process.argv.slice(2);
if (!fileA || !labelA || !fileB || !labelB) {
  console.error("usage: node scripts/compare.mjs <fileA> <labelA> <fileB> <labelB> [out.png]");
  process.exit(1);
}

const resolve = (file) => {
  const name = file.endsWith(".png") ? file : `${file}.png`;
  return name.includes("/") ? path.resolve(repoRoot, name) : path.join(smokeDir, name);
};

const BAND = 74;
const GAP = 20;

const xml = (value) =>
  String(value).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

function labelStrip(width, text) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${BAND}">` +
      `<rect width="${width}" height="${BAND}" fill="#f8f5ee"/>` +
      `<text x="${width / 2}" y="${BAND / 2 + 13}" text-anchor="middle" ` +
      `font-family="Georgia, 'Times New Roman', serif" font-size="34" fill="#171717">${xml(text)}</text>` +
      `</svg>`
  );
}

/** Ink statistics, so the difference is reported rather than asserted. */
async function stats(file) {
  const { data, info } = await sharp(file).grayscale().raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  let white = 0;
  let black = 0;
  for (const v of data) {
    sum += v;
    if (v > 200) white++;
    if (v < 60) black++;
  }
  const n = data.length;
  // Mean absolute gradient: how much fine linework the drawing carries.
  let g = 0;
  let gn = 0;
  for (let y = 1; y < info.height - 1; y++) {
    for (let x = 1; x < info.width - 1; x++) {
      const i = y * info.width + x;
      g += Math.abs(data[i] - data[i + 1]) + Math.abs(data[i] - data[i + info.width]);
      gn += 2;
    }
  }
  return {
    size: `${info.width}x${info.height}`,
    meanGrey: (sum / n).toFixed(0),
    paperWhite: `${((white / n) * 100).toFixed(1)}%`,
    solidBlack: `${((black / n) * 100).toFixed(1)}%`,
    detail: (g / gn).toFixed(2),
  };
}

const a = resolve(fileA);
const b = resolve(fileB);
for (const f of [a, b]) {
  if (!fs.existsSync(f)) {
    console.error(`no such file: ${f}`);
    process.exit(1);
  }
}

const HEIGHT = 1280;
const [imgA, imgB] = await Promise.all(
  [a, b].map((f) => sharp(f).resize({ height: HEIGHT }).png().toBuffer())
);
const [metaA, metaB] = await Promise.all([sharp(imgA).metadata(), sharp(imgB).metadata()]);

const width = metaA.width + GAP + metaB.width;
await sharp({ create: { width, height: HEIGHT + BAND, channels: 3, background: "#ffffff" } })
  .composite([
    { input: await sharp(labelStrip(metaA.width, labelA)).png().toBuffer(), left: 0, top: 0 },
    { input: await sharp(labelStrip(metaB.width, labelB)).png().toBuffer(), left: metaA.width + GAP, top: 0 },
    { input: imgA, left: 0, top: BAND },
    { input: imgB, left: metaA.width + GAP, top: BAND },
  ])
  .png()
  .toFile(path.resolve(repoRoot, out));

const [sa, sb] = await Promise.all([stats(a), stats(b)]);
const rows = ["size", "meanGrey", "paperWhite", "solidBlack", "detail"];
console.log(`\n${"".padEnd(12)}${labelA.padEnd(18)}${labelB}`);
for (const key of rows) console.log(`${key.padEnd(12)}${String(sa[key]).padEnd(18)}${sb[key]}`);
console.log(`\nwrote ${out}`);
