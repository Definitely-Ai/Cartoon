// The plan for the generated half of the training set.
//
// One file owns what gets generated, from which references, with which
// instruction, under which caption — because three different consumers have
// to agree on it exactly: make-variant-refs.mjs builds the conditioning
// boards, the production /api/backroom/variants route spends real money
// following the plan, and build-training-set.mjs counts the results into its
// balance report. A drifted copy in any one of them is a silent hole in the
// dataset, or a dollar spent on the wrong image.
//
// Why these numbers: after the audit purge the repo's own images leave
// SWDMANGO with 17 caption mentions against ~43 each for the other two — and
// five of the six cartoons that showed his body were dropped for the plumed
// tail canon forbids. So the plan leans hard on Mango (solo and in both
// pairings), gives every pairing at least two images (the repo has NONE of
// Abby beside anyone), and stages one guarded trio attempt on an empty
// background where nothing competes with three identities.

import { VARIANT_PLACES } from "./places.mjs";

// Where the generated images and the conditioning boards live in the repo.
export const VARIANT_DIR = "scripts/training/setting-variants";
export const REF_DIR = "scripts/training/variant-refs";

// The absolute ceiling on committed variant images, enforced server-side by
// the route. Deleting a rejected image frees its slot; nothing can push the
// count past this. 30 x ~$0.055 also bounds the money this plan can spend.
export const MAX_VARIANTS = 34;

// Reference boards. Each cast's board holds ONE model-sheet tile per
// character — the full body with the same character's head study enlarged
// beside it, frameless on shared white paper — built by make-variant-refs.mjs.
// Round one proved the head study necessary: a lone 720px full-body tile
// leaves the face a few dozen pixels, and Drew's head drifted in every panel
// drawn from it. Round two proved the framelessness necessary: a bordered
// inset box was copied into the golf scene as a drawn picture. Mango's head
// comes from a finished cartoon (the pin bible's busts carry the black bead
// eyes canon bans) beside his line-art base body, which also fixes his LACK
// of a tail.
export const MANGO_BUST = {
  src: "cartoons/2026-08-04-an-emerging-asset/cartoon.png",
  box: [780, 150, 474, 600],
};

// One model-sheet tile recipe per character, reused by every board so the
// cast looks identical no matter who they share a scene with. Abby has a
// second tile for the barroom: her glass-polishing pose, so the reference
// itself argues she belongs behind the counter working.
const DREW_TILE = { body: "flamingo-wardrobe-sheet-01", head: "flamingo-identity-sheet-01", headCorner: "right" };
const MANGO_TILE = { body: "dog-full-body-sheet-01", head: MANGO_BUST, headCorner: "left", whitenHead: true };
const ABBY_TILE = {
  body: "abby-full-body-sheet-01",
  head: "abby-identity-sheet-01",
  headCorner: "right",
  whitenBody: true,
  whitenHead: true,
};
const ABBY_BAR_TILE = {
  body: "abby-bartender-actions-sheet-02",
  head: "abby-identity-sheet-01",
  headCorner: "right",
  whitenBody: true,
  whitenHead: true,
};

const TILE_NOTE_ONE =
  "The reference is a character model sheet: each character appears as a full standing body with the same " +
  "character's face drawn again, enlarged, beside the head — a close-up study, not a second character. " +
  "The sheet is reference only: never draw the sheet itself, its layout, or any enlarged head study into " +
  "the cartoon — each character appears exactly once, full body, inside the scene. ";

