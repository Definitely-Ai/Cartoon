import Link from "next/link";
import { getStudioDays, getStudioToday, type StudioDay } from "@/lib/db";
import { PublishError } from "@/lib/githubPublish";
import { formatDateAP } from "@/lib/format";
import DayBoard from "./DayBoard";

// Today: the newest day's batches, straight onto the table, live from the
// studio database — a new batch appears the moment it's drawn.

export const metadata = {
  title: "Today",
};

export const dynamic = "force-dynamic";

export default async function StudioToday() {
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
            <h1 className="br-date">Nothing on the table</h1>
            <p className="br-status">
              {setupNote ??
                "Ask your AI for cartoons — “make one where they’re on a boat” — and they land here the moment they’re drawn."}{" "}
              (Hookup lives under <Link href="/connect">Connect your AI</Link>.)
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
