// Reproducible public derivatives; approved originals are never rewritten.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { deflateRawSync, crc32 } from "node:zlib";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const items = JSON.parse(await fs.readFile(path.join(root, "lib/best-of-cartoons.json"), "utf8"));
const directory = path.join(root, "public/gallery/best-of-v1");
const allowedKeys = ["id", "title", "speaker", "variant", "caption", "src", "previewSrc", "width", "height", "sha256", "tv", "board"].sort();
if (items.length !== 38 || new Set(items.map(item => item.id)).size !== 38) throw new Error("Expected 38 unique selected cartoons");
await fs.mkdir(path.join(directory, "previews"), { recursive: true });

// Standard ZIP32, fixed timestamps, deflate, UTF-8 names. No platform ZIP command required.
const localEntries = [];
const centralEntries = [];
let offset = 0;
for (const [index, item] of items.entries()) {
  if (JSON.stringify(Object.keys(item).sort()) !== JSON.stringify(allowedKeys)) throw new Error(`Unexpected public metadata: ${item.id}`);
  if (!/^[a-z0-9-]+$/.test(item.id) || !["Drew", "Barclay", "Abby"].includes(item.speaker) || !["duo", "trio"].includes(item.variant)) throw new Error(`Invalid edition entry: ${item.id}`);
  if (item.src !== `/gallery/best-of-v1/originals/${item.id}.png` || item.previewSrc !== `/gallery/best-of-v1/previews/${item.id}.webp`) throw new Error(`Invalid asset path: ${item.id}`);
  const original = await fs.readFile(path.join(directory, "originals", `${item.id}.png`));
  if (createHash("sha256").update(original).digest("hex") !== item.sha256) throw new Error(`Approved artwork changed: ${item.id}`);
  const metadata = await sharp(original).metadata();
  if (metadata.width !== 1024 || metadata.height !== 1536 || item.width !== 1024 || item.height !== 1536) throw new Error(`Wrong dimensions: ${item.id}`);
  const { data, info } = await sharp(original).removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
  for (let pixel = 0; pixel < data.length; pixel += info.channels) {
    if (data[pixel] !== data[pixel + 1] || data[pixel] !== data[pixel + 2]) throw new Error(`Color found in ${item.id}`);
  }
  await sharp(original).resize({ width: 640 }).webp({ quality: 88 }).toFile(path.join(directory, "previews", `${item.id}.webp`));

  const name = Buffer.from(`${String(index + 1).padStart(2, "0")}-${item.speaker.toLowerCase()}-${item.id}.png`);
  const compressed = deflateRawSync(original, { level: 6 });
  const checksum = crc32(original);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x800, 6);
  header.writeUInt16LE(8, 8);
  header.writeUInt16LE(((2026 - 1980) << 9) | (9 << 5) | 14, 12);
  header.writeUInt32LE(checksum, 14);
  header.writeUInt32LE(compressed.length, 18);
  header.writeUInt32LE(original.length, 22);
  header.writeUInt16LE(name.length, 26);
  localEntries.push(header, name, compressed);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  header.copy(central, 6, 4, 30);
  central.writeUInt32LE(offset, 42);
  centralEntries.push(central, name);
  offset += header.length + name.length + compressed.length;
}
const central = Buffer.concat(centralEntries);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(items.length, 8);
end.writeUInt16LE(items.length, 10);
end.writeUInt32LE(central.length, 12);
end.writeUInt32LE(offset, 16);
const archive = Buffer.concat([...localEntries, central, end]);
await fs.writeFile(path.join(directory, "swinging-door-best-of-38-pngs.zip"), archive);
console.log(`best-of: verified ${items.length} unchanged grayscale originals; prepared web previews and ${(archive.length / 1048576).toFixed(1)} MB ZIP`);
