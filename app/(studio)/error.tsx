"use client";

import Link from "next/link";

// The catch-all for a page that throws where nothing caught it — the database
// refusing a connection, the repository timing out. Next's own screen is a
// stack trace on a white page, which tells the founder nothing and offers him
// no way out. This says what happened in plain words, gives him the button
// that fixes it nine times in ten, and keeps a door open to the rest of the
// studio.

export default function StudioError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="content" className="br-main">
      <div className="br-table-head">
        <h1 className="br-date">That didn&rsquo;t open</h1>
        <p className="br-howto">
          Something in the studio didn&rsquo;t answer just then. Nothing is lost — try it again, and
          if it keeps happening, tell the operator.
        </p>
      </div>
      <p style={{ textAlign: "center" }}>
        <button type="button" className="br-star" onClick={() => reset()}>
          Try again
        </button>
      </p>
      <p className="br-more-days">
        <Link href="/">Today</Link> · <Link href="/collection">The Collection</Link> ·{" "}
        <Link href="/review">Review</Link>
      </p>
    </main>
  );
}
