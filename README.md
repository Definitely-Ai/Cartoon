# The Swinging Door <!-- BRAND: replace when final -->

A single-panel, strictly black-and-white barroom cartoon about politics, markets, and American life — Drew the flamingo, Mango the golden retriever, and Abby behind the bar of the Swinging Door. <!-- BRAND: replace when final --> This repo is the company's entire digital home: the canon that keeps the strip consistent, the cartoons themselves, and the website that publishes them. There is no CMS — **the filesystem is the CMS**. Add a folder under `/cartoons`, push, and the site rebuilds and deploys itself.

## Folder map

| Folder | What it is |
| --- | --- |
| `/canon/` | The source of truth for how the strip looks, sounds, and jokes: character descriptions (`characters/`), style bible (`style/`), settings bible (`settings/`), personalities (`personality/`), comedy bible (`comedy/`), and the repeatable creation workflow (`creation/`). Written from the founder's series bible. |
| `/cartoons/` | One folder per **published** cartoon (`YYYY-MM-DD-slug/` with `cartoon.png` + `meta.json`) — this is the public side. `_TEMPLATE/` is the starting point for manual additions and never ships. |
| `/options/` | The daily inbox: each day's candidate cartoons (`YYYY-MM-DD/option-N.png` + optional suggestion JSON). Private — only visible inside the studio login. |
| `/app`, `/lib`, `/scripts`, `/public` | The Next.js website, at the repo root so Vercel builds it zero-config and the login middleware guards every request. It reads `/cartoons`, `/canon`, and `/options` at build time and fails loudly on bad data. |
| `/docs/` | [How to publish a cartoon](docs/PUBLISHING.md) and [local dev + Vercel setup](docs/SETUP.md). |

## The site — a private studio

The whole site sits behind one login; only the founder gets in. `/login` is the door — a plain username + password with "Keep me signed in", so each of his devices asks once and then remembers; `/` is **Today** — the newest batch of cartoons laid out big, each with a **Keep this one** star; `/collection` catalogs every day ever generated, grouped by month; `/keepers` is everything he starred; `/connect` shows the AI-connector address and hookup steps. There is no public side — nothing exists outside the login until the founder decides the strip is ready for the world (the newspaper design lives in git history for that day).

## The training week

Right now the product is being perfected before it's shown to anyone: the founder generates many batches a day, and **every cartoon gets a verdict** — Love it / It's fine / Not for me — a keeper star for the exceptional, and an optional note on why. All of it lands in `options/<day>/feedback.json`. At the end of the week the AI reads the whole corpus (`get_feedback`) and proposes bible revisions that actually represent his style and humor.

The week ends with a **graduation test**: on the last day, the AI predicts his verdict for a fresh batch *before* he rates it. Four out of five right means the bible reads his taste well enough to present; each miss names the chapter that still needs work.

## The daily flow

1. The founder tells his AI (ChatGPT, connected to this repo): *"I want them fishing today."*
2. The AI reads `/canon` (the master prompt, characters, settings, comedy rules) and commits **3–5 finished cartoons** to `/options/YYYY-MM-DD/` — file contract in [canon/creation/WORKFLOW.md](canon/creation/WORKFLOW.md), with a `topic` field naming the request.
3. He looks at them right there in the chat — or opens the site, where the batch is waiting on **Today**, bigger and easier.
4. He stars the ones he likes (site button or by telling the AI); stars land in the repo and the **Keepers** gallery grows.
5. Everything stays cataloged forever in **The Collection**, by month and day.

Setup (env vars, connector) in [docs/SETUP.md](docs/SETUP.md).

## Current status

**Built and verified:**
- Repository structure, canon documents (filled from the founder's series bible: cast, settings, comedy rules, boundaries, creation workflow), and the publishing template with a 90-second how-to.
- Seven fully illustrated, canon-informed sample cartoons and nine distinct illustrated Back Room proofs, all with their exact dialogue typeset into the finished cartoon, plus identity/full-body model sheets for Drew, Mango, and Abby. Drew now also has a locked master model, an in-depth production bible, prompt/QC contracts, and five focused continuity sheets. See the [sample artwork record](cartoons/SAMPLE-ART.md) and [Drew's canon](canon/characters/flamingo/DESCRIPTION.md).
- The full static site: validated data layer (bad `meta.json` fails the build naming the folder), the broadsheet front page and archive, print-ready permalinks, view-transition page turns, `prefers-reduced-motion` support throughout — plus the login-gated Back Room publishing flow.
- Zero-config Vercel deploys — the app lives at the repo root; every push to the default branch deploys automatically.

**Approved and locked:**
- Drew's base character model and written canon: 46-year-old male flamingo, mature average build, expressive avian eyes, long slim rounded S-neck, feathered wing-arms and feather-hands, natural-plumage base body, and permanent black bow tie. `npm run canon:check` guards the required assets and fingerprints.

**Pending (waiting on the founder):**
- Review/sign-off on Drew's supporting expression, anatomy, pose, wardrobe, scene-continuity, and proportion sheets; the locked master remains authoritative meanwhile.
- Founder approval of the remaining working character and ink direction for Mango and Abby. The current sample art is polished enough to exercise the real site, but their sheets are not represented as commissioned final art.
- Line-weight/style decisions flagged "pending founder sign-off" in the style bible, and the Example Approved Gags slots in the comedy bible.
- Final brand confirmation — every branded string is greppable via `BRAND:` for a clean find-and-replace if "The Swinging Door" changes. <!-- BRAND: replace when final -->
