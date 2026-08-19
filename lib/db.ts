import { PublishError } from "./githubPublish";

// The studio's living data: batches, cartoons, scores — Supabase Postgres
// + private Storage, hand-rolled REST like the rest of this codebase (no
// SDK). Git keeps the canon and the code; this keeps the work. The win
// over the old git-filing: everything Rick does shows up instantly — no
// rebuild wait — and the repo stops swelling with PNGs.
//
// Service-role key only, server-side only. RLS is on with no anon
// policies, so the publishable key can't read a thing.

const BUCKET = "cartoons";

function env(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new PublishError(
      500,
      "SUPABASE_URL / SUPABASE_SERVICE_KEY are not set — add them in Vercel (see docs/SETUP.md) and redeploy."
    );
  }
  return { url: url.replace(/\/$/, ""), key };
}

async function rest(path: string, init?: RequestInit): Promise<Response> {
  const { url, key } = env();
  return fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(init?.body && typeof init.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

async function restJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await rest(path, init);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new PublishError(502, `The studio database said ${res.status}${detail ? `: ${detail.slice(0, 180)}` : "."}`);
  }
  return (await res.json()) as T;
}

// ------------------------------------------------------------- shapes

export type StudioCartoon = {
  id: string;
  day: string;
  n: number;
  title: string | null;
  caption: string | null;
  scene: string | null;
  styleNotes: string | null;
  characters: string[];
  tags: string[];
  /** Cookie-gated image proxy path. */
  src: string;
  width: number;
  height: number;
  artScore: number | null;
  captionScore: number | null;
  note: string | null;
  keeper: boolean;
};

export type StudioBatch = {
  id: string;
  /** The founder's verbatim ask — "what he wrote". */
  request: string;
  topic: string | null;
  createdAt: string;
  cartoons: StudioCartoon[];
};

export type StudioDay = {
  day: string;
  batches: StudioBatch[];
  cartoonCount: number;
  ratedCount: number;
  landedCount: number;
  keeperCount: number;
};

type CartoonRow = {
  id: string;
  batch_id: string;
  day: string;
  n: number;
  title: string | null;
  caption: string | null;
  scene: string | null;
  style_notes: string | null;
  characters: string[] | null;
  tags: string[] | null;
  storage_path: string;
  width: number;
  height: number;
  created_at: string;
  feedback: FeedbackRow[] | FeedbackRow | null;
};

type FeedbackRow = {
  cartoon_id: string;
  art: number | null;
  caption: number | null;
  note: string | null;
  keeper: boolean;
};

type BatchRow = {
  id: string;
  day: string;
  request: string;
  topic: string | null;
  created_at: string;
  cartoons?: CartoonRow[];
};

const LANDED_MIN = 6;

function toCartoon(row: CartoonRow): StudioCartoon {
  const fb = Array.isArray(row.feedback) ? row.feedback[0] : row.feedback;
  return {
    id: row.id,
    day: row.day,
    n: row.n,
    title: row.title,
    caption: row.caption,
    scene: row.scene,
    styleNotes: row.style_notes,
    characters: row.characters ?? [],
    tags: row.tags ?? [],
    src: `/api/img/${row.day}/${row.n}`,
    width: row.width,
    height: row.height,
    artScore: fb?.art ?? null,
    captionScore: fb?.caption ?? null,
    note: fb?.note ?? null,
    keeper: fb?.keeper ?? false,
  };
}

function toBatch(row: BatchRow): StudioBatch {
  const cartoons = (row.cartoons ?? []).map(toCartoon).sort((a, b) => a.n - b.n);
  return { id: row.id, request: row.request, topic: row.topic, createdAt: row.created_at, cartoons };
}

export function cartoonLanded(c: StudioCartoon): boolean {
  return (c.artScore ?? 0) >= LANDED_MIN && (c.captionScore ?? 0) >= LANDED_MIN;
}

export function cartoonRated(c: StudioCartoon): boolean {
  return c.artScore !== null && c.captionScore !== null;
}

