import type { ReactNode } from "react";
import Link from "next/link";
import { getOptionDays } from "@/lib/options";

// The staff chrome, kept to what the daily ritual needs: the two working
// pages and the way out — three items, one line on a phone. Occasional
// destinations (the front page, the wire) live in a quiet row under the
// content instead of crowding the top nav.

export default function BackroomStaffLayout({ children }: { children: ReactNode }) {
  const open = getOptionDays().filter((day) => !day.selected).length;

  return (
    <>
      <header className="br-head">
        <p className="br-title">The Back Room</p>
        <p className="br-sub">Employees only · The Swinging Door{/* BRAND: replace when final */}</p>
        <nav className="br-nav" aria-label="Back room">
          <Link href="/backroom">The light table</Link>
          <Link href="/backroom/ledger">
            The ledger{open > 0 && <span className="br-nav-count"> · {open} open</span>}
          </Link>
          <form action="/api/backroom/logout" method="post" className="br-logout">
            <button type="submit">Leave by the back door</button>
          </form>
        </nav>
      </header>
      {children}
      <nav className="br-staff-links" aria-label="Elsewhere">
        <Link href="/">See the front page</Link>
        <Link href="/backroom/connect">Connect your AI — the wire</Link>
      </nav>
    </>
  );
}
