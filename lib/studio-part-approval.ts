import * as fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";

export class PartApprovalError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
function fail(status: number, message: string): never { throw new PartApprovalError(status, message); }
const MAX_IMAGE_BYTES = 48 * 1024 * 1024;
const MAX_PIXELS = 32_000_000;
export const normalizedManifestHash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const hashBytes = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

export function localPartApprovalsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.STUDIO_ENABLE_LOCAL_PART_APPROVALS === "1" && !env.VERCEL && !env.VERCEL_ENV;
}
export function isLoopbackHost(host: string | null): boolean {
  if (!host) return false;
  try { return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(`http://${host}`).hostname.toLowerCase()); }
  catch { return false; }
}

/** Fail closed for hosted, cross-origin and proxy requests. This endpoint must
 * also run on a server bound to loopback; HTTP headers are not peer attestation. */
export function assertLocalApprovalRequest(request: Request, authenticated: boolean, env: NodeJS.ProcessEnv = process.env): void {
  if (!localPartApprovalsEnabled(env)) fail(403, "Local part approvals are disabled. No files were changed.");
  if (!authenticated) fail(401, "Sign in to approve a part.");
  const url = new URL(request.url);
  const host = request.headers.get("host");
  if (!isLoopbackHost(url.host) || !isLoopbackHost(host) || host?.toLowerCase() !== url.host.toLowerCase()) fail(403, "Part approvals are available only through the local studio address.");
  if (request.headers.get("origin") !== url.origin) fail(403, "Open this approval from the same local studio page.");
  if (request.headers.has("forwarded") || request.headers.has("x-forwarded-host") && request.headers.get("x-forwarded-host") !== host) fail(403, "Forwarded part approvals are not accepted.");
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor && !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(forwardedFor.trim())) fail(403, "Forwarded part approvals are not accepted.");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") fail(403, "This approval must come from the local studio page.");
}

type LibraryIdentity = { id: string; origins: { source: string; path: string }[] };
export type PartApprovalInput = {
  repoRoot: string; partId: string; candidateId: string; expectedManifestHash: string;
  libraryItem: LibraryIdentity | undefined;
};
type Manifest = { plate: { width: number; height: number }; parts: Record<string, unknown>[]; [key: string]: unknown };

function within(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return !!relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}
async function safePath(root: string, relative: string, missingLeaf = false): Promise<string> {
  if (path.isAbsolute(relative) || relative.split(/[\\/]/).some((part) => part === ".." || part === "." || !part)) fail(400, "Invalid studio file path.");
  const candidate = path.resolve(root, relative);
  if (!within(root, candidate)) fail(400, "That file is outside the studio folder.");
  const segments = relative.split(/[\\/]/);
  let current = root;
  for (let index = 0; index < segments.length; index++) {
    current = path.join(current, segments[index]);
    try {
      const info = await fs.lstat(current);
      if (info.isSymbolicLink()) fail(400, "Linked files and folders cannot be approved.");
      if (index < segments.length - 1 && !info.isDirectory()) fail(400, "A studio path is not a folder.");
    } catch (error) {
      if (missingLeaf && index === segments.length - 1 && (error as NodeJS.ErrnoException).code === "ENOENT") return candidate;
      throw error;
    }
  }
  const resolved = await fs.realpath(candidate);
  if (!within(root, resolved)) fail(400, "That file resolves outside the studio folder.");
  return candidate;
}
async function boundedRead(file: string, limit: number): Promise<Buffer> {
  const handle = await fs.open(file, "r");
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size < 1 || before.size > limit) fail(400, "The image or manifest is empty, too large, or not a regular file.");
    const bytes = Buffer.alloc(before.size);
    let read = 0;
    while (read < bytes.length) {
      const result = await handle.read(bytes, read, bytes.length - read, read);
      if (!result.bytesRead) fail(409, "The file changed while it was being read. Refresh before trying again.");
      read += result.bytesRead;
    }
    const after = await handle.stat();
    if (after.size !== before.size || after.mtimeMs !== before.mtimeMs) fail(409, "The file changed while it was being read. Refresh before trying again.");
    return bytes;
  } finally { await handle.close(); }
}
function parseManifest(bytes: Buffer): Manifest {
  let value: Manifest;
  try { value = JSON.parse(bytes.toString("utf8")); } catch { return fail(409, "The parts manifest cannot be read. No files were changed."); }
  if (!value || !Array.isArray(value.parts) || !value.plate || !Number.isInteger(value.plate.width) || !Number.isInteger(value.plate.height)) fail(409, "The parts manifest has an unsupported shape.");
  return value;
}

/** Refresh the local review after an explicit save; never used on hosted pages. */
export async function readLocalPartManifest(repoRoot: string): Promise<unknown> {
  const root = await fs.realpath(repoRoot);
  return parseManifest(await boundedRead(await safePath(root, "canon/plates/parts.json"), 2 * 1024 * 1024));
}
export async function readLocalPartIdentity(repoRoot: string, source: string): Promise<string | null> {
  if (!/^canon\/plates\/parts\/[a-z0-9]+(?:-[a-z0-9]+)*\.png$/.test(source)) return null;
  try {
    const root = await fs.realpath(repoRoot);
    return hashBytes(await boundedRead(await safePath(root, source), MAX_IMAGE_BYTES));
  } catch { return null; }
}

let writeQueue: Promise<unknown> = Promise.resolve();
/** Only the route supplies libraryItem, from the trusted image inventory.
 * The optional rename dependency lets tests force commit failure on fixtures. */
