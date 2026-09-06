#!/usr/bin/env python3
"""Build the web-safe subset of canon/room-kit/v2 for the site.

The room-kit v2 tree (history/, stickers/, tall/, values/, masks/, shadows/,
work/) is the full local studio record: every version of every object,
full-resolution renders, masks. That is well over a gigabyte and none of it
should ship. The site only needs to let the founder and Rick LOOK, ARRANGE,
CHOOSE: a light base image, one small PNG/WebP per sticker (positioned by the
manifest), a thumbnail history per part so a version dropdown can show
what's on offer, and a thumbnail record of each day's report.

This script (PIL only, no paid APIs) reads:
  canon/room-kit/v2/stickers/base.png + manifest.json
  canon/room-kit/v2/plate-signed.png
  canon/room-kit/v2/stickers/<part>.png
  canon/room-kit/v2/history/<part>/INDEX.md + vNNN-*-in-context.png
  reports/<date>/REPORT.md + images/

and writes only small, web-ready files under:
  canon/room-kit/v2/web/

Re-run any time the local studio produces new versions or a new report;
it always rebuilds the whole web/ tree from scratch.
"""
from __future__ import annotations

import datetime
import json
import re
import shutil
import sys
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[1]
KIT = REPO / "canon" / "room-kit" / "v2"
WEB = KIT / "web"

STICKER_MAX_BYTES = 400 * 1024
JPEG_QUALITY = 82
HISTORY_THUMB_WIDTH = 420
REPORT_THUMB_WIDTH = 360

BASE_SIZE = (1200, 1800)  # plate size, per manifest.json


def log(msg: str) -> None:
    print(f"[build-desk-web-assets] {msg}")


