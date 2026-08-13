// Prebuild asset copy — runs automatically before `next build` and `next dev`
// (npm pre-scripts). The repo's filesystem is the CMS: cartoons live in
// /cartoons/<YYYY-MM-DD-slug>/cartoon.png, and this script copies each one to
// site/public/cartoons/<folder-name>.png so the static site can serve it.
// The folder name IS the slug IS the public filename — never date-stripped,
// because date-stripped slugs collide across dates.
//
// It also copies any canon model-sheet images (canon/characters/*/[name].png)
// to site/public/canon/<character>/ so the characters pages can show them the
// moment they exist. Both destination folders are gitignored; they are
// regenerated on every build.
//
// No dependencies — plain node:fs, so it runs before npm install finishes
// installing anything heavier.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const cartoonsSrc = path.join(repoRoot, "cartoons");
const canonSrc = path.join(repoRoot, "canon", "characters");
const cartoonsDest = path.resolve(here, "..", "public", "cartoons");
const canonDest = path.resolve(here, "..", "public", "canon");

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
      fs.copyFileSync(path.join(dayDir, file), path.join(dest, file));
      optionFiles++;
    }
  }
}

console.log(`prebuild: copied ${copied} cartoon(s), ${sheets} model sheet(s), ${optionFiles} option proof(s)`);
