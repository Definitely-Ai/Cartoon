# Drew Character Bible

This document turns Drew's locked model into repeatable production decisions. `DESCRIPTION.md` is the compact prompt authority; `full-body-sheet.png` is the highest visual authority. This bible explains how to preserve both across expressions, poses, wardrobe, props, and scenes.

## 1. Identity and Dramatic Function

| Field | Canon |
| --- | --- |
| Name | Drew |
| Species | Anthropomorphic flamingo |
| Gender | Male |
| Age | 46 |
| Build | Average, healthy, mature |
| Permanent accessory | Small solid-black bow tie |
| Role | Arch observer, precise skeptic, and dry analyst |
| Default state | Alert neutral with quiet curiosity |
| Rendering | Hand-drawn black ink, exactly three values (paper white, one mid-gray wash, solid black ink), warm off-white paper |

Drew notices the mechanism behind the headline: incentives, language, financing, status, and unintended consequences. He is curious before he is judgmental. His skepticism is intelligent and constructive, not bitter. He retains dignity when he is wrong, surprised, worried, or caught off guard.

The audience should understand within one second that Drew is a mature, attentive flamingo evaluating something. He belongs in a sophisticated editorial cartoon, not a children's mascot world.

## 2. Reference Hierarchy

When two references disagree, use this order:

1. `full-body-sheet.png` — locked master model.
2. The written canon — `DESCRIPTION.md` and this bible.
3. `canon/MASTER-PROMPT.md` — the assembled BASE block and its DREW paragraph.
4. The most relevant specialist/support sheet.
5. Older cartoons — story history only.

Never average conflicting images together. Match the master, record the conflict, and correct the lower-authority reference later. Do not blend old and new models; if the current sheets are attached, match them rather than inventing a compromise.

### Minimum reference stack

Sheets are fetched with `get_model_sheet` over the studio connector, or attached directly when working in-repo.

- Always attach `full-body-sheet.png`.
- Attach `identity-sheet.png` whenever the face is readable.
- Attach `wing-hand-sheet.png` whenever a wing-hand, gesture, or held object is readable.
- Add only the one or two other sheets needed for the requested shot.
- Never substitute a previously generated scene for the locked master.

## 3. Construction

### Overall silhouette

Drew's vertical silhouette is built from a compact head and downturned beak, a long slim S-neck, a moderate feathered torso, flexible wing-arms, and long bird legs. The neck curve and beak are the strongest species identifiers; the bow tie is the signature accent.

At thumbnail size, the silhouette must remain readable before feather texture, facial detail, or props are considered.

### Proportion anchors

Use head height—from crown to lower beak curve—as one visual unit. These measurements guide consistency; the locked master outranks the numbers.

| Feature | Target | Reject when |
| --- | --- | --- |
| Total standing height | About 7.5–8 head units | Squat, childlike, or fashion-model extreme |
| Visible neck path | About 2–2.25 head units along the curve | Short, straight, thick, or swan-heavy |
| Shoulder width | About 1.5 head widths | Bodybuilder-wide or pinched |
| Torso | Moderate taper from shoulder to hip | Hourglass, pot belly, or rigid rectangle |
| Resting wing reach | Feather tips near upper thigh | Decorative stubs or floor-length arms |
| Legs | Long and slim with minimal joint emphasis | Human calves, short legs, or stilt caricature |

### Head

- Compact mature flamingo cranium with fine, short feather texture.
- Gently rounded crown, never oversized or domed.
- Clean head-to-neck transition with no human chin or throat.
- No hair, human ears, nose, lips, moustache, beard, or jawline.

### Eyes

Drew's eyes must carry life without becoming human or alien.

- Small relative to the head.
- Controlled visible sclera, never a huge white ball.
- Distinct medium-dark iris and darker pupil.
- One small catchlight per visible eye, consistent with the scene light.
- Fine upper and lower lid contours; no glamour lashes.
- Gaze direction must land on a specific partner, prop, or thought target.
- Expression comes from lid aperture, iris placement, head pitch, and neck posture—not human eyebrows pasted above the eye.

Reject all-black beads, black sockets, concentric target eyes, oversized whites, crossed pupils, extra sparkles, and photoreal human eyes.

### Beak

- Flamingo-specific: deep at the base, angular, and strongly downturned.
- Pale proximal section and compact dark distal section following the bend.
- Small understated nostrils.
- Stable length and hook across every angle.
- Beak seam remains available for speech and smiling.
- Never add teeth, lips, a tongue-forward human mouth, a duck bill, parrot hook, pelican pouch, or thin straight beak.

