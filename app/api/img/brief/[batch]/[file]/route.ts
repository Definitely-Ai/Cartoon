import { NextResponse, type NextRequest } from "next/server";

import { PublishError, readRepoFile } from "@/lib/githubPublish";

// The picture window for a brief: streams one drawn panel of a batch out of
// the repo, where /api/backroom/brief committed it. Same shape as
// /api/img/[day]/[n] — middleware gates this route like every other page, so
// image bytes stay behind the founder's login, and a panel the brief route
// has already drawn is never redrawn, so browsers may cache it hard.

export const runtime = "nodejs";

const BRIEFS = "briefs";

// The character set the brief route mints its batch ids and panel filenames
// from — and nothing that could climb out of the briefs folder. Next hands
// these decoded, so "%2e%2e" is already ".." by the time it gets here.
const SAFE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const safe = (part: string) => part.length <= 200 && SAFE.test(part) && !part.includes("..");

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ batch: string; file: string }> }
) {
  const { batch, file } = await context.params;
  if (!safe(batch) || !safe(file) || !file.endsWith(".png")) {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const found = await readRepoFile(`${BRIEFS}/${batch}/${file}`);
    if (!found) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(new Uint8Array(found.bytes), {
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
