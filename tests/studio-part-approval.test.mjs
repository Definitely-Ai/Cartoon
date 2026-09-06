import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { approveLocalPart, assertLocalApprovalRequest, normalizedManifestHash, localPartApprovalsEnabled, PartApprovalError } from "../lib/studio-part-approval.ts";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const enabled = { STUDIO_ENABLE_LOCAL_PART_APPROVALS: "1" };
const request = (url = "http://127.0.0.1:3100/api/room/approve", changes = {}) => new Request(url, { method: "POST", headers: { host: new URL(url).host, origin: new URL(url).origin, ...changes } });
const rejectsStatus = (operation, status) => assert.rejects(operation, (error) => error instanceof PartApprovalError && error.status === status);
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "studio-part-approval-test-"));
  t.after(async () => {
    const resolved = await fs.realpath(root);
    const parent = await fs.realpath(os.tmpdir());
    assert.equal(path.dirname(resolved).toLowerCase(), parent.toLowerCase());
    assert.ok(path.basename(resolved).startsWith("studio-part-approval-test-"));
    await fs.rm(resolved, { recursive: true, force: true });
  });
  const work = path.join(root, "canon/plates/work");
  const parts = path.join(root, "canon/plates/parts");
  await fs.mkdir(work, { recursive: true }); await fs.mkdir(parts);
  await fs.mkdir(path.join(root, "canon/plates/base"));
  const old = await sharp({ create: { width: 64, height: 96, channels: 3, background: "white" } }).png().toBuffer();
  const candidate = await sharp({ create: { width: 64, height: 96, channels: 3, background: "gray" } }).png().toBuffer();
  const destination = path.join(parts, "shelf-top.png");
  await fs.writeFile(destination, old);
  await fs.writeFile(path.join(work, "candidate.png"), candidate);
  await fs.writeFile(path.join(root, "canon/plates/base/base.png"), old);
  const manifest = { plate: { base: "canon/plates/base/base.png", width: 1200, height: 1800 }, lighting: { prompt: "keep this" }, parts: [{ id: "shelf-top", mode: "image", source: "canon/plates/parts/previous.png", enabled: false, outline: [[1, 2], [3, 4], [5, 6]] }, { id: "sign", mode: "code", enabled: true }] };
  const manifestFile = path.join(root, "canon/plates/parts.json");
  const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 4));
  await fs.writeFile(manifestFile, manifestBytes);
  const id = digest(candidate);
  const input = { repoRoot: root, partId: "shelf-top", candidateId: id, expectedManifestHash: normalizedManifestHash(manifest), libraryItem: { id, origins: [{ source: "project", path: "canon/plates/work/candidate.png" }] } };
  return { root, old, candidate, destination, manifest, manifestFile, manifestBytes, input, work };
}
async function unchanged(f) {
  assert.deepEqual(await fs.readFile(f.destination), f.old);
  assert.deepEqual(await fs.readFile(f.manifestFile), f.manifestBytes);
}

