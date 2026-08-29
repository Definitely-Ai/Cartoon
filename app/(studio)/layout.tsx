import type { ReactNode } from "react";
import { comicHand, newsCondensed, newsSerif } from "@/app/fonts";
import StudioNav, { type Place } from "./StudioNav";
import "../studio.css";

// THE STUDIO — the whole site now, private to the founder. Three places
// to be: Today (the newest batch), The Collection (every day, cataloged),
// and Keepers (the ones he starred). Everything else lives in a quiet row
// at the bottom. Dark room, paper proofs, chalk accents — easy to operate,
// still cool.

// Every address on the site belongs to one of these six. The `under` lists
// exist so a page that is not itself in the nav — a single day, one
// character's bible, one edition being scored — still lights up the place it
// came from instead of leaving the whole row dark.
const PLACES: Place[] = [
  { href: "/", label: "Today" },
  { href: "/review", label: "Review" },
  { href: "/collection", label: "The Collection", under: ["/day"] },
  { href: "/keepers", label: "Keepers" },
  { href: "/models", label: "The Cast" },
  { href: "/registry", label: "The Registry" },
];

const ELSEWHERE: Place[] = [{ href: "/connect", label: "Connect your AI" }];

export default function StudioLayout({ children }: { children: ReactNode }) {

  return (
    <div className={`backroom ${newsCondensed.variable} ${newsSerif.variable} ${comicHand.variable}`}>
      <header className="br-head">
        {/* BRAND: replace when final */}
        <p className="br-title">The Swinging Door</p>
        <p className="br-sub">The private studio</p>
        <StudioNav places={PLACES} className="br-nav" label="Studio" />
      </header>

      {children}

      <StudioNav places={ELSEWHERE} className="br-staff-links" label="Elsewhere">
        <form action="/api/backroom/logout" method="post" className="br-logout">
          <button type="submit">Sign out</button>
        </form>
      </StudioNav>

      <footer className="br-foot">
        <p>Nothing here is public. The bar is closed to everyone but you.</p>
      </footer>
    </div>
  );
}
