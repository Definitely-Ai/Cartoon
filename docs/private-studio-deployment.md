# Private studio deployment package

Keep private working artwork out of the public Git repository. Use an isolated deployment directory, built from the intended source revision with reviewed local changes copied in. Never prune, resize, or rewrite images in the working studio to make a deployment smaller.

## Preserve the saved image library

Copy these together, without editing their contents:

- `lib/studio-library-manifest.json`
- every viewing image and thumbnail in `public/studio-library/`
- the application code and `scripts/lib/validate-studio-library-snapshot.mjs`

Set `STUDIO_ASSET_MODE=snapshot` in the deployment build environment. Then `node scripts/build-studio-library.mjs` checks every required viewing asset, size, dimensions, ID, and URL. It exits with an error if anything is missing or malformed. It does not scan source folders, change the inventory timestamp, rewrite the manifest, or remove images. This is the required mode for a selective package that deliberately excludes raw project images.

The normal `inventory` mode remains for the full local studio. It scans the current checkout and known external sources. It preserves earlier external imports if their drive is unavailable, but deliberately does not preserve files omitted from an available current-project source. Therefore, running inventory mode in a reduced deployment package would incorrectly shrink the library.

Run `node --test scripts/test-studio-library-snapshot.mjs` to check snapshot validation behavior. For a release, run snapshot validation against the actual complete package as well.

The local inventory also builds Drew, Barclay, and Abby groups from explicit image metadata. Each image's `characterEvidence` records source-relative evidence: named files and canonical folders, matching panel plans, gag cast lists, training captions, exact generation history records, and embedded PNG positive prompts. Negative workflow prompts and unspecified `duo`/`trio` names do not establish identity. Gag membership associates working crops and variants with that cast; it does not claim every character is visible in every crop. Raw prompt text and workstation paths are not included. Run `node --test scripts/test-studio-library-cast.mjs` to verify these boundaries.

## Selected gallery: preserve exact images

`docs/deployment-gallery-assets.json` records the 28 selected-gallery URLs from the newer `origin/main` worktree, with their exact SHA-256 hashes, bytes, and dimensions. Together the images use about 17.90 MiB. Their bytes match the corresponding local studio files; the newer manifest contains different editorial metadata, so keep the newer `lib/gallery-manifest.json` and `public/gallery/manifest.json` together.

Copy the listed `publicPath` entries and those two manifests. Do not run `scripts/build-gallery-manifest.mjs` inside the package: it would replace the newer curated metadata. The legacy `public/gallery/inspect/` and `public/gallery/knockout/` directories are not referenced by the selected gallery and need not be duplicated in the hosted public directory. Their images remain available through the saved private library.

The newspaper page uses `/gallery/final/A01-preview.jpg`, already on that list. It shows Drew and Barclay only. B03 was removed from the newspaper after the owner rejected its Abby rendering. No lossy rewrite of the selected-gallery images is necessary.

## Other files the website reads

Include all `app/`, `lib/`, root Next/TypeScript/package configuration, and the frozen report snapshot. Include the following serving assets:

- `public/studio-library/` — complete inventory viewing copies and thumbnails.
- `public/studio-room/` — the homepage and room comparisons.
- `public/studio-print/` — the newspaper PDF.
- `public/og.png` and the selected-gallery images listed above.
- Character portraits and reference plates under `public/vision/`, character sheets under `public/canon/`, and any current `public/showcase/`, `public/cartoons/`, and `public/models/` output created by the asset-copy prebuild.

Retain canonical Markdown/JSON and character metadata used by the Cast and Studio Bible: `canon/**/*.md`, `canon/**/*.json`, `canon/characters/**`, `canon/vision/**`, `canon/plates/parts.json`, `briefs/**/plan.json`, and relevant brief text records. `cartoons/**/meta.json` supplies the historical cartoon metadata. Keep `docs/`, `feedback/`, and scripts as text when the Studio Bible lists them. Canon image copies can be reduced after build only when the traced runtime file requirements and all served paths have been checked.

The current room page reads its part/source metadata from `canon/plates/parts.json` and gets pictures from the library snapshot. The exact-original download API intentionally reports unavailable when the source original is absent from the hosted server; its viewing copy remains available. It must not be used to force the entire source archive into every function bundle.

If using a source deployment, either copy the already prepared `public/` outputs and build with `next build`, or use a package-specific asset-copy step that excludes the legacy gallery-manifest rewrite and leaves both report and library snapshots frozen. Do not run the unchanged all-in-one prebuild against a reduced package.

## Vercel constraints and privacy checks

Vercel documents CLI source upload limits of 100 MB for Hobby and 1 GB for Pro, and 15,000 source files. `vercel deploy --prebuilt` uploads `.vercel/output` produced by `vercel build`; it avoids sending the working source archive but should not be treated as an unlimited-size escape hatch. `--archive=tgz` reduces file-count overhead, not the underlying artwork footprint. Review the actual package size, team plan, and traced function sizes before deployment.

Keep `/studio-library/`, `/studio-print/`, exact-original endpoints, and `/_next/image` behind the studio login. Verify anonymous requests redirect before viewing any private asset and authenticated assets send `Cache-Control: private, no-store`. Never deploy using `--public`. Do not copy `.env*`, local test credentials, `.git/`, `node_modules/`, `.next/`, or raw workstation output directories into a source upload. Use the existing deployment's protected environment configuration.

Sources: [Vercel limits](https://vercel.com/docs/limits), [Vercel deploy and prebuilt](https://vercel.com/docs/cli/deploy), [Vercel Function limitations](https://vercel.com/docs/functions/limitations).
