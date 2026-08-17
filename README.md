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

## The site

One public design: a 1930s–60s American broadsheet. `/` is the front page with each day's chosen cartoon as the lead story, plus **THE FORECAST** and **NOTICES** boxes in the rail; `/archive` is the classified-column archive ("The Morgue"); `/cast` introduces Drew, Mango, and Abby; `/about` tells the story; `/cartoon/<folder-name>` is every cartoon's permanent, print-ready address (Ctrl+P gives a clean one-page printout). A **Back Room** link sits in the header — locked to everyone but the owner.

## The daily flow

1. The founder tells his AI (ChatGPT, connected to this repo): *"I want a cartoon about X."*
2. The AI reads `/canon` (characters, settings, comedy rules) and commits **three finished candidates** to `/options/YYYY-MM-DD/` — the exact file contract is in [canon/creation/WORKFLOW.md](canon/creation/WORKFLOW.md).
3. The founder opens the website, taps **Back Room** in the header, and gives the door the word.
4. The three candidates are waiting on **the light table**. He taps his favorite, taps **RUN IT**, and the cartoon is published — one atomic commit into `/cartoons`, automatic redeploy, live on the front page in about a minute.
5. **The ledger** keeps every candidate from every day, with the one that ran stamped.

Setup (two env vars) in [docs/SETUP.md](docs/SETUP.md).

## Current status

**Built and verified:**
- Repository structure, canon documents (filled from the founder's series bible: cast, settings, comedy rules, boundaries, creation workflow), and the publishing template with a 90-second how-to.
- Seven fully illustrated, canon-informed sample cartoons and nine distinct illustrated Back Room proofs, all with their exact dialogue typeset into the finished cartoon, plus identity/full-body model sheets for Drew, Mango, and Abby. See the [sample artwork record](cartoons/SAMPLE-ART.md).
- The full static site: validated data layer (bad `meta.json` fails the build naming the folder), the broadsheet front page and archive, print-ready permalinks, view-transition page turns, `prefers-reduced-motion` support throughout — plus the login-gated Back Room publishing flow.
- Zero-config Vercel deploys via the root `vercel.json`; every push to the default branch deploys automatically.

**Pending (waiting on the founder):**
- Founder approval of the working character and ink direction. The current sample art is polished enough to exercise the real site, but it is not represented as commissioned final art.
- Line-weight/style decisions flagged "pending founder sign-off" in the style bible, and the Example Approved Gags slots in the comedy bible.
- Final brand confirmation — every branded string is greppable via `BRAND:` for a clean find-and-replace if "The Swinging Door" changes. <!-- BRAND: replace when final -->
