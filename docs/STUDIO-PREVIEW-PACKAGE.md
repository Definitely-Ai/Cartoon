# Private studio preview package

Prepare the integrated source tree and its serving snapshots first. Run the
packager from the source checkout, with an absolute integration tree and a new
destination whose parent already exists:

```powershell
node scripts/prepare-studio-preview.mjs --source Z:/ImageGenerator/Cartoon-studio-overhaul-20260903 --out Z:/ImageGenerator/Cartoon-studio-preview-20260903 --dry-run
node scripts/prepare-studio-preview.mjs --source Z:/ImageGenerator/Cartoon-studio-overhaul-20260903 --out Z:/ImageGenerator/Cartoon-studio-preview-20260903
```

The first command reads file metadata and reports the proposed size without
creating anything. The second creates a source package; neither command deploys,
installs dependencies, changes Git, or edits the integration tree. Existing
destinations and existing sibling inventories are refused. A failed copy remains
available for inspection; use another new destination after fixing its cause.

The package includes app/library source, required configuration and build code,
canon text and JSON, character/vision/showcase images, published cartoons, and
brief `plan.json` files. It retains all serving assets under `public/studio-library`,
`models`, `vision`, `canon`, `cartoons`, `showcase`, `studio-room`, and `studio-print`.
Only the union of image URLs in the two gallery manifests, plus the newspaper's
A01 preview, is copied from `public/gallery`. Both gallery manifests retain their
exact reviewed bytes. Original archives, raw brief art, canon plate/work images,
environment files, Git metadata, dependencies, build output, tests, and screenshots
are omitted. Selected symlinks and path traversal are rejected. The complete
package must stay below 1,000,000,000 bytes before any output is created.

`<out>.inventory.json` is a private sibling file outside the package. It lists
every packaged path, byte size, and SHA-256 hash, with source and packaging time.
It is not placed in `public` or uploaded with the package. The package also gets a
`.vercelignore` excluding local environment/test/build files if they are added later.

The generated `vercel.json` preserves existing settings, makes deployment source
and logs private, and sets `buildCommand` to `node scripts/build-studio-snapshot.mjs`.
This wrapper runs the existing `npm run build` with `STUDIO_ASSET_MODE=snapshot`
on Windows and Linux. Prebuild hooks validate and retain the serving assets and
dated reports; they do not rescan the reduced source tree or rebuild the gallery.
Install dependencies with `npm ci` inside the new package before a local build.
Deployment authentication and environment configuration remain separate from this
packaging operation. See Vercel's [build configuration](https://vercel.com/docs/project-configuration)
and [ignore-file documentation](https://vercel.com/docs/deployments/vercel-ignore).

The legacy Registry currently counts brief PNGs on disk. Plans alone do not
preserve those counts in this reduced package; the full studio image library and
daily report retain their snapshots independently.

Verify packaging safety without copying the live tree:

```powershell
node --test scripts/test-prepare-studio-preview.mjs
```
