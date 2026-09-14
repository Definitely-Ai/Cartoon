# Selected cartoon collection

The owner requested publication of the reviewed 38-cartoon Best Of edition on September 14, 2026.

## Public surface

- `/gallery/best-of`: the new reader-facing collection, with speaker/cast filters and search.
- `/gallery/best-of-v1/originals/*.png`: 38 exact selected 1024 × 1536 grayscale artworks with embedded captions.
- `/gallery/best-of-v1/previews/*.webp`: build-generated 640-pixel previews.
- `/gallery/best-of-v1/swinging-door-best-of-38-pngs.zip`: build-generated archive containing the exact originals.
- `/gallery` and `/api/gallery`: 66 entries, comprising 38 selected cartoons and all 28 legacy records (56 finals, 10 masters).

The new manifest contains only reader-facing metadata and original-image integrity hashes. Private prompts, editorial scores, unpublished candidates, review notes and local workstation paths are excluded. Dialogue and depicted broadcasts are fictional, not current financial reporting or financial advice.

## Preservation

The approved cast and setting are unchanged. All original image hashes are recorded in `lib/best-of-cartoons.json` and checked before builds. The prebuild verifies strict grayscale and dimensions, then creates previews and ZIP without modifying originals. The paired legacy manifests and images remain unchanged; the obsolete workstation-specific legacy manifest generator no longer runs automatically.

Studio authentication and middleware are unchanged. The collection uses the existing public gallery exception. The image library, room, reports, newspaper proof, private serving assets and image-optimization endpoint remain protected. Neither the entire local working archive nor unfinished studio changes are included in this release.

Production before this release was a Git build of c839234 with a source-derived 2,973-image library. This release adds selected assets to the same source baseline. That deployed inventory is distinct from the larger local working inventory; older private snapshot packages must not replace it.

## Verification

```powershell
node scripts/prepare-best-of.mjs
node --test scripts/test-best-of.mjs scripts/test-prepare-studio-preview.mjs
npx next build
node scripts/verify-best-of-live.mjs https://cartoon-brown-seven.vercel.app
```

The live check verifies all 38 originals, 38 previews, 28 legacy assets and ZIP against local hashes; checks the merged catalog; and confirms anonymous access to nine private routes still redirects to login. Browser checks cover search, speaker/cast filters, empty states, mobile overflow, download contrast and page errors. The collection keeps native full-size links for browser zoom and keyboard access.

Future selective private packages also include this edition when its manifest exists. Historical packages without the edition remain supported.
