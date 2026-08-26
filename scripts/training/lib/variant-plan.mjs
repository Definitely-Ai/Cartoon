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
// The duo conditions on plate 1's lower panel — Harrington's own drawing of
// the two at the bar, martini in Drew's hand — so the scene's gravity works
// for the plan instead of against it.
const DUO_PANEL = { body: { src: "canon/vision/plate-1-security-and-martini-menu.jpg", box: [16, 1460, 1600, 1140] } };
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
    tiles: [DUO_PANEL],
    tileNote:
      "The reference is ONE finished panel of the exact scene to draw — recreate it as ONE SINGLE " +
      "continuous panel of The Swinging Door: Drew the white-plumed flamingo gentleman seated frame-left, " +
      "Mango the golden retriever gentleman seated frame-right, the chalkboard martini menu, the drink-" +
      "special board, the labeled golf-pun bottles, the nut bowl between them, the mirrored window sign. " +
      "Copy each character exactly as the panel draws him: Drew — deep question-mark neck, heavy-lidded " +
      "deadpan eyes, heavy downturned black-tipped beak at exactly the panel's scale, starched collar band " +
      "under his black silk BOW TIE (never a long necktie), knitted sweater vest over a pale collared " +
      "shirt, and WHITE-FEATHERED humanoid hands — four feathered fingers and an opposed thumb — holding " +
      "his MARTINI by the stem. Mango — true black dog lips along the muzzle, freckles, long-fringed drop " +
      "ears, a wristwatch, and FUR-BACKED dog-yet-humanoid hands with soft pads, every finger distinctly " +
      "drawn, never bare human skin on either gentleman. ",
    extra:
      "Make exactly three corrections to the panel and nothing else. FIRST, seat both gentlemen on the " +
      "PATRON side of the bar: the long counter runs between them and the back bar — their handsome " +
      "chairs on the room side, drinks on the counter, and the bottle shelves standing ACROSS the counter " +
      "where the bartender works, never directly behind the patrons. SECOND, dress Mango in his dark " +
      "suit jacket over the pale open-collared shirt, the small US flag pin on the jacket's left lapel — " +
      "his evening wear. THIRD, replace Mango's martini with his old fashioned — short rocks glass, one " +
      "large cube, a dark cherry, on its coaster; Drew keeps his martini with olives exactly as drawn. " +
      "Everything else stays the panel's: composition, expressions, boards, bottles, nut bowl, window. " +
      "Both are successful gentlemen in their mid-forties — classy, composed; Drew deadpan, Mango " +
      "faintly worried. ",
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
  return (
    run.cast.tileNote +
    `Redraw ${run.cast.who} EXACTLY as the reference draws them — same faces, same wardrobe, same construction, ` +
    `nothing invented. ` +
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
