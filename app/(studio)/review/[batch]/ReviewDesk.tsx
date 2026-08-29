"use client";

// THE SCORING DESK — twenty-five cartoons, one at a time, big enough to judge.
//
// The old screen stacked every cartoon in a two-up grid: each picture was a
// thumbnail, the scores were somewhere below it, and after ten minutes Rick
// had no idea how many he had done or which ones were left. This shows him one
// cartoon at the size he needs to see it, the line beside it because he is
// scoring the line too, and a strip along the top that says at a glance what
// is scored, what is half done and what he has not touched.
//
// Three rules this file exists to keep:
//
//   1. NOTHING HE TYPES IS EVER LOST. Every tap and every keystroke goes
//      straight into localStorage before it goes anywhere near the wire. A
//      closed tab, a dropped connection or a failed save costs him nothing but
//      the press of a button.
//   2. ONE CARTOON IS ONE COMMIT. The old card fired a request per tap — five
//      scores meant five commits, a hundred and twenty-five for a batch this
//      size. Edits settle for a moment and then go out together.
//   3. THE PAYLOAD SHAPE IS THE ROUTE'S, NOT OURS. /api/backroom/rate takes
//      batch, panel, characters{}, scene, caption, comment, and it UPSERTS —
//      so re-scoring is just sending it again.
//
// The .rv-* classes live in one <style> block on the page that renders this,
// the way the rest of this screen has always done it.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CastName = "drew" | "mango" | "abby";

/** The parts of a committed feedback/ratings/<batch>/<panel>.json this screen
 *  puts back on the dials — and the same shape a work-in-progress draft takes. */
export type StandingVerdict = {
  characters: Partial<Record<CastName, number>>;
  scene: number | null;
  caption: number | null;
  comment: string;
};

/** One cartoon, flattened by the page into what the desk actually needs. The
 *  server component does the flattening because a plan panel carries a page of
 *  camera direction nobody here reads. */
export type DeskPanel = {
  n: number;
  /** The panel's filename — the rate route's key for it. */
  file: string;
  /** The filename without .png — the key its verdict file is filed under. */
  key: string;
  /** Who says the line, under their proper name. */
  speaker: string;
  caption: string;
  turn: string;
  /** Only the characters actually in the picture. Scoring anyone else would
   *  put a score in the data for a character who never appeared. */
  cast: { key: CastName; name: string }[];
  drawn: boolean;
  src: string;
  alt: string;
  verdict: StandingVerdict | null;
};

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const CAST_KEYS: CastName[] = ["drew", "mango", "abby"];

/** Long enough that a run of taps goes out as one commit, short enough that
 *  he never gets ahead of it. */
const SETTLE_SCORE = 900;
const SETTLE_TYPING = 1600;

const empty = (): StandingVerdict => ({ characters: {}, scene: null, caption: null, comment: "" });

// --------------------------------------------------------------- the drafts

/** One key per batch, so a finished batch leaves nothing behind when its last
 *  draft is cleared. */
const draftKey = (batch: string) => `swinging-door.review.v1.${batch}`;

/** A score is 1-10 or nothing — the same rule the rate route applies, repeated
 *  here because a draft comes off a disk anyone could have edited. */
function cleanScore(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  return rounded >= 1 && rounded <= 10 ? rounded : null;
}

function cleanVerdict(raw: unknown): StandingVerdict | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const incoming = (value.characters ?? {}) as Record<string, unknown>;
  const characters: Partial<Record<CastName, number>> = {};
  for (const who of CAST_KEYS) {
    const n = cleanScore(incoming[who]);
    if (n !== null) characters[who] = n;
  }
  return {
    characters,
    scene: cleanScore(value.scene),
    caption: cleanScore(value.caption),
    comment: typeof value.comment === "string" ? value.comment.slice(0, 4000) : "",
  };
}

/**
 * Storage is not a promise. Safari in private mode throws on read AND write,
 * an iPad with site data blocked throws, a full disk throws on write, and a
 * half-written blob throws on parse. Losing a draft is a shrug; taking the
 * review screen down with it is not — so every touch of it is caught.
 */
