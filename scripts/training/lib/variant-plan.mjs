// The Harrington probe plan — the generated images now chase the founder's
// vision plates (canon/vision/), not the retired sheet canon. One file still
// owns what gets generated, from which references, with which instruction:
// make-variant-refs.mjs builds the boards, and the production
// /api/backroom/variants route spends real money following the plan.

import { VARIANT_PLACES } from "./places.mjs";

export const VARIANT_DIR = "scripts/training/setting-variants";
export const REF_DIR = "scripts/training/variant-refs";

// Ceiling counts ALL committed variants (23 legacy images remain on disk as
// history until the v2 set replaces them).
export const MAX_VARIANTS = 40;

// Reference tiles cut straight from the founder's plates.
// The duo conditions on plate 1's lower panel — Harrington's own drawing.
// (A round of chaining on the studio's own output degraded faces and
// lettering; first-generation conditioning keeps the plate's crispness.)
const DUO_PANEL = { body: { src: "canon/vision/plate-1-security-and-martini-menu.jpg", box: [16, 1460, 1600, 1140] } };
// Object anchors the plate panel lacks: Mango's flag lapel pin and his old
// fashioned, gripped in his fur-backed hand — pixels beat words for these.
const MANGO_DETAIL = { body: { src: "canon/vision/mango-reference.jpg", box: [600, 2600, 1500, 1000] } };
const ABBY_REF = { body: { src: "canon/vision/abby-face-reference.jpg", box: [0, 0, 1640, 2140] } };
// v2 dataset tiles: Drew's security-line bust, Mango's own solo panel, and
// the 19th-hole regions of plate 4 for the away games.
const DREW_BUST = { body: { src: "canon/vision/drew-reference.jpg", box: [0, 0, 1450, 2450] } };
const MANGO_PANEL = { body: { src: "canon/vision/mango-reference.jpg", box: [110, 580, 2770, 3390] } };
const MANGO_GOLF = { body: { src: "canon/vision/plate-4-nineteenth-hole-and-tariffs.jpg", box: [750, 1100, 860, 930] } };
const GOLF_VISTA = { body: { src: "canon/vision/plate-4-nineteenth-hole-and-tariffs.jpg", box: [520, 990, 650, 315] } };
// A face-free engraving swatch (suit tweed, furred hand, glass, studded
// leather, bar wood) — technique without a second face to blend with.
const STYLE_SWATCH = { body: { src: "canon/vision/mango-reference.jpg", box: [400, 2700, 2100, 1250] } };

const STYLE =
  "Draw in EXACTLY the reference's antique-steel-engraving style: fine pen crosshatching and stippling on " +
  "every surface, fur and feathers in individual strokes, full tonal range from rich blacks to bright paper " +
  "highlights, the panel composed full corner to corner. Black-and-white only, no photographic rendering. ";

const ROOM =
  "The scene is The Swinging Door, an upscale ground-floor bar a block off Wall Street — polished marble " +
  "bar top, fine walnut-paneled walls, brass and good glassware, studded leather club chairs and handsome " +
  "stools, bottles of distinct shapes proudly displayed on the back bar with golf-pun labels, a shared bowl " +
  "of bar nuts, napkins under every glass. Never a dive — polished and current. ";

// Abby's face brief — proven wording (round twelve), shared by every cast
// that draws her.
const ABBY_FACE_NOTE =
  "LEFT on the reference: Abby's face — copy its BEAUTY and CHARM exactly: a glamorous, feminine West " +
  "Highland White Terrier in her mid-forties, with a compact pretty face, short muzzle, LARGE glossy " +
  "dark eyes with bright catchlights and long lashes, softly arched brows, a small black nose, a WARM " +
  "closed-lip smile, silky groomed white fur, and two small pricked ears — both ears up. She is " +
  "beautiful — alluring, elegant, seasoned and self-assured — never stiff, never staring, never eerie, " +
  "never tongue-out, never a shepherd or wolf. She wears her studded leather collar with its small " +
  "teardrop gem pendant. RIGHT on the reference: a texture swatch only — no figure in it to draw — " +
  "showing the antique-engraving technique for the room, the clothes, and the bar; her face itself " +
  "stays soft, luminous, and lovely, modeled with delicate shading rather than heavy stipple. Draw " +
  "Abby ALONE. ";

