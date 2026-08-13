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
          <Link href="/b">Flamingo &amp; Dog</Link>
        </p>
        <nav className="vb-nav" aria-label="Site sections">
          <Link href="/b">The Panel</Link>
          <Link href="/b/archive">The Archive</Link>
          <Link href="/b/characters">Dramatis Personae</Link>
          <Link href="/b/about">About</Link>
        </nav>
      </header>

      {children}

      <footer className="vb-footer">
        <Fleuron />
        <p className="vb-footer-line">
          {/* BRAND: replace when final */}© {new Date().getFullYear()} Flamingo &amp; Dog
        </p>
        <p className="vb-footer-line">All characters and cartoons are property of the company.</p>
        <p className="vb-footer-desk vb-caps-tiny">Published from the desk of the founder</p>
      </footer>
    </div>
  );
}
