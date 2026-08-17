import type { ReactNode } from "react";
import { comicHand, newsCondensed, newsSerif } from "@/app/fonts";
import "../studio.css";

// The doorway's shell: just the dark room and its typefaces. No nav, no
// chrome — a locked door shows a door.

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`backroom ${newsCondensed.variable} ${newsSerif.variable} ${comicHand.variable}`}>
      {children}
    </div>
  );
}
