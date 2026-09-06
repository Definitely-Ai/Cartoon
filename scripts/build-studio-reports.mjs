import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Read-only: this never fetches, checks out, stages, commits, or changes Git refs.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "lib/studio-reports-snapshot.json");
const generatedAt = new Date().toISOString();
if (process.env.STUDIO_ASSET_MODE === "snapshot") {
  const saved = JSON.parse(readFileSync(output, "utf8"));
  if (!Array.isArray(saved.commits) || !saved.generatedAt) throw new Error("A dated report snapshot is required for a snapshot deployment.");
  console.log(`reports: retaining reviewed snapshot from ${saved.generatedAt}; runtime GitHub checks remain enabled.`);
  process.exit(0);
}
const repo = process.env.GITHUB_REPO || "Definitely-Ai/Cartoon";
const branch = process.env.GITHUB_REPORT_BRANCH || "main";
const git = (...args) => execFileSync("git", ["-c", "core.quotepath=false", ...args], {
  cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"],
}).trimEnd();
const tryGit = (...args) => { try { return git(...args); } catch { return null; } };
const dateKey = (date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date(date));

function readCommits(ref) {
  const raw = git("log", ref, "--format=%x1e%H%x1f%cI%x1f%s%x1f%P", "--name-status", "--no-renames");
  return raw.split("\x1e").filter(Boolean).map((record) => {
    const [header, ...lines] = record.trim().split(/\r?\n/);
    const [sha, committedAt, subject, parents] = header.split("\x1f");
    const files = lines.filter((line) => /^[AMDCRTUXB]\t/.test(line)).map((line) => {
      const tab = line.indexOf("\t");
      return { path: line.slice(tab + 1), status: line[0] === "A" ? "added" : line[0] === "D" ? "removed" : "modified" };
    });
    return { sha, committedAt, day: dateKey(committedAt), subject, merge: parents.split(" ").length > 1, files, filesComplete: true };
  });
}

if (!tryGit("rev-parse", "--git-dir")) {
  if (!existsSync(output)) throw new Error("Daily reports need Git history or a saved studio-reports-snapshot.json.");
  console.log("reports: no Git checkout; retaining the existing dated snapshot.");
  process.exit(0);
}

let remoteSha = null;
let githubCheckedAt = null;
let liveCheckNote = null;
if (!process.argv.includes("--offline")) {
  try {
    const token = process.env.GITHUB_REPORT_TOKEN || process.env.GITHUB_TOKEN;
    const response = await fetch(`https://api.github.com/repos/${repo}/commits/${encodeURIComponent(branch)}`, {
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "swinging-door-daily-report", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}.`);
    remoteSha = (await response.json()).sha;
    githubCheckedAt = new Date().toISOString();
  } catch (error) { liveCheckNote = `GitHub could not be checked at build time. ${error.message}`; }
}

const trackingRef = `refs/remotes/origin/${branch}`;
const trackingSha = tryGit("rev-parse", "--verify", trackingRef);
const saved = existsSync(output) ? JSON.parse(readFileSync(output, "utf8")) : null;
const verifiedRef = remoteSha && tryGit("cat-file", "-t", remoteSha) === "commit" ? remoteSha : null;
const sourceRef = verifiedRef || trackingSha;
if (!sourceRef) {
  if (!saved) throw new Error("No verified GitHub branch history found. Fetch origin before building the initial report.");
  console.log("reports: GitHub branch is not in this checkout; retaining the existing dated snapshot.");
  process.exit(0);
}

const commits = readCommits(sourceRef);
const isShallow = git("rev-parse", "--is-shallow-repository") === "true";
const head = git("rev-parse", "HEAD");
const relation = tryGit("rev-list", "--left-right", "--count", `${sourceRef}...HEAD`)?.split(/\s+/).map(Number);
const statusTokens = git("status", "--porcelain=v1", "-z", "--untracked-files=all").split("\0");
const files = [];
for (let index = 0; index < statusTokens.length; index++) {
  const item = statusTokens[index];
  if (!item) continue;
  const code = item.slice(0, 2);
  const file = item.slice(3);
  // Renames have a second NUL-delimited path; retain the destination only.
  if (code.includes("R") || code.includes("C")) index++;
  if (/^(lib\/studio-reports-snapshot\.json|.*\.tsbuildinfo)$/.test(file) || /^(public\/studio-library|studio-library\/assets)\//.test(file)) continue;
  let modifiedAt = null;
  try { modifiedAt = statSync(path.join(root, file)).mtime.toISOString(); } catch { /* Deleted file. */ }
  files.push({ path: file, status: code === "??" ? "untracked" : code.includes("D") ? "removed" : code.includes("A") ? "added" : "modified", modifiedAt });
}

const oldest = [...commits].sort((a, b) => a.committedAt.localeCompare(b.committedAt))[0];
const snapshot = {
  schemaVersion: 1, repo, branch, generatedAt, githubCheckedAt,
  source: verifiedRef ? "github-verified" : "remote-tracking",
  snapshotSha: sourceRef,
  liveCheckNote: liveCheckNote || (remoteSha && remoteSha !== sourceRef ? "GitHub has newer work than this checkout. The live report checks the selected day separately." : null),
  coverage: { complete: !isShallow, earliestDay: oldest?.day || null, commitCount: commits.length },
  commits,
  local: { capturedAt: generatedAt, head, remoteHead: sourceRef, behind: relation?.[0] ?? null, ahead: relation?.[1] ?? null, files },
};
// A shallow deployment checkout should not erase the full report archive.
if (isShallow && saved?.repo === repo && saved?.branch === branch) {
  const combined = new Map(saved.commits.map((commit) => [commit.sha, commit]));
  for (const commit of commits) combined.set(commit.sha, commit);
  snapshot.commits = [...combined.values()].sort((a, b) => b.committedAt.localeCompare(a.committedAt));
  snapshot.coverage = { complete: false, earliestDay: saved.coverage.earliestDay, commitCount: combined.size };
  snapshot.liveCheckNote = "This build has shallow Git history. The saved archive is retained; current-day work is checked against GitHub when opened.";
}
writeFileSync(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`reports: ${snapshot.commits.length} GitHub-branch commits; ${files.length} local working files; snapshot ${generatedAt}.`);
