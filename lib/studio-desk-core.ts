// The sticker desk, shared half. Types and validation for one DECISION: the
// arrangement Rick and Zechariah agree on in the browser, sent to the studio
// machine so the GPU can act on it. Nothing here touches the filesystem or the
// network, so both the API route and the client can import it.
//
// A decision is deliberately small and declarative — it is not a render order.
// The site cannot draw. It records where each object belongs, which archived
// version was chosen, what was said about it, and who said it. The local
// studio (scripts/desk-pull.py, then scripts/sticker-desk.mjs and
// scripts/compose-layers.py) re-cuts and rebuilds at full quality.

export const DESK_AUTHORS = ["Rick", "Zechariah"] as const;
export const APPROVAL_STATES = ["approved", "needs-work", "comment"] as const;
export const DECISION_STATUSES = ["sent", "received", "applied"] as const;
/** The one note key that is not a part: the message to the studio as a whole. */
export const DESK_MESSAGE_KEY = "_all";

export type DeskAuthor = (typeof DESK_AUTHORS)[number];
export type ApprovalState = (typeof APPROVAL_STATES)[number];
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

/** One layer's placement. dx/dy are plate pixels away from where the sticker
 *  was cut — the same meaning as canon/room-kit/v2/layout.json. `version` is a
 *  version id from canon/room-kit/v2/history/<part>/INDEX.md, or null for the
 *  approved cut that is in the kit now. */
export type DeskLayer = { dx: number; dy: number; visible: boolean; version: string | null };
export type DeskApproval = { state: ApprovalState; author: DeskAuthor; at: string };
export type DeskDecision = {
  id: string;
  createdAt: string;
  author: DeskAuthor;
  layout: Record<string, DeskLayer>;
  notes: Record<string, string>;
  approvals: Record<string, DeskApproval>;
  status: DecisionStatus;
};
export type DecisionInput = {
  author: DeskAuthor;
  layout: Record<string, DeskLayer>;
  notes: Record<string, string>;
  approvals: Record<string, DeskApproval>;
  status: DecisionStatus;
};

export class DeskError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "DeskError";
    this.status = status;
  }
}

const PART = /^[a-z0-9][a-z0-9-]{0,39}$/;
const VERSION = /^v\d{1,4}$/;
const MAX_LAYERS = 64;
const MAX_NUDGE = 4000;
const MAX_NOTE = 2000;

export const validPartId = (value: unknown): value is string => typeof value === "string" && PART.test(value);
export const validVersionId = (value: unknown): value is string => typeof value === "string" && VERSION.test(value);
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new DeskError(400, "This decision could not be read. Arrange the room again and resend it.");
  return value as Record<string, unknown>;
};
const stamp = (value: unknown): string => (typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : new Date().toISOString());

