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
      "black silk BOW TIE (never a long necktie), knitted sweater vest over a pale collared shirt, and " +
      "WHITE-FEATHERED humanoid hands — four feathered fingers and an opposed thumb — holding his " +
      "MARTINI by the stem. Mango, the golden retriever gentleman: true black dog lips along the muzzle, " +
      "freckles, long-fringed drop ears, a wristwatch, and FUR-BACKED dog-yet-humanoid hands with soft " +
      "pads, every finger distinctly drawn, never bare human skin on either gentleman. The SECOND, " +
      "smaller reference tile shows Mango's two anchors: his small US FLAG PIN, copied onto his suit's " +
      "left lapel, and his OLD FASHIONED — the short rocks glass with one large cube and a dark cherry " +
      "gripped in his fur-backed hand — copied into his hand in place of any martini. ",
    extra:
      "THE COMPOSITION, drawn as ONE SINGLE continuous panel: the long bar counter crosses the frame, " +
      "and the gentlemen sit at its NEAR side on handsome stools, seen from the side so both faces stay " +
      "fully visible — the counter stands between the gentlemen and the back bar, because patrons never " +
      "sit where the bartender works. On the FAR side of the counter: the bottle shelves with the " +
      "labeled golf-pun bottles, and the chalkboard martini menu on the wall above; the mirrored " +
      "Swinging Door window sign at the frame's edge. On the counter: Drew's martini with olives on its " +
      "coaster at frame-left, Mango's OLD FASHIONED — a short rocks glass, one large cube, a dark " +
      "cherry — on its coaster at frame-right, and the shared nut bowl between them. Mango wears his " +
      "dark evening suit jacket over the pale open-collared shirt, the small US flag pin on the " +
      "jacket's left lapel. Drew deadpan, Mango faintly worried — successful gentlemen in their " +
      "mid-forties, classy and composed. ",
  },
  {
    id: "harrington-abby",
    tokens: "Abby",
    who: "the West Highland terrier proprietor",
    tiles: [ABBY_REF, STYLE_SWATCH],
    tileNote:
      "LEFT on the reference: Abby's face — copy its BEAUTY and CHARM exactly: a glamorous, feminine West " +
      "Highland White Terrier in her mid-forties, with a compact pretty face, short muzzle, LARGE glossy " +
      "dark eyes with bright catchlights and long lashes, softly arched brows, a small black nose, a WARM " +
      "closed-lip smile, silky groomed white fur, and two small pricked ears — both ears up. She is " +
      "beautiful — alluring, elegant, seasoned and self-assured — never stiff, never staring, never eerie, " +
      "never tongue-out, never a shepherd or wolf. She wears her studded leather collar with its small " +
      "teardrop gem pendant. RIGHT on the reference: a texture swatch only — no figure in it to draw — " +
      "showing the antique-engraving technique for the room, the clothes, and the bar; her face itself " +
      "stays soft, luminous, and lovely, modeled with delicate shading rather than heavy stipple. Draw " +
      "Abby ALONE. ",
    extra:
      "Composition: WAIST-UP, camera pulled back — she stands BEHIND her own marble bar counter with the " +
      "marble visible in the foreground, the counter hiding her below the waist. Draw her as the successful " +
      "proprietor in her mid-forties, standing upright at work like the strip's other characters: an " +
      "attractive, shapely, trim feminine figure with a modest bust, a " +
      "fitted light blouse with rolled sleeves open at the collar, folded towel on her left shoulder, the " +
      "studded gem-pendant collar at her neck, one hand resting on the marble, head tilted with a warm " +
      "knowing smile — poised, charming, and in command — bottles and good glassware behind her. ",
  },
];

// cast id -> place ids (places kept for module compatibility; the Harrington
// probes all play in the bar).
export const PLAN = [
  ["harrington-duo", ["barroom"]],
  ["harrington-abby", ["barroom"]],
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
    ROOM +
    (SCENES[run.id] ?? "") +
    run.cast.extra +
    `No speech balloons, no floating caption text, no signature, no watermark; the only lettering is the ` +
    `named signage, short and hand-lettered.`
  );
}

/** The display caption for one run's image (probe showcase, not training). */
export function caption(run) {
  return `${run.cast.tokens} at The Swinging Door — first studio study after the Harrington plates`;
}
