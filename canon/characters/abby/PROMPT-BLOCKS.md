# Abby Prompt Blocks

Use these blocks with `canon/MASTER-PROMPT.md`. They keep identity separate from scene variables and make reference use explicit. Abby appears only when the gag needs her — about one cartoon in ten.

## Required References

For every Abby image:

1. `full-body-sheet.png` — the locked master, always;
2. `identity-sheet.png` — always;
3. **exactly one** specialist sheet chosen for the shot: `expression-sheet.png` for emotional acting, `hands-props-sheet.png` for visible hand work, `bartender-actions-sheet.png` for movement, `wardrobe-details-sheet.png` for clothing or rear views, `bar-blocking-sheet.png` for environment and scale.

Over the studio connector, fetch the sheets with `get_model_sheet` and include the returned images as generation references; working directly in the repo, attach the files. State that the locked master outranks all other references. Never use a previously generated scene as the sole identity reference.

## Locked Identity Block

This is the ABBY paragraph from `canon/MASTER-PROMPT.md`, byte-identical. Paste it verbatim whenever Abby appears; never paraphrase it. (The prose summaries in `DESCRIPTION.md` and `CHARACTER-BIBLE.md` are non-normative — for human readers; this paragraph is the paste text.)

```text
ABBY. Abby is the adult female anthropomorphic West Highland White Terrier who owns and works The Swinging Door. Match her attached sheets exactly: compact textured Westie head, upright triangular ears, short canine muzzle, black canine nose, and medium-sized living human-style eyes integrated into the canine face with visible white sclera, separate gray irises, separate black pupils, controlled catchlights, clear lids, refined lashes, and expressive brow-fur. She has an upright feminine hourglass build with a fuller bust, narrow waist, slim hips, smooth shapely legs of short white fur, a natural thigh gap, five-digit hands, and absolutely no tail. Her locked work outfit is a fitted light collared blouse with rolled sleeves and only the top button open over modest scalloped lace, a very short dark fitted bartender skirt/apron with a centered back bow, a folded towel on her left shoulder, a delicate bracelet, black closed-toe mid-height heels, and one close strand of small round pearls with a centered oval faceted gemstone. Her default expression is a welcoming, intelligent smile unless [SCENE] names another approved expression. She is quick-witted, warm, poised, competent, and in charge — behind the bar, visibly mid-task, and when she is behind the bar the counter correctly hides her from the upper hip down.
```

## Expression Block

> Abby's expression is [EXPRESSION], directed toward [GAZE TARGET]. Build it from lids, brow-fur, gaze, cheek lift, and restrained muzzle shape on the same skull, muzzle, nose, eyes, fur, collar, and neckline. Both eyes track the same subject with aligned irises and pupils in visible sclera and living catchlights. No dot eyes, bead eyes, giant anime eyes, mismatched pupils, crossed gaze, human lips, or a large human tooth row.

Approved `[EXPRESSION]` values: welcoming smile (default), warm laugh, attentive listening, quick-witted smirk, one raised brow, skeptical side-eye, amused restraint, thoughtful concern, firm owner authority, dry deadpan, surprised but composed, compassionate reassurance.

## Work-Action and Prop Block

> Abby is [WORK ACTION] with five-digit hands: four slim fingers and one readable thumb touching the prop at structurally plausible contact points. Glass rims stay round, towels pass around — not through — vessels, and bottle necks are securely gripped. If she is serving, the drink is set or slid on the counter in front of the patron, base flat, fingers releasing or steadying the glass; the drink matches its owner — Drew's martini with exactly three olives on one pick, Mango's old fashioned in a short rocks glass with one large cube.

Approved `[WORK ACTION]` values: polishing a tumbler, setting a coaster, pouring a drink, serving a drink, carrying a small tray, reaching the back bar, greeting at the swinging doors, checking the room, opening, closing, stocking, or another explicit owner task. Approved idle gestures: relaxed hand at side, one hand on hip, open-palm welcome, one-finger witty point, palm-up explanation, folded arms, quiet stop palm, hands resting on the bar.

## Blocking and Continuity Block

> Abby is [BEHIND THE BAR mid-task / performing the named owner action: OPENING OR CLOSING, GREETING AT THE SWINGING DOORS, CHECKING THE ROOM, CARRYING STOCK, or SOLVING A PRACTICAL PROBLEM]. The counter top reaches her upper hip when she stands behind it and reaches seated patrons at forearm height; patrons' forearms and glasses rest on the counter between them; the floor behind the bar is level with the room. Behind the bar the counter correctly hides her from the upper hip down — never render her lower body through or in front of the counter, and never move her patron-side to show the outfit. She keeps the same head and body proportions relative to the counter, stools, doors, Drew, and Mango.

