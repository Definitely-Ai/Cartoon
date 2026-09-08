"""The room, one part at a time.

Until now every change to the room re-rendered the whole picture, so touching
the chairs re-rolled the panelling, the marble and the crown along with them.
This splits the room the way the founder asked for on 2026-09-03: the BASE is
the architecture only - walls, crown, window frame, counter - and everything
else is a PART that is rendered against the finished plate and laid back
through its own mask. Re-roll the chairs and the panelling does not move by
one pixel.

How a part is rendered, and why it still matches:
  - The conditioning image is the CURRENT PLATE - finished engraving - with
    only that part's region replaced by its value block-in from the
    construction. The model sees finished art everywhere except the one area,
    so it inherits the pen, the light and the perspective from its neighbours.
  - Only the part's mask is composited back. The mask is exact: the
    construction stamps every pixel it draws with the part it belongs to.
  - Ring tone-matching fits the part's level to the ring just outside it, so
    a part cannot come back brighter or flatter than the plate it lands in.

    python scripts/room-part.py list
    python scripts/room-part.py render base --seed 4
    python scripts/room-part.py approve base canon/room-kit/v2/work/base-s4.png
    python scripts/room-part.py render chair-left --seed 4
    python scripts/room-part.py approve chair-left canon/room-kit/v2/work/chair-left-s4.png
    python scripts/room-part.py build          # base + every approved part, then the sign

Nothing generated is deleted: candidates stay in canon/room-kit/v2/work/.
"""
from __future__ import annotations

import argparse
import base64
import json
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
KIT = ROOT / "canon/room-kit/v2"
WORK, PARTS = KIT / "work", KIT / "parts"
MODEL = "local/sensenova-u1.5"
RW, RH = 1184, 1792             # the model's grid; the plate is 1200 x 1800
GLASS_TONE = 178.0              # the street, seen through glass in daylight: high-key
WALL_TONE = 112.0               # the agreed midtone of the panelling, measured on
                                # the back-wall mask. The model renders an EMPTY
                                # room pale and a furnished one dark - its range
                                # floats with what is in the picture - so level is
                                # never a fixed gamma: it is solved to hit this.
NEG_TEXT = ("text, letters, words, lettering, signage, sign, numbers, typography, "
            "writing, inscription, shop name, banner, poster")
BOTTLE_SENTENCE = ("On each shelf stands a row of LIQUOR BOTTLES of varied heights and shapes, clear and "
                   "dark glass, each with a plain blank paper label \u2014 the labels carry NO lettering, "
                   "NO logos and NO marks of any kind.")
EMPTY_SENTENCE = "THE SHELVES ARE COMPLETELY EMPTY: nothing stands on them, no bottles, no glasses, no objects."
CHAIR_SENTENCE = "- THE TWO BAR CHAIRS in the foreground are IDENTICAL bar-height club chairs seen from behind: a FULL rounded back rising to shoulder height in smooth dark leather with a soft sheen, ending in a slim padded roll with a single line of brass nailheads under it, the leather running down over the seat's side so that NO seat cushion is visible from behind, ending in a plain piped seam, and DIRECTLY beneath that seam four PLAIN straight walnut legs, square in section and slightly tapered, with a foot rail - no turnings, no bulbs, no carving. NO band, NO trim, NO woven or studded strip and NO skirt between the leather and the legs. Simple and elegant - not a barrel, not a tub, no hoops or bands. Leather only — never cane, wicker or woven fabric.\n"
NO_CHAIRS = "- THERE ARE NO CHAIRS AND NO STOOLS: the front of the bar and the floor before it are completely clear.\n"
# The prompt line each part owns, by the words it starts with. When a part is
# rendered, the lines of every part LATER in the stack (or switched off) are
# removed: those parts are not in its conditioning, and a part the prompt
# describes but the picture lacks gets invented - stools on the bar front, a
# television in an empty compartment.
def fig_key(i: str) -> str:
    """A pose part (figure-drew-02-toward) is its character for prompt purposes."""
    for k in ("figure-drew", "figure-barclay", "figure-abby"):
        if i.startswith(k):
            return k
    return i


