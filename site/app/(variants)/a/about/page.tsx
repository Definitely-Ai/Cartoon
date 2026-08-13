import type { Metadata } from "next";

// From the publisher: two short paragraphs, a drop cap, and the copy
// desk's end mark. Placeholder brand-voice copy — the company name is
// marked for replacement.

export const metadata: Metadata = {
  title: "About the Paper",
  description: "A very small newspaper about money, published daily from the desk of a retired financial advisor.",
};

export default function AboutPage() {
  return (
    <main id="content" className="va-shell">
      <header className="va-page-head">
        <p className="va-eyebrow">From the Publisher</p>
        <h1 className="va-page-title va-ink-spread">About the Paper</h1>
      </header>

      <article className="va-about">
        <p className="va-about-body">
          {/* BRAND: replace when final */}
          Flamingo &amp; Dog is a very small newspaper with a very narrow beat: money, and the things
          it does to otherwise sensible people. Each edition is one panel, drawn in black and white,
          concerning markets, meetings, retirement, and clients who would like both perfect safety
          and forty percent a year. The cast is a flamingo and a dog. One of them is usually right,
          and it is not always the same one.
        </p>
        <p className="va-about-body">
          The founder spent the better part of four decades as a financial advisor, which is long
          enough to notice that the funniest thing about money is everything. He has since retired —
          in the sense that he now draws the meetings instead of billing for them. The paper goes out
          from his desk, one panel at a time. Corrections are printed rarely, and regretted always.
        </p>
        <p className="va-thirty" aria-hidden="true">
          — 30 —
        </p>
      </article>
    </main>
  );
}
