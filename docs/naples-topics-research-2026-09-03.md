# Naples story research — September 3, 2026

## What was actually checked

At 18:48:51 UTC (2:48 p.m. Eastern), Google Trends Explore was inspected in a browser. Florida was selected with five search terms: `mortgage rates`, `home insurance`, `property tax`, `retirement`, `stock market`. Settings: Web Search, All categories, Past 90 days. The visible Florida metro breakdown contained **Ft. Myers-Naples FL**. Clicking it produced the verified geography code **US-FL-571**; it was not guessed from a DMA list.

Source URL:
<https://trends.google.com/trends/explore?date=today%203-m&geo=US-FL-571&q=mortgage%20rates,home%20insurance,property%20tax,retirement,stock%20market>

The displayed time series ran June 3–September 3, 2026. September 3 may be partial. This is a manually observed snapshot, not an automatic import. Reopening the rolling URL later can show different data.

## Observed rising related queries

| Seed term | Related query shown | Google label |
| --- | --- | --- |
| mortgage rates | today's interest rates 30 year mortgage | Breakout |
| mortgage rates | what are the current mortgage rates | Breakout |
| mortgage rates | wells fargo mortgage rates | Breakout |
| mortgage rates | september 2 2026 mortgage rates | +3,700% |
| mortgage rates | 30 year mortgage rates today | +50% |
| home insurance | home insurance fort myers fl | Breakout |
| home insurance | progressive home insurance florida | Breakout |
| home insurance | home internet | +130% |
| home insurance | ovation home insurance exchange | +110% |
| home insurance | home insurance quotes florida | +50% |
| property tax | florida property tax amendment | Breakout |
| property tax | lee county property tax records | +4,550% |
| property tax | desantis property tax | +120% |
| property tax | charlotte county property tax | +80% |
| property tax | property tax exemption florida | +80% |

The combined city breakdown reported insufficient data. Most individual city breakdowns did too. No Naples-city ranking or search-volume count was established. These terms were chosen by the researcher; the comparison does not establish the region's top five financial topics.

The average comparative index row was 4, 5, 14, 39, 31 in seed order, but it is deliberately not used to rank financial story quality. `retirement` returned celebrity/sports/military retirement queries; `stock market` returned unrelated lifestyle queries. These relevance failures were retained as an explicit reason to require editorial review. `home internet` was likewise excluded from the insurance shortlist. No statistics were silently corrected or treated as audience demand.

Google explains that [Trends is sampled and normalized](https://support.google.com/trends/answer/4365533?hl=en), and that [rising queries compare growth with the previous period; Breakout means above 5,000%](https://support.google.com/trends/answer/4355000?hl=en). A small base can produce large growth. No inference about survey opinion, citywide demand, website engagement, or causation is supported.

## Primary local sources

- [Collier County Property Appraiser: TRIM guide](https://www.collierappraiser.com/trim/understandtrim.html): explains market, assessed and taxable values, proposed taxes and budget hearings. The page supports a fictional notice-reading premise, not any particular owner's bill or legal deadline.
- [NABOR homepage market overview](https://www.nabor.com/): explicitly labeled **July 2026**, showing 4,415 inventory, 916 new listings, 762 pending sales, 733 closed sales, $590,000 median closed price, and 108 days on market when checked. Only the median and days on market are used in the topic card. This is a Naples-area housing backdrop, not a current mortgage-rate source or prediction.
- [Florida OIR filing search](https://irfssearch.floir.gov/): public policy-form/rate filings with company and date search. No insurer rate filing was inspected in this pass; do not claim any specific premium increase/decrease.

Each story premise and caption in `lib/studio-topics.ts` is original draft editorial material. None is an approved cartoon, a published newspaper item, or a measured best-performing topic.

## Google Analytics access boundary

The checked `app`, `lib`, `docs`, README and relevant config contained no GA4/gtag/Google Trends integration. There were no local `.env*` files in this checkout, and no Google Analytics connector tool was available. No environment values or credentials were read or copied.

Signed-in Chrome Analytics was then inspected read-only. The Ai Dream Builders LLC account picker showed the Ai Dream Builders LLC and Livestock.tech properties. Searching the universal picker for `Cartoon` displayed: “There are no search results for Analytics.” No relevant Cartoon property was verified. The initially loaded Livestock home dashboard was incidental; none of its metrics was copied into the Cartoon project or used as audience evidence. No account settings were changed and no GA4 report was connected to the page.

The app therefore says **No report connected** and displays no invented metrics. The next step is to identify the intended public website and GA4 property, then obtain an authorized report filtered by Country=United States, Region=Florida, City=Naples. Use complete date windows, preserve timezone/threshold metadata, and keep unknown locations, internal studio activity, and other properties separate.

Technical references: [GA4 API city/region/country dimensions](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema) and [data thresholds](https://support.google.com/analytics/answer/9383630?hl=en).

## Implementation and refresh

- `/topics`: private research desk with three evidence-backed local editorial leads, draft premises, dated source cards, explicit metro/city distinction, and GA4 missing-data state.
- `/topics/evidence`: authenticated, uncached JSON representation of the saved snapshot and leads.
- `lib/studio-topics.ts`: reviewed record; no external API is called during page rendering.
- Updating the record requires a new observed research snapshot. The UI intentionally does not label old data as live.
- No automatic cartoon generation or publishing was enabled. A future system should save source snapshots, perform relevance checks, combine separately reported audience evidence, and request an editorial choice before drawing/publishing.