PART_LINES = {
    "figure-drew": "- SEATED AT THE LEFT-HAND CHAIR",
    "figure-barclay": "- SEATED AT THE RIGHT-HAND CHAIR",
    "figure-abby": "- BEHIND THE LEDGE",
    "tv": "- THE TELEVISION hangs",
    "board": "- THE CHALKBOARD hangs",
    "chair-left": "- THE TWO BAR CHAIRS",
    "chair-right": "- THE TWO BAR CHAIRS",
    "backbar": "- THE BACK BAR is",
    "counter": "- THE COUNTER is",
    "sconce-left": "- ONE BRASS WALL SCONCE",
    "sconce-right": "- ONE BRASS WALL SCONCE",
}
PART_NOUNS = {
    "figure-drew": "flamingo, bird, person, figure, man, character",
    "figure-barclay": "dog, retriever, person, figure, man, character",
    "figure-abby": "bartender, terrier, dog, person, figure, woman, character",
    "tv": "television, screen, monitor, flat screen",
    "board": "chalkboard, blackboard, framed board, picture, frame",
    "chair-left": "chair, stool, seat, barstool",
    "chair-right": "chair, stool, seat, barstool",
    "sconce-left": "lamp, sconce, light fixture",
    "sconce-right": "lamp, sconce, light fixture",
}
PART_CLAUSE = (
    "\n\nPICTURE 1 IS ALREADY A FINISHED ENGRAVING, except for ONE AREA that has been "
    "left as flat blocks of grey value: {note}. Draw THAT AREA ONLY, in exactly the same "
    "pen, the same hatching, the same light and the same tone as its neighbours, so that "
    "it joins them without a visible seam. EVERYTHING ELSE IN PICTURE 1 IS FINISHED: "
    "reproduce it exactly as it is, stroke for stroke, and do not redraw, restyle, "
    "lighten, darken, move or add anything outside that one area.")


def manifest() -> dict:
    global MAN
    MAN = json.loads((KIT / "parts.json").read_text(encoding="utf8"))
    return MAN


MAN: dict = {}
APPLY_SHADOWS = True     # stickers.py turns this off while it inverts lay(); compose-layers.py applies the maps itself


def load(p) -> np.ndarray:
    im = Image.open(p).convert("L")
    if im.size != (1200, 1800):
        im = im.resize((1200, 1800), Image.LANCZOS)
    return np.asarray(im, dtype=np.float32)


def save(a: np.ndarray, p) -> None:
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(p)


def level_to(a: np.ndarray, region: np.ndarray, target: float) -> np.ndarray:
    """The gamma that puts the mean of `region` at `target` - solved, not guessed."""
    m = float(np.clip(a[region].mean(), 2, 253)) / 255.0
    g = float(np.clip(np.log(target / 255.0) / np.log(m), 0.45, 2.2))
    return 255.0 * np.power(np.clip(a, 0, 255) / 255.0, g)


def mask_of(part: dict, grow: int = 0, feather: float = 0.0) -> np.ndarray:
    m = load(KIT / part["mask"]) > 127
    if grow:
        m = ndimage.binary_dilation(m, iterations=grow)
    a = m.astype(np.float32) * 255.0
    if feather:
        a = np.asarray(Image.fromarray(a.astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(feather)), dtype=np.float32)
    return a / 255.0


def tone_match(plate: np.ndarray, src: np.ndarray, inside: np.ndarray):
    """Fit the part's tone on the RING just outside it - never inside, which is
    the thing that changed. First a gamma that puts the ring's mean where the
    plate has it (the model's whole range floats render to render), then a
    clamped gain and offset for the residual, so a part can only be nudged."""
    ring = ndimage.binary_dilation(inside, np.ones((3, 3)), iterations=22) & ~inside
    if ring.sum() < 800:
        return src, 1.0, 0.0
    src = level_to(src, ring, float(plate[ring].mean()))
    b, s = plate[ring], src[ring]
    gain = float(np.clip(b.std() / max(s.std(), 1e-3), 0.88, 1.14))
    off = float(np.clip(b.mean() - s.mean() * gain, -26, 26))
    return np.clip(src * gain + off, 0, 255), gain, off


