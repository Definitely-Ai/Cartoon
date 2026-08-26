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
const DEFAULT_MODEL = "black-forest-labs/flux-kontext-pro";

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
  return !imageModel().includes("kontext");
}

// How hard the fine-tune is applied. This is the dial to reach for first when
// something is wrong: identity slipping means turn it up, a boat that keeps
// coming back as a barroom means turn it down.
function loraScale(): number {
  const raw = Number(process.env.LORA_SCALE);
  return Number.isFinite(raw) && raw > 0 ? raw : 0.9;
}

function imageModel(): string {
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
const VISION_REFS: Record<string, { path: string; box?: [number, number, number, number] }> = {
  drew: { path: "canon/vision/drew-reference.jpg", box: [60, 60, 1010, 1180] },
  mango: { path: "canon/vision/mango-reference.jpg", box: [950, 1400, 1900, 1950] },
  abby: { path: "canon/vision/abby-face-reference.jpg" },
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
    if (cast.includes("abby")) refs.push(VISION_REFS.abby);
    return composeBoard(refs);
  }
  for (const character of cast) {
    const ref = VISION_REFS[character];
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

/** FLUX.2 takes references as a real array and lets the prompt address each
 *  one by index, so the cast no longer has to share one collaged board. */
export function isMultiRef(model: string): boolean {
  return model.includes("flux-2");
}

/** The ordered reference list for the multi-reference path: one entry per
 *  character, then the room. Index order IS the @image1..N order the prompt
 *  refers to, so the two must be built from the same list. */
export function referenceList(
  characters: string[],
  barScene: boolean
): { label: string; path: string; box?: [number, number, number, number] }[] {
  const list: { label: string; path: string; box?: [number, number, number, number] }[] = [];
  for (const character of characters) {
    const key = character.toLowerCase();
    const ref = VISION_REFS[key];
    if (ref) list.push({ label: CAST_BLURB[key] ?? key, ...ref });
  }
  if (barScene) {
    list.push({
      label:
        "the room itself — the walnut wall of The Swinging Door with its flatscreen TV and its hand-lettered " +
        "chalkboard: match this room's panelling, fittings, and engraved drawing style",
      ...ROOM_TILE,
    });
  }
  return list;
}

async function uploadReferences(
  characters: string[],
  barScene: boolean
): Promise<string[]> {
  const urls: string[] = [];
  for (const [i, ref] of referenceList(characters, barScene).entries()) {
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
}): Promise<Buffer> {
  const model = input.model ?? imageModel();
  const multiRef = isMultiRef(model);
  const fineTuned = !model.includes("kontext") && !multiRef;

  // FLUX.2: each reference is its own input image, addressed by index in the
  // prompt. No collage, so no tile out-argues another — and safety_tolerance
  // is a real dial rather than an opaque refusal.
  if (multiRef) {
    return generateImage(model, {
      prompt: input.prompt,
      input_images: await uploadReferences(input.characters, input.barScene ?? false),
      aspect_ratio: "4:5",
      output_format: "png",
      // BFL caps tolerance at 2 once input images are attached; 5 is a
      // text-to-image-only value and the call is refused outright.
      safety_tolerance: 2,
    });
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
export function assemblePrompt(
  masterPrompt: string,
  candidate: Candidate,
  fineTuned: boolean = isFineTuned(),
  staged = false,
  multiRef = false
): string {
  if (fineTuned) return fineTunedPrompt(masterPrompt, candidate);

  const { base, abbyBlock, awayBlock } = fencesOf(masterPrompt);
  let prompt = base;
  if (candidate.setting) {
    if (!awayBlock) {
      throw new PublishError(500, "The master prompt has no away-game fence — cannot stage an outdoor scene.");
    }
    // Swap the bar's ROOM+STAGE paragraphs for the outdoor setting passage.
    const paragraphs = prompt.split("\n\n");
    const kept = paragraphs.filter((p) => !p.startsWith("THE ROOM.") && !p.startsWith("THE STAGE."));
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
    return (
      "Draw ONE single-panel black-and-white gag cartoon, one unbroken scene edge to edge — no seam, no " +
      "split, no second frame, and no photographic rendering.\n\n" +
      `REFERENCES. ${roster} Draw each character exactly as his or her own reference draws that character ` +
      "— same face, same build, same wardrobe — and give the panel the same antique-engraving hand. Do NOT " +
      "reproduce any reference's own background, signage, lettering, or composition: every word of lettering " +
      "in this cartoon comes from the scene described below, and nothing else.\n\n" +
      `The finished panel contains EXACTLY ${candidate.characters.length} character${candidate.characters.length > 1 ? "s" : ""}` +
      `${candidate.characters.length > 1 ? ", each a separate individual — never merged, never duplicated, never omitted" : ""}.` +
      "\n\nTHE CARTOON:\n\n" +
      prompt
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
