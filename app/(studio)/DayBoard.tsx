import Image from "next/image";
import type { StudioDay } from "@/lib/db";
import { formatDateline, formatTimeET } from "@/lib/format";
import FeedbackPanel from "./FeedbackPanel";
import StarButton from "./StarButton";

// One day's cartoons on the table, organized the way the day actually
// happened: batch by batch, each headed by WHAT HE ASKED FOR in his own
// words and what the studio did with it. Under every card: the two 1-10
// dials and the keeper star — the whole feedback loop, one glance per
// cartoon.

export default function DayBoard({ day }: { day: StudioDay }) {
  const all = day.batches.flatMap((b) => b.cartoons);
  const remaining = day.cartoonCount - day.ratedCount;

  return (
    <section className="br-table" aria-label={`Cartoons of ${day.day}`}>
      <div className="br-table-head">
        <h1 className="br-date">{formatDateline(day.day)}</h1>
        <p className="br-howto">
          {day.cartoonCount} cartoon{day.cartoonCount === 1 ? "" : "s"} from{" "}
          {day.batches.length === 1 ? "one request" : `${day.batches.length} requests`}. Tap a
          picture to see it big. Score each one twice — 1 to 10 for the art, 1 to 10 for the
          caption — and when you can, a line about why. That&rsquo;s what teaches the AI your
          taste.
        </p>
        <p className="br-progress" role="status">
          {remaining === 0
            ? `All rated — ${day.landedCount} of ${day.cartoonCount} landed. Good work.`
            : `${day.ratedCount} of ${day.cartoonCount} rated · ${remaining} to go`}
        </p>
      </div>

      {all.length > 2 && (
        <nav className="br-jump" aria-label="Jump to a cartoon">
          {all.map((c) => (
            <a key={c.id} href={`#proof-${c.day}-${c.n}`} className="br-jump-chip">
              <Image src={c.src} alt="" width={c.width} height={c.height} sizes="96px" />
              <span>№ {c.n}</span>
            </a>
          ))}
        </nav>
      )}

      {day.batches.map((batch) => (
        <div key={batch.id} className="br-batch">
          <header className="br-batch-head">
            <p className="br-batch-ask">
              <span className="br-batch-label">You asked</span>
              &ldquo;{batch.request}&rdquo;
            </p>
            <p className="br-batch-meta">
              {formatTimeET(batch.createdAt)}
              {batch.topic ? ` · ${batch.topic}` : ""} · {batch.cartoons.length} cartoon
              {batch.cartoons.length === 1 ? "" : "s"}
            </p>
          </header>
          <ul className="br-proofs">
            {batch.cartoons.map((c) => (
              <li key={c.id} id={`proof-${c.day}-${c.n}`} className="br-proof">
                <p className="br-proof-no" aria-hidden="true">
                  № {c.n}
                </p>
                <figure className="br-proof-card">
                  <span className="br-proof-tape" aria-hidden="true" />
                  {c.keeper && (
                    <span className="br-stamp" aria-hidden="true">
                      Keeper
                    </span>
                  )}
                  <a
                    href={c.src}
                    target="_blank"
                    rel="noopener"
                    className="br-proof-zoom"
                    aria-label={`Open cartoon ${c.n} full size`}
                  >
                    <Image
                      src={c.src}
                      alt={`Cartoon ${c.n}${c.title ? ` — ${c.title}` : ""}${c.caption ? ` — ${c.caption}` : ""}`}
                      width={c.width}
                      height={c.height}
                      sizes="(min-width: 700px) 620px, 94vw"
                      className="br-proof-img"
                    />
                  </a>
                  {/* The dialogue is typeset inside the finished PNG — the visible
                      line is just the title; the words stay for screen readers. */}
                  <figcaption className="br-proof-cap">
                    {c.title && <strong>{c.title}</strong>}
                    {c.caption && <span className="sr-only"> — {c.caption}</span>}
                  </figcaption>
                </figure>
                {/* Scores first — that's the daily job; the star is for the
                    exceptional one, so it follows. */}
                <FeedbackPanel
                  day={c.day}
                  option={c.n}
                  initialArt={c.artScore}
                  initialCaption={c.captionScore}
                  initialNote={c.note}
                />
                <StarButton day={c.day} option={c.n} initial={c.keeper} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
