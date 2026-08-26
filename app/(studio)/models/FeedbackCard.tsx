"use client";

// One scored cartoon. The dials are the only thing on this page that writes
// anything: a score and a note per image, committed to feedback/model-review/
// in the repo, where the operator reads them before the next round.

import { useState } from "react";

export type Proof = { file: string; caption: string; note?: string };

const serif = "Georgia, 'Times New Roman', serif";

export default function FeedbackCard({ proof, base }: { proof: Proof; base: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setState("saving");
    try {
      const res = await fetch("/api/backroom/model-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: proof.file, rating, note }),
      });
      if (!res.ok) throw new Error(await res.text());
      setState("saved");
    } catch {
      setState("error");
    }
  }

  return (
    <figure
      style={{
        margin: 0,
        border: "1px solid #ded7c9",
        borderRadius: 8,
        padding: 16,
        background: "#fffdf8",
        boxShadow: "0 1px 2px rgba(26,22,16,0.06)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${base}/${proof.file}`}
        alt={proof.caption}
        style={{ width: "100%", borderRadius: 3, display: "block", background: "#fff" }}
      />
      {/* The caption is typeset into the artwork itself, the way the plates
          carry theirs — so the card adds only the news it was written off. */}
      {proof.note ? (
        <figcaption style={{ fontSize: 13, color: "#7a7062", margin: "12px 0 10px", letterSpacing: 0.2 }}>
          {proof.note}
        </figcaption>
      ) : (
        <div style={{ height: 12 }} />
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            aria-pressed={rating === n}
            aria-label={`Score ${n} out of 10`}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              border: "1px solid #b9b0a0",
              background: rating === n ? "#1a1a1a" : "#f5f2ea",
              color: rating === n ? "#fff" : "#1a1a1a",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What's right or wrong with this one?"
        rows={2}
        style={{ width: "100%", fontSize: 13, padding: 6, boxSizing: "border-box", borderRadius: 4, border: "1px solid #ccc4b4" }}
      />
      <button
        onClick={save}
        disabled={state === "saving" || (rating === null && !note.trim())}
        style={{ marginTop: 6, padding: "6px 14px", cursor: "pointer", borderRadius: 4, border: "1px solid #b9b0a0", background: "#f5f2ea" }}
      >
        {state === "saving"
          ? "Saving…"
          : state === "saved"
            ? "Saved ✓"
            : state === "error"
              ? "Failed — try again"
              : "Save feedback"}
      </button>
    </figure>
  );
}
