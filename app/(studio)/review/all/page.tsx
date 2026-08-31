import Link from "next/link";

import { PublishError } from "@/lib/githubPublish";
import { formatDateAP } from "@/lib/format";

import { type BatchSummary, reviewBoard } from "../board";

// THE REVIEW BOARD — the long view /review deliberately withholds. Every set
// ever drawn, newest first, each a single row: when it was drawn, what was
// asked for, how much of it he has scored, and how it landed. A row is a door
// into that set's scoring screen. This is the operator's page and the founder's
// when he wants the record; the desk at /review stays one clean set at a time.

export const metadata = { title: "The review board" };

// A set fills in while it is drawn and scored one tap at a time; a cached board
// would show yesterday's counts.
export const dynamic = "force-dynamic";

const serif = "Georgia, 'Times New Roman', serif";

/** The Eastern calendar day the set was drawn, plainly. A batch written late in
 *  the evening is dated on the founder's clock, not tomorrow's UTC. */
function drawnDay(iso: string): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return "";
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
  return formatDateAP(day);
}

const show = (value: number | null): string => (value === null ? "—" : value.toFixed(1));

/** One set's row. Everything is a countable fact; nothing is a judgement the
 *  board makes on its own. */
function Row({ set }: { set: BatchSummary }) {
  const day = drawnDay(set.createdAt);
  const rate = set.scored > 0 ? Math.round((set.landed / set.scored) * 100) : null;
  const done = set.scored >= set.total && set.total > 0;

  return (
    <li className="rb-row">
      <Link href={`/review/${set.batch}`} className="rb-link">
        <div className="rb-top">
          <span className="rb-date">{day || "Undated"}</span>
          <span className="rb-status">
            {set.scored === 0
              ? set.drawn < set.total
                ? `drawing · ${set.drawn}/${set.total} in`
                : "not scored yet"
              : done
                ? `all ${set.total} scored`
                : `scored ${set.scored}/${set.total}`}
          </span>
        </div>

        <p className="rb-brief">&ldquo;{set.brief}&rdquo;</p>

        <div className="rb-facts">
          <span className="rb-chip">
            {set.total} cartoon{set.total === 1 ? "" : "s"}
          </span>
          {set.drawn < set.total && <span className="rb-chip">{set.drawn} drawn</span>}
          <span className="rb-chip rb-chip-score">
            cast {show(set.castMean)} &middot; scene {show(set.sceneMean)} &middot; line{" "}
            {show(set.captionMean)}
          </span>
          {set.scored > 0 && (
            <span className={`rb-chip ${rate !== null && rate >= 60 ? "rb-chip-good" : ""}`}>
              landed {set.landed}/{set.scored}
              {rate !== null ? ` · ${rate}%` : ""}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

export default async function ReviewBoardPage() {
  let board: BatchSummary[] = [];
  let trouble: string | null = null;
  try {
    board = await reviewBoard();
  } catch (err) {
    trouble = err instanceof PublishError ? err.message : "The repository isn’t answering.";
  }

  const totalCartoons = board.reduce((sum, set) => sum + set.total, 0);
  const totalScored = board.reduce((sum, set) => sum + set.scored, 0);

  return (
    <main id="content" className="paper-sheet rb-paper">
      <header className="rb-head">
        <p className="paper-eyebrow">The review</p>
        <h1 className="paper-title">The review board</h1>
        <p className="rb-lede">
          {board.length === 0
            ? "Every set of cartoons ever drawn, newest first — with the date, what was asked for, and how you scored it."
            : `${board.length} set${board.length === 1 ? "" : "s"} · ${totalCartoons} cartoon${
                totalCartoons === 1 ? "" : "s"
              } · ${totalScored} scored. Newest first; tap a set to open it and score it.`}
        </p>
        <p className="rb-toreview">
          <Link href="/review">Back to the new cartoons &rsaquo;</Link>
        </p>
      </header>

      {trouble && (
        <div className="rb-trouble" role="alert">
          <p>Nothing is lost — the cartoons and your scores are where they were. Try again in a minute.</p>
          <p className="rb-trouble-detail">{trouble}</p>
        </div>
      )}

      {!trouble && board.length === 0 && (
        <p className="rb-empty">
          Nothing has been drawn yet. When a set is drawn it appears here, and at{" "}
          <Link href="/review">the new cartoons</Link> to score.
        </p>
      )}

      {board.length > 0 && (
        <ul className="rb-list">
          {board.map((set) => (
            <Row key={set.batch} set={set} />
          ))}
        </ul>
      )}

      <style>{`
        .rb-paper { max-width: 900px; }
        .rb-head { margin: 18px 0 0; }
        .rb-lede {
          font-family: ${serif};
          font-size: 16px;
          line-height: 1.6;
          color: #4a4136;
          margin: 10px 0 0;
          max-width: 72ch;
        }
        .rb-toreview { font-family: ${serif}; font-size: 14px; margin: 12px 0 0; }
        .rb-toreview a { color: #6b6153; }

        .rb-list { list-style: none; margin: 22px 0 0; padding: 0; }
        .rb-row { margin: 0 0 12px; }
        .rb-link {
          display: block;
          text-decoration: none;
          color: inherit;
          background: #fff;
          border: 1px solid #e5dfd3;
          border-left: 4px solid #c9a227;
          border-radius: 4px;
          padding: 14px 18px;
        }
        .rb-link:hover { background: #fbf9f3; border-color: #d8cfba; border-left-color: #c9a227; }

        .rb-top {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
        }
        .rb-date {
          font-family: ${serif};
          font-size: 17px;
          color: #221d16;
        }
        .rb-status {
          font-family: ${serif};
          font-style: italic;
          font-size: 13.5px;
          color: #6b6153;
        }

        .rb-brief {
          font-family: ${serif};
          font-style: italic;
          font-size: 15.5px;
          line-height: 1.5;
          color: #4a4136;
          margin: 8px 0 0;
          max-width: 70ch;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .rb-facts {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 12px 0 0;
        }
        .rb-chip {
          font-family: ${serif};
          font-size: 13px;
          color: #5a5145;
          background: #f5f2ea;
          border: 1px solid #e0d9ca;
          border-radius: 999px;
          padding: 3px 11px;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .rb-chip-score { color: #221d16; }
        .rb-chip-good { color: #4a5a12; background: #f2f4e3; border-color: #d7dcb0; }

        .rb-empty {
          font-family: ${serif};
          font-style: italic;
          font-size: 16px;
          line-height: 1.6;
          color: #5a5145;
          margin: 20px 0 0;
          max-width: 60ch;
        }
        .rb-empty a { color: #221d16; }

        .rb-trouble {
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
        .rb-trouble p { margin: 0; }
        .rb-trouble-detail { font-style: normal; font-size: 13px; margin-top: 6px; color: #6b4038; }

        @media (max-width: 700px) {
          .rb-link { padding: 12px 14px; }
          .rb-date { font-size: 16px; }
        }
      `}</style>
    </main>
  );
}
