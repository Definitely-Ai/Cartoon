import { NextResponse, type NextRequest } from "next/server";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { PublishError, commitFiles, readRepoFile } from "@/lib/githubPublish";
import { accountUsername, ensureModel, getTraining, listTrainings, startTraining, uploadFile } from "@/lib/replicate";

// The one route that spends real training money — so its default answer is no.
//
//   ?status=1          the newest recorded run's live state (and the trained
//                      version string once it succeeds); &id=<id> checks a
//                      specific run instead
//   ?start=1           upload the committed zip and start ONE training
//   ?start=1&force=1   spend again even though a run already succeeded
//   &steps=1750        override steps (bounded 500–3000)
//
// Refusal guard: start is rejected while any recorded run is still going, and
// after any run has succeeded (unless force=1 — a deliberate, spelled-out
// choice). The run ledger lives in the repo (scripts/training/runs.json), so
// the guard survives redeploys; a live sweep of the account's recent
// trainings backs it up in case a ledger commit was ever lost.

export const runtime = "nodejs";
export const maxDuration = 300;

const LEDGER = "scripts/training/runs.json";
const ZIP = "scripts/training/training-set.zip";
const DESTINATION_NAME = "swinging-door";

type Run = { id: string; createdAt: string; zipSha: string; destination: string; steps: number; trainerVersion: string };

async function readLedger(): Promise<Run[]> {
  const file = await readRepoFile(LEDGER);
  if (!file) return [];
  try {
    return JSON.parse(file.bytes.toString("utf8")) as Run[];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  if (!(await isDoorOpen(request.cookies.get(BACKROOM_COOKIE)?.value))) {
    return NextResponse.json({ error: "The door is closed. Knock first." }, { status: 401 });
  }
  const params = request.nextUrl.searchParams;

  try {
    if (params.get("status") === "1") {
      const id = params.get("id") ?? (await readLedger()).at(-1)?.id;
      if (!id) return NextResponse.json({ error: "No training has been recorded yet — start one with ?start=1." }, { status: 404 });
      const training = await getTraining(id);
      return NextResponse.json({
        id,
        status: training.status,
        createdAt: training.created_at,
        completedAt: training.completed_at ?? null,
        error: training.error ?? null,
        trainedVersion: training.output?.version ?? null,
        next:
          training.status === "succeeded"
            ? `Run /api/backroom/smoke?version=${encodeURIComponent(training.output?.version ?? "")} for the $0.15 smoke wave before promoting anything.`
            : training.status === "failed"
              ? "A failure this early costs pennies — read the error, fix, and start again."
              : "Still cooking (20–40 min is normal) — check this URL again in a few minutes.",
      });
    }

    if (params.get("start") !== "1") {
      return NextResponse.json({
        usage: "?status=1 to check the run; ?start=1 to spend ~$3 starting the one training. It refuses to double-spend.",
      });
    }

    const force = params.get("force") === "1";
    const steps = Math.min(3000, Math.max(500, Number(params.get("steps")) || 1750));

    // --- The refusal guard.
    const ledger = await readLedger();
    for (const run of ledger) {
      const live = await getTraining(run.id).catch(() => null);
      if (!live) continue;
      if (live.status === "starting" || live.status === "processing") {
        return NextResponse.json(
          { error: `Training ${run.id} is already running — poll ?status=1 instead of paying for a second one.` },
          { status: 409 }
        );
      }
      if (live.status === "succeeded" && !force) {
        return NextResponse.json(
          {
            error:
              `Training ${run.id} already succeeded (version ${live.output?.version ?? "unknown"}). ` +
              "The budget allows ONE run — pass force=1 only if you have decided to spend again.",
          },
          { status: 409 }
        );
      }
    }
    // Belt and suspenders for a lost ledger: any active run on the account
    // that targets our destination also blocks.
    for (const live of await listTrainings().catch(() => [])) {
      if (
        (live.status === "starting" || live.status === "processing") &&
        !ledger.some((run) => run.id === live.id)
      ) {
        return NextResponse.json(
          { error: `An unrecorded training (${live.id}) is already running on this account — record or wait it out.` },
          { status: 409 }
        );
      }
    }

    const zip = await readRepoFile(ZIP);
    if (!zip) {
      return NextResponse.json(
        {
          error:
            `${ZIP} is not in the repo. Build it locally with \`npm run training:build\` (the balance gates must pass), ` +
            "commit, push, and try again.",
        },
        { status: 400 }
      );
    }
    if (zip.bytes.length < 1_000_000) {
      return NextResponse.json(
        { error: `The committed zip is ${zip.bytes.length} bytes — that is not a training set. Rebuild and recommit.` },
        { status: 400 }
      );
    }

    const zipUrl = await uploadFile(zip.bytes, "training-set.zip", "application/zip");
    const destination = await ensureModel(await accountUsername(), DESTINATION_NAME);
    const { id, version } = await startTraining(destination, {
      input_images: zipUrl,
      // The captions ARE the curriculum: four trigger tokens, settings named,
      // nothing dropped, nothing auto-generated. See docs/TRAINING.md.
      trigger_word: "",
      autocaption: false,
      steps,
      lora_rank: 32,
      learning_rate: 0.0004,
      resolution: "512,768,1024",
      caption_dropout_rate: 0,
    });

    const entry: Run = {
      id,
      createdAt: new Date().toISOString(),
      zipSha: zip.sha,
      destination,
      steps,
      trainerVersion: version,
    };
    let recorded = true;
    try {
      await commitFiles([{ path: LEDGER, content: `${JSON.stringify([...ledger, entry], null, 2)}\n` }], `training: started ${id}`);
    } catch {
      recorded = false; // the run exists regardless — surface the id loudly
    }
    return NextResponse.json({
      ok: true,
      id,
      destination,
      steps,
      recorded,
      cost: "~$3 over the next 20–40 minutes",
      next: recorded
        ? "Poll ?status=1 every few minutes."
        : `RECORD THIS ID: ${id} — the ledger commit failed, so poll with ?status=1&id=${id}.`,
    });
  } catch (error) {
    if (error instanceof PublishError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected failure." }, { status: 500 });
  }
}
