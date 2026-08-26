// Promote QC'd smoke panels into the showcase the Studio Bible page leads
// with. The art department generates into scripts/training/smoke/ (dated,
// disposable, one file per roll); this script picks the roll that passed and
// files it under canon/showcase/<slug>.png with its caption, so the site shows
// a chosen batch rather than whatever was drawn last.
//
//   node scripts/promote-showcase.mjs                 # newest roll of each slug
//   node scripts/promote-showcase.mjs sc08-sp-8000    # only these slugs
//   node scripts/promote-showcase.mjs sc09-housing=20260826-2114-sc09-housing
//
// Captions live here beside the slugs and are typeset INTO the finished
// panel, on paper beneath the art, the way the founder's plates carry theirs.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const smokeDir = path.join(repoRoot, "scripts", "training", "smoke");
const showcaseDir = path.join(repoRoot, "canon", "showcase");

// The finished house format, same as scripts/embed-dialogue.mjs and
// lib/dialogue.ts: the art normalised to 1200px wide in a square or 4:5
// region, with the attributed line typeset beneath it on paper. The plates
// carry their caption on the paper, so a filed cartoon does too.
const TARGET_WIDTH = 1200;
const STRIP_HEIGHT = 264;

const xml = (value) =>
  String(value).replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]);

function formatCaption(caption) {
  const match = caption.trim().match(/^(Drew|Mango|Abby)\s*:\s*([\s\S]+)$/);
  if (!match) return `\u201c${caption.trim()}\u201d`;
  const speech = match[2].trim().replace(/^["\u201c]/, "").replace(/["\u201d]$/, "").trim();
  return `${match[1]}: \u201c${speech}\u201d`;
}

function wrapDialogue(caption, limit = 48) {
  const words = formatCaption(caption).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > limit && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  if (lines.length > 3) throw new Error(`dialogue is too long for three lines: ${caption}`);
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

async function finish(sourceFile, caption) {
  const meta = await sharp(sourceFile).metadata();
  const ratio = meta.height / meta.width;
  const artHeight = ratio < 1.125 ? TARGET_WIDTH : Math.round((TARGET_WIDTH * 5) / 4);
  const art = await sharp(sourceFile)
    .flatten({ background: "#ffffff" })
    .grayscale()
    .resize(TARGET_WIDTH, artHeight, { fit: "cover", position: "top" })
    .png()
    .toBuffer();
  const strip = await sharp(dialogueSvg(TARGET_WIDTH, STRIP_HEIGHT, caption)).png().toBuffer();
  return sharp({
    create: { width: TARGET_WIDTH, height: artHeight + STRIP_HEIGHT, channels: 3, background: "#ffffff" },
  })
    .composite([
      { input: art, left: 0, top: 0 },
      { input: strip, left: 0, top: artHeight },
    ])
    .png()
    .toBuffer();
}

const BATCH = [
  {
    slug: "sc01-hike-odds",
    caption: 'Drew: "Best seller all year. Nobody has ever had to make one."',
    note: "The rate hike, priced nightly and never poured.",
  },
  {
    slug: "sc02-tariffs",
    caption: 'Mango: "I had one of each. It felt patriotic both times."',
    note: "Canadian Club, and the retaliatory one.",
  },
  {
    slug: "sc03-ai-capex",
    caption: 'Drew: "Committed is money that has not had its second thoughts yet."',
    note: "$600B spent, $3 trillion committed — and the martini is empty.",
  },
  {
    slug: "sc04-refinance",
    caption: 'Mango: "Nobody pays a tab like that. They renew it."',
    note: "$9.7 trillion refinanced this year; all tabs rolled over nightly.",
  },
  {
    slug: "sc05-golf-thirty",
    caption: 'Drew: "Five and a quarter for thirty years. My swing guarantees nothing of the kind."',
    note: "The 19th hole — the strip's away game.",
  },
  {
    slug: "sc06-jackson-hole",
    caption: 'Mango: "A symposium in the mountains, to tell us they are still thinking about it."',
    note: "The speech is Friday. The water is $12.",
  },
  {
    slug: "sc07-sentiment",
    caption: 'Mango: "I have never felt worse about the economy, Abby. Same again."',
    note: "Sentiment at a record low, spending up again. Misery hour, 4–7.",
  },
  {
    slug: "sc08-sp-8000",
    caption: 'Drew: "Her target follows the price at a respectful distance. It is called research."',
    note: "The house martini has a year-end target too.",
  },
  {
    slug: "sc09-housing",
    caption: 'Abby: "The house keeps winning, gentlemen. Just not the kind anyone lives in."',
    note: "Data centers outbuild housing; the starter home is off the board.",
  },
  {
    slug: "sc10-fed-abby",
    caption: 'Abby: "I price in a raise every morning, gentlemen. Delivering it is a separate decision."',
    note: "A 45% chance of $19 today.",
  },
];

const args = process.argv.slice(2);
const pins = new Map();
const wanted = new Set();
for (const arg of args) {
  const [slug, file] = arg.split("=");
  wanted.add(slug);
  if (file) pins.set(slug, file.endsWith(".png") ? file : `${file}.png`);
}

function newestRoll(slug) {
  const matches = fs
    .readdirSync(smokeDir)
    .filter((file) => file.endsWith(`-${slug}.png`))
    .sort();
  return matches.length > 0 ? matches[matches.length - 1] : null;
}

fs.mkdirSync(showcaseDir, { recursive: true });

const indexPath = path.join(showcaseDir, "index.json");
const existing = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, "utf8")) : [];
const sourceOf = new Map(existing.map((entry) => [entry.file, entry.source]));

const index = [];
for (const panel of BATCH) {
  const target = path.join(showcaseDir, `${panel.slug}.png`);
  const promote = wanted.size === 0 || wanted.has(panel.slug);
  const roll = promote ? (pins.get(panel.slug) ?? newestRoll(panel.slug)) : null;

  if (roll) {
    const source = path.join(smokeDir, roll);
    if (!fs.existsSync(source)) {
      console.error(`promote-showcase: no such roll ${roll}`);
      process.exit(1);
    }
    fs.writeFileSync(target, await finish(source, panel.caption));
    sourceOf.set(`${panel.slug}.png`, roll);
    console.log(`  ${panel.slug}  <-  ${roll}`);
  } else if (!fs.existsSync(target)) {
    console.log(`  ${panel.slug}  --  not drawn yet, skipped`);
    continue;
  }

  index.push({
    file: `${panel.slug}.png`,
    caption: panel.caption,
    note: panel.note,
    source: sourceOf.get(`${panel.slug}.png`) ?? null,
  });
}

fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
console.log(`\ncanon/showcase: ${index.length} panel${index.length === 1 ? "" : "s"} filed.`);
