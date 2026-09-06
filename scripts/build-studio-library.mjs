/**
 * Inventory every image in the known studio sources without modifying originals.
 * Run locally with `node scripts/build-studio-library.mjs`. Package the manifest
 * and public/studio-library for a private deployment; do not add private artwork
 * to a public Git repository. STUDIO_ASSET_MODE=snapshot validates that package
 * and preserves it byte-for-byte without walking local originals.
 * Missing external drives retain their last imported snapshot; missing files in
 * an available source are reported, never restored from Git.
 */
import fs from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { validateStudioLibrarySnapshot } from "./lib/validate-studio-library-snapshot.mjs";
import { createLibraryCastResolver } from "./lib/studio-library-cast.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(repo, "public", "studio-library");
const manifestFile = path.join(repo, "lib", "studio-library-manifest.json");
const assetMode = process.env.STUDIO_ASSET_MODE || "inventory";
if (!["inventory", "snapshot"].includes(assetMode)) throw new Error(`Unknown STUDIO_ASSET_MODE: ${assetMode}`);
if (assetMode === "snapshot") {
  const snapshot = await validateStudioLibrarySnapshot(manifestFile, assets);
  console.log(`studio-library: validated saved snapshot from ${snapshot.generatedAt}; ${snapshot.images} images, ${snapshot.sourceLocations} source locations, ${(snapshot.viewingBytes / 1048576).toFixed(1)} MB. Inventory timestamp and files unchanged; local originals were not scanned.`);
  process.exit(0);
}
const viewingPolicy = "review-1600-q78-v2";
const imagePattern = /\.(png|jpe?g|webp|gif|avif|svg|tiff?|bmp)$/i;
const ignoredDirectories = new Set([".git", ".next", "node_modules", "studio-library", ".vercel", ".claude"]);
const sourceDefinitions = [
  { id: "project", label: "Current project", root: repo },
  { id: "generator", label: "Local image generator", root: process.env.STUDIO_GENERATOR_OUTPUTS || "Z:/ImageGenerator/outputs" },
  { id: "generator-static", label: "Generator website assets", root: "Z:/ImageGenerator/static" },
  { id: "original-brief", label: "Original rough example", root: "Z:/ImageGenerator/very rough example.png" },
  { id: "archive", label: "Earlier project & Samples", root: process.env.STUDIO_ARCHIVE_ROOT || "Z:/Cartoons" },
  { id: "reference-rebuild", label: "September 1 reference rebuilds", root: process.env.STUDIO_REFERENCE_OUTPUTS || "C:/Users/admin/Documents/Codex/2026-09-01/go-t/outputs" },
];
const posix = (value) => value.split(path.sep).join("/");
const dayInEastern = (value) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));

async function walk(directory) {
  const found = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) found.push(...await walk(full));
    else if (entry.isFile() && imagePattern.test(entry.name)) found.push(full);
  }
  return found.sort();
}

