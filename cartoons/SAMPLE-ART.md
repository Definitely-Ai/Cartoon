# Sample artwork record

The dated cartoons are polished sample panels used to exercise the real
publishing, archive, print, social-card, and Back Room flows. They follow the
series canon, but remain subject to the founder's final character and ink
approval. Dialogue is typeset into each finished PNG; titles, dates, edition
numbers, proof labels, and catalog lines remain site-native.

## Art system

- Single-frame black ink with restrained gray wash on clean warm-white paper.
- Confident varied line, economical interior detail, and readable silhouettes.
- Drew keeps his bowtie and three-olive martini; Mango keeps his jacket, lapel
  pin, and old fashioned; Abby remains behind the bar and appears sparingly.
- Each panel ends with a warm-white dialogue field using the exact caption from
  its JSON metadata. No title, date, catalog line, proof label, watermark, or UI
  texture is baked in. The public paper and Back Room supply their framing.
- The retired clip-art and blank-proof file hashes are blocked by the prebuild.
- Square art without embedded dialogue is also blocked by the prebuild.

## Current editions

| Edition | Folder | Status |
| ---: | --- | --- |
| 1 | `2026-07-24-diversification` | Illustrated sample |
| 2 | `2026-07-28-the-fee-structure` | Illustrated sample |
| 3 | `2026-08-01-the-long-term` | Illustrated sample |
| 4 | `2026-08-04-an-emerging-asset` | Illustrated sample |
| 5 | `2026-08-08-the-forecast` | Illustrated sample |
| 6 | `2026-08-11-the-retirement-number` | Illustrated sample |
| 7 | `2026-08-12-index-funds` | Illustrated sample |

The selected `options/2026-08-11/option-2.png` and
`options/2026-08-12/option-2.png` remain byte-identical to editions 6 and 7,
respectively, matching the Back Room's publish-by-blob behavior.
