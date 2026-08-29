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
  title: "Today",
};

export const dynamic = "force-dynamic";

// The front door is the one page in this segment that waits on the database,
// so the wait screen is wrapped around it here rather than dropped in a
// loading.tsx — a loading file at this level would also come between him and
// the cast pages, which are already on disk and need no waiting for.
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
        <section className="br-table">
          <div className="br-table-head">
            <h1 className="br-date">{setupNote ? "The table isn’t answering" : "Nothing on the table"}</h1>
            {/* Two readers, two sentences: he needs to know whether anything
                is wrong and what to do, and the operator needs the actual
                complaint — which is no use to him at all in the same breath. */}
            {setupNote ? (
              <>
                <p className="br-status">
                  The studio&rsquo;s records aren&rsquo;t answering just now. Nothing is lost — try
                  again in a minute.
                </p>
                <p className="br-hint">{setupNote}</p>
              </>
            ) : (
              <p className="br-status">
                Ask your AI for cartoons — &ldquo;make one where they&rsquo;re on a boat&rdquo; — and
                they land here the moment they&rsquo;re drawn. (Hookup lives under{" "}
                <Link href="/connect">Connect your AI</Link>.)
              </p>
            )}
            {/* An empty table is not proof there is no work: a set drawn from
                a written brief sits under Review, not here, and he has been
                sent to score one before now. */}
            <p className="br-howto">
              If you were told new cartoons are ready, they&rsquo;re waiting on{" "}
              <Link href="/review">Review</Link>. Everything ever drawn is in{" "}
              <Link href="/collection">The Collection</Link>.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
