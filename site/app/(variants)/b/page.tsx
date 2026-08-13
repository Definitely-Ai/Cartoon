import type { Metadata } from "next";
import Image from "next/image";
import TransitionLink from "@/components/TransitionLink";
import { getAdjacent, getAllCartoons, getLatest } from "@/lib/cartoons";
import { formatDateAP, formatDateLong } from "@/lib/format";
import Fleuron from "./Fleuron";

// The cover moment: an issue line, the newest cartoon presented as a framed
// plate — thin black frame, generous white matte, italic caption beneath —
// and nothing else above the fold. Below, one quiet row of the three
// next-newest panels.

export const metadata: Metadata = {
  title: "The Panel",
  description:
    "One single-panel cartoon at a time, in black and white. Drew, Mango, and the long slow comedy of American life.",
};

export default function HomePage() {
  const latest = getLatest(); // throws with a real message if the archive is empty
  const previously = getAllCartoons().slice(1, 4);
  const { older } = getAdjacent(latest.slug);

  // The issue line stays true to the panel on the cover: derive the month
  // from the latest cartoon's date, not from the clock.
  const issueMonth = formatDateLong(latest.date).split(" ")[0];

  return (
    <main id="content">
      <p className="vb-issue vb-caps-tiny">The {issueMonth} Issue — Weekly</p>

      <article className="vb-cover">
        <h1 className="vb-cover-title">{latest.title}</h1>
        <figure className="vb-plate" style={{ viewTransitionName: `panel-${latest.slug}` }}>
          <div className="vb-plate-frame">
            <Image
              src={latest.src}
              alt={latest.alt}
              width={latest.width}
              height={latest.height}
              priority
              sizes="(max-width: 45rem) 92vw, 640px"
              className="vb-plate-art"
            />
          </div>
          <figcaption className="vb-caption">{latest.caption}</figcaption>
        </figure>
        <p className="vb-plate-folio vb-caps-tiny">
          No. {latest.edition} — {formatDateLong(latest.date)}
        </p>
        {older && (
          <p className="vb-prev-link">
            <TransitionLink href={`/cartoon/${older.slug}?from=b`}>The previous panel</TransitionLink>
          </p>
        )}
      </article>

      {previously.length > 0 && (
        <>
          <Fleuron />
          <section className="vb-previously" aria-labelledby="vb-previously-heading">
            <h2 id="vb-previously-heading" className="vb-previously-title">
              Previously in the Panel
            </h2>
            <ul className="vb-previously-row">
              {previously.map((cartoon) => (
                <li key={cartoon.slug}>
                  <TransitionLink
                    href={`/cartoon/${cartoon.slug}?from=b`}
                    className="vb-thumb-link"
                  >
                    <figure
                      className="vb-thumb"
                      style={{ viewTransitionName: `panel-${cartoon.slug}` }}
                    >
                      <span className="vb-thumb-frame">
                        <span className="vb-thumb-window">
                          <Image
                            src={cartoon.src}
                            alt={cartoon.alt}
                            width={cartoon.width}
                            height={cartoon.height}
                            sizes="(max-width: 45rem) 30vw, 220px"
                          />
                        </span>
                      </span>
                      <figcaption className="vb-thumb-date vb-caps-tiny">
                        {formatDateAP(cartoon.date)}
                      </figcaption>
                    </figure>
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
