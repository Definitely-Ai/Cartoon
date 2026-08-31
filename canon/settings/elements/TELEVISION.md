# The television — CAPTION-DRIVEN (slots: `[TV]` + `tvPicture`)

**Status: CAPTION-DRIVEN.** The set itself is a constant fixture; what it SAYS
and SHOWS belongs to the day's joke, through two slots and nothing else.

## The constant part (never changes)

- A wall-mounted flatscreen in a narrow bare black bezel, centred high above
  the back bar. Nothing written on the frame or surround, ever.
- When it is on: full broadcast grammar — CNBC bug with LIVE tag, ONE
  bold-caps headline chyron on a lower-third band, time stamp. Never a
  ticker, never a second line.
- **Zero words inside the picture** — footage surfaces that would carry
  writing are drawn blank.

## The caption-driven part

- `[TV]` — the headline chyron, written by the writers' room from the SAME
  joke as the caption (echoes it; never completes it).
- `tvPicture` — what the footage shows: ONE plain literal scene a viewer
  could name in two seconds, illustrating that very headline. Never a rebus.
- **An empty `[TV]` slot switches the set OFF**: plain dark glass, no bug, no
  chyron, no picture. The fixture stays; the content stands down.
  (`fillSlots()` in `lib/generate.ts` enforces this.)

## Where this is enforced

- Image model: the screen-and-board paragraph of the BASE fence.
- Writer: the `tv`/`tvPicture` field rules in `lib/writersRoom.ts` SHAPE.
- Inspection: checks 15 and 16 in `canon/INSPECTION.md`.
