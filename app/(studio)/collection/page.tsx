import Image from "next/image";
import Link from "next/link";
import { getStudioSummaries } from "@/lib/db";
import { PublishError } from "@/lib/githubPublish";
import { formatDateAP } from "@/lib/format";

// The Collection: every cartoon ever made, cataloged by month, browsed by
// day — live from the studio database. Each day is one tappable row:
// date, how many requests it held, a strip of thumbnails, the tallies.

export const metadata = {
  title: "The Collection",
};

export const dynamic = "force-dynamic";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function CollectionPage() {
  let summaries: Awaited<ReturnType<typeof getStudioSummaries>> = [];
  let setupNote: string | null = null;
  try {
    summaries = await getStudioSummaries();
  } catch (err) {
    setupNote = err instanceof PublishError ? err.message : "The studio database isn't answering.";
  }
  const total = summaries.reduce((sum, d) => sum + d.cartoonCount, 0);

  const months = new Map<string, typeof summaries>();
  for (const day of summaries) {
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
          {total} cartoon{total === 1 ? "" : "s"} across {summaries.length} day
          {summaries.length === 1 ? "" : "s"}. Tap a day to lay it out on the table.
        </p>
      </header>

      {summaries.length === 0 ? (
        <p className="br-status">{setupNote ?? "Nothing filed yet."}</p>
      ) : (
        Array.from(months.entries()).map(([label, monthDays]) => (
          <section key={label} className="br-month" aria-label={label}>
            <h2 className="br-month-head">{label}</h2>
            <ul className="br-ledger">
              {monthDays.map((day) => (
                <li key={day.day} className="br-ledger-day">
                  <Link href={`/day/${day.day}`} className="br-ledger-link">
                    <span className="br-ledger-head">
                      <span className="br-ledger-date">{formatDateAP(day.day)}</span>
                      <span className="br-chip">
                        {day.batchCount} request{day.batchCount === 1 ? "" : "s"} ·{" "}
                        {day.cartoonCount} cartoon{day.cartoonCount === 1 ? "" : "s"}
                        {` · rated ${day.ratedCount}/${day.cartoonCount}`}
                        {day.ratedCount > 0 && ` · landed ${day.landedCount}`}
                        {day.keeperCount > 0 && ` · ★ ${day.keeperCount}`}
                      </span>
                    </span>
                    <span className="br-ledger-row">
                      {day.firstThumbs.map((c) => (
                        <span
                          key={c.id}
                          className={`br-ledger-thumb${c.keeper ? " br-ledger-thumb-ran" : ""}`}
                        >
                          <Image
                            src={c.src}
                            alt={`Cartoon ${c.n} of ${day.day}`}
                            width={c.width}
                            height={c.height}
                            sizes="18vw"
                          />
                          {c.keeper && (
                            <span className="br-stamp br-stamp-small" aria-hidden="true">
                              ★
                            </span>
                          )}
                        </span>
                      ))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
