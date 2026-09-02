import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

// Types
export interface GalleryItem {
  id: string;
  title: string;
  category: "final" | "knockout" | "replicate" | "inspect" | "canon";
  sceneType?: "trio" | "duo" | "solo" | "base";
  src: string;
  caption?: string;
  tv?: string;
  tvPicture?: string;
  board?: string;
  action?: string;
  turn?: string;
  prompt?: string;
  batch?: string;
  date: string;
  model?: string;
  predictionId?: string;
}

const REPLICATE_API = "https://api.replicate.com/v1";

function getReplicateToken(): string | null {
  const names = ["REPLICATE_API_TOKEN", "REPLICATE_API_KEY", "REPLICATE_TOKEN"];
  for (const name of names) {
    const val = process.env[name];
    if (val) return val;
  }
  return null;
}

// Fetch predictions from Replicate API
async function fetchReplicatePredictions(limit = 100): Promise<GalleryItem[]> {
  const token = getReplicateToken();
  if (!token) return [];

  try {
    const res = await fetch(`${REPLICATE_API}/predictions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!res.ok) return [];

    const data = await res.json();
    const predictions = (data.results || []) as Array<{
      id: string;
      model?: string;
      version?: string;
      status: string;
      created_at: string;
      output?: string | string[] | null;
      input?: {
        prompt?: string;
        aspect_ratio?: string;
        [key: string]: unknown;
      };
    }>;

    const items: GalleryItem[] = [];

    for (const p of predictions) {
      if (p.status !== "succeeded" || !p.output) continue;
      const outputs = Array.isArray(p.output) ? p.output : [p.output];
      const prompt = p.input?.prompt || "";
      const isTrio = /abby/i.test(prompt);
      const isDuo = /drew/i.test(prompt) && /barclay/i.test(prompt) && !isTrio;

      outputs.forEach((url, idx) => {
        if (typeof url === "string" && (url.startsWith("http") || url.startsWith("/"))) {
          items.push({
            id: `replicate-${p.id}-${idx}`,
            title: `Replicate: ${p.id.slice(0, 8)}`,
            category: "replicate",
            sceneType: isTrio ? "trio" : isDuo ? "duo" : "solo",
            src: url,
            prompt: prompt,
            model: p.model || "flux-pro / gpt-image-2",
            predictionId: p.id,
            date: p.created_at ? p.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          });
        }
      });
    }

    return items;
  } catch (err) {
    console.error("Failed to fetch Replicate predictions:", err);
    return [];
  }
}

// Load local manifest
function loadLocalManifest(): GalleryItem[] {
  try {
    const manifestPath = path.join(process.cwd(), "public", "gallery", "manifest.json");
    if (fs.existsSync(manifestPath)) {
      const content = fs.readFileSync(manifestPath, "utf8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Failed to load local gallery manifest:", err);
  }
  return [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "all";
  const scene = searchParams.get("scene") || "all";
  const query = (searchParams.get("q") || "").toLowerCase().trim();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "40", 10);

  const localItems = loadLocalManifest();
  const replicateItems = await fetchReplicatePredictions();

  // Combine and sort newest first
  let allItems = [...replicateItems, ...localItems];

  // Filter by category
  if (category !== "all") {
    allItems = allItems.filter((item) => item.category === category);
  }

  // Filter by scene type
  if (scene !== "all") {
    allItems = allItems.filter((item) => item.sceneType === scene);
  }

  // Filter by search query
  if (query) {
    allItems = allItems.filter((item) => {
      const matchCaption = item.caption?.toLowerCase().includes(query);
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchPrompt = item.prompt?.toLowerCase().includes(query);
      const matchTv = item.tv?.toLowerCase().includes(query);
      const matchBoard = item.board?.toLowerCase().includes(query);
      const matchBatch = item.batch?.toLowerCase().includes(query);
      return matchCaption || matchTitle || matchPrompt || matchTv || matchBoard || matchBatch;
    });
  }

  // Pagination
  const total = allItems.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const pagedItems = allItems.slice(start, start + limit);

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
      total: localItems.length + replicateItems.length,
      finals: localItems.filter((i) => i.category === "final").length,
      knockouts: localItems.filter((i) => i.category === "knockout").length,
      replicate: replicateItems.length,
      inspect: localItems.filter((i) => i.category === "inspect").length,
    },
  });
}
