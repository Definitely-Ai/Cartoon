// Generates placeholder cartoon.png files for every folder in /cartoons
// that doesn't have one yet (pass --force to regenerate all of them).
//
// Each placeholder is a black-and-white SVG rasterized to PNG with sharp:
// a clean panel with a 6px black border on white, "ARTWORK PENDING" small
// and centered, and the edition number in the lower-right corner.
//
// font-family="monospace" is deliberate: sharp rasterizes with system
// fonts, and a named typewriter face would silently fall back to
// who-knows-what. The generic family is the only reliable choice.
//
// Aspect ratio alternates by edition parity — odd editions are 4:5
// portrait, even editions are square — so the site's layouts prove they
// handle both shapes.
//
// Run once from /site: `npm run placeholders` (or node scripts/generate-placeholders.mjs)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const cartoonsDir = path.resolve(here, "..", "..", "cartoons");
const force = process.argv.includes("--force");

const folders = fs
  .readdirSync(cartoonsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== "_TEMPLATE")
  .map((d) => d.name)
  .sort();

function panelSvg({ width, height, edition }) {
  const cx = width / 2;
  const cy = height / 2;
  // 6px border drawn as a stroked rect: stroke centered on the path, so a
  // 6px stroke inset by 3px puts the outer edge flush with the canvas.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>
  <rect x="3" y="3" width="${width - 6}" height="${height - 6}" fill="none" stroke="#000000" stroke-width="6"/>
  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle"
        font-family="monospace" font-size="${Math.round(width / 30)}" letter-spacing="6" fill="#000000">ARTWORK PENDING</text>
  <text x="${width - 40}" y="${height - 36}" text-anchor="end"
        font-family="monospace" font-size="${Math.round(width / 44)}" fill="#000000">No. ${edition}</text>
</svg>`;
}

let generated = 0;
for (const folder of folders) {
  const dir = path.join(cartoonsDir, folder);
  const out = path.join(dir, "cartoon.png");
  if (fs.existsSync(out) && !force) continue;

  const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
  const portrait = meta.edition % 2 === 1;
  const width = portrait ? 1200 : 1400;
  const height = portrait ? 1500 : 1400; // 4:5 portrait or square, long side >= 1200
  const svg = panelSvg({ width, height, edition: meta.edition });
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(`generated ${folder}/cartoon.png (${width}x${height})`);
  generated++;
}

// One static OG image for the whole site (a per-cartoon @vercel/og pipeline
// was judged not worth the moving parts — see README "Current status").
const ogOut = path.resolve(here, "..", "public", "og.png");
if (!fs.existsSync(ogOut) || force) {
  // BRAND: replace when final — company name baked into the OG card.
  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect x="24" y="24" width="1152" height="582" fill="none" stroke="#000000" stroke-width="6"/>
  <line x1="120" y1="150" x2="1080" y2="150" stroke="#000000" stroke-width="3"/>
  <line x1="120" y1="158" x2="1080" y2="158" stroke="#000000" stroke-width="1"/>
  <text x="600" y="330" text-anchor="middle" font-family="serif" font-size="110" font-weight="bold" letter-spacing="4" fill="#000000">FLAMINGO &amp; DOG</text>
  <text x="600" y="430" text-anchor="middle" font-family="monospace" font-size="30" letter-spacing="4" fill="#000000">SINGLE-PANEL BUSINESS CARTOONS</text>
  <text x="600" y="478" text-anchor="middle" font-family="monospace" font-size="30" letter-spacing="4" fill="#000000">STRICTLY BLACK AND WHITE</text>
  <line x1="120" y1="520" x2="1080" y2="520" stroke="#000000" stroke-width="1"/>
  <line x1="120" y1="528" x2="1080" y2="528" stroke="#000000" stroke-width="3"/>
</svg>`;
  fs.mkdirSync(path.dirname(ogOut), { recursive: true });
  await sharp(Buffer.from(og)).png().toFile(ogOut);
  console.log("generated public/og.png");
}

console.log(generated === 0 ? "all cartoon.png files already present" : `done: ${generated} placeholder(s)`);
