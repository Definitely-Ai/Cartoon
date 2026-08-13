import type { Metadata } from "next";
import Link from "next/link";
import {
  blackletter,
  comicSlab,
  displaySerif,
  newsCondensed,
  newsSerif,
  textSerif,
} from "@/app/fonts";
import "./chooser.css";

// The Variant Chooser. One quiet page, black on paper-white, so the founder
// can pick his favorite edition in one sitting — the winner later becomes /.
// Each specimen is an honest miniature of its variant: its real display
// face, its real texture, its real cover treatment, rendered small.

export const metadata: Metadata = {
  // Set in full here: Next's title.template does not apply to the page in
  // the segment that defines it.
  title: "Choose your edition · The Swinging Door", // BRAND: replace when final
};

export default function VariantChooser() {
  return (
    <div
      className={`chooser ${newsSerif.variable} ${blackletter.variable} ${newsCondensed.variable} ${displaySerif.variable} ${textSerif.variable} ${comicSlab.variable}`}
    >
      <header className="chooser-header">
        <p className="chooser-eyebrow">Proof sheet · Three editions of one strip</p>
        {/* BRAND: replace when final */}
        <h1 className="chooser-brand">The Swinging Door</h1>
        <p className="chooser-line">Choose your edition.</p>
        <p className="chooser-explain">
          Same cartoons, three different papers. Pick whichever suits you — you can always come
          back and try another.
        </p>
      </header>

      <main id="content" className="chooser-main">
        <nav aria-label="Editions">
          <ul className="chooser-grid">
          <li>
            <Link href="/a" className="chooser-card">
              <span className="specimen specimen-a" aria-hidden="true">
                {/* BRAND: replace when final */}
                <span className="spec-a-masthead">The Swinging Door</span>
                <span className="spec-a-rules"></span>
                <span className="spec-a-dateline">Vol. 1 · Every morning · Price: one good laugh</span>
                <span className="spec-a-body">
                  <span className="spec-a-panel"></span>
                  <span className="spec-a-col"></span>
                  <span className="spec-a-col"></span>
                </span>
              </span>
              <span className="chooser-label">
                <span className="chooser-name chooser-name-a">The Daily Paper</span>
                <span className="chooser-desc">Front-page news, funny on purpose.</span>
                <span className="chooser-go">Read this edition ›</span>
              </span>
            </Link>
          </li>

          <li>
            <Link href="/b" className="chooser-card">
              <span className="specimen specimen-b" aria-hidden="true">
                <span className="spec-b-issue">The August Issue — Weekly</span>
                <span className="spec-b-plate">
                  <span className="spec-b-art"></span>
                </span>
                <span className="spec-b-caption">“We're all long-term investors here.”</span>
              </span>
              <span className="chooser-label">
                <span className="chooser-name chooser-name-b">The Gag Panel</span>
                <span className="chooser-desc">One panel. Plenty of white space. No mercy.</span>
                <span className="chooser-go">Read this edition ›</span>
              </span>
            </Link>
          </li>

          <li>
            <Link href="/c" className="chooser-card">
              <span className="specimen specimen-c" aria-hidden="true">
                <span className="spec-c-header">The Funny Pages</span>
                <span className="spec-c-board">
                  <span className="spec-c-panel">
                    <span className="spec-c-tape"></span>
                  </span>
                  <svg className="spec-c-burst" viewBox="0 0 100 100">
                    <polygon
                      points="50,2 59,20 78,10 74,30 96,30 82,45 98,58 76,60 82,80 62,72 56,94 46,74 28,88 30,66 8,66 22,52 6,40 28,38 22,16 42,26"
                      fill="#ffffff"
                      stroke="#000000"
                      strokeWidth="3"
                    />
                    <text x="50" y="56" textAnchor="middle" fontSize="17" fontWeight="bold" fill="#000000">
                      GAG!
                    </text>
                  </svg>
                </span>
              </span>
              <span className="chooser-label">
                <span className="chooser-name chooser-name-c">The Funny Pages</span>
                <span className="chooser-desc">The section you actually read first.</span>
                <span className="chooser-go">Read this edition ›</span>
              </span>
            </Link>
          </li>
          </ul>
        </nav>
      </main>

      <footer className="chooser-footer">
        {/* BRAND: replace when final */}
        <p>© {new Date().getFullYear()} The Swinging Door · All characters and cartoons are property of the company.</p>
        <p className="chooser-desk">Published from the desk of the founder</p>
        <p className="chooser-credit">
          Site built by <a href="https://aidreambuilders.com">aidreambuilders.com</a>
          {" · "}
          <Link href="/backroom">Staff entrance</Link>
        </p>
      </footer>
    </div>
  );
}
