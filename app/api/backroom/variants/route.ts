import { NextResponse, type NextRequest } from "next/server";
import { BACKROOM_COOKIE, isDoorOpen, isTriggerOpen } from "@/lib/backroom-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authed =
    (await isDoorOpen(request.cookies.get(BACKROOM_COOKIE)?.value)) ||
    (await isTriggerOpen(request.nextUrl.searchParams.get("t")));
  if (!authed) {
    return NextResponse.json({ error: "The door is closed. Knock first." }, { status: 401 });
  }

  return NextResponse.json(
    { error: "Disabled: Variants generation is now handled locally. Replicate integration has been removed." },
    { status: 501 }
  );
}
