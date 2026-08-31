import { NextResponse, type NextRequest } from "next/server";

import { BACKROOM_COOKIE, isDoorOpen, isTriggerOpen } from "@/lib/backroom-auth";
import { foldCastScores } from "@/lib/cast";
import { PublishError, commitFiles, readRepoFile } from "@/lib/githubPublish";

// Rick's verdict on one cartoon.
//
// A rating out of ten for EACH character who appears in the panel, one for the
// scene, one for the caption, and whatever he wants to say in his own words.
// It commits as a small JSON file beside the batch it judges, so the review
// trail lives in the repo next to the pictures rather than in a database
// nobody reads. Git is the inbox: the operator pulls, reads every verdict, and
// changes the strip to suit him.
//
// Ratings are UPSERTS keyed by batch and panel. He can change his mind, and
// the file records that he did — `revisions` counts how many times a verdict
// was rewritten, and `history` keeps what it said before. A score that moved
// is a stronger signal than a score that never did, and throwing that away
// would lose the most interesting thing in the file.

export const runtime = "nodejs";

const CAST = ["drew", "barclay", "abby"] as const;
type CastName = (typeof CAST)[number];

export type Verdict = {
  batch: string;
  panel: string;
  /** One score in 1–10 per character who appears in the panel. */
  characters: Partial<Record<CastName, number>>;
  scene: number | null;
  caption: number | null;
  comment: string;
  at: string;
  revisions: number;
  history?: { at: string; characters: Partial<Record<CastName, number>>; scene: number | null; caption: number | null; comment: string }[];
};

/** A score is 1–10 or nothing. Anything else is a mistake, not a zero. */
function score(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  return rounded >= 1 && rounded <= 10 ? rounded : null;
}

export async function POST(request: NextRequest) {
  const authed =
    (await isDoorOpen(request.cookies.get(BACKROOM_COOKIE)?.value)) ||
    (await isTriggerOpen(request.nextUrl.searchParams.get("t")));
  if (!authed) {
    return NextResponse.json({ error: "The door is closed. Knock first." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const batch = typeof body.batch === "string" ? body.batch.replace(/[^\w.-]/g, "").slice(0, 120) : "";
  const panel = typeof body.panel === "string" ? body.panel.replace(/[^\w.-]/g, "").slice(0, 120) : "";
  if (!batch || !panel) {
    return NextResponse.json({ error: "Which cartoon? Send a batch and a panel." }, { status: 400 });
  }

  // foldCastScores, not a CAST loop: pre-rename clients and queued sendBeacon
  // payloads still say "mango", and a dropped key here is a score the founder
  // typed that silently vanished.
  const characters = foldCastScores(body.characters ?? {});
  const scene = score(body.scene);
  const caption = score(body.caption);
  const comment = typeof body.comment === "string" ? body.comment.slice(0, 4000).trim() : "";

  if (Object.keys(characters).length === 0 && scene === null && caption === null && !comment) {
    return NextResponse.json({ error: "Nothing to record." }, { status: 400 });
  }

  const path = `feedback/ratings/${batch}/${panel.replace(/\.png$/, "")}.json`;

  try {
    // Read the standing verdict so a second opinion updates it rather than
    // silently replacing it.
    const existingFile = await readRepoFile(path).catch(() => null);
    const existing = existingFile
      ? (JSON.parse(existingFile.bytes.toString("utf8")) as Verdict)
      : null;

    const now = new Date().toISOString();
    const history = existing
      ? [
          ...(existing.history ?? []),
          {
            at: existing.at,
            characters: existing.characters,
            scene: existing.scene,
            caption: existing.caption,
            comment: existing.comment,
          },
        ].slice(-10)
      : undefined;

    const verdict: Verdict = {
      batch,
      panel,
      // A partial submission edits the standing verdict; it does not blank the
      // parts it left alone. The merge FOLDS: an existing {mango: 2} plus an
      // incoming {barclay: 7} must converge to one key, not carry both.
      characters: foldCastScores({ ...(existing?.characters ?? {}), ...characters }),
      scene: scene ?? existing?.scene ?? null,
      caption: caption ?? existing?.caption ?? null,
      comment: comment || existing?.comment || "",
      at: now,
      revisions: (existing?.revisions ?? 0) + (existing ? 1 : 0),
      ...(history && history.length > 0 ? { history } : {}),
    };

    const scored = [
      ...Object.entries(verdict.characters).map(([who, n]) => `${who} ${n}`),
      verdict.scene !== null ? `scene ${verdict.scene}` : "",
      verdict.caption !== null ? `caption ${verdict.caption}` : "",
    ]
      .filter(Boolean)
      .join(", ");

    await commitFiles(
      [{ path, content: JSON.stringify(verdict, null, 2) }],
      `rating ${batch}/${panel}: ${scored || "comment only"}`
    );
    return NextResponse.json({ ok: true, saved: verdict });
  } catch (err) {
    if (err instanceof PublishError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: `Could not record it: ${(err as Error).message}` }, { status: 500 });
  }
}
