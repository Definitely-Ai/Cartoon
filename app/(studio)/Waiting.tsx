// The screen a page shows while the studio is being asked for it.
//
// Every page that reads the database or the repository has a real wait in it
// — the shelf of editions opens two dozen briefs to draw one screen — and
// with nothing on the glass the browser sits on the previous page, which
// reads as a dead link and gets tapped again. The pages that are already on
// disk (the cast, the bibles) deliberately do NOT use this: wrapping an
// instant page in a wait only puts a flicker in front of it.

export default function Waiting() {
  return (
    <main className="br-main">
      <div className="br-table-head">
        <p className="br-status" role="status">
          Fetching from the studio&hellip;
        </p>
      </div>
    </main>
  );
}
