import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { DeskError, type DeskDecision } from "@/lib/studio-desk-core";
import { deskStoreNote, listDeskDecisions } from "@/lib/studio-desk-server";
import DeskClient from "./DeskClient";

export const metadata: Metadata = {
  title: "Sticker desk",
  description: "Arrange the room layer by layer and send the decision to the studio.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function DeskPage() {
  if (!await isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value)) redirect("/login");
  let decisions: DeskDecision[] = [];
  let error = "";
  try { decisions = await listDeskDecisions(); }
  catch (caught) {
    error = caught instanceof DeskError
      ? `${caught.message} If this is the first time the desk has been opened, the table has not been created yet: run docs/sql/room-desk.sql in Supabase.`
      : "The studio decisions could not be loaded.";
  }
  return <DeskClient
    initialDecisions={decisions}
    storeNote={deskStoreNote()}
    decisionsError={error}
    repo={process.env.GITHUB_REPO ?? "Definitely-Ai/Cartoon"}
  />;
}
