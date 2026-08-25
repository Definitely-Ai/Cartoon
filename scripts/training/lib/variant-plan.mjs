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
const ABBY_REF = { body: { src: "canon/vision/abby-reference.jpg", box: [0, 0, 1000, 1760] } };

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
      "The reference sheet shows the two characters exactly as they must be drawn: LEFT, Drew — a white-plumed " +
      "flamingo gentleman, deep question-mark neck curve, heavy-lidded deadpan human-readable eyes, heavy " +
      "downturned black-tipped beak, starched collar band under a black silk bow tie, fine knitted sweater vest " +
      "over a pale collared shirt, feathered four-fingered hands with thumbs. RIGHT, Mango — a detailed golden " +
      "retriever gentleman with true black dog lips along the muzzle, freckles, long-fringed drop ears, modest " +
      "ruff, in a dark suit jacket over a pale open-collared shirt with a small US flag pin on the left lapel, " +
      "a wristwatch, dog-yet-humanoid furred hands. ",
    extra:
      "Drew sits frame-left with a conical martini glass (olives on a pick) on a napkin; he also wears trousers. " +
      "Mango sits frame-right with an old fashioned — short rocks glass, one large cube, a dark cherry. The " +
      "nut bowl sits between the two drinks. Both are successful gentlemen in their mid-forties — classy, " +
      "composed; Drew deadpan, Mango faintly worried. ",
  },
  {
    id: "harrington-abby",
    tokens: "Abby",
    who: "the West Highland terrier proprietor",
    tiles: [ABBY_REF],
    tileNote:
      "The reference shows Abby's face and neckwear exactly as they must be drawn: a true fluffy West Highland " +
      "White Terrier — round dark button eyes, black nose, small pricked ears, fine soft fur strokes, never " +
      "wolfish — wearing her studded leather collar with a small teardrop gem pendant. ",
    extra:
      "Draw her as the successful proprietor behind her own marble bar counter: trim natural figure with a " +
      "modest bust, fitted light blouse with rolled sleeves, folded towel on her left shoulder, the studded " +
      "gem-pendant collar at her neck, polishing a rocks glass, poised and in command, the counter hiding her " +
      "below the waist, bottles and good glassware behind her. ",
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
    "Behind her, among the bottles, a small hand-lettered chalkboard reads: THE HOUSE PROTECTS ITS OWN. ",
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
