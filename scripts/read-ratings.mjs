// What Rick likes, read out of his own scores.
//
//   node scripts/read-ratings.mjs                 everything
//   node scripts/read-ratings.mjs <batch>         one batch
//   node scripts/read-ratings.mjs --json          machine-readable
//
// The review page writes one JSON verdict per cartoon into
// feedback/ratings/<batch>/<panel>.json — a score out of ten for each
// character in the panel, one for the scene, one for the caption, and whatever
// he typed in the comment box. This reads all of them back and says what they
// add up to.
//
// WHY THIS IS A SCRIPT AND NOT A MODEL. The temptation is to hand the pile to a
// language model and ask what he likes. That produces a confident paragraph
// with no way to check it. Every number below is arithmetic over files anyone
// can open, and every claim carries the count it rests on — so when it says he
// scores Abby two points below Mango, you can go and count. Judgement comes
// after the arithmetic, from a person or from me reading this output, not from
// a summariser in the middle.
//
// The one rule this encodes: A PREFERENCE NEEDS THREE PANELS. Two scores are an
// accident. Anything thinner than three is printed as an observation, never as
// a finding, and never as grounds for changing canon.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ratingsDir = path.join(repoRoot, "feedback", "ratings");
const briefsDir = path.join(repoRoot, "briefs");

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const onlyBatch = args.find((a) => !a.startsWith("--"));

const MIN_FOR_A_FINDING = 3;
const CAST = ["drew", "mango", "abby"];
const NAMES = { drew: "Drew", mango: "Mango", abby: "Abby" };

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

/** Every verdict on disk, with the panel it judges attached. */
function collect() {
  if (!fs.existsSync(ratingsDir)) return [];
  const out = [];
  for (const batch of fs.readdirSync(ratingsDir)) {
    if (onlyBatch && batch !== onlyBatch) continue;
    const dir = path.join(ratingsDir, batch);
    if (!fs.statSync(dir).isDirectory()) continue;

    const plan = readJson(path.join(briefsDir, batch, "plan.json"));
    const byFile = new Map((plan?.panels ?? []).map((p) => [p.file.replace(/\.png$/, ""), p]));

    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      const verdict = readJson(path.join(dir, file));
      if (!verdict) continue;
      out.push({ ...verdict, brief: plan?.brief ?? "", panel: byFile.get(file.replace(/\.json$/, "")) ?? null });
    }
  }
  return out;
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const fmt = (n) => (n === null ? " — " : n.toFixed(1));

/** A score is only evidence of a preference if there are enough of them. */
function finding(values, claim) {
  if (values.length < MIN_FOR_A_FINDING) {
    return { firm: false, text: `${claim} (only ${values.length} — not enough to act on)` };
  }
  return { firm: true, text: claim };
}

const verdicts = collect();

if (verdicts.length === 0) {
  console.log(
    onlyBatch
      ? `No ratings recorded for ${onlyBatch}.`
      : "No ratings recorded yet. Rick scores a batch at /review/<batch>."
  );
  process.exit(0);
}

// --- the arithmetic -------------------------------------------------------

const perCharacter = Object.fromEntries(CAST.map((c) => [c, []]));
const scenes = [];
const captions = [];
const comments = [];
const byTurn = {};
const byCast = {};

for (const v of verdicts) {
  for (const c of CAST) if (typeof v.characters?.[c] === "number") perCharacter[c].push(v.characters[c]);
  if (typeof v.scene === "number") scenes.push(v.scene);
  if (typeof v.caption === "number") captions.push(v.caption);
  if (v.comment?.trim()) comments.push({ panel: v.panel?.caption ?? v.panel, comment: v.comment.trim() });

  const turn = (v.panel?.turn ?? "").split(/[\s,]/)[0].toLowerCase();
  if (turn && typeof v.caption === "number") (byTurn[turn] ??= []).push(v.caption);

  const cast = (v.panel?.characters ?? []).slice().sort().join("+");
  if (cast && typeof v.scene === "number") (byCast[cast] ??= []).push(v.scene);
}

