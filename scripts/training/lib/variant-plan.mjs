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
const DREW_REF = { body: { src: "canon/vision/drew-reference.jpg", box: [0, 0, 1450, 2450] } };
const MANGO_REF = { body: { src: "canon/vision/mango-reference.jpg", box: [300, 600, 2300, 2800] } };
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
    tiles: [DREW_REF, MANGO_REF],
    tileNote:
      "Draw ONE SINGLE continuous panel: the reference sheet's side-by-side layout must NOT appear — no " +
      "dividing line, no seam, no split; both characters share one unbroken room at one marble bar. The " +
      "reference shows the two characters exactly as they must be drawn: LEFT, Drew — a white-plumed " +
      "flamingo gentleman, deep question-mark neck curve, heavy-lidded deadpan human-readable eyes, heavy " +
      "downturned black-tipped beak, starched collar band under a black silk BOW TIE (a bow tie, NEVER a long " +
      "necktie), fine knitted sweater vest over a pale collared shirt, and WHITE-FEATHERED hands — four " +
      "feathered fingers and a thumb, never bare human skin. RIGHT, Mango — a detailed golden retriever " +
      "gentleman with true black dog lips along the muzzle, freckles, long-fringed drop ears, modest ruff, " +
      "in a dark suit jacket over a pale open-collared shirt with a small US flag pin on the left lapel, a " +
      "wristwatch, and FUR-BACKED dog-yet-humanoid hands with soft pads — never bare human skin. ",
    extra:
      "Drew sits frame-left with his conical stemmed MARTINI glass, olives on a pick, on a napkin; he also " +
      "wears trousers. Mango sits frame-right with an old fashioned — short rocks glass, one large cube, a " +
      "dark cherry. The nut bowl sits between the two drinks. THE HANDS GET SPECIAL CARE, humanoid but " +
      "never human-skinned: Drew's hands are WHITE-FEATHERED and humanoid — four slender feathered fingers " +
      "and an opposed thumb, small layered feathers on their backs — never wingtips, never bare skin. " +
      "Mango's hands are FUR-BACKED and humanoid — golden fur on the backs, soft pads on the palms, four " +
      "fingers and a thumb — never plain paws, never bare skin. Every finger distinctly drawn, gripping " +
      "each glass at plausible contact points. Both are successful gentlemen in their mid-forties — " +
      "classy, composed; Drew deadpan, Mango faintly worried. ",
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
      "beautiful — radiant, elegant, seasoned and self-assured — never stiff, never staring, never eerie, " +
      "never tongue-out, never a shepherd or wolf. She wears her studded leather collar with its small " +
      "teardrop gem pendant. The reference shows ONLY her head — below the neck her body is NOT the " +
      "reference's and must be drawn humanoid as described. RIGHT on the reference: a texture swatch only " +
      "— no figure in it to draw — showing the antique-engraving technique for the room, the clothes, and " +
      "the bar; her face itself stays soft, luminous, and lovely, modeled with delicate shading rather " +
      "than heavy stipple. Draw Abby ALONE. ",
    extra:
      "Her BODY IS SLIGHTLY HUMANOID, built exactly like the flamingo and retriever gentlemen of this " +
      "strip: she STANDS UPRIGHT on two legs, with humanoid shoulders and arms and FUR-BACKED dog-yet-" +
      "humanoid hands with soft pads, every finger distinctly drawn — white-furred throughout, only her " +
      "head and hands the terrier's, never on all fours, never leaning paws on the counter. Composition: " +
      "WAIST-UP, camera pulled back — she STANDS TALL working behind her own marble bar counter, the " +
      "marble in the foreground hiding her below the waist. Her work clothes are MANDATORY and must be " +
      "drawn over her fur: a fitted light blouse with rolled sleeves open at the collar, and a folded " +
      "white towel draped over her left shoulder, with the studded gem-pendant collar at her neck. She is " +
      "the successful proprietor in her mid-forties — graceful, trim, and poised, with an elegant " +
      "feminine silhouette in her blouse — one hand resting on the marble, head tilted with the same " +
      "warm smile the reference has, in command, the back bar's bottles and good glassware behind her. ",
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
    "A large flatscreen TV over the back bar plays the news in the same engraved style, with a DCN network " +
    "bug, a LIVE tag, and a bold-caps chyron reading RATE CUT EXPECTED, EVENTUALLY. A dark chalkboard beside " +
    "it reads, in hand-lettered chalk: PATIENCE — $14. ",
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
