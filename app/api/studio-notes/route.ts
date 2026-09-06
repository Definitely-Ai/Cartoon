import { cookies } from "next/headers";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { readNoteRequest, StudioNotesError, validateNoteInput, validNoteImageId } from "@/lib/studio-notes-core";
import { listStudioNotes, saveStudioNote } from "@/lib/studio-notes-server";
import { findLibraryImageById } from "@/lib/studio-library";
import { noteImages } from "@/lib/studio-notes-images";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
async function signedIn() { return isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value); }
function failure(error: unknown) { return json({ error: error instanceof StudioNotesError ? error.message : "Shared notes are unavailable right now. Please try again later." }, error instanceof StudioNotesError ? error.status : 503); }
export async function GET(request: Request) {
  if (!await signedIn()) return json({ error: "Sign in to read shared notes." }, 401);
  try {
    const imageId = new URL(request.url).searchParams.get("image") ?? undefined;
    if (imageId !== undefined && (!validNoteImageId(imageId) || !findLibraryImageById(imageId))) throw new StudioNotesError(400, "Choose an image from the image library.");
    const notes = await listStudioNotes(imageId);
    return json({ notes, images: noteImages(notes), checkedAt: new Date().toISOString() });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  if (!await signedIn()) return json({ error: "Sign in to save a shared note." }, 401);
  try {
    const input = validateNoteInput(await readNoteRequest(request), (id) => Boolean(findLibraryImageById(id)));
    const note = await saveStudioNote(input);
    return json({ note, images: noteImages([note]) }, 201);
  } catch (error) { return failure(error); }
}
