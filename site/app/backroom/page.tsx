import Link from "next/link";
import { getDeskDay, getOptionDays } from "@/lib/options";
import LightTable from "./LightTable";

// The desk: the newest day still awaiting a decision (or the newest day,
// if everything has run). One glance, one choice, done — the ledger holds
// the rest of history.

export const metadata = {
  title: "The Light Table",
};

export default function BackroomDesk() {
  const desk = getDeskDay();
  const days = getOptionDays();
  const undecided = days.filter((d) => !d.selected).length;

  return (
    <main id="content" className="br-main">
      {desk ? (
        <>
          {undecided > 1 && (
            <p className="br-backlog" role="status">
              {undecided} days are waiting on a decision —{" "}
              <Link href="/backroom/ledger">see the ledger</Link>.
            </p>
          )}
          <LightTable day={desk} />
        </>
      ) : (
        <section className="br-table">
          <div className="br-table-head">
            <h1 className="br-date">Nothing on the table</h1>
            <p className="br-status">
              The morning run hasn&rsquo;t arrived. Proofs land in <code>/options/YYYY-MM-DD/</code>{" "}
              as <code>option-1.png</code>, <code>option-2.png</code>&hellip; — the moment they&rsquo;re
              pushed, they&rsquo;ll be waiting here.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
