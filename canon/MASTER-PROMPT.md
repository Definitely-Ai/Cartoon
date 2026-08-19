# The Master Prompt

<!-- BRAND: replace when final — "The Swinging Door" is the working series/bar name throughout this document -->

Purpose: the one page an AI reads before drawing. The BASE block below is assembled from the whole canon and is pasted **verbatim** into every image request; only the slots change per cartoon (away games additionally swap the setting passage — see below). Do not paraphrase the base — paraphrase is how the strip drifts. When two documents disagree, the authority ladder in `canon/README.md` decides; never average.

## How to use

1. Paste the BASE block exactly as written (the fenced block only — nothing outside the fence).
2. Fill the three slots: `[SCENE]`, `[TV]`, `[BOARD]`. Slot language obeys each character's vocabulary: Mango and Abby have **hands**, never "paws"; Drew has **wing-hands / feather-digits**, never "hands" or "arms".
3. Give the image model the reference sheets for every character in the scene. Over the studio connector, fetch them with `get_model_sheet` and include the returned images as generation references; working directly in the repo, attach the files. Per character:

   | Character | Always | When also |
   | --- | --- | --- |
   | Drew | `full-body-sheet.png` (locked master) | `identity-sheet.png` when the face is readable — in practice every bar scene; `wing-hand-sheet.png` when a gesture or held prop is readable |
   | Mango | `full-body-sheet.png` + `identity-sheet.png` | `lapel-pin-bible.png` whenever he is jacketed |
   | Abby | `full-body-sheet.png` + `identity-sheet.png` | exactly one relevant specialist sheet (blocking, actions, hands-props, wardrobe, or expression) |

   The locked master always outranks support sheets and older cartoons; match it, never average.
4. The caption is **never sent to the image model**. The house typesets the exact caption beneath the approved text-free illustration — `file_cartoon` does it over the connector; `npm run dialogue` does it when working directly in the repo. Never render words in the image either way.
5. **Look at every generated image before filing it.** Run the checklist below and `canon/creation/SCENE-QC.md` against the actual pixels. Any failure is a redraw with the fault named in the prompt — never a filing.

## BASE block

```text
A single-panel gag cartoon in black-and-white ink wash, in the manner of a dry mid-century American magazine cartoon: confident, variable-weight brush linework over soft gray washes; exactly three values (paper white, one mid-gray wash, solid black ink); no color, no photorealism, no 3D-render or anime look.

THE ROOM. The scene is the interior of The Swinging Door, a classic old American bar, drawn at eye level from across the room. The dark-wood bar runs straight along the lower third, stools on the room side, shelves and a mirror behind it. The front window, upper right, carries the bar's name lettered in reverse, as read from inside. A small TV sits high on the left wall, showing [TV]. A chalkboard behind the bar, right of center, reads [BOARD]. A few pieces of framed Americana hang on wood paneling — the walls are never crowded.

THE STAGE. The staging is physically real. Behind the bar is the service side — only the bartender works there; patrons stay on the room side. Anyone seated sits squarely on a stool, hips on the seat, legs resolved. Every glass and bottle rests flat on the bar, a coaster, or a shelf, or sits in a real closed grip; hands touch props at plausible contact points. No figure or object merges, clips, or passes through another; the furniture stays exactly where this room map fixes it.

DREW. Preserve Drew exactly from the attached locked master: a 46-year-old male anthropomorphic flamingo of average healthy build, with a compact mature head, a pale-and-dark angular downturned flamingo beak, a long slim neck held in a pronounced smooth S-curve, and small lively avian eyes with controlled visible white, distinct iris and darker pupil, one restrained catchlight, fine lid contours, and clearly directed gaze. His arms are layered feathered wing-arms ending in three articulated feather-digits with only tiny pale avian nail tips; he stands on long slim bird legs with webbed flamingo feet. His permanent accessory is one small solid-black bow tie; unless the scene explicitly specifies clothing, Drew's G-rated feathered base model wears only the bow tie. In the standard bar scene he stands or leans at the room side of the bar. His recurring martini is optional; when the scene calls for it, use exactly three olives on one pick, the glass on a coaster or held in his feather-digit grip.

MANGO. Mango matches the attached Mango master and identity sheets exactly: a 46-year-old male anthropomorphic golden retriever with an upright human-readable body, solid soft middle-aged build, rounded shoulders, modest belly, sturdy legs, a thin neck with almost no throat ruff, textured face and feathered drop ears, human-shaped five-finger hands with subtle paw pads, broad canine feet, and absolutely no tail. His emotionally readable eyes show distinct paper-white sclera, a separate mid-gray iris, a separate round black pupil, controlled catchlights, subtle lids, short lashes, and soft fur-brow arcs. In the standard bar scene he sits on a stool with human posture at the room side of the bar, wearing a collared shirt under a rumpled jacket; the exact simplified waving USA flag pin from the attached pin reference is fixed to the left lapel, and an old fashioned — short rocks glass, one large cube — rests flat on the bar in front of him. Mango's wardrobe may change only when [SCENE] requires it; his body and identity never change.

Expressions are restrained, specific, and dry, and every gaze remains alive. No speech balloons, no thought bubbles, no caption text, and no lettering anywhere in the image except the short text this prompt's setting names (in the bar: the reversed window sign, the short chalkboard lines, and the TV screen; outdoors: the news prop's two or three short words). One clear focal action; generous white space. [SCENE]
```

