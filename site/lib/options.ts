import fs from "node:fs";
import path from "node:path";

// The Back Room's data layer. /options is the daily inbox: the art agent
// drops N candidate cartoons per day, the founder picks one from the light
// table, and publishing moves the winner into /cartoons (the public side).
//
//   /options/
//     2026-08-13/
//       option-1.png        ← required per option
//       option-1.json       ← optional {title, caption, tags} suggestion
//       option-2.png …
//       selected.json       ← written by the publish API {option, slug, publishedAt}
//
// Unlike /cartoons (public, validated hard), options are DRAFTS: a malformed
// suggestion file must never break the site build, so everything here
// degrades to nulls with a console warning. Strictness is enforced at
// publish time instead.

export type CartoonOption = {
  day: string;
  n: number;
  /** Auth-gated static asset (middleware guards the whole site now). */
  src: string;
  width: number;
  height: number;
  title: string | null;
  caption: string | null;
  tags: string[];
  /** The request that produced this batch, e.g. "fishing" — from the JSON. */
  topic: string | null;
  /** Starred by the founder (keepers.json). */
  keeper: boolean;
  /** Training-week verdict: 3 love, 2 fine, 1 not for me (feedback.json). */
  rating: 1 | 2 | 3 | null;
  /** His optional note on why. */
  note: string | null;
};

export type OptionDay = {
  /** ISO YYYY-MM-DD — the folder name. */
  day: string;
  options: CartoonOption[];
  /** Option numbers the founder starred. */
  keepers: number[];
  /** How many options carry a verdict. */
  ratedCount: number;
  selected: { option: number; slug: string; publishedAt?: string } | null;
};

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const OPTION_PNG_RE = /^option-(\d+)\.png$/;

function optionsRoot(): string | null {
  const candidates = [
    path.resolve(process.cwd(), "..", "options"),
    path.resolve(process.cwd(), "options"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return null; // no inbox yet — the Back Room shows its empty state
}

/** PNG IHDR dimensions — same trick as the cartoons layer, kept local so the
 *  drafts side never imports (and can never break) the public side. */
function pngSize(file: string): { width: number; height: number } | null {
  try {
    const fd = fs.openSync(file, "r");
    const buf = Buffer.alloc(24);
    try {
      fs.readSync(fd, buf, 0, 24, 0);
    } finally {
      fs.closeSync(fd);
    }
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (!signature.every((byte, i) => buf[i] === byte)) return null;
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
}

function readJsonLoose(file: string): Record<string, unknown> | null {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    console.warn(`[options] ignoring malformed ${file}: ${(err as Error).message}`);
    return null;
  }
}

function readDay(root: string, day: string): OptionDay | null {
  const dir = path.join(root, day);
  const files = fs.readdirSync(dir);
  const options: CartoonOption[] = [];

  const feedbackRaw = readJsonLoose(path.join(dir, "feedback.json")) ?? {};
  const keepersRaw = readJsonLoose(path.join(dir, "keepers.json"));
  const keepers = Array.isArray(keepersRaw?.keepers)
    ? (keepersRaw!.keepers as unknown[]).filter((k): k is number => Number.isInteger(k))
    : [];

  for (const file of files) {
    const match = file.match(OPTION_PNG_RE);
    if (!match) continue;
    const n = Number(match[1]);
    const size = pngSize(path.join(dir, file));
    if (!size) {
      console.warn(`[options] ${day}/${file} is not a readable PNG — skipping`);
      continue;
    }
    const meta = readJsonLoose(path.join(dir, `option-${n}.json`));
    const tags = Array.isArray(meta?.tags)
      ? (meta!.tags as unknown[]).filter((t): t is string => typeof t === "string").slice(0, 5)
      : [];
    options.push({
      day,
      n,
      src: `/backroom-assets/options/${day}/option-${n}.png`,
      width: size.width,
      height: size.height,
      title: typeof meta?.title === "string" && meta.title.trim() ? (meta.title as string).trim() : null,
      caption:
        typeof meta?.caption === "string" && meta.caption.trim() ? (meta.caption as string).trim() : null,
      tags,
      topic:
        typeof meta?.topic === "string" && meta.topic.trim() ? (meta.topic as string).trim().toLowerCase() : null,
      keeper: keepers.includes(n),
      rating: (() => {
        const entry = (feedbackRaw as Record<string, { rating?: unknown }>)[String(n)];
        return entry && [1, 2, 3].includes(entry.rating as number) ? (entry.rating as 1 | 2 | 3) : null;
      })(),
      note: (() => {
        const entry = (feedbackRaw as Record<string, { note?: unknown }>)[String(n)];
        return entry && typeof entry.note === "string" && entry.note.trim() ? (entry.note as string).trim() : null;
      })(),
    });
  }

  if (options.length === 0) return null;
  options.sort((a, b) => a.n - b.n);

  const selectedRaw = readJsonLoose(path.join(dir, "selected.json"));
  const selected =
    selectedRaw && typeof selectedRaw.slug === "string" && Number.isInteger(selectedRaw.option)
      ? {
          option: selectedRaw.option as number,
          slug: selectedRaw.slug as string,
          publishedAt: typeof selectedRaw.publishedAt === "string" ? selectedRaw.publishedAt : undefined,
        }
      : null;

  return {
    day,
    options,
    keepers: keepers.filter((k) => options.some((o) => o.n === k)),
    ratedCount: options.filter((o) => o.rating !== null).length,
    selected,
  };
}

/** Every starred cartoon across all days, newest first. */
export function getKeepers(): CartoonOption[] {
  return getOptionDays().flatMap((day) => day.options.filter((option) => option.keeper));
}

let cache: OptionDay[] | null = null;

/** Every option day, newest first. */
export function getOptionDays(): OptionDay[] {
  if (cache) return cache;
  const root = optionsRoot();
  if (!root) return (cache = []);
  const days = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && DAY_RE.test(entry.name))
    .map((entry) => entry.name)
    .sort()
    .reverse();
  cache = days.map((day) => readDay(root, day)).filter((d): d is OptionDay => d !== null);
  return cache;
}

export function getOptionDay(day: string): OptionDay | undefined {
  return getOptionDays().find((d) => d.day === day);
}

/** The newest day still awaiting a decision, else the newest day. */
export function getDeskDay(): OptionDay | undefined {
  const days = getOptionDays();
  return days.find((d) => !d.selected) ?? days[0];
}
