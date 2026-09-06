import snapshotData from "./studio-reports-snapshot.json";
import { easternDay, githubWindow, validReportDay, type ReportCommit, type ReportSnapshot } from "./studio-reports-core";

const snapshot = snapshotData as unknown as ReportSnapshot;
const liveCache = new Map<string, { expires: number; value: Promise<LiveDay> }>();
const API = "https://api.github.com";

type GithubCommit = {
  sha: string; commit: { message: string; committer: { date: string } | null; author: { date: string } | null };
  parents: { sha: string }[];
  files?: { filename: string; status: string }[];
};
type LiveDay = { commits: ReportCommit[]; checkedAt: string; complete: boolean; notes: string[] };

export async function reportGithubFetch(path: string, accept = "application/vnd.github+json") {
  const token = process.env.GITHUB_REPORT_TOKEN || process.env.GITHUB_TOKEN;
  const response = await fetch(`${API}/repos/${snapshot.repo}${path}`, {
    headers: { Accept: accept, "User-Agent": "swinging-door-daily-report", "X-GitHub-Api-Version": "2022-11-28", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: "no-store", signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    if (response.status === 403 || response.status === 429) throw new Error("GitHub is limiting requests. The saved report is still available; try again later.");
    if (response.status === 404) throw new Error("The GitHub history could not be opened. Check the repository and the server's read access.");
    throw new Error(`GitHub could not answer this request (${response.status}).`);
  }
  return response;
}

function fromGithub(commit: GithubCommit): ReportCommit {
  const committedAt = commit.commit.committer?.date || commit.commit.author?.date;
  if (!committedAt) throw new Error("GitHub returned a commit without a date.");
  const known = snapshot.commits.find((item) => item.sha === commit.sha);
  return {
    sha: commit.sha, committedAt, day: easternDay(committedAt), subject: commit.commit.message.split("\n")[0],
    merge: commit.parents.length > 1,
    files: known?.files || (commit.files || []).map((file) => ({ path: file.filename, status: file.status })),
    filesComplete: known?.filesComplete ?? Boolean(commit.files),
  };
}

async function fetchLiveDay(day: string): Promise<LiveDay> {
  const window = githubWindow(day);
  const params = new URLSearchParams({ sha: snapshot.branch, per_page: "100", since: window.since, until: window.until });
  const found = new Map<string, ReportCommit>();
  let complete = false;
  for (let page = 1; page <= 20; page++) {
    const response = await reportGithubFetch(`/commits?${params}&page=${page}`);
    const records = await response.json() as GithubCommit[];
    for (const record of records) {
      const commit = fromGithub(record);
      if (commit.day === day) found.set(commit.sha, commit);
    }
    if (!response.headers.get("link")?.includes('rel="next"')) { complete = true; break; }
  }
  const commits = [...found.values()].sort((a, b) => new Date(b.committedAt).getTime() - new Date(a.committedAt).getTime());
  const missing = commits.filter((commit) => !commit.filesComplete && !commit.merge);
  const notes: string[] = [];
  // Bound server work. Unknown commits still appear with evidence links when
  // file details cannot all be read during a single page request.
  for (let start = 0; start < Math.min(missing.length, 60); start += 5) {
    await Promise.all(missing.slice(start, start + 5).map(async (commit) => {
      try {
        const response = await reportGithubFetch(`/commits/${commit.sha}?per_page=100`);
        const detail = await response.json() as GithubCommit;
        commit.files = (detail.files || []).map((file) => ({ path: file.filename, status: file.status }));
        commit.filesComplete = !response.headers.get("link")?.includes('rel="next"');
      } catch { /* Commit evidence remains visible, with the limitation below. */ }
    }));
  }
  if (!complete) notes.push("This very busy date exceeded the live lookup limit. The listed updates are a partial view; open GitHub for the rest.");
  if (commits.some((commit) => !commit.merge && !commit.filesComplete)) notes.push("Some saved updates have more file changes than could be loaded here. Their GitHub links contain the full details.");
  return { commits, checkedAt: new Date().toISOString(), complete, notes };
}

export async function getStudioReport(requestedDay?: string, refresh = false) {
  const today = easternDay();
  const day = validReportDay(requestedDay) ? requestedDay : today;
  let commits = snapshot.commits.filter((commit) => commit.day === day);
  let checkedAt = snapshot.githubCheckedAt;
  let source: "live" | "snapshot" = "snapshot";
  let complete = snapshot.coverage.complete;
  let notes: string[] = [];
  try {
    const entry = liveCache.get(day);
    let value: Promise<LiveDay>;
    if (!refresh && entry && entry.expires > Date.now()) value = entry.value;
    else {
      value = fetchLiveDay(day);
      if (liveCache.size > 40) liveCache.clear();
      liveCache.set(day, { value, expires: Date.now() + 3 * 60 * 1000 });
    }
    const live = await value;
    commits = live.commits;
    checkedAt = live.checkedAt;
    complete = live.complete;
    source = "live";
    notes = live.notes;
  } catch (error) {
    liveCache.delete(day);
    notes.push(error instanceof Error ? error.message : "GitHub could not be reached. Showing the saved report.");
    if (snapshot.liveCheckNote) notes.push(snapshot.liveCheckNote);
  }
  return {
    day, today, repo: snapshot.repo, branch: snapshot.branch, source, checkedAt, complete, notes,
    snapshotAt: snapshot.generatedAt, snapshotSha: snapshot.snapshotSha, coverage: snapshot.coverage,
    commits, local: snapshot.local,
    days: [...new Set([today, day, ...snapshot.commits.map((commit) => commit.day)])].sort().reverse(),
  };
}
