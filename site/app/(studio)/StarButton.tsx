"use client";

import { useState } from "react";

// The keeper star. One tap stars a cartoon (optimistically — the commit
// lands within a minute and the rebuild makes it permanent), a second tap
// takes it back. Big target, obvious state, dry failure message.

export default function StarButton({ day, option, initial }: { day: string; option: number; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !on;
    setOn(next);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/backroom/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, option, on: next }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setOn(!next);
        setError(data.error ?? "The star didn't take — try again.");
      }
    } catch {
      setOn(!next);
      setError("The wire dropped — try again.");
    }
    setBusy(false);
  }

  return (
    <div className="br-star-row">
      <button
        type="button"
        className={`br-star${on ? " br-star-on" : ""}`}
        onClick={toggle}
        disabled={busy}
        aria-pressed={on}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="br-star-glyph">
          <path
            d="M12 2.6l2.8 6.1 6.6.6-5 4.4 1.5 6.5L12 16.8l-5.9 3.4 1.5-6.5-5-4.4 6.6-.6z"
            fill={on ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
        {on ? "A keeper" : "Keep this one"}
      </button>
      {error && (
        <p className="br-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
