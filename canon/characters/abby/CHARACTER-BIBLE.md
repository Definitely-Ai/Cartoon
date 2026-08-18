# Abby Character Bible

<!-- BRAND: replace when final — "The Swinging Door" is the working series/bar name throughout this document -->

This document turns Abby's locked model into repeatable production decisions. `DESCRIPTION.md` is the compact written authority; `full-body-sheet.png` is the highest visual authority; the paste text is the ABBY paragraph in `canon/MASTER-PROMPT.md`, copied byte-identically in `PROMPT-BLOCKS.md`. This bible explains how to preserve all three across expressions, poses, wardrobe, props, and scenes.

## 1. Identity and Dramatic Function

| Field | Canon |
| --- | --- |
| Name | Abby |
| Species | Anthropomorphic West Highland White Terrier (Westie) |
| Gender | Female |
| Age | Adult |
| Build | Feminine adult hourglass; polished, healthy, work-capable |
| Signature accessory | Close pearl strand with one centered oval faceted gemstone |
| Role | Owner and working bartender of The Swinging Door; memory keeper and quiet referee |
| Default state | Welcoming, intelligent smile, visibly mid-task behind the bar |
| Rendering | Hand-drawn black ink wash — exactly three values (paper white, one mid-gray wash, solid black ink) — on warm off-white paper |

Abby is **the house**: owner, bartender, memory keeper, and quiet referee. Other characters bring the argument; Abby recognizes the pattern. She reads as an attractive adult woman who happens to be a Westie, not a dog balancing on hind legs. She is a selective supporting character (about one cartoon in ten): use her when the joke benefits from the room itself answering back, not simply to fill the background.

## 2. Reference Hierarchy

When two references disagree, use this order:

1. `full-body-sheet.png` — locked master model.
2. The written canon — `DESCRIPTION.md` and this bible.
3. `canon/MASTER-PROMPT.md` — assembled paste text and room rules.
4. The most relevant specialist/support sheet.
5. Older cartoons — story history only.

Never average conflicting images together. Match the master, record the conflict, and correct the lower-authority reference later.

### Minimum reference stack

- Always attach `full-body-sheet.png` and `identity-sheet.png`.
- Add **exactly one** specialist sheet chosen for the shot: `expression-sheet.png` for emotional acting, `hands-props-sheet.png` for visible hand work, `bartender-actions-sheet.png` for movement, `wardrobe-details-sheet.png` for clothing or rear views, `bar-blocking-sheet.png` for environment and scale.
- Over the studio connector, fetch sheets with `get_model_sheet` and include the returned images as generation references; working directly in the repo, attach the files.
- Never substitute a previously generated scene for the locked master.

## 3. Construction

### Silhouette and shape language

Abby's silhouette combines a compact textured terrier head, two upright triangular ears, a softly curved feminine torso, long clean leg lines, practical heels, and an economical working pose. Curves communicate warmth and confidence. Small angular accents in the ears, collar points, brows, skirt edge, and heels communicate intelligence and authority. At thumbnail size the silhouette must remain readable before fur texture, facial detail, or props are considered.

### Overall proportions

- Head is compact and adult-proportioned; never puppy-large.
- Shoulders are relaxed and modestly narrow.
- Bust is fuller but tasteful, supported by the fitted blouse rather than exaggerated anatomy.
- Waist narrows clearly at the apron top.
- Hips stay slim and balanced under the short fitted skirt/apron.
- Arms articulate like a human's and hang naturally to the upper thigh.
- Legs are slender and shapely rather than muscular, stick-thin, or shaggy.
- Neutral front and rear stances show a small natural thigh gap without forced bow-legged anatomy.
- Posture is upright and poised: open chest, relaxed shoulders, balanced pelvis, stable heel placement.

### Proportion anchors (working)

These anchors guide consistency; the locked master outranks the numbers.

| Anchor | Working target | Reject when |
| --- | --- | --- |
| Total standing height | About 6.5–7 of her own head units (crown to chin, ear tips excluded) | Squat, puppy-headed, or fashion-model extreme |
| Versus Drew | Her crown (ear tips excluded) at about Drew's standing shoulder height | Resized to match a guest shot-to-shot |
| Versus Mango | Close to eye level with Mango seated on his stool when she stands behind the bar | Head or body rescaled between panels |
| Counter | Top at her upper hip standing behind it; at seated patrons' forearm height on the room side | Counter at her waistline, chest, or knees |

### Body target

