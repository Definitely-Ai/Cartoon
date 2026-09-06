import type { ReactNode } from "react";
import { comicHand, newsCondensed, newsSerif } from "@/app/fonts";
import StudioNav, { type Place } from "./StudioNav";
import "../studio.css";
import "../workspace.css";
import "../workspace-legacy.css";

// Rick's studio. The main navigation follows the work:
// images, progress, construction, newspaper proofs, ideas and feedback.
// The `under` lists
// exist so a page that is not itself in the nav — a single day, one
// character's bible, one older set being scored — still lights up the place it
// came from instead of leaving the whole row dark.
const PLACES: Place[] = [
  { href: "/", label: "Rick’s studio" },
  { href: "/library", label: "Image library" },
  { href: "/reports", label: "Daily report" },
  { href: "/room", label: "Drawing room" },
  { href: "/desk", label: "Sticker desk" },
  { href: "/newspaper", label: "Newspaper" },
  { href: "/topics", label: "Naples topics" },
  { href: "/notes", label: "Shared notes" },
];

const ELSEWHERE: Place[] = [
  { href: "/review", label: "Review cartoons" },
  { href: "/models", label: "The cast" },
  { href: "/collection", label: "Daily batches", under: ["/day"] },
  { href: "/keepers", label: "Keepers" },
  { href: "/gallery", label: "Selected prints" },
  { href: "/registry", label: "Studio bible" },
  { href: "/connect", label: "Connect your AI" },
];

export default function StudioLayout({ children }: { children: ReactNode }) {

  return (
    <div className={`backroom workspace-shell ${newsCondensed.variable} ${newsSerif.variable} ${comicHand.variable}`}>
      <header className="br-head">
        {/* BRAND: replace when final */}
        <p className="br-title">The Swinging Door</p>
        <p className="br-sub">Rick’s independent cartoon studio</p>
        <StudioNav places={PLACES} className="br-nav" label="Studio" />
      </header>

      {children}

      <StudioNav places={ELSEWHERE} className="br-staff-links" label="Elsewhere">
        <form action="/api/backroom/logout" method="post" className="br-logout">
          <button type="submit">Sign out</button>
        </form>
      </StudioNav>

      <footer className="br-foot">
        <p>The Swinging Door · A shared place for the work, the ideas, and the next good line.</p>
      </footer>
    </div>
  );
}
