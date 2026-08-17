# Drew Production Quality Control

An output is approved only when every critical identity gate passes. A good joke or attractive rendering never excuses character drift.

## Critical Identity Gates — All Must Pass

- [ ] Compact mature flamingo head matches `full-body-sheet.png`.
- [ ] Beak keeps the same pale base, angular flamingo bend, compact dark distal section, and length.
- [ ] Eyes remain small, lively, avian, and readable with controlled white, distinct iris, darker pupil, and one restrained catchlight.
- [ ] Gaze has a clear target; eyes are not black beads, alien circles, glamour-human, or blank.
- [ ] Neck is long, slim, subtly tapered, and continuously S-curved.
- [ ] Build remains average, healthy, mature, and G-rated.
- [ ] Arms are layered wing-arms, not human arms, sleeves without feathers, or extra wings.
- [ ] Each readable feather-hand uses one short thumb-feather and two longer finger-feathers.
- [ ] Nail tips, if visible, are tiny, pale, and avian—not human nails, claws, or talons.
- [ ] Long bird legs and webbed flamingo feet remain coherent.
- [ ] Small solid-black bow tie is present and correctly placed.
- [ ] No anatomy, clothing, prop, or expression trait has migrated from Mango, Abby, or another character.

Any failure above means **reject and revise**.

## Performance Checks

- [ ] Expression is selected from the approved library.
- [ ] Emotion reads through lids, gaze, head pitch, beak seam, neck posture, and wing gesture.
- [ ] Smile, if present, uses the beak seam and posture without lips or teeth.
- [ ] Curiosity, if requested, has a specific gaze target and a forward S-neck lean.
- [ ] Gesture is readable at thumbnail size and remains feathered.
- [ ] Pose is composed and economical unless the scene explicitly needs stronger action.
- [ ] Drew is skeptical without becoming sour, cruel, frantic, foolish, or cynical.

## Scene-Variable Checks

- [ ] Clothing beyond the bow tie was requested or is narratively necessary.
- [ ] Clothing fits over the locked body and preserves wing-arm construction.
- [ ] The current outfit has not been treated as permanent anatomy.
- [ ] Props are requested or necessary, correctly scaled, and feasibly gripped.
- [ ] Martini, when present, has exactly three olives on one pick.
- [ ] A previous scene's clothing, prop, damage, or expression has not leaked into this scene.
- [ ] Other characters use their own references and preserve their own scale.

## Style Checks

- [ ] Image is strictly black, white, and restrained gray wash on warm off-white paper.
- [ ] Linework looks hand-drawn with confident natural variation.
- [ ] Feather strokes and selective crosshatching clarify anatomy rather than fill surfaces randomly.
- [ ] Eyes, beak tip, bow tie, and essential gag prop carry the strongest useful contrast.
- [ ] Background is one step lighter and does not compete with the joke.
- [ ] No color, glossy 3D, anime, photorealism, flat vector art, clip-art mascot treatment, or muddy wash.
- [ ] No watermark, signature, proof label, title, catalog line, or stray generated text.

## Composition and Dialogue Checks

- [ ] Silhouette and focal action read within two seconds at 220-pixel width.
- [ ] Speaker and gaze relationship are unmistakable.
- [ ] Crop preserves the anatomy or gesture required for the gag.
- [ ] Clean negative space exists for deterministic dialogue.
- [ ] Image model did not render the caption or speech balloon.
- [ ] Exact dialogue is appended afterward with `npm run dialogue`.
- [ ] Panel obeys `canon/comedy/COMEDY-BIBLE.md` and `canon/creation/WORKFLOW.md`.

## Drift Comparison

Before approval, compare the output side by side with `full-body-sheet.png` at the same approximate head size.

1. Trace the head and beak silhouette mentally.
2. Compare the eye's size and placement.
3. Compare neck thickness, S-curve, and attachment.
4. Compare shoulder width and torso taper.
5. Compare wing layering and digit count.
6. Compare leg and foot construction.
7. Hide bow tie, clothes, props, and caption; ask whether the identity still holds.

Do not judge from memory alone.

## Scoring After Critical Gates Pass

| Area | Weight | Minimum |
| --- | ---: | ---: |
| Identity fidelity | 20 | 19 |
| Anatomy and expression | 20 | 18 |
| Wing-hand and prop integrity | 20 | 18 |
| Scene continuity | 20 | 17 |
| Style, composition, and dialogue readiness | 20 | 18 |

Approval threshold: **90/100**, with no critical failure and no category below its minimum.

## Review Record

For every approved or instructive rejected image, record:

- output filename;
- date and reviewer;
- prompt or prompt commit;
- attached reference filenames;
- requested expression, pose, wardrobe, and scene;
- total and category scores;
- identity failures or exceptions;
- correction required before reuse.

Rejected images may remain in a dated review folder, but must never be promoted as an identity reference.

## Repository Check

Run before generating, publishing, or changing Drew canon:

```bash
npm run canon:check
```

The command verifies that all required Drew documents and sheets exist, that image dimensions and SHA-256 fingerprints match `ASSET-MANIFEST.json`, and that the master prompt does not contain superseded design language.
