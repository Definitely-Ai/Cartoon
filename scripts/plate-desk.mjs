// The plate desk, on the studio machine. See canon/plates/README.md.
//
// The bar is drawn ONCE per cast — a plate with the television off and the
// chalkboard wiped — and every cartoon is assembled from it in code. This is
// the local twin of app/api/backroom/plate/route.ts: the same prompts, the
// same paste-by-region and the same typesetting (lib/plates.ts), but the
// drawing goes to the FREE LOCAL MODEL on the RTX 4090 through AuraVision,
// and every file lands in this checkout instead of a GitHub commit.
//
//   node scripts/plate-desk.mjs speaker --cast duo --who barclay [--rolls 2] [--seed 7] [--full]
//   node scripts/plate-desk.mjs speaker --cast duo --who barclay --from canon/plates/work/<raw>.png
//                                       (paste an existing raw drawing, draw nothing)
//   node scripts/plate-desk.mjs still   --footage "a stock chart plunging" [--rolls 2] [--seed 7] [--full]
//   node scripts/plate-desk.mjs blank   --cast duo|trio [--source <panel.png>] [--rolls 2] [--seed 7] [--full]
//   node scripts/plate-desk.mjs approve --cast duo [--who drew] --file <name under canon/plates/work/>
//   node scripts/plate-desk.mjs compose --cast duo --who drew [--still <name>] --chyron ".." --board "A|B" --caption ".." [--time "1:14 PM ET"]
//   node scripts/plate-desk.mjs gag     --plan <gags.json> [--out <dir>] [--only 1,3] [--full]
//
// Plate edits (speaker, blank) draw with PLATE_MODEL in fast mode (--full to
// change); stills draw with STILL_MODEL in full mode from the text alone
// (--fast, --style <png> to change). Both default to local/sensenova-u1.5;
// --model <local/...> overrides for one run.
// Outputs, like the desk route's: canon/plates/work/<stamp>-<cast>-<who>-raw.png
// (what the model drew), ...-<who>.png (only the face boxes pasted into the
// plate), and a .txt beside each with model, seed, dials and the exact prompt.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const command = argv[0] && !argv[0].startsWith("--") ? argv[0] : "";
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback;
};
if (!command || flag("help")) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).map((l) => l.slice(3)).join("\n"));
  process.exit(command ? 0 : 2);
}

// This script runs on the studio machine, so AuraVision is on loopback.
process.env.AURAVISION_URL ??= "http://127.0.0.1:8000";
// Two jobs, two settings (the 2026-09-02 bake-off, canon/plates/README.md).
// A PLATE EDIT — a speaker variant or a blank plate, where the picture must
// stay the picture — goes to SenseNova-U1.5 in its 8-step FAST mode: that is
// the mode that keeps the plate's own hatching, so the pasted face box has
// no seam (its full cfg-4 mode drifts to a coarser pen and shows as a
// patch). A TV STILL, drawn from nothing, goes to SenseNova in FULL mode
// with NO reference: bold, text-free engravings in about twelve seconds
// (with a style swatch attached it invents the cast inside the footage;
// its fast mode gives faint pencil). --model overrides the model for one
// run; --full / --fast override the mode.
const PLATE_MODEL = opt("model", process.env.PLATE_MODEL || "local/sensenova-u1.5");
const STILL_MODEL = opt("model", process.env.STILL_MODEL || "local/sensenova-u1.5");
const FAST_EDIT = !flag("full");
const FAST_STILL = flag("fast");
let MODEL = PLATE_MODEL;
let FAST = FAST_EDIT;
const rolls = Math.max(1, Number(opt("rolls", 1)) || 1);
const firstSeed = opt("seed") !== undefined ? Number(opt("seed")) : undefined;
const seedFor = (r) => (firstSeed !== undefined ? firstSeed + r : Math.floor(Math.random() * 2 ** 31));

