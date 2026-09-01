import sharp from "sharp";
import { PublishError, readRepoFile } from "./githubPublish";
import { generateImage, uploadFile } from "./replicate";

// The art department. ChatGPT (or any connected chat AI) never touches
// image bytes — it sends text through make_cartoons, and this module
// turns that text into a drawn panel: compose the canon prompt, build a
// reference board from the founder's Harrington plates, and call a hosted
// FLUX model (Replicate). Only the server ever holds pixels, which is the
// whole reason the phone flow works.


// FLUX.1 Kontext takes one conditioning image + an instruction prompt —
// the strongest hosted option for "match these exact characters" before any
// fine-tune exists. Once one does, IMAGE_MODEL points at it instead.
// The house model. gpt-image-2 is the first one that letters a chalkboard
// correctly, keeps the cast on the right side of the bar, and draws a
// television picture that illustrates its own headline. IMAGE_QUALITY
// dials the cost: "low" (~$0.012 an image) is what the batch is drawn at.
const DEFAULT_MODEL = "openai/gpt-image-2";

// The trigger words baked into the fine-tune by scripts/training. They are the
// whole point of it: the model knows who these three are, so the prompt can
// stop describing them and spend its weight on what Rick actually asked for.
const TRIGGERS: Record<string, string> = {
  drew: "SWDDREW",
  barclay: "SWDBARCLAY",
  abby: "SWDABBY",
};
const STYLE_TRIGGER = "SWDINK";

/**
 * Which kind of model IMAGE_MODEL names. Kontext is conditioned on a reference
 * board and must be told, in words, what everyone looks like. A fine-tune
 * already knows, and telling it again only fights the tokens.
 */
export function isFineTuned(): boolean {
  const model = imageModel();
  return !model.includes("kontext") && !isMultiRef(model);
}

// How hard the fine-tune is applied. This is the dial to reach for first when
// something is wrong: identity slipping means turn it up, a boat that keeps
// coming back as a barroom means turn it down.
function loraScale(): number {
  const raw = Number(process.env.LORA_SCALE);
  return Number.isFinite(raw) && raw > 0 ? raw : 0.9;
}

export function imageModel(): string {
  return process.env.IMAGE_MODEL || DEFAULT_MODEL;
}

// The definitive character references are Harrington's own plates
// (canon/vision/) — the founder's ground truth after the pivot. The retired
// model sheets must never condition a paid image again: their look is the
// look he rejected.
// Tight BUSTS, not whole panels. A tile that carries a whole scene competes
// with the scene being asked for: Barclay's bar panel dominated every board it
// sat on, absorbing Drew into a second retriever and dropping Abby entirely.
// Cropped to head-and-shoulders, each tile can only say "this is what this
// character looks like".
type Tile = { path: string; box?: [number, number, number, number]; label?: string };
// One or more tiles per character. Drew carries two, because the fault the
// strip could not shake lives in a detail — the shape of the black on his
// bill — that occupies about a thirtieth of a full-figure tile. A reference
// can only teach what the model can resolve in it.
const VISION_REFS: Record<string, Tile[]> = {
  // ONE SOURCE OF TRUTH. Every character's generation reference IS the portrait
  // the cast page shows — the same file, byte for byte. The founder's rule,
  // after a day of chasing drift: the cartoons must never generate something
  // different from the cast. When a portrait is approved and lands in
  // canon/vision/studies/, the pipeline follows it automatically; there is no
  // second set of reference images to fall out of step.
  drew: [
    {
      path: "canon/vision/studies/drew.png",
      label:
        "Drew, exactly as the studio's official portrait — copy THIS bird identically: the bill, the black " +
        "bow tie, the knitted sweater vest, and the feathered hands with four fingers and a thumb and no " +
        "claws. The cartoon's Drew must be indistinguishable from this one",
    },
  ],
  barclay: [
    {
      path: "canon/vision/studies/barclay.png",
      label:
        "Barclay, exactly as the studio's official portrait — copy THIS dog identically: both eyes on the " +
        "paper, the closed mouth, the flag pin on his left lapel, the wristwatch, the fur-backed clawless " +
        "hands. The cartoon's Barclay must be indistinguishable from this one",
    },
  ],
  abby: [
    {
      path: "canon/vision/studies/abby.png",
      label:
        "Abby, exactly as the studio's official portrait — copy THIS lady identically: the round soft head " +
        "with the big black nose close under the eyes and no muzzle, the glamorous lidded eyes, the smooth " +
        "open neckline, the studded collar with its gem, the towel. The cartoon's Abby must be " +
        "indistinguishable from this one",
    },
  ],
};

