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
export const MAX_VARIANTS = 30;

// Reference boards. Each cast's board is tiled from repo crops by
// make-variant-refs.mjs; `tiles` name the training-set crops (or for Mango,
// the two halves of his identity: the rendered bust that fixes his face and
// wardrobe, and the line-art base body that fixes his proportions — and his
// LACK of a tail, which the instruction repeats because the one thing a
// Mango variant must never inherit from Kontext's imagination is the tail).
export const CASTS = [
  {
    id: "mango",
    tokens: "SWDMANGO",
    who: "the golden retriever in the grey sport coat",
    tiles: ["dog-lapel-pin-bible-01", "dog-full-body-sheet-01"],
    tileNote:
      "Both panels of the reference show the SAME golden retriever: left is his face and jacket fully rendered, " +
      "right is his full body construction in plain line. He has NO tail.",
    extra: "He wears his grey sport coat with the small flag pin on the lapel, and he has absolutely no tail.",
  },
  {
    id: "abby",
    tokens: "SWDABBY",
    who: "the white West Highland terrier woman",
    tiles: ["abby-full-body-sheet-01", "abby-identity-sheet-01"],
    tileNote:
      "Both panels of the reference show the SAME terrier woman: left is her full body, right is her face close up. " +
      "She has no tail.",
    extra: "She wears her fitted blouse, short dark skirt, shoulder towel, and pearl necklace exactly as drawn.",
  },
  {
    id: "drew",
    tokens: "SWDDREW",
    who: "the flamingo",
    tiles: ["flamingo-wardrobe-sheet-01", "flamingo-identity-sheet-01"],
    tileNote:
      "Both panels of the reference show the SAME flamingo: left is his full body wearing only his black bow tie, " +
      "right is his head close up.",
    extra: "He keeps his black bow tie, S-curved neck, and feathered wing-arms exactly as drawn.",
  },
  {
    id: "mango-abby",
    tokens: "SWDMANGO and SWDABBY",
    who: "the golden retriever in the grey sport coat and the white terrier woman",
    tiles: ["dog-lapel-pin-bible-01", "abby-full-body-sheet-01"],
    tileNote:
      "The reference shows two DIFFERENT characters side by side: left the golden retriever, right the terrier woman. " +
      "Draw both, distinct, neither with a tail.",
    extra: "Two distinct characters: the retriever in his grey coat, the terrier woman in her blouse and skirt. No tails.",
  },
  {
    id: "drew-mango",
    tokens: "SWDDREW and SWDMANGO",
    who: "the flamingo and the golden retriever in the grey sport coat",
    tiles: ["flamingo-wardrobe-sheet-01", "dog-lapel-pin-bible-01"],
    tileNote:
      "The reference shows two DIFFERENT characters side by side: left the flamingo, right the golden retriever. " +
      "Draw both, distinct; the retriever has no tail.",
    extra: "Two distinct characters: the flamingo with his bow tie, the retriever in his grey coat with no tail.",
  },
  {
    id: "drew-abby",
    tokens: "SWDDREW and SWDABBY",
    who: "the flamingo and the white terrier woman",
    tiles: ["flamingo-wardrobe-sheet-01", "abby-full-body-sheet-01"],
    tileNote:
      "The reference shows two DIFFERENT characters side by side: left the flamingo, right the terrier woman. " +
      "Draw both, distinct.",
    extra: "Two distinct characters: the flamingo with his bow tie, the terrier woman in her blouse and skirt.",
  },
  {
    id: "trio",
    tokens: "SWDDREW, SWDMANGO and SWDABBY",
    who: "the flamingo, the golden retriever in the grey sport coat, and the white terrier woman",
    tiles: ["flamingo-wardrobe-sheet-01", "dog-lapel-pin-bible-01", "abby-full-body-sheet-01"],
    tileNote:
      "The reference shows three DIFFERENT characters side by side: the flamingo, the golden retriever, the terrier " +
      "woman. Draw all three, each distinct; no character has a tail.",
    extra: "Three distinct characters together; the retriever and the terrier have no tails.",
  },
];

// cast id -> place ids. Every id in here must exist in VARIANT_PLACES.
export const PLAN = [
  ["mango", ["boat", "park", "office", "beach", "street", "empty", "courtroom", "diner", "barroom", "barroom-2"]],
  ["abby", ["boat", "park", "street", "diner"]],
  ["drew", ["office", "beach", "courtroom", "empty"]],
  ["mango-abby", ["boat", "park", "office", "empty"]],
  ["drew-mango", ["beach", "street", "diner", "barroom"]],
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
      all.push({ id: `${castId}-${placeId}`, cast, placeId, place: placeOf(placeId) });
    }
  }
  if (all.length > MAX_VARIANTS) {
    throw new Error(`the variant plan lists ${all.length} runs — past the ${MAX_VARIANTS}-image ceiling`);
  }
  const ids = new Set(all.map((r) => r.id));
  if (ids.size !== all.length) throw new Error("duplicate run ids in the variant plan");
  return all;
}

/** The Kontext instruction for one run. */
export function instruction(run) {
  return (
    `${run.cast.tileNote} Redraw ${run.cast.who} exactly as drawn — same construction, same face, same ` +
    `proportions, unchanged in every detail. ${run.cast.extra} Place the scene somewhere new: ${run.place}. ` +
    `Single-panel black-and-white cartoon, confident ink line with soft grey wash, no colour, no lettering, ` +
    `no speech balloons, no panel border.`
  );
}

/** The training caption for one run's image. */
export function caption(run) {
  return `SWDINK cartoon, ${run.cast.tokens} ${run.place}`;
}