### Neck

- Long, slim, subtly tapered, and unmistakably flamingo.
- Continuous rounded S-curve rather than a straight tube or sharp kink.
- Taller when alert; slightly compressed when skeptical; forward-leaning when curious.
- Feather strokes follow the length and never read as mammal fur.
- Head, bow tie, and torso must remain connected along a coherent centerline in every view.

### Torso and feather covering

- Average healthy build; no visible human musculature.
- Entire base body is covered in dense natural plumage and remains G-rated.
- Chest and abdomen use feather direction and wash to create volume.
- Avoid abs, pectorals, exaggerated hips, pot belly, pinched waist, or bodybuilder shoulders.

### Legs and feet

- Long slim flamingo legs with restrained joint definition.
- Webbed bird feet broad enough to read in ink and support an upright stance.
- No human feet, mammal paws, raptor talons, or shoes on the base model.

## 4. Wing-Arms and Feather-Hands

Drew's arms are wings adapted for expressive cartoon acting. They read as bird anatomy first and functional arms second.

### Layering

1. Small overlapping shoulder coverts anchor the wing to the torso.
2. Medium upper-wing feathers follow the upper arm.
3. Feather direction changes around a readable elbow bend without exposing skin.
4. Longer tapered forewing feathers create the lower-arm silhouette.
5. The feather-hand resolves into one short thumb-feather and two longer finger-feathers.

There are no separate decorative wings behind the wing-arms.

### Nail treatment

Each feather-digit may end in one tiny pale avian nail point, no longer than roughly one tenth of the visible digit. Draw it with one or two restrained lines. Never use human nail beds, cuticles, polish, black tips, manicure shapes, long claws, or hooked talons.

### Approved gestures

| Gesture | Construction | Read |
| --- | --- | --- |
| Resting | Wing folded close; feather-digits relaxed | Composed |
| One-digit question | One finger-feather lifted; others folded | Precise curiosity |
| Open explanation | Feather-digits separated slightly; no palm exposed | Reasoned clarification |
| Martini hold | Thumb-feather opposes two finger-feathers around stem | Controlled elegance |
| Bar lean | Forewing follows the counter plane | Relaxed confidence |
| Point | One feather-digit extends while the arm remains feathered | Emphasis without aggression |
| Shrug | Both wings lift slightly from the torso | Dry uncertainty |
| Listening fold | Wing-hands overlap lightly or rest | Attention |
| Writing or reading | Small feather-digits control a pen or paper edge | Literate deliberation |

Drew normally acts between 20% and 60% of full extension. Large spread-wing gestures are rare. Never morph the feather-hand into a human hand to solve a prop; simplify the grip or object instead.

## 5. Expression System

Every expression uses six controls: eyelid aperture, iris/pupil direction, catchlight placement, beak seam, head pitch, and neck posture.

| Expression | Eyes | Beak | Neck and posture | Intensity |
| --- | --- | --- | --- | ---: |
| Neutral | Medium-open; centered focus | Closed, level seam | Relaxed upright S | 1/5 |
| Curious | Slightly wider; fixed on subject | Closed or barely parted | Head leads; S-neck leans forward | 2/5 |
| Subtle smile | Soft lower lid | Rear seam lifts slightly | Relaxed and open | 2/5 |
| Open smile | Bright but controlled | Small plausible opening; no teeth | Lifted head and open chest | 3/5 |
| Skeptical | One lid slightly lowered; side gaze | Closed | Slight head cant; compressed S | 2/5 |
| Amused | Narrowed lids; catchlight remains | Small upward seam | Relaxed lean | 2/5 |
| Concerned | Upper lid raised; pupils centered | Closed or slightly parted | Neck retracts | 3/5 |
| Surprised | Wider but still small | Small opening | Neck lengthens briefly | 4/5 |
| Thinking | Gaze up or aside | Closed | Head tilt; one economical gesture | 2/5 |
| Listening | Fixed gaze on speaker | Closed | Forward neck lean | 1/5 |
| Speaking | Focus on partner | Small anatomical opening | Gesture supports the line | 2–3/5 |

### Smile rule

A Drew smile is not a human smile pasted onto a beak. Lift the rear beak seam, engage the lower lid, brighten the gaze, lift the head, and open the posture. Part the beak only enough to read. Never show lips or teeth.

### Curiosity rule

Curiosity is Drew's most important performance state. The gaze lands first, the head rotates before the torso, and the neck leans toward information while preserving the S. One feather-digit may rise. The expression remains attentive rather than nosy, frantic, or vacant.

## 6. Wardrobe

