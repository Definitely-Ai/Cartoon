import { NextResponse, type NextRequest } from "next/server";
import { BACKROOM_COOKIE, isDoorOpen, isTriggerOpen } from "@/lib/backroom-auth";

import { assemblePrompt, generateCartoonArt, isMultiRef } from "@/lib/generate";
import { PublishError, commitFiles, getCanon, readRepoFile } from "@/lib/githubPublish";
import { getTraining, replicateGet } from "@/lib/replicate";

// The freshly trained model's driving test, before it is trusted with
// IMAGE_MODEL. Four fixed panels — one for identity, three for obedience —
// generated through the exact prompt assembly production uses, committed to
// the repo for pull-and-inspect.
//
//   ?version=<owner/swinging-door:hash>   defaults to the newest succeeded run
//   ?n=4                                  how many of the panels (1–4)
//   ?scale=0.9                            LORA_SCALE for this wave only
//
// The pass bar (docs/TRAINING.md): the trio panel shows three DISTINCT
// on-model characters, the boat is a boat, the bare panel is bare, the
// courtroom is a courtroom — and Mango has no tail anywhere. Identity without
// obedience is a failure; turn the scale down and rerun before blaming the
// dataset. Each wave is roughly $0.15.

export const runtime = "nodejs";
export const maxDuration = 300;

const LEDGER = "scripts/training/runs.json";
const OUT_DIR = "scripts/training/smoke";
const TIME_BUDGET_MS = 240_000;

// One shape for both panel sets. Declared rather than inferred: whether any
// single entry happens to carry a `setting` should not decide whether the
// route can ask for one.
type Panel = {
  slug: string;
  caption?: string;
  candidate: {
    scene: string;
    tv?: string;
    board?: string;
    setting?: string;
    characters: string[];
  };
};

