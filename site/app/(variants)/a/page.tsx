import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import TransitionLink from "@/components/TransitionLink";
import { getAdjacent, getAllCartoons, getLatest } from "@/lib/cartoons";
import { dayOfYear, formatDateAP, formatDateline } from "@/lib/format";

// The front page. Today's cartoon runs as the lead story under the
// blackletter masthead; the right rail carries the classified archive
// teaser and THE FORECAST, a boxed one-liner that rotates by day of
// year — deterministic per build, never random.

export const metadata: Metadata = {
  title: "Front Page",
  description:
    "Today's single-panel business cartoon, printed in black and white, plus the forecast and the classified archive.",
};

// Five market outlooks in house voice. Rotation is dayOfYear % 5.
const FORECAST_QUIPS = [
  "Partly bullish, with a chance of correction by late afternoon.",
  "Analysts expect volatility, which is how analysts say they don't know.",
  "Past performance is no guarantee of future results, but it remains a very persuasive salesman.",
  "The long term is expected to begin tomorrow, as it has every day since 1987.",
  "Dividends: small, regular payments of loyalty. See also: the dog.",
];

export default function FrontPage() {
  const latest = getLatest();
  const { older } = getAdjacent(latest.slug);
  const previous = getAllCartoons()
    .filter((cartoon) => cartoon.slug !== latest.slug)
    .slice(0, 5);
  const quip = FORECAST_QUIPS[dayOfYear(new Date().toISOString().slice(0, 10)) % FORECAST_QUIPS.length];

  return (
    <main id="content" className="va-shell">
      <header className="va-masthead">
        <h1 className="va-masthead-title va-ink-spread">
          {/* BRAND: replace when final */}
          Flamingo &amp; Dog
        </h1>
        <p className="va-masthead-motto">All the gags that are fit to print.</p>
        <p className="va-dateline va-onum">
          <span className="va-dateline-vol">
            Vol. 1 · No. {latest.edition}
          </span>
          <span className="va-dateline-date">{formatDateline(latest.date)}</span>
          <span className="va-dateline-price">Price: One Good Laugh</span>
        </p>
      </header>

      <div className="va-front">
        <article className="va-lead">
          <p className="va-eyebrow">Today&rsquo;s Cartoon</p>
          <h2 className="va-lead-headline va-ink-spread">
            <TransitionLink href={`/cartoon/${latest.slug}?from=a`}>{latest.title}</TransitionLink>
          </h2>
          <figure className="va-figure" style={{ viewTransitionName: `panel-${latest.slug}` }}>
            <TransitionLink
              href={`/cartoon/${latest.slug}?from=a`}
              className="va-figure-link"
              aria-label={`See this edition's plate: ${latest.title}`}
            >
              <Image
                src={latest.src}
                alt={latest.alt}
                width={latest.width}
                height={latest.height}
                priority
                className="va-img"
              />
            </TransitionLink>
            <figcaption className="va-caption">{latest.caption}</figcaption>
          </figure>
          {latest.tags.length > 0 && (
            <p className="va-lead-tags">Filed under: {latest.tags.join(", ")}</p>
          )}
          {older && (
            <p className="va-prev va-onum">
              <TransitionLink href={`/cartoon/${older.slug}?from=a`}>
                Turn to the previous edition — &ldquo;{older.title},&rdquo; {formatDateAP(older.date)}
              </TransitionLink>
            </p>
          )}
        </article>

        <aside className="va-rail">
          <section aria-label="In previous editions">
            <h2 className="va-rail-head">In Previous Editions</h2>
            <ul className="va-teasers">
              {previous.map((cartoon) => (
                <li key={cartoon.slug}>
                  <TransitionLink href={`/cartoon/${cartoon.slug}?from=a`} className="va-teaser">
                    <span className="va-teaser-date va-onum">
                      {formatDateAP(cartoon.date)} · No. {cartoon.edition}
                    </span>
                    <span className="va-teaser-title">{cartoon.title}</span>
                    <span className="va-teaser-caption">{cartoon.caption}</span>
                  </TransitionLink>
                </li>
              ))}
            </ul>
            <p className="va-rail-more">
              <Link href="/a/archive">Consult the Morgue — every edition ever printed</Link>
            </p>
          </section>

          <section className="va-forecast" aria-label="The forecast">
            <div className="va-forecast-inner">
              <h2 className="va-forecast-head">The Forecast</h2>
              <p className="va-forecast-quip">{quip}</p>
              <p className="va-forecast-note">Outlook subject to revision without notice.</p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
