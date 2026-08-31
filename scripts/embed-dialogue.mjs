// Typeset exact dialogue beneath each source panel without redrawing the art.
// It accepts a square or 4:5 source panel, plus portraits produced by this script.
// Reruns always rebuild from the untouched art region, so edited captions never
// stack a second strip or redraw the illustration.
//
// Run from /site:
//   npm run dialogue
//
// Preview one source without changing it:
//   node scripts/embed-dialogue.mjs --preview=options/2026-08-13/option-1.png

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const previewPrefix = "--preview=";
const previewArg = process.argv.find((arg) => arg.startsWith(previewPrefix));
const previewRelative = previewArg?.slice(previewPrefix.length).replaceAll("\\", "/");
const previewOutput = path.resolve(here, "..", "dialogue-preview.png");
const stripHeight = 264;
const legacyStripHeight = 236;

const xml = (value) =>
  String(value).replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]);

// The house format is attributed italic dialogue — Drew: “…”. A caption
// carrying a cast attribution typesets that way; anything else keeps the
// legacy whole-line quotes so old cartoons re-render unchanged.
function formatCaption(caption) {
  const match = caption.trim().match(/^(Drew|Barclay|Abby)\s*:\s*([\s\S]+)$/);
  if (!match) return `“${caption.trim()}”`;
  const speech = match[2].trim().replace(/^["“]/, "").replace(/["”]$/, "").trim();
  return `${match[1]}: “${speech}”`;
}

function wrapDialogue(caption, limit = 48) {
  const words = formatCaption(caption).split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > limit) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  if (lines.length > 3) {
    throw new Error(`dialogue is too long for three lines: ${caption}`);
  }
  return lines;
}

function dialogueSvg(width, height, caption) {
  const lines = wrapDialogue(caption);
  const fontSize = lines.length === 3 ? 50 : 54;
  const lineHeight = 64;
  const firstBaseline = (height - (lines.length - 1) * lineHeight) / 2 + 15;
  const tspans = lines
    .map((line, index) => `<tspan x="${width / 2}" y="${firstBaseline + index * lineHeight}">${xml(line)}</tspan>`)
    .join("");

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#f8f5ee"/>
  <path d="M72 2H${width - 72}" stroke="#171717" stroke-width="2"/>
  <text text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-style="italic" font-weight="500" fill="#171717">${tspans}</text>
</svg>`);
}

function sourceRecords() {
  const records = [];
  const cartoons = path.join(repoRoot, "cartoons");
  for (const entry of fs.readdirSync(cartoons, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "_TEMPLATE") continue;
    const directory = path.join(cartoons, entry.name);
    const image = path.join(directory, "cartoon.png");
    const meta = JSON.parse(fs.readFileSync(path.join(directory, "meta.json"), "utf8"));
    records.push({ image, caption: meta.caption, relative: path.relative(repoRoot, image).replaceAll("\\", "/") });
  }

  const options = path.join(repoRoot, "options");
  for (const day of fs.readdirSync(options, { withFileTypes: true })) {
    if (!day.isDirectory()) continue;
    const directory = path.join(options, day.name);
    for (const file of fs.readdirSync(directory).filter((name) => /^option-\d+\.png$/.test(name)).sort()) {
      const image = path.join(directory, file);
      const metaFile = path.join(directory, file.replace(/\.png$/, ".json"));
      if (!fs.existsSync(metaFile)) throw new Error(`dialogue metadata is missing: ${path.relative(repoRoot, metaFile)}`);
      const meta = JSON.parse(fs.readFileSync(metaFile, "utf8"));
      records.push({ image, caption: meta.caption, relative: path.relative(repoRoot, image).replaceAll("\\", "/") });
    }
  }
  return records;
}

async function render(record, output) {
  if (typeof record.caption !== "string" || !record.caption.trim()) {
    throw new Error(`caption is missing: ${record.relative}`);
  }

  const source = sharp(record.image);
  const metadata = await source.metadata();
  if (!metadata.width || !metadata.height) throw new Error(`cannot read dimensions: ${record.relative}`);
  const supportedArtHeights = [metadata.width, Math.round((metadata.width * 5) / 4)];
  const artHeight = supportedArtHeights.find(
    (candidate) =>
      metadata.height === candidate ||
      metadata.height === candidate + stripHeight ||
      metadata.height === candidate + legacyStripHeight ||
      metadata.height === candidate + legacyStripHeight + stripHeight
  );
  if (!artHeight) {
    throw new Error(`refusing an unknown artwork shape for ${record.relative} (${metadata.width}x${metadata.height})`);
  }

  const artwork = await source.extract({ left: 0, top: 0, width: metadata.width, height: artHeight }).png().toBuffer();
  const composed = sharp({
    create: {
      width: metadata.width,
      height: artHeight + stripHeight,
      channels: 3,
      background: "#f8f5ee",
    },
  }).composite([
    { input: artwork, left: 0, top: 0 },
    { input: dialogueSvg(metadata.width, stripHeight, record.caption), left: 0, top: artHeight },
  ]);
  const finished = sharp(await composed.png().toBuffer()).flatten({ background: "#f8f5ee" });

  if (output === record.image) {
    const temporary = `${record.image}.dialogue-${process.pid}.tmp.png`;
    await finished.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(temporary);
    let lastError;
    for (let attempt = 1; attempt <= 8; attempt++) {
      try {
        fs.copyFileSync(temporary, record.image);
        fs.unlinkSync(temporary);
        return;
      } catch (error) {
        lastError = error;
        if (!['EBUSY', 'EPERM', 'UNKNOWN'].includes(error.code) || attempt === 8) break;
        await new Promise((resolve) => setTimeout(resolve, attempt * 100));
      }
    }
    throw lastError;
  } else {
    await finished.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(output);
  }
}

const records = sourceRecords();
if (previewRelative) {
  const record = records.find((candidate) => candidate.relative === previewRelative);
  if (!record) throw new Error(`preview target is not a known cartoon or proof: ${previewRelative}`);
  await render(record, previewOutput);
  console.log(`dialogue: previewed ${record.relative} at ${path.relative(repoRoot, previewOutput)}`);
} else {
  for (const record of records) {
    await render(record, record.image);
    console.log(`dialogue: typeset ${record.relative}`);
  }
  console.log(`dialogue: typeset ${records.length} cartoon(s) and proof(s)`);
}
