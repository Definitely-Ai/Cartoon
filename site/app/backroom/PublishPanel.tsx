"use client";

import { useRef, useState } from "react";

// The RUN IT flow, built for a phone held in one hand: open the panel,
// fix the title or caption if the suggestion isn't right, then two taps —
// arm, confirm — and the option becomes the day's edition. Publishing is
// one atomic commit server-side; success here just means the presses are
// already rolling.

type Phase = "closed" | "open" | "running" | "done";

export default function PublishPanel(props: {
  day: string;
  option: number;
  initialTitle: string;
  initialCaption: string;
  initialTags: string;
}) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [armed, setArmed] = useState(false);
  const [title, setTitle] = useState(props.initialTitle);
  const [caption, setCaption] = useState(props.initialCaption);
  const [tags, setTags] = useState(props.initialTags);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const disarmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ready = title.trim().length > 0 && caption.trim().length > 0;

  async function run() {
    if (!armed) {
      setArmed(true);
      if (disarmTimer.current) clearTimeout(disarmTimer.current);
      disarmTimer.current = setTimeout(() => setArmed(false), 5000);
      return;
    }
    if (disarmTimer.current) clearTimeout(disarmTimer.current);
    setPhase("running");
    setError(null);
    try {
      const res = await fetch("/api/backroom/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day: props.day,
          option: props.option,
          title: title.trim(),
          caption: caption.trim(),
          tags: tags
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; slug?: string; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? `The presses jammed (${res.status}).`);
        setPhase("open");
        setArmed(false);
        return;
      }
      setSlug(data.slug ?? null);
      setPhase("done");
    } catch {
      setError("The wire to the press room dropped. Try again.");
      setPhase("open");
      setArmed(false);
    }
  }

  if (phase === "done") {
    return (
      <div className="br-panel br-panel-done" role="status">
        <p className="br-done-line">It ran.</p>
        <p>
          The presses are rolling — the front page updates in about a minute.
          {slug && (
            <>
              {" "}
              Its permanent address will be <code>/cartoon/{slug}</code>.
            </>
          )}
        </p>
        <p className="br-done-links">
          <a href="/backroom/ledger">Back to the ledger</a> · <a href="/">See the front page</a>
        </p>
      </div>
    );
  }

  if (phase === "closed") {
    return (
      <button type="button" className="br-open-btn" onClick={() => setPhase("open")}>
        Run this one&hellip;
      </button>
    );
  }

  return (
    <div className="br-panel">
      <label className="br-field">
        <span>Title</span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Name the edition"
          maxLength={80}
        />
      </label>
      <label className="br-field">
        <span>Caption — exactly as it should print</span>
        <textarea
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          rows={3}
          maxLength={300}
        />
      </label>
      <label className="br-field">
        <span>Tags (comma-separated, up to five)</span>
        <input
          type="text"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="markets, clients"
        />
      </label>

      {error && (
        <p className="br-error" role="alert">
          {error}
        </p>
      )}

      <div className="br-panel-actions">
        <button
          type="button"
          className={`br-run-btn${armed ? " br-run-armed" : ""}`}
          onClick={run}
          disabled={!ready || phase === "running"}
        >
          {phase === "running" ? "Inking the presses…" : armed ? "Tap again — run it for certain" : "Run it"}
        </button>
        <button
          type="button"
          className="br-cancel-btn"
          onClick={() => {
            setPhase("closed");
            setArmed(false);
            setError(null);
          }}
          disabled={phase === "running"}
        >
          Leave it on the table
        </button>
      </div>
      {!ready && <p className="br-hint">It needs a title and a caption before it can run.</p>}
    </div>
  );
}
