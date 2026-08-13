import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import TransitionLink from "@/components/TransitionLink";
import { getAdjacent, getAllCartoons, getLatest } from "@/lib/cartoons";
import { formatDateAP, formatDateline } from "@/lib/format";
import Starburst from "./Starburst";

// The paste-up board: today's strip in a thick-inked panel, taped down and
// very slightly askew, with the starburst badge pinned over its corner and
// the last three strips pinned below at alternating angles.

export const metadata: Metadata = {
  title: "The Funny Pages",
  description:
    "Today’s single-panel business cartoon — markets, money and retirement in black ink on white paper — plus the three strips before it.",
};

// Alternating, deliberately small tilts for the three teasers (unitless;
// multiplied by --vc-tilt-unit in CSS, which mobile flattens to ~±0.4deg).
const TEASER_TILTS = ["-1.1", "0.9", "-0.7"];

export default function FunnyPagesHome() {
  const today = getLatest();
  const earlier = getAllCartoons().slice(1, 4);
  const { older } = getAdjacent(today.slug);

  return (
    <main id="content" className="vc-board">
      <section className="vc-today" aria-label="Today’s strip">
        <div className="vc-today-head">
          <div className="vc-today-headings">
            <p className="vc-dateline">
              {formatDateline(today.date)} · No. {today.edition}
            </p>
            <h1 className="vc-today-title">{today.title}</h1>
          </div>
          <Starburst />
        </div>

        <div className="vc-pin" style={{ "--tilt": "-0.7" } as CSSProperties}>
          <article className="vc-panel vc-hero-panel">
            <span className="vc-tape vc-tape-left" aria-hidden="true" />
            <span className="vc-tape vc-tape-right" aria-hidden="true" />
            <figure style={{ viewTransitionName: `panel-${today.slug}` }}>
              <Image
                src={today.src}
                alt={today.alt}
                width={today.width}
                height={today.height}
                priority
                sizes="(min-width: 900px) 780px, 94vw"
                className="vc-art"
              />
              <figcaption className="vc-caption">{today.caption}</figcaption>
            </figure>
          </article>
        </div>

        {older && (
          <p className="vc-yesterday">
            Missed a day?{" "}
            <TransitionLink href={`/cartoon/${older.slug}?from=c`}>
              Yesterday’s strip: “{older.title}”
            </TransitionLink>
          </p>
        )}
      </section>

      <section className="vc-earlier" aria-label="Recent strips">
        <div className="vc-earlier-head">
          <h2 className="vc-sechead">
            <span>Recent strips</span>
          </h2>
          <Link className="vc-earlier-more" href="/c/archive">
            Every strip, in the archive
          </Link>
        </div>

        <ul className="vc-teaser-row">
          {earlier.map((cartoon, index) => (
            <li
              key={cartoon.slug}
              className="vc-pin"
              style={{ "--tilt": TEASER_TILTS[index] ?? "0.6" } as CSSProperties}
            >
              <TransitionLink href={`/cartoon/${cartoon.slug}?from=c`} className="vc-teaser-link">
                <article className="vc-panel vc-teaser-panel">
                  <span className="vc-tab">{formatDateAP(cartoon.date)}</span>
                  <h3 className="vc-teaser-title">{cartoon.title}</h3>
                  <figure style={{ viewTransitionName: `panel-${cartoon.slug}` }}>
                    <Image
                      src={cartoon.src}
                      alt={cartoon.alt}
                      width={cartoon.width}
                      height={cartoon.height}
                      sizes="(min-width: 900px) 320px, (min-width: 700px) 46vw, 94vw"
                      className="vc-art"
                    />
                    <figcaption className="vc-caption vc-caption-small">{cartoon.caption}</figcaption>
                  </figure>
                </article>
              </TransitionLink>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
