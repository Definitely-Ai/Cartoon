import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import sharp from "sharp";
import ts from "typescript";

// Isolated HTTP stubs: these tests never load .env files or contact a database.
// SQL concurrency is verified separately against the actual PostgreSQL engine.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const now = "2026-09-14T18:00:00.000Z";
class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return Date.parse(now); } }
const requestId = "12222222-2222-4222-8222-222222222222";
const jobId = "22222222-2222-4222-8222-222222222222";
const workerId = "33333333-3333-4333-8333-333333333333";
const leaseToken = "44444444-4444-4444-8444-444444444444";
const token = "a".repeat(43);
const env = { SUPABASE_URL: "https://database.example", SUPABASE_SERVICE_KEY: "server-secret-only-a-stub" };
const input = {
  location: { name: "Naples", region: "Florida", country: "US", timezone: "America/New_York", coverage: "city" },
  audience: "Local readers who enjoy warm humor.", quantity: 1, cast: "duo",
  timing: { mode: "once", date: "2026-09-15", time: "09:00", weekdays: [] },
};
const hash = value => createHash("sha256").update(value).digest("hex");
function row(extra = {}) {
  return { id: jobId, owner_key: "backroom-owner", request_id: requestId, input_hash: hash(JSON.stringify(input)), input,
    status: "queued", created_at: now, updated_at: now, due_at: "2026-09-15T13:00:00.000Z", available_at: "2026-09-15T13:00:00.000Z",
    attempt: 0, progress: { stage: "Waiting for worker", completed: 0, total: 0 }, last_error: null, artifacts: [],
    worker_id: null, lease_token: null, lease_expires_at: null, finished_at: null, ...extra };
}
function load({ fetch = async () => { throw Error("Unexpected request"); }, signedIn = true, environment = env,
  materialize = async () => ({ processed: 0, inserted: 0, conflicts: 0, failed: 0, hasMore: false }) } = {}) {
  const modules = new Map();
  function compile(file) {
    if (modules.has(file)) return modules.get(file);
    const source = fs.readFileSync(path.join(root, file), "utf8");
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const module = { exports: {} };
    const require = name => {
      if (name === "server-only") return {};
      if (name === "node:crypto") return { createHash };
      if (name === "sharp") return sharp;
      if (name === "./automation-schedules-server") return { materializeDueSchedules: materialize };
      if (name === "next/headers") return { cookies: async () => ({ get: () => ({ value: "stub" }) }) };
      if (name.endsWith("backroom-auth")) return { BACKROOM_COOKIE: "sd_backroom", isDoorOpen: async () => signedIn };
      const local = name.replace(/^@\/lib\//, "").replace(/^\.\//, "");
      if (/^automation-(?:studio-core|queue-core|queue-server)$/.test(local)) return compile(`lib/${local}.ts`);
      throw Error(`Unexpected module ${name}`);
    };
    vm.runInNewContext(compiled, { module, exports: module.exports, require, fetch, Request, Response, URL, URLSearchParams,
      AbortSignal, Uint8Array, Buffer, TextDecoder, Intl, Date: FixedDate, process: { env: environment } });
    modules.set(file, module.exports);
    return module.exports;
  }
  return { core: compile("lib/automation-queue-core.ts"), server: compile("lib/automation-queue-server.ts"),
    jobs: compile("app/api/gallery/automation/jobs/route.ts"), worker: compile("app/api/gallery/automation/worker/route.ts"),
    assets: compile("app/api/gallery/automation/assets/route.ts") };
}
const request = (endpoint, body, extraHeaders = {}) => new Request(`https://studio.example/api/gallery/automation/${endpoint}`, {
  method: body === undefined ? "GET" : "POST", headers: { Origin: "https://studio.example", "Content-Type": "application/json", ...extraHeaders },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
const workerRequest = body => request("worker", body, { Authorization: `Bearer ${token}` });
const workerAuth = url => new URL(url).pathname === "/rest/v1/automation_workers";
const liveRow = (extra = {}) => row({ status: "running", attempt: 1, worker_id: workerId, lease_token: leaseToken,
  lease_expires_at: "2026-09-14T18:03:00.000Z", ...extra });

test("all owner routes and worker routes reject missing credentials before storage", async () => {
  let calls = 0;
  const { jobs, assets, worker } = load({ signedIn: false, fetch: async () => { calls++; throw Error("Must not query"); } });
  const results = await Promise.all([jobs.GET(request("jobs")), jobs.POST(request("jobs", { requestId, input })),
    assets.GET(request(`assets?jobId=${jobId}&name=one.png`)), worker.POST(request("worker", { action: "claim" }))]);
  results.forEach(result => { assert.equal(result.status, 401); assert.match(result.headers.get("cache-control"), /no-store/); });
  assert.equal(calls, 0);
});
test("owner jobs reject cross-origin, malformed UUID and bounded body violations", async () => {
  let calls = 0;
  const { jobs } = load({ fetch: async () => { calls++; throw Error("Must not query"); } });
  assert.equal((await jobs.POST(request("jobs", { requestId, input }, { Origin: "https://evil.example" }))).status, 403);
  assert.equal((await jobs.GET(request("jobs", undefined, { Origin: "https://evil.example" }))).status, 403);
  assert.equal((await jobs.POST(request("jobs", { requestId: "../bad", input }))).status, 400);
  assert.equal((await jobs.POST(request("jobs", { requestId, input, run: "shell" }))).status, 400);
  assert.equal((await jobs.POST(request("jobs", { requestId, input }, { "Content-Length": "24577" }))).status, 413);
  assert.equal((await jobs.POST(request("jobs", { requestId, input: "a".repeat(24577) }))).status, 413);
  assert.equal(calls, 0);
});
test("normalized UUID submission persists due time and duplicate retries reuse the exact record", async () => {
  let stored, writes = 0;
  const { jobs } = load({ fetch: async (url, options) => {
    assert.equal(options.headers.apikey, env.SUPABASE_SERVICE_KEY);
    if (options.method === "POST") {
      assert.equal(new URL(url).searchParams.get("on_conflict"), "request_id");
      assert.match(options.headers.Prefer, /ignore-duplicates/);
      const body = JSON.parse(options.body);
      if (!stored) { stored = row(body); writes++; }
      return new Response(null, { status: 201 });
    }
    assert.equal(new URL(url).searchParams.get("owner_key"), "eq.backroom-owner");
    return Response.json(stored ? [stored] : []);
  } });
  const responses = await Promise.all([jobs.POST(request("jobs", { requestId, input })), jobs.POST(request("jobs", { requestId, input }))]);
  for (const response of responses) {
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.job.id, jobId);
    assert.equal(result.job.dueAt, "2026-09-15T13:00:00.000Z");
    assert.equal(result.job.status, "queued");
    assert.doesNotMatch(JSON.stringify(result), /input_hash|owner_key|service_key|server-secret/);
  }
  assert.equal(writes, 1);
  assert.equal((await jobs.POST(request("jobs", { requestId, input: { ...input, quantity: 2 } }))).status, 409);
});
test("historical retries validate at creation; recurring modes explicitly fail without creating", async () => {
  const historical = { ...input, timing: { ...input.timing, date: "2026-09-13" } };
  const historicalRow = row({ input: historical, input_hash: hash(JSON.stringify(historical)), created_at: "2026-09-12T18:00:00Z" });
  const loaded = load({ fetch: async () => Response.json([historicalRow]) });
  assert.equal((await loaded.jobs.POST(request("jobs", { requestId, input: historical }))).status, 200);
  let writes = 0;
  const { jobs } = load({ fetch: async (_url, options) => { if (options.method === "POST") writes++; return Response.json([]); } });
  for (const mode of ["daily", "weekly"]) {
    const response = await jobs.POST(request("jobs", { requestId, input: { ...input, timing: { ...input.timing, mode, weekdays: [1] } } }));
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /Recurring plans are not active/);
  }
  assert.equal(writes, 0);
});
test("worker token is hashed, mapped to one enabled worker and fenced RPC receives identity", async () => {
  const { worker } = load({ fetch: async (url, options) => {
    const parsed = new URL(url);
    if (workerAuth(url)) {
      assert.equal(parsed.searchParams.get("token_hash"), `eq.${hash(token)}`);
      assert.equal(parsed.searchParams.get("enabled"), "eq.true");
      return Response.json([{ id: workerId }]);
    }
    assert.equal(parsed.pathname, "/rest/v1/rpc/automation_claim_job");
    assert.deepEqual(JSON.parse(options.body), { p_worker_id: workerId, p_token_hash: hash(token) });
    return Response.json(liveRow());
  } });
  const response = await worker.POST(workerRequest({ action: "claim" }));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.job.leaseToken, leaseToken);
  assert.doesNotMatch(JSON.stringify(result), /token_hash|server-secret|worker_id/);
});
test("disabled token and stale lease map to safe failures; arbitrary commands cannot dispatch", async () => {
  const disabled = load({ fetch: async () => Response.json([]) });
  assert.equal((await disabled.worker.POST(workerRequest({ action: "claim" }))).status, 401);
  let rpcCalls = 0;
  const { worker } = load({ fetch: async url => {
    if (workerAuth(url)) return Response.json([{ id: workerId }]);
    rpcCalls++;
    return Response.json({ code: "40001", message: "SQL secret-key" }, { status: 409 });
  } });
  const staleResponse = await worker.POST(workerRequest({ action: "heartbeat", jobId, leaseToken, progress: { stage: "Drawing", completed: 0, total: 1 } }));
  assert.equal(staleResponse.status, 409);
  assert.doesNotMatch(await staleResponse.text(), /SQL|secret-key/);
  assert.equal((await worker.POST(workerRequest({ action: "exec", command: "powershell" }))).status, 400);
  assert.equal(rpcCalls, 1);
});
test("private upload signs only the current attempt path and rejects off-origin signed URLs", async () => {
  const png = await sharp({ create: { width: 3, height: 3, channels: 3, background: "white" } }).png().toBuffer();
  const artifact = { name: "one.png", kind: "image", contentType: "image/png", bytes: png.length, sha256: hash(png) };
  for (const hostile of [false, true]) {
    const { worker } = load({ fetch: async url => {
      if (workerAuth(url)) return Response.json([{ id: workerId }]);
      if (new URL(url).pathname.startsWith("/rest/v1/rpc")) return Response.json(liveRow());
      assert.equal(new URL(url).pathname, `/storage/v1/object/upload/sign/automation-drafts/${jobId}/1/one.png`);
      return Response.json({ url: hostile ? "https://evil.example/upload?token=x" : `/object/upload/sign/automation-drafts/${jobId}/1/one.png?token=scoped` });
    } });
    const response = await worker.POST(workerRequest({ action: "upload", jobId, leaseToken, artifact }));
    assert.equal(response.status, hostile ? 503 : 200);
    if (!hostile) assert.equal((await response.json()).path, `${jobId}/1/one.png`);
  }
});
test("completion verifies actual immutable PNG bytes, and identical accepted retries do not download again", async () => {
  const png = await sharp({ create: { width: 3, height: 3, channels: 3, background: "white" } }).png().toBuffer();
  const artifact = { name: "one.png", kind: "image", contentType: "image/png", bytes: png.length, sha256: hash(png), path: `${jobId}/1/one.png` };
  let stored = liveRow(), downloads = 0, completions = 0;
  const { worker } = load({ fetch: async (url, options) => {
    if (workerAuth(url)) return Response.json([{ id: workerId }]);
    const pathname = new URL(url).pathname;
    if (pathname === "/rest/v1/automation_jobs") return Response.json([stored]);
    if (pathname.startsWith("/storage/v1/object/authenticated")) {
      downloads++; return new Response(png, { headers: { "content-type": "image/png", "content-length": String(png.length) } });
    }
    const body = JSON.parse(options.body);
    if (body.p_action === "complete") {
      completions++;
      stored = { ...stored, status: "succeeded", artifacts: body.p_artifacts, finished_at: now, lease_expires_at: null };
    }
    return Response.json(stored);
  } });
  const command = { action: "complete", jobId, leaseToken, artifacts: [artifact] };
  assert.equal((await worker.POST(workerRequest(command))).status, 200);
  assert.equal((await worker.POST(workerRequest(command))).status, 200);
  assert.equal(downloads, 1);
  assert.equal(completions, 2);
});
test("hash mismatch, wrong attempt and missing image cannot become succeeded", async () => {
  const bytes = Buffer.from("not-a-png");
  const artifact = { name: "one.png", kind: "image", contentType: "image/png", bytes: bytes.length, sha256: "f".repeat(64), path: `${jobId}/1/one.png` };
  let completions = 0;
  const { worker } = load({ fetch: async (url, options) => {
    if (workerAuth(url)) return Response.json([{ id: workerId }]);
    if (new URL(url).pathname === "/rest/v1/automation_jobs") return Response.json([liveRow()]);
    if (new URL(url).pathname.startsWith("/storage/")) return new Response(bytes, { headers: { "content-type": "image/png" } });
    if (JSON.parse(options.body).p_action === "complete") completions++;
    return Response.json(liveRow());
  } });
  for (const item of [artifact, { ...artifact, sha256: hash(bytes) }, { ...artifact, path: `${jobId}/2/one.png` }]) {
    assert.equal((await worker.POST(workerRequest({ action: "complete", jobId, leaseToken, artifacts: [item] }))).status, 400);
  }
  assert.equal(completions, 0);
});
test("owner download resolves only a completed job's verified artifact and expires its URL", async () => {
  const item = { name: "one.png", kind: "image", contentType: "image/png", bytes: 10, sha256: "a".repeat(64), path: `${jobId}/1/one.png` };
  let signatures = 0;
  const { assets } = load({ fetch: async (url, options) => {
    if (new URL(url).pathname === "/rest/v1/automation_jobs") {
      assert.equal(new URL(url).searchParams.get("owner_key"), "eq.backroom-owner");
      return Response.json([liveRow({ status: "succeeded", artifacts: [item], lease_expires_at: null, finished_at: now })]);
    }
    signatures++;
    assert.deepEqual(JSON.parse(options.body), { expiresIn: 60 });
    return Response.json({ signedURL: `/object/sign/automation-drafts/${item.path}?token=private-download` });
  } });
  const result = await assets.GET(request(`assets?jobId=${jobId}&name=one.png`));
  assert.equal(result.status, 307);
  assert.equal(new URL(result.headers.get("location")).origin, env.SUPABASE_URL);
  assert.equal(result.headers.get("referrer-policy"), "no-referrer");
  assert.equal((await assets.GET(request(`assets?jobId=${jobId}&name=unknown.png`))).status, 404);
  assert.equal((await assets.GET(request(`assets?jobId=${jobId}&name=..%2Fone.png`))).status, 400);
  assert.equal(signatures, 1);
});
test("the full twelve-image plus twelve-report manifest fits; oversize files and paths are rejected", () => {
  const { core } = load();
  const manifest = [];
  for (let index = 1; index <= 12; index++) {
    for (const kind of ["image", "report"]) {
      const name = `draft-${index}.${kind === "image" ? "png" : "json"}`;
      manifest.push({ name, kind, contentType: kind === "image" ? "image/png" : "application/json",
        bytes: kind === "image" ? 8388608 : 262144, sha256: "a".repeat(64), path: `${jobId}/1/${name}` });
    }
  }
  const validated = core.workerCommand({ action: "complete", jobId, leaseToken, artifacts: manifest });
  assert.equal(validated.artifacts.length, 24);
  assert.ok(Buffer.byteLength(JSON.stringify(validated)) < 24576);
  assert.throws(() => core.artifact({ ...manifest[0], bytes: 8388609 }, true));
  assert.throws(() => core.artifact({ ...manifest[1], bytes: 262145 }, true));
  assert.throws(() => core.artifactName("../file.png"));
  assert.throws(() => core.artifactName("C:\\secret.png"));
});
test("unconfigured, public or unsafe service configuration fails closed, and secret API keys stay in apikey", async () => {
  for (const environment of [{}, { ...env, SUPABASE_SERVICE_KEY: "sb_publishable_bad" }, { ...env, SUPABASE_URL: "http://evil.example" }]) {
    let requests = 0;
    const { jobs } = load({ environment, fetch: async () => { requests++; throw Error("Unsafe configuration fetched"); } });
    assert.equal((await jobs.GET(request("jobs"))).status, 503);
    assert.equal(requests, 0);
  }
  const { jobs } = load({ environment: { ...env, SUPABASE_SERVICE_KEY: "sb_secret_test" }, fetch: async (_url, options) => {
    assert.equal(options.headers.apikey, "sb_secret_test");
    assert.equal(options.headers.Authorization, undefined);
    return Response.json([]);
  } });
  const response = await jobs.GET(request("jobs"));
  assert.equal(response.status, 200);
  assert.doesNotMatch(await response.text(), /sb_secret_test|token_hash/);
});
test("SQL statically enforces service-only RLS, atomic leases, recovery and non-upsert private artifacts", () => {
  const sql = fs.readFileSync(path.join(root, "docs/sql/automation-queue.sql"), "utf8");
  assert.equal((sql.match(/enable row level security/gi) ?? []).length, 2);
  assert.equal((sql.match(/force row level security/gi) ?? []).length, 2);
  assert.equal((sql.match(/security invoker set search_path = pg_catalog/gi) ?? []).length, 2);
  assert.doesNotMatch(sql, /security definer|grant[^;]*to (?:public|anon|authenticated)\s*;/i);
  assert.match(sql, /for update skip locked/i);
  assert.match(sql, /lease_expires_at <= now\(\)/);
  assert.match(sql, /v_job\.lease_token is distinct from p_lease_token/);
  assert.match(sql, /v_job\.status = 'succeeded' and v_job\.artifacts = p_artifacts/);
  assert.match(sql, /request_id uuid not null unique/);
  assert.match(sql, /token_hash = p_token_hash and w\.enabled/g);
  assert.match(sql, /'automation-drafts', 'automation-drafts', false, 8388608/);
});
