import type { ReactNode } from "react";
import Link from "next/link";
import { comicHand, newsCondensed, newsSerif } from "@/app/fonts";
import StudioNav, { type Place } from "./StudioNav";
import "../studio.css";
import "../workspace.css";
import "../workspace-legacy.css";
import "../studio-shell.css";

// Four production workflows. Development routes and saved assets stay intact,
// without presenting superseded tools as everyday destinations.
const PLACES: Place[] = [
  { href: "/gallery/best-of", label: "Cartoons" },
  { href: "/gallery/automation", label: "Generate" },
  { href: "/gallery/cast", label: "Cast", under: ["/models"] },
  { href: "/gallery/presentation", label: "Presentation" },
];

export default function StudioLayout({ children }: { children: ReactNode }) {

  return (
    <div className={`backroom workspace-shell ${newsCondensed.variable} ${newsSerif.variable} ${comicHand.variable}`}>
      <header className="br-head">
        <Link href="/gallery/best-of" className="studio-brand" aria-label="The Swinging Door — cartoons">
          <span className="br-title">The Swinging Door</span>
          <span className="br-sub">The cartoon studio</span>
        </Link>
        <StudioNav places={PLACES} className="br-nav" label="Studio" />
      </header>

      {children}

      <footer className="studio-footer">
        <p>The Swinging Door <span aria-hidden="true">·</span> A little perspective. Good company.</p>
        <details className="studio-resources">
          <summary>Studio resources</summary>
          <nav aria-label="Studio resources">
            <Link href="/library">Image archive</Link>
            <Link href="/reports">Progress reports</Link>
          </nav>
        </details>
        <form action="/api/backroom/logout" method="post" className="br-logout">
          <button type="submit">Sign out</button>
        </form>
      </footer>
    </div>
  );
}
