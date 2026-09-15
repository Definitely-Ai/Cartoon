import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { AutomationError, nextPlannedRuns, validateEditionInput } from "./automation-studio-core";
import { materializeDueSchedules } from "./automation-schedules-server";
import {
  ARTIFACT_BUCKET, artifactName, artifactPath, artifacts, progress, uuid,
  type AutomationJob, type JobArtifact, type WorkerCommand, type WorkerHealth,
} from "./automation-queue-core";

const OWNER = "backroom-owner";
export { configuration as queueDatabaseConfig, data as queueDatabaseData, upstream as queueDatabaseRequest };
const JOB_FIELDS = "id,owner_key,request_id,input_hash,input,input_validated_at,schedule_id,occurrence_at,status,created_at,updated_at,due_at,available_at,attempt,progress,last_error,artifacts,lease_expires_at,finished_at,automation_schedules(status)";
const unavailable = () => new AutomationError(503, "The durable queue is temporarily unavailable. Keep this request and retry with the same request ID.");
const stale = () => new AutomationError(409, "This worker lease is no longer current. Claim again before continuing.");
const digest = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");

function configuration() {
  const raw = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_KEY?.trim();
  if (!raw || !key || /\[(?:SENSITIVE|REDACTED)\]|^(?:undefined|null)$/i.test(key) || key.startsWith("sb_publishable_")) throw unavailable();
  try {
    const url = new URL(raw);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) || url.username || url.password ||
        url.search || url.hash || url.pathname !== "/") throw unavailable();
    return { url: url.origin, key };
  } catch { throw unavailable(); }
}
type Configuration = ReturnType<typeof configuration>;
type WorkerIdentity = { id: string; tokenHash: string };
function headers(config: Configuration) {
  return { apikey: config.key, ...(config.key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${config.key}` }) };
}
async function upstream(config: Configuration, path: string, body?: unknown, prefer?: string): Promise<Response> {
  try {
    const response = await fetch(`${config.url}${path}`, {
      method: body === undefined ? "GET" : "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10_000),
      headers: { ...headers(config), ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(prefer ? { Prefer: prefer } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      // Error text can contain SQL or credentials. Only stable error codes cross
      // this boundary, and only for the fenced RPC endpoints.
      if (path.startsWith("/rest/v1/rpc/")) {
        const error = await response.json().catch(() => ({}));
        if (error?.code === "40001") throw stale();
        if (error?.code === "28000") throw new AutomationError(401, "Worker token is invalid or revoked.");
      }
      throw unavailable();
    }
    return response;
  } catch (error) { if (error instanceof AutomationError) throw error; throw unavailable(); }
}
async function data(config: Configuration, path: string, body?: unknown): Promise<unknown> {
  try { return await (await upstream(config, path, body)).json(); }
  catch (error) { if (error instanceof AutomationError) throw error; throw unavailable(); }
}
function date(raw: unknown, nullable = false): string | null {
  if (raw === null && nullable) return null;
  if (typeof raw !== "string" || !Number.isFinite(Date.parse(raw))) throw unavailable();
  return raw;
}
function toJob(raw: unknown): AutomationJob {
  try {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw unavailable();
    const row = raw as Record<string, unknown>;
    const id = uuid(row.id), requestId = uuid(row.request_id);
    const createdAt = date(row.created_at)!;
    const scheduleId = row.schedule_id === null || row.schedule_id === undefined ? null : uuid(row.schedule_id);
    const occurrenceAt = row.occurrence_at === null || row.occurrence_at === undefined ? null : date(row.occurrence_at)!;
    if ((scheduleId === null) !== (occurrenceAt === null)) throw unavailable();
    // Immutable schedules were validated when saved. Materializing an occurrence
    // days later must not reinterpret that original date as a new submission.
    // One-off jobs always retain creation-time validation, even if this optional
    // column were populated with an unrelated earlier timestamp.
    const inputValidatedAt = scheduleId === null ? createdAt : date(row.input_validated_at)!;
    if (Date.parse(inputValidatedAt) > Date.parse(createdAt)) throw unavailable();
    const input = validateEditionInput(row.input, new Date(inputValidatedAt));
    if (scheduleId !== null && (input.timing.mode !== "daily" && input.timing.mode !== "weekly")) throw unavailable();
    if (occurrenceAt !== null && Date.parse(occurrenceAt) !== Date.parse(date(row.due_at)!)) throw unavailable();
    if (row.owner_key !== OWNER || digest(JSON.stringify(input)) !== row.input_hash ||
        !["queued", "running", "succeeded", "failed"].includes(row.status as string) ||
        !Number.isSafeInteger(row.attempt) || (row.attempt as number) < 0 ||
        (row.last_error !== null && (typeof row.last_error !== "string" || row.last_error.length > 600))) throw unavailable();
    const resultArtifacts = Array.isArray(row.artifacts) && row.artifacts.length === 0 ? [] : artifacts(row.artifacts);
    if (resultArtifacts.some(item => item.path !== artifactPath(id, row.attempt as number, item.name))) throw unavailable();
    if (row.status === "succeeded" && resultArtifacts.filter(item => item.kind === "image").length !== input.quantity) throw unavailable();
    const result: AutomationJob = {
      id, requestId, input, status: row.status as AutomationJob["status"], createdAt, inputValidatedAt, scheduleId, occurrenceAt,
      updatedAt: date(row.updated_at)!, dueAt: date(row.due_at)!, availableAt: date(row.available_at)!,
      attempt: row.attempt as number, progress: progress(row.progress), lastError: row.last_error as string | null,
      artifacts: resultArtifacts, leaseExpiresAt: date(row.lease_expires_at, true), finishedAt: date(row.finished_at, true),
    };
    if (result.status === "running" && !result.leaseExpiresAt) throw unavailable();
    const scheduleStatus=(row.automation_schedules as {status?:unknown}|null)?.status;
    if(scheduleStatus==='active'||scheduleStatus==='paused')result.scheduleStatus=scheduleStatus;
    return result;
  } catch { throw unavailable(); }
}
async function readJobs(config: Configuration, query: URLSearchParams, limit: number): Promise<AutomationJob[]> {
  query.set("owner_key", `eq.${OWNER}`);
  query.set("select", JOB_FIELDS);
  const rows = await data(config, `/rest/v1/automation_jobs?${query}`);
  if (!Array.isArray(rows) || rows.length > limit) throw unavailable();
  const jobs = rows.map(toJob);
  if (new Set(jobs.map(job => job.id)).size !== jobs.length) throw unavailable();
  return jobs;
}
export async function listQueue(): Promise<{ jobs: AutomationJob[]; workers: WorkerHealth[]; checkedAt: string; workerConnected: boolean }> {
  const config = configuration();
  const [jobs, rawWorkers] = await Promise.all([
    readJobs(config, new URLSearchParams({ order: "created_at.desc,id.desc", limit: "100" }), 100),
    data(config, "/rest/v1/automation_workers?select=id,name,enabled,last_seen_at&order=created_at.desc&limit=40"),
  ]);
  if (!Array.isArray(rawWorkers) || rawWorkers.length > 40) throw unavailable();
  const workers = rawWorkers.map((raw): WorkerHealth => {
    if (!raw || typeof raw.name !== "string" || raw.name.length > 80 || typeof raw.enabled !== "boolean") throw unavailable();
    const lastSeenAt = date(raw.last_seen_at, true);
    return { id: uuid(raw.id), name: raw.name, enabled: raw.enabled, lastSeenAt,
      connected: raw.enabled && lastSeenAt !== null && Date.now() - Date.parse(lastSeenAt) < 120_000 };
  });
  const completed=jobs.filter(j=>j.status==='succeeded');
  if(completed.length){
    const reviews=await data(config,`/rest/v1/cartoon_reviews?${new URLSearchParams({select:'job_id,image_name,decision',owner_key:`eq.${OWNER}`,job_id:`in.(${completed.map(j=>j.id).join(',')})`,limit:'1201'})}`);
    if(!Array.isArray(reviews)||reviews.length>1200)throw unavailable();
    for(const job of completed)job.editorial={draft:job.input.quantity,approved:0,rejected:0,withdrawn:0};
    const seen=new Set<string>();
    for(const review of reviews){
      const job=completed.find(j=>j.id===review.job_id),key=`${review.job_id}/${review.image_name}`;
      if(!job?.editorial||!job.artifacts.some(a=>a.kind==='image'&&a.name===review.image_name)||!['approved','rejected','withdrawn'].includes(review.decision)||seen.has(key))throw unavailable();
      seen.add(key);job.editorial.draft--;job.editorial[review.decision as 'approved'|'rejected'|'withdrawn']++;
    }
  }
  return { jobs, workers, checkedAt: new Date().toISOString(), workerConnected: workers.some(worker => worker.connected) };
}
export async function createJob(requestId: string, rawInput: unknown): Promise<AutomationJob> {
  uuid(requestId);
  const config = configuration();
  const find = () => readJobs(config, new URLSearchParams({ request_id: `eq.${requestId}`, limit: "2" }), 1);
  const existing = await find();
  if (existing.length) {
    if (existing[0].scheduleId !== null) throw new AutomationError(409, "This request ID belongs to a recurring schedule occurrence.");
    // Retrying an acknowledged request next day must still return its exact job.
    const normalized = validateEditionInput(rawInput, new Date(existing[0].createdAt));
    if (digest(JSON.stringify(normalized)) !== digest(JSON.stringify(existing[0].input))) {
      throw new AutomationError(409, "This request ID already belongs to a different edition. Use a new request ID for a new edition.");
    }
    return existing[0];
  }
  const now = new Date();
  const input = validateEditionInput(rawInput, now);
  if (input.timing.mode === "daily" || input.timing.mode === "weekly") {
    throw new AutomationError(400, "Recurring plans are not active yet. Choose Now or Once to queue this edition.");
  }
  const first = nextPlannedRuns(input, now, 1)[0];
  if (!first) throw new AutomationError(400, "No upcoming occurrence was found for this edition.");
  const inputHash = digest(JSON.stringify(input));
  await upstream(config, "/rest/v1/automation_jobs?on_conflict=request_id", {
    request_id: requestId, owner_key: OWNER, input_hash: inputHash, input, status: "queued",
    created_at: now.toISOString(), updated_at: now.toISOString(), due_at: first.at, available_at: first.at,
  }, "resolution=ignore-duplicates,return=minimal");
  const stored = await find();
  if (stored.length !== 1) throw unavailable();
  if (digest(JSON.stringify(stored[0].input)) !== inputHash) throw new AutomationError(409, "This request ID already belongs to another edition.");
  return stored[0];
}
// A fresh creative pass must not replay exhausted local checkpoints. Keep the
// original job immutable and derive ONE follow-up request ID per original job.
// Database request_id uniqueness fences double clicks and lost HTTP responses.
export async function retryJob(jobId: string): Promise<AutomationJob> {
  uuid(jobId);
  const config=configuration();
  const original=(await readJobs(config,new URLSearchParams({id:`eq.${jobId}`,limit:'2'}),1))[0];
  if(!original)throw new AutomationError(404,'The saved request was not found.');
  if(original.status!=='failed')throw new AutomationError(409,'This request is already queued, running, or ready. Open its current status.');
  const hex=digest(`swinging-door-fresh-pass-v1:${jobId}`);
  const requestId=`${hex.slice(0,8)}-${hex.slice(8,12)}-5${hex.slice(13,16)}-8${hex.slice(17,20)}-${hex.slice(20,32)}`;
  const existing=(await readJobs(config,new URLSearchParams({request_id:`eq.${requestId}`,limit:'2'}),1))[0];
  if(existing)return existing;
  const now=new Date();
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:original.input.location.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const input={...original.input,timing:{mode:'now',date,time:'09:00',weekdays:[]}};
  try{return await createJob(requestId,input);}catch(error){
    // Another tab can win across local midnight. Its exact saved input wins.
    if(error instanceof AutomationError&&error.status===409){
      const winner=(await readJobs(config,new URLSearchParams({request_id:`eq.${requestId}`,limit:'2'}),1))[0];
      if(winner)return winner;
    }
    throw error;
  }
}
export async function authenticateWorker(request: Request): Promise<WorkerIdentity> {
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer [A-Za-z0-9_-]{43,128}$/.test(authorization)) throw new AutomationError(401, "A valid worker bearer token is required.");
  const tokenHash = digest(authorization.slice(7));
  const rows = await data(configuration(), `/rest/v1/automation_workers?${new URLSearchParams({
    select: "id", token_hash: `eq.${tokenHash}`, enabled: "eq.true", limit: "2",
  })}`);
  if (!Array.isArray(rows)) throw unavailable();
  if (rows.length !== 1) throw new AutomationError(401, "Worker token is invalid or revoked.");
  return { id: uuid(rows[0].id), tokenHash };
}
async function rpc(config: Configuration, worker: WorkerIdentity, args: Record<string, unknown>, claim = false): Promise<unknown> {
  return data(config, `/rest/v1/rpc/${claim ? "automation_claim_job" : "automation_update_job"}`, {
    p_worker_id: worker.id, p_token_hash: worker.tokenHash, ...args,
  });
}
function leaseJob(raw: unknown, worker: WorkerIdentity): AutomationJob & { leaseToken: string } {
  const job = toJob(raw);
  const row = raw as Record<string, unknown>;
  if (row.worker_id !== worker.id) throw stale();
  return { ...job, leaseToken: uuid(row.lease_token) };
}
function signedStorageUrl(config: Configuration, raw: unknown, path: string, upload: boolean): string {
  if (typeof raw !== "string") throw unavailable();
  try {
    const url = new URL(raw.startsWith("/") ? `${config.url}${raw.startsWith("/storage/v1/") ? "" : "/storage/v1"}${raw}` : raw);
    const expected = `/storage/v1/object/${upload ? "upload/sign" : "sign"}/${ARTIFACT_BUCKET}/${path}`;
    if (url.origin !== config.url || url.pathname !== expected || !url.searchParams.get("token") || url.username || url.password || url.hash) throw unavailable();
    return url.toString();
  } catch { throw unavailable(); }
}
async function verifyArtifact(config: Configuration, item: JobArtifact, signal: AbortSignal): Promise<Buffer> {
  let response: Response;
  try {
    response = await fetch(`${config.url}/storage/v1/object/authenticated/${ARTIFACT_BUCKET}/${item.path}`, {
      headers: headers(config), cache: "no-store", redirect: "error", signal,
    });
  } catch { throw unavailable(); }
  if (!response.ok || !response.body) throw unavailable();
  const length = response.headers.get("content-length");
  const encoding = response.headers.get("content-encoding");
  // fetch decompresses encoded responses; their Content-Length describes the
  // transfer, while the manifest hashes the original stored artifact bytes.
  if ((!encoding || encoding === "identity") && length !== null && Number(length) !== item.bytes) {
    throw new AutomationError(400, "Stored artifact size does not match its manifest.");
  }
  if (response.headers.get("content-type")?.split(";", 1)[0].trim() !== item.contentType) throw new AutomationError(400, "Stored artifact type does not match its manifest.");
  const reader = response.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > item.bytes) { await reader.cancel(); throw new AutomationError(400, "Stored artifact exceeds its declared size."); }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = Buffer.concat(chunks, size);
  if (size !== item.bytes || digest(bytes) !== item.sha256) throw new AutomationError(400, "Stored artifact hash does not match its manifest.");
  try {
    if (item.kind === "image") {
      const decoder = sharp(bytes, { limitInputPixels: 24_000_000, failOn: "warning" });
      const metadata = await decoder.metadata();
      if (metadata.format !== "png" || !metadata.width || !metadata.height || (metadata.pages ?? 1) !== 1) throw Error("Invalid PNG");
      await decoder.stats(); // Decode the complete image, not just its file header.
    } else {
      const value = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (item.contentType === "application/json") JSON.parse(value);
    }
  } catch { throw new AutomationError(400, "Stored artifact could not be decoded as its declared type."); }
  return bytes;
}
export async function runWorkerCommand(worker: WorkerIdentity, command: WorkerCommand): Promise<unknown> {
  const config = configuration();
  if (command.action === "claim") {
    // This path is reached only after worker bearer authentication. Polling
    // backfills occurrences when a cloud cron run was missed while the PC was
    // offline. An isolated schedule error must not stall already durable jobs.
    let scheduleWarning: string | undefined;
    try {
      const tick = await materializeDueSchedules();
      if (tick.failed > 0) scheduleWarning = "Some recurring schedule checks need attention. Existing jobs can continue.";
    } catch {
      scheduleWarning = "Recurring schedule checks are temporarily unavailable. Existing jobs can continue.";
    }
    const raw = await rpc(config, worker, {}, true);
    return { job: raw === null ? null : leaseJob(raw, worker), ...(scheduleWarning ? { scheduleWarning } : {}) };
  }
  const base = { p_job_id: command.jobId, p_lease_token: command.leaseToken };
  if (command.action === "heartbeat" || command.action === "fail") {
    const raw = await rpc(config, worker, { ...base, p_action: command.action,
      ...(command.action === "heartbeat" ? { p_progress: command.progress } : { p_error: command.error, p_retryable: command.retryable }),
    });
    return { job: toJob(raw) };
  }
  if (command.action === "upload") {
    const raw = await rpc(config, worker, { ...base, p_action: "heartbeat" });
    const job = leaseJob(raw, worker);
    const path = artifactPath(job.id, job.attempt, command.artifact.name);
    const result = await data(config, `/storage/v1/object/upload/sign/${ARTIFACT_BUCKET}/${path}`, {});
    return { uploadUrl: signedStorageUrl(config, (result as { url?: unknown })?.url, path, true), path };
  }
  // Exact successful completions are safe to retry after a lost response. Other
  // completions renew first, verify immutable attempt-scoped objects, then fence
  // again atomically. A lease takeover during verification cannot commit.
  const rows = await data(config, `/rest/v1/automation_jobs?${new URLSearchParams({
    select: "*", id: `eq.${command.jobId}`, owner_key: `eq.${OWNER}`, limit: "2",
  })}`);
  if (!Array.isArray(rows) || rows.length !== 1) throw stale();
  const previous = leaseJob(rows[0], worker);
  if (previous.leaseToken !== command.leaseToken) throw stale();
  const manifest = artifacts(command.artifacts);
  if (manifest.some(item => item.path !== artifactPath(previous.id, previous.attempt, item.name))) {
    throw new AutomationError(400, "Artifacts must belong to this job and current attempt.");
  }
  if (manifest.filter(item => item.kind === "image").length !== previous.input.quantity) {
    throw new AutomationError(400, "Completed images must match the requested quantity.");
  }
  if (previous.status === "succeeded") {
    // RPC also rechecks token revocation and compares jsonb manifest equality.
    return { job: toJob(await rpc(config, worker, { ...base, p_action: "complete", p_artifacts: manifest })) };
  }
  await rpc(config, worker, { ...base, p_action: "heartbeat" });
  const signal = AbortSignal.timeout(45_000);
  // Keep memory bounded to two image files while reducing download latency.
  for (let index = 0; index < manifest.length; index += 2) {
    await Promise.all(manifest.slice(index, index + 2).map(item => verifyArtifact(config, item, signal)));
  }
  return { job: toJob(await rpc(config, worker, { ...base, p_action: "complete", p_artifacts: manifest })) };
}
export async function ownerArtifactUrl(jobId: string, name: string): Promise<string> {
  uuid(jobId); artifactName(name);
  const config = configuration();
  const jobs = await readJobs(config, new URLSearchParams({ id: `eq.${jobId}`, limit: "2" }), 1);
  const item = jobs[0]?.status === "succeeded" ? jobs[0].artifacts.find(file => file.name === name) : undefined;
  if (!item) throw new AutomationError(404, "The completed draft artifact was not found.");
  const result = await data(config, `/storage/v1/object/sign/${ARTIFACT_BUCKET}/${item.path}`, { expiresIn: 60 });
  return signedStorageUrl(config, (result as { signedURL?: unknown })?.signedURL, item.path, false);
}

// Server-only readers for the editorial gate. Never accept a client storage path.
export async function completedOwnerJob(jobId: string): Promise<AutomationJob> {
  uuid(jobId);
  const job=(await readJobs(configuration(),new URLSearchParams({id:`eq.${jobId}`,limit:'2'}),1))[0];
  if(!job||job.status!=='succeeded')throw new AutomationError(404,'This completed edition was not found.');
  return job;
}
export async function verifiedOwnerArtifact(job:AutomationJob,name:string):Promise<Buffer>{
  const item=job.artifacts.find(a=>a.name===name);
  if(!item)throw new AutomationError(404,'This saved artifact was not found.');
  return verifyArtifact(configuration(),item,AbortSignal.timeout(15000));
}
