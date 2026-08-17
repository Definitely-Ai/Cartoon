import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const drewDir = path.join(root, "canon", "characters", "flamingo");
const errors = [];

const requiredFiles = [
  "DESCRIPTION.md",
  "CHARACTER-BIBLE.md",
  "PROMPT-BLOCKS.md",
  "QUALITY-CONTROL.md",
  "ASSET-MANIFEST.json",
  "full-body-sheet.png",
  "identity-sheet.png",
  "wing-hand-sheet.png",
  "pose-sheet.png",
  "wardrobe-sheet.png",
  "scene-continuity-sheet.png",
  "proportion-style-sheet.png",
];

async function isFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

for (const file of requiredFiles) {
  if (!(await isFile(path.join(drewDir, file)))) {
    errors.push(`Missing required Drew canon file: canon/characters/flamingo/${file}`);
  }
}

function readPngDimensions(buffer, file) {
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) {
    errors.push(`${file} is not a valid PNG.`);
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

if (errors.length === 0) {
  const manifestPath = path.join(drewDir, "ASSET-MANIFEST.json");
  let manifest;

  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    errors.push(`ASSET-MANIFEST.json is invalid JSON: ${error.message}`);
  }

  if (manifest) {
    if (manifest.characterId !== "drew" || manifest.canonVersion !== "1.0.0") {
      errors.push("ASSET-MANIFEST.json must identify Drew canon version 1.0.0.");
    }

    if (manifest.lockedMaster !== "full-body-sheet.png") {
      errors.push("ASSET-MANIFEST.json must designate full-body-sheet.png as the locked master.");
    }

    if (!Array.isArray(manifest.assets) || manifest.assets.length !== 7) {
      errors.push("ASSET-MANIFEST.json must declare exactly seven Drew reference assets.");
    } else {
      const files = new Set();

      for (const asset of manifest.assets) {
        if (typeof asset.file !== "string" || path.basename(asset.file) !== asset.file) {
          errors.push(`Unsafe or invalid asset filename in manifest: ${String(asset.file)}`);
          continue;
        }

        if (files.has(asset.file)) {
          errors.push(`Duplicate asset in manifest: ${asset.file}`);
          continue;
        }
        files.add(asset.file);

        const assetPath = path.join(drewDir, asset.file);
        if (!(await isFile(assetPath))) {
          errors.push(`Manifest asset is missing: ${asset.file}`);
          continue;
        }

        const buffer = await readFile(assetPath);
        const dimensions = readPngDimensions(buffer, asset.file);
        const sha256 = createHash("sha256").update(buffer).digest("hex");

        if (dimensions && (dimensions.width !== asset.width || dimensions.height !== asset.height)) {
          errors.push(
            `${asset.file} dimensions changed: expected ${asset.width}x${asset.height}, got ${dimensions.width}x${dimensions.height}.`,
          );
        }

        if (sha256 !== asset.sha256) {
          errors.push(`${asset.file} fingerprint changed: update the image intentionally and revise ASSET-MANIFEST.json.`);
        }
      }

      for (const file of requiredFiles.filter((name) => name.endsWith(".png"))) {
        if (!files.has(file)) {
          errors.push(`Required image is not declared in ASSET-MANIFEST.json: ${file}`);
        }
      }

      const locked = manifest.assets.filter((asset) => asset.status === "locked");
      if (locked.length !== 1 || locked[0].file !== manifest.lockedMaster) {
        errors.push("Only full-body-sheet.png may be marked as the locked master; support sheets remain review references.");
      }
    }
  }
}

async function checkText(relativePath, required, forbidden) {
  const filePath = path.join(root, relativePath);
  if (!(await isFile(filePath))) {
    errors.push(`Missing text authority: ${relativePath}`);
    return;
  }

  const text = await readFile(filePath, "utf8");
  for (const fragment of required) {
    if (!text.includes(fragment)) {
      errors.push(`${relativePath} is missing required canon phrase: ${JSON.stringify(fragment)}`);
    }
  }
  for (const fragment of forbidden) {
    if (text.includes(fragment)) {
      errors.push(`${relativePath} still contains superseded Drew language: ${JSON.stringify(fragment)}`);
    }
  }
}

await checkText(
  "canon/characters/flamingo/DESCRIPTION.md",
  [
    "46-year-old male anthropomorphic flamingo",
    "long, slim neck with a pronounced, smooth flamingo S-curve",
    "small, lively, and avian",
    "feathered wing-arms",
    "tiny, pale, understated avian nail tips",
    "base model wears no other clothing",
    "exactly three olives on one pick",
  ],
  ["small round head; thin, straight beak", "Dot eyes with a single brow stroke each"],
);

await checkText(
  "canon/MASTER-PROMPT.md",
  [
    "46-year-old male anthropomorphic flamingo",
    "long slim neck held in a pronounced smooth S-curve",
    "small lively avian eyes",
    "layered feathered wing-arms",
    "full-body-sheet.png",
  ],
  ["small round head, thin straight beak, dot eyes with single brow strokes"],
);

if (errors.length > 0) {
  console.error("Drew canon validation failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Drew canon valid: 4 documents, 7 fingerprinted model sheets, and master prompt are consistent.");
