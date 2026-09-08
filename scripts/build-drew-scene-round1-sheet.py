"""Contact sheet for DREW-IN-THE-SCENE round 1 (2026-09-08).

Route A, with round 1's one prompt-side fix: Picture 3 cropped to the FLAMINGO
ALONE (the labrador of duo-behind.png was being copied as cast, not just as
camera) plus one extra numbered EDIT naming the cast out loud, and the key's new
flat-grey guard. Six seeds beside the portrait, each laid preview cropped to the
left chair and shown at 2x, labelled with the seed and the sidecar's numbers.
"""
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path("Z:/ImageGenerator/Cartoon")
FIG = ROOT / "canon/room-kit/v2/figures"
RD = Path("C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
          "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-scene/drew/round-1")
OUT = RD / "sheet.png"
POSE = "seated-left-solo3"
SEEDS = [int(s) for s in (sys.argv[1].split(",") if len(sys.argv) > 1 else "41,7,21,33,44,55".split(","))]

WIN = (60, 700, 700, 1500)           # plate pixels round the left chair, 640x800 (the box itself)
SCALE = 2
PW, PH = (WIN[2]-WIN[0])*SCALE, (WIN[3]-WIN[1])*SCALE
PAD, LAB, TOP = 26, 96, 150
COLS = 3
ROWS = (len(SEEDS)+COLS-1)//COLS
PORT_W = 620


def font(sz):
    for n in ("georgiab.ttf", "georgia.ttf", "arialbd.ttf", "arial.ttf"):
        try:
            return ImageFont.truetype(n, sz)
        except OSError:
            pass
    return ImageFont.load_default()


F_T, F_H, F_L, F_S = font(52), font(32), font(38), font(26)

port = Image.open(ROOT / "canon/vision/studies/drew.png").convert("RGB")
port.thumbnail((PORT_W, 10**6), Image.LANCZOS)
stg = Image.open(RD / "staging-flamingo.png").convert("RGB")
stg.thumbnail((PORT_W, 10**6), Image.LANCZOS)

grid_w = COLS*PW + (COLS+1)*PAD
grid_h = ROWS*(PH+LAB) + (ROWS+1)*PAD
left_h = port.height + stg.height + LAB*2 + PAD*3
W = PORT_W + PAD*2 + grid_w
H = TOP + max(grid_h, left_h)
sheet = Image.new("RGB", (W, H), "white")
d = ImageDraw.Draw(sheet)
d.text((PAD, 20), "DREW IN THE SCENE - ROUND 1   (2026-09-08)   scripts/cast-place.py --route A", fill="black", font=F_T)
d.text((PAD, 82), "ROUND 1's CHANGE: Picture 3 cropped to the FLAMINGO ALONE (the duo's labrador was being copied as CAST, not just as camera) "
                  "+ EDIT 3 'exactly one living creature' + the key's new flat-grey guard.  Everything else is the bake-off's route A.",
       fill="black", font=F_H)

sheet.paste(port, (PAD, TOP))
d.text((PAD, TOP+port.height+8), "PICTURE 2 - the portrait", fill="black", font=F_L)
d.text((PAD, TOP+port.height+52), "canon/vision/studies/drew.png - copy THIS bird", fill="black", font=F_S)
sy = TOP + port.height + LAB + PAD
sheet.paste(stg, (PAD, sy))
d.text((PAD, sy+stg.height+8), "PICTURE 3 - NEW this round", fill="black", font=F_L)
d.text((PAD, sy+stg.height+52), "staging-flamingo.png: duo-behind cropped to ONE bird", fill="black", font=F_S)

rows = []
for i, s in enumerate(SEEDS):
    laid = FIG / f"drew-{POSE}-rA-s{s}-laid.png"
    car = FIG / f"drew-{POSE}-rA-s{s}.json"
    cx = PORT_W + PAD*2 + PAD + (i % COLS)*(PW+PAD)
    cy = TOP + PAD + (i//COLS)*(PH+LAB+PAD)
    if laid.exists():
        im = Image.open(laid).convert("RGB").crop(WIN).resize((PW, PH), Image.LANCZOS)
        sheet.paste(im, (cx, cy))
    else:
        d.rectangle([cx, cy, cx+PW, cy+PH], outline="black", width=3)
        d.text((cx+20, cy+20), "MISSING", fill="black", font=F_T)
    d.rectangle([cx-2, cy-2, cx+PW+2, cy+PH+2], outline="black", width=3)
    cl = jn = pf = st = "-"
    if car.exists():
        k = json.loads(car.read_text(encoding="utf8")).get("key_result", {})
        cl = next((f"{v:.3f}" for kk, v in k.items() if kk.startswith("cleanliness")), "-")
        jn = f"{k.get('join_mean_abs_levels','-')}"
        pf = f"{k.get('plate_fraction_replaced','-')}"
        st = f"{k.get('sticker_fraction_of_box','-')}"
    d.text((cx, cy+PH+10), f"SEED {s}", fill="black", font=F_L)
    d.text((cx+190, cy+PH+18), f"join {jn} levels   plate replaced {pf}   sticker {st} of box   field kept {cl}",
           fill="black", font=F_S)
    rows.append((s, jn, pf, st, cl))

OUT.parent.mkdir(parents=True, exist_ok=True)
sheet.save(OUT)
print(OUT, sheet.size)
for r in rows:
    print(r)
