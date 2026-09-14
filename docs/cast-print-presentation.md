# Cast presentation — September 2026

The public Cast tab is `/gallery/cast`. Drew, Barclay and Abby each have a
single-page print view at `/gallery/cast/print/<name>`, a PDF and a portrait PNG.
`/gallery/cast/print/all` prints the three character sheets. The PDFs use US Letter
pages with one character per page. The print button waits for images and fonts;
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
during conversion. The 1024 × 1536 portraits are placed about 4.06 × 6.08 inches in
the PDFs (roughly 252 pixels per inch), not upscaled and labeled as 300 dpi.

## Rebuild and check

Shared copy: `lib/cast-presentation.json`.

1. `node scripts/prepare-cast-print-assets.mjs <source-directory>` normalizes the
   three generated portraits to strict grayscale, preserving the originals.
2. `python scripts/build-cast-print-pdfs.py` creates the individual PDFs and packet
   using ReportLab, pypdf and the Windows Georgia fonts. It checks page counts,
   character names, image counts and text fit, then copies the PDFs to public assets.
3. Render every packet page with Poppler and inspect the layout before publication.
4. `node scripts/check-cast-print.mjs` checks portrait hashes, dimensions, every
   pixel's grayscale channels, and PDF signatures. Add a base URL to also check all
   five public routes, the invalid-character 404, and byte-identical asset delivery.
5. Run TypeScript and the normal Next production build. Commit the public assets,
   presentation source and scripts together. Generated working PDF copies under
   `output/pdf` do not need to be committed a second time.

No database, authentication, automation scheduling or image-generation service
changes are needed to serve this Cast tab.