// A character-free stretch of the bar from plate 3 — walnut wall, the TV
// with full broadcast grammar, the chalkboard special. Appended to the board
// for bar scenes so the ROOM conditions on Harrington's pixels too; without
// it, Drew's tile shows an airport and Abby's shows only her face.
const ROOM_TILE: { path: string; box: [number, number, number, number] } = {
  path: "canon/vision/plate-3-national-mall.jpg",
  box: [1500, 69, 1494, 600],
};

// Harrington's own bar panel (plate 1, lower): the two gentlemen seated at
// the counter, drinks on the marble, boards on the wall. Portrait tiles give
// identity but impose portrait framing — the cast kept lining up at a round
// table. A staged tile carries the staging instead, which is the one thing
// that has never drifted.
const SCENE_TILE: { path: string; box: [number, number, number, number] } = {
  path: "canon/vision/plate-1-security-and-martini-menu.jpg",
  box: [16, 1460, 1600, 1140],
};

/**
 * One reference board: each requested character's plate study, side by side
 * on white, grayscaled and normalised so the photographed prints read as ink
 * on one shared sheet. Kontext sees a single conditioning image, so the cast
 * shares a canvas.
 */
export async function buildReferenceBoard(
  characters: string[],
  barScene = false,
  staged = false
): Promise<Buffer> {
  const refs: { path: string; box?: [number, number, number, number] }[] = [];
  const cast = characters.map((c) => c.toLowerCase());
  if (staged) {
    // The staged panel already IS Drew and Barclay in the room; only a
    // character it does not contain needs a portrait beside it.
    refs.push(SCENE_TILE);
    if (cast.includes("abby")) refs.push(VISION_REFS.abby[0]);
    return composeBoard(refs);
  }
  for (const character of cast) {
    // The single-board path takes only the primary tile: a collage that
    // repeated one character would read as two of him.
    const ref = VISION_REFS[character]?.[0];
    if (ref) refs.push(ref);
  }
  // The room band rides along for bar scenes unless Barclay is in the cast —
  // his crop still carries enough of the back bar to double up. Kept in
  // lockstep with the roster sentence in assemblePrompt.
  const roomCovered = cast.includes("barclay") || cast.includes("mango");
  if (barScene && !roomCovered) refs.push(ROOM_TILE);
  return composeBoard(refs);
}

