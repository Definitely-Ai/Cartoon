# Rick presentation and generation flow

The simple `/gallery/automation` form accepts city, state and quantity. It uses the existing authenticated durable queue, retained request UUIDs, real worker stage counters, and automatic polling of completed private artifacts. The advanced planner and schedules remain at `/gallery/automation/planner`.

The `/gallery/presentation` tab browses the 40 existing selected cartoons, shows exact artwork sizes, exports original-resolution PDF packets, and offers an explicitly fictional 11-by-17-inch newspaper layout. A ten-page PDF presentation and ten-slide editable PowerPoint accompany it. Existing cast and scene pixels are unchanged.

## Verification

- TypeScript checking and 82 targeted tests passed, including authenticated queue fencing, duplicate requests, killed-process checkpoint recovery, schedule/DST handling, review schemas, PDF page geometry and source discovery.
- Local browser verification passed for the 40-image collection, four print sizes, six-page Letter and newspaper PDFs, slides, static downloads, mobile overflow and anonymous queue rejection.
- Both ten-page/slide artifacts were rendered and visually inspected. PowerPoint itself was not opened.
- Real Denver requests exposed two reviewer contract problems: a contradictory absent-color complaint and percentage scores despite a fractional confidence contract. Review prompts and bounded independent rechecks now specify the exact scales. Quality thresholds remain unchanged. Failed attempts remain in the database.

## Runtime and limitations

Versioned worker snapshots keep local generation separate from the art checkout. Startup uses the same Windows user with Limited privileges and an S4U boot/logon task. The task's installation is not proof of a successful cold boot; the user deferred restarting until after working hours.

Dedicated articles are preferred. Other US cities and towns use dated local headline discovery; headlines support subjects, not numerical, causal or full-article factual claims. Inadequate source coverage or rejected quality stops production without a placeholder. Machine scores are not audience ratings or human editorial approval. Nothing automatically publishes a generated draft.

The staged worker uses sharp 0.35.4, resolving the native image-library advisories reported by npm audit for the prior 0.34.5 runtime. [Official release](https://github.com/lovell/sharp/releases/tag/v0.35.4).

Build artifacts: `scripts/build-rick-showcase.py`, `scripts/build-rick-showcase.mjs`; browser test: `scripts/verify-rick-presentation-browser.mjs`. PDF geometry is in inches converted to points; native 1024×1536 artwork is approximately 301 PPI at 3.4×5.1 inches and 171 PPI at 6×9 inches. Enlarging is not upscaling.
