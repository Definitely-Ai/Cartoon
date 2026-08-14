// The publish core: everything the RUN IT button does, extracted so the
// Back Room API route and the MCP endpoint share one implementation. One
// atomic commit to the production branch (git data API — blob/tree/
// commit/ref), so a partial failure can never leave a half-published
// folder that breaks the public build.

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
  options: { n: number; title: string | null; caption: string | null; tags: string[] }[];
}> {
  const { token, repo } = requiredEnv();
  const api = gh(token);
  const listing = await api(`/repos/${repo}/contents/options/${day}?ref=${BRANCH}`);
  if (listing.status === 404) throw new PublishError(404, `No proofs filed under ${day}.`);
  if (!listing.ok) throw new PublishError(502, `GitHub said ${listing.status} listing ${day}.`);
  const files = ((await listing.json()) as { name: string }[]).map((f) => f.name);

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
    if (files.includes(`option-${n}.json`)) {
      const res = await api(`/repos/${repo}/contents/options/${day}/option-${n}.json?ref=${BRANCH}`);
      if (res.ok) {
        try {
          const file = (await res.json()) as { content: string };
          const parsed = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
          if (typeof parsed.title === "string") title = parsed.title;
          if (typeof parsed.caption === "string") caption = parsed.caption;
          if (Array.isArray(parsed.tags)) tags = parsed.tags.filter((t: unknown): t is string => typeof t === "string");
        } catch {
          // a malformed suggestion never blocks the listing
        }
      }
    }
    options.push({ n, title, caption, tags });
  }

  return { day, selected, options };
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
