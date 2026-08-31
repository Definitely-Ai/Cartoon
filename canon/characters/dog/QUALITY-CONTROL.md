> **SUPERSEDED WHERE IT DISAGREES — `canon/HARRINGTON-VISION.md` and the
> plates in `canon/vision/` now govern this character's design, rendering,
> and wardrobe. Use this document only for structure that the vision does not
> address; every visual detail below yields to the plates and the founder's
> review notes.**

# Barclay Production Quality Control

An output is approved only when every critical gate passes **against the actual generated pixels**, with the fetched sheets open beside it — reading the prompt back is not inspection. A good joke or attractive rendering never excuses character drift. Any failure means **reject and redraw with the fault named in the prompt** — never a filing. This checklist merges Barclay's identity gates with the stage rules of `canon/creation/SCENE-QC.md`; run both.

## Critical Identity Gates — All Must Pass

- [ ] No tail, tail opening, tail bulge, or ambiguous tail-like shape in any view — rear, seated, action, silhouette, or clothed.
- [ ] Neck is thin and visible, not thick, beard-hidden, or surrounded by a fluffy ruff, mane, or bib.
- [ ] Eyes keep three separate readable shapes: clearly visible paper-white sclera (about half the open-eye area), separate mid-gray iris, separate round black pupil, with catchlights alive.
- [ ] Eyes are not black beads or buttons, giant anime eyes, colored, crossed, mismatched, or emotionally vacant.
- [ ] Hands are human-shaped five-finger hands with fine fur and subtle paw pads — not quadruped forepaws, mittens, gloves, naked human skin hands, or claw-heavy.
- [ ] Feet are broad plantigrade canine feet supporting a human posture.
- [ ] Build is solid, soft, and approachable — not athletic, thin, obese, puppy-proportioned, or bodybuilder-muscular.
- [ ] Facial fur is layered and golden-retriever-textured, and has not smoothed into generic blankness or grown into a beard/mane.
- [ ] Ears are feathered drop ears — not erect, spaniel-length, tiny, or identically mirrored.
- [ ] A collared shirt is visible under the standard jacket — never a jacket over bare fur.
- [ ] On a lapeled jacket the USA pin is present on the **left** lapel; on lapel-less outerwear it sits on the left chest. Never missing, right-lapel, pole-mounted, over-detailed (nine stars in a 3 × 3 grid, seven broad bands), oversized, fuzzy, or colored.
- [ ] Wardrobe has not changed the underlying body, head, neck, hands, feet, or age.
- [ ] No anatomy, clothing, prop, or expression trait has migrated from Drew, Abby, or another character.
- [ ] Prompt text used "hands", never "paw", for his hands.

## Scene Physics Gates — All Must Pass

Consistent with `canon/creation/SCENE-QC.md`; that file's stage rules apply to the whole panel.

- [ ] **Side of the bar.** Barclay is on the patron/room side. Only the bartender occupies the service side; Barclay never reaches from behind the counter.
- [ ] **Actually seated on the stool.** The stool is visibly or plausibly under him — hips on the seat, weight believable, knees forward, legs resolved, human posture. Empty foreground stools do not count as his seat.
- [ ] **Glass resting or gripped.** The old fashioned (and every other glass or bottle) rests flat on the bar, a coaster, or a shelf — or sits in a real closed five-finger grip. Nothing floats or tips without a story reason.
- [ ] **Plausible contact points.** Fingers actually wrap what they hold, with the right digit count; hands touch props where hands would. No mitten blobs, no pass-through grips.
- [ ] **No interpenetration.** No limb, prop, garment, or glass merges, clips, or passes through the bar, a stool, or another character; nothing fused into a surface or a body.
- [ ] **Correct occlusion.** Near objects hide far ones: the bar edge hides what sits behind it, his hand hides the glass where it wraps it, the stool and counter overlap him correctly.
- [ ] **Scale holds.** Barclay stays consistent with the counter, the stools, Drew, Abby, and props, panel to panel.

## Signature-Prop Check

- [ ] Old fashioned, when present, is a short rocks glass with one large cube and restrained garnish (a single peel at most, often none) — resting flat on the bar or in a real five-finger grip; never a stemmed, tall, or novelty glass.

## Performance Checks

- [ ] Expression is selected from the approved library (bible §12).
- [ ] Emotion leads with eyes and hands, supported by small head angle, ear position, and restrained mouth.
- [ ] Both pupils track the same target and stay aligned in perspective.
- [ ] Gestures are economical; adult dignity preserved — earnest or mistaken, never buffoonishly frantic.
- [ ] No extreme squash-and-stretch, giant open mouths, airborne poses, or puppy behavior.
- [ ] Warm baseline holds: never mean, predatory, smug, vacant, or defeated.

## Style Checks

- [ ] Exactly three values (paper white, one mid-gray wash, solid black ink); no color anywhere, including the pin.
- [ ] Linework looks hand-drawn with confident natural variation; sparse directional fur strokes, not noise.
- [ ] No photorealism, 3D, anime, vector-flat art, or digital gloss.
- [ ] No watermark, signature, or stray generated text; lettering only where the master prompt allows it (window, chalkboard, TV — all short).
- [ ] No model-rendered caption or speech balloon; the exact caption is typeset afterward by the house pipeline (`file_cartoon` over the connector; see Maintainer-side below for in-repo work).

## Drift Comparison

Before approval, compare the output side by side with `full-body-sheet.png` (fetched via `get_model_sheet` or opened in-repo) at the same approximate head size. Do not judge from memory alone.

1. Trace the head silhouette: domed adult skull, moderate muzzle, black nose, drop ears.
2. Compare eye size, placement, and the sclera-iris-pupil separation.
3. Compare neck thickness and throat-fur sparseness.
4. Compare shoulder rounding, soft chest, modest belly, and overall mass.
5. Compare hand construction (five fingers, subtle pads) and foot construction.
6. Check the rear/seat line for any tail suggestion.
7. Hide pin, clothes, props, and caption; ask whether the identity still holds.

At thumbnail size, confirm the priority reads: thin neck, no tail, broad soft body, floppy ears, white-eye readability, left-lapel pin shape. If a locked feature is unclear because of scale, the fix is simpler linework preserving the rule — never a different anatomy.

## Scoring After Critical Gates Pass

| Area | Weight | Minimum |
| --- | ---: | ---: |
| Identity fidelity | 20 | 19 |
| Anatomy and expression | 20 | 18 |
| Hands, pin, and prop integrity | 20 | 18 |
| Stage physics and scene continuity | 20 | 17 |
| Style, composition, and dialogue readiness | 20 | 18 |

Approval threshold: **90/100**, with no critical failure and no category below its minimum.

## Review Record

For every approved or instructive rejected image, record: output filename; date and reviewer; prompt or prompt commit; attached/fetched reference filenames; requested expression, pose, wardrobe, and scene; total and category scores; identity failures or exceptions; correction required before reuse. Rejected images may remain in a dated review folder, but must never be promoted as an identity reference.

## Maintainer-side Repository Check

For humans working in the repo (not part of AI self-inspection). Before generating, publishing, or changing Barclay canon, run:

```bash
npm run canon:check
```

It verifies that the required Barclay documents and sheets exist, that image dimensions and SHA-256 fingerprints match `ASSET-MANIFEST.json`, and that the master prompt does not contain superseded design language. When working directly in the repo, the deterministic caption is applied with `npm run dialogue`.