The base model is natural feather covering plus the black bow tie only. Clothing is a scene variable.

- Garments fit over the locked body; they do not redefine the body beneath.
- The bow tie remains visible and black unless an approved gag specifically requires a temporary obstruction.
- Sleeves must accommodate and follow wing-arm feather structure rather than converting it into human arms.
- Tailoring may signal setting or role but must preserve Drew's moderate build and mature proportions.
- Do not carry an outfit from one cartoon into the next without an explicit continuity instruction.
- Never treat a suit, shirt, jacket, costume, hat, or shoes as base anatomy.

Use `wardrobe-sheet.png` for fit behavior, not as permission to make any pictured outfit permanent.

## 7. Props and the Martini

- Props appear only when requested or narratively necessary.
- Scale props to the feather-hand grip.
- Show contact between thumb-feather and one or two finger-feathers.
- Keep prop and feathers separate; no fused geometry.
- Do not carry a prop forward from a previous scene unless continuity requires it.

The signature martini is optional. When present, it is a classic clear martini in a stemmed triangular glass with exactly three olives on one pick. Drew may gesture while the glass rests on a coaster or hold it with the approved feather grip.

## 8. Acting with Mango and Abby

- **With Mango:** Drew looks toward mechanisms and implications while Mango looks toward people and stories. Drew's reaction is often smaller. Their friction is affectionate; neither is a permanent winner.
- **With Abby:** Drew respects her competence. Abby may puncture his analysis with one short line, but Drew never becomes humiliated, predatory, or cruel.
- Drew's proportions and traits never absorb the dogs' ears, paws, muzzle language, fur rendering, clothing defaults, or signature drinks.

## 9. Camera and Continuity

Drew may appear front, three-quarter, profile, back three-quarter, back, seated, close, medium, or wide.

- Preserve beak length, bend, and dark-tip proportion across every angle.
- Preserve the neck's attachment and thickness through the curve.
- Preserve wing-feather layering according to perspective.
- Keep the bow tie centered at the neck base.
- Keep total scale consistent relative to the bar, Mango, Abby, stools, and props.
- In a back view, the head turn must remain anatomically connected; do not rotate the head independently of the neck.
- A crop may omit legs or hands only when the visual joke does not depend on them.

## 10. Style Translation

- Strict black-and-white hand-drawn ink wash on warm off-white paper: exactly three values (paper white, one mid-gray wash, solid black ink).
- Confident variable-weight line: heavier at structural overlaps, finer at facial and feather details.
- Selective short feather marks and controlled crosshatching may describe anatomy; never fill every surface with noise.
- Eyes, beak tip, bow tie, and the gag's essential prop receive the strongest useful contrast.
- Background detail stays lighter and looser than Drew.
- No color, glossy digital airbrush, 3D, photorealism, anime, flat vector art, clip-art mascot rendering, or muddy all-over wash.

## 11. Scene Assembly Order

1. Lock identity from `full-body-sheet.png` and `DESCRIPTION.md`.
2. Choose an approved expression and pose.
3. Confirm neck, beak, eyes, wing-hands, legs, and bow tie.
4. Add scene-specific clothing, if any.
5. Add the prop and establish a feasible feather-hand grip.
6. Add other characters from their own references.
7. Construct the setting without redesigning Drew.
8. Apply ink, wash, and contrast hierarchy.
9. Reserve the deterministic dialogue area; do not ask the image model to typeset the caption.
10. Run `QUALITY-CONTROL.md` and `canon/creation/SCENE-QC.md` against the actual pixels.

## 12. Forbidden Drift

Reject any output containing:

- human head anatomy, hair, ears, nose, lips, teeth, moustache, or jaw;
- wrong bird beak, straight beak, short thick neck, or swan silhouette;
- giant alien eyes, black bead eyes, target eyes, glamour lashes, or human-photo eyes;
- human arms, bare hands, palms, five fingers, extra wings, talons, long claws, or manicure nails;
- bodybuilder, emaciated, pot-bellied, childlike, or pinup anatomy;
- missing or altered black bow tie;
- permanent clothing baked into the base model;
- more or fewer than three olives in the signature martini;
- color, 3D, anime, photoreal, or vector-flat style;
- cruelty, panic, stupidity, bitterness, or a permanent smirk;
- traits, props, or wardrobe copied from Mango or Abby.

## 13. Approval Standard

An image does not pass merely because it is attractive or funny. It passes only when the locked identity survives the exact requested scene. Hide the bow tie and caption: if Drew is not immediately recognizable from species anatomy, proportions, gaze, wing gesture, and restrained bearing, reject it.
