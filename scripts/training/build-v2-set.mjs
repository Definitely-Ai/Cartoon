// Builds the v2 (Harrington) training set: the founder's plate panels, the
// definitive identity crops, and the QC'd studio variants — every caption in
// this one file, because the captions ARE the curriculum.
//
//   node scripts/training/build-v2-set.mjs [--draft]
//
// Grammar (unchanged from v1 so lib/generate.ts needs nothing new):
//   SWDINK cartoon, SWD<CHAR> <doing what>, <setting named out loud>
// Captions never mention anatomy, faces, permanent wardrobe, or the
// black-and-white look — that is what bakes into the tokens and becomes each
// character's DEFAULT. Everything a prompt should be able to change — the
// setting, the props, variable clothes (Mango's golf polo, Abby's gown), the
// signage text — is named out loud so it stays the prompt's business.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const V = (p) => path.join(repoRoot, "canon", "vision", p);
const variantsDir = path.join(here, "setting-variants");
const outDir = path.join(here, "training-set-v2");

// --- The founder's plate panels (photos of the prints; grayscale+normalise
// pulls them onto the same sheet as the digital variants).
const PLATES = [
  {
    id: "p1-security",
    src: V("plate-1-security-and-martini-menu.jpg"),
    box: [48, 117, 1546, 766],
    caption:
      "SWDINK cartoon, SWDDREW and SWDMANGO waiting in a crowded airport security line among human travelers, " +
      "SWDMANGO in a white polo shirt and pale cap, SWDDREW holding a checklist over a tray of belts and shoes, " +
      "wall signs reading SECURITY and PREPARE TO BE HUMBLED",
  },
  {
    id: "p1-martini-menu",
    src: V("plate-1-security-and-martini-menu.jpg"),
    box: [16, 1460, 1600, 1140],
    caption:
      "SWDINK cartoon, SWDDREW and SWDMANGO seated in leather club chairs at the bar counter of the barroom, " +
      "each with a martini, a chalkboard menu pricing martinis by airline fare class behind the bar, a nut bowl " +
      "between them, the mirrored window sign beyond",
  },
  {
    id: "p2-debt-ceiling",
    src: V("plate-2-debt-ceiling-and-retirement.jpg"),
    box: [152, 727, 1544, 1076],
    caption:
      "SWDINK cartoon, SWDDREW with a martini and SWDMANGO with an old fashioned at the bar counter of the " +
      "barroom under a banner reading 16th ANNUAL DEBT CEILING WEEK, balloons and a schedule-of-events board " +
      "among the bottles, a paper party hat on the counter",
  },
  {
    id: "p2-retirement",
    src: V("plate-2-debt-ceiling-and-retirement.jpg"),
    box: [98, 1960, 1619, 1141],
    caption:
      "SWDINK cartoon, SWDDREW with a martini and SWDMANGO with an old fashioned at the bar counter of the " +
      "barroom, the TV above the back bar showing a RETIREMENT PLANNING news segment, a chalkboard reading " +
      "TODAY'S SPECIAL LOW SCORES AND COLD DRINKS, a nut bowl between them",
  },
  {
    id: "p3-national-mall",
    src: V("plate-3-national-mall.jpg"),
    box: [788, 69, 2206, 1600],
    caption:
      "SWDINK cartoon, SWDDREW with a martini and SWDMANGO with an old fashioned at the bar counter of the " +
      "barroom, the TV showing DCN live news of National Mall renovation troubles, a chalkboard special " +
      "reading NANOBUBBLES $17.76, the mirrored window sign",
  },
  {
    id: "p4-imported-beer",
    src: V("plate-4-nineteenth-hole-and-tariffs.jpg"),
    box: [6, 6, 706, 784],
    caption:
      "SWDINK cartoon, SWDDREW with a martini and SWDMANGO with an old fashioned at the bar counter of the " +
      "barroom, a chalkboard reading TODAY'S SPECIAL IMPORTED BEER $8 PATRIOTIC IMPORTED BEER $12, the " +
      "mirrored window sign",
  },
  {
    id: "p4-globe-tariffs",
    src: V("plate-4-nineteenth-hole-and-tariffs.jpg"),
    box: [728, 6, 762, 784],
    caption:
      "SWDINK cartoon, SWDDREW with a martini and SWDMANGO with an old fashioned at the bar counter of the " +
      "barroom, a large globe covered in hanging price tags standing on the back bar, a nut bowl between them",
  },
  {
    id: "p4-nineteenth-hole",
    src: V("plate-4-nineteenth-hole-and-tariffs.jpg"),
    box: [13, 986, 1543, 1047],
    caption:
      "SWDINK cartoon, SWDDREW in a golf visor and SWDMANGO in a white polo shirt and cap at the outdoor 19th " +
      "hole terrace of a golf course, rolling fairways with distant golfers and carts behind them, SWDMANGO " +
      "holding an old fashioned, a golf bag with a towel reading FORE NOT SO FAST, a framed sign reading THE " +
      "SWINGING DOOR 19TH HOLE",
  },
  {
    id: "drew-security-bust",
    src: V("drew-reference.jpg"),
    box: null,
    caption:
      "SWDINK cartoon, SWDDREW in an airport security line holding a checklist reading REMOVE BELT SHOES " +
      "WATCH, human travelers and a metal detector behind him",
  },
  {
    id: "mango-news-panel",
    src: V("mango-reference.jpg"),
    box: [110, 580, 2770, 3390],
    caption:
      "SWDINK cartoon, SWDMANGO alone with an old fashioned at the bar counter of the barroom, the TV above " +
      "showing a financial news anchor, the mirrored window sign, a small sign reading NO CHASING YOUR BALLS " +
      "IN HERE",
  },
  {
    id: "abby-portrait",
    src: V("abby-face-reference.jpg"),
    box: null,
    caption: "SWDINK cartoon, SWDABBY close portrait behind the bar of the barroom, bottles and a framed sign behind her",
  },
];

