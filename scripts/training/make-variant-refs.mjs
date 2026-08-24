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

for (const cast of CASTS) {
  const tiles = await Promise.all(
    cast.tiles.map(async (tile) => {
      // A tile is either a training-set crop by name, or a direct cut from a
      // repo image ({ src, box }) where the set has no clean example.
      let source;
      if (typeof tile === "string") {
        const file = path.join(cropsDir, `${tile}.png`);
        if (!fs.existsSync(file)) {
          throw new Error(`missing crop ${tile}.png — run \`npm run training:build -- --draft\` first`);
        }
        source = sharp(file);
      } else {
        const [left, top, width, height] = tile.box;
        source = sharp(path.join(repoRoot, tile.src)).extract({ left, top, width, height });
      }
      return source.resize(TILE, TILE, { fit: "contain", background: "#ffffff" }).jpeg({ quality: 92 }).toBuffer();
    })
  );
  const board = await sharp({
    create: { width: TILE * tiles.length, height: TILE, channels: 3, background: "#ffffff" },
  })
    .composite(tiles.map((input, i) => ({ input, left: i * TILE, top: 0 })))
    .jpeg({ quality: 92 })
    .toBuffer();
  fs.writeFileSync(path.join(outDir, `${cast.id}.jpg`), board);
  console.log(`${cast.id}.jpg — ${cast.tiles.map((t) => (typeof t === "string" ? t : t.src)).join(" + ")}`);
}
console.log(`\nwrote ${CASTS.length} board(s) to ${path.relative(repoRoot, outDir)} — inspect them before generating`);
