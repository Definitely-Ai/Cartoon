import Link from "next/link";
import { displaySerif, textSerif } from "@/app/fonts";
import Fleuron from "./Fleuron";
import "./variant-b.css";

// Variant B — "The Gag Panel". Shared chrome for every /b page: a centered
// magazine masthead over a quiet letterspaced nav row, and a small-print
// footer. Only this variant's two typefaces are loaded here.

export default function VariantBLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`variant-b ${displaySerif.variable} ${textSerif.variable}`}>
      <header className="vb-masthead">
        <p className="vb-brand">
          {/* BRAND: replace when final */}
          <Link href="/b">The Swinging Door</Link>
        </p>
        {/* Plain-language sections; "Dramatis Personae" stays as the
            characters page's own headline, where it can charm instead of
            confuse. */}
        <nav className="vb-nav" aria-label="Site sections">
          <Link href="/b">Today&rsquo;s Panel</Link>
          <Link href="/b/archive">Archive</Link>
          <Link href="/b/characters">The Cast</Link>
          <Link href="/b/about">About</Link>
          <Link href="/">All Editions</Link>
        </nav>
      </header>

      {children}

      <footer className="vb-footer">
        <Fleuron />
        <p className="vb-footer-line">
          {/* BRAND: replace when final */}© {new Date().getFullYear()} The Swinging Door
        </p>
        <p className="vb-footer-line">All characters and cartoons are property of the company.</p>
        <p className="vb-footer-desk vb-caps-tiny">Published from the desk of the founder</p>
        <p className="vb-footer-line">
          Site built by <a href="https://aidreambuilders.com">aidreambuilders.com</a> ·{" "}
          <Link href="/">Choose a different edition</Link>
        </p>
      </footer>
    </div>
  );
}
