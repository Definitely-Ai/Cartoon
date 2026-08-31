// Builds the LoRA training set from crop-manifest.json.
//
// The fine-tune has one job the prompt cannot do — know who Drew, Barclay and
// Abby are — and one thing it must never do: decide where they are. This
// script is where that second half is enforced. Every image leaves here with a
// caption that names its background out loud, and the run fails if the corpus
// tips too far toward one place, or toward no place at all.
//
// It crops the figures out of the model sheets (a whole sheet would teach the
// model to draw sheets), strips the dialogue field off the finished cartoons
// (the art is the lesson, the lettering is not), squares everything up on the
// sheet's own paper colour, and writes each image beside a same-named .txt
// caption — the layout every FLUX LoRA trainer expects.
//
//   node scripts/training/build-training-set.mjs [--out <dir>] [--no-zip]

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { componentsWithPixels, inkMask, isMark } from "./lib/ink.mjs";
import { classify } from "./lib/places.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");

// 1024 is the resolution FLUX was trained at and the ceiling every runbook
// assumes. It is a ceiling, never a target: crops keep their native size and
// aspect (the trainer buckets by aspect ratio), are only ever scaled DOWN to
// fit the ceiling, and anything smaller than MIN_EDGE just gets a note in the
// build log so a suspiciously tiny crop is visible.
const EDGE = 1024;
const MIN_EDGE = 512;
// Detected boxes hug the ink. A little air keeps a crop from shaving an ear or
// a heel, and reads as a drawing rather than a cut-out.
const EXPAND = 0.03;
// The dialogue field the house adds under every finished cartoon.
const DIALOGUE_STRIP = 264;

// A character LoRA is mostly studies and that is fine, but a model that only
// ever saw blank paper will put blank paper behind everything Rick asks for.
const STUDY_CEILING = 0.7;
// Among the images that do have a real place, no single place may dominate —
// otherwise "put them on a boat" drifts back to the bar.
const SCENE_CAP = 0.5;

function parseArgs() {
  const argv = process.argv.slice(2);
  let out = path.join(here, "training-set");
  let zip = true;
  let draft = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") out = path.resolve(argv[++i]);
    else if (argv[i] === "--no-zip") zip = false;
    else if (argv[i] === "--draft") draft = true;
  }
  return { out, zip, draft };
}

