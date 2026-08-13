import Image from "next/image";
import Link from "next/link";
import { getOptionDays } from "@/lib/options";
import { formatDateAP } from "@/lib/format";

// The ledger: every day of proofs ever filed, newest first — the one that
// ran wears its stamp, days still open say so. Tap a day to reopen its
// light table.

export const metadata = {
  title: "The Ledger",
};

export default function BackroomLedger() {
  const days = getOptionDays();

  return (
    <main id="content" className="br-main">
      <header className="br-table-head">
        <h1 className="br-date">The Ledger</h1>
        <p className="br-status">
          Every proof, every day, and what ran. {days.length} day{days.length === 1 ? "" : "s"} on
          file.
        </p>
      </header>

      {days.length === 0 ? (
        <p className="br-status">Nothing filed yet.</p>
      ) : (
        <ul className="br-ledger">
          {days.map((day) => (
            <li key={day.day} className="br-ledger-day">
              <Link href={`/backroom/day/${day.day}`} className="br-ledger-link">
                <span className="br-ledger-head">
                  <span className="br-ledger-date">{formatDateAP(day.day)}</span>
                  {day.selected ? (
                    <span className="br-chip br-chip-ran">Ran № {day.selected.option}</span>
                  ) : (
                    <span className="br-chip br-chip-open">Awaiting decision</span>
                  )}
                </span>
                <span className="br-ledger-row">
                  {day.options.map((option) => (
                    <span
                      key={option.n}
                      className={`br-ledger-thumb${
                        day.selected?.option === option.n ? " br-ledger-thumb-ran" : ""
                      }`}
                    >
                      <Image
                        src={option.src}
                        alt={`Proof ${option.n} of ${day.day}`}
                        width={option.width}
                        height={option.height}
                        sizes="30vw"
                      />
                      {day.selected?.option === option.n && (
                        <span className="br-stamp br-stamp-small" aria-hidden="true">
                          Ran
                        </span>
                      )}
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