- Correct: adult, feminine, shapely, polished, healthy, work-capable, and self-possessed.
- Too juvenile: oversized head, tiny torso, short limbs, puppy behavior, schoolgirl silhouette.
- Too generic: cylindrical torso, shapeless waist, long service apron, paw feet, neutral mascot anatomy.
- Too exaggerated: impossible bust, wasp waist, pin-up spine curve, explicit cleavage, fetish heels, or vacant posing.
- Too rough: bodybuilder definition, heavy cross-hatching, bulky limbs, or coarse anatomy.

### Legs

- Exposed legs are covered in short, smooth white fur that reads as a clean paper-white contour — not human skin, and not the longer layered Westie coat continuing below the skirt.
- Use clean outer contours and the one mid-gray wash for form.
- Knees and calves are lightly indicated, never knobby, shaggy, heavily muscled, or airbrushed.
- Maintain a modest natural thigh gap in neutral front and rear views.
- Ankles taper cleanly into closed-toe heels.
- Never use canine hind paws, bare feet, stockings, boots, exaggerated platform heels, or animal hocks.

## 4. Head and Facial Construction

### Skull, ears, muzzle, and nose

- Head is slightly wider through the cheek fur than through the brow.
- Forehead rises softly between the ears with short upward fur clumps.
- Ears sit high, remain upright, and form clean triangles with a restrained dark inner-ear wash.
- Muzzle projects clearly from the lower face and stays short and softly squared.
- Nose is a small rounded triangular canine nose in solid black, with controlled nostril marks and one tiny highlight when scale permits.
- Mouth follows the muzzle anatomy: a small canine smile, conversational half-smile, or restrained open laugh; never human lips or a large human tooth row.
- Chin fur forms a soft point but never a hanging beard.

### Facial fur

Facial texture is a mandatory identity feature.

- Use fine tapered strokes around the forehead, brow-fur, temples, cheek planes, outer muzzle, jaw edge, and ears.
- Fur direction follows the skull and cheek volume rather than radiating as a uniform halo.
- Keep the shortest, lightest strokes around the eyes so sclera, iris, lids, and gaze remain clear.
- Medium strokes feather through the cheeks and ear edges to establish Westie identity.
- Muzzle strokes stay fine and sparse enough to preserve mouth readability.
- Lower jaw transitions into a neat neck without a beard, mane, bib, or circular ruff.
- Never replace texture with smooth white fill, curly poodle fur, long shag, or dense cross-hatching.

## 5. Eye Bible

Abby's eyes carry dialogue-level intelligence. They use human expressive mechanics while remaining structurally part of a canine face.

| Element | Locked rule |
| --- | --- |
| Opening | Medium adult almond-to-rounded opening, correctly set into the canine skull |
| Sclera | Paper white and visibly separated around the iris |
| Iris | Circular medium-gray iris, approximately half the eye-opening height |
| Iris detail | Fine radial ink texture with a crisp darker outer ring |
| Pupil | Round solid-black pupil, centered within the iris and consistent between eyes |
| Catchlights | One small clear main catchlight plus one tiny secondary glint when scale allows |
| Lids | Clear upper lid, lighter lower lid, restrained moisture line |
| Lashes | Refined short upper lashes; feminine, never glamour-heavy |
| Brows | Directional fur-brow arcs that sit naturally in the face |

### Eye acting

- Gaze direction comes from moving aligned irises and pupils within visible sclera.
- Both eyes track the same intended subject and obey the same perspective.
- Welcoming: open attentive lids, centered or guest-directed gaze, soft brow-fur.
- Listening: lids soften, pupils hold steadily on the speaker, inner brows relax.
- Quick-witted: small side gaze, one brow arc lifting, mouth corner slightly raised.
- Skeptical: asymmetric lid compression and side gaze, never a giant cartoon eyebrow.
- Concerned: inner brow-fur rises, pupils settle on the subject, mouth softens.
- Firm: lids narrow modestly, chin levels, catchlights remain alive.
- Surprised: opening widens only slightly; irises and pupils do not shrink into dots.
- Laughing: lids may close gently while cheeks lift; the face must still read as Abby.

### Eye anti-drift

Never use dot eyes, solid-black bead eyes, empty gray discs, fully dilated pupils, giant anime eyes, mismatched pupil sizes, crossed gaze, colored irises, glossy photoreal eyeballs, pasted-on human eyelid skin, heavy makeup, or lifeless identical stares. Sclera, iris, pupil, lids, catchlights, and brow-fur remain separate readable structures whenever scale permits.

## 6. Hands, Feet, and Gesture Anatomy

### Hands

