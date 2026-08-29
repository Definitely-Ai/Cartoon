// A character bible, laid out for paper. Rick asked to be able to print these,
// and printing the Studio Bible page itself would give him the cartoons, the
// scoring dials and three bibles at once. This is one document per sheet set:
// the study plate, the name, and the bible rendered full width, with the
// interface stripped out at print time.
//
//   /models/print/flamingo   /models/print/dog   /models/print/abby
//   /models/print/all        — the three of them, one after another

import fs from "node:fs";
import path from "node:path";

import { renderMarkdown } from "@/lib/markdown";

import PrintButton from "../PrintButton";

const serif = "Georgia, 'Times New Roman', serif";
const repoRoot = process.cwd();

const CAST = [
  { key: "flamingo", name: "Drew", study: "studies/drew.png", concept: "drew-plate1-bar-reference.jpg" },
  { key: "dog", name: "Mango", study: "studies/mango.png", concept: "mango-reference.jpg" },
  { key: "abby", name: "Abby", study: "studies/abby.png", concept: "abby-reference.jpg" },
];

export function generateStaticParams() {
  return [...CAST.map((c) => ({ character: c.key })), { character: "all" }];
}

type Sheet = { name: string; study: string; bible: string };

function read(key: string): Sheet | null {
  const source = CAST.find((c) => c.key === key);
  if (!source) return null;
  const file = path.join(repoRoot, "canon", "characters", key, "CHARACTER-BIBLE.md");
  if (!fs.existsSync(file)) return null;
  const body = fs.readFileSync(file, "utf8").replace(/^#\s+.*\n/, "");
  const drawn = fs.existsSync(path.join(repoRoot, "canon", "vision", source.study));
  return { name: source.name, study: drawn ? source.study : source.concept, bible: renderMarkdown(body) };
}

export default async function PrintBiblePage({ params }: { params: Promise<{ character: string }> }) {
  const { character } = await params;
  const sheets = (character === "all" ? CAST.map((c) => c.key) : [character])
    .map(read)
    .filter((sheet): sheet is Sheet => sheet !== null);

  // Typed address, or a bible that isn't in the repository yet. Naming the
  // folder keys here told him nothing he could act on; the way back does.
  if (sheets.length === 0) {
    return (
      <main id="content" className="paper-sheet">
        <h1 className="paper-title">Nothing to print here</h1>
        <p className="paper-lede">
          There&rsquo;s no bible at that address. Pick a character from the cast and print from
          there.
        </p>
        <p style={{ marginTop: 18 }}>
          <a href="/models" className="paper-btn">
            Back to the cast
          </a>
        </p>
      </main>
    );
  }

  return (
    <main
      id="content"
      className="paper-sheet"
      style={{ maxWidth: 780, color: "#1a1a1a", background: "#ffffff" }}
    >
      <div
        className="print-hide"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          borderBottom: "1px solid #ded7c9",
          paddingBottom: 14,
          marginBottom: 28,
        }}
      >
        {/* The page it goes back to is called The Cast everywhere else; two
            names for one place is one name too many. */}
        <a href="/models" className="paper-btn-quiet" style={{ paddingLeft: 0 }}>
          ← Back to the cast
        </a>
        <PrintButton />
      </div>

      {sheets.map((sheet, index) => (
        <article key={sheet.name} className="sheet" style={{ pageBreakBefore: index > 0 ? "always" : "auto" }}>
          <header style={{ textAlign: "center", marginBottom: 24 }}>
            <p className="paper-eyebrow">The Swinging Door · Character Bible</p>
            <h1 className="paper-title">{sheet.name}</h1>
          </header>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/vision/${sheet.study}`}
            alt={`${sheet.name}, drawn in ink — the definitive study every panel is checked against`}
            style={{
              display: "block",
              width: "58%",
              aspectRatio: "2 / 3",
              objectFit: "contain",
              margin: "0 auto 30px",
              border: "1px solid #e5dfd3",
              borderRadius: 4,
              background: "#fff",
            }}
          />

          <div className="bible" dangerouslySetInnerHTML={{ __html: sheet.bible }} />
        </article>
      ))}

      <style>{`
        .bible { font-size: 15px; line-height: 1.6; }
        .bible h2 { font-family: ${serif}; font-size: 20px; margin: 26px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #e0d9cb; page-break-after: avoid; }
        .bible h3 { font-family: ${serif}; font-size: 16px; margin: 18px 0 4px; color: #4a4136; page-break-after: avoid; }
        .bible h4 { font-family: ${serif}; font-size: 14.5px; font-weight: 400; font-style: italic; margin: 16px 0 4px; color: #6b6153; page-break-after: avoid; }
        .bible p { margin: 0 0 11px; }
        .bible ul { margin: 0 0 13px; padding-left: 20px; }
        .bible li { margin-bottom: 4px; }
        .bible hr { border: 0; border-top: 1px solid #e8e2d6; margin: 20px 0; }
        .bible blockquote {
          margin: 0 0 13px; padding: 9px 15px; border-left: 3px solid #c9a227;
          background: #faf6ec; font-family: ${serif}; font-style: italic; color: #4a4136;
          page-break-inside: avoid;
        }
        .bible table { width: 100%; border-collapse: collapse; margin: 0 0 15px; font-size: 13.5px; page-break-inside: avoid; }
        .bible th, .bible td { border: 1px solid #e2dbcd; padding: 6px 9px; text-align: left; vertical-align: top; }
        .bible th { background: #f6f2e8; font-family: ${serif}; }
        .bible code { background: #f2eee3; padding: 1px 4px; border-radius: 3px; font-size: 12.5px; }
        .bible img { max-width: 100%; }

        /* On paper a table lays out as a table. On the iPad he reads these
           on, a wide one has to scroll inside itself or it pushes the whole
           sheet sideways. */
        @media screen and (max-width: 700px) {
          .bible table { display: block; overflow-x: auto; }
        }

        @media print {
          main { max-width: none !important; padding: 0 !important; margin: 0 !important; background: #fff !important; border-radius: 0 !important; }
          .sheet { page-break-inside: auto; }
          .bible blockquote { background: transparent; border-left: 2px solid #999; }
          .bible th { background: transparent; }
          a { text-decoration: none; color: inherit; }
        }
        @page { margin: 18mm 16mm; }
      `}</style>
    </main>
  );
}
