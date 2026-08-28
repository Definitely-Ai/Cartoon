// The publish core: everything the RUN IT button does, extracted so the
// Back Room API route and the MCP endpoint share one implementation. One
// atomic commit to the production branch (git data API — blob/tree/
// commit/ref), so a partial failure can never leave a half-published
// folder that breaks the public build.

import sharp from "sharp";

const API = "https://api.github.com";
const BRANCH = "main"; // the production branch Vercel deploys

export class PublishError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function requiredEnv(): { token: string; repo: string } {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new PublishError(500, "GITHUB_TOKEN is not set — see docs/SETUP.md, 'The Back Room' section.");
  }
  return { token, repo: process.env.GITHUB_REPO ?? "Definitely-Ai/Cartoon" };
}

export function gh(token: string) {
  return async (path: string, init?: RequestInit): Promise<Response> =>
    fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "swinging-door-backroom",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
      cache: "no-store",
    });
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join("-");
}

export type PublishInput = {
  day: string;
  option: number;
  title: string;
  caption: string;
  tags: string[];
};

export type PublishResult = { slug: string; edition: number };

/** Validate the pieces that arrive from either surface (button or chat). */
export function validatePublishInput(body: {
  day?: unknown;
  option?: unknown;
  title?: unknown;
  caption?: unknown;
  tags?: unknown;
}): PublishInput {
  const { day, option, title, caption } = body;
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new PublishError(400, "Bad day — use YYYY-MM-DD.");
  if (!Number.isInteger(option) || (option as number) < 1 || (option as number) > 20) {
    throw new PublishError(400, "Bad option number.");
  }
  if (typeof title !== "string" || !title.trim()) throw new PublishError(400, "The edition needs a title.");
  if (typeof caption !== "string" || !caption.trim()) throw new PublishError(400, "The edition needs a caption.");
  const tags = Array.isArray(body.tags)
    ? body.tags
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 5)
    : [];
  return { day, option: option as number, title: title.trim(), caption: caption.trim(), tags };
}

