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
          <Link href="/" className="va-strip-mark" aria-label="Front page">
            {/* BRAND: replace when final */}
            SD
          </Link>
          {/* Plain-language section names — the flavor titles ("The
              Morgue") stay on the pages themselves, where a reader can
              enjoy them without having to decode the navigation. */}
          <ul className="va-strip-list">
            <li>
              <Link href="/">Front Page</Link>
            </li>
            <li>
              <Link href="/archive">Archive</Link>
            </li>
            <li>
              <Link href="/cast">The Cast</Link>
            </li>
            <li>
              <Link href="/about">About</Link>
            </li>
          </ul>
          {/* The owner's door, one click from anywhere. Locked to everyone
              else, so it can live in plain sight. */}
          <Link href="/backroom" className="va-strip-est">
            Back Room
          </Link>
        </nav>
      </div>

      {children}

      <div className="va-shell va-foot">
        <footer className="va-footer">
          <p className="va-folio">
            {/* BRAND: replace when final */}
            The Swinging Door Publishing Co. — All Rights Reserved
          </p>
          <p className="va-legal va-onum">
            {/* BRAND: replace when final */}© {new Date().getFullYear()} The Swinging Door · All characters
            and cartoons are property of the company.
          </p>
          <p className="va-desk">Published from the desk of the founder</p>
          {/* No staff link here — the header's Back Room is the one door. */}
          <p className="va-desk">
            Site built by <a href="https://aidreambuilders.com">aidreambuilders.com</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
