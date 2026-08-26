import { NextResponse, type NextRequest } from "next/server";
import { BACKROOM_COOKIE, isDoorOpen, isTriggerOpen } from "@/lib/backroom-auth";

import { assemblePrompt, generateCartoonArt, isMultiRef } from "@/lib/generate";
import { PublishError, commitFiles, getCanon, readRepoFile } from "@/lib/githubPublish";
import { getTraining, replicateGet } from "@/lib/replicate";

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
    slug: "sc01-hike-odds",
    caption: 'Drew: "Best seller all year. Nobody has ever had to make one."',
    candidate: {
      scene:
        "Drew sits frame-left on a stool at the marble bar counter with his martini, studying the chalkboard; Mango sits frame-right beside him over his old fashioned, turned toward Drew in three-quarter view; the back bar and its bottles rise across the counter behind them. They are seated at the bar, never at a table, and never lined up facing the viewer.",
      tv: "WARSH SPEAKS FRIDAY — HIKE ODDS 45%, AGAIN",
      board: "THE RATE HIKE $19 — PRICED NIGHTLY, NEVER POURED",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc02-tariffs",
    caption: 'Mango: "I had one of each. It felt patriotic both times."',
    candidate: {
      scene:
        "Mango sits frame-right at the marble bar counter with two short whiskies side by side on matching napkins in front of him; Drew sits frame-left with his martini, turned toward Mango with one brow raised; the back bar rises across the counter behind them. They are seated at the bar, never at a table, and never lined up facing the viewer.",
      tv: "CANADA MATCHES 50% TARIFF, DOLLAR FOR DOLLAR",
      board: "CANADIAN CLUB $9 · RETALIATORY CLUB $9",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc03-ai-capex",
    caption: 'Drew: "Committed is money that has not had its second thoughts yet."',
    candidate: {
      scene:
        "Drew sits frame-left at the marble bar counter raising one feathered finger for another round, his empty martini glass before him; Mango sits frame-right with his old fashioned, looking up at the screen; the back bar rises across the counter behind them. They are seated at the bar, never at a table, and never lined up facing the viewer.",
      tv: "AI CAPEX: $600B SPENT, $3 TRILLION COMMITTED",
      board: "MARTINI $18 — COMMITTING TO A MARTINI: FREE",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc04-refinance",
    caption: 'Mango: "Nobody pays a tab like that. They renew it."',
    candidate: {
      scene:
        "Mango sits frame-right at the marble bar counter holding a very long paper bar tab that unrolls off the edge of the marble; Drew sits frame-left with his martini, unmoved, turned toward him; the back bar rises across the counter behind them. They are seated at the bar, never at a table, and never lined up facing the viewer.",
      tv: "TREASURY REFINANCES $9.7 TRILLION THIS YEAR",
      board: "ALL TABS ROLLED OVER NIGHTLY",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc05-golf-thirty",
    caption: 'Drew: "Five and a quarter for thirty years. My swing guarantees nothing of the kind."',
    candidate: {
      scene:
        "Drew stands frame-left in a pale golf visor with his martini held by the stem, turned toward Mango; Mango stands frame-right in a white polo and pale cap with his old fashioned, a golf bag leaning at the rail beside him; a framed sign at the edge reads THE SWINGING DOOR 19TH HOLE. They face each other in three-quarter view, never lined up facing the viewer.",
      setting: "the outdoor 19th hole terrace of a golf course, rolling fairways with distant golfers and a cart behind them",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc06-jackson-hole",
    caption: 'Mango: "A symposium in the mountains, to tell us they are still thinking about it."',
    candidate: {
      scene:
        "Mango sits frame-right at the marble bar counter leaning toward the screen with his old fashioned; Drew sits frame-left with his martini, entirely unhurried, turned toward Mango; the back bar rises across the counter behind them. They are seated at the bar, never at a table, and never lined up facing the viewer.",
      tv: "JACKSON HOLE: THE SPEECH IS FRIDAY",
      board: "WYOMING SPRING WATER $12",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc07-sentiment",
    caption: 'Mango: "I have never felt worse about the economy, Abby. Same again."',
    candidate: {
      scene:
        "The marble bar counter runs across the frame. Abby stands BEHIND it on the far side, facing the room, towel on her shoulder, a bottle in her hand. Drew sits frame-left and Mango sits frame-right on stools at the NEAR side, both in three-quarter view turned toward her: Mango slides his empty rocks glass across the marble toward Abby, and Drew watches the screen over his martini. Three characters, never lined up shoulder to shoulder facing the viewer.",
      tv: "SENTIMENT AT RECORD LOW — SPENDING UP AGAIN",
      board: "MISERY HOUR 4–7 · DOUBLES $22",
      characters: ["drew", "mango", "abby"],
    },
  },
  {
    slug: "sc08-sp-8000",
    caption: 'Drew: "Her target follows the price at a respectful distance. It is called research."',
    candidate: {
      scene:
        "The marble bar counter runs across the frame. Abby stands BEHIND it on the far side, reaching up with a piece of chalk to write a higher number over the old one on the chalkboard, glancing back over her shoulder. Drew sits frame-left and Mango sits frame-right on stools at the NEAR side in three-quarter view, both watching her; Drew has not moved his martini. Three characters, never lined up shoulder to shoulder facing the viewer.",
      tv: "S&P 2% OFF RECORD — STREET TARGETS 8,000",
      board: "HOUSE MARTINI $18 · YEAR-END TARGET $19",
      characters: ["drew", "mango", "abby"],
    },
  },
  {
    slug: "sc09-housing",
    caption: 'Abby: "The house keeps winning, gentlemen. Just not the kind anyone lives in."',
    candidate: {
      scene:
        "The marble bar counter runs across the frame. Abby stands BEHIND it on the far side, drawing a neat chalk line through one drink name on the chalkboard, addressing the room. Drew sits frame-left with his martini and Mango sits frame-right with his old fashioned, chin on his hand, both on stools at the NEAR side in three-quarter view. Three characters, never lined up shoulder to shoulder facing the viewer.",
      tv: "DATA CENTERS OUTBUILD HOUSING",
      board: "THE STARTER HOME $12 — OUTBID",
      characters: ["drew", "mango", "abby"],
    },
  },
  {
    slug: "sc10-fed-abby",
    caption: 'Abby: "I price in a raise every morning, gentlemen. Delivering it is a separate decision."',
    candidate: {
      scene:
        "The marble bar counter runs across the frame. Abby stands BEHIND it on the far side with chalk in hand at the martini line of the board, one brow raised at the two of them. Drew sits frame-left and Mango sits frame-right on stools at the NEAR side in three-quarter view, watching her the way traders watch a Fed meeting. Three characters, never lined up shoulder to shoulder facing the viewer.",
      tv: "HIKE ODDS 45%, AGAIN",
      board: "MARTINI $18 — CHANCE OF $19 TODAY: 45%",
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
    // ?schema=<owner/name> — read a model's real input contract from
    // Replicate. The sandbox cannot reach replicate.com, so guessing at
    // parameter names is how a paid call gets wasted on a 422.
    const schemaOf = params.get("schema");
    if (schemaOf) {
      const model = await replicateGet<{
        latest_version?: { id: string; openapi_schema?: Record<string, unknown> };
      }>(`/models/${schemaOf}`);
      const schema = model.latest_version?.openapi_schema as
        | { components?: { schemas?: { Input?: { properties?: Record<string, Record<string, unknown>> } } } }
        | undefined;
      const props = schema?.components?.schemas?.Input?.properties ?? {};
      return NextResponse.json({
        model: schemaOf,
        version: model.latest_version?.id ?? null,
        inputs: Object.fromEntries(
          Object.entries(props).map(([name, spec]) => [
            name,
            { type: spec.type ?? spec.allOf ?? spec.$ref ?? "?", description: String(spec.description ?? "").slice(0, 160) },
          ])
        ),
      });
    }

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
    if ((version.includes("kontext") || isMultiRef(version)) && params.get("baseline") !== "1") {
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
        const multiRef = isMultiRef(version);
        const staged = !multiRef && params.get("set") === "showcase" && !panel.candidate.setting;
        const prompt = assemblePrompt(
          canon,
          panel.candidate,
          !version.includes("kontext") && !multiRef,
          staged,
          multiRef
        );
        const image = await generateCartoonArt({
          prompt,
          characters: panel.candidate.characters,
          barScene: !panel.candidate.setting,
          staged,
          model: version,
        });
        const name = `${stamp}-${panel.slug}`;
        await commitFiles(
          [
            { path: `${OUT_DIR}/${name}.png`, content: image },
            {
              path: `${OUT_DIR}/${name}.txt`,
              content:
                `${version}\nLORA_SCALE=${process.env.LORA_SCALE ?? "0.9 (default)"}\n` +
                ("caption" in panel && panel.caption ? `CAPTION ${panel.caption}\n` : "") +
                `\n${prompt}\n`,
            },
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
