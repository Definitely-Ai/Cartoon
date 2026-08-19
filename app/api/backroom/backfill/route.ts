import { NextResponse, type NextRequest } from "next/server";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { gh, requiredEnv, PublishError } from "@/lib/githubPublish";
import { createBatch, dayExists, fileToStudio, setKeeperFlag } from "@/lib/db";

// One-time mover: copies the legacy /options days (git era) into the
// studio database + bucket so the Collection is complete. Idempotent —
// a day that already exists in the database is skipped. Safe to click
// twice; reports what it did. The git files stay in the repo as history.

export const runtime = "nodejs";
export const maxDuration = 300;

const BRANCH = "main";

type Entry = { name: string; sha: string; size: number; type: string };

export async function GET(request: NextRequest) {
  if (!(await isDoorOpen(request.cookies.get(BACKROOM_COOKIE)?.value))) {
    return NextResponse.json({ error: "The door is closed. Knock first." }, { status: 401 });
  }

  const report: string[] = [];
  try {
    const { token, repo } = requiredEnv();
    const api = gh(token);

    const daysRes = await api(`/repos/${repo}/contents/options?ref=${BRANCH}`);
    if (!daysRes.ok) throw new PublishError(502, `GitHub said ${daysRes.status} listing /options.`);
    const days = ((await daysRes.json()) as Entry[])
      .filter((e) => e.type === "dir" && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
      .map((e) => e.name)
      .sort();

    for (const day of days) {
      if (await dayExists(day)) {
        report.push(`${day}: already in the studio — skipped.`);
        continue;
      }
      const listRes = await api(`/repos/${repo}/contents/options/${day}?ref=${BRANCH}`);
      if (!listRes.ok) {
        report.push(`${day}: could not list (${listRes.status}) — skipped.`);
        continue;
      }
      const files = (await listRes.json()) as Entry[];
      const byName = new Map(files.map((f) => [f.name, f]));

      const readJson = async (name: string): Promise<Record<string, unknown> | null> => {
        const f = byName.get(name);
        if (!f) return null;
        const res = await api(`/repos/${repo}/git/blobs/${f.sha}`);
        if (!res.ok) return null;
        const blob = (await res.json()) as { content?: string };
        try {
          return blob.content ? JSON.parse(Buffer.from(blob.content, "base64").toString("utf8")) : null;
        } catch {
          return null;
        }
      };

      const keepersRaw = (await readJson("keepers.json"))?.keepers;
      const keepers = Array.isArray(keepersRaw)
        ? keepersRaw.filter((k): k is number => Number.isInteger(k))
        : [];

      const numbers = files
        .map((f) => f.name.match(/^option-(\d+)\.png$/)?.[1])
        .filter((m): m is string => !!m)
        .map(Number)
        .sort((a, b) => a - b);
      if (numbers.length === 0) {
        report.push(`${day}: no cartoons — skipped.`);
        continue;
      }

      // The git era predates batches — one legacy batch per day, headed
      // by the day's topic(s) so the site still shows what it was about.
      const metas = new Map<number, Record<string, unknown>>();
      for (const n of numbers) {
        const meta = await readJson(`option-${n}.json`);
        if (meta) metas.set(n, meta);
      }
      const topics = [
        ...new Set(
          [...metas.values()]
            .map((m) => (typeof m.topic === "string" ? m.topic.trim() : ""))
            .filter(Boolean)
        ),
      ];
      const batch = await createBatch({
        day,
        request: topics.length ? topics.join(" · ") : "(filed before batches)",
        topic: topics[0] ?? null,
      });

      let moved = 0;
      for (const n of numbers) {
        const png = byName.get(`option-${n}.png`);
        if (!png) continue;
        const blobRes = await api(`/repos/${repo}/git/blobs/${png.sha}`);
        if (!blobRes.ok) continue;
        const blob = (await blobRes.json()) as { content?: string };
        if (!blob.content) continue;
        const bytes = Buffer.from(blob.content, "base64");
        const meta = metas.get(n) ?? {};
        const filed = await fileToStudio({
          batchId: batch.id,
          day,
          title: typeof meta.title === "string" ? meta.title : "",
          caption: typeof meta.caption === "string" ? meta.caption : "",
          scene: null,
          styleNotes: typeof meta.style_notes === "string" ? meta.style_notes : null,
          characters: [],
          tags: Array.isArray(meta.tags)
            ? (meta.tags as unknown[]).filter((t): t is string => typeof t === "string")
            : [],
          finishedPng: bytes,
          width: bytes.readUInt32BE(16),
          height: bytes.readUInt32BE(20),
        });
        if (keepers.includes(n)) await setKeeperFlag(day, filed.n, true);
        moved++;
      }
      report.push(`${day}: moved ${moved} cartoon(s), ${keepers.length} keeper star(s).`);
    }

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    const message = err instanceof PublishError ? err.message : (err as Error).message;
    return NextResponse.json({ ok: false, report, error: message }, { status: 500 });
  }
}
