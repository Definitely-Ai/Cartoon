import type { ReactNode } from "react";
import Link from "next/link";
import { comicHand, newsCondensed, newsSerif } from "@/app/fonts";
import "../studio.css";

// THE STUDIO — the whole site now, private to the founder. Three places
// to be: Today (the newest batch), The Collection (every day, cataloged),
// and Keepers (the ones he starred). Everything else lives in a quiet row
// at the bottom. Dark room, paper proofs, chalk accents — easy to operate,
// still cool.

export default function StudioLayout({ children }: { children: ReactNode }) {

  return (
    <div className={`backroom ${newsCondensed.variable} ${newsSerif.variable} ${comicHand.variable}`}>
      <header className="br-head">
        {/* BRAND: replace when final */}
        <p className="br-title">The Swinging Door</p>
        <p className="br-sub">The private studio</p>
        <nav className="br-nav" aria-label="Studio">
          <Link href="/">Today</Link>
          <Link href="/collection">The Collection</Link>
          <Link href="/keepers">Keepers</Link>
        </nav>
      </header>

      {children}

      <nav className="br-staff-links" aria-label="Elsewhere">
        <Link href="/connect">Connect your AI</Link>
        <form action="/api/backroom/logout" method="post" className="br-logout">
          <button type="submit">Sign out</button>
        </form>
      </nav>

      <footer className="br-foot">
        <p>Nothing here is public. The bar is closed to everyone but you.</p>
      </footer>
    </div>
  );
}
