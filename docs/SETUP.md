# Setup — local dev and Vercel

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. That's all — no database, no environment variables, no CMS login.

### What the prebuild does

`npm run dev` and `npm run build` both run `scripts/prebuild.mjs` first (via npm's `predev`/`prebuild` hooks). It copies:

- every `/cartoons/<folder>/cartoon.png` → `public/cartoons/<folder>.png`
- every model-sheet image in `/canon/characters/*` → `public/canon/<character>/`
- every `/options/<date>/option-N.png` → the login-gated studio asset directory

These destinations are gitignored — they're derived from the repo's source folders on every build. The data layer (`lib/cartoons.ts`) separately reads and validates every `meta.json` at build time; a bad one fails the build with the folder named (see [PUBLISHING.md](PUBLISHING.md) → Troubleshooting).

### Artwork safety

The old SVG placeholder and blank-proof generators were retired. The prebuild
fingerprints those legacy PNGs and fails if any of them reappear, so a local
script cannot silently overwrite illustrated art with the former mockups.

The social card is deterministic rather than AI-typeset. Prebuild refreshes it
from the latest public cartoon; `npm run brand-assets` is also available when
working on the brand treatment by itself.

Finished cartoons carry their dialogue inside the PNG. Start from square or
4:5 text-free illustrated panels whose JSON captions are final, then run
`npm run dialogue`. The script appends an exact warm-white dialogue field. It
can safely rerun a finished cartoon after a caption edit: it keeps the untouched
square art region and rebuilds the dialogue field instead of stacking strips.

## Vercel: zero-config deploys

The Next.js app lives at the **repo root**, so Vercel detects and builds it with no configuration at all: import the repo, deploy, done. Every push then deploys automatically (production from the default branch, previews for other branches). The `/cartoons`, `/canon`, and `/options` folders sit beside the app and are read at build time.

> History note: the app once lived in a `/site` subdirectory behind a legacy `builds` entry in `vercel.json`. That legacy routing served static pages **without running the site's login middleware** — the whole reason the app moved to the root. Don't reintroduce `builds`/`routes` in a `vercel.json`; root-level zero-config is what keeps the door locked.

### Manual redeploy

Vercel dashboard → the project → **Deployments** tab → the ⋯ menu on the latest deployment → **Redeploy**. Useful after changing a Vercel setting, since settings only apply to new builds.

## The studio login + actions

**The whole site is private now** — every page sits behind the owner's login at `/login` (old `/backroom` addresses redirect). The door is a standard **username + password** form with a checked-by-default **"Keep me signed in on this device"**: remembered devices stay signed in for a year, and because the form uses the standard field names, every phone and browser offers to save the login on first sign-in — after that it fills itself in. He logs in once per device (phone, iPad, laptop) and never again. Inside: Today's batch with **Keep this one** stars (each star is a small commit to `options/<day>/keepers.json`), the Collection, Keepers, and the connector page. The RUN IT publish machinery still exists under the hood (MCP `publish_cartoon`) for when the public paper at `/paper` un-parks.

It needs these environment variables in the Vercel project (Settings → Environment Variables), then a redeploy:

| Variable | What it is |
| --- | --- |
| `ADMIN_USERNAME` | Optional — the founder's username at the door. **Defaults to `theswingingdoor`** when unset, so there's nothing to configure to start. Case and stray spaces are forgiven. |
| `ADMIN_PASSWORD` | The founder's password. Pick a long one; stray spaces are forgiven here too. Changing it signs every device out. |
| `GITHUB_TOKEN` | A [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) scoped to **this repo only** with **Contents: Read and write**. Lets the publish button commit. Fine-grained tokens expire (a year at most) — when publishing someday fails with a permissions error, mint a fresh token and replace this value. |

Optional extras: `AUTH_SECRET` (any long random string; signs the login cookie — when unset it is derived from the password, and setting it separately lets you log every device out without changing the password) and `GITHUB_REPO` (defaults to `Definitely-Ai/Cartoon`, for if the repo ever moves).

## The chat connector (MCP)

The site is an **MCP server** at `/api/mcp` — the whole daily ritual can run inside one ChatGPT conversation. Four tools: `get_canon` (the live master prompt from the repo — canon can never go stale), `file_cartoon` (accepts text-free artwork; the server typesets the dialogue in the house style and commits it into today's batch), `get_light_table` (lists a day, stars marked), and `mark_keeper` (stars on the founder's word).

**The founder's ChatGPT Project instructions** (paste once into a Project with this connector enabled):

> You draw cartoons for The Swinging Door, and we are in a training week: I am teaching you my taste. When I ask for cartoons: call get_canon and follow it exactly; fetch get_model_sheet for each character you'll draw and match the sheets; draw 3–5 distinct, text-free candidates; file each with file_cartoon (title, caption, topic). Show them to me here. When I react to one, record my words with record_feedback; star with mark_keeper only when I say so. Never rate for me. When I ask what you've learned, read get_feedback and tell me the patterns. Every couple of days we'll revise the bibles from that data — then your next batches should test the revision, and the love-rate trend tells us if it took. On the last day we run the graduation test: before I rate a fresh batch, you predict my verdict for each cartoon and show me the predictions; four out of five right means the bible is ready to present, and any miss tells us which chapter to fix.

Setup:

1. Add a third environment variable in Vercel: **`MCP_SECRET`** — any long random string (e.g. `openssl rand -hex 24`). Redeploy.
2. The connector URL is `https://<your-domain>/api/mcp?key=<MCP_SECRET>`. Treat the full URL like a password.
3. **ChatGPT**: Settings → Connectors → Advanced → enable Developer mode, then Create connector → paste the URL (no authentication — the key is in the URL).
   **Claude**: Settings → Connectors → Add custom connector → paste the URL.
4. Then, in chat: "I want them fishing today" → it fetches the canon, draws 3–5, files them (they appear on the studio's Today page at the same time), and stars whichever ones he says he likes.

Without `MCP_SECRET` set, the endpoint refuses all requests.

### The daily options contract (for the art-generating agent)

Each day's candidates are pushed to the repo as:

```
/options/2026-08-14/
  option-1.png        ← required; B&W, ≥1200px long side
  option-1.json       ← optional: {"title": "…", "caption": "…", "tags": ["…"]}
  option-2.png
  option-2.json
  option-3.png
  option-3.json
```

Any number of options per day works; the owner can edit the suggested title/caption before publishing. `selected.json` in the same folder is written automatically when an option runs — the agent should never create or touch it. Malformed option JSON never breaks the site; it just arrives with no suggestion attached.
