import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { inflateRawSync, crc32 } from "node:zlib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFile(path.join(root, relative));
const items = JSON.parse(await read("lib/best-of-cartoons.json"));
const digest = bytes => createHash("sha256").update(bytes).digest("hex");

test("edition contains only the selected 38 entries and reader-facing metadata", () => {
  assert.equal(items.length, 38);
  assert.equal(new Set(items.map(item => item.id)).size, 38);
  assert.deepEqual(["duo", "trio"].map(variant => items.filter(item => item.variant === variant).length), [25, 13]);
  assert.deepEqual(["Drew", "Barclay", "Abby"].map(speaker => items.filter(item => item.speaker === speaker).length), [12, 22, 4]);
  const allowedKeys = ["id", "title", "speaker", "variant", "caption", "src", "previewSrc", "width", "height", "sha256", "tv", "board"].sort();
  for (const item of items) {
    assert.deepEqual(Object.keys(item).sort(), allowedKeys);
    assert.ok(item.caption.length > 20);
    assert.ok(item.board.length >= 1 && item.board.length <= 4);
  }
});

test("all original files still match their approved hashes", async () => {
  for (const item of items) {
    assert.equal(digest(await read(`public${item.src}`)), item.sha256, item.id);
    assert.ok((await read(`public${item.previewSrc}`)).length > 1000, item.id);
  }
});

test("download ZIP contains all 38 exact originals and valid CRCs", async () => {
  const zip = await read("public/gallery/best-of-v1/swinging-door-best-of-38-pngs.zip");
  let offset = 0;
  for (const [index, item] of items.entries()) {
    assert.equal(zip.readUInt32LE(offset), 0x04034b50);
    assert.equal(zip.readUInt16LE(offset + 8), 8);
    const size = zip.readUInt32LE(offset + 18);
    const nameLength = zip.readUInt16LE(offset + 26);
    const extraLength = zip.readUInt16LE(offset + 28);
    const name = zip.subarray(offset + 30, offset + 30 + nameLength).toString();
    assert.equal(name, `${String(index + 1).padStart(2, "0")}-${item.speaker.toLowerCase()}-${item.id}.png`);
    const start = offset + 30 + nameLength + extraLength;
    const bytes = inflateRawSync(zip.subarray(start, start + size));
    assert.equal(bytes.length, zip.readUInt32LE(offset + 22));
    assert.equal(crc32(bytes), zip.readUInt32LE(offset + 14));
    assert.equal(digest(bytes), item.sha256, item.id);
    offset = start + size;
  }
  assert.equal(zip.readUInt32LE(offset), 0x02014b50);
  const end = zip.length - 22;
  assert.equal(zip.readUInt32LE(end), 0x06054b50);
  assert.equal(zip.readUInt16LE(end + 10), 38);
  assert.equal(zip.readUInt32LE(end + 16), offset);
  assert.equal(zip.readUInt32LE(end + 12) + offset, end);
});

test("the legacy gallery remains 28 entries with its paired manifest intact", async () => {
  const legacy = JSON.parse(await read("lib/gallery-manifest.json"));
  const paired = JSON.parse(await read("public/gallery/manifest.json"));
  assert.equal(legacy.length, 28);
  assert.deepEqual(legacy, paired);
  assert.equal(legacy.filter(item => item.category === "final").length, 18);
  for (const item of legacy) assert.ok((await read(`public${item.src}`)).length > 0, item.id);
});
