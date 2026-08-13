import type { Metadata } from "next";
import { Suspense } from "react";
import DoorNotes from "./DoorNotes";

// The locked door. Middleware lets this one page through; everything else
// in the back room bounces here. The ?wrong= and ?setup= notes are read
// client-side inside Suspense so the page itself stays fully static.

export const metadata: Metadata = {
  title: "The Door",
};

export default function BackroomLogin() {
  return (
    <main id="content" className="br-doorway">
      {/* The door page carries its own small nameplate — the staff chrome
          (nav, logout) belongs to the other side of the door. */}
      <div className="br-door-head">
        <p className="br-title">The Back Room</p>
        <p className="br-sub">Employees only</p>
      </div>
      <div className="br-door" aria-hidden="true">
        <span className="br-door-panel" />
        <span className="br-door-panel" />
        <span className="br-peephole" />
      </div>

      <form action="/api/backroom/login" method="post" className="br-knock">
        <label htmlFor="br-word" className="br-knock-label">
          What&rsquo;s the word?
        </label>
        <input
          id="br-word"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="br-knock-input"
        />
        <button type="submit" className="br-knock-btn">
          Knock
        </button>
        <Suspense fallback={null}>
          <DoorNotes />
        </Suspense>
      </form>
    </main>
  );
}