- Five digits: four slim practical fingers and one opposable thumb.
- Human palm proportions support polishing, pouring, serving, carrying, pointing, and resting on the bar.
- Fine white fur may transition lightly over the wrist and back of hand; no exposed human skin tone.
- Fingers make physical contact with props at structurally plausible points.
- Glass rims stay round, towels pass around — not through — vessels, and bottle necks are securely gripped.
- Never use quadruped forepaws, mittens, rubber-hose gloves, duplicated fingers, fused fingertips, broken wrists, or floating props.

### Feet and heels

- Work-outfit feet are fully contained by black closed-toe mid-height heels.
- Heel height is elegant but stable enough for a full shift.
- Shoe perspective follows the stance; soles meet the floor.
- Never show claws, toes, paw pads, bare feet, open-toe shoes, stilettos, or canine paws.

## 7. Tail Rule

Abby has **no tail**. This is a hard continuity constraint, not a crop preference.

- Rear views show a clean uninterrupted back-bow and skirt/apron silhouette.
- There is no slit, loop, opening, tuft, bulge, or displaced bow implying a hidden tail.
- The bow is garment construction, not a tail substitute.
- Do not add a tail for breed recognition, balance, emotion, action, or comedy.
- If a generation produces any tail-like shape, reject it; do not rationalize it as a towel or fold.

## 8. Locked Work Wardrobe

Wardrobe policy: her work outfit is the default; a scene may change garments only when [SCENE] explicitly requires it; her body, her pearl-and-gem collar, and the no-tail rule never change. Scene-specific garments never carry into another scene by default.

### Blouse and neckline

- Light fitted collared blouse with darts and restrained folds following the torso.
- Sleeves rolled neatly to the forearms with tidy cuffs.
- Only the top button is open.
- A modest scalloped lace inset is visible at the neckline.
- Cleavage is subtle and adult; attractive without becoming explicit or impractical.
- Never fully button the normal work blouse, open multiple buttons, omit the lace, or substitute a T-shirt, vest, jacket, corset, or costume top.

### Skirt/apron

- Very short, dark, fitted, high-waisted bartender skirt/apron.
- Hem is straight to subtly curved and remains practical for work.
- Surface carries the one restrained mid-gray wash and may use a quiet geometric texture at close range.
- Large functional bow is centered at the back and clearly tied.
- Rear panel is continuous with no tail slit, tuft, opening, or bulge.
- Never replace with a long skirt, trousers, shorts, full dress, or full-length service apron.

### Pearl-and-stone collar

The collar is Abby's signature accessory and a major recognition anchor.

- One close-fitting strand of small, evenly spaced, round pearls.
- Pearls are paper white with a fine dark contour and restrained individual highlight.
- One oval faceted gemstone hangs exactly at center front.
- Gemstone has a medium-gray core, a simple dark metal bezel, and one controlled highlight.
- The setting is delicate and subordinate to Abby's face; it never becomes a giant pendant.
- The strand follows the neck in every angle and disappears correctly behind the neck in profile and rear views.
- Never use a plain leather choker, chain, ribbon, multiple pearl strands, off-center stone, heart charm, or generic pendant.

### Towel, bracelet, and heels

- **One** folded clean bar towel drapes over her **left shoulder by default** and remains narrow enough not to hide the neckline. When a work action uses the towel — polishing, wiping the counter — the shoulder may be bare. Never draw two towels.
- One delicate bracelet sits on the right wrist by default.
- Black closed-toe mid-height heels complete the standard work outfit.
- At small scale, simplify surface texture and individual pearl highlights before deleting any locked item.

## 9. Expression Library

Her default expression is a welcoming, intelligent smile unless [SCENE] names another approved expression. Expressions are changes in lids, brow-fur, gaze, cheek lift, and restrained muzzle shape — not new faces.

| Expression | Construction | Story use |
| --- | --- | --- |
| Welcoming smile | Open attentive eyes, lifted cheeks, small open canine smile | Greeting and hospitality |
| Warm laugh | Eyes gently closed, cheeks lifted, open smiling muzzle | Genuine delight |
| Attentive listening | Soft lids, steady gaze, quiet mouth | Giving someone room to speak |
| Quick-witted smirk | Side gaze, one mouth corner lifted | She sees the turn first |
| One raised brow | Uneven brow-fur, level mouth | A claim strains belief |
| Skeptical side-eye | Compressed lids, sideways gaze | A familiar bad argument |
| Amused restraint | Soft side gaze, tiny smile | The room proves her point |
| Thoughtful concern | Inner brows raised, softened mouth | Real stakes beneath the joke |
| Firm owner authority | Level chin, narrowed lids, closed mouth | Boundaries and last call |
| Dry deadpan | Half lids, centered gaze, neutral mouth | Absurdity needs no help |
| Surprised but composed | Slightly wider lids, raised brows, controlled mouth | New information lands |
| Compassionate reassurance | Soft direct gaze, small closed smile | Kindness without fuss |

