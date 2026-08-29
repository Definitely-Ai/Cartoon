// The Studio Bible — the one page that answers "who are these characters and
// what does a finished cartoon look like?" It is generated from the repo, not
// re-typed: the three CHARACTER-BIBLE.md documents in /canon are rendered
// verbatim, and the showcase panels come from canon/showcase/index.json, which
// the art department writes when a batch passes QC. Feedback on any panel
// commits to feedback/model-review/ for the next round.

import fs from "node:fs";
import path from "node:path";

import { renderMarkdown } from "@/lib/markdown";

import FeedbackCard, { type Proof } from "./FeedbackCard";

const serif = "Georgia, 'Times New Roman', serif";
const repoRoot = process.cwd();

type CastMember = {
  key: string;
  name: string;
  tagline: string;
  study: string;
  concept: string;
  bible: string;
};

// `study` is the drawn plate the reader meets the character through, made by
// ?study= on the smoke route. `concept` is the founder's own image, kept as
// the fallback until a study exists and as the thing the pipeline actually
// conditions on — but it is a photograph of a print, so it is second choice
// on a page rather than first.
const CAST_SOURCES = [
  {
    key: "flamingo",
    name: "Drew",
    tagline: "The arch observer — a flamingo first, a gentleman second.",
    study: "studies/drew.png",
    concept: "drew-plate1-bar-reference.jpg",
  },
  {
    key: "dog",
    name: "Mango",
    tagline: "The worried everyman — the golden retriever who pays the bill.",
    study: "studies/mango.png",
    concept: "mango-reference.jpg",
  },
  {
    key: "abby",
    name: "Abby",
    tagline: "The proprietor — her word settles the argument.",
    study: "studies/abby.png",
    concept: "abby-reference.jpg",
  },
];

