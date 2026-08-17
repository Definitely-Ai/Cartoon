"use client";

import { useRef, useState } from "react";

// The training week's instrument, one cartoon at a time: three verdict
// chips in his own words, and an optional why-note. Every tap and every
// saved note is a commit — a week of taste becomes data the AI can read
// when it's time to rewrite the bibles.

const VERDICTS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 3, label: "Love it" },
  { value: 2, label: "It’s fine" },
  { value: 1, label: "Not for me" },
];

// Attribution — the difference between "he didn't like it" and knowing WHY.
const ISSUES: { key: string; label: string }[] = [
  { key: "drawing", label: "The drawing" },
  { key: "caption", label: "The caption" },
  { key: "idea", label: "The idea" },
  { key: "characters", label: "The characters" },
];

export default function FeedbackPanel(props: {
  day: string;
  option: number;
  initialRating: 1 | 2 | 3 | null;
  initialIssues: string[];
  initialNote: string | null;
}) {
  const [rating, setRating] = useState(props.initialRating);
  const [issues, setIssues] = useState<string[]>(props.initialIssues);
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

  async function pickVerdict(value: 1 | 2 | 3) {
    const previous = rating;
    setRating(value);
    if (!(await post({ rating: value }))) setRating(previous);
  }

  async function toggleIssue(key: string) {
    const previous = issues;
    const next = issues.includes(key) ? issues.filter((i) => i !== key) : [...issues, key];
    setIssues(next);
    if (!(await post({ issues: next }))) setIssues(previous);
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

  return (
    <div className="br-feedback">
      <div className="br-verdicts" role="group" aria-label="Your verdict">
        {VERDICTS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`br-verdict${rating === value ? " br-verdict-on" : ""}`}
            aria-pressed={rating === value}
            onClick={() => pickVerdict(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Attribution chips, only when something wasn't a full love — one
          extra second exactly where the data needs it. */}
      {rating !== null && rating < 3 && (
        <div className="br-issues" role="group" aria-label="What was off?">
          <span className="br-issues-label">What&rsquo;s off?</span>
          {ISSUES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`br-issue${issues.includes(key) ? " br-issue-on" : ""}`}
              aria-pressed={issues.includes(key)}
              onClick={() => toggleIssue(key)}
            >
              {label}
            </button>
          ))}
        </div>
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
