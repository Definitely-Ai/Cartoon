> **SUPERSEDED WHERE IT DISAGREES — `canon/HARRINGTON-VISION.md` and the
> plates in `canon/vision/` now govern this character's design, rendering,
> and wardrobe. Use this document only for structure that the vision does not
> address; every visual detail below yields to the plates and the founder's
> review notes.**

# Mango Character Bible

This document turns Mango's locked model into repeatable production decisions. `DESCRIPTION.md` is the compact authority; `full-body-sheet.png` is the highest visual authority; the MANGO paragraph in `canon/MASTER-PROMPT.md` is the only paste-ready identity text. This bible explains how to preserve all three across expressions, poses, wardrobe, props, and scenes.

## 1. Identity and Dramatic Function

| Field | Canon |
| --- | --- |
| Name | Mango |
| Species | Anthropomorphic golden retriever |
| Gender | Male |
| Age | 46 |
| Build | Solid, soft, approachable middle-aged |
| Signature accessory | Simplified waving USA flag pin, left lapel |
| Signature drink | Old fashioned — short rocks glass, one large cube |
| Role | One of the two primary patrons of The Swinging Door; the earnest heart of the duo |
| Stage position | Patron/room side of the bar, seated on a stool with human posture |
| Default state | Warm, attentive, quietly amused |
| Rendering | Hand-drawn black ink, exactly three values (paper white, one mid-gray wash, solid black ink) |

Mango is approachable, earnest, intelligent, patriotic, story-prone, institution-skeptical, sometimes world-weary, and happy underneath it. He leans toward people and stories where Drew leans toward information and mechanisms. He may be earnest or mistaken, but never mean, predatory, smug, vacant, or defeated.

The audience should understand within one second that Mango is a middle-aged man at the bar who happens to be a golden retriever—not a dog standing unnaturally on its hind legs, and not a mascot.

## 2. Reference Hierarchy

When two references disagree, use this order:

1. `full-body-sheet.png` — locked master model.
2. The written canon — `DESCRIPTION.md` and this bible.
3. `canon/MASTER-PROMPT.md` — the assembled BASE block and its MANGO paragraph.
4. The relevant specialist/support sheet — `identity-sheet.png` for face and expression; `lapel-pin-bible.png` as the authority for pin design and placement.
5. Older cartoons — story history only.

Never average conflicting images together. Match the master, record the conflict, and correct the lower-authority reference later. Do not blend old and new models; if the current sheets are attached, match them rather than inventing a compromise.

### Minimum reference stack

Sheets are fetched with `get_model_sheet` over the studio connector, or attached directly when working in-repo.

- Always attach `full-body-sheet.png` and `identity-sheet.png`.
- Attach `lapel-pin-bible.png` whenever Mango is jacketed.
- Never substitute a previously generated scene for the locked master.

## 3. Body Construction

### Overall silhouette

- Height reads as approximately six and a half heads.
- Head is generous but adult-proportioned; never puppy-large.
- Shoulders are broad and rounded rather than squared or muscular.
- Rib cage is substantial, with a soft chest and no carved pectoral definition.
- Waist narrows only slightly; the abdomen has a modest, comfortable forward curve.
- Hips are stable and medium-wide; thighs and calves are sturdy without athletic separation.
- Arms hang naturally to the upper thigh. Elbows, wrists, knees, and ankles articulate like a human's.
- Posture is relaxed and balanced: weight over both feet when standing, pelvis level, shoulders easy.
- The seated silhouette remains human: hips on the stool, knees forward, feet planted, torso upright or casually leaned.

### Body-mass target

The intended build sits between "average middle-aged" and "stocky." Use the following test:

- Correct: solid, softly padded, comfortable in a jacket, approachable.
- Too thin: narrow ribs, sharp waist, long fragile limbs, fashion-model silhouette.
- Too muscular: superhero shoulders, visible abs, hard chest, vascular arms.
- Too heavy: large hanging abdomen, multiple folds, very thick neck, compressed posture.

### Base-model anatomy

The unclothed sheet is a neutral construction model for wardrobe fitting, not a canonical state of dress in finished cartoons.

- Cover the body in fine, short golden-retriever fur indicated by sparse directional ink strokes.
- Keep anatomy family-safe and featureless under the fur; no genital detail.
- Preserve readable shoulder, elbow, wrist, hip, knee, and ankle landmarks for clothing and posing.
- Clothing must sit on top of this exact volume. Never redraw a different body to fit an outfit.

