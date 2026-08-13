import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { comicHand, newsCondensed, newsSerif } from "@/app/fonts";
import "./backroom.css";

// THE BACK ROOM — the staff side of the Swinging Door. Everything under
// /backroom sits behind the middleware lock; this layout is the room
// itself: dark after-hours chrome, white ink, chalk accents. Kept off
// search engines; the public side never links here except the tiny staff
// entrance on the chooser's footer.

export const metadata: Metadata = {
  title: {
    default: "The Back Room", // BRAND-adjacent: staff-side name, safe to keep
    template: "%s · The Back Room",
  },
  robots: { index: false, follow: false },
};

export default function BackroomLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`backroom ${newsCondensed.variable} ${newsSerif.variable} ${comicHand.variable}`}>
      <header className="br-head">
        <p className="br-title">The Back Room</p>
        <p className="br-sub">Employees only · The Swinging Door{/* BRAND: replace when final */}</p>
        <nav className="br-nav" aria-label="Back room">
          <Link href="/backroom">The light table</Link>
          <Link href="/backroom/ledger">The ledger</Link>
          <Link href="/">Front of house</Link>
          <form action="/api/backroom/logout" method="post" className="br-logout">
            <button type="submit">Leave by the back door</button>
          </form>
        </nav>
      </header>

      {children}

      <footer className="br-foot">
        <p>Nothing in this room is public until it runs.</p>
      </footer>
    </div>
  );
}
