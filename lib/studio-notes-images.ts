import { findLibraryImageById } from "./studio-library";
import type { NoteImage, StudioNote } from "./studio-notes-core";

export function noteImage(id: string): NoteImage | null {
  const item = findLibraryImageById(id);
  return item ? { id: item.id, title: item.title, thumbnailUrl: item.thumbnailUrl, width: item.width, height: item.height } : null;
}
export function noteImages(notes: StudioNote[]): NoteImage[] {
  return [...new Set(notes.flatMap((note) => note.imageId ? [note.imageId] : []))].flatMap((id) => { const image = noteImage(id); return image ? [image] : []; });
}
