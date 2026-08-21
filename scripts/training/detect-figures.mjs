// Figure detection for the LoRA training set.
//
// The locked model sheets are grids: several drawn figures on light paper with
// a printed label under each. A LoRA must never see the grid itself — training
// on whole sheets teaches the model to draw sheets — so every figure has to be
// cropped out on its own. Finding those crop boxes by eye is slow and
// imprecise, so this script proposes them.
//
// The sheets are line art: thresholding gives hollow outlines, not solid
// shapes, so the figures are solidified first by flooding the paper inward
// from the border — whatever the paper cannot reach is a drawing. Solid
// shapes survive the opening pass that dissolves the hairline rules and ground
// shadows chaining a whole row into one blob.
//
// Output is a proposal, not the truth. It writes boxes.json plus a numbered
// annotated preview per sheet so a human (or a vision model) can look at the
// numbers, then keep/drop/adjust them by index in crop-manifest.json.
//
//   node scripts/training/detect-figures.mjs [--out <dir>] [sheet.png ...]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { backgroundLevel, erode, inkMask, isMark, solidify, stripMarks } from "./lib/ink.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");

// Work on a downscaled mask: crop boundaries do not need pixel precision at
// this stage, and 512px keeps the flood fills instant.
const WORK_WIDTH = 512;
// Opening radius. The eroded copy is never used for extent — eroding a figure
// snaps thin joins like a neck and would crop a head off. It is used only to
// read gutters and bands, where the point is that a hairline rule under a
// heading and the faint shadow strip under a row of feet both vanish.
const OPEN_RADIUS = 3;
// Vertical slack for rejoining a fragment to the drawing it belongs to.
const STACK_GAP = 0.008;
// Deep enough for row/column/row/column on the busiest sheet.
const MAX_DEPTH = 8;
// A gutter this wide (in working pixels) separates two drawings. Smaller gaps
// are the white inside one drawing.
const MIN_GAP = 4;

function parseArgs() {
  const argv = process.argv.slice(2);
  let out = path.join(here, ".detect");
  const files = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") out = path.resolve(argv[++i]);
    else files.push(argv[i]);
  }
  return { out, files };
}

function defaultSheets() {
  const base = path.join(repoRoot, "canon", "characters");
  const found = [];
  for (const character of fs.readdirSync(base, { withFileTypes: true })) {
    if (!character.isDirectory()) continue;
    const dir = path.join(base, character.name);
    for (const file of fs.readdirSync(dir).sort()) {
      if (/\.png$/i.test(file)) found.push(path.join(dir, file));
    }
  }
  return found;
}

// Recursive XY-cut — the classic way to read a grid layout. Alternate between
// splitting on empty rows and empty columns until a region stops dividing;
// what is left is one cell of the sheet. Run on the eroded copy, where the
// lettering, the rule under the heading, and the shadow strips under a row of
// feet have all dissolved, so the gutters that separate the drawings are the
// only gutters there are.
function runs(profile, minGap) {
  const spans = [];
  let start = -1;
  for (let i = 0; i < profile.length; i++) {
    if (profile[i] > 0) {
      if (start < 0) start = i;
    } else if (start >= 0) {
      spans.push([start, i - 1]);
      start = -1;
    }
  }
  if (start >= 0) spans.push([start, profile.length - 1]);

  // Whitespace narrower than a gutter is whitespace inside one drawing.
  const merged = [];
  for (const span of spans) {
    const last = merged[merged.length - 1];
    if (last && span[0] - last[1] - 1 < minGap) last[1] = span[1];
    else merged.push([span[0], span[1]]);
  }
  return merged;
}

function xyCut(region, mask, w, h, minGap, horizontalFirst, depth = 0) {
  const { minX, minY, maxX, maxY } = region;
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const rowProfile = new Uint32Array(bh);
  const colProfile = new Uint32Array(bw);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (!mask[y * w + x]) continue;
      rowProfile[y - minY]++;
      colProfile[x - minX]++;
    }
  }
  const rowRuns = runs(rowProfile, minGap);
  const colRuns = runs(colProfile, minGap);
  const first = horizontalFirst ? rowRuns : colRuns;
  const second = horizontalFirst ? colRuns : rowRuns;

  if (depth < MAX_DEPTH && first.length > 1) {
    return first.flatMap(([a, b]) =>
      xyCut(
        horizontalFirst
          ? { minX, maxX, minY: minY + a, maxY: minY + b }
          : { minY, maxY, minX: minX + a, maxX: minX + b },
        mask, w, h, minGap, !horizontalFirst, depth + 1
      )
    );
  }
  if (depth < MAX_DEPTH && second.length > 1) {
    return second.flatMap(([a, b]) =>
      xyCut(
        horizontalFirst
          ? { minY, maxY, minX: minX + a, maxX: minX + b }
          : { minX, maxX, minY: minY + a, maxY: minY + b },
        mask, w, h, minGap, horizontalFirst, depth + 1
      )
    );
  }
  return [region];
}

