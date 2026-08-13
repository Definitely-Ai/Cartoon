import type { ReactNode } from "react";
import Link from "next/link";
import { comicBody, comicHand, comicSlab } from "@/app/fonts";
import BoardTabs from "./BoardTabs";
import "./variant-c.css";

// VARIANT C — "The Funny Pages": the paste-up board's chrome. The masthead
// and section tabs sit on a heavy ink rule at the top of every page; the
// footer is a solid ink strip at the bottom. Everything inside is scoped
// under .variant-c so the three variants' styles never collide.

export default function VariantCLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`variant-c ${comicSlab.variable} ${comicBody.variable} ${comicHand.variable}`}>
      <header className="vc-mast">
        <div className="vc-mast-row">
          <p className="vc-brand">
            {/* BRAND: replace when final */}
            <Link href="/c">Flamingo &amp; Dog</Link>
          </p>
          <p className="vc-tagline vc-underline">The business funny pages, strictly black &amp; white</p>
        </div>
        <BoardTabs />
      </header>

      {children}

      <footer className="vc-footer">
        <p>
          {/* BRAND: replace when final */}© {new Date().getFullYear()} Flamingo &amp; Dog · All
          characters and cartoons are property of the company.
        </p>
        <p className="vc-footer-desk">Published from the desk of the founder</p>
      </footer>
    </div>
  );
}
