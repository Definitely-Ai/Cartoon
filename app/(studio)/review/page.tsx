import Link from "next/link";

import { formatDateAP, formatTimeET } from "@/lib/format";
import { PublishError, listRepoDir, readRepoFile } from "@/lib/githubPublish";

import { BRIEFS, editionOf, listBatches } from "./editions";

// EVERY BATCH — the index of Rick's briefs, newest first. One line typed,
// a set of cartoons back; this is the shelf they sit on until he has scored
// them. The ordering and the edition numbers come from ./editions, so this
// screen and the scoring screen call the same round of cartoons by the same
// name.

export const metadata = { title: "Review" };

export const dynamic = "force-dynamic";

const RATINGS = "feedback/ratings";
const serif = "Georgia, 'Times New Roman', serif";

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
  return `${formatDateAP(day)}, ${formatTimeET(iso)}`;
}

/** How many batches get their plan opened. The shelf is unbounded; the page
 *  is not, and each batch beyond this costs two GitHub round trips. */
const SHELF = 24;

type Shelf = {
  batch: string;
  brief: string;
  createdAt: string;
  planned: number;
  drawn: number;
  scored: number;
};

/** One shelf row: what the brief said, and how far along the batch is. */
async function readShelf(batch: string): Promise<Shelf | null> {
  const [plan, files, rated] = await Promise.all([
    readRepoFile(`${BRIEFS}/${batch}/plan.json`).catch(() => null),
    listRepoDir(`${BRIEFS}/${batch}`).catch(() => [] as string[]),
    listRepoDir(`${RATINGS}/${batch}`).catch(() => [] as string[]),
  ]);
  if (!plan) return null;
  try {
    const parsed = JSON.parse(plan.bytes.toString("utf8")) as {
      brief?: string;
      createdAt?: string;
      panels?: { file: string }[];
    };
    const panels = Array.isArray(parsed.panels) ? parsed.panels : [];
    const drawnFiles = new Set(files);
    return {
      batch,
      brief: parsed.brief ?? "(no brief recorded)",
      createdAt: parsed.createdAt ?? "",
      planned: panels.length,
      drawn: panels.filter((panel) => drawnFiles.has(panel.file)).length,
      scored: rated.filter((name) => name.endsWith(".json")).length,
    };
  } catch {
    return null;
  }
}

