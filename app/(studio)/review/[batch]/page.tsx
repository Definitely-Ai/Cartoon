import Link from "next/link";
import { notFound } from "next/navigation";

import { formatDateline, formatTimeET } from "@/lib/format";
import { PublishError, listRepoDir, readRepoFile } from "@/lib/githubPublish";
import type { Brief } from "@/lib/writersRoom";

import RatingCard, { type CastName, type StandingVerdict } from "./RatingCard";

// THE REVIEW — where a batch gets judged. Rick typed one line, the writers'
// room wrote ten gags and the hand drew them; this is the screen where he
// says which ones are any good.
//
// Everything on it is read out of the repo at request time: the batch's own
// plan.json is the list of cartoons, the PNGs beside it are the ones that
// have actually been drawn, and feedback/ratings/<batch>/ is whatever he has
// already said. Nothing is cached, because a batch fills in while he watches
// and a stale page would hide the panel that just landed.

export const dynamic = "force-dynamic";

const BRIEFS = "briefs";
const RATINGS = "feedback/ratings";
const serif = "Georgia, 'Times New Roman', serif";

/** The cast under their proper names — the plan files key them lowercase.
 *  Named here rather than in RatingCard because a server component cannot
 *  read a constant out of a "use client" module. */
const CAST_NAMES: Record<CastName, string> = { drew: "Drew", mango: "Mango", abby: "Abby" };
const isCast = (who: string): who is CastName =>
  who === "drew" || who === "mango" || who === "abby";

/** When the batch was made, on the founder's clock — the Eastern calendar
 *  day, so a batch written after eight at night is not dated tomorrow. */
function madeAt(iso: string): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return "";
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
  return `${formatDateline(day)}, ${formatTimeET(iso)}`;
}

/** The batch file /api/backroom/brief writes. Mirrored, not imported: the
 *  route owns the shape and a page has no business importing a handler. */
type Panel = Brief & { n: number; file: string };
type Plan = {
  batch: string;
  brief: string;
  writer: string;
  model: string;
  quality: string;
  createdAt: string;
  panels: Panel[];
};

const safeBatch = (batch: string) =>
  batch.length <= 200 && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(batch) && !batch.includes("..");

async function readPlan(batch: string): Promise<Plan | null> {
  const file = await readRepoFile(`${BRIEFS}/${batch}/plan.json`);
  if (!file) return null;
  try {
    const plan = JSON.parse(file.bytes.toString("utf8")) as Plan;
    return Array.isArray(plan?.panels) ? plan : null;
  } catch {
    return null;
  }
}

/** The standing verdicts, keyed by panel filename without its extension —
 *  the same key the rate route files them under. */
async function readVerdicts(batch: string): Promise<Map<string, StandingVerdict>> {
  const names = (await listRepoDir(`${RATINGS}/${batch}`)).filter((name) => name.endsWith(".json"));
  const found = await Promise.all(
    names.map(async (name) => {
      const file = await readRepoFile(`${RATINGS}/${batch}/${name}`).catch(() => null);
      if (!file) return null;
      try {
        const raw = JSON.parse(file.bytes.toString("utf8")) as Partial<StandingVerdict>;
        const verdict: StandingVerdict = {
          characters: (raw.characters ?? {}) as Partial<Record<CastName, number>>,
          scene: typeof raw.scene === "number" ? raw.scene : null,
          caption: typeof raw.caption === "number" ? raw.caption : null,
          comment: typeof raw.comment === "string" ? raw.comment : "",
        };
        return [name.replace(/\.json$/, ""), verdict] as const;
      } catch {
        return null;
      }
    })
  );
  return new Map(found.filter((entry): entry is [string, StandingVerdict] => entry !== null));
}

export async function generateMetadata({ params }: { params: Promise<{ batch: string }> }) {
  const { batch } = await params;
  return { title: `Review — ${batch}` };
}

