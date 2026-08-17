import Image from "next/image";
import Link from "next/link";
import { getOptionDays } from "@/lib/options";
import { formatDateAP } from "@/lib/format";

// The Collection: every cartoon ever made, cataloged by month, browsed by
// day. Each day is one tappable row — date, topic, a strip of thumbnails,
// and how many he starred.

export const metadata = {
  title: "The Collection",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CollectionPage() {
  const days = getOptionDays();
  const total = days.reduce((sum, day) => sum + day.options.length, 0);

  // Group by calendar month, newest first (days are already newest-first).
  const months = new Map<string, typeof days>();
  for (const day of days) {
    const [year, month] = day.day.split("-").map(Number);
    const label = `${MONTHS[month - 1]} ${year}`;
    if (!months.has(label)) months.set(label, []);
    months.get(label)!.push(day);
  }

  return (
    <main id="content" className="br-main">
      <header className="br-table-head">
        <h1 className="br-date">The Collection</h1>
        <p className="br-status">
          {total} cartoon{total === 1 ? "" : "s"} across {days.length} day
          {days.length === 1 ? "" : "s"}. Tap a day to lay it out on the table.
        </p>
      </header>

      {days.length === 0 ? (
        <p className="br-status">Nothing filed yet.</p>
      ) : (
        Array.from(months.entries()).map(([label, monthDays]) => (
          <section key={label} className="br-month" aria-label={label}>
            <h2 className="br-month-head">{label}</h2>
            <ul className="br-ledger">
              {monthDays.map((day) => {
                const topics = Array.from(
                  new Set(day.options.map((o) => o.topic).filter(Boolean))
                ) as string[];
                return (
                  <li key={day.day} className="br-ledger-day">
                    <Link href={`/day/${day.day}`} className="br-ledger-link">
                      <span className="br-ledger-head">
                        <span className="br-ledger-date">{formatDateAP(day.day)}</span>
                        <span className="br-chip">
                          {topics.length > 0 ? `“${topics.join("” · “")}”` : `${day.options.length} cartoons`}
                          {` · rated ${day.ratedCount}/${day.options.length}`}
                          {day.keepers.length > 0 && ` · ★ ${day.keepers.length}`}
                        </span>
                      </span>
                      <span className="br-ledger-row">
                        {day.options.slice(0, 5).map((option) => (
                          <span
                            key={option.n}
                            className={`br-ledger-thumb${option.keeper ? " br-ledger-thumb-ran" : ""}`}
                          >
                            <Image
                              src={option.src}
                              alt={`Cartoon ${option.n} of ${day.day}`}
                              width={option.width}
                              height={option.height}
                              sizes="18vw"
                            />
                            {option.keeper && (
                              <span className="br-stamp br-stamp-small" aria-hidden="true">
                                ★
                              </span>
                            )}
                          </span>
                        ))}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
