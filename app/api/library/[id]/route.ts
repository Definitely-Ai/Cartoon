import { cookies } from "next/headers";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { findLibraryImageById } from "@/lib/studio-library";
import { readLibraryOriginal } from "@/lib/studio-library-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function respond(request: Request, context: { params: Promise<{ id: string }> }, headOnly = false) {
  const jar = await cookies();
  if (!await isDoorOpen(jar.get(BACKROOM_COOKIE)?.value)) {
    return new Response("Sign in to view studio images.", { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }
  const { id } = await context.params;
  const item = findLibraryImageById(id);
  if (!item) return new Response("Image not found.", { status: 404 });
  const url = new URL(request.url);
  const variant = url.searchParams.get("variant") || "view";
  if (!["view", "thumbnail", "original"].includes(variant)) return new Response("Unknown image variant.", { status: 400 });
  const original = variant === "original";
  if (!original) return Response.redirect(new URL(variant === "thumbnail" ? item.thumbnailUrl : item.imageUrl, request.url), 307);
  // Hosted functions serve bounded viewing assets. Original source files stay
  // on the workstation, where downloads are not subject to function body limits.
  if (process.env.VERCEL) return new Response("Exact originals are available from the local studio. The compressed viewing copy is available here.", { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const data = await readLibraryOriginal(item);
  if (!data) return new Response("The exact original is not on this server. The compressed viewing copy is still available.", { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const extension = original ? item.format.replace("jpeg", "jpg") : "webp";
  const safeTitle = item.title.replace(/[^a-zA-Z0-9 -]/g, "").trim().slice(0, 90) || "studio-image";
  const filename = `${safeTitle}${original ? "-original" : "-viewing-copy"}.${extension}`;
  const download = original || url.searchParams.get("download") === "1";
  const headers = {
    "Content-Type": original ? "application/octet-stream" : "image/webp",
    "Content-Length": String(data.byteLength),
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
  };
  return new Response(headOnly ? null : new Uint8Array(data), { headers });
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) { return respond(request, context); }
export async function HEAD(request: Request, context: { params: Promise<{ id: string }> }) { return respond(request, context, true); }
