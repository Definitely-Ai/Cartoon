import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudioDay, getStudioDays } from "@/lib/db";
import { formatDateAP } from "@/lib/format";
import DayBoard from "../../DayBoard";

// One day of the collection, permanent address, live from the studio
// database. Prev/next day links keep browsing linear — flipping through
// days like pages.

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  return { title: day };
}

export default async function StudioDayPage({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) notFound();
  const table = await getStudioDay(day).catch(() => null);
  if (!table) notFound();

  const days = await getStudioDays();
  const index = days.indexOf(day);
  const newer = index > 0 ? days[index - 1] : undefined;
  const older = index >= 0 && index < days.length - 1 ? days[index + 1] : undefined;

  return (
    <main id="content" className="br-main">
      <DayBoard day={table} />
      <p className="br-more-days">
        {older && <Link href={`/day/${older}`}>‹ {formatDateAP(older)}</Link>}
        {older && " · "}
        <Link href="/collection">The Collection</Link>
        {newer && " · "}
        {newer && <Link href={`/day/${newer}`}>{formatDateAP(newer)} ›</Link>}
      </p>
    </main>
  );
}
