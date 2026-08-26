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
    // The filing shape most cartoons take: the two gentlemen, the room, the
    // boards. Also the discriminator between the ROOM paragraph and the
    // trio's three-tile conditioning board when a moderation flag appears.
    slug: "duo-bar",
    candidate: {
      scene: "Drew lifts his martini toward the TV while Mango frowns at the chalkboard.",
      tv: "RATE CUT EXPECTED, EVENTUALLY",
      board: "PATIENCE — $14",
      characters: ["drew", "mango"],
    },
  },
  {
    // Showcase cells: gag-complete bar scenes — TV, board, and caption
    // drawn from one joke — for direction checks with the founder.
    slug: "abby-bar",
    candidate: {
      scene: "Abby polishes a rocks glass behind the marble counter, eyes on the room.",
      tv: "MARKETS CLOSE MIXED",
      board: "LAST CALL IS A POLICY DECISION",
      characters: ["abby"],
    },
  },
  {
    slug: "duo-tariffs",
    candidate: {
      scene: "Drew studies the chalkboard over his martini while Mango peers into his old fashioned.",
      tv: "NEW TARIFFS ANNOUNCED",
      board: "IMPORTED BEER $14 (WAS $8)",
      characters: ["drew", "mango"],
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

// The showcase batch (?set=showcase): ten gag-complete candidates written to
// this week's actual financial news — six duo panels across the room and two
// away games, four with the proprietor working. Captions are typeset after
// QC, not here.
const SHOWCASE = [
  {
    slug: "sc01-jackson-hole",
    candidate: {
      scene:
        "Drew sits in the left club chair by the front window with his martini; Mango sits in the right chair, turned toward the TV.",
      tv: "JACKSON HOLE: MARKETS AWAIT THE SPEECH",
      board: "WYOMING SPRING WATER — $12",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc02-hike-odds",
    candidate: {
      scene: "Drew frame-left at the marble counter raises his martini; Mango frame-right stares down into his old fashioned.",
      tv: "RATE HIKE ODDS: 40%, AGAIN",
      board: "PRICED IN — NEVER POURED",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc03-tariffs",
    candidate: {
      scene: "Drew frame-left studies the chalkboard over his martini; Mango frame-right holds his old fashioned protectively with both hands.",
      tv: "CANADA MATCHES 50% TARIFFS, DOLLAR FOR DOLLAR",
      board: "CANADIAN WHISKY — ASK",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc04-ai-capex",
    candidate: {
      scene: "Drew frame-left gestures at the chalkboard with his olive pick; Mango frame-right looks up at the TV over his old fashioned.",
      tv: "AI SPENDING: $3 TRILLION COMMITTED",
      board: "OUR ONLY DATA CENTER: THIS CHALKBOARD",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc05-golf-thirty",
    candidate: {
      scene:
        "Drew frame-left leans on a driver with his martini in his other hand; Mango frame-right tees a ball on the terrace rail; a framed sign reads THE SWINGING DOOR 19TH HOLE.",
      setting: "the 19th hole terrace of a golf course, rolling fairway and a distant cart behind",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc06-security-refi",
    candidate: {
      scene:
        "Drew frame-left holds a security tray with his martini glass standing in it; Mango frame-right unbuckles his wristwatch; a wall sign reads PREPARE TO BE HUMBLED.",
      setting: "a crowded airport security line with bins, belts, and a metal detector",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc07-resilient",
    candidate: {
      scene:
        "Abby stands center behind the marble counter with her towel on her shoulder; Drew sits frame-left with his martini, Mango frame-right with his old fashioned.",
      tv: "CONSUMER RESILIENT DESPITE SENTIMENT",
      board: "SENTIMENT: LOW. TAB: OPEN.",
      characters: ["drew", "mango", "abby"],
    },
  },
  {
    slug: "sc08-sp-8000",
    candidate: {
      scene: "Abby chalks the board behind the bar; Drew frame-left and Mango frame-right watch her from their stools.",
      tv: "S&P NEARS 8,000",
      board: "EVERYTHING AT THE HIGH — $2 MORE",
      characters: ["drew", "mango", "abby"],
    },
  },
  {
    slug: "sc09-housing",
    candidate: {
      scene:
        "Abby pours from a bottle behind the counter; Drew frame-left studies the TV; Mango frame-right rests his chin on his hand.",
      tv: "DATA CENTERS OUTBUILD HOUSING",
      board: "ROOMS BY THE GLASS",
      characters: ["drew", "mango", "abby"],
    },
  },
  {
    slug: "sc10-last-call",
    candidate: {
      scene:
        "Abby rings a small bell behind the bar; Drew frame-left consults a pocket watch; Mango frame-right drains his old fashioned.",
      tv: "FED HOLDS, HINTS, HOLDS AGAIN",
      board: "LAST CALL: EVENTUALLY",
      characters: ["drew", "mango", "abby"],
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
    if (version.includes("kontext") && params.get("baseline") !== "1") {
      return NextResponse.json(
        { error: "The smoke test is for a fine-tune — Kontext is the baseline, not the candidate. Pass baseline=1 to deliberately smoke the production Kontext path (e.g. after changing its reference boards)." },
        { status: 400 }
      );
    }

    const scale = params.get("scale");
    if (scale && Number(scale) > 0) {
      // Per-request override of the strength dial; generateCartoonArt reads
      // the env at call time, and a Vercel function instance handles one
      // request at a time, so this cannot leak across users.
      process.env.LORA_SCALE = scale;
    }

    // ?probe=<text> — moderation bisection for baseline debugging: generate
    // once from the given text with Drew's board, report pass or flag,
    // commit nothing. Only meaningful with baseline=1.
    const probe = params.get("probe");
    if (probe && params.get("baseline") === "1") {
      try {
        await generateCartoonArt({ prompt: probe, characters: ["drew"], model: version });
        return NextResponse.json({ ok: true, probe: "passed" });
      } catch (error) {
        return NextResponse.json({ ok: false, probe: error instanceof Error ? error.message : String(error) });
      }
    }

    // ?set=showcase switches from the control cells to the showcase batch.
    const panelSet = params.get("set") === "showcase" ? SHOWCASE : PANELS;
    const n = Math.min(panelSet.length, Math.max(1, Number(params.get("n")) || panelSet.length));
    // ?only=<slug> runs a single panel — for isolating a moderation flag or
    // re-rolling one cell without paying for the others.
    const only = params.get("only");
    const chosen = only ? panelSet.filter((p) => p.slug === only) : panelSet.slice(0, n);
    if (chosen.length === 0) {
      return NextResponse.json({ error: `No panel named "${only}" — slugs: ${panelSet.map((p) => p.slug).join(", ")}.` }, { status: 400 });
    }
    const canon = await getCanon();
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 13).replace("T", "-");

    const started = Date.now();
    const made: string[] = [];
    const failed: { slug: string; error: string }[] = [];
    let first = true;
    for (const panel of chosen) {
      if (Date.now() - started > TIME_BUDGET_MS) break;
      // Under $5 of credit Replicate allows one prediction per ~10s; spacing
      // the panels turns a wave of 429s into a slower complete wave.
      if (!first) await new Promise((resolve) => setTimeout(resolve, 12_000));
      first = false;
      try {
        // Baseline (Kontext) runs must assemble the Kontext branch of the
        // prompt — the fine-tune branch writes trigger tokens into the text,
        // which a board-conditioned model happily paints onto the walls.
        const prompt = assemblePrompt(canon, panel.candidate, !version.includes("kontext"));
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
