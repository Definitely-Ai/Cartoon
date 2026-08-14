// Every typeface in the system, self-hosted via next/font (zero layout
// shift, no runtime requests). The paper composes its three faces in the
// (paper) layout; the Back Room reuses the condensed + serif and adds the
// hand face for chalk.
//
// Font picks (judgment calls, documented for the founder):
//  - UnifrakturMaguntia blackletter for the nameplate only (the NYT move:
//    blackletter nameplate over condensed news headlines).
//  - Old Standard TT for body — turn-of-the-century book face.
//  - Oswald condensed caps for headlines, eyebrows, and utility.
//  - Patrick Hand SC strictly for short chalk labels in the Back Room.

import { Old_Standard_TT, Oswald, Patrick_Hand_SC, UnifrakturMaguntia } from "next/font/google";

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

export const comicHand = Patrick_Hand_SC({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-comic-hand",
});
