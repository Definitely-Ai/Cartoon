// The writers' room.
//
// Rick types one line — "make the cartoon on the golf course" — and gets ten
// finished cartoons to choose from. This module is the half that turns the
// line into ten briefs; lib/generate.ts draws them.
//
// The division of labour matters and is deliberate. The writer invents the
// JOKE: who speaks, what they say, what the television is carrying, what the
// chalkboard says, what the characters are physically doing. It does NOT
// invent the STAGING. Camera position, who sits where, which side of the bar
// each character stands on, the occlusion that tells a patron from a
// bartender, the fourth wall — all of that is composed here, in code, from
// text that took a dozen rounds of correction to get right. A writer asked to
// restate those rules in its own words would paraphrase them, and paraphrase
// is how the strip drifts.
//
// So: the writer fills the creative slots, the house supplies the stage.

import { PublishError, readRepoFile } from "@/lib/githubPublish";
import { generateText } from "@/lib/replicate";

export const WRITER_MODEL = process.env.WRITER_MODEL || "openai/gpt-5";

export type CastName = "drew" | "mango" | "abby";

/** What the writer is allowed to decide. */
export type Gag = {
  speaker: CastName;
  caption: string;
  /** What the characters are physically doing — one or two sentences. */
  action: string;
  /** The television's headline, or "" when this cartoon has no screen. */
  tv: string;
  /** What the footage on the screen depicts. Empty when tv is empty. */
  tvPicture: string;
  /** The chalkboard's line, or "" when this cartoon has no board. */
  board: string;
  characters: CastName[];
  /** A short setting phrase for an away game, or "" when it is the bar. */
  away: string;
  /** The writer's own one-line note on how the joke turns. Kept for review. */
  turn?: string;
};

/** A gag plus the staging the house composed for it — what generate.ts eats. */
export type Brief = Gag & {
  slug: string;
  scene: string;
  setting: string;
};

const CAST: CastName[] = ["drew", "mango", "abby"];

// ---------------------------------------------------------------------------
// The stage. Not the writer's to touch.
// ---------------------------------------------------------------------------

/** The bar, shot from the dining room. The occlusion sentence is the load
 *  bearing one: it is what stops the gentlemen being drawn behind the counter
 *  alongside Abby, which read correctly to twelve panels' worth of checking
 *  before the founder saw it in two seconds. */
function barStage(hasAbby: boolean, tvPicture: string): string {
  const camera =
    "CAMERA: we are in the DINING ROOM, BEHIND AND SLIGHTLY ABOVE the two gentlemen, looking OVER THEIR " +
    "SHOULDERS toward the bar. Drew sits frame-left and Mango frame-right with their BACKS TO US, each turned " +
    "toward the other so his face reads in three-quarter over his own shoulder; their near shoulders OVERLAP " +
    "AND HIDE part of the counter.";

  const beyond = hasAbby
    ? "The marble runs across the MIDDLE of the picture BEHIND their shoulders. BEYOND it stands ABBY, facing " +
      "them across the bar, the counter's far edge crossing in front of her at the waist and hiding her below " +
      "it — she is standing and they are seated, so her head sits HIGHER in the frame than theirs. Behind her, " +
      "the back bar, the television above it and the chalkboard beside."
    : "The marble counter runs across the MIDDLE of the picture BEHIND their shoulders, their drinks standing " +
      "on it past their arms. Beyond it is the bar: back bar, bottles, mirror, the television above and the " +
      "chalkboard beside. They are patrons — never behind the bar, never holding a bottle or a bar towel.";

  const screen = tvPicture ? ` The television picture shows ${tvPicture.replace(/\.$/, "")}.` : "";

  return (
    `${camera} ${beyond}${screen} They are seated at the bar, never at a table, and never lined up shoulder ` +
    "to shoulder. Each character is seen in three-quarter view with the face and both eyes readable, and " +
    "NOBODY looks out of the panel at the reader."
  );
}

/** An away game. No counter to hide behind, so the framing convention and the
 *  fourth wall have to be restated in the setting's own terms.
 *
 *  The headcount is spoken aloud because the bar's version could assume two
 *  gentlemen and a bartender: out here the cast changes panel to panel, and a
 *  stage direction that says "the two of them" over a three-hander is an
 *  instruction to drop somebody. */
function awayStage(count: number): string {
  const who =
    count >= 3
      ? "all THREE of them filling the frame"
      : count === 2
        ? "BOTH of them filling the frame"
        : "the single figure filling the frame";
  const facing =
    count > 1
      ? "Each character is seen in THREE-QUARTER view, angled into the frame so the face and both eyes are " +
        "readable, turned toward each other rather than toward us."
      : "He or she is seen in THREE-QUARTER view, angled into the frame so the face and both eyes are " +
        "readable, attention on the business in hand rather than on us.";
  return (
    `CAMERA: eye level, close in, ${who} from the chest to the BELT, where the bottom edge of the panel ` +
    `cuts them — nothing below the belt is in frame, no legs and no feet — with the place reading clearly ` +
    `behind them, never a wide landscape with small whole figures in it. ${facing} NOBODY looks out of the ` +
    "panel at the reader. They are the only figures in the picture: no other people anywhere, near or far."
  );
}

