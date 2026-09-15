import data from "./best-of-cartoons.json";

export interface BestOfCartoon {
  id: string;
  title: string;
  speaker: "Drew" | "Barclay" | "Abby";
  variant: "duo" | "trio";
  caption: string;
  src: string;
  previewSrc: string;
  width: number;
  height: number;
  sha256: string;
  tv: string;
  board: string[];
  cityLabel?: string;
  editionDate?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  theme?: string;
  context?: string;
  connection?: string;
  sourceKind?: string;
  checkedOn?: string;
  productionMethod?: string;
}

export const bestOfCartoons = data as BestOfCartoon[];
export const bestOfEdition = {
  title: "The Swinging Door — Best Of",
  count: bestOfCartoons.length,
  zipUrl: "/gallery/best-of-v1/swinging-door-best-of-38-pngs.zip",
};

// Separate from the generated legacy manifest so prebuild cannot erase the edition.
export const bestOfGalleryItems = bestOfCartoons.map((cartoon) => ({
  id: `best-of-v1-${cartoon.id}`,
  title: cartoon.title,
  category: "final" as const,
  src: cartoon.previewSrc,
  originalSrc: cartoon.src,
  caption: `${cartoon.speaker}: ${cartoon.caption}`,
  tv: cartoon.tv,
  board: cartoon.board.join(" / "),
  action: `${cartoon.variant === "duo" ? "Duo" : "Trio"} — ${cartoon.speaker} speaking`,
  timestamp: "2026-09-14T12:00:00.000Z",
  formattedTime: "Best Of · September 2026",
}));
