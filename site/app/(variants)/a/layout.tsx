import type { ReactNode } from "react";
import Link from "next/link";
import { blackletter, newsCondensed, newsSerif } from "@/app/fonts";
import "./variant-a.css";

// Variant A — "The Daily Paper". The chrome on every page: a thin
// section strip up top (the inside-page running head of a broadsheet,
// with a small blackletter monogram echoing the nameplate) and the
// publisher's folio at the foot. The full masthead itself belongs to
// the front page only, the way it does in print.

export default function VariantALayout({ children }: { children: ReactNode }) {
  return (
    <div className={`variant-a ${blackletter.variable} ${newsSerif.variable} ${newsCondensed.variable}`}>
      <div className="va-shell va-head">
        <nav className="va-strip" aria-label="Sections">
          <Link href="/a" className="va-strip-mark" aria-label="Front page">
            {/* BRAND: replace when final */}
            F&amp;D
          </Link>
          <ul className="va-strip-list">
            <li>
              <Link href="/a">Front Page</Link>
            </li>
            <li>
              <Link href="/a/archive">The Morgue</Link>
            </li>
            <li>
              <Link href="/a/characters">The Cast</Link>
            </li>
            <li>
              <Link href="/a/about">About the Paper</Link>
            </li>
          </ul>
          <span className="va-strip-est va-onum">Est. 2026</span>
        </nav>
      </div>

      {children}

      <div className="va-shell va-foot">
        <footer className="va-footer">
          <p className="va-folio">
            {/* BRAND: replace when final */}
            Flamingo &amp; Dog Publishing Co. — All Rights Reserved
          </p>
          <p className="va-legal va-onum">
            {/* BRAND: replace when final */}© {new Date().getFullYear()} Flamingo &amp; Dog · All characters
            and cartoons are property of the company.
          </p>
          <p className="va-desk">Published from the desk of the founder</p>
        </footer>
      </div>
    </div>
  );
}
