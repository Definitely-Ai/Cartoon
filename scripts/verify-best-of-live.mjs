// Read-only verification of a running local or deployed edition.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = process.argv[2];
if (!origin || !/^https?:\/\//.test(origin)) throw new Error("Supply the verified local or deployment origin");
const items = JSON.parse(await fs.readFile(path.join(root, "lib/best-of-cartoons.json")));
const legacy = JSON.parse(await fs.readFile(path.join(root, "lib/gallery-manifest.json")));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
async function response(relative) {
  return fetch(new URL(relative, origin), { redirect: "manual", signal: AbortSignal.timeout(90000) });
}
const page = await response("/gallery/best-of");
assert.equal(page.status, 200, "Collection is publicly readable");
const html = await page.text();
for (const item of items) assert.ok(html.includes(item.previewSrc), `Rendered preview missing: ${item.id}`);
const apiResponse = await response("/api/gallery?limit=100");
assert.equal(apiResponse.status, 200);
const api = await apiResponse.json();
assert.deepEqual(api.counts, { total: 66, finals: 56, masters: 10 });
assert.equal(api.items.length, 66);
for (const old of legacy) assert.ok(api.items.some(item => item.id === old.id && item.src === old.src), `Legacy item lost: ${old.id}`);
let originals = 0, previews = 0, oldAssets = 0;
const queue = [
  ...items.map(item => ({ src: item.src, expectedHash: item.sha256, kind: "original" })),
  ...items.map(item => ({ src: item.previewSrc, kind: "preview" })),
  ...legacy.map(item => ({ src: item.src, kind: "legacy" })),
];
async function worker() {
  while (queue.length) {
    const item = queue.shift();
    const remote = await response(item.src);
    assert.equal(remote.status, 200, item.src);
    const bytes = Buffer.from(await remote.arrayBuffer());
    const expectedHash = item.expectedHash || hash(await fs.readFile(path.join(root, `public${item.src}`)));
    assert.equal(hash(bytes), expectedHash, `Asset bytes differ: ${item.src}`);
    if (item.kind === "original") originals++;
    else if (item.kind === "preview") previews++;
    else oldAssets++;
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
const zipPath = "/gallery/best-of-v1/swinging-door-best-of-38-pngs.zip";
const zipResponse = await response(zipPath);
assert.equal(zipResponse.status, 200);
const zip = Buffer.from(await zipResponse.arrayBuffer());
assert.equal(hash(zip), hash(await fs.readFile(path.join(root, `public${zipPath}`))));
const protectedPaths = ["/", "/library", "/room", "/reports", "/newspaper", "/studio-room/previous-duo.png", "/studio-print/newspaper-editorial-proof.pdf", "/studio-library/test.png", "/_next/image?url=%2Fstudio-room%2Fprevious-duo.png&w=640&q=75"];
for (const relative of protectedPaths) {
  const protectedResponse = await response(relative);
  assert.equal(protectedResponse.status, 307, `Private route exposed: ${relative}`);
  assert.equal(new URL(protectedResponse.headers.get("location"), origin).pathname, "/login");
}
console.log(JSON.stringify({ origin, checkedAt: new Date().toISOString(), originals, previews, legacyAssets: oldAssets, galleryItems: api.items.length, zipBytes: zip.length, zipSha256: hash(zip), protectedRoutes: protectedPaths.length, pass: true }, null, 2));
