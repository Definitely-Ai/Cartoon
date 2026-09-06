import { readFile, realpath } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import type { StudioLibraryImage } from "./studio-library-types";

// These local source locations are server-only. The browser receives friendly
// source labels and relative paths, never machine paths or arbitrary file reads.
function sourceRoots(): Record<string, string> {
  return {
    project: process.cwd(),
    generator: process.env.STUDIO_GENERATOR_OUTPUTS || "Z:/ImageGenerator/outputs",
    "generator-static": "Z:/ImageGenerator/static",
    "original-brief": "Z:/ImageGenerator",
    archive: process.env.STUDIO_ARCHIVE_ROOT || "Z:/Cartoons",
    "reference-rebuild": process.env.STUDIO_REFERENCE_OUTPUTS || "C:/Users/admin/Documents/Codex/2026-09-01/go-t/outputs",
  };
}

export async function readLibraryOriginal(item: StudioLibraryImage): Promise<Buffer | null> {
  for (const origin of item.origins) {
    const root = sourceRoots()[origin.source];
    if (!root || !path.isAbsolute(root) || path.isAbsolute(origin.path) || origin.path.split(/[\\/]/).includes("..")) continue;
    try {
      const realRoot = await realpath(root);
      const candidate = await realpath(path.resolve(root, origin.path));
      const relative = path.relative(realRoot, candidate);
      if (!relative || relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) continue;
      const bytes = await readFile(candidate);
      // A replaced source file must never masquerade as the image in the card.
      if (createHash("sha256").update(bytes).digest("hex") === item.id) return bytes;
    } catch { /* Imported viewing copy still works without a local source. */ }
  }
  return null;
}
