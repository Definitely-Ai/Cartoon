import type { Metadata } from "next";
import { headers } from "next/headers";
import { readStudioRoom } from "@/lib/studio-room";
import { isLoopbackHost, localPartApprovalsEnabled } from "@/lib/studio-part-approval";
import RoomClient from "./RoomClient";

export const metadata: Metadata = {
  title: "Drawing Room",
  description: "Review the room structure, compare part sources and examine the studio’s retained candidates.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function RoomPage() {
  const localApprovalEnabled = localPartApprovalsEnabled() && isLoopbackHost((await headers()).get("host"));
  return <RoomClient room={await readStudioRoom(localApprovalEnabled)} localApprovalEnabled={localApprovalEnabled} />;
}
