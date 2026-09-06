import { StudioNotesError, validNoteImageId, type NoteInput, type StudioNote, type NoteAuthor, type NoteTopic } from "./studio-notes-core";

// Imported only by Server Components and API handlers. No browser keys.
const unavailable = (writing = false) => new StudioNotesError(503, writing
  ? "We could not confirm the save. Keep your draft and refresh the notes before retrying."
  : "Shared notes could not be loaded. Please refresh to try again.");
function configuration(writing = false) {
  const raw = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!raw || !key || raw === "[SENSITIVE]" || key === "[SENSITIVE]") throw unavailable(writing);
  try {
    const url = new URL(raw);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw unavailable(writing);
    return { url: url.origin, key };
  } catch { throw unavailable(writing); }
}
type Row = { id: string; created_at: string; author: NoteAuthor; body: string; topic: NoteTopic; image_id: string | null };
function toNote(row: Row): StudioNote {
  if (!row || typeof row.id !== "string" || !Number.isFinite(Date.parse(row.created_at)) || typeof row.body !== "string") throw unavailable();
  return { id: row.id, createdAt: row.created_at, author: row.author, body: row.body, topic: row.topic, imageId: row.image_id };
}
async function requestNotes(query: URLSearchParams, input?: NoteInput): Promise<StudioNote[]> {
  const { url, key } = configuration(Boolean(input));
  try {
    const response = await fetch(`${url}/rest/v1/studio_notes?${query}`, {
      method: input ? "POST" : "GET", cache: "no-store", signal: AbortSignal.timeout(10_000),
      headers: { apikey: key, ...(key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` }), ...(input ? { "Content-Type": "application/json", Prefer: "return=representation" } : {}) },
      ...(input ? { body: JSON.stringify(input) } : {}),
    });
    if (!response.ok) throw unavailable();
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || (input && rows.length !== 1) || rows.length > 100) throw unavailable();
    return rows.map((row) => toNote(row as Row));
  } catch { throw unavailable(Boolean(input)); }
}
const fields = "id,created_at,author,body,topic,image_id";
export async function listStudioNotes(imageId?: string): Promise<StudioNote[]> {
  if (imageId !== undefined && !validNoteImageId(imageId)) throw new StudioNotesError(400, "Choose an image from the image library.");
  const query = new URLSearchParams({ select: fields, order: "created_at.desc,id.desc", limit: "100" });
  if (imageId) query.set("image_id", `eq.${imageId}`);
  return requestNotes(query);
}
export async function saveStudioNote(input: NoteInput): Promise<StudioNote> {
  const rows = await requestNotes(new URLSearchParams({ select: fields }), input);
  return rows[0];
}
