import Link from "next/link";
import { getStudioReport } from "@/lib/studio-reports";
import { imageChanges, readableSubject, summarizeReport, type ReportCommit } from "@/lib/studio-reports-core";
import { findLibraryImageByPath } from "@/lib/studio-library";
import ReportPreview from "./ReportPreview";
import "./reports.css";

export const metadata = { title: "Daily report" };
export const dynamic = "force-dynamic";

function dateLabel(day: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(`${day}T12:00:00Z`));
}
function timeLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(value));
}
function imageTitle(path: string) {
  return path.split("/").pop()?.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") || "Studio drawing";
}
function GithubEvidence({ commit, repo }: { commit: ReportCommit; repo: string }) {
  return <details className="report-evidence-item">
    <summary><span>{readableSubject(commit.subject)}</span><time dateTime={commit.committedAt}>{timeLabel(commit.committedAt)}</time></summary>
    <div className="report-evidence-body">
      <p><a href={`https://github.com/${repo}/commit/${commit.sha}`} target="_blank" rel="noreferrer">Open the original saved update on GitHub ↗</a></p>
      <p className="report-muted">Original note: {commit.subject}</p>
      {commit.merge ? <p>This update combined work from another branch. Individual drawing and website changes are counted with their own saved updates.</p> :
        <p>{commit.files.length} file{commit.files.length === 1 ? "" : "s"} listed{!commit.filesComplete ? "; GitHub has further details" : ""}.</p>}
      {commit.files.length > 0 && <ul className="report-file-list">{commit.files.map((file) => <li key={`${file.status}:${file.path}`}><span>{file.status}</span><code>{file.path}</code></li>)}</ul>}
    </div>
  </details>;
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ day?: string; refresh?: string }> }) {
  const params = await searchParams;
  const report = await getStudioReport(params.day, Boolean(params.refresh));
  const groups = summarizeReport(report.commits);
  const pictures = imageChanges(report.commits);
  const changes = report.commits.filter((commit) => !commit.merge);
  const files = new Set(changes.flatMap((commit) => commit.files.map((file) => file.path)));
  const localPictures = report.local.files.filter((file) => file.status !== "removed").map((file) => ({ file, image: findLibraryImageByPath(file.path) })).filter((item) => item.image).slice(0, 6);
  const dailyIndex = report.days.indexOf(report.day);
  const previous = report.days[dailyIndex + 1];
  const next = report.days[dailyIndex - 1];
  const noLiveUpdates = report.source === "live" && report.complete && report.commits.length === 0;
  const localGroups = summarizeReport([{ sha: report.local.head, committedAt: report.local.capturedAt, day: report.day, subject: "Working files", merge: false, files: report.local.files, filesComplete: true }]);

  return <main id="content" className="br-main report-page">
    <header className="report-heading">
      <p className="report-eyebrow">The daily studio report</p>
      <h1>Here’s what moved forward.</h1>
      <p>Rick, this is the work saved to your project, explained by area with the drawings alongside it. Choose any day to catch up.</p>
    </header>

    <div className="report-date-bar">
      <form action="/reports" method="get" className="report-date-form">
        <label htmlFor="report-day">Report date <span>Eastern time</span></label>
        <div><input id="report-day" name="day" type="date" defaultValue={report.day} max={report.today} required /><button type="submit">Open report</button></div>
      </form>
      <div className="report-date-nav">
        {previous && <Link href={`/reports?day=${previous}`}>← Earlier work</Link>}
        {report.day !== report.today && <Link href="/reports">Today</Link>}
        {next && <Link href={`/reports?day=${next}`}>Later work →</Link>}
      </div>
    </div>

    <section className="report-day" aria-labelledby="report-date-title">
      <div className="report-section-top">
        <div><p className="report-eyebrow">Saved to GitHub</p><h2 id="report-date-title">{dateLabel(report.day)}</h2></div>
        <Link className="report-refresh" href={`/reports?day=${report.day}&refresh=${Date.now()}`} prefetch={false}>Check for new work ↻</Link>
      </div>
      <div className="report-source-line">
        <span className={`report-status report-status-${report.source}`}>{report.source === "live" ? "Checked against GitHub" : "Saved report"}</span>
        <span>{report.checkedAt ? `Last GitHub check: ${timeLabel(report.checkedAt)}` : "No successful GitHub check recorded for this snapshot."}</span>
      </div>
      {report.notes.length > 0 && <div className="report-notice" role="status">{report.notes.map((note) => <p key={note}>{note}</p>)}</div>}

      {report.commits.length > 0 ? <>
        <div className="report-metrics" aria-label="The day's saved work">
          <div><strong>{changes.length}</strong><span>saved work updates</span></div>
          <div><strong>{files.size}</strong><span>different files touched</span></div>
          <div><strong>{pictures.length}</strong><span>pictures added or revised</span></div>
        </div>
        <p className="report-method">This summary follows the changed files and the team’s saved notes. A saved change records work; it does not by itself mean a drawing was approved or the website was published.</p>
        <div className="report-group-grid">{groups.map((group) => <article key={group.id} className="report-group">
          <p className="report-eyebrow">{group.fileCount} file{group.fileCount === 1 ? "" : "s"} touched</p>
          <h3>{group.title}</h3><p>{group.description}</p>
          <ul>{group.changes.slice(0, 4).map((change) => <li key={change}>{change}</li>)}</ul>
          {group.changes.length > 4 && <details><summary>{group.changes.length - 4} more notes from this work</summary><ul>{group.changes.slice(4).map((change) => <li key={change}>{change}</li>)}</ul></details>}
        </article>)}</div>

        {pictures.length > 0 && <section className="report-art" aria-labelledby="report-art-title">
          <div className="report-section-top"><div><p className="report-eyebrow">See the work</p><h3 id="report-art-title">Pictures saved that day</h3></div><Link href="/library">Open the full image library →</Link></div>
          <p className="report-muted">These previews show the image version saved in that GitHub update. They may be drafts, studies, or parts of a drawing.</p>
          <div className="report-image-grid">{pictures.slice(0, 8).map((file) => <figure key={file.path}>
            <a href={`https://github.com/${report.repo}/blob/${file.sha}/${file.path.split("/").map(encodeURIComponent).join("/")}`} target="_blank" rel="noreferrer">
              <ReportPreview src={`/api/reports/image?commit=${file.sha}&path=${encodeURIComponent(file.path)}`} alt={imageTitle(file.path)} />
            </a><figcaption><strong>{imageTitle(file.path)}</strong><span>{file.status === "added" ? "Added" : "Revised"} · Open the saved original ↗</span></figcaption>
          </figure>)}</div>
          {pictures.length > 8 && <p className="report-muted">Showing 8 of {pictures.length} pictures. Every image path and saved update is listed in the source notes below.</p>}
        </section>}

        <section className="report-evidence" aria-labelledby="report-evidence-title"><h3 id="report-evidence-title">The source notes</h3><p className="report-muted">Open any update to see exactly which files changed, or follow its GitHub link.</p>{report.commits.map((commit) => <GithubEvidence key={commit.sha} commit={commit} repo={report.repo} />)}</section>
      </> : <div className="report-empty"><h3>{noLiveUpdates ? "No work has been saved to GitHub for this day." : "This saved report has no updates for this day."}</h3><p>{noLiveUpdates ? "There may still be drawings, conversations, or work in progress on the studio computer. The worktable below lists a separate snapshot of unfinished files." : `The archive was captured ${timeLabel(report.snapshotAt)}. A live GitHub check is needed before treating an empty day as complete.`}</p>{previous && <Link href={`/reports?day=${previous}`}>Read the previous day with recorded work →</Link>}</div>}
    </section>

    <section className="report-local" aria-labelledby="report-local-title">
      <p className="report-eyebrow">Separate from the GitHub record</p><h2 id="report-local-title">On the studio worktable</h2>
      <p>This is a snapshot of files still being worked on when the website was built, taken {timeLabel(report.local.capturedAt)}. These files are not counted as work completed on the selected day.</p>
      <div className="report-local-count"><strong>{report.local.files.length}</strong><span>working files had changes not yet recorded in GitHub</span></div>
      <p className="report-muted">{report.local.ahead !== null && report.local.behind !== null ? `At that check, the studio computer was ${report.local.ahead} saved updates ahead and ${report.local.behind} behind the GitHub branch.` : "The computer’s exact relation to GitHub was not available."} This page cannot see further computer edits until the report snapshot is rebuilt.</p>
      {localGroups.length > 0 && <div className="report-local-areas">{localGroups.map((group) => <div key={group.id}><strong>{group.title}</strong><span>{group.fileCount} working files · {group.description}</span></div>)}</div>}
      {localPictures.length > 0 && <div className="report-image-grid report-local-images">{localPictures.map(({ file, image }) => image && <figure key={file.path}><Link href={`/library?image=${image.id}`}>
        <ReportPreview src={image.thumbnailUrl} alt={image.title} />
      </Link><figcaption><strong>{image.title}</strong><span>Work in progress · View in library</span></figcaption></figure>)}</div>}
      {report.local.files.length > 0 && <details className="report-local-files"><summary>See the worktable file list</summary><ul className="report-file-list">{report.local.files.map((file) => <li key={file.path}><span>{file.status}</span><code>{file.path}</code></li>)}</ul></details>}
    </section>

    <aside className="report-coverage"><h3>What this report covers</h3><p>The <a href={`https://github.com/${report.repo}/commits/${report.branch}/`} target="_blank" rel="noreferrer">{report.repo} / {report.branch} history ↗</a>, grouped by when each update was saved, using Eastern time. The archive contains {report.coverage.commitCount.toLocaleString()} updates{report.coverage.earliestDay ? ` from ${dateLabel(report.coverage.earliestDay)}` : ""}. {report.coverage.complete ? "The build captured all history available on that branch." : "The build had limited history; some older work may be missing."}</p><p>Open branches, conversations, generated images that were never saved, reviews, approvals, and deployment results are not automatically included. The report never infers that those activities did or did not happen.</p><p>Archive captured {timeLabel(report.snapshotAt)} · <a href={`https://github.com/${report.repo}/commit/${report.snapshotSha}`} target="_blank" rel="noreferrer">View the recorded GitHub point ↗</a></p></aside>
  </main>;
}
