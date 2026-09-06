import { PublishError } from "./githubPublish";

// The art department's wire. AuraVision is the small FastAPI server that runs
// on the studio's own machine (Z:\ImageGenerator, run_server.py) and owns the
// GPU: it drives ComfyUI on the RTX 4090. The cartoon studio accepts local
// model IDs only; stored provider keys never enable hosted image generation.
// The site — local or on Vercel over Tailscale — only ever sends JSON here
// and gets PNG bytes back.
//
// AURAVISION_URL overrides the origin; the default is the Tailscale address
// of the studio machine, which is also what the deployed site uses.
const AURAVISION_ORIGIN = (process.env.AURAVISION_URL || "http://100.85.249.83:8000").replace(/\/$/, "");
const AURAVISION_API = `${AURAVISION_ORIGIN}/api/generate`;

// A local render can take a couple of minutes at full quality, and ComfyUI's
// first job after a cold start also loads twenty gigabytes of weights.
const TIMEOUT_MS = Number(process.env.AURAVISION_TIMEOUT_MS) || 20 * 60_000;

/** Reject hosted IDs before any reference upload or generation request. */
export function assertLocalImageModel(model: string): void {
  if (!/^local\/[a-z0-9][a-z0-9._-]*$/.test(model)) {
    throw new PublishError(400, "Image generation uses the studio’s local RTX 4090 only. Choose a local/ model; hosted image providers are disabled.");
  }
}

/** Generate an image via AuraVision synchronously; resolves to PNG bytes. */
export async function generateImageAuraVision(
  model: string,
  input: Record<string, unknown>
): Promise<Buffer> {
  assertLocalImageModel(model);
  const images =
    (input.input_images as string[] | undefined) ||
    (input.image_input as string[] | undefined) ||
    (input.input_image ? [input.input_image as string] : []);

  // Pass every dial through by its AuraVision name; the server ignores the
  // ones a given provider has no use for.
  const payload: Record<string, unknown> = {
    prompt: input.prompt,
    model,
    provider: "local",
    aspect_ratio: input.aspect_ratio || "4:5",
    input_images: images,
    negative_prompt: input.negative_prompt ?? "",
    quality: input.quality,
    output_format: input.output_format || "png",
    resolution: input.resolution,
    moderation: input.moderation,
    input_fidelity: input.input_fidelity,
    fast: input.fast ?? false,
    tag: input.tag,
  };
  if (input.num_inference_steps !== undefined || input.steps !== undefined) payload.steps = input.num_inference_steps ?? input.steps;
  if (input.guidance !== undefined) payload.guidance = input.guidance;
  if (input.seed !== undefined && input.seed !== null) payload.seed = input.seed;
  if (input.lora) payload.lora = input.lora;
  if (input.lora_strength !== undefined) payload.lora_strength = input.lora_strength;
  if (input.negative_refs !== undefined) payload.negative_refs = input.negative_refs;
  if (input.shift !== undefined) payload.shift = input.shift;
  if (input.sampler) payload.sampler = input.sampler;
  if (input.scheduler) payload.scheduler = input.scheduler;
  if (input.width) payload.width = input.width;
  if (input.height) payload.height = input.height;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response | undefined;
  // Node's fetch reuses idle sockets, and a socket the server has meanwhile
  // closed surfaces as a bare "fetch failed" before any byte is sent. That
  // is safe to retry once — the request never reached the server — and it
  // hit one panel in three during the first local batches.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      res = await fetch(AURAVISION_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Connection: "close" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      break;
    } catch (err) {
      const e = err as Error & { cause?: { code?: string } };
      const transient = e.name !== "AbortError" && /fetch failed|ECONNRESET|UND_ERR_SOCKET|other side closed/i.test(`${e.message} ${e.cause?.code ?? ""}`);
      if (transient && attempt < 2) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      clearTimeout(timer);
      const why = e.name === "AbortError" ? `no answer within ${Math.round(TIMEOUT_MS / 60000)} minutes` : `${e.message}${e.cause?.code ? ` (${e.cause.code})` : ""}`;
      throw new PublishError(502, `AuraVision at ${AURAVISION_ORIGIN} could not be reached: ${why}`);
    }
  }
  clearTimeout(timer);
  if (!res) throw new PublishError(502, `AuraVision at ${AURAVISION_ORIGIN} could not be reached.`);

  if (!res.ok) {
    throw new PublishError(
      502,
      `AuraVision said ${res.status} generating image: ${(await res.text().catch(() => "")).slice(0, 300)}`
    );
  }

  const data = (await res.json()) as {
    success: boolean;
    error?: string;
    image_url?: string;
    local_path?: string;
    seed_used?: number;
    metadata?: Record<string, unknown>;
  };
  if (!data.success) {
    throw new PublishError(502, `AuraVision generation failed: ${data.error}`);
  }
  if (!data.image_url) throw new PublishError(502, "AuraVision returned no output URL.");

  // image_url is server-relative (/outputs/…); it must be fetched from the
  // same origin the request went to. The old code fetched the bare path and
  // threw on every success.
  const url = new URL(data.image_url, `${AURAVISION_ORIGIN}/`);
  if (url.origin !== new URL(AURAVISION_ORIGIN).origin) {
    throw new PublishError(502, "AuraVision returned an image outside the studio server. No external download was made.");
  }
  const image = await fetch(url, { redirect: "error" });
  if (!image.ok) throw new PublishError(502, `Could not download the generated image from AuraVision (${image.status}).`);
  return Buffer.from(await image.arrayBuffer());
}

/**
 * References travel inline as data URIs — AuraVision is on the studio's own
 * machine, so there is nothing to upload anywhere first.
 */
export async function uploadFileAuraVision(bytes: Buffer, filename: string, mime: string): Promise<string> {
  void filename;
  return `data:${mime};base64,${bytes.toString("base64")}`;
}
