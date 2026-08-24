// The one list of places the training set knows about.
//
// Two scripts depend on this agreeing with itself: make-setting-variants.mjs
// generates images of a place, and build-training-set.mjs decides which place
// each caption is describing so it can check the corpus is not lopsided. If
// those two drift apart the check quietly stops working — a caption nothing
// recognises, or worse, a boat counted as a bar. So the descriptions and the
// patterns live together, and the self-check at the bottom fails the import
// the moment a description stops matching its own place.
//
// `match` is deliberately loose. Captions are written by hand for the model's
// benefit, not this file's, and they should be free to say "on a dock at dusk"
// without anyone having to come here first.

export const PLACES = [
  // First, and matched first: a study on blank paper is not a place, and
  // "polishing a glass behind a bar counter" on a blank sheet is not the bar.
  { id: "blank paper", study: true, match: /blank (?:pale|white) paper/i },

  {
    id: "barroom",
    match: /barroom|back bar|swinging doors|bar counter/i,
    describe: "standing at the counter of a dim wood-panelled barroom, shelves of bottles on the back bar behind",
  },
  { id: "golf course", match: /golf course|fairway/i },
  { id: "dock", match: /\bdock\b|jetty|pier/i },
  { id: "airport", match: /airport|departure board|terminal/i },

  {
    id: "boat",
    match: /\bboat\b|sailboat|open water/i,
    describe: "standing on the open deck of a small boat at sea, water and horizon behind",
  },
  {
    id: "park",
    match: /park bench|parkland|public park/i,
    describe: "sitting on a park bench under bare trees, a path and railings behind",
  },
  {
    id: "office",
    match: /office/i,
    describe: "standing in a plain office beside a desk, a window with blinds behind",
  },
  {
    id: "beach",
    match: /beach|shoreline|waterline/i,
    describe: "standing on a beach at the waterline, flat sea and sky behind",
  },
  {
    id: "street",
    match: /street|sidewalk|storefront/i,
    describe: "standing on a busy city sidewalk, storefronts and passers-by behind",
  },
  {
    id: "empty",
    match: /empty background|empty void|nothing behind|plain backdrop/i,
    describe: "against a completely empty background, nothing else in the panel at all",
  },
  {
    id: "courtroom",
    match: /courtroom|witness stand/i,
    describe: "standing at a courtroom lectern, panelled bench and flag behind",
  },
  {
    id: "diner",
    match: /diner|lunch counter/i,
    describe: "sitting in a diner booth beside a window, counter and stools behind",
  },
];

/** The place a caption is describing, or null if it names none. */
export function classify(caption) {
  for (const place of PLACES) if (place.match.test(caption)) return place.id;
  return null;
}

/** The places make-setting-variants.mjs can generate, id → description. */
export const VARIANT_PLACES = new Map(
  PLACES.filter((p) => p.describe).map((p) => [p.id, p.describe])
);

// A description that no longer classifies as its own place means the variant
// script would generate images the balance check miscounts. Catch it here, at
// import, rather than in a histogram nobody reads closely.
for (const place of PLACES) {
  if (!place.describe) continue;
  const seen = classify(place.describe);
  if (seen !== place.id) {
    throw new Error(
      `places.mjs: the description for "${place.id}" classifies as "${seen ?? "nothing"}" — ` +
        "the pattern and the description have drifted apart."
    );
  }
}
