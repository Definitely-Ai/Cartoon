# Cartoon print studio

Every current cartoon has a `/gallery/best-of/print/<id>` page linked from its
gallery card. The current collection is the two city editions followed by the
original 38. The full PNG, including its caption, remains unchanged.

| Artwork in inches | Effective PPI from 1024 × 1536 pixels |
| --- | --- |
| 3.4 × 5.1 | 301 |
| 4 × 6 | 256 |
| 5 × 7.5 | 205 |
| 6 × 9 | 171 |

Paper choices are US Letter and A4. The larger sizes are marked as softer review
prints. The screen preview is responsive; print dimensions are physical inches.
Original PNG download remains available. There is no AI upscaling or resampling.

The PDF button checks the source SHA-256, loads pdf-lib on demand, verifies the
embedded PNG dimensions, centers it on the chosen paper and requests no automatic
print scaling. It does not contact an image API or modify the source image.
The browser print button waits for the image and fonts. Choose Actual size / 100%,
portrait orientation and the matching paper; disable browser headers and footers.
Printer DPI is not the same as image PPI. A newspaper should supply its own press
specifications and approve a physical proof before a production run.

`node --test scripts/test-print-and-cast.mjs scripts/test-best-of.mjs scripts/test-city-editions.mjs`
checks all eight size/paper combinations, native embedded pixels, all 40 source
hashes, current cast crop provenance and dossier PDF page counts.
Also exercise size selection and PDF generation in a browser, inspect generated
page boxes and image placement, check mobile overflow and visually review prints.

No database or scheduled-worker change is needed. PDF generation runs in the
reader's browser; the cast PDFs are prebuilt static assets.