def rmtree_fresh(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# base.jpg / plate-signed.jpg
# ---------------------------------------------------------------------------

def build_room_jpegs() -> None:
    base_src = KIT / "stickers" / "base.png"
    plate_signed_src = KIT / "plate-signed.png"

    im = Image.open(base_src).convert("RGB")
    if im.size != BASE_SIZE:
        log(f"WARNING base.png is {im.size}, expected {BASE_SIZE}")
    im.save(WEB / "base.jpg", "JPEG", quality=JPEG_QUALITY, optimize=True)
    log(f"base.jpg  {(WEB / 'base.jpg').stat().st_size / 1024:.0f} KB")

    im2 = Image.open(plate_signed_src).convert("RGB")
    im2.save(WEB / "plate-signed.jpg", "JPEG", quality=JPEG_QUALITY, optimize=True)
    log(f"plate-signed.jpg  {(WEB / 'plate-signed.jpg').stat().st_size / 1024:.0f} KB")


# ---------------------------------------------------------------------------
# stickers/<part>.png (or .webp fallback) + copied manifest.json
# ---------------------------------------------------------------------------

def optimize_sticker(src: Path, dest_dir: Path) -> tuple[str, int]:
    """Re-encode one RGBA sticker as small as we reasonably can.

    Tries an 8-bit palette-with-alpha PNG at shrinking palette sizes; if that
    still can't get under STICKER_MAX_BYTES, falls back to a lossy WebP with
    alpha (which handles feathered edges far better than a palette can).
    Returns (filename, size_bytes) of whatever was written into dest_dir.
    """
    stem = src.stem
    im = Image.open(src)
    if im.mode != "RGBA":
        im = im.convert("RGBA")

    best_name = None
    best_bytes = None

    for colors in (256, 192, 128):
        quant = im.quantize(colors=colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
        out = dest_dir / f"{stem}.png"
        quant.save(out, "PNG", optimize=True)
        size = out.stat().st_size
        if best_bytes is None or size < best_bytes:
            best_name, best_bytes = out.name, size
        if size <= STICKER_MAX_BYTES:
            return out.name, size

    # Palette quantization couldn't get small enough (typically a large,
    # busy sticker with soft feathered edges) - fall back to WebP with a
    # real alpha channel instead of banding it into a palette.
    png_path = dest_dir / f"{stem}.png"
    if png_path.exists():
        png_path.unlink()
    for quality in (80, 65, 50):
        out = dest_dir / f"{stem}.webp"
        im.save(out, "WEBP", quality=quality, method=6)
        size = out.stat().st_size
        if size <= STICKER_MAX_BYTES or quality == 50:
            log(f"  {stem}: palette PNG too big, using WebP q{quality} ({size / 1024:.0f} KB)")
            return out.name, size
    raise AssertionError("unreachable")


def build_stickers() -> dict:
    src_manifest_path = KIT / "stickers" / "manifest.json"
    manifest = json.loads(src_manifest_path.read_text(encoding="utf-8"))

    stickers_dir = WEB / "stickers"
    stickers_dir.mkdir(parents=True, exist_ok=True)

    oversized = []
    for entry in manifest["stickers"]:
        part = entry["part"]
        src = KIT / "stickers" / entry["file"]
        if not src.exists():
            log(f"WARNING sticker source missing for {part}: {src}")
            continue
        filename, size = optimize_sticker(src, stickers_dir)
        entry["file"] = filename  # may now be .webp instead of .png
        entry["webBytes"] = size
        if size > STICKER_MAX_BYTES:
            oversized.append((part, size))

    manifest["_doc"] = (
        manifest.get("_doc", "")
        + " WEB COPY: re-encoded by scripts/build-desk-web-assets.py for the site - x,y,w,h are"
        " still full 1200x1800 plate coordinates; 'file' points at the web-optimized asset in this"
        " same folder (.webp where a palette PNG couldn't hit the 400KB target)."
    )
    manifest["base"] = "../base.jpg"
    (stickers_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    total = sum(f.stat().st_size for f in stickers_dir.glob("*") if f.name != "manifest.json")
    log(f"stickers/ {len(manifest['stickers'])} sticker(s), {total / 1024:.0f} KB total")
    if oversized:
        for part, size in oversized:
            log(f"  NOTE: {part} still {size / 1024:.0f} KB after WebP q50 fallback (over 400KB target)")
    return manifest


# ---------------------------------------------------------------------------
# history/<part>/index.json + thumbs/vNNN.jpg
# ---------------------------------------------------------------------------

ROW_RE = re.compile(r"^\|(.+)\|\s*$")


def parse_index_md(index_md: Path) -> list[dict]:
    lines = index_md.read_text(encoding="utf-8").splitlines()
    rows = []
    header_seen = False
    for line in lines:
        m = ROW_RE.match(line.strip())
        if not m:
            continue
        cells = [c.strip() for c in m.group(1).split("|")]
        if not header_seen:
            # first pipe-row is the header ("| version | date | ... |")
            header_seen = True
            continue
        if all(re.fullmatch(r"-+", c or "-") for c in cells):
            continue  # separator row
        if len(cells) < 6:
            continue
        version, date, label, note, verdict, source_path = cells[:6]
        rows.append(
            {
                "version": version,
                "date": date,
                "label": label,
                "note": note,
                "verdict": verdict,
                "sourcePath": source_path,
            }
        )
    return rows


def build_history() -> None:
    history_src = KIT / "history"
    if not history_src.exists():
        log("no history/ directory found - skipping")
        return

    parts = sorted(
        p.name for p in history_src.iterdir() if p.is_dir() and (p / "INDEX.md").exists()
    )
    total = 0
    for part in parts:
        part_dir = history_src / part
        rows = parse_index_md(part_dir / "INDEX.md")

        dest_dir = WEB / "history" / part
        thumbs_dir = dest_dir / "thumbs"
        thumbs_dir.mkdir(parents=True, exist_ok=True)

        entries = []
        for row in rows:
            version = row["version"]
            matches = sorted(part_dir.glob(f"{version}-*-in-context.png"))
            thumb_rel = None
            if matches:
                src_img = matches[0]
                im = Image.open(src_img).convert("RGB")
                w, h = im.size
                new_w = HISTORY_THUMB_WIDTH
                new_h = max(1, round(h * (new_w / w)))
                im = im.resize((new_w, new_h), Image.LANCZOS)
                out = thumbs_dir / f"{version}.jpg"
                im.save(out, "JPEG", quality=JPEG_QUALITY, optimize=True)
                thumb_rel = f"thumbs/{version}.jpg"
                total += out.stat().st_size
            else:
                log(f"WARNING no in-context image for {part} {version}")

            entries.append(
                {
                    "version": version,
                    "date": row["date"],
                    "label": row["label"],
                    "note": row["note"],
                    "verdict": row["verdict"],
                    "thumb": thumb_rel,
                }
            )

        (dest_dir / "index.json").write_text(json.dumps(entries, indent=2), encoding="utf-8")

    log(f"history/ {len(parts)} part(s), thumbs {total / 1024:.0f} KB total")


# ---------------------------------------------------------------------------
# reports/<date>.json + reports/<date>/thumbs/NNN.jpg
# ---------------------------------------------------------------------------

REPORT_ENTRY_RE = re.compile(r"^##\s+(\d+)\.\s+(.+?)\s*$", re.MULTILINE)
IMAGE_RE = re.compile(r"!\[[^\]]*\]\((images/[^)]+)\)")
VERDICT_RE = re.compile(r"^\*\*Verdict\.\*\*\s*(.+)$", re.MULTILINE)


def parse_report_md(report_md: Path) -> list[dict]:
    text = report_md.read_text(encoding="utf-8")
    headers = list(REPORT_ENTRY_RE.finditer(text))
    entries = []
    for i, m in enumerate(headers):
        num, title = m.group(1), m.group(2)
        start = m.end()
        end = headers[i + 1].start() if i + 1 < len(headers) else len(text)
        section = text[start:end]
        img_m = IMAGE_RE.search(section)
        verdict_m = VERDICT_RE.search(section)
        entries.append(
            {
                "num": num,
                "title": title,
                "image": img_m.group(1) if img_m else None,
                "verdict": verdict_m.group(1) if verdict_m else None,
            }
        )
    return entries


def find_pdf_for_date(date: str) -> str | None:
    pdf_dir = REPO / "output" / "pdf"
    if not pdf_dir.exists():
        return None
    candidates = sorted(p for p in pdf_dir.glob(f"*{date}*.pdf"))
    if not candidates:
        return None
    # Prefer an "end-of-day" edition, else "daily", else the first match.
    for pref in ("end-of-day", "daily-update", "daily-report"):
        for c in candidates:
            if pref in c.name:
                return str(c.relative_to(REPO)).replace("\\", "/")
    return str(candidates[0].relative_to(REPO)).replace("\\", "/")


def build_reports() -> None:
    reports_src = REPO / "reports"
    if not reports_src.exists():
        log("no reports/ directory found - skipping")
        return

    dates = sorted(
        p.name for p in reports_src.iterdir() if p.is_dir() and (p / "REPORT.md").exists()
    )
    web_reports_dir = WEB / "reports"
    web_reports_dir.mkdir(parents=True, exist_ok=True)

    total = 0
    index: list[dict] = []
    for date in dates:
        date_dir = reports_src / date
        entries = parse_report_md(date_dir / "REPORT.md")

        thumbs_dir = web_reports_dir / date / "thumbs"
        thumbs_dir.mkdir(parents=True, exist_ok=True)

        out_entries = []
        for e in entries:
            thumb_rel = None
            if e["image"]:
                src_img = date_dir / e["image"]
                if src_img.exists():
                    im = Image.open(src_img).convert("RGB")
                    w, h = im.size
                    new_w = REPORT_THUMB_WIDTH
                    new_h = max(1, round(h * (new_w / w)))
                    im = im.resize((new_w, new_h), Image.LANCZOS)
                    out = thumbs_dir / f"{e['num']}.jpg"
                    im.save(out, "JPEG", quality=JPEG_QUALITY, optimize=True)
                    thumb_rel = f"{date}/thumbs/{e['num']}.jpg"
                    total += out.stat().st_size
                else:
                    log(f"WARNING report image missing: {src_img}")

            out_entries.append(
                {
                    "num": e["num"],
                    "title": e["title"],
                    "verdict": e["verdict"],
                    "thumb": thumb_rel,
                }
            )

        pdf_path = find_pdf_for_date(date)
        # The day's local picture show, if one was published. It stays on the
        # studio machine - the site links to nothing it cannot serve, it just
        # names the path so the founder can open it there.
        show_rel = f"reports/{date}/SHOW.html" if (date_dir / "SHOW.html").exists() else None
        payload = {"date": date, "pdf": pdf_path, "show": show_rel, "entries": out_entries}
        (web_reports_dir / f"{date}.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
        index.append(
            {"date": date, "entries": len(out_entries), "pdf": pdf_path, "show": show_rel}
        )

    # newest first - the desk's Today tab opens on index["dates"][0]
    index.sort(key=lambda row: row["date"], reverse=True)
    (web_reports_dir / "index.json").write_text(
        json.dumps(
            {"generated": datetime.datetime.now().isoformat(timespec="seconds"), "dates": index},
            indent=2,
        ),
        encoding="utf-8",
    )

    log(f"reports/ {len(dates)} date(s), thumbs {total / 1024:.0f} KB total")


# ---------------------------------------------------------------------------

def report_sizes() -> None:
    def du(path: Path) -> int:
        return sum(f.stat().st_size for f in path.rglob("*") if f.is_file())

    total = du(WEB)
    log(f"TOTAL canon/room-kit/v2/web: {total / (1024 * 1024):.2f} MB")
    for child in sorted(WEB.iterdir()):
        size = du(child) if child.is_dir() else child.stat().st_size
        log(f"  {child.name}: {size / (1024 * 1024):.2f} MB")


def main() -> int:
    if not KIT.exists():
        log(f"ERROR {KIT} does not exist")
        return 1

    rmtree_fresh(WEB)
    build_room_jpegs()
    build_stickers()
    build_history()
    build_reports()
    report_sizes()
    return 0


if __name__ == "__main__":
    sys.exit(main())
