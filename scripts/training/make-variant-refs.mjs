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

// Height of the enlarged head study beside each body.
const HEAD = 230;

// A crop, grayscaled and normalised so its paper reads as true white. Round
// two taught the normalise: tiles cut from different sheets carried different
// paper tones (grey backdrop, cream cartoon stock), and those tonal
// rectangles both invited dark full-tone rendering and read as separate
// panels. Normalising stretches each crop so its brightest paper is white and
// its ink is black — every piece lands on the same sheet.
async function piece(spec, height, whiten) {
  let img = loadTile(spec).grayscale().normalise();
  // Normalise pins the brightest pixel, which on Abby's sheets is her white
  // fur — the grey sheet paper survives it. The linear lift maps that paper
  // (~200) to near-white while barely moving the ink.
  if (whiten) img = img.linear(1.5, -60);
  const buf = await img.resize({ height }).png().toBuffer();
  const { width } = await sharp(buf).metadata();
  return { buf, width };
}

// One tile per CHARACTER, laid out like a hand model sheet: the full body at
// natural width, with the same character's head study enlarged BESIDE the
// head, frameless, overlapping onto shared white paper. Round one taught the
// head study (a lone 720px body tile leaves the face a few dozen pixels and
// Drew's head drifted dodo-ward); round two taught the framelessness (a
// bordered inset box got copied into the golf scene as a drawn picture).
async function characterTile(spec) {
  const body = await piece(spec.body, TILE, spec.whitenBody);
  if (!spec.head) return body;
  const head = await piece(spec.head, HEAD, spec.whitenHead);
  const overlap = 60;
  const width = body.width + head.width - overlap;
  const headFirst = (spec.headCorner ?? "right") === "left";
  const bodyLeft = headFirst ? head.width - overlap : 0;
  const headLeft = headFirst ? 0 : body.width - overlap;
  const buf = await sharp({
    create: { width, height: TILE, channels: 3, background: "#ffffff" },
  })
    .composite([
      { input: head.buf, left: headLeft, top: 0 },
      { input: body.buf, left: bodyLeft, top: 0 },
    ])
    .png()
    .toBuffer();
  return { buf, width };
}

const GAP = 40;

for (const cast of CASTS) {
  const tiles = [];
  for (const spec of cast.tiles) tiles.push(await characterTile(spec));
  const width = tiles.reduce((w, t) => w + t.width, 0) + GAP * (tiles.length - 1);
  let left = 0;
  const layers = tiles.map((t) => {
    const layer = { input: t.buf, left, top: 0 };
    left += t.width + GAP;
    return layer;
  });
  const board = await sharp({
    create: { width, height: TILE, channels: 3, background: "#ffffff" },
  })
    .composite(layers)
    .grayscale()
    .jpeg({ quality: 92 })
    .toBuffer();
  fs.writeFileSync(path.join(outDir, `${cast.id}.jpg`), board);
  console.log(`${cast.id}.jpg — ${cast.tiles.map((t) => (typeof t.body === "string" ? t.body : t.body.src)).join(" + ")}`);
}
console.log(`\nwrote ${CASTS.length} board(s) to ${path.relative(repoRoot, outDir)} — inspect them before generating`);