export function validateDecisionInput(value: unknown): DecisionInput {
  const input = object(value);
  if (Object.keys(input).some((key) => !["author", "layout", "notes", "approvals", "status"].includes(key))) throw new DeskError(400, "The decision contains an unsupported field.");
  if (!DESK_AUTHORS.includes(input.author as DeskAuthor)) throw new DeskError(400, "Choose Rick or Zechariah before sending this to the studio.");
  if (input.status !== undefined && input.status !== "sent") throw new DeskError(400, "A decision leaves this page as “sent”. Only the studio marks it received or applied.");

  const rawLayout = object(input.layout);
  const layout: Record<string, DeskLayer> = {};
  const parts = Object.keys(rawLayout);
  if (!parts.length) throw new DeskError(400, "No layers were included. Arrange the room, then send it.");
  if (parts.length > MAX_LAYERS) throw new DeskError(400, "That is more layers than the room kit holds.");
  for (const part of parts) {
    if (!validPartId(part)) throw new DeskError(400, `“${String(part).slice(0, 40)}” is not a room-kit layer name.`);
    const layer = object(rawLayout[part]);
    const dx = Number(layer.dx ?? 0);
    const dy = Number(layer.dy ?? 0);
    if (!Number.isInteger(dx) || !Number.isInteger(dy) || Math.abs(dx) > MAX_NUDGE || Math.abs(dy) > MAX_NUDGE) throw new DeskError(400, `The offset saved for “${part}” is outside the plate.`);
    if (typeof layer.visible !== "boolean") throw new DeskError(400, `Whether “${part}” is shown was not recorded.`);
    const version = layer.version ?? null;
    if (version !== null && !validVersionId(version)) throw new DeskError(400, `“${part}” names a version this desk does not recognise.`);
    layout[part] = { dx, dy, visible: layer.visible, version: version as string | null };
  }

  const rawNotes = object(input.notes);
  const notes: Record<string, string> = {};
  for (const [key, text] of Object.entries(rawNotes)) {
    if (key !== DESK_MESSAGE_KEY && !validPartId(key)) throw new DeskError(400, "A note was written against something that is not a layer.");
    if (typeof text !== "string" || text.includes("\0")) throw new DeskError(400, "A note could not be read. Please retype it.");
    const body = text.trim();
    if (!body) continue;
    if (body.length > MAX_NOTE) throw new DeskError(400, `Keep each note under ${MAX_NOTE.toLocaleString()} characters.`);
    notes[key] = body;
  }

  const rawApprovals = object(input.approvals);
  const approvals: Record<string, DeskApproval> = {};
  for (const [part, entry] of Object.entries(rawApprovals)) {
    if (!validPartId(part)) throw new DeskError(400, "A verdict was recorded against something that is not a layer.");
    const verdict = object(entry);
    if (!APPROVAL_STATES.includes(verdict.state as ApprovalState)) throw new DeskError(400, `Choose approve, needs work or comment for “${part}”.`);
    if (!DESK_AUTHORS.includes(verdict.author as DeskAuthor)) throw new DeskError(400, `A verdict on “${part}” has no name against it.`);
    approvals[part] = { state: verdict.state as ApprovalState, author: verdict.author as DeskAuthor, at: stamp(verdict.at) };
  }
  if (Object.keys(approvals).length > MAX_LAYERS) throw new DeskError(400, "That is more verdicts than the room kit has layers.");

  return { author: input.author as DeskAuthor, layout, notes, approvals, status: "sent" };
}

/** Same-origin, JSON-only, size-capped body reader — the studio-notes rule,
 *  with a larger cap because a decision carries every layer. */
export async function readDeskRequest(request: Request, max = 64 * 1024): Promise<unknown> {
  const origin = new URL(request.url).origin;
  const site = request.headers.get("sec-fetch-site");
  if (request.headers.get("origin") !== origin || (site && site !== "same-origin")) throw new DeskError(403, "Send this decision from the sticker desk page.");
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new DeskError(415, "Send the decision as JSON.");
  if (Number(request.headers.get("content-length")) > max) throw new DeskError(413, "This decision is too large to send.");
  if (!request.body) throw new DeskError(400, "Arrange the room first.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      bytes += result.value.byteLength;
      if (bytes > max) { await reader.cancel(); throw new DeskError(413, "This decision is too large to send."); }
      chunks.push(result.value);
    }
  } finally { reader.releaseLock(); }
  const all = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(all)); }
  catch { throw new DeskError(400, "The decision could not be read. Please try again."); }
}

/** How a decision reads back to a person, for the desk's own history list. */
export function summarizeDecision(decision: DeskDecision): string {
  const layers = Object.values(decision.layout);
  const verdicts = Object.values(decision.approvals);
  const moved = layers.filter((layer) => layer.dx || layer.dy).length;
  const hidden = layers.filter((layer) => !layer.visible).length;
  const swapped = layers.filter((layer) => layer.version).length;
  const approved = verdicts.filter((entry) => entry.state === "approved").length;
  const work = verdicts.filter((entry) => entry.state === "needs-work").length;
  return [
    `${layers.length} layers`,
    moved ? `${moved} moved` : "",
    swapped ? `${swapped} version ${swapped === 1 ? "swap" : "swaps"}` : "",
    hidden ? `${hidden} hidden` : "",
    approved ? `${approved} approved` : "",
    work ? `${work} needing work` : "",
  ].filter(Boolean).join(" · ");
}