// --- The studio variants (only the ones present on disk train; QC decides
// what stays committed). Keys are the run ids from the variant plan.
const VARIANT_CAPTIONS = {
  "harrington-duo-barroom":
    "SWDINK cartoon, SWDDREW with a martini and SWDMANGO with an old fashioned seated at a round marble " +
    "table in the barroom, the chalkboard martini menu and bottle shelves behind them, the window sign " +
    "reading THE SWINGING DOOR",
  "harrington-abby-barroom":
    "SWDINK cartoon, SWDABBY in a satin evening gown standing in the barroom among stools and bottle " +
    "shelves, a chalkboard reading THE HOUSE PROTECTS ITS OWN",
  "harrington-abby2-barroom":
    "SWDINK cartoon, SWDABBY behind the marble bar counter of the barroom, one hand on the marble, bottles " +
    "and good glassware behind her",
  "harrington-abby-working-barroom":
    "SWDINK cartoon, SWDABBY pouring from a bottle into a rocks glass behind the marble bar counter of the " +
    "barroom, bottles and good glassware behind her",
  "harrington-abby-chalk-barroom":
    "SWDINK cartoon, SWDABBY in an off-shoulder gown behind the bar of the barroom, bottle shelves and " +
    "cabinets behind her",
  "harrington-drew-solo-barroom":
    "SWDINK cartoon, SWDDREW alone on a stool at the marble bar counter of the barroom, a martini before " +
    "him, bottle shelves and a framed sign reading THE SWINGING DOOR across the counter",
  "harrington-drew-golf-golf-course":
    "SWDINK cartoon, SWDDREW in a golf visor holding a martini at the 19th hole terrace of a golf course, " +
    "fairways with distant golfers and a cart behind him",
  "harrington-mango-solo-barroom":
    "SWDINK cartoon, SWDMANGO alone with an old fashioned at the bar counter of the barroom, the TV above " +
    "the back bar playing the news, the mirrored window sign",
  "harrington-mango-golf-golf-course":
    "SWDINK cartoon, SWDMANGO in a white polo shirt and pale cap holding an old fashioned at the 19th hole " +
    "terrace of a golf course, fairways with distant golfers and a cart behind him, his golf bag at the edge",
};

