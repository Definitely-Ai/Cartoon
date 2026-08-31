# The Swinging Door <!-- BRAND: replace when final -->

A single-panel, strictly black-and-white barroom cartoon about politics, markets, and American life — Drew the flamingo, Barclay the golden retriever, and Abby behind the bar of the Swinging Door. <!-- BRAND: replace when final --> This repo is the company's entire digital home: the canon that keeps the strip consistent, the cartoons themselves, and the website that publishes them. There is no CMS — **the filesystem is the CMS**. Add a folder under `/cartoons`, push, and the site rebuilds and deploys itself.

## Folder map

| Folder | What it is |
| --- | --- |
| `/canon/` | The source of truth for how the strip looks, sounds, and jokes: character descriptions (`characters/`), style bible (`style/`), settings bible (`settings/`), personalities (`personality/`), comedy bible (`comedy/`), and the repeatable creation workflow (`creation/`). Written from the founder's series bible. |
| `/cartoons/` | One folder per **published** cartoon (`YYYY-MM-DD-slug/` with `cartoon.png` + `meta.json`) — this is the public side. `_TEMPLATE/` is the starting point for manual additions and never ships. |
| `/options/` | Historical: the git-era daily inbox. Live cartoons, batches, and scores now live in the **Supabase studio database** (Postgres + private image bucket) and appear on the site instantly. |
| `/app`, `/lib`, `/scripts`, `/public` | The Next.js website, at the repo root so Vercel builds it zero-config and the login middleware guards every request. It reads `/cartoons`, `/canon`, and `/options` at build time and fails loudly on bad data. |
| `/scripts/training/` | The training set for the character model: a hand-curated crop manifest, the builder that turns the locked sheets into captioned studies, and the balance check that refuses a lopsided corpus. See [docs/TRAINING.md](docs/TRAINING.md). |
| `/docs/` | [How to publish a cartoon](docs/PUBLISHING.md), [local dev + Vercel setup](docs/SETUP.md), and [training the character model](docs/TRAINING.md). |

## The site — a private studio

The whole site sits behind one login; only the founder gets in. `/login` is the door — a plain username + password with "Keep me signed in", so each of his devices asks once and then remembers; `/` is **Today** — the newest batch of cartoons laid out big, each with a **Keep this one** star; `/collection` catalogs every day ever generated, grouped by month; `/keepers` is everything he starred; `/connect` shows the AI-connector address and hookup steps. There is no public side — nothing exists outside the login until the founder decides the strip is ready for the world (the newspaper design lives in git history for that day).

## The training week

Right now the product is being perfected before it's shown to anyone: the founder asks his chat AI for cartoons in plain words, **the studio generates the art itself** (the hosted house model, gpt-image-2, conditioned on the plate reference portraits — the chat AI only sends text, so phones work), and **every cartoon gets two scores** — 1–10 for the art, 1–10 for the caption — plus a keeper star for the exceptional and an optional note on why. A cartoon **lands** when both scores hit 6; the studio goal is **60% landing**. All of it lives in the studio database and appears on the site the moment it happens — organized by batch, each headed by what he asked for in his own words; the AI reads the corpus (`get_feedback`) and proposes bible revisions that actually represent his style and humor.

The week ends with a **graduation test**: on the last day, the AI predicts land-or-miss for a fresh batch *before* he scores it. Four out of five right means the bible reads his taste well enough to present; each miss names the chapter that still needs work.

## The daily flow

1. The founder tells his AI (ChatGPT with the studio connector): *"Make one where they're on a boat."*
2. The AI talks the idea through with him, writes 3–5 candidates from `/canon`, and calls the studio's `make_cartoons` with his exact words — **the server generates the art** (gpt-image-2 on the plate references), typesets each caption, and files the batch in the studio database.
3. He opens **Today** — the batch is already there, headed by what he asked — and scores each cartoon twice: 1–10 for the art, 1–10 for the caption. Stars for the exceptional.
4. His scores, notes, and stars save instantly; the AI reads them with `get_feedback` and the bible gets sharper.
5. Everything stays cataloged forever in **The Collection**, by month and day.

Setup (env vars, connector) in [docs/SETUP.md](docs/SETUP.md).

## Current status

**Built and verified:**
- Repository structure, canon documents (filled from the founder's series bible: cast, settings, comedy rules, boundaries, creation workflow), and the publishing template with a 90-second how-to.
- Seven fully illustrated, canon-informed sample cartoons and nine distinct illustrated Back Room proofs, all with their exact dialogue typeset into the finished cartoon, plus identity/full-body model sheets for Drew, Barclay, and Abby. Drew now also has a locked master model, an in-depth production bible, prompt/QC contracts, and five focused continuity sheets. See the [sample artwork record](cartoons/SAMPLE-ART.md) and [Drew's canon](canon/characters/flamingo/DESCRIPTION.md).
- The full static site: validated data layer (bad `meta.json` fails the build naming the folder), the broadsheet front page and archive, print-ready permalinks, view-transition page turns, `prefers-reduced-motion` support throughout — plus the login-gated Back Room publishing flow.
- Zero-config Vercel deploys — the app lives at the repo root; every push to the default branch deploys automatically.

**Approved and locked:**
- Drew's base character model and written canon: 46-year-old male flamingo, mature average build, expressive avian eyes, long slim rounded S-neck, feathered wing-arms and feather-hands, natural-plumage base body, and permanent black bow tie. `npm run canon:check` guards the required assets and fingerprints.

**Ready to train:**
- A custom character model. The studio draws with a hosted model either way; `IMAGE_MODEL` decides whether that is the house default (openai/gpt-image-2 on the plate references, today), Kontext on a reference board, or a fine-tune that knows the cast by name (one ~$3 training run away). The dataset is built from the sheets and the finished cartoons, and the whole design turns on one line: **the model owns who they are and how they're drawn; his sentence owns the setting, the joke, and the details.** Captions name every background out loud, the build fails if the corpus tips too far toward the bar, and the prompt drops the barroom paragraph the moment a scene leaves the bar. [docs/TRAINING.md](docs/TRAINING.md).

**Pending (waiting on the founder):**
- Review/sign-off on Drew's supporting expression, anatomy, pose, wardrobe, scene-continuity, and proportion sheets; the locked master remains authoritative meanwhile.
- Barclay and Abby are **founder-approved working models, locked 2026-08-17 for daily production** (see their character bibles); final commissioned art may still supersede the sheets later. The single source for lock status is the cast table in [canon/README.md](canon/README.md).
- Line-weight/style decisions flagged "pending founder sign-off" in the style bible, and the Example Approved Gags slots in the comedy bible.
- Final brand confirmation — every branded string is greppable via `BRAND:` for a clean find-and-replace if "The Swinging Door" changes. <!-- BRAND: replace when final -->