function toDay(day: string, batches: StudioBatch[]): StudioDay {
  const all = batches.flatMap((b) => b.cartoons);
  return {
    day,
    batches,
    cartoonCount: all.length,
    ratedCount: all.filter(cartoonRated).length,
    landedCount: all.filter(cartoonLanded).length,
    keeperCount: all.filter((c) => c.keeper).length,
  };
}

// ------------------------------------------------------------- writes

export async function createBatch(input: {
  day: string;
  request: string;
  topic: string | null;
}): Promise<{ id: string }> {
  const rows = await restJson<{ id: string }[]>(`/rest/v1/batches`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ day: input.day, request: input.request.trim(), topic: input.topic }),
  });
  if (!rows[0]?.id) throw new PublishError(502, "The batch didn't save.");
  return rows[0];
}

async function nextN(day: string): Promise<number> {
  const rows = await restJson<{ n: number }[]>(
    `/rest/v1/cartoons?select=n&day=eq.${day}&order=n.desc&limit=1`
  );
  return (rows[0]?.n ?? 0) + 1;
}

/** Upload the finished PNG and insert its row — the studio's core write. */
export async function fileToStudio(input: {
  batchId: string;
  day: string;
  title: string;
  caption: string;
  scene: string | null;
  styleNotes: string | null;
  characters: string[];
  tags: string[];
  finishedPng: Buffer;
  width: number;
  height: number;
}): Promise<{ day: string; n: number }> {
  // Two attempts ride out a same-day numbering race (unique day+n).
  for (let attempt = 0; attempt < 2; attempt++) {
    const n = await nextN(input.day);
    const path = `${input.day}/${n}.png`;

    const upload = await rest(`/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "image/png", "x-upsert": "true" },
      body: new Uint8Array(input.finishedPng),
    });
    if (!upload.ok) {
      const detail = await upload.text().catch(() => "");
      throw new PublishError(502, `Image upload failed (${upload.status})${detail ? `: ${detail.slice(0, 160)}` : "."}`);
    }

    const insert = await rest(`/rest/v1/cartoons`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        batch_id: input.batchId,
        day: input.day,
        n,
        title: input.title || null,
        caption: input.caption,
        scene: input.scene,
        style_notes: input.styleNotes,
        characters: input.characters,
        tags: input.tags,
        storage_path: path,
        width: input.width,
        height: input.height,
      }),
    });
    if (insert.ok) return { day: input.day, n };
    const detail = await insert.text().catch(() => "");
    if (insert.status === 409 && attempt === 0) continue; // number taken — renumber and retry
    throw new PublishError(502, `The cartoon row didn't save (${insert.status})${detail ? `: ${detail.slice(0, 160)}` : "."}`);
  }
  throw new PublishError(502, "The cartoon row didn't save after a retry.");
}

async function cartoonIdFor(day: string, n: number): Promise<string> {
  const rows = await restJson<{ id: string }[]>(`/rest/v1/cartoons?select=id&day=eq.${day}&n=eq.${n}`);
  if (!rows[0]?.id) throw new PublishError(404, `No cartoon ${n} filed under ${day}.`);
  return rows[0].id;
}

function validScore(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 10;
}

/** Upsert the founder's scores/note — instant, no rebuild. */
export async function setScores(
  day: string,
  n: number,
  patch: { art?: number; caption?: number; note?: string }
): Promise<void> {
  if (patch.art !== undefined && !validScore(patch.art)) {
    throw new PublishError(400, "The art score must be a whole number from 1 to 10.");
  }
  if (patch.caption !== undefined && !validScore(patch.caption)) {
    throw new PublishError(400, "The caption score must be a whole number from 1 to 10.");
  }
  const id = await cartoonIdFor(day, n);
  const body: Record<string, unknown> = { cartoon_id: id, updated_at: new Date().toISOString() };
  if (patch.art !== undefined) body.art = patch.art;
  if (patch.caption !== undefined) body.caption = patch.caption;
  if (patch.note !== undefined) body.note = patch.note.trim() || null;
  const res = await rest(`/rest/v1/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new PublishError(502, `The score didn't save (${res.status})${detail ? `: ${detail.slice(0, 160)}` : "."}`);
  }
}

export async function setKeeperFlag(day: string, n: number, on: boolean): Promise<void> {
  const id = await cartoonIdFor(day, n);
  const res = await rest(`/rest/v1/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ cartoon_id: id, keeper: on, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new PublishError(502, `The star didn't save (${res.status}).`);
}

// -------------------------------------------------------------- reads

const BATCH_SELECT = "*,cartoons(*,feedback(*))";

export async function getStudioDays(): Promise<string[]> {
  const rows = await restJson<{ day: string }[]>(`/rest/v1/batches?select=day&order=day.desc&limit=1000`);
  return [...new Set(rows.map((r) => r.day))];
}

export async function getStudioDay(day: string): Promise<StudioDay | null> {
  const rows = await restJson<BatchRow[]>(
    `/rest/v1/batches?select=${encodeURIComponent(BATCH_SELECT)}&day=eq.${day}&order=created_at.desc`
  );
  const batches = rows.map(toBatch).filter((b) => b.cartoons.length > 0);
  if (batches.length === 0) return null;
  return toDay(day, batches);
}

/** Newest day's table, if any. */
export async function getStudioToday(): Promise<StudioDay | null> {
  const days = await getStudioDays();
  for (const day of days) {
    const table = await getStudioDay(day);
    if (table) return table;
  }
  return null;
}

/** Day summaries for the Collection, newest first. */
export async function getStudioSummaries(): Promise<
  { day: string; batchCount: number; cartoonCount: number; ratedCount: number; landedCount: number; keeperCount: number; topics: string[]; firstThumbs: StudioCartoon[] }[]
> {
  const rows = await restJson<BatchRow[]>(
    `/rest/v1/batches?select=${encodeURIComponent(BATCH_SELECT)}&order=day.desc,created_at.desc&limit=400`
  );
  const byDay = new Map<string, StudioBatch[]>();
  for (const row of rows) {
    const batch = toBatch(row);
    if (batch.cartoons.length === 0) continue;
    byDay.set(row.day, [...(byDay.get(row.day) ?? []), batch]);
  }
  return [...byDay.entries()].map(([day, batches]) => {
    const summary = toDay(day, batches);
    return {
      day,
      batchCount: batches.length,
      cartoonCount: summary.cartoonCount,
      ratedCount: summary.ratedCount,
      landedCount: summary.landedCount,
      keeperCount: summary.keeperCount,
      topics: [...new Set(batches.map((b) => b.topic).filter((t): t is string => !!t))],
      firstThumbs: batches.flatMap((b) => b.cartoons).slice(0, 3),
    };
  });
}

export async function getStudioKeepers(): Promise<StudioCartoon[]> {
  const rows = await restJson<(FeedbackRow & { cartoons: Omit<CartoonRow, "feedback"> })[]>(
    `/rest/v1/feedback?select=${encodeURIComponent("*,cartoons(*)")}&keeper=is.true`
  );
  return rows
    .filter((r) => r.cartoons)
    .map((r) => toCartoon({ ...r.cartoons, feedback: [r] }))
    .sort((a, b) => (a.day === b.day ? b.n - a.n : a.day < b.day ? 1 : -1));
}

/** The finished PNG bytes from the private bucket. */
export async function getStudioImage(day: string, n: number): Promise<Buffer | null> {
  const res = await rest(`/storage/v1/object/${BUCKET}/${day}/${n}.png`);
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new PublishError(502, `Image fetch failed (${res.status}).`);
  return Buffer.from(await res.arrayBuffer());
}

/** True if the day already has cartoons — the backfill's idempotence check. */
export async function dayExists(day: string): Promise<boolean> {
  const rows = await restJson<{ id: string }[]>(`/rest/v1/cartoons?select=id&day=eq.${day}&limit=1`);
  return rows.length > 0;
}

// ------------------------------------------------------------- digest

/** The whole training corpus as text — get_feedback's payload. */
export async function getStudioDigest(): Promise<string> {
  const rows = await restJson<BatchRow[]>(
    `/rest/v1/batches?select=${encodeURIComponent(BATCH_SELECT)}&order=day.asc,created_at.asc&limit=400`
  );
  const byDay = new Map<string, StudioBatch[]>();
  for (const row of rows) {
    const batch = toBatch(row);
    if (batch.cartoons.length === 0) continue;
    byDay.set(row.day, [...(byDay.get(row.day) ?? []), batch]);
  }

  const lines: string[] = [];
  const trend: string[] = [];
  let rated = 0;
  let total = 0;
  let landedTotal = 0;

  for (const [day, batches] of byDay) {
    const summary = toDay(day, batches);
    lines.push(`\n## ${day}`);
    let artSum = 0;
    let captionSum = 0;
    for (const batch of batches) {
      lines.push(`\nHe asked: "${batch.request}"${batch.topic ? ` (topic: ${batch.topic})` : ""}`);
      for (const c of batch.cartoons) {
        total++;
        const isRated = cartoonRated(c);
        const didLand = cartoonLanded(c);
        if (isRated) {
          rated++;
          artSum += c.artScore as number;
          captionSum += c.captionScore as number;
          if (didLand) landedTotal++;
        }
        const scoreText = isRated
          ? `art ${c.artScore}/10, caption ${c.captionScore}/10 — ${
              didLand
                ? "LANDED"
                : `MISS (${(c.artScore as number) < LANDED_MIN && (c.captionScore as number) < LANDED_MIN ? "both" : (c.artScore as number) < LANDED_MIN ? "art" : "caption"})`
            }`
          : c.artScore !== null
            ? `art ${c.artScore}/10, caption unscored`
            : c.captionScore !== null
              ? `caption ${c.captionScore}/10, art unscored`
              : "unrated";
        lines.push(
          `- ${day} #${c.n}${c.keeper ? " ★KEEPER" : ""} [${scoreText}]: ${c.title ?? "untitled"} — "${c.caption ?? ""}"` +
            (c.styleNotes ? `\n  Deliberate variation: ${c.styleNotes}` : "") +
            (c.note ? `\n  His note: ${c.note}` : "")
        );
      }
    }
    trend.push(
      `${day}: ${summary.cartoonCount} filed in ${batches.length} batch(es), ${summary.ratedCount} rated, ` +
        `${summary.landedCount} landed, ${summary.keeperCount} keepers` +
        (summary.ratedCount
          ? ` (landed ${Math.round((summary.landedCount / summary.ratedCount) * 100)}% · art avg ${(artSum / summary.ratedCount).toFixed(1)} · caption avg ${(captionSum / summary.ratedCount).toFixed(1)})`
          : "")
    );
  }

  const overallRate = rated ? Math.round((landedTotal / rated) * 100) : 0;
  return (
    `Founder feedback — ${rated} of ${total} fully rated. A cartoon LANDS when art >= ${LANDED_MIN} ` +
    `AND caption >= ${LANDED_MIN}. STUDIO GOAL: 60% landed. Currently: ${overallRate}% landed.\n\n` +
    `TREND (is the bible converging? the landed rate should climb as revisions take):\n` +
    trend.map((t) => `  ${t}`).join("\n") +
    `\n\nAnalysis hints: every batch header carries the founder's verbatim request — compare what he ` +
    `asked for against what landed. The two dials attribute failures: a low art average points at the ` +
    `visual bibles and the image prompt, a low caption average at the comedy bible. Siblings in one ` +
    `batch shared a request, so score differences between them are pure signal; "deliberate variation" ` +
    `tags are the controlled experiments.` +
    lines.join("\n")
  );
}
