// Something to look at while the studio answers. Every page here reads live
// from the database or the repository, and the shelf of editions opens two
// dozen briefs to build one screen — without this the browser sat on the last
// page for several seconds with nothing to say it had heard the tap, which
// reads as a dead link and gets tapped again.

export default function StudioLoading() {
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
