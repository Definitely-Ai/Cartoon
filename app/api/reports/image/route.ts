import { cookies } from "next/headers";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { reportGithubFetch } from "@/lib/studio-reports";
import sharp from "sharp";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value)) return new Response("Sign in to view the artwork.", { status: 401 });
  const url = new URL(request.url);
  const commit = url.searchParams.get("commit") || "";
  const path = url.searchParams.get("path") || "";
  if (!/^[a-f0-9]{40}$/.test(commit) || !/\.(png|jpe?g|webp|avif|gif)$/i.test(path) || path.startsWith("/") || path.includes("\\") || path.split("/").includes("..")) {
    return new Response("Choose an image from a saved GitHub update.", { status: 400 });
  }
  try {
    const response = await reportGithubFetch(`/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${commit}`, "application/vnd.github.raw+json");
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 30 * 1024 * 1024) return new Response("This original is too large to preview here. Open it on GitHub.", { status: 413 });
    const preview = await sharp(Buffer.from(bytes)).rotate().resize({ width: 840, height: 840, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
    return new Response(new Uint8Array(preview), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, max-age=86400, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response("This historical image is unavailable. Open the saved update on GitHub.", { status: 502 }); }
}
