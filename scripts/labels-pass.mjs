// Third pass: bottle labels only.
//   node labels-pass.mjs <in.png> <out-prefix> [seeds]
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

const [inPng, outPrefix, seedList] = process.argv.slice(2);
const PROMPT =
  "Picture 1 is a finished single-panel cartoon drawn as an antique steel engraving. Make ONE change and keep absolutely " +
  "everything else identical — the two characters, the counter, the drinks, the television and whatever is on its screen, " +
  "the chalkboard, the window, the panelling, the framing and the drawing style:\n" +
  "THE BOTTLE LABELS. Every bottle on the back-bar shelves keeps its shape and its fill level, but its label becomes a PLAIN " +
  "BLANK white paper rectangle with NO letters, NO marks and NO scribbles on it — except exactly two bottles: the leftmost " +
  "bottle on the top shelf, whose label reads BIRDIE on its first line and BOURBON on its second line — BOURBON is spelled B, O, U, R, B, O, N, seven letters — in clean black capitals, and the rightmost bottle " +
  "on the top shelf, whose label reads DIVOT on its first line, DRIVE on its second and GIN on its third — D-I-V-O-T, D-R-I-V-E, G-I-N — in clean black capitals. Those two labels are large, " +
  "correctly spelled and readable; every other label in the picture is empty white paper. No other lettering anywhere " +
  "changes. Black and white only.";

const seeds = (seedList || "1,2").split(",").map(Number);
for (const seed of seeds) {
  const t0 = Date.now();
  try {
    const art = await generateCartoonArt({
      prompt: PROMPT, characters: ["drew", "barclay"], barScene: true, model: MODEL, seed, fast: true, tag: "labels", sampling: process.env.SAMPLING ? JSON.parse(process.env.SAMPLING) : undefined,
      references: [{ path: path.resolve(inPng) }],
    });
    const file = `${outPrefix}.s${seed}.png`;
    fs.writeFileSync(file, art);
    console.log(`seed ${seed} → ${file} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  } catch (e) {
    console.log(`seed ${seed} FAILED: ${e.message}`);
  }
}
console.log("LABELS DONE");
