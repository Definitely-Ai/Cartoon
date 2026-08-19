"use client";

import { useRef, useState } from "react";

// The training week's instrument, one cartoon at a time: two 1–10 dials —
// the art and the caption — plus an optional why-note. Every tap and every
// saved note is a commit; a cartoon LANDS when both dials hit 6+, and the
// studio's goal is 60% landed. A week of taps becomes the data that
// rewrites the bibles.

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function Dial(props: {
  label: string;
  value: number | null;
  onPick: (n: number) => void;
}) {
  return (
    <div className="br-dial" role="group" aria-label={`${props.label} score, 1 to 10`}>
      <span className="br-dial-label">{props.label}</span>
      <div className="br-dial-row">
        {SCORES.map((n) => (
          <button
            key={n}
            type="button"
            className={`br-dial-btn${props.value === n ? " br-dial-on" : ""}${n >= 6 ? " br-dial-pass" : ""}`}
            aria-pressed={props.value === n}
            onClick={() => props.onPick(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FeedbackPanel(props: {
  day: string;
  option: number;
  initialArt: number | null;
  initialCaption: number | null;
  initialNote: string | null;
}) {
  const [art, setArt] = useState(props.initialArt);
  const [caption, setCaption] = useState(props.initialCaption);
  const [note, setNote] = useState(props.initialNote ?? "");
  const [savedNote, setSavedNote] = useState(props.initialNote ?? "");
  const [editing, setEditing] = useState(false);
  const [noteState, setNoteState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const savedFlash = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function post(body: Record<string, unknown>): Promise<boolean> {
    setError(null);
    try {
      const res = await fetch("/api/backroom/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: props.day, option: props.option, ...body }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "That didn't take — try again.");
        return false;
      }
      return true;
    } catch {
      setError("The wire dropped — try again.");
      return false;
    }
  }

  async function pickArt(value: number) {
    const previous = art;
    setArt(value);
    if (!(await post({ art: value }))) setArt(previous);
  }

  async function pickCaption(value: number) {
    const previous = caption;
    setCaption(value);
    if (!(await post({ caption: value }))) setCaption(previous);
  }

  async function saveNote() {
    setNoteState("saving");
    if (await post({ note })) {
      setSavedNote(note.trim());
      setEditing(false);
      setNoteState("saved");
      if (savedFlash.current) clearTimeout(savedFlash.current);
      savedFlash.current = setTimeout(() => setNoteState("idle"), 2000);
    } else {
      setNoteState("idle");
    }
  }

  const landed = (art ?? 0) >= 6 && (caption ?? 0) >= 6;
  const bothScored = art !== null && caption !== null;

  return (
    <div className="br-feedback">
      <Dial label="The art" value={art} onPick={pickArt} />
      <Dial label="The caption" value={caption} onPick={pickCaption} />

      {bothScored && (
        <p className={`br-landed${landed ? " br-landed-yes" : ""}`}>
          {landed ? "Landed — both 6 or better." : "Not there yet — 6+ on both is the bar."}
        </p>
      )}

      {!editing && savedNote && (
        <p className="br-note-view">
          <span className="br-note-text">“{savedNote}”</span>{" "}
          <button type="button" className="br-note-link" onClick={() => setEditing(true)}>
            Edit note
          </button>
        </p>
      )}

      {!editing && !savedNote && (
        <p className="br-note-view">
          <button type="button" className="br-note-link" onClick={() => setEditing(true)}>
            Why? Add a note — it helps the AI learn
          </button>
          {noteState === "saved" && <span className="br-note-saved"> Saved.</span>}
        </p>
      )}

      {editing && (
        <div className="br-note-edit">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="What worked, what didn’t — a sentence is plenty."
            aria-label="Note about this cartoon"
          />
          <div className="br-note-actions">
            <button type="button" className="br-note-save" onClick={saveNote} disabled={noteState === "saving"}>
              {noteState === "saving" ? "Saving…" : "Save note"}
            </button>
            <button
              type="button"
              className="br-note-link"
              onClick={() => {
                setEditing(false);
                setNote(savedNote);
              }}
              disabled={noteState === "saving"}
            >
              Never mind
            </button>
          </div>
        </div>
      )}

      {noteState === "saved" && savedNote && <p className="br-note-saved">Saved.</p>}

      {error && (
        <p className="br-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
