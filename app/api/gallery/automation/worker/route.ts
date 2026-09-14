import { AutomationError } from "@/lib/automation-studio-core";
import { readQueueJson, workerCommand } from "@/lib/automation-queue-core";
import { authenticateWorker, runWorkerCommand } from "@/lib/automation-queue-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store", Vary: "Authorization", "X-Content-Type-Options": "nosniff" };
  try {
    const identity = await authenticateWorker(request);
    const command = workerCommand(await readQueueJson(request));
    return Response.json(await runWorkerCommand(identity, command), { headers });
  } catch (error) {
    return Response.json({ error: error instanceof AutomationError ? error.message : "The durable queue is temporarily unavailable." }, {
      status: error instanceof AutomationError ? error.status : 503, headers,
    });
  }
}
