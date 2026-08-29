import Link from "next/link";

import { formatDateAP, formatTimeET } from "@/lib/format";
import { PublishError, gh, listRepoDir, readRepoFile, requiredEnv } from "@/lib/githubPublish";

// EVERY BATCH — the index of Rick's briefs, newest first. One line typed,
// ten cartoons back; this is the shelf they sit on until he has scored them.
//
// The batch id the brief route mints starts with a UTC stamp
// (20260828-143012-a-slug), so sorting the folder names in reverse IS newest
// first — no dates need parsing to order the shelf.

export const metadata = { title: "Review" };

export const dynamic = "force-dynamic";

const BRIEFS = "briefs";
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

/**
 * The names of the batch folders under /briefs.
 *
 * lib/githubPublish's listRepoDir answers with FILES only, and a batch is a
 * directory, so this asks the same contents endpoint through that module's
 * own client rather than growing it a new export. BRANCH is not exported
 * either — "main" here is that constant, and the two must stay in step.
 */
async function listBatches(): Promise<string[]> {
  const { token, repo } = requiredEnv();
  const res = await gh(token)(`/repos/${repo}/contents/${BRIEFS}?ref=main`);
  if (res.status === 404) return [];
  if (!res.ok) throw new PublishError(502, `GitHub said ${res.status} listing /${BRIEFS}.`);
  return ((await res.json()) as { name: string; type: string }[])
    .filter((entry) => entry.type === "dir")
    .map((entry) => entry.name)
    .sort()
    .reverse();
}

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
  let more = 0;
  let trouble: string | null = null;

  try {
    const batches = await listBatches();
    more = Math.max(0, batches.length - SHELF);
    const rows = await Promise.all(batches.slice(0, SHELF).map(readShelf));
    shelves = rows.filter((row): row is Shelf => row !== null);
  } catch (err) {
    trouble = err instanceof PublishError ? err.message : "The repository isn't answering.";
  }

  // EDITIONS. Rick needs a name for the round he is looking at, and "the batch
  // dated 22:11" is not one. Batches are numbered oldest-first, so Edition 1
  // stays Edition 1 forever and a new round always takes the next number.
  const oldestFirst = [...shelves].reverse();
  const editionOf = new Map(oldestFirst.map((shelf, i) => [shelf.batch, i + 1 + more]));

  return (
    <main
      id="content"
      style={{
        // Paper laid on the dark room, and the room's white focus ring
        // handed its ink back so it stays visible here.
        maxWidth: 900,
        margin: "24px auto 48px",
        padding: "24px 30px 64px",
        color: "#221d16",
        background: "#fdfbf6",
        borderRadius: 8,
        boxShadow: "0 2px 18px rgba(0,0,0,0.35)",
        ["--focus-ink" as string]: "#1a1a1a",
      }}
    >
      <header style={{ margin: "22px 0 0" }}>
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
        <h1 style={{ fontFamily: serif, fontSize: 40, margin: "8px 0 0", letterSpacing: 0.4 }}>
          Every batch
        </h1>
        <p
          style={{
            fontFamily: serif,
            fontStyle: "italic",
            fontSize: 16.5,
            color: "#5a5145",
            margin: "10px 0 0",
            maxWidth: 620,
          }}
        >
          Each edition is a fresh set of cartoons. Open the newest one, look at every panel, and give it a
          score out of ten — for the drawing, for the joke, and for each character in it. There is a comment
          box under every cartoon if you want to say why.
        </p>
      </header>

      {trouble && (
        <p className="rv-trouble" role="alert">
          {trouble}
        </p>
      )}

      {!trouble && shelves.length === 0 && (
        <p style={{ fontFamily: serif, fontStyle: "italic", color: "#8a7f6d", marginTop: 28 }}>
          No batches yet. Ask for one and it will be waiting here.
        </p>
      )}

      <ul className="rv-shelf">
        {shelves.map((shelf) => (
          <li key={shelf.batch}>
            <Link href={`/review/${shelf.batch}`} className="rv-row">
              <span className="rv-row-edition">
                Edition {editionOf.get(shelf.batch)}
                {shelf.drawn < shelf.planned ? <em className="rv-row-wip"> · still drawing</em> : null}
              </span>
              <span className="rv-row-brief">&ldquo;{shelf.brief}&rdquo;</span>
              <span className="rv-row-meta">
                {madeAt(shelf.createdAt) ? `${madeAt(shelf.createdAt)} · ` : ""}
                <span className="rv-row-id">{shelf.batch}</span>
              </span>
              <span className="rv-row-tallies">
                <span className={shelf.drawn === shelf.planned ? "rv-tally rv-tally-done" : "rv-tally"}>
                  {shelf.drawn} of {shelf.planned} drawn
                </span>
                <span
                  className={
                    shelf.scored >= shelf.drawn && shelf.drawn > 0 ? "rv-tally rv-tally-done" : "rv-tally"
                  }
                >
                  {shelf.scored === 0 ? "none scored" : `${shelf.scored} of ${shelf.drawn} scored`}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {more > 0 && (
        <p style={{ fontFamily: serif, fontSize: 14, color: "#8a7f6d", marginTop: 18 }}>
          {more} older batch{more === 1 ? "" : "es"} not shown.
        </p>
      )}

      <style>{`
        .rv-row-edition { font-family: ${serif}; font-size: 19px; color: #221d16; display: block; margin-bottom: 3px; }
        .rv-row-wip { font-size: 14px; color: #8a7f6d; font-style: italic; }
        .rv-shelf { list-style: none; margin: 24px 0 0; padding: 0; }
        .rv-shelf li { margin: 0 0 12px; }

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
          color: #8a7f6d;
          margin-top: 6px;
          word-break: break-word;
        }
        .rv-row-id { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; }

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
      `}</style>
    </main>
  );
}