/** Known away games get the canonical phrasing so the same place is drawn the
 *  same way every time. Anything else is passed through as written — the
 *  founder should be able to ask for somewhere new without editing a table. */
const PLACES: { match: RegExp; describe: string }[] = [
  {
    match: /golf|fairway|links|tee|course|caddie|caddy/i,
    describe:
      "a golf course fairway on a fine day: mown turf underfoot with the mower's stripes running away behind " +
      "them, a flagstick on a green in the middle distance, mature trees along both sides and a low clubhouse " +
      "roof beyond the trees",
  },
  {
    match: /\bboat\b|sail|yacht|open water|at sea/i,
    describe: "a small open boat on calm water, nothing but sea and flat horizon behind them",
  },
  {
    match: /court|judge|trial|jury|witness/i,
    describe: "a courtroom with a panelled judge's bench and a flag standing beside it",
  },
  {
    match: /office|desk|boardroom|meeting/i,
    describe: "a plain office beside a desk, a window with half-drawn blinds behind them",
  },
  {
    match: /airport|terminal|departure|gate|flight/i,
    describe: "an airport departure gate, a bank of seats and a departures board behind them",
  },
  {
    match: /park bench|\bpark\b|parkland/i,
    describe: "a public park bench under bare trees, a path and iron railings behind them",
  },
  {
    match: /beach|shore|waterline|seaside/i,
    describe: "a beach at the waterline, flat sea and sky behind them",
  },
  {
    match: /dock|jetty|pier|marina/i,
    describe: "a wooden dock over calm water, pilings and moored hulls behind them",
  },
];

/** Canonical description for an away phrase, or the phrase itself. */
export function describePlace(phrase: string): string {
  const found = PLACES.find((p) => p.match.test(phrase));
  return found ? found.describe : phrase.trim();
}

/** Compose the full scene the image model receives: the writer's action plus
 *  the house's staging. */
export function stage(gag: Gag): Brief {
  const hasAbby = gag.characters.includes("abby");
  const away = gag.away.trim();
  const setting = away ? describePlace(away) : "";
  const action = gag.action.trim().replace(/\s*$/, "").replace(/([^.])$/, "$1.");
  const scene = `${action} ${away ? awayStage(gag.characters.length) : barStage(hasAbby, gag.tvPicture)}`;
  return { ...gag, setting, scene, slug: slugOf(gag.caption) };
}

