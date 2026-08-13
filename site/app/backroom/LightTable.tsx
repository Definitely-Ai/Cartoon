import Image from "next/image";
import Link from "next/link";
import { getBySlug } from "@/lib/cartoons";
import type { OptionDay } from "@/lib/options";
import { formatDateline } from "@/lib/format";
import PublishPanel from "./PublishPanel";

// The light table: one day's proofs laid out for a decision. Used by the
// desk page (/backroom) and every day page (/backroom/day/[day]). If the
// day already ran, the chosen proof wears the RAN stamp and the others are
// marked spiked; otherwise every proof carries a publish panel.

export default function LightTable({ day }: { day: OptionDay }) {
  const ran = day.selected;
  const published = ran ? getBySlug(ran.slug) : undefined;

  return (
    <section className="br-table" aria-label={`Proofs for ${day.day}`}>
      <div className="br-table-head">
        <h1 className="br-date">{formatDateline(day.day)}</h1>
        {ran ? (
          <p className="br-status br-status-ran">
            Ran option {ran.option}
            {published ? <> — &ldquo;{published.title}&rdquo;, Edition No.&nbsp;{published.edition}</> : null}
          </p>
        ) : (
          <p className="br-status">
            {day.options.length} proof{day.options.length === 1 ? "" : "s"} on the table · undecided
          </p>
        )}
        {ran && published && (
          <p className="br-see-public">
            <Link href={`/cartoon/${published.slug}`}>See it on the front page</Link>
          </p>
        )}
      </div>

      <ul className="br-proofs">
        {day.options.map((option) => {
          const isChosen = ran?.option === option.n;
          return (
            <li
              key={option.n}
              className={`br-proof${isChosen ? " br-proof-ran" : ""}${ran && !isChosen ? " br-proof-spiked" : ""}`}
            >
              <p className="br-proof-no" aria-hidden="true">
                № {option.n}
              </p>
              <figure className="br-proof-card">
                {isChosen && (
                  <span className="br-stamp" aria-hidden="true">
                    Ran
                  </span>
                )}
                <Image
                  src={option.src}
                  alt={`Proof ${option.n}${option.title ? ` — ${option.title}` : ""}${option.caption ? ` — ${option.caption}` : ""}`}
                  width={option.width}
                  height={option.height}
                  sizes="(min-width: 700px) 620px, 94vw"
                  className="br-proof-img"
                />
                <figcaption className="br-proof-cap">
                  {option.title && <strong>{option.title}</strong>}
                  {option.title && option.caption ? " — " : ""}
                  {option.caption ?? (option.title ? "" : "No suggested caption filed.")}
                </figcaption>
              </figure>
              <p className="br-proof-tools">
                <a href={option.src} target="_blank" rel="noopener" className="br-fullsize">
                  Open full size
                </a>
                {ran && !isChosen && <span className="br-spiked-note">Spiked</span>}
              </p>
              {!ran && (
                <PublishPanel
                  day={day.day}
                  option={option.n}
                  initialTitle={option.title ?? ""}
                  initialCaption={option.caption ?? ""}
                  initialTags={option.tags.join(", ")}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