Preserve the same skull, muzzle, nose, eyes, fur, collar, and neckline across the whole range.

## 10. Pose and Bartender-Action Library

### Approved gestures

- Relaxed hand at side.
- One hand on hip.
- Open-palm welcome.
- One-finger witty point.
- Palm-up explanation.
- Folded arms for restrained patience.
- Quiet stop palm for last call.
- One or both hands resting naturally on the bar.

### Approved work actions

- Polishing a tumbler: one hand supports the vessel while the other controls the towel inside and around it.
- Setting a coaster: coaster lies flat and visibly contacts the counter.
- Pouring a drink: bottle grip, receiving glass, and liquid stream remain physically plausible.
- **Serving a drink:** the drink is set or slid on the counter in front of the patron, base flat on the counter, fingers releasing or steadying the glass at plausible contact points. Drinks match the owner: Drew's martini is a stemmed triangular glass with exactly three olives on one pick; Mango's old fashioned is a short rocks glass with one large cube.
- Carrying a small tray: one hand balances it while the free arm counterbalances.
- Reaching the back bar: rear three-quarter pose preserves the centered bow and no-tail silhouette.
- Greeting at the swinging doors: one hand controls the door while the other opens toward the room.
- Checking the room, opening, closing, stocking, or handling another explicit owner task.

Abby moves efficiently and never flails. Wit uses one economical finger or palm-up gesture. Authority uses squared shoulders, level chin, and a quiet hand signal. Avoid theatrical mugging, giant gestures, slapstick imbalance, airborne poses, or vacant glamour posing.

## 11. Bar Blocking and Scene Continuity

- Abby ordinarily works behind the bar, visibly mid-task. The counter top reaches her upper hip when she stands behind it and reaches seated patrons at forearm height on the room side; patrons' forearms and glasses rest ON the counter between them. The floor behind the bar is level with the room.
- **Occlusion is correct:** behind the bar, the counter correctly hides Abby from the upper hip down. That is the right drawing, not a fault. Never render her lower body through or in front of the counter, and never move her patron-side just to show the outfit. Leg, heel, and skirt gates apply only when a legitimate owner-action scene shows her full figure.
- **One exception rule:** she may leave the service side only for an explicit owner action named in the scene — opening or closing, greeting at the swinging doors, checking the room, carrying stock, or solving a practical problem. She is never a casual patron and is never casually drinking during a shift.
- Preserve human scale relative to the counter, stools, doors, bottles, glassware, Drew, and Mango. In a two-character exchange, state the gaze target for each character. Abby keeps the same head and body proportions rather than resizing to match a guest.
- The Swinging Door is hers: warm, worn, orderly, timeless, and familiar — never seedy, slick, nightclub-like, or a modern sports bar.
- Use one clear focal action and only props that support the scene or gag.

## 12. Personality Translated into Drawing

- Intelligence: attentive gaze, controlled brow asymmetry, economical movement, precise prop handling.
- Wit: a small side glance, one raised brow, or tiny mouth-corner lift — never mugging.
- Warmth: open torso, living catchlights, relaxed shoulders, and a genuine welcoming smile.
- Authority: stable stance, level chin, direct gaze, and unhurried hand placement.
- Observation: she reacts while completing a task rather than dropping everything to perform.
- Patience: she lets regulars finish the familiar argument without becoming passive.
- Attractiveness: poise, eye contact, polish, confidence, and coherent adult design — not self-objectification.

She may be dry, skeptical, firm, or gently condescending, but never cruel, ditzy, submissive, naïve, sloppy, intoxicated, incompetent, or desperate for attention.

## 13. Scale and Simplification

- Close-up: retain radial iris texture, separate pupils, both catchlights, lids, lashes, brow-fur, layered muzzle and cheek fur, individual pearls, gemstone facets, and lace edge.
- Medium shot: retain visible sclera, separate iris/pupil, catchlight, ear triangles, facial-fur direction, pearl silhouette, centered gemstone, lace, towel, and bracelet.
- Full body: prioritize ear/head silhouette, living pale eyes, hourglass torso, short dark apron-skirt, smooth white-furred leg line, heels, no tail, and stable gesture.
- Thumbnail: preserve two upright ears, pale eye shapes, small black nose, light blouse/dark skirt contrast, slim legs, black heels, and no-tail rear shape.
- Simplify interior hatching before deleting identity anchors. If any locked feature is unclear because of scale, simplify the rendering while preserving the rule; never substitute different anatomy or wardrobe.

