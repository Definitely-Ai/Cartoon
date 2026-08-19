import { NextResponse, type NextRequest } from "next/server";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { PublishError } from "@/lib/githubPublish";
import { setKeeperFlag } from "@/lib/db";

// The star: mark (or unmark) a cartoon as a keeper — upserted straight
// into the studio database. Instant; the button shows it optimistically.

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
    const day = typeof body.day === "string" ? body.day : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new PublishError(400, "Bad day — use YYYY-MM-DD.");
    await setKeeperFlag(day, Number(body.option), body.on !== false);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof PublishError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: `Star failed: ${(err as Error).message}` }, { status: 500 });
  }
}
