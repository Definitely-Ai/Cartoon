import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/** Validate a portable inventory without reading or changing any originals. */
export async function validateStudioLibrarySnapshot(manifestFile, assetsDirectory) {
  const manifest = JSON.parse(await fs.readFile(manifestFile, "utf8"));
  const fail = (message) => { throw new Error(`studio-library snapshot: ${message}`); };
  if (manifest.version !== 1 || !Array.isArray(manifest.items) || !manifest.summary) fail("missing or unsupported inventory");
  if (typeof manifest.generatedAt !== "string" || !Number.isFinite(Date.parse(manifest.generatedAt))) fail("invalid inventory timestamp");
  if (manifest.summary.uniqueImages !== manifest.items.length) fail("image count does not match inventory");
  const root = await fs.realpath(assetsDirectory);
  const ids = new Set();
  const origins = new Set();
  let totalBytes = 0;
  for (const item of manifest.items) {
    if (!/^[a-f0-9]{64}$/.test(item.id) || ids.has(item.id)) fail(`invalid or duplicate image id: ${String(item.id)}`);
    ids.add(item.id);
    if (!Array.isArray(item.origins) || !item.origins.length) fail(`missing provenance for ${item.id}`);
    for (const origin of item.origins) {
      if (typeof origin.path !== "string" || path.isAbsolute(origin.path) || /^[a-z]:/i.test(origin.path) || origin.path.split(/[\\/]/).includes("..")) fail(`unsafe origin for ${item.id}`);
      const key = `${origin.source}:${origin.path}`;
      if (origins.has(key)) fail(`duplicate source location: ${key}`);
      origins.add(key);
    }
    if (item.imageUrl !== `/studio-library/${item.id}.webp` || item.thumbnailUrl !== `/studio-library/${item.id}.thumb.webp`) fail(`unsafe asset URL for ${item.id}`);
    for (const [suffix, recordedBytes, maxDimension] of [[".webp", item.viewingBytes, 1600], [".thumb.webp", item.thumbnailBytes, 520]]) {
      const filename = `${item.id}${suffix}`;
      let file;
      try { file = await fs.realpath(path.join(root, filename)); } catch { fail(`required asset is missing: ${filename}`); }
      const relative = path.relative(root, file);
      if (!relative || relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) fail(`asset escapes snapshot directory: ${filename}`);
      const stat = await fs.stat(file);
      if (!stat.isFile() || stat.size !== recordedBytes || !recordedBytes) fail(`asset size does not match inventory: ${filename}`);
      // Reading bytes first closes the file handle promptly on Windows; libvips
      // must not retain a source handle while a deployment copy is assembled.
      const metadata = await sharp(await fs.readFile(file)).metadata();
      if (metadata.format !== "webp" || !metadata.width || !metadata.height || Math.max(metadata.width, metadata.height) > maxDimension) fail(`invalid viewing image: ${filename}`);
      if (suffix === ".webp" && (metadata.width !== item.viewingWidth || metadata.height !== item.viewingHeight)) fail(`viewing dimensions do not match inventory: ${filename}`);
      totalBytes += stat.size;
    }
  }
  if (manifest.summary.duplicateCopies !== origins.size - ids.size) fail("duplicate count does not match source locations");
  if (manifest.summary.viewingBytes !== totalBytes) fail("viewing byte total does not match inventory");
  return { generatedAt: manifest.generatedAt, images: ids.size, sourceLocations: origins.size, viewingBytes: totalBytes };
}
