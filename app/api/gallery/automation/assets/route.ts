import { cookies } from "next/headers";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { AutomationError } from "@/lib/automation-studio-core";
import { sameOrigin } from "@/lib/automation-queue-core";
import { ownerArtifactUrl } from "@/lib/automation-queue-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
  try {
    if (!await isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value)) {
      return Response.json({ error: "Sign in to view draft artifacts." }, { status: 401, headers });
    }
    sameOrigin(request, false);
    const query = new URL(request.url).searchParams;
    if ([...query.keys()].length !== 2 || !query.has("jobId") || !query.has("name")) throw new AutomationError(400, "Provide a jobId and artifact name.");
    const url = await ownerArtifactUrl(query.get("jobId")!, query.get("name")!);
    return new Response(null, { status: 307, headers: { ...headers, Location: url } });
  } catch (error) {
    return Response.json({ error: error instanceof AutomationError ? error.message : "Draft artifacts are temporarily unavailable." }, {
      status: error instanceof AutomationError ? error.status : 503, headers,
    });
  }
}
