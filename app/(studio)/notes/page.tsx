import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { listStudioNotes } from "@/lib/studio-notes-server";
import { noteImage, noteImages } from "@/lib/studio-notes-images";
import { StudioNotesError, type NotesResult } from "@/lib/studio-notes-core";
import NotesClient from "./NotesClient";
import "./notes.css";

export const metadata: Metadata = { title: "Shared notes" };
export const dynamic = "force-dynamic";
export default async function NotesPage({ searchParams }: { searchParams: Promise<{ image?: string }> }) {
  if (!await isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value)) redirect("/login");
  const { image: imageId } = await searchParams;
  const selectedImage = imageId ? noteImage(imageId) : null;
  let initial: NotesResult | null = null;
  let error = imageId && !selectedImage ? "That image is not in the current library. Open an image in the library to leave a note about it." : "";
  if (!error) {
    try { const notes = await listStudioNotes(imageId); initial = { notes, images: noteImages(notes), checkedAt: new Date().toISOString() }; }
    catch (caught) { error = caught instanceof StudioNotesError ? caught.message : "Shared notes are unavailable right now."; }
  }
  return <main id="content" className="workspace-main notes-page">
    <header className="desk-heading"><p className="desk-eyebrow">Rick’s studio notes</p><h1>A place to keep<br />the conversation.</h1><p className="desk-intro">Leave a question, an art correction, or the next thing we should work on. The latest 100 notes appear here, newest first.</p></header>
    <NotesClient key={imageId || "all"} initial={initial} initialError={error} selectedImage={selectedImage} invalidImage={Boolean(imageId && !selectedImage)} />
    <p className="notes-footer"><Link href="/library">Choose an image to discuss →</Link><Link href="/review">Open the scoring desk →</Link></p>
  </main>;
}