// ------------------------------------------------------------ compile TS
// lib/plates.ts and lib/generate.ts are compiled to a scratch directory and
// used as-is, exactly as scripts/draw-local.mjs does; the only swap is that
// repo files are read from this checkout instead of the GitHub API.
const build = path.join(repoRoot, "node_modules", ".cache", "swd-plate-desk");
const sources = ["lib/plates.ts", "lib/generate.ts", "lib/writersRoom.ts", "lib/dialogue.ts", "lib/auravision.ts"];
const built = path.join(build, "lib", "plates.js");
const stale = !fs.existsSync(built) || sources.some((f) => fs.statSync(path.join(repoRoot, f)).mtimeMs > fs.statSync(built).mtimeMs);
if (stale) {
  fs.rmSync(build, { recursive: true, force: true });
  fs.mkdirSync(build, { recursive: true });
  fs.writeFileSync(
    path.join(build, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        outDir: build, rootDir: repoRoot, module: "commonjs", moduleResolution: "node", target: "es2022",
        esModuleInterop: true, skipLibCheck: true, baseUrl: repoRoot, paths: { "@/*": ["*"] },
      },
      files: sources.map((f) => path.join(repoRoot, f)),
    })
  );
  execFileSync("npx", ["tsc", "-p", path.join(build, "tsconfig.json")], { cwd: repoRoot, stdio: "inherit", shell: process.platform === "win32" });
  for (const name of fs.readdirSync(path.join(build, "lib"))) {
    if (!name.endsWith(".js")) continue;
    const file = path.join(build, "lib", name);
    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/require\("@\/lib\//g, 'require("./'));
  }
  fs.writeFileSync(path.join(build, "package.json"), JSON.stringify({ type: "commonjs" }));
}
const require = createRequire(import.meta.url);
const githubPublish = require(path.join(build, "lib", "githubPublish.js"));
const abs = (p) => (path.isAbsolute(p) ? p : path.join(repoRoot, p));
githubPublish.readRepoFile = async (filePath) => {
  const full = abs(filePath);
  return fs.existsSync(full) ? { bytes: fs.readFileSync(full), sha: "local" } : null;
};
const P = require(path.join(build, "lib", "plates.js"));
const { generateCartoonArt } = require(path.join(build, "lib", "generate.js"));

// --plates <dir>: work from a CANDIDATE plate set (a folder holding <cast>.png,
// <cast>-<who>.png and <cast>.json) instead of canon/plates, so a proposed
// change to the plate can be tried on real gags before anyone approves it.
const PLATES = opt("plates");
const canonPaths = { plate: P.platePath, speaker: P.speakerPlatePath, spec: P.plateSpecPath };
const platePath = (cast) => (PLATES ? `${PLATES}/${cast}.png` : canonPaths.plate(cast));
const speakerPlatePath = (cast, who) => (PLATES ? `${PLATES}/${cast}-${who}.png` : canonPaths.speaker(cast, who));
const plateSpecPath = (cast) => (PLATES ? `${PLATES}/${cast}.json` : canonPaths.spec(cast));