function readDrafts(batch: string): Record<string, StandingVerdict> {
  try {
    const raw = window.localStorage.getItem(draftKey(batch));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, StandingVerdict> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const draft = cleanVerdict(value);
      if (draft) out[key] = draft;
    }
    return out;
  } catch {
    return {};
  }
}

function writeDrafts(batch: string, book: Record<string, StandingVerdict>): void {
  try {
    if (Object.keys(book).length === 0) window.localStorage.removeItem(draftKey(batch));
    else window.localStorage.setItem(draftKey(batch), JSON.stringify(book));
  } catch {
    // Out of quota or storage refused. The scores are still in the page and
    // still on their way to the repo; only the safety net is gone.
  }
}

// --------------------------------------------------------------- the reading

/** Has he put anything on this one at all? */
function hasAnything(panel: DeskPanel, mine: StandingVerdict): boolean {
  if (mine.scene !== null || mine.caption !== null) return true;
  if (mine.comment.trim().length > 0) return true;
  return panel.cast.some((who) => typeof mine.characters[who.key] === "number");
}

/** Every score this cartoon can carry — every character in it, the scene and
 *  the caption. That is what "scored" means on the strip and in the count. */
function isComplete(panel: DeskPanel, mine: StandingVerdict): boolean {
  if (!panel.drawn) return false;
  if (mine.scene === null || mine.caption === null) return false;
  return panel.cast.every((who) => typeof mine.characters[who.key] === "number");
}

/**
 * Is what is on screen already the repo's answer?
 *
 * Only the cast in THIS panel is compared: a verdict file can carry a score
 * for someone who was written out of the panel later, and that must not leave
 * the card permanently claiming unsaved work. A cleared comment box is not a
 * change either — the rate route reads an empty comment as "leave the standing
 * note alone", so there is no way to send one.
 */
function matchesServer(
  panel: DeskPanel,
  mine: StandingVerdict,
  server: StandingVerdict | undefined
): boolean {
  if (!server) return false;
  for (const who of panel.cast) {
    if ((mine.characters[who.key] ?? null) !== (server.characters[who.key] ?? null)) return false;
  }
  if (mine.scene !== server.scene || mine.caption !== server.caption) return false;
  const note = mine.comment.trim();
  if (note && note !== server.comment.trim()) return false;
  return true;
}

// ------------------------------------------------------------------ the dial

/**
 * One 1-10 dial. Ten buttons is ten tab stops and this screen carries five
 * dials, so the row is a single stop: Tab lands on the standing score and the
 * arrow keys walk the row without committing anything. Only a real click or
 * Enter/Space picks a number, which is what keeps a scrub across the row from
 * becoming ten scores.
 */
