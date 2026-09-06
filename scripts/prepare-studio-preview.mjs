import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

// A source-package operation only: no Git writes, dependency installation,
// deployment, original-image transformation, deletion, or overwriting.
const LIMIT_BYTES = 1_000_000_000;
const IMAGE = /\.(avif|gif|ico|jpe?g|png|svg|webp)$/i;
const TEXT = /\.(json|md|txt|ya?ml)$/i;
const CODE = /\.(cjs|css|js|json|jsx|mjs|mts|cts|ts|tsx)$/i;
const FORBIDDEN_DIRS = new Set([".git", ".next", ".vercel", "node_modules", "tmp", "temp", "output", "screenshots", "test-results", "playwright-report", "__tests__"]);
const PUBLIC_DIRS = ["studio-library", "models", "vision", "canon", "cartoons", "showcase", "studio-room", "studio-print"];
const REQUIRED_FILES = [
  "package.json", "package-lock.json", "tsconfig.json", "middleware.ts",
  "lib/gallery-manifest.json", "public/gallery/manifest.json",
  "lib/studio-library-manifest.json", "lib/studio-reports-snapshot.json",
  "public/models/index.json", "public/studio-print/newspaper-editorial-proof.pdf",
  "scripts/prebuild.mjs", "scripts/build-studio-library.mjs", "scripts/build-studio-reports.mjs",
  "scripts/validate-character-canon.mjs", "scripts/lib/validate-studio-library-snapshot.mjs",
  "scripts/build-studio-snapshot.mjs",
];
const IGNORE = `# A private, selectively assembled source package. Never upload local secrets or tests.
.git
.env*
**/.env*
.next
node_modules
.vercel
tmp
output
screenshots
test-results
playwright-report
**/__tests__/**
**/*.test.*
**/*.spec.*
scripts/test-*
*.tsbuildinfo
*.inventory.json
.studio-preview
`;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const inside = (root, candidate) => {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
};

function excluded(relative) {
  const parts = relative.split("/");
  return parts.some((part) => FORBIDDEN_DIRS.has(part.toLowerCase()) || /^\.env/i.test(part))
    || /(?:^|\/)(?:test-|screenshot[.-])|\.(?:test|spec)\.|\.tsbuildinfo$/i.test(relative);
}