async function hashFile(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

function categoryFor(origin) {
  const value = origin.path.toLowerCase();
  if (/\/parts\/|\/base\/|\/work\/|\/plates\//.test(`/${value}`)) return "Scene parts & plates";
  if (/training|models\//.test(value)) return "Training & studies";
  if (/canon\/|vision\/|reference|samples\//.test(value)) return "Canon & references";
  if (/^cartoons\/|gallery\/final\//.test(value)) return "Editions & proofs";
  if (/briefs\/|options\/|knockout\/|gallery\//.test(value)) return "Drafts & experiments";
  if (origin.source === "generator" || origin.source === "reference-rebuild") return "Generated studies";
  if (/icon|logo|brand|og\./.test(value)) return "Website assets";
  return "Other images";
}

function dateFor(origin, stat) {
  const generated = path.basename(origin.path).match(/^gen_(\d{19}|\d{16}|\d{13})_/);
  if (generated) {
    const milliseconds = Number(generated[1].slice(0, 13));
    if (milliseconds > Date.UTC(2020, 0, 1) && milliseconds < Date.now() + 86400000) return { date: dayInEastern(milliseconds), dateBasis: "Generation filename" };
  }
  const dated = origin.path.match(/(?:^|\/)(20\d{2})-?(\d{2})-?(\d{2})(?:[-_/]|$)/);
  if (dated) return { date: `${dated[1]}-${dated[2]}-${dated[3]}`, dateBasis: "Dated project folder" };
  return { date: dayInEastern(stat.mtime), dateBasis: "File modification date" };
}

function titleFor(origin, date) {
  const basename = path.basename(origin.path).replace(/\.[^.]+$/, "");
  if (/^gen_\d/.test(basename)) {
    const descriptor = basename.replace(/^gen_\d+_[^_]+_/, "").replace(/_local_.+$/, "").replace(/[_-]+/g, " ");
    return `Generated study ${descriptor} · ${date}`;
  }
  const named = basename === "cartoon" ? path.basename(path.dirname(origin.path)).replace(/^\d{4}-\d{2}-\d{2}-/, "") : basename;
  return named.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

let previous;
try { previous = JSON.parse(await fs.readFile(manifestFile, "utf8")); } catch { previous = { items: [], coverage: [] }; }
await fs.mkdir(assets, { recursive: true });
const files = [];
const coverage = [];
const unavailable = [];
for (const source of sourceDefinitions) {
  const available = existsSync(source.root);
  if (!available) {
    const prior = previous.coverage.find((entry) => entry.id === source.id);
    coverage.push({ id: source.id, label: source.label, status: prior?.files ? "snapshot" : "unavailable", files: prior?.files || 0, bytes: prior?.bytes || 0, checkedAt: new Date().toISOString(), snapshotAt: prior?.snapshotAt || previous.generatedAt || null });
    continue;
  }
  const sourceStat = await fs.stat(source.root);
  const sourceFiles = sourceStat.isFile() ? [source.root] : await walk(source.root);
  let sourceBytes = 0;
  for (const file of sourceFiles) {
    const stat = await fs.stat(file);
    sourceBytes += stat.size;
    const origin = { source: source.id, label: source.label, path: sourceStat.isFile() ? path.basename(file) : posix(path.relative(source.root, file)) };
    files.push({ file, stat, origin });
  }
  coverage.push({ id: source.id, label: source.label, status: "scanned", files: sourceFiles.length, bytes: sourceBytes, checkedAt: new Date().toISOString(), snapshotAt: new Date().toISOString() });
}

const byHash = new Map();
const missingSources = new Set(coverage.filter((source) => source.status !== "scanned").map((source) => source.id));
for (const item of previous.items) {
  const retained = item.origins.filter((origin) => missingSources.has(origin.source));
  if (retained.length && existsSync(path.join(assets, `${item.id}.webp`))) byHash.set(item.id, { ...item, origins: retained });
}
console.log(`studio-library: indexing ${files.length} source files; preserving ${byHash.size} imported images from unavailable sources.`);
let processed = 0;
let nextFile = 0;
// Hashing is sequential so identical files can never race to create an item.
for (const entry of files) {
  try {
    const id = await hashFile(entry.file);
    const existing = byHash.get(id);
    if (existing) { existing.origins.push(entry.origin); continue; }
    const metadata = await sharp(entry.file, { limitInputPixels: 100000000 }).metadata();
    const date = dateFor(entry.origin, entry.stat);
    const item = {
      id, title: titleFor(entry.origin, date.date), category: categoryFor(entry.origin), ...date,
      width: metadata.autoOrient?.width || metadata.width || 0,
      height: metadata.autoOrient?.height || metadata.height || 0,
      bytes: entry.stat.size, format: metadata.format || path.extname(entry.file).slice(1),
      animated: (metadata.pages || 1) > 1, origins: [entry.origin],
      thumbnailUrl: `/studio-library/${id}.thumb.webp`, imageUrl: `/studio-library/${id}.webp`,
      viewingBytes: 0, thumbnailBytes: 0, _file: entry.file,
    };
    byHash.set(id, item);
  } catch (error) {
    unavailable.push({ source: entry.origin.source, label: entry.origin.label, path: entry.origin.path, reason: "Image could not be decoded" });
    console.warn(`studio-library: could not decode ${entry.origin.label}/${entry.origin.path}: ${error.message}`);
  }
}
const pending = [...byHash.values()].filter((item) => item._file);
await Promise.all(Array.from({ length: 3 }, async () => {
  while (nextFile < pending.length) {
    const item = pending[nextFile++];
    const view = path.join(assets, `${item.id}.webp`);
    const thumb = path.join(assets, `${item.id}.thumb.webp`);
    try {
      if (!existsSync(view) || previous.viewingPolicy !== viewingPolicy) await sharp(item._file, { limitInputPixels: 100000000 }).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 78, effort: 4 }).toFile(view);
      if (!existsSync(thumb)) await sharp(item._file, { limitInputPixels: 100000000 }).rotate().resize({ width: 520, height: 520, fit: "inside", withoutEnlargement: true }).webp({ quality: 78, effort: 3 }).toFile(thumb);
      item.viewingBytes = (await fs.stat(view)).size;
      item.thumbnailBytes = (await fs.stat(thumb)).size;
      const viewingMetadata = await sharp(view).metadata();
      item.viewingWidth = viewingMetadata.width;
      item.viewingHeight = viewingMetadata.height;
      delete item._file;
      processed++;
      if (processed % 100 === 0) console.log(`studio-library: prepared ${processed}/${pending.length} unique viewing copies.`);
    } catch (error) {
      byHash.delete(item.id);
      for (const origin of item.origins) unavailable.push({ ...origin, reason: "Viewing copy could not be prepared" });
      console.warn(`studio-library: viewing copy failed for ${item.title}: ${error.message}`);
    }
  }
}));

// Historical filenames are evidence of absent material, never an instruction to
// restore retired or deliberately removed artwork. Ignore present files.
let historyStatus = "checked";
try {
  const historicalPaths = execFileSync("git", ["log", "--all", "--format=", "--name-only", "--diff-filter=D", "--", "*.png", "*.jpg", "*.jpeg", "*.webp", "*.gif", "*.svg", "*.avif", "*.tiff"], { cwd: repo, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  for (const historicalPath of new Set(historicalPaths.split(/\r?\n/).map((value) => value.trim()).filter(Boolean))) {
    if (!existsSync(path.join(repo, historicalPath))) unavailable.push({ source: "project", label: "Git history", path: historicalPath, reason: "Removed from current checkout; not restored" });
  }
  const deletedPaths = execFileSync("git", ["ls-files", "--deleted", "-z"], { cwd: repo, encoding: "utf8" }).split("\0").filter((value) => imagePattern.test(value));
  for (const deletedPath of deletedPaths) if (!unavailable.some((entry) => entry.path === deletedPath)) unavailable.push({ source: "project", label: "Current project", path: deletedPath, reason: "Removed from current checkout; not restored" });
} catch { historyStatus = "unavailable"; }

const resolveCast = await createLibraryCastResolver(sourceDefinitions);
const items = [];
for (const item of byHash.values()) {
  const cast = await resolveCast(item.origins);
  // Preserve evidence from an imported source when that source is offline.
  const retained = (item.characterEvidence || []).filter((entry) => missingSources.has(entry.source));
  const evidence = [...cast.characterEvidence, ...retained];
  items.push({ ...item, characters: ["Drew", "Barclay", "Abby"].filter((name) => evidence.some((entry) => entry.characters.includes(name))), characterEvidence: evidence, thumbnailUrl: `/studio-library/${item.id}.thumb.webp`, imageUrl: `/studio-library/${item.id}.webp` });
}
items.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
const manifest = {
  version: 1, viewingPolicy, generatedAt: new Date().toISOString(), timezone: "America/New_York",
  summary: {
    sourceFiles: coverage.reduce((sum, source) => sum + source.files, 0), uniqueImages: items.length,
    duplicateCopies: items.reduce((sum, item) => sum + Math.max(0, item.origins.length - 1), 0),
    originalBytes: items.reduce((sum, item) => sum + item.bytes, 0),
    viewingBytes: items.reduce((sum, item) => sum + item.viewingBytes + item.thumbnailBytes, 0),
  },
  coverage, historyStatus, unavailable,
  limits: [
    "Includes images found in the listed sources; it cannot prove that every image ever generated still exists.",
    "Cloud-only generation history and deleted image versions are not imported by this filesystem inventory.",
    "Dates come from generation filenames or dated folders when available; otherwise they are file modification dates, not verified creation dates.",
    "Viewing copies are compressed WebP images, at most 1,600 pixels on the long edge. Original dimensions are recorded alongside them. Originals remain the print source. Animated and multipage files show their first frame or page.",
    "An image being in this library does not mean it has passed artistic review or is approved for publication.",
    "Character groups use named files, canonical character folders, exact panel plans, gag cast lists, training captions, image-specific generation records and embedded positive PNG prompts. Gag membership also associates its working versions and details with that cast; it does not prove every character appears in every crop. Each assignment records its source. Untagged images may be room parts or still need identification; no visual identity has been guessed. Mango is grouped under the current name Barclay.",
  ], items,
};
await fs.writeFile(`${manifestFile}.tmp`, JSON.stringify(manifest, null, 2) + "\n");
await fs.rename(`${manifestFile}.tmp`, manifestFile);
// This directory contains only our content-addressed derived images. Remove
// obsolete derivatives after the replacement manifest is safely written.
const expectedAssets = new Set(items.flatMap((item) => [`${item.id}.webp`, `${item.id}.thumb.webp`]));
for (const filename of await fs.readdir(assets)) if (/^[a-f0-9]{64}(\.thumb)?\.webp$/.test(filename) && !expectedAssets.has(filename)) await fs.unlink(path.join(assets, filename));
console.log(`studio-library: ${items.length} unique images, ${manifest.summary.duplicateCopies} duplicate copies, ${unavailable.length} unavailable historical/failed files; ${(manifest.summary.viewingBytes / 1048576).toFixed(1)} MB of portable viewing assets.`);
