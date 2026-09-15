# Restore the forty-cartoon collection

Owner request: withdraw all twelve city studies generated for September 15 and return to the original 38 plus the September 14 Austin and Los Angeles editions.

- `cartoonCollection` now contains exactly those 40; none of the twelve study IDs is included.
- The twelve original/preview files and source manifest remain recoverable on disk and in Git. No original art was deleted.
- The presentation now features six selections from the retained collection, plus the system walkthrough and live generation form (11 slides with the full collection). The twelve-city overview, context section and PDF shortcut are removed.
- Owner-only Manage gallery controls allow reversible per-cartoon removal and restoration. Removing excludes the cartoon from the public gallery, presentation choices and individual print route. Historical ZIPs/direct artwork files remain available, as disclosed in the interface.
- The service-only `gallery_visibility` table stores exclusions. It has forced RLS, no public/authenticated grants, and no DELETE grant. Gallery reads fail closed if visibility settings cannot be loaded.
- Same-origin authenticated mutations validate exact fields and known collection IDs, use idempotent upsert, and revalidate relevant paths. No automatic publication or permanent deletion was introduced.

## Verification

`scripts/verify-gallery-management.mjs` uses a loopback-only in-memory database stand-in from `scripts/gallery-fixture-server.mjs`, never production data. It verified 40 published cartoons, absence of all 12 withdrawn IDs, cancel/removal/restore, anonymous and cross-origin write rejection, exclusion from public presentation and print, safe presentation cover fallback, and mobile layout. Test removal was restored before completion.

The unrelated automation request-desk improvement remains included. Corrected-cast and revised editorial worker changes are separate from the gallery rollback; activation is approval-gated.
