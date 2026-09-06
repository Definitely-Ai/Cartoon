export const NOTE_AUTHORS = ["Rick", "Zechariah"] as const;
export const NOTE_TOPICS = ["general", "room", "Drew", "Barclay", "Abby", "newspaper"] as const;
export type NoteAuthor = typeof NOTE_AUTHORS[number];
export type NoteTopic = typeof NOTE_TOPICS[number];
export type NoteInput = { author: NoteAuthor; body: string; topic: NoteTopic; image_id: string | null };
export type StudioNote = { id: string; createdAt: string; author: NoteAuthor; body: string; topic: NoteTopic; imageId: string | null };
export type NoteImage = { id: string; title: string; thumbnailUrl: string; width: number; height: number };
export type NotesResult = { notes: StudioNote[]; images: NoteImage[]; checkedAt: string };

export class StudioNotesError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.name = "StudioNotesError"; this.status = status; }
}
export function validNoteImageId(value: unknown): value is string { return typeof value === "string" && /^[a-f0-9]{64}$/.test(value); }
export function validateNoteInput(value: unknown, imageExists: (id: string) => boolean): NoteInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new StudioNotesError(400, "Write a note using the form.");
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !["author", "body", "topic", "image_id"].includes(key))) throw new StudioNotesError(400, "The note contains an unsupported field.");
  if (!NOTE_AUTHORS.includes(input.author as NoteAuthor)) throw new StudioNotesError(400, "Choose Rick or Zechariah as the name on this note.");
  if (!NOTE_TOPICS.includes(input.topic as NoteTopic)) throw new StudioNotesError(400, "Choose a topic from the list.");
  if (typeof input.body !== "string" || !input.body.trim() || input.body.trim().length > 4000 || input.body.includes("\0")) throw new StudioNotesError(400, "Write a note between 1 and 4,000 characters.");
  const image = input.image_id ?? null;
  if (image !== null && (!validNoteImageId(image) || !imageExists(image))) throw new StudioNotesError(400, "Choose an image from the image library.");
  return { author: input.author as NoteAuthor, body: input.body.trim(), topic: input.topic as NoteTopic, image_id: image as string | null };
}

export async function readNoteRequest(request: Request): Promise<unknown> {
  if (request.headers.get("origin") !== new URL(request.url).origin || (request.headers.get("sec-fetch-site") && request.headers.get("sec-fetch-site") !== "same-origin")) throw new StudioNotesError(403, "Send this note from the studio page.");
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new StudioNotesError(415, "Send the note as JSON.");
  const max = 8 * 1024;
  if (Number(request.headers.get("content-length")) > max) throw new StudioNotesError(413, "This note is too large to send.");
  if (!request.body) throw new StudioNotesError(400, "Write a note first.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      bytes += result.value.byteLength;
      if (bytes > max) { await reader.cancel(); throw new StudioNotesError(413, "This note is too large to send."); }
      chunks.push(result.value);
    }
  } finally { reader.releaseLock(); }
  const all = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(all)); }
  catch { throw new StudioNotesError(400, "The note could not be read. Please try again."); }
}
