"use client";

// The Cast — the vision room. Built around the founder's Harrington plates:
// the prints ARE the standard, shown large, with the three definitive
// character studies and the first studio images drawn after them. Feedback on
// any study commits to feedback/model-review/ in the repo, where the operator
// reads it before the next round.

import { useEffect, useState } from "react";

type Proof = { file: string; caption: string };

const serif = "Georgia, 'Times New Roman', serif";

const PLATES = [
  { file: "plate-1-security-and-martini-menu.jpg", line: "The security line · The martini menu, by fare class" },
  { file: "plate-2-debt-ceiling-and-retirement.jpg", line: "Debt Ceiling Week, 16th annual · Retirement planning, live" },
  { file: "plate-3-national-mall.jpg", line: "“The republic remains blue in concept, green in operations.”" },
  { file: "plate-4-nineteenth-hole-and-tariffs.jpg", line: "The 19th hole · Patriotic imported beer · The globe, priced" },
];

// Finished example cartoons: plate-conditioned art, wall gag, attributed
// italic caption typeset beneath — the shape a filed cartoon takes.
const EXAMPLES: Proof[] = [
  { file: "example-sentiment.jpg", caption: "Mango — “I have never felt worse about the economy. Same again, Abby.”" },
  { file: "example-abby-bar.jpg", caption: "Abby — “Markets closed mixed. Gentlemen, so will you.”" },
  { file: "example-drew-golf.jpg", caption: "Drew — “The 19th hole is my only guaranteed return.”" },
  { file: "example-mango-golf.jpg", caption: "Mango — “I came out to lose golf balls, not basis points.”" },
  { file: "example-drew.jpg", caption: "Drew — “Rates will come down. I've simply stopped asking when.”" },
  { file: "example-mango.jpg", caption: "Mango — “My future self is watching? He could send money.”" },
  { file: "example-abby.jpg", caption: "Abby — “The house protects its own. Read it again, gentlemen.”" },
  { file: "example-duo.jpg", caption: "Together — “The chart goes up and I still feel it going down.”" },
];

const CAST = [
  {
    name: "Drew",
    study: "drew-bar-reference.jpg",
    line:
      "A successful gentleman in his mid-forties. White-plumed flamingo, question-mark neck, heavy-lidded deadpan " +
      "eyes, starched collar band under the black silk bow tie — his default skin — sweater vest, trousers, and a " +
      "martini held by the stem, pinky-elegant.",
  },
  {
    name: "Mango",
    study: "mango-reference.jpg",
    line:
      "A successful gentleman in his mid-forties, and unmistakably a golden retriever — true black dog lips, " +
      "freckled muzzle, long-fringed ears. The dark suit over an open collar, the American flag pin on whatever he " +
      "wears, a wristwatch, and an old fashioned with one large cube and a cherry.",
  },
  {
    name: "Abby",
    study: "abby-reference.jpg",
    line:
      "The successful proprietor. A true fluffy westie — button eyes, black nose — in her studded leather collar " +
      "with the teardrop gem. The boss: a force to be reckoned with, warm and in command. Her word settles the " +
      "argument, and no riffraff sits at her marble.",
  },
];