## 4. Head and Facial Construction

### Skull, muzzle, and nose

- Skull is broad and softly domed, with an adult forehead and no puppy roundness.
- Muzzle projects clearly from the face and is moderate in length—neither a short mascot snout nor a long naturalistic dog muzzle.
- Bridge tapers gently toward a broad, rounded triangular black nose.
- Nose is solid black with two controlled nostril marks and one restrained white highlight when scale permits.
- Mouth corners remain soft. A closed mouth, conversational half-smile, or relaxed open smile are all valid.
- Teeth are minimal and incidental; never a large human tooth row or aggressive canine display.

### Ears

- Medium-long golden-retriever drop ears, rooted high at the sides of the skull.
- Ear leather hangs naturally and is covered with layered feathering.
- Ear position supports emotion subtly: attentive lift at the root, relaxed drop, slight backward concern.
- Never erect terrier ears, spaniel-length ears, tiny mascot ears, or identical mirrored ear shapes.

### Facial fur

Facial texture is required, but it must not become a beard.

- Use fine tapered strokes around the forehead, fur-brows, temples, cheek planes, outer muzzle, jaw edges, and ears.
- Shortest strokes sit around the eyes and muzzle so expressions remain legible.
- Medium strokes feather through the cheeks and ears to establish golden-retriever identity.
- Fur direction follows facial volume rather than forming a uniform halo.
- The lower jaw transitions cleanly into a thin neck. Keep throat strokes sparse and short.
- Never add a shaggy chin, hanging beard, lion mane, chest bib, or circular neck ruff.

## 5. Eye Bible

Mango's eyes carry dialogue-level information. They are intentionally more human-readable than natural dog eyes, while remaining integrated into the canine skull.

### Canonical construction

| Element | Locked rule |
| --- | --- |
| Opening | Soft adult almond/oval, modest in size, correctly set into the canine skull |
| Sclera | Clearly visible paper-white sclera (about half the open-eye area) |
| Iris | Circular mid-gray iris, about 45–50% of the eye-opening height |
| Iris detail | Fine radial ink texture with a crisp dark outer ring |
| Pupil | Round solid-black pupil, approximately one third of the iris diameter |
| Catchlights | One clear white main catchlight plus one tiny secondary glint |
| Lids | Readable upper lid, subtle lower lid, delicate moisture line |
| Lashes | Two or three short upper lashes; understated and masculine |
| Brows | Soft directional fur arcs, never pasted-on human eyebrow strips |

### Expression mechanics

- Gaze direction comes from moving the iris/pupil within the clearly visible paper-white sclera—not from rotating the whole head every time.
- Both pupils must track the same target and remain aligned in perspective.
- Thoughtful/listening: upper lids lower slightly; pupils hold steady; inner fur-brows lift a little.
- Happy: lower lids lift gently; catchlights remain visible; brow tension releases.
- Skeptical: one lid lowers slightly more than the other; never a giant arched eyebrow.
- Concerned: pupils rise subtly; inner fur-brows lift; mouth stays restrained.
- Surprised: eye opening increases modestly, but iris and pupil do not shrink into dots.
- World-weary: lids lower without removing the sclera or extinguishing catchlights.

### Eye anti-drift

Never use solid black button eyes, tiny bead eyes, fully dilated pupils, enormous anime eyes, pasted-on photoreal human eyes, colored irises, glamour eyeliner, long lashes, crossed eyes, or mismatched gaze. The clearly visible paper-white sclera (about half the open-eye area), gray iris, and black pupil must remain three separate readable shapes even at thumbnail scale.

## 6. Hands and Feet

**Prompt-language hard rule: the word "paw" never appears in prompt text for Mango's hands.** He has **hands**—write "hands," "five-finger hands," or "human-shaped hands." "Subtle paw pads" is a surface detail of those hands, exactly as the locked identity paragraph states; it is the only permitted use of the word, and never as a noun for the hands themselves. Never write "paws," "forepaws," or "paw hands" in a slot, scene sentence, or any generation prompt.

### Hands

