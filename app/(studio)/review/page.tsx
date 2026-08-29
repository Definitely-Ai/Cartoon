import { PublishError } from "@/lib/githubPublish";

import { type Plan, newestSet } from "./batches";
import ScoringScreen from "./ScoringScreen";

// THE REVIEW, as Rick opens it: the set of cartoons being drawn for him now,
// and nothing else.
//
// This was a shelf. Every batch the studio had ever run was on it, numbered
// Edition 1 to Edition 4, and he had to pick one before he could look at any
// work. He didn't want the choice and the choice was a lie besides — those
// rounds were us debugging the drawing hand, not four editions of a comic
// strip, and there are no editions to speak of until the ratings on this set
// lock the characters in. So the shelf is gone and the newest set with a plan
// in it IS this page. Same desk, same drafts, one thing on the screen.
//
// /review/<batch> still opens any named set by its address — the operator uses
// it and rating links already sent out point at it — but nothing he taps leads
// backwards into the history.

export const metadata = { title: "The new cartoons" };

// A set fills in one drawing at a time while he watches; a cached page would
// hide the one that just landed.
export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  let plan: Plan | null = null;
  let trouble: string | null = null;

  try {
    plan = await newestSet();
  } catch (err) {
    // Never notFound() here: /review is in the nav, and a dead end under a
    // link he was told to use is worse than a sentence saying try again.
    trouble = err instanceof PublishError ? err.message : "The repository isn’t answering.";
  }

  return <ScoringScreen plan={plan} trouble={trouble} current />;
}
