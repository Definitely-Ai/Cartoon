import { NextResponse, type NextRequest } from "next/server";
import { BACKROOM_COOKIE, isDoorOpen, isTriggerOpen } from "@/lib/backroom-auth";

import { assemblePrompt, generateCartoonArt, imageModel, isMultiRef } from "@/lib/generate";
import { PublishError, commitFiles, getCanon, listRepoDir, readRepoFile } from "@/lib/githubPublish";
import { getTraining, replicateGet } from "@/lib/replicate";

// The freshly trained model's driving test, before it is trusted with
// IMAGE_MODEL. Four fixed panels — one for identity, three for obedience —
// generated through the exact prompt assembly production uses, committed to
// the repo for pull-and-inspect.
//
//   ?version=<model>                      defaults to the HOUSE MODEL, the one
//                                         production draws with. Pass
//                                         version=lora to reach for the newest
//                                         succeeded training run instead.
//   ?n=4                                  how many of the panels (1–4)
//   ?scale=0.9                            LORA_SCALE for this wave only
//   ?quality=low|medium|high|auto         the house model's quality dial
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
  "THE ROOM IS BRIGHT AND WARM. Paper white is the dominant value and it is everywhere: surfaces are drawn " +
  "in OPEN LINE with the paper showing through between the strokes, not filled in with black. Solid black is " +
  "used sparingly, for accents only. This is a polished, well-lit, expensive room at four in the afternoon — " +
  "never a dim one, never a gloomy one, never a cellar.\n\n" +
  "This is a SET PLATE: the empty interior of an upscale bar a block off Wall Street, and THERE ARE NO " +
  "PEOPLE, NO ANIMALS AND NO CHARACTERS OF ANY KIND anywhere in it.\n\n" +

  "IT IS A CARTOON PANEL'S VIEW, NOT AN ARCHITECT'S. We are CLOSE IN. The bar fills the picture: the counter " +
  "runs the FULL WIDTH of the frame and the back bar fills the top half of it. This is NOT a wide view of a " +
  "whole room — do not draw a dining room, dining tables, dining chairs, an archway, a far doorway, a " +
  "ceiling, a chandelier or a receding floor of parquet. Nothing in this picture is small and far away.\n\n" +

  "COMPOSITION, GIVEN AS FRACTIONS OF THE FRAME. This is the part that must be obeyed exactly, because it is " +
  "the whole reason this plate is being drawn. Work upward from the bottom edge and put each band where it " +
  "is told:\n" +
  "0% to 20% (the BOTTOM FIFTH) — EMPTY. This is the open air of the PATRON side of the bar, the stretch two " +
  "seated gentlemen will fill in the finished cartoons, and in this plate it is left blank. Draw NOTHING " +
  "here: no floor, no stool, no chair, no table, no foot rail, no furniture of any kind.\n" +
  "20% to 40% — THE MARBLE COUNTER, running left to right straight ACROSS THE PICTURE and out past both " +
  "edges. Its NEAR edge crosses at about 20% and its FAR edge at about 40%, and because we look slightly " +
  "DOWN at it the whole TOP SURFACE of the slab is visible between those two edges as a wide foreshortened " +
  "band with its veining running away from us. It is a broad horizontal band across the middle of the " +
  "picture, NEVER a thin strip along the bottom edge, and it NEVER runs away from us into the distance at " +
  "an angle.\n" +
  "40% to 50% — THE BARTENDER'S WALKWAY: a clear strip of open floor BEHIND the counter and IN FRONT of the " +
  "back bar, about a metre deep, its floorboards visible. This gap is what makes the room a room instead of " +
  "a flat wall, and it is where the bartender stands to work. It is never closed up.\n" +
  "50% to 100% (the TOP HALF) — THE BACK BAR, standing beyond that walkway and therefore reading as " +
  "DISTINCTLY FARTHER AWAY than the counter.\n\n" +

  "CAMERA. We stand in the room on the PATRON side, behind where the seats would be and a little ABOVE them, " +
  "looking slightly DOWN and across the counter toward the service side, SQUARE ON. There are THREE DEPTHS " +
  "— the empty patron side nearest, the counter next, the back bar farthest — and each must plainly be " +
  "farther away than the last.\n\n" +

  "COUNT THESE SIX FIXTURES BEFORE YOU FINISH. Every one of them is required and the plate is wrong without " +
  "any single one of them:\n" +
  "1. THE MARBLE COUNTER — a SINGLE CONTINUOUS FLAT SLAB of pale grey veined marble at ONE height end to " +
  "end, with a moulded walnut edge and a walnut-panelled front below it. NO raised rail, NO upper drink " +
  "shelf, NO second tier, NO step, NO ledge anywhere on it or behind it: one surface, one height. On it, " +
  "nothing but a folded bar towel at one end and a small empty nut bowl at centre — no glasses, no drinks.\n" +
  "2. THE BACK BAR — a run of handsome walnut back-bar shelving with a MIRROR behind it, carrying rows of " +
  "liquor bottles, each bottle a distinct shape, their labels drawn as plain blank rectangles with NO " +
  "lettering on them, and rows of hanging stemware above.\n" +
  "3. THE TELEVISION — centre, HIGH ON THE WALL ABOVE THE BACK BAR, a modern wall-mounted FLAT-SCREEN with a " +
  "NARROW black bezel; a television, not a picture frame. ITS SCREEN IS COMPLETELY BLANK: an empty pale " +
  "rectangle, no picture, no headline band, no letters, no marks, and no badge or nameplate on its frame.\n" +
  "4. THE CHALKBOARD — immediately RIGHT OF THE TELEVISION, in a dark wooden frame on the panelling, " +
  "COMPLETELY BLANK: an empty dark slate with no chalk writing, no words, no numbers, no marks.\n" +
  "5. THE TWO SCONCES — one brass wall sconce with a small pleated shade at EACH END of the back bar.\n" +
  "6. THE FRONT WINDOW — FAR LEFT, where the wall gives onto the street, its lower half frosted, carrying " +
  "the bar's name in gilt script SEEN FROM BEHIND: THE SWINGING DOOR, MIRRORED, reading backwards.\n" +
  "Dark walnut panelling in tall fielded panels wherever wall shows between them.\n\n" +

  "THERE IS NO LETTERING ANYWHERE IN THIS PICTURE except the mirrored gilt script of THE SWINGING DOOR on " +
  "the window. The screen is blank, the chalkboard is blank, every bottle label is blank, the television " +
  "frame is blank. Do not draw text-like marks as texture.\n\n" +
  "The attached image is a finished cartoon of THIS VERY BAR with the cast in it. Copy its ROOM EXACTLY — " +
  "the camera, the counter and its height, the depth to the back bar, the television, the chalkboard, the " +
  "window, the panelling, the light — and draw that same room EMPTY. Leave out its characters, its drinks, " +
  "its props and every word of its lettering; where a character stood there is only the room behind them.";

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
  // Reference-free head studies for the gentlemen, to test the same trick that
  // fixed Abby: when a tile teaches a fault, drawing from the text alone shows
  // whether the words were ever wrong or only ever outvoted.
  "drew-head":
    "A CLOSE PORTRAIT STUDY of Drew alone, HEAD AND SHOULDERS AND BOTH ARMS TO THE FINGERTIPS, filling " +
    "the sheet. His head is in THREE-QUARTER view, the long neck in its high S-curve, his gaze level and " +
    "going PAST the reader at something in his own room. THE BILL: slender, tucked to the face, dropping " +
    "steeply, the rear two thirds pale; along the OUTER THIRD ONLY the black IS the outline, continuing the " +
    "bill's own curve smoothly to a ROUNDED TIP, never hooking and never hanging below the line the pale " +
    "bill was travelling on, with one bright highlight ribbon inside it. The NOSTRIL is a plain thin slit " +
    "about HALF the length of his eye, with NO ring or outline around it. No shelf or ridge above the eye. " +
    "BOTH ARMS END IN HANDS: four fingers and one opposed thumb each, five digits drawn separately, short " +
    "white plumage to every tip, each tip blunt and soft with NO nail and NO claw — never a wingtip, never a " +
    "fan of primaries, never a mitt, never bare skin. One hand holds his martini by the stem. His long wing " +
    "feathers lie along his back and end at his hip; NOTHING hangs past his belt. His black bow tie has two " +
    "equal wings and a small centre knot, level on the white collar, with no band or strap at the neck.",
  "mango-head":
    "A CLOSE PORTRAIT STUDY of Mango alone, HEAD AND SHOULDERS AND BOTH HANDS, filling the sheet. His head " +
    "is in THREE-QUARTER view with BOTH EYES fully drawn on the paper and the bridge of his muzzle showing " +
    "between them, his gaze level and going PAST the reader. The BLACK LIP BAND runs from under his black " +
    "nose back about TWO NOSE-WIDTHS, ending directly under the front corner of his eye, and it is genuinely " +
    "BLACK. His eyes are bright and open with one clear catchlight each and the worry lives ONLY in his " +
    "raised inner brows — the corners of his mouth turn gently UP into a warm CLOSED-LIP smile and his " +
    "cheeks sit full and lifted. Three arcing rows of freckles on the muzzle. BOTH HANDS ARE DRAWN: " +
    "fur-backed, four fingers and one opposed thumb each, every finger separate, soft pads, and NO NAILS AND " +
    "NO CLAWS on any fingertip. His throat ruff is modest, never a heavy neck-beard. He wears his dark suit " +
    "jacket over a pale open-collared shirt with the flag pin on his LEFT lapel, and nothing else is written " +
    "or badged anywhere on his clothes. He has NO TAIL.",
  // THE TWO GENTLEMEN, SEATED CORNERWISE. Drawn reference-free, because it
  // exists to replace a picture that teaches the opposite.
  //
  // The founder chose to keep the over-the-shoulder depth AND get both eyes,
  // which means the gentlemen have to sit turned out from the bar rather than
  // flat-backed to it. Canon says so now, in measurements, and the drawing
  // ignored it in thirty-five confirmed cases across one edition — because the
  // house shot on the reference board has both of them in profile, and the
  // reference out-votes the text every time it disagrees with it.
  //
  // A reference cannot be bootstrapped out of itself. This is the same move
  // that fixed Abby's eyes after six candidates drawn beside her own bad tile
  // came back with the same bad eyes: stop showing the picture, draw from the
  // words alone, and promote the result.
  duo:
    "TWO GENTLEMEN SEATED SIDE BY SIDE AT A BAR, seen from BEHIND AND A LITTLE ABOVE, filling the sheet from " +
    "the chest up. DREW is frame-LEFT and MANGO is frame-RIGHT. EACH IS TURNED A QUARTER OUTWARD FROM THE " +
    "BAR: the turn is in the SHOULDERS AND CHEST, not the neck, so each man's body sits at about FORTY-FIVE " +
    "DEGREES to the counter rather than square to it, his outer shoulder nearest us and his chest already " +
    "coming round before his head does. He is neither flat-backed to us nor square to us — he sits " +
    "cornerwise, and we see his back and his outer shoulder nearest. Drew is turned to his RIGHT toward " +
    "Mango; Mango is turned to his LEFT toward Drew, and they are looking at each other. " +
    "BECAUSE THE BODY HAS DONE THE TURNING, BOTH EYES OF BOTH MEN ARE DRAWN ON THE PAPER. COUNT THEM: FOUR " +
    "EYES IN THIS DRAWING. On each face the FAR eye is at least HALF THE WIDTH of the near one, with the " +
    "bridge of the muzzle or bill showing between the two. Neither head is screwed round on a body still " +
    "facing the bar, and neither man is drawn side-on: a face showing one eye is the whole fault this study " +
    "exists to correct. DREW'S BILL therefore crosses the picture at an ANGLE, coming toward us as well as " +
    "across, never lying flat and side-on like a weathervane. " +
    "A plain marble counter crosses the picture in front of them at chest height with a martini before Drew " +
    "and an old fashioned before Mango; nothing else is on it, and NOTHING is lettered anywhere in the " +
    "drawing. Behind them the sheet is bare — no back bar, no bottles, no television, no chalkboard, " +
    "no window, and NOBODY else in the picture.",

  // A HEAD study, not a figure study. The fault this exists to fix lives in the
  // eyes, and at knees-up they render about forty pixels across -- too small to
  // carry a white, an iris and a pupil, and too small to judge. Close in, they
  // are the size of the drawing.
  "abby-head":
    "A CLOSE PORTRAIT STUDY of Abby alone, HEAD AND SHOULDERS ONLY, filling the sheet — the top " +
    "of her head near the top edge and the frame cutting her at the collarbone. Her head is in " +
    "THREE-QUARTER view, turned slightly to her right and tipped a little down, her chin lifted " +
    "just enough to read as composed and self-possessed. HER FACE IS EXACTLY THE FACE OF HER EXISTING STUDY: a small fluffy " +
    "show-groomed head, ROUND AND SOFT, with a SHORT square muzzle buried in the fluff of her cheeks and " +
    "the small black nose sitting CLOSE under her eyes — NO long snout, nothing sharp or foxish anywhere. " +
    "Her face reads soft, pretty, warm and unmistakably FEMININE. " +
    "Her gaze goes off to the side of the " +
    "frame, level and unhurried, at something in her own room — SHE IS NOT LOOKING AT THE READER " +
    "and her eyes are not centred on the lens. THE EYES ARE THE SUBJECT OF THIS DRAWING and are " +
    "rendered larger and in more detail than anything else on the sheet. Each eye is a wide " +
    "ALMOND, longer than it is tall, tilted very slightly up at the outer corner, with a defined " +
    "inner corner and a defined outer corner. Inside each: a CLEAR WHITE OF THE EYE showing as a " +
    "visible wedge on BOTH sides of the iris; a large drawn IRIS as a complete circle with fine " +
    "radiating lines inside it and a darker ring around its edge; a distinct round PUPIL at the " +
    "centre of the iris, clearly smaller than it; and EXACTLY ONE small white catchlight high on " +
    "the iris. A fine dark upper lid line thickens toward the outer corner, with LASHES, and a " +
    "softer lower lid line beneath. The two eyes match each other. Her expression is warm, " +
    "amused and knowing — a woman who has heard everything and is still glad you came in. Her " +
    "studded leather collar with its teardrop gem sits at her throat, the fur of her cheeks and " +
    "the fringe over her brow drawn stroke by stroke, and the open collar of her blouse just " +
    "reaching the bottom edge of the frame. THE LONG FUR STOPS AT HER JAWLINE: her throat and " +
    "the top of her chest are short, fine and close-lying, sleek rather than shaggy, with no " +
    "ruff, no tufts, no mane and no neck-beard anywhere below the jaw. HER FIGURE IS SLIM AND HER BUST IS " +
    "SMALL AND NATURAL: the placket of the blouse runs very nearly straight down her front and the front " +
    "of it reads as one gentle plane. What the open collar shows is her THROAT and her COLLARBONE.",
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
        "The bar is otherwise completely empty and the two of them are crammed into one corner of it, sharing a single stretch of marble with the nut bowl wedged between them, Mango's elbow already surrendered — stage on the counter, not the foot rail. The television picture shows A cabin cross-section, three seats abreast, drawn with no aisle anywhere in it.",
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
        "Abby sets Drew's martini in front of him — a long three-olive pick carrying exactly one olive, which is this panel's one licensed exception to the three-olive rule — and screws the lid back onto the olive jar before it goes below the counter. The television picture shows A checkout belt carrying four items and a receipt long enough to hang off the end of it.",
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
        "Mango has taken his hand off his glass and laid it flat over his flag pin, eyes on the screen, and the posture must read as entirely sincere — never comic — while Drew, mid-sip, watches Mango rather than the television. The television picture shows A trading floor with every head turned the same direction and nobody moving.",
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
        "Abby slides Mango's old fashioned across the marble — one large cube, one dark cherry — past the check spindle, where a renewal envelope thick as a paperback is spiked and still sealed, tall enough to bury the spindle. The television picture shows A small tidy house standing behind a mailbox too full to close — no people in the shot.",
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
        "Drew's phone lies face-down on the marble under one economical feather-digit with a signed chit beside it, while Mango, straight from the course, still has his glove tucked in his belt. The television picture shows One chart carrying two lines, both going the same way down.",
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
        "Mango turns his key fob over and over on the finance desk with a folded rate sheet pinned under his elbow, while Drew holds a styrofoam cup of the dealership's coffee at arm's length, untasted. CAMERA: eye level, close in, BOTH of them filling the frame from the chest to the BELT, where the bottom edge of the panel cuts them — nothing below the belt is in frame, no legs and no feet — with the place reading clearly behind them, never a wide landscape with small whole figures in it. Each character is seen in THREE-QUARTER view, angled into the frame so the face and both eyes are readable, turned toward each other rather than toward us. NOBODY looks out of the panel at the reader. They are the only figures in the picture: no other people anywhere, near or far. THE PLACE CARRIES THIS CARTOON'S OWN JOKE ON ITS OWN SIGNAGE: sign 1 reads exactly and only \"FINANCING FROM 8.4% APR\"; sign 2 reads exactly and only \"YOUR TRADE-IN HAS BEEN VERY PATIENT\". Those are the ONLY lettered surfaces in the panel; every other surface is blank.",
      setting:
        "the customer lounge of a truck dealership: a glass showroom wall behind them with one new pickup parked beyond it, a finance desk in front of them, and plain low seating",
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
        "Mango tips the top inch of his old fashioned into an empty glass, sets that glass firmly aside, and only then lifts his own; Drew watches with mild interest. The television picture shows A house standing in a puddle beneath a very small umbrella.",
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
        "Drew's glass is already up toward the screen while Mango turns the bar's wall calendar forward a page with one broad finger. The television picture shows A policy-rate staircase with the final step already drawn in and inked solid.",
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
        "Mango reads from a receipt long enough that the end of it hangs over the edge of the marble, and Drew has stopped his martini halfway up, head tilted toward the reading with the courteous attention of a man hearing an away score come in. The television picture shows One paper grocery sack sitting on a butcher's scale.",
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
        "Mango holds a long register receipt flat across the marble with both hands, the way a man holds a treaty, while Drew reads it upside down from his side without lowering his martini. The television picture shows A department-store floor under a SALE banner, the manager shaking hands with a customs officer.",
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
        "Abby is mid-pour from a labelled bottle into Mango's rocks glass, towel on her left shoulder and eyes down on the work, while Mango turns to Drew to say it and Drew's eye stays on the label. The television picture shows Two lecterns in two different rooms, filmed at the same height, the same empty chairs behind each.",
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
        "Abby sets the bar check down between them and goes back to her towel; Mango takes it in both hands at reading distance while Drew, martini at rest, does not touch it and plainly is not going to. The television picture shows A flat, obedient line and an anchor caught mid-nod.",
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

    // The default is the model production actually draws with. It used to be
    // "the newest succeeded training run", from when a fine-tune was the
    // candidate under test — and that default outlived the fine-tune: three
    // panels were drawn on the retired LoRA tonight while the caller believed
    // they were comparing two settings of the house model. Reaching for a
    // training run is now something you ask for by name.
    let version = params.get("version");
    if (version === "lora") {
      version = null;
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
    if (!version) version = imageModel();
    if (version.includes("kontext") && params.get("baseline") !== "1") {
      return NextResponse.json(
        { error: "Kontext is the retired baseline, not the candidate. Pass baseline=1 to deliberately smoke it (e.g. after changing its reference boards)." },
        { status: 400 }
      );
    }

    // ?quality=low|medium|high — the house model's variant dial, per request.
    // Medium is ~$0.047 an image against high's ~$0.128, so this is how a
    // single panel gets asked for more effort without a deploy. It is carried
    // to the call as an argument and never written to process.env: two
    // overlapping requests share one warm function instance, and a comparison
    // that set the environment had the second request's dial land on the
    // first's render -- two panels at the same setting, each log claiming
    // otherwise.
    const asked = params.get("quality");
    const quality = asked && ["low", "medium", "high", "auto"].includes(asked) ? asked : undefined;
    const qualityLabel = quality ?? process.env.IMAGE_QUALITY ?? "medium (default)";

    const scale = params.get("scale");
    if (scale && Number(scale) > 0) {
      // Per-request override of the strength dial for the retired fine-tune
      // path. This writes a process global, and the claim that once stood
      // here -- that a function instance handles one request at a time -- is
      // not true: two overlapping smoke requests demonstrably shared one
      // instance and traded dials. Harmless while nothing but a deliberate
      // version=lora run reads it; move it to an argument, as quality now is,
      // before trusting it again.
      process.env.LORA_SCALE = scale;
    }

    // ?probe=<text> — moderation bisection for baseline debugging: generate
    // once from the given text with Drew's board, report pass or flag,
    // commit nothing. Only meaningful with baseline=1.
    const probe = params.get("probe");
    if (probe && params.get("baseline") === "1") {
      try {
        await generateCartoonArt({ prompt: probe, characters: ["drew"], model: version, quality });
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
      // THE PLATE IS DRAWN FROM THE WORDS, NOT FROM THE CONCEPTS. The two crops
      // below are the founder's own early bar panels, and he has since said
      // plainly that they are concepts and not the target. They are also where
      // the staging fault came from: both are shot flat, the counter low across
      // the picture with the bar furniture pressed in behind the figures and no
      // walkway anywhere. A plate drawn while they are attached inherits that
      // flatness however the text is worded, because the reference out-votes the
      // text. So references are OFF here by default and ?refs=1 is the way back
      // in, kept only because the fixtures were carried by those crops once and
      // a fixture-less plate is worth diagnosing against.
      const plateNoRef = params.get("refs") !== "1";
      const image = await generateCartoonArt({
        prompt: SET_PLATE_PROMPT,
        characters: [],
        barScene: false,
        model: version,
        quality,
        noReferences: plateNoRef,
        references: [
          // The finished panel whose room the founder accepted — no longer the
          // concept crops, whose flat camera taught the worst staging fault.
          // The plate's one job is to be that room with NOBODY in it: a
          // staging reference containing any character summons that character
          // — an Abby-bearing plate put an uncast Abby into panel after
          // panel, and a Mango-bearing one held him in one-eyed profile.
          { path: "canon/vision/staging-plate.jpg" },
        ],
      });
      await commitFiles(
        [
          { path: "canon/vision/studies/room.png", content: image },
          { path: "canon/vision/studies/room.txt", content: `${version}\nIMAGE_QUALITY=${qualityLabel}\n\n${SET_PLATE_PROMPT}\n` },
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
      // A study key may name a framing as well as a character ("abby-head").
      // The cast name is what the reference lookup and the character fences
      // both key off, so strip the framing before either sees it.
      const subject = who.replace(/-(head|bust|figure)$/, "");
      // A study key usually names one character. "duo" names the pair, and the
      // cast list is what the character fences and the reference lookup both
      // key off, so it has to be expanded before either sees it.
      const cast = who === "duo" ? ["drew", "mango"] : [subject];
      // The standing ground forbids furniture, which is right for a portrait and
      // wrong for a study of two men sitting at a counter.
      const ground =
        who === "duo"
          ? "a plain sheet of cream drawing paper behind them — no room, no wall, no back bar, no window, " +
            "no horizon and no shading behind the figures, and no lettering, caption, label, signature or " +
            "border anywhere on the sheet"
          : STUDY_GROUND;
      const prompt = assemblePrompt(
        canonText,
        { scene: STUDIES[who], setting: ground, characters: cast },
        false,
        false,
        isMultiRef(version)
      );
      // ?noref=1 draws from the text alone, with NO reference tile attached.
      // This exists because a reference cannot be bootstrapped out of itself:
      // six candidates drawn while Abby's black-button tile was attached came
      // back with black-button eyes, and the inspection called one "a re-render
      // of the problem, not a fix." When the picture is the thing that is
      // wrong, the only way to get a better picture is to stop showing it.
      const noRef = params.get("noref") === "1";
      const image = await generateCartoonArt({
        prompt,
        characters: cast,
        barScene: false,
        model: version,
        quality,
        noReferences: noRef,
      });
      // ?candidate=1 files a stamped roll in a candidates folder and leaves the
      // canonical study alone. Searching for a better reference means drawing
      // a field of them and choosing; overwriting the one good copy on every
      // attempt would make the search destroy its own baseline.
      const asCandidate = params.get("candidate") === "1";
      const base = asCandidate
        ? `canon/vision/studies/candidates/${who}-${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15).replace("T", "-")}`
        : `canon/vision/studies/${who}`;
      await commitFiles(
        [
          { path: `${base}.png`, content: image },
          { path: `${base}.txt`, content: `${version}\nIMAGE_QUALITY=${qualityLabel}\n\n${prompt}\n` },
        ],
        `canon: ${asCandidate ? "candidate " : ""}character study for ${who}`
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
    // Seconds, not minutes: two rolls fired inside the same minute -- which is
    // exactly what a quality comparison does -- used to land on the same name,
    // and the second silently overwrote the first.
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15).replace("T", "-");

    const started = Date.now();
    const made: string[] = [];
    const skipped: string[] = [];
    const failed: { slug: string; error: string }[] = [];

    // ?after=<YYYYMMDD-HHMM> — skip any panel that already has a roll stamped
    // at or after that moment. A full set is a dozen renders spaced twelve
    // seconds apart to stay under Replicate's rate limit, which is several
    // times a function's lifetime, so a set is always drawn over several
    // calls. Without this each call restarted at panel one and paid again for
    // work already committed.
    const after = params.get("after");
    let alreadyDrawn = new Set<string>();
    if (after) {
      const existing = await listRepoDir(OUT_DIR).catch(() => [] as string[]);
      alreadyDrawn = new Set(
        existing
          .filter((name) => name.endsWith(".png"))
          .map((name) => {
            // <stamp>-<slug>.png, where the stamp is date-time to the minute
            // or to the second; the slug is everything after it.
            const match = name.match(/^(\d{8}-\d{4,6})-(.+)\.png$/);
            return match && match[1] >= after ? match[2] : "";
          })
          .filter(Boolean)
      );
    }

    let first = true;
    for (const panel of chosen) {
      if (alreadyDrawn.has(panel.slug)) {
        skipped.push(panel.slug);
        continue;
      }
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
          quality,
        });
        const name = `${stamp}-${panel.slug}`;
        await commitFiles(
          [
            { path: `${OUT_DIR}/${name}.png`, content: image },
            {
              path: `${OUT_DIR}/${name}.txt`,
              content:
                `${version}\nIMAGE_QUALITY=${qualityLabel}\n` +
                `LORA_SCALE=${process.env.LORA_SCALE ?? "0.9 (default)"}\n` +
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
      skipped,
      remaining: chosen.length - made.length - skipped.length - failed.length,
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
