import { cookies } from "next/headers";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { AutomationError } from "@/lib/automation-studio-core";
import { createCommand, readQueueJson, sameOrigin } from "@/lib/automation-queue-core";
import { createJob, listQueue } from "@/lib/automation-queue-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
const json = (body: unknown, status = 200) => Response.json(body, {
  status, headers: { "Cache-Control": "private, no-store", Vary: "Cookie", "X-Content-Type-Options": "nosniff" },
});
async function signedIn() { return isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value); }
function failure(error: unknown) {
  return json({ error: error instanceof AutomationError ? error.message : "The durable queue is temporarily unavailable." },
    error instanceof AutomationError ? error.status : 503);
}
// Middleware permits /api/gallery/**; each operation authorizes independently.
export async function GET(request: Request) {
  try {
    if (!await signedIn()) return json({ error: "Sign in to read the durable queue." }, 401);
    sameOrigin(request, false);
    return json(await listQueue());
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    if (!await signedIn()) return json({ error: "Sign in to queue an edition." }, 401);
    sameOrigin(request);
    const command = createCommand(await readQueueJson(request));
    return json({ job: await createJob(command.requestId, command.input) });
  } catch (error) { return failure(error); }
}
