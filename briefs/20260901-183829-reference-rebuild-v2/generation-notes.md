# Swinging Door reference rebuild — v2

Status: review-only. Nothing was published, committed, or added to the public cartoon index.

## Method

The two user-supplied finished panels are the binding visual references and the selected final artwork. Their character anatomy, hands, bottle collection, glassware, camera, room geometry, television pictures, and nonblank chalkboards remain unchanged. The rejected earlier generated panels are not reused.

The only production change is the project's deterministic caption strip, rendered at 1200 px wide in centered Georgia italic on a warm-white field. This avoids image-model lettering in the caption and preserves the reference pixels in the art.

## Final caption set

1. `Drew: "I booked the two-stop fare. My luggage went direct."`
2. `Abby: "There's about four dollars of whiskey in that glass and fourteen dollars of roof."`

Both lines are under the 20-word house limit, stand alone when the television and chalkboard are covered, and leave the comic turn at the end.

## Reference authority applied

- Bottles keep the supplied varied silhouettes, varied label shapes, and intentionally blank labels; no invented bottle names or pseudo-text were added.
- Chalkboards remain fully framed, visibly lettered, and part of the same gag as the caption.
- Hands and props remain exactly as supplied rather than being regenerated.
- The image-generation retry that returned a black frame was rejected and is not included.

## Production mode

Reference-preserving composition plus the repository's deterministic `finishCartoon` caption renderer. No CLI/API fallback and no local Qwen redraw were used for the selected finals.
