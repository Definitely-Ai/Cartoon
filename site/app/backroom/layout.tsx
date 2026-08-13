import type { Metadata } from "next";
import type { ReactNode } from "react";
import { comicHand, newsCondensed, newsSerif } from "@/app/fonts";
import "./backroom.css";

// THE BACK ROOM — the staff side of the Swinging Door. This outer layout is
// just the room itself (dark walls, fonts, footer); the staff chrome
// (title, nav, logout) lives in the (staff) group layout so the locked
// door page shows a door and nothing else. Kept off search engines; the
// public side never links here except the tiny staff entrance on the
// chooser's footer.

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
      {children}
      <footer className="br-foot">
        <p>Nothing in this room is public until it runs.</p>
      </footer>
    </div>
  );
}
