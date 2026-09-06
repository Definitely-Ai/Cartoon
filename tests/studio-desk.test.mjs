import test from "node:test";
import assert from "node:assert/strict";
import { DeskError, readDeskRequest, summarizeDecision, validateDecisionInput } from "../lib/studio-desk-core.ts";

const good = () => ({
  author: "Rick",
  layout: { counter: { dx: 12, dy: -4, visible: true, version: "v009" }, tv: { dx: 0, dy: 0, visible: false, version: null } },
  notes: { counter: "The lip reads too thin.", _all: "Try this arrangement tonight." },
  approvals: { counter: { state: "needs-work", author: "Rick", at: "2026-09-05T18:00:00.000Z" } },
  status: "sent",
});
const rejects = (value, status) => assert.throws(() => validateDecisionInput(value), (error) => error instanceof DeskError && error.status === status);
const post = (body, headers = {}) => new Request("https://studio.test/api/desk/decisions", {
  method: "POST",
  headers: { origin: "https://studio.test", "content-type": "application/json", ...headers },
  body: JSON.stringify(body),
});

test("a complete decision keeps every field it should", () => {
  const decision = validateDecisionInput(good());
  assert.equal(decision.author, "Rick");
  assert.deepEqual(decision.layout.counter, { dx: 12, dy: -4, visible: true, version: "v009" });
  assert.equal(decision.layout.tv.version, null);
  assert.equal(decision.notes.counter, "The lip reads too thin.");
  assert.equal(decision.approvals.counter.state, "needs-work");
  assert.equal(decision.status, "sent");
});

test("a decision must carry a name, layers and a recognisable verdict", () => {
  rejects({ ...good(), author: "Somebody" }, 400);
  rejects({ ...good(), layout: {} }, 400);
  rejects({ ...good(), layout: { "../escape": { dx: 0, dy: 0, visible: true, version: null } } }, 400);
  rejects({ ...good(), layout: { counter: { dx: 99999, dy: 0, visible: true, version: null } } }, 400);
  rejects({ ...good(), layout: { counter: { dx: 0, dy: 0, visible: true, version: "../../etc/passwd" } } }, 400);
  rejects({ ...good(), layout: { counter: { dx: 0, dy: 0, version: null } } }, 400);
  rejects({ ...good(), approvals: { counter: { state: "brilliant", author: "Rick" } } }, 400);
  rejects({ ...good(), approvals: { counter: { state: "approved", author: "Nobody" } } }, 400);
  rejects({ ...good(), notes: { counter: "x".repeat(2001) } }, 400);
  rejects({ ...good(), extra: true }, 400);
});

test("only the studio machine can mark a decision received or applied", () => {
  rejects({ ...good(), status: "applied" }, 400);
  assert.equal(validateDecisionInput({ ...good(), status: undefined }).status, "sent");
});

test("an empty note is dropped rather than stored", () => {
  const decision = validateDecisionInput({ ...good(), notes: { counter: "   ", _all: " keep me " } });
  assert.equal("counter" in decision.notes, false);
  assert.equal(decision.notes._all, "keep me");
});

test("a decision is only read from a same-origin JSON request", async () => {
  assert.deepEqual(await readDeskRequest(post(good())), good());
  await assert.rejects(readDeskRequest(post(good(), { origin: "https://elsewhere.test" })), (error) => error.status === 403);
  await assert.rejects(readDeskRequest(post(good(), { "sec-fetch-site": "cross-site" })), (error) => error.status === 403);
  await assert.rejects(readDeskRequest(post(good(), { "content-type": "text/plain" })), (error) => error.status === 415);
  await assert.rejects(readDeskRequest(post(good()), 40), (error) => error.status === 413);
});

test("the summary says what changed, in words", () => {
  const summary = summarizeDecision({ id: "x", createdAt: new Date().toISOString(), ...validateDecisionInput(good()) });
  assert.match(summary, /2 layers/);
  assert.match(summary, /1 moved/);
  assert.match(summary, /1 version swap/);
  assert.match(summary, /1 hidden/);
  assert.match(summary, /1 needing work/);
});
