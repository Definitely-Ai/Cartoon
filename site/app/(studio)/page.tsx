import Link from "next/link";
import { getOptionDays } from "@/lib/options";
import DayBoard from "./DayBoard";

// Today: the newest batch, straight onto the table. If the day's run
// hasn't arrived, the empty state says exactly what to do about it.

export const metadata = {
  title: "Today",
};

export default function StudioToday() {
  const days = getOptionDays();
  const today = days[0];

  return (
    <main id="content" className="br-main">
      {today ? (
        <>
          <DayBoard day={today} />
          {days.length > 1 && (
            <p className="br-more-days">
              <Link href={`/day/${days[1].day}`}>‹ {days[1].day}</Link> ·{" "}
              <Link href="/collection">the whole collection</Link>
            </p>
          )}
        </>
      ) : (
        <section className="br-table">
          <div className="br-table-head">
            <h1 className="br-date">Nothing on the table</h1>
            <p className="br-status">
              Ask your AI for cartoons — &ldquo;I want them fishing today&rdquo; — and the batch
              lands here on its own. (Hookup lives under{" "}
              <Link href="/connect">Connect your AI</Link>.)
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
