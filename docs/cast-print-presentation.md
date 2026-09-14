# Cast presentation — September 2026

The public Cast tab is `/gallery/cast`. Drew, Barclay and Abby each have a
three-page dossier at `/gallery/cast/print/<name>`, a PDF and a portrait PNG.
`/gallery/cast/print/all` prints the nine-page complete cast packet. The PDFs use US Letter
pages: a profile and backstory, identifying details, then facial acting studies and continuity notes. The print button waits for images and fonts;
the downloaded PDF is the exact-size alternative to browser print settings.

## Artwork and boundaries

These presentation portraits were generated from the current Best Of cast, using
the preferred Barclay face-and-neck v1 as additional direction. They are not a
replacement for approved acting plates, the fixed set, or any published cartoon.
Historical character bibles remain intact. Their reader-facing introductions and
portraits use the current presentation data; older development notes are labeled.

Source portraits and exact generation prompts are retained in the studio at
`output/fixed-set-v1/cast-print-20260914-v1`. The source is not an old concept photo.
Public images are versioned under `public/gallery/cast-september-2026`; the manifest
records hashes and the grayscale-only delivery conversion. No detail is invented
during conversion. The 1024 × 1536 portraits are placed about 3.56 × 5.34 inches in
the new PDFs (roughly 287 pixels per inch), not upscaled and labeled as 300 dpi.
Original one-page PDFs remain archived at the old asset URLs.

The expanded packet lives under `public/gallery/cast-dossiers-20260914-v1`.
Its nine detail crops use these same presentation portraits. Its nine speaking and
listening crops come directly from the current Best Of trio acting plates, with
source hashes, crop coordinates and mouth/gaze metadata in its manifest. They are
facial acting studies, not newly generated full-body gestures. Historical concept
sheets are not mixed into these pose cards. Latest owner direction takes precedence
where the original bibles describe an older facial expression or prop.

## Rebuild and check

Shared copy: `lib/cast-presentation.json` and `lib/cast-dossiers.json`.

1. `node scripts/prepare-cast-print-assets.mjs <source-directory>` normalizes the
   three generated portraits to strict grayscale, preserving the originals.
2. `node scripts/prepare-cast-dossiers.mjs Z:/ImageGenerator/Cartoon` validates
   current acting sources and extracts the 18 unresampled detail/pose images.
3. `python scripts/build-cast-dossiers.py` creates the individual PDFs and packet
   using ReportLab, pypdf and the Windows Georgia fonts. It checks page counts,
   character names, image counts and text fit, then copies the PDFs to public assets.
4. Render every packet page with Poppler and inspect the layout before publication.
5. `node scripts/check-cast-print.mjs` checks original portrait hashes, dimensions, every
   pixel's grayscale channels, and PDF signatures. Add a base URL to also check all
   five public routes, the invalid-character 404, and byte-identical asset delivery.
6. `node --test scripts/test-print-and-cast.mjs` verifies the new dossier hashes,
   current character/acting matches, crop pixels, PDF page counts and cartoon print metrics.
7. Run TypeScript and the normal Next production build. Commit the public assets,
   presentation source and scripts together. Generated working PDF copies under
   `output/pdf` do not need to be committed a second time.

No database, authentication, automation scheduling or image-generation service
changes are needed to serve this Cast tab.