test("HTTP gate defaults off, rejects hosted, unsigned, remote and cross-origin requests", () => {
  assert.equal(localPartApprovalsEnabled({}), false);
  for (const env of [{}, { ...enabled, VERCEL: "1" }, { ...enabled, VERCEL_ENV: "production" }]) assert.throws(() => assertLocalApprovalRequest(request(), true, env), { status: 403 });
  assert.throws(() => assertLocalApprovalRequest(request(), false, enabled), { status: 401 });
  assert.throws(() => assertLocalApprovalRequest(request("https://studio.example/api/room/approve"), true, enabled), { status: 403 });
  for (const headers of [{ origin: "http://other.example" }, { host: "localhost:3100" }, { forwarded: "for=127.0.0.1" }, { "x-forwarded-for": "192.168.1.4" }, { "x-forwarded-for": "127.0.0.1, 192.168.1.4" }, { "sec-fetch-site": "cross-site" }]) assert.throws(() => assertLocalApprovalRequest(request(undefined, headers), true, enabled), { status: 403 });
  assert.doesNotThrow(() => assertLocalApprovalRequest(request(), true, enabled));
});
test("explicit approval copies exact PNG bytes and changes only one source; resizing is a warning", async (t) => {
  const f = await fixture(t);
  const result = await approveLocalPart(f.input);
  assert.deepEqual(await fs.readFile(f.destination), f.candidate);
  const expected = structuredClone(f.manifest); expected.parts[0].source = "canon/plates/parts/shelf-top.png";
  assert.deepEqual(JSON.parse(await fs.readFile(f.manifestFile, "utf8")), expected);
  assert.equal(result.manifestHash, normalizedManifestHash(expected)); assert.equal(result.rebuildRequired, true);
  assert.match(result.sizeWarning, /64 × 96.*1200 × 1800/);
  assert.deepEqual(await fs.readFile(path.join(f.root, "canon/plates/base/base.png")), f.old);
  assert.deepEqual((await fs.readdir(path.dirname(f.manifestFile))).sort(), ["base", "parts", "parts.json", "work"]);
});
test("stale manifest and changed candidate identities fail without mutation", async (t) => {
  const f = await fixture(t);
  await rejectsStatus(() => approveLocalPart({ ...f.input, expectedManifestHash: "0".repeat(64) }), 409);
  await fs.writeFile(path.join(f.work, "candidate.png"), f.old);
  await rejectsStatus(() => approveLocalPart(f.input), 409);
  await unchanged(f);
});
test("unknown parts, lettering, room-kit and traversal candidates are ineligible", async (t) => {
  const f = await fixture(t);
  for (const partId of ["base", "sign", "../shelf-top"]) await rejectsStatus(() => approveLocalPart({ ...f.input, partId }), 400);
  for (const candidatePath of ["canon/room-kit/v2/candidate.png", "canon/plates/work/../parts/shelf-top.png"]) await rejectsStatus(() => approveLocalPart({ ...f.input, libraryItem: { ...f.input.libraryItem, origins: [{ source: "project", path: candidatePath }] } }), 400);
  await unchanged(f);
});
test("junction and symbolic-link paths are refused", async (t) => {
  const f = await fixture(t);
  const target = path.join(f.root, "canon/plates/parts");
  const link = path.join(f.work, "linked");
  await fs.symlink(target, link, process.platform === "win32" ? "junction" : "dir");
  await rejectsStatus(() => approveLocalPart({ ...f.input, libraryItem: { ...f.input.libraryItem, origins: [{ source: "project", path: "canon/plates/work/linked/shelf-top.png" }] } }), 400);
  await unchanged(f);
});
test("invalid image content cannot be saved even with a matching catalog hash", async (t) => {
  const f = await fixture(t);
  const broken = Buffer.from("not a PNG image");
  await fs.writeFile(path.join(f.work, "candidate.png"), broken);
  const id = digest(broken);
  await rejectsStatus(() => approveLocalPart({ ...f.input, candidateId: id, libraryItem: { ...f.input.libraryItem, id } }), 400);
  await unchanged(f);
});
test("manifest commit failure restores the previous part and releases the lock", async (t) => {
  const f = await fixture(t);
  const io = { rename: async (from, to) => { if (to === f.manifestFile) throw new Error("Fixture commit failure"); await fs.rename(from, to); } };
  await rejectsStatus(() => approveLocalPart(f.input, io), 500);
  await unchanged(f);
  assert.deepEqual((await fs.readdir(path.dirname(f.manifestFile))).sort(), ["base", "parts", "parts.json", "work"]);
});
test("concurrent approvals serialize and the second rejects the now-stale manifest", async (t) => {
  const f = await fixture(t);
  const results = await Promise.allSettled([approveLocalPart(f.input), approveLocalPart(f.input)]);
  assert.equal(results[0].status, "fulfilled");
  assert.equal(results[1].status, "rejected"); assert.equal(results[1].reason.status, 409);
});
test("an existing process lock is not silently removed", async (t) => {
  const f = await fixture(t);
  const lock = path.join(f.root, "canon/plates/.studio-part-approval.lock"); await fs.writeFile(lock, "other process");
  await rejectsStatus(() => approveLocalPart(f.input), 409);
  assert.equal(await fs.readFile(lock, "utf8"), "other process"); await unchanged(f);
});
