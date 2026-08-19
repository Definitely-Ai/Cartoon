import { NextResponse, type NextRequest } from "next/server";
import {
  fileCartoon,
  getAllFeedback,
  getCanon,
  getDoc,
  getModelSheets,
  listOptionDays,
  PublishError,
  readOptionDay,
  setFeedback,
  setKeeper,
} from "@/lib/githubPublish";
import { finishCartoon } from "@/lib/dialogue";
import { assemblePrompt, generateCartoonArt } from "@/lib/generate";

// Image generation happens in this route now (make_cartoons) — give the
// function room for a full 5-candidate batch.
export const maxDuration = 300;

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
  "The Swinging Door's private studio, for chat — currently in a TRAINING WEEK: the founder " +
  "(not a technical man; hold his hand, one step at a time) is teaching the system his taste. " +
  "When he asks for cartoons: (1) call get_canon; (2) talk the idea through with him in plain " +
  "words — if he has no topic, offer two or three from the day's news — and confirm the angle " +
  "in one sentence before drawing; (3) write 3-5 distinct candidates from the canon (scene " +
  "sentence in canon vocabulary, exact caption ≤20 words, title, who's in the scene, " +
  "style_notes naming each one's single deliberate variation); (4) call make_cartoons with " +
  "them — the studio draws the art itself on the locked character sheets, typesets the " +
  "caption, and files everything; warn him it takes a minute or two per cartoon; (5) then say: " +
  "'They're on your Today page — give each one two scores, 1-10 for the art and 1-10 for the " +
  "caption, and tell me anything you'd change.' When he reacts here in chat, record it " +
  "faithfully with record_feedback (art 1-10, caption 1-10, his words as the note — never your " +
  "own opinion); star with mark_keeper only on his explicit word. A cartoon LANDS when both " +
  "scores are 6+; the studio goal is 60% landed. To study his taste call get_feedback; deeper " +
  "rules live in get_doc (comedy boundaries, settings/stage rules, per-character bibles). " +
  "Graduation test, last day of the week: before he scores a fresh batch, predict land or miss " +
  "for each candidate; 4 of 5 right means the bible is ready to present — each miss names the " +
  "chapter still to fix.";

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
    name: "get_model_sheet",
    description:
      "The locked reference sheets for one character, returned as images. The canon names these " +
      "sheets as the visual authority (body, face, eye construction, the flag pin) — fetch them " +
      "for every character you're about to draw, once per conversation, and match them exactly " +
      "rather than averaging with older art.",
    inputSchema: {
      type: "object",
      properties: {
        character: {
          type: "string",
          enum: ["mango", "drew", "abby"],
          description: "Whose sheets to fetch.",
        },
      },
      required: ["character"],
    },
  },
  {
    name: "make_cartoons",
    description:
      "THE way to draw for the founder: the studio generates the artwork server-side (hosted " +
      "FLUX conditioned on the locked character sheets), typesets the caption, and files each " +
      "cartoon into today's batch — you send only text. Write 1–5 distinct candidates from the " +
      "canon (call get_canon first). Each candidate: the [SCENE] sentence in canon vocabulary, " +
      "the exact caption (≤20 words), a short title, who is in the scene, style_notes naming " +
      "its one deliberate variation, and either tv+board words (bar scene) or setting (away " +
      "game). Takes a minute or two per candidate — tell the founder they're being drawn.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "The founder's request in a word or two, e.g. \"on a boat\"." },
        candidates: {
          type: "array",
          minItems: 1,
          maxItems: 5,
          items: {
            type: "object",
            properties: {
              scene: { type: "string", description: "One [SCENE] sentence — who is doing what." },
              title: { type: "string", description: "Short title." },
              caption: { type: "string", description: "The exact dialogue to typeset (≤ 20 words)." },
              characters: {
                type: "array",
                items: { type: "string", enum: ["drew", "mango", "abby"] },
                description: "Everyone in the scene — their locked sheets condition the image.",
              },
              style_notes: { type: "string", description: "The one deliberate variation this candidate tests." },
              tv: { type: "string", description: "Bar scenes: 2–3 words on the TV." },
              board: { type: "string", description: "Bar scenes: 2–4 chalk words." },
              setting: {
                type: "string",
                description: "Away games only: one phrase naming the place, e.g. \"a small two-thwart fishing boat on calm water\". Omit for bar scenes.",
              },
              tags: { type: "array", items: { type: "string" }, description: "Up to five lowercase subjects." },
            },
            required: ["scene", "title", "caption", "characters", "style_notes"],
          },
        },
      },
      required: ["topic", "candidates"],
    },
  },
  {
    name: "get_doc",
    description:
      "Fetch any canon document beyond the master prompt: the canon guide and reading order, " +
      "comedy boundaries, settings and stage rules, style law, personalities/voices, the " +
      "workflow, the scene-qc inspection list, and each character's deep bible and " +
      "quality-control gates. Everything the master prompt's checklist cites is reachable here.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          enum: [
            "canon-guide",
            "comedy",
            "settings",
            "style",
            "personalities",
            "workflow",
            "scene-qc",
            "drew-bible",
            "drew-qc",
            "mango-bible",
            "mango-qc",
            "abby-bible",
            "abby-qc",
          ],
          description: "Which document to fetch.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "file_cartoon",
    description:
      "File one finished candidate into the day's batch — ONLY after it passed your visual " +
      "inspection against scene-qc (get_doc name=scene-qc): sides of the bar, seating, grips, " +
      "no clipping, identity vs the sheets. Send the TEXT-FREE artwork (square or portrait, " +
      "strictly black-and-white, 1200px+ long side preferred; PNG or JPEG; base64) — the house " +
      "typesets the caption beneath it in the strip's house style, so never draw words into the " +
      "image. Auto-numbers within the day. If the payload is rejected as too large, re-encode " +
      "as JPEG quality 85 and retry.",
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
      "Record the founder's scores and/or note for one cartoon — ONLY what he actually said, " +
      "never your own opinion. Two dials, 1–10 each: art (the drawing) and caption (the joke). " +
      "A cartoon lands when both are 6+. The note should be his reasoning, near-verbatim.",
    inputSchema: {
      type: "object",
      properties: {
        day: { type: "string", description: "ISO date YYYY-MM-DD of the batch." },
        option: { type: "integer", description: "Which option he's reacting to." },
        art: { type: "integer", minimum: 1, maximum: 10, description: "His 1–10 score for the drawing." },
        caption: { type: "integer", minimum: 1, maximum: 10, description: "His 1–10 score for the caption/joke." },
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

  if (name === "get_doc") {
    return toolText(await getDoc(String(args.name ?? "")));
  }

  if (name === "make_cartoons") {
    const topic = typeof args.topic === "string" ? args.topic : null;
    const candidates = Array.isArray(args.candidates) ? args.candidates : [];
    if (candidates.length === 0 || candidates.length > 5) {
      throw new PublishError(400, "Send 1–5 candidates.");
    }
    const masterPrompt = await getCanon();
    const day = new Date().toISOString().slice(0, 10);
    const lines: string[] = [];

    for (const [i, c] of candidates.entries()) {
      const label = typeof c.title === "string" && c.title ? c.title : `candidate ${i + 1}`;
      try {
        const characters = Array.isArray(c.characters)
          ? c.characters.filter((x: unknown): x is string => typeof x === "string")
          : [];
        if (characters.length === 0) throw new PublishError(400, "characters is required.");
        if (typeof c.scene !== "string" || !c.scene.trim()) throw new PublishError(400, "scene is required.");
        if (typeof c.caption !== "string" || !c.caption.trim()) throw new PublishError(400, "caption is required.");

        const prompt = assemblePrompt(masterPrompt, {
          scene: c.scene,
          tv: typeof c.tv === "string" ? c.tv : undefined,
          board: typeof c.board === "string" ? c.board : undefined,
          setting: typeof c.setting === "string" && c.setting.trim() ? c.setting : undefined,
          characters,
        });

        // Generate, then run the house filters; one retry with the fault
        // named — the same redraw discipline the canon demands of a chat AI.
        let finished: Buffer;
        try {
          finished = await finishCartoon(await generateCartoonArt({ prompt, characters }), c.caption);
        } catch (err) {
          if (err instanceof PublishError && err.status === 400) {
            const retryPrompt = `${prompt}\n\nPrevious attempt failed inspection: ${err.message} Fix exactly that.`;
            finished = await finishCartoon(await generateCartoonArt({ prompt: retryPrompt, characters }), c.caption);
          } else {
            throw err;
          }
        }

        const filed = await fileCartoon({
          day,
          title: typeof c.title === "string" ? c.title : "",
          caption: c.caption,
          topic,
          tags: Array.isArray(c.tags)
            ? c.tags.filter((t: unknown): t is string => typeof t === "string").map((t: string) => t.toLowerCase())
            : [],
          styleNotes: typeof c.style_notes === "string" ? c.style_notes : null,
          finishedPng: finished,
        });
        lines.push(`✓ "${label}" filed as option ${filed.option} of ${filed.day}.`);
      } catch (err) {
        const message = err instanceof PublishError ? err.message : "unexpected error";
        lines.push(`✗ "${label}" failed: ${message}`);
      }
    }

    const host = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "the studio";
    const filedCount = lines.filter((l) => l.startsWith("✓")).length;
    return toolText(
      `${lines.join("\n")}\n\n${filedCount} of ${candidates.length} filed for ${day}. ` +
        `Tell the founder they're on his Today page (${host}) — each one takes two scores, ` +
        `1–10 for the art and 1–10 for the caption.`
    );
  }

  if (name === "get_model_sheet") {
    const character = String(args.character ?? "").toLowerCase().trim();
    const sheets = await getModelSheets(character);
    if (sheets.length === 0) {
      return toolText(`No reference sheets are filed for ${character} yet — draw from the canon text.`);
    }
    return {
      content: [
        {
          type: "text",
          text:
            `${character}'s reference sheets, in authority order:\n` +
            sheets.map((s, i) => `${i + 1}. ${s.name} — ${s.authority}`).join("\n") +
            "\nMatch the locked master exactly; support sheets never override it, and older " +
            "cartoons never override any of these. The images follow in the same order.",
        },
        ...sheets.map((s) => ({ type: "image", data: s.base64, mimeType: s.mime })),
      ],
      isError: false,
    };
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
    const untagged =
      typeof args.style_notes === "string" && args.style_notes.trim()
        ? ""
        : " NOTE: this candidate arrived without style_notes — in the training week every " +
          "candidate must name its one deliberate variation, or his reactions can't attach " +
          "to known differences. Tag the next ones.";
    return toolText(
      `Filed as option ${filed.option} of ${filed.day} — dialogue typeset, on the founder's ` +
        `light table within a minute.${untagged}`
    );
  }

  if (name === "record_feedback") {
    const day = typeof args.day === "string" ? args.day : "";
    const option = Number(args.option);
    const patch: { art?: number; caption?: number; note?: string } = {};
    if (args.art !== undefined) patch.art = Number(args.art);
    if (args.caption !== undefined) patch.caption = Number(args.caption);
    if (typeof args.note === "string" && args.note.trim()) patch.note = args.note.trim();
    if (patch.art === undefined && patch.caption === undefined && patch.note === undefined) {
      throw new PublishError(400, "Record an art score, a caption score, a note — something he said.");
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
