import type { Metadata } from "next";
import Fleuron from "../Fleuron";

// About — two short paragraphs in the house voice: the company, then the
// founder. Dry, warm, financially literate; nothing that could be mistaken
// for a pitch deck.

export const metadata: Metadata = {
  title: "About",
  description: "The company and its founder, briefly and in black and white.",
};

export default function AboutPage() {
  return (
    <main id="content">
      <header className="vb-page-head">
        <h1 className="vb-page-title">About the Panel</h1>
      </header>

      <div className="vb-prose">
        <p>
          {/* BRAND: replace when final */}
          Flamingo &amp; Dog publishes single-panel cartoons about the business of money —
          markets, meetings, fees, and the long unhurried comedy of retirement planning. Every
          panel is drawn in black and white, which is how the truth about money generally
          arrives. One flamingo, one dog, no color, no exceptions.
        </p>
        <p>
          The founder spent the better part of four decades as a financial advisor, explaining
          compound interest to people who wanted to talk about their brother-in-law&rsquo;s stock
          tip. Somewhere around the thousandth client meeting he concluded that the funniest
          thing about money is everything, and retired to write it down. The panel is the
          result. He remains, for the record, fully diversified.
        </p>
      </div>

      <Fleuron />
      <p className="vb-about-close vb-caps-tiny">Published weekly, market conditions permitting</p>
    </main>
  );
}