function FeedbackCard({ proof, base = "/models" }: { proof: Proof; base?: string }) {
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
    <figure style={{ margin: 0, border: "1px solid #d8d2c6", borderRadius: 6, padding: 14, background: "#fffdf8" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${base}/${proof.file}`} alt={proof.caption} style={{ width: "100%", borderRadius: 3 }} />
      <figcaption style={{ fontFamily: serif, fontStyle: "italic", fontSize: 14, color: "#444", margin: "10px 0" }}>
        {proof.caption}
      </figcaption>
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
              background: rating === n ? "#1a1a1a" : "#f5f2ea",
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
      .then((all: Proof[]) => setProofs(all.filter((p) => p.file.startsWith("harrington-"))))
      .catch(() => setProofs([]));
  }, []);

  return (
    <main style={{ maxWidth: 1150, margin: "0 auto", padding: "16px 16px 64px" }}>
      <header style={{ textAlign: "center", margin: "28px 0 10px" }}>
        <h1 style={{ fontFamily: serif, fontSize: 40, margin: 0, letterSpacing: 0.5 }}>The Swinging Door</h1>
        <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 17, color: "#555", marginTop: 8 }}>
          An upscale room a block off Wall Street. Marble and walnut. Two gentlemen, one proprietor,
          and the day&rsquo;s news — priced, poured, and taken with a raised eyebrow.
        </p>
      </header>

      <section style={{ margin: "36px 0" }}>
        <h2 style={{ fontFamily: serif, borderBottom: "2px solid #1a1a1a", paddingBottom: 6 }}>The plates</h2>
        <p style={{ color: "#555", marginTop: 6 }}>
          The founder&rsquo;s reference prints — the strip&rsquo;s standard for style, room, and voice.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 20 }}>
          {PLATES.map((p) => (
            <figure key={p.file} style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/vision/${p.file}`}
                alt={p.line}
                style={{ width: "100%", borderRadius: 4, border: "1px solid #d8d2c6", background: "#fff" }}
              />
              <figcaption
                style={{ fontFamily: serif, fontStyle: "italic", fontSize: 14, color: "#555", textAlign: "center", marginTop: 6 }}
              >
                {p.line}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section style={{ margin: "44px 0" }}>
        <h2 style={{ fontFamily: serif, borderBottom: "2px solid #1a1a1a", paddingBottom: 6 }}>The cast</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginTop: 16 }}>
          {CAST.map((c) => (
            <figure key={c.name} style={{ margin: 0, textAlign: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/vision/${c.study}`}
                alt={c.name}
                style={{ width: "100%", maxHeight: 460, objectFit: "contain", borderRadius: 4, background: "#fff", border: "1px solid #d8d2c6" }}
              />
              <figcaption style={{ marginTop: 10 }}>
                <div style={{ fontFamily: serif, fontSize: 24 }}>{c.name}</div>
                <p style={{ fontSize: 14, color: "#555", textAlign: "left", marginTop: 6 }}>{c.line}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section style={{ margin: "44px 0" }}>
        <h2 style={{ fontFamily: serif, borderBottom: "2px solid #1a1a1a", paddingBottom: 6 }}>The house rules</h2>
        <ul style={{ fontFamily: serif, fontSize: 16, color: "#333", lineHeight: 1.7, maxWidth: 760 }}>
          <li>Eighty percent of cartoons happen inside the bar; the same bottles stand the back bar every day.</li>
          <li>The TV names the story, the chalkboard prices it, the caption lands the verdict — one joke, three angles.</li>
          <li>If the window is in frame, <em>The Swinging Door</em> is on it, mirrored.</li>
          <li>The subject is what&rsquo;s actually going on — policy, rates, tariffs, taxes — anything that hits the wallet.</li>
          <li>No cussing. No slandering. Gentlemen, always; the wit never needs a cheap word.</li>
          <li>The daily test: a finance man&rsquo;s 3–10 seconds — it lands, and it feels like his world.</li>
        </ul>
      </section>

      <section style={{ margin: "44px 0" }}>
        <h2 style={{ fontFamily: serif, borderBottom: "2px solid #1a1a1a", paddingBottom: 6 }}>Example cartoons</h2>
        <p style={{ color: "#555", marginTop: 6 }}>
          The finished shape: plate-drawn characters, the gag on the wall, and the attributed caption
          typeset beneath. Score each 1–10 and say what you see.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
          {EXAMPLES.map((p) => (
            <FeedbackCard key={p.file} proof={p} base="/vision" />
          ))}
        </div>
      </section>

      <section style={{ margin: "44px 0" }}>
        <h2 style={{ fontFamily: serif, borderBottom: "2px solid #1a1a1a", paddingBottom: 6 }}>
          First studio studies {proofs.length > 0 ? `(${proofs.length})` : ""}
        </h2>
        <p style={{ color: "#555", marginTop: 6 }}>
          The studio&rsquo;s first images drawn after the plates. Score any study 1–10 and say what you see —
          every note lands with the operator before the next round.
        </p>
        {proofs.length === 0 ? (
          <p style={{ fontFamily: serif, fontStyle: "italic", color: "#777" }}>
            The first studies are being drawn now — refresh in a few minutes.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
            {proofs.map((p) => (
              <FeedbackCard key={p.file} proof={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
