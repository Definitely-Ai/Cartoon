# Setup — local dev and Vercel

## Local development

```bash
cd site
npm install
npm run dev
```

Open http://localhost:3000. That's all — no database, no environment variables, no CMS login.

### What the prebuild does

`npm run dev` and `npm run build` both run `scripts/prebuild.mjs` first (via npm's `predev`/`prebuild` hooks). It copies:

- every `/cartoons/<folder>/cartoon.png` → `site/public/cartoons/<folder>.png`
- every model-sheet image in `/canon/characters/*` → `site/public/canon/<character>/`

Both destinations are gitignored — they're derived from the repo's source folders on every build. The data layer (`site/lib/cartoons.ts`) separately reads and validates every `meta.json` at build time; a bad one fails the build with the folder named (see [PUBLISHING.md](PUBLISHING.md) → Troubleshooting).

### Regenerating placeholder artwork

```bash
cd site
npm run placeholders          # fills in cartoon.png for any folder missing one
node scripts/generate-placeholders.mjs --force   # regenerates all of them
```

## Vercel import, in order

1. Vercel dashboard → **Add New… → Project** → import the `Cartoon` GitHub repo.
2. In the project settings during import, find **Root Directory** and set it to **`site`**.
3. **Directly under it in the same settings section, enable "Include source files outside of the Root Directory in the Build Step."** The build reads `/cartoons` and `/canon` from the repo root at build time; **if this toggle is off, the failure message is confusingly unrelated** (a missing-path error from the prebuild or data layer, naming this toggle).
4. Framework Preset: **Next.js** (auto-detected). Build command and output: leave defaults.
5. No environment variables.
6. Deploy.

Every later `git push` to the production branch rebuilds and redeploys automatically — that is the entire publishing pipeline.

### Manual redeploy

Vercel dashboard → the project → **Deployments** tab → the ⋯ menu on the latest deployment → **Redeploy**. Useful after changing a Vercel setting, since settings only apply to new builds.
