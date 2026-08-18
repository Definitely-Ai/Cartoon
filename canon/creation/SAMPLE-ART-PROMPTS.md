# Sample art prompt set

These are the production briefs used for the repository's illustrated sample
panels and character sheets. Generation used the built-in image tool. Once the
first all-cast panel existed, every later call referenced that panel and the
relevant working model sheets for visual continuity.

## Shared panel prompt

Create a finished square single-panel editorial cartoon in sophisticated
hand-drawn black ink with restrained transparent gray wash on warm-white paper.
Use an economical mid-century American magazine gag-panel line, confident varied
nib strokes, large readable silhouettes, an 8% safe margin, and a composition
that remains clear at a 220-pixel thumbnail. Preserve the working Drew, Mango,
and Abby identities from the referenced model sheets. Suggest The Swinging Door
with only the bar details needed for the gag.
<!-- BRAND: replace when final — keep this comment OUTSIDE any text pasted to an image model -->

Do not ask the image model to render captions, titles, dates, catalog lines,
proof labels, speech balloons, signatures, watermarks, outer frames, readable
color anywhere, and no readable signage beyond the setting's canonical short-text carriers
(in the bar: reversed window name, short chalkboard lines, TV words). Append the exact caption afterward with
`npm run dialogue` so spelling and punctuation remain deterministic. Avoid clip
art, flat vector geometry, mascots, 3D, photorealism,
anime, childish proportions, cloudy noise fills, muddy all-over wash, dense
crosshatching, clutter, duplicated characters, or malformed anatomy. Selective
short feather marks and controlled crosshatching are allowed only where they
clarify Drew's anatomy or a structural overlap.

## Character sheets

- **Drew locked master (`characters/flamingo/full-body-sheet.png`):** the primary
  authority for every Drew generation. Preserve the 46-year-old male flamingo's
  average healthy build, compact mature head, pale-and-dark angular downturned
  beak, long slim rounded S-neck, small expressive avian eyes, feathered
  wing-arms, three feather-digits with tiny pale nail tips, long bird legs,
  webbed feet, natural plumage, and permanent black bow tie. The base model has
  no other clothing; the martini is optional and has exactly three olives when
  present.
- **Drew identity (`characters/flamingo/identity-sheet.png`):** supporting face
  and gaze reference for neutral, curious, subtle smile, open smile, skeptical,
  amused, concerned, surprised, thinking, listening, and speaking. Eyes stay
  small and avian with controlled white, iris, pupil, one catchlight, and fine
  lids; smiles use the beak seam and posture, never human lips or teeth.
- **Drew wing-hand (`characters/flamingo/wing-hand-sheet.png`):** attach whenever
  a wing-hand, gesture, or prop grip is visible. Arms remain layered wings; the
  feather-hand uses one short thumb-feather and two longer finger-feathers.
- **Drew support sheets:** use `pose-sheet.png` for action, `wardrobe-sheet.png`
  for scene-specific clothing fit, `scene-continuity-sheet.png` for environment
  changes, and `proportion-style-sheet.png` for construction and drift checks.
  These review references never overrule the locked master.
- **Mango identity:** follow `canon/characters/dog/DESCRIPTION.md` and
  `identity-sheet.png`: consistent adult head studies with a moderate muzzle,
  feathered drop ears, textured facial fur, thin beard-free neck, and
  human-readable monochrome eyes whose white sclera, gray iris, black pupil,
  and catchlights remain visibly separate.
- **Mango full body:** follow `full-body-sheet.png`: 46-year-old upright
  anthropomorphic golden retriever, solid and softly built rather than fat or
  muscular, thin neck, human-shaped five-finger hands with canine cues, broad
  canine feet, and **no tail**. The sheet is the clothing-neutral body authority.
  In the standard bar scene, layer on the rumpled jacket, exact waving USA pin
  from `lapel-pin-bible.png` on the left lapel, and one old fashioned on one
  coaster. Scene-specific clothing may change; the underlying body never does.
