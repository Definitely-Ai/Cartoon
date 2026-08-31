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
  /** The lettered lines this setting carries, from the SAME joke as the
   *  caption. The bar has a television and a chalkboard; an away game has
   *  posted notices, markers and banners, and nothing was asking the writer
   *  to write them — so the drawing invented its own, off-joke, every time. */
  signs: string[];
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

/** The bar, shot from the dining room.
 *
 *  THIS USED TO RESTATE THE WHOLE STAGE AND IT COST US THE EDITION. Every bar
 *  scene carried its own copy of the camera, the occlusion sentence, where Abby
 *  stands and where the counter crosses — about eleven hundred characters of it,
 *  written back when canon described the staging only in prose and the panel
 *  slot was the one place it could be said sharply.
 *
 *  Canon says it better now in THE SIDES — one slab out of frame both sides,
 *  the gentlemen seated at its near side — and it says it in every prompt
 *  whether this function speaks up or not. So the duplication
 *  bought nothing and it pushed a three-hander to 32,824 characters against a
 *  32,000 ceiling: every one of the twelve Abby panels failed the length guard,
 *  silently, retried on the next call and failed again — which is exactly why
 *  the first six panels of the redraw were all cartoons Abby is not in.
 *
 *  What belongs in the scene slot is what is TRUE OF THIS PANEL ONLY: who is in
 *  it, what they are doing, and what the television is showing. The staging is
 *  canon's job. */
function barStage(hasAbby: boolean, tvPicture: string): string {
  const who = hasAbby
    ? "IN THIS PANEL: Drew and Mango seated as patrons, and ABBY working the service side beyond the counter."
    : "IN THIS PANEL: Drew and Mango seated as patrons, and NOBODY on the service side — the space behind the " +
      "counter is empty.";
  const screen = tvPicture ? ` The television picture shows ${tvPicture.replace(/\.$/, "")}.` : "";
  return `${who}${screen} Stage it exactly as THE SIDES describes.`;
}

/** What being the speaker changes on the page. Only Drew's face shows it —
 *  the founder asked for his bill parted mid-word — and saying it for the
 *  others would fight their own closed-mouth rules, so they get nothing. */
function speakerNote(speaker: CastName): string {
  return speaker === "drew"
    ? " DREW IS THE ONE SPEAKING IN THIS PANEL: his bill is SLIGHTLY PARTED, caught mid-word."
    : "";
}

/** Abby's read, restated at the scene slot where it lands last and loudest —
 *  the fence alone failed four panels in a row. The founder's own ruling:
 *  neutral is fine, sad never is; smiling when she serves or lands the line. */
function abbyNote(hasAbby: boolean): string {
  return hasAbby
    ? " Abby's face reads WARM — amused or at ease, NEVER sad or downcast; when she serves, delivers or " +
      "lands the line she is genuinely SMILING."
    : "";
}

/** An away game. No counter to hide behind, so the framing convention and the
 *  fourth wall have to be restated in the setting's own terms.
 *
 *  The headcount is spoken aloud because the bar's version could assume two
 *  gentlemen and a bartender: out here the cast changes panel to panel, and a
 *  stage direction that says "the two of them" over a three-hander is an
 *  instruction to drop somebody. */
