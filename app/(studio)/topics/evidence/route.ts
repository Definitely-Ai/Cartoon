import { RESEARCH_SOURCES, TOPIC_LEADS, TOPIC_RESEARCH } from "@/lib/studio-topics";

export function GET() {
  return Response.json({ research: TOPIC_RESEARCH, leads: TOPIC_LEADS, sources: RESEARCH_SOURCES }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
