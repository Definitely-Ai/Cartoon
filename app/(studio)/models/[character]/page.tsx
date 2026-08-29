// One character's full bible, on screen. The Cast page (/models) introduces
// the three of them in plain language; this page is where the reader who
// wants the whole working document — measurements, corrections, forbidden
// lists — gets it, rendered word for word from canon/characters/<key>/
// CHARACTER-BIBLE.md. The paper-ready version stays at /models/print/<key>.

import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CAST, portraitPath, readBibleHtml } from "../cast";

const serif = "Georgia, 'Times New Roman', serif";

export function generateStaticParams() {
  return CAST.map((member) => ({ character: member.key }));
}

export async function generateMetadata({ params }: { params: Promise<{ character: string }> }) {
  const { character } = await params;
  const member = CAST.find((c) => c.key === character);
  return { title: member ? `${member.name} — Character Bible` : "Character Bible" };
}

export default async function CharacterBiblePage({ params }: { params: Promise<{ character: string }> }) {
  const { character } = await params;
  const member = CAST.find((c) => c.key === character);
  if (!member) notFound();
  const bible = readBibleHtml(member.key);
  if (!bible) notFound();

  const others = CAST.filter((c) => c.key !== member.key);

  return (
    <main
      style={
        {
          maxWidth: 1080,
          margin: "24px auto 48px",
          padding: "24px 30px 72px",
          color: "#221d16",
          background: "#fdfbf6",
          borderRadius: 8,
          boxShadow: "0 2px 18px rgba(0,0,0,0.35)",
          // The dark-room chrome sets the focus ring to paper-white; on this
          // paper page that ring would vanish, so it goes back to ink here.
          "--focus-ink": "#221d16",
        } as CSSProperties
      }
    >
      <nav
        aria-label="Bible pages"
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          borderBottom: "1px solid #ded7c9",
          paddingBottom: 14,
        }}
      >
        <Link href="/models" style={{ fontFamily: serif, fontSize: 14, color: "#6b6153" }}>
          ← Back to the cast
        </Link>
        <a href={`/models/print/${member.key}`} style={{ fontFamily: serif, fontSize: 14, color: "#6b6153" }}>
          Print this bible
        </a>
      </nav>

      <header style={{ textAlign: "center", margin: "30px 0 6px" }}>
        <p style={{ fontFamily: serif, letterSpacing: 3, fontSize: 12, textTransform: "uppercase", color: "#8a7f6d", margin: 0 }}>
          The Swinging Door · Character Bible
        </p>
        <h1 style={{ fontFamily: serif, fontSize: 44, margin: "6px 0 0", letterSpacing: 0.5 }}>{member.name}</h1>
        <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 16, color: "#5a5145", margin: "8px auto 0", maxWidth: 640 }}>
          {member.tagline}
        </p>
      </header>

      <p style={{ margin: "16px auto 0", maxWidth: 680, color: "#2c261e", fontSize: 15.5, lineHeight: 1.65 }}>{member.bio}</p>

      <p
        style={{
          margin: "20px auto 0",
          maxWidth: 680,
          padding: "12px 18px",
          background: "#f6f2e8",
          borderLeft: "4px solid #c9a227",
          borderRadius: 4,
          color: "#4a4136",
          fontSize: 14.5,
          lineHeight: 1.6,
        }}
      >
        Everything below is the art department&rsquo;s working document, kept in the repository and rendered here
        word for word — measurements, corrections, and the <em>Forbidden</em> list. Every rule in it traces to a
        founder correction; anything on the Forbidden list is a redraw, however good the rest of the panel looks.
      </p>

      <div className="bible-layout" style={{ marginTop: 34 }}>
        <div className="bible-side" style={{ position: "sticky", top: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={portraitPath(member)}
            alt={member.alt}
            style={{ width: "100%", borderRadius: 6, background: "#fff", border: "1px solid #e5dfd3", display: "block" }}
          />
          <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 13.5, color: "#6b6153", margin: "8px 0 0" }}>
            The definitive study — the drawing every panel is checked against.
          </p>
        </div>
        <div
          className="bible"
          style={{ fontSize: 15.5, lineHeight: 1.65, color: "#2c261e", minWidth: 0 }}
          dangerouslySetInnerHTML={{ __html: bible }}
        />
      </div>

      <footer style={{ marginTop: 48, borderTop: "1px solid #ded7c9", paddingTop: 16, textAlign: "center" }}>
        <p style={{ fontFamily: serif, fontSize: 14.5, color: "#6b6153", margin: 0 }}>
          Also in the cast:{" "}
          {others.map((other, index) => (
            <span key={other.key}>
              {index > 0 ? " · " : null}
              <Link href={`/models/${other.key}`} style={{ color: "#221d16", textDecorationColor: "#b9b0a0" }}>
                {other.name}
              </Link>
            </span>
          ))}
        </p>
      </footer>

      <style>{`
        .bible-layout {
          display: grid;
          grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
          gap: 34px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .bible-layout { grid-template-columns: 1fr; }
          .bible-side { position: static !important; max-width: 340px; margin: 0 auto; }
        }
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
      `}</style>
    </main>
  );
}
