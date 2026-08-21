// Generates the non-barroom half of the training set.
//
// Everything the repo already holds was drawn either on blank paper or in the
// bar. Train on that alone and the model concludes the bar is part of who
// these characters are — so "put them on a boat" comes back with bottles on
// the shelf behind them. This script buys the corpus somewhere else to be: the
// same locked characters, unchanged, standing in places the strip has never
// visited.
//
// It works by editing rather than inventing. Each run sends one clean crop of
// a character to FLUX Kontext with an instruction to keep the drawing exactly
// as it is and change only the surroundings, which is the one thing Kontext is
// reliably good at. Every image lands beside a caption naming its new place,
// so the place attaches to those words instead of to the character's token.
//
// Requires REPLICATE_API_TOKEN and costs a few cents per image.
//
//   node scripts/training/build-training-set.mjs --draft   # crops first
//   node scripts/training/make-setting-variants.mjs [--dry-run] [--only <id>]
//
// The places themselves live in lib/places.mjs, beside the patterns the build
// script uses to count them.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { VARIANT_PLACES } from "./lib/places.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const cropsDir = path.join(here, "training-set");
const outDir = path.join(here, "setting-variants");

const REPLICATE_API = "https://api.replicate.com/v1";
// Kontext edits an image against an instruction, which is exactly the job:
// hold the character, replace the world.
const MODEL = process.env.VARIANT_MODEL || "black-forest-labs/flux-kontext-pro";
const TILE = 760;

// Mango is badly outnumbered in the sheets — thirteen studies against Abby's
// fifty — and he is the character most easily confused with her, so the runs
// are weighted toward him and toward the two of them together.
const CASTS = [
  { id: "mango", refs: ["dog-lapel-pin-bible-01"], tokens: "SWDMANGO", who: "the golden retriever" },
  { id: "abby", refs: ["abby-full-body-01"], tokens: "SWDABBY", who: "the white terrier" },
  { id: "drew", refs: ["flamingo-full-body-01"], tokens: "SWDDREW", who: "the flamingo" },
  {
    id: "mango-abby",
    refs: ["dog-lapel-pin-bible-01", "abby-full-body-01"],
    tokens: "SWDMANGO and SWDABBY",
    who: "the golden retriever and the white terrier",
  },
  {
    id: "drew-mango",
    refs: ["flamingo-full-body-01", "dog-lapel-pin-bible-01"],
    tokens: "SWDDREW and SWDMANGO",
    who: "the flamingo and the golden retriever",
  },
];

// Eight places by five casts would be forty runs and most of the value is in
// the first twenty-odd. This pairing gives every cast every kind of place
// while leaning on Mango.
const PLAN = [
  ["mango", ["boat", "park", "office", "beach", "street", "empty", "courtroom", "diner"]],
  ["abby", ["boat", "park", "street", "empty", "diner"]],
  ["drew", ["office", "beach", "street", "courtroom"]],
  ["mango-abby", ["boat", "park", "office", "empty"]],
  ["drew-mango", ["beach", "street", "diner"]],
];

function parseArgs() {
  const argv = process.argv.slice(2);
  return {
    dryRun: argv.includes("--dry-run"),
    only: argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null,
  };
}

function token() {
  const value = process.env.REPLICATE_API_TOKEN;
  if (!value) {
    throw new Error(
      "REPLICATE_API_TOKEN is not set. Create a token at replicate.com (account → API tokens) and export it, " +
        "or run with --dry-run to see what would be generated."
    );
  }
  return value;
}

// One conditioning image per run, so a two-hander shares a canvas.
async function referenceBoard(refs) {
  const tiles = await Promise.all(
    refs.map(async (name) => {
      const file = path.join(cropsDir, `${name}.png`);
      if (!fs.existsSync(file)) {
        throw new Error(
          `missing reference crop ${name}.png — run \`node scripts/training/build-training-set.mjs --draft\` first`
        );
      }
      return sharp(file).resize(TILE, TILE, { fit: "contain", background: "#ffffff" }).jpeg({ quality: 90 }).toBuffer();
    })
  );
  return sharp({
    create: { width: TILE * tiles.length, height: TILE, channels: 3, background: "#ffffff" },
  })
    .composite(tiles.map((input, i) => ({ input, left: i * TILE, top: 0 })))
    .jpeg({ quality: 90 })
    .toBuffer();
}

