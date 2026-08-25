// Builds the conditioning boards the setting variants are generated from.
//
// Kontext copies what it is shown, so what it is shown is the whole game.
// Each cast in the variant plan gets one board tiled from the cleanest crops
// of the repaired training set — a face beside a body for a single character,
// one canonical tile per character for a pair or the trio. The boards are
// committed to the repo (scripts/training/variant-refs/) so the production
// route can fetch them without ever seeing the gitignored training-set dir,
// and so the exact pixels behind every paid generation are in history.
//
//   node scripts/training/build-training-set.mjs --draft   # crops first
//   node scripts/training/make-variant-refs.mjs
//
// Look at every board before spending: a flaw here repeats into every image
// generated from it.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { CASTS, REF_DIR } from "./lib/variant-plan.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const cropsDir = path.join(here, "training-set");
const outDir = path.join(repoRoot, REF_DIR);

// Tall enough that a full-body tile keeps readable detail; Kontext's input
// budget comfortably takes a two- or three-tile board at this size.
const TILE = 720;

fs.mkdirSync(outDir, { recursive: true });

function loadTile(tile) {
  // A tile source is either a training-set crop by name, or a direct cut from
  // a repo image ({ src, box }) where the set has no clean example.
  if (typeof tile === "string") {
    const file = path.join(cropsDir, `${tile}.png`);
    if (!fs.existsSync(file)) {
      throw new Error(`missing crop ${tile}.png — run \`npm run training:build -- --draft\` first`);
    }
    return sharp(file);
  }
  const [left, top, width, height] = tile.box;
  return sharp(path.join(repoRoot, tile.src)).extract({ left, top, width, height });
}

// One tile per CHARACTER: the full body, with the head close-up inset in the
// top corner at readable size. Round one taught this — a lone 720px full-body
// tile leaves the face a few dozen pixels tall, and Drew's head drifted
// dodo-ward in every panel where his tile carried no close-up.
async function characterTile(spec) {
  const body = await loadTile(spec.body)
    .resize(TILE, TILE, { fit: "contain", background: "#ffffff" })
    .toBuffer();
  if (!spec.head) return sharp(body).jpeg({ quality: 92 }).toBuffer();
  const inset = Math.round(TILE * 0.34);
  const head = await loadTile(spec.head)
    .resize(inset - 8, inset - 8, { fit: "contain", background: "#ffffff" })
    .toBuffer();
  const border = Buffer.from(
    `<svg width="${inset}" height="${inset}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="1" y="1" width="${inset - 2}" height="${inset - 2}" fill="white" stroke="#555" stroke-width="2"/></svg>`
  );
  const corner = spec.headCorner ?? "right";
  const left = corner === "left" ? 6 : TILE - inset - 6;
  return sharp(body)
    .composite([
      { input: border, left, top: 6 },
      { input: head, left: left + 4, top: 10 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();
}

for (const cast of CASTS) {
  const tiles = await Promise.all(cast.tiles.map((spec) => characterTile(spec)));
  const board = await sharp({
    create: { width: TILE * tiles.length, height: TILE, channels: 3, background: "#ffffff" },
  })
    .composite(tiles.map((input, i) => ({ input, left: i * TILE, top: 0 })))
    .jpeg({ quality: 92 })
    .toBuffer();
  fs.writeFileSync(path.join(outDir, `${cast.id}.jpg`), board);
  console.log(`${cast.id}.jpg — ${cast.tiles.map((t) => (typeof t.body === "string" ? t.body : t.body.src)).join(" + ")}`);
}
console.log(`\nwrote ${CASTS.length} board(s) to ${path.relative(repoRoot, outDir)} — inspect them before generating`);