// ---------------------------------------------------------------- drawing
const WORK = "canon/plates/work";
const STYLE_SWATCH = "canon/plates/src/style-swatch.png";
const stamp = () => new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z").replace("T", "-");
const slugOf = (t, n = 6) => (String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").split("-").filter(Boolean).slice(0, n).join("-") || "x");
// The desk's prompts address references as @image1; the local models are
// told "Picture 1", which is how the LOCAL fence of the master prompt speaks.
const localize = (prompt) => prompt.replace(/@image(\d)/g, "Picture $1");
// Used only in full mode (at cfg 1 the negative branch is inert).
const NEGATIVE = "text, letters, words, lettering, writing, logo, watermark, caption, speech balloon, colour, photograph, blurry";

async function draw(prompt, refs, { width, height, seed, tag }) {
  const t0 = Date.now();
  const art = await generateCartoonArt({
    prompt, characters: [], barScene: false, model: MODEL, seed, fast: FAST, tag,
    sampling: { width, height, negative_prompt: NEGATIVE },
    // A still is drawn from the text alone; generate.ts refuses an empty
    // reference list unless told that is the point.
    noReferences: refs.length === 0,
    references: refs.map((p) => ({ path: p })),
  });
  return { art, seconds: Math.round((Date.now() - t0) / 1000) };
}
function note(file, { prompt, refs, seed, seconds, extra = "" }) {
  fs.writeFileSync(file, `${MODEL}\nMODE=${FAST ? "fast" : "full"}\nSEED=${seed}\nSECONDS=${seconds}\nREFERENCES=${refs.join(" ; ")}\n${extra}\n${prompt}\n`);
}
const readSpec = (cast) => JSON.parse(fs.readFileSync(abs(plateSpecPath(cast)), "utf8"));
const mustExist = (p, why) => {
  if (!fs.existsSync(abs(p))) throw new Error(`${p} is missing: ${why}`);
  return abs(p);
};
const castOf = (characters) => (characters.map((c) => String(c).toLowerCase()).includes("abby") ? "trio" : "duo");

// One speaker variant: the model draws the whole plate again with one mouth
// open; only the speaker's mouth box and the listeners' eye boxes are taken.
async function speaker({ cast, who, from }) {
  if (!P.CAST[cast]?.includes(who)) throw new Error(`--who must be one of ${P.CAST[cast]?.join(", ")}`);
  const spec = readSpec(cast);
  const plateFile = mustExist(platePath(cast), "approve a blank plate first");
  const plate = fs.readFileSync(plateFile);
  const boxes = [spec.faces[who].mouth, ...P.CAST[cast].filter((c) => c !== who).map((c) => spec.faces[c].eyes)];
  const prompt = localize(P.speakerPrompt(cast, who));
  fs.mkdirSync(abs(WORK), { recursive: true });
  const out = [];
  for (let r = 0; r < rolls; r++) {
    const name = `${stamp()}-${cast}-${who}${rolls > 1 ? `-r${r + 1}` : ""}`;
    let raw;
    let seed = "-";
    let seconds = 0;
    if (from) {
      raw = fs.readFileSync(abs(from));
    } else {
      seed = seedFor(r);
      ({ art: raw, seconds } = await draw(prompt, [platePath(cast)], { width: spec.width, height: spec.height, seed, tag: `${cast}-${who}` }));
    }
    const fitted = await P.toPlateSize(raw, spec);
    const pasted = await P.pasteRegions(plate, fitted, boxes);
    fs.writeFileSync(abs(`${WORK}/${name}-raw.png`), fitted);
    fs.writeFileSync(abs(`${WORK}/${name}.png`), pasted);
    note(abs(`${WORK}/${name}.txt`), { prompt, refs: [platePath(cast)], seed, seconds, extra: `BOXES=${JSON.stringify(boxes)}${from ? `\nFROM=${from}` : ""}` });
    console.log(`${WORK}/${name}.png  seed ${seed}  ${seconds}s`);
    out.push(`${WORK}/${name}.png`);
    if (from) break;
  }
  return out;
}

// One TV still: engraved footage at 3:2, no words, drawn from the text alone.
// --style <png> attaches a picture as Picture 1 for the style (the swatch in
// canon/plates/src/ is a character-free band of the plate); Qwen wants one,
// SenseNova is better without.
async function still({ footage, style, name }) {
  if (!footage) throw new Error("--footage <what the screen shows> is required");
  const refs = style && style !== "none" && fs.existsSync(abs(style)) ? [style] : [];
  const prompt =
    (refs.length ? "Picture 1 shows the drawing style and nothing else: an antique steel engraving, fine pen crosshatching and stippling, black and white. Draw in exactly that style.\n" : "") +
    localize(P.tvStillPrompt(footage));
  fs.mkdirSync(abs(`${WORK}/stills`), { recursive: true });
  const out = [];
  MODEL = STILL_MODEL;
  FAST = FAST_STILL;
  for (let r = 0; r < rolls; r++) {
    const seed = seedFor(r);
    const file = `${WORK}/stills/${name || `${stamp()}-${slugOf(footage, 8)}`}${rolls > 1 ? `-r${r + 1}` : ""}.png`;
    const { art, seconds } = await draw(prompt, refs, { width: 1200, height: 800, seed, tag: "still" });
    fs.writeFileSync(abs(file), art);
    note(abs(file.replace(/\.png$/, ".txt")), { prompt, refs, seed, seconds, extra: `FOOTAGE=${footage}` });
    console.log(`${file}  seed ${seed}  ${seconds}s`);
    out.push(file);
  }
  MODEL = PLATE_MODEL;
  FAST = FAST_EDIT;
  return out;
}

// A blank plate: the founder's closest panel redrawn with the screen off and
// the slate wiped (duo), or the approved duo plate plus Abby (trio).
async function blank({ cast, source }) {
  let refs;
  let prompt;
  if (cast === "duo") {
    refs = [source || P.sourcePlatePath("duo"), "canon/vision/staging-plate.jpg"];
    prompt = localize(P.blankDuoPrompt());
  } else {
    refs = [source || platePath("duo"), "canon/vision/studies/abby.png"];
    prompt = localize(P.blankTrioPrompt());
  }
  refs.forEach((p) => mustExist(p, "a blank plate needs it as a reference"));
  fs.mkdirSync(abs(WORK), { recursive: true });
  const out = [];
  for (let r = 0; r < rolls; r++) {
    const seed = seedFor(r);
    const file = `${WORK}/${stamp()}-${cast}-blank${rolls > 1 ? `-r${r + 1}` : ""}.png`;
    const { art, seconds } = await draw(prompt, refs, { width: 1200, height: 1800, seed, tag: `${cast}-blank` });
    fs.writeFileSync(abs(file), await P.toPlateSize(art, { width: 1200, height: 1800 }));
    note(abs(file.replace(/\.png$/, ".txt")), { prompt, refs, seed, seconds });
    console.log(`${file}  seed ${seed}  ${seconds}s`);
    out.push(file);
  }
  return out;
}

function approve({ cast, who, file }) {
  if (!file) throw new Error("--file <name under canon/plates/work/> is required");
  const src = mustExist(file.includes("/") ? file : `${WORK}/${file}`, "nothing to approve");
  const target = who ? speakerPlatePath(cast, who) : platePath(cast);
  fs.copyFileSync(src, abs(target));
  console.log(`approved -> ${target}${who ? "" : `\nnow measure the screen, the slate and each face into ${plateSpecPath(cast)}`}`);
  return target;
}

async function compose({ cast, who, stillFile, chyron, board, caption, time }) {
  if (!caption) throw new Error("--caption is required");
  const spec = readSpec(cast);
  const variant = speakerPlatePath(cast, who);
  const plateFile = fs.existsSync(abs(variant)) ? variant : platePath(cast);
  if (plateFile !== variant) console.warn(`  (no ${who} speaker variant for the ${cast} plate yet; using the base plate. Draw one: plate-desk.mjs speaker --cast ${cast} --who ${who})`);
  const stillBytes = stillFile ? fs.readFileSync(mustExist(stillFile.includes("/") ? stillFile : `${WORK}/stills/${stillFile}`, "no such still")) : null;
  return P.composeGag({ plate: fs.readFileSync(abs(plateFile)), spec, still: stillBytes, chyron: chyron || "", board: board || [], speaker: who, caption, time });
}

// A whole batch from the writers' room shape: {speaker, caption, characters,
// tv, tvPicture, board}. One still per gag (cached by its footage), the rest
// is assembly. Output matches scripts/draw-local.mjs so /review can read it.
async function gagBatch({ planFile, outDir, only }) {
  if (!planFile) throw new Error("--plan <gags.json> is required");
  const raw = JSON.parse(fs.readFileSync(abs(planFile), "utf8"));
  const gags = Array.isArray(raw) ? raw : raw.panels;
  if (!Array.isArray(gags)) throw new Error("the plan must be a JSON array of gags or a plan.json with panels[]");
  const brief = raw.brief || opt("brief", path.basename(planFile, ".json"));
  const batch = raw.batch || `${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15).replace("T", "-")}-${slugOf(brief)}`;
  const dir = abs(outDir || `briefs/${batch}`);
  fs.mkdirSync(path.join(dir, "finished"), { recursive: true });
  const NAMES = { drew: "drew", barclay: "barclay", abby: "abby", mango: "barclay" };
  const panels = [];
  for (const [i, g] of gags.entries()) {
    const n = g.n ?? i + 1;
    const who = NAMES[String(g.speaker || "drew").toLowerCase()] || "drew";
    const characters = Array.from(new Set([...(g.characters || []).map((c) => NAMES[String(c).toLowerCase()]).filter(Boolean), who]));
    const cast = castOf(characters);
    const slug = g.slug || slugOf(g.caption);
    const file = g.file || `${String(n).padStart(2, "0")}-${slug}.png`;
    const boardLines = Array.isArray(g.board) ? g.board : String(g.board || "").split(/\s*[|/]\s*/).filter(Boolean);
    const panel = { n, file, slug, speaker: who, caption: g.caption, characters, cast, tv: g.tv || "", tvPicture: g.tvPicture || "", board: boardLines, still: "" };
    panels.push(panel);
    if (only.length && !only.includes(n)) continue;
    console.log(`\n-- ${file}  [${cast}: ${characters.join(", ")}]  ${who}: "${g.caption}"`);
    try {
      if (panel.tv) {
        const key = slugOf(panel.tvPicture || panel.tv, 8);
        const cached = `${WORK}/stills/${key}.png`;
        if (!fs.existsSync(abs(cached))) await still({ footage: panel.tvPicture || `footage illustrating the headline "${panel.tv}"`, name: key });
        else console.log(`   still from the library: ${cached}`);
        panel.still = cached;
      }
      const out = await compose({ cast, who, stillFile: panel.still || null, chyron: panel.tv, board: panel.board, caption: panel.caption, time: g.time });
      fs.writeFileSync(path.join(dir, "finished", file), out);
      fs.writeFileSync(
        path.join(dir, file.replace(/\.png$/, ".txt")),
        `stills: ${STILL_MODEL}\nPLATE=${cast}/${who}\nSTILL=${panel.still || "-"}\nCAPTION ${who}: "${panel.caption}"\nTV=${panel.tv}\nTV_PICTURE=${panel.tvPicture}\nBOARD=${panel.board.join(" | ")}\n`
      );
      console.log(`   -> ${path.relative(repoRoot, path.join(dir, "finished", file))}`);
    } catch (err) {
      console.log(`   FAILED: ${err instanceof Error ? err.message : err}`);
      panel.error = String(err instanceof Error ? err.message : err);
    }
  }
  fs.writeFileSync(
    path.join(dir, "plan.json"),
    JSON.stringify({ batch, brief, writer: raw.writer || "plate desk", model: STILL_MODEL, quality: `approved plates + ${FAST ? "fast" : "full"} stills`, createdAt: raw.createdAt || new Date().toISOString(), panels }, null, 2)
  );
  console.log(`\nbatch ${path.relative(repoRoot, dir)}: ${panels.filter((p) => !p.error && (!only.length || only.includes(p.n))).length} composed`);
}

// ------------------------------------------------------------------- main
const cast = opt("cast", "duo");
if (!(cast in P.CAST)) {
  console.error("--cast must be duo or trio");
  process.exit(2);
}
const who = (opt("who", "") || "").toLowerCase();
try {
  if (command === "speaker") await speaker({ cast, who, from: opt("from") });
  else if (command === "still") await still({ footage: opt("footage"), style: opt("style") });
  else if (command === "blank") await blank({ cast, source: opt("source") });
  else if (command === "approve") approve({ cast, who: who || undefined, file: opt("file") });
  else if (command === "compose") {
    const out = await compose({
      cast, who: who || "drew", stillFile: opt("still"), chyron: opt("chyron", ""),
      board: (opt("board", "") || "").split("|").filter(Boolean), caption: opt("caption", ""), time: opt("time"),
    });
    fs.mkdirSync(abs(`${WORK}/gags`), { recursive: true });
    const file = `${WORK}/gags/${stamp()}-${cast}-${who || "drew"}-gag.png`;
    fs.writeFileSync(abs(file), out);
    console.log(file);
  } else if (command === "gag") {
    await gagBatch({ planFile: opt("plan"), outDir: opt("out"), only: (opt("only", "") || "").split(",").map(Number).filter((n) => n > 0) });
  } else {
    console.error(`unknown command ${command}`);
    process.exit(2);
  }
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