// Pad to square on the artwork's own paper rather than pure white: a warm
// sheet on a white square trains a rectangle-inside-a-rectangle.
//
// The paper is the most common colour in the crop, not the colour of a corner
// — a tight crop's corner is as likely to hold a shoulder as a shoulder's
// worth of blank sheet, and padding a whole image with the wrong grey leaves a
// visible band down both sides.
async function paperColor(image, box) {
  const { data, info } = await sharp(await image.clone().extract(box).toBuffer())
    .resize(64, 64, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const counts = new Uint32Array(256);
  const channels = info.channels;
  for (let i = 0; i < data.length; i += channels) {
    counts[Math.round((data[i] + data[i + 1] + data[i + 2]) / 3)]++;
  }
  let mode = 0;
  for (let v = 1; v < 256; v++) if (counts[v] > counts[mode]) mode = v;

  // Average the pixels sitting at that level rather than returning a flat
  // grey, so a warm sheet stays warm.
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += channels) {
    if (Math.abs(Math.round((data[i] + data[i + 1] + data[i + 2]) / 3) - mode) > 2) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n++;
  }
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

// Printed labels sit close under every figure on these sheets, and sheet
// titles sit close above. A crop generous enough not to shave an ear will
// catch some of that lettering, and a model trained on it starts writing
// captions under its own drawings. So rather than tune the boxes until no
// crop ever touches a label, paint the lettering out afterwards.
//
// Only marks lying wholly outside the main drawing's own bounding box are
// erased, plus mark-shaped scraps clipped by the top or bottom edge — the tail
// of a heading's rule, the top of a caption from the row below. That is what
// makes it safe: the drawing itself is one connected shape and is never a
// candidate, so an eye, a button or a bow tie is never touched however small.
async function eraseLettering(buffer, background) {
  const { data, info } = await sharp(buffer).grayscale().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const blobs = componentsWithPixels(inkMask(data, w, h), w, h);
  if (!blobs.length) return buffer;

  const subject = blobs.reduce((a, b) => (b.area > a.area ? b : a));
  const outsideSubject = (b) =>
    b.maxX < subject.minX || b.minX > subject.maxX || b.maxY < subject.minY || b.minY > subject.maxY;
  const clippedByEdge = (b) => b.minY === 0 || b.maxY === h - 1;
  const marks = blobs.filter(
    (b) => b !== subject && isMark(b, w, h) && (outsideSubject(b) || clippedByEdge(b))
  );
  if (!marks.length) return buffer;

  const { data: rgb } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  // Dilate each mark a little as it is painted out: a threshold catches the
  // core of a letter stroke and leaves its soft edge behind.
  const halo = 2;
  for (const mark of marks) {
    for (const p of mark.pixels) {
      const x = p % w;
      const y = (p - x) / w;
      for (let dy = -halo; dy <= halo; dy++) {
        for (let dx = -halo; dx <= halo; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const i = (ny * w + nx) * 3;
          rgb[i] = background.r;
          rgb[i + 1] = background.g;
          rgb[i + 2] = background.b;
        }
      }
    }
  }
  return sharp(rgb, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer();
}

// Natural aspect out — no squaring, no padding. The trainer buckets images by
// aspect ratio, and a vision audit found the old paper-coloured squaring bands
// were visible as flat rectangles against the textured sheets: training data
// of their own. Downscale-only (an upscaled study just teaches the model what
// a soft upscale looks like), greyscale because the strip is strictly B&W and
// the colour channels carried nothing but each sheet's scanner cast.
async function finish(buffer, name) {
  const meta = await sharp(buffer).metadata();
  if (Math.max(meta.width, meta.height) < MIN_EDGE) {
    console.log(`  note ${name} is small (${meta.width}x${meta.height}) — kept at native size`);
  }
  return sharp(buffer)
    .resize(EDGE, EDGE, { fit: "inside", withoutEnlargement: true })
    .grayscale()
    .png({ compressionLevel: 9 })
    .toBuffer();
}

// Paint manifest-listed rectangles with the paper colour before the automatic
// lettering pass runs — the surgical tool for marks the blob heuristics
// legitimately refuse: dashed leader-lines ending a hair from a hand, gaze
// arrows inside the subject's own bounding box, a title rule overlapping the
// head. Rectangles are given in SOURCE-SHEET coordinates (the same frame as
// the crop's box), so they can be measured once in one viewer session.
async function eraseRects(buffer, rects, cropBox, background) {
  const meta = await sharp(buffer).metadata();
  const overlays = [];
  for (const [x, y, w, h] of rects) {
    const left = Math.max(0, x - cropBox.left);
    const top = Math.max(0, y - cropBox.top);
    const width = Math.min(meta.width - left, w - Math.max(0, cropBox.left - x));
    const height = Math.min(meta.height - top, h - Math.max(0, cropBox.top - y));
    if (width <= 0 || height <= 0) continue; // the rect belongs to a different crop of this sheet
    overlays.push({ input: { create: { width, height, channels: 3, background } }, left, top });
  }
  if (!overlays.length) return buffer;
  return sharp(buffer).composite(overlays).png().toBuffer();
}

function clampBox(box, width, height, expand, inset) {
  const [l, t, w, h] = box;
  const padX = Math.round(w * expand) - inset;
  const padY = Math.round(h * expand) - inset;
  const left = Math.max(0, l - padX);
  const top = Math.max(0, t - padY);
  return {
    left,
    top,
    width: Math.max(1, Math.min(width - left, w + padX * 2)),
    height: Math.max(1, Math.min(height - top, h + padY * 2)),
  };
}

const written = new Map(); // content hash → the name already written under it
const images = [];

async function emit(outDir, name, buffer, caption, source) {
  const setting = classify(caption);
  if (!setting) {
    throw new Error(
      `caption for ${name} names no place — every caption must say where the subject is:\n  "${caption}"`
    );
  }
  const hash = createHash("sha256").update(buffer).digest("hex");
  if (written.has(hash)) {
    console.log(`  skip ${name} — identical to ${written.get(hash)}`);
    return;
  }
  written.set(hash, name);
  fs.writeFileSync(path.join(outDir, `${name}.png`), buffer);
  fs.writeFileSync(path.join(outDir, `${name}.txt`), `${caption}\n`);
  images.push({ name, caption, setting, source });
}

async function buildSheet(entry, outDir) {
  // `skip` on a sheet with crops records what was left out of it; a sheet with
  // no crops at all was dropped whole.
  if (!entry.crops) {
    console.log(`\n${entry.file}\n  dropped: ${[].concat(entry.skip).join(" ")}`);
    return;
  }
  const file = path.join(repoRoot, entry.file);
  const image = sharp(file);
  const meta = await image.metadata();
  const stem = `${path.basename(path.dirname(entry.file))}-${path.basename(entry.file, ".png")}`;
  console.log(`\n${entry.file}`);

  let n = 0;
  for (const crop of entry.crops) {
    const columns = crop.columns ?? 1;
    const captions = columns > 1 ? crop.captions : [crop.caption];
    if (captions?.length !== columns) {
      throw new Error(`${entry.file}: a ${columns}-column crop needs ${columns} captions`);
    }
    const [l, t, w, h] = crop.box;
    const columnWidth = Math.floor(w / columns);
    for (let c = 0; c < columns; c++) {
      const box = clampBox(
        [l + c * columnWidth, t, columnWidth, h],
        meta.width,
        meta.height,
        columns > 1 ? 0 : EXPAND,
        crop.inset ?? 0
      );
      const background = await paperColor(image, box);
      let cut = await image.clone().extract(box).toBuffer();
      if (crop.erase) cut = await eraseRects(cut, crop.erase, box, background);
      cut = await eraseLettering(cut, background);
      const name = `${stem}-${String(++n).padStart(2, "0")}`;
      await emit(outDir, name, await finish(cut, name), captions[c], entry.file);
    }
  }
  console.log(`  ${n} study/studies`);
  if (entry.skip) console.log(`  left out: ${[].concat(entry.skip).join(" ")}`);
}

async function buildCartoon(entry, outDir) {
  if (entry.skip) {
    console.log(`  skip ${entry.file} — ${entry.skip}`);
    return;
  }
  const file = path.join(repoRoot, entry.file);
  const meta = await sharp(file).metadata();
  // The house format is a square or 4:5 panel with the dialogue field beneath.
  // Anything else means the file was made some other way; take the whole image
  // rather than guess where the art stops.
  const artHeight = meta.height - DIALOGUE_STRIP;
  const square = artHeight === meta.width;
  const portrait = artHeight === Math.round((meta.width * 5) / 4);
  const height = square || portrait ? artHeight : meta.height;
  if (!square && !portrait) {
    console.log(`  note ${entry.file} is not in the house finished format — using the whole image`);
  }
  const artBox = { left: 0, top: 0, width: meta.width, height };
  let cut = await sharp(file).extract(artBox).toBuffer();
  if (entry.erase) cut = await eraseRects(cut, entry.erase, artBox, { r: 255, g: 255, b: 255 });
  const name = `cartoon-${entry.file.replace(/[/.]/g, "-").replace(/-png$/, "")}`;
  await emit(outDir, name, await finish(cut, name), entry.caption, entry.file);
}

// Images generated by make-setting-variants.mjs, if that has been run. They
// exist for one reason: to outnumber the bar badly enough that the model never
// mistakes it for part of who these characters are.
async function buildVariants(outDir) {
  const dir = path.join(here, "setting-variants");
  if (!fs.existsSync(dir)) {
    console.log(
      "\nsetting-variants/ is missing — run `npm run training:variants` with a Replicate token first.\n" +
        "  Without them the corpus is barroom-heavy and the model may treat the bar as part of the characters."
    );
    return;
  }
  console.log("\nsetting-variants/");
  let n = 0;
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith(".png")) continue;
    const captionFile = path.join(dir, `${path.basename(file, ".png")}.txt`);
    if (!fs.existsSync(captionFile)) {
      console.log(`  skip ${file} — no caption beside it`);
      continue;
    }
    const cut = await sharp(path.join(dir, file)).toBuffer();
    const name = `variant-${path.basename(file, ".png")}`;
    await emit(outDir, name, await finish(cut, name), fs.readFileSync(captionFile, "utf8").trim(), `setting-variants/${file}`);
    n++;
  }
  console.log(`  ${n} setting variant(s)`);
}

