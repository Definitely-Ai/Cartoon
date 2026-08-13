import type { Metadata } from "next";
import type { CSSProperties } from "react";

// About: a single taped-down clipping in the house voice. Body copy is set
// in Bitter (the readable slab), never the hand face; the hand face gets
// exactly one small sign-off line.

export const metadata: Metadata = {
  // BRAND: replace when final
  title: "About",
  description:
    "About Flamingo & Dog — single-panel business cartoons from the desk of a retired financial advisor.",
};

export default function AboutPage() {
  return (
    <main id="content" className="vc-board">
      <header className="vc-page-head">
        <h1 className="vc-sechead">
          <span>About the Funny Business</span>
        </h1>
      </header>

      <div className="vc-pin vc-about-pin" style={{ "--tilt": "0.5" } as CSSProperties}>
        <article className="vc-panel vc-about-card">
          <span className="vc-tape vc-tape-left" aria-hidden="true" />
          <span className="vc-tape vc-tape-right" aria-hidden="true" />
          <p className="vc-about-copy">
            {/* BRAND: replace when final */}
            Flamingo &amp; Dog publishes one cartoon at a time: a single panel, black ink on white
            paper, about the ordinary comedy of money. Markets, meetings, quarterly forecasts, the
            client who is certain that this time is different — the same material the financial
            pages print daily, taken exactly as seriously as it deserves.
          </p>
          <p className="vc-about-copy">
            The founder spent four decades as a financial advisor, which is to say four decades of
            explaining, patiently and for a modest fee, that nobody knows anything for certain. On
            retiring he concluded that the funniest thing about money is everything, and engaged a
            flamingo and a dog to put that finding in print. They have yet to disagree with him.
          </p>
          <p className="vc-about-sign">New strips run regularly. Tell a friend who owns bonds.</p>
        </article>
      </div>
    </main>
  );
}
