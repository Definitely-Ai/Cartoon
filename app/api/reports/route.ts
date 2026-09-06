import { cookies } from "next/headers";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { getStudioReport } from "@/lib/studio-reports";
import { validReportDay } from "@/lib/studio-reports-core";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value)) return Response.json({ error: "Sign in to view the studio report." }, { status: 401 });
  const url = new URL(request.url);
  const day = url.searchParams.get("day");
  if (day && !validReportDay(day)) return Response.json({ error: "Choose a real date in YYYY-MM-DD format." }, { status: 400 });
  return Response.json(await getStudioReport(day || undefined, url.searchParams.get("refresh") === "1"), { headers: { "Cache-Control": "private, no-store" } });
}
