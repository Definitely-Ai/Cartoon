import { NextResponse, type NextRequest } from "next/server";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { PublishError, publishOption, validatePublishInput } from "@/lib/githubPublish";

// RUN IT: publishing from the light table. Thin HTTP wrapper — the actual
// work (validation + one atomic GitHub commit) lives in lib/githubPublish
// and is shared with the MCP endpoint, so the button and the chat tool can
// never drift apart.

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await isDoorOpen(request.cookies.get(BACKROOM_COOKIE)?.value))) {
    return NextResponse.json({ error: "The door is closed. Knock first." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  try {
    const input = validatePublishInput(body);
    const { slug, edition } = await publishOption(input);
    return NextResponse.json({ ok: true, slug, edition });
  } catch (err) {
    if (err instanceof PublishError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: `Publish failed: ${(err as Error).message}` }, { status: 500 });
  }
}
