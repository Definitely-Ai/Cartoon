import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BACKROOM_COOKIE, isDoorOpen } from "@/lib/backroom-auth";
import GenerateStudio from "./GenerateStudio";
import "./generate.css";

export const metadata: Metadata = {
  title: "Generate cartoons",
  description: "Choose a city, state, and quantity. Follow real production progress and see your finished cartoons in The Swinging Door studio.",
};
export const dynamic = "force-dynamic";

export default async function AutomationPage() {
  const canManage = await isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value);
  return <main id="content"><GenerateStudio canManage={canManage} /></main>;
}
