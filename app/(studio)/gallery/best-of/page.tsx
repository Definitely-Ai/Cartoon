import type { Metadata } from "next";
import { bestOfEdition } from "@/lib/best-of-cartoons";
import {cartoonCollection} from '@/lib/cartoon-collection';
import BestOfClient from "./BestOfClient";
import "./best-of.css";

export const metadata: Metadata = {
  title: "Cartoons",
  description:
    "Spend a little time at The Swinging Door: a collection of black-and-white cartoons about money, modern life, and the people around the bar.",
};

export default function BestOfPage() {
  const collection = cartoonCollection;
  const cartoons = collection.map((cartoon) => ({
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
    cityLabel: cartoon.cityLabel,
    editionDate: cartoon.editionDate,
    sourceUrl: cartoon.sourceUrl,
    sourceTitle: cartoon.sourceTitle,
  }));

  return <BestOfClient cartoons={cartoons} edition={{...bestOfEdition, count: collection.length, archiveCount: bestOfEdition.count}} />;
}
