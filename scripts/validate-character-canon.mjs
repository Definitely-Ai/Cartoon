import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const charactersRoot = path.join(root, "canon", "characters");
const errors = [];

const characters = [
  { folder: "flamingo", characterId: "drew" },
  { folder: "dog", characterId: "mango" },
  { folder: "abby", characterId: "abby" },
];

const requiredDocuments = [
  "DESCRIPTION.md",
  "CHARACTER-BIBLE.md",
  "PROMPT-BLOCKS.md",
  "QUALITY-CONTROL.md",
  "ASSET-MANIFEST.json",
];

async function isFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
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

let sheetCount = 0;

async function validateCharacter({ folder, characterId }) {
  const dir = path.join(charactersRoot, folder);
  const rel = `canon/characters/${folder}`;
  let complete = true;

  for (const file of requiredDocuments) {
    if (!(await isFile(path.join(dir, file)))) {
      errors.push(`Missing required canon file: ${rel}/${file}`);
      complete = false;
    }
  }

  if (!complete) return;

  const manifestPath = path.join(dir, "ASSET-MANIFEST.json");
  let manifest;

  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    errors.push(`${rel}/ASSET-MANIFEST.json is invalid JSON: ${error.message}`);
    return;
  }

  if (manifest.characterId !== characterId) {
    errors.push(`${rel}/ASSET-MANIFEST.json must identify characterId "${characterId}", got ${JSON.stringify(manifest.characterId)}.`);
  }

  if (manifest.lockedMaster !== "full-body-sheet.png") {
    errors.push(`${rel}/ASSET-MANIFEST.json must designate full-body-sheet.png as the locked master.`);
  }

  if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) {
    errors.push(`${rel}/ASSET-MANIFEST.json must declare at least one reference asset.`);
    return;
  }

  const files = new Set();

  for (const asset of manifest.assets) {
    if (typeof asset.file !== "string" || path.basename(asset.file) !== asset.file) {
      errors.push(`Unsafe or invalid asset filename in ${rel}/ASSET-MANIFEST.json: ${String(asset.file)}`);
      continue;
    }

    if (files.has(asset.file)) {
      errors.push(`Duplicate asset in ${rel}/ASSET-MANIFEST.json: ${asset.file}`);
      continue;
    }
    files.add(asset.file);

    const assetPath = path.join(dir, asset.file);
    if (!(await isFile(assetPath))) {
      errors.push(`Manifest asset is missing: ${rel}/${asset.file}`);
      continue;
    }

    const buffer = await readFile(assetPath);
    const dimensions = readPngDimensions(buffer, `${rel}/${asset.file}`);
    const sha256 = createHash("sha256").update(buffer).digest("hex");

    if (dimensions && (dimensions.width !== asset.width || dimensions.height !== asset.height)) {
      errors.push(
        `${rel}/${asset.file} dimensions changed: expected ${asset.width}x${asset.height}, got ${dimensions.width}x${dimensions.height}.`,
      );
    }

    if (sha256 !== asset.sha256) {
      errors.push(`${rel}/${asset.file} fingerprint changed: update the image intentionally and revise ASSET-MANIFEST.json.`);
    }

    sheetCount += 1;
  }

  const pngsInFolder = (await readdir(dir)).filter((name) => name.toLowerCase().endsWith(".png"));
  for (const png of pngsInFolder) {
    if (!files.has(png)) {
      errors.push(`Undeclared sheet in folder: ${rel}/${png} is not listed in ASSET-MANIFEST.json.`);
    }
  }

  const locked = manifest.assets.filter((asset) => asset.status === "locked");
  if (locked.length !== 1 || locked[0].file !== manifest.lockedMaster) {
    errors.push(`${rel}: exactly one asset may be marked "locked", and it must be the locked master (${manifest.lockedMaster}).`);
  }
}

for (const character of characters) {
  await validateCharacter(character);
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
    "question-mark sweep",
    "heavy-lidded",
    "four-fingered hands with an opposed thumb",
    "sweater vest",
    "trousers",
    "drew-reference.jpg",
  ],
  ["small round head; thin, straight beak", "Dot eyes with a single brow stroke each", "wears only the bow tie"],
);

await checkText(
  "canon/MASTER-PROMPT.md",
  [
    "question-mark sweep of a true flamingo",
    "heavy-lidded and deadpan",
    "four fingers and an opposed thumb",
    "canon/vision/drew-reference.jpg",
    "black dog lips",
    "studded leather collar",
  ],
  ["small round head, thin straight beak, dot eyes with single brow strokes", "wears only the bow tie"],
);

// Light no-tail guards for the newer characters.
{
  const dogDescriptionPath = path.join(charactersRoot, "dog", "DESCRIPTION.md");
  if (await isFile(dogDescriptionPath)) {
    const text = await readFile(dogDescriptionPath, "utf8");
    if (!text.includes("absolutely no tail") && !text.includes("no tail")) {
      errors.push('canon/characters/dog/DESCRIPTION.md must state "absolutely no tail" or "no tail".');
    }
  }
}

await checkText("canon/characters/abby/DESCRIPTION.md", ["no tail"], []);

if (errors.length > 0) {
  console.error("Character canon validation failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Character canon valid: ${characters.length} characters (drew, mango, abby), ${sheetCount} fingerprinted model sheets, documents and master prompt are consistent.`,
);
