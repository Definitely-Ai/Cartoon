"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { NOTE_AUTHORS, NOTE_TOPICS, type NoteAuthor, type NoteTopic, type NoteImage, type NotesResult, type StudioNote } from "@/lib/studio-notes-core";

const time = (value: string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
function Picture({ image }: { image: NoteImage }) {
  return <Link className="note-image" href={`/library?image=${image.id}`}><Image src={image.thumbnailUrl} width={image.width} height={image.height} alt={image.title} unoptimized /><span>{image.title}<small>Open in the image library →</small></span></Link>;
}
export default function NotesClient({ initial, initialError, selectedImage, invalidImage }: { initial: NotesResult | null; initialError: string; selectedImage: NoteImage | null; invalidImage: boolean }) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState(initialError);
  const [author, setAuthor] = useState<NoteAuthor | "">("");
  const [topic, setTopic] = useState<NoteTopic>("general");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState("");
  const submitting = useRef(false);
  async function refresh() {
    setRefreshing(true); setError("");
    try {
      const response = await fetch(`/api/studio-notes${selectedImage ? `?image=${selectedImage.id}` : ""}`, { cache: "no-store" });
      if (response.redirected || !response.headers.get("content-type")?.includes("application/json")) throw new Error("Sign in again to read shared notes. Your draft is still here.");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Shared notes could not be refreshed.");
      setData(result);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Shared notes could not be refreshed."); }
    finally { setRefreshing(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setSaving(true); setSaved(""); setError("");
    try {
      const response = await fetch("/api/studio-notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ author, topic, body, image_id: selectedImage?.id ?? null }) });
      if (response.redirected || !response.headers.get("content-type")?.includes("application/json")) throw new Error("Sign in again before saving. Your draft is still here.");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We could not confirm the save. Keep your draft and refresh the notes before retrying.");
      const note: StudioNote = result.note;
      setData((current) => ({ notes: [note, ...(current?.notes ?? []).filter((item) => item.id !== note.id)].slice(0, 100), images: [...(current?.images ?? []), ...result.images], checkedAt: current?.checkedAt || note.createdAt }));
      setBody(""); setSaved("Saved to the shared studio.");
    } catch (caught) { setError(caught instanceof Error && !(caught instanceof TypeError) && !(caught instanceof SyntaxError) ? caught.message : "We could not confirm the save. Keep your draft and refresh the notes before retrying."); }
    finally { submitting.current = false; setSaving(false); }
  }
  return <div className="notes-layout">
    <section className="notes-compose" aria-labelledby="write-note-title">
      <h2 id="write-note-title">Leave a note</h2>
      {selectedImage && <><Picture image={selectedImage} /><p className="notes-hint">This note will stay with this image. <Link href="/notes">Write a general note instead</Link>.</p></>}
      <form onSubmit={submit}>
        <div className="notes-fields"><label>Your name<select required value={author} onChange={(event) => setAuthor(event.target.value as NoteAuthor)} disabled={saving}><option value="">Choose your name</option>{NOTE_AUTHORS.map((name) => <option key={name}>{name}</option>)}</select></label><label>Topic<select value={topic} onChange={(event) => setTopic(event.target.value as NoteTopic)} disabled={saving}>{NOTE_TOPICS.map((value) => <option value={value} key={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label></div>
        <p className="notes-hint">The name is chosen by the writer; this studio uses a shared login.</p>
        <label htmlFor="note-body">What should we know?</label><textarea id="note-body" value={body} maxLength={4000} required rows={7} onChange={(event) => { setBody(event.target.value); setSaved(""); }} disabled={saving} placeholder="A detail to fix, a question for each other, or our next step…" />
        <div className="notes-send"><span className="notes-hint">{body.length.toLocaleString()} / 4,000</span><button className="desk-button" disabled={saving || refreshing || invalidImage || !body.trim() || !author} type="submit">{saving ? "Saving…" : "Save shared note"}</button></div>
      </form>
      {saved && <p role="status" className="notes-success">{saved}</p>}
      {error && <p role="alert" className="notes-error">{error}</p>}
      <p className="notes-hint">Unsent text stays on this page only. Keep the page open until saving is confirmed.</p>
    </section>
    <section className="notes-feed" aria-labelledby="shared-notes-title">
      <div className="notes-feed-heading"><h2 id="shared-notes-title">{selectedImage ? "Notes on this image" : "Shared notes"}</h2><button onClick={refresh} disabled={refreshing || saving || invalidImage} type="button">{refreshing ? "Checking…" : "Refresh notes ↻"}</button></div>
      {data && <p className="notes-hint">Last loaded {time(data.checkedAt)} Eastern.{selectedImage && <> <Link href="/notes">See all notes</Link>.</>}</p>}
      {!data ? <p className="notes-empty">Shared notes have not loaded. Refresh to try again.</p> : data.notes.length === 0 ? <p className="notes-empty">No notes {selectedImage ? "on this image " : ""}yet. Leave the first one for each other.</p> : <ol className="notes-list">{data.notes.map((note) => {
        const image = data.images.find((item) => item.id === note.imageId);
        return <li key={note.id}><article><header><strong>{note.author}</strong><span>{note.topic[0].toUpperCase() + note.topic.slice(1)}</span><time dateTime={note.createdAt}>{time(note.createdAt)} ET</time></header><p className="note-body">{note.body}</p>{image ? <Picture image={image} /> : note.imageId && <Link href={`/library?image=${note.imageId}`}>Open the referenced image →</Link>}</article></li>;
      })}</ol>}
      {data?.notes.length === 100 && <p className="notes-hint">Showing the latest 100 notes{selectedImage ? " on this image" : ""}.</p>}
    </section>
  </div>;
}
