# How a cartoon goes live

Audience: the technical maintainer. The repo's filesystem is the CMS — publishing a cartoon is adding one folder and pushing.

## The steps

1. **Duplicate the template.** From the repo root:

   ```bash
   cp -r cartoons/_TEMPLATE cartoons/2026-08-13-the-quarterly-call
   rm cartoons/2026-08-13-the-quarterly-call/README.md
   ```

2. **Name the folder correctly.** The pattern is `YYYY-MM-DD-slug`. Slug rules: lowercase, hyphens, 2–4 words. The full folder name is the permalink (`/cartoon/2026-08-13-the-quarterly-call`), so make it worth reading. The date prefix must match the `date` field inside `meta.json` — the build checks.

3. **Add the artwork** as `cartoon.png` inside the folder. Black and white, at least 1200px on the long side, PNG. Portrait (4:5) and square both work — the layouts handle either.

4. **Fill in `meta.json`.** The schema, one line per field:

   ```json
   {
     "title": "The Quarterly Call",     // required non-empty string — the headline
     "caption": "…",                    // required non-empty string — the joke, exactly as it should print
     "date": "2026-08-13",              // ISO YYYY-MM-DD; must equal the folder's date prefix
     "tags": ["markets", "clients"],    // 0–5 entries, all lowercase
     "edition": 7                       // unique positive integer; check the newest folder and add one
   }
   ```

   (Remove the comments — `meta.json` is strict JSON.)

5. **Commit and push.**

   ```bash
   git add -A && git commit -m "cartoon: The Quarterly Call" && git push
   ```

   Vercel rebuilds automatically. The cartoon is live in about a minute, on all three variants at once.

## Troubleshooting

The build validates every cartoon and **fails loudly rather than shipping bad data**. Every error message names the offending folder. There are three:

1. **`Cartoon validation failed in /cartoons/<folder>: "<field>" is required / must be …`**
   A `meta.json` problem: the file is missing or not valid JSON, `title` or `caption` is empty, `tags` isn't 0–5 lowercase strings, `edition` isn't a positive integer, or `cartoon.png` is absent. Fix the named field in the named folder and push again.

2. **`Cartoon validation failed in /cartoons/<folder>: "date" (…) must match the folder's date prefix (…)`** (or `"date" must be an ISO calendar date`)
   The `date` field and the folder name disagree, or the date isn't a real `YYYY-MM-DD` date. The folder name is the permalink, so the two must always agree — rename one of them.

3. **`Cartoon validation failed in /cartoons/<folder>: "edition" N is already used by /cartoons/<other-folder>`**
   Two cartoons claim the same edition number. Editions are unique across the whole archive (they're the sort tiebreaker and the "No. N" folio). Give the new cartoon the next unused number.

## No-terminal option

The identical flow, entirely in the browser — no git installed:

1. On GitHub, open the repo and press **Add file → Upload files**.
2. In the file-name box, type the new folder name followed by a slash — e.g. `cartoons/2026-08-13-the-quarterly-call/` — then drag `cartoon.png` into the upload area. GitHub creates the folder.
3. Commit the upload (green button at the bottom).
4. Press **Add file → Create new file**, name it `cartoons/2026-08-13-the-quarterly-call/meta.json`, and paste the filled-in schema from step 4 above (without the comments). Commit.
5. Vercel rebuilds on its own. If the build fails, the error in Vercel's dashboard names the folder and field — edit `meta.json` directly in the browser (open the file → pencil icon) and commit the fix.
