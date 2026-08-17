import { NextResponse, type NextRequest } from "next/server";
import {
  listOptionDays,
  PublishError,
  publishOption,
  readOptionDay,
  setKeeper,
  validatePublishInput,
} from "@/lib/githubPublish";

// The chat door: a minimal MCP server (streamable HTTP, stateless, no
// dependencies) so the founder can review and publish straight from a
// conversation — ChatGPT or Claude with this site added as a connector.
// Two tools, same publish core as the RUN IT button.
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
  "The Swinging Door's studio, for chat. get_light_table lists a day's cartoons (the founder has " +
  "already seen the images — they were generated in this conversation). mark_keeper stars the " +
  "ones he likes — his private best-of. publish_cartoon runs one on the parked public paper and " +
  "is rarely needed for now. NEVER star or publish until the founder explicitly says which one.";

const TOOLS = [
  {
    name: "get_light_table",
    description:
      "List the candidate cartoons (proofs) filed for a day, with their suggested titles and captions, " +
      "and whether the day already ran. Omit `day` to get the newest day still awaiting a decision.",
    inputSchema: {
      type: "object",
      properties: {
        day: { type: "string", description: "ISO date YYYY-MM-DD. Optional." },
      },
    },
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
  {
    name: "publish_cartoon",
    description:
      "Publish one candidate to the public front page. Call ONLY after the founder explicitly chose " +
      "the option number. The title and caption print exactly as given; prefer the filed suggestions " +
      "unless the founder edited them. Publishing is permanent for the day (one edition per day).",
    inputSchema: {
      type: "object",
      properties: {
        day: { type: "string", description: "ISO date YYYY-MM-DD of the proofs." },
        option: { type: "integer", description: "Which option to run (1, 2, 3…)." },
        title: { type: "string", description: "The edition's title, exactly as it should print." },
        caption: { type: "string", description: "The caption, exactly as it should print." },
        tags: { type: "array", items: { type: "string" }, description: "Up to five lowercase subjects." },
      },
      required: ["day", "option", "title", "caption"],
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
  if (name === "get_light_table") {
    let day = typeof args.day === "string" ? args.day : undefined;
    if (!day) {
      // Newest day still awaiting a decision, else the newest day.
      const days = await listOptionDays();
      if (days.length === 0) return toolText("No proofs are on file yet — /options is empty.");
      for (const candidate of days.slice(0, 7)) {
        const read = await readOptionDay(candidate);
        if (!read.selected) {
          day = candidate;
          break;
        }
      }
      day = day ?? days[0];
    }
    const table = await readOptionDay(day);
    const lines = [
      `Proofs for ${table.day}:`,
      ...table.options.map(
        (o) =>
          `  Option ${o.n}: ${o.title ?? "(untitled)"} — "${o.caption ?? "no suggested caption"}"` +
          (o.tags.length ? ` [${o.tags.join(", ")}]` : "")
      ),
      table.selected
        ? `Already ran: option ${table.selected.option} → /cartoon/${table.selected.slug}. A day runs only one edition.`
        : "Undecided. Ask the founder which option should run; publish only after an explicit choice.",
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

  if (name === "publish_cartoon") {
    const input = validatePublishInput(args);
    const { slug, edition } = await publishOption(input);
    return toolText(
      `It ran. Option ${input.option} of ${input.day} is now Edition No. ${edition}. ` +
        `The front page updates in about a minute; its permanent address is /cartoon/${slug}.`
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
