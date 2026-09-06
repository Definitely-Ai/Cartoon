# The daily studio report

Rick's report lives at `/reports`. It explains saved work by area, offers a date picker, displays the exact image version associated with each day's GitHub update, and links every update to its original evidence. It uses the existing studio sign-in. `/api/reports` and the historical image proxy also verify that sign-in themselves.

## Where the record comes from

`node scripts/build-studio-reports.mjs` reads all commits reachable from the GitHub `main` branch in the checkout. It checks GitHub's current branch head read-only and uses it when that object is available locally. The generated `lib/studio-reports-snapshot.json` contains the saved branch, actual check time, commit timestamp, subject, and changed paths. It includes a separate timestamped working-directory snapshot, with ahead/behind counts. Generated library display copies are excluded from that working-file count because their original source files are the work.

The build script does not fetch, check out, stage, commit, or change any Git reference. The deployment workflow should fetch the full branch history before generating the archive. If Git is absent the existing archive is retained. If the build has shallow history, it preserves earlier saved entries and explicitly reports the history limit.

`predev` and `prebuild` should run this script after the image library builder. The optional `reports:refresh` command can rerun it during a working session.

## Staying current on the deployed site

Opening a date reads that day's commits from the GitHub REST API, following pagination. Short server caching lasts three minutes; “Check for new work” requests a fresh read. Live results replace the selected day's snapshot results, so today's zero-update state is established by an actual successful lookup. If GitHub cannot be reached or limits requests, the page keeps the saved report, labels it as a snapshot, and preserves the previous check time.

The repository is currently public, so read-only requests work without new credentials. For greater rate capacity or a private repository, configure a server-only `GITHUB_REPORT_TOKEN` with **Contents: read**; existing `GITHUB_TOKEN` is a fallback. Never add either token to a `NEXT_PUBLIC_` variable. Optional `GITHUB_REPO` and `GITHUB_REPORT_BRANCH` configure the build's repository and branch.

Live lookup is bounded at 2,000 commits in the padded date window and 60 new commit-detail requests. A partial list or incomplete file detail is explicitly labeled. Historical images are fetched at their saved commit, resized proportionally for previews, and linked to the original GitHub file. GitHub image failures do not get silently replaced with a different day's drawing.

## Meaning of a day

Days use each commit's **committer timestamp** in `America/New_York`, including daylight saving time. This is the timestamp in the saved record, not evidence of when somebody began work, how long it took, or when a push happened. Merges stay in the source notes but are excluded from work/file summary counts to avoid counting their original changes twice.

Summaries are deterministic descriptions of changed file areas and lightly translated commit notes. They do not make new claims about quality, approval, publication, analytics, or completion. The local worktable is a build-time snapshot and is never assigned to the selected day's completed work. It cannot see subsequent local changes until rebuilt.

The report covers the selected branch's reachable commits. It does not claim completeness for unmerged branches, issues, pull-request discussions, reviews, chats, unsaved generations, or deployments.

## Checks

`node --experimental-strip-types --test scripts/test-studio-reports.mjs` verifies local-day boundaries, daylight-saving dates, invalid dates, deduplication of file activity, merge handling, and selection of the latest non-deleted historical image. Run `npm run typecheck` and the site build after integrating the report.

`node --test scripts/test-studio-reports-live.mjs` checks the report service with controlled GitHub responses: live zero activity, rate-limit fallback without changing evidence dates, pagination, new file details, caching, and explicit refresh.

GitHub source: [REST API endpoints for commits](https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28).

## Separate studio-database coverage check — September 3, 2026

The connected Supabase app identified the healthy `TheSwingingDoor` project (`ypecehqzzxhdpiesteaw`). Read-only `count(*)` queries returned **0 cartoons, 0 batches, 0 feedback records, and 0 storage objects**. The `cartoons` storage bucket exists and is private. This means the inspected Supabase project had no additional images to merge into the file library at that check. It is a dated observation, not an assertion that future studio uploads will be empty.

No database rows, storage objects, policies, or settings were changed. This audit is separate from the GitHub daily report. The production environment file returned redacted placeholders, so the audit used the existing Supabase connector instead of treating those placeholders as credentials. Future live database images can use the existing authenticated `/api/img/{day}/{n}` path; none needed importing during this audit.
