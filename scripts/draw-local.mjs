// Draw a batch on the studio's own GPU, straight from the repo checkout — no
// GitHub commit, no Vercel function, no five-minute budget.
//
//   node scripts/draw-local.mjs --plan <gags.json> [options]
//
//   --plan <file>     a JSON array of gags in the writers' room shape
//                     (speaker, caption, characters, action, tv, tvPicture,
//                     board, away, signs, turn), or an existing plan.json
//   --brief "<text>"  the founder's words that head the batch (default: the
//                     plan's brief, else the file name)
//   --out <dir>       batch folder (default briefs/<stamp>-<slug-of-brief>)
//   --only 1,3,5      draw only these panel numbers
//   --rolls N         draw N candidates per panel (seeds differ); 1 by default
//   --seed N          first seed (rolls count up from it); random when absent
//   --fast            Lightning mode: 8 steps, cfg 1 — for roughing out
//   --steps N         sampler steps (local model; default 40, or 8 with --fast)
//   --cfg N           classifier-free guidance (default 4, or 1 with --fast)
//   --shift N         ModelSamplingAuraFlow shift (default 3)
//   --no-neg-refs     keep the reference pictures OUT of the negative branch,
//                     so guidance amplifies the references as well as the text
//   --model <id>      image model id (default: IMAGE_MODEL or the house default)
//   --dry             assemble prompts and reference lists, draw nothing
//
// Output, per panel, in the batch folder — the same shape the brief route
// writes so /review and read-ratings can read it:
//   NN-slug.png          the art, cropped at the counter (roll 1)
//   NN-slug.rK.png       further rolls, when --rolls > 1
//   NN-slug.txt          model, settings, caption, and the exact prompt sent
//   finished/NN-slug.png the art with the caption typeset beneath it — what
//                        the founder actually looks at
//   plan.json            the batch plan
//
// HOW IT REUSES PRODUCTION. lib/generate.ts, lib/writersRoom.ts and
// lib/dialogue.ts are compiled to a scratch directory (as check-prompt-assembly
// does) and imported as-is; the only thing swapped is githubPublish.readRepoFile,
// which reads from this checkout instead of the GitHub API. The prompt, the
// references, the crop and the typesetting are therefore exactly production's.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ------------------------------------------------------------- arguments
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback;
};

const planFile = opt("plan");
if (!planFile) {
  console.error("Which gags? node scripts/draw-local.mjs --plan <gags.json>");
  process.exit(2);
}
const only = (opt("only", "") || "").split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
const rolls = Math.max(1, Number(opt("rolls", 1)) || 1);
const firstSeed = opt("seed") !== undefined ? Number(opt("seed")) : undefined;
const fast = flag("fast");
const dry = flag("dry");
if (opt("model")) process.env.IMAGE_MODEL = opt("model");
// This script runs on the studio machine itself, so talk to AuraVision over
// loopback: the Tailscale address (lib/auravision.ts's default, for the
// deployed site) dropped a long-running request mid-batch once.
process.env.AURAVISION_URL ??= "http://127.0.0.1:8000";
const sampling = {};
if (opt("steps")) sampling.steps = Number(opt("steps"));
if (opt("cfg")) sampling.guidance = Number(opt("cfg"));
if (opt("shift")) sampling.shift = Number(opt("shift"));
if (flag("no-neg-refs")) sampling.negative_refs = false;
const modeLabel = () => {
  const bits = [fast ? "fast (lightning 8-step)" : "full (40 steps, cfg 4)"];
  for (const [k, v] of Object.entries(sampling)) bits.push(`${k}=${v}`);
  return bits.join(" ");
};

