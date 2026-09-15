import type { Metadata } from "next";
import { bestOfEdition } from "@/lib/best-of-cartoons";
import {cartoonCollection} from '@/lib/cartoon-collection';
import BestOfClient from "./BestOfClient";
import "./best-of.css";
import {cookies} from 'next/headers';
import {BACKROOM_COOKIE,isDoorOpen} from '@/lib/backroom-auth';
import {hiddenCartoonIds} from '@/lib/gallery-visibility-server';
export const dynamic='force-dynamic';

export const metadata: Metadata = {
  title: "Cartoons",
  description:
    "Spend a little time at The Swinging Door: a collection of black-and-white cartoons about money, modern life, and the people around the bar.",
};

export default async function BestOfPage() {
  const [canManage,hiddenIds]=await Promise.all([isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value),hiddenCartoonIds()]);
  const collection = canManage?cartoonCollection:cartoonCollection.filter(c=>!hiddenIds.includes(c.id));
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

  return <BestOfClient cartoons={cartoons} canManage={canManage} hiddenIds={hiddenIds} edition={{...bestOfEdition, count: collection.length, archiveCount: bestOfEdition.count}} />;
}