export default async function ReviewBatchPage({ params }: { params: Promise<{ batch: string }> }) {
  const { batch } = await params;
  if (!safeBatch(batch)) notFound();

  let plan: Plan | null = null;
  let drawn = new Set<string>();
  let verdicts = new Map<string, StandingVerdict>();
  let trouble: string | null = null;

  try {
    plan = await readPlan(batch);
    if (plan) {
      // One listing answers "which of these are drawn?" for the whole batch,
      // rather than a request per panel.
      const [files, standing] = await Promise.all([
        listRepoDir(`${BRIEFS}/${batch}`),
        readVerdicts(batch),
      ]);
      drawn = new Set(files);
      verdicts = standing;
    }
  } catch (err) {
    trouble = err instanceof PublishError ? err.message : "The repository isn't answering.";
  }

  if (!plan && !trouble) notFound();

  const panels = plan?.panels ?? [];
  const made = panels.filter((panel) => drawn.has(panel.file)).length;
  const scored = panels.filter((panel) => verdicts.has(panel.file.replace(/\.png$/, ""))).length;
  const created = plan?.createdAt ?? "";

  return (
    <main
      id="content"
      style={{
        // The studio layout is a dark room. Like the Studio Bible, this page
        // is a paper document laid on it — and the room's focus ring is white,
        // so the ring gets its ink back or it vanishes on the paper.
        maxWidth: 1180,
        margin: "24px auto 48px",
        padding: "24px 30px 72px",
        color: "#221d16",
        background: "#fdfbf6",
        borderRadius: 8,
        boxShadow: "0 2px 18px rgba(0,0,0,0.35)",
        ["--focus-ink" as string]: "#1a1a1a",
      }}
    >
      <header style={{ margin: "22px 0 8px" }}>
        <p
          style={{
            fontFamily: serif,
            letterSpacing: 3,
            fontSize: 12,
            textTransform: "uppercase",
            color: "#8a7f6d",
            margin: 0,
          }}
        >
          The review
        </p>
        <h1 style={{ fontFamily: serif, fontSize: 38, margin: "8px 0 0", letterSpacing: 0.3, lineHeight: 1.2 }}>
          {plan ? `“${plan.brief}”` : "That batch isn’t answering"}
        </h1>

        {plan && (
          <>
            <p style={{ fontFamily: serif, fontSize: 16, color: "#5a5145", margin: "12px 0 0" }}>
              <strong style={{ fontWeight: 400, color: "#221d16" }}>
                {made} of {panels.length} drawn
              </strong>
              {` · ${scored} of ${made} scored`}
              {madeAt(created) ? ` · ${madeAt(created)}` : ""}
            </p>
            <p style={{ fontSize: 13, color: "#8a7f6d", margin: "6px 0 0", wordBreak: "break-word" }}>
              <code style={{ fontSize: 12.5 }}>{plan.batch}</code>
              {plan.writer ? ` · written by ${plan.writer}` : ""}
              {plan.model ? ` · drawn by ${plan.model}` : ""}
              {plan.quality ? ` · ${plan.quality} quality` : ""}
            </p>
            {made < panels.length && (
              <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 15, color: "#5a5145", margin: "10px 0 0" }}>
                {panels.length - made} still at the drawing board — reload when they land.
              </p>
            )}
            {/* Rick opens this page cold. Tell him what he is looking at and
                what to do, in the fewest plain words that will do it. */}
            <div
              style={{
                marginTop: 20,
                padding: "18px 22px",
                background: "#f6f2e8",
                borderLeft: "4px solid #c9a227",
                borderRadius: 4,
              }}
            >
              <p style={{ fontFamily: serif, fontSize: 18, margin: "0 0 10px", color: "#221d16" }}>
                How to use this page
              </p>
              <p style={{ margin: "0 0 10px", color: "#4a4136", lineHeight: 1.65 }}>
                Below are {panels.length} cartoons. Under each one there are dials from 1 to 10. Give a score
                to each character who appears, one to the scene, and one to the caption. Anything you type in
                the comment box is saved as well. Nothing needs saving by hand — a score is kept the moment you
                click it, and you can change your mind later.
              </p>
              <p style={{ margin: 0, color: "#4a4136", lineHeight: 1.65 }}>
                Be blunt. A low score with a sentence saying why is the most useful thing on this page — it is
                what the next edition gets built from.
              </p>
            </div>
          </>
        )}

        {trouble && (
          <p className="rv-trouble" role="alert">
            {trouble}
          </p>
        )}

        <p style={{ fontFamily: serif, fontSize: 14, margin: "16px 0 0" }}>
          <Link href="/review" style={{ color: "#6b6153" }}>
            ‹ All batches
          </Link>
        </p>
      </header>

      <p
        style={{
          fontFamily: serif,
          fontSize: 15.5,
          color: "#5a5145",
          maxWidth: 760,
          margin: "22px 0 6px",
          borderTop: "2px solid #1a1a1a",
          paddingTop: 14,
        }}
      >
        Score each one out of ten — every character who is in it, the scene, the caption. A tap is
        the whole submission; nothing here needs a Save except a note.
      </p>

      <div className="rv-grid">
        {panels.map((panel) => {
          const isDrawn = drawn.has(panel.file);
          const key = panel.file.replace(/\.png$/, "");
          const cast = (panel.characters ?? [])
            .filter(isCast)
            .map((who) => ({ key: who, name: CAST_NAMES[who] }));
          return (
            <article
              key={panel.n}
              id={`panel-${panel.n}`}
              className="rv-panel"
              // Named by its number AND its line, so the ten regions are
              // told apart when they are read out of context.
              aria-labelledby={`panel-${panel.n}-no panel-${panel.n}-line`}
            >
              <h2 className="rv-no" id={`panel-${panel.n}-no`}>
                № {panel.n}
                <span className="rv-no-of"> of {panels.length}</span>
              </h2>

              <div className="rv-plate">
                {isDrawn ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    className="rv-art"
                    src={`/api/img/brief/${plan?.batch ?? batch}/${panel.file}`}
                    alt={`Panel ${panel.n}: ${panel.action || panel.scene || panel.caption}`}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <p className="rv-waiting">Not drawn yet</p>
                )}
              </div>

              {/* The house caption format, set the way the strip sets it:
                  attributed italic dialogue, Drew: “…”. */}
              <p className="rv-caption" id={`panel-${panel.n}-line`}>
                <span className="rv-speaker">
                  {isCast(panel.speaker) ? CAST_NAMES[panel.speaker] : panel.speaker}:
                </span>{" "}
                &ldquo;{panel.caption}&rdquo;
              </p>

              <p className="rv-turn">
                {panel.turn ? `The turn — ${panel.turn}` : "No turn noted."}
                {panel.away ? ` · ${panel.away}` : ""}
              </p>

              {isDrawn ? (
                <RatingCard
                  batch={plan?.batch ?? batch}
                  panel={panel.file}
                  characters={cast}
                  verdict={verdicts.get(key) ?? null}
                />
              ) : (
                <p className="rv-pending">Scoring opens when the drawing lands.</p>
              )}
            </article>
          );
        })}
      </div>

      {/* One stylesheet for ten cards — the hover, focus and breakpoint work
          inline styles can't do. */}
      <style>{`
        .rv-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 26px;
          margin-top: 20px;
          align-items: start;
        }
        /* Two up on a desk, one up below that: a 2:3 engraving in a column
           narrower than this is too small to judge. */
        @media (max-width: 900px) {
          .rv-grid { grid-template-columns: minmax(0, 1fr); }
        }

        .rv-panel {
          border: 1px solid #ded7c9;
          border-radius: 8px;
          background: #fffdf8;
          padding: 18px 18px 16px;
          box-shadow: 0 1px 2px rgba(26,22,16,0.06);
          min-width: 0;
        }

        .rv-no {
          font-family: ${serif};
          font-weight: 400;
          font-size: 13px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #8a7f6d;
          margin: 0 0 10px;
        }
        .rv-no-of { letter-spacing: 0.06em; text-transform: none; }

        /* The frame reserves the picture's shape before a byte arrives, so a
           lazy panel loading three screens down never moves the one he is
           reading. */
        .rv-plate {
          aspect-ratio: 2 / 3;
          background: #fff;
          border: 1px solid #e5dfd3;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .rv-art { width: 100%; height: 100%; object-fit: contain; display: block; }
        .rv-waiting {
          font-family: ${serif};
          font-style: italic;
          font-size: 15px;
          color: #a89c86;
          margin: 0;
        }

        .rv-caption {
          font-family: ${serif};
          font-style: italic;
          font-size: 19px;
          line-height: 1.45;
          color: #221d16;
          margin: 14px 0 0;
        }
        .rv-speaker { font-style: normal; }

        .rv-turn {
          font-size: 12.5px;
          line-height: 1.5;
          color: #8a7f6d;
          margin: 7px 0 0;
        }

        .rv-pending {
          font-family: ${serif};
          font-style: italic;
          font-size: 14px;
          color: #a89c86;
          margin: 14px 0 0;
          border-top: 1px solid #ece5d8;
          padding-top: 12px;
        }

        .rv-ratings {
          margin-top: 14px;
          border-top: 1px solid #ece5d8;
          padding-top: 12px;
        }

        .rv-dial { margin-top: 10px; display: grid; grid-template-columns: 1fr auto; gap: 2px 10px; align-items: baseline; }
        .rv-dial-label {
          font-family: ${serif};
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #6b6153;
        }
        .rv-dial-value {
          font-family: ${serif};
          font-size: 12px;
          color: #8a7f6d;
          text-align: right;
          width: 3.6em;
          font-variant-numeric: tabular-nums;
        }
        .rv-dial-row {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 4px;
          margin-top: 2px;
        }
        .rv-dial-btn {
          min-height: 34px;
          padding: 0;
          font-family: ${serif};
          font-size: 13px;
          color: #1a1a1a;
          background: #f5f2ea;
          border: 1px solid #cec5b4;
          border-radius: 4px;
          cursor: pointer;
        }
        /* Six is the bar the studio scores against; the passing half of the
           row carries the stronger edge, as the day board's dials do. */
        .rv-dial-pass { border-color: #b9b0a0; }
        .rv-dial-btn:hover { background: #ece7da; }
        .rv-dial-on {
          background: #1a1a1a;
          color: #fff;
          border-color: #1a1a1a;
          font-weight: 700;
        }
        .rv-dial-on:hover { background: #1a1a1a; }

        .rv-comment { margin-top: 14px; }
        .rv-comment-box {
          width: 100%;
          box-sizing: border-box;
          margin-top: 4px;
          font-family: ${serif};
          font-size: 14.5px;
          line-height: 1.5;
          color: #221d16;
          background: #fff;
          border: 1px solid #ccc4b4;
          border-radius: 4px;
          padding: 7px 8px;
          resize: vertical;
        }
        .rv-comment-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 6px;
          min-height: 34px;
        }
        .rv-save {
          font-family: ${serif};
          font-size: 13px;
          padding: 6px 14px;
          border-radius: 4px;
          border: 1px solid #b9b0a0;
          background: #f5f2ea;
          color: #1a1a1a;
          cursor: pointer;
        }
        .rv-save:hover:enabled { background: #ece7da; }
        .rv-save:disabled { opacity: 0.45; cursor: default; }

        /* Reserved height: the word lands without moving the card under him. */
        .rv-status {
          margin: 0;
          font-family: ${serif};
          font-style: italic;
          font-size: 13px;
          color: #5a5145;
          min-height: 1.2em;
        }
        .rv-status-bad { font-style: normal; color: #8a2f22; }

        .rv-trouble {
          font-family: ${serif};
          font-style: italic;
          font-size: 15px;
          color: #8a2f22;
          border: 1px solid #d8c8bf;
          background: #fbf1ee;
          border-radius: 4px;
          padding: 10px 12px;
          margin: 16px 0 0;
        }
      `}</style>
    </main>
  );
}
