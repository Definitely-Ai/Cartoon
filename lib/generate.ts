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
  mango: "SWDMANGO",
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
// with the scene being asked for: Mango's bar panel dominated every board it
// sat on, absorbing Drew into a second retriever and dropping Abby entirely.
// Cropped to head-and-shoulders, each tile can only say "this is what this
// character looks like".
type Tile = { path: string; box?: [number, number, number, number]; label?: string };
// One or more tiles per character. Drew carries two, because the fault the
// strip could not shake lives in a detail — the shape of the black on his
// bill — that occupies about a thirtieth of a full-figure tile. A reference
// can only teach what the model can resolve in it.
const VISION_REFS: Record<string, Tile[]> = {
  // Plate 1's bar Drew, cut at NATIVE resolution. Two tiles preceded it and
  // both taught the fault: plate 3's Drew is the only one of the eight in the
  // plates drawn with the bill GAPED OPEN, and plate 4's ends in a curved
  // black HOOK — which is what the renders kept amplifying into a talon. This
  // one is the only Drew whose black stays short and smooth rather than
  // hooking, and the only
  // one wearing the sweater vest. Its predecessor was also a 2.94x upscale of
  // a 300px region: mean pixel gradient 3.41 against the plates' 7-8, i.e. the
  // model was being shown a smear. This is 380px of real linework, unenlarged.
  drew: [
    {
      path: "canon/vision/drew-plate1-bar-reference.jpg",
      label:
        "Drew, the white-plumed flamingo gentleman in the black bow tie and knitted sweater vest. LOOK AT HIS " +
        "TWO ARMS: each one ends in a HAND — soft downy plumage over four fingers and an opposed thumb, blunt " +
        "at the tips, no nail and no claw on any of them — and NEITHER arm is a folded wing. He has no long " +
        "hanging flight feathers down his sides and nothing drapes past his belt. Copy these arms and these " +
        "hands. The pale rectangle he holds is a blank card",
    },
    {
      path: "canon/vision/drew-hands-reference.jpg",
      label:
        "THE SAME BIRD from the neck down — copy his ARMS AND HANDS from here: each ends in a hand of four " +
        "fingers and a thumb, plumage to every blunt tip, no claws, no wingtips. Also his bow tie, collar and " +
        "vest. Cropped below the head on purpose — it says nothing about his bill. Not a second character",
    },
    {
      path: "canon/vision/drew-plate1-head-study.jpg",
      label:
        "a close study of THE SAME BIRD's head — copy this bill and this nostril EXACTLY. The bill is slender, " +
        "tucked to the face and dropping steeply, the rear two thirds pale; along the outer third the black IS " +
        "the outline, continuing the bill's own curve smoothly to a ROUNDED TIP, never hooking or hanging " +
        "below the line the pale bill was travelling on, with one bright highlight inside it. The NOSTRIL is a " +
        "plain thin slit with NO outline or ring around it. There is no shelf or ridge over the eye. The soft " +
        "pale patch below the bill is empty background, not an object. This tile is not a second character",
    },
  ],
  mango: [
    { path: "canon/vision/mango-reference.jpg", box: [950, 1400, 1900, 1950] },
    {
      path: "canon/vision/mango-face-reference.jpg",
      label:
        "THE SAME DOG, closer — copy this face and these hands: both eyes on the paper with the muzzle bridge " +
        "between them, worry in the brows only, mouth up in a closed-lip smile, and two clawless fur-backed " +
        "hands. Not a second character",
    },
  ],
  abby: [
    {
      path: "canon/vision/abby-face-reference.jpg",
      label:
        "Abby, the terrier who owns and tends the bar. COPY THESE EYES EXACTLY — white showing both sides of a " +
        "drawn iris, a smaller round pupil, one catchlight, lashed upper lid. Copy her closed-lip half-smile, " +
        "her gaze going past the reader, and her sleek throat with no ruff. DO NOT COPY THE LENGTH OF HER " +
        "MUZZLE FROM THIS TILE — it is drawn too short here. Take the snout from the description instead: a " +
        "long blunt terrier snout, eye corner to nose tip one and a half to two eye-widths",
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
    // The staged panel already IS Drew and Mango in the room; only a
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
  // The room band rides along for bar scenes unless Mango is in the cast —
  // his crop still carries enough of the back bar to double up. Kept in
  // lockstep with the roster sentence in assemblePrompt.
  const roomCovered = cast.includes("mango");
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
  // Mango quietly pushed every three-hander to seven, and the whole cast of
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
  const spendExtras = () => {
    while (extras.length > 0 && list.length < LIMIT) list.push(extras.shift()!);
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
        "THE HOUSE SHOT — a finished cartoon of this same bar, attached for its GEOMETRY AND ITS BLOCKING " +
        "ONLY. Copy from it: the ONE marble counter and the fact that there is only one, crossing the middle " +
        "of the picture with its top surface visible and no second ledge, shelf or tier anywhere at any other " +
        "height; the walnut back bar standing beyond it as a distinctly farther wall; the flatscreen " +
        "TELEVISION mounted above the back bar, switched on and carrying a picture and a chyron band, never a " +
        "framed print; the chalkboard beside it; a sconce at each end; the front window at far left; and " +
        "above all WHO IS WHERE — the two gentlemen near and large on the patron side with the marble in " +
        "front of them, the bartender beyond it with the counter crossing her at the waist and her head " +
        "higher in the frame than theirs. DO NOT COPY its faces, its poses, its drinks, its bottle labels, " +
        "its chalkboard line, its headline or any of its lettering — this cartoon has its own. Take the room " +
        "and the blocking; leave everything else",
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
  "NEXT, BEYOND THEIR SHOULDERS",
  "FARTHEST, PAST THE COUNTER",
  "The two of them are on one side and she is on the other",
];

/** True when a paragraph belongs to the bar and must not travel. */
export function isBarOnly(paragraph: string): boolean {
  return BAR_ONLY_PARAGRAPHS.some((prefix) => paragraph.startsWith(prefix));
}

function fencesOf(masterPrompt: string) {
  const fences = [...masterPrompt.matchAll(/```text\n([\s\S]*?)```/g)].map((m) => m[1].trim());
  if (fences.length < 1) {
    throw new PublishError(500, "The master prompt has no BASE fence — canon/MASTER-PROMPT.md is malformed.");
  }
  return { base: fences[0], abbyBlock: fences[1] ?? "", awayBlock: fences[2] ?? "" };
}

// replaceAll, not replace: [SCENE] appears twice once Abby's fence is in play.
function fillSlots(text: string, candidate: Candidate): string {
  return text
    .replaceAll("[TV]", (candidate.tv ?? "BREAKING").trim())
    .replaceAll("[BOARD]", (candidate.board ?? "HAPPY HOUR 4–?").trim())
    .replaceAll("[SCENE]", candidate.scene.trim());
}

/**
 * The prompt for a fine-tuned model, which is a different document from the
 * prompt for Kontext rather than a variation on it.
 *
 * What the fine-tune knows, the prompt stops saying: the style paragraph
 * becomes one style token, and the DREW/MANGO/ABBY paragraphs become three
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
    throw new PublishError(400, "No known characters in the scene — use mango, drew, or abby.");
  }

  const parts = [`${STYLE_TRIGGER} single-panel cartoon. In the scene: ${cast.join(", ")}.`];

  if (candidate.setting) {
    if (!awayBlock) {
      throw new PublishError(500, "The master prompt has no away-game fence — cannot stage an outdoor scene.");
    }
    parts.push(awayBlock.replace("[SETTING]", candidate.setting.trim()));
  } else {
    const room = find("THE ROOM.");
    const stage = find("THE STAGE.");
    if (room) parts.push(room);
    if (stage) parts.push(stage);
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
    // Drew ships two tiles — the figure and a close study of his bill. The
    // headcount below is built from the CAST, not the reference count, but
    // say it out loud too: more references than characters must never become
    // more characters.
    const doubled =
      refs.length > candidate.characters.length
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
  const roomTile = !candidate.setting && !candidate.characters.some((c) => c.toLowerCase() === "mango");
  return (
    "Draw ONE SINGLE CONTINUOUS PANEL — one unbroken scene, edge to edge. There is no dividing line, " +
    "no seam, no split, no diptych, and no second frame: every character shares one room in one drawing. " +
    (staged
      ? `The attached image is a finished panel of this exact strip: Drew the flamingo gentleman and Mango ` +
        `the retriever gentleman seated at the marble bar counter of The Swinging Door, drinks on the marble, ` +
        `boards on the wall behind. KEEP that staging and both characters exactly — same faces, same builds, ` +
        `same wardrobe, same seats at the counter${cast.includes("abby") ? `. The SECOND, smaller tile is Abby, the white West Highland terrier proprietor: ADD her to the same panel, standing BEHIND the counter on the far side facing the two gentlemen, in a fitted light blouse with a towel over her shoulder and her studded gem-pendant collar, so the finished panel holds exactly three characters` : ", and draw exactly those two characters"}. ` +
        `NOW CHANGE IT for the scene below. The reference's chalkboard lists martini prices by airline fare ` +
        `class: ERASE that lettering completely and letter the board with this cartoon's own line instead, ` +
        `and put this cartoon's own headline on the TV screen. Every other change the scene asks for — the ` +
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
  mango: "Mango, the golden retriever gentleman in the dark jacket with the small US flag pin",
  abby: "Abby, the white West Highland terrier proprietor in the studded gem-pendant collar",
};

function ordinal(i: number): string {
  return ["first from the left", "second from the left", "third from the left"][i] ?? `number ${i + 1}`;
}
