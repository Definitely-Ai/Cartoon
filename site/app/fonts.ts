// Every typeface in the system, self-hosted via next/font (zero layout
// shift, no runtime requests). Each variant layout applies ONLY its own
// `.variable` classNames, so a page loads exactly the faces it uses.
//
// Font picks (judgment calls, documented for the founder):
//  A "The Daily Paper"  — UnifrakturMaguntia blackletter masthead (the NYT
//    move: blackletter nameplate over condensed news headlines), Old
//    Standard TT body (turn-of-the-century book face), Oswald condensed
//    caps for headlines/eyebrows.
//  B "The Gag Panel"    — DM Serif Display for display (high-contrast,
//    doesn't read "default Playfair"), Crimson Pro roman for body and its
//    true italics for captions.
//  C "The Funny Pages"  — Alfa Slab One for headers (classic comics-section
//    slab; Bangers reads kids'-party against a 65-year-old reader), Bitter
//    slab-serif body (friendly but fully readable), Patrick Hand SC for
//    small hand-written labels only — never paragraphs.

import {
  Alfa_Slab_One,
  Bitter,
  Crimson_Pro,
  DM_Serif_Display,
  Old_Standard_TT,
  Oswald,
  Patrick_Hand_SC,
  UnifrakturMaguntia,
} from "next/font/google";

// — Variant A: The Daily Paper —
export const blackletter = UnifrakturMaguntia({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-blackletter",
});

export const newsSerif = Old_Standard_TT({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-news-serif",
});

export const newsCondensed = Oswald({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-news-condensed",
});

// — Variant B: The Gag Panel —
export const displaySerif = DM_Serif_Display({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display-serif",
});

export const textSerif = Crimson_Pro({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-text-serif",
});

// — Variant C: The Funny Pages —
export const comicSlab = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-comic-slab",
});

export const comicBody = Bitter({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-comic-body",
});

export const comicHand = Patrick_Hand_SC({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-comic-hand",
});
