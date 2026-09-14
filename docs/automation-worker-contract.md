# Durable local cartoon worker

This worker produces **private, machine-reviewed drafts**, not public cartoons or owner-approved editions. No publisher, email sender, legacy review record, or scheduled Windows task is invoked by these modules. Installation and service start are separate operations.

## Entry point and installation

`node scripts/automation/worker.mjs --config ABSOLUTE_CONFIG.json`

Use `--once` for one bounded queue poll. Config fields:

| Field | Meaning |
| --- | --- |
| `apiOrigin` | Exact website HTTPS origin; literal 127.0.0.1 HTTP is allowed for isolated API testing. |
| `storageOrigin` | Exact trusted Supabase HTTPS origin returned signed uploads must use. |
| `workerId` | Operational label, not an authentication claim; the bearer token maps to server identity. |
| `tokenFile` | Absolute private file containing only the random worker token. No service-role key. |
| `workspaceRoot` | Absolute installed runtime snapshot; never the mutable original studio. |
| `stateRoot` | Absolute durable worker state outside the runtime snapshot. |
| `sharedGpuLockRoot` | Absolute common GPU lease directory used by the existing studio. |
| `runtimePins` | `{path,sha256}` records for all installed code, canon, fonts, catalog and cast assets. |
| `pollMs`, `heartbeatMs` | Defaults 10 seconds and 30 seconds. Heartbeat maximum 30 seconds. |
| `production.writerModel` | Optional pinned local writer; default `gemma4:31b`. |
| `production.criticModel` | Optional different pinned critic; default `qwen3.8:27b`. |
| `production.captionAttempts` | Up to three fresh caption candidates per requested panel. |
| `production.locations` | Optional installed location/source registries. Each `{match:{name,region,country,coverage},sources:[{url,publisher,scope}]}` must use dated authoritative RSS feeds. These URLs are operator configuration, never instructions from a news page. |
| `windowsLauncher` | Optional supervisor configuration; ignored by worker logic. |

Bundle `REQUIRED_PRODUCTION_FILES` from `production-adapter.mjs` and the complete recursive relative-import closure. The current five captionless best-of speaking/listening plates, their verification JSON, geometry, fonts and historical caption collection are required. Runtime dependencies are pinned by the lockfile; install Sharp/opentype and their dependencies normally. Set `CARTOON_STUDIO_LOCK_ROOT` to the **same existing shared lock directory** used by other local studio clients. Ollama runs on 11435; ComfyUI on 8188. The runtime does not download models or start/stop servers.

## Server contract

All control calls POST `/api/gallery/automation/worker` using the worker-only bearer token. No service-role key is placed on this computer by this protocol.

- `claim`: `{action:'claim'}`. Returns `{job:null}` or a UUID job with `input`, `attempt`, `leaseToken`, `leaseExpiresAt`.
- `heartbeat`: job ID, exact lease token, and `{stage,completed,total}` progress. Lease is 180 seconds; normal heartbeat every 30 seconds.
- `upload`: bounded artifact name, kind, MIME, byte count and SHA-256. Returns a signed URL and immutable `jobId/attempt/name` path. Binary PUT has **no control bearer/apikey headers**.
- `complete`: exact manifest with paths. Server independently reads bytes, validates PNGs and hashes, and requires exactly the requested image count. Same-token/same-manifest completion is idempotent. Completion gets a 90-second HTTP deadline while the lease heartbeat continues.
- `fail`: bounded redacted error and retryable flag. Transient source/service/upload faults may retry through the queue; invalid inputs and failed quality gates are visible failures.

401 revokes local authority; 409 loses the lease. The worker stops new effects on either. Signed upload origins and job paths are pinned. Known duplicate-object responses are not trusted as successful content: server completion still validates exact bytes. Arbitrary 400 responses are failures.

## Durability and limits

Checkpoints flush file bytes before atomic same-volume rename. POSIX additionally flushes the directory; Windows has no Node directory-fsync guarantee. State includes input hashes, stage request hashes, retained responses, artifact hashes and upload receipts. An unchanged completed stage is reused. A changed request fails closed. Running stages require an explicit recovery implementation.

A hard-link singleton blocks concurrent workers in the same state directory. PID **and process birth time** distinguish a surviving worker from a reused PID after reboot. The shared studio GPU lease prevents overlapping cooperative writer/image jobs across separate clients. This does not control unrelated software that ignores that lease.

