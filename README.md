# The Swinging Door <!-- BRAND: replace when final -->

A single-panel, strictly black-and-white barroom cartoon about politics, markets, and American life — Drew the flamingo, Mango the golden retriever, and Abby behind the bar of the Swinging Door. <!-- BRAND: replace when final --> This repo is the company's entire digital home: the canon that keeps the strip consistent, the cartoons themselves, and the website that publishes them. There is no CMS — **the filesystem is the CMS**. Add a folder under `/cartoons`, push, and the site rebuilds and deploys itself.

## Folder map

| Folder | What it is |
| --- | --- |
| `/canon/` | The source of truth for how the strip looks, sounds, and jokes: character descriptions (`characters/`), style bible (`style/`), settings bible (`settings/`), personalities (`personality/`), comedy bible (`comedy/`), and the repeatable creation workflow (`creation/`). Written from the founder's series bible. |
| `/cartoons/` | One folder per **published** cartoon (`YYYY-MM-DD-slug/` with `cartoon.png` + `meta.json`) — this is the public side. `_TEMPLATE/` is the starting point for manual additions and never ships. |
| `/options/` | The daily inbox: each day's candidate cartoons (`YYYY-MM-DD/option-N.png` + optional suggestion JSON). Private — only visible in the Back Room until one runs. |
| `/site/` | The Next.js website. Static generation only; it reads `/cartoons` and `/canon` at build time and fails loudly on bad data. |
| `/docs/` | [How to publish a cartoon](docs/PUBLISHING.md) and [local dev + Vercel setup](docs/SETUP.md). |

## The three design variants

The site currently ships three complete, deliberately distinct designs so the founder can pick one; the winner later becomes `/`:

- **`/a` — The Daily Paper.** A 1930s–60s American broadsheet: blackletter nameplate, Ochs-rule dateline, classified-column archive ("The Morgue"), THE FORECAST box.
- **`/b` — The Gag Panel.** A mid-century magazine: one framed plate on pristine white, italic captions, contact-sheet archive, Dramatis Personae.
- **`/c` — The Funny Pages.** A Sunday-comics paste-up board: halftone dots, taped and tilted panels, starburst badge, rubber-stamp tag filters.

`/` is the chooser; `/cartoon/<folder-name>` is every cartoon's permanent, print-ready address.

## The Back Room

The owner's side, at `/backroom`, behind a login (the speakeasy asks: "What's the word?"). Each day he reviews the day's candidate cartoons on **the light table**, edits the title or caption if needed, and taps **RUN IT** — one atomic commit later the winner is in `/cartoons` and the public site redeploys itself. **The ledger** keeps every option from every day, with the one that ran stamped. Mobile-first, since decisions happen over coffee. Setup (three env vars) in [docs/SETUP.md](docs/SETUP.md).

## Current status

**Built and verified:**
- Repository structure, canon documents (filled from the founder's series bible: cast, settings, comedy rules, boundaries, creation workflow), and the publishing template with a 90-second how-to.
- Six clearly labelled, canon-informed mock cartoons with series-consistent captions (mixed 4:5 and square, generated in B&W via `site/scripts/generate-placeholders.mjs`; see the [placeholder artwork inventory](cartoons/PLACEHOLDER-ART.md)).
- The full static site: validated data layer (bad `meta.json` fails the build naming the folder), three variants, chooser, permalinks with print stylesheet, view-transition page turns, `prefers-reduced-motion` support throughout.
- Zero-config Vercel deploys via the root `vercel.json`; every push to the default branch deploys automatically.

**Pending (waiting on the founder):**
- Real artwork — every panel is visibly labelled placeholder art and must be replaced before publication.
- Model sheets for Drew, Mango, and Abby (drop PNGs beside each `DESCRIPTION.md`; the characters pages pick them up automatically).
- Line-weight/style decisions flagged "pending founder sign-off" in the style bible, and the Example Approved Gags slots in the comedy bible.
- Final brand confirmation — every branded string is greppable via `BRAND:` for a clean find-and-replace if "The Swinging Door" changes. <!-- BRAND: replace when final -->
- Variant selection — when one of `/a` `/b` `/c` wins, it becomes `/`.
