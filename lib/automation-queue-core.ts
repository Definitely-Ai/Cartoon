import { AutomationError, type EditionInput } from "./automation-studio-core";

export const ARTIFACT_BUCKET = "automation-drafts";
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_REPORT_BYTES = 256 * 1024;
export const MAX_ARTIFACTS = 24;
export type JobProgress = { stage: string; completed: number; total: number };
export type JobArtifact = {
  name: string; kind: "image" | "report"; contentType: "image/png" | "application/json" | "text/plain";
  bytes: number; sha256: string; path: string;
};
export type AutomationJob = {
  id: string; requestId: string; status: "queued" | "running" | "succeeded" | "failed";
  input: EditionInput; createdAt: string; updatedAt: string; dueAt: string; availableAt: string;
  inputValidatedAt: string; scheduleId: string | null; occurrenceAt: string | null;
  scheduleStatus?: 'active' | 'paused' | null;
  attempt: number; progress: JobProgress; lastError: string | null; artifacts: JobArtifact[];
  leaseExpiresAt: string | null; finishedAt: string | null;
};
export type WorkerHealth = { id: string; name: string; enabled: boolean; lastSeenAt: string | null; connected: boolean };
export type WorkerCommand = { action: "claim" } | {
  action: "heartbeat"; jobId: string; leaseToken: string; progress: JobProgress;
} | { action: "upload"; jobId: string; leaseToken: string; artifact: Omit<JobArtifact, "path"> } |
{ action: "complete"; jobId: string; leaseToken: string; artifacts: JobArtifact[] } |
{ action: "fail"; jobId: string; leaseToken: string; error: string; retryable: boolean };

export function queueFail(message: string): never { throw new AutomationError(400, message); }
export function exactKeys(raw: unknown, keys: string[], label: string): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) queueFail(`${label} must be an object.`);
  const value = raw as Record<string, unknown>;
  if (Object.keys(value).length !== keys.length || Object.keys(value).some(key => !keys.includes(key))) {
    queueFail(`${label} contains unexpected or missing fields.`);
  }
  return value;
}
export function uuid(raw: unknown): string {
  if (typeof raw !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw)) queueFail("A valid lowercase UUID is required.");
  return raw;
}
function text(raw: unknown, max: number, label: string): string {
  if (typeof raw !== "string" || !raw.trim() || raw.length > max || /[\u0000-\u001f\u007f]/.test(raw)) queueFail(`Invalid ${label}.`);
  return raw.trim();
}
export function progress(raw: unknown): JobProgress {
  const value = exactKeys(raw, ["stage", "completed", "total"], "Progress");
  const stage = text(value.stage, 120, "progress stage");
  if (!Number.isInteger(value.completed) || !Number.isInteger(value.total) ||
      (value.completed as number) < 0 || (value.total as number) < 0 || (value.total as number) > 1000 ||
      (value.completed as number) > (value.total as number)) queueFail("Invalid progress counts.");
  return { stage, completed: value.completed as number, total: value.total as number };
}
export function artifactName(raw: unknown): string {
  if (typeof raw !== "string" || !/^[a-z0-9][a-z0-9._-]{0,79}$/.test(raw) || raw.includes("..")) queueFail("Invalid artifact filename.");
  return raw;
}
export function artifactPath(jobId: string, attempt: number, name: string): string {
  uuid(jobId);
  if (!Number.isSafeInteger(attempt) || attempt < 1) queueFail("Invalid attempt.");
  return `${jobId}/${attempt}/${artifactName(name)}`;
}
export function artifact(raw: unknown, withPath: true): JobArtifact;
export function artifact(raw: unknown, withPath: false): Omit<JobArtifact, "path">;
export function artifact(raw: unknown, withPath: boolean): JobArtifact | Omit<JobArtifact, "path"> {
  const value = exactKeys(raw, ["name", "kind", "contentType", "bytes", "sha256", ...(withPath ? ["path"] : [])], "Artifact");
  const name = artifactName(value.name);
  const image = value.kind === "image" && value.contentType === "image/png" && name.endsWith(".png");
  const report = value.kind === "report" && ((value.contentType === "application/json" && name.endsWith(".json")) ||
    (value.contentType === "text/plain" && name.endsWith(".txt")));
  if (!image && !report) queueFail("Only PNG images and JSON or text reports are accepted.");
  if (!Number.isSafeInteger(value.bytes) || (value.bytes as number) < 1 ||
      (value.bytes as number) > (image ? MAX_IMAGE_BYTES : MAX_REPORT_BYTES)) queueFail("Artifact exceeds its size limit.");
  if (typeof value.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(value.sha256)) queueFail("Invalid artifact hash.");
  const result = { name, kind: value.kind, contentType: value.contentType, bytes: value.bytes, sha256: value.sha256 } as Omit<JobArtifact, "path">;
  if (!withPath) return result;
  if (typeof value.path !== "string" || value.path.length > 150) queueFail("Invalid artifact path.");
  return { ...result, path: value.path };
}
export function artifacts(raw: unknown): JobArtifact[] {
  if (!Array.isArray(raw) || !raw.length || raw.length > MAX_ARTIFACTS) queueFail("Provide 1–24 artifacts.");
  const result = raw.map(value => artifact(value, true));
  if (new Set(result.map(value => value.name)).size !== result.length) queueFail("Artifact filenames must be unique.");
  return result.sort((a, b) => a.name.localeCompare(b.name));
}
export function sameOrigin(request: Request, requireOrigin = true): void {
  const origin = request.headers.get("origin");
  if ((origin !== null && origin !== new URL(request.url).origin) || (requireOrigin && origin === null) ||
      request.headers.get("sec-fetch-site") === "cross-site") throw new AutomationError(403, "A same-origin request is required.");
}
export async function readQueueJson(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    throw new AutomationError(415, "Content-Type must be application/json.");
  }
  const limit = 24 * 1024;
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length)))) queueFail("Invalid Content-Length.");
  if (length !== null && Number(length) > limit) throw new AutomationError(413, "Request exceeds 24 KiB.");
  if (!request.body) queueFail("A JSON body is required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > limit) { await reader.cancel().catch(() => undefined); throw new AutomationError(413, "Request exceeds 24 KiB."); }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { queueFail("Request must be valid UTF-8 JSON."); }
}
export function createCommand(raw: unknown): { requestId: string; input: unknown } {
  const value = exactKeys(raw, ["requestId", "input"], "Job request");
  return { requestId: uuid(value.requestId), input: value.input };
}
export function workerCommand(raw: unknown): WorkerCommand {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) queueFail("Invalid worker command.");
  const action = (raw as Record<string, unknown>).action;
  if (action === "claim") { exactKeys(raw, ["action"], "Claim"); return { action }; }
  const extra = action === "heartbeat" ? ["progress"] : action === "upload" ? ["artifact"] :
    action === "complete" ? ["artifacts"] : action === "fail" ? ["error", "retryable"] : queueFail("Unknown worker action.");
  const value = exactKeys(raw, ["action", "jobId", "leaseToken", ...extra], "Worker command");
  const base = { jobId: uuid(value.jobId), leaseToken: uuid(value.leaseToken) };
  if (action === "heartbeat") return { ...base, action, progress: progress(value.progress) };
  if (action === "upload") return { ...base, action, artifact: artifact(value.artifact, false) };
  if (action === "complete") return { ...base, action, artifacts: artifacts(value.artifacts) };
  if (typeof value.retryable !== "boolean") queueFail("retryable must be a boolean.");
  return { ...base, action: "fail", error: text(value.error, 600, "worker error"), retryable: value.retryable };
}
