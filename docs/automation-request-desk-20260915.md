# Request desk — September 15, 2026

## Shipped scope

- Clickable completed-edition thumbnails with original images and print PDFs.
- Separate queued/running/scheduled/paused cards; each uses actual worker milestone counters.
- Polling every four seconds, resume on browser visibility, persisted focused request, automatic finished image display.
- Temporary interruptions retain milestone counts through retry, claim, and replay heartbeats. GPU wait remains explicit. No time-based completion estimates.
- Editorial/source/visual rejection is not labeled as a completed cartoon. It has a reason, immutable original record, and a fresh-pass recovery action.
- Owner-only, same-origin POST `/api/gallery/automation/retry`. A deterministic follow-up request UUID and database uniqueness prevent duplicate follow-ups. Each original has at most one fresh pass. Retrying that action opens its existing follow-up. A rejected follow-up may itself receive a new pass.
- Fresh passes use today's date and new checkpoint identity, not the exhausted rejected candidate cache. Normal transient retries retain the existing identity and completed work.
- Scheduled requests reflect paused schedules and link to schedule management; a paused schedule is not silently resumed.

## Database migration

Applied with Supabase migration tracking: `automation_preserve_confirmed_progress`.
Source: `docs/sql/automation-progress-retention.sql`; apply after queue and schedule setup.
No production jobs were rewritten, deleted, requeued, or marked successful. Permissions remain service-only, security-invoker, with atomic worker locks and lease fencing.

Live PostgreSQL transaction tests passed for retained counters across failure, claim, restart heartbeat, and GPU wait; advancing progress; stale-lease rejection; and restricted execute permissions. All inserted test records were rolled back.

## Verification

- `npx tsc --noEmit`
- `node --test scripts/test-rick-generation.mjs scripts/test-automation-queue-server.mjs scripts/test-automation-worker.mjs scripts/test-automation-schedules.mjs`
- `node --env-file=.env.rick-qa.local scripts/verify-request-desk.mjs` with the configured Playwright module and localhost QA server. These are clearly labeled UI fixtures, not real model generation.
- UI fixtures cover queue ordering, milestone progress, GPU wait, offline preservation, automatic completion, opening results, PDF download, focused-request reload, retry controls, mobile overflow and the 1920×1080 presentation.

## Observed real request

The user submitted Chicago during this work: `d072d86d-00ee-4a50-9630-c3d5246271c0`, September 15 at 14:56:44 UTC. It completed at 14:58:34 UTC with one image and one report. Its running worker was not interrupted or replaced.

## Limits kept explicit

Machine review cannot guarantee an audience rating or that every source/creative attempt succeeds. Genuine failures remain recorded internally with actionable recovery; no endless animation or placeholder disguises them. The desk currently shows the latest 100 requests and identifies that view limit. Existing completed images are unchanged.

Corrected-cast worker v17 activation remains separate, pending owner approval of the startup change. The running startup task was still v14 when Chicago completed. This release does not modify the PC startup task or claim an updated-worker generation test.