function report() {
  const tally = new Map();
  for (const image of images) tally.set(image.setting, (tally.get(image.setting) ?? 0) + 1);
  const total = images.length;
  const studies = tally.get("blank paper") ?? 0;
  const scenes = total - studies;

  console.log(`\n${total} images\n`);
  for (const [setting, count] of [...tally].sort((a, b) => b[1] - a[1])) {
    const share = ((count / total) * 100).toFixed(0).padStart(3);
    console.log(`  ${share}%  ${String(count).padStart(3)}  ${setting}`);
  }

  const problems = [];
  if (studies / total > STUDY_CEILING) {
    problems.push(
      `${((studies / total) * 100).toFixed(0)}% of the set is figures on blank paper (ceiling ${STUDY_CEILING * 100}%). ` +
        "A model trained on that puts blank paper behind everything. Add scene images or cut studies."
    );
  }
  for (const [setting, count] of tally) {
    if (setting === "blank paper" || !scenes) continue;
    if (count / scenes > SCENE_CAP) {
      problems.push(
        `${((count / scenes) * 100).toFixed(0)}% of the images with a real place are "${setting}" (cap ${SCENE_CAP * 100}%). ` +
          "That place will start showing up uninvited. Add images somewhere else."
      );
    }
  }
  if (problems.length) {
    console.error("\nThe set is out of balance:");
    for (const problem of problems) console.error(`  - ${problem}`);
    if (!draft) process.exit(1);
    // --draft exists to look at the crops, never to train on them, so it
    // writes the images and withholds the archive.
    console.error("\n  --draft: images written for inspection, no archive. Do not train on this.");
    return false;
  }
  console.log(
    `\n  ${scenes} of ${total} images have a real place behind the characters ` +
      `(${((scenes / total) * 100).toFixed(0)}%).`
  );
  return true;
}