/** The whole publish, atomically. Throws PublishError with a human message. */
export async function publishOption(input: PublishInput): Promise<PublishResult> {
  const { token, repo } = requiredEnv();
  const { day, option, title, caption, tags } = input;
  const slugWords = slugify(title);
  if (!slugWords) throw new PublishError(400, "The title needs at least one letter or number.");
  const slug = `${day}-${slugWords}`;
  const api = gh(token);

  // The chosen artwork must exist in the inbox; its blob sha lets the new
  // tree reference the bytes without re-uploading them.
  const optionRes = await api(`/repos/${repo}/contents/options/${day}/option-${option}.png?ref=${BRANCH}`);
  if (optionRes.status === 404) throw new PublishError(404, `No option-${option}.png filed under ${day}.`);
  if (!optionRes.ok) throw new PublishError(502, `GitHub said ${optionRes.status} fetching the option.`);
  const optionFile = (await optionRes.json()) as { sha: string };

  // Refuse a double landing: either this day already ran, or the folder
  // name is already taken.
  const selectedRes = await api(`/repos/${repo}/contents/options/${day}/selected.json?ref=${BRANCH}`);
  if (selectedRes.ok) throw new PublishError(409, `${day} already ran an edition. The ledger has the record.`);
  const slugRes = await api(`/repos/${repo}/contents/cartoons/${slug}?ref=${BRANCH}`);
  if (slugRes.ok) throw new PublishError(409, `/cartoons/${slug} already exists.`);

  // Next edition number: the newest dated folder holds the running max
  // (publishing always appends at the archive's end).
  const cartoonsRes = await api(`/repos/${repo}/contents/cartoons?ref=${BRANCH}`);
  if (!cartoonsRes.ok) throw new PublishError(502, `GitHub said ${cartoonsRes.status} listing /cartoons.`);
  const folders = ((await cartoonsRes.json()) as { name: string; type: string }[])
    .filter((entry) => entry.type === "dir" && entry.name !== "_TEMPLATE")
    .map((entry) => entry.name)
    .sort();
  let edition = folders.length + 1;
  if (folders.length > 0) {
    const newestMeta = await api(`/repos/${repo}/contents/cartoons/${folders[folders.length - 1]}/meta.json?ref=${BRANCH}`);
    if (newestMeta.ok) {
      const file = (await newestMeta.json()) as { content: string };
      const parsed = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
      if (Number.isInteger(parsed.edition)) edition = Math.max(edition, parsed.edition + 1);
    }
  }

  // One atomic commit: cartoon.png (existing blob), meta.json, and the
  // day's selected.json marker.
  const headRes = await api(`/repos/${repo}/git/ref/${encodeURIComponent(`heads/${BRANCH}`)}`);
  if (!headRes.ok) throw new PublishError(502, `GitHub said ${headRes.status} reading ${BRANCH}.`);
  const headSha = ((await headRes.json()) as { object: { sha: string } }).object.sha;

  const meta = { title, caption, date: day, tags, edition };
  const selected = { option, slug, publishedAt: new Date().toISOString() };

  const treeRes = await api(`/repos/${repo}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: headSha,
      tree: [
        { path: `cartoons/${slug}/cartoon.png`, mode: "100644", type: "blob", sha: optionFile.sha },
        { path: `cartoons/${slug}/meta.json`, mode: "100644", type: "blob", content: `${JSON.stringify(meta, null, 2)}\n` },
        { path: `options/${day}/selected.json`, mode: "100644", type: "blob", content: `${JSON.stringify(selected, null, 2)}\n` },
      ],
    }),
  });
  if (!treeRes.ok) throw new PublishError(502, `GitHub said ${treeRes.status} building the tree.`);
  const treeSha = ((await treeRes.json()) as { sha: string }).sha;

  const commitRes = await api(`/repos/${repo}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: `cartoon: ${title}\n\nRan option ${option} of ${day} from the back room.`,
      tree: treeSha,
      parents: [headSha],
    }),
  });
  if (!commitRes.ok) throw new PublishError(502, `GitHub said ${commitRes.status} writing the commit.`);
  const commitSha = ((await commitRes.json()) as { sha: string }).sha;

  const refRes = await api(`/repos/${repo}/git/refs/${encodeURIComponent(`heads/${BRANCH}`)}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commitSha }),
  });
  if (!refRes.ok) {
    // A concurrent push slipped in between head read and ref update; the
    // commit dangles harmlessly. Simply try again.
    throw new PublishError(409, "The presses were busy — try again.");
  }

  return { slug, edition };
}

/** Live view of a day's proofs (reads GitHub, not the build), for chat. */
export async function readOptionDay(day: string): Promise<{
  day: string;
  selected: { option: number; slug: string } | null;
  keepers: number[];
  options: { n: number; title: string | null; caption: string | null; tags: string[]; topic: string | null; styleNotes: string | null }[];
}> {
  const { token, repo } = requiredEnv();
  const api = gh(token);
  const listing = await api(`/repos/${repo}/contents/options/${day}?ref=${BRANCH}`);
  if (listing.status === 404) throw new PublishError(404, `No proofs filed under ${day}.`);
  if (!listing.ok) throw new PublishError(502, `GitHub said ${listing.status} listing ${day}.`);
  const files = ((await listing.json()) as { name: string }[]).map((f) => f.name);

  let keepers: number[] = [];
  if (files.includes("keepers.json")) {
    const res = await api(`/repos/${repo}/contents/options/${day}/keepers.json?ref=${BRANCH}`);
    if (res.ok) {
      try {
        const file = (await res.json()) as { content: string };
        const parsed = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
        if (Array.isArray(parsed.keepers)) {
          keepers = parsed.keepers.filter((k: unknown): k is number => Number.isInteger(k));
        }
      } catch {
        // tolerate a mangled keepers file
      }
    }
  }

  let selected: { option: number; slug: string } | null = null;
  if (files.includes("selected.json")) {
    const sel = await api(`/repos/${repo}/contents/options/${day}/selected.json?ref=${BRANCH}`);
    if (sel.ok) {
      const file = (await sel.json()) as { content: string };
      const parsed = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
      if (Number.isInteger(parsed.option) && typeof parsed.slug === "string") {
        selected = { option: parsed.option, slug: parsed.slug };
      }
    }
  }

  const numbers = files
    .map((name) => name.match(/^option-(\d+)\.png$/)?.[1])
    .filter((n): n is string => Boolean(n))
    .map(Number)
    .sort((a, b) => a - b);

  const options = [];
  for (const n of numbers) {
    let title: string | null = null;
    let caption: string | null = null;
    let tags: string[] = [];
    let topic: string | null = null;
    let styleNotes: string | null = null;
    if (files.includes(`option-${n}.json`)) {
      const res = await api(`/repos/${repo}/contents/options/${day}/option-${n}.json?ref=${BRANCH}`);
      if (res.ok) {
        try {
          const file = (await res.json()) as { content: string };
          const parsed = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
          if (typeof parsed.title === "string") title = parsed.title;
          if (typeof parsed.caption === "string") caption = parsed.caption;
          if (Array.isArray(parsed.tags)) tags = parsed.tags.filter((t: unknown): t is string => typeof t === "string");
          if (typeof parsed.topic === "string" && parsed.topic.trim()) topic = parsed.topic.trim().toLowerCase();
          if (typeof parsed.style_notes === "string" && parsed.style_notes.trim()) styleNotes = parsed.style_notes.trim();
        } catch {
          // a malformed suggestion never blocks the listing
        }
      }
    }
    options.push({ n, title, caption, tags, topic, styleNotes });
  }

  return { day, selected, keepers, options };
}

/** The master prompt, live from the repo — canon can't go stale in chat. */
export async function getCanon(): Promise<string> {
  const { token, repo } = requiredEnv();
  const api = gh(token);
  const res = await api(`/repos/${repo}/contents/canon/MASTER-PROMPT.md?ref=${BRANCH}`);
  if (!res.ok) throw new PublishError(502, `GitHub said ${res.status} fetching the canon.`);
  const file = (await res.json()) as { content: string };
  return Buffer.from(file.content, "base64").toString("utf8");
}

/** Any canon document, live from the repo — so the whole bible, not just
 *  the master prompt, is reachable over the wire. */
const DOC_PATHS: Record<string, string> = {
  "canon-guide": "canon/README.md",
  comedy: "canon/comedy/COMEDY-BIBLE.md",
  settings: "canon/settings/SETTINGS-BIBLE.md",
  style: "canon/style/STYLE-BIBLE.md",
  personalities: "canon/personality/PERSONALITIES.md",
  workflow: "canon/creation/WORKFLOW.md",
  "scene-qc": "canon/creation/SCENE-QC.md",
  "panel-inspection": "canon/creation/PANEL-INSPECTION.md",
  "drew-bible": "canon/characters/flamingo/CHARACTER-BIBLE.md",
  "drew-qc": "canon/characters/flamingo/QUALITY-CONTROL.md",
  "mango-bible": "canon/characters/dog/CHARACTER-BIBLE.md",
  "mango-qc": "canon/characters/dog/QUALITY-CONTROL.md",
  "abby-bible": "canon/characters/abby/CHARACTER-BIBLE.md",
  "abby-qc": "canon/characters/abby/QUALITY-CONTROL.md",
};

export const DOC_NAMES = Object.keys(DOC_PATHS);

export async function getDoc(name: string): Promise<string> {
  const path = DOC_PATHS[name];
  if (!path) {
    throw new PublishError(400, `Unknown document "${name}" — one of: ${DOC_NAMES.join(", ")}.`);
  }
  const { token, repo } = requiredEnv();
  const res = await gh(token)(`/repos/${repo}/contents/${path}?ref=${BRANCH}`);
  if (res.status === 404) {
    throw new PublishError(404, `${path} is not in the repo yet.`);
  }
  if (!res.ok) throw new PublishError(502, `GitHub said ${res.status} fetching ${path}.`);
  const file = (await res.json()) as { content: string };
  return Buffer.from(file.content, "base64").toString("utf8");
}

// The canon references reference-sheet PNGs by filename (see the Mango
// bible) — but text can't show a drawing. These fetch the sheets live so
// the wire can hand them into the conversation as images.
const CHARACTER_DIRS: Record<string, string> = {
  mango: "dog",
  drew: "flamingo",
  abby: "abby",
};

/** Authority notes per sheet, mirrored from each bible's reference
 *  hierarchy: the full-body sheet is always the locked master. */
function sheetAuthority(name: string): string {
  if (name === "full-body-sheet.png") return "LOCKED MASTER — outranks every other reference";
  if (name === "identity-sheet.png") return "identity check for face and eyes";
  if (name === "lapel-pin-bible.png") return "the exact pin design, left lapel";
  return "specialist support — consult when its subject is in the scene";
}

export async function getModelSheets(
  character: string
): Promise<{ name: string; authority: string; base64: string; mime: string }[]> {
  const folder = CHARACTER_DIRS[character.toLowerCase().trim()];
  if (!folder) {
    throw new PublishError(400, `Unknown character "${character}" — use mango, drew, or abby.`);
  }
  const { token, repo } = requiredEnv();
  const api = gh(token);
  const listRes = await api(`/repos/${repo}/contents/canon/characters/${folder}?ref=${BRANCH}`);
  if (!listRes.ok) {
    throw new PublishError(502, `GitHub said ${listRes.status} listing the character folder.`);
  }
  const entries = (await listRes.json()) as { name: string; sha: string; type: string }[];
  // Locked master first — the order the reference hierarchy reads in.
  const pngs = entries
    .filter((f) => f.type === "file" && /\.png$/i.test(f.name))
    .sort((a, b) => {
      const rank = (n: string) =>
        n === "full-body-sheet.png" ? 0 : n === "identity-sheet.png" ? 1 : 2;
      return rank(a.name) - rank(b.name) || a.name.localeCompare(b.name);
    });
  const sheets: { name: string; authority: string; base64: string; mime: string }[] = [];
  for (const f of pngs) {
    // The blobs API inlines any size (the contents API stops at ~1MB, and
    // sheet exports routinely exceed that).
    const res = await api(`/repos/${repo}/git/blobs/${f.sha}`);
    if (!res.ok) continue;
    const blob = (await res.json()) as { content?: string; encoding?: string };
    if (!blob.content || blob.encoding !== "base64") continue;
    // Normalize for the wire: these are working references, not print
    // masters — grayscale JPEG within 1500px travels light no matter how
    // heavy the committed export was, and keeps a full character set far
    // inside Vercel's response ceiling.
    const raw = Buffer.from(blob.content, "base64");
    const normalized = await sharp(raw)
      .flatten({ background: "#ffffff" })
      .grayscale()
      .resize(1500, 1500, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toBuffer();
    sheets.push({
      name: f.name,
      authority: sheetAuthority(f.name),
      base64: normalized.toString("base64"),
      mime: "image/jpeg",
    });
  }
  return sheets;
}

/**
 * File one finished cartoon into today's batch: auto-numbered, one atomic
 * commit (finished PNG + suggestion JSON). The PNG arrives here already
 * typeset by lib/dialogue — this function only numbers and commits.
 */
export async function fileCartoon(input: {
  day: string;
  title: string;
  caption: string;
  topic: string | null;
  tags: string[];
  styleNotes: string | null;
  finishedPng: Buffer;
}): Promise<{ day: string; option: number }> {
  const { token, repo } = requiredEnv();
  const { day, title, caption, topic, tags, finishedPng } = input;
  void input.styleNotes;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new PublishError(400, "Bad day — use YYYY-MM-DD.");
  if (!title.trim()) throw new PublishError(400, "The cartoon needs a title.");
  if (!caption.trim()) throw new PublishError(400, "The cartoon needs its caption.");
  const api = gh(token);

  // Next free option number for the day (batches can arrive in waves).
  const listing = await api(`/repos/${repo}/contents/options/${day}?ref=${BRANCH}`);
  let next = 1;
  if (listing.ok) {
    const names = ((await listing.json()) as { name: string }[]).map((f) => f.name);
    const used = names
      .map((name) => name.match(/^option-(\d+)\.png$/)?.[1])
      .filter((n): n is string => Boolean(n))
      .map(Number);
    next = used.length ? Math.max(...used) + 1 : 1;
  } else if (listing.status !== 404) {
    throw new PublishError(502, `GitHub said ${listing.status} listing ${day}.`);
  }

  const headRes = await api(`/repos/${repo}/git/ref/${encodeURIComponent(`heads/${BRANCH}`)}`);
  if (!headRes.ok) throw new PublishError(502, `GitHub said ${headRes.status} reading ${BRANCH}.`);
  const headSha = ((await headRes.json()) as { object: { sha: string } }).object.sha;

  const blobRes = await api(`/repos/${repo}/git/blobs`, {
    method: "POST",
    body: JSON.stringify({ content: finishedPng.toString("base64"), encoding: "base64" }),
  });
  if (!blobRes.ok) throw new PublishError(502, `GitHub said ${blobRes.status} uploading the artwork.`);
  const blobSha = ((await blobRes.json()) as { sha: string }).sha;

  const suggestion = {
    title: title.trim(),
    caption: caption.trim(),
    tags: tags.slice(0, 5),
    ...(topic ? { topic: topic.trim().toLowerCase() } : {}),
    ...(input.styleNotes ? { style_notes: input.styleNotes.trim() } : {}),
  };

  const treeRes = await api(`/repos/${repo}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: headSha,
      tree: [
        { path: `options/${day}/option-${next}.png`, mode: "100644", type: "blob", sha: blobSha },
        {
          path: `options/${day}/option-${next}.json`,
          mode: "100644",
          type: "blob",
          content: `${JSON.stringify(suggestion, null, 2)}\n`,
        },
      ],
    }),
  });
  if (!treeRes.ok) throw new PublishError(502, `GitHub said ${treeRes.status} building the tree.`);
  const treeSha = ((await treeRes.json()) as { sha: string }).sha;

  const commitRes = await api(`/repos/${repo}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: `file: ${title.trim()} (option ${next} of ${day})`,
      tree: treeSha,
      parents: [headSha],
    }),
  });
  if (!commitRes.ok) throw new PublishError(502, `GitHub said ${commitRes.status} writing the commit.`);
  const commitSha = ((await commitRes.json()) as { sha: string }).sha;

  const refRes = await api(`/repos/${repo}/git/refs/${encodeURIComponent(`heads/${BRANCH}`)}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commitSha }),
  });
  if (!refRes.ok) throw new PublishError(409, "The presses were busy — file it again.");

  return { day, option: next };
}