function readCast(): CastMember[] {
  return CAST_SOURCES.map((source) => {
    const file = path.join(repoRoot, "canon", "characters", source.key, "CHARACTER-BIBLE.md");
    const markdown = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    // The document's own H1 is the card's heading, so drop it from the body.
    const body = markdown.replace(/^#\s+.*\n/, "");
    const drawn = fs.existsSync(path.join(repoRoot, "canon", "vision", source.study));
    return { ...source, study: drawn ? source.study : source.concept, bible: renderMarkdown(body) };
  });
}

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

const PLATES = [
  { file: "plate-1-security-and-martini-menu.jpg", line: "The security line · The martini menu, by fare class" },
  { file: "plate-2-debt-ceiling-and-retirement.jpg", line: "Debt Ceiling Week, 16th annual · Retirement planning, live" },
  { file: "plate-3-national-mall.jpg", line: "“The republic remains blue in concept, green in operations.”" },
  { file: "plate-4-nineteenth-hole-and-tariffs.jpg", line: "The 19th hole · Patriotic imported beer · The globe, priced" },
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
  const cast = readCast();
  const showcase = readShowcase();

  return (
    <main
      style={{
        // The studio layout is a dark room. This page is a paper document
        // laid on it — without its own ground, every dark word outside the
        // white cards was ink on ink and invisible.
        maxWidth: 1180,
        margin: "24px auto 48px",
        padding: "24px 30px 72px",
        color: "#221d16",
        background: "#fdfbf6",
        borderRadius: 8,
        boxShadow: "0 2px 18px rgba(0,0,0,0.35)",
      }}
    >
      <header style={{ textAlign: "center", margin: "34px 0 8px" }}>
        <p style={{ fontFamily: serif, letterSpacing: 3, fontSize: 12, textTransform: "uppercase", color: "#8a7f6d", margin: 0 }}>
          The Studio Bible
        </p>
        <h1 style={{ fontFamily: serif, fontSize: 46, margin: "8px 0 0", letterSpacing: 0.5 }}>The Swinging Door</h1>
        <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 17, color: "#5a5145", marginTop: 10, maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
          An upscale room a block off Wall Street. Marble and walnut. Two gentlemen, one proprietor,
          and the day&rsquo;s news — priced, poured, and taken with a raised eyebrow.
        </p>
      </header>

      <nav
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 18,
          flexWrap: "wrap",
          fontFamily: serif,
          fontSize: 14,
          margin: "22px 0 40px",
          color: "#6b6153",
        }}
      >
        <a href="#cartoons" style={{ color: "#6b6153" }}>The cartoons</a>
        <span aria-hidden>·</span>
        <a href="#cast" style={{ color: "#6b6153" }}>The cast</a>
        <span aria-hidden>·</span>
        <a href="#rules" style={{ color: "#6b6153" }}>House rules</a>
        <span aria-hidden>·</span>
        <a href="#plates" style={{ color: "#6b6153" }}>The plates</a>
      </nav>

      <section id="cartoons" style={{ margin: "44px 0", scrollMarginTop: 20 }}>
        <h2 style={{ fontFamily: serif, fontSize: 30, borderBottom: "2px solid #1a1a1a", paddingBottom: 8, margin: 0 }}>
          The cartoons {showcase.length > 0 ? <span style={{ fontSize: 18, color: "#8a7f6d" }}>({showcase.length})</span> : null}
        </h2>
        <p style={{ color: "#5a5145", marginTop: 10, maxWidth: 760 }}>
          Written to this week&rsquo;s actual tape and drawn to the plates. Score any panel 1–10 and say what you
          see — every note reaches the operator before the next round.
        </p>
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
              maxWidth: 780,
            }}
          >
            <p style={{ fontFamily: serif, fontSize: 21, margin: "0 0 12px", color: "#221d16" }}>
              A new edition is being drawn right now.
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
              <a href="/review" style={{ color: "#1a1a1a", fontWeight: 600 }}>
                Go to Review
              </a>{" "}
              to see the new edition as it is drawn, and to score each cartoon out of ten.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 20 }}>
            {showcase.map((proof) => (
              <FeedbackCard key={proof.file} proof={proof} base="/showcase" />
            ))}
          </div>
        )}
      </section>

      <section id="cast" style={{ margin: "56px 0", scrollMarginTop: 20 }}>
        <h2 style={{ fontFamily: serif, fontSize: 30, borderBottom: "2px solid #1a1a1a", paddingBottom: 8, margin: 0 }}>
          The cast
        </h2>
        <p style={{ color: "#5a5145", marginTop: 10, maxWidth: 760 }}>
          Three character bibles, kept in the repository and rendered here word for word. Every rule in them traces
          to a founder correction; anything on the <em>Forbidden</em> list is a redraw, however good the rest of the
          panel looks.
        </p>
        <p style={{ marginTop: 4 }}>
          <a
            href="/models/print/all"
            style={{
              display: "inline-block",
              fontFamily: serif,
              fontSize: 14,
              padding: "7px 16px",
              borderRadius: 4,
              border: "1px solid #b9b0a0",
              background: "#f5f2ea",
              color: "#1a1a1a",
              textDecoration: "none",
            }}
          >
            Print all three
          </a>
        </p>

        {cast.map((member) => (
          <article
            key={member.key}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(240px, 340px) minmax(320px, 1fr)",
              gap: 30,
              alignItems: "start",
              border: "1px solid #ded7c9",
              borderRadius: 10,
              background: "#fffdf8",
              padding: 22,
              marginTop: 24,
            }}
          >
            <div style={{ position: "sticky", top: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/vision/${member.study}`}
                alt={`${member.name} — definitive study`}
                style={{ width: "100%", borderRadius: 6, background: "#fff", border: "1px solid #e5dfd3", display: "block" }}
              />
              <div style={{ fontFamily: serif, fontSize: 30, marginTop: 12 }}>{member.name}</div>
              <p style={{ fontFamily: serif, fontStyle: "italic", color: "#5a5145", fontSize: 15, marginTop: 4 }}>
                {member.tagline}
              </p>
              {/* Rick asked to be able to print these. The Studio Bible page
                  would give him the cartoons and the scoring dials too, so
                  each bible gets its own page laid out for paper. */}
              <a
                href={`/models/print/${member.key}`}
                style={{
                  display: "inline-block",
                  marginTop: 12,
                  fontFamily: serif,
                  fontSize: 14,
                  padding: "7px 16px",
                  borderRadius: 4,
                  border: "1px solid #b9b0a0",
                  background: "#f5f2ea",
                  color: "#1a1a1a",
                  textDecoration: "none",
                }}
              >
                Print {member.name}&rsquo;s bible
              </a>
            </div>
            <div
              className="bible"
              style={{ fontSize: 15.5, lineHeight: 1.65, color: "#2c261e", minWidth: 0 }}
              dangerouslySetInnerHTML={{ __html: member.bible }}
            />
          </article>
        ))}
      </section>

      <section id="rules" style={{ margin: "56px 0", scrollMarginTop: 20 }}>
        <h2 style={{ fontFamily: serif, fontSize: 30, borderBottom: "2px solid #1a1a1a", paddingBottom: 8, margin: 0 }}>
          The house rules
        </h2>
        <ul style={{ fontFamily: serif, fontSize: 16.5, color: "#2c261e", lineHeight: 1.75, maxWidth: 820, marginTop: 16 }}>
          {HOUSE_RULES.map((rule) => (
            <li key={rule} style={{ marginBottom: 6 }}>
              {rule}
            </li>
          ))}
        </ul>
      </section>

      <section id="plates" style={{ margin: "56px 0", scrollMarginTop: 20 }}>
        <h2 style={{ fontFamily: serif, fontSize: 30, borderBottom: "2px solid #1a1a1a", paddingBottom: 8, margin: 0 }}>
          The plates
        </h2>
        <p style={{ color: "#5a5145", marginTop: 10, maxWidth: 760 }}>
          The founder&rsquo;s reference prints — the strip&rsquo;s standard for style, room, and voice. Everything above
          is drawn to match them.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 20, marginTop: 16 }}>
          {PLATES.map((plate) => (
            <figure key={plate.file} style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/vision/${plate.file}`}
                alt={plate.line}
                style={{ width: "100%", borderRadius: 4, border: "1px solid #ded7c9", background: "#fff" }}
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

      <style>{`
        .bible h2 { font-family: ${serif}; font-size: 21px; margin: 26px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #e0d9cb; }
        .bible h2:first-child { margin-top: 0; }
        .bible h3 { font-family: ${serif}; font-size: 16.5px; margin: 18px 0 4px; color: #4a4136; }
        .bible h4 { font-family: ${serif}; font-size: 15px; font-weight: 400; font-style: italic; margin: 16px 0 4px; color: #6b6153; }
        .bible h5, .bible h6 { font-family: ${serif}; font-size: 14px; margin: 14px 0 4px; color: #6b6153; }
        .bible p { margin: 0 0 12px; }
        .bible ul { margin: 0 0 14px; padding-left: 20px; }
        .bible li { margin-bottom: 5px; }
        .bible hr { border: 0; border-top: 1px solid #e8e2d6; margin: 22px 0; }
        .bible blockquote {
          margin: 0 0 14px; padding: 10px 16px; border-left: 3px solid #c9a227;
          background: #faf6ec; font-family: ${serif}; font-style: italic; color: #4a4136;
        }
        .bible table { width: 100%; border-collapse: collapse; margin: 0 0 16px; font-size: 14.5px; display: block; overflow-x: auto; }
        .bible th, .bible td { border: 1px solid #e2dbcd; padding: 7px 10px; text-align: left; vertical-align: top; }
        .bible th { background: #f6f2e8; font-family: ${serif}; }
        .bible code { background: #f2eee3; padding: 1px 5px; border-radius: 3px; font-size: 13px; }
        @media (max-width: 860px) {
          article { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
