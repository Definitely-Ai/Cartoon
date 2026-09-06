import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imageId = "a".repeat(64);
const input = { author: "Rick", body: "  Please review this shelf.  ", topic: "room", image_id: imageId };
const row = { id: "b093fe57-1d53-4498-a6da-1d61e7af4b90", created_at: "2026-09-03T20:00:00Z", author: "Rick", body: "Please review this shelf.", topic: "room", image_id: imageId };
function load({ fetch = async () => Response.json([]), env = { SUPABASE_URL: "https://studio.example", SUPABASE_SERVICE_KEY: "test-only-backend-key" }, signedIn = true } = {}) {
  const compile = (file, require) => {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(compiled, { module, exports: module.exports, require, fetch, Response, Request, AbortSignal, URL, URLSearchParams, Uint8Array, TextDecoder, process: { env }, Date });
    return module.exports;
  };
  const core = compile("lib/studio-notes-core.ts", () => { throw Error("Unexpected dependency"); });
  const service = compile("lib/studio-notes-server.ts", () => core);
  const route = compile("app/api/studio-notes/route.ts", (name) => {
    if (name === "next/headers") return { cookies: async () => ({ get: () => ({ value: "test-cookie" }) }) };
    if (name.endsWith("backroom-auth")) return { BACKROOM_COOKIE: "sd_backroom", isDoorOpen: async () => signedIn };
    if (name.endsWith("studio-notes-core")) return core;
    if (name.endsWith("studio-notes-server")) return service;
    if (name.endsWith("studio-library")) return { findLibraryImageById: (id) => id === imageId ? { id } : undefined };
    if (name.endsWith("studio-notes-images")) return { noteImages: () => [] };
    throw Error(`Unexpected dependency: ${name}`);
  });
  return { core, service, route };
}
function request(value, overrides = {}) {
  return new Request("https://studio.example/api/studio-notes", { method: "POST", headers: { Origin: "https://studio.example", "Content-Type": "application/json", ...overrides }, body: JSON.stringify(value) });
}

test("only signed-in same-origin validated notes reach the database", async () => {
  let calls = 0;
  const { route } = load({ fetch: async (_url, options) => { calls++; assert.equal(JSON.parse(options.body).body, "Please review this shelf."); return Response.json([row]); } });
  for (const invalid of [{ ...input, id: "injected" }, { ...input, author: "Someone else" }, { ...input, topic: "invalid" }, { ...input, body: " " }, { ...input, body: "x".repeat(4001) }, { ...input, image_id: "b".repeat(64) }]) {
    assert.equal((await route.POST(request(invalid))).status, 400);
  }
  assert.equal((await route.POST(request(input, { Origin: "https://elsewhere.example" }))).status, 403);
  assert.equal((await route.POST(request(input, { "Sec-Fetch-Site": "cross-site" }))).status, 403);
  assert.equal((await route.POST(request(input, { "Content-Type": "text/plain" }))).status, 415);
  assert.equal(calls, 0);
  const { route: locked } = load({ signedIn: false, fetch: async () => { throw Error("Must not query"); } });
  assert.equal((await locked.GET(new Request("https://studio.example/api/studio-notes"))).status, 401);
  assert.equal((await locked.POST(request(input))).status, 401);
  const response = await route.POST(request(input));
  assert.equal(response.status, 201);
  assert.equal((await response.json()).note.id, row.id);
  assert.equal(calls, 1);
});

test("actual streamed byte limit applies even without content-length", async () => {
  const { route } = load({ fetch: async () => { throw Error("Must not query"); } });
  assert.equal((await route.POST(request({ ...input, body: "😀".repeat(2400) }))).status, 413);
  assert.equal((await route.POST(new Request("https://studio.example/api/studio-notes", { method: "POST", headers: { Origin: "https://studio.example", "Content-Type": "application/json" }, body: "{" }))).status, 400);
});

test("GET uses bounded newest-first image filter and returns only selected columns", async () => {
  const { route } = load({ fetch: async (url, options) => {
    const parsed = new URL(url);
    assert.equal(parsed.pathname, "/rest/v1/studio_notes");
    assert.equal(parsed.searchParams.get("limit"), "100");
    assert.equal(parsed.searchParams.get("order"), "created_at.desc,id.desc");
    assert.equal(parsed.searchParams.get("image_id"), `eq.${imageId}`);
    assert.equal(options.cache, "no-store");
    assert.equal(options.headers.apikey, "test-only-backend-key");
    return Response.json([{ ...row, private_extra: "must be omitted" }]);
  } });
  const response = await route.GET(new Request(`https://studio.example/api/studio-notes?image=${imageId}`));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const result = await response.json();
  assert.equal(result.notes[0].imageId, imageId);
  assert.equal(result.notes[0].private_extra, undefined);
  assert.equal((await route.GET(new Request("https://studio.example/api/studio-notes?image=wrong"))).status, 400);
});

test("unconfigured and failed storage never expose credentials or report success", async () => {
  const unconfigured = load({ env: {}, fetch: async () => { throw Error("Must not query"); } });
  assert.equal((await unconfigured.route.GET(new Request("https://studio.example/api/studio-notes"))).status, 503);
  const failed = load({ fetch: async () => new Response("DATABASE_ERROR secret-key full SQL", { status: 500 }) });
  const response = await failed.route.POST(request(input));
  assert.equal(response.status, 503);
  const text = await response.text();
  assert.doesNotMatch(text, /secret-key|SQL|DATABASE_ERROR/);
  assert.match(text, /refresh/);
  const missingRepresentation = load({ fetch: async () => Response.json([]) });
  assert.equal((await missingRepresentation.route.POST(request(input))).status, 503);
});
