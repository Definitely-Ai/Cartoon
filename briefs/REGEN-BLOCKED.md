# Batch regeneration blocked — 2026-08-31

A scheduled session was asked to draw a fresh 10-cartoon batch for The Swinging
Door through the studio's brief route. **No batch was drawn.** Nothing was
inspected, rated, redrawn, or edited. This file is the only change.

## The brief that did not run

- text: "Ten cartoons at the bar. Money in kitchen words - a bar bill, a
  premium, a fare, a renewal, a rate, a tip - a different subject every time.
  Bring Abby into four. Every caption lands on its own."
- n=10, quality=high, lanes=3
- target: `GET https://cartoon-brown-seven.vercel.app/api/backroom/brief`

## Two independent blockers

Either one alone would have stopped the run. Both are present.

### 1. No secret to mint the trigger token

`lib/backroom-auth.ts` derives the trigger token as
`HMAC-SHA256(activeSecret(), "backroom-trigger-v1")`, where `activeSecret()`
returns `AUTH_SECRET` if set, else `sha256hex("sd-derived-secret:" +
ADMIN_PASSWORD)`, else `null`.

In this session's environment **neither variable is set**:

- `AUTH_SECRET` — not present
- `ADMIN_PASSWORD` — not present

No `.env`, `.env.local`, or equivalent file exists in the repo checkout or in
the home directory, and no Claude Code settings file supplies them. A search of
the environment for variable names containing auth/admin/secret/password/token/
key turned up only unrelated session and cloud-tooling variables
(`GH_TOKEN`, `GITHUB_TOKEN`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`CLOUDSDK_AUTH_ACCESS_TOKEN`, `GIT_CONFIG_KEY_0/1/2`, and the
`CLAUDE_CODE_*` internals). None of them is the door secret.

*(Names only above — no values were read, logged, or written anywhere.)*

The scheduling note said this environment had been used to trigger batches
before. Whatever supplied the secret then is not supplying it now — it looks
like the environment's variables were cleared, rotated, or the batch was
previously triggered from a different environment.

### 2. Egress policy denies the production host

Independently of the token, this session cannot reach the site at all. The
container's outbound HTTPS goes through a policy-enforcing egress proxy, and
that proxy refuses to open a tunnel to the deployment:

```
host:   cartoon-brown-seven.vercel.app:443
result: gateway answered 403 to CONNECT (policy denial)
```

Confirmed twice against `/__agentproxy/status`, which logged both attempts as
`connect_rejected`. Per the proxy's own guidance a policy denial must be
reported rather than retried or routed around, so no further attempts were
made and no workaround was attempted.

## What is needed to unblock

Both of these, in the environment the batch runs from:

1. Set `AUTH_SECRET` (or `ADMIN_PASSWORD`) so the trigger token can be minted.
   It must be the same value the production deployment runs with, or the route
   will answer 401 even once reachable.
2. Add `cartoon-brown-seven.vercel.app` to the environment's allowed egress
   hosts.

## State at the time of the attempt

- `main` at `cd0b775` ("Close out the founder's 25-panel review: one staging,
  no invented signage, a writer that obeys the fences") — confirmed current
  after `git pull origin main`, so the canon and code fixes closing Rick's
  25-panel review are in place. The blockers are environmental, not code.
- `briefs/` holds the same 6 batch folders it held before this run.