- Five digits: four fingers and one opposable thumb.
- Human palm proportions support gripping glasses, pointing, resting on the bar, and conversational gestures.
- Fingers are slightly broad and rounded, not elegant or bony.
- Fine fur continues onto the back of the hand and ends near the fingertips.
- Palm carries one large central canine pad; fingertips carry small rounded pads.
- Pads are wash-and-ink shapes only. Nails and claws are not emphasized.
- Never use quadruped forepaws, mitten hands, rubber-hose gloves, or photoreal human skin hands.

### Feet

- Broad plantigrade canine feet with a stable heel and four readable front toes.
- Feet support a human standing or seated posture.
- Toes are rounded; claws are absent or too subtle to read.
- Never human dress-shoe feet unless the wardrobe explicitly covers the canonical foot volume.

## 7. Tail Rule

Mango has **no tail**. This is a hard continuity constraint, not a camera-choice preference.

- Rear views show an uninterrupted lower-back and seat silhouette.
- Jackets, trousers, stools, and chairs never conceal an implied tail opening.
- Do not add a tail for balance, emotion, breed recognition, or action posing.
- If a generation produces any tail shape, reject it rather than painting over it ambiguously.

## 8. Wardrobe System

### Base versus finished scenes

- `full-body-sheet.png` is the clothing-neutral construction authority.
- Finished-scene clothing is dictated by the scene, occupation, weather, and joke.
- Clothing changes; body, head, eyes, neck, hands, feet, and the no-tail rule do not.

### Standard Swinging Door look

When no special wardrobe is requested, Mango wears:

- A slightly rumpled, comfortable jacket with soft lapels.
- An open-collar shirt under the jacket—never a tight formal collar choking the thin neck, and never a jacket over bare fur.
- Straight or gently relaxed trousers fitted over the canonical legs.
- The USA pin on the **left lapel**.

The jacket should make him look established and approachable, not sleek, rich, athletic, or costume-like.

### Other scene wardrobes

Golf, fishing, travel, weather, work, and formal scenes may use appropriate clothing. Fit every outfit over the approved base model and preserve adult proportions. Do not introduce character-defining accessories that compete with the USA pin or change his silhouette permanently.

## 9. USA Lapel-Pin Bible

Use `lapel-pin-bible.png` as the visual authority for design and placement.

**Placement rule:** the pin is mandatory on any lapeled jacket, always the left lapel; on lapel-less outerwear it moves to the left chest.

- A recognizable simplified USA flag pin, strictly monochrome—the pin never carries color; it reads by shape.
- Proportion approximately 3:2.
- Flag shape carries a restrained fabric wave; it is not a rigid rectangle.
- No flagpole, finial, stick, or waving-hand prop.
- Simplified canton uses nine clean stars in a 3 × 3 grid; never attempt fifty tiny stars.
- Field uses seven broad alternating bands; never dense micro-stripes.
- Fine dark outline keeps it readable at newspaper size.
- On a lapel, aligned with the lapel angle.
- Small and crisp; never oversized, fuzzy, gray-blurred, on the right lapel, or replaced by a generic patriotic badge.

## 10. Signature Old Fashioned

Mango's recurring drink is an old fashioned. When it appears:

- **Glass:** a short rocks glass—never a stemmed, tall, or novelty glass.
- **Ice:** one large cube.
- **Garnish:** restrained—a single peel at most, often none.
- **Physics:** the glass rests flat on the bar or a coaster, or sits in a real five-finger grip with plausible contact points; never floating, tipped without a story reason, or fused with hand or counter.

In the standard bar scene it rests flat on the bar in front of him by default. In other scenes it is optional unless the gag calls for it. Do not carry the glass's state (full, empty, knocked over) from one cartoon into the next without an explicit continuity instruction.

## 11. Pose and Acting Library

### Stage position

An identity constant: Mango belongs on the **patron/room side** of the bar, **seated on a stool with human posture**—hips on the seat, knees forward, feet planted or on the stool rail, weight believable. He never works or reaches from the bartender's service side.

### Default poses

- Seated companionably at the bar, torso upright, one hand near the old fashioned.
- Mid-story with one hand raised in an open conversational gesture.
- Listening with both hands relaxed and gaze directed toward Drew or the television.
- Standing front or three-quarter with weight balanced and shoulders relaxed.

### Acting principles

- Lead with eyes and hands; support with a small head angle and restrained mouth.
- Keep gestures economical enough for a single-panel magazine cartoon.
- Preserve adult dignity. He may be earnest or mistaken, but never buffoonishly frantic.
- Avoid extreme squash-and-stretch, giant open mouths, airborne poses, or puppy behavior.

