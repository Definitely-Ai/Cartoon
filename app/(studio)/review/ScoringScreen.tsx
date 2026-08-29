import Link from "next/link";

import { formatDateline, formatTimeET } from "@/lib/format";
import { listRepoDir, readRepoFile } from "@/lib/githubPublish";

import { BRIEFS, type Plan } from "./batches";
import ReviewDesk, { type CastName, type DeskPanel, type StandingVerdict } from "./[batch]/ReviewDesk";

// THE REVIEW — where a set of cartoons gets judged. Rick typed one line, the
// writers' room wrote the gags and the hand drew them; this is the screen where
// he says which ones are any good.
//
// ONE SCREEN, TWO ADDRESSES. /review is this screen pointed at the set being
// drawn now, which is the only one he ever needs; /review/<batch> is the same
// screen pointed at a named set, for the operator and for the rating links
// already sent out. They are one component because they were two, and the two
// drifted: the shelf called a set "Edition 3" and the scoring screen counted
// the number a second way to agree with it.
//
// Everything on it is read out of the repo at request time: the batch's own
// plan.json is the list of cartoons, the PNGs beside it are the ones that have
// actually been drawn, and feedback/ratings/<batch>/ is whatever he has already
// said. Nothing is cached, because a set fills in while he watches and a stale
// page would hide the cartoon that just landed.
//
// This file is the reading and the dressing. The scoring itself — one cartoon
// at a time, drafts kept on his machine, one commit per cartoon — is
// ReviewDesk, because none of that can happen on a server.

const RATINGS = "feedback/ratings";
const serif = "Georgia, 'Times New Roman', serif";

