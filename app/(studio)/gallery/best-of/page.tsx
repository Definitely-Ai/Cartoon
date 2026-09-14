import type { Metadata } from "next";
import { bestOfCartoons, bestOfEdition } from "@/lib/best-of-cartoons";
import BestOfClient from "./BestOfClient";
import "./best-of.css";

export const metadata: Metadata = {
  title: "Selected Cartoons",
  description:
    "Spend a little time at The Swinging Door: a collection of black-and-white cartoons about money, modern life, and the people around the bar.",
};

export default function BestOfPage() {
  const cartoons = bestOfCartoons.map((cartoon) => ({
    id: cartoon.id,
    title: cartoon.title,
    speaker: cartoon.speaker,
    variant: cartoon.variant,
    caption: cartoon.caption,
    src: cartoon.src,
    previewSrc: cartoon.previewSrc,
    width: cartoon.width,
    height: cartoon.height,
    tv: cartoon.tv,
    board: cartoon.board,
  }));

  return <BestOfClient cartoons={cartoons} edition={bestOfEdition} />;
}