## 14. Style Translation

- Strict black-and-white hand-drawn ink wash on warm off-white paper: exactly three values (paper white, one mid-gray wash, solid black ink).
- Confident variable-weight line: heavier at structural overlaps, finer at facial fur, lace, and pearl details.
- Eyes, nose, collar gemstone, and the gag's essential prop receive the strongest useful contrast.
- Background detail stays lighter and looser than Abby.
- No color, glossy digital airbrush, 3D, photorealism, anime, flat vector art, clip-art mascot rendering, dense cross-hatching, or muddy all-over wash.

## 15. Scene Assembly Order

1. Lock identity from `full-body-sheet.png`, `identity-sheet.png`, and the master prompt's ABBY paragraph.
2. Choose an approved expression, gesture, and work action.
3. Confirm head, ears, eyes, fur texture, hourglass build, hands, legs, heels, collar, and no-tail silhouette.
4. Place her behind the bar (or in one named owner action) with correct counter geometry and occlusion.
5. Add the prop and establish a plausible five-digit grip; served drinks match their owner.
6. Add other characters from their own references.
7. Construct the setting without redesigning Abby.
8. Apply ink and wash within the three-value hierarchy.
9. Reserve the deterministic dialogue area; never ask the image model to typeset the caption.
10. Run `QUALITY-CONTROL.md` against the actual pixels.

## 16. Forbidden Drift

Reject any output containing:

- any tail, tail opening, tail bulge, tuft, or tail-like shape;
- bead, dot, giant, empty, crossed, mismatched, colored, or photoreal-human eyes;
- a smooth generic face, beard, mane, hairstyle, or uniform fur halo;
- a human muzzle, nose, ears, skull, lips, or tooth row;
- shaggy or human-skin legs, paw feet, bare feet, stockings, missing thigh gap;
- hands missing a thumb or fingers, duplicated, fused, paw-like, or disconnected from props;
- a fully buttoned or over-opened blouse, missing lace, or substituted top;
- a long or loose skirt, trousers, missing centered rear bow, or implied tail opening;
- a missing pearl strand, plain choker, chain, multiplied strands, or off-center stone;
- a missing towel, bracelet, or heels when visible — or two towels;
- childlike, anatomically extreme, explicit, vacant, or impractical attractiveness;
- cruel, ditzy, drunk, submissive, incompetent, or casual-patron behavior;
- wrong counter scale, wrong-side blocking, or her lower body rendered through the counter;
- color, photorealism, 3D, anime, vector-flat, glossy, or densely cross-hatched rendering;
- traits, props, or wardrobe copied from Drew or Mango.

## 17. WRITING ONLY — never include in an image prompt

Everything in this section is for captions, story, and scene selection. It never enters an image-generation prompt.

### Voice and dialogue

- Usually one sentence; occasionally two very short sentences.
- Declarative phrasing over questions.
- Concrete bar language may carry the metaphor.
- She rarely explains the joke after landing it.
- She addresses people by name when restoring order or showing affection.
- She may gently undercut both sides at once.
- Contractions are natural; slang is light and timeless.
- No breathless enthusiasm, corporate language, therapy jargon, or internet catchphrases.

Her dialogue rhythm is: listen while completing a task; look up or set down the object; deliver one exact line; return to the task or let the silence work.

Approved voice examples:

- "Last call was a metaphor, gentlemen. This one's real."
- "I don't give financial advice. I just stop pouring."
- "You've both been right all night. Separately."
- "The TV has a mute button. So does the bar."
- "I heard the first version of that story before the ice melted."
- "It's your argument. I'm only keeping it on a coaster."
- "The house position is that both of you need water."
- "Take your time. The truth usually arrives after the volume leaves."

### Relationship posture

- Abby respects Drew and Mango and knows their habits well enough to tease them safely.
- Drew names the absurdity; Mango believes his way into it; Abby closes the loop when her intervention is earned.
- She never humiliates a vulnerable person, flirts to obtain control, or becomes a prize in someone else's argument.
- Her authority comes from ownership, competence, memory, and emotional clarity.
- She remains a selective supporting character: use her when the joke benefits from the room itself answering back.

## 18. Approval Standard

An image does not pass merely because it is attractive or funny. It passes only when the locked identity survives the exact requested scene. Hide the collar and caption: if Abby is not immediately recognizable from her ears, eyes, muzzle, fur texture, silhouette, and poised bearing, reject it.
