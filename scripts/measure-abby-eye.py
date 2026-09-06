"""MEASURE ABBY'S EYE - the judges' round-3 pass criterion, applied by number.

    "Judge the eye by measurement, not by eye: the near eye opening must fall
     well under 40% below L60 with a genuine paper-white patch on each side of
     the iris, or the round has failed again."

The look card measures the same way (section 1): abby-face-reference.jpg at
87.6% / 83.5% below L60, canon/vision/studies/abby.png at 52.3% / 39.7%, both
with no white at either side of the iris.

HOW THE BOX IS FOUND. In these renders the iris, pupil and lash line fuse into
ONE dark blob per eye - that blob IS the dark of the eye, which is the thing being
measured. The script thresholds at L70 inside a face-band search window, keeps
components of a plausible size, and takes the PAIR whose two blobs are close to
the same area, close to the same width and at close to the same height (without
that test a bottle shadow and the shelf edge outscore the eyes). Each blob's
bounding box is then grown by x1.35 wide and x1.30 tall to the eye OPENING, and
inside that opening:

  dark_pct   percentage of the opening below luminance 60 - the card's own metric
  white_L    the brightest 5th-percentile-from-top value in the strip on each
             SIDE of the iris (the outer 22% of the opening's width, at pupil
             height). "Paper-white" is judged against the render's own paper: the
             margin white is measured off the picture and printed as paper_L.

Usage:  python scripts/measure-abby-eye.py IMAGE [IMAGE ...] [--json]
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

SEARCH = (0.44, 0.42, 0.70, 0.56)      # x0, y0, x1, y1 as fractions of the frame
DARK_MAX_L = 70                        # the dark of the eye - iris, pupil, lash
DARK_AREA = (150, 2400)                # px, at 1344x1680
OPEN_W, OPEN_H = 1.35, 1.30            # the OPENING as a multiple of that dark bbox
SIDE_FRAC = 0.22                       # the outer strip on each side of the iris


def paper_white(a: np.ndarray) -> float:
    """The render's own white. These plates are full-bleed - there is no paper
    margin to sample - so the reference white is the brightest tone the picture
    actually reaches (the lit fur and the window), at the 99.5th percentile."""
    return float(np.percentile(a, 99.5))


def find_eyes(a: np.ndarray):
    h, w = a.shape
    x0, y0, x1, y1 = (round(SEARCH[0] * w), round(SEARCH[1] * h),
                      round(SEARCH[2] * w), round(SEARCH[3] * h))
    win = a[y0:y1, x0:x1]
    lab, n = ndimage.label(win < DARK_MAX_L)
    blobs = []
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        if not (DARK_AREA[0] <= ys.size <= DARK_AREA[1]):
            continue
        bw, bh = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
        # ABBY'S EYE IS SPECIFIED WIDER THAN IT IS TALL, so the dark inside it is
        # too. Requiring that here is what stops a tall bottle label on the back
        # bar from pairing with a real eye - it did exactly that at seeds 44 and 55.
        if bw == 0 or bh == 0 or bw / bh > 3.2 or bw / bh < 1.05:
            continue
        blobs.append({"cx": xs.mean() + x0, "cy": ys.mean() + y0, "w": bw, "h": bh, "area": ys.size})
    blobs.sort(key=lambda b: -b["area"])
    best = None
    for i in range(len(blobs)):
        for j in range(i + 1, len(blobs)):
            p, q = blobs[i], blobs[j]
            if abs(p["cy"] - q["cy"]) > 0.75 * max(p["h"], q["h"]) + 10:
                continue
            gap = abs(p["cx"] - q["cx"])
            if not (1.3 * max(p["w"], q["w"]) < gap < 6.0 * max(p["w"], q["w"])):
                continue
            # A PAIR OF EYES IS A PAIR: the two pupils are close to the same size
            # and sit at close to the same height. Without this the bright shelf
            # edge and a bottle shadow score higher than the eyes themselves.
            ar = max(p["area"], q["area"]) / max(1, min(p["area"], q["area"]))
            wr = max(p["w"], q["w"]) / max(1, min(p["w"], q["w"]))
            hr = max(p["h"], q["h"]) / max(1, min(p["h"], q["h"]))
            if ar > 2.2 or wr > 1.8 or hr > 1.8:
                continue
            score = (p["area"] + q["area"]) / (ar * wr)
            if best is None or score > best[0]:
                best = (score, sorted([p, q], key=lambda b: b["cx"]))
    return None if best is None else best[1]


def measure(path: Path) -> dict:
    im = Image.open(path).convert("L")
    a = np.asarray(im).astype(np.float32)
    paper = paper_white(a)
    eyes = find_eyes(a)
    out = {"image": str(path), "paper_L": round(paper, 1), "eyes": []}
    if not eyes:
        out["error"] = "no eye pair found in the search window"
        return out
    for side, b in zip(("viewer_left", "viewer_right"), eyes):
        ow = max(6, round(b["w"] * OPEN_W / 2))     # HALF-extents: the box is OPEN_W wide
        oh = max(5, round(b["h"] * OPEN_H / 2))
        cx, cy = round(b["cx"]), round(b["cy"])
        x0, x1 = max(0, cx - ow), min(a.shape[1], cx + ow)
        y0, y1 = max(0, cy - oh), min(a.shape[0], cy + oh)
        box = a[y0:y1, x0:x1]
        if box.size == 0:
            continue
        sw = max(2, round(box.shape[1] * SIDE_FRAC))
        band = box[max(0, box.shape[0] // 2 - 4): box.shape[0] // 2 + 4]
        left_L = float(np.percentile(band[:, :sw], 95)) if band.size else 0.0
        right_L = float(np.percentile(band[:, -sw:], 95)) if band.size else 0.0
        out["eyes"].append({
            "side": side,
            "box": [int(x0), int(y0), int(x1 - x0), int(y1 - y0)],
            "dark_pct_below_L60": round(100.0 * float((box < 60).mean()), 1),
            "white_left_L": round(left_L, 1),
            "white_right_L": round(right_L, 1),
            "white_left_vs_paper": round(left_L - paper, 1),
            "white_right_vs_paper": round(right_L - paper, 1),
        })
    if out["eyes"]:
        near = max(out["eyes"], key=lambda e: e["box"][2] * e["box"][3])
        ok_dark = near["dark_pct_below_L60"] < 40.0
        ok_white = min(near["white_left_L"], near["white_right_L"]) >= paper - 18
        out["verdict"] = {
            "near_eye": near["side"],
            "near_dark_pct": near["dark_pct_below_L60"],
            "passes_dark_under_40": ok_dark,
            "passes_white_both_sides": ok_white,
            "passes": ok_dark and ok_white,
        }
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("images", nargs="+")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--debug", action="store_true", help="write the found boxes onto a face crop")
    a = ap.parse_args()
    rows = [measure(Path(p)) for p in a.images]
    if a.debug:
        for r in rows:
            if "error" in r:
                continue
            im = Image.open(r["image"]).convert("RGB")
            d = ImageDraw.Draw(im)
            for e in r["eyes"]:
                x, y, w_, h_ = e["box"]
                d.rectangle([x, y, x + w_, y + h_], outline=(255, 0, 0), width=3)
            out = Path(r["image"]).with_name("debug-eye-" + Path(r["image"]).name)
            im.crop((380, 520, 1060, 1120)).save(out)
            print("   debug ->", out)
    if a.json:
        print(json.dumps(rows, indent=2))
        return
    for r in rows:
        name = Path(r["image"]).name
        if "error" in r:
            print(f"{name:34s}  {r['error']}")
            continue
        v = r["verdict"]
        print(f"{name:34s}  paper L{r['paper_L']:.0f}  near={v['near_eye']:12s} "
              f"dark={v['near_dark_pct']:5.1f}%  "
              f"{'PASS' if v['passes_dark_under_40'] else 'FAIL'}-dark  "
              f"{'PASS' if v['passes_white_both_sides'] else 'FAIL'}-white  "
              f"=> {'PASS' if v['passes'] else 'FAIL'}")
        for e in r["eyes"]:
            print(f"    {e['side']:12s} box={e['box']} dark={e['dark_pct_below_L60']:5.1f}% "
                  f"whiteL={e['white_left_L']:5.1f} whiteR={e['white_right_L']:5.1f} "
                  f"(paper {r['paper_L']:.0f})")


if __name__ == "__main__":
    main()