// Drew's identity brief — the security-line bust beside a technique swatch.
const DREW_FACE_NOTE =
  "LEFT on the reference: Drew — copy him exactly: a white-plumed flamingo gentleman with a deep " +
  "question-mark neck, heavy-lidded deadpan eyes, a heavy downturned black-tipped beak at exactly the " +
  "reference's scale, starched collar band under his black silk BOW TIE, knitted sweater vest over a " +
  "pale collared shirt, and WHITE-FEATHERED humanoid hands — four feathered fingers and an opposed " +
  "thumb. ";

// The upright-at-work body brief for Abby, minus the action (each cast adds
// its own), in the vocabulary that passes both the filter and the founder.
const ABBY_BODY =
  "Draw her as the successful proprietor in her mid-forties, standing upright at work like the strip's " +
  "other characters: an attractive, shapely, trim feminine figure with a modest bust, a fitted light " +
  "blouse with rolled sleeves open at the collar, folded towel on her left shoulder, the studded " +
  "gem-pendant collar at her neck, ";

export const CASTS = [
  {
    id: "harrington-duo",
    tokens: "Drew and Mango",
    who: "the white flamingo gentleman and the golden retriever gentleman",
    tiles: [DUO_PANEL, MANGO_DETAIL],
    redraw:
      "Keep those faces, hands, drinksware grips, and the engraved style EXACTLY as the reference draws " +
      "them; the composition and Mango's wardrobe follow the description below, not the reference. ",
    tileNote:
      "The reference panel supplies the two characters — take every character detail from it. Drew, the " +
      "white-plumed flamingo gentleman: deep question-mark neck, heavy-lidded deadpan eyes, heavy " +
      "downturned black-tipped beak at exactly the reference's scale, starched collar band under his " +
      "black silk BOW TIE, knitted sweater vest over a pale collared shirt, and " +
      "WHITE-FEATHERED humanoid hands — four feathered fingers and an opposed thumb — holding his " +
      "MARTINI by the stem. Mango, the golden retriever gentleman: true black dog lips along the muzzle, " +
      "freckles, long-fringed drop ears, a wristwatch, and FUR-BACKED dog-yet-humanoid hands with soft " +
      "pads, every finger distinctly drawn, never bare human skin on either gentleman. The SECOND, " +
      "smaller reference tile shows how Mango dresses and drinks tonight: copy his clothes from that " +
      "tile exactly, with the small US FLAG PIN on his left lapel, and put his OLD FASHIONED — the " +
      "short rocks glass with one large cube and a dark cherry, straight from that tile — in his " +
      "fur-backed hand in place of any martini. ",
    extra:
      "THE COMPOSITION, drawn as ONE SINGLE continuous panel: the long bar counter crosses the frame, " +
      "and the gentlemen sit at its NEAR side on handsome stools, seen from the side so both faces stay " +
      "fully visible — the counter stands between the gentlemen and the back bar, because patrons never " +
      "sit where the bartender works. On the FAR side of the counter: the bottle shelves with the " +
      "labeled golf-pun bottles, and the chalkboard martini menu on the wall above; the mirrored " +
      "Swinging Door window sign at the frame's edge. On the counter: Drew's martini with olives on its " +
      "coaster at frame-left, Mango's OLD FASHIONED — a short rocks glass, one large cube, a dark " +
      "cherry — on its coaster at frame-right, and the shared nut bowl between them. Each gentleman " +
      "keeps his own clothes: Drew wears EXACTLY what the reference panel dresses him in — the knitted " +
      "sweater vest over a pale collared shirt, starched collar band, black BOW TIE; Mango wears " +
      "EXACTLY what the second tile dresses him in, its US FLAG PIN — tiny stars and stripes — on his " +
      "left lapel. Drew deadpan, Mango faintly worried — successful gentlemen in their " +
      "mid-forties, classy and composed. ",
  },
  {
    id: "harrington-abby",
    tokens: "Abby",
    who: "the West Highland terrier proprietor",
    tiles: [ABBY_REF, STYLE_SWATCH],
    tileNote: ABBY_FACE_NOTE,
    extra:
      "Composition: WAIST-UP, camera pulled back — she stands BEHIND her own marble bar counter with the " +
      "marble visible in the foreground, the counter hiding her below the waist. " +
      ABBY_BODY +
      "one hand resting on the marble, head tilted with a warm " +
      "knowing smile — poised, charming, and in command — bottles and good glassware behind her. ",
  },
  {
    id: "harrington-abby2",
    tokens: "Abby",
    label: "the proprietor at her marble",
    who: "the West Highland terrier proprietor",
    tiles: [ABBY_REF, STYLE_SWATCH],
    tileNote: ABBY_FACE_NOTE,
    extra:
      "Composition: WAIST-UP, camera pulled back — she stands BEHIND her own marble bar counter with the " +
      "marble visible in the foreground, the counter hiding her below the waist. " +
      ABBY_BODY +
      "one hand resting on the marble, head tilted with a warm knowing smile — poised, charming, and in " +
      "command — bottles and good glassware behind her. ",
  },
  {
    id: "harrington-abby-working",
    tokens: "Abby",
    label: "pouring behind the bar",
    who: "the West Highland terrier proprietor",
    tiles: [ABBY_REF, STYLE_SWATCH],
    tileNote: ABBY_FACE_NOTE,
    extra:
      "Composition: WAIST-UP behind her own marble bar counter, the marble visible in the foreground. " +
      ABBY_BODY +
      "POURING from a labeled bottle into a short rocks glass on the marble, her eyes on the pour, a warm " +
      "knowing smile — poised and in command — bottles and good glassware behind her. ",
  },
  {
    id: "harrington-abby-chalk",
    tokens: "Abby",
    label: "writing the special",
    who: "the West Highland terrier proprietor",
    tiles: [ABBY_REF, STYLE_SWATCH],
    tileNote: ABBY_FACE_NOTE,
    extra:
      "Composition: behind the bar beside the back-bar shelves, seen WAIST-UP past the marble counter. " +
      ABBY_BODY +
      "reaching up with a stick of chalk to write the day's special on a small dark chalkboard mounted " +
      "among the bottles, glancing back over her shoulder with a warm knowing smile. The chalkboard so " +
      "far reads only: TODAY —. ",
  },
  {
    id: "harrington-drew-solo",
    tokens: "Drew",
    label: "a martini, undisturbed",
    who: "the white flamingo gentleman",
    tiles: [DREW_BUST, STYLE_SWATCH],
    tileNote:
      DREW_FACE_NOTE +
      "RIGHT on the reference: a texture swatch only — no figure in it to draw — the engraving technique " +
      "for the room and the bar. Draw Drew ALONE. ",
    extra:
      "Composition: Drew sits alone on a handsome stool at the NEAR side of the marble bar counter, seen " +
      "from the side, his conical stemmed MARTINI with olives on a pick standing on a napkin on the " +
      "marble before him; ACROSS the counter the bottle shelves rise, with a small dark chalkboard among " +
      "them; the mirrored Swinging Door window sign at the frame's edge. He also wears trousers. Deadpan, " +
      "classy, mid-forties. ",
  },
  {
    id: "harrington-drew-golf",
    tokens: "Drew",
    label: "the 19th hole",
    who: "the white flamingo gentleman",
    tiles: [DREW_BUST, GOLF_VISTA],
    tileNote:
      DREW_FACE_NOTE +
      "RIGHT on the reference: the golf-course vista of the strip's 19th hole — fairways, distant " +
      "golfers, a cart — the setting to place him in. Draw Drew ALONE. ",
    extra:
      "Composition: Drew stands at the 19th-hole terrace with his MARTINI held by the stem, wearing a " +
      "pale golf VISOR — his one golf addition; the bow tie and sweater vest stay exactly as the " +
      "reference draws them — the fairway vista rolling behind him with distant golfers and a cart, a " +
      "framed sign at the edge reading THE SWINGING DOOR 19TH HOLE. Deadpan, classy, mid-forties. ",
  },
  {
    id: "harrington-mango-solo",
    tokens: "Mango",
    label: "the news, taken neat",
    who: "the golden retriever gentleman",
    tiles: [MANGO_PANEL],
    tileNote:
      "The reference is ONE finished panel of the exact scene to draw — recreate it as ONE SINGLE " +
      "continuous panel: Mango the golden retriever gentleman alone at the bar counter of The Swinging " +
      "Door — true black dog lips along the muzzle, freckles, long-fringed drop ears, his dark evening " +
      "jacket over a pale open-collared shirt with the small US flag pin on the left lapel, a wristwatch, " +
      "FUR-BACKED dog-yet-humanoid hands with soft pads, his old fashioned with one large cube and a " +
      "dark cherry, the TV above the back bar playing the news, the mirrored window sign, the bottles. ",
    extra:
      "Where the reference photo cuts off at its left edge, complete the panel naturally: the FULL " +
      "flatscreen TV and the back bar continue inside the drawing. Mango faintly worried — classy, " +
      "composed, mid-forties. ",
  },
  {
    id: "harrington-mango-golf",
    tokens: "Mango",
    label: "the 19th hole",
    who: "the golden retriever gentleman",
    tiles: [MANGO_GOLF],
    tileNote:
      "The reference shows Mango the golden retriever gentleman at the 19th-hole terrace of the golf " +
      "course — recreate him exactly as ONE SINGLE continuous panel: true black dog lips along the " +
      "muzzle, freckles, long-fringed drop ears, white polo shirt with the small US flag pin, pale golf " +
      "cap, wristwatch, and FUR-BACKED dog-yet-humanoid hands with soft pads holding his short rocks " +
      "glass with one large cube and a dark cherry. Draw Mango ALONE. ",
    extra:
      "Behind him the golf-course vista: rolling fairways, distant golfers, a cart, his golf bag " +
      "standing at the edge. Faintly worried, classy, mid-forties. ",
  },
  {
    id: "harrington-trio",
    tokens: "Drew, Mango and Abby",
    label: "the whole house",
    who: "the flamingo gentleman, the retriever gentleman, and the terrier proprietor",
    tiles: [DUO_PANEL, ABBY_REF],
    redraw:
      "Keep every face, every hand, every drink, and the engraved style EXACTLY as the references draw " +
      "them; the composition follows the description below. ",
    tileNote:
      "The FIRST reference panel supplies the two gentlemen exactly as they must be drawn: Drew the " +
      "white-plumed flamingo gentleman — question-mark neck, heavy-lidded deadpan eyes, black-tipped " +
      "beak at the panel's scale, collar band and black BOW TIE, knitted sweater vest, WHITE-FEATHERED " +
      "humanoid hands, his MARTINI — and Mango the golden retriever gentleman — true black dog lips, " +
      "freckles, drop ears, wristwatch, FUR-BACKED dog-yet-humanoid hands. The SECOND reference shows " +
      "the face of Abby, the West Highland White Terrier proprietor — copy her pretty compact face, " +
      "LARGE glossy dark eyes with catchlights, small black nose, warm smile, silky white fur, small " +
      "pricked ears, and her studded leather collar with its teardrop gem pendant, exactly. ",
    extra:
      "THE COMPOSITION, one single continuous panel: Abby stands BEHIND the marble bar counter working, " +
      "in a fitted light blouse with rolled sleeves and a folded towel on her left shoulder, standing " +
      "upright like the gentlemen, with fur-backed dog-yet-humanoid hands; Drew and Mango sit ACROSS " +
      "the counter from her on handsome stools — Drew frame-left with his martini, Mango frame-right " +
      "with his old fashioned (short rocks glass, one large cube, a dark cherry), the shared nut bowl " +
      "between them on the marble — and the bottle shelves rise on Abby's side behind her. Exactly " +
      "three characters. ",
  },
];

