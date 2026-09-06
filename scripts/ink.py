"""Ink the construction's straight edges onto a composed plate, clipped by the
parts that stand in front of them. Edges come from canon/room-kit/v2/ink.json,
written by draw-room-lines.py in page pixels. Hard edges are code, like the
TV screen and the lettering: the model softens a marble edge against hatching
every time (2026-09-05)."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

KIT = Path(__file__).resolve().parent.parent / "canon/room-kit/v2"


def ink_edges(plate: np.ndarray, man: dict, kit: Path = KIT) -> np.ndarray:
    p = kit / "ink.json"
    if not p.exists():
        return plate
    edges = json.loads(p.read_text(encoding="utf8"))
    order = [q["id"] for q in man["parts"]]
    H, W = plate.shape
    out = plate.astype(np.float32).copy()
    cache = {}
    for e in edges:
        pid = e["part"]
        if pid not in order:
            continue
        if pid not in cache:                     # everything laid AFTER this part hides its edges
            occ = np.zeros((H, W), bool)
            for q in man["parts"][order.index(pid) + 1:]:
                mp = kit / q["mask"]
                if q.get("enabled", True) and q.get("source") and mp.exists():
                    occ |= np.asarray(Image.open(mp).convert("L")) > 127
            cache[pid] = occ
        S = 4
        im = Image.new("L", (W * S, H * S), 0)
        ImageDraw.Draw(im).line([(x * S, y * S) for x, y in e["points"]], fill=255, width=int(e.get("width", 2) * S))
        a = np.asarray(im.resize((W, H), Image.LANCZOS), np.float32) / 255.0
        a[cache[pid]] = 0.0
        out = out * (1 - a) + float(e.get("value", 26)) * a
    return out
