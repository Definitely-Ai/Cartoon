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
const VISION_REFS: Record<string, { path: string; box?: [number, number, number, number] }> = {
  drew: { path: "canon/vision/drew-reference.jpg" },
  mango: { path: "canon/vision/mango-reference.jpg", box: [300, 600, 2300, 2800] },
  abby: { path: "canon/vision/abby-face-reference.jpg" },
};

/**
 * One reference board: each requested character's plate study, side by side
 * on white, grayscaled and normalised so the photographed prints read as ink
 * on one shared sheet. Kontext sees a single conditioning image, so the cast
 * shares a canvas.
 */
export async function buildReferenceBoard(characters: string[]): Promise<Buffer> {
  const masters: Buffer[] = [];
  for (const character of characters) {
    const ref = VISION_REFS[character.toLowerCase()];
    if (!ref) continue;
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

/**
 * Generate one panel: prompt (+ reference board on the Kontext path) in,
 * PNG bytes out. Synchronous from the caller's point of view.
 */
export async function generateCartoonArt(input: {
  prompt: string;
  characters: string[];
  /** Override the model for this one call — the smoke-test route injects a
   *  freshly trained version here before IMAGE_MODEL is promoted to it. */
  model?: string;
}): Promise<Buffer> {
  const model = input.model ?? imageModel();
  const fineTuned = !model.includes("kontext");

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
        input_image: await uploadFile(await buildReferenceBoard(input.characters), "reference-board.jpg", "image/jpeg"),
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
  fineTuned: boolean = isFineTuned()
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

  // Kontext is instruction-driven: tell it what the conditioning image is.
  return (
    "The attached image is the character reference board — match each character's construction, " +
    "face, and proportions exactly; do not copy the board's layout or backgrounds. Draw a new " +
    "single-panel cartoon:\n\n" +
    prompt
  );
}
