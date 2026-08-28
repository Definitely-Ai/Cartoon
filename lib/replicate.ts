import { PublishError } from "./githubPublish";

// The one Replicate client. Everything that talks to Replicate — cartoon
// generation, the variant generator, the training routes — goes through
// here, because the failure modes are shared: the token has to be found
// however the Vercel integration spelled it, uploads and predictions retry
// the same way, and an error should always say what to fix.

const API = "https://api.replicate.com/v1";

/**
 * The API token. The official Vercel <-> Replicate integration injects
 * REPLICATE_API_TOKEN, but a hand-added variable sometimes arrives under
 * another spelling — probe the likely names and, when none hit, say exactly
 * which names were checked so the fix is obvious from the error alone.
 */
export function replicateToken(): string {
  const names = ["REPLICATE_API_TOKEN", "REPLICATE_API_KEY", "REPLICATE_TOKEN"];
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new PublishError(
    500,
    `No Replicate token found — checked ${names.join(", ")}. Connect the Replicate integration in Vercel ` +
      "(or add REPLICATE_API_TOKEN under Settings → Environment Variables) and redeploy."
  );
}

async function api(path: string, init?: RequestInit): Promise<Response> {
  return fetch(path.startsWith("http") ? path : `${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${replicateToken()}`,
      ...(init?.body && typeof init.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

/** Authed GET returning parsed JSON, or a PublishError naming the status. */
export async function replicateGet<T = Record<string, unknown>>(path: string): Promise<T> {
  const res = await api(path);
  if (!res.ok) {
    throw new PublishError(502, `Replicate said ${res.status} for ${path}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

/** Upload bytes to Replicate's file store; returns a URL usable as model input. */
export async function uploadFile(bytes: Buffer, filename: string, mime: string): Promise<string> {
  const form = new FormData();
  form.append("content", new Blob([new Uint8Array(bytes)], { type: mime }), filename);
  const res = await api("/files", { method: "POST", body: form });
  if (!res.ok) {
    throw new PublishError(502, `Replicate file upload failed (${res.status}): ${(await res.text().catch(() => "")).slice(0, 200)}`);
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
 * Create a prediction on a model and wait for its image. `model` is either
 * "owner/name" (latest version) or "owner/name:versionhash".
 */
export async function generateImage(
  model: string,
  input: Record<string, unknown>,
  timeoutMs = 110_000
): Promise<Buffer> {
  const [name, version] = model.includes(":") ? model.split(":") : [model, null];
  const res = await api(version ? "/predictions" : `/models/${name}/predictions`, {
    method: "POST",
    headers: { Prefer: "wait" },
    body: JSON.stringify(version ? { version, input } : { input }),
  });
  if (!res.ok) {
    throw new PublishError(
      502,
      `Replicate said ${res.status} starting the generation: ${(await res.text().catch(() => "")).slice(0, 200)}`
    );
  }
  let prediction = (await res.json()) as Prediction;

  const startedAt = Date.now();
  while (prediction.status === "starting" || prediction.status === "processing") {
    if (Date.now() - startedAt > timeoutMs) {
      throw new PublishError(504, "The image model is taking too long — try again.");
    }
    await new Promise((r) => setTimeout(r, 2500));
    const poll = await api(prediction.urls?.get ?? `/predictions/${prediction.id}`);
    if (!poll.ok) throw new PublishError(502, `Replicate said ${poll.status} while waiting.`);
    prediction = (await poll.json()) as Prediction;
  }
  if (prediction.status !== "succeeded") {
    throw new PublishError(
      502,
      `The image model ${prediction.status}${prediction.error ? `: ${String(prediction.error).slice(0, 200)}` : "."}`
    );
  }
  const url = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (!url) throw new PublishError(502, "The image model returned no output.");
  const image = await fetch(url);
  if (!image.ok) throw new PublishError(502, `Could not download the generated image (${image.status}).`);
  return Buffer.from(await image.arrayBuffer());
}

type Training = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  created_at?: string;
  completed_at?: string;
  error?: string | null;
  output?: { version?: string; weights?: string };
  urls?: { get?: string };
};

/** One training's live state. */
export async function getTraining(id: string): Promise<Training> {
  return replicateGet<Training>(`/trainings/${id}`);
}

/** First page of the account's trainings, newest first. */
export async function listTrainings(): Promise<Training[]> {
  const page = await replicateGet<{ results?: Training[] }>("/trainings");
  return page.results ?? [];
}

/** The account's username — needed to name the destination model. */
export async function accountUsername(): Promise<string> {
  const account = await replicateGet<{ username?: string }>("/account");
  if (!account.username) throw new PublishError(502, "Replicate /account returned no username.");
  return account.username;
}

/** Ensure a private destination model exists; returns "owner/name". */
export async function ensureModel(owner: string, name: string): Promise<string> {
  const existing = await api(`/models/${owner}/${name}`);
  if (existing.ok) return `${owner}/${name}`;
  if (existing.status !== 404) {
    throw new PublishError(502, `Replicate said ${existing.status} checking the destination model.`);
  }
  const created = await api("/models", {
    method: "POST",
    body: JSON.stringify({
      owner,
      name,
      visibility: "private",
      hardware: "cpu",
      description: "The Swinging Door — fine-tuned character model (trained via the studio).",
    }),
  });
  if (!created.ok) {
    throw new PublishError(
      502,
      `Could not create the destination model (${created.status}): ${(await created.text().catch(() => "")).slice(0, 200)}`
    );
  }
  return `${owner}/${name}`;
}

/** Start a training on the ostris FLUX LoRA trainer; returns the training id. */
export async function startTraining(
  destination: string,
  input: Record<string, unknown>,
  trainerVersion?: string
): Promise<{ id: string; version: string }> {
  const version =
    trainerVersion ??
    (
      await replicateGet<{ latest_version?: { id?: string } }>("/models/ostris/flux-dev-lora-trainer")
    ).latest_version?.id;
  if (!version) throw new PublishError(502, "Could not resolve the trainer's latest version.");
  const res = await api(`/models/ostris/flux-dev-lora-trainer/versions/${version}/trainings`, {
    method: "POST",
    body: JSON.stringify({ destination, input }),
  });
  if (!res.ok) {
    throw new PublishError(
      502,
      `Replicate said ${res.status} starting the training: ${(await res.text().catch(() => "")).slice(0, 300)}`
    );
  }
  const training = (await res.json()) as Training;
  return { id: training.id, version };
}

/** The writers' room's model. Text in, text out, on the same account that
 *  draws the panels — so Rick's one-line brief becomes ten gags without this
 *  project holding a second vendor's key. */
export async function generateText(
  model: string,
  input: Record<string, unknown>,
  timeoutMs = 150_000
): Promise<string> {
  const [name, version] = model.includes(":") ? model.split(":") : [model, null];
  const res = await api(version ? "/predictions" : `/models/${name}/predictions`, {
    method: "POST",
    headers: { Prefer: "wait" },
    body: JSON.stringify(version ? { version, input } : { input }),
  });
  if (!res.ok) {
    throw new PublishError(
      502,
      `Replicate said ${res.status} starting the writer: ${(await res.text().catch(() => "")).slice(0, 200)}`
    );
  }
  let prediction = (await res.json()) as Prediction;

  const startedAt = Date.now();
  while (prediction.status === "starting" || prediction.status === "processing") {
    if (Date.now() - startedAt > timeoutMs) {
      throw new PublishError(504, "The writer is taking too long — try again.");
    }
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await api(prediction.urls?.get ?? `/predictions/${prediction.id}`);
    if (!poll.ok) throw new PublishError(502, `Replicate said ${poll.status} while waiting on the writer.`);
    prediction = (await poll.json()) as Prediction;
  }
  if (prediction.status !== "succeeded") {
    throw new PublishError(
      502,
      `The writer ${prediction.status}${prediction.error ? `: ${String(prediction.error).slice(0, 200)}` : "."}`
    );
  }
  // Language models on Replicate stream as an array of string chunks; some
  // return one string. Both arrive here, and joining is correct for both.
  const out = prediction.output as unknown;
  const text = Array.isArray(out) ? out.join("") : typeof out === "string" ? out : "";
  if (!text.trim()) throw new PublishError(502, "The writer returned nothing.");
  return text;
}
