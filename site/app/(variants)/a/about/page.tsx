import type { Metadata } from "next";

// From the publisher: two short paragraphs, a drop cap, and the copy
// desk's end mark. Placeholder brand-voice copy — the company name is
// marked for replacement.

export const metadata: Metadata = {
  title: "About the Paper",
  description:
    "A very small newspaper reporting from one bar stool: politics, markets, and American life, in black-and-white ink wash.",
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
          The Swinging Door is a very small newspaper with one bar on its beat. Each edition is one
          panel, drawn in black-and-white ink wash, filed from inside the Swinging Door — a classic
          American bar where the TV runs the news, the chalkboard runs the specials, and the
          regulars run commentary on politics, markets, and American life. The cast: Drew, a
          flamingo with a bowtie and a martini; Mango, a golden retriever with a flag on his lapel
          and a story already underway; and Abby behind the bar, who appears rarely and is right
          constantly.
        </p>
        <p className="va-about-body">
          The founder spent the better part of four decades as a financial advisor, which is long
          enough to notice that the funniest thing about money is everything, and that most of it
          is on the news by six. He has since retired — in the sense that he now draws the
          conversation instead of billing for it. The paper goes out from his desk, one panel at a
          time. Corrections are printed rarely, and regretted always.
        </p>
        <p className="va-thirty" aria-hidden="true">
          — 30 —
        </p>
      </article>
    </main>
  );
}
