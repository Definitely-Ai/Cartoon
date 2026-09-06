export const REPORT_TIME_ZONE = "America/New_York";

export type ReportFile = { path: string; status: string };
export type ReportCommit = {
  sha: string; committedAt: string; day: string; subject: string; merge: boolean;
  files: ReportFile[]; filesComplete: boolean;
};
export type LocalReportFile = ReportFile & { modifiedAt: string | null };
export type ReportSnapshot = {
  schemaVersion: number; repo: string; branch: string; generatedAt: string;
  githubCheckedAt: string | null; source: string; snapshotSha: string; liveCheckNote: string | null;
  coverage: { complete: boolean; earliestDay: string | null; commitCount: number };
  commits: ReportCommit[];
  local: { capturedAt: string; head: string; remoteHead: string; behind: number | null; ahead: number | null; files: LocalReportFile[] };
};

export function easternDay(value: Date | string = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: REPORT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

export function validReportDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// A padded UTC interval spans both Eastern offsets. Filtering AFTER fetching
// uses the actual IANA zone, including daylight-saving transitions.
export function githubWindow(day: string): { since: string; until: string } {
  if (!validReportDay(day)) throw new Error("Use a real date in YYYY-MM-DD format.");
  const midnight = new Date(`${day}T00:00:00Z`).getTime();
  return { since: new Date(midnight - 86400000).toISOString(), until: new Date(midnight + 2 * 86400000).toISOString() };
}

const GROUPS = [
  { id: "artwork", title: "Drawing and scene parts", test: (file: string) => /\.(png|jpe?g|webp|avif|gif|svg|tiff?)$/i.test(file) || /^canon\/(plates|vision)\//.test(file), description: "Scene drawings, reference pictures, and individual parts of the cartoon." },
  { id: "editions", title: "Cartoons and captions", test: (file: string) => /^(cartoons|options|showcase)\//.test(file) || /dialogue|caption|comic/.test(file), description: "Cartoon editions, writing, and the words placed beneath the artwork." },
  { id: "canon", title: "Characters and drawing rules", test: (file: string) => /^canon\//.test(file) || /MASTER-PROMPT|HARRINGTON|SCENE-QC/.test(file), description: "The shared references for how the room and characters should look and behave." },
  { id: "website", title: "The shared website", test: (file: string) => /^(app|components|public)\//.test(file) || /gallery|library|reports|backroom-auth|middleware/.test(file), description: "The pages and controls used to browse, review, and discuss the work." },
  { id: "tools", title: "Drawing tools and workflow", test: (file: string) => /^(lib|scripts)\//.test(file) || /package|tsconfig|next\.config/.test(file), description: "The tools that create, assemble, check, or prepare the drawings." },
  { id: "planning", title: "Research and project notes", test: (file: string) => /^(docs|research)\//.test(file) || /\.(md|txt)$/.test(file), description: "Written instructions, research, and decisions preserved with the project." },
  { id: "other", title: "Project housekeeping", test: () => true, description: "Other saved project files and setup changes." },
] as const;

export function readableSubject(subject: string): string {
  return subject
    .replace(/^(feat|fix|style|refactor|chore|docs|test|perf|build|ci)(\([^)]*\))?!?:\s*/i, "")
    .replace(/^(canon|bible|plates?|generate|gallery|training|studio):\s*/i, "")
    .replace(/\bUI\b/g, "website")
    .replace(/\bQC\b/g, "quality check")
    .replace(/\bLoRA\b/g, "drawing-model training")
    .replace(/\bAPI\b/g, "connection")
    .replace(/\brepo\b/g, "project")
    .replace(/\bchyrons?\b/g, "caption bands")
    .replace(/\bduo\b/gi, "two-character scene")
    .replace(/\btrio\b/gi, "three-character scene")
    .replace(/^./, (character) => character.toUpperCase());
}

export function summarizeReport(commits: ReportCommit[]) {
  return GROUPS.map((group) => {
    const files = new Map<string, Set<string>>();
    const changes = new Set<string>();
    for (const commit of commits) {
      if (commit.merge) continue;
      const matches = commit.files.filter((file) => GROUPS.find((candidate) => candidate.test(file.path))?.id === group.id);
      if (!matches.length) continue;
      for (const file of matches) {
        const statuses = files.get(file.path) || new Set<string>();
        statuses.add(file.status);
        files.set(file.path, statuses);
      }
      changes.add(readableSubject(commit.subject));
    }
    return { id: group.id, title: group.title, description: group.description, fileCount: files.size, paths: [...files.keys()], changes: [...changes] };
  }).filter((group) => group.fileCount > 0);
}

export function imageChanges(commits: ReportCommit[]): (ReportFile & { sha: string })[] {
  const found = new Map<string, ReportFile & { sha: string }>();
  // Most recent change per path; removed files should not produce a broken image.
  const chronological = [...commits].sort((a, b) => new Date(b.committedAt).getTime() - new Date(a.committedAt).getTime());
  for (const commit of chronological) {
    if (commit.merge) continue;
    for (const file of commit.files) {
      if (/\.(png|jpe?g|webp|avif|gif)$/i.test(file.path) && !found.has(file.path)) found.set(file.path, { ...file, sha: commit.sha });
    }
  }
  return [...found.values()].filter((file) => file.status !== "removed");
}