## 12. Expression Library

The following are canonical ranges, not separate identities:

1. Neutral/attentive — open, calm mouth; centered gaze; ears relaxed.
2. Warmly happy — relaxed open smile; lower lids lifted; kind catchlights.
3. Mid-story — one brow/fur arc lifted; gaze toward listener; one hand raised.
4. Thoughtful — mouth closed; pupils slightly off-center; lids modestly lowered.
5. Skeptical — asymmetric lid pressure; restrained mouth corner.
6. Concerned — inner fur-brows raised; ears slightly back; no panic grimace.
7. World-weary-but-happy — lowered lids, soft smile, good mood still visible.
8. Surprised — modest eye opening and small mouth change; never a reaction meme.

## 13. Personality Translated into Drawing

Visual choices must support Mango's voice:

- Approachability: open torso, relaxed hands, soft shoulders, direct but gentle gaze.
- Earnestness: attentive ears, visible eye whites, focused pupils, sincere hand gestures.
- Patriotism: the restrained left-lapel pin when jacketed, never flag-costume excess.
- Experience: adult proportions, calm movement, subtle lid and brow asymmetry.
- Good humor: a soft mouth and living catchlights remain even when he is tired or skeptical.

## 14. Scale and Scene Continuity

- At close range, retain iris hatching, eyelids, catchlights, and layered facial fur.
- At medium range, retain visible sclera, separate iris/pupil, ear feathering, and hand silhouette.
- At thumbnail range, prioritize thin neck, no tail, broad soft body, floppy ears, white-eye readability, and left-lapel pin shape.
- In crowds, Mango remains identifiable by silhouette before interior detail.
- Under clothing, never alter the canonical body mass or create a tail-shaped bulge.
- If any locked feature is unclear because of scale, simplify the linework while preserving the rule; never substitute a different anatomy.

## 15. Scene Assembly Order

1. Fetch the reference stack (`get_model_sheet` over the connector, or attach in-repo): `full-body-sheet.png`, `identity-sheet.png`, and `lapel-pin-bible.png` when jacketed.
2. Paste the BASE block from `canon/MASTER-PROMPT.md` (its MANGO paragraph is the locked identity) or, for Mango-only work, the Locked Identity Block from `PROMPT-BLOCKS.md`.
3. Place him on the stage: patron/room side, on a stool with human posture.
4. Choose an expression and pose from the approved libraries.
5. Add scene wardrobe over the locked body; apply the pin rule.
6. Add the old fashioned or other props with real grips and resting surfaces.
7. Add other characters from their own references; construct the setting without redesigning Mango.
8. Inspect the actual pixels against `QUALITY-CONTROL.md` and `canon/creation/SCENE-QC.md` before filing.

## 16. Forbidden Drift

Reject any output containing:

- a tail, tail opening, tail bulge, or ambiguous tail-like shape;
- a thick or beard-hidden neck, fluffy ruff, mane, bib, or shaggy chin;
- eyes that lose the three separate shapes—clearly visible paper-white sclera (about half the open-eye area), separate gray iris, separate black pupil;
- black bead or button eyes, giant anime eyes, colored irises, crossed eyes, or vacant gaze;
- quadruped forepaws, mitten hands, rubber-hose gloves, naked human skin hands, or claw-heavy hands;
- athletic, thin, obese, puppy-proportioned, or bodybuilder anatomy;
- smooth generic facial fur, or fur grown into a beard or mane;
- a missing, right-lapel, pole-mounted, over-detailed, oversized, or colored pin on a lapeled jacket;
- a jacket with no collared shirt under it;
- Mango on the bartender's side of the bar, or seated on nothing;
- a wrong signature drink—stemmed glass, crushed ice, or busy garnish;
- color, photorealism, 3D, vector-flat, anime, or digital gloss;
- wardrobe that changed the underlying body, head, neck, hands, feet, or age;
- traits, props, or wardrobe copied from Drew or Abby.

## 17. Approval Standard

An image does not pass merely because it is attractive or funny. It passes only when the locked identity survives the exact requested scene. Hide the pin and caption: if Mango is not immediately recognizable from the thin neck, no-tail silhouette, soft build, drop ears, readable eyes, five-finger hands, and adult bearing, reject it.
