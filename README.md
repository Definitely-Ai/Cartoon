# The Swinging Door studio

Rick’s workspace for The Swinging Door: artwork, daily progress, scene construction, review notes, and a newspaper placement proof. The cartoon is a black-and-white financial satire with Drew, Barclay and Abby.

## Current direction

Image generation is **local on the RTX 4090**, through AuraVision and ComfyUI. Hosted image models and Replicate are rejected; there is no paid fallback. The website and GitHub history are separate from the local drawing machine.

The room is being rebuilt from **wall + window + bar only**. Its construction and perspective must be sound before adding each shelf, the television, chalkboard, street view, props or cast. Existing finished plates are preserved as history. The modern New York street scene will eventually include a hotdog stand and indistinct people. Nothing in this migration makes a candidate an approved base.

The art/website contract is [docs/OVERHAUL.md](docs/OVERHAUL.md). Claude owns the art pipeline and canon; ChatGPT owns the studio app. Coordination happens in [docs/AGENTS-HANDOFF.md](docs/AGENTS-HANDOFF.md).

## Find the work

| Address | Purpose |
| --- | --- |
| `/` | Rick’s studio home and current priorities |
| `/library` | Every available image in the indexed sources, with cast, category, source, date and search filters; duplicate copies grouped; large previews and downloads |
| `/reports` | Daily GitHub updates in Eastern time, plain-English groups, exact historical image previews and a separately dated local worktable |
| `/room` | Base brief, construction checks, recorded parts, candidate comparisons and drawing history |
| `/newspaper` | Responsive editorial proof, two/three-column placement and downloadable 11 x 17 PDF |
| `/topics` | Dated Google Trends evidence for the Ft. Myers-Naples metro, primary local context, and explicit Analytics status |
| `/notes` | Private shared notes, with optional image links and cast/topic labels |
| `/review`, `/models` | Existing batch review and character-reference tools |
| `/collection`, `/keepers` | Database-backed daily batches and selected work; empty when no records exist |
| `/gallery` | Earlier curated public gallery, retained separately from the complete private library |

The new workspace and library are login-gated. The pre-existing `/gallery` and `/api/gallery` exceptions remain public; the GitHub repository is also public. Do not describe all source material as private or save confidential notes to public GitHub files.

## Local work

The app is in `Z:\ImageGenerator\Cartoon`, not the outer generator directory. Install with `npm ci`; run `npm run dev`. Configure local secrets in ignored `.env.local` or `.env.development.local`, using [docs/SETUP.md](docs/SETUP.md) for the existing login/database settings. A redacted environment value from a connector is not a working credential.

AuraVision runs separately at `http://127.0.0.1:8000`; ComfyUI runs at `http://127.0.0.1:8188`. `AURAVISION_URL` controls the bridge. A deployed Vercel app cannot reach this computer merely because those services work locally. Until a transport and local approval consumer are in place, remote art approvals stay disabled.

```sh
npm run library:refresh
npm run reports:refresh
npm run typecheck
npm run test:studio
node scripts/check-local-image-policy.mjs
npm run build
```

`predev` and `prebuild` refresh both library and report snapshots locally. A selective deployment must use `STUDIO_ASSET_MODE=snapshot`, which validates and preserves the reviewed archive without scanning an incomplete source tree. See [the private package workflow](docs/STUDIO-PREVIEW-PACKAGE.md). The sources and timestamp are visible in the library. It is an inventory of accessible files, not a promise to recover deleted generations or unknown folders.

## Artwork and data

- `canon/characters/`, `canon/vision/`: character identities and artistic references. Current authority and source rules belong to Claude's canon documents.
- `canon/room-kit/`: versioned architectural rebuild studies; approval status must be explicit.
- `canon/plates/`: older plate base, parts manifest, retained candidates and deterministic assembly inputs.
- `briefs/`, `options/`, `cartoons/`: historical briefs, working batches and published-format files.
- `lib/studio-library-manifest.json`: content hashes, provenance, cast metadata and indexed coverage.
- `public/studio-library/`: bounded-size viewing copies and thumbnails. Original source files stay untouched. Local exact-original downloads validate the hash.
- `lib/studio-reports-snapshot.json`: build-time GitHub/local work snapshot; runtime reports check GitHub again and label any fallback.
- `output/pdf/newspaper-editorial-proof.pdf`: editorial placement proof. It is not a published edition or a press-approved master.
- Supabase: existing live batch/feedback storage, separate from GitHub. The September 3 read-only audit found zero cartoon, batch, feedback or storage-object records.

## Research and production limits

Google Trends evidence is a dated **metro** snapshot, not a live Naples-city ranking. Google Analytics did not expose a verified Cartoon property during the audit. Other businesses' metrics are not imported. Daily autonomous topic selection and cartoon creation are future work, not an active automation.

The complete archive adds substantial static media. Do not bundle it into a serverless function or publish this mixed working tree wholesale. Use the tested deployment package and explicit art-source reconciliation; current asset sizes and source coverage are in the library and [docs/STUDIO-REPORTS.md](docs/STUDIO-REPORTS.md).

The newspaper proof uses an existing 900 x 1,125 pixel archive panel to judge placement. Confirm the target paper's column dimensions, final image resolution and grayscale requirements before delivering production artwork. Rebuild the PDF with `scripts/build-newspaper-proof.py` and the documented ReportLab runtime.
