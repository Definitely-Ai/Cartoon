import { notFound } from "next/navigation";

import { PublishError } from "@/lib/githubPublish";

import { type Plan, readPlan } from "../batches";
import ScoringScreen from "../ScoringScreen";

// ONE NAMED SET, opened by its address.
//
// Rick's way in is /review, which is the set being drawn now; this is the same
// screen pointed at whichever set the address names. It stays because the
// operator works batch by batch, because /api/backroom/brief tells the caller
// "Review them at /review/<batch>" when a set finishes, and because a rating
// link already sent must not turn into a 404 months later.
//
// The reading and the dressing are ../ScoringScreen — shared with /review, so
// the two can't drift apart the way the shelf and the desk did.

const safeBatch = (batch: string) =>
  batch.length <= 200 && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(batch) && !batch.includes("..");

// A fixed title, not the batch id: the tab said "Review —
// 20260828-221115-twenty-five-cartoons-at-the-bar" and that is not a thing to
// show anyone. Not a number either — the sets aren't numbered any more.
export const metadata = { title: "Scoring a set" };

export const dynamic = "force-dynamic";

export default async function ReviewBatchPage({ params }: { params: Promise<{ batch: string }> }) {
  const { batch } = await params;
  if (!safeBatch(batch)) notFound();

  let plan: Plan | null = null;
  let trouble: string | null = null;

  try {
    plan = await readPlan(batch);
  } catch (err) {
    trouble = err instanceof PublishError ? err.message : "The repository isn’t answering.";
  }

  // A named set that genuinely isn't there is a wrong address, and only here
  // can that be said: /review has no address to be wrong. A set that can't be
  // read because GitHub is down is NOT missing, and must not 404.
  if (!plan && !trouble) notFound();

  return <ScoringScreen plan={plan} trouble={trouble} current={false} />;
}
