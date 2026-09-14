import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import { bestOfCartoons } from "@/lib/best-of-cartoons";
import AutomationStudio from "./AutomationStudio";
import "./automation.css";

export const metadata: Metadata = {
  title: "Automation Studio",
  description: "Plan local cartoon editions, explore the fixed-set production workflow, and prepare a dated or recurring edition brief for The Swinging Door.",
};
export const dynamic = "force-dynamic";

export default async function AutomationPage() {
  const canManage = await isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value);
  const examples = ["professional-opposition", "rare-opportunity-street", "divide-the-credit"].map((id) => {
    const item = bestOfCartoons.find((entry) => entry.id === id)!;
    return { id: item.id, speaker: item.speaker, caption: item.caption, tv: item.tv,
      board: item.board, src: item.src, previewSrc: item.previewSrc };
  });
  return <AutomationStudio canManage={canManage} initialNow={new Date().toISOString()} examples={examples} />;
}
