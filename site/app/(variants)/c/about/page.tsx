import type { Metadata } from "next";
import type { CSSProperties } from "react";

// About: a single taped-down clipping in the house voice. Body copy is set
// in Bitter (the readable slab), never the hand face; the hand face gets
// exactly one small sign-off line.

export const metadata: Metadata = {
  // BRAND: replace when final
  title: "About",
  description:
    "About The Swinging Door — single-panel barroom cartoons about politics, markets, and American life.",
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
            The Swinging Door runs one strip at a time: a single panel, black ink wash on white
            paper, from a corner bar where the news plays on a small TV and receives exactly the
            respect it has earned. Drew the flamingo brings the skepticism, Mango the golden
            retriever brings the stories, and Abby the bartender brings the last word — sparingly,
            which is why it works.
          </p>
          <p className="vc-about-copy">
            The founder spent four decades as a financial advisor, which is to say four decades of
            explaining, patiently and for a modest fee, that nobody knows anything for certain. On
            retiring he concluded that the funniest thing about money is everything, and opened a
            bar on paper to prove it. The regulars have yet to disagree with him.
          </p>
          <p className="vc-about-sign">New strips run regularly. Tell a friend who owns bonds.</p>
        </article>
      </div>
    </main>
  );
}
