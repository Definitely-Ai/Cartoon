import { NextResponse, type NextRequest } from "next/server";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { PublishError, setFeedback } from "@/lib/githubPublish";

// The training week's write: a verdict tap or a why-note, merged into the
// day's feedback.json. Optimistic on the client; permanent within a minute.

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await isDoorOpen(request.cookies.get(BACKROOM_COOKIE)?.value))) {
    return NextResponse.json({ error: "The door is closed. Knock first." }, { status: 401 });
  }

  let body: { day?: unknown; option?: unknown; rating?: unknown; issues?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const patch: { rating?: 1 | 2 | 3; issues?: string[]; note?: string } = {};
  if (body.rating !== undefined) patch.rating = Number(body.rating) as 1 | 2 | 3;
  if (Array.isArray(body.issues)) patch.issues = body.issues.filter((i): i is string => typeof i === "string");
  if (body.note !== undefined && typeof body.note === "string") patch.note = body.note.slice(0, 1000);
  if (patch.rating === undefined && patch.issues === undefined && patch.note === undefined) {
    return NextResponse.json({ error: "Nothing to record." }, { status: 400 });
  }

  try {
    const entry = await setFeedback(
      typeof body.day === "string" ? body.day : "",
      Number(body.option),
      patch
    );
    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    if (err instanceof PublishError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: `Feedback failed: ${(err as Error).message}` }, { status: 500 });
  }
}
