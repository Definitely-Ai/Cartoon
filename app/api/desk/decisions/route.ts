import { cookies } from "next/headers";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { DeskError, readDeskRequest, validateDecisionInput } from "@/lib/studio-desk-core";
import { deskStore, deskStoreNote, listDeskDecisions, saveDeskDecision } from "@/lib/studio-desk-server";

// The one door between the website and the GPU.
//
//   GET  /api/desk/decisions?since=<ISO timestamp>&limit=<1-200>
//        What Rick and Zechariah decided. scripts/desk-pull.py polls this from
//        the studio machine with the studio's own session cookie.
//   POST /api/desk/decisions
//        One decision from the sticker desk page.
//
// Both are behind the studio login (middleware.ts sends anyone else to /login;
// this handler checks the cookie again rather than trusting that).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const signedIn = async () => isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value);
const failure = (error: unknown) => json(
  { error: error instanceof DeskError ? error.message : "The studio desk is unavailable right now. Please try again." },
  error instanceof DeskError ? error.status : 503
);

export async function GET(request: Request) {
  if (!await signedIn()) return json({ error: "Sign in to read the studio’s decisions." }, 401);
  try {
    const params = new URL(request.url).searchParams;
    const since = params.get("since") ?? undefined;
    const limit = params.get("limit") ? Number(params.get("limit")) : undefined;
    const decisions = await listDeskDecisions(since, limit);
    return json({ decisions, store: deskStore(), storeNote: deskStoreNote(), since: since ?? null, checkedAt: new Date().toISOString() });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  if (!await signedIn()) return json({ error: "Sign in to send a decision to the studio." }, 401);
  try {
    const decision = await saveDeskDecision(validateDecisionInput(await readDeskRequest(request)));
    return json({ decision, store: deskStore(), storeNote: deskStoreNote() }, 201);
  } catch (error) { return failure(error); }
}
