import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const instant = "2026-09-14T14:00:00.000Z";
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [instant])); }
  static now() { return Date.parse(instant); }
}
const input = {
  location: { name: " Naples ", region: "Florida", country: "US", timezone: "America/New_York", coverage: "city" },
  audience: " Retirees who enjoy warm, nonpartisan local financial humor. ",
  quantity: 6, cast: "mixed",
  timing: { mode: "weekly", date: "2026-09-15", time: "09:00", weekdays: [5, 1, 1] },
};
const apiUrl = "https://studio.example/api/gallery/automation";
const env = { SUPABASE_URL: "https://database.example", SUPABASE_SERVICE_KEY: "test-only-server-secret" };

// Every request is a stub. These tests never read real environment credentials or
// call global fetch, even if the developer's machine has a configured database.
function load({ fetch = async () => { throw Error("Unexpected database request"); }, environment = env, signedIn = true } = {}) {
  const compile = (file, require) => {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(compiled, {
      module, exports: module.exports, require, fetch, Response, Request, AbortSignal,
      URL, URLSearchParams, Uint8Array, TextDecoder, Intl, Date: FixedDate, process: { env: environment },
    });
    return module.exports;
  };
  const core = compile("lib/automation-studio-core.ts", name => { throw Error(`Unexpected core import ${name}`); });
  const service = compile("lib/automation-studio-server.ts", name => {
    if (name === "server-only") return {};
    if (name === "node:crypto") return { createHash };
    if (name === "./automation-studio-core") return core;
    throw Error(`Unexpected server import ${name}`);
  });
  const route = compile("app/api/gallery/automation/route.ts", name => {
    if (name === "next/headers") return { cookies: async () => ({ get: () => ({ value: "stub-cookie" }) }) };
    if (name.endsWith("backroom-auth")) return { BACKROOM_COOKIE: "sd_backroom", isDoorOpen: async () => signedIn };
    if (name.endsWith("automation-studio-core")) return core;
    if (name.endsWith("automation-studio-server")) return service;
    throw Error(`Unexpected route import ${name}`);
  });
  return { core, service, route };
}

function request(value = input, headers = {}) {
  return new Request(apiUrl, { method: "POST", headers: { Origin: "https://studio.example", "Content-Type": "application/json", ...headers }, body: JSON.stringify(value) });
}
function storedRow(core, value = input, createdAt = instant, status = "planned") {
  const normalized = core.validateEditionInput(value, new FixedDate(createdAt));
  return {
    id: createHash("sha256").update(JSON.stringify(normalized)).digest("hex"),
    created_at: createdAt, updated_at: createdAt, status, input: normalized,
  };
}

test("GET and POST explicitly require the door cookie before touching storage", async () => {
  let calls = 0;
  const { route } = load({ signedIn: false, fetch: async () => { calls++; throw Error("Unauthorized query"); } });
  for (const response of [await route.GET(), await route.POST(request())]) {
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(response.headers.get("vary"), "Cookie");
    assert.equal((await response.json()).workerConnected, false);
  }
  assert.equal(calls, 0);
});

test("invalid form, cross-origin, non-JSON and oversized requests cannot save", async () => {
  let calls = 0;
  const { route } = load({ fetch: async () => { calls++; throw Error("Invalid input reached database"); } });
  for (const value of [{ ...input, dispatch: true }, { ...input, quantity: 0 }, { ...input, quantity: 13 }, { ...input, status: "active" }, { ...input, audience: " " }]) {
    assert.equal((await route.POST(request(value))).status, 400);
  }
  assert.equal((await route.POST(request(input, { Origin: "https://attacker.example" }))).status, 403);
  assert.equal((await route.POST(request(input, { "Content-Type": "text/plain" }))).status, 415);
  assert.equal((await route.POST(request(input, { "Content-Length": "13000" }))).status, 413);
  assert.equal((await route.POST(request({ ...input, audience: "😀".repeat(4000) }))).status, 413);
  assert.equal((await route.POST(new Request(apiUrl, { method: "POST", headers: { Origin: "https://studio.example", "Content-Type": "application/json" }, body: "{" }))).status, 400);
  assert.equal(calls, 0);
});

