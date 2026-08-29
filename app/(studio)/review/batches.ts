import { PublishError, gh, readRepoFile, requiredEnv } from "@/lib/githubPublish";
import type { Brief } from "@/lib/writersRoom";

// THE SETS OF CARTOONS, and how the review screens find them.
//
// This used to number them: Rick said "Edition 4", the machine said
// 20260828-221115-twenty-five-cartoons-at-the-bar, and a helper here tied the
// two together. The numbering is gone. He never asked for a shelf of editions
// and the ones on it were rounds of us debugging the drawing hand, not rounds
// of work he had asked to see — so /review now opens the set being drawn now
// and nothing else. Editions come back when the characters are locked in and a
// set means something; until then a number on a batch is a promise we can't
// keep.
//
// What is left is what both review screens actually need: the list of batch
// folders and the plan inside one.

export const BRIEFS = "briefs";

/** One cartoon as the brief route wrote it down: the writers' room's gag plus
 *  the two things the drawing hand added — its number in the set and the file
 *  the PNG lands in. */
export type Panel = Brief & { n: number; file: string };

/**
 * A batch's plan.json — the whole set, as planned.
 *
 * Mirrored from /api/backroom/brief rather than imported: the route owns the
 * shape, and a page has no business importing a request handler.
 *
 * `redrawOf` is on the file and is deliberately absent here. A set that was
 * redrawn is just the set; telling Rick which round it is puts him back in the
 * batch history this screen exists to get rid of.
 */
export type Plan = {
  batch: string;
  brief: string;
  writer: string;
  model: string;
  quality: string;
  createdAt: string;
  panels: Panel[];
};

/**
 * The names of the batch folders under /briefs, newest first.
 *
 * The batch id the brief route mints starts with a UTC stamp
 * (20260828-143012-a-slug), so sorting the folder names in reverse IS newest
 * first — no dates need parsing to find the current set.
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

/** One batch's plan, or null when the folder has no readable one. */
export async function readPlan(batch: string): Promise<Plan | null> {
  const file = await readRepoFile(`${BRIEFS}/${batch}/plan.json`);
  if (!file) return null;
  try {
    const plan = JSON.parse(file.bytes.toString("utf8")) as Plan;
    return Array.isArray(plan?.panels) ? plan : null;
  } catch {
    return null;
  }
}

/** How far back to look for a set with a plan in it. A batch folder can exist
 *  with the plan still on its way up — that is one skip, not twenty — and past
 *  a handful the answer is "there is no current set", not another round trip. */
const LOOKBACK = 5;

/**
 * The set being drawn now: the newest batch that has a plan to show.
 *
 * Null means there is nothing to score yet — no briefs at all, or none whose
 * plan can be read. Anything worse than that (no token, GitHub refusing)
 * throws, because "no cartoons yet" and "the studio isn't answering" must not
 * look the same on his screen.
 */
export async function newestSet(): Promise<Plan | null> {
  const batches = await listBatches();
  for (const batch of batches.slice(0, LOOKBACK)) {
    const plan = await readPlan(batch);
    if (plan) return plan;
  }
  return null;
}
