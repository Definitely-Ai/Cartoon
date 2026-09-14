# Automation Studio: planning, not active automation

Implementation handoff: September 14, 2026. `/gallery/automation` is the public-facing edition planner. Visitors can choose a location, audience, cast, quantity and timing, preview local dates, and download a brief. Existing cartoons illustrate the intended result; they are not freshly generated previews of the submitted location.

**Saving or downloading does not generate cartoons, arm a schedule, publish, or email anything.** The API explicitly returns `workerConnected: false`. Deployment of this UI does not change that boundary.

## Access and persistence

- Public page: `/gallery/automation`. Shared saved plans are visible only after the existing Back Room sign-in.
- Private API: `GET` and `POST /api/gallery/automation`. Both handlers independently verify the signed Back Room cookie because middleware treats `/api/gallery/**` as public. Responses are private/no-store. This is the existing single-owner studio model, not separate user accounts.
- POST requires an exact same-origin `Origin`, JSON, and at most 12 KiB of actual streamed body bytes. It accepts the `EditionInput` object directly, not the downloaded brief wrapper.
- `lib/automation-studio-server.ts` uses server-only `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`. No service credential belongs in browser code or `NEXT_PUBLIC_*` variables.
- A normalized input has a deterministic SHA-256 ID. Duplicate inserts are ignored and the exact stored row is read back before success is reported. Repeated submissions preserve the existing dates and any archived status. Historical records are validated against their creation date.
- Saves are immutable through this API: there is no edit, activation, archive, deletion or dispatch endpoint. `planned` and `archived` are the only stored statuses; neither means active. Listing is limited to the newest 100 records, without pagination yet. This is application-level immutability, not a database prohibition on privileged administration.

## Edition input and download contract

The authoritative types and validation are in `lib/automation-studio-core.ts`. Unknown or missing keys are rejected.

| Field | Contract |
| --- | --- |
| `location` | Exact keys `name`, `region`, `country`, `timezone`, `coverage`; coverage is `city`, `town`, `county`, or `area`; timezone is a valid named IANA zone. |
| `audience` | 1–600 trimmed characters; no control characters. |
| `quantity` | Integer **1–12 cartoons**. This is a requested quantity, not a guaranteed accepted yield. |
| `cast` | `duo`, `trio`, or `mixed`. |
| `timing` | Exact keys `mode`, `date`, `time`, `weekdays`; mode is `now`, `once`, `daily`, or `weekly`; date is `YYYY-MM-DD`, time is 24-hour `HH:mm`; weekdays are unique sorted integers 0 Sunday through 6 Saturday. Weekly requires at least one. |

Location name/region are bounded to 80 characters each, country to 64 and timezone to 80. Start dates cannot be past or more than one calendar year ahead. `now` uses today in the location timezone; a one-off time cannot already have passed. For recurring plans, `date` is the first eligible date, not a required matching weekday.

Downloaded briefs use `schema: "swinging-door-edition-plan-v1"`, `status: "planned"`, `input`, and explicit `executionEnabled: false` / `automaticPublication: false`. The form download additionally includes preview dates, source readiness and artwork constraints. Saved-plan downloads include the stored ID/timestamps. **Neither download is an executable local-pipeline configuration.** Do not feed it directly to `cartoon-pipeline.mjs start`.

## Timezone behavior

Previews show both the local timezone and an absolute ISO timestamp. The default preview is five occurrences; none beyond one calendar year from the preview clock are returned.

- A one-off wall-clock time that does not exist during a spring clock change is rejected.
- A recurring plan skips that local day if its chosen time does not exist, including half-hour changes.
- A repeated fall-back time selects the earlier instant only. If that instant has passed, the recurring preview skips the day rather than offering the repeated hour again.
- An older saved recurring plan can still be previewed without rewriting its original start date. An expired one-off has no future occurrence. An on-demand plan is a request for a current-day brief, not a persisted execution appointment.

These are planning rules, not evidence that a scheduler will run them. Future editions must research near execution; a future date does not allow claims about future news. The current local engine's `start` contract is current-day-only and rechecks evidence freshness at creative stages, so the eventual adapter must distinguish planned dates, actual execution dates and any separately approved publication date.

## Local source and artwork readiness

Only exact **Naples, Florida, US, city** is labeled configured; exact **Sarasota, Florida, US, city** is a limited pilot. Bounded Florida/FL and US name aliases are accepted. Naples-area variants, counties and all other places require local setup; choosing a timezone or typing a location does not establish coverage. Recent source material is not automatically a measured popularity trend.

