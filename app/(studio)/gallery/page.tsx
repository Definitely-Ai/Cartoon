import GalleryClient from "./GalleryClient";
import type { GalleryItem } from "@/app/api/gallery/route";
import manifestData from "@/lib/gallery-manifest.json";
import { bestOfGalleryItems } from "@/lib/best-of-cartoons";
import "./gallery.css";

export const metadata = {
  title: "The Image Vault | The Swinging Door",
  description: "Curated collection of verified final editions and master reference plates.",
};

export const dynamic = "force-dynamic";

export default function GalleryPage() {
  const all: GalleryItem[] = [...bestOfGalleryItems, ...(manifestData as GalleryItem[])];
  all.sort((a, b) => (new Date(b.timestamp).getTime() || 0) - (new Date(a.timestamp).getTime() || 0));
  const initialItems = all.slice(0, 40);
  const initialCounts = {
    total: all.length,
    finals: all.filter((i) => i.category === "final").length,
    masters: all.filter((i) => i.category === "master").length,
  };

  return <GalleryClient initialItems={initialItems} initialCounts={initialCounts} />;
}
