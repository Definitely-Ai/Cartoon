import { notFound } from "next/navigation";
import { getOptionDay, getOptionDays } from "@/lib/options";
import LightTable from "../../../LightTable";

// One day's light table, permanent address — the ledger links here so any
// past day can still be reviewed (or, if it never ran, decided late).

export function generateStaticParams() {
  return getOptionDays().map(({ day }) => ({ day }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  return { title: `Proofs of ${day}` };
}

export default async function BackroomDayPage({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  const optionDay = getOptionDay(day);
  if (!optionDay) notFound();

  return (
    <main id="content" className="br-main">
      <LightTable day={optionDay} />
    </main>
  );
}