export const CASTS = [
  {
    id: "mango",
    tokens: "SWDMANGO",
    who: "the golden retriever",
    tiles: [MANGO_TILE],
    tileNote:
      TILE_NOTE_ONE +
      "The sheet shows the golden retriever: his body in plain construction line, his rendered face and jacket in the head study.",
    extra:
      "He wears his grey herringbone sport coat over an open-collar shirt with the small flag pin on the left lapel, " +
      "long dark trousers, bare canine feet. His rear is completely smooth and tailless.",
  },
  {
    id: "abby",
    tokens: "SWDABBY",
    who: "the white West Highland terrier woman",
    tiles: [ABBY_TILE],
    tileNote: TILE_NOTE_ONE + "The sheet shows the terrier woman, her face enlarged in the head study.",
    extra:
      "She has a short-muzzled West Highland terrier face with a round black nose, dark friendly eyes and small " +
      "upright ears — not a fox. She wears her fitted white blouse with rolled sleeves, very short dark skirt, a " +
      "folded towel on her left shoulder, her pearl necklace with the oval gem, and black heels. Her rear is " +
      "smooth and tailless.",
  },
  {
    id: "drew",
    tokens: "SWDDREW",
    who: "the flamingo",
    tiles: [DREW_TILE],
    tileNote: TILE_NOTE_ONE + "The sheet shows the flamingo, his head enlarged in the head study.",
    extra:
      "He keeps his black bow tie, compact head with small lively eyes, long S-curved neck, feathered wing-arms, " +
      "feathered body, and long thin bird legs with webbed feet — exactly as the close-up draws his face.",
  },
  {
    id: "mango-abby",
    tokens: "SWDMANGO and SWDABBY",
    who: "the golden retriever and the white terrier woman",
    tiles: [MANGO_TILE, ABBY_TILE],
    tileNote:
      TILE_NOTE_ONE +
      "From left to right on the sheet: the golden retriever, then the terrier woman. Draw both, clearly distinct.",
    extra:
      "The retriever wears his grey sport coat with the left-lapel flag pin and long dark trousers; the terrier " +
      "woman wears her blouse, short skirt, shoulder towel and pearl necklace. Both rears smooth and tailless.",
  },
  {
    id: "drew-mango",
    tokens: "SWDDREW and SWDMANGO",
    who: "the flamingo and the golden retriever",
    tiles: [DREW_TILE, MANGO_TILE],
    tileNote:
      TILE_NOTE_ONE + "From left to right on the sheet: the flamingo, then the golden retriever. Draw both, clearly distinct.",
    extra:
      "The flamingo keeps his bow tie, small lively eyes, S-neck and feathered wing-arms; the retriever wears his " +
      "grey sport coat with the left-lapel flag pin and long dark trousers. The retriever's rear is smooth and tailless.",
  },
  {
    id: "drew-abby",
    tokens: "SWDDREW and SWDABBY",
    who: "the flamingo and the white terrier woman",
    tiles: [DREW_TILE, ABBY_TILE],
    tileNote:
      TILE_NOTE_ONE + "From left to right on the sheet: the flamingo, then the terrier woman. Draw both, clearly distinct.",
    extra:
      "The flamingo keeps his bow tie, small lively eyes, S-neck and feathered wing-arms; the terrier woman wears " +
      "her blouse, short skirt, shoulder towel and pearl necklace. Her rear is smooth and tailless.",
  },
  {
    id: "trio",
    tokens: "SWDDREW, SWDMANGO and SWDABBY",
    who: "the flamingo, the golden retriever, and the white terrier woman",
    tiles: [DREW_TILE, MANGO_TILE, ABBY_BAR_TILE],
    tileNote:
      TILE_NOTE_ONE +
      "From left to right on the sheet, three DIFFERENT characters: the flamingo, the golden retriever, the terrier woman. Draw all " +
      "three, each clearly distinct.",
    extra:
      "The flamingo keeps his bow tie, small lively eyes, S-neck, feathered wing-arms and long thin bird legs. " +
      "The retriever wears his grey sport coat with the left-lapel flag pin and long dark trousers. The terrier " +
      "woman wears her blouse, shoulder towel and pearl necklace. Every rear is smooth and tailless.",
  },
];

// cast id -> place ids. Every id in here must exist in VARIANT_PLACES.
//
// The first three rows are the CHARACTER-PERFECTION PROBES — the founder's own
// three test scenes (golf, boat, his bar), kept first so one click of
// /api/backroom/variants?limit=3 generates exactly these. They double as
// training images once they pass his eye.
export const PLAN = [
  ["drew-mango", ["golf course", "boat"]],
  ["trio", ["barroom"]],
  ["mango", ["park", "office", "beach", "street", "empty", "courtroom", "diner", "barroom-2", "boat"]],
  ["abby", ["boat", "park", "street", "diner"]],
  ["drew", ["office", "beach", "courtroom", "empty"]],
  ["mango-abby", ["boat", "park", "office", "empty"]],
  ["drew-mango", ["beach", "street", "diner", "barroom"]],  // barroom here = a second bar composition
  ["drew-abby", ["park", "diner"]],
  ["trio", ["empty"]],
];

// A place id may carry a "-2"-style suffix to ask for a second image of the
// same place (a different roll of the dice); it resolves to the base place.
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
      // Ids become filenames and ?only= values — no spaces.
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

// Per-run staging notes, for the few scenes where canon fixes who stands
// where. Keyed by run id.
const STAGING = {
  "trio-barroom":
    "Staging, exactly: the long wooden counter runs across the drawing. The terrier woman is on the FAR side " +
    "of the counter, facing the viewer, polishing a glass with her towel, hidden below the waist by the " +
    "counter. The flamingo and the retriever stand on the NEAR side, their drinks on the counter between " +
    "them and her. Nobody sits. ",
};

/** The Kontext instruction for one run. */
export function instruction(run) {
  // The style command comes BEFORE the scene: round three proved that a dark
  // scene ("dim barroom") stated after a trailing style note wins, and the
  // whole panel came back as a full-tone painting. Anchoring the style to the
  // reference sheet itself is the strongest claim Kontext honours.
  return (
    `${run.cast.tileNote} Redraw ${run.cast.who} exactly as drawn — same construction, same face, same ` +
    `proportions, unchanged in every detail. ${run.cast.extra} Keep the reference sheet's drawing style ` +
    `for the whole cartoon: bright white paper, confident pen-and-ink outlines, sparing light grey wash, ` +
    `plenty of untouched white paper — never dark full-tone rendering, never a painting. ` +
    `Place the scene somewhere new: ${run.place}. ` +
    (STAGING[run.id] ?? "") +
    `Single-panel black-and-white gag cartoon, no colour, no lettering, no speech balloons, no panel ` +
    `border, no signature, no date, no watermark.`
  );
}

/** The training caption for one run's image. */
export function caption(run) {
  return `SWDINK cartoon, ${run.cast.tokens} ${run.place}`;
}
