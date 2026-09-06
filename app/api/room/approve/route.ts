import { cookies } from "next/headers";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { findLibraryImageById } from "@/lib/studio-library";
import { approveLocalPart, assertLocalApprovalRequest, PartApprovalError } from "@/lib/studio-part-approval";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const response = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(request: Request) {
  try {
    const jar = await cookies();
    assertLocalApprovalRequest(request, await isDoorOpen(jar.get(BACKROOM_COOKIE)?.value));
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return response({ error: "Send an explicit JSON approval." }, 415);
    if (Number(request.headers.get("content-length") || 0) > 4096) return response({ error: "Approval request is too large." }, 413);
    const reader = request.body?.getReader();
    if (!reader) return response({ error: "Approval details are missing." }, 400);
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 4096) { await reader.cancel(); return response({ error: "Approval request is too large." }, 413); }
      chunks.push(chunk.value);
    }
    let input;
    try { input = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return response({ error: "Approval details are not valid JSON." }, 400); }
    if (!input || typeof input.partId !== "string" || typeof input.candidateId !== "string" || typeof input.expectedManifestHash !== "string" || input.confirmed !== true) return response({ error: "Choose a part and candidate, then explicitly confirm the replacement." }, 400);
    const result = await approveLocalPart({ repoRoot: process.cwd(), partId: input.partId, candidateId: input.candidateId, expectedManifestHash: input.expectedManifestHash, libraryItem: findLibraryImageById(input.candidateId) });
    return response({ ...result, message: "Part source saved locally. The scene has not been rebuilt." });
  } catch (error) {
    if (error instanceof PartApprovalError) return response({ error: error.message }, error.status);
    return response({ error: "The local approval could not be completed. No scene rebuild was requested." }, 500);
  }
}