test("save inserts a normalized content-addressed planned row then confirms it by exact id", async () => {
  let row;
  const calls = [];
  const { core, route } = load({ fetch: async (url, options) => {
    calls.push(options.method);
    const parsed = new URL(url);
    assert.equal(parsed.pathname, "/rest/v1/automation_edition_plans");
    assert.equal(options.cache, "no-store");
    assert.equal(options.redirect, "error");
    assert.equal(options.headers.apikey, env.SUPABASE_SERVICE_KEY);
    assert.equal(options.headers.Authorization, `Bearer ${env.SUPABASE_SERVICE_KEY}`);
    if (options.method === "POST") {
      assert.equal(parsed.searchParams.get("on_conflict"), "id");
      assert.equal(options.headers.Prefer, "resolution=ignore-duplicates,return=minimal");
      row = JSON.parse(options.body);
      assert.equal(row.status, "planned");
      assert.equal(row.created_at, instant);
      assert.equal(row.updated_at, instant);
      assert.deepEqual(row, JSON.parse(JSON.stringify(storedRow(core))));
      return new Response(null, { status: 201 });
    }
    assert.equal(parsed.searchParams.get("id"), `eq.${row.id}`);
    assert.equal(parsed.searchParams.get("limit"), "2");
    assert.equal(parsed.searchParams.get("select"), "id,created_at,updated_at,status,input");
    return Response.json([row]);
  } });
  const response = await route.POST(request());
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.workerConnected, false);
  assert.equal(result.plan.id, row.id);
  assert.equal(result.plan.input.location.name, "Naples");
  assert.deepEqual(result.plan.input.timing.weekdays, [1, 5]);
  assert.deepEqual(calls, ["POST", "GET"]);
  assert.doesNotMatch(JSON.stringify(result), /test-only-server-secret|apikey|Authorization|created_at/);
});

test("parallel and reordered equivalent submissions reuse one row without updating it", async () => {
  const database = new Map();
  let writes = 0;
  const { route } = load({ fetch: async (url, options) => {
    if (options.method === "POST") {
      const row = JSON.parse(options.body);
      assert.match(options.headers.Prefer, /resolution=ignore-duplicates/);
      if (!database.has(row.id)) { database.set(row.id, row); writes++; }
      return new Response(null, { status: 201 });
    }
    const id = new URL(url).searchParams.get("id").slice(3);
    return Response.json(database.has(id) ? [database.get(id)] : []);
  } });
  const equivalent = { timing: { weekdays: [1, 5], time: "09:00", date: "2026-09-15", mode: "weekly" }, cast: input.cast, quantity: input.quantity, audience: input.audience.trim(), location: { ...input.location, name: "Naples" } };
  const results = await Promise.all([route.POST(request(input)), route.POST(request(equivalent))]);
  const first = await results[0].json();
  const second = await results[1].json();
  assert.equal(results[0].status, 200);
  assert.equal(results[1].status, 200);
  assert.equal(first.plan.id, second.plan.id);
  assert.equal(writes, 1);
  assert.equal(database.size, 1);
});

test("a duplicate archived plan is returned without reactivating it", async () => {
  const { core, route } = load({ fetch: async (_url, options) => options.method === "POST"
    ? new Response(null, { status: 201 })
    : Response.json([storedRow(core, input, instant, "archived")]) });
  const response = await route.POST(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).plan.status, "archived");
});

test("GET reads historical plans against their creation date, bounds results and omits extra fields", async () => {
  const historical = { ...input, timing: { mode: "once", date: "2026-09-13", time: "12:00", weekdays: [] } };
  const { core, route } = load({ fetch: async (url, options) => {
    const parsed = new URL(url);
    assert.equal(options.method, "GET");
    assert.equal(parsed.searchParams.get("limit"), "100");
    assert.equal(parsed.searchParams.get("order"), "created_at.desc,id.desc");
    assert.equal(parsed.searchParams.get("select"), "id,created_at,updated_at,status,input");
    return Response.json([{ ...storedRow(core, historical, "2026-09-12T12:00:00.000Z"), service_key: "never-serialize-this" }]);
  } });
  const response = await route.GET();
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.checkedAt, instant);
  assert.equal(result.workerConnected, false);
  assert.equal(result.plans[0].input.timing.date, "2026-09-13");
  assert.equal(result.plans[0].service_key, undefined);
  assert.doesNotMatch(JSON.stringify(result), /never-serialize-this|test-only-server-secret/);
});