// Two dials per cartoon, the founder's spec: art 1-10 and caption 1-10.
// A cartoon LANDS when both are >= 6; the studio goal is a 60% landed rate.
export type FeedbackEntry = { art?: number; caption?: number; note?: string; at?: string };

export const LANDED_MIN = 6;

export function landed(entry: FeedbackEntry | undefined): boolean {
  return !!entry && (entry.art ?? 0) >= LANDED_MIN && (entry.caption ?? 0) >= LANDED_MIN;
}

function validScore(n: unknown): n is number {
  return Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 10;
}

/**
 * Record the founder's scores and/or note for one option — the training
 * week's core write. Merges into options/<day>/feedback.json (one file per
 * day, one entry per option) so a whole week of taste survives as data.
 */
export async function setFeedback(
  day: string,
  option: number,
  patch: { art?: number; caption?: number; note?: string }
): Promise<FeedbackEntry> {
  const { token, repo } = requiredEnv();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new PublishError(400, "Bad day — use YYYY-MM-DD.");
  if (!Number.isInteger(option) || option < 1 || option > 50) throw new PublishError(400, "Bad option number.");
  if (patch.art !== undefined && !validScore(patch.art)) {
    throw new PublishError(400, "The art score must be a whole number from 1 to 10.");
  }
  if (patch.caption !== undefined && !validScore(patch.caption)) {
    throw new PublishError(400, "The caption score must be a whole number from 1 to 10.");
  }
  const api = gh(token);

  const optionRes = await api(`/repos/${repo}/contents/options/${day}/option-${option}.png?ref=${BRANCH}`);
  if (optionRes.status === 404) throw new PublishError(404, `No option-${option}.png filed under ${day}.`);
  if (!optionRes.ok) throw new PublishError(502, `GitHub said ${optionRes.status} checking the option.`);

  const feedbackPath = `options/${day}/feedback.json`;
  const existingRes = await api(`/repos/${repo}/contents/${feedbackPath}?ref=${BRANCH}`);
  let sha: string | undefined;
  let all: Record<string, FeedbackEntry> = {};
  if (existingRes.ok) {
    const file = (await existingRes.json()) as { sha: string; content: string };
    sha = file.sha;
    try {
      const parsed = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
      if (parsed && typeof parsed === "object") all = parsed;
    } catch {
      // a mangled feedback file gets rewritten cleanly
    }
  }

  const entry: FeedbackEntry = { ...all[String(option)] };
  if (patch.art !== undefined) entry.art = patch.art;
  if (patch.caption !== undefined) entry.caption = patch.caption;
  if (patch.note !== undefined) {
    const note = patch.note.trim();
    if (note) entry.note = note;
    else delete entry.note;
  }
  entry.at = new Date().toISOString();
  all[String(option)] = entry;

  const putRes = await api(`/repos/${repo}/contents/${feedbackPath}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `feedback: option ${option} of ${day}`,
      content: Buffer.from(`${JSON.stringify(all, null, 2)}\n`).toString("base64"),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!putRes.ok) throw new PublishError(502, `GitHub said ${putRes.status} saving the feedback.`);
  return entry;
}

/**
 * The whole training corpus in one read: every day, every option, with
 * title, caption, topic, verdict, keeper flag, and note. This is what the
 * bible-refinement session consumes.
 */
export async function getAllFeedback(): Promise<string> {
  const days = await listOptionDays();
  const lines: string[] = [];
  const trend: string[] = [];
  let rated = 0;
  let total = 0;
  let landedTotal = 0;
  for (const day of days) {
    const table = await readOptionDay(day);
    const feedback = await readFeedbackFile(day);
    lines.push(`\n## ${day}`);
    let dayRated = 0;
    let dayLanded = 0;
    let artSum = 0;
    let captionSum = 0;
    for (const option of table.options) {
      total++;
      const entry = feedback[String(option.n)] ?? {};
      const hasBoth = validScore(entry.art) && validScore(entry.caption);
      const didLand = landed(entry);
      if (hasBoth) {
        rated++;
        dayRated++;
        artSum += entry.art as number;
        captionSum += entry.caption as number;
        if (didLand) {
          dayLanded++;
          landedTotal++;
        }
      }
      const scoreText = hasBoth
        ? `art ${entry.art}/10, caption ${entry.caption}/10 — ${didLand ? "LANDED" : `MISS (${(entry.art as number) < LANDED_MIN && (entry.caption as number) < LANDED_MIN ? "both" : (entry.art as number) < LANDED_MIN ? "art" : "caption"})`}`
        : validScore(entry.art)
          ? `art ${entry.art}/10, caption unscored`
          : validScore(entry.caption)
            ? `caption ${entry.caption}/10, art unscored`
            : "unrated";
      lines.push(
        `- Option ${option.n}${table.keepers.includes(option.n) ? " ★KEEPER" : ""} ` +
          `[${scoreText}]${option.topic ? ` (topic: ${option.topic})` : ""}: ` +
          `${option.title ?? "untitled"} — "${option.caption ?? ""}"` +
          (option.styleNotes ? `\n  Deliberate variation: ${option.styleNotes}` : "") +
          (entry.note ? `\n  His note: ${entry.note}` : "")
      );
    }
    trend.push(
      `${day}: ${table.options.length} filed, ${dayRated} rated, ` +
        `${dayLanded} landed, ${table.keepers.length} keepers` +
        (dayRated
          ? ` (landed ${Math.round((dayLanded / dayRated) * 100)}% · art avg ${(artSum / dayRated).toFixed(1)} · caption avg ${(captionSum / dayRated).toFixed(1)})`
          : "")
    );
  }
  const overallRate = rated ? Math.round((landedTotal / rated) * 100) : 0;
  return (
    `Founder feedback — ${rated} of ${total} fully rated. A cartoon LANDS when art >= ${LANDED_MIN} ` +
    `AND caption >= ${LANDED_MIN}. STUDIO GOAL: 60% landed. Currently: ${overallRate}% landed.\n\n` +
    `TREND (is the bible converging? the landed rate should climb as revisions take):\n` +
    trend.map((t) => `  ${t}`).join("\n") +
    `\n\nAnalysis hints: the two dials attribute failures — a low art average points at the visual ` +
    `bibles and the image prompt, a low caption average at the comedy bible and caption style. ` +
    `Compare siblings within the same day and topic (shared prompt, so score differences are pure ` +
    `signal), and read "deliberate variation" tags as the controlled experiments they are.` +
    lines.join("\n")
  );
}