function awayStage(count: number, signs: string[]): string {
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
  // Two at most. A setting that letters five surfaces garbles three of them.
  const posted =
    signs.length > 0
      ? ` THE PLACE CARRIES THIS CARTOON'S OWN JOKE ON ITS OWN SIGNAGE: ${signs
          .slice(0, 2)
          .map((line, i) => `sign ${i + 1} reads exactly and only "${line.replace(/"/g, "")}"`)
          .join("; ")}. Those are the ONLY lettered surfaces in the panel; every other surface is blank.`
      : "";

  return (
    `CAMERA: eye level, close in, ${who} from the chest to the BELT, where the bottom edge of the panel ` +
    `cuts them — nothing below the belt is in frame, no legs and no feet — with the place reading clearly ` +
    `behind them, never a wide landscape with small whole figures in it. ${facing} NOBODY looks out of the ` +
    "panel at the reader. They are the only figures in the picture: no other people anywhere, near or far." +
    posted
  );
}

/** Known away games get the canonical phrasing so the same place is drawn the
 *  same way every time. Anything else is passed through as written — the
 *  founder should be able to ask for somewhere new without editing a table. */
const PLACES: { match: RegExp; describe: string }[] = [
  {
    match: /golf|fairway|links|tee|course|caddie|caddy/i,
    // THE SAME COURSE EVERY TIME. The first version of this described a mood --
    // "mature trees, a low clubhouse roof beyond" -- and the drawing invented a
    // different building in nine panels out of ten: a cupola here, a colonnade
    // there, a two-storey clapboard house with a clock tower. Countable beats
    // relational, so every landmark below is a countable fact with a fixed
    // place in the frame, and the clubhouse in particular is pinned down hard.
    describe:
      "THE SAME GOLF COURSE EVERY TIME, and it is always this one. Underfoot, mown fairway turf with the " +
      "mower's pale and dark STRIPES running straight away from the reader into the distance. In the MIDDLE " +
      "DISTANCE, ONE putting green with ONE flagstick standing in it, the flag plain and unlettered. Along BOTH " +
      "sides, stands of heavy round-crowned deciduous trees in full leaf, closing the fairway in. Beyond the " +
      "green, ONE clubhouse and always the same one: a LOW SINGLE-STOREY building of pale horizontal clapboard " +
      "with a plain shingled HIPPED roof, ONE central brick chimney, and a covered porch of SIX slim white posts " +
      "running along its front. It has NO cupola, NO belfry, NO clock, NO tower, NO gabled pediment, NO second " +
      "storey and NO colonnade of arches. It sits small and low and central on the horizon, well behind the " +
      "green, never close and never large. The sky is open and lightly clouded",
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
  const scene = `${action} ${
    away ? awayStage(gag.characters.length, gag.signs) : barStage(hasAbby, gag.tvPicture)
  }${speakerNote(gag.speaker)}${abbyNote(hasAbby)}`;
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
The wall pays the joke a second time; it never pays it the first time.

THE CAPTION LANDS ON ITS OWN. The founder's ruling, twice given: a joke must never DEPEND on the
television or the chalkboard to make sense — cover the screen and the board and the line still lands.
They deepen and echo the joke; they never complete it. And the line is CLEAR: name the thing it turns
on plainly — "a rate cut", "a bag fee", "the renewal" — never a riddle the reader must decode. If the
founder would ask "what does this mean?", it is a rewrite. Subjects are BUSINESS subjects: things a
working adult pays for out of his own pocket — never campus, tuition or student life. The chalkboard
prices the joke and NEVER urges drinking hard, fast or often.

BE CONCRETE. This is the difference between a line that lands and a line that reads like a research note.
The strip's best caption is "There's about four dollars of whiskey in that glass and fourteen dollars of
roof" — it works because every noun is a thing on the bar or over your head, and there are two real
numbers in it. Name PRICES, OBJECTS and small physical facts. Say "the olive", "a nine-dollar ice cube",
"the second page of the bill", "my roof", "the armrest" — never "optionality", "duration", "at scale",
"throws off cash", "the rollover" or "longevity". If a line could appear in a bank's morning email, it is
not a cartoon caption. A gentleman at a bar says money things in kitchen words.

THE ROOM SPEAKS TOO. When the panel has a television, its headline and the picture on it come from the
SAME joke as the caption. Same for the chalkboard's special. Three angles on one gag, never three gags.

Return ONLY a JSON array. No prose, no markdown fence, no commentary before or after.`;

const SHAPE = `Each element of the array is an object with exactly these keys:

  "speaker"    one of "drew", "mango", "abby" — who says the caption
  "caption"    the spoken line, without the speaker's name, without surrounding quotes.
               One sentence. Never more than about twenty words.
  "characters" an array of one to three of "drew", "mango", "abby". The speaker must be in it.
  "action"     ONE OR TWO SENTENCES describing only what the characters are physically DOING and what
               they are HOLDING. The counter is already set — martini, old fashioned, nut bowl — and
               you may not add to it. Do NOT describe camera angles, who is in front of
               or behind the bar, what anyone is looking at, or the room's furniture — the house adds
               all of that. Just the business of the scene. HARD PROHIBITIONS, each one a founder
               veto: NOTHING PRINTED EVER LIES ON THE MARBLE — no note card, slip, receipt,
               statement, ticket, boarding pass, folio, printout or card reader on the bar top; if
               the joke truly needs a printed thing, a character HOLDS IT UP and your action NAMES
               the at-most-four short lines it shows, or you cut the prop. The drinks, the nut bowl
               and Abby's service are the only things on the counter. No tag, sticker, label or
               price tag hangs from a glass, a bottle or anything anyone holds. Drew wears a
               pocketless knitted sweater vest and NO jacket — never source a prop from a pocket of
               his. Nobody in this strip has fingernails or claws — never write "taps it with a
               fingernail". Your action NEVER specifies lettering on anything — no monogram, initial,
               logo, brand or embroidery on a towel, apron, glass, bottle or napkin; the television
               and the chalkboard are the only lettered surfaces, and their fields below carry their
               words. Most gags need NO prop at all beyond the drinks: the line, the TV and the board
               echo the joke.
  "tv"         the television's headline in bold caps style, or "" if this cartoon has no screen
  "tvPicture"  what the footage on the screen depicts, phrased to follow "The television picture
               shows …". Empty string if "tv" is empty. Never any people in it unless the joke needs them.
               IT MUST CONTAIN NO WRITING. The drawing is forbidden to letter anything inside the
               television picture, so a shot whose point is words cannot be drawn: no receipt with
               its line items, no invoice, no statement, no headline on a newspaper, no price board,
               no shopfront name, no chart with labelled axes. An inspection of one edition found
               lettering leaking into sixteen of twenty-five screens, and every one of them traced
               back to a picture commissioned here that could not exist without text. Describe
               something the eye reads WITHOUT reading: a mailbox too full to close, a trading floor
               where every head is turned the same way, a suitcase that will not shut. The chyron
               carries the words; the picture carries the image. And it is ONE PLAIN LITERAL SCENE a
               viewer could name out loud in two seconds — the thing the headline is about, shown
               straight. Never a rebus, never a visual riddle, never a picture whose point is a
               comparison the viewer has to work out.
  "board"      the chalkboard's line, menu-shaped and CARRYING A PRICE OR A COUNT — a thing, a price,
               and one turn; a board with no figure on it is a second caption in chalk, at most one
               per ten. It NEVER urges drinking hard, fast, cheap or often. Or "" if this cartoon has
               no board
  "away"       "" for a cartoon in the bar. For a cartoon somewhere else, a SHORT place phrase such as
               "golf course" or "courtroom". Whatever the brief asks for.
  "signs"      AWAY GAMES ONLY (empty array [] for a bar cartoon). ONE OR TWO short lines of lettering
               that the place itself would really have posted — a course notice, a yardage marker, a
               banner, a warning board — CARRYING THIS CARTOON'S OWN JOKE. They are the away game's
               equivalent of the television and the chalkboard, and they must come from the same joke
               as the caption, not a different golf joke. If the caption is about municipal bonds
               paying for a municipal course, the sign is about that. Two at most: a setting that
               letters five surfaces garbles three of them.
  "turn"       three or four words naming the turn: "collision", "contradiction" or "theft", plus what
               collides, contradicts or is stolen.

Rules the batch as a whole must obey:
- Every caption is a DIFFERENT joke with a DIFFERENT turn. Variations on one idea are a failure, and in a
  large batch that is the commonest way to fail: by cartoon fifteen you will be tempted to rewrite
  cartoon three. Before you write each new one, read the ones above it and make sure the SUBJECT is new —
  a bar bill, a roof, a premium, a fee, a fare, a rate, a tip, a receipt, a renewal, a deposit, a
  surcharge and a refund are twelve different subjects, not one.
- Vary the speaker across the batch. Do not give every line to the same character.
- Vary the cast: some panels are the two gentlemen, some bring Abby in.
- In a BAR batch, at least half the cartoons carry a television or a chalkboard ECHOING the caption's
  joke from another angle — never carrying it alone. (Does not apply to an away batch — see below.)
- If the brief names a place that is not the bar, EVERY cartoon in the batch is at that place, and there
  is no television and no chalkboard out there — set "tv", "tvPicture" and "board" to "" for all of them,
  and put the room's share of the joke in "signs" instead.`;