SIGTERM stops new effects and never claims completion. A currently running Ollama/Comfy request may finish server-side; cancellation is not falsely described as termination. Uncertain local requests remain recorded. When an inference wrapper leaves uncertain ownership, the worker exits 75 so a supervisor can restart it; its successor must verify the old process is dead and both services idle before recovering the shared GPU lease. Cached completed image jobs use retained exact bytes. The durable TV adapter saves a client-selected Comfy prompt ID before submission. It retrieves an existing terminal result by that ID. If the server lost its queue, a verified changed listener PID/process birth time allows a new attempt. An unaccounted-for request on the same live server is never blindly resubmitted and can require inspection. The installed Comfy server must support client-selected prompt IDs.

Local text requests do not have provider-side exactly-once IDs. A response lost before checkpointing may be recomputed only after remote idle is verified. This can repeat **inference cost**, but does not create a second cloud job, overwrite an immutable artifact, or publish duplicate cartoons. No claim of exactly-once GPU execution is made.

## Real production adapter

The adapter independently captures dated source text, selects an exact quotation, asks a local model for new captions and coordinated TV/chalk plans, runs a separate-context local editorial critique, creates a **new FLUX TV illustration**, and sends actual image pixels to the pinned local Gemma vision model. It does not use a finished old panel as output. Existing approved-direction cast plates are explicitly retained, with the selected speaker mouth/gaze state.

The TV stays human-free and monochrome. Chalk is font-outlined grainy hand lettering, two to four short logical menu lines and a separate fictional price. Captions are outlined with the house font in the existing lower image band. Deterministic composition rejects any changed pixel outside TV, chalk and caption masks and any introduced color. PNGs use lossless compression; oversized files fail delivery rather than being truncated.

Machine scores must clear 8/10 with >=0.85 declared confidence and no identified problems; these are **machine judgments, not audience ratings or human approval**. Rejected candidates are retained. A bounded failed quality gate does not silently lower the bar or fill the quota with placeholders. The adapter preserves source geography/data periods and does not describe mere relevance as a measured trend.

Naples has a default NABOR/BLS source setup. Other places require a reviewed source registry. Future/repeated occasions belong to the cloud dispatcher; the adapter executes the specific claimed job. Arbitrary-city production and first-pass humor reliability are not assumed from the Naples setup. Sources retained beyond 24 hours stop the edition rather than silently reuse stale evidence.

## Cloud recurrence

Apply the three additive SQL migrations in order: `automation-studio.sql`, `automation-queue.sql`, then `automation-schedules.sql`. Only the explicit owner may activate or pause schedules. The once-daily authenticated Vercel tick and each worker claim materialize dated occurrences up to seven days ahead. A persisted exclusive cursor, transaction lock and unique schedule/occurrence key prevent duplicate jobs. Missed dates remain behind the cursor and are processed in bounded batches after an outage. Pausing prevents new claims without cancelling a currently leased job; resuming preserves the backlog. All due times are UTC instants computed from the requested location's wall clock, including daylight-saving rules.

The cloud cron requires a separate random `CRON_SECRET` in Vercel production, not the worker token. The configured daily cadence is compatible with the current Hobby cadence limit; advance materialization means the local worker, not the exact cron minute, controls due-time pickup. Publication is never implied by a successful job.

## Runtime handoff

`stage-runtime.mjs` copies the reviewed dependency closure and approved local artwork into a new immutable release directory; it refuses an existing destination. Use `--config-name worker-v2.json` when staging a successor with the same private token and durable state root. Install its exact npm dependencies, restrict ACLs, verify pins, then deliberately update the stopped task to the new runtime. A fresh Git checkout alone does not contain every approved local acting asset: migration to a future GPU host must transfer the reviewed pinned runtime bundle and model weights, not just the website source.

## Verification boundary

The PowerShell launcher accepts `-Once` for a bounded current-session acceptance run. This does not register a task or establish S4U/startup behavior. It starts only missing services and executes one worker queue poll.

`node --test scripts/test-automation-worker.mjs` uses isolated temporary directories, stub HTTP, and an explicitly identified tiny fixture image. It includes an actual killed child-process/checkpoint recovery test. These are engineering tests, not demonstrations of a real generated cartoon. The real acceptance run must separately show a fresh queue job, actual local model and vision responses, a new TV image, assembled PNGs, cloud read-back hashes, and restart/recovery evidence. No actual machine reboot is required or performed by these tests.
