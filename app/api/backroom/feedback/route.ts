import { NextResponse, type NextRequest } from "next/server";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { PublishError } from "@/lib/githubPublish";
import { setScores } from "@/lib/db";

// The training week's write: an art score, a caption score, or a why-note,
// upserted straight into the studio database. Instant — no rebuild wait.

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await isDoorOpen(request.cookies.get(BACKROOM_COOKIE)?.value))) {
    return NextResponse.json({ error: "The door is closed. Knock first." }, { status: 401 });
  }

  let body: { day?: unknown; option?: unknown; art?: unknown; caption?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const patch: { art?: number; caption?: number; note?: string } = {};
  if (body.art !== undefined) patch.art = Number(body.art);
  if (body.caption !== undefined) patch.caption = Number(body.caption);
  if (body.note !== undefined && typeof body.note === "string") patch.note = body.note.slice(0, 1000);
  if (patch.art === undefined && patch.caption === undefined && patch.note === undefined) {
    return NextResponse.json({ error: "Nothing to record." }, { status: 400 });
  }

  try {
    const day = typeof body.day === "string" ? body.day : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new PublishError(400, "Bad day — use YYYY-MM-DD.");
    await setScores(day, Number(body.option), patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof PublishError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: `Feedback failed: ${(err as Error).message}` }, { status: 500 });
  }
}