async function composeBoard(refs: { path: string; box?: [number, number, number, number] }[]): Promise<Buffer> {
  const masters: Buffer[] = [];
  for (const ref of refs) {
    const file = await readRepoFile(ref.path);
    if (!file) continue;
    let img = sharp(file.bytes);
    if (ref.box) {
      const [left, top, width, height] = ref.box;
      img = img.extract({ left, top, width, height });
    }
    masters.push(await img.grayscale().normalise().toBuffer());
  }
  if (masters.length === 0) {
    throw new PublishError(400, "No plate references found for the requested characters.");
  }

  const tile = 760; // per-character column, board stays comfortably under provider caps
  const resized = await Promise.all(
    masters.map((buf) =>
      sharp(buf)
        .resize(tile, tile, { fit: "contain", background: "#ffffff" })
        .jpeg({ quality: 85 })
        .toBuffer()
    )
  );
  return sharp({
    create: {
      width: tile * resized.length,
      height: tile,
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite(resized.map((input, i) => ({ input, left: i * tile, top: 0 })))
    .jpeg({ quality: 85 })
    .toBuffer();
}

/** Trim the paper margin some models draw around the panel, and cut the
 *  bottom back only if the frame runs tall enough to have caught stools and
 *  knees — the founder's veto on legs. A blind percentage used to slice
 *  through the drinks, so the trim is measured from the finished aspect
 *  rather than guessed. */
async function cropAtTheCounter(bytes: Buffer): Promise<Buffer> {
  const trimmed = await sharp(bytes).trim({ threshold: 12 }).png().toBuffer().catch(() => bytes);
  const meta = await sharp(trimmed).metadata();
  if (!meta.width || !meta.height) return trimmed;
  const tallest = Math.round(meta.width * 1.25); // 4:5, the house shape
  if (meta.height <= tallest) return trimmed;
  return sharp(trimmed).extract({ left: 0, top: 0, width: meta.width, height: tallest }).png().toBuffer();
}

/** FLUX.2 takes references as a real array and lets the prompt address each
 *  one by index, so the cast no longer has to share one collaged board. */
export function isMultiRef(model: string): boolean {
  return (
    model.includes("flux-2") ||
    model.includes("nano-banana") ||
    model.includes("seedream") ||
    model.includes("gpt-image")
  );
}

/** Each vendor names the reference array differently, and Black Forest Labs
 *  alone insists on a safety dial. One place to keep the differences. */
function multiRefInput(
  model: string,
  prompt: string,
  images: string[],
  quality?: string
): Record<string, unknown> {
  if (model.includes("flux-2")) {
    return { prompt, input_images: images, aspect_ratio: "4:5", output_format: "png", safety_tolerance: 2 };
  }
  if (model.includes("seedream")) {
    return { prompt, image_input: images, aspect_ratio: "4:5", size: "2K" };
  }
  if (model.includes("gpt-image")) {
    // OpenAI prices this one by variant — low is ~$0.012 an image against
    // high's ~$0.128. Medium is the house default: low lost the bill
    // silhouette and the fine hatching. The dial arrives as an argument
    // rather than an environment variable, because two overlapping requests
    // share one warm process: a comparison that set process.env per request
    // had the second call overwrite the first mid-render, and both panels
    // came back at the same setting while each log claimed its own.
    return {
      prompt,
      input_images: images,
      quality: quality || process.env.IMAGE_QUALITY || "medium",
      moderation: "low",
      // 4:5 IS THE HOUSE SHAPE, AND IT MUST BE WHAT THE MODEL COMPOSES IN.
      // This read "2:3" while cropAtTheCounter trims to width x 1.25, so every
      // bar panel was composed tall and then had its bottom SIXTH cut off
      // after the fact — 1024x1536 delivered as 1024x1280. That amputated band
      // is exactly where the counter's near edge, the forearms and elbows on
      // the marble, and the chair backs sit, which is why the founder failed
      // nine of twenty-five panels with "they are not seated up to the bar".
      // Composing at 4:5 leaves cropAtTheCounter a no-op safety net.
      // …EXCEPT that Replicate's openai/gpt-image-2 refuses it: the endpoint
      // validates aspect_ratio against "1:1", "3:2", "2:3" only and answers 422
      // to "4:5" (caught 2026-09-01 — every plate and panel request failed).
      // So the model composes at 2:3 and cropAtTheCounter takes the bottom
      // sixth: chair seats, not counter. The two finals of 2026-09-01 came
      // through exactly this path with the gentlemen seated correctly.
      aspect_ratio: process.env.IMAGE_ASPECT || "2:3",
      output_format: "png",
      number_of_images: 1,
    };
  }
  // google/nano-banana
  return { prompt, image_input: images, aspect_ratio: "4:5", output_format: "png" };
}

/** The ordered reference list for the multi-reference path: one entry per
 *  character, then the room. Index order IS the @image1..N order the prompt
 *  refers to, so the two must be built from the same list. */
export function referenceList(
  characters: string[],
  barScene: boolean
): { label: string; path: string; box?: [number, number, number, number] }[] {
  // THE MODEL TAKES SIX IMAGES. Adding a third tile to Drew and a second to
  // Barclay quietly pushed every three-hander to seven, and the whole cast of
  // twelve Abby panels failed while all six two-handers went through — a
  // failure that looked exactly like flaky rate limiting for an hour.
  //
  // So the budget is spent in priority order: EVERY character's first tile
  // first, because a character with no reference at all drifts immediately;
  // then the set plate, which keeps the room the same room; then the extra
  // per-character tiles while room remains.
  const LIMIT = 6;
  const list: { label: string; path: string; box?: [number, number, number, number] }[] = [];
  const extras: typeof list = [];
  for (const character of characters) {
    const key = character.toLowerCase();
    for (const [i, ref] of (VISION_REFS[key] ?? []).entries()) {
      const entry = { label: ref.label ?? (i === 0 ? (CAST_BLURB[key] ?? key) : key), ...ref };
      (i === 0 ? list : extras).push(entry);
    }
  }
  // Hold the extras back until the set plate has had its chance at a slot.
  // Extras board ROUND-ROBIN by character, not in cast order: with three
  // characters and a six-image budget, cast-order spending gave Drew his second
  // and third tiles while Barclay's face tile — the one that teaches both eyes —
  // never boarded at all, and every trio came back with a one-eyed Barclay.
  const spendExtras = () => {
    while (extras.length > 0 && list.length < LIMIT) {
      const seen = new Set<string>();
      for (let i = 0; i < extras.length && list.length < LIMIT; ) {
        const owner = extras[i].path;
        const key = characters.find((c) => (VISION_REFS[c.toLowerCase()] ?? []).some((r) => r.path === owner)) ?? owner;
        if (seen.has(key)) { i++; continue; }
        seen.add(key);
        list.push(extras.splice(i, 1)[0] as (typeof list)[number]);
      }
      if (seen.size === 0) break;
    }
  };
  // THE SET. Eighty percent of the strip happens in one bar, and a room
  // described in words is a different bar every generation — the same lesson
  // the bill taught: the picture out-votes the text, so give it the picture.
  //
  // A room tile was tried once before and withdrawn because it was cut from
  // plate 3 and carried that plate's television picture into every cartoon's
  // screen. This one is drawn for the purpose with the screen and the
  // chalkboard BLANK, so it can only teach layout, fixtures and furniture.
  if (barScene && list.length < LIMIT) {
    list.push({
      path: "canon/vision/staging-plate.jpg",
      label:
        "THE EMPTY SET — this same bar BEFORE the cast walks in, attached for its geometry only. THE MARBLE " +
        "COUNTER IN THIS TILE IS THE COUNTER: seat the gentlemen on the NEAR side of THIS counter SEEN FROM BEHIND, with their " +
        "drinks standing ON THIS SAME SLAB — never invent a second, nearer surface for the drinks, and never " +
        "leave this counter standing behind their backs as scenery. Abby, when cast, works on the FAR side of " +
        "this same counter. Copy the back bar with its high shelves, the television above it, the " +
        "chalkboard, the sconces and the panelling exactly as here, ACROSS the counter on the FAR service side and never behind the gentlemen. The window at far left carries ONLY the " +
        "mirrored house name — NO door is drawn in or beside the window in the cartoon, whatever this tile " +
        "shows at its edge. Its screen and board are deliberately blank, and the scene below is the ONLY " +
        "authority on them: letter them, switch the television off, or leave the slate wiped exactly as it says"
    });
  }
  spendExtras();
  return list.slice(0, LIMIT);
}

async function uploadReferences(
  characters: string[],
  barScene: boolean,
  explicit?: { path: string; box?: [number, number, number, number] }[]
): Promise<string[]> {
  const urls: string[] = [];
  for (const [i, ref] of (explicit ?? referenceList(characters, barScene)).entries()) {
    const file = await readRepoFile(ref.path);
    if (!file) continue;
    let img = sharp(file.bytes);
    if (ref.box) {
      const [left, top, width, height] = ref.box;
      img = img.extract({ left, top, width, height });
    }
    const bytes = await img.grayscale().normalise().resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
    urls.push(await uploadFile(bytes, `reference-${i + 1}.jpg`, "image/jpeg"));
  }
  if (urls.length === 0) throw new PublishError(400, "No plate references found for the requested characters.");
  return urls;
}

/**
 * Generate one panel: prompt (+ reference board on the Kontext path) in,
 * PNG bytes out. Synchronous from the caller's point of view.
 */
export async function generateCartoonArt(input: {
  prompt: string;
  characters: string[];
  /** Bar scenes append the plates' room band to the reference board. */
  barScene?: boolean;
  /** Condition on Harrington's staged bar panel instead of portrait tiles. */
  staged?: boolean;
  /** Override the model for this one call — the smoke-test route injects a
   *  freshly trained version here before IMAGE_MODEL is promoted to it. */
  model?: string;
  /** Explicit reference tiles (repo paths), used instead of the cast's. The
   *  set plate is drawn from the founder's own bar plates and has no cast. */
  references?: { path: string; box?: [number, number, number, number]; label?: string }[];
  /** The house model's quality dial for this one call. Passed rather than
   *  read from the environment so concurrent requests cannot trade dials. */
  quality?: string;
  /** Draw from the text alone, attaching no reference image at all.
   *
   *  This exists for one job: replacing a reference that is itself the fault.
   *  A reference cannot be bootstrapped out of itself — six Abby head studies
   *  drawn with her black-button tile attached came back with black-button
   *  eyes, and the inspection called one of them "a re-render of the problem,
   *  not a fix." When the picture is what is wrong, the only way to get a
   *  better picture is to stop showing it. Never use this for a filed
   *  cartoon: without the plates the cast drifts immediately. */
  noReferences?: boolean;
}): Promise<Buffer> {
  const model = input.model ?? imageModel();
  const multiRef = isMultiRef(model);
  const fineTuned = !model.includes("kontext") && !multiRef;

  // FLUX.2: each reference is its own input image, addressed by index in the
  // prompt. No collage, so no tile out-argues another — and safety_tolerance
  // is a real dial rather than an opaque refusal.
  if (multiRef) {
    const art = await generateImage(
      model,
      multiRefInput(
        model,
        input.prompt,
        input.noReferences
          ? []
          : await uploadReferences(input.characters, input.barScene ?? false, input.references),
        input.quality
      )
    );
    return input.barScene ? cropAtTheCounter(art) : art;
  }

  // A fine-tune carries the cast in its weights, so there is no board to
  // build and nothing to upload — just a prompt and the strength dial.
  const modelInput: Record<string, unknown> = fineTuned
    ? {
        prompt: input.prompt,
        lora_scale: loraScale(),
        aspect_ratio: "4:5",
        output_format: "png",
      }
    : {
        prompt: input.prompt,
        input_image: await uploadFile(await buildReferenceBoard(input.characters, input.barScene ?? false, input.staged ?? false), "reference-board.jpg", "image/jpeg"),
        aspect_ratio: "4:5",
        output_format: "png",
        // The strip is a dry gag cartoon — nothing here should trip
        // conservative filters, so keep the default tolerance.
      };

  return generateImage(model, modelInput);
}

// ---------------------------------------------------------------- prompt

type Candidate = {
  scene: string;
  tv?: string;
  board?: string;
  setting?: string;
  characters: string[];
};

/**
 * The paragraphs of the base fence that describe THE BAR and only the bar.
 *
 * An away game swaps the room out. It used to do that by dropping the two
 * paragraphs whose names say "room" and "stage" — which left nine others
 * standing, so a cartoon set on a golf course still carried the marble
 * counter, the studded leather club chairs, the fixed bar height, the
 * television and chalkboard, and the whole five-paragraph SIDES block that
 * puts Abby behind a counter against a back bar. The model was being told to
 * draw a fairway and a barroom at once, and it is not obvious which one loses.
 *
 * Every rule here is about the bar's furniture or the bar's geometry. Rules
 * that belong to the CHARACTERS — how Drew's bill is built, how the house name
 * is made into an object, the drawing style — are not in this list and travel
 * everywhere, which is the whole point of having a cast.
 */
const BAR_ONLY_PARAGRAPHS = [
  "THE ROOM.",
  "THE STAGE.",
  "The TV and the chalkboard are OPTIONAL",
  "THE BAR IS ONE LEVEL.",
  "THE SEATING IS THE SAME EVERY DAY",
  "THE BAR HEIGHT IS FIXED",
  "THE SIDES —",
  "NEAREST THE READER",
  "NEXT, THE MARBLE COUNTER",
  "FARTHEST, PAST THE COUNTER",
  "The two of them are on one side and she is on the other",
];

/** True when a paragraph belongs to the bar and must not travel. */
export function isBarOnly(paragraph: string): boolean {
  return BAR_ONLY_PARAGRAPHS.some((prefix) => paragraph.startsWith(prefix));
}

function fencesOf(masterPrompt: string) {
  // The GitHub contents API serves LF, but a Windows checkout reads CRLF —
  // and CRLF makes every fence and paragraph split silently miss.
  const normalised = masterPrompt.replace(/\r\n/g, "\n");
  const fences = [...normalised.matchAll(/```text\n([\s\S]*?)```/g)].map((m) => m[1].trim());
  if (fences.length < 1) {
    throw new PublishError(500, "The master prompt has no BASE fence — canon/MASTER-PROMPT.md is malformed.");
  }
  return { base: fences[0], abbyBlock: fences[1] ?? "", awayBlock: fences[2] ?? "" };
}

/** Cut everything from the sentence starting at `from` through the end of the
 *  sentence ending at `to`, and put `replacement` there instead. Returns the
 *  text untouched when either marker is missing, so a canon rewrite that
 *  renames a sentence degrades to the old behaviour instead of corrupting the
 *  paragraph — check-prompt-assembly asserts the markers still exist. */
function spliceBetween(text: string, from: string, to: string, replacement: string): string {
  const start = text.indexOf(from);
  if (start < 0) return text;
  const endAt = text.indexOf(to, start);
  if (endAt < 0) return text;
  return text.slice(0, start) + replacement + text.slice(endAt + to.length);
}

// replaceAll, not replace: [SCENE] appears twice once Abby's fence is in play.
function fillSlots(text: string, candidate: Candidate): string {
  const tv = (candidate.tv ?? "").trim();
  const board = (candidate.board ?? "").trim();
  // An EMPTY slot is an ABSENT surface, not a blank one. The old `??` defaults
  // never fired on "" — the fence still ordered a switched-on television and a
  // lettered chalkboard, named nothing for either to say, and the model wrote
  // its own: one invented board promoted hard drinking and the founder caught
  // it. When the writer sends no [TV] or no [BOARD], the surface itself is
  // stood down in words the room can live with.
  if (!tv) {
    text = spliceBetween(
      text,
      "THE TELEVISION'S FRAME AND SURROUND",
      "DRAW THAT SURFACE BLANK.",
      "The television above the back bar is SWITCHED OFF: plain dark glass with nothing on it — no network " +
        "bug, no chyron, no picture, and no lettering of any kind on or around the screen."
    );
  }
  if (!board) {
    text = spliceBetween(
      text,
      "A chalkboard carries menu-shaped jokes",
      "drinking hard, fast or often.",
      "The chalkboard is WIPED CLEAN: bare slate, no chalk marks, no lettering."
    );
  }
  return text
    .replaceAll("[TV]", tv || "BREAKING")
    .replaceAll("[BOARD]", board || "HAPPY HOUR 4–?")
    .replaceAll("[SCENE]", candidate.scene.trim());
}

/**
 * The prompt for a fine-tuned model, which is a different document from the
 * prompt for Kontext rather than a variation on it.
 *
 * What the fine-tune knows, the prompt stops saying: the style paragraph
 * becomes one style token, and the DREW/BARCLAY/ABBY paragraphs become three
 * trigger words. What the fine-tune does not know stays in full — the stage
 * physics, the no-lettering rules, and above all the scene Rick asked for,
 * which lands last and with nothing competing for the model's attention.
 *
 * The room is the point of the exercise. It is included only when the scene
 * is actually in the bar; carrying a paragraph of barroom into a prompt about
 * a boat is the model arguing with itself, and the boat usually loses.
 */
function fineTunedPrompt(masterPrompt: string, candidate: Candidate): string {
  const { base, awayBlock } = fencesOf(masterPrompt);
  const paragraphs = base.split("\n\n");
  const find = (prefix: string) => paragraphs.find((p) => p.startsWith(prefix));

  const cast = candidate.characters
    .map((c) => TRIGGERS[c.toLowerCase().trim()])
    .filter(Boolean);
  if (cast.length === 0) {
    throw new PublishError(400, "No known characters in the scene — use barclay, drew, or abby.");
  }

  const parts = [`${STYLE_TRIGGER} single-panel cartoon. In the scene: ${cast.join(", ")}.`];

  if (candidate.setting) {
    if (!awayBlock) {
      throw new PublishError(500, "The master prompt has no away-game fence — cannot stage an outdoor scene.");
    }
    parts.push(awayBlock.replace("[SETTING]", candidate.setting.trim()));
  } else {
    // The WHOLE bar-only set, not just ROOM and STAGE: the seating, height,
    // one-level and SIDES paragraphs are the founder's seating fix, and a
    // path that drops them draws the pre-review bar. Keeps the fine-tuned
    // prompt in lockstep with the multi-reference one.
    parts.push(...paragraphs.filter((p) => isBarOnly(p)));
  }

  // The closing paragraph carries the text rules and the [SCENE] slot.
  const rules = paragraphs[paragraphs.length - 1];
  if (rules) parts.push(rules);

  return fillSlots(parts.join("\n\n"), candidate);
}

/**
 * Assemble the final image prompt from the live master prompt. The canon file
 * is the single source — edits to the bible reach the next generation
 * automatically — but how much of it goes out depends on what is drawing.
 *
 * For Kontext: the verbatim BASE fence with slots filled, the ROOM+STAGE
 * paragraphs swapped for the outdoor passage on away games, and the ABBY fence
 * appended when she is in the scene.
 */
/** The house model refuses a prompt over 32,000 characters. Every Abby panel in
 *  a batch of twenty-five failed against that ceiling while every two-hander
 *  went through, and the refusal surfaced as a generic generation failure — it
 *  read as flaky rate limiting for an hour. Fail here instead, before the call
 *  is paid for, and say which cast and how far over. */
const PROMPT_CEILING = 32_000;

/** The house model refuses a prompt over its ceiling. Every Abby panel in a
 *  batch of twenty-five failed against it while every two-hander went through,
 *  and the refusal arrived as a generic generation failure — it read as flaky
 *  rate limiting for an hour. Fail here instead, before the call is paid for,
 *  naming the cast and the overshoot. */
function guardLength(prompt: string, characters: string[]): string {
  if (prompt.length > PROMPT_CEILING) {
    throw new PublishError(
      500,
      `The assembled prompt is ${prompt.length} characters for [${characters.join(", ")}], over the model's ` +
        `${PROMPT_CEILING} limit by ${prompt.length - PROMPT_CEILING}. Shorten a canon fence or a reference label.`
    );
  }
  return prompt;
}

export function assemblePrompt(
  masterPrompt: string,
  candidate: Candidate,
  fineTuned: boolean = isFineTuned(),
  staged = false,
  multiRef = isMultiRef(imageModel())
): string {
  if (fineTuned) return fineTunedPrompt(masterPrompt, candidate);

  const { base, abbyBlock, awayBlock } = fencesOf(masterPrompt);
  let prompt = base;
  if (candidate.setting) {
    if (!awayBlock) {
      throw new PublishError(500, "The master prompt has no away-game fence — cannot stage an outdoor scene.");
    }
    // Swap every paragraph that belongs to the bar for the outdoor passage —
    // not just the two named ROOM and STAGE. See BAR_ONLY_PARAGRAPHS.
    const paragraphs = prompt.split("\n\n");
    const kept = paragraphs.filter((p) => !isBarOnly(p));
    const away = awayBlock.replace("[SETTING]", candidate.setting.trim());
    kept.splice(1, 0, away);
    prompt = kept.join("\n\n");
  }

  // Abby's fence is appended before the slots are filled, not after: it refers
  // to [SCENE] itself, and appending it later sent a literal "[SCENE]" to the
  // model every time she was in the cast.
  if (candidate.characters.map((c) => c.toLowerCase()).includes("abby") && abbyBlock) {
    prompt = `${prompt}\n\n${abbyBlock}`;
  }
  prompt = fillSlots(prompt, candidate);

  // FLUX.2 addresses each reference by index, so the roster names them one
  // by one instead of describing positions on a collage.
  if (multiRef) {
    const refs = referenceList(candidate.characters, !candidate.setting);
    const roster = refs.map((r, i) => `@image${i + 1} is ${r.label}.`).join(" ");
    // Say it out loud when a character genuinely ships two tiles: more
    // references than characters must never become more characters. The old
    // test compared refs to cast size, so the SET PLATE — a room with nobody
    // in it — made this warning fire on every bar panel, spending ~250 chars
    // to describe a tile-doubling that did not exist.
    const doubled = candidate.characters.some(
      (c) => (VISION_REFS[c.toLowerCase()] ?? []).length > 1
    )
      ? " Some characters have MORE THAN ONE reference tile: those tiles are the SAME individual seen twice, at " +
        "different distances. Never draw two of him."
      : "";
    return guardLength(
      "Draw ONE single-panel black-and-white gag cartoon, one unbroken scene edge to edge — no seam, no " +
      "split, no second frame, and no photographic rendering.\n\n" +
      `REFERENCES. ${roster}${doubled} Draw each character exactly as his or her own reference draws that character ` +
      "— same face, same build, same wardrobe — and give the panel the same antique-engraving hand. Do NOT " +
      "reproduce any reference's own background, signage, lettering, or composition: every word of lettering " +
      "in this cartoon comes from the scene described below, and nothing else.\n\n" +
      `The finished panel contains EXACTLY ${candidate.characters.length} character${candidate.characters.length > 1 ? "s" : ""}` +
      `${candidate.characters.length > 1 ? ", each a separate individual — never merged, never duplicated, never omitted" : ""}.` +
      "\n\nTHE CARTOON:\n\n" +
      prompt,
      candidate.characters
    );
  }

  // Kontext is instruction-driven: tell it what the conditioning image is.
  // Naming each portrait by its position, and demanding the exact headcount,
  // is what stops the model absorbing one character into another — the
  // failure that cost eight of ten panels in the first showcase wave.
  const cast = candidate.characters.map((c) => c.toLowerCase());
  const named = cast.map((c) => CAST_BLURB[c]).filter(Boolean);
  const roster = named.map((who, i) => `${ordinal(i)}, ${who}`).join("; ");
  const count = named.length;
  const roomTile =
    !candidate.setting &&
    !candidate.characters.some((c) => ["barclay", "mango"].includes(c.toLowerCase()));
  return (
    "Draw ONE SINGLE CONTINUOUS PANEL — one unbroken scene, edge to edge. There is no dividing line, " +
    "no seam, no split, no diptych, and no second frame: every character shares one room in one drawing. " +
    (staged
      ? `The attached image is a finished panel of this exact strip: Drew the flamingo gentleman and Barclay ` +
        `the retriever gentleman seated at the marble bar counter of The Swinging Door, drinks on the marble, ` +
        `boards on the wall behind. KEEP that staging and both characters exactly — same faces, same builds, ` +
        `same wardrobe, same seats at the counter${cast.includes("abby") ? `. The SECOND, smaller tile is Abby, the white West Highland terrier proprietor: ADD her to the same panel, standing BEHIND the counter on the far side facing the two gentlemen, in a fitted light blouse with a towel over her shoulder and her studded gem-pendant collar, so the finished panel holds exactly three characters` : ", and draw exactly those two characters"}. ` +
        `NOW CHANGE IT for the scene below. The reference's chalkboard lists martini prices by airline fare ` +
        `class: ERASE that lettering completely and ${(candidate.board ?? "").trim() ? `letter the board with this cartoon's own line instead` : `leave the slate bare and wiped`}, ` +
        `and ${(candidate.tv ?? "").trim() ? `put this cartoon's own headline on the TV screen` : `switch the TV off — plain dark glass with nothing on it`}. Every other change the scene asks for — the ` +
        `drinks, the props, what each gentleman is doing — is made to the SAME two characters, who keep ` +
        `their own faces and builds exactly as drawn. `
      : "") +
    (staged ? "" : `The attached image is the reference board: ${count} character portrait${count > 1 ? "s" : ""} `) +
    (staged
      ? ""
      : `side by side${roomTile ? ", then a final room tile" : ""} — ${roster}` +
        `${roomTile ? "; last, a room tile showing the bar's wall, TV, and chalkboard style" : ""}. ` +
        `Each portrait fixes ONLY that character's face, build, and wardrobe. ` +
        "Never copy the portraits' own backgrounds, signage, or layout; the scene below replaces them " +
        "entirely, and its TV and chalkboard carry its own text. ") +
    `The drawn panel must show EXACTLY ${count} character${count > 1 ? "s" : ""}: ${count > 1 ? "each one a separate individual — never merge two characters into one, never draw the same character twice, never leave one out" : "that character alone"}. ` +
    "Draw a new single-panel cartoon:\n\n" +
    prompt
  );
}

// Short identifying blurbs for the board roster — enough to tell the model
// which portrait is which, in the strip's own vocabulary.
const CAST_BLURB: Record<string, string> = {
  drew: "Drew, the white-plumed flamingo gentleman in the black bow tie and knitted sweater vest",
  barclay: "Barclay, the golden retriever gentleman in the dark jacket with the small US flag pin",
  abby: "Abby, the white West Highland terrier proprietor in the studded gem-pendant collar",
};

// LEGACY KEY. Pre-rename plan.json files and cached connector schemas still
// say "mango"; he is Barclay now, but the old key must keep resolving to the
// same character — same trigger, same portrait tile, same blurb.
TRIGGERS.mango = TRIGGERS.barclay;
VISION_REFS.mango = VISION_REFS.barclay;
CAST_BLURB.mango = CAST_BLURB.barclay;

function ordinal(i: number): string {
  return ["first from the left", "second from the left", "third from the left"][i] ?? `number ${i + 1}`;
}