const { out, zip, draft } = parseArgs();
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.join(here, "crop-manifest.json"), "utf8"));
for (const sheet of manifest.sheets) await buildSheet(sheet, out);
console.log("\nfinished cartoons");
for (const cartoon of manifest.cartoons) await buildCartoon(cartoon, out);
await buildVariants(out);

const balanced = report();
fs.writeFileSync(path.join(out, "index.json"), JSON.stringify(images, null, 2));

if (zip && balanced) {
  const archive = path.join(here, "training-set.zip");
  fs.rmSync(archive, { force: true });
  // No zip binary is guaranteed here; Python's zipfile always is.
  execFileSync("python3", [
    "-c",
    "import sys,zipfile,pathlib\n" +
      "src=pathlib.Path(sys.argv[1]); dst=sys.argv[2]\n" +
      "with zipfile.ZipFile(dst,'w',zipfile.ZIP_DEFLATED) as z:\n" +
      "    for p in sorted(src.iterdir()):\n" +
      "        if p.suffix in ('.png','.txt'): z.write(p, p.name)\n",
    out,
    archive,
  ]);
  const size = (fs.statSync(archive).size / 1024 / 1024).toFixed(1);
  console.log(`\nwrote ${path.relative(repoRoot, archive)} (${size} MB) — upload this to the trainer`);
}
