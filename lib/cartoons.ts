import fs from "node:fs";
import path from "node:path";

// The filesystem-as-CMS data layer. Reads /cartoons/** at build time and
// validates everything: bad data must fail the build with the offending
// folder named, never silently ship.
//
// The slug IS the full folder name (YYYY-MM-DD-words). It is the permalink
// path (/cartoon/<folder-name>) and the public image filename
// (<folder-name>.png). Never derive a date-stripped slug — those collide
// across dates.

export type Cartoon = {
  /** Full folder name, e.g. "2026-08-01-the-long-term". */
  slug: string;
  title: string;
  caption: string;
  /** ISO YYYY-MM-DD, always equal to the folder prefix. */
  date: string;
  tags: string[];
  edition: number;
  /** Served by the site after prebuild copies it: /cartoons/<slug>.png */
  src: string;
  width: number;
  height: number;
  /** "{title} — {caption}" for every rendering of the artwork. */
  alt: string;
};

const FOLDER_RE = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Locate /cartoons relative to the build. `next build` runs with cwd =
 * site/, so the repo root is one level up. The fallback error names the
 * Vercel setting that is almost always the real cause when this path is
 * missing in CI.
 */
function cartoonsRoot(): string {
  const candidates = [
    path.resolve(process.cwd(), "..", "cartoons"),
    path.resolve(process.cwd(), "cartoons"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  throw new Error(
    `Cannot find the /cartoons folder (looked in: ${candidates.join(", ")}). ` +
      `The site reads the repo's /cartoons and /canon folders at build time. ` +
      `On Vercel, set Root Directory to "site" AND enable ` +
      `"Include source files outside of the Root Directory in the Build Step".`
  );
}

/** Read a PNG's pixel dimensions from its IHDR header — no image library needed. */
function pngSize(file: string): { width: number; height: number } {
  const fd = fs.openSync(file, "r");
  const buf = Buffer.alloc(24);
  try {
    fs.readSync(fd, buf, 0, 24, 0);
  } finally {
    fs.closeSync(fd);
  }
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!signature.every((byte, i) => buf[i] === byte) || buf.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error(`${file} is not a valid PNG file.`);
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function fail(folder: string, problem: string): never {
  throw new Error(`Cartoon validation failed in /cartoons/${folder}: ${problem}`);
}

function isRealDate(iso: string): boolean {
  const parsed = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === iso;
}

function readCartoon(root: string, folder: string): Cartoon {
  // Error 1 of 3 (see docs/PUBLISHING.md): meta.json missing, unreadable,
  // or a required field is missing/malformed.
  const metaPath = path.join(root, folder, "meta.json");
  if (!fs.existsSync(metaPath)) fail(folder, "meta.json is missing.");
  let meta: Record<string, unknown>;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch (err) {
    fail(folder, `meta.json is not valid JSON (${(err as Error).message}).`);
  }

  if (!FOLDER_RE.test(folder)) {
    fail(
      folder,
      `folder name must be YYYY-MM-DD-slug (lowercase words joined by hyphens); the folder name is the permalink.`
    );
  }

  const { title, caption, date, tags, edition } = meta as {
    title?: unknown; caption?: unknown; date?: unknown; tags?: unknown; edition?: unknown;
  };

  if (typeof title !== "string" || title.trim() === "") {
    fail(folder, `"title" is required and must be a non-empty string.`);
  }
  if (typeof caption !== "string" || caption.trim() === "") {
    fail(folder, `"caption" is required and must be a non-empty string.`);
  }

  // Error 2 of 3: the date is not a real ISO date, or it disagrees with the
  // folder name's date prefix.
  if (typeof date !== "string" || !DATE_RE.test(date) || !isRealDate(date)) {
    fail(folder, `"date" must be an ISO calendar date (YYYY-MM-DD); got ${JSON.stringify(date)}.`);
  }
  const folderDate = folder.slice(0, 10);
  if (date !== folderDate) {
    fail(folder, `"date" (${date}) must match the folder's date prefix (${folderDate}).`);
  }

  if (!Number.isInteger(edition) || (edition as number) < 1) {
    fail(folder, `"edition" must be a positive integer; got ${JSON.stringify(edition)}.`);
  }

  if (!Array.isArray(tags) || tags.length > 5 || tags.some((t) => typeof t !== "string" || t !== t.toLowerCase() || t.trim() === "")) {
    fail(folder, `"tags" must be 0–5 lowercase, non-empty strings; got ${JSON.stringify(tags)}.`);
  }

  const artwork = path.join(root, folder, "cartoon.png");
  if (!fs.existsSync(artwork)) fail(folder, "cartoon.png is missing.");
  const { width, height } = pngSize(artwork);

  const cleanTitle = (title as string).trim();
  const cleanCaption = (caption as string).trim();
  return {
    slug: folder,
    title: cleanTitle,
    caption: cleanCaption,
    date,
    tags: tags as string[],
    edition: edition as number,
    src: `/cartoons/${folder}.png`,
    width,
    height,
    alt: `${cleanTitle} — ${cleanCaption}`,
  };
}

let cache: Cartoon[] | null = null;

/** Every published cartoon, validated, sorted by date desc then edition desc. */
export function getAllCartoons(): Cartoon[] {
  if (cache) return cache;
  const root = cartoonsRoot();
  const folders = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "_TEMPLATE")
    .map((entry) => entry.name);

  const cartoons = folders.map((folder) => readCartoon(root, folder));

  // Error 3 of 3: editions must be unique across the whole archive — they
  // are the tiebreaker for sort order and the "Vol. 1 · No. N" folio.
  const byEdition = new Map<number, string>();
  for (const cartoon of cartoons) {
    const existing = byEdition.get(cartoon.edition);
    if (existing) {
      fail(cartoon.slug, `"edition" ${cartoon.edition} is already used by /cartoons/${existing}.`);
    }
    byEdition.set(cartoon.edition, cartoon.slug);
  }

  cartoons.sort((a, b) => (a.date === b.date ? b.edition - a.edition : a.date < b.date ? 1 : -1));
  cache = cartoons;
  return cartoons;
}

/** The newest cartoon — each variant's "Today's Edition". */
export function getLatest(): Cartoon {
  const all = getAllCartoons();
  if (all.length === 0) throw new Error("No cartoons found in /cartoons — the site has nothing to publish.");
  return all[0];
}

export function getBySlug(slug: string): Cartoon | undefined {
  return getAllCartoons().find((cartoon) => cartoon.slug === slug);
}

/**
 * Chronological neighbors of a cartoon. `newer` moves toward today,
 * `older` moves into the archive (both undefined at the ends).
 */
export function getAdjacent(slug: string): { newer?: Cartoon; older?: Cartoon } {
  const all = getAllCartoons();
  const index = all.findIndex((cartoon) => cartoon.slug === slug);
  if (index === -1) return {};
  return { newer: all[index - 1], older: all[index + 1] };
}

/** Unique tags across the archive, alphabetical. */
export function getAllTags(): string[] {
  return Array.from(new Set(getAllCartoons().flatMap((cartoon) => cartoon.tags))).sort();
}
