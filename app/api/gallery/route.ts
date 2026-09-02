import { NextRequest, NextResponse } from "next/server";
import manifestItems from "@/lib/gallery-manifest.json";

export interface GalleryItem {
  id: string;
  title: string;
  category: "final" | "master" | "showcase" | "drafts";
  sceneType?: "trio" | "duo" | "solo" | "base";
  src: string;
  caption?: string;
  tv?: string;
  tvPicture?: string;
  board?: string;
  action?: string;
  turn?: string;
  prompt?: string;
  timestamp: string;
  formattedTime: string;
  model?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "all";
  const scene = searchParams.get("scene") || "all";
  const sort = searchParams.get("sort") || "newest";
  const query = (searchParams.get("q") || "").toLowerCase().trim();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "40", 10);

  let items = [...(manifestItems as GalleryItem[])];

  // Filter by category
  if (category !== "all") {
    items = items.filter((item) => item.category === category);
  }

  // Filter by scene type
  if (scene !== "all") {
    items = items.filter((item) => item.sceneType === scene);
  }

  // Filter by search query
  if (query) {
    items = items.filter((item) => {
      const matchCaption = item.caption?.toLowerCase().includes(query);
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchPrompt = item.prompt?.toLowerCase().includes(query);
      const matchTv = item.tv?.toLowerCase().includes(query);
      const matchBoard = item.board?.toLowerCase().includes(query);
      return matchCaption || matchTitle || matchPrompt || matchTv || matchBoard;
    });
  }

  // Sort by time generated
  items.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime() || 0;
    const timeB = new Date(b.timestamp).getTime() || 0;
    return sort === "oldest" ? timeA - timeB : timeB - timeA;
  });

  // Pagination
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const pagedItems = items.slice(start, start + limit);

  const allItems = manifestItems as GalleryItem[];

  return NextResponse.json({
    items: pagedItems,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    },
    counts: {
      total: allItems.length,
      finals: allItems.filter((i) => i.category === "final").length,
      masters: allItems.filter((i) => i.category === "master").length,
      showcase: allItems.filter((i) => i.category === "showcase").length,
      drafts: allItems.filter((i) => i.category === "drafts").length,
    },
  });
}
