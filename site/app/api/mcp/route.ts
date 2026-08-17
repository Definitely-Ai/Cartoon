import { NextResponse, type NextRequest } from "next/server";
import {
  fileCartoon,
  getAllFeedback,
  getCanon,
  listOptionDays,
  PublishError,
  readOptionDay,
  setFeedback,
  setKeeper,
} from "@/lib/githubPublish";
import { finishCartoon } from "@/lib/dialogue";

// The chat door: a minimal MCP server (streamable HTTP, stateless) so the
// founder's whole ritual can happen in one conversation — the AI fetches
// the live canon, draws, files each finished cartoon into today's batch
// (the house typesets the dialogue server-side), and stars keepers on the
// founder's word. The studio site shows the same batches, bigger.
//
// Auth: the URL carries ?key=<MCP_SECRET> (or an Authorization: Bearer
// header). Without MCP_SECRET set in the environment the endpoint refuses
// everything. The tools can only read /options and run the same publish
// the button runs — no arbitrary writes are reachable through this door.

export const runtime = "nodejs";

const PROTOCOL_FALLBACK = "2025-03-26";

const SERVER_INFO = {
  name: "swinging-door-backroom", // BRAND-adjacent identifier
  version: "1.0.0",
};

const INSTRUCTIONS =
  "The Swinging Door's private studio, for chat — currently in a TRAINING WEEK: the founder is " +
  "teaching the system his taste. The ritual: (1) call get_canon and follow it exactly; (2) draw " +
  "3-5 distinct text-free candidates; (3) file each with file_cartoon — the house typesets the " +
  "caption, so never render words in the image; (4) he reacts, here or on the studio site. When " +
  "he gives an opinion on a specific cartoon, record it faithfully with record_feedback (his " +
  "words, not yours); star with mark_keeper only on his explicit word. To study his taste, call " +
  "get_feedback — it returns every verdict and note of the week. Never rate on his behalf.";

const TOOLS = [
  {
    name: "get_canon",
    description:
      "Fetch the live master prompt from the repo — the exact base block, slots, never-draw list, " +
      "and checklist. Call this before drawing, every time; the founder edits the canon and this " +
      "is always current.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "file_cartoon",
    description:
      "File one finished candidate into the day's batch. Send the TEXT-FREE artwork (square or " +
      "portrait; PNG or JPEG; base64) — the house typesets the caption beneath it in the strip's " +
      "house style, so never draw words into the image. Auto-numbers within the day. If the " +
      "payload is rejected as too large, re-encode as JPEG quality 85 and retry.",
    inputSchema: {
      type: "object",
      properties: {
        image_base64: { type: "string", description: "The artwork file, base64-encoded. No data: prefix." },
        title: { type: "string", description: "Short title for the cartoon." },
        caption: { type: "string", description: "The exact dialogue to typeset (≤ ~140 characters)." },
        topic: { type: "string", description: "The founder's request in a word or two, e.g. \"fishing\"." },
        style_notes: {
          type: "string",
          description:
            "REQUIRED in the training week: what this candidate deliberately varies, in a phrase " +
            "— e.g. \"looser wash\", \"8-word caption\", \"no TV, prop-driven gag\". This turns " +
            "his reactions into controlled experiments.",
        },
        tags: { type: "array", items: { type: "string" }, description: "Up to five lowercase subjects." },
        day: { type: "string", description: "ISO date YYYY-MM-DD; omit for today (UTC)." },
      },
      required: ["image_base64", "title", "caption"],
    },
  },
  {
    name: "get_light_table",
    description:
      "List the cartoons filed for a day, with titles, captions, topics, and which are starred " +
      "keepers. Omit `day` for the newest day.",
    inputSchema: {
      type: "object",
      properties: {
        day: { type: "string", description: "ISO date YYYY-MM-DD. Optional." },
      },
    },
  },
  {
    name: "record_feedback",
    description:
      "Record the founder's verdict and/or note for one cartoon — ONLY what he actually said, " +
      "never your own opinion. rating: 3 = love it, 2 = it's fine, 1 = not for me. The note " +
      "should be his reasoning, near-verbatim.",
    inputSchema: {
      type: "object",
      properties: {
        day: { type: "string", description: "ISO date YYYY-MM-DD of the batch." },
        option: { type: "integer", description: "Which option he's reacting to." },
        rating: { type: "integer", enum: [1, 2, 3], description: "3 love it · 2 it's fine · 1 not for me." },
        issues: {
          type: "array",
          items: { type: "string", enum: ["drawing", "caption", "idea", "characters"] },
          description: "What he said was off, if he said so.",
        },
        note: { type: "string", description: "His words on why, near-verbatim. Optional." },
      },
      required: ["day", "option"],
    },
  },
  {
    name: "get_feedback",
    description:
      "The whole training corpus: every cartoon of every day with its verdict, keeper star, " +
      "topic, caption, and the founder's notes. Use it to analyze his taste or to draft bible " +
      "revisions at the end of the week.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "mark_keeper",
    description:
      "Star (or unstar) a cartoon as a keeper — the founder's private best-of. Call ONLY after " +
      "the founder explicitly says which option he likes. on=false removes the star.",
    inputSchema: {
      type: "object",
      properties: {
        day: { type: "string", description: "ISO date YYYY-MM-DD of the batch." },
        option: { type: "integer", description: "Which option to star (1, 2, 3…)." },
        on: { type: "boolean", description: "true to star (default), false to unstar." },
      },
      required: ["day", "option"],
    },
  },
];