// cast id -> place ids (places kept for module compatibility; the Harrington
// probes all play in the bar).
export const PLAN = [
  ["harrington-duo", ["barroom"]],
  ["harrington-abby", ["barroom"]],
  ["harrington-abby2", ["barroom"]],
  ["harrington-abby-working", ["barroom"]],
  ["harrington-abby-chalk", ["barroom"]],
  ["harrington-drew-solo", ["barroom"]],
  ["harrington-drew-golf", ["golf course"]],
  ["harrington-mango-solo", ["barroom"]],
  ["harrington-mango-golf", ["golf course"]],
  ["harrington-trio", ["barroom"]],
];

function placeOf(placeId) {
  const base = placeId.replace(/-\d+$/, "");
  const place = VARIANT_PLACES.get(base);
  if (!place) throw new Error(`variant plan names unknown place "${placeId}"`);
  return place;
}

/** Every run in the plan: { id, cast, placeId, place }. */
export function runs() {
  const byId = new Map(CASTS.map((c) => [c.id, c]));
  const all = [];
  for (const [castId, placeIds] of PLAN) {
    const cast = byId.get(castId);
    if (!cast) throw new Error(`variant plan names unknown cast "${castId}"`);
    for (const placeId of placeIds) {
      const slug = placeId.replace(/\s+/g, "-");
      all.push({ id: `${castId}-${slug}`, cast, placeId, place: placeOf(placeId) });
    }
  }
  if (all.length > MAX_VARIANTS) {
    throw new Error(`the variant plan lists ${all.length} runs — past the ${MAX_VARIANTS}-image ceiling`);
  }
  const ids = new Set(all.map((r) => r.id));
  if (ids.size !== all.length) throw new Error("duplicate run ids in the variant plan");
  return all;
}