The workstation pipeline lives in `Z:/ImageGenerator/Cartoon`, with location profiles, curated source registries and review-gated state under `output/automation-v1`. Historical September 11–12 runs demonstrate research-to-proof work, not reliable unattended comedy. The September 12 pipeline cast catalogs predate the current best-of preferred Barclay artwork. Pin and verify the current five acting frames before connecting a new edition; do not silently replace artwork in old jobs.

Keep the room fixed, the entire cartoon grayscale, TV imagery human-free, the chalkboard simple hand-chalk, and captions at the bottom of the image. Speaking mouths and listening gaze must follow the selected pose. Source, caption, display-art and final-proof reviews remain necessary; neither an editorial 8/10 judgment nor a screen preview guarantees reader ratings or physical newspaper reproduction.

## Database restoration and SQL: pending approval

The release handoff reports the connected database project paused. **Owner approval to restore it and apply setup SQL is still pending.** This file does not authorize restoration, billing changes, schema application, or test writes. Until storage is ready, the public planner/download remains useful; save/list failures must not be represented as success.

After explicit approval:

1. Confirm the exact intended project and restore it through the approved operational path. Recheck project health and the server-only credentials without exposing them.
2. Review `docs/sql/automation-studio.sql` against the restored schema. It is a manual setup file, **not an applied migration**. If a same-name table already exists with a different shape, reconcile it before application; `CREATE TABLE IF NOT EXISTS` will not repair an incompatible schema.
3. Apply that reviewed SQL to the confirmed project. It creates `automation_edition_plans`, enables and forces RLS, revokes public/anon/authenticated access and grants only service-role SELECT/INSERT/UPDATE. Do not add browser-role grants to fix a server configuration problem.
4. Run the read-only grant/RLS checks at the end of the SQL file, inspect API exposure and schema-cache readiness, and run the database security advisors. Supabase treats grants and RLS as separate controls; keep both explicit. See [Supabase API security](https://supabase.com/docs/guides/api/securing-your-api) and the [Data API exposure change](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).
5. With approval for a test record, verify a signed-in save/read and duplicate submission against the deployed API, plus anonymous and cross-origin rejection. Confirm one unchanged record, no credentials in responses and `workerConnected: false`. Document the retained test record; do not delete real plans during verification.

## Remaining production integration

1. Add reviewed source onboarding for the requested geography/audience; preserve publisher scope and evidence dates. Refresh and hash the current approved cast/room catalog.
2. Build a secure **outbound workstation worker bridge** with narrowly scoped authentication, replay protection, explicit job claims/leases, bounded retries and observable failures. Vercel must not try to reach the user's workstation by calling its own `localhost`. Do not expose ComfyUI or a general shell directly to the internet.
3. Translate an approved brief into the local engine's profile/registry/cast configuration and immutable run record. Keep research and creative gates intact; reconnecting a worker must not turn old saved plans into automatically authorized jobs.
4. Add a separately authorized schedule activation contract, timezone/versioned occurrence IDs, offline/missed-run behavior, pause/cancel controls and review notifications. Test DST, duplicate delivery, crashes and workstation/GPU contention before any live recurrence.
5. Verify one approved on-demand run end to end, then one explicitly activated scheduled run. Owner publication/email approval remains a separate final action.

## Safe local verification

From the release checkout, with Node 22:

```powershell
node --experimental-strip-types --test scripts/test-automation-studio-core.mjs scripts/test-automation-studio-server.mjs scripts/test-automation-studio-ui.mjs
npx tsc --noEmit --incremental false
```

The 38 core/server/UI tests passed together on September 14, including seven UI tests. Server requests and environment credentials are stubbed: these tests do not call a database or start generation. They cover input/date/DST rules, request bounds, independent API authentication, deterministic duplicate saves, historical validation, storage failures and secret isolation. The UI harness checks the current TSX implementation's local-midnight rollover, incomplete timezone input, list/save race, multiline audience normalization, download contract and accessible control groups. They do **not** establish live database readiness, deployed-browser behavior, a connected worker, scheduled execution or publication.

A direct Next.js production build passed. Do not report a completed `npm run build`: its local artwork-inventory hook was intentionally interrupted to avoid importing the broader working archive. The build used Next directly, and the unchanged canonical originals were separately verified. No live database verification is claimed.
