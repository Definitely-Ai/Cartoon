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
      {/* The cartoon is never cropped — the gag is often in the corner of the
          panel. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${base}/${proof.file}`}
        alt={`Cartoon — ${proof.caption}`}
        loading="lazy"
        decoding="async"
        style={{ width: "100%", height: "auto", borderRadius: 3, display: "block", background: "#fff" }}
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }} role="group" aria-label="Score this cartoon out of ten">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            aria-pressed={rating === n}
            aria-label={`Score ${n} out of 10`}
            style={{
              // 30px circles were a miss on a touchscreen; these are the same
              // dials the review desk uses, at the size a thumb needs.
              minWidth: 40,
              height: 42,
              borderRadius: 21,
              border: rating === n ? "1px solid #1a1a1a" : "1px solid #b9b0a0",
              background: rating === n ? "#1a1a1a" : "#f5f2ea",
              color: rating === n ? "#fff" : "#1a1a1a",
              fontWeight: rating === n ? 700 : 400,
              cursor: "pointer",
              fontSize: 15,
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
        // 16px, not smaller: iOS zooms the whole page in on any input set
        // below it, and he reviews on an iPad.
        style={{
          width: "100%",
          fontFamily: serif,
          fontSize: 16,
          lineHeight: 1.5,
          padding: 8,
          boxSizing: "border-box",
          borderRadius: 4,
          border: "1px solid #ccc4b4",
        }}
      />
      <button
        onClick={save}
        disabled={state === "saving" || (rating === null && !note.trim())}
        style={{
          marginTop: 8,
          minHeight: 44,
          padding: "8px 18px",
          fontFamily: serif,
          fontSize: 15,
          cursor: "pointer",
          borderRadius: 4,
          border: "1px solid #b9b0a0",
          background: "#f5f2ea",
        }}
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
