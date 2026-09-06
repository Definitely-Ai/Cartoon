# Shared studio notes

`/notes` lists the latest 100 saved notes, newest first, and accepts a writer's
chosen name (Rick or Zechariah), a topic, and 1–4,000 characters. The shared login
does not establish which person wrote a note; the page states this directly.
`/notes?image=<library-id>` filters the discussion to a current library image and
attaches new notes to it. Previews link back to the image library.

The page and `/api/studio-notes` require the existing signed studio cookie. The
API GET supports the same optional `image` filter. POST requires a same-origin
JSON request of at most 8 KiB, with only `author`, `body`, `topic`, and optional
`image_id`. The server validates supplied image IDs against its library before
writing. Database-generated IDs and creation times are returned only after a
successful insert response. Drafts are not written to browser storage; failed or
uncertain saves retain the text and ask the writer to refresh before retrying.

The server reads `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`, using the existing
private service-role REST pattern. No key is sent to a browser, and raw backend
errors are never returned or logged. Missing configuration displays an unavailable
state instead of a fake empty or saved response. There are no automatic refreshes,
email notifications, database changes, or example messages in this feature.

Table ownership and access rules are in `docs/sql/studio-notes.sql`; the root
integration task applied and verified them separately. See the current Supabase
[REST API](https://supabase.com/docs/guides/api) and
[server-key guidance](https://supabase.com/docs/guides/getting-started/api-keys).

Verification: `node --test scripts/test-studio-notes.mjs` mocks the backend and
checks authentication, origin, allowed fields, image membership, the streamed
byte limit, bounded queries, safe errors, and confirmed save responses. It sends
no actual shared messages. `npm run typecheck` checks the page and route types.

Database verification on September 3: the `private_studio_notes` migration succeeded; a service-role insert inside a rolled-back transaction succeeded; the final row count was zero. Both RLS and forced RLS are enabled. `anon` and `authenticated` cannot read; only the server service role has SELECT and INSERT. The advisor's [RLS enabled without policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) information is intentional for this server-only table. It also reported pre-existing `rls_auto_enable` function permission warnings ([anonymous](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)); this feature did not create or change that function.
