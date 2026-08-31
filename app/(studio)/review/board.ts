import { foldCastScores } from "@/lib/cast";
import { listRepoDir, readRepoFile } from "@/lib/githubPublish";

import { BRIEFS, type Plan, listBatches, readPlan } from "./batches";
import type { CastName, StandingVerdict } from "./ReviewDesk";

// THE REVIEW BOARD's reading half. /review is one set at a time and says
// nothing about the ones behind it — deliberately, so the scoring screen stays
// a desk and not a shelf. But the operator (and the founder, when he wants the
// long view) still needs one page that answers "what has been drawn, when, and
// how much of it has he scored." That is this: every batch, newest first, each
// as one row of countable facts read straight out of the repo.
//
// Everything here is derived from the same three things the scoring screen
// reads — the batch's plan.json, the PNGs beside it, and its verdict files —
// so the board can never disagree with the desk it links into.

const RATINGS = "feedback/ratings";
const CAST_KEYS: CastName[] = ["drew", "barclay", "abby"];

/** Six is the bar the studio scores against: a cartoon LANDS when both the art
 *  and the line clear it. In the git-filed ratings the two headline numbers are
 *  the scene score and the caption score, so that pair is the test here. */
const LAND = 6;

/** One batch, reduced to what the board shows in a row. Means are null until he
 *  has scored something — an unrated set shows dashes, not zeroes, so "not yet
 *  judged" never reads as "judged badly." */
export type BatchSummary = {
  batch: string;
  brief: string;
  /** ISO timestamp the brief route stamped the plan with. */
  createdAt: string;
  /** Panels planned, panels actually drawn, panels he has scored. */
  total: number;
  drawn: number;
  scored: number;
  /** Panels where BOTH the scene and the caption cleared 6. */
  landed: number;
  castMean: number | null;
  sceneMean: number | null;
  captionMean: number | null;
  writer: string;
  model: string;
  quality: string;
};

const mean = (xs: number[]): number | null =>
  xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null;

/** The standing verdicts for one batch, keyed by panel filename without its
 *  extension — the same key the rate route and the scoring screen use. Reads
 *  defensively: a batch with no ratings folder yet is an empty map, not a
 *  thrown page. */
async function readVerdicts(batch: string): Promise<Map<string, StandingVerdict>> {
  const names = (await listRepoDir(`${RATINGS}/${batch}`).catch(() => [])).filter((name) =>
    name.endsWith(".json")
  );
  const found = await Promise.all(
    names.map(async (name) => {
      const file = await readRepoFile(`${RATINGS}/${batch}/${name}`).catch(() => null);
      if (!file) return null;
      try {
        const raw = JSON.parse(file.bytes.toString("utf8")) as Partial<StandingVerdict>;
        const verdict: StandingVerdict = {
          characters: foldCastScores(raw.characters ?? {}),
          scene: typeof raw.scene === "number" ? raw.scene : null,
          caption: typeof raw.caption === "number" ? raw.caption : null,
          comment: typeof raw.comment === "string" ? raw.comment : "",
        };
        return [name.replace(/\.json$/, ""), verdict] as const;
      } catch {
        return null;
      }
    })
  );
  return new Map(found.filter((entry): entry is [string, StandingVerdict] => entry !== null));
}

/** Turn one batch's plan, drawings and verdicts into a single board row. */
async function summarize(plan: Plan): Promise<BatchSummary> {
  const [files, verdicts] = await Promise.all([
    listRepoDir(`${BRIEFS}/${plan.batch}`).catch(() => [] as string[]),
    readVerdicts(plan.batch),
  ]);
  const drawnFiles = new Set(files);

  const castScores: number[] = [];
  const sceneScores: number[] = [];
  const captionScores: number[] = [];
  let scored = 0;
  let landed = 0;

  for (const panel of plan.panels) {
    const verdict = verdicts.get(panel.file.replace(/\.png$/, ""));
    if (!verdict) continue;
    scored++;
    for (const key of CAST_KEYS) {
      const value = verdict.characters[key];
      if (typeof value === "number") castScores.push(value);
    }
    if (typeof verdict.scene === "number") sceneScores.push(verdict.scene);
    if (typeof verdict.caption === "number") captionScores.push(verdict.caption);
    if ((verdict.scene ?? 0) >= LAND && (verdict.caption ?? 0) >= LAND) landed++;
  }

  return {
    batch: plan.batch,
    brief: plan.brief,
    createdAt: plan.createdAt,
    total: plan.panels.length,
    drawn: plan.panels.filter((panel) => drawnFiles.has(panel.file)).length,
    scored,
    landed,
    castMean: mean(castScores),
    sceneMean: mean(sceneScores),
    captionMean: mean(captionScores),
    writer: plan.writer ?? "",
    model: plan.model ?? "",
    quality: plan.quality ?? "",
  };
}

/** Every batch that has a readable plan, newest first, each reduced to a row.
 *  Batches are read in parallel; one that will not parse is dropped rather than
 *  taking the board down with it. */
export async function reviewBoard(): Promise<BatchSummary[]> {
  const batches = await listBatches();
  const plans = await Promise.all(batches.map((batch) => readPlan(batch).catch(() => null)));
  const summaries = await Promise.all(
    plans.filter((plan): plan is Plan => plan !== null).map((plan) => summarize(plan))
  );
  // listBatches already sorts newest-first; summarize preserves order.
  return summaries;
}