/** Ask the room for n gags against Rick's brief. */
export async function commission(brief: string, n: number): Promise<Gag[]> {
  const [comedy, settings] = await Promise.all([
    readRepoFile("canon/comedy/COMEDY-BIBLE.md").catch(() => null),
    readRepoFile("canon/settings/SETTINGS-BIBLE.md").catch(() => null),
  ]);

  const house = [
    // 43,000 carries the comedy bible through the kill list, the retired
    // shapes and the whole conduct scan. At 18,000 the cut landed mid-lane-
    // recipes: every conduct rule, the campus ban and the chalkboard-drinking
    // veto were dead text the writer never received — the founder caught an
    // invented hard-drinking board partly because of it. The writer prompt has
    // no ceiling (32,000 governs the IMAGE prompt only); cost is ~6k tokens.
    excerpt(comedy?.bytes.toString("utf8") ?? null, 43_000),
    excerpt(settings?.bytes.toString("utf8") ?? null, 9_000),
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");

  const prompt =
    `THE HOUSE'S OWN COMEDY AND SETTINGS BIBLES, for your guidance:\n\n${house}\n\n` +
    `====\n\nTHE BRIEF FROM THE FOUNDER:\n\n"${brief}"\n\n` +
    `Write ${n} cartoons against that brief.\n\n${SHAPE}`;

  // The ceiling has to scale with the batch. It was fixed at 12,000, which is
  // ample for ten gags and truncates twenty-five into invalid JSON — the
  // reasoning tokens come out of the same budget, so the failure lands as a
  // parse error with nothing committed rather than as a short batch.
  const raw = await generateText(
    WRITER_MODEL,
    {
      prompt,
      system_prompt: SYSTEM,
      reasoning_effort: "medium",
      max_completion_tokens: Math.max(12_000, n * 1_400),
    },
    // Twenty-five gags take appreciably longer to write than ten.
    Math.max(150_000, n * 9_000)
  );

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
    const looksTruncated = text.trimEnd().endsWith(",") || text.trimEnd().endsWith("{") || !text.trimEnd().endsWith("]");
    throw new PublishError(
      502,
      looksTruncated
        ? `The writers' room ran out of room mid-batch — raise max_completion_tokens or ask for fewer. Ends: ...${raw.slice(-120)}`
        : `The writers' room did not return JSON: ${raw.slice(0, 200)}`
    );
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
    // Only an away game needs them: in the bar the television and the
    // chalkboard already are the signage, and a third lettered surface is how
    // a panel ends up with five garbled ones.
    signs: away
      ? (Array.isArray(o.signs) ? o.signs : [])
          .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
          .map((x) => x.trim().slice(0, 90))
          .slice(0, 2)
      : [],
    turn: str("turn") || undefined,
  };
}