const draft = process.argv.includes("--draft");
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

async function finish(input, name) {
  // Natural aspect, downscale-only to <=1024 on the long edge, grayscale,
  // normalise so photographed paper and digital paper land on the same white.
  await sharp(input)
    .grayscale()
    .normalise()
    .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 92 })
    .toFile(path.join(outDir, `${name}.jpg`));
}

const entries = [];
for (const p of PLATES) {
  let img = sharp(p.src);
  if (p.box) {
    const [left, top, width, height] = p.box;
    img = img.extract({ left, top, width, height });
  }
  await finish(await img.toBuffer(), p.id);
  fs.writeFileSync(path.join(outDir, `${p.id}.txt`), `${p.caption}\n`);
  entries.push({ id: p.id, caption: p.caption });
}

let missingVariants = [];
for (const [id, cap] of Object.entries(VARIANT_CAPTIONS)) {
  const png = path.join(variantsDir, `${id}.png`);
  if (!fs.existsSync(png)) {
    missingVariants.push(id);
    continue;
  }
  await finish(png, id);
  fs.writeFileSync(path.join(outDir, `${id}.txt`), `${cap}\n`);
  entries.push({ id, caption: cap });
}

// --- Gates.
const count = (token) => entries.filter((e) => e.caption.includes(token)).length;
const barroom = entries.filter((e) => e.caption.includes("barroom")).length;
const placed = entries.length; // every v2 caption names a setting
const tokens = { SWDDREW: count("SWDDREW"), SWDMANGO: count("SWDMANGO"), SWDABBY: count("SWDABBY") };
console.log(`\n${entries.length} images — SWDDREW ${tokens.SWDDREW}, SWDMANGO ${tokens.SWDMANGO}, SWDABBY ${tokens.SWDABBY}`);
console.log(`barroom ${barroom}/${placed} (${Math.round((100 * barroom) / placed)}%)`);
if (missingVariants.length) console.log(`variants not yet on disk: ${missingVariants.join(", ")}`);

let ok = true;
if (entries.length < 18) {
  console.error(`GATE: only ${entries.length} images — the v2 set trains on at least 18.`);
  ok = false;
}
if (tokens.SWDABBY < 5) {
  console.error(`GATE: SWDABBY appears in only ${tokens.SWDABBY} captions — she needs at least 5 or her token stays mush.`);
  ok = false;
}
if (barroom / placed > 0.8) {
  console.error("GATE: the barroom passed 80% of the set — the bar would bake into the tokens. Add away images.");
  ok = false;
}

if (draft) {
  console.error("\n--draft: images written for inspection, no archive. Do not train on this.");
  process.exit(ok ? 0 : 1);
}
if (!ok) process.exit(1);

const archive = path.join(here, "training-set.zip");
fs.rmSync(archive, { force: true });
execFileSync("python3", [
  "-c",
  "import sys,zipfile,pathlib\n" +
    "src=pathlib.Path(sys.argv[1]); dst=sys.argv[2]\n" +
    "with zipfile.ZipFile(dst,'w',zipfile.ZIP_DEFLATED) as z:\n" +
    "    for p in sorted(src.iterdir()):\n" +
    "        if p.suffix in ('.jpg','.txt'): z.write(p, p.name)\n",
  outDir,
  archive,
]);
const size = (fs.statSync(archive).size / 1024 / 1024).toFixed(1);
console.log(`\nwrote ${path.relative(repoRoot, archive)} (${size} MB) — commit it, then /api/backroom/train?start=1`);
