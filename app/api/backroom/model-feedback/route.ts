import { NextResponse, type NextRequest } from "next/server";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { PublishError, commitFiles } from "@/lib/githubPublish";

// Feedback on the character-model proofs (/models). Each note commits as a
// small JSON file to feedback/model-review/ in the repo, where the operator
// pulls and reads it before the next training round. Git IS the inbox: the
// review trail lives beside the images it judges.

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await isDoorOpen(request.cookies.get(BACKROOM_COOKIE)?.value))) {
    return NextResponse.json({ error: "The door is closed. Knock first." }, { status: 401 });
  }

  let body: { image?: unknown; rating?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const image = typeof body.image === "string" ? body.image.replace(/[^\w.-]/g, "").slice(0, 120) : "";
  const rating = typeof body.rating === "number" && body.rating >= 1 && body.rating <= 10 ? body.rating : null;
  const note = typeof body.note === "string" ? body.note.slice(0, 2000) : "";
  if (!image || (rating === null && !note.trim())) {
    return NextResponse.json({ error: "Nothing to record." }, { status: 400 });
  }

  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await commitFiles(
      [
        {
          path: `feedback/model-review/${image.replace(/\.png$/, "")}-${stamp}.json`,
          content: JSON.stringify({ image, rating, note, at: new Date().toISOString() }, null, 2),
        },
      ],
      `model review: ${image}${rating !== null ? ` ${rating}/10` : ""}`
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof PublishError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: `Feedback failed: ${(err as Error).message}` }, { status: 500 });
  }
}
