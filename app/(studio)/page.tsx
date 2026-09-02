import { Suspense } from "react";
import Link from "next/link";
import { getStudioDays, getStudioToday, type StudioDay } from "@/lib/db";
import { PublishError } from "@/lib/githubPublish";
import { formatDateAP } from "@/lib/format";
import DayBoard from "./DayBoard";
import Waiting from "./Waiting";

// Today: the newest day's batches, straight onto the table, live from the
// studio database — a new batch appears the moment it's drawn.

export const metadata = {
  title: "Today | The Swinging Door Studio",
};

export const dynamic = "force-dynamic";

export default function StudioToday() {
  return (
    <Suspense fallback={<Waiting />}>
      <TodayTable />
    </Suspense>
  );
}

async function TodayTable() {
  let today: StudioDay | null = null;
  let days: string[] = [];
  let setupNote: string | null = null;
  try {
    days = await getStudioDays();
    today = days.length ? await getStudioToday() : null;
  } catch (err) {
    setupNote = err instanceof PublishError ? err.message : "The studio database isn't answering.";
  }

  const previous = today ? days.filter((d) => d !== today.day)[0] : undefined;

  return (
    <main id="content" className="br-main">
      {today ? (
        <>
          <DayBoard day={today} />
          {previous && (
            <p className="br-more-days">
              <Link href={`/day/${previous}`}>‹ {formatDateAP(previous)}</Link> ·{" "}
              <Link href="/collection">the whole collection</Link>
            </p>
          )}
        </>
      ) : (
        <div className="studio-dispatch-wrap">
          <div className="studio-dispatch-head">
            <p className="studio-dispatch-eyebrow">The Studio Dispatch</p>
            <h1 className="studio-dispatch-title">The Swinging Door</h1>
            <p className="studio-dispatch-sub">
              {setupNote
                ? "The live daily table is quiet right now, but the complete studio archive, proof desk, and character model sheets are ready below."
                : "Welcome to the private studio workshop. Browse the complete image archive, inspect the verified final editions, or score pending briefs."}
            </p>
          </div>

          <div className="studio-dispatch-grid">
            <Link href="/gallery" className="studio-dispatch-card">
              <span className="studio-dispatch-card-badge">Studio Prints & Archive</span>
              <h2 className="studio-dispatch-card-title">The Image Vault</h2>
              <p className="studio-dispatch-card-desc">
                Browse verified finished prints, master reference plates, and studio workshop cartoons — sorted chronologically by time generated.
              </p>
              <span className="studio-dispatch-card-action">Open Vault →</span>
            </Link>

            <Link href="/gallery?category=final" className="studio-dispatch-card">
              <span className="studio-dispatch-card-badge">Production Master</span>
              <h2 className="studio-dispatch-card-title">Final 20 Editions</h2>
              <p className="studio-dispatch-card-desc">
                The canonical Wall Street satire suites: 10 Trio scenes (A01–A10) and 10 Duo scenes (B01–B10) with complete chyrons and chalkboard menus.
              </p>
              <span className="studio-dispatch-card-action">View Finals →</span>
            </Link>

            <Link href="/review" className="studio-dispatch-card">
              <span className="studio-dispatch-card-badge">Scoring Desk</span>
              <h2 className="studio-dispatch-card-title">The Review Desk</h2>
              <p className="studio-dispatch-card-desc">
                Review pending batches, rate scene composition and captions against the studio standard, and inspect performance metrics.
              </p>
              <span className="studio-dispatch-card-action">Go to Review →</span>
            </Link>

            <Link href="/models" className="studio-dispatch-card">
              <span className="studio-dispatch-card-badge">Harrington Vision</span>
              <h2 className="studio-dispatch-card-title">The Cast & Bibles</h2>
              <p className="studio-dispatch-card-desc">
                Definitive reference studies and quality standards for Drew (flamingo), Barclay (golden retriever), and Abby (proprietor).
              </p>
              <span className="studio-dispatch-card-action">Inspect Cast →</span>
            </Link>
          </div>

          <div className="studio-dispatch-footer-note">
            <p>
              To generate new daily cartoons with your assistant, connect via{" "}
              <Link href="/connect" style={{ color: "#c5a059", textDecoration: "underline" }}>
                Connect your AI
              </Link>
              . All historical editions are cataloged under{" "}
              <Link href="/collection" style={{ color: "#c5a059", textDecoration: "underline" }}>
                The Collection
              </Link>
              .
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
