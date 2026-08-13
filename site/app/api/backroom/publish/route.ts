import { NextResponse, type NextRequest } from "next/server";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";

// RUN IT: publishing from the light table. The chosen option becomes a
// real edition in /cartoons via ONE atomic commit to the production branch
// (git data API — blob/tree/commit/ref), so a partial failure can never
// leave a half-published folder that breaks the public build. Vercel
// rebuilds on the commit and the cartoon is public in about a minute.
//
// Required env: GITHUB_TOKEN (fine-grained PAT, Contents read/write on the
// repo), plus GITHUB_REPO ("owner/name", defaults to Definitely-Ai/Cartoon).

export const runtime = "nodejs";

const API = "https://api.github.com";
const BRANCH = "main"; // the production branch Vercel deploys

type PublishBody = {
  day?: unknown;
  option?: unknown;
  title?: unknown;
  caption?: unknown;
  tags?: unknown;
};

function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

function gh(token: string) {
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
  const words = title
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  return words.join("-");
}

export async function POST(request: NextRequest) {
  if (!(await isDoorOpen(request.cookies.get(BACKROOM_COOKIE)?.value))) {
    return bad(401, "The door is closed. Knock first.");
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return bad(500, "GITHUB_TOKEN is not set — see docs/SETUP.md, 'The Back Room' section.");
  }
  const repo = process.env.GITHUB_REPO ?? "Definitely-Ai/Cartoon";

  let body: PublishBody;
  try {
    body = await request.json();
  } catch {
    return bad(400, "Malformed request body.");
  }

  const { day, option, title, caption } = body;
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return bad(400, "Bad day.");
  if (!Number.isInteger(option) || (option as number) < 1 || (option as number) > 20) {
    return bad(400, "Bad option number.");
  }
  if (typeof title !== "string" || !title.trim()) return bad(400, "The edition needs a title.");
  if (typeof caption !== "string" || !caption.trim()) return bad(400, "The edition needs a caption.");
  const tags = Array.isArray(body.tags)
    ? body.tags
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 5)
    : [];

  const cleanTitle = title.trim();
  const cleanCaption = caption.trim();
  const slugWords = slugify(cleanTitle);
  if (!slugWords) return bad(400, "The title needs at least one letter or number.");
  const slug = `${day}-${slugWords}`;
  const api = gh(token);

  try {
    // The chosen artwork must exist in the inbox; its blob sha lets the new
    // tree reference the bytes without re-uploading them.
    const optionRes = await api(`/repos/${repo}/contents/options/${day}/option-${option}.png?ref=${BRANCH}`);
    if (optionRes.status === 404) return bad(404, `No option-${option}.png filed under ${day}.`);
    if (!optionRes.ok) return bad(502, `GitHub said ${optionRes.status} fetching the option.`);
    const optionFile = (await optionRes.json()) as { sha: string };

    // Refuse a double landing: either this day already ran, or the folder
    // name is already taken.
    const selectedRes = await api(`/repos/${repo}/contents/options/${day}/selected.json?ref=${BRANCH}`);
    if (selectedRes.ok) return bad(409, `${day} already ran an edition. The ledger has the record.`);
    const slugRes = await api(`/repos/${repo}/contents/cartoons/${slug}?ref=${BRANCH}`);
    if (slugRes.ok) return bad(409, `/cartoons/${slug} already exists.`);

    // Next edition number: the newest dated folder holds the running max
    // (publishing always appends at today's end of the archive).
    const cartoonsRes = await api(`/repos/${repo}/contents/cartoons?ref=${BRANCH}`);
    if (!cartoonsRes.ok) return bad(502, `GitHub said ${cartoonsRes.status} listing /cartoons.`);
    const folders = ((await cartoonsRes.json()) as { name: string; type: string }[])
      .filter((entry) => entry.type === "dir" && entry.name !== "_TEMPLATE")
      .map((entry) => entry.name)
      .sort();
    let edition = folders.length + 1;
    if (folders.length > 0) {
      const newestMeta = await api(
        `/repos/${repo}/contents/cartoons/${folders[folders.length - 1]}/meta.json?ref=${BRANCH}`
      );
      if (newestMeta.ok) {
        const file = (await newestMeta.json()) as { content: string };
        const parsed = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
        if (Number.isInteger(parsed.edition)) edition = Math.max(edition, parsed.edition + 1);
      }
    }

    // One atomic commit: cartoon.png (existing blob), meta.json, and the
    // day's selected.json marker.
    const headRes = await api(`/repos/${repo}/git/ref/${encodeURIComponent(`heads/${BRANCH}`)}`);
    if (!headRes.ok) return bad(502, `GitHub said ${headRes.status} reading ${BRANCH}.`);
    const headSha = ((await headRes.json()) as { object: { sha: string } }).object.sha;

    const meta = { title: cleanTitle, caption: cleanCaption, date: day, tags, edition };
    const selected = {
      option,
      slug,
      publishedAt: new Date().toISOString(),
    };

    const treeRes = await api(`/repos/${repo}/git/trees`, {
      method: "POST",
      body: JSON.stringify({
        base_tree: headSha,
        tree: [
          { path: `cartoons/${slug}/cartoon.png`, mode: "100644", type: "blob", sha: optionFile.sha },
          {
            path: `cartoons/${slug}/meta.json`,
            mode: "100644",
            type: "blob",
            content: `${JSON.stringify(meta, null, 2)}\n`,
          },
          {
            path: `options/${day}/selected.json`,
            mode: "100644",
            type: "blob",
            content: `${JSON.stringify(selected, null, 2)}\n`,
          },
        ],
      }),
    });
    if (!treeRes.ok) return bad(502, `GitHub said ${treeRes.status} building the tree.`);
    const treeSha = ((await treeRes.json()) as { sha: string }).sha;

    const commitRes = await api(`/repos/${repo}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message: `cartoon: ${cleanTitle}\n\nRan option ${option} of ${day} from the back room.`,
        tree: treeSha,
        parents: [headSha],
      }),
    });
    if (!commitRes.ok) return bad(502, `GitHub said ${commitRes.status} writing the commit.`);
    const commitSha = ((await commitRes.json()) as { sha: string }).sha;

    const refRes = await api(`/repos/${repo}/git/refs/${encodeURIComponent(`heads/${BRANCH}`)}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: commitSha }),
    });
    if (!refRes.ok) {
      // A concurrent push slipped in between head read and ref update; the
      // commit dangles harmlessly. He can simply tap RUN IT again.
      return bad(409, "The presses were busy — try again.");
    }

    return NextResponse.json({ ok: true, slug, edition });
  } catch (err) {
    return bad(500, `Publish failed: ${(err as Error).message}`);
  }
}
