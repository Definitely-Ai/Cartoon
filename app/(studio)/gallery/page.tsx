import fs from "node:fs";
import path from "node:path";
import GalleryClient from "./GalleryClient";
import type { GalleryItem } from "@/app/api/gallery/route";
import "./gallery.css";

export const metadata = {
  title: "The Image Vault | The Swinging Door",
  description: "Comprehensive gallery of all generated cartoons, finals, knockouts, and live Replicate stream.",
};

export const dynamic = "force-dynamic";

function getInitialItems(): { items: GalleryItem[]; counts: Record<string, number> } {
  try {
    const manifestPath = path.join(process.cwd(), "public", "gallery", "manifest.json");
    if (fs.existsSync(manifestPath)) {
      const all = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as GalleryItem[];
      return {
        items: all.slice(0, 40),
        counts: {
          total: all.length,
          finals: all.filter((i) => i.category === "final").length,
          knockouts: all.filter((i) => i.category === "knockout").length,
          replicate: 0,
          inspect: all.filter((i) => i.category === "inspect").length,
        },
      };
    }
  } catch (err) {
    console.error("Failed to load initial manifest:", err);
  }
  return { items: [], counts: { total: 0, finals: 0, knockouts: 0, replicate: 0, inspect: 0 } };
}

export default function GalleryPage() {
  const { items, counts } = getInitialItems();
  return <GalleryClient initialItems={items} initialCounts={counts} />;
}
