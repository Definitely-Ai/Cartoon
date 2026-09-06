"""ABBY ROUND 3 - PICTURE 1 IS A FULL PLATE, NOT A CROP OF ABBY.

Rounds 1 and 2 sent qwen-image-edit a BUST as Picture 1 (the trio.png head crop,
then the sc04 head-to-hands crop). qwen-image-edit copies Picture 1's STAGING, so
a bust came back as a bust: 6 of 6 round-2 renders were portraits on bare paper
while the prompt was asking for the counter, both hands and the towel.

This builds Picture 1 from the WHOLE ART FIELD of the published, Rick-accepted
strip canon/showcase-retired/sc12-permanent-receipt.png - the caption band cut
off at y=1498 (measured: every row from 1500 down is a flat 245) - resized to the
house 4:5 shape, 1344x1680. That plate already IS the construction the judges
asked for: Abby standing on the far service side behind the marble with both
hands at her work, the counter crossing her at the waist, Drew and Barclay seated
and rendered on the near side, the back bar and sconces behind her.
"""
from PIL import Image
from pathlib import Path

ROUND = Path("C:/Users/admin/AppData/Local/Temp/claude/Z--ImageGenerator/"
             "7e90a839-5703-42df-8007-3e3f206ae0ae/scratchpad/cast-studies/abby/round-3")

# (a) the judges' plate: the published strip, caption band cut at y=1498 (every
#     row from 1500 down measures a flat 245). BUILT AND TESTED at seed 55 - and
#     it LOSES on lettering: sc12 carries a chyron, a lettered slate and a
#     lettered receipt, and at cfg 1 the model copied all three and then invented
#     more, which INSPECTION.md check 17 calls fatal. Kept as the filed evidence.
SC12 = Path("Z:/ImageGenerator/Cartoon/canon/showcase-retired/sc12-permanent-receipt.png")
SC12_OUT = ROUND / "abby-picture1-sc12-plate.png"
ART_BOTTOM = 1498

# (b) THE ONE THAT SHIPS. canon/plates/trio.png is the APPROVED BLANK PLATE and
#     it is the same construction the judges described - Abby standing at the far
#     service side with both hands at her work, the counter across her waist,
#     Drew seated frame-left and Barclay frame-right on the near side - with the
#     screen already off, the slate already wiped, every bottle label already
#     blank and NO receipt. Its only lettering is the mirrored window name, which
#     is the one piece of lettering the fence licenses. Cut to the house 4:5:
#     x 60..1140 keeps the mirrored window, y 20..1370 cuts the chair backs off
#     the bottom so the picture ends at the marble as THE STAGE requires.
TRIO = Path("Z:/ImageGenerator/Cartoon/canon/plates/trio.png")
TRIO_BOX = (60, 20, 1140, 1370)          # 1080x1350 = a true 4:5
TRIO_OUT = ROUND / "abby-picture1-trio-plate.png"


def main() -> None:
    ROUND.mkdir(parents=True, exist_ok=True)
    im = Image.open(SC12).convert("L").crop((0, 0, 1200, ART_BOTTOM)).resize((1344, 1680), Image.LANCZOS)
    im.save(SC12_OUT)
    print(f"{SC12_OUT}  {im.size}")
    im = Image.open(TRIO).convert("L").crop(TRIO_BOX).resize((1344, 1680), Image.LANCZOS)
    im.save(TRIO_OUT)
    print(f"{TRIO_OUT}  {im.size}")

if __name__ == "__main__":
    main()
