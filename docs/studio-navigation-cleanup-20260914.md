# Production navigation cleanup — September 14, 2026

## User-facing workflow

Four primary destinations: Cartoons, Generate, Cast, Presentation.
The authenticated root opens the current cartoon collection rather than the
outdated dashboard. Generate includes its existing advanced plans and schedules;
Cast retains individual character dossiers and working bibles; Presentation
retains slides, PDF/PPTX downloads, sizes, and newspaper previews.

The former header/footer exposed 18 destinations. Drawing room, Sticker desk,
Newspaper, Naples topics, Shared notes, Review cartoons, Daily batches, Keepers,
Selected prints, Studio bible, and Connect your AI no longer appear in the
global navigation. The standalone dashboard is replaced by a reversible redirect.
These older routes and their assets remain intact for saved links and recovery.
No assumption about historical page analytics is needed for this navigation edit.

Image archive and Progress reports remain in a collapsed footer resource list.
The collection introduces itself briefly, offers generation and presentation,
and keeps search visible. Speaker/cast filters are optional, with an active count.
Every cartoon retains its print-size options and PNG download. The original
38-cartoon ZIP remains a secondary download; the current collection contains 40.

## Verification

- TypeScript check.
- `scripts/verify-simple-studio-browser.mjs`: four routes at 320, 390, 768 and
  1440 pixels; active and nested tabs; 44px touch targets; no overlapping tab hit
  areas; keyboard navigation; filter/search reset; all 40 print/download links;
  footer resources; hidden header/footer in print; local authenticated root redirect.
- Existing presentation browser checks: four physical sizes/PPI, Letter and
  newspaper PDFs, slideshow, downloads and mobile layout.
- Existing local-only generation fixture: stable request ID, waiting progress,
  reload recovery, image display, PDF download and mobile layout.

No art, job, schedule, worker, authentication policy or database changes.