test("unconfigured, redacted, public-key or unsafe URL configuration fails closed before fetch", async () => {
  for (const environment of [{}, { ...env, SUPABASE_SERVICE_KEY: "[SENSITIVE]" }, { ...env, SUPABASE_URL: "[REDACTED]" }, { ...env, SUPABASE_SERVICE_KEY: "sb_publishable_not-server" }, { ...env, SUPABASE_URL: "http://database.example" }, { ...env, SUPABASE_URL: "https://user:password@database.example" }, { ...env, SUPABASE_URL: "https://database.example/?secret=yes" }]) {
    let calls = 0;
    const { route } = load({ environment, fetch: async () => { calls++; throw Error("Must not fetch"); } });
    for (const response of [await route.GET(), await route.POST(request())]) {
      assert.equal(response.status, 503);
      const body = await response.text();
      assert.match(body, /draft/);
      assert.doesNotMatch(body, /test-only-server-secret|password|database\.example|SENSITIVE|REDACTED/);
    }
    assert.equal(calls, 0);
  }
});

test("new secret API keys stay only in apikey, never Bearer or response data", async () => {
  const { route } = load({ environment: { ...env, SUPABASE_SERVICE_KEY: "sb_secret_only-a-stub" }, fetch: async (_url, options) => {
    assert.equal(options.headers.apikey, "sb_secret_only-a-stub");
    assert.equal(options.headers.Authorization, undefined);
    return Response.json([]);
  } });
  const response = await route.GET();
  assert.equal(response.status, 200);
  assert.doesNotMatch(await response.text(), /sb_secret_only-a-stub/);
});

test("failed, missing-table or paused-project replies never expose upstream errors", async () => {
  for (const fetch of [async () => { throw Error("Timeout secret-key"); }, async () => new Response("DATABASE_ERROR secret-key SQL", { status: 500 }), async () => new Response("No table secret-key", { status: 404 }), async () => new Response("Paused secret-key", { status: 503 }), async () => new Response(null, { status: 302, headers: { Location: "https://attacker.example" } })]) {
    const { route } = load({ fetch });
    for (const response of [await route.GET(), await route.POST(request())]) {
      assert.equal(response.status, 503);
      assert.doesNotMatch(await response.text(), /DATABASE_ERROR|secret-key|SQL|attacker/);
    }
  }
});

test("write success alone is insufficient: missing, extra or mismatched read-back rows fail confirmation", async () => {
  for (const rows of [() => [], (core) => [storedRow(core), storedRow(core)], (core) => [{ ...storedRow(core), id: "f".repeat(64) }]]) {
    const { core, route } = load({ fetch: async (_url, options) => options.method === "POST" ? new Response(null, { status: 201 }) : Response.json(rows(core)) });
    const response = await route.POST(request());
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /could not confirm/);
  }
});

test("invalid, changed or duplicate stored rows fail closed instead of presenting trusted plans", async () => {
  for (const rows of [() => null, () => ({}), () => Array(101).fill({}), core => [{ ...storedRow(core), status: "active" }], core => [{ ...storedRow(core), created_at: "bad" }], core => [{ ...storedRow(core), updated_at: "2020-01-01T00:00:00Z" }], core => [{ ...storedRow(core), input: { ...input, publish: true } }], core => [{ ...storedRow(core), id: "a".repeat(64) }], core => [storedRow(core), storedRow(core)]]) {
    const { core, route } = load({ fetch: async () => Response.json(rows(core)) });
    assert.equal((await route.GET()).status, 503);
  }
});

test("SQL and route keep storage server-only with no worker or schedule dispatch", () => {
  const sql = fs.readFileSync(path.join(root, "docs/sql/automation-studio.sql"), "utf8");
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /force row level security/i);
  assert.match(sql, /revoke all on table public\.automation_edition_plans from public, anon, authenticated, service_role/i);
  assert.match(sql, /grant select, insert, update on table public\.automation_edition_plans to service_role/i);
  assert.doesNotMatch(sql, /grant[^;]*to (?:public|anon|authenticated)\s*;/i);
  assert.doesNotMatch(sql, /create\s+(?:or replace\s+)?(?:function|trigger)|cron\.schedule/i);
  const source = fs.readFileSync(path.join(root, "lib/automation-studio-server.ts"), "utf8");
  assert.match(source, /import "server-only"/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_|child_process|spawn\(|exec\(|127\.0\.0\.1:8188/);
  const route = fs.readFileSync(path.join(root, "app/api/gallery/automation/route.ts"), "utf8");
  assert.equal((route.match(/if \(!await signedIn\(\)\)/g) ?? []).length, 2);
  assert.doesNotMatch(route, /export async function (?:PATCH|DELETE|PUT)|workerConnected:\s*true/);
});
