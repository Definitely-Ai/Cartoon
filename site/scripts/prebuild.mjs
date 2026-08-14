// Prebuild asset copy — runs automatically before `next build` and `next dev`
// (npm pre-scripts). The repo's filesystem is the CMS: cartoons live in
// /cartoons/<YYYY-MM-DD-slug>/cartoon.png, and this script copies each one to
// site/public/cartoons/<folder-name>.png so the static site can serve it.
// The folder name IS the slug IS the public filename — never date-stripped,
// because date-stripped slugs collide across dates.
//
// It also copies any canon model-sheet images (canon/characters/*/[name].png)
// to site/public/canon/<character>/ so the cast page can show them the moment
// they exist. Both destination folders are gitignored; they are
// regenerated on every build.
//
// Asset copying and regression checks use Node built-ins. The final social-card
// refresh uses the site's Sharp dependency through generate-brand-assets.mjs.

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const cartoonsSrc = path.join(repoRoot, "cartoons");
const canonSrc = path.join(repoRoot, "canon", "characters");
const cartoonsDest = path.resolve(here, "..", "public", "cartoons");
const canonDest = path.resolve(here, "..", "public", "canon");

// Fingerprints of the retired SVG mock cartoons, blank proof cards, and the
// clipped social card. Keeping the hashes here turns a visual regression into
// a loud build error instead of silently republishing the old demo art.
const retiredAssetHashes = new Set([
  "f14d9f61788021b6d3a33d5569874517d9faba483bb6bf71a66d574d91617c4e",
  "6067d6bb7a648661285caa09bc635f3a68229537532d751cf746a66bdcbe62bf",
  "fdb916c9dc522fcb8c80aa4ac158d07ad15d1f9830f3d35f6b1af1c2e288b554",
  "e38c6f7b29018892104cc423df1a0c989a62ee67b81573c02c06335b88fac9c4",
  "07c6e4cc67acb30296cc4d0770d5c9f94b4f1081cbd01f81881ed56f1c5db749",
  "d37792f9e546fba7d68268d57a8f7087afb05352cf16f31943657337497eb975",
  "6b9ead45c5b62a1cedc5386263c8117812680794c015669739821747998143b1",
  "a9370ada4e68d31d147aaf60db8e6be42628a52211a225fc9161c5a3944f6980",
  "ea7b00b6aa077574f4bc6ba29923f53e419bcd1b5084c2098f687042c4c742d7",
  "90074a7dec713280c1ab2fabb79b51708a8e575152bdc316ecbfbb7b19e5c9e3",
]);

function sha256(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function rejectRetiredAsset(file) {
  if (!retiredAssetHashes.has(sha256(file))) return;
  console.error(
    `prebuild: retired sample artwork detected at ${path.relative(repoRoot, file)}.\n` +
      "Restore the illustrated replacement; the old generated placeholders are intentionally blocked."
  );
  process.exit(1);
}

function requireDialogueArtwork(file) {
  const header = Buffer.alloc(24);
  const handle = fs.openSync(file, "r");
  try {
    fs.readSync(handle, header, 0, header.length, 0);
  } finally {
    fs.closeSync(handle);
  }
  const width = header.readUInt32BE(16);
  const height = header.readUInt32BE(20);
  if (height === width + 264) return;
  console.error(
    `prebuild: dialogue is not embedded in ${path.relative(repoRoot, file)}.\n` +
      "Cartoons must use the finished square-panel-plus-dialogue format; run `npm run dialogue` to create or refresh it."
  );
  process.exit(1);
}

if (!fs.existsSync(cartoonsSrc)) {
  console.error(
    `prebuild: cannot find ${cartoonsSrc}.\n` +
      `The site expects the full repo checkout (it reads /cartoons and /canon above /site).\n` +
      `On Vercel: set Root Directory to "site" AND enable "Include source files outside of the Root Directory in the Build Step".`
  );
  process.exit(1);
}

fs.rmSync(cartoonsDest, { recursive: true, force: true });
fs.mkdirSync(cartoonsDest, { recursive: true });

let copied = 0;
for (const entry of fs.readdirSync(cartoonsSrc, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === "_TEMPLATE") continue;
  const png = path.join(cartoonsSrc, entry.name, "cartoon.png");
  if (!fs.existsSync(png)) continue; // data layer reports the missing file with a clear error
  rejectRetiredAsset(png);
  requireDialogueArtwork(png);
  fs.copyFileSync(png, path.join(cartoonsDest, `${entry.name}.png`));
  copied++;
}

fs.rmSync(canonDest, { recursive: true, force: true });
let sheets = 0;
if (fs.existsSync(canonSrc)) {
  for (const character of fs.readdirSync(canonSrc, { withFileTypes: true })) {
    if (!character.isDirectory()) continue;
    const dir = path.join(canonSrc, character.name);
    for (const file of fs.readdirSync(dir)) {
      if (!/\.(png|jpg|jpeg|webp)$/i.test(file)) continue;
      const dest = path.join(canonDest, character.name);
      fs.mkdirSync(dest, { recursive: true });
      fs.copyFileSync(path.join(dir, file), path.join(dest, file));
      sheets++;
    }
  }
}

// The Back Room's inbox: option artwork is copied under /backroom-assets,
// which middleware gates behind the owner's login — drafts never leak to
// the public side.
const optionsSrc = path.join(repoRoot, "options");
const optionsDest = path.resolve(here, "..", "public", "backroom-assets", "options");
fs.rmSync(optionsDest, { recursive: true, force: true });
let optionFiles = 0;
if (fs.existsSync(optionsSrc)) {
  for (const day of fs.readdirSync(optionsSrc, { withFileTypes: true })) {
    if (!day.isDirectory() || !/^\d{4}-\d{2}-\d{2}$/.test(day.name)) continue;
    const dayDir = path.join(optionsSrc, day.name);
    for (const file of fs.readdirSync(dayDir)) {
      if (!/^option-\d+\.png$/.test(file)) continue;
      const dest = path.join(optionsDest, day.name);
      fs.mkdirSync(dest, { recursive: true });
      const source = path.join(dayDir, file);
      rejectRetiredAsset(source);
      requireDialogueArtwork(source);
      fs.copyFileSync(source, path.join(dest, file));
      optionFiles++;
    }
  }
}

const ogImage = path.resolve(here, "..", "public", "og.png");
if (fs.existsSync(ogImage)) rejectRetiredAsset(ogImage);

// Keep the social card synchronized with the newest published edition. This
// import runs the deterministic Sharp/SVG generator as part of every build.
await import("./generate-brand-assets.mjs");

console.log(`prebuild: copied ${copied} cartoon(s), ${sheets} model sheet(s), ${optionFiles} option proof(s)`);