const report = {
  panels: verdicts.length,
  characters: Object.fromEntries(CAST.map((c) => [c, { n: perCharacter[c].length, mean: mean(perCharacter[c]) }])),
  scene: { n: scenes.length, mean: mean(scenes) },
  caption: { n: captions.length, mean: mean(captions) },
  byTurn: Object.fromEntries(Object.entries(byTurn).map(([k, v]) => [k, { n: v.length, mean: mean(v) }])),
  byCast: Object.fromEntries(Object.entries(byCast).map(([k, v]) => [k, { n: v.length, mean: mean(v) }])),
  comments,
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

// --- the report -----------------------------------------------------------

const rule = "─".repeat(66);
console.log(`\n${rule}\nWHAT RICK'S SCORES SAY   ${verdicts.length} cartoon${verdicts.length === 1 ? "" : "s"} rated`);
if (onlyBatch) console.log(`batch ${onlyBatch}`);
console.log(rule);

console.log("\nTHE CAST");
for (const c of CAST) {
  const { n, mean: m } = report.characters[c];
  console.log(`  ${NAMES[c].padEnd(7)} ${fmt(m).padStart(5)}  from ${n} panel${n === 1 ? "" : "s"}`);
}
console.log("\nTHE WORK");
console.log(`  scene   ${fmt(report.scene.mean).padStart(5)}  from ${report.scene.n}`);
console.log(`  caption ${fmt(report.caption.mean).padStart(5)}  from ${report.caption.n}`);

const turns = Object.entries(report.byTurn).sort((a, b) => b[1].mean - a[1].mean);
if (turns.length > 0) {
  console.log("\nWHICH KIND OF JOKE HE SCORES HIGHEST  (caption score by the turn the writer named)");
  for (const [turn, { n, mean: m }] of turns) {
    console.log(`  ${turn.padEnd(14)} ${fmt(m).padStart(5)}  from ${n}${n < MIN_FOR_A_FINDING ? "   ← too few to act on" : ""}`);
  }
}

const casts = Object.entries(report.byCast).sort((a, b) => b[1].mean - a[1].mean);
if (casts.length > 0) {
  console.log("\nWHICH COMBINATION HE SCORES HIGHEST  (scene score by who is in the panel)");
  for (const [cast, { n, mean: m }] of casts) {
    const named = cast.split("+").map((c) => NAMES[c] ?? c).join(" + ");
    console.log(`  ${named.padEnd(20)} ${fmt(m).padStart(5)}  from ${n}${n < MIN_FOR_A_FINDING ? "   ← too few to act on" : ""}`);
  }
}

if (comments.length > 0) {
  console.log(`\nWHAT HE SAID  (${comments.length})`);
  for (const { panel, comment } of comments) {
    console.log(`\n  on “${String(panel).slice(0, 62)}”`);
    for (const line of comment.split("\n")) console.log(`    ${line}`);
  }
}

// --- what it is safe to conclude -----------------------------------------

console.log(`\n${rule}\nSAFE TO ACT ON\n${rule}`);
const notes = [];

const ranked = CAST.map((c) => ({ c, ...report.characters[c] }))
  .filter((x) => x.mean !== null)
  .sort((a, b) => b.mean - a.mean);
if (ranked.length >= 2) {
  const [top, bottom] = [ranked[0], ranked[ranked.length - 1]];
  const gap = top.mean - bottom.mean;
  if (gap >= 1.5) {
    notes.push(
      finding(
        perCharacter[bottom.c],
        `${NAMES[bottom.c]} scores ${gap.toFixed(1)} below ${NAMES[top.c]} — the drawing of ${NAMES[bottom.c]} is the weak one`
      )
    );
  } else {
    notes.push({ firm: true, text: `The cast score within ${gap.toFixed(1)} of each other — no one character is dragging` });
  }
}

if (report.caption.mean !== null && report.scene.mean !== null) {
  const gap = report.scene.mean - report.caption.mean;
  if (Math.abs(gap) >= 1.5) {
    const weak = gap > 0 ? "writing" : "drawing";
    notes.push(
      finding(gap > 0 ? captions : scenes, `The ${weak} is the weaker half by ${Math.abs(gap).toFixed(1)} — put the next round's effort there`)
    );
  }
}

if (turns.length >= 2 && turns[0][1].mean - turns[turns.length - 1][1].mean >= 1.5) {
  const best = turns[0];
  const worst = turns[turns.length - 1];
  notes.push(
    finding(
      best[1].n >= MIN_FOR_A_FINDING && worst[1].n >= MIN_FOR_A_FINDING ? new Array(MIN_FOR_A_FINDING) : [],
      `He scores ${best[0]} jokes ${(best[1].mean - worst[1].mean).toFixed(1)} above ${worst[0]} — commission more ${best[0]}`
    )
  );
}

const low = verdicts
  .filter((v) => typeof v.caption === "number" && v.caption <= 4)
  .map((v) => v.panel?.caption)
  .filter(Boolean);
if (low.length > 0) {
  notes.push({ firm: true, text: `${low.length} caption${low.length === 1 ? "" : "s"} scored 4 or below — read them before writing the next batch` });
}

if (notes.length === 0) {
  console.log("  Nothing yet. Scores are consistent and no gap is wide enough to mean anything.");
} else {
  for (const note of notes) console.log(`  ${note.firm ? "•" : "·"} ${note.text}`);
}
console.log(
  `\n  A preference needs ${MIN_FOR_A_FINDING} panels. Lines marked · are observations, not findings,\n` +
    "  and nothing in canon should change on one of them.\n"
);
