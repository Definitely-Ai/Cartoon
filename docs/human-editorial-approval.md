# Generated cartoons: private first, human approval second

The Generate studio saves completed cartoons as **private drafts**. A successful
worker run, a machine quality score, or a schedule firing never publishes them.
The existing 40 curated cartoons are unchanged.

## The owner workflow

1. Choose a city, state, and number of cartoons. Follow confirmed production
   milestones; the progress bar does not estimate elapsed-time completion.
2. Open a finished edition. View each image at full size, inspect its source,
   and read the caption, TV, and chalkboard together.
3. Check artwork/cast, grammar/coherence, and source/local relevance. Give the
   cartoon a gallery title and explicitly choose **Approve & publish**.
4. The specific approved image appears on Cartoons, with the existing print and
   presentation tools. Other images in the batch remain private.
5. **Needs changes** keeps a draft private. **Withdraw from gallery** removes a
   publication without deleting its original. Manage gallery can also hide or
   restore a still-approved cartoon. Downloaded copies cannot be recalled.

## Safeguards

- Only the signed-in owner session can decide. Worker bearer tokens cannot use
  the editorial route. Origin checks protect mutations.
- Approval binds the exact image and report hashes, requested edition, approved
  `barclay-reference-v2` portrait/head/acting pose, unchanged protected set,
  monochrome audit, and 1024 × 1536 print dimensions.
- Older or unverified cast releases cannot be approved. The running v14 PC
  worker is still the known source of the earlier wrong-Barclay Chicago draft;
  activating the corrected runtime is a separate startup change, not performed
  by this website release.
- PostgreSQL serializes decisions, rejects stale versions, and records an
  append-only decision history. Retrying a lost response cannot resurrect work
  subsequently withdrawn by a reviewer.
- The storage bucket remains private. Approved images use a server proxy that
  rechecks approval and visibility and does not issue a public signed URL.
  Image responses are not cached. Reports remain private.
- Public gallery queries use only human-approved snapshots, never queue
  completion status. Database unavailability fails closed.
- Shared owner login is recorded as `backroom-owner`, not as an unverified
  named individual. Distinct reviewer accounts would require an auth expansion.

## Verification

`node --test scripts/test-cartoon-reviews.mjs scripts/test-generation-timeline.mjs scripts/test-automation-queue-server.mjs`

`scripts/verify-generation-studio.mjs` uses loopback-only browser fixtures, not
production generation or publication. It covers submission, duplicate
prevention, GPU/offline/reconnection states, automatic completion, batch
navigation, verified print PDF, human checks, legacy-cast blocking, independent
batch approvals, rejection, withdrawal, mobile, and presentation layouts.

Production database checks exercised the decision RPC inside a rolled-back
transaction. No test approval, publication, or review-history rows were retained.
The two new tables force RLS and deny anonymous/authenticated direct access;
only the server service role can access them and execute the decision RPC.