function instruction(cast, place) {
  return (
    `Redraw ${cast.who} from the attached reference exactly as drawn — same construction, same face, ` +
    `same proportions, same clothing, unchanged in every detail. Change only the surroundings: ` +
    `${place}. Single-panel black-and-white cartoon, ink line with grey wash, no colour, no lettering, ` +
    `no speech balloons, no panel border.`
  );
}

function caption(cast, place) {
  return `SWDINK cartoon, ${cast.tokens} ${place}`;
}

async function upload(bytes, auth) {
  const form = new FormData();
  form.append("content", new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }), "reference.jpg");
  const res = await fetch(`${REPLICATE_API}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Replicate file upload failed (${res.status})`);
  const file = await res.json();
  if (!file.urls?.get) throw new Error("Replicate file upload returned no URL");
  return file.urls.get;
}

async function generate(prompt, boardUrl, auth) {
  const created = await fetch(`${REPLICATE_API}/models/${MODEL}/predictions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth}`, "Content-Type": "application/json", Prefer: "wait" },
    body: JSON.stringify({
      input: { prompt, input_image: boardUrl, aspect_ratio: "1:1", output_format: "png" },
    }),
  });
  if (!created.ok) {
    throw new Error(`Replicate said ${created.status}: ${(await created.text().catch(() => "")).slice(0, 200)}`);
  }
  let prediction = await created.json();

  const startedAt = Date.now();
  while (prediction.status === "starting" || prediction.status === "processing") {
    if (Date.now() - startedAt > 180_000) throw new Error("timed out waiting for the image model");
    await new Promise((r) => setTimeout(r, 2500));
    const poll = await fetch(prediction.urls?.get ?? `${REPLICATE_API}/predictions/${prediction.id}`, {
      headers: { Authorization: `Bearer ${auth}` },
    });
    if (!poll.ok) throw new Error(`Replicate said ${poll.status} while waiting`);
    prediction = await poll.json();
  }
  if (prediction.status !== "succeeded") {
    throw new Error(`prediction ${prediction.status}: ${String(prediction.error ?? "").slice(0, 200)}`);
  }
  const url = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (!url) throw new Error("the image model returned no output");
  const image = await fetch(url);
  if (!image.ok) throw new Error(`could not download the result (${image.status})`);
  return Buffer.from(await image.arrayBuffer());
}

const { dryRun, only } = parseArgs();
const places = VARIANT_PLACES;
const casts = new Map(CASTS.map((c) => [c.id, c]));

const runs = [];
for (const [castId, placeIds] of PLAN) {
  for (const placeId of placeIds) {
    const id = `${castId}-${placeId}`;
    if (only && id !== only) continue;
    runs.push({ id, cast: casts.get(castId), place: places.get(placeId) });
  }
}

console.log(`${runs.length} setting variant(s)${dryRun ? " — dry run, nothing will be generated" : ""}\n`);
if (dryRun) {
  for (const run of runs) {
    console.log(`${run.id}\n  prompt:  ${instruction(run.cast, run.place)}\n  caption: ${caption(run.cast, run.place)}\n`);
  }
  process.exit(0);
}

const auth = token();
fs.mkdirSync(outDir, { recursive: true });

let made = 0;
let failed = 0;
for (const run of runs) {
  const target = path.join(outDir, `${run.id}.png`);
  if (fs.existsSync(target)) {
    console.log(`${run.id} — already there, skipping`);
    continue;
  }
  try {
    const boardUrl = await upload(await referenceBoard(run.cast.refs), auth);
    const image = await generate(instruction(run.cast, run.place), boardUrl, auth);
    fs.writeFileSync(target, image);
    fs.writeFileSync(path.join(outDir, `${run.id}.txt`), `${caption(run.cast, run.place)}\n`);
    made++;
    console.log(`${run.id} — done`);
  } catch (error) {
    failed++;
    console.error(`${run.id} — ${error.message}`);
  }
}

console.log(`\n${made} generated, ${failed} failed, in ${path.relative(process.cwd(), outDir)}`);
console.log(
  "Look at every one before building. Any image where a character has drifted off-model is worse than no " +
    "image at all — delete it and its .txt, then run `npm run training:build`."
);