## Wardrobe Block

> Abby wears her locked work outfit by default. A scene may change garments only when [SCENE] explicitly requires it; her body, her pearl-and-gem collar, and the no-tail rule never change, and scene garments never carry into another scene. One folded towel sits on her left shoulder by default; when a work action uses the towel the shoulder may be bare; never two towels. The bracelet sits on her right wrist by default.

## Style Block

> Render as a sophisticated hand-drawn black-and-white ink-wash cartoon on warm off-white paper: confident variable-weight brush linework with exactly three values (paper white, one mid-gray wash, solid black ink). Keep Abby's eyes, nose, collar gemstone, and the gag's essential prop at the strongest useful contrast; the background stays one step lighter and looser. No color, photorealism, glossy 3D, anime, flat vector art, dense cross-hatching, watermark, or signature.

## Negative Block

Append verbatim to any Abby generation:

> Do not redesign Abby. No tail, tail tuft, tail slit, tail opening, or tail bulge. No shaggy furry legs, paw feet, bare feet, stockings, pants, long skirt, boots, or wardrobe substitution. No plain choker; retain the pearl strand and centered oval gemstone. No missing lace, towel, bracelet, back bow, or heels, and no second towel. No dot eyes, bead eyes, all-black eyes, giant eyes, empty irises, mismatched pupils, crossed gaze, fully human face, human nose, human ears, hairstyle, or exposed human skin tone. No puppy or child proportions. No exaggerated pin-up anatomy, explicit cleavage, vacant glamour pose, cruelty, incompetence, drunkenness, or submissive behavior. No patron-side placement without a named owner action, and no lower body rendered through or in front of the counter. No extra limbs, malformed hands, duplicated fingers, floating props, color, photorealism, 3D, anime, glossy airbrush, vector-flat shapes, watermark, speech balloon, or unauthorized text.

## Targeted Correction Language

Correct one defect at a time and explicitly preserve everything else:

- **Eyes:** "Change only Abby's eyes to the canonical living human-style construction; preserve every other mark."
- **Facial fur:** "Increase only the fine directional Westie fur texture on forehead, brows, cheeks, ears, outer muzzle, and jaw; preserve eye readability and all other features."
- **Collar:** "Change only the neckpiece to one close pearl strand with a centered oval faceted gemstone; preserve everything else."
- **Tail:** "Remove only the tail and any tail opening or bulge; reconstruct the skirt/apron rear as one continuous no-tail silhouette."
- **Legs:** "Change only the legs to smooth shapely adult legs of short white fur reading as a clean paper-white contour, with a natural thigh gap; preserve pose, skirt, and heels."
- **Hands:** "Correct only hand anatomy and object grip to five readable digits; preserve pose, prop position, and every other detail."
- **Blocking:** "Abby must be BEHIND the bar; the counter hides her from the upper hip down; preserve everything else."

Never request a general "improvement" during a correction pass. Name the defect and lock unaffected features.

## Complete Scene Template

Append a scene block without altering the identity lock:

```text
Reference priority: full-body-sheet.png is the locked master and outranks all support images.

[PASTE LOCKED IDENTITY BLOCK]

Scene: [specific location and one focal action].
Framing: [close-up / waist-up / full-body / wide], [front / 3/4 / profile / rear 3/4], eye-level unless specified.
Expression: [one named expression from the library], directed toward [gaze target].
Hands and props: [exact action, grip, and object placement].
Continuity: Abby is [behind the bar mid-task / performing the named owner action]. The counter top reaches her upper hip standing behind it and seated patrons at forearm height; behind the bar it correctly hides her from the upper hip down. Preserve every locked body, outfit, and jewelry feature.

[PASTE STYLE BLOCK]
[PASTE NEGATIVE BLOCK]

Text: no lettering anywhere in the image except the reversed window sign, the short chalkboard lines, and the TV screen. Do not render the caption, title, date, speech balloon, signature, watermark, or long readable text. Reserve clean space for deterministic dialogue added afterward.
```

## Prompt Order

Keep the prompt in this order to prevent scene details from overruling anatomy:

1. reference priority;
2. locked identity block;
3. scene action;
4. camera, framing, and expression;
5. wardrobe (default work outfit or explicit [SCENE] garments);
6. hands, work action, and props;
7. blocking and counter continuity;
8. style block;
9. negative block;
10. deterministic text instruction.

Do not bury identity after scenery, clothing, or mood. Do not paraphrase the locked identity block from memory.
