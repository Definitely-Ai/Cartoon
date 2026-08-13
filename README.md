# Flamingo & Dog <!-- BRAND: replace when final -->

Single-panel business cartoons, strictly black and white, starring a flamingo and a dog. This repo is the company's entire digital home: the canon that keeps the characters consistent, the cartoons themselves, and the website that publishes them. There is no CMS — **the filesystem is the CMS**. Add a folder under `/cartoons`, push, and the site rebuilds itself.

## Folder map

| Folder | What it is |
| --- | --- |
| `/canon/` | The source of truth for how the strip looks, sounds, and jokes — character descriptions, style bible, personalities, comedy bible. Templates today; written with the founder next. |
| `/cartoons/` | One folder per published cartoon (`YYYY-MM-DD-slug/` with `cartoon.png` + `meta.json`). `_TEMPLATE/` is the starting point for new ones and never ships. |
| `/site/` | The Next.js website. Static generation only; it reads `/cartoons` and `/canon` at build time. |
| `/docs/` | [How to publish a cartoon](docs/PUBLISHING.md) and [how to set up local dev + Vercel](docs/SETUP.md). |

## Current status

_(filled in at the end of the build — see the final section of this file)_
