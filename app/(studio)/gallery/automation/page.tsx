import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import GenerateStudio from "./GenerateStudio";
import "./generate.css";

export const metadata: Metadata = {
  title: "Automation Studio",
  description: "Plan local cartoon editions, explore the fixed-set production workflow, and prepare a dated or recurring edition brief for The Swinging Door.",
};
export const dynamic = "force-dynamic";

export default async function AutomationPage() {
  const canManage = await isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value);
  return <main id="content"><GenerateStudio canManage={canManage} /></main>;
}
