import type { ReactNode } from "react";
import Link from "next/link";
import { getOptionDays } from "@/lib/options";

// The staff chrome: title, nav with a live count of days still awaiting a
// decision, and the way out. Everything inside this group sits behind the
// middleware lock; the login door renders without any of this.

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
          <Link href="/">The front page</Link>
          <form action="/api/backroom/logout" method="post" className="br-logout">
            <button type="submit">Leave by the back door</button>
          </form>
        </nav>
      </header>
      {children}
    </>
  );
}
