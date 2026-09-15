# Live cartoon assembly

The Generate page shows real, private worker checkpoints, not a timed imitation
of generation. The original 40 public cartoons and the approval gate are unchanged.

## What the viewer sees

1. The approved reference-v2 cast and permanent room, with the two display
   surfaces cleared. Cast poses are deliberately retained, not newly generated.
2. The selected, machine-reviewed caption, TV headline, chalk menu, and dated
   source context. The image is still waiting for its new TV picture.
3. The new TV image after machine visual review, fitted into the existing set.
4. Deterministic, hand-chalk-style menu lettering on the existing board.
5. The final caption, set in type at the foot of the same picture.

Previews retain 1024 × 1536 pixels. TV and chalk close-ups are views into those
same images. Full-screen mode is intended for the presentation screen. The
completed original and human approval controls remain below the build view.

Only frames already saved by the worker can be revealed. When several arrive
together, the view walks through them at two-second intervals, explicitly
labelled as saved stages. There is no invented inference percentage, countdown,
source, intermediate image, or simulated drawing of the cast. Replay is labelled
and changes only the view. Stage selection pauses live following; Follow live
returns to the latest saved frame. Motion preferences disable the image transition.

## Persistence and access

- The worker uploads content-addressed, attempt-scoped PNGs to the existing
  private `automation-drafts` bucket. Delivery of final artifacts is separate.
- The server verifies size, SHA-256, PNG decoding, dimensions, approved acting
  hash, input quantity, and job/attempt path before committing a checkpoint.
- `save_cartoon_build_frame` rechecks the worker token and live lease after
  storage verification. It accepts exact retries and rejects changed content.
- `cartoon_build_frames` uses forced RLS, with no anon/authenticated access.
  Only the server service role can read or insert. The RPC is SECURITY INVOKER.
- `/api/gallery/automation/build` requires the owner cookie. Images are proxied
  without signed redirects, with private/no-store browser and CDN headers.
- No checkpoint can publish a cartoon. Only the separate human review action
  can add a completed, eligible image to the public gallery.
- Refresh, reconnect, and later visits reconstruct the build from the database.
  Earlier editions honestly report that they have no build recording.

## Verification

- Isolated contract tests cover anonymous/cross-site rejection, exact approved
  cast, bounded metadata, changed bytes, stale leases, wrong attempts, unknown
  image hashes, and recovery across attempts.
- A PostgreSQL transaction tested exact retry, immutable content, invalid lease,
  and expired lease behavior, then rolled back all fixture records.
- An actual deterministic compositor fixture generated all five stages with
  zero protected-pixel changes and zero colored pixels. It used retained art
  and explicitly labelled fixture copy, not a new production cartoon.
- Browser fixtures exercise all five reveals, replay, full screen, refresh,
  offline retention, reduced motion, and 320/390/768/1500-pixel widths. They never
  send a real generation or publishing request.
- The Supabase advisor reports the expected no-policy information for private,
  service-only tables. Existing warnings about `rls_auto_enable` are separate
  from this feature; see the [Supabase advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

## Release order

Apply and verify `docs/sql/cartoon-build-frames.sql`, deploy the website, then
activate the versioned worker with `buildPreviews: true`. Do not run the new
worker before its API is live. Upgrade only a freshly idle owned worker; retain
the former runtime and task backup. Do not restart the PC or other GPU services.
