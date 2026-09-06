"""Log one generated image into today's report, with the thinking behind it.

Every image the studio makes goes into `reports/<date>/images/` under a numbered,
descriptive name, and a matching entry is appended to `reports/<date>/REPORT.md`:
what was asked, what was decided and why, the exact prompt and settings, the
image, the verdict. Another agent turns REPORT.md into the daily PDF for Rick,
so the entries are written to be read in order, by someone who was not here.

    python scripts/report-log.py <image.png> --title "..." --ask "..." --thought "..."
        [--prompt-file path] [--settings "..."] [--verdict "..."] [--date YYYY-MM-DD]
"""
from __future__ import annotations

import argparse
import datetime as dt
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "reports"


def slug(s: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:110] or "image"      # long enough to name every object in the picture


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("--title", required=True)
    ap.add_argument("--ask", default="")
    ap.add_argument("--thought", default="")
    ap.add_argument("--prompt-file", default="")
    ap.add_argument("--prompt-text", default="")
    ap.add_argument("--settings", default="")
    ap.add_argument("--verdict", default="")
    ap.add_argument("--date", default=dt.date.today().isoformat())
    a = ap.parse_args()

    day = REPORTS / a.date
    (day / "images").mkdir(parents=True, exist_ok=True)
    (day / "prompts").mkdir(parents=True, exist_ok=True)
    n = len(list((day / "images").glob("*.png"))) + 1
    src = Path(a.image)
    name = f"{n:03d}-{slug(a.title)}{src.suffix.lower() or '.png'}"
    shutil.copyfile(src, day / "images" / name)

    prompt_ref = ""
    text = a.prompt_text
    if a.prompt_file:
        p = Path(a.prompt_file)
        if p.exists():
            text = p.read_text(encoding="utf8")
    if text:
        pname = f"{n:03d}-{slug(a.title)}.prompt.txt"
        (day / "prompts" / pname).write_text(text, encoding="utf8")
        prompt_ref = f"prompts/{pname}"

    md = day / "REPORT.md"
    if not md.exists():
        md.write_text(f"# The Swinging Door - studio report, {a.date}\n\n"
                      "Built for Rick. Every image the studio generated today, in the order it happened, "
                      "with the ask that drove it, the thinking behind the decision, the exact prompt and "
                      "settings, and the verdict. Images are in `images/`, prompts in `prompts/`.\n\n", encoding="utf8")
    with md.open("a", encoding="utf8") as f:
        f.write(f"## {n:03d}. {a.title}\n\n")
        f.write(f"![{a.title}](images/{name})\n\n")
        if a.ask:
            f.write(f"**The ask.** {a.ask}\n\n")
        if a.thought:
            f.write(f"**The thinking.** {a.thought}\n\n")
        if a.settings:
            f.write(f"**Settings.** {a.settings}\n\n")
        if prompt_ref:
            f.write(f"**Prompt.** [{prompt_ref}]({prompt_ref})\n\n")
        if a.verdict:
            f.write(f"**Verdict.** {a.verdict}\n\n")
        f.write(f"*Logged {dt.datetime.now().strftime('%H:%M')}.*\n\n---\n\n")
    print(f"logged {name} -> {md.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
