import * as fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DeskError, type DecisionInput, type DeskDecision, type DeskAuthor, type DecisionStatus } from "./studio-desk-core";

// Where a desk decision is kept. Imported only by Server Components and API
// handlers — no browser keys, no client bundle.
//
// Supabase is the real store, exactly as lib/studio-notes-server.ts uses it:
// the service key, the REST endpoint, no client library. When the Supabase
// environment is absent the desk falls back to one JSON file per decision
// under canon/room-kit/v2/decisions/ — which works on the studio machine and
// CANNOT work on Vercel, whose filesystem is read-only. The page says so
// plainly rather than pretending a save happened.

export type DeskStore = "supabase" | "file";
const TABLE = "room_desk_decisions";
const FIELDS = "id,created_at,author,layout,notes,approvals,status";

const unavailable = (writing = false) => new DeskError(503, writing
  ? "We could not confirm the send. Keep this page open — the arrangement is still here — and try again."
  : "The studio decisions could not be loaded. Refresh to try again.");

function supabase(writing = false) {
  const raw = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!raw || !key || raw === "[SENSITIVE]" || key === "[SENSITIVE]") throw unavailable(writing);
  try {
    const url = new URL(raw);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw unavailable(writing);
    return { url: url.origin, key };
  } catch { throw unavailable(writing); }
}

export function deskStore(env: NodeJS.ProcessEnv = process.env): DeskStore {
  const raw = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_KEY;
  return raw && key && raw !== "[SENSITIVE]" && key !== "[SENSITIVE]" ? "supabase" : "file";
}
/** True where the fallback file store cannot possibly work: a read-only host. */
export function readOnlyHost(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.VERCEL || env.VERCEL_ENV);
}
export function deskDecisionsDir(env: NodeJS.ProcessEnv = process.env): string {
  return env.DESK_DECISIONS_DIR || path.join(process.cwd(), "canon/room-kit/v2/decisions");
}

type Row = { id: string; created_at: string; author: DeskAuthor; layout: unknown; notes: unknown; approvals: unknown; status: DecisionStatus };
const record = (value: unknown): Record<string, never> => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, never>) : ({} as Record<string, never>));
function toDecision(row: Row): DeskDecision {
  if (!row || typeof row.id !== "string" || !Number.isFinite(Date.parse(row.created_at))) throw unavailable();
  return {
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    author: row.author,
    layout: record(row.layout),
    notes: record(row.notes),
    approvals: record(row.approvals),
    status: row.status || "sent",
  };
}

async function supabaseRequest(query: URLSearchParams, input?: Record<string, unknown>): Promise<DeskDecision[]> {
  const { url, key } = supabase(Boolean(input));
  try {
    const response = await fetch(`${url}/rest/v1/${TABLE}?${query}`, {
      method: input ? "POST" : "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
      headers: {
        apikey: key,
        ...(key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` }),
        ...(input ? { "Content-Type": "application/json", Prefer: "return=representation" } : {}),
      },
      ...(input ? { body: JSON.stringify(input) } : {}),
    });
    if (!response.ok) throw unavailable(Boolean(input));
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || (input && rows.length !== 1) || rows.length > 200) throw unavailable(Boolean(input));
    return rows.map((row) => toDecision(row as Row));
  } catch { throw unavailable(Boolean(input)); }
}

// ------------------------------------------------------------------ files

async function fileList(since: string | undefined, limit: number): Promise<DeskDecision[]> {
  const dir = deskDecisionsDir();
  let names: string[] = [];
  try { names = (await fs.readdir(dir)).filter((name) => /^[a-zA-Z0-9-]{1,64}\.json$/.test(name)); }
  catch { return []; }
  const out: DeskDecision[] = [];
  for (const name of names.slice(0, 500)) {
    try {
      const row = JSON.parse(await fs.readFile(path.join(dir, name), "utf8"));
      out.push(toDecision(row as Row));
    } catch { /* a half-written or hand-edited file is skipped, never fatal */ }
  }
  return out
    .filter((decision) => !since || decision.createdAt > since)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
    .slice(0, limit);
}

async function fileSave(decision: DeskDecision): Promise<DeskDecision> {
  const dir = deskDecisionsDir();
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `${decision.id}.json`), `${JSON.stringify({
      _doc: "One decision from the sticker desk on the website. Written because no Supabase environment was configured. scripts/desk-pull.py reads the same shape from the site's API; scripts/sticker-desk.mjs and scripts/compose-layers.py act on it.",
      id: decision.id,
      created_at: decision.createdAt,
      author: decision.author,
      layout: decision.layout,
      notes: decision.notes,
      approvals: decision.approvals,
      status: decision.status,
    }, null, 2)}\n`, "utf8");
  } catch {
    throw new DeskError(503, readOnlyHost()
      ? "This decision was not saved. The website is running on Vercel, whose filesystem is read-only, and no shared decisions table is configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY, then create the table in docs/sql/room-desk.sql."
      : "This decision could not be written to canon/room-kit/v2/decisions. Check that the folder is writable.");
  }
  return decision;
}

// ----------------------------------------------------------------- public

export async function listDeskDecisions(since?: string, limit = 100): Promise<DeskDecision[]> {
  if (since !== undefined && !Number.isFinite(Date.parse(since))) throw new DeskError(400, "“since” must be a date and time the studio recognises.");
  const count = Math.min(Math.max(Math.trunc(limit) || 100, 1), 200);
  const stamp = since ? new Date(since).toISOString() : undefined;
  if (deskStore() === "file") return fileList(stamp, count);
  const query = new URLSearchParams({ select: FIELDS, order: "created_at.desc,id.desc", limit: String(count) });
  if (stamp) query.set("created_at", `gt.${stamp}`);
  return supabaseRequest(query);
}

export async function saveDeskDecision(input: DecisionInput): Promise<DeskDecision> {
  const decision: DeskDecision = { id: randomUUID(), createdAt: new Date().toISOString(), ...input };
  if (deskStore() === "file") return fileSave(decision);
  const rows = await supabaseRequest(new URLSearchParams({ select: FIELDS }), {
    author: input.author, layout: input.layout, notes: input.notes, approvals: input.approvals, status: input.status,
  });
  return rows[0];
}

/** The one sentence the page shows about where these decisions are kept. */
export function deskStoreNote(): string {
  if (deskStore() === "supabase") return "Decisions are kept in the studio’s shared Supabase table room_desk_decisions, where the studio machine can poll for them.";
  return readOnlyHost()
    ? "No shared decisions table is configured, and this website runs on Vercel, whose filesystem is read-only — so nothing sent from here can be stored. Set SUPABASE_URL and SUPABASE_SERVICE_KEY and create the table in docs/sql/room-desk.sql."
    : "No Supabase environment is set, so decisions are written as one JSON file each into canon/room-kit/v2/decisions on this computer. That fallback works locally only; on Vercel the filesystem is read-only.";
}
