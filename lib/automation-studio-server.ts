import "server-only";
import { createHash } from "node:crypto";
import { AutomationError, validateEditionInput, type EditionInput, type SavedEditionPlan } from "./automation-studio-core";

// Service credentials belong only in this server module, never in response data.
const fields = "id,created_at,updated_at,status,input";
const unavailable = (writing = false) => new AutomationError(503, writing
  ? "We could not confirm this plan was saved. Keep your draft and refresh the saved plans before retrying. No automation was started."
  : "Saved plans are unavailable right now. Keep your draft and try again later. No automation was started.");

function configuration(writing = false) {
  const raw = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_KEY?.trim();
  const placeholder = (value: string | undefined) => !value || /\[(?:SENSITIVE|REDACTED)\]|^(?:undefined|null)$/i.test(value);
  if (placeholder(raw) || placeholder(key) || key!.startsWith("sb_publishable_")) throw unavailable(writing);
  try {
    const url = new URL(raw!);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if ((url.protocol !== "https:" && !(url.protocol === "http:" && local)) || url.username || url.password ||
        url.search || url.hash || url.pathname !== "/") throw unavailable(writing);
    return { url: url.origin, key: key! };
  } catch { throw unavailable(writing); }
}

function inputId(input: EditionInput): string {
  // validateEditionInput returns a fixed property order and sorted unique weekdays.
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function toPlan(value: unknown): SavedEditionPlan {
  try {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw unavailable();
    const row = value as Record<string, unknown>;
    if (typeof row.id !== "string" || !/^[a-f0-9]{64}$/.test(row.id) ||
        typeof row.created_at !== "string" || !Number.isFinite(Date.parse(row.created_at)) ||
        typeof row.updated_at !== "string" || !Number.isFinite(Date.parse(row.updated_at)) ||
        Date.parse(row.updated_at) < Date.parse(row.created_at) ||
        (row.status !== "planned" && row.status !== "archived")) throw unavailable();
    // Old plans remain readable; the creation-time validator is not today's clock.
    const input = validateEditionInput(row.input, new Date(row.created_at));
    if (inputId(input) !== row.id) throw unavailable();
    return { id: row.id, createdAt: row.created_at, updatedAt: row.updated_at, status: row.status, input };
  } catch { throw unavailable(); }
}

type Configuration = ReturnType<typeof configuration>;
async function storageRequest(config: Configuration, query: URLSearchParams, body?: Record<string, unknown>): Promise<Response> {
  const response = await fetch(`${config.url}/rest/v1/automation_edition_plans?${query}`, {
    method: body ? "POST" : "GET", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10_000),
    headers: {
      apikey: config.key,
      ...(config.key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${config.key}` }),
      ...(body ? { "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw unavailable(Boolean(body));
  return response;
}

async function readPlans(config: Configuration, query: URLSearchParams, limit: number): Promise<SavedEditionPlan[]> {
  const response = await storageRequest(config, query);
  const rows: unknown = await response.json();
  if (!Array.isArray(rows) || rows.length > limit) throw unavailable();
  const plans = rows.map(toPlan);
  if (new Set(plans.map(plan => plan.id)).size !== plans.length) throw unavailable();
  return plans;
}

export async function listEditionPlans(): Promise<SavedEditionPlan[]> {
  try {
    return await readPlans(configuration(), new URLSearchParams({ select: fields, order: "created_at.desc,id.desc", limit: "100" }), 100);
  } catch { throw unavailable(); }
}

export async function saveEditionPlan(input: EditionInput): Promise<SavedEditionPlan> {
  const now = new Date();
  const normalized = validateEditionInput(input, now);
  const id = inputId(normalized);
  try {
    const config = configuration(true);
    // A primary-key conflict does nothing: parallel submissions cannot duplicate a
    // plan, reset its dates, or accidentally reactivate an archived plan.
    await storageRequest(config, new URLSearchParams({ on_conflict: "id" }), {
      id, created_at: now.toISOString(), updated_at: now.toISOString(), status: "planned", input: normalized,
    });
    // Read after the insert/ignore statement commits. Empty insert representations
    // are normal on a duplicate; only this exact stored row confirms the save.
    const plans = await readPlans(config, new URLSearchParams({ select: fields, id: `eq.${id}`, limit: "2" }), 1);
    if (plans.length !== 1 || plans[0].id !== id) throw unavailable(true);
    return plans[0];
  } catch { throw unavailable(true); }
}