/** The cast under their proper names — the plan files key them lowercase.
 *  Named here rather than in ReviewDesk because a server component cannot
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

export default async function ScoringScreen({
  plan,
  trouble = null,
  /** True on /review, where this is the set being drawn now and there is
   *  nowhere behind it. False on /review/<batch>, which may be an older set
   *  someone opened by its address. */
  current,
}: {
  plan: Plan | null;
  trouble?: string | null;
  current: boolean;
}) {
  const batch = plan?.batch ?? "";
  const panels = plan?.panels ?? [];

  let drawn = new Set<string>();
  let verdicts = new Map<string, StandingVerdict>();
  let hitch = trouble;

  if (plan && !hitch) {
    try {
      // One listing answers "which of these are drawn?" for the whole set,
      // rather than a request per panel.
      const [files, standing] = await Promise.all([
        listRepoDir(`${BRIEFS}/${batch}`),
        readVerdicts(batch),
      ]);
      drawn = new Set(files);
      verdicts = standing;
    } catch {
      // The plan read fine, so the cartoons are there and the scores are safe;
      // only the freshness is in doubt. Say so quietly and still show the desk
      // — a set that renders as an error page because one listing timed out is
      // a sitting he does not have.
      hitch = "The list of finished drawings didn’t come back. Reload in a minute.";
    }
  }

  const total = panels.length;
  const made = panels.filter((panel) => drawn.has(panel.file)).length;
  const scored = panels.filter((panel) => verdicts.has(panel.file.replace(/\.png$/, ""))).length;

  // Everything the desk needs and nothing it doesn't: a plan panel carries a
  // paragraph of camera direction that would be shipped to the browser for no
  // reason at all.
  const deskPanels: DeskPanel[] = panels.map((panel) => {
    const key = panel.file.replace(/\.png$/, "");
    return {
      n: panel.n,
      file: panel.file,
      key,
      speaker: isCast(panel.speaker) ? CAST_NAMES[panel.speaker] : panel.speaker,
      caption: panel.caption,
      turn: panel.turn ?? "",
      cast: (panel.characters ?? [])
        .filter(isCast)
        .map((who) => ({ key: who, name: CAST_NAMES[who] })),
      drawn: drawn.has(panel.file),
      src: `/api/img/brief/${batch}/${panel.file}`,
      alt: `Cartoon ${panel.n}: ${panel.action || panel.scene || panel.caption}`,
      verdict: verdicts.get(key) ?? null,
    };
  });

  const title = !plan
    ? trouble
      ? "The cartoons aren’t answering"
      : "No cartoons yet"
    : current
      ? "The new cartoons"
      : "Score this set";

  return (
    <main id="content" className="paper-sheet rv-paper">
      <header className="rv-head">
        <p className="paper-eyebrow">The review</p>
        <h1 className="paper-title">{title}</h1>

        {plan && (
          <>
            {/* What was asked for, in the words it was asked in. The heading
                says which set this is; this says what it was meant to be. */}
            <p className="rv-brief">&ldquo;{plan.brief}&rdquo;</p>
            <p className="rv-made">
              {total} cartoon{total === 1 ? "" : "s"}
              {/* A date belongs on a set he opened by its address, because
                  that is the only thing telling him which one it is. On the
                  new set it is noise: "new" is the whole of what he needs. */}
              {!current && madeAt(plan.createdAt) ? `, drawn ${madeAt(plan.createdAt)}` : ""}
              {scored > 0 ? ` · you have scored ${scored}` : ""}
            </p>
            {/* The normal state of a fresh set is half-finished — the drawings
                land one at a time over the better part of an hour. Say what is
                here and that more is coming, in the words of a kitchen, not of
                a failure: a blank wall with no explanation reads as broken. */}
            <p className="rv-drawing">
              {made === total
                ? `All ${total} are drawn.`
                : made === 0
                  ? `Still drawing — none of the ${total} are in yet. Check back shortly.`
                  : `Still drawing — ${made} of ${total} are in so far. Score those and check back shortly for the rest.`}
            </p>

            {/* Rick opens this page cold. Tell him what he is looking at and
                what to do, in the fewest plain words that will do it. */}
            <div className="rv-howto">
              <p className="rv-howto-head">How this works</p>
              <p>
                One cartoon at a time. Give it a score out of ten for each character in the picture,
                one for the picture itself and one for the line — then move on. The strip of numbers
                at the top shows what you have done and what is left, and you can jump to any of them.
              </p>
              <p>
                Nothing needs saving by hand and nothing gets lost: what you tap and type is kept on
                this device straight away and sent on a moment later. Come back to any cartoon and
                score it again whenever you like — the new score replaces the old one.
              </p>
              <p className="rv-howto-blunt">
                Be blunt. A low score with a sentence saying why is the most useful thing on this
                page — it is what the next set gets built from.
              </p>
              <p className="rv-howto-keys">
                On a computer, the left and right arrow keys move between cartoons.
              </p>
            </div>
          </>
        )}

        {/* No briefs at all, or none with a plan yet. Not an error — it is the
            state of a studio nobody has asked for cartoons from. */}
        {!plan && !trouble && (
          <p className="rv-empty">
            Nothing has been drawn for you to score yet. Ask your AI for cartoons and the set will be
            waiting here — the hookup lives under{" "}
            <Link href="/connect">Connect your AI</Link>.
          </p>
        )}

        {/* He gets a sentence he can act on; the operator gets the actual
            complaint underneath it. One line of GitHub's own words was the
            whole of what this page said when the token expired. */}
        {hitch && (
          <div className="rv-trouble" role="alert">
            <p>
              Nothing is lost — the cartoons and your scores are where they were. Try again in a
              minute.
            </p>
            <p className="rv-trouble-detail">{hitch}</p>
          </div>
        )}
      </header>

      {deskPanels.length > 0 && <ReviewDesk batch={batch} panels={deskPanels} />}

      {/* Who made it. Machine names, kept out of his way at the foot of the
          page rather than in a heading. */}
      {plan && (plan.writer || plan.model || plan.quality) && (
        <p className="rv-colophon">
          {[
            plan.writer && `Written by ${plan.writer}`,
            plan.model && `drawn by ${plan.model}`,
            plan.quality && `${plan.quality} quality`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      {/* The only way back, and it points forward: there is no shelf of old
          sets to return to, so an address-opened set sends him to the current
          one. /review shows this to nobody, being already there. */}
      {!current && (
        <p className="rv-back">
          <Link href="/review">The new cartoons ›</Link>
        </p>
      )}

      {/* One stylesheet for the whole screen — the sticky bar, the hover and
          focus states and the breakpoints that inline styles can't do. */}
      <style>{`
        /* The sheet itself, the eyebrow and the title are shared with the
           other paper pages now — see .paper-sheet in studio.css. This screen
           only sets its own measure, which is wider than the rest because the
           picture and the dials sit side by side. */
        .rv-paper { max-width: 1180px; }

        .rv-head { margin: 18px 0 0; }
        .rv-brief {
          font-family: ${serif};
          font-style: italic;
          font-size: 18px;
          line-height: 1.5;
          color: #4a4136;
          margin: 10px 0 0;
          max-width: 74ch;
        }
        .rv-made { font-family: ${serif}; font-size: 15px; color: #5a5145; margin: 10px 0 0; }
        .rv-drawing { font-family: ${serif}; font-style: italic; font-size: 15px; color: #5a5145; margin: 8px 0 0; }
        .rv-empty {
          font-family: ${serif};
          font-style: italic;
          font-size: 17px;
          line-height: 1.6;
          color: #5a5145;
          margin: 20px 0 0;
          max-width: 62ch;
        }
        .rv-empty a { color: #221d16; }

        .rv-howto {
          margin-top: 18px;
          padding: 16px 20px;
          background: #f6f2e8;
          border-left: 4px solid #c9a227;
          border-radius: 4px;
          max-width: 80ch;
        }
        .rv-howto p { color: #4a4136; line-height: 1.65; margin: 0 0 10px; }
        .rv-howto p:last-child { margin-bottom: 0; }
        .rv-howto-head { font-family: ${serif}; font-size: 18px; color: #221d16 !important; }
        .rv-howto-blunt { color: #221d16 !important; }
        .rv-howto-keys { font-size: 13px; color: #6b6153 !important; }

        .rv-colophon {
          font-size: 12.5px;
          color: #7a7062;
          margin: 30px 0 0;
          border-top: 1px solid #ece5d8;
          padding-top: 12px;
          word-break: break-word;
        }
        .rv-back { font-family: ${serif}; font-size: 14px; margin: 14px 0 0; }
        .rv-back a { color: #6b6153; }

        /* ------------------------------------------------ the desk */

        .rv-desk { margin-top: 22px; }

        /* The count and the strip follow him down the page: on cartoon
           nineteen of twenty-five, "how many left" is the question, and
           scrolling back up to answer it is how a sitting gets abandoned. */
        .rv-progress {
          position: sticky;
          top: 0;
          z-index: 5;
          background: #fdfbf6;
          border-bottom: 2px solid #1a1a1a;
          margin: 0 -30px 18px;
          padding: 12px 30px 10px;
        }
        .rv-progress-line {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .rv-progress-count { font-family: ${serif}; font-size: 15.5px; color: #5a5145; margin: 0; }
        .rv-progress-count strong { font-weight: 400; color: #221d16; font-size: 18px; }

        .rv-jump {
          font-family: ${serif};
          font-size: 14px;
          min-height: 44px;
          padding: 8px 16px;
          border-radius: 4px;
          border: 1px solid #c9a227;
          background: #fbf5e3;
          color: #6b5a12;
          cursor: pointer;
          white-space: nowrap;
        }
        .rv-jump:hover:enabled { background: #f6edd4; }
        .rv-jump:disabled { opacity: 0.55; cursor: default; border-color: #ded7c9; background: #f5f2ea; color: #6b6153; }

        .rv-bar { height: 6px; background: #ece5d8; border-radius: 999px; overflow: hidden; margin-top: 9px; }
        .rv-bar span { display: block; height: 100%; background: #c9a227; }

        /* One row that scrolls sideways rather than four rows that wrap: on a
           phone a wrapping strip is taller than the picture it is meant to
           help him get back to. */
        .rv-strip {
          list-style: none;
          display: flex;
          gap: 6px;
          margin: 9px 0 0;
          padding: 2px 0 4px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .rv-strip li { flex: 0 0 auto; margin: 0; }
        .rv-chip {
          min-width: 40px;
          height: 40px;
          padding: 0 9px;
          position: relative;
          font-family: ${serif};
          font-size: 13.5px;
          border-radius: 4px;
          border: 1px solid #cec5b4;
          background: #f5f2ea;
          color: #6b6153;
          cursor: pointer;
          font-variant-numeric: tabular-nums;
        }
        .rv-chip:hover { background: #ece7da; }
        .rv-chip-done { background: #1a1a1a; border-color: #1a1a1a; color: #fff; }
        .rv-chip-done:hover { background: #000; }
        .rv-chip-part { background: #fbf5e3; border-color: #c9a227; color: #6b5a12; }
        .rv-chip-waiting { border-style: dashed; opacity: 0.5; }
        /* The one he is on, ringed in chalk gold — never an outline, which is
           what the focus ring uses. */
        .rv-chip-now { box-shadow: 0 0 0 2px #c9a227; }
        .rv-chip-unsaved::after {
          content: "";
          position: absolute;
          top: 3px;
          right: 3px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #8a2f22;
        }

        .rv-stage {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(360px, 0.92fr);
          gap: 28px;
          align-items: start;
          /* Clears the sticky bar when he is scrolled to a cartoon — the
             strip's chips are 40px now, so the old 150 left the heading
             tucked under the rule. */
          scroll-margin-top: 160px;
        }

        .rv-stage-no {
          font-family: ${serif};
          font-weight: 400;
          font-size: 13px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6b6153;
          margin: 0 0 10px;
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 10px;
        }
        .rv-stage-of { letter-spacing: 0.06em; text-transform: none; }
        .rv-already {
          font-size: 11px;
          letter-spacing: 0.1em;
          color: #6b5a12;
          background: #fbf5e3;
          border: 1px solid #c9a227;
          border-radius: 999px;
          padding: 3px 10px;
        }

        /* The picture is the point: as tall as the screen will allow, matted
           on white, never cropped. */
        .rv-plate {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          border: 1px solid #e5dfd3;
          border-radius: 4px;
          padding: 10px;
          height: min(72vh, 860px);
          height: min(72dvh, 860px);
        }
        .rv-art { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; }
        .rv-waiting { font-family: ${serif}; font-style: italic; font-size: 15px; color: #6b6153; margin: 0; }

        .rv-caption {
          font-family: ${serif};
          font-style: italic;
          font-size: 22px;
          line-height: 1.42;
          color: #221d16;
          margin: 0;
        }
        .rv-speaker { font-style: normal; }
        .rv-turn { font-size: 12.5px; line-height: 1.5; color: #6b6153; margin: 8px 0 0; }

        .rv-scale {
          font-size: 13.5px;
          line-height: 1.6;
          color: #4a4136;
          margin: 16px 0 0;
          border-top: 1px solid #ece5d8;
          padding-top: 14px;
        }

        .rv-dial { margin-top: 14px; display: grid; grid-template-columns: 1fr auto; gap: 2px 10px; align-items: baseline; }
        .rv-dial-label {
          display: block;
          font-family: ${serif};
          font-size: 12.5px;
          text-transform: uppercase;
          letter-spacing: 0.13em;
          color: #221d16;
        }
        .rv-dial-hint {
          text-transform: none;
          letter-spacing: 0;
          font-style: italic;
          font-size: 13px;
          color: #6b6153;
        }
        .rv-dial-value {
          font-family: ${serif};
          font-size: 13px;
          color: #221d16;
          text-align: right;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .rv-dial-value-none { color: #8a7f6d; font-style: italic; }
        .rv-dial-row {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(10, minmax(0, 1fr));
          gap: 4px;
          margin-top: 5px;
        }
        /* Big enough to hit with a thumb on the iPad he reviews on. */
        .rv-dial-btn {
          min-height: 42px;
          padding: 0;
          font-family: ${serif};
          font-size: 15px;
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
        .rv-dial-on { background: #1a1a1a; color: #fff; border-color: #1a1a1a; font-weight: 700; }
        .rv-dial-on:hover { background: #1a1a1a; }

        .rv-comment { margin-top: 18px; }
        /* 16px, not smaller: iOS zooms the whole page in on any input set
           below it, and he reviews on an iPad. */
        .rv-comment-box {
          width: 100%;
          box-sizing: border-box;
          margin-top: 6px;
          font-family: ${serif};
          font-size: 16px;
          line-height: 1.5;
          color: #221d16;
          background: #fff;
          border: 1px solid #ccc4b4;
          border-radius: 4px;
          padding: 9px 10px;
          resize: vertical;
        }
        .rv-note { font-family: ${serif}; font-style: italic; font-size: 12.5px; color: #6b6153; margin: 6px 0 0; }

        .rv-restored {
          font-family: ${serif};
          font-size: 14px;
          color: #6b5a12;
          background: #fbf5e3;
          border-left: 3px solid #c9a227;
          border-radius: 0 4px 4px 0;
          padding: 9px 12px;
          margin: 14px 0 0;
        }

        .rv-savebar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          margin-top: 18px;
          border-top: 1px solid #ece5d8;
          padding-top: 14px;
        }
        .rv-save {
          font-family: ${serif};
          font-size: 16px;
          padding: 12px 20px;
          border-radius: 4px;
          border: 1px solid #1a1a1a;
          background: #1a1a1a;
          color: #fdfbf6;
          cursor: pointer;
        }
        .rv-save:hover:enabled { background: #000; }
        .rv-save:disabled { opacity: 0.45; cursor: default; }

        /* Reserved height: the word lands without moving the button under him. */
        .rv-status {
          margin: 0;
          flex: 1 1 220px;
          font-family: ${serif};
          font-style: italic;
          font-size: 13.5px;
          color: #5a5145;
          min-height: 1.2em;
        }
        .rv-status-warn { color: #6b5a12; }
        .rv-status-bad { font-style: normal; color: #8a2f22; }

        .rv-pending {
          font-family: ${serif};
          font-style: italic;
          font-size: 14px;
          color: #6b6153;
          margin: 16px 0 0;
          border-top: 1px solid #ece5d8;
          padding-top: 12px;
        }

        .rv-move { display: flex; justify-content: space-between; gap: 10px; margin-top: 18px; }
        .rv-move-btn {
          font-family: ${serif};
          font-size: 14px;
          min-height: 44px;
          padding: 10px 16px;
          border-radius: 4px;
          border: 1px solid #b9b0a0;
          background: #f5f2ea;
          color: #1a1a1a;
          cursor: pointer;
        }
        .rv-move-btn:hover:enabled { background: #ece7da; }
        .rv-move-btn:disabled { opacity: 0.4; cursor: default; }

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
        .rv-trouble p { margin: 0; }
        .rv-trouble-detail { font-style: normal; font-size: 13px; margin-top: 6px; color: #6b4038; }

        /* One column below a desk: a 2:3 engraving beside a scoring column in
           anything narrower is too small to judge. */
        @media (max-width: 1000px) {
          .rv-stage { grid-template-columns: minmax(0, 1fr); gap: 18px; }
          .rv-plate { height: min(64vh, 700px); height: min(64dvh, 700px); }
          .rv-caption { font-size: 20px; margin-top: 2px; }
        }

        /* The sheet's own padding drops to 16px at this width (studio.css), so
           the sticky bar's bleed has to follow it or the rule stops short of
           the edge. */
        @media (max-width: 700px) {
          .rv-progress { margin: 0 -16px 16px; padding: 10px 16px 8px; }
          .rv-brief { font-size: 16.5px; }
          .rv-howto { padding: 14px 16px; }
          .rv-dial-row { gap: 3px; }
          .rv-dial-btn { font-size: 14px; }
          .rv-save { width: 100%; }
        }
      `}</style>
    </main>
  );
}
