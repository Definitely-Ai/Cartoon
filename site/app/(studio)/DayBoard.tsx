import Image from "next/image";
import type { OptionDay } from "@/lib/options";
import { formatDateline } from "@/lib/format";
import StarButton from "./StarButton";

// One day's cartoons on the table: big cards, tap to zoom, star to keep.
// The topic (the founder's request — "fishing") headlines the batch, the
// way an assignment headlines a contact sheet.

export default function DayBoard({ day }: { day: OptionDay }) {
  const topics = Array.from(new Set(day.options.map((o) => o.topic).filter(Boolean))) as string[];

  return (
    <section className="br-table" aria-label={`Cartoons of ${day.day}`}>
      <div className="br-table-head">
        <h1 className="br-date">{formatDateline(day.day)}</h1>
        {topics.length > 0 && (
          <p className="br-topic">
            {"“"}
            {topics.join("” · “")}
            {"”"}
          </p>
        )}
        <p className="br-howto">
          {day.options.length} cartoon{day.options.length === 1 ? "" : "s"}. Tap a picture to see it
          big; star the ones worth keeping.
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

      <ul className="br-proofs">
        {day.options.map((option) => (
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
          </li>
        ))}
      </ul>
    </section>
  );
}