export default async function ReviewIndexPage() {
  let shelves: Shelf[] = [];
  let batches: string[] = [];
  let more = 0;
  let trouble: string | null = null;

  try {
    batches = await listBatches();
    more = Math.max(0, batches.length - SHELF);
    const rows = await Promise.all(batches.slice(0, SHELF).map(readShelf));
    shelves = rows.filter((row): row is Shelf => row !== null);
  } catch (err) {
    trouble = err instanceof PublishError ? err.message : "The repository isn't answering.";
  }

  return (
    // Paper laid on the dark room — the same sheet as the Cast, the Registry
    // and the scoring screen; see .paper-sheet in studio.css.
    <main id="content" className="paper-sheet" style={{ maxWidth: 900 }}>
      <header style={{ margin: "22px 0 0" }}>
        <p className="paper-eyebrow">The review</p>
        <h1 className="paper-title">Every edition</h1>
        <p className="paper-lede">
          Each edition is a fresh set of cartoons drawn from one thing you asked for. Open the newest one,
          look at every cartoon, and give scores out of ten — one for each character in it, one for the
          scene, one for the caption. There is a comment box under every cartoon if you want to say why.
        </p>
      </header>

      {/* He gets a sentence he can act on; the operator gets the actual
          complaint underneath it. One line of GitHub's own words was the
          whole of what this page said when the token expired. */}
      {trouble && (
        <div className="rv-trouble" role="alert">
          <p>
            The shelf isn&rsquo;t answering just now. Nothing is lost — the editions are where they
            were. Try again in a minute.
          </p>
          <p className="rv-trouble-detail">{trouble}</p>
        </div>
      )}

      {!trouble && shelves.length === 0 && (
        <p style={{ fontFamily: serif, fontStyle: "italic", color: "#6b6153", marginTop: 28 }}>
          No editions yet. Ask your AI for cartoons and the first one will be waiting here — the
          hookup lives under <Link href="/connect" style={{ color: "#221d16" }}>Connect your AI</Link>.
        </p>
      )}

      <ul className="rv-shelf">
        {shelves.map((shelf) => (
          <li key={shelf.batch}>
            <Link href={`/review/${shelf.batch}`} className="rv-row">
              <span className="rv-row-edition">
                Edition {editionOf(batches, shelf.batch) ?? "—"}
                {shelf.drawn < shelf.planned ? <em className="rv-row-wip"> · still drawing</em> : null}
              </span>
              <span className="rv-row-brief">&ldquo;{shelf.brief}&rdquo;</span>
              {/* When it was made is all he needs. A batch never records its
                  own name here: the folder id is thirty characters of machine
                  stamp, and it told him nothing the row above doesn't. */}
              <span className="rv-row-meta">{madeAt(shelf.createdAt) || "Date not recorded"}</span>
              {/* What is left, not just what is done: "none scored" is a
                  standing invitation, and "9 still to score" is an errand. */}
              <span className="rv-row-tallies">
                <span className={shelf.drawn === shelf.planned ? "rv-tally rv-tally-done" : "rv-tally"}>
                  {shelf.drawn} of {shelf.planned} drawn
                </span>
                <span
                  className={
                    shelf.scored >= shelf.drawn && shelf.drawn > 0 ? "rv-tally rv-tally-done" : "rv-tally"
                  }
                >
                  {shelf.drawn === 0
                    ? "nothing to score yet"
                    : shelf.scored === 0
                      ? `none scored — ${shelf.drawn} waiting`
                      : shelf.scored >= shelf.drawn
                        ? "all scored"
                        : `${shelf.scored} scored — ${shelf.drawn - shelf.scored} still to score`}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {more > 0 && (
        <p style={{ fontFamily: serif, fontSize: 14, color: "#6b6153", marginTop: 18 }}>
          {more} older edition{more === 1 ? "" : "s"} not shown.
        </p>
      )}

      <style>{`
        .rv-row-edition { font-family: ${serif}; font-size: 19px; color: #221d16; display: block; margin-bottom: 3px; }
        .rv-row-wip { font-size: 14px; color: #6b6153; font-style: italic; }
        .rv-shelf { list-style: none; margin: 24px 0 0; padding: 0; }
        .rv-shelf li { margin: 0 0 12px; }

        /* A whole card is the tap target — on an iPad the words alone are a
           miss. */
        .rv-row {
          display: block;
          text-decoration: none;
          color: #221d16;
          border: 1px solid #ded7c9;
          border-radius: 8px;
          background: #fffdf8;
          padding: 16px 18px;
          box-shadow: 0 1px 2px rgba(26,22,16,0.06);
        }
        .rv-row:hover { background: #fbf7ec; border-color: #c9a227; }

        .rv-row-brief {
          display: block;
          font-family: ${serif};
          font-style: italic;
          font-size: 19px;
          line-height: 1.4;
        }
        .rv-row-meta {
          display: block;
          font-size: 12.5px;
          color: #6b6153;
          margin-top: 6px;
          word-break: break-word;
        }

        .rv-row-tallies { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .rv-tally {
          font-family: ${serif};
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6b6153;
          border: 1px solid #ded7c9;
          border-radius: 999px;
          padding: 3px 11px;
          background: #f5f2ea;
        }
        .rv-tally-done { border-color: #c9a227; color: #6b5a12; background: #fbf5e3; }

        .rv-trouble {
          font-family: ${serif};
          font-style: italic;
          font-size: 15px;
          color: #8a2f22;
          border: 1px solid #d8c8bf;
          background: #fbf1ee;
          border-radius: 4px;
          padding: 10px 12px;
          margin: 22px 0 0;
        }
        .rv-trouble p { margin: 0; }
        .rv-trouble-detail { font-style: normal; font-size: 13px; margin-top: 6px !important; color: #6b4038; }
      `}</style>
    </main>
  );
}
