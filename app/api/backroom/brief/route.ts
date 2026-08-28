import { NextResponse, type NextRequest } from "next/server";

import { BACKROOM_COOKIE, isDoorOpen, isTriggerOpen } from "@/lib/backroom-auth";
import { assemblePrompt, generateCartoonArt, imageModel, isMultiRef } from "@/lib/generate";
import { PublishError, commitFiles, getCanon, readRepoFile } from "@/lib/githubPublish";
import { WRITER_MODEL, commission, stage, type Brief, type Gag } from "@/lib/writersRoom";

// Rick's front door.
//
// He types one line — "make the cartoon on the golf course" — and gets ten
// finished cartoons to choose from. Everything the strip knows still applies:
// the same three characters, the same drawing hand, the same house rules. Only
// the place and the jokes change.
//
//   ?text=make the cartoon on the golf course   the brief. Starts a new batch
//   ?n=10                                       how many cartoons (1–10)
//   ?batch=<id>                                 continue an unfinished batch
//   ?dry=1                                      commission the writing only,
//                                               draw nothing, spend ~a cent
//   ?quality=low|medium|high|auto               the drawing dial for this batch
//
// WHY IT RESUMES. Ten drawings take about twelve minutes and a serverless
// function gets five. So a call draws as many as it can inside its budget,
// commits each one the moment it exists, and reports what is left. Calling
// again picks up exactly where it stopped, because the batch's own plan file
// in the repo is the source of truth about what has been drawn. Nothing is
// held in memory between calls and nothing is drawn twice.

export const runtime = "nodejs";
export const maxDuration = 300;

/** Leave enough of the function's budget to commit the panel we just drew. */
const BUDGET_MS = 235_000;
const BRIEFS = "briefs";

type Plan = {
  batch: string;
  brief: string;
  writer: string;
  model: string;
  quality: string;
  createdAt: string;
  panels: (Brief & { n: number; file: string })[];
};

function slugOfBrief(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .split("-")
      .filter(Boolean)
      .slice(0, 6)
      .join("-") || "brief"
  );
}

function stamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").slice(0, 15).replace("T", "-");
}

async function loadPlan(batch: string): Promise<Plan> {
  const file = await readRepoFile(`${BRIEFS}/${batch}/plan.json`);
  if (!file) throw new PublishError(404, `No batch named "${batch}".`);
  return JSON.parse(file.bytes.toString("utf8")) as Plan;
}

/** Which panels of a plan already have a drawing in the repo. */
async function drawn(plan: Plan): Promise<Set<number>> {
  const done = new Set<number>();
  await Promise.all(
    plan.panels.map(async (panel) => {
      const found = await readRepoFile(`${BRIEFS}/${plan.batch}/${panel.file}`).catch(() => null);
      if (found) done.add(panel.n);
    })
  );
  return done;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const authed =
    (await isDoorOpen(request.cookies.get(BACKROOM_COOKIE)?.value)) ||
    (await isTriggerOpen(params.get("t")));
  if (!authed) {
    return NextResponse.json({ error: "The door is closed. Knock first." }, { status: 401 });
  }

  const asked = params.get("quality");
  const quality = asked && ["low", "medium", "high", "auto"].includes(asked) ? asked : undefined;

  try {
    let plan: Plan;

    const resuming = params.get("batch");
    if (resuming) {
      plan = await loadPlan(resuming.replace(/[^\w.-]/g, ""));
    } else {
      const text = (params.get("text") ?? "").trim();
      if (!text) {
        return NextResponse.json(
          { error: 'Nothing to draw. Say what you want: ?text=make the cartoon on the golf course' },
          { status: 400 }
        );
      }
      // Up to 25 in one batch: a review page per ten would make the founder
      // score the same sitting across three screens.
      const n = Math.min(25, Math.max(1, Number(params.get("n") ?? 10) || 10));

      // The writing is one call and costs about a cent, so it happens up front
      // and lands in the repo before a single drawing is paid for. A batch
      // whose jokes are wrong should be thrown away at this price, not at ten
      // times it.
      const gags: Gag[] = await commission(text, n);
      const batch = `${stamp()}-${slugOfBrief(text)}`;
      plan = {
        batch,
        brief: text,
        writer: WRITER_MODEL,
        model: imageModel(),
        quality: quality ?? process.env.IMAGE_QUALITY ?? "medium",
        createdAt: new Date().toISOString(),
        panels: gags.map((gag, i) => {
          const staged = stage(gag);
          const n = i + 1;
          return { ...staged, n, file: `${String(n).padStart(2, "0")}-${staged.slug}.png` };
        }),
      };

      await commitFiles(
        [{ path: `${BRIEFS}/${batch}/plan.json`, content: JSON.stringify(plan, null, 2) }],
        `brief: ${text.slice(0, 60)} — ${plan.panels.length} written`
      );

      if (params.get("dry") === "1") {
        return NextResponse.json({
          ok: true,
          batch,
          drew: 0,
          note: "Writing only — nothing drawn. Call again with ?batch= to draw it.",
          panels: plan.panels.map((p) => ({
            n: p.n,
            speaker: p.speaker,
            caption: p.caption,
            turn: p.turn,
            characters: p.characters,
            away: p.away,
            tv: p.tv,
            board: p.board,
          })),
        });
      }
    }

    // --- draw what is still missing, oldest first, until the budget runs out
    const canon = await getCanon();
    const model = imageModel();
    const already = await drawn(plan);
    const started = Date.now();
    const made: string[] = [];
    const failed: { n: number; why: string }[] = [];

    for (const panel of plan.panels) {
      if (already.has(panel.n)) continue;
      if (Date.now() - started > BUDGET_MS) break;

      try {
        const prompt = assemblePrompt(
          canon,
          { scene: panel.scene, tv: panel.tv, board: panel.board, setting: panel.setting, characters: panel.characters },
          !model.includes("kontext") && !isMultiRef(model),
          false,
          isMultiRef(model)
        );
        const image = await generateCartoonArt({
          prompt,
          characters: panel.characters,
          barScene: !panel.setting,
          model,
          quality: quality ?? undefined,
        });
        await commitFiles(
          [
            { path: `${BRIEFS}/${plan.batch}/${panel.file}`, content: image },
            {
              path: `${BRIEFS}/${plan.batch}/${panel.file.replace(/\.png$/, ".txt")}`,
              content:
                `${model}\nIMAGE_QUALITY=${quality ?? plan.quality}\nWRITER=${plan.writer}\n` +
                `BRIEF=${plan.brief}\nTURN=${panel.turn ?? "—"}\n` +
                `CAPTION ${panel.speaker}: "${panel.caption}"\n\n${prompt}\n`,
            },
          ],
          `brief ${plan.batch}: panel ${panel.n} — ${panel.slug}`
        );
        made.push(panel.file);
      } catch (err) {
        // One bad panel must not cost the other nine. Record it and carry on;
        // the next call will retry it, because nothing was committed for it.
        failed.push({ n: panel.n, why: err instanceof Error ? err.message : String(err) });
      }
    }

    const done = already.size + made.length;
    const remaining = plan.panels.length - done;
    return NextResponse.json({
      ok: true,
      batch: plan.batch,
      brief: plan.brief,
      of: plan.panels.length,
      drew: made.length,
      done,
      remaining,
      made,
      failed,
      next:
        remaining > 0
          ? `${remaining} still to draw — call again with ?batch=${plan.batch}`
          : `All ${plan.panels.length} drawn. Review them at /review/${plan.batch}`,
    });
  } catch (err) {
    if (err instanceof PublishError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: `The brief failed: ${(err as Error).message}` }, { status: 500 });
  }
}
