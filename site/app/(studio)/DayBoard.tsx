import Image from "next/image";
import type { CartoonOption, OptionDay } from "@/lib/options";
import { formatDateline } from "@/lib/format";
import FeedbackPanel from "./FeedbackPanel";
import StarButton from "./StarButton";

// One day's cartoons on the table, grouped by the request that produced
// them. Under every card: the keeper star and the training-week verdict
// chips — the whole feedback loop, one glance per cartoon.

function groupByTopic(options: CartoonOption[]): { topic: string | null; options: CartoonOption[] }[] {
  const groups: { topic: string | null; options: CartoonOption[] }[] = [];
  for (const option of options) {
    const bucket = groups.find((g) => g.topic === option.topic);
    if (bucket) bucket.options.push(option);
    else groups.push({ topic: option.topic, options: [option] });
  }
  return groups;
}

export default function DayBoard({ day }: { day: OptionDay }) {
  const groups = groupByTopic(day.options);
  const remaining = day.options.length - day.ratedCount;

  return (
    <section className="br-table" aria-label={`Cartoons of ${day.day}`}>
      <div className="br-table-head">
        <h1 className="br-date">{formatDateline(day.day)}</h1>
        <p className="br-howto">
          {day.options.length} cartoon{day.options.length === 1 ? "" : "s"}. Tap a picture to see
          it big. Give each one a verdict — and when you can, a line about why. That&rsquo;s what
          teaches the AI your taste.
        </p>
        <p className="br-progress" role="status">
          {remaining === 0
            ? "All rated — good work."
            : `${day.ratedCount} of ${day.options.length} rated · ${remaining} to go`}
        </p>
      </div>

      {day.options.length > 2 && (
        <nav className="br-jump" aria-label="Jump to a cartoon">
          {day.options.map((option) => (
            <a key={option.n} href={`#proof-${day.day}-${option.n}`} className="br-jump-chip">
              <Image src={option.src} alt="" width={option.width} height={option.height} sizes="96px" />
              <span>№ {option.n}</span>
            </a>
          ))}
        </nav>
      )}

      {groups.map((group) => (
        <div key={group.topic ?? "general"} className="br-topic-group">
          {groups.length > 1 && group.topic && <h2 className="br-topic">“{group.topic}”</h2>}
          {groups.length === 1 && group.topic && <p className="br-topic">“{group.topic}”</p>}
      <ul className="br-proofs">
        {group.options.map((option) => (
          <li key={option.n} id={`proof-${day.day}-${option.n}`} className="br-proof">
            <p className="br-proof-no" aria-hidden="true">
              № {option.n}
            </p>
            <figure className="br-proof-card">
              <span className="br-proof-tape" aria-hidden="true" />
              {option.keeper && (
                <span className="br-stamp" aria-hidden="true">
                  Keeper
                </span>
              )}
              <a
                href={option.src}
                target="_blank"
                rel="noopener"
                className="br-proof-zoom"
                aria-label={`Open cartoon ${option.n} full size`}
              >
                <Image
                  src={option.src}
                  alt={`Cartoon ${option.n}${option.title ? ` — ${option.title}` : ""}${option.caption ? ` — ${option.caption}` : ""}`}
                  width={option.width}
                  height={option.height}
                  sizes="(min-width: 700px) 620px, 94vw"
                  className="br-proof-img"
                />
              </a>
              {/* The dialogue is typeset inside the finished PNG — the visible
                  line is just the title; the words stay for screen readers. */}
              <figcaption className="br-proof-cap">
                {option.title && <strong>{option.title}</strong>}
                {option.caption && <span className="sr-only"> — {option.caption}</span>}
              </figcaption>
            </figure>
            <StarButton day={day.day} option={option.n} initial={option.keeper} />
            <FeedbackPanel
              day={day.day}
              option={option.n}
              initialRating={option.rating}
              initialNote={option.note}
            />
          </li>
        ))}
      </ul>
        </div>
      ))}
    </section>
  );
}
