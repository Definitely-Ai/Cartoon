# Mango Prompt Blocks

Use these blocks with `canon/MASTER-PROMPT.md`. In a normal cartoon the whole BASE block is pasted verbatim and already contains Mango's locked identity paragraph; the blocks below are for Mango-only work (sheet regeneration, solo panels, tests) and for tightening a scene where a specific feature keeps drifting.

## Required References

For every Mango image, fetch the sheets with `get_model_sheet` over the studio connector (or attach the files when working directly in the repo):

1. `full-body-sheet.png` — the locked master, always;
2. `identity-sheet.png` — always;
3. `lapel-pin-bible.png` — whenever Mango is jacketed.

State that the locked master outranks all other references. Never use a previously generated scene as the sole identity reference.

## Locked Identity Block

This is the MANGO paragraph from the BASE block of `canon/MASTER-PROMPT.md`, byte-identical. It is the ONE canonical identity text. Paste it verbatim whenever Mango appears outside a full BASE-block prompt; never paraphrase it from memory. (Every other prose summary of Mango in this folder is non-normative — for human readers; this paragraph is the paste text.)

```text
MANGO. Mango matches the attached Mango master and identity sheets exactly: a 46-year-old male anthropomorphic golden retriever with an upright human-readable body, solid soft middle-aged build, rounded shoulders, modest belly, sturdy legs, a thin neck with almost no throat ruff, textured face and feathered drop ears, human-shaped five-finger hands with subtle paw pads, broad canine feet, and absolutely no tail. His emotionally readable eyes show distinct paper-white sclera, a separate mid-gray iris, a separate round black pupil, controlled catchlights, subtle lids, short lashes, and soft fur-brow arcs. In the standard bar scene he sits on a stool with human posture at the room side of the bar, wearing a collared shirt under a rumpled jacket; the exact simplified waving USA flag pin from the attached pin reference is fixed to the left lapel, and an old fashioned — short rocks glass, one large cube — rests flat on the bar in front of him. Mango's wardrobe may change only when [SCENE] requires it; his body and identity never change.
```

If `canon/MASTER-PROMPT.md` and this file ever differ, the master prompt wins; fix this file.

## Hands Block

Use whenever a hand, grip, or gesture is readable. **The word "paw" never appears in prompt text for his hands** — the only permitted use is "subtle paw pads" as a surface detail, exactly as the locked paragraph writes it.

> Mango's hands are human-shaped five-finger hands — four fingers and one opposable thumb — with fine fur on the back of the hand, rounded fingertips, and subtle paw pads. They grip glasses, point, rest on the bar, and gesture like a middle-aged man's hands. Contact points are real: the fingers actually wrap what they hold. No quadruped forepaws, mitten hands, rubber-hose gloves, naked human skin hands, claws, or pass-through grips.

## Eye and Expression Block

> Mango's expression is [EXPRESSION]. Keep his eyes human-readable and canine-integrated: clearly visible paper-white sclera (about half the open-eye area), a separate circular mid-gray iris with a dark outer ring and fine radial texture, a separate round black pupil, one main catchlight plus one tiny glint, subtle lids, short lashes, and soft fur-brow arcs. Both pupils track [GAZE TARGET]. No black bead eyes, giant anime eyes, colored irises, crossed eyes, glamour lashes, or vacant gaze.

Approved `[EXPRESSION]` values: neutral/attentive, warmly happy, mid-story, thoughtful, skeptical, concerned, world-weary-but-happy, surprised.

## Scene-Clothing Block

Use when the scene requires wardrobe beyond the standard look:

> Dress Mango in [GARMENT] as scene-specific wardrobe fitted over his locked body. Preserve the solid soft build, thin neck, no-tail silhouette, five-finger hands, and broad canine feet; clothing never redraws the body beneath. If the garment has lapels, the USA flag pin from the pin reference is on the left lapel; on lapel-less outerwear it moves to the left chest. This outfit belongs only to this scene.

## Lapel-Pin Block

Use whenever Mango wears a jacket or outerwear:

> Fix the exact simplified waving USA flag pin from the attached pin reference to Mango's left lapel — the pin is mandatory on any lapeled jacket, always the left lapel; on lapel-less outerwear it moves to the left chest. The pin is strictly monochrome, about 3:2, with a restrained fabric wave, nine clean stars in a 3 × 3 grid, seven broad alternating bands, and a fine dark outline. No flagpole, finial, or stick; never oversized, fuzzy, right-lapel, colored, or replaced by a generic patriotic badge.

## Signature Old Fashioned Block

Use when the scene includes his drink (default in the standard bar scene):

> Include Mango's old fashioned: a short rocks glass with one large cube and restrained garnish (a single peel at most, often none). It rests flat on the bar or a coaster, or sits in a real five-finger grip with plausible contact points. Do not float, tip, or fuse the glass, and do not swap in a stemmed, tall, or novelty glass.

## Seated-at-the-Bar Block

Use for the standard stage position:

> Mango is on the patron/room side of the bar, seated squarely on a stool with human posture — hips on the seat, knees forward, feet planted or on the stool rail, torso upright or casually leaned. The stool is visibly or plausibly under him. He is never on the bartender's service side.

## Style Block

> Render as a dry mid-century American magazine cartoon in black-and-white ink wash: confident, variable-weight brush linework over soft gray washes; exactly three values (paper white, one mid-gray wash, solid black ink). Sparse directional strokes suggest short golden-retriever fur; layered feathering on ears and cheeks; throat strokes sparse and short. No color, photorealism, 3D-render, anime, vector-flat art, digital gloss, watermark, or signature.

## Negative Block

Append verbatim to any Mango generation:

> Do not redesign Mango. No tail, tail opening, or tail bulge in any view. No thick neck, beard, mane, bib, or chest ruff. No black bead eyes, giant anime eyes, colored irises, crossed eyes, or missing sclera-iris-pupil separation. No quadruped forepaws, mittens, gloves, naked human skin hands, or claws. No athletic, thin, obese, puppy, or bodybuilder body. No jacket over bare fur. No missing, right-lapel, pole-mounted, over-detailed, oversized, or colored flag pin on a lapeled jacket. No color, photorealism, 3D, anime, or vector-flat rendering. No traits borrowed from Drew or Abby.

## Prompt Order

For a full cartoon, follow `canon/MASTER-PROMPT.md` exactly: paste the BASE block verbatim and fill only `[SCENE]`, `[TV]`, `[BOARD]`. Slot language obeys his vocabulary — hands, never "paws". For Mango-only work, keep this order so scene details never overrule anatomy:

1. reference priority (locked master outranks everything);
2. Locked Identity Block;
3. Seated-at-the-Bar Block (or the scene's stage);
4. scene action, camera, and expression;
5. scene-specific wardrobe and the Lapel-Pin Block;
6. Hands Block and props (old fashioned block if present);
7. Style Block;
8. Negative Block;
9. no caption, balloon, or lettering in the image — the house typesets the exact caption afterward (`file_cartoon` over the connector).

Do not bury identity after scenery, clothing, or mood. Do not paraphrase the Locked Identity Block from memory.
