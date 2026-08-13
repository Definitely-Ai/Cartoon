# Placeholder artwork inventory

Every `cartoon.png` currently in the dated folders is **placeholder art**, not approved or publishable final artwork. The files carry a discreet label inside the image so they cannot be mistaken for commissioned cartoons.

The current studies follow the visual direction in the canon: strictly monochrome editorial linework, textured gray ink wash, an established Wall Street barroom, and dry American business-magazine restraint. Their captions are intentionally absent from the image because the website typesets captions below the panel from `meta.json`.

## Organization

- Each mock image stays beside the `meta.json` it illustrates.
- The filename remains `cartoon.png` so every website design can exercise the real publishing path.
- `site/scripts/generate-placeholders.mjs` is the single source for regenerating the set.
- Run `cd site && npm run placeholders -- --force` to refresh every placeholder after metadata changes.

## Replacement checklist

When final art arrives, replace the relevant `cartoon.png` in place, confirm its caption against `meta.json`, and remove that edition from the inventory below.

| Edition | Folder | Status |
| ---: | --- | --- |
| 1 | `2026-07-24-diversification` | Placeholder art |
| 2 | `2026-07-28-the-fee-structure` | Placeholder art |
| 3 | `2026-08-01-the-long-term` | Placeholder art |
| 4 | `2026-08-04-an-emerging-asset` | Placeholder art |
| 5 | `2026-08-08-the-forecast` | Placeholder art |
| 6 | `2026-08-11-the-retirement-number` | Placeholder art |