async function readFeedbackFile(day: string): Promise<Record<string, FeedbackEntry>> {
  const { token, repo } = requiredEnv();
  const api = gh(token);
  const res = await api(`/repos/${repo}/contents/options/${day}/feedback.json?ref=${BRANCH}`);
  if (!res.ok) return {};
  try {
    const file = (await res.json()) as { content: string };
    const parsed = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Star or unstar an option — the founder's "keeper" mark. One small file
 * per day (keepers.json), updated via the contents API; the site rebuilds
 * on the commit and the star shows everywhere.
 */
export async function setKeeper(day: string, option: number, on: boolean): Promise<number[]> {
  const { token, repo } = requiredEnv();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new PublishError(400, "Bad day — use YYYY-MM-DD.");
  if (!Number.isInteger(option) || option < 1 || option > 50) throw new PublishError(400, "Bad option number.");
  const api = gh(token);

  const optionRes = await api(`/repos/${repo}/contents/options/${day}/option-${option}.png?ref=${BRANCH}`);
  if (optionRes.status === 404) throw new PublishError(404, `No option-${option}.png filed under ${day}.`);
  if (!optionRes.ok) throw new PublishError(502, `GitHub said ${optionRes.status} checking the option.`);

  const keepersPath = `options/${day}/keepers.json`;
  const existingRes = await api(`/repos/${repo}/contents/${keepersPath}?ref=${BRANCH}`);
  let sha: string | undefined;
  let keepers: number[] = [];
  if (existingRes.ok) {
    const file = (await existingRes.json()) as { sha: string; content: string };
    sha = file.sha;
    try {
      const parsed = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
      if (Array.isArray(parsed.keepers)) {
        keepers = parsed.keepers.filter((k: unknown): k is number => Number.isInteger(k));
      }
    } catch {
      // a mangled keepers file gets rewritten cleanly
    }
  }

  const next = on
    ? Array.from(new Set([...keepers, option])).sort((a, b) => a - b)
    : keepers.filter((k) => k !== option);
  if (next.length === keepers.length && next.every((k, i) => k === keepers[i])) return next;

  const putRes = await api(`/repos/${repo}/contents/${keepersPath}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `keeper: ${on ? "star" : "unstar"} option ${option} of ${day}`,
      content: Buffer.from(`${JSON.stringify({ keepers: next }, null, 2)}\n`).toString("base64"),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!putRes.ok) throw new PublishError(502, `GitHub said ${putRes.status} saving the star.`);
  return next;
}

/** The days on file, newest first (names only — cheap). */
export async function listOptionDays(): Promise<string[]> {
  const { token, repo } = requiredEnv();
  const api = gh(token);
  const res = await api(`/repos/${repo}/contents/options?ref=${BRANCH}`);
  if (res.status === 404) return [];
  if (!res.ok) throw new PublishError(502, `GitHub said ${res.status} listing /options.`);
  return ((await res.json()) as { name: string; type: string }[])
    .filter((entry) => entry.type === "dir" && /^\d{4}-\d{2}-\d{2}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort()
    .reverse();
}

// ------------------------------------------------- generic repo file access
// The training pipeline runs half in the repo (curation, zipping) and half in
// production (generation, training) — these two helpers are the bridge: the
// deployed app commits generated images INTO the repo so they can be pulled
// and inspected, and reads big binaries (reference boards, the training zip)
// OUT of it without ever needing a checkout.

/**
 * One atomic commit of small files to the production branch. Retries once
 * when a concurrent push moves the head between read and update; a second
 * loss surfaces as 409 and the caller simply runs again — every caller of
 * this is idempotent by design.
 */
export async function commitFiles(
  files: { path: string; content: Buffer | string }[],
  message: string
): Promise<string> {
  const { token, repo } = requiredEnv();
  const api = gh(token);

  for (let attempt = 0; attempt < 2; attempt++) {
    const headRes = await api(`/repos/${repo}/git/ref/${encodeURIComponent(`heads/${BRANCH}`)}`);
    if (!headRes.ok) throw new PublishError(502, `GitHub said ${headRes.status} reading ${BRANCH}.`);
    const headSha = ((await headRes.json()) as { object: { sha: string } }).object.sha;

    // Binary content goes up as blobs first; text can ride in the tree.
    const tree: Record<string, unknown>[] = [];
    for (const file of files) {
      if (typeof file.content === "string") {
        tree.push({ path: file.path, mode: "100644", type: "blob", content: file.content });
      } else {
        const blobRes = await api(`/repos/${repo}/git/blobs`, {
          method: "POST",
          body: JSON.stringify({ content: file.content.toString("base64"), encoding: "base64" }),
        });
        if (!blobRes.ok) throw new PublishError(502, `GitHub said ${blobRes.status} uploading ${file.path}.`);
        tree.push({ path: file.path, mode: "100644", type: "blob", sha: ((await blobRes.json()) as { sha: string }).sha });
      }
    }

    const treeRes = await api(`/repos/${repo}/git/trees`, {
      method: "POST",
      body: JSON.stringify({ base_tree: headSha, tree }),
    });
    if (!treeRes.ok) throw new PublishError(502, `GitHub said ${treeRes.status} building the tree.`);

    const commitRes = await api(`/repos/${repo}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message,
        tree: ((await treeRes.json()) as { sha: string }).sha,
        parents: [headSha],
      }),
    });
    if (!commitRes.ok) throw new PublishError(502, `GitHub said ${commitRes.status} writing the commit.`);
    const commitSha = ((await commitRes.json()) as { sha: string }).sha;

    const refRes = await api(`/repos/${repo}/git/refs/${encodeURIComponent(`heads/${BRANCH}`)}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: commitSha }),
    });
    if (refRes.ok) return commitSha;
    if (attempt === 0) continue; // a concurrent push won the race — re-read head and retry once
  }
  throw new PublishError(409, "The repo is busy — run the request again.");
}

/**
 * Read one file from the production branch, any size the blobs API allows
 * (the contents API alone stops inlining past ~1MB). Returns null when the
 * path does not exist.
 */
export async function readRepoFile(filePath: string): Promise<{ bytes: Buffer; sha: string } | null> {
  const { token, repo } = requiredEnv();
  const api = gh(token);
  const metaRes = await api(`/repos/${repo}/contents/${filePath}?ref=${BRANCH}`);
  if (metaRes.status === 404) return null;
  if (!metaRes.ok) throw new PublishError(502, `GitHub said ${metaRes.status} for ${filePath}.`);
  const meta = (await metaRes.json()) as { sha: string; content?: string; encoding?: string };
  if (meta.content && meta.encoding === "base64") {
    return { bytes: Buffer.from(meta.content, "base64"), sha: meta.sha };
  }
  const blobRes = await api(`/repos/${repo}/git/blobs/${meta.sha}`);
  if (!blobRes.ok) throw new PublishError(502, `GitHub said ${blobRes.status} reading the blob for ${filePath}.`);
  const blob = (await blobRes.json()) as { content: string };
  return { bytes: Buffer.from(blob.content, "base64"), sha: meta.sha };
}

/** Names of files directly under a repo directory (empty when absent). */
export async function listRepoDir(dirPath: string): Promise<string[]> {
  const { token, repo } = requiredEnv();
  const api = gh(token);
  const res = await api(`/repos/${repo}/contents/${dirPath}?ref=${BRANCH}`);
  if (res.status === 404) return [];
  if (!res.ok) throw new PublishError(502, `GitHub said ${res.status} listing ${dirPath}.`);
  return ((await res.json()) as { name: string; type: string }[]).filter((e) => e.type === "file").map((e) => e.name);
}
