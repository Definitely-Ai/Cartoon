// Second pass: edit ONLY the signage on a drawn panel — television, chalkboard,
// bottle labels — with the panel itself as Picture 1. An edit model does one
// precise change far better than a page of changes; the staging pass already
// got the room and the cast right.
//   node signage-pass.mjs <in.png> <out-prefix> "<tv chyron>" "<tv picture>" "<board or empty>" [seeds]
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const repoRoot = "Z:/ImageGenerator/Cartoon";
process.env.AURAVISION_URL ??= "http://127.0.0.1:8000";
const build = path.join(repoRoot, "node_modules/.cache/swd-draw-local");
const require = createRequire(import.meta.url);
const gp = require(path.join(build, "lib/githubPublish.js"));
gp.readRepoFile = async (p) => { const f = path.isAbsolute(p) ? p : path.join(repoRoot, p); return fs.existsSync(f) ? { bytes: fs.readFileSync(f), sha: "local" } : null; };
const { generateCartoonArt } = require(path.join(build, "lib/generate.js"));
const MODEL = process.env.MODEL || "local/qwen-image-edit-2511-q6";

const [inPng, outPrefix, tv, tvPicture, board, seedList] = process.argv.slice(2);
if (!inPng || !outPrefix) { console.error("usage: signage-pass.mjs <in.png> <out-prefix> <tv> <tvPicture> <board> [seeds]"); process.exit(2); }

const edits = [];
edits.push(
  tv
    ? `THE TELEVISION — the large dark rectangle high on the back wall, centred above the bottle shelves — is SWITCHED ON. ` +
      `Inside that rectangle and nowhere else, draw ${tvPicture || "the footage this headline would show"} in the same engraved ` +
      `style, and across the bottom of the screen a lower-third chyron band reading exactly "${tv}" in bold capitals, with a ` +
      `small CNBC bug and a LIVE tag at the band's left end and a small time stamp at its right end. No other words on the screen.`
    : "THE TELEVISION stays switched off: plain dark glass with nothing on it."
);
edits.push(
  board
    ? `THE CHALKBOARD — the dark board in the wooden frame to the right of the television — is lettered in hand-drawn chalk ` +
      `capitals, exactly and only: "${board}". Correctly spelled, large and legible, the whole board inside the picture.`
    : "THE CHALKBOARD stays a blank wiped slate with no marks."
);
edits.push(
  "THE BOTTLE LABELS: exactly TWO labels carry lettering — BIRDIE BOURBON on the leftmost bottle of the top shelf and " +
    "DIVOT DRIVE GIN on the rightmost bottle of the top shelf, each large, legible and correctly spelled. EVERY OTHER LABEL " +
    "is a plain blank paper panel with no letters or marks on it at all. The bottles stay filled to different levels."
);
edits.push("THE WINDOW at the far left shows only building faces and daylight beyond the glass, with the mirrored name THE SWINGING DOOR; no vehicles, no animals, no people outside.");

const PROMPT =
  "Picture 1 is a finished single-panel cartoon drawn as an antique steel engraving. Picture 2 shows the same bar's back " +
  "wall with its television, chalkboard and labelled bottles as they are meant to look. Make ONLY the following changes to " +
  "Picture 1 and keep absolutely everything else identical — the two characters, their faces, poses and clothes, the " +
  "counter, the drinks, the nut bowl, the panelling, the sconces, the framing and the drawing style:\n" +
  edits.map((e, i) => `${i + 1}. ${e}`).join("\n") +
  "\nAll lettering is real, correctly spelled English, cleanly drawn and readable at a glance; there is no other lettering " +
  "anywhere in the picture. Black and white only.";

const seeds = (seedList || "1,2").split(",").map(Number);
for (const seed of seeds) {
  const t0 = Date.now();
  try {
    const art = await generateCartoonArt({
      prompt: PROMPT, characters: ["drew", "barclay"], barScene: true, model: MODEL, seed, fast: process.env.FAST !== "0",
      sampling: process.env.SAMPLING ? JSON.parse(process.env.SAMPLING) : undefined, tag: "signage",
      references: [{ path: path.resolve(inPng) }, { path: "canon/vision/staging-plate.jpg", box: [0, 0, 1024, 1064] }],
    });
    const file = `${outPrefix}.s${seed}.png`;
    fs.writeFileSync(file, art);
    console.log(`seed ${seed} → ${file} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  } catch (e) {
    console.log(`seed ${seed} FAILED: ${e.message}`);
  }
}
console.log("SIGNAGE DONE");
