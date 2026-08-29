// The Cast — the page Rick opens to see his three characters. Each one gets
// a portrait, a name, and a plain-language introduction; the art department's
// full CHARACTER-BIBLE.md documents are one click away on /models/[character]
// (and laid out for paper on /models/print/*), not inlined here. Below the
// cast: the current cartoons (from canon/showcase/index.json), the founder's
// reference plates, and the house rules.

import Link from "next/link";

import fs from "node:fs";
import path from "node:path";

import FeedbackCard, { type Proof } from "./FeedbackCard";
import { CAST, portraitPath } from "./cast";

export const metadata = { title: "The Cast" };

const serif = "Georgia, 'Times New Roman', serif";
const repoRoot = process.cwd();

function readShowcase(): Proof[] {
  const file = path.join(repoRoot, "canon", "showcase", "index.json");
  if (!fs.existsSync(file)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Proof[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// The plates carry their own measurements so the browser can hold the space
// before the picture arrives. These are big scans; without the numbers the
// house rules jumped half a screen down as each one landed.
const PLATES = [
  { file: "plate-1-security-and-martini-menu.jpg", width: 1633, height: 2752, line: "The security line · The martini menu, by fare class" },
  { file: "plate-2-debt-ceiling-and-retirement.jpg", width: 1751, height: 3894, line: "Debt Ceiling Week, 16th annual · Retirement planning, live" },
  { file: "plate-3-national-mall.jpg", width: 3946, height: 1785, line: "“The republic remains blue in concept, green in operations.”" },
  { file: "plate-4-nineteenth-hole-and-tariffs.jpg", width: 1622, height: 2232, line: "The 19th hole · Patriotic imported beer · The globe, priced" },
];

const HOUSE_RULES = [
  "Eighty percent of cartoons happen inside The Swinging Door; the same room, the same day's news.",
  "The camera looks toward the bar from the dining room: the back bar, the television above it and the chalkboard fill the background, and the marble runs across in front. Drew and Mango sit at it on the room side — patrons, with the counter between them and the bottles.",
  "Abby is the only other character in the bar. No human being appears anywhere except on the television.",
  "The TV names the story and the chalkboard prices it, and both illustrate that cartoon's own joke — never a stock scene.",
  "The only lettering in a panel is the lettering the brief asked for. Bezels, napkins, cuffs and chart axes stay blank — invented micro-text always comes back as nonsense.",
  "Nobody looks out of the panel. Every gaze belongs inside the scene: at each other, at the screen, at the board, or at the work in their hands.",
  "Bar panels are cropped at the counter: no legs, no knees, no stools, no floor.",
  "No cussing. No slandering. Gentlemen, always — the wit never needs a cheap word.",
  "The daily test: a finance man's 3–10 seconds. It lands, and it feels like his world.",
];

export default function ModelsPage() {
  const showcase = readShowcase();

  return (
    // The studio layout is a dark room. This page is a paper document laid on
    // it — without its own ground, every dark word outside the white cards was
    // ink on ink and invisible. The sheet itself lives in studio.css now, so
    // the Cast, the Registry and the Review are cut from one piece of paper.
    <main id="content" className="paper-sheet" style={{ maxWidth: 1180 }}>
      <header style={{ textAlign: "center", margin: "34px 0 10px" }}>
        <p className="paper-eyebrow">The cast of</p>
        <h1 className="paper-title">The Swinging Door</h1>
        <p className="paper-lede" style={{ marginLeft: "auto", marginRight: "auto" }}>
          An upscale room a block off Wall Street. Marble and walnut. Two gentlemen, one proprietor,
          and the day&rsquo;s news — priced, poured, and taken with a raised eyebrow.
        </p>
      </header>

      {/* ---------------------------------------------------- The cast */}
      <section aria-label="The three characters" style={{ margin: "36px 0 0" }}>
        <div className="cast-grid">
          {CAST.map((member) => (
            <article
              key={member.key}
              style={{
                display: "flex",
                flexDirection: "column",
                border: "1px solid #ded7c9",
                borderRadius: 10,
                background: "#fffdf8",
                overflow: "hidden",
                boxShadow: "0 1px 2px rgba(26,22,16,0.06)",
              }}
            >
              {/* Contained, not cropped: when a study is missing the portrait
                  falls back to a photograph of the founder's print, and
                  "cover" cut the head off it. The ratio holds the space either
                  way, so the card never jumps as the picture arrives. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={portraitPath(member)}
                alt={member.alt}
                style={{
                  display: "block",
                  width: "100%",
                  aspectRatio: "2 / 3",
                  objectFit: "contain",
                  background: "#fff",
                  borderBottom: "1px solid #e5dfd3",
                }}
              />
              <div style={{ padding: "18px 22px 22px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <h2 style={{ fontFamily: serif, fontSize: 32, margin: 0, letterSpacing: 0.3 }}>{member.name}</h2>
                <p style={{ fontFamily: serif, fontStyle: "italic", color: "#5a5145", fontSize: 15, margin: "4px 0 0" }}>
                  {member.tagline}
                </p>
                <p style={{ margin: "12px 0 0", color: "#2c261e", fontSize: 15.5, lineHeight: 1.65 }}>{member.bio}</p>
                <ul
                  style={{
                    listStyle: "none",
                    margin: "14px 0 0",
                    padding: "12px 0 0",
                    borderTop: "1px solid #ece6d9",
                    fontFamily: serif,
                    fontSize: 14.5,
                    color: "#4a4136",
                    lineHeight: 1.5,
                  }}
                >
                  {member.details.map((detail) => (
                    <li key={detail} style={{ margin: "0 0 6px", paddingLeft: 16, textIndent: -16 }}>
                      <span aria-hidden style={{ color: "#c9a227", marginRight: 8 }}>
                        ◆
                      </span>
                      {detail}
                    </li>
                  ))}
                </ul>
                <p style={{ margin: "auto 0 0", paddingTop: 16, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  <Link href={`/models/${member.key}`} className="paper-btn">
                    Read {member.name}&rsquo;s full bible
                  </Link>
                  <a href={`/models/print/${member.key}`} className="paper-btn-quiet">
                    Print it
                  </a>
                </p>
              </div>
            </article>
          ))}
        </div>
        <p style={{ textAlign: "center", fontFamily: serif, fontSize: 14, color: "#6b6153", margin: "20px 0 0" }}>
          The full bibles are the art department&rsquo;s working documents — every rule in them traces to a founder
          correction. <a href="/models/print/all" style={{ color: "#221d16", textDecorationColor: "#b9b0a0" }}>Print all three</a>.
        </p>
      </section>

      {/* ------------------------------------------------ The cartoons */}
      <section style={{ margin: "64px 0 0" }}>
        <h2 className="paper-h2">
          The cartoons {showcase.length > 0 ? <span className="paper-count">({showcase.length})</span> : null}
        </h2>
        {showcase.length > 0 ? (
          <p style={{ color: "#5a5145", marginTop: 10, maxWidth: "62ch" }}>
            Written to this week&rsquo;s actual tape and drawn to the plates. Score any panel 1–10 and say what you
            see — every note reaches the operator before the next round.
          </p>
        ) : null}
        {/* Written for Rick, who opens this page cold and should not have to
            deduce the state of the studio from an empty grid. Say plainly what
            is here, what is not, and where to go. */}
        {showcase.length === 0 ? (
          <div
            style={{
              marginTop: 18,
              padding: "22px 26px",
              background: "#f6f2e8",
              borderLeft: "4px solid #c9a227",
              borderRadius: 4,
              maxWidth: "68ch",
            }}
          >
            <p style={{ fontFamily: serif, fontSize: 21, margin: "0 0 12px", color: "#221d16" }}>
              A new set of cartoons is being drawn right now.
            </p>
            <p style={{ margin: "0 0 12px", color: "#4a4136", lineHeight: 1.65 }}>
              The cartoons that used to sit here have been taken down. We checked every one of them closely and
              they had faults we have since fixed — so rather than leave work on the wall that we already know is
              wrong, the wall is empty until the new set is ready.
            </p>
            <p style={{ margin: "0 0 12px", color: "#4a4136", lineHeight: 1.65 }}>
              What changed: the three characters were rebuilt from the ground up. Abby has proper eyes now, with a
              white, an iris and a pupil, instead of black buttons. Drew&rsquo;s arms end in hands rather than
              wings. The bar keeps the same bottles, the same marble and the same television every time.
            </p>
            <p style={{ margin: 0, color: "#4a4136", lineHeight: 1.65 }}>
              <Link href="/review" style={{ color: "#1a1a1a", fontWeight: 600 }}>
                Go to Review
              </Link>{" "}
              to see the new set as it is drawn, and to score each cartoon out of ten.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 330px), 1fr))",
              gap: 20,
              marginTop: 18,
            }}
          >
            {showcase.map((proof) => (
              <FeedbackCard key={proof.file} proof={proof} base="/showcase" />
            ))}
          </div>
        )}
      </section>

      {/* -------------------------------------------------- The plates */}
      <section style={{ margin: "64px 0 0" }}>
        <h2 className="paper-h2">
          The plates
        </h2>
        <p style={{ color: "#5a5145", marginTop: 10, maxWidth: "62ch" }}>
          The founder&rsquo;s reference prints — the strip&rsquo;s standard for style, room, and voice. Everything
          above is drawn to match them.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
            gap: 20,
            marginTop: 16,
          }}
        >
          {PLATES.map((plate) => (
            <figure key={plate.file} style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/vision/${plate.file}`}
                alt={`Reference plate — ${plate.line}`}
                width={plate.width}
                height={plate.height}
                loading="lazy"
                decoding="async"
                style={{ width: "100%", height: "auto", borderRadius: 4, border: "1px solid #ded7c9", background: "#fff" }}
              />
              <figcaption
                style={{ fontFamily: serif, fontStyle: "italic", fontSize: 14, color: "#5a5145", textAlign: "center", marginTop: 6 }}
              >
                {plate.line}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* --------------------------------------------- The house rules */}
      <section style={{ margin: "64px 0 0" }}>
        <h2 className="paper-h2">
          The house rules
        </h2>
        <ul style={{ fontFamily: serif, fontSize: 16, color: "#2c261e", lineHeight: 1.7, maxWidth: "68ch", marginTop: 16, paddingLeft: 22 }}>
          {HOUSE_RULES.map((rule) => (
            <li key={rule} style={{ marginBottom: 6 }}>
              {rule}
            </li>
          ))}
        </ul>
      </section>

      <style>{`
        .cast-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
        }
        @media (max-width: 980px) {
          .cast-grid { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; }
        }
      `}</style>
    </main>
  );
}