Add **only when the gag needs her** (about one cartoon in ten), with the attached Abby master plus one specialist sheet:

```text
ABBY. Abby is the adult female anthropomorphic West Highland White Terrier who owns and works The Swinging Door. Match her attached sheets exactly: compact textured Westie head, upright triangular ears, short canine muzzle, black canine nose, and medium-sized living human-style eyes integrated into the canine face with visible white sclera, separate gray irises, separate black pupils, controlled catchlights, clear lids, refined lashes, and expressive brow-fur. She has an upright feminine hourglass build with a fuller bust, narrow waist, slim hips, smooth shapely legs of short white fur, a natural thigh gap, five-digit hands, and absolutely no tail. Her locked work outfit is a fitted light collared blouse with rolled sleeves and only the top button open over modest scalloped lace, a very short dark fitted bartender skirt/apron with a centered back bow, a folded towel on her left shoulder, a delicate bracelet, black closed-toe mid-height heels, and one close strand of small round pearls with a centered oval faceted gemstone. Her default expression is a welcoming, intelligent smile unless [SCENE] names another approved expression. She is quick-witted, warm, poised, competent, and in charge. In the standard bar scene she is behind the bar, visibly mid-task, and the counter correctly hides her from the upper hip down.
```

## The slots

- `[SCENE]` — one sentence: who is doing what. Example: *"Mango is mid-story with a raised hand while Drew signals toward the taps without looking away from the TV."* (Hands for Mango and Abby; wing-hands for Drew — never "paw" in a slot.)
- `[TV]` — two or three words on the screen: `MARKETS OPEN`, `BREAKING`, `DOW −312`. The TV is how the day's news enters the room.
- `[BOARD]` — two to four chalk words, allowed to carry a background gag: `PATIENCE, SERVED DAILY`, `HAPPY HOUR 4–?`.
- `[SETTING]` (away games only) — one phrase naming the approved destination: *"a small two-thwart fishing boat on calm water"*. Away games swap [TV] and [BOARD] for [SETTING].

## Away games (leaving the bar)

THE ROOM and THE STAGE paragraphs are the **setting passage** — the only part of the BASE block that may be replaced, and only when the scene leaves the bar (see `canon/settings/SETTINGS-BIBLE.md` → Away games). The character paragraphs and the style/text rules are identity and are never altered. For an outdoor scene, substitute this setting passage and keep everything else verbatim:

