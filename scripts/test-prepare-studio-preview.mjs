import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { prepareStudioPreview } from "./prepare-studio-preview.mjs";

const scripts = path.dirname(fileURLToPath(import.meta.url));
async function fixture() {
  const parent = await fs.mkdtemp(path.join(os.tmpdir(), "studio-preview-test-"));
  const source = path.join(parent, "source");
  const write = async (relative, body = "fixture") => {
    const target = path.join(source, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, body);
  };
  for (const file of [
    "package-lock.json", "tsconfig.json", "middleware.ts", "next.config.ts",
    "lib/studio-library-manifest.json", "lib/studio-reports-snapshot.json",
    "public/models/index.json", "public/studio-print/newspaper-editorial-proof.pdf",
    "scripts/build-studio-library.mjs", "scripts/build-studio-reports.mjs",
    "scripts/validate-character-canon.mjs", "scripts/lib/validate-studio-library-snapshot.mjs",
    "app/page.tsx", "canon/MASTER-PROMPT.md", "canon/characters/dog/sheet.png",
    "canon/vision/studies/drew.png", "canon/showcase/index.json", "canon/plates/work/proposed.json",
    "cartoons/2026-01-01-example/cartoon.png", "cartoons/2026-01-01-example/meta.json",
    "briefs/a/plan.json", "public/studio-library/a.webp", "public/studio-library/a.thumb.webp",
    "public/gallery/final/A01-preview.jpg", "public/gallery/final/selected.jpg", "public/og.png",
    ".env.local", ".git/config", "node_modules/private/index.js", "app/.env.local",
    "scripts/test-secret.mjs", "lib/example.test.ts", "briefs/a/raw.png",
    "canon/plates/work/raw.png", "public/gallery/final/unselected.jpg", "public/screenshots/private.png",
  ]) await write(file);
  await write("package.json", JSON.stringify({ private: true, type: "module", scripts: { prebuild: "node scripts/prebuild.mjs", build: "node scripts/fixture-build.mjs" } }));
  await write("scripts/prebuild.mjs", 'if (process.env.STUDIO_ASSET_MODE !== "snapshot") throw Error("missing snapshot mode");');
  await write("scripts/fixture-build.mjs", 'if (process.env.STUDIO_ASSET_MODE !== "snapshot") throw Error("missing snapshot mode");');
  await write("scripts/build-studio-snapshot.mjs", await fs.readFile(path.join(scripts, "build-studio-snapshot.mjs")));
  await write("vercel.json", JSON.stringify({ framework: "nextjs", regions: ["iad1"], buildCommand: "old-build" }));
  const manifest = `${JSON.stringify([{ src: "/gallery/final/selected.jpg", caption: "Keep this reviewed metadata exactly." }], null, 2)}\n`;
  await write("lib/gallery-manifest.json", manifest);
  await write("public/gallery/manifest.json", manifest);
  return { parent, source, out: path.join(parent, "package"), write, manifest,
    cleanup: async () => {
      const resolved = await fs.realpath(parent);
      assert.equal(path.dirname(resolved), await fs.realpath(os.tmpdir()));
      assert.ok(path.basename(resolved).startsWith("studio-preview-test-"));
      await fs.rm(resolved, { recursive: true });
    },
  };
}