// One identity cell and three obedience cells — the halves of the control
// batch a machine can pre-screen before Rick's dials do the real judging.
const PANELS: Panel[] = [
  {
    slug: "trio-bar",
    candidate: {
      scene: "Drew leans on the bar mid-remark while Mango listens from his stool and Abby polishes a glass behind the counter.",
      tv: "MARKETS OPEN",
      board: "HAPPY HOUR 4–?",
      characters: ["drew", "mango", "abby"],
    },
  },
  {
    // The filing shape most cartoons take: the two gentlemen, the room, the
    // boards. Also the discriminator between the ROOM paragraph and the
    // trio's three-tile conditioning board when a moderation flag appears.
    slug: "duo-bar",
    candidate: {
      scene: "Drew lifts his martini toward the TV while Mango frowns at the chalkboard.",
      tv: "RATE CUT EXPECTED, EVENTUALLY",
      board: "PATIENCE — $14",
      characters: ["drew", "mango"],
    },
  },
  {
    // Showcase cells: gag-complete bar scenes — TV, board, and caption
    // drawn from one joke — for direction checks with the founder.
    slug: "abby-bar",
    candidate: {
      scene: "Abby polishes a rocks glass behind the marble counter, eyes on the room.",
      tv: "MARKETS CLOSE MIXED",
      board: "LAST CALL IS A POLICY DECISION",
      characters: ["abby"],
    },
  },
  {
    slug: "duo-tariffs",
    candidate: {
      scene: "Drew studies the chalkboard over his martini while Mango peers into his old fashioned.",
      tv: "NEW TARIFFS ANNOUNCED",
      board: "IMPORTED BEER $14 (WAS $8)",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "mango-boat",
    candidate: {
      scene: "Mango sits alone amidships holding the tiller, looking back over his shoulder.",
      setting: "a small open boat on calm water, nothing but sea and sky behind",
      characters: ["mango"],
    },
  },
  {
    slug: "abby-bare",
    candidate: {
      scene: "Abby stands alone with her arms folded, one brow raised, against an entirely empty background.",
      setting: "a completely bare panel, no furniture, no walls, nothing behind her at all",
      characters: ["abby"],
    },
  },
  {
    slug: "drew-courtroom",
    candidate: {
      scene: "Drew stands at the witness stand, one wing raised to be sworn in.",
      setting: "a courtroom with a panelled judge's bench and a flag",
      characters: ["drew"],
    },
  },
];

// THE SET PLATE. One room, drawn once, so that eighty percent of the strip
// stops being a different bar every day. Everything here is fixed; only the
// screen, the chalkboard and what stands on the marble ever change.
const SET_PLATE_PROMPT =
  "Draw ONE single-panel interior as a PEN-AND-INK ENGRAVING: every surface built from fine drawn lines — " +
  "dash-hatching, cross-hatching and stipple — on PAPER WHITE. It is a drawing on paper, not a photograph " +
  "and not a rendered three-dimensional room; there is no colour and no smooth gradient anywhere.\n\n" +
  "THE ROOM IS BRIGHT AND WARM. Paper white is the dominant value and it is everywhere: the walls are drawn " +
  "in OPEN LINE with the paper showing through between the strokes, not filled in with black. Solid black is " +
  "used sparingly, for accents only. This is a polished, well-lit, expensive room at four in the afternoon — " +
  "never a dim one, never a gloomy one, never a cellar.\n\n" +
  "This is a SET PLATE: the empty interior of an upscale bar, and THERE ARE NO PEOPLE, NO ANIMALS AND NO " +
  "CHARACTERS OF ANY KIND anywhere in it.\n\n" +
  "CAMERA. We stand on the bartender's side of the bar looking out across it into the room, at eye level. The " +
  "near lip of a POLISHED MARBLE COUNTER runs left to right across the LOWEST part of the picture and the panel " +
  "ends there — nothing below the counter is in frame: no stools, no footrest, no floor.\n\n" +
  "THE WALL BEYOND THE COUNTER, left to right, and this arrangement never changes:\n" +
  "FAR LEFT, the front window onto the street, its lower half of frosted glass, carrying the bar's name in " +
  "gilt script lettering seen from behind — THE SWINGING DOOR, MIRRORED, reading backwards.\n" +
  "LEFT OF CENTRE, a brass wall sconce with a small pleated shade.\n" +
  "CENTRE, high on the wall, a modern wall-mounted FLAT-SCREEN TELEVISION with a NARROW black bezel — a " +
  "television, not a picture frame, and not a framed painting. ITS SCREEN IS COMPLETELY BLANK — " +
  "an empty pale rectangle with no picture, no headline band, no letters and no marks of any kind on it, and " +
  "its frame carries no badge, no nameplate and no lettering.\n" +
  "BELOW THE TELEVISION, two small framed prints on the panelling, NON-FIGURATIVE — a sailing ship and a bull " +
  "— with no people in them and no lettering.\n" +
  "RIGHT OF CENTRE, a chalkboard in a dark wooden frame, hung at head height. IT IS COMPLETELY BLANK — an " +
  "empty dark slate with no chalk writing, no words, no numbers and no marks of any kind.\n" +
  "FAR RIGHT, a second brass sconce matching the first.\n" +
  "Everywhere between them, DARK WALNUT PANELLING in tall fielded panels with a moulded chair rail.\n\n" +
  "ON THE MARBLE, nothing but a folded bar towel at the far left end and a small empty nut bowl at centre. NO " +
  "glasses, NO bottles, NO drinks.\n\n" +
  "THE BACK BAR IS BEHIND THE READER AND IS NOT DRAWN. There are NO liquor bottles, NO shelves and NO glass " +
  "racks anywhere in this picture.\n\n" +
  "THERE IS NO LETTERING ANYWHERE IN THIS PICTURE except the mirrored gilt script of THE SWINGING DOOR on the " +
  "window. The screen is blank, the chalkboard is blank, the prints are blank, the television frame is blank. " +
  "Do not draw text-like marks as texture.\n\n" +
  "The attached images are the founder's own bar panels: take the drawing hand, the panelling, the marble and " +
  "the warmth of the room from them — and nothing else. Do not copy their characters, their signage or their " +
  "lettering.";

// The character studies (?study=<name>). One figure, alone, on paper — the
// plate a reader meets the character through. No room, no props beyond the
// character's own, and no lettering anywhere: this is a drawing of a person,
// not a scene.
const STUDY_GROUND =
  "a plain sheet of cream drawing paper, entirely empty behind the figure — no room, no wall, no " +
  "furniture, no bar, no horizon, no shading behind them, and no lettering, caption, label, " +
  "signature or border anywhere on the sheet";

const STUDIES: Record<string, string> = {
  drew:
    "A single formal character study of Drew alone, standing three-quarter to us and turned " +
    "slightly to his left, seen from the knees up, his face in three-quarter view and his gaze " +
    "level and unhurried but NOT directed at the reader. His long neck is in its full high " +
    "S-curve so the whole line of it reads. He holds his martini by the stem in one feathered " +
    "hand, at chest height, the way a man holds a drink he is not hurrying. Every feather, the " +
    "bow tie, the collar band and the knit of the sweater vest are drawn in full detail.",
  mango:
    "A single formal character study of Mango alone, standing three-quarter to us and turned " +
    "slightly to his right, seen from the knees up, his face in three-quarter view with his " +
    "earnest hangdog patience, gaze level and NOT directed at the reader. One fur-backed hand " +
    "rests in his jacket pocket and the other holds his old fashioned at chest height. The black " +
    "lip-line along his muzzle, the freckles, the fringed drop ears, the flag pin on his left " +
    "lapel and the wristwatch are all drawn in full detail. He has no tail.",
  abby:
    "A single formal character study of Abby alone, standing three-quarter to us and turned " +
    "slightly to her right, seen from the knees up, her face in three-quarter view with a warm " +
    "closed-lip smile, gaze level and NOT directed at the reader. Her towel is folded over her " +
    "left shoulder and she holds a rocks glass and a polishing cloth in her fur-backed hands. " +
    "The studded leather collar with its teardrop gem, the pearl bracelet, the rolled sleeves of " +
    "her fitted blouse and her dark fitted skirt are all drawn in full detail.",
};

// The showcase batch (?set=showcase): twelve cartoons out of the writers'
// room — six mechanisms, none of them used more than three times, against a
// previous ten that was six-tenths reclassification. Every caption ends on its
// payload word, puts the speaker or the reader inside the sentence, and shares
// no fact with the chalkboard beside it. Captions are typeset after QC, not
// here.
const SHOWCASE: Panel[] = [
  {
    slug: "sc01-best-performing-square-foot",
    caption: 'Drew: "The middle seat is now our best-performing square foot."',
    candidate: {
      scene:
        "The bar is otherwise completely empty and the two of them are crammed into one corner of it, sharing a single stretch of marble with the nut bowl wedged between them, Mango's elbow already surrendered — stage on the counter, not the foot rail. CAMERA: we stand on the bartender's side of the bar and look ACROSS the marble counter at the two patrons; the near lip of the marble crosses the bottom of the frame with their drinks standing on it. Drew sits frame-left and Mango frame-right on the far side, facing us. BEHIND THEM is the ROOM — dark walnut panelling, small framed prints, brass wall sconces, the wall-mounted television and the chalkboard. There are NO liquor bottles, NO back-bar shelves and NO glass racks anywhere behind them; that shelving is at our own back, out of frame. The television picture shows A cabin cross-section, three seats abreast, drawn with no aisle anywhere in it. They are seated at the bar, never at a table, and never lined up shoulder to shoulder. Each character is seen in three-quarter view with the face and both eyes readable, and NOBODY looks out of the panel at the reader.",
      tv: "AIRFARES UP A QUARTER FROM LAST SUMMER",
      board: "ELBOW ROOM $19 · ARMREST: ONE PER PARTY",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc02-reconsidered-the-olive",
    caption: 'Abby: "I haven\'t raised a number in three years, gentlemen, but I have reconsidered the olive."',
    candidate: {
      scene:
        "Abby sets Drew's martini in front of him — a long three-olive pick carrying exactly one olive, which is this panel's one licensed exception to the three-olive rule — and screws the lid back onto the olive jar before it goes below the counter. CAMERA: we stand on the bartender's side of the bar and look ACROSS the marble counter at the patrons; the near lip of the marble crosses the bottom of the frame. Drew sits frame-left and Mango frame-right on the far side, facing us. BEHIND THEM is the ROOM — dark walnut panelling, small framed prints, brass wall sconces, the wall-mounted television and the chalkboard. There are NO liquor bottles, NO back-bar shelves and NO glass racks anywhere behind them. Abby works on OUR side of the marble, at the frame-right end of the counter in the near foreground, her body angled INTO the frame and her face turned toward the two gentlemen — she is looking at THEM, part of the conversation, seen in three-quarter from the side. The television picture shows A checkout belt carrying four items and a receipt long enough to hang off the end of it. They are seated at the bar, never at a table, and never lined up shoulder to shoulder. Each character is seen in three-quarter view with the face and both eyes readable, and NOBODY looks out of the panel at the reader.",
      tv: "GROCERIES NOW THE COUNTRY'S BIGGEST MONEY WORRY",
      board: "MARTINI $18 · UNCHANGED SINCE 2023",
      characters: ["abby", "drew", "mango"],
    },
  },
  {
    slug: "sc03-silent-for-a-semiconductor",
    caption: 'Drew: "Four times a year we all fall silent for a semiconductor."',
    candidate: {
      scene:
        "Mango has taken his hand off his glass and laid it flat over his flag pin, eyes on the screen, and the posture must read as entirely sincere — never comic — while Drew, mid-sip, watches Mango rather than the television. CAMERA: we stand on the bartender's side of the bar and look ACROSS the marble counter at the two patrons; the near lip of the marble crosses the bottom of the frame with their drinks standing on it. Drew sits frame-left and Mango frame-right on the far side, facing us. BEHIND THEM is the ROOM — dark walnut panelling, small framed prints, brass wall sconces, the wall-mounted television and the chalkboard. There are NO liquor bottles, NO back-bar shelves and NO glass racks anywhere behind them; that shelving is at our own back, out of frame. The television picture shows A trading floor with every head turned the same direction and nobody moving. They are seated at the bar, never at a table, and never lined up shoulder to shoulder. Each character is seen in three-quarter view with the face and both eyes readable, and NOBODY looks out of the panel at the reader.",
      tv: "THE STREET STOPS FOR ONE COMPANY",
      board: "TONIGHT'S SPECIAL $16 · REPRICED AFTER THE CLOSE · LAST QUARTER IT WAS $14",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc04-fourteen-dollars-of-roof",
    caption: 'Abby: "There\'s about four dollars of whiskey in that glass and fourteen dollars of roof."',
    candidate: {
      scene:
        "Abby slides Mango's old fashioned across the marble — one large cube, one dark cherry — past the check spindle, where a renewal envelope thick as a paperback is spiked and still sealed, tall enough to bury the spindle. CAMERA: we stand on the bartender's side of the bar and look ACROSS the marble counter at the patrons; the near lip of the marble crosses the bottom of the frame. Drew sits frame-left and Mango frame-right on the far side, facing us. BEHIND THEM is the ROOM — dark walnut panelling, small framed prints, brass wall sconces, the wall-mounted television and the chalkboard. There are NO liquor bottles, NO back-bar shelves and NO glass racks anywhere behind them. Abby works on OUR side of the marble, at the frame-right end of the counter in the near foreground, her body angled INTO the frame and her face turned toward the two gentlemen — she is looking at THEM, part of the conversation, seen in three-quarter from the side. The television picture shows A small tidy house standing behind a mailbox too full to close — no people in the shot. They are seated at the bar, never at a table, and never lined up shoulder to shoulder. Each character is seen in three-quarter view with the face and both eyes readable, and NOBODY looks out of the panel at the reader.",
      tv: "TWO IN THREE HOUSEHOLDS SAW PREMIUMS RISE",
      board: "DEDUCTIBLE HOUR 4–7 · THE FIRST $2,500 IS YOURS",
      characters: ["abby", "drew", "mango"],
    },
  },
  {
    slug: "sc05-down-a-percent-at-lunch",
    caption: 'Drew: "I don\'t look at it during the day, Mango. It was down a percent at lunch."',
    candidate: {
      scene:
        "Away game — the club grill room after nine: Drew's phone lies face-down on the bar under one economical feather-digit with a signed chit beside it, while Mango is still in his cap with his glove tucked in his belt. CAMERA: we stand on the bartender's side of the bar and look ACROSS the marble counter at the two patrons; the near lip of the marble crosses the bottom of the frame with their drinks standing on it. Drew sits frame-left and Mango frame-right on the far side, facing us. BEHIND THEM is the ROOM — dark walnut panelling, small framed prints, brass wall sconces, the wall-mounted television and the chalkboard. There are NO liquor bottles, NO back-bar shelves and NO glass racks anywhere behind them; that shelving is at our own back, out of frame. The television picture shows One chart carrying two lines, both going the same way down. They are seated at the bar, never at a table, and never lined up shoulder to shoulder. Each character is seen in three-quarter view with the face and both eyes readable, and NOBODY looks out of the panel at the reader.",
      tv: "STOCKS AND BONDS BOTH LOWER",
      board: "GRILL ROOM MARTINI $18 · QUOTED CONTINUOUSLY · CHARGED ONCE AT SIGNING",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc06-ninety-thousand-miles",
    caption: 'Mango: "I\'m waiting on rates to come down, Drew. My truck has waited ninety thousand miles."',
    candidate: {
      scene:
        "Away game — the customer lounge of a truck dealership: Mango turns his key fob over and over on the finance desk with a folded rate sheet pinned under his elbow, his own truck parked outside the showroom glass behind him, while Drew holds a styrofoam cup of the dealership's coffee at arm's length, untasted. CAMERA: we stand on the bartender's side of the bar and look ACROSS the marble counter at the two patrons; the near lip of the marble crosses the bottom of the frame with their drinks standing on it. Drew sits frame-left and Mango frame-right on the far side, facing us. BEHIND THEM is the ROOM — dark walnut panelling, small framed prints, brass wall sconces, the wall-mounted television and the chalkboard. There are NO liquor bottles, NO back-bar shelves and NO glass racks anywhere behind them; that shelving is at our own back, out of frame. The television picture shows A bank's loan-rate sign being changed by a man on a stepladder. They are seated at the bar, never at a table, and never lined up shoulder to shoulder. Each character is seen in three-quarter view with the face and both eyes readable, and NOBODY looks out of the panel at the reader.",
      tv: "BORROWING GETS DEARER, NOT CHEAPER",
      board: "THIS MONTH 8.4% APR · IN 2021 IT WAS 2.9% · ON APPROVED CREDIT",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc07-the-deductible-rehearsal",
    caption: 'Mango: "The first two thousand of any storm is mine. I like to stay current."',
    candidate: {
      scene:
        "Mango tips the top inch of his old fashioned into an empty glass, sets that glass firmly aside, and only then lifts his own; Drew watches with mild interest. CAMERA: we stand on the bartender's side of the bar and look ACROSS the marble counter at the two patrons; the near lip of the marble crosses the bottom of the frame with their drinks standing on it. Drew sits frame-left and Mango frame-right on the far side, facing us. BEHIND THEM is the ROOM — dark walnut panelling, small framed prints, brass wall sconces, the wall-mounted television and the chalkboard. There are NO liquor bottles, NO back-bar shelves and NO glass racks anywhere behind them; that shelving is at our own back, out of frame. The television picture shows A house standing in a puddle beneath a very small umbrella. They are seated at the bar, never at a table, and never lined up shoulder to shoulder. Each character is seen in three-quarter view with the face and both eyes readable, and NOBODY looks out of the panel at the reader.",
      tv: "PREMIUMS UP FOR 65% — DEDUCTIBLES UP TOO",
      board: "OLD FASHIONED $22 · COVERAGE BEGINS AT THE SECOND INCH",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc08-ribbon-cutting",
    caption: 'Drew: "We have already moved in, Mango. December is only the ribbon-cutting."',
    candidate: {
      scene:
        "Drew's glass is already up toward the screen while Mango turns the bar's wall calendar forward a page with one broad finger. CAMERA: we stand on the bartender's side of the bar and look ACROSS the marble counter at the two patrons; the near lip of the marble crosses the bottom of the frame with their drinks standing on it. Drew sits frame-left and Mango frame-right on the far side, facing us. BEHIND THEM is the ROOM — dark walnut panelling, small framed prints, brass wall sconces, the wall-mounted television and the chalkboard. There are NO liquor bottles, NO back-bar shelves and NO glass racks anywhere behind them; that shelving is at our own back, out of frame. The television picture shows A policy-rate staircase with the final step already drawn in and inked solid. They are seated at the bar, never at a table, and never lined up shoulder to shoulder. Each character is seen in three-quarter view with the face and both eyes readable, and NOBODY looks out of the panel at the reader.",
      tv: "TRADERS SEE A HIKE BY YEAR END — ODDS AT 100%",
      board: "THE WINTER MARTINI $19 · POURED FROM FOUR O'CLOCK TODAY",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc09-the-total-aloud",
    caption: 'Mango: "I announce the total at checkout now, and the man behind me shakes his head at the score."',
    candidate: {
      scene:
        "Mango reads from a receipt long enough that the end of it hangs over the edge of the marble, and Drew has stopped his martini halfway up, head tilted toward the reading with the courteous attention of a man hearing an away score come in. CAMERA: we stand on the bartender's side of the bar and look ACROSS the marble counter at the two patrons; the near lip of the marble crosses the bottom of the frame with their drinks standing on it. Drew sits frame-left and Mango frame-right on the far side, facing us. BEHIND THEM is the ROOM — dark walnut panelling, small framed prints, brass wall sconces, the wall-mounted television and the chalkboard. There are NO liquor bottles, NO back-bar shelves and NO glass racks anywhere behind them; that shelving is at our own back, out of frame. The television picture shows One paper grocery sack sitting on a butcher's scale. They are seated at the bar, never at a table, and never lined up shoulder to shoulder. Each character is seen in three-quarter view with the face and both eyes readable, and NOBODY looks out of the panel at the reader.",
      tv: "FOOD PRICES A THIRD HIGHER THAN IN 2020",
      board: "THE 2020 OLD FASHIONED $12 · TODAY'S $16",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc10-refund-went-home",
    caption: 'Mango: "I paid it at the register. The refund went home to a warehouse."',
    candidate: {
      scene:
        "Mango holds a long register receipt flat across the marble with both hands, the way a man holds a treaty, while Drew reads it upside down from his side without lowering his martini. CAMERA: we stand on the bartender's side of the bar and look ACROSS the marble counter at the two patrons; the near lip of the marble crosses the bottom of the frame with their drinks standing on it. Drew sits frame-left and Mango frame-right on the far side, facing us. BEHIND THEM is the ROOM — dark walnut panelling, small framed prints, brass wall sconces, the wall-mounted television and the chalkboard. There are NO liquor bottles, NO back-bar shelves and NO glass racks anywhere behind them; that shelving is at our own back, out of frame. The television picture shows A department-store floor under a SALE banner, the manager shaking hands with a customs officer. They are seated at the bar, never at a table, and never lined up shoulder to shoulder. Each character is seen in three-quarter view with the face and both eyes readable, and NOBODY looks out of the panel at the reader.",
      tv: "RETAILER RAISES OUTLOOK ON $150M OF TARIFF REFUNDS",
      board: "IMPORT SURCHARGE $3 A POUR · THE HOUSE KEEPS THE PAPERWORK",
      characters: ["drew", "mango"],
    },
  },
  {
    slug: "sc11-from-windsor",
    caption: 'Mango: "I buy American now, Drew. Abby tells me this one is from Windsor, Ontario."',
    candidate: {
      scene:
        "Abby is mid-pour from a labelled bottle into Mango's rocks glass, towel on her left shoulder and eyes down on the work, while Mango turns to Drew to say it and Drew's eye stays on the label. CAMERA: we stand on the bartender's side of the bar and look ACROSS the marble counter at the patrons; the near lip of the marble crosses the bottom of the frame. Drew sits frame-left and Mango frame-right on the far side, facing us. BEHIND THEM is the ROOM — dark walnut panelling, small framed prints, brass wall sconces, the wall-mounted television and the chalkboard. There are NO liquor bottles, NO back-bar shelves and NO glass racks anywhere behind them. Abby works on OUR side of the marble, at the frame-right end of the counter in the near foreground, her body angled INTO the frame and her face turned toward the two gentlemen — she is looking at THEM, part of the conversation, seen in three-quarter from the side. The television picture shows Two lecterns in two different rooms, filmed at the same height, the same empty chairs behind each. They are seated at the bar, never at a table, and never lined up shoulder to shoulder. Each character is seen in three-quarter view with the face and both eyes readable, and NOBODY looks out of the panel at the reader.",
      tv: "CANADA MATCHES THE LEVIES, DOLLAR FOR DOLLAR",
      board: "ALL WHISKY $19 · EITHER SIDE OF THE RIVER",
      characters: ["abby", "drew", "mango"],
    },
  },
  {
    slug: "sc12-permanent-receipt",
    caption: 'Drew: "The rate has behaved beautifully this year. Nobody has mentioned the total."',
    candidate: {
      scene:
        "Abby sets the bar check down between them and goes back to her towel; Mango takes it in both hands at reading distance while Drew, martini at rest, does not touch it and plainly is not going to. CAMERA: we stand on the bartender's side of the bar and look ACROSS the marble counter at the patrons; the near lip of the marble crosses the bottom of the frame. Drew sits frame-left and Mango frame-right on the far side, facing us. BEHIND THEM is the ROOM — dark walnut panelling, small framed prints, brass wall sconces, the wall-mounted television and the chalkboard. There are NO liquor bottles, NO back-bar shelves and NO glass racks anywhere behind them. Abby works on OUR side of the marble, at the frame-right end of the counter in the near foreground, her body angled INTO the frame and her face turned toward the two gentlemen — she is looking at THEM, part of the conversation, seen in three-quarter from the side. The television picture shows A flat, obedient line and an anchor caught mid-nod. They are seated at the bar, never at a table, and never lined up shoulder to shoulder. Each character is seen in three-quarter view with the face and both eyes readable, and NOBODY looks out of the panel at the reader.",
      tv: "PRICE GAUGE COMES IN AS EXPECTED",
      board: "THE $12 MARTINI · RETIRED WITH HONOURS",
      characters: ["abby", "drew", "mango"],
    },
  },
];

export async function GET(request: NextRequest) {
  // Two doors: the owner's login cookie, or the single-purpose trigger token
  // (?t=) for automated callers — same secret, different derivation, so the
  // URL-carried form can never leak the session cookie.
  const authed =
    (await isDoorOpen(request.cookies.get(BACKROOM_COOKIE)?.value)) ||
    (await isTriggerOpen(request.nextUrl.searchParams.get("t")));
  if (!authed) {
    return NextResponse.json({ error: "The door is closed. Knock first." }, { status: 401 });
  }
  const params = request.nextUrl.searchParams;

  try {
    // ?schema=<owner/name> — read a model's real input contract from
    // Replicate. The sandbox cannot reach replicate.com, so guessing at
    // parameter names is how a paid call gets wasted on a 422.
    const schemaOf = params.get("schema");
    if (schemaOf) {
      const model = await replicateGet<{
        latest_version?: { id: string; openapi_schema?: Record<string, unknown> };
      }>(`/models/${schemaOf}`);
      const schema = model.latest_version?.openapi_schema as
        | {
            components?: {
              schemas?: Record<string, { enum?: unknown[] }> & {
                Input?: { properties?: Record<string, Record<string, unknown>> };
              };
            };
          }
        | undefined;
      const schemas = schema?.components?.schemas ?? {};
      const props = schema?.components?.schemas?.Input?.properties ?? {};
      // Enum-valued inputs arrive as a $ref to a sibling schema. Following it
      // is the difference between knowing the legal values and burning a paid
      // call on a 422.
      const enumOf = (spec: Record<string, unknown>): unknown[] | undefined => {
        const ref =
          (spec.$ref as string | undefined) ??
          ((spec.allOf as { $ref?: string }[] | undefined)?.[0]?.$ref) ??
          ((spec.type as { $ref?: string }[] | undefined)?.[0]?.$ref);
        const name = typeof ref === "string" ? ref.split("/").pop() : undefined;
        const target = name ? (schemas as Record<string, { enum?: unknown[] }>)[name] : undefined;
        return (spec.enum as unknown[] | undefined) ?? target?.enum;
      };
      return NextResponse.json({
        model: schemaOf,
        version: model.latest_version?.id ?? null,
        inputs: Object.fromEntries(
          Object.entries(props).map(([name, spec]) => [
            name,
            {
              type: spec.type ?? spec.allOf ?? spec.$ref ?? "?",
              values: enumOf(spec),
              description: String(spec.description ?? "").slice(0, 160),
            },
          ])
        ),
      });
    }

    let version = params.get("version");
    if (!version) {
      const ledgerFile = await readRepoFile(LEDGER);
      const runs = ledgerFile ? (JSON.parse(ledgerFile.bytes.toString("utf8")) as { id: string }[]) : [];
      for (const run of runs.slice().reverse()) {
        const training = await getTraining(run.id).catch(() => null);
        if (training?.status === "succeeded" && training.output?.version) {
          version = training.output.version;
          break;
        }
      }
      if (!version) {
        return NextResponse.json(
          { error: "No succeeded training found — run /api/backroom/train first, or pass ?version= explicitly." },
          { status: 404 }
        );
      }
    }
    if ((version.includes("kontext") || isMultiRef(version)) && params.get("baseline") !== "1") {
      return NextResponse.json(
        { error: "The smoke test is for a fine-tune — Kontext is the baseline, not the candidate. Pass baseline=1 to deliberately smoke the production Kontext path (e.g. after changing its reference boards)." },
        { status: 400 }
      );
    }

    // ?quality=low|medium|high — gpt-image-2's variant dial, per request.
    // low is ~$0.012 an image and high ~$0.128, so the house draws at low and
    // this is how a single panel gets asked for more effort without a deploy.
    const quality = params.get("quality");
    if (quality && ["low", "medium", "high", "auto"].includes(quality)) {
      process.env.IMAGE_QUALITY = quality;
    }

    const scale = params.get("scale");
    if (scale && Number(scale) > 0) {
      // Per-request override of the strength dial; generateCartoonArt reads
      // the env at call time, and a Vercel function instance handles one
      // request at a time, so this cannot leak across users.
      process.env.LORA_SCALE = scale;
    }

    // ?probe=<text> — moderation bisection for baseline debugging: generate
    // once from the given text with Drew's board, report pass or flag,
    // commit nothing. Only meaningful with baseline=1.
    const probe = params.get("probe");
    if (probe && params.get("baseline") === "1") {
      try {
        await generateCartoonArt({ prompt: probe, characters: ["drew"], model: version });
        return NextResponse.json({ ok: true, probe: "passed" });
      } catch (error) {
        return NextResponse.json({ ok: false, probe: error instanceof Error ? error.message : String(error) });
      }
    }

    // ?plate=room — THE SET. The strip lives in one bar, and a room described
    // in words is a different bar every generation. This draws it ONCE, empty,
    // from the house camera, and canon/vision/studies/room.png then rides along
    // as a reference on every bar cartoon.
    //
    // The screen and the chalkboard are drawn BLANK on purpose. A room tile was
    // tried before, cut from plate 3, and it carried that plate's television
    // picture — the reflecting pool — into every cartoon's screen. A plate with
    // empty signage teaches layout and furniture and nothing else; the story
    // goes on the screen from the scene brief.
    if (params.get("plate") === "room") {
      const image = await generateCartoonArt({
        prompt: SET_PLATE_PROMPT,
        characters: [],
        barScene: false,
        model: version,
        references: [
          { path: "canon/vision/plate-1-security-and-martini-menu.jpg", box: [16, 1460, 1600, 1140] },
          { path: "canon/vision/plate-4-nineteenth-hole-and-tariffs.jpg", box: [16, 150, 1590, 700] },
        ],
      });
      await commitFiles(
        [
          { path: "canon/vision/studies/room.png", content: image },
          { path: "canon/vision/studies/room.txt", content: `${version}\nIMAGE_QUALITY=${process.env.IMAGE_QUALITY ?? "low"}\n\n${SET_PLATE_PROMPT}\n` },
        ],
        "canon: the set plate for The Swinging Door"
      );
      return NextResponse.json({ ok: true, plate: "room", path: "canon/vision/studies/room.png" });
    }

    // ?study=<drew|mango|abby> — the character study the Studio Bible page
    // shows beside each bible. The founder's own concept images are photographs
    // of prints: paper curl, glare, a page edge, and in Abby's case colour, in
    // a strip that is strictly black and white. They are the right SOURCE and
    // the wrong thing to publish. This draws a clean plate from them instead,
    // in the house hand, and commits it to canon/vision/studies/.
    const study = params.get("study");
    if (study) {
      const who = study.toLowerCase();
      if (!STUDIES[who]) {
        return NextResponse.json(
          { error: `No study for "${study}" — try ${Object.keys(STUDIES).join(", ")}.` },
          { status: 400 }
        );
      }
      const canonText = await getCanon();
      const prompt = assemblePrompt(
        canonText,
        { scene: STUDIES[who], setting: STUDY_GROUND, characters: [who] },
        false,
        false,
        isMultiRef(version)
      );
      const image = await generateCartoonArt({
        prompt,
        characters: [who],
        barScene: false,
        model: version,
      });
      await commitFiles(
        [
          { path: `canon/vision/studies/${who}.png`, content: image },
          { path: `canon/vision/studies/${who}.txt`, content: `${version}\nIMAGE_QUALITY=${process.env.IMAGE_QUALITY ?? "low"}\n\n${prompt}\n` },
        ],
        `canon: character study for ${who}`
      );
      return NextResponse.json({ ok: true, study: who, path: `canon/vision/studies/${who}.png` });
    }

    // ?set=showcase switches from the control cells to the showcase batch.
    const panelSet = params.get("set") === "showcase" ? SHOWCASE : PANELS;
    const n = Math.min(panelSet.length, Math.max(1, Number(params.get("n")) || panelSet.length));
    // ?only=<slug> runs a single panel — for isolating a moderation flag or
    // re-rolling one cell without paying for the others.
    const only = params.get("only");
    const chosen = only ? panelSet.filter((p) => p.slug === only) : panelSet.slice(0, n);
    if (chosen.length === 0) {
      return NextResponse.json({ error: `No panel named "${only}" — slugs: ${panelSet.map((p) => p.slug).join(", ")}.` }, { status: 400 });
    }
    const canon = await getCanon();
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 13).replace("T", "-");

    const started = Date.now();
    const made: string[] = [];
    const failed: { slug: string; error: string }[] = [];
    let first = true;
    for (const panel of chosen) {
      if (Date.now() - started > TIME_BUDGET_MS) break;
      // Under $5 of credit Replicate allows one prediction per ~10s; spacing
      // the panels turns a wave of 429s into a slower complete wave.
      if (!first) await new Promise((resolve) => setTimeout(resolve, 12_000));
      first = false;
      try {
        // Baseline (Kontext) runs must assemble the Kontext branch of the
        // prompt — the fine-tune branch writes trigger tokens into the text,
        // which a board-conditioned model happily paints onto the walls.
        const multiRef = isMultiRef(version);
        const staged = !multiRef && params.get("set") === "showcase" && !panel.candidate.setting;
        const prompt = assemblePrompt(
          canon,
          panel.candidate,
          !version.includes("kontext") && !multiRef,
          staged,
          multiRef
        );
        const image = await generateCartoonArt({
          prompt,
          characters: panel.candidate.characters,
          barScene: !panel.candidate.setting,
          staged,
          model: version,
        });
        const name = `${stamp}-${panel.slug}`;
        await commitFiles(
          [
            { path: `${OUT_DIR}/${name}.png`, content: image },
            {
              path: `${OUT_DIR}/${name}.txt`,
              content:
                `${version}\nLORA_SCALE=${process.env.LORA_SCALE ?? "0.9 (default)"}\n` +
                ("caption" in panel && panel.caption ? `CAPTION ${panel.caption}\n` : "") +
                `\n${prompt}\n`,
            },
          ],
          `training: smoke panel ${name}`
        );
        made.push(name);
      } catch (error) {
        failed.push({ slug: panel.slug, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return NextResponse.json({
      ok: failed.length === 0,
      version,
      made,
      failed,
      next:
        "git pull and inspect scripts/training/smoke/ — three distinct characters at the bar, a real boat, a bare panel, " +
        "a real courtroom, and no tail on Mango. Pass both halves before setting IMAGE_MODEL.",
    });
  } catch (error) {
    if (error instanceof PublishError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected failure." }, { status: 500 });
  }
}