// The eroded mask found the cell; the drawing's true edges are in the solid
// one. Snap each cell to the ink actually inside it — recovering the head an
// erosion snapped off at the neck — without letting it grow past the cell.
function tightenToSolid(cell, solid, w, h, pad) {
  const minX = Math.max(0, cell.minX - pad);
  const maxX = Math.min(w - 1, cell.maxX + pad);
  const minY = Math.max(0, cell.minY - pad);
  const maxY = Math.min(h - 1, cell.maxY + pad);
  let x0 = maxX, y0 = maxY, x1 = minX, y1 = minY, area = 0;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (!solid[y * w + x]) continue;
      area++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (!area) return { ...cell, area: 0 };
  return { minX: x0, minY: y0, maxX: x1, maxY: y1, area };
}

// Eroding the mask snaps a thin join — a flamingo's neck, a westie's ankle —
// and the cut then loses the head above the break. Grow each box upward
// through the solid mask instead of trying to match orphan boxes back to
// bodies: heads are always up, and the ground shadows that chain neighbours
// together are always down.
function growUp(box, solid, w, slack, limit) {
  const spanFrom = Math.max(0, box.minX - slack);
  const spanTo = Math.min(w - 1, box.maxX + slack);
  const floor = Math.max(0, box.minY - limit);
  let top = box.minY;
  let empty = 0;
  for (let y = box.minY - 1; y >= floor; y--) {
    let ink = false;
    for (let x = spanFrom; x <= spanTo && !ink; x++) if (solid[y * w + x]) ink = true;
    if (ink) {
      top = y;
      empty = 0;
    } else if (++empty > slack) {
      break;
    }
  }
  return { ...box, minY: top };
}


async function detect(file, outDir) {
  const meta = await sharp(file).metadata();
  const scale = WORK_WIDTH / meta.width;
  const w = WORK_WIDTH;
  const h = Math.max(1, Math.round(meta.height * scale));
  const gray = await sharp(file).resize(w, h, { fit: "fill" }).grayscale().raw().toBuffer();

  const ink = inkMask(gray, w, h);

  // Lettering goes first, and it goes before the paper is flooded. The
  // hairline rule under a heading is the worst offender: it runs most of the
  // width of the sheet and grazes the heads below it, so once the flood seals
  // that contact the title and half the figures are a single shape. Strip the
  // raw ink, solidify, then strip again for anything the flood joined up.
  const solid = stripMarks(solidify(stripMarks(ink, w, h), w, h), w, h);
  // The eroded copy is only ever used to read gutters. Extents come from the
  // solid mask: eroding snaps a flamingo's neck and loses the head above it.
  const drawings = stripMarks(erode(solid, w, h, OPEN_RADIUS), w, h);

  // Cells are not merged afterwards. The cut already keeps a figure and the
  // bar it leans on together, and re-merging would chain neighbours back into
  // one box through the ground shadows tightening picks up at a cell's edge.
  const cells = xyCut({ minX: 0, minY: 0, maxX: w - 1, maxY: h - 1 }, drawings, w, h, MIN_GAP, true)
    .map((c) => tightenToSolid(c, solid, w, h, OPEN_RADIUS))
    .filter((b) => b.area);
  const slack = Math.round(h * STACK_GAP);
  const boxes = cells
    .map((c) => growUp(c, solid, w, slack, Math.round((c.maxY - c.minY) * 0.8)))
    .filter((b) => !isMark(b, w, h))
    // Reading order: down the rows, then left to right within a row.
    .sort((a, b) => (Math.abs(a.minY - b.minY) > h * 0.12 ? a.minY - b.minY : a.minX - b.minX))
    .map((b, i) => ({
      index: i + 1,
      left: Math.round(b.minX / scale),
      top: Math.round(b.minY / scale),
      width: Math.round((b.maxX - b.minX + 1) / scale),
      height: Math.round((b.maxY - b.minY + 1) / scale),
    }));

  const previewWidth = 1400;
  const p = previewWidth / meta.width;
  const rects = boxes
    .map(
      (b) =>
        `<rect x="${b.left * p}" y="${b.top * p}" width="${b.width * p}" height="${b.height * p}" ` +
        `fill="none" stroke="#e0115f" stroke-width="3"/>` +
        `<text x="${b.left * p + 8}" y="${b.top * p + 36}" font-family="monospace" font-size="36" ` +
        `font-weight="bold" fill="#e0115f">${b.index}</text>`
    )
    .join("");
  const overlay = Buffer.from(
    `<svg width="${previewWidth}" height="${Math.round(meta.height * p)}" ` +
      `xmlns="http://www.w3.org/2000/svg">${rects}</svg>`
  );

  const name = `${path.basename(path.dirname(file))}--${path.basename(file, ".png")}`;
  await sharp(file)
    .resize(previewWidth)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png()
    .toFile(path.join(outDir, `${name}.png`));

  return { sheet: path.relative(repoRoot, file), width: meta.width, height: meta.height, boxes };
}

const { out, files } = parseArgs();
fs.mkdirSync(out, { recursive: true });
const sheets = files.length ? files.map((f) => path.resolve(f)) : defaultSheets();

const results = [];
for (const sheet of sheets) {
  const result = await detect(sheet, out);
  results.push(result);
  console.log(`${result.sheet}: ${result.boxes.length} figure(s)`);
}
fs.writeFileSync(path.join(out, "boxes.json"), JSON.stringify(results, null, 2));
console.log(`\nwrote ${path.relative(repoRoot, out)}/boxes.json and ${results.length} annotated preview(s)`);
