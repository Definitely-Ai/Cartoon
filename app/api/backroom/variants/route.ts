import { NextResponse, type NextRequest } from "next/server";
import { BACKROOM_COOKIE, isDoorOpen, isTriggerOpen } from "@/lib/backroom-auth";
import { PublishError, commitFiles, listRepoDir, readRepoFile } from "@/lib/githubPublish";
import { generateImage, replicateGet, uploadFile } from "@/lib/replicate";
// Plain ESM module shared with the local preview tooling — one plan, no drift.
import { MAX_VARIANTS, REF_DIR, VARIANT_DIR, caption, instruction, runs } from "@/scripts/training/lib/variant-plan.mjs";

// Generates the training set's setting variants IN PRODUCTION, where the
// Replicate token lives, and commits each finished image into the repo so it
// can be pulled, looked at, and — only if it survives inspection — trained on.
//
//   ?dry=1        list the plan and probe the Replicate account; spends $0
//   ?limit=6      how many to generate this call (default 6, max 10)
//   ?only=<id>    regenerate one specific id (after deleting its bad file)
//
// Money guards, in order: the whole plan is capped at MAX_VARIANTS committed
// images ever (delete a bad one and its slot frees up); each call is capped
// by `limit`; the loop stops 60s before Vercel's own timeout so a slow image
// costs one image, not a corrupted run. Nothing is committed for a failed
// generation, so re-running is always safe.

export const runtime = "nodejs";
export const maxDuration = 300;

const TIME_BUDGET_MS = 240_000;
const KONTEXT = "black-forest-labs/flux-kontext-pro";
const COST_PER_IMAGE = 0.055;

export async function GET(request: NextRequest) {
  // Two doors: the owner's login cookie, or the single-purpose trigger token
  // (?t=) for automated callers — same secret, different derivation, so the
  // URL-carried form can never leak the session cookie.
  const authed =
    (await isDoorOpen(request.cookies.get(BACKROOM_COOKIE)?.value)) ||
    (await isTriggerOpen(request.nextUrl.searchParams.get("t")));
  if (!authed) {
    return NextResponse.json({ error: "The door is closed. Knock first." }, { status: 401 });
  }
  const params = request.nextUrl.searchParams;
  const dry = params.get("dry") === "1";
  const only = params.get("only");
  const limit = Math.min(10, Math.max(1, Number(params.get("limit")) || 6));

  try {
    const existing = new Set(
      (await listRepoDir(VARIANT_DIR)).filter((f) => f.endsWith(".png")).map((f) => f.replace(/\.png$/, ""))
    );
    const plan = runs();
    const pending = plan.filter((r) => !existing.has(r.id) && (!only || r.id === only));

    if (dry) {
      // The free proof that the whole wire works: auth, token, account.
      const account = await replicateGet<{ username?: string }>("/account");
      return NextResponse.json({
        ok: true,
        replicateAccount: account.username ?? "(unknown)",
        planned: plan.length,
        alreadyGenerated: existing.size,
        pending: pending.map((r) => ({ id: r.id, prompt: instruction(r), caption: caption(r) })),
        estimatedCost: `$${(pending.length * COST_PER_IMAGE).toFixed(2)} for everything pending`,
      });
    }

    if (existing.size >= MAX_VARIANTS) {
      return NextResponse.json(
        {
          error:
            `${existing.size} variants are already committed — the ${MAX_VARIANTS}-image ceiling is the budget line. ` +
            "Delete rejected PNGs from the repo to free slots before generating more.",
        },
        { status: 409 }
      );
    }

    const started = Date.now();
    const made: string[] = [];
    const failed: { id: string; error: string }[] = [];
    let stoppedForTime = false;

    for (const run of pending.slice(0, limit)) {
      if (Date.now() - started > TIME_BUDGET_MS) {
        stoppedForTime = true;
        break;
      }
      try {
        // Double-click guard: another invocation may have landed this id
        // between our listing and now.
        if (await readRepoFile(`${VARIANT_DIR}/${run.id}.png`)) continue;

        const ref = await readRepoFile(`${REF_DIR}/${run.cast.id}.jpg`);
        if (!ref) {
          throw new PublishError(
            400,
            `Reference board ${run.cast.id}.jpg is not in the repo — run make-variant-refs.mjs and push first.`
          );
        }
        const boardUrl = await uploadFile(ref.bytes, `${run.cast.id}.jpg`, "image/jpeg");
        const image = await generateImage(
          KONTEXT,
          {
            prompt: instruction(run),
            input_image: boardUrl,
            aspect_ratio: "1:1",
            output_format: "png",
          },
          120_000
        );
        await commitFiles(
          [
            { path: `${VARIANT_DIR}/${run.id}.png`, content: image },
            { path: `${VARIANT_DIR}/${run.id}.txt`, content: `${caption(run)}\n` },
          ],
          `training: setting variant ${run.id}`
        );
        made.push(run.id);
      } catch (error) {
        failed.push({ id: run.id, error: error instanceof Error ? error.message : String(error) });
      }
    }

    const remaining = pending.map((r) => r.id).filter((id) => !made.includes(id) && !failed.some((f) => f.id === id));
    return NextResponse.json({
      ok: failed.length === 0,
      made,
      failed,
      remaining,
      stoppedForTime,
      spentThisCall: `$${(made.length * COST_PER_IMAGE).toFixed(2)}`,
      next:
        remaining.length > 0
          ? "Run this URL again for the next wave."
          : "All planned variants exist — git pull, look at every one, delete any that drifted off-model, then rebuild the zip.",
    });
  } catch (error) {
    if (error instanceof PublishError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected failure." }, { status: 500 });
  }
}
