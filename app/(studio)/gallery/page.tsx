import GalleryClient from "./GalleryClient";
import type { GalleryItem } from "@/app/api/gallery/route";
import manifestData from "@/lib/gallery-manifest.json";
import "./gallery.css";

export const metadata = {
  title: "The Image Vault | The Swinging Door",
  description: "Curated collection of verified final editions and master reference plates.",
};

export const dynamic = "force-dynamic";

export default function GalleryPage() {
  const all = manifestData as GalleryItem[];
  const initialItems = all.slice(0, 40);
  const initialCounts = {
    total: all.length,
    finals: all.filter((i) => i.category === "final").length,
    masters: all.filter((i) => i.category === "master").length,
  };

  return <GalleryClient initialItems={initialItems} initialCounts={initialCounts} />;
}
