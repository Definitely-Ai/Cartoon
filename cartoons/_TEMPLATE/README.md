# Adding a cartoon

Five steps, ninety seconds.

1. **Duplicate this `_TEMPLATE` folder** inside `/cartoons/`.
2. **Rename the copy** to today's date plus a short slug: `YYYY-MM-DD-two-to-four-words` (lowercase, hyphens — e.g. `2026-08-13-the-quarterly-call`). The folder name is the permalink, so make it worth reading.
3. **Drop in the artwork** as `cartoon.png` (black and white, at least 1200px on the long side).
4. **Fill in `meta.json`**: `title` and `caption` exactly as they should print, `date` matching the folder's date, `tags` (0–5, lowercase), and `edition` — the next unused whole number (check the newest folder and add one).
5. **Commit and push.** The site rebuilds itself; the cartoon is live in about a minute.

If the build fails after a push, the error names the folder and the field that broke — fix it and push again. Full details in `/docs/PUBLISHING.md`.