test("selective package preserves reviewed gallery and inventory; snapshot wrapper runs npm hooks", async () => {
  const f = await fixture();
  try {
    const dry = await prepareStudioPreview({ ...f, dryRun: true });
    assert.equal(dry.galleryImages, 2);
    await assert.rejects(fs.stat(f.out), { code: "ENOENT" });
    const result = await prepareStudioPreview(f);
    const inventory = JSON.parse(await fs.readFile(result.inventoryPath, "utf8"));
    assert.equal(path.dirname(result.inventoryPath), f.parent);
    assert.equal(inventory.files.reduce((sum, file) => sum + file.bytes, 0), result.bytes);
    for (const entry of inventory.files) {
      const content = await fs.readFile(path.join(f.out, entry.path));
      assert.equal(entry.sha256, createHash("sha256").update(content).digest("hex"));
    }
    assert.equal(await fs.readFile(path.join(f.out, "lib/gallery-manifest.json"), "utf8"), f.manifest);
    for (const entry of [".env.local", ".git", "node_modules", "app/.env.local", "scripts/test-secret.mjs", "lib/example.test.ts", "briefs/a/raw.png", "canon/plates/work/raw.png", "public/gallery/final/unselected.jpg", "public/screenshots"]) {
      await assert.rejects(fs.stat(path.join(f.out, entry)), { code: "ENOENT" });
    }
    for (const entry of ["canon/plates/work/proposed.json", "canon/characters/dog/sheet.png", "briefs/a/plan.json", "public/studio-library/a.webp"]) assert.ok((await fs.stat(path.join(f.out, entry))).isFile());
    assert.equal(JSON.parse(await fs.readFile(path.join(f.source, "vercel.json"), "utf8")).buildCommand, "old-build");
    const config = JSON.parse(await fs.readFile(path.join(f.out, "vercel.json"), "utf8"));
    assert.equal(config.buildCommand, "node scripts/build-studio-snapshot.mjs");
    assert.equal(config.public, false);
    assert.deepEqual(config.regions, ["iad1"]);
    const build = spawnSync(process.execPath, ["scripts/build-studio-snapshot.mjs"], { cwd: f.out, encoding: "utf8", timeout: 20_000 });
    assert.equal(build.status, 0, build.stderr || build.stdout);
  } finally { await f.cleanup(); }
});

test("existing destinations, inventories, nested output and manifest traversal are rejected before copying", async () => {
  const f = await fixture();
  try {
    await fs.mkdir(f.out);
    await fs.writeFile(path.join(f.out, "sentinel"), "preserve");
    await assert.rejects(prepareStudioPreview(f), /existing destination/);
    assert.equal(await fs.readFile(path.join(f.out, "sentinel"), "utf8"), "preserve");
    const newOut = path.join(f.parent, "new-package");
    await fs.writeFile(`${newOut}.inventory.json`, "preserve inventory");
    await assert.rejects(prepareStudioPreview({ ...f, out: newOut }), /inventory must both be nonexistent/);
    await assert.rejects(prepareStudioPreview({ ...f, out: path.join(f.source, "nested") }), /separate trees/);
    await f.write("lib/gallery-manifest.json", JSON.stringify([{ src: "/gallery/%2e%2e/.env.local" }]));
    const unsafeOut = path.join(f.parent, "unsafe-package");
    await assert.rejects(prepareStudioPreview({ ...f, out: unsafeOut }), /Unsafe gallery URL/);
    await assert.rejects(fs.stat(unsafeOut), { code: "ENOENT" });
  } finally { await f.cleanup(); }
});

test("missing referenced art and directory junctions are rejected before copying", async () => {
  const f = await fixture();
  try {
    await f.write("lib/gallery-manifest.json", JSON.stringify([{ src: "/gallery/missing.png" }]));
    await assert.rejects(prepareStudioPreview(f), /Missing required source file: public\/gallery\/missing.png/);
    await f.write("lib/gallery-manifest.json", f.manifest);
    const external = path.join(f.parent, "external");
    await fs.mkdir(external);
    await fs.symlink(external, path.join(f.source, "app", "linked"), process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(prepareStudioPreview(f), /Source links are not permitted/);
    await assert.rejects(fs.stat(f.out), { code: "ENOENT" });
  } finally { await f.cleanup(); }
});

test("the upload-size cap rejects a large selected asset without creating output", async () => {
  const f = await fixture();
  try {
    const handle = await fs.open(path.join(f.source, "public/gallery/final/selected.jpg"), "r+");
    try { await handle.truncate(1_000_000_000); } finally { await handle.close(); }
    await assert.rejects(prepareStudioPreview(f), /must stay below/);
    await assert.rejects(fs.stat(f.out), { code: "ENOENT" });
  } finally { await f.cleanup(); }
});