export function approveLocalPart(input: PartApprovalInput, io: Pick<typeof fs, "rename"> = fs) {
  const operation = writeQueue.then(() => applyApproval(input, io));
  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
}
async function applyApproval(input: PartApprovalInput, io: Pick<typeof fs, "rename">) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.partId) || input.partId.length > 80) fail(400, "Choose a recorded part.");
  if (!/^[a-f0-9]{64}$/.test(input.candidateId) || !/^[a-f0-9]{64}$/.test(input.expectedManifestHash)) fail(400, "The image or manifest identity is invalid.");
  if (!input.libraryItem || input.libraryItem.id !== input.candidateId) fail(404, "That candidate is not in the image library.");
  const origin = input.libraryItem.origins.find((entry) => entry.source === "project" && /^canon\/plates\/work\/.+\.png$/i.test(entry.path));
  if (!origin) fail(400, "Choose a PNG candidate from the parts work folder. Base and room studies cannot be approved here.");
  const root = await fs.realpath(input.repoRoot);
  const manifestFile = await safePath(root, "canon/plates/parts.json");
  const lockFile = await safePath(root, "canon/plates/.studio-part-approval.lock", true);
  let lock;
  try { lock = await fs.open(lockFile, "wx"); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return fail(409, "Another local approval is in progress. Try again after it finishes.");
    throw error;
  }
  const temporaryFiles: string[] = [];
  try {
    const originalManifest = await boundedRead(manifestFile, 2 * 1024 * 1024);
    const current = parseManifest(originalManifest);
    if (normalizedManifestHash(current) !== input.expectedManifestHash) fail(409, "The parts changed since this page was opened. Refresh and review before approving.");
    const matches = current.parts.filter((part) => part && part.id === input.partId);
    if (matches.length !== 1 || matches[0].mode === "code") fail(400, "Choose one recorded image part. Lettering and bases are not eligible.");
    const sourceFile = await safePath(root, origin.path);
    const bytes = await boundedRead(sourceFile, MAX_IMAGE_BYTES);
    if (hashBytes(bytes) !== input.candidateId) fail(409, "The candidate changed after the image inventory. Refresh the library and review it again.");
    // Recheck the resolved path after reading, before writing anything.
    if (await safePath(root, origin.path) !== sourceFile) fail(409, "The candidate path changed.");
    let width: number, height: number;
    try {
      const decoder = sharp(bytes, { failOn: "warning", limitInputPixels: MAX_PIXELS, sequentialRead: true });
      const metadata = await decoder.metadata();
      if (metadata.format !== "png" || !metadata.width || !metadata.height || (metadata.pages || 1) !== 1 || metadata.width > 8192 || metadata.height > 8192) fail(400, "Choose a single PNG image no larger than 8192 pixels on either side.");
      width = metadata.width; height = metadata.height;
      await decoder.stats();
    } catch (error) {
      if (error instanceof PartApprovalError) throw error;
      return fail(400, "The candidate could not be fully decoded as a safe PNG image.");
    }
    const source = `canon/plates/parts/${input.partId}.png`;
    const destination = await safePath(root, source, true);
    let previous: Buffer | null = null;
    try { previous = await boundedRead(destination, MAX_IMAGE_BYTES); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const imageTemp = await safePath(root, `canon/plates/parts/.${input.partId}-${randomUUID()}.tmp`, true);
    const manifestTemp = await safePath(root, `canon/plates/.parts-${randomUUID()}.tmp`, true);
    temporaryFiles.push(imageTemp, manifestTemp);
    await fs.writeFile(imageTemp, bytes, { flag: "wx" });
    const updated = { ...current, parts: current.parts.map((part) => part.id === input.partId ? { ...part, source } : part) };
    await fs.writeFile(manifestTemp, `${JSON.stringify(updated, null, 2)}\n`, { flag: "wx" });
    if (!originalManifest.equals(await boundedRead(manifestFile, 2 * 1024 * 1024))) fail(409, "The art files changed during approval. Refresh and review again.");
    await safePath(root, source, true);
    await io.rename(imageTemp, destination);
    try {
      if (!originalManifest.equals(await boundedRead(manifestFile, 2 * 1024 * 1024))) fail(409, "The manifest changed during approval. The part replacement was rolled back.");
      await safePath(root, "canon/plates/parts.json");
      await io.rename(manifestTemp, manifestFile);
    } catch (error) {
      try {
        await safePath(root, source);
        if (hashBytes(await boundedRead(destination, MAX_IMAGE_BYTES)) !== input.candidateId) throw new Error("Destination changed");
        if (previous) {
          const rollback = await safePath(root, `canon/plates/parts/.rollback-${randomUUID()}.tmp`, true);
          temporaryFiles.push(rollback);
          await fs.writeFile(rollback, previous, { flag: "wx" });
          await fs.rename(rollback, destination);
        } else { await fs.unlink(destination); }
      } catch { return fail(500, "The manifest was not saved and the part could not be restored safely. Stop and inspect the local art files."); }
      if (error instanceof PartApprovalError) throw error;
      return fail(500, "The manifest could not be saved. The previous part was restored; the scene was not rebuilt.");
    }
    return {
      partId: input.partId, candidateId: input.candidateId, source,
      manifestHash: normalizedManifestHash(updated), rebuildRequired: true,
      sizeWarning: width !== current.plate.width || height !== current.plate.height
        ? `Candidate is ${width} × ${height}; the assembler resizes it to the ${current.plate.width} × ${current.plate.height} base. Inspect alignment before rebuilding.` : null,
    };
  } finally {
    for (const file of temporaryFiles) await fs.unlink(file).catch(() => undefined);
    await lock.close();
    await fs.unlink(lockFile);
  }
}
