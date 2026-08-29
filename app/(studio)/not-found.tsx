import Link from "next/link";

// A day that was never drawn, a character who doesn't exist, an old link.
// Next's stock 404 is a bare line of type with no way back, and a dead end is
// the one thing a six-page site should never produce.

export default function StudioNotFound() {
  return (
    <main id="content" className="br-main">
      <div className="br-table-head">
        <h1 className="br-date">Nothing at that address</h1>
        <p className="br-howto">
          There&rsquo;s no page here — an old link, or a day the studio never drew. Everything that
          does exist is one tap away.
        </p>
      </div>
      <p className="br-more-days">
        <Link href="/">Today</Link> · <Link href="/collection">The Collection</Link> ·{" "}
        <Link href="/keepers">Keepers</Link> · <Link href="/models">The Cast</Link> ·{" "}
        <Link href="/review">Review</Link>
      </p>
    </main>
  );
}
