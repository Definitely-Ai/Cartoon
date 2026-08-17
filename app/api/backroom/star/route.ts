import { NextResponse, type NextRequest } from "next/server";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { PublishError, setKeeper } from "@/lib/githubPublish";

// The star: mark (or unmark) a cartoon as a keeper. Commits keepers.json;
// the site rebuilds and the star shows everywhere within a minute — the
// button meanwhile shows it optimistically.

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await isDoorOpen(request.cookies.get(BACKROOM_COOKIE)?.value))) {
    return NextResponse.json({ error: "The door is closed. Knock first." }, { status: 401 });
  }

  let body: { day?: unknown; option?: unknown; on?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  try {
    const keepers = await setKeeper(
      typeof body.day === "string" ? body.day : "",
      Number(body.option),
      body.on !== false
    );
    return NextResponse.json({ ok: true, keepers });
  } catch (err) {
    if (err instanceof PublishError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: `Star failed: ${(err as Error).message}` }, { status: 500 });
  }
}
