import { NextResponse, type NextRequest } from "next/server";
import { getStudioImage } from "@/lib/db";
import { PublishError } from "@/lib/githubPublish";

// The picture window: streams a finished cartoon out of the private
// Supabase bucket. Middleware gates this route like every other page, so
// image bytes stay behind the founder's login. A filed cartoon never
// changes, so browsers may cache it hard.

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ day: string; n: string }> }
) {
  const { day, n } = await context.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{1,3}$/.test(n)) {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const bytes = await getStudioImage(day, Number(n));
    if (!bytes) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    const status = err instanceof PublishError ? err.status : 500;
    return new NextResponse("Image unavailable", { status });
  }
}
