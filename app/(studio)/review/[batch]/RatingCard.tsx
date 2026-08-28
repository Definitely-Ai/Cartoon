"use client";

// The verdict on one cartoon. A 1-10 dial for every character who is
// actually in the panel, one for the scene, one for the caption, and Rick's
// own words. Same instrument as the day board's FeedbackPanel — tap a
// number and it is committed; the dial moves first and rolls back if the
// wire drops — dressed in the paper card the Studio Bible's FeedbackCard
// uses, because this page is paper laid on the dark room.
//
// The .rv-* classes live in one <style> block on the page that renders this,
// so ten cards ship one copy of the stylesheet instead of ten.

import { useId, useRef, useState, type KeyboardEvent } from "react";

export type CastName = "drew" | "mango" | "abby";

/** The parts of a committed feedback/ratings/<batch>/<panel>.json this
 *  screen puts back on the dials. */
export type StandingVerdict = {
  characters: Partial<Record<CastName, number>>;
  scene: number | null;
  caption: number | null;
  comment: string;
};

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/**
 * One 1-10 dial. Ten buttons is ten tab stops, and this page carries up to
 * fifty of them, so the row is a single stop: Tab lands on the standing
 * score and the arrow keys walk the row without committing anything. Only a
 * real click or Enter/Space picks a number, which is what keeps a scrub
 * across the row from becoming ten commits.
 */
function Dial(props: {
  label: string;
  value: number | null;
  onPick: (n: number) => void;
}) {
  const labelId = useId();
  const [focused, setFocused] = useState<number | null>(null);
  const row = useRef<HTMLDivElement | null>(null);
  const tabStop = focused ?? props.value ?? 1;

  function walk(event: KeyboardEvent<HTMLDivElement>) {
    const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next: number | null = null;
    if (event.key in step) next = Math.min(10, Math.max(1, tabStop + step[event.key]));
    if (event.key === "Home") next = 1;
    if (event.key === "End") next = 10;
    if (next === null) return;
    event.preventDefault();
    row.current?.querySelector<HTMLButtonElement>(`button[data-score="${next}"]`)?.focus();
  }

  return (
    <div className="rv-dial">
      <span className="rv-dial-label" id={labelId}>
        {props.label}
      </span>
      <div
        className="rv-dial-row"
        ref={row}
        role="group"
        aria-labelledby={labelId}
        onKeyDown={walk}
      >
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
      <span className="rv-dial-value" aria-hidden="true">
        {props.value === null ? "—" : `${props.value}/10`}
      </span>
    </div>
  );
}

export default function RatingCard(props: {
  batch: string;
  /** The panel's filename, e.g. "03-the-back-nine.png" — the rate route's key. */
  panel: string;
  /** Only the characters this panel actually contains, under their proper
   *  names. The page names them: a server component cannot read a constant
   *  out of a "use client" module — every export of one is a client
   *  reference by the time the server sees it. */
  characters: { key: CastName; name: string }[];
  verdict: StandingVerdict | null;
}) {
  const [characters, setCharacters] = useState<Partial<Record<CastName, number>>>(
    props.verdict?.characters ?? {}
  );
  const [scene, setScene] = useState<number | null>(props.verdict?.scene ?? null);
  const [caption, setCaption] = useState<number | null>(props.verdict?.caption ?? null);
  const [comment, setComment] = useState(props.verdict?.comment ?? "");
  const [saved, setSaved] = useState(props.verdict?.comment ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const flash = useRef<ReturnType<typeof setTimeout> | null>(null);
  // One verdict file, one writer. The rate route reads the standing file and
  // commits the merge, so two overlapping taps on the same panel could drop
  // one of them; queueing the card's own writes end to end removes the race.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  // Clicking Save blurs the textarea first, so both handlers fire on one
  // press. This is what the second one sees and stands down for.
  const submitted = useRef((props.verdict?.comment ?? "").trim());
  const commentId = useId();

  async function post(body: Record<string, unknown>): Promise<boolean> {
    const run = queue.current.then(async () => {
      setState("saving");
      setError(null);
      try {
        const res = await fetch("/api/backroom/rate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batch: props.batch, panel: props.panel, ...body }),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          setError(data.error ?? "That didn't take — try again.");
          setState("error");
          return false;
        }
        setState("saved");
        if (flash.current) clearTimeout(flash.current);
        flash.current = setTimeout(
          () => setState((current) => (current === "saved" ? "idle" : current)),
          2500
        );
        return true;
      } catch {
        setError("The wire dropped — try again.");
        setState("error");
        return false;
      }
    });
    queue.current = run.catch(() => undefined);
    return run;
  }

  async function pickCharacter(who: CastName, value: number) {
    const previous = characters[who];
    setCharacters((current) => ({ ...current, [who]: value }));
    if (!(await post({ characters: { [who]: value } }))) {
      setCharacters((current) => {
        const back = { ...current };
        if (previous === undefined) delete back[who];
        else back[who] = previous;
        return back;
      });
    }
  }

  async function pickScene(value: number) {
    const previous = scene;
    setScene(value);
    if (!(await post({ scene: value }))) setScene(previous);
  }

  async function pickCaption(value: number) {
    const previous = caption;
    setCaption(value);
    if (!(await post({ caption: value }))) setCaption(previous);
  }

  const commentDirty = comment.trim().length > 0 && comment.trim() !== saved.trim();

  async function saveComment() {
    // The rate route treats an empty comment as "leave the standing one
    // alone", so a blank is never worth a round trip.
    const text = comment.trim();
    if (!text || text === submitted.current) return;
    const previous = submitted.current;
    submitted.current = text;
    if (await post({ comment: text })) setSaved(text);
    else submitted.current = previous; // it never landed — let him try again
  }

  const status =
    state === "saving"
      ? "Saving…"
      : state === "error"
        ? (error ?? "That didn't take — try again.")
        : state === "saved"
          ? "Saved ✓"
          : "";

  return (
    <div className="rv-ratings">
      {props.characters.map((who) => (
        <Dial
          key={who.key}
          label={who.name}
          value={characters[who.key] ?? null}
          onPick={(n) => pickCharacter(who.key, n)}
        />
      ))}
      <Dial label="The scene" value={scene} onPick={pickScene} />
      <Dial label="The caption" value={caption} onPick={pickCaption} />

      <div className="rv-comment">
        <label className="rv-dial-label" htmlFor={commentId}>
          What you make of it
        </label>
        <textarea
          id={commentId}
          className="rv-comment-box"
          value={comment}
          rows={2}
          maxLength={4000}
          placeholder="What’s right or wrong with this one?"
          onChange={(event) => setComment(event.target.value)}
          onBlur={saveComment}
        />
        <div className="rv-comment-actions">
          <button
            type="button"
            className="rv-save"
            onClick={saveComment}
            disabled={!commentDirty || state === "saving"}
          >
            Save note
          </button>
          {/* Fixed height: the row must not grow when the word arrives, or
              ten cards would shuffle under his cursor. */}
          <p className={`rv-status${state === "error" ? " rv-status-bad" : ""}`} role="status" aria-live="polite">
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}
