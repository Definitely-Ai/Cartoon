"use client";

// The character-model review room. The founder (or whoever presents to him)
// sees the three locked sheets beside every QC'd training scene image — the
// exact pixels the fine-tune learns from — and files instant feedback on any
// of them. Feedback commits to the repo (feedback/model-review/), where the
// operator reads it before the next training round.

import { useEffect, useState } from "react";

type Proof = { file: string; caption: string };

const CAST = [
  {
    name: "Drew",
    line: "the flamingo — question-mark neck, heavy-lidded eyes, sweater vest and bow tie, martini in a pinky-elegant grip",
    sheets: ["/canon/flamingo/full-body-sheet.png", "/canon/flamingo/identity-sheet.png"],
  },
  {
    name: "Mango",
    line: "the golden retriever — black dog lips, flag pin at the chest (lapel when jacketed), wristwatch, old fashioned, no tail",
    sheets: ["/canon/dog/full-body-sheet.png", "/canon/dog/identity-sheet.png"],
  },
  {
    name: "Abby",
    line: "the westie — owns The Swinging Door; fluffy button-eyed face, studded gem-pendant collar, towel and heels, no tail",
    sheets: ["/canon/abby/full-body-sheet.png", "/canon/abby/identity-sheet.png"],
  },
];

function FeedbackCard({ proof }: { proof: Proof }) {
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
    <figure style={{ margin: 0, border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fff" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/models/${proof.file}`} alt={proof.caption} style={{ width: "100%", borderRadius: 4 }} />
      <figcaption style={{ fontSize: 13, color: "#555", margin: "8px 0" }}>{proof.caption}</figcaption>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            aria-pressed={rating === n}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              border: "1px solid #999",
              background: rating === n ? "#1a1a1a" : "#f5f5f5",
              color: rating === n ? "#fff" : "#1a1a1a",
              cursor: "pointer",
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
        style={{ width: "100%", fontSize: 13, padding: 6, boxSizing: "border-box" }}
      />
      <button
        onClick={save}
        disabled={state === "saving" || (rating === null && !note.trim())}
        style={{ marginTop: 6, padding: "6px 14px", cursor: "pointer" }}
      >
        {state === "saving" ? "Saving…" : state === "saved" ? "Saved ✓" : state === "error" ? "Failed — try again" : "Save feedback"}
      </button>
    </figure>
  );
}

export default function ModelsPage() {
  const [proofs, setProofs] = useState<Proof[]>([]);
  useEffect(() => {
    fetch("/models/index.json")
      .then((r) => (r.ok ? r.json() : []))
      .then(setProofs)
      .catch(() => setProofs([]));
  }, []);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <h1>The Character Models</h1>
      <p style={{ color: "#555" }}>
        The locked sheets are the law; the scene proofs below them are the exact images the fine-tune trains on.
        Score any image 1–10 and say what you see — every note lands with the operator before the next round.
      </p>

      {CAST.map((c) => (
        <section key={c.name} style={{ margin: "24px 0" }}>
          <h2 style={{ marginBottom: 2 }}>{c.name}</h2>
          <p style={{ marginTop: 0, color: "#555" }}>{c.line}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {c.sheets.map((s) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={s} src={s} alt={`${c.name} sheet`} style={{ height: 320, borderRadius: 4, border: "1px solid #eee" }} />
            ))}
          </div>
        </section>
      ))}

      <h2>Scene proofs — the training set ({proofs.length})</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {proofs.map((p) => (
          <FeedbackCard key={p.file} proof={p} />
        ))}
      </div>
    </main>
  );
}
