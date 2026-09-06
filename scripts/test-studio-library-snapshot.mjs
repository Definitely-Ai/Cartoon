import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { validateStudioLibrarySnapshot } from "./lib/validate-studio-library-snapshot.mjs";

async function fixture(run) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "studio-snapshot-test-"));
  const assets = path.join(root, "assets");
  const manifestFile = path.join(root, "manifest.json");
  try {
    await fs.mkdir(assets);
    const id = "a".repeat(64);
    const bytes = await sharp({ create: { width: 2, height: 3, channels: 3, background: "white" } }).webp().toBuffer();
    await fs.writeFile(path.join(assets, `${id}.webp`), bytes);
    await fs.writeFile(path.join(assets, `${id}.thumb.webp`), bytes);
    const manifest = { version: 1, generatedAt: "2026-09-03T19:00:00.000Z", summary: { uniqueImages: 1, duplicateCopies: 0, viewingBytes: bytes.length * 2 }, items: [{ id, origins: [{ source: "project", path: "unavailable-original.png" }], imageUrl: `/studio-library/${id}.webp`, thumbnailUrl: `/studio-library/${id}.thumb.webp`, viewingBytes: bytes.length, thumbnailBytes: bytes.length, viewingWidth: 2, viewingHeight: 3 }] };
    await fs.writeFile(manifestFile, JSON.stringify(manifest));
    await run({ assets, manifestFile, manifest, id });
  } finally {
    // Only this test's newly created, resolved temporary fixture is removed.
    const resolved = path.resolve(root);
    assert(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith("studio-snapshot-test-"));
    await fs.rm(resolved, { recursive: true, force: true });
  }
}

test("snapshot works without originals and leaves the inventory bytes and timestamp unchanged", async () => fixture(async ({ assets, manifestFile }) => {
  const before = await fs.readFile(manifestFile);
  const result = await validateStudioLibrarySnapshot(manifestFile, assets);
  assert.equal(result.images, 1);
  assert.equal(result.generatedAt, "2026-09-03T19:00:00.000Z");
  assert.deepEqual(await fs.readFile(manifestFile), before);
}));
test("missing thumbnail fails closed", async () => fixture(async ({ assets, manifestFile, id }) => {
  await fs.unlink(path.join(assets, `${id}.thumb.webp`));
  await assert.rejects(validateStudioLibrarySnapshot(manifestFile, assets), /required asset is missing/);
}));
test("altered image dimensions fail closed", async () => fixture(async ({ assets, manifestFile, manifest }) => {
  manifest.items[0].viewingWidth = 99;
  await fs.writeFile(manifestFile, JSON.stringify(manifest));
  await assert.rejects(validateStudioLibrarySnapshot(manifestFile, assets), /dimensions do not match/);
}));
test("malformed asset URLs fail closed", async () => fixture(async ({ assets, manifestFile, manifest }) => {
  manifest.items[0].imageUrl = "/../../private.png";
  await fs.writeFile(manifestFile, JSON.stringify(manifest));
  await assert.rejects(validateStudioLibrarySnapshot(manifestFile, assets), /unsafe asset URL/);
}));
test("truncated viewing files fail closed", async () => fixture(async ({ assets, manifestFile, id }) => {
  await fs.writeFile(path.join(assets, `${id}.webp`), "truncated");
  await assert.rejects(validateStudioLibrarySnapshot(manifestFile, assets), /size does not match/);
}));
