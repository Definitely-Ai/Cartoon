# Cartoon automation acceptance — September 14, 2026

## Outcome and remaining approval

The production website saved a real request in Supabase. The workstation generated a fresh caption, fresh black-and-white TV illustration, chalk lettering and assembled panel, then delivered the verified PNG and report to private cloud storage. This is an engineering proof, **not a publication-approved cartoon**.

Windows startup is **not installed**: the owner canceled the UAC registration prompt. No alternate persistence mechanism was installed. Renewed approval is required before registering and testing the proposed disabled BootS4U task, then deliberately enabling it. Bounded manual runs are finished; no always-on worker is claimed.

## Evidence

| Check | Actual result |
| --- | --- |
| Production form → cloud request | Passed using the signed-in owner's live Automation Studio. Reload retained requests without a second submission. |
| Local inference | Qwen 3.8 27B writer, GPT-OSS 20B critic, FLUX 2 Klein 4B TV art and Mistral Small 3.2 visual review ran locally. No hosted inference fallback. |
| Completed private job | `22552e04-bf26-4703-b495-b4682995f30b`, attempt 3, finished `2026-09-14T17:22:17.409304Z`. Earlier attempts exposed two integration bugs; operator retries retained completed art/stages. |
| Exact PNG delivery | `cartoon-01.png`, 1,546,069 bytes, SHA-256 `23b5264f7b98937b5796312604e7c2edba09125c0cfc11dac13c60e694739bd3`. Server completion reads, hashes and fully decodes the stored PNG before success. |
| Exact report delivery | `edition-report.json`, 7,185 bytes, SHA-256 `08a670a39e1dec63cb44fb6bbaf6494faed374e659db0c066c460de9c66cebb2`. |
| Owner download | Live owner UI displayed the finished job; its protected cartoon link opened the private stored 1024×1536 PNG. Local PNG hash matched the cloud manifest. |
| No duplicate on repeat | A second bounded poll returned idle. The completed job retained attempt 3 and its original completion time; the paused schedule retained exactly one occurrence at attempt 0. Final staged runtime v9 also returned idle and stopped. |
| Worker interruption | Only the precisely identified test worker was hard-stopped at `17:11:10Z`. Restart reused a completed draft with unchanged hash and completion time; the draft later failed the quality gate, correctly remaining unpublished. This was not a PC reboot. |
| Cloud recurring schedule | Owner UI activated a Monday 08:00 America/New_York test starting September 21, then paused it. Exactly one future occurrence was materialized. Test schedule remains paused. |
| Automated engineering suite | 39/39 tests passed: queue authorization and fencing, scheduling/DST/backlog, durable render recovery, checkpoint/singleton behavior, and integration regressions. Tests include controlled fixtures; not every test uses live models. |
| Unauthorized API access | Unsigned jobs, schedules, assets and cron requests returned 401. Correct private cron authentication returned 200. Private storage remains non-public. |
| Live SQL probes | Transaction rollback probes covered lease fencing, idempotent completion, schedule cursor compare-and-set, occurrence uniqueness, pause/resume backlog and active leases. Serial interleaving was tested, not real simultaneous independent SQL sessions. |
| Website verification | Production ready deployment and owner controls verified; local desktop/mobile render checked without overflow or browser errors. |

Local proof files: `Z:\ImageGenerator\CartoonRuntime\config\state\jobs\22552e04-bf26-4703-b495-b4682995f30b`.

Staged runtime: `Z:\ImageGenerator\CartoonRuntime\releases\20260914-v9`; private config: `Z:\ImageGenerator\CartoonRuntime\config\worker-v9.json`. Its 31 required files are hash-pinned, npm dependencies installed, and ACL inheritance limited to the owner, administrators and SYSTEM. The installation `-WhatIf` preview explicitly confirmed that no task was registered or started. Earlier snapshots are retained; nothing overwrote the mutable art studio.

The recovery checkpoint was in job `99c6e407-3e4b-465d-ad31-788ed73f8bca`: stage `draft-01-1-3d005cd8`, response hash `cb3808bdbe61a2cf6fb6c1e1addeb68c9141930100ee2f3d9d497eb77a652622`, completion time `17:10:50Z`. Failed trials remain in private history rather than being hidden or misrepresented as successful.

Paused schedule: `6051c035-5def-42e4-a13f-717e23e56cf6`. Its retained unclaimed occurrence is `db9f87e3-6329-41d4-8691-aea9f3709e9b`, due `2026-09-21T12:00:00Z`.

## Fixes discovered by real execution

- Gemma 4 31B failed caption prefill with a CUDA illegal-memory-access error on this installed stack. The healthy Ollama service remained available. Three alternative local models passed smoke tests; the tested production profile now uses those. The precise Gemma root cause is unproven.
- Older bible examples conflicted with the current structured output. The writer now receives concise comedy mechanisms plus explicit dialogue-only, short-menu and drawable-TV requirements. Mechanical field limits are included in its JSON schema.
- ComfyUI's successful empty `/free` response is no longer incorrectly parsed as JSON.
- A review issue list containing only the literal `None` is treated as empty. Actual concerns, failed criteria, low scores and low confidence still block output.

## Editorial and operational limits

The delivered caption is grammatical but abstract, and the chalkboard's "House Rule" is not a sufficiently clear menu item. Its model score is not evidence of an 8/10 reader response. It is retained as a technical proof only; editorial calibration and human review remain necessary. The approved 38 public cartoons and fixed cast/set assets were not replaced.

Naples sources are configured. Other cities require a reviewed location/source registry; arbitrary-city factual coverage has not been demonstrated. Stale captures over 24 hours hold for attention instead of silently reusing old evidence. Nothing automatically publishes or emails.

Queued requests are stored in the cloud while the PC is offline. Completing them requires power, Windows, internet, readable model/runtime storage and a functioning GPU. S4U task-context inference, automatic startup, actual reboot and total power-loss recovery remain **untested**. BIOS restore-on-AC, disk unlock and sleep settings were not changed. Those dependencies cannot be proved by a signed-in manual run.

Uncertain GPU requests are not blindly duplicated. A same-server unaccounted-for render or damaged recovery state can require inspection; this is not a guarantee that every conceivable power-cut state self-recovers. Completed checkpoint reuse and fenced delivery avoid duplicate editions, but repeated inference after a lost response is possible.

## Next authorized installation step

With renewed owner approval, register the disabled task from the staged runtime using the documented BootS4U command. Test that exact noninteractive identity's file/GPU/network access and one bounded private job before enabling ongoing triggers. Do not substitute SYSTEM, collect a Windows password, enable autologin, or reboot the computer without a separate explicit decision.
