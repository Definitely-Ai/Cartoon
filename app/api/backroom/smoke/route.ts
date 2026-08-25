import { NextResponse, type NextRequest } from "next/server";
import { BACKROOM_COOKIE, isDoorOpen, isTriggerOpen } from "@/lib/backroom-auth";

import { assemblePrompt, generateCartoonArt } from "@/lib/generate";
import { PublishError, commitFiles, getCanon, readRepoFile } from "@/lib/githubPublish";
import { getTraining } from "@/lib/replicate";

// The freshly trained model's driving test, before it is trusted with
// IMAGE_MODEL. Four fixed panels — one for identity, three for obedience —
// generated through the exact prompt assembly production uses, committed to
// the repo for pull-and-inspect.
//
//   ?version=<owner/swinging-door:hash>   defaults to the newest succeeded run
//   ?n=4                                  how many of the panels (1–4)
//   ?scale=0.9                            LORA_SCALE for this wave only
//
// The pass bar (docs/TRAINING.md): the trio panel shows three DISTINCT
// on-model characters, the boat is a boat, the bare panel is bare, the
// courtroom is a courtroom — and Mango has no tail anywhere. Identity without
// obedience is a failure; turn the scale down and rerun before blaming the
// dataset. Each wave is roughly $0.15.

export const runtime = "nodejs";
export const maxDuration = 300;

const LEDGER = "scripts/training/runs.json";
const OUT_DIR = "scripts/training/smoke";
const TIME_BUDGET_MS = 240_000;

// One identity cell and three obedience cells — the halves of the control
// batch a machine can pre-screen before Rick's dials do the real judging.
const PANELS = [
  {
    slug: "trio-bar",
    candidate: {
      scene: "Drew leans on the bar mid-remark while Mango listens from his stool and Abby polishes a glass behind the counter.",
      tv: "MARKETS OPEN",
      board: "HAPPY HOUR 4–?",
      characters: ["drew", "mango", "abby"],
    },
  },
  {
    slug: "mango-boat",
    candidate: {
      scene: "Mango sits alone amidships holding the tiller, looking back over his shoulder.",
      setting: "a small open boat on calm water, nothing but sea and sky behind",
      characters: ["mango"],
    },
  },
  {
    slug: "abby-bare",
    candidate: {
      scene: "Abby stands alone with her arms folded, one brow raised, against an entirely empty background.",
      setting: "a completely bare panel, no furniture, no walls, nothing behind her at all",
      characters: ["abby"],
    },
  },
  {
    slug: "drew-courtroom",
    candidate: {
      scene: "Drew stands at the witness stand, one wing raised to be sworn in.",
      setting: "a courtroom with a panelled judge's bench and a flag",
      characters: ["drew"],
    },
  },
];

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

  try {
    let version = params.get("version");
    if (!version) {
      const ledgerFile = await readRepoFile(LEDGER);
      const runs = ledgerFile ? (JSON.parse(ledgerFile.bytes.toString("utf8")) as { id: string }[]) : [];
      for (const run of runs.slice().reverse()) {
        const training = await getTraining(run.id).catch(() => null);
        if (training?.status === "succeeded" && training.output?.version) {
          version = training.output.version;
          break;
        }
      }
      if (!version) {
        return NextResponse.json(
          { error: "No succeeded training found — run /api/backroom/train first, or pass ?version= explicitly." },
          { status: 404 }
        );
      }
    }
    if (version.includes("kontext")) {
      return NextResponse.json({ error: "The smoke test is for a fine-tune — Kontext is the baseline, not the candidate." }, { status: 400 });
    }

    const scale = params.get("scale");
    if (scale && Number(scale) > 0) {
      // Per-request override of the strength dial; generateCartoonArt reads
      // the env at call time, and a Vercel function instance handles one
      // request at a time, so this cannot leak across users.
      process.env.LORA_SCALE = scale;
    }

    const n = Math.min(PANELS.length, Math.max(1, Number(params.get("n")) || PANELS.length));
    const canon = await getCanon();
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 13).replace("T", "-");

    const started = Date.now();
    const made: string[] = [];
    const failed: { slug: string; error: string }[] = [];
    for (const panel of PANELS.slice(0, n)) {
      if (Date.now() - started > TIME_BUDGET_MS) break;
      try {
        const prompt = assemblePrompt(canon, panel.candidate, true);
        const image = await generateCartoonArt({ prompt, characters: panel.candidate.characters, model: version });
        const name = `${stamp}-${panel.slug}`;
        await commitFiles(
          [
            { path: `${OUT_DIR}/${name}.png`, content: image },
            { path: `${OUT_DIR}/${name}.txt`, content: `${version}\nLORA_SCALE=${process.env.LORA_SCALE ?? "0.9 (default)"}\n\n${prompt}\n` },
          ],
          `training: smoke panel ${name}`
        );
        made.push(name);
      } catch (error) {
        failed.push({ slug: panel.slug, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return NextResponse.json({
      ok: failed.length === 0,
      version,
      made,
      failed,
      next:
        "git pull and inspect scripts/training/smoke/ — three distinct characters at the bar, a real boat, a bare panel, " +
        "a real courtroom, and no tail on Mango. Pass both halves before setting IMAGE_MODEL.",
    });
  } catch (error) {
    if (error instanceof PublishError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected failure." }, { status: 500 });
  }
}
