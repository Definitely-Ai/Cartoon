import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import ts from "typescript";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await fs.readFile(path.join(repo, "lib/studio-library-manifest.json"), "utf8"));
const seenIds = new Set();
const seenOrigins = new Set();
let viewingBytes = 0;
for (const item of manifest.items) {
  assert.match(item.id, /^[a-f0-9]{64}$/);
  assert(!seenIds.has(item.id), `Duplicate image id: ${item.id}`);
  seenIds.add(item.id);
  assert(item.origins.length > 0);
  for (const origin of item.origins) {
    assert(!path.isAbsolute(origin.path) && !/^[A-Z]:/i.test(origin.path) && !origin.path.split(/[\\/]/).includes(".."), `Unsafe origin: ${origin.path}`);
    const key = `${origin.source}:${origin.path}`;
    assert(!seenOrigins.has(key), `Source included twice: ${key}`);
    seenOrigins.add(key);
  }
  for (const [suffix, recordedBytes] of [[".webp", item.viewingBytes], [".thumb.webp", item.thumbnailBytes]]) {
    const file = path.join(repo, "public/studio-library", `${item.id}${suffix}`);
    const stat = await fs.stat(file);
    assert.equal(stat.size, recordedBytes, `Incorrect asset size: ${file}`);
    viewingBytes += stat.size;
  }
  assert.equal(item.imageUrl, `/studio-library/${item.id}.webp`);
  assert.equal(item.thumbnailUrl, `/studio-library/${item.id}.thumb.webp`);
  assert(item.viewingWidth > 0 && item.viewingHeight > 0 && Math.max(item.viewingWidth, item.viewingHeight) <= 1600);
  assert(item.characters.every((name) => ["Drew", "Barclay", "Abby"].includes(name)));
}
assert.equal(manifest.summary.uniqueImages, manifest.items.length);
assert.equal(manifest.summary.duplicateCopies, seenOrigins.size - seenIds.size);
assert.equal(manifest.summary.viewingBytes, viewingBytes);
assert(!JSON.stringify(manifest).match(/(?:[C-Z]:[\\/]|Users[\\/]admin)/i), "Manifest must not disclose absolute machine paths");
assert.equal(manifest.summary.sourceFiles, manifest.coverage.reduce((total, source) => total + source.files, 0));
const assetNames = await fs.readdir(path.join(repo, "public/studio-library"));
assert.equal(assetNames.filter((name) => /\.webp$/.test(name)).length, manifest.items.length * 2, "Unreferenced assets remain");
// Decode a spread of first/last and very large originals to check the review
// pipeline's promised aspect ratio and actual dimensions, not only JSON counts.
const samples = [manifest.items[0], manifest.items.at(-1), ...[...manifest.items].sort((a, b) => b.bytes - a.bytes).slice(0, 8)];
for (const item of samples) {
  const metadata = await sharp(path.join(repo, "public/studio-library", `${item.id}.webp`)).metadata();
  assert.equal(metadata.width, item.viewingWidth);
  assert.equal(metadata.height, item.viewingHeight);
  assert(Math.abs(item.width / item.height - metadata.width / metadata.height) < .01, `Aspect ratio changed: ${item.title}`);
}
// Exercise the actual server-side original resolver without launching Next.
// Type-only imports disappear; the resolver itself depends only on Node APIs.
const originalResolverSource = await fs.readFile(path.join(repo, "lib/studio-library-files.ts"), "utf8");
const compiledResolver = ts.transpileModule(originalResolverSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { readLibraryOriginal } = await import(`data:text/javascript;base64,${Buffer.from(compiledResolver).toString("base64")}`);
const localSample = manifest.items.find((item) => item.origins.some((origin) => origin.source === "project"));
assert(localSample);
const originalBytes = await readLibraryOriginal(localSample);
assert(originalBytes && originalBytes.length === localSample.bytes, "Exact original must remain accessible locally");
assert.equal(await readLibraryOriginal({ ...localSample, id: "0".repeat(64) }), null, "Changed source contents must fail the hash check");
for (const unsafePath of ["../package.json", "..\\package.json", "/etc/passwd", "C:/Windows/win.ini"]) {
  assert.equal(await readLibraryOriginal({ ...localSample, origins: [{ source: "project", label: "Test", path: unsafePath }] }), null, `Unsafe source path must be rejected: ${unsafePath}`);
}
assert.equal(await readLibraryOriginal({ ...localSample, origins: [{ source: "unknown", label: "Test", path: "package.json" }] }), null);
console.log(`Library verified: ${seenIds.size} unique images, ${seenOrigins.size} source locations, ${assetNames.length} viewing assets, ${(viewingBytes / 1048576).toFixed(1)} MB. IDs, paths, provenance, byte counts, dimensions and decoded sample images passed.`);
console.log("Original-file security verified: exact local source, content mismatch, path traversal, absolute paths and unknown source rejection.");