function Dial(props: {
  label: string;
  hint: string;
  value: number | null;
  onPick: (n: number) => void;
}) {
  const [focused, setFocused] = useState<number | null>(null);
  const row = useRef<HTMLDivElement | null>(null);
  const tabStop = focused ?? props.value ?? 1;
  const labelId = `rv-dial-${props.label.replace(/\W+/g, "-").toLowerCase()}`;

  function walk(event: React.KeyboardEvent<HTMLDivElement>) {
    const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next: number | null = null;
    if (event.key in step) next = Math.min(10, Math.max(1, tabStop + step[event.key]));
    if (event.key === "Home") next = 1;
    if (event.key === "End") next = 10;
    if (next === null) return;
    event.preventDefault();
    event.stopPropagation();
    row.current?.querySelector<HTMLButtonElement>(`button[data-score="${next}"]`)?.focus();
  }

  return (
    <div className="rv-dial">
      <span className="rv-dial-label" id={labelId}>
        {props.label}
        <span className="rv-dial-hint"> — {props.hint}</span>
      </span>
      <span className={`rv-dial-value${props.value === null ? " rv-dial-value-none" : ""}`}>
        {props.value === null ? "no score yet" : `${props.value} out of 10`}
      </span>
      <div className="rv-dial-row" ref={row} role="group" aria-labelledby={labelId} onKeyDown={walk}>
        {SCORES.map((n) => (
          <button
            key={n}
            type="button"
            data-score={n}
            className={`rv-dial-btn${n >= 6 ? " rv-dial-pass" : ""}${props.value === n ? " rv-dial-on" : ""}`}
            aria-pressed={props.value === n}
            aria-label={`${props.label}: ${n} out of 10`}
            tabIndex={n === tabStop ? 0 : -1}
            onFocus={() => setFocused(n)}
            onBlur={() => setFocused(null)}
            onClick={() => props.onPick(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ the desk

type SaveState = { state: "saving" | "saved" | "error"; message?: string };

export default function ReviewDesk(props: { batch: string; panels: DeskPanel[] }) {
  const { batch, panels } = props;

  /** What every card starts at: his standing verdict, or a blank one. */
  const seeded = useMemo(() => {
    const out: Record<string, StandingVerdict> = {};
    for (const panel of panels) out[panel.key] = panel.verdict ?? empty();
    return out;
  }, [panels]);

  const standing = useMemo(() => {
    const out: Record<string, StandingVerdict> = {};
    for (const panel of panels) if (panel.verdict) out[panel.key] = panel.verdict;
    return out;
  }, [panels]);

  // Open on the first one he still owes a score, not on number one — coming
  // back to a half-scored batch should land him where he stopped. Computed
  // from the server's own data so the first paint matches what was rendered.
  const [index, setIndex] = useState(() => {
    const at = panels.findIndex((panel) => panel.drawn && !isComplete(panel, seeded[panel.key]));
    return at === -1 ? 0 : at;
  });

  const [working, setWorking] = useState<Record<string, StandingVerdict>>(seeded);
  const [committed, setCommitted] = useState<Record<string, StandingVerdict>>(standing);
  const [saves, setSaves] = useState<Record<string, SaveState>>({});
  const [restored, setRestored] = useState<Record<string, true>>({});

  // Refs, not state, for anything a timer or an unload handler has to read:
  // by the time those fire, a closure over state is a lie.
  const latest = useRef(working);
  const server = useRef(committed);
  const book = useRef<Record<string, StandingVerdict>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const at = useRef(index);

  useEffect(() => {
    latest.current = working;
  }, [working]);
  useEffect(() => {
    server.current = committed;
  }, [committed]);
  useEffect(() => {
    at.current = index;
  }, [index]);

  const byKey = useMemo(() => new Map(panels.map((panel) => [panel.key, panel])), [panels]);

  // Put back whatever he was in the middle of. localStorage cannot be read
  // while rendering — the server has no idea what is on his machine, and a
  // mismatched first paint is a hydration error — so it lands one tick later.
  useEffect(() => {
    const saved = readDrafts(batch);
    book.current = saved;
    const found: Record<string, true> = {};
    const merged: Record<string, StandingVerdict> = {};
    for (const [key, draft] of Object.entries(saved)) {
      const panel = byKey.get(key);
      if (!panel) continue;
      if (matchesServer(panel, draft, standing[key])) continue;
      merged[key] = draft;
      found[key] = true;
    }
    if (Object.keys(merged).length === 0) return;
    setWorking((current) => {
      const next = { ...current, ...merged };
      latest.current = next;
      return next;
    });
    setRestored(found);
  }, [batch, byKey, standing]);

  const panel = panels[Math.min(index, panels.length - 1)];
  const mine = working[panel.key] ?? empty();

  // ------------------------------------------------------------ saving

  const send = useCallback(
    async (key: string) => {
      const target = byKey.get(key);
      if (!target || !target.drawn) return;

      const draft = latest.current[key] ?? empty();
      if (!hasAnything(target, draft)) return;
      if (matchesServer(target, draft, server.current[key])) return;

      const characters: Partial<Record<CastName, number>> = {};
      for (const who of target.cast) {
        const value = draft.characters[who.key];
        if (typeof value === "number") characters[who.key] = value;
      }

      setSaves((current) => ({ ...current, [key]: { state: "saving" } }));

      // One verdict file, one writer. The rate route reads the standing file
      // and commits the merge, so two overlapping writes could drop one of
      // them; running this screen's writes end to end removes the race.
      const run = queue.current.then(async () => {
        try {
          const res = await fetch("/api/backroom/rate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              batch,
              panel: target.file,
              characters,
              scene: draft.scene,
              caption: draft.caption,
              comment: draft.comment.trim(),
            }),
          });
          const data = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            error?: string;
            saved?: unknown;
          };
          if (!res.ok || !data.ok) {
            setSaves((current) => ({
              ...current,
              [key]: { state: "error", message: data.error ?? "That didn’t take." },
            }));
            return;
          }
          // Take the repo's own copy back, not the draft we sent: the route
          // merges a partial score onto the standing verdict, so its answer is
          // the only honest picture of what is now on file.
          const landed = cleanVerdict(data.saved) ?? draft;
          setCommitted((current) => {
            const next = { ...current, [key]: landed };
            server.current = next;
            return next;
          });
          delete book.current[key];
          writeDrafts(batch, book.current);
          setRestored((current) => {
            if (!current[key]) return current;
            const next = { ...current };
            delete next[key];
            return next;
          });
          setSaves((current) => ({ ...current, [key]: { state: "saved" } }));
        } catch {
          setSaves((current) => ({
            ...current,
            [key]: { state: "error", message: "The wire dropped." },
          }));
        }
      });
      queue.current = run.catch(() => undefined);
      return run;
    },
    [batch, byKey]
  );

  const flush = useCallback(
    (key: string) => {
      const timer = timers.current[key];
      if (timer) {
        clearTimeout(timer);
        delete timers.current[key];
      }
      return send(key);
    },
    [send]
  );

  const edit = useCallback(
    (key: string, change: Partial<StandingVerdict>, settle: number) => {
      const target = byKey.get(key);
      if (!target) return;
      const updated = { ...(latest.current[key] ?? empty()), ...change };
      const next = { ...latest.current, [key]: updated };
      latest.current = next;
      setWorking(next);

      // Disk first, wire second. Whatever happens to the request, this much is
      // already safe on his machine.
      if (matchesServer(target, updated, server.current[key])) delete book.current[key];
      else book.current[key] = updated;
      writeDrafts(batch, book.current);

      const timer = timers.current[key];
      if (timer) clearTimeout(timer);
      timers.current[key] = setTimeout(() => {
        delete timers.current[key];
        void send(key);
      }, settle);
    },
    [batch, byKey, send]
  );

  // A tab closing mid-edit cancels any fetch in flight. A beacon is the one
  // request a browser promises to deliver after the page is gone, so anything
  // still sitting on a settle timer goes out that way.
  useEffect(() => {
    function bail() {
      for (const key of Object.keys(timers.current)) {
        clearTimeout(timers.current[key]);
        delete timers.current[key];
        const target = byKey.get(key);
        const draft = latest.current[key];
        if (!target || !draft || !target.drawn || !hasAnything(target, draft)) continue;
        const characters: Partial<Record<CastName, number>> = {};
        for (const who of target.cast) {
          const value = draft.characters[who.key];
          if (typeof value === "number") characters[who.key] = value;
        }
        try {
          navigator.sendBeacon?.(
            "/api/backroom/rate",
            new Blob(
              [
                JSON.stringify({
                  batch,
                  panel: target.file,
                  characters,
                  scene: draft.scene,
                  caption: draft.caption,
                  comment: draft.comment.trim(),
                }),
              ],
              { type: "application/json" }
            )
          );
        } catch {
          // No beacon, no harm: the draft is on disk and comes back on reload.
        }
      }
    }
    window.addEventListener("pagehide", bail);
    return () => window.removeEventListener("pagehide", bail);
  }, [batch, byKey]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of Object.values(pending)) clearTimeout(timer);
    };
  }, []);

  // ------------------------------------------------------------ moving

  const heading = useRef<HTMLHeadingElement | null>(null);
  const strip = useRef<HTMLOListElement | null>(null);
  const announce = useRef(false);

  const goTo = useCallback(
    (next: number) => {
      const bounded = Math.max(0, Math.min(panels.length - 1, next));
      if (bounded === at.current) return;
      // Leaving a cartoon is a decision: whatever is on it goes now rather
      // than waiting out a settle timer he can no longer see.
      void flush(panels[at.current].key);
      announce.current = true;
      setIndex(bounded);
    },
    [flush, panels]
  );

  const nextToScore = useMemo(() => {
    for (let step = 1; step <= panels.length; step += 1) {
      const candidate = panels[(index + step) % panels.length];
      if (candidate.drawn && !isComplete(candidate, working[candidate.key] ?? empty())) {
        return panels.indexOf(candidate);
      }
    }
    return -1;
  }, [index, panels, working]);

  useEffect(() => {
    if (!announce.current) return;
    announce.current = false;
    try {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "start" });
    } catch {
      // An old browser without scrollIntoView options: staying put is fine.
    }
  }, [index]);

  useEffect(() => {
    try {
      strip.current?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({
        block: "nearest",
        inline: "center",
      });
    } catch {
      // Same: the strip simply stays where it is.
    }
  }, [index]);

  // Left and right walk the batch — except inside a dial, where the arrows
  // already walk the row, and inside the comment box, where they move the
  // cursor. Stealing either would be worse than having no shortcut at all.
  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, .rv-dial-row")) return;
      event.preventDefault();
      goTo(at.current + (event.key === "ArrowRight" ? 1 : -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo]);

  // The next picture is fetched before he asks for it, so paging forward is
  // instant instead of a white rectangle. The image route sends them
  // immutable, so this costs one request each for the whole sitting.
  useEffect(() => {
    for (const ahead of [1, 2]) {
      const upcoming = panels[index + ahead];
      if (!upcoming?.drawn) continue;
      const img = new Image();
      img.src = upcoming.src;
    }
  }, [index, panels]);

  // ------------------------------------------------------------ the tallies

  const drawnCount = panels.filter((p) => p.drawn).length;
  const scoredCount = panels.filter((p) => p.drawn && isComplete(p, working[p.key] ?? empty())).length;
  const left = Math.max(0, drawnCount - scoredCount);
  const percent = drawnCount === 0 ? 0 : Math.round((scoredCount / drawnCount) * 100);

  const save = saves[panel.key];
  const onFile = committed[panel.key];
  const unsaved = hasAnything(panel, mine) && !matchesServer(panel, mine, onFile);
  const wasRestored = Boolean(restored[panel.key]) && unsaved;

  const status =
    save?.state === "saving"
      ? "Saving…"
      : save?.state === "error"
        ? `${save.message ?? "That didn’t take."} Nothing is lost — press the button to try again.`
        : unsaved
          ? "Not saved yet — held on this device."
          : save?.state === "saved"
            ? "Saved."
            : onFile
              ? "Scored. Change anything and it updates."
              : "";

  function scoreWord(target: DeskPanel): "waiting" | "done" | "part" | "todo" {
    if (!target.drawn) return "waiting";
    const value = working[target.key] ?? empty();
    if (isComplete(target, value)) return "done";
    return hasAnything(target, value) ? "part" : "todo";
  }

  const CHIP_WORDS: Record<"waiting" | "done" | "part" | "todo", string> = {
    waiting: "not drawn yet",
    done: "scored",
    part: "half scored",
    todo: "not scored",
  };

  return (
    <section className="rv-desk">
      <div className="rv-progress">
        <div className="rv-progress-line">
          <p className="rv-progress-count">
            <strong>
              {scoredCount} of {drawnCount} scored
            </strong>
            {left > 0 ? ` · ${left} to go` : drawnCount > 0 ? " · that’s all of them" : ""}
          </p>
          <button
            type="button"
            className="rv-jump"
            onClick={() => nextToScore !== -1 && goTo(nextToScore)}
            disabled={nextToScore === -1}
          >
            {nextToScore === -1 ? "Nothing left to score" : "Next one to score ›"}
          </button>
        </div>

        <div className="rv-bar" role="img" aria-label={`${scoredCount} of ${drawnCount} scored`}>
          <span style={{ width: `${percent}%` }} />
        </div>

        <ol className="rv-strip" ref={strip} aria-label="Every cartoon in this edition">
          {panels.map((target, i) => {
            const word = scoreWord(target);
            const dirty =
              target.drawn &&
              hasAnything(target, working[target.key] ?? empty()) &&
              !matchesServer(target, working[target.key] ?? empty(), committed[target.key]);
            return (
              <li key={target.n}>
                <button
                  type="button"
                  className={`rv-chip rv-chip-${word}${i === index ? " rv-chip-now" : ""}${dirty ? " rv-chip-unsaved" : ""}`}
                  aria-current={i === index ? "true" : undefined}
                  aria-label={`Cartoon ${target.n} — ${CHIP_WORDS[word]}`}
                  onClick={() => goTo(i)}
                >
                  {target.n}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <article className="rv-stage">
        <div className="rv-stage-art">
          <h2 className="rv-stage-no" tabIndex={-1} ref={heading}>
            Cartoon {panel.n} <span className="rv-stage-of">of {panels.length}</span>
            {onFile && <span className="rv-already">you scored this one</span>}
          </h2>
          <div className="rv-plate">
            {panel.drawn ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img key={panel.file} className="rv-art" src={panel.src} alt={panel.alt} decoding="async" />
            ) : (
              <p className="rv-waiting">This one hasn’t been drawn yet.</p>
            )}
          </div>
        </div>

        <div className="rv-stage-score">
          {/* The line sits beside the picture because he is scoring the line
              as well as the drawing, and judging it from memory is guessing. */}
          <p className="rv-caption">
            <span className="rv-speaker">{panel.speaker}:</span> &ldquo;{panel.caption}&rdquo;
          </p>
          {panel.turn && <p className="rv-turn">The joke turns on {panel.turn}.</p>}

          {panel.drawn ? (
            <>
              <p className="rv-scale">
                Tap a number. <strong>1</strong> is throw it out, <strong>10</strong> is perfect, and
                6 or better means it’s good enough to print.
              </p>

              {panel.cast.map((who) => (
                <Dial
                  key={who.key}
                  label={who.name}
                  hint="how well he’s drawn here"
                  value={mine.characters[who.key] ?? null}
                  onPick={(n) =>
                    edit(
                      panel.key,
                      { characters: { ...mine.characters, [who.key]: n } },
                      SETTLE_SCORE
                    )
                  }
                />
              ))}
              <Dial
                label="The picture"
                hint="the bar, the framing, everything but the words"
                value={mine.scene}
                onPick={(n) => edit(panel.key, { scene: n }, SETTLE_SCORE)}
              />
              <Dial
                label="The line"
                hint="the caption above — is it funny?"
                value={mine.caption}
                onPick={(n) => edit(panel.key, { caption: n }, SETTLE_SCORE)}
              />

              <div className="rv-comment">
                <label className="rv-dial-label" htmlFor="rv-comment-box">
                  Anything you want to say about this one
                  <span className="rv-dial-hint"> — optional, and the most useful thing here</span>
                </label>
                <textarea
                  id="rv-comment-box"
                  className="rv-comment-box"
                  value={mine.comment}
                  rows={3}
                  maxLength={4000}
                  placeholder="What’s right or wrong with it?"
                  onChange={(event) => edit(panel.key, { comment: event.target.value }, SETTLE_TYPING)}
                  onBlur={() => void flush(panel.key)}
                />
                {onFile?.comment && !mine.comment.trim() && (
                  <p className="rv-note">
                    Your earlier note is still on file. Emptying the box doesn’t delete it — write over
                    it instead.
                  </p>
                )}
              </div>

              {wasRestored && (
                <p className="rv-restored">
                  Picked up what you had typed before. It isn’t saved yet.
                </p>
              )}

              <div className="rv-savebar">
                <button
                  type="button"
                  className="rv-save"
                  onClick={() => {
                    void flush(panel.key);
                    if (index < panels.length - 1) goTo(index + 1);
                  }}
                  disabled={save?.state === "saving"}
                >
                  {index < panels.length - 1
                    ? onFile
                      ? "Update and go on ›"
                      : "Save and go on ›"
                    : onFile
                      ? "Update this one"
                      : "Save this one"}
                </button>
                <p
                  className={`rv-status${save?.state === "error" ? " rv-status-bad" : unsaved ? " rv-status-warn" : ""}`}
                  role="status"
                  aria-live="polite"
                >
                  {status}
                </p>
              </div>
            </>
          ) : (
            <p className="rv-pending">
              Scoring opens when the drawing lands. Reload the page in a minute.
            </p>
          )}

          <div className="rv-move">
            <button type="button" className="rv-move-btn" onClick={() => goTo(index - 1)} disabled={index === 0}>
              ‹ The one before
            </button>
            <button
              type="button"
              className="rv-move-btn"
              onClick={() => goTo(index + 1)}
              disabled={index === panels.length - 1}
            >
              The next one ›
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
