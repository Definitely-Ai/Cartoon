# Swinging Door — best-three generation notes

Status: review-ready proofs only. Nothing in this batch was published, committed, or added to the public cartoon index.

## Selection

The three captions were selected from the existing ten-cartoon writers-room batch for brevity, a clear comic turn, and a premise that the drawing can support without explaining the joke.

## Shared art direction

Use the supplied Swinging Door reference art as binding character and camera canon. Draw a dense, full-tone, monochrome antique steel engraving on warm paper: fine cross-hatching, stipple, deep shadows, crisp silhouettes, and no modern cartoon outlines. Camera is behind Drew and Barclay on the customer side, looking across the marble bar to the far service side and back bar. Preserve their species, clothing, scale, drinks, and the current local-mode bottle labels exactly: BIRDIE BOURBON and DIVOT DRIVE GIN. No caption, speech bubble, watermark, signature, stray label, or extra character in the art. Leave all dialogue for deterministic typesetting.

## Final prompt set

### 1. Mortgage inheritance

Barclay raises his old fashioned one inch while Drew turns toward him, his martini on its coaster. On the large television at upper left, show a moving truck at a curb and the exact headline FEW HOMES FOR SALE AS OWNERS STAY PUT. Keep the chalkboard at upper right blank. No bartender is present. Enforce the locked customer-side view and unobstructed bar geometry.

### 2. Renewal price

Barclay holds his old fashioned in both hands, settled and pleased; Drew's hand rests on the marble beside his untouched martini as he looks toward Barclay. On the large television at upper left, show a mailbox crowded with plain envelopes and the exact headline PROMOTIONAL RATES END FOR MILLIONS OF CUSTOMERS. On the chalkboard at upper right, typeset exactly OLD FASHIONED, FIRST YEAR $9 · YEAR FOUR $16. No bartender is present. Enforce the locked customer-side view and unobstructed bar geometry.

### 3. Tip before coffee

Abby stands only on the far service side with the back bar behind her, warmly smiling as she slides Barclay's old fashioned the final inch. Barclay waits with both hands folded; Drew lifts his martini by the stem. On the large television at upper left, show an empty paper coffee cup beside a dark tablet and the exact headline TIP SCREENS SPREAD TO SELF-CHECKOUT. Keep the chalkboard at upper right blank. Abby has a white towel over her left shoulder and normal human anatomy, with no feather, tail, plume, or apron anomaly. Enforce the locked customer-side view.

## Corrections made

The initial image pass was rejected because it used the obsolete front-facing/service-side staging and gave Abby a tail-like feather. The final art was rebuilt against the current behind-the-gentlemen staging reference. The renewal and tipping panels then received targeted upper-wall edits so their television wording is complete and the television remains upper left with the chalkboard upper right.

## Caption production

The final captions are rendered by the project's own deterministic `finishCartoon` function: attributed dialogue, Georgia italic, warm-white 264 px strip, hairline rule, and a 1200 px final width.

## Review checklist

- Character identities and clothing preserved.
- Camera is behind Drew and Barclay on the customer side.
- Abby appears only on the far service side and is smiling.
- Exactly two lettered bottle labels in local mode: BIRDIE BOURBON and DIVOT DRIVE GIN; all others blank.
- Television and chalkboard text match the brief.
- No dialogue is baked into the generated art.
- Caption spelling and punctuation are deterministic, not model-rendered.