async function exists(filename) {
  try { await fs.lstat(filename); return true; }
  catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

function galleryFiles(value, result = new Set()) {
  if (typeof value === "string" && value.startsWith("/gallery/")) {
    let decoded;
    try { decoded = decodeURIComponent(value); } catch { throw new Error(`Invalid gallery URL: ${value}`); }
    const parts = decoded.slice(1).split("/");
    if (/[\\?#\u0000]/.test(decoded) || parts.some((part) => !part || part === "." || part === "..") || !IMAGE.test(decoded)) {
      throw new Error(`Unsafe gallery URL: ${value}`);
    }
    result.add(`public/${parts.join("/")}`);
  } else if (Array.isArray(value)) value.forEach((item) => galleryFiles(item, result));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => galleryFiles(item, result));
  return result;
}

/** Plan first; a dry run creates no files. All destinations must be new. */
export async function prepareStudioPreview({ source, out, dryRun = false }) {
  if (!source || !out || !path.isAbsolute(source) || !path.isAbsolute(out)) throw new Error("--source and --out must both be absolute paths.");
  const root = await fs.realpath(source);
  if (!(await fs.stat(root)).isDirectory()) throw new Error("--source must be an existing integration directory.");
  const requestedOut = path.resolve(out);
  if (await exists(requestedOut)) throw new Error(`Refusing existing destination: ${requestedOut}`);
  // Resolve the parent so a junction cannot hide an output nested in source.
  // Require an existing parent; do not create arbitrary parent directories.
  const parent = await fs.realpath(path.dirname(requestedOut));
  const destination = path.join(parent, path.basename(requestedOut));
  if (inside(root, destination) || inside(destination, root)) throw new Error("Source and destination must be separate trees; output cannot be inside source.");
  const inventoryPath = `${destination}.inventory.json`;
  if (await exists(destination) || await exists(inventoryPath)) throw new Error("Destination and sibling inventory must both be nonexistent.");
  const planned = new Map();
  const generated = new Map();

  async function add(relative, required = true) {
    if (excluded(relative)) throw new Error(`Required path is excluded: ${relative}`);
    const absolute = path.join(root, ...relative.split("/"));
    if (!inside(root, absolute)) throw new Error(`Source path escapes integration tree: ${relative}`);
    let stat;
    try { stat = await fs.lstat(absolute); }
    catch (error) { if (!required && error.code === "ENOENT") return; throw new Error(`Missing required source file: ${relative}`, { cause: error }); }
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`Only regular source files may be packaged: ${relative}`);
    const real = await fs.realpath(absolute);
    if (!inside(root, real) || real !== absolute) throw new Error(`Source links are not permitted: ${relative}`);
    planned.set(relative, { absolute, size: stat.size, mtimeMs: stat.mtimeMs });
  }

  async function walk(relative, accept, required = true) {
    const directory = path.join(root, ...relative.split("/"));
    let stat;
    try { stat = await fs.lstat(directory); }
    catch (error) { if (!required && error.code === "ENOENT") return; throw error; }
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Only regular directories may be traversed: ${relative}`);
    for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const child = `${relative}/${entry.name}`;
      if (excluded(child)) continue;
      if (entry.isSymbolicLink()) throw new Error(`Source links are not permitted: ${child}`);
      if (entry.isDirectory()) await walk(child, accept);
      else if (accept(child)) await add(child);
    }
  }

  for (const relative of REQUIRED_FILES) await add(relative);
  const configs = ["next.config.ts", "next.config.mjs", "next.config.js"];
  for (const relative of configs) await add(relative, false);
  if (!configs.some((file) => planned.has(file))) throw new Error("Missing Next.js configuration.");
  for (const relative of ["next-env.d.ts", "postcss.config.js", "postcss.config.mjs", "tailwind.config.ts", "tailwind.config.js"]) await add(relative, false);
  await walk("app", (file) => CODE.test(file) || IMAGE.test(file) || /\.(woff2?|ttf|otf)$/i.test(file));
  await walk("lib", (file) => CODE.test(file));
  await walk("scripts", (file) => CODE.test(file));
  await walk("canon", (file) => TEXT.test(file) || (/^canon\/(characters|vision|showcase)\//.test(file) && IMAGE.test(file)));
  await walk("cartoons", (file) => TEXT.test(file) || IMAGE.test(file));
  await walk("briefs", (file) => path.posix.basename(file) === "plan.json", false);
  for (const directory of PUBLIC_DIRS) await walk(`public/${directory}`, () => true, ["studio-library", "models", "studio-print"].includes(directory));
  for (const entry of await fs.readdir(path.join(root, "public"), { withFileTypes: true })) {
    if (entry.isFile() && !excluded(`public/${entry.name}`) && (IMAGE.test(entry.name) || /\.(txt|webmanifest|xml)$/i.test(entry.name))) await add(`public/${entry.name}`);
  }
  const gallery = new Set(["public/gallery/final/A01-preview.jpg"]);
  for (const relative of ["lib/gallery-manifest.json", "public/gallery/manifest.json"]) {
    galleryFiles(JSON.parse(await fs.readFile(path.join(root, relative), "utf8")), gallery);
  }
  for (const relative of gallery) await add(relative);

  let vercel = {};
  await add("vercel.json", false);
  if (planned.has("vercel.json")) {
    vercel = JSON.parse(await fs.readFile(planned.get("vercel.json").absolute, "utf8"));
    planned.delete("vercel.json");
  }
  generated.set("vercel.json", Buffer.from(`${JSON.stringify({ ...vercel, public: false, buildCommand: "node scripts/build-studio-snapshot.mjs" }, null, 2)}\n`));
  generated.set(".vercelignore", Buffer.from(IGNORE));
  const bytes = [...planned.values()].reduce((total, file) => total + file.size, 0) + [...generated.values()].reduce((total, file) => total + file.length, 0);
  if (bytes >= LIMIT_BYTES) throw new Error(`Selective package is ${bytes.toLocaleString()} bytes; it must stay below ${LIMIT_BYTES.toLocaleString()} bytes. No files were copied.`);
  const byDirectory = {};
  for (const [relative, file] of planned) {
    const group = relative.startsWith("public/") ? relative.split("/").slice(0, 2).join("/") : relative.split("/")[0];
    byDirectory[group] = (byDirectory[group] || 0) + file.size;
  }
  const summary = { source: root, destination, inventoryPath, files: planned.size + generated.size, bytes, galleryImages: gallery.size, byDirectory, dryRun };
  if (dryRun) return summary;

  // mkdir without recursive is the exclusive reservation. A failed run is left
  // intact for inspection; reruns must use another new destination.
  await fs.mkdir(destination);
  const files = [];
  for (const [relative, item] of [...planned].sort(([a], [b]) => a.localeCompare(b))) {
    const before = await fs.lstat(item.absolute);
    if (!before.isFile() || before.isSymbolicLink() || before.size !== item.size || before.mtimeMs !== item.mtimeMs || await fs.realpath(item.absolute) !== item.absolute) throw new Error(`Source changed during packaging: ${relative}`);
    const content = await fs.readFile(item.absolute);
    const after = await fs.stat(item.absolute);
    if (after.size !== item.size || after.mtimeMs !== item.mtimeMs || content.length !== item.size) throw new Error(`Source changed during packaging: ${relative}`);
    const target = path.join(destination, ...relative.split("/"));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content, { flag: "wx" });
    files.push({ path: relative, bytes: content.length, sha256: sha256(content), source: "copied" });
  }
  for (const [relative, content] of generated) {
    await fs.writeFile(path.join(destination, relative), content, { flag: "wx" });
    files.push({ path: relative, bytes: content.length, sha256: sha256(content), source: "package configuration" });
  }
  // Outside the package and therefore outside /public and Vercel's upload.
  await fs.writeFile(inventoryPath, `${JSON.stringify({ version: 1, createdAt: new Date().toISOString(), ...summary, files: files.sort((a, b) => a.path.localeCompare(b.path)), exclusions: ["Git metadata", "environment files", "dependencies/build output", "tests/screenshots", "original archives and brief artwork", "unreferenced gallery artwork"] }, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = {};
    for (let i = 2; i < process.argv.length; i++) {
      const argument = process.argv[i];
      if (argument === "--help") {
        console.log("node scripts/prepare-studio-preview.mjs --source <absolute integration tree> --out <absolute NEW directory> [--dry-run]\nNo deployment occurs. A private <out>.inventory.json is written beside the new package. Existing outputs are never modified.");
        process.exit(0);
      }
      if (argument === "--dry-run") options.dryRun = true;
      else if ((argument === "--source" || argument === "--out") && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) options[argument.slice(2)] = process.argv[++i];
      else throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
    console.log(JSON.stringify(await prepareStudioPreview(options), null, 2));
  } catch (error) {
    console.error(`prepare-studio-preview: ${error.message}`);
    process.exitCode = 1;
  }
}
