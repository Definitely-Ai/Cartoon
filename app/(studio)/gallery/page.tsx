import GalleryClient from "./GalleryClient";
import type { GalleryItem } from "@/app/api/gallery/route";
import manifestData from "@/lib/gallery-manifest.json";
import "./gallery.css";

export const metadata = {
  title: "The Image Vault | The Swinging Door",
  description: "Comprehensive gallery of all generated cartoons, finals, knockouts, and live Replicate stream.",
};

export const dynamic = "force-dynamic";

export default function GalleryPage() {
  const all = manifestData as GalleryItem[];
  const initialItems = all.slice(0, 40);
  const initialCounts = {
    total: all.length,
    finals: all.filter((i) => i.category === "final").length,
    knockouts: all.filter((i) => i.category === "knockout").length,
    replicate: 0,
    inspect: all.filter((i) => i.category === "inspect").length,
  };

  return <GalleryClient initialItems={initialItems} initialCounts={initialCounts} />;
}