- **Abby identity:** follow `canon/characters/abby/DESCRIPTION.md` and
  `identity-sheet.png`: the same adult female Westie in every view, with upright
  triangular ears, a short canine muzzle and black nose, layered directional
  white facial fur, and living human-style eyes whose white sclera, gray iris,
  black pupil, controlled catchlights, lids, lashes, and fur-brows remain
  separate and naturally integrated into the canine face. The close pearl
  strand and centered oval gemstone are mandatory.
- **Abby full body:** follow `full-body-sheet.png`: upright adult feminine
  hourglass build, fuller bust, narrow waist, slim hips, smooth hairless shapely
  legs with a natural thigh gap, five-digit hands, closed-toe work heels, and
  **absolutely no tail**. Preserve the fitted light collared blouse with only the
  top button open over modest scalloped lace, very short dark fitted
  apron-skirt, centered rear bow, shoulder towel, pearl-and-gem collar, and
  delicate bracelet. Use `expression-sheet.png`, `hands-props-sheet.png`,
  `bartender-actions-sheet.png`, `wardrobe-details-sheet.png`, or
  `bar-blocking-sheet.png` as the single relevant specialist reference.

## Published sample panels

1. **Diversification:** Mango has a neat allocation chart while Drew is pulled
   among three separate worry sources: a volatile TV graph, ringing phone, and
   small family photo or letter.
2. **The Fee Structure:** an absurd accordion-fold disclosure or receipt snakes
   from Mango's hands around his stool and across the bar; Drew watches dryly.
3. **The Long Term:** tight two-shot fixed on the TV just after opening, with a
   prominent analog wall clock and impatient body language.
4. **An Emerging Asset Class:** cash or a receipt disappears into Mango's phone
   as a generic pixel-like coin breaks apart; no crypto or currency logo.
5. **The Forecast:** the TV dominates with a wild chart while a generic pundit
   awards himself a trophy before the movement has settled.
6. **The Retirement Number:** Mango is buried in looping calculator tape and
   crossed-out retirement worksheets while Drew indicates conflicting age
   targets; imply the numbers without generated typography.
7. **Index Funds:** Drew passively drops one unlabeled broad-market statement
   into a small complaint box while actively gesturing a gripe; this is
   byte-identical to the selected 2026-08-12 option.

## Back Room proof panels

- **2026-08-11 option 1 — The Number:** Abby slides a small adjustable retirement
  target farther from Mango while his calculator tape curls beside him.
- **2026-08-11 option 2 — The Retirement Number:** byte-identical to published
  edition 6; do not generate a second version.
- **2026-08-11 option 3 — Early Retirement:** a third stool is already occupied
  again by an open briefcase, work papers, and coat; untouched retirement ribbon
  and fishing gear remain beside it while the clock reads noon without numerals.
- **2026-08-12 option 1 — The Committee:** meeting minutes form a tower nearly to
  the wall clock and an accordion trail coils toward the patrons.
- **2026-08-12 option 2 — Index Funds:** Drew passively drops one unlabeled broad-
  market statement into a small complaint box while actively gesturing a gripe.
- **2026-08-12 option 3 — The Tab:** Abby calmly fans exactly three blank bar-tab
  slips in front of an earnestly surprised Mango.
- **2026-08-13 option 1 — The Soft Landing:** the television dominates as one
  briefcase descends by parachute into fog that completely hides the ground.
- **2026-08-13 option 2 — House View:** Abby replaces Drew and Mango's signature
  drinks with two water glasses; all three cast members establish continuity.
- **2026-08-13 option 3 — Breaking News:** an abstract-static television emits
  large open sound-wave arcs while Abby dryly raises the remote volume and Drew
  gestures for more.

## Code-native brand assets

The social card and favicon use deterministic SVG/Sharp output instead of image
generation so the series name, margins, and small-scale silhouette remain exact.