function slugOf(caption: string): string {
  return (
    caption
      .toLowerCase()
      .replace(/^[a-z]+:\s*/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .split("-")
      .slice(0, 6)
      .join("-") || "untitled"
  );
}

// ---------------------------------------------------------------------------
// The commission
// ---------------------------------------------------------------------------

/** Trim a canon document to the part a writer needs, so ten gags do not cost
 *  a hundred thousand tokens of art direction the writer cannot act on. */
function excerpt(doc: string | null, limit: number): string {
  if (!doc) return "";
  return doc.length <= limit ? doc : `${doc.slice(0, limit)}\n\n[…trimmed]`;
}

const SYSTEM = `You are the writers' room for THE SWINGING DOOR, a daily single-panel black-and-white gag
cartoon in the New Yorker tradition, set in an upscale bar a block off Wall Street.

THE CAST — exactly three, and no one else exists in this world:
- drew: a white-plumed flamingo gentleman in a black bow tie and knitted sweater vest. Dry, composed,
  the one who says the line. Drinks a martini.
- mango: a golden retriever gentleman in a good suit with a flag pin on his left lapel. Earnest, warm,
  worried in the brows and nowhere else. Drinks an old fashioned.
- abby: a West Highland white terrier who owns the bar and tends it. Behind her counter, towel and
  bottle are hers alone. She lands the driest lines because she has heard everything.

THE JOKE. One turn per cartoon, and you must be able to name it: a COLLISION (two worlds meet and the
wrong logic wins), a CONTRADICTION (someone says the opposite of what they are doing), or a THEFT (an
ordinary phrase is stolen by a world it does not belong to). Money, markets, prices, fees, insurance and
the quiet indignities of a comfortable life are the strip's subject. The humour is dry, adult, understated
and never cruel, never crude, never a pun for its own sake, never a wisecrack that anyone could deliver.
The funniest line is often on the wall rather than in the caption.

THE ROOM SPEAKS TOO. When the panel has a television, its headline and the picture on it come from the
SAME joke as the caption. Same for the chalkboard's special. Three angles on one gag, never three gags.

Return ONLY a JSON array. No prose, no markdown fence, no commentary before or after.`;

const SHAPE = `Each element of the array is an object with exactly these keys:

  "speaker"    one of "drew", "mango", "abby" — who says the caption
  "caption"    the spoken line, without the speaker's name, without surrounding quotes.
               One sentence. Never more than about twenty words.
  "characters" an array of one to three of "drew", "mango", "abby". The speaker must be in it.
  "action"     ONE OR TWO SENTENCES describing only what the characters are physically DOING and what
               is on the counter or in their hands. Do NOT describe camera angles, who is in front of
               or behind the bar, what anyone is looking at, or the room's furniture — the house adds
               all of that. Just the business of the scene.
  "tv"         the television's headline in bold caps style, or "" if this cartoon has no screen
  "tvPicture"  what the footage on the screen depicts, phrased to follow "The television picture
               shows …". Empty string if "tv" is empty. Never any people in it unless the joke needs them.
  "board"      the chalkboard's line, menu-shaped, or "" if this cartoon has no board
  "away"       "" for a cartoon in the bar. For a cartoon somewhere else, a SHORT place phrase such as
               "golf course" or "courtroom". Whatever the brief asks for.
  "turn"       three or four words naming the turn: "collision", "contradiction" or "theft", plus what
               collides, contradicts or is stolen.

Rules the batch as a whole must obey:
- Every caption is a DIFFERENT joke with a DIFFERENT turn. Ten variations on one idea is a failure.
- Vary the speaker across the batch. Do not give every line to the same character.
- Vary the cast: some panels are the two gentlemen, some bring Abby in.
- At least half the batch carries a television or a chalkboard doing its share of the work.
- If the brief names a place that is not the bar, EVERY cartoon in the batch is at that place, and there
  is no television and no chalkboard out there — set "tv", "tvPicture" and "board" to "" for all of them.`;

/** Ask the room for n gags against Rick's brief. */
export async function commission(brief: string, n: number): Promise<Gag[]> {
  const [comedy, settings] = await Promise.all([
    readRepoFile("canon/comedy/COMEDY-BIBLE.md").catch(() => null),
    readRepoFile("canon/settings/SETTINGS-BIBLE.md").catch(() => null),
  ]);

  const house = [
    excerpt(comedy?.bytes.toString("utf8") ?? null, 18_000),
    excerpt(settings?.bytes.toString("utf8") ?? null, 9_000),
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");

  const prompt =
    `THE HOUSE'S OWN COMEDY AND SETTINGS BIBLES, for your guidance:\n\n${house}\n\n` +
    `====\n\nTHE BRIEF FROM THE FOUNDER:\n\n"${brief}"\n\n` +
    `Write ${n} cartoons against that brief.\n\n${SHAPE}`;

  const raw = await generateText(WRITER_MODEL, {
    prompt,
    system_prompt: SYSTEM,
    reasoning_effort: "medium",
    max_completion_tokens: 12_000,
  });

  return parseGags(raw, n);
}

/** Models wrap JSON in fences, in prose, or in an object with one array in it.
 *  Recover the array rather than failing a paid call on punctuation. */
export function parseGags(raw: string, expected: number): Gag[] {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  if (!text.startsWith("[")) {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start >= 0 && end > start) text = text.slice(start, end + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new PublishError(502, `The writers' room did not return JSON: ${raw.slice(0, 200)}`);
  }
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { cartoons?: unknown[] }).cartoons)
      ? (parsed as { cartoons: unknown[] }).cartoons
      : null;
  if (!list) throw new PublishError(502, "The writers' room returned JSON that is not an array.");

  const gags = list.map((item, i) => validate(item, i));
  if (gags.length === 0) throw new PublishError(502, "The writers' room returned an empty batch.");
  return gags.slice(0, expected);
}

const isCast = (v: unknown): v is CastName => typeof v === "string" && CAST.includes(v as CastName);

function validate(item: unknown, index: number): Gag {
  const o = (item ?? {}) as Record<string, unknown>;
  const str = (k: string) => (typeof o[k] === "string" ? (o[k] as string).trim() : "");

  const caption = str("caption").replace(/^["“]|["”]$/g, "");
  if (!caption) throw new PublishError(502, `Cartoon ${index + 1} has no caption.`);

  const action = str("action");
  if (!action) throw new PublishError(502, `Cartoon ${index + 1} has no action.`);

  const speaker = isCast(o.speaker) ? o.speaker : "drew";
  const listed = Array.isArray(o.characters) ? o.characters.filter(isCast) : [];
  const characters = listed.includes(speaker) ? listed : [speaker, ...listed];
  const unique = CAST.filter((c) => characters.includes(c));

  const away = str("away");
  // Away games have no bar to carry a screen or a board. The writer is told
  // this; enforce it too, because a chalkboard on a fairway is a redraw.
  const tv = away ? "" : str("tv");
  return {
    speaker,
    caption,
    action,
    tv,
    tvPicture: tv ? str("tvPicture") : "",
    board: away ? "" : str("board"),
    characters: unique.length > 0 ? unique : [speaker],
    away,
    turn: str("turn") || undefined,
  };
}
