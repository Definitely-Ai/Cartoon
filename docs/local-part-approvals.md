# Local part approvals

The room page can save one explicitly selected part source on the art computer. This is disabled by default, disabled whenever `VERCEL` or `VERCEL_ENV` is set, and unavailable through a remote address. No setting has been enabled and no real art was approved as part of implementation or tests.

To use it later, start a local Next server with `STUDIO_ENABLE_LOCAL_PART_APPROVALS=1` and bind it to loopback (`next dev --hostname 127.0.0.1`, or `next start --hostname 127.0.0.1` for an existing build). Keep it off network interfaces and reverse proxies. Next's standard Request object does not expose a trusted peer socket, so the bind is required in addition to Host, Origin and forwarding checks. Use the existing studio login. Do not put the flag in hosted deployment configuration.

In `/room`, expand the chosen image part's local replacement controls, choose and inspect the candidate, check the confirmation naming the part, then press **Save this part replacement**. Candidate selection and browsing do not write. The response confirms whether the source was saved. The page reads the current local manifest and matches the source's actual SHA-256 to the library after a save; an image absent from the inventory is not presented as verified.

`POST /api/room/approve` requires the signed studio cookie, same local origin, explicit `confirmed: true`, a current manifest part ID, a content-addressed library candidate ID, and the normalized manifest SHA-256 held when the image was selected. It accepts PNG candidates only from project origins under `canon/plates/work/`. Room-kit, bases and code lettering are ineligible. The handler rejects oversized requests, oversized/invalid images, stale identities, path traversal, symlinks and junctions.

Saving copies exact candidate bytes to `canon/plates/parts/<id>.png` and changes only that record's `source` field. It never changes enabled flags, cut lines, base files or composed art. Source dimensions may differ from the 1200×1800 manifest because the assembler resizes full-canvas sources; the response warns about that alignment check instead of rejecting solely on size.

Writes are serialized within the process and use an exclusive `.studio-part-approval.lock` across processes. A concurrent manifest change is checked before and after the image swap. If manifest replacement fails, the old part is restored. Temporary files are removed. A crash can leave the lock; it is deliberately not removed automatically. Coordinate with Claude before editing the manifest or part sources through another tool: unrelated art tools do not currently honor this lock. This is not a distributed transaction or a remote approval queue.

Rebuilding remains a separate art-pipeline operation. This route never invokes a build script, inference service or GPU. It does not approve a new room base.

Validation: `node --experimental-strip-types --test tests/studio-part-approval.test.mjs` uses disposable temporary directories and generated fixture pixels only. Nine tests cover request gating, exact-byte source-only writes, stale hashes, ineligible parts/paths, junction rejection, PNG validation, rollback, serial writes and retained locks. `npx tsc --noEmit` also passes. The real studio's flag remained off during the browser check.