// ------------------------------------------------------------ compile TS
const build = path.join(repoRoot, "node_modules", ".cache", "swd-draw-local");
fs.rmSync(build, { recursive: true, force: true });
fs.mkdirSync(build, { recursive: true });
fs.writeFileSync(
  path.join(build, "tsconfig.json"),
  JSON.stringify({
    compilerOptions: {
      outDir: build, rootDir: repoRoot, module: "commonjs", moduleResolution: "node", target: "es2022",
      esModuleInterop: true, skipLibCheck: true, baseUrl: repoRoot, paths: { "@/*": ["*"] },
    },
    files: ["lib/generate.ts", "lib/writersRoom.ts", "lib/dialogue.ts", "lib/auravision.ts"].map((f) => path.join(repoRoot, f)),
  })
);
execFileSync("npx", ["tsc", "-p", path.join(build, "tsconfig.json")], { cwd: repoRoot, stdio: "inherit", shell: process.platform === "win32" });
for (const name of fs.readdirSync(path.join(build, "lib"))) {
  if (!name.endsWith(".js")) continue;
  const file = path.join(build, "lib", name);
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/require\("@\/lib\//g, 'require("./'));
}
fs.writeFileSync(path.join(build, "package.json"), JSON.stringify({ type: "commonjs" }));

const require = createRequire(import.meta.url);
const githubPublish = require(path.join(build, "lib", "githubPublish.js"));
// The one swap: repo files come from this checkout.
githubPublish.readRepoFile = async (filePath) => {
  const full = path.join(repoRoot, filePath);
  if (!fs.existsSync(full)) return null;
  return { bytes: fs.readFileSync(full), sha: "local" };
};
githubPublish.getCanon = async () => fs.readFileSync(path.join(repoRoot, "canon", "MASTER-PROMPT.md"), "utf8");

const { assemblePrompt, generateCartoonArt, imageModel, isMultiRef, isLocalModel, referenceList } = require(path.join(build, "lib", "generate.js"));
const { stage } = require(path.join(build, "lib", "writersRoom.js"));
const { finishCartoon, lintCaption } = require(path.join(build, "lib", "dialogue.js"));

// ------------------------------------------------------------- the plan
const raw = JSON.parse(fs.readFileSync(path.resolve(repoRoot, planFile), "utf8"));
const NAMES = { drew: "Drew", barclay: "Barclay", abby: "Abby", mango: "Barclay" };
const CAST = ["drew", "barclay", "abby"];
const canonCast = (v) => { const k = String(v ?? "").toLowerCase().trim(); const m = k === "mango" ? "barclay" : k; return CAST.includes(m) ? m : null; };

let gags;
let brief;
let existingBatch;
if (Array.isArray(raw)) {
  gags = raw;
  brief = opt("brief", path.basename(planFile, ".json"));
} else if (raw && Array.isArray(raw.panels)) {
  gags = raw.panels;
  brief = opt("brief", raw.brief || path.basename(planFile, ".json"));
  existingBatch = raw.batch;
} else {
  console.error("The plan must be a JSON array of gags or a plan.json with panels[].");
  process.exit(2);
}

const stampNow = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15).replace("T", "-");
const slugOfBrief = (t) => (t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").split("-").filter(Boolean).slice(0, 6).join("-") || "brief");
const batch = existingBatch || `${stampNow}-${slugOfBrief(brief)}`;
const outDir = path.resolve(repoRoot, opt("out", path.join("briefs", batch)));
fs.mkdirSync(path.join(outDir, "finished"), { recursive: true });

const model = imageModel();
const master = fs.readFileSync(path.join(repoRoot, "canon", "MASTER-PROMPT.md"), "utf8");

const panels = gags.map((g, i) => {
  const speaker = canonCast(g.speaker) ?? "drew";
  const listed = (Array.isArray(g.characters) ? g.characters : []).map(canonCast).filter(Boolean);
  const characters = CAST.filter((c) => listed.includes(c) || c === speaker);
  const gag = {
    speaker,
    caption: String(g.caption ?? "").trim().replace(/^["“]|["”]$/g, ""),
    action: String(g.action ?? "").trim(),
    tv: g.away ? "" : String(g.tv ?? "").trim(),
    tvPicture: g.away || !g.tv ? "" : String(g.tvPicture ?? "").trim(),
    board: g.away ? "" : String(g.board ?? "").trim(),
    characters,
    away: String(g.away ?? "").trim(),
    signs: Array.isArray(g.signs) ? g.signs : [],
    turn: g.turn || g.lane || undefined,
  };
  const staged = g.scene && g.slug ? { ...gag, scene: g.scene, slug: g.slug, setting: g.setting ?? "" } : stage(gag);
  const n = g.n ?? i + 1;
  return { ...staged, lane: g.lane, why: g.why, n, file: g.file ?? `${String(n).padStart(2, "0")}-${staged.slug}.png` };
});

const plan = {
  batch,
  brief,
  writer: raw.writer || "claude (writers' room workflow)",
  model,
  quality: modeLabel(),
  createdAt: raw.createdAt || new Date().toISOString(),
  panels,
};
fs.writeFileSync(path.join(outDir, "plan.json"), JSON.stringify(plan, null, 2));
console.log(`batch ${batch}\nmodel ${model}${isLocalModel(model) ? " (local, free)" : ""}\nout   ${path.relative(repoRoot, outDir)}\n`);

// ---------------------------------------------------------------- draw
const queue = panels.filter((p) => only.length === 0 || only.includes(p.n));
let drawn = 0;
const failed = [];
for (const panel of queue) {
  const candidate = { scene: panel.scene, tv: panel.tv, board: panel.board, setting: panel.setting, characters: panel.characters };
  const prompt = assemblePrompt(master, candidate, false, false, isMultiRef(model), model);
  const refs = referenceList(panel.characters, !panel.setting, model);
  const captionLine = `${NAMES[panel.speaker]}: "${panel.caption}"`;
  lintCaption(captionLine); // fail early on a caption the house would refuse

  console.log(`\n── ${panel.file}  [${panel.characters.join(", ")}]  ${captionLine}`);
  console.log(`   refs: ${refs.map((r) => path.basename(r.path) + (r.box ? `[${r.box.join(",")}]` : "")).join(" | ")}`);
  console.log(`   prompt: ${prompt.length} chars`);
  if (dry) continue;

  for (let r = 0; r < rolls; r++) {
    const seed = firstSeed !== undefined ? firstSeed + r : Math.floor(Math.random() * 2 ** 31);
    const t0 = Date.now();
    try {
      const art = await generateCartoonArt({ prompt, characters: panel.characters, barScene: !panel.setting, model, seed, fast, tag: panel.file.slice(0, 2), sampling });
      const suffix = r === 0 ? "" : `.r${r + 1}`;
      const artPath = path.join(outDir, panel.file.replace(/\.png$/, `${suffix}.png`));
      fs.writeFileSync(artPath, art);
      const finished = await finishCartoon(art, captionLine);
      fs.writeFileSync(path.join(outDir, "finished", path.basename(artPath)), finished);
      fs.writeFileSync(
        path.join(outDir, panel.file.replace(/\.png$/, `${suffix}.txt`)),
        `${model}\nMODE=${plan.quality}\nSEED=${seed}\nWRITER=${plan.writer}\nBRIEF=${brief}\nTURN=${panel.turn ?? "—"}\n` +
          `CAPTION ${captionLine}\nREFERENCES=${refs.map((x) => x.path).join(" ; ")}\n\n${prompt}\n`
      );
      drawn++;
      console.log(`   roll ${r + 1}/${rolls} seed ${seed} → ${path.relative(repoRoot, artPath)}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    } catch (err) {
      failed.push({ n: panel.n, seed, why: err instanceof Error ? err.message : String(err) });
      console.log(`   roll ${r + 1}/${rolls} seed ${seed} FAILED: ${err instanceof Error ? err.message : err}`);
    }
  }
}

console.log(`\n${dry ? "dry run — nothing drawn" : `drew ${drawn} image${drawn === 1 ? "" : "s"}`}${failed.length ? `, ${failed.length} failed` : ""}.`);
if (failed.length) console.log(JSON.stringify(failed, null, 2));