```text
THE SETTING. An outdoor Americana scene: [SETTING]. Drawn at eye level with a clear foreground stage. There is no TV and no chalkboard; the day's news enters through a prop — a folded newspaper, a portable radio, a phone screen held at reading distance with at most two or three short words visible.

THE STAGE. The staging is physically real. Anyone seated sits squarely on what supports them — a bench, a boat thwart, a folding chair — hips on the seat, legs resolved. Rods, clubs, tools, and drinks sit in real closed grips or rest on real surfaces; hands touch props at plausible contact points. No figure or object merges, clips, or passes through another. Water, ground, and horizon stay level and consistent.
```

## Never draw

- Color. Ever. Including the flag pin — it reads by shape.
- Speech balloons, thought bubbles, or any caption lettering inside the panel.
- Drew without his bow tie; Drew with a short or straight neck, thin straight beak, black bead eyes, human arms or hands, human legs or feet, shoes on the base model, extra wings, or scene clothing treated as permanent; Mango without his flag pin when wearing a lapeled jacket.
- A tail on Mango or Abby. Never give Abby a tail slit, tuft, bulge, furry legs, paw feet, bead eyes, plain choker, long skirt, trousers, missing lace, or missing pearl-and-gem collar. Never give Mango a thick or beard-hidden neck, quadruped forepaws, black bead eyes, or a different body under new clothes.
- Mango's pin on the right lapel, mounted to a pole, oversized, or rendered with dense tiny stars/stripes; use the locked nine-star, seven-band waving pin.
- The bartender's side of the bar occupied by a patron, or the bartender casually patron-side (owner tasks only — see the settings bible).
- A seated character with no stool or seat under them; a floating, fused, or clipped glass, prop, or limb.
- Long legible text anywhere: only the setting's named short-text carriers (bar: window, chalkboard, TV; away game: the news prop), all short — image models garble prose.
- A modern sports bar: no neon, no big screens, no crowds. Background patrons only if the gag needs them, minimal and faceless.
- Crowded walls, busy compositions, more than one focal action.

## Training-week protocol (while the bible is being tuned)

Every batch is an experiment, not five rolls of the same dice:

- Vary **one deliberate thing per candidate** — a looser or tighter wash, a longer or shorter caption, gag carried by the TV vs. a prop vs. pure posture (prop-only news is an away-game variation), Abby present or absent, wider or closer framing.
- Tag each candidate's variation in `file_cartoon`'s `style_notes` ("8-word caption", "no TV, prop gag") — his reactions then attach to *known* differences.
- When the founder's feedback names a pattern (see `get_feedback`), let the next batches test the fix, and say what you changed.

**The graduation test (end of the week).** The bible is done when the AI can call his shots. On the last day, before filing a fresh batch, study `get_feedback` and *predict land or miss for each candidate* (a cartoon lands when his art score and caption score are both 6+), writing the predictions down before he sees anything. Then let him score as usual and compare. **Four right out of five means the bible reads his taste well enough to present.** Fewer than that: the misses say exactly which chapter is still thin — revise it and test again the next day.

## Checklist before filing (all must pass — against the actual generated image)

1. Drew matches the locked master: bow tie ✓ S-neck ✓ avian eyes ✓ feathered wing-hands ✓. Mango's left-lapel flag pin ✓ collared shirt under the jacket ✓. Abby when present: pearl-and-gem collar ✓ no-tail silhouette ✓. Window lettering reversed ✓.
2. Three values, strictly B&W, single panel, generous margins.
3. **Stage physics** (`canon/creation/SCENE-QC.md`): everyone on the correct side of the bar, seated characters actually on their stools, every drink supported, all grips real, nothing merged or clipping, the room map unchanged.
4. No balloons and no model-rendered caption in the illustrated panel; the house typesets the exact caption afterward (`file_cartoon` over the connector, `npm run dialogue` in the repo).
5. The visual gag reads in two seconds without the caption; the caption deepens it rather than explaining it (≤ 20 words, about 140 characters, dry, underplayed).
6. The boundaries in `/canon/comedy/COMEDY-BIBLE.md` all pass.
7. 3–5 genuinely distinct takes filed per `/canon/creation/WORKFLOW.md` — different scenes or speakers, not crops of one image.
