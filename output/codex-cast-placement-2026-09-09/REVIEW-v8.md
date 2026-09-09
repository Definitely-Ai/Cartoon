# Background restoration — v8

The owner liked the latest character direction but identified blurred bottles and wall detail, plus the window sign being blocked by Drew's head.

## Current review pair

- `duo-sharp-background-v8.png` — without Abby, 1024 x 1536.
- `trio-sharp-background-v8.png` — with Abby, 1024 x 1536.

Both images were generated using Codex's built-in image generator in reference-image edit mode, without a fallback renderer. Both saved files were visually inspected. Bottle contours, highlights, paneling and window architecture are more clearly resolved. The complete mirrored three-line window sign is now placed above Drew's head with clear separation. The occupied chair orientation, character poses and distinct fur/feather hand treatment are visually retained.

This is generated restoration, not a pixel-locked composite; small linework differences remain between versions. The two signs are not positioned at exactly identical pixels. These are review assets, not an owner-approved canonical replacement or a live website release. Existing canon and Claude's active implementation files were not changed.

## Exact prompts and reference order

### Duo

Exact prompt: `prompt-duo-v8-background.txt`.

1. `duo-seated-v6.png` — foreground and composition edit target.
2. `../../canon/room-kit/v2/plate-signed.png` — sharp background reference only.

Output: `duo-sharp-background-v8.png`.

### Trio

Exact prompt: `prompt-trio-v8-background.txt`.

1. `trio-seated-v7.png` — three-character composition, including Abby in the service aisle.
2. `duo-sharp-background-v8.png` — restored background and raised sign reference only.

Output: `trio-sharp-background-v8.png`.

The actual delivered resolution is 1024 x 1536 for both images, regardless of the higher resolution requested in the duo prompt. Prior candidates and their prompt history remain available in this directory.
