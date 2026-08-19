import sharp from "sharp";
import { PublishError, getModelSheets } from "./githubPublish";

// The art department. ChatGPT (or any connected chat AI) never touches
// image bytes — it sends text through make_cartoons, and this module
// turns that text into a drawn panel: compose the canon prompt, build a
// reference board from the locked model sheets, and call a hosted FLUX
// model (Replicate). Only the server ever holds pixels, which is the
// whole reason the phone flow works.

const REPLICATE_API = "https://api.replicate.com/v1";

// FLUX.1 Kontext takes one conditioning image + an instruction prompt —
// the strongest hosted option for "match these exact characters".
const DEFAULT_MODEL = "black-forest-labs/flux-kontext-pro";

function replicateToken(): string {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new PublishError(
      500,
      "REPLICATE_API_TOKEN is not set — create a Replicate account, add the token in Vercel, redeploy. See docs/SETUP.md."
    );
  }
  return token;
}

function imageModel(): string {
  return process.env.IMAGE_MODEL || DEFAULT_MODEL;
}

/**
 * One reference board: the locked master sheet of every character in the
 * scene, side by side on white. Kontext sees a single conditioning image,
 * so the cast shares a canvas.
 */
export async function buildReferenceBoard(characters: string[]): Promise<Buffer> {
  const masters: Buffer[] = [];
  for (const character of characters) {
    const sheets = await getModelSheets(character);
    const master = sheets.find((s) => s.name === "full-body-sheet.png") ?? sheets[0];
    if (!master) continue;
    masters.push(Buffer.from(master.base64, "base64"));
  }
  if (masters.length === 0) {
    throw new PublishError(400, "No reference sheets found for the requested characters.");
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

/** Upload a file to Replicate's file store; returns a URL usable as a model input. */
async function uploadToReplicate(bytes: Buffer, token: string): Promise<string> {
  const form = new FormData();
  form.append("content", new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }), "reference-board.jpg");
  const res = await fetch(`${REPLICATE_API}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    throw new PublishError(502, `Replicate file upload failed (${res.status}).`);
  }
  const file = (await res.json()) as { urls?: { get?: string } };
  if (!file.urls?.get) throw new PublishError(502, "Replicate file upload returned no URL.");
  return file.urls.get;
}

type Prediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string | null;
  urls?: { get?: string };
};

/**
 * Generate one panel: prompt + reference board in, PNG bytes out.
 * Synchronous from the caller's point of view; polls Replicate until the
 * prediction settles (or ~110s pass).
 */
export async function generateCartoonArt(input: {
  prompt: string;
  characters: string[];
}): Promise<Buffer> {
  const token = replicateToken();
  const board = await buildReferenceBoard(input.characters);
  const boardUrl = await uploadToReplicate(board, token);

  const model = imageModel();
  const createRes = await fetch(`${REPLICATE_API}/models/${model}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      input: {
        prompt: input.prompt,
        input_image: boardUrl,
        aspect_ratio: "4:5",
        output_format: "png",
        // The strip is a dry gag cartoon — nothing here should trip
        // conservative filters, so keep the default tolerance.
      },
    }),
  });
  if (!createRes.ok) {
    const detail = await createRes.text().catch(() => "");
    throw new PublishError(
      502,
      `Replicate said ${createRes.status} starting the generation${detail ? `: ${detail.slice(0, 200)}` : "."}`
    );
  }
  let prediction = (await createRes.json()) as Prediction;

  const startedAt = Date.now();
  while (prediction.status === "starting" || prediction.status === "processing") {
    if (Date.now() - startedAt > 110_000) {
      throw new PublishError(504, "The image model is taking too long — try the batch again.");
    }
    await new Promise((r) => setTimeout(r, 2500));
    const pollUrl = prediction.urls?.get ?? `${REPLICATE_API}/predictions/${prediction.id}`;
    const pollRes = await fetch(pollUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!pollRes.ok) throw new PublishError(502, `Replicate said ${pollRes.status} while waiting.`);
    prediction = (await pollRes.json()) as Prediction;
  }

  if (prediction.status !== "succeeded") {
    throw new PublishError(
      502,
      `The image model ${prediction.status}${prediction.error ? `: ${String(prediction.error).slice(0, 200)}` : "."}`
    );
  }
  const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (!outputUrl) throw new PublishError(502, "The image model returned no output.");

  const imageRes = await fetch(outputUrl);
  if (!imageRes.ok) throw new PublishError(502, `Could not download the generated image (${imageRes.status}).`);
  return Buffer.from(await imageRes.arrayBuffer());
}

// ---------------------------------------------------------------- prompt

/**
 * Assemble the final image prompt from the live master prompt: the
 * verbatim BASE fence with slots filled; for away games the ROOM+STAGE
 * paragraphs are swapped for the outdoor setting passage; the ABBY fence
 * is appended when she's in the scene. The canon file is the single
 * source — edits to the bible reach the next generation automatically.
 */
export function assemblePrompt(
  masterPrompt: string,
  candidate: {
    scene: string;
    tv?: string;
    board?: string;
    setting?: string;
    characters: string[];
  }
): string {
  const fences = [...masterPrompt.matchAll(/```text\n([\s\S]*?)```/g)].map((m) => m[1].trim());
  if (fences.length < 1) {
    throw new PublishError(500, "The master prompt has no BASE fence — canon/MASTER-PROMPT.md is malformed.");
  }
  const base = fences[0];
  const abbyBlock = fences[1] ?? "";
  const awayBlock = fences[2] ?? "";

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
  } else {
    prompt = prompt
      .replace("[TV]", (candidate.tv ?? "BREAKING").trim())
      .replace("[BOARD]", (candidate.board ?? "HAPPY HOUR 4–?").trim());
  }
  prompt = prompt.replace("[SCENE]", candidate.scene.trim());

  if (candidate.characters.map((c) => c.toLowerCase()).includes("abby") && abbyBlock) {
    prompt = `${prompt}\n\n${abbyBlock}`;
  }

  // Kontext is instruction-driven: tell it what the conditioning image is.
  return (
    "The attached image is the character reference board — match each character's construction, " +
    "face, and proportions exactly; do not copy the board's layout or backgrounds. Draw a new " +
    "single-panel cartoon:\n\n" +
    prompt
  );
}