type RpcId = string | number | null;

function rpcResult(id: RpcId, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, result });
}

function rpcError(id: RpcId, code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } });
}

function toolText(text: string, isError = false) {
  return { content: [{ type: "text", text }], isError };
}

function authorized(request: NextRequest): boolean {
  const secret = process.env.MCP_SECRET;
  if (!secret) return false;
  const key = request.nextUrl.searchParams.get("key");
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return key === secret || bearer === secret;
}

async function runTool(name: string, args: Record<string, unknown>) {
  if (name === "get_canon") {
    return toolText(await getCanon());
  }

  if (name === "file_cartoon") {
    const imageB64 = typeof args.image_base64 === "string" ? args.image_base64 : "";
    if (!imageB64) throw new PublishError(400, "image_base64 is required.");
    const caption = typeof args.caption === "string" ? args.caption : "";
    const title = typeof args.title === "string" ? args.title : "";
    const day =
      typeof args.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(args.day)
        ? args.day
        : new Date().toISOString().slice(0, 10);
    const tags = Array.isArray(args.tags)
      ? args.tags.filter((t): t is string => typeof t === "string").map((t) => t.toLowerCase())
      : [];
    const finishedPng = await finishCartoon(Buffer.from(imageB64, "base64"), caption);
    const filed = await fileCartoon({
      day,
      title,
      caption,
      topic: typeof args.topic === "string" ? args.topic : null,
      tags,
      styleNotes: typeof args.style_notes === "string" ? args.style_notes : null,
      finishedPng,
    });
    return toolText(
      `Filed as option ${filed.option} of ${filed.day} — dialogue typeset, on the founder's ` +
        `light table within a minute.`
    );
  }

  if (name === "record_feedback") {
    const day = typeof args.day === "string" ? args.day : "";
    const option = Number(args.option);
    const patch: { rating?: 1 | 2 | 3; issues?: string[]; note?: string } = {};
    if (args.rating !== undefined) patch.rating = Number(args.rating) as 1 | 2 | 3;
    if (Array.isArray(args.issues)) patch.issues = args.issues.filter((i): i is string => typeof i === "string");
    if (typeof args.note === "string" && args.note.trim()) patch.note = args.note.trim();
    if (patch.rating === undefined && patch.note === undefined) {
      throw new PublishError(400, "Record a rating, a note, or both.");
    }
    await setFeedback(day, option, patch);
    return toolText(`Recorded for option ${option} of ${day}. The studio reflects it within a minute.`);
  }

  if (name === "get_feedback") {
    return toolText(await getAllFeedback());
  }

  if (name === "get_light_table") {
    let day = typeof args.day === "string" ? args.day : undefined;
    if (!day) {
      const days = await listOptionDays();
      if (days.length === 0) return toolText("Nothing filed yet — /options is empty.");
      day = days[0];
    }
    const table = await readOptionDay(day);
    const lines = [
      `Cartoons of ${table.day}:`,
      ...table.options.map(
        (o) =>
          `  Option ${o.n}${table.keepers.includes(o.n) ? " ★" : ""}: ${o.title ?? "(untitled)"} — ` +
          `"${o.caption ?? "no caption"}"` + (o.tags.length ? ` [${o.tags.join(", ")}]` : "")
      ),
      "Ask the founder which ones he likes; star only after an explicit choice.",
    ];
    return toolText(lines.join("\n"));
  }

  if (name === "mark_keeper") {
    const day = typeof args.day === "string" ? args.day : "";
    const option = Number(args.option);
    const on = args.on !== false;
    const keepers = await setKeeper(day, option, on);
    return toolText(
      `${on ? "Starred" : "Unstarred"} option ${option} of ${day}. Keepers for that day: ` +
        `${keepers.length ? keepers.join(", ") : "none"}. The studio site reflects it within a minute.`
    );
  }

  return toolText(`Unknown tool: ${name}`, true);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let message: { jsonrpc?: string; id?: RpcId; method?: string; params?: Record<string, unknown> };
  try {
    message = await request.json();
  } catch {
    return rpcError(null, -32700, "Parse error");
  }
  if (Array.isArray(message)) return rpcError(null, -32600, "Batch requests are not supported.");

  const { id = null, method, params } = message ?? {};

  // Notifications get a bare 202 per streamable-HTTP MCP.
  if (typeof method === "string" && method.startsWith("notifications/")) {
    return new NextResponse(null, { status: 202 });
  }

  switch (method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion:
          typeof params?.protocolVersion === "string" ? params.protocolVersion : PROTOCOL_FALLBACK,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: TOOLS });
    case "tools/call": {
      const name = typeof params?.name === "string" ? params.name : "";
      const args = (params?.arguments ?? {}) as Record<string, unknown>;
      try {
        return rpcResult(id, await runTool(name, args));
      } catch (err) {
        const text =
          err instanceof PublishError ? err.message : `Tool failed: ${(err as Error).message}`;
        return rpcResult(id, toolText(text, true));
      }
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

export async function GET() {
  return new NextResponse("MCP endpoint — POST JSON-RPC 2.0 messages here.", {
    status: 405,
    headers: { Allow: "POST" },
  });
}
