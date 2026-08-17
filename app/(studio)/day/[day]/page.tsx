import Link from "next/link";
import { notFound } from "next/navigation";
import { getOptionDay, getOptionDays } from "@/lib/options";
import { formatDateAP } from "@/lib/format";
import DayBoard from "../../DayBoard";

// One day of the collection, permanent address. Prev/next day links keep
// browsing linear — flipping through days like pages.

export function generateStaticParams() {
  return getOptionDays().map(({ day }) => ({ day }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  return { title: day };
}

export default async function StudioDayPage({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  const optionDay = getOptionDay(day);
  if (!optionDay) notFound();

  const days = getOptionDays();
  const index = days.findIndex((d) => d.day === day);
  const newer = index > 0 ? days[index - 1] : undefined;
  const older = index < days.length - 1 ? days[index + 1] : undefined;

  return (
    <main id="content" className="br-main">
      <DayBoard day={optionDay} />
      <p className="br-more-days">
        {older && <Link href={`/day/${older.day}`}>‹ {formatDateAP(older.day)}</Link>}
        {older && " · "}
        <Link href="/collection">The Collection</Link>
        {newer && " · "}
        {newer && <Link href={`/day/${newer.day}`}>{formatDateAP(newer.day)} ›</Link>}
      </p>
    </main>
  );
}
