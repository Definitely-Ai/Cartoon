"""ABBY ROUND 4 - THE REFERENCE SWAP THE JUDGES ORDERED, inside the 3-ref cap.

THE ORDER: "the tiles are the disease, not the seeds. DROP canon/vision/studies/
abby.png and canon/characters/abby/kit/bust.png from Abby's VISION_REFS entirely:
both draw the silky long coat, the wide lynx-tufted ears and the open-blouse
cleavage that all six renders faithfully copied. Round 3 already dropped abby.png
and still sent bust.png as PICTURE 2 - that is where the Bichon came from.
Replace with crops of the plates Rick actually accepted: PICTURE 2 := sc04 at
(470,360,820,900); PICTURE 4 := sc12 at (450,350,830,930)."

THE ONE DEVIATION, AND IT IS FORCED BY THE WIRE. The qwen family's max_refs is 3
(Z:/ImageGenerator/backend/providers/local_bridge.py line 63, mirrored as
MAX_REFS=3 in cast-study.py), and the bridge drops extras off the END of the
list. A Picture 4 would therefore never reach the model at all - it would be
silently binned, and the round would look like it tested the sc12 head when it
had not. So both ordered crops are laid SIDE BY SIDE INTO ONE TILE and sent as
PICTURE 2: sc04 left, sc12 right, the same two pixels the judges named, both
actually on the wire. Picture 1 (trio plate) and Picture 3 (eye chart) keep their
places exactly as ordered.

THE SECOND DEVIATION, AND ROUND 3 PAID FOR IT. The sc04 crop carries FOUR LEGIBLE
BOTTLE LABELS ('EAGLE EYE VODKA', '-TEE TCH') on the back bar behind her. Round 3
proved at seed 55 that a lettered reference at cfg 1 is copied and then
elaborated into pseudo-text, which INSPECTION.md check 17 calls fatal - it is the
whole reason the judges' own sc12 Picture 1 was rejected. Those four label panels
are blanked to plain paper here, which is also exactly what canon's fence asks a
study's labels to be. Nothing else in either crop is touched.
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROUND = Path("C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
             "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-4")

SC04 = Path("Z:/ImageGenerator/Cartoon/canon/showcase-retired/sc04-fourteen-dollars-of-roof.png")
SC12 = Path("Z:/ImageGenerator/Cartoon/canon/showcase-retired/sc12-permanent-receipt.png")
SC04_BOX = (470, 360, 820, 900)     # the judges' box, verbatim
SC12_BOX = (450, 350, 830, 930)     # the judges' box, verbatim

# the four lettered label panels inside the sc04 crop, in crop coordinates
SC04_LABELS = ((0, 156, 34, 236), (0, 370, 30, 456), (283, 158, 350, 234), (294, 358, 350, 472))
PANEL = 236                          # a blank paper label
SC12_TOP = 12                        # the sc12 crop clips a line of faint shelf lettering

H = 760                              # both crops to one height
GAP = 26
OUT = ROUND / "abby-picture2-accepted-plates.png"
EYE_SRC = Path("C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
               "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-3/"
               "abby-eye-tile.png")
EYE_OUT = ROUND / "abby-eye-tile.png"


def scaled(im: Image.Image) -> Image.Image:
    w = round(im.width * H / im.height)
    return im.resize((w, H), Image.LANCZOS)


def main() -> None:
    ROUND.mkdir(parents=True, exist_ok=True)

    a = Image.open(SC04).convert("L").crop(SC04_BOX)
    d = ImageDraw.Draw(a)
    for box in SC04_LABELS:                       # kill the lettering, keep the panel
        d.rectangle(box, fill=PANEL, outline=96, width=1)
    b = Image.open(SC12).convert("L").crop(SC12_BOX)
    # the sc12 crop clips one line of faint lettering off the shelf edge at its
    # very top; twelve rows of dark shelf go with it and nothing else is lost
    b = b.crop((0, SC12_TOP, b.width, b.height))
    a.save(ROUND / "abby-p2-left-sc04.png")
    b.save(ROUND / "abby-p2-right-sc12.png")

    a, b = scaled(a), scaled(b)
    tile = Image.new("L", (a.width + GAP + b.width, H), 255)
    tile.paste(a, (0, 0))
    tile.paste(b, (a.width + GAP, 0))
    tile.save(OUT)
    print(f"{OUT}  {tile.size}   sc04 {a.size} + sc12 {b.size}")

    # the eye chart earned its place this round; it is carried across unchanged
    EYE_OUT.write_bytes(EYE_SRC.read_bytes())
    print(f"{EYE_OUT}  {Image.open(EYE_OUT).size}")


if __name__ == "__main__":
    main()
