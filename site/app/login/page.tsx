import type { Metadata } from "next";
import { Suspense } from "react";
import DoorNotes from "./DoorNotes";

// The locked door. Middleware lets this one page through; everything else
// bounces here. A standard username + password form on purpose: every
// phone and browser recognizes it, offers to save the login, and fills it
// in by itself on the next visit — that's the "automatic" part. The
// ?wrong= and ?setup= notes are read client-side inside Suspense so the
// page itself stays fully static.

export const metadata: Metadata = {
  title: "The Door",
};

export default function BackroomLogin() {
  return (
    <main id="content" className="br-doorway">
      {/* The door page carries its own small nameplate — the staff chrome
          (nav, logout) belongs to the other side of the door. */}
      <div className="br-door-head">
        {/* BRAND: replace when final */}
        <p className="br-title">The Swinging Door</p>
        <p className="br-sub">The studio · members only</p>
      </div>
      <div className="br-door" aria-hidden="true">
        <span className="br-door-panel" />
        <span className="br-door-panel" />
        <span className="br-peephole" />
      </div>

      <form action="/api/backroom/login" method="post" className="br-knock">
        <div className="br-field">
          <label htmlFor="br-user" className="br-field-label">
            Username
          </label>
          <input
            id="br-user"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            className="br-knock-input"
          />
        </div>
        <div className="br-field">
          <label htmlFor="br-word" className="br-field-label">
            Password
          </label>
          <input
            id="br-word"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="br-knock-input"
          />
        </div>
        <label className="br-remember">
          <input type="checkbox" name="remember" defaultChecked />
          <span>Keep me signed in on this device</span>
        </label>
        <button type="submit" className="br-knock-btn">
          Sign in
        </button>
        <Suspense fallback={null}>
          <DoorNotes />
        </Suspense>
      </form>
    </main>
  );
}
