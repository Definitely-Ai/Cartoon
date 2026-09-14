import { cookies } from "next/headers";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { AutomationError, readAutomationRequest } from "@/lib/automation-studio-core";
import { listEditionPlans, saveEditionPlan } from "@/lib/automation-studio-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const json = (body: unknown, status = 200) => Response.json(body, {
  status, headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" },
});
async function signedIn() { return isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value); }
function failure(error: unknown) {
  return json({
    error: error instanceof AutomationError ? error.message : "Saved plans are unavailable. Keep your draft and try again later.",
    workerConnected: false,
  }, error instanceof AutomationError ? error.status : 503);
}

// /api/gallery/** is public in middleware, so BOTH handlers must authorize here.
export async function GET() {
  try {
    if (!await signedIn()) return json({ error: "Sign in to read saved edition plans.", workerConnected: false }, 401);
    const plans = await listEditionPlans();
    return json({ plans, checkedAt: new Date().toISOString(), workerConnected: false });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    if (!await signedIn()) return json({ error: "Sign in to save an edition plan.", workerConnected: false }, 401);
    const input = await readAutomationRequest(request);
    const plan = await saveEditionPlan(input);
    // A save may return an existing plan, so 200 never claims a new record/run.
    return json({ plan, workerConnected: false });
  } catch (error) { return failure(error); }
}