// Scene dressing per run: the TV and chalkboard tell the same joke.
const SCENES = {
  "harrington-duo-barroom":
    "Every board and bottle label keeps its hand-lettering short, straight, and legible, spelled exactly " +
    "as the panel spells it. ",
  "harrington-abby-barroom":
    "Behind her, among the bottles, a small dark chalkboard with hand-lettered chalk capitals reading, " +
    "spelled letter-perfect with no words repeated: THE HOUSE PROTECTS ITS OWN. ",
};

/** The Kontext instruction for one run. */
export function instruction(run) {
  // A cast that redirects composition or wardrobe overrides the blanket
  // redraw-exactly line — "same wardrobe, nothing invented" was silently
  // countermanding every requested correction.
  return (
    run.cast.tileNote +
    (run.cast.redraw ??
      `Redraw ${run.cast.who} EXACTLY as the reference draws them — same faces, same wardrobe, same construction, ` +
        `nothing invented. `) +
    STYLE +
    (run.placeId === "barroom" ? ROOM : "") +
    (SCENES[run.id] ?? "") +
    run.cast.extra +
    `No speech balloons, no floating caption text, no signature, no watermark; the only lettering is the ` +
    `named signage, short and hand-lettered.`
  );
}

/** The display caption for one run's image (probe showcase, not training). */
export function caption(run) {
  if (run.cast.label) return `${run.cast.tokens} — ${run.cast.label}`;
  return `${run.cast.tokens} at The Swinging Door — first studio study after the Harrington plates`;
}
