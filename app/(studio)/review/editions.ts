import { PublishError, gh, requiredEnv } from "@/lib/githubPublish";

// EDITION NUMBERS. Rick calls a batch "Edition 4"; the machine calls it
// 20260828-221115-twenty-five-cartoons-at-the-bar. Both the shelf (/review)
// and the scoring screen (/review/<batch>) have to put the same number on the
// same round of cartoons, so the counting lives here rather than twice.

export const BRIEFS = "briefs";

/**
 * The names of the batch folders under /briefs, newest first.
 *
 * The batch id the brief route mints starts with a UTC stamp
 * (20260828-143012-a-slug), so sorting the folder names in reverse IS newest
 * first — no dates need parsing to order the shelf.
 *
 * lib/githubPublish's listRepoDir answers with FILES only, and a batch is a
 * directory, so this asks the same contents endpoint through that module's own
 * client rather than growing it a new export. BRANCH is not exported either —
 * "main" here is that constant, and the two must stay in step.
 */
export async function listBatches(): Promise<string[]> {
  const { token, repo } = requiredEnv();
  const res = await gh(token)(`/repos/${repo}/contents/${BRIEFS}?ref=main`);
  if (res.status === 404) return [];
  if (!res.ok) throw new PublishError(502, `GitHub said ${res.status} listing /${BRIEFS}.`);
  return ((await res.json()) as { name: string; type: string }[])
    .filter((entry) => entry.type === "dir")
    .map((entry) => entry.name)
    .sort()
    .reverse();
}

/**
 * Which edition a batch is, counting from the oldest.
 *
 * Numbered oldest-first so Edition 1 stays Edition 1 forever and a new round
 * always takes the next number — number them newest-first and every edition is
 * renamed the moment he asks for more cartoons. Counted off the FULL list, not
 * the page of it a screen happens to show, so a batch whose plan is unreadable
 * still holds its place instead of shifting everything after it.
 */
export function editionOf(batches: string[], batch: string): number | null {
  const at = batches.indexOf(batch);
  return at === -1 ? null : batches.length - at;
}