def sheen(a: np.ndarray, m: np.ndarray) -> np.ndarray:
    """Two soft diagonal bands of light across the glass - the engraver's
    shorthand for a pane. Subtle: the street behind has to stay legible."""
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]].astype(np.float32)
    diag = (xx + 0.55 * yy) / a.shape[1]
    s = (np.exp(-((diag - 0.62) / 0.075) ** 2) * 0.28
         + np.exp(-((diag - 0.86) / 0.045) ** 2) * 0.16
         + np.clip(1.0 - yy / a.shape[0] * 1.6, 0, 1) * 0.10)     # and lighter toward the top
    return a + (255.0 - a) * s * m


def data_uri(p) -> str:
    """A reference image as the data URI the server accepts (a character bust or head tile)."""
    import base64
    b = Path(p).read_bytes()
    kind = "png" if b[1:4] == b"PNG" else "jpeg"
    return f"data:image/{kind};base64," + base64.b64encode(b).decode()


def generate(out: Path, prompt: str, ref: Path, seed: int, fast: bool, neg: str = "", extra_refs=(), model: str = None,
             size: tuple = (RW, RH)) -> None:
    uri = "data:image/png;base64," + base64.b64encode(ref.read_bytes()).decode()
    payload = {"prompt": prompt, "model": model or MODEL, "width": size[0], "height": size[1], "fast": fast,
               "seed": seed, "input_images": [uri] + [data_uri(p) for p in extra_refs], "negative_prompt": neg, "tag": "room-part"}
    if not fast:
        payload["steps"] = 40
        payload["guidance"] = 4.0
    t0 = time.time()
    req = urllib.request.Request("http://127.0.0.1:8000/api/generate", data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    res = json.load(urllib.request.urlopen(req, timeout=1800))
    if not res.get("success"):
        raise SystemExit(f"render failed: {res.get('error')}")
    out.write_bytes(urllib.request.urlopen("http://127.0.0.1:8000" + res["image_url"], timeout=300).read())
    print(f"  {out.relative_to(ROOT)}  seed={res.get('seed_used')}  {time.time() - t0:.0f}s")


def wall_mask(man: dict) -> np.ndarray:
    return load(KIT / man["base"]["masks"]["back-wall"]) > 127


def shadow_of(part: dict, feather: float = 1.2) -> np.ndarray | None:
    """The part's cast-shadow multiplier (1 = no shadow), or None. Drawn by the
    construction's cast(); applied to the rendered plate, so shadows are code."""
    sh = part.get("shadow")
    if not sh or not (KIT / sh).exists():
        return None
    f = load(KIT / sh) / 255.0
    if feather:
        f = ndimage.gaussian_filter(f, feather)
    return np.clip(f, 0.0, 1.0)


def lay(plate: np.ndarray, part: dict, candidate: Path, quiet: bool = False) -> np.ndarray:
    cand = load(candidate)
    hard = mask_of(part, grow=1) > 0.5
    soft = mask_of(part, grow=1, feather=part.get("feather", 3))
    if part.get("toneMatch"):
        cand, g, o = tone_match(plate, cand, hard)
        if not quiet:
            print(f"  {part['id']}: tone gain {g:.2f} offset {o:+.0f}")
    elif part["id"] == "glass":
        # THROUGH GLASS, IN DAYLIGHT. Rendered at the room's level the street
        # read as another wall of the room and the opening looked like a hole.
        # So the view is levelled high-key on its own region, softened a touch
        # against the room's crisp pen, and the sheen lies over it.
        cand = level_to(cand, hard, GLASS_TONE)
        cand = np.asarray(Image.fromarray(np.clip(cand, 0, 255).astype(np.uint8))
                          .filter(ImageFilter.GaussianBlur(0.8)), dtype=np.float32)
    else:
        # no ring fit for the marble, the set and the board - they are MEANT to
        # differ from their surroundings - but they still get the plate's level
        cand = level_to(cand, wall_mask(MAN), WALL_TONE)
    if part["id"] == "glass":
        # GLASS. Three things a pane does that a hole does not: it has a tone
        # (never bare paper), it reflects the room faintly - a soft ghost of the
        # bar mirrored into it - and it carries a sheen where the light rakes it.
        cand = cand * 0.94
        ghost = np.asarray(Image.fromarray(np.clip(plate, 0, 255).astype(np.uint8))
                           .transpose(Image.FLIP_LEFT_RIGHT).filter(ImageFilter.GaussianBlur(9.0)),
                           dtype=np.float32)
        cand = cand * 0.90 + ghost * 0.10
    out = plate * (1 - soft) + cand * soft
    if part["id"] == "glass":
        out = sheen(out, soft)
    sh = shadow_of(part) if APPLY_SHADOWS else None
    if sh is not None:
        sh = np.where(hard, 1.0, sh)             # a part's shadow falls on what is BEHIND it, never on itself (the sill greyed, 2026-09-05)
        out = out * sh                       # the part's cast shadow on what stands behind it

    return out


def assemble(man: dict, upto: str | None = None, quiet: bool = False, override: dict | None = None) -> np.ndarray:
    """Base plus every approved part in order (stopping before `upto`).

    `override` maps a part id to a candidate file: that candidate is laid AT
    THE PART'S OWN LAYER (even if the part is switched off or unapproved), so
    everything in front of it still occludes it. That is how a candidate is
    previewed in context - laying it on top of the finished plate through its
    full silhouette painted it over the parts that stand in front of it (the
    cabinets' candidate covered the counter, 2026-09-05).
    """
    override = override or {}
    src = man["base"].get("source")
    if not src:
        raise SystemExit("no approved base yet: render base, then approve it")
    plate = level_to(load(ROOT / src), wall_mask(man), WALL_TONE)
    for part in man["parts"]:
        if part["id"] == upto:
            break
        if part["id"] in override:
            plate = lay(plate, part, Path(override[part["id"]]), quiet)
        elif part.get("source") and part.get("enabled", True):
            plate = lay(plate, part, ROOT / part["source"], quiet)
    return plate


HUMAN = {"base": "base-walls-crown-floor", "backbar": "back-bar-carcass", "shelf-lower": "back-bar-lower-shelf",
         "shelf-upper": "back-bar-upper-shelf", "bottles-lower": "bottles-on-lower-shelf",
         "bottles-upper": "bottles-on-upper-shelf", "cabinets": "cabinet-doors-under-ledge",
         "ledge": "bartenders-marble-ledge", "tv": "television-blank", "board": "chalkboard-blank",
         "sconce-left": "wall-lamp-left", "sconce-right": "wall-lamp-right", "window-frame": "window-frame-and-reveal",
         "glass": "window-glass-street-view", "counter": "main-bar-marble-counter", "chair-left": "left-leather-club-chair",
         "chair-right": "right-leather-club-chair"}


def report(image: Path, title: str, ask: str = "", thought: str = "", prompt_text: str = "",
           settings: str = "", verdict: str = "") -> None:
    """Every image the studio makes goes into the day's report for Rick."""
    args = [sys.executable, str(ROOT / "scripts/report-log.py"), str(image), "--title", title]
    for k, v in (("--ask", ask), ("--thought", thought), ("--prompt-text", prompt_text),
                 ("--settings", settings), ("--verdict", verdict)):
        if v:
            args += [k, v]
    subprocess.run(args, capture_output=True, text=True)


def cmd_list(_a) -> None:
    man = manifest()
    b = man["base"]
    print(f"base      {'approved: ' + b['source'] if b.get('source') else '- not approved -'}")
    for p in man["parts"]:
        state = "DISABLED" if not p.get("enabled", True) else ("approved: " + p["source"] if p.get("source") else "- not approved -")
        print(f"{p['id']:14s} {state}")
    cands = sorted(WORK.glob("*.png")) if WORK.exists() else []
    if cands:
        print(f"{len(cands)} candidates in work/: " + ", ".join(c.name for c in cands[-12:]))


def cmd_render(a) -> None:
    man = manifest()
    WORK.mkdir(exist_ok=True)
    if a.part == "base":
        prompt = (KIT / man["base"].get("prompt", "08-base.prompt.txt")).read_text(encoding="utf8")
        out = WORK / f"base-s{a.seed}.png"
        generate(out, prompt, KIT / man["base"]["values"], a.seed, a.fast,
                 "stipple, stippled, dots, dotted, speckle, halftone, mesh, screen, woven, "
                 "corduroy, reeding, fluting, noise, blank white, washed out, lamp, sconce, light fixture, lantern")
        save(level_to(load(out), wall_mask(man), WALL_TONE), WORK / f"base-s{a.seed}-preview.png")
        report(WORK / f"base-s{a.seed}-preview.png", f"{HUMAN['base']} render seed {a.seed} full plate",
               thought="The base is the architecture alone - walls, crown, floor - rendered from the construction's value "
                       "drawing. Everything else is a part laid over it, so the base is chosen for its panelling and tone.",
               prompt_text=prompt, settings=f"{MODEL}, seed {a.seed}, {'fast' if a.fast else 'full 40 steps cfg 4'}, "
               f"levelled so the back wall's mean reads {WALL_TONE:.0f}")
        return
    part = next((p for p in man["parts"] if p["id"] == a.part), None)
    if part is None:
        raise SystemExit(f"no such part: {a.part}  (have: {', '.join(p['id'] for p in man['parts'])})")
    if not part.get("enabled", True):
        # A switched-off part can still be rendered and judged: the founder's
        # method is to build an object SEPARATELY, look at it laid in context,
        # and only then switch it on in the plate (2026-09-05). Its mask and its
        # own values exist regardless of DISABLED since the per-part values.
        print(f"  {a.part} is switched off: rendered for the laid preview only; it joins the plate when it leaves DISABLED")
    # the conditioning: the plate as it stands, with only this part blocked in
    # (and any --with parts: two chairs rendered TOGETHER read as two chairs,
    # where one huge dark block on its own was re-imagined as something else)
    # A part is conditioned on the plate assembled UP TO ITS OWN LAYER - the
    # parts behind it - never on parts laid later. The carcass, rendered with
    # the set and the board already in the plate above it, echoed them into its
    # compartments; rendered before they exist, it has nothing to echo.
    plate = assemble(man, upto=part["id"], quiet=True)
    full = assemble(man, upto=None, quiet=True)
    others = [p for p in man["parts"] if p["id"] in (a.with_ or [])]
    # EACH part's block-in comes from ITS OWN values image (drawn with nothing
    # in front of it). Cutting every --with part from the first part's values
    # left the shelves' regions showing bare wall - the carcass's values do not
    # contain the shelves - and the model rendered blurred bands there (2026-09-05).
    cond = plate
    m = np.zeros_like(plate)
    for p_ in [part] + others:
        m_ = mask_of(p_, grow=4, feather=1.5)
        cond = cond * (1 - m_) + load(KIT / p_["values"]) * m_
        m = np.maximum(m, m_)
    for p_ in [part] + others:
        sh = shadow_of(p_)
        if sh is not None:
            cond = cond * np.where(mask_of(p_, grow=1) > 0.5, 1.0, sh)   # its own block-in already carries its shade                     # its shadow falls on the rendered wall, not on a flat block-in
    cond_p = WORK / f"{a.part}-cond.png"
    tall = None
    if a.tall:
        # THE TALL CANVAS. Below the frame the construction has drawn the rest
        # of the object - the chairs' legs, the floor - so the model sees it
        # whole. The plate supplies the frame; the tall values supply the rows
        # beneath; the whole is rendered at the same aspect and cropped back.
        tvs = [(p_, np.asarray(Image.open(KIT / "tall" / p_["values"]).convert("L"), np.float32)) for p_ in [part] + others]
        extra = tvs[0][1][1800:, :]
        for p_, tv_ in tvs[1:]:                          # the --with parts' rows below the frame, through their tall masks
            tm = np.asarray(Image.open(KIT / "tall" / "masks" / f"{p_['id']}.png").convert("L"), np.float32)[1800:, :] / 255.0
            extra = extra * (1 - tm) + tv_[1800:, :] * tm
        cond = np.vstack([cond, extra])
        tall = cond.shape[0]
    save(cond, cond_p)
    prompt = (KIT / part["prompt"]).read_text(encoding="utf8")
    neg = NEG_TEXT if a.part == "glass" or a.part.startswith("bottles") else ""
    if a.part.startswith("chair"):
        neg = "cane, wicker, rattan, woven, basketwork, mesh, fabric weave, upholstery fabric, band, trim, strip, skirt, apron, valance, studded band, streaks, streaky, ribbed, corrugated, hatching lines, barrel, tub, drum"
    if a.part in ("backbar", "shelf-lower", "shelf-upper", "cabinets", "ledge"):
        # the carcass echoed the set above it into a compartment as a black slab
        neg = ("television, screen, monitor, black rectangle, picture, frame, poster, sign, lettering, bottles, glasses, "
               "mirror, mirrored panel, glass panel, white panel, lightbox, frosted glass, window, "
               "arch, arched opening, arcade, doors, cupboard doors, glazed doors, french doors, mullion, curtain, blur, smear")
    if a.part == "window-frame":
        neg = ("sill, window sill, stone sill, ledge, shelf, projecting sill, nosing, moulded nosing, moulding, cornice, railing, rail, "
               "balustrade, radiator, box, blur, smear, curtain, blind")
    if a.part in ("counter", "ledge"):
        neg = ("post, pole, column, pillar, tap, beer tap, pump, handle, bottle, glass, object on the counter, lamp, "
               "bullnose, rounded nosing, moulded edge, bolster, cushion, padded edge, heavy dark veins, cracked stone")
    if not any(p.get("enabled", True) for p in man["parts"] if p["id"].startswith("bottles")):
        # The bottle parts are OFF, so the prompt must not describe bottles: the
        # model drew a full row of them into an empty shelf region on the strength
        # of one sentence. The prompt follows the manifest, not the other way round.
        prompt = prompt.replace(BOTTLE_SENTENCE, EMPTY_SENTENCE)
        prompt = prompt.replace("the room is EMPTY: no glasses,", "the room is EMPTY: no bottles, no glasses,")
        neg = (neg + ", " if neg else "") + "bottles, bottle, glasses, decanters, objects on shelves"
    note = part["note"] if not others else " AND ".join([part["note"]] + [o_["note"] for o_ in others])
    order = [p["id"] for p in man["parts"]]
    me = order.index(part["id"])
    absent = [p["id"] for p in man["parts"] if (order.index(p["id"]) > me or not p.get("enabled", True))
              and p["id"] not in (a.with_ or []) and p["id"] != part["id"]]     # never the part being rendered
    drop = {PART_LINES[fig_key(i)] for i in absent if fig_key(i) in PART_LINES}
    prompt = "\n".join(ln for ln in prompt.split("\n") if not any(ln.startswith(pfx) for pfx in drop))
    extra = sorted({PART_NOUNS[fig_key(i)] for i in absent if fig_key(i) in PART_NOUNS})
    if extra:
        neg = (neg + ", " if neg else "") + ", ".join(extra)
    present = sorted({fig_key(i) for i in order if fig_key(i) in ("figure-drew", "figure-barclay", "figure-abby") and i not in absent})
    if present:
        # a character is in the picture: the EMPTY-room sentence must not deny him
        prompt = prompt.replace("no people, no animals, ", "")
        prompt = prompt.replace("the two stools described above", "the two chairs and the " + " and ".join({"figure-drew": "seated flamingo", "figure-barclay": "seated retriever", "figure-abby": "bartender behind the ledge"}[i] for i in present) + " described above")
    if a.part.startswith("figure-abby"):
        neg = NEG_TEXT + ", generic dog, cat, fox, bare human skin, standing on the bar, floating, second bartender, duplicate figure, flat fill, photographic"
    elif a.part.startswith("figure"):
        neg = NEG_TEXT + (", swan, goose, duck, round head, small beak, short beak, stubby beak, bird dot eye, bare bird, unclothed, naked, no clothes, plain plumage over the whole torso, feathered torso without a vest, straight neck, stiff neck, goose, swan, pink, colour, bird dot eyes, blank eyes, bare human skin, wing mitts, tail, display plumes, hat, shoes, second flamingo, duplicate figure, floating, standing, front view, facing the camera, full face, flat fill, photographic"
                          if a.part.startswith("figure-drew") else
                          ", generic dog, wolf, cartoon dog, tail, heavy neck beard, bare human skin, hat, standing, floating, second dog, duplicate figure, front view, facing the camera, full face, flat fill, photographic")
    if any(i.startswith("chair") for i in absent) and "NO CHAIRS" not in prompt:
        prompt += NO_CHAIRS
    if a.ref:
        # The model is only told about Picture 1; the character's own art must be
        # named or it is treated as style (three undressed rounds, 2026-09-06).
        prompt += ("\n- THE PICTURES AFTER PICTURE 1 ARE THIS CHARACTER'S OWN REFERENCE ART - his bust, his head, and the pair "
                   "seated at this bar seen from behind: reproduce his identity, his species' texture AND HIS CLOTHING from them "
                   "exactly. The same character sits in Picture 1's block-in; draw him as those pictures draw him.\n")
    prompt += PART_CLAUSE.format(note=note)
    out = WORK / f"{a.part}-s{a.seed}.png"
    if a.crop and not tall:
        # A DETAIL RENDER: the figure is a quarter of the frame, so a bow tie is a few
        # pixels; rendered from a 2:3 crop at full resolution he gets four times the
        # pixels, then the piece is scaled back into the frame for laying.
        x0, y0, x1, y1 = [int(v) for v in a.crop.split(",")]
        piece_cond = cond[y0:y1, x0:x1]
        if a.plain:
            mm = mask_of(part, grow=6, feather=3)[y0:y1, x0:x1]
            piece_cond = piece_cond * mm + 140.0 * (1 - mm)        # the figure on a flat field
        save(piece_cond, cond_p)
        size = (1184, int(round(1184 * (y1 - y0) / (x1 - x0) / 32)) * 32)
        generate(out, prompt, cond_p, a.seed, a.fast, neg, size=size, extra_refs=a.ref, model=a.model)
        piece = Image.open(out).convert("L").resize((x1 - x0, y1 - y0), Image.LANCZOS)
        piece.save(WORK / f"{a.part}-s{a.seed}-crop.png")
        full_img = Image.fromarray(np.clip(plate, 0, 255).astype(np.uint8))
        full_img.paste(piece, (x0, y0))
        full_img.save(out)
    elif tall:
        size = (1024, int(round(1024 * tall / 1200 / 32)) * 32)        # same aspect, on the 32-grid
        generate(out, prompt, cond_p, a.seed, a.fast, neg, size=size, extra_refs=a.ref, model=a.model)
        tall_img = Image.open(out).convert("L").resize((1200, tall), Image.LANCZOS)
        tall_img.crop((0, 0, 1200, 1800)).save(out)                   # back to the plate's frame
        tall_img.save(WORK / f"{a.part}-s{a.seed}-tall.png")
    else:
        generate(out, prompt, cond_p, a.seed, a.fast, neg, extra_refs=a.ref, model=a.model)
    # and a preview with it laid in, so it can be judged in context
    # the candidate laid AT ITS OWN LAYER of the full plate, so the parts in
    # front of it occlude it exactly as a build would (the same candidate lays
    # the --with parts too)
    laid = assemble(man, upto=None, quiet=True, override={p_["id"]: out for p_ in [part] + list(others)})
    save(laid, WORK / f"{a.part}-s{a.seed}-laid.png")
    print(f"  preview: {(WORK / f'{a.part}-s{a.seed}-laid.png').relative_to(ROOT)}")
    report(WORK / f"{a.part}-s{a.seed}-laid.png", f"{HUMAN.get(a.part, a.part)}"
           + (" and " + " and ".join(HUMAN.get(o_["id"], o_["id"]) for o_ in others) if others else "")
           + f" render seed {a.seed}" + (" fast" if a.fast else "") + (" tall-canvas" if a.tall else "") + " laid in full plate",
           thought=f"Rendered in context - the plate as it stands behind this part, with only this part's own "
                   f"silhouette blocked in as values - so the pen, light and perspective are inherited; only the "
                   f"mask is laid back. Part note: {note}",
           prompt_text=prompt,
           settings=f"{MODEL}, seed {a.seed}, {'fast 8 steps cfg 1' if a.fast else 'full 40 steps cfg 4'}"
                    + (", tall canvas (drawn whole below the frame, cropped back)" if a.tall else "")
                    + (", rendered together with " + ", ".join(o_["id"] for o_ in others) if others else "")
                    + (f", negative: {neg}" if neg else ""))


def cmd_approve(a) -> None:
    man = manifest()
    PARTS.mkdir(exist_ok=True)
    src = Path(a.file)
    if not src.exists():
        raise SystemExit(f"no such file: {src}")
    dst = PARTS / f"{a.part}.png"
    shutil.copyfile(src, dst)
    rel = str(dst.relative_to(ROOT)).replace("\\", "/")
    if a.part == "base":
        man["base"]["source"] = rel
    else:
        part = next((p for p in man["parts"] if p["id"] == a.part), None)
        if part is None:
            raise SystemExit(f"no such part: {a.part}")
        part["source"] = rel
    (KIT / "parts.json").write_text(json.dumps(man, indent=2), encoding="utf8")
    print(f"approved {a.part} <- {src.name}")
    cmd_build(a)


def blank_screen(plate: np.ndarray) -> np.ndarray:
    """The set's screen, switched off, laid in CODE into the measured quad.

    Six seeds would not render that screen dark - it came back mid-grey with
    streaks every time - and the joke's footage is pasted over it later anyway.
    So its blank state is drawn, like the lettering: a dark charcoal with a
    faint sheen falling down the glass, soft-edged so the bezel keeps its own
    render. Deterministic, and the quad is the one the joke will use.
    """
    q = json.loads((KIT / "quads.json").read_text(encoding="utf8"))["screenQuad"]
    m = Image.new("L", (plate.shape[1], plate.shape[0]), 0)
    from PIL import ImageDraw as _ID
    _ID.Draw(m).polygon([tuple(p) for p in q], fill=255)
    m = np.asarray(m.filter(ImageFilter.GaussianBlur(1.2)), np.float32) / 255.0
    ys = np.linspace(0, 1, plate.shape[0], dtype=np.float32)[:, None]
    y0, y1 = min(p[1] for p in q), max(p[1] for p in q)
    t = np.clip((ys * plate.shape[0] - y0) / max(y1 - y0, 1), 0, 1)
    screen = 30.0 + 26.0 * (1 - t) ** 2                   # a little light at the top, dark below
    return plate * (1 - m) + screen * m


def cmd_build(_a) -> None:
    man = manifest()
    plate = assemble(man)
    tv = next((p for p in man["parts"] if p["id"] == "tv"), None)
    if tv and tv.get("source") and tv.get("enabled", True):
        plate = blank_screen(plate)
    from ink import ink_edges
    plate = ink_edges(plate, man)                # the straight edges of the marble, in code
    save(plate, KIT / "plate.png")
    if any(p["id"].startswith("bottles-") and p.get("source") and p.get("enabled", True) for p in man["parts"])             and (KIT / "labels.json").exists():
        # the bottle labels are typeset in code onto the label quads (lettering is never the model's)
        subprocess.run([sys.executable, str(ROOT / "scripts/label-bottles.py"),
                        str(KIT / "plate.png"), str(KIT / "plate.png")], check=True)
    print(f"wrote {(KIT / 'plate.png').relative_to(ROOT)}")
    glass = next((p for p in man["parts"] if p["id"] == "glass"), None)
    if glass and glass.get("source"):
        # the sign goes on LAST: gilding is pixels and any later repaint wipes it
        subprocess.run([sys.executable, str(ROOT / "scripts/sign-on-glass.py"),
                        str(KIT / "plate.png"), str(KIT / "plate-signed.png")], check=True)
        on = [HUMAN.get(p["id"], p["id"]) for p in man["parts"] if p.get("source") and p.get("enabled", True)]
        report(KIT / "plate-signed.png", "whole-plate assembled with " + " ".join(on) + " and window-sign",
               thought="Base plus every approved, enabled part laid in order through its own silhouette; the TV's blank "
                       "screen and the window's lettering are drawn in code last, because lettering is never left to the model.")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list").set_defaults(f=cmd_list)
    r = sub.add_parser("render"); r.add_argument("part"); r.add_argument("--seed", type=int, default=4)
    r.add_argument("--fast", action="store_true"); r.add_argument("--with", dest="with_", nargs="*")
    r.add_argument("--ref", action="append", default=[], help="extra reference image (a character bust or head tile); repeatable")
    r.add_argument("--model", default=None, help="model id for this render (the cast uses local/qwen-image-edit-2511, the house model that drew the approved plates)")
    r.add_argument("--plain", action="store_true", help="with --crop: a flat grey field outside the part's silhouette, so the figure can be keyed from the render")
    r.add_argument("--crop", default=None, help="x0,y0,x1,y1 (2:3): render this crop of the frame at full resolution and scale it back into place - four times the pixels on a figure")
    r.add_argument("--tall", action="store_true", help="render on the taller canvas so the frame's cut-off object is drawn whole")
    r.set_defaults(f=cmd_render)
    ap_ = sub.add_parser("approve"); ap_.add_argument("part"); ap_.add_argument("file"); ap_.set_defaults(f=cmd_approve)
    sub.add_parser("build").set_defaults(f=cmd_build)
    a = ap.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
