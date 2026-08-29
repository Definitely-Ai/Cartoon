# The inspection checklist

Every fault on this list shipped in a real panel and was caught by the founder
or an inspector. A batch goes to the founder only after every panel has been
read against this list and the failures redrawn. When a new mistake is found,
it is added HERE first — then it is checked forever.

The check is run by the `inspect-batch` workflow (`.claude/workflows/`), which
reads this file verbatim as its rulebook, one reader per panel plus an
independent second opinion on every claimed fault. The free mechanical checks
run first via `node scripts/qc-batch.mjs <batch-folder>`.

## Fatal — a panel with any of these is redrawn

### The room
1. **One counter, and it is THE counter.** Exactly one horizontal marble
   surface in the picture. The gentlemen sit at its NEAR side; every drink,
   bowl and prop stands ON that same slab. Fatal forms seen in the wild: a
   lower marble step or apron in front carrying a drink; the counter left
   standing BEHIND the figures as scenery with a second slab invented for the
   drinks; a waist-high back-bar ledge carrying bottles.
2. **Bottles live on high shelves.** The back bar's lowest bottle shelf sits
   above a standing bartender's shoulders; below it is plain panelling. No
   bottle at waist height.
3. **The sides.** Drew and Mango are patrons — counter in front of them, never
   reading as bartenders. Abby, when cast, works beyond the same counter.
4. **No door in the window.** The front window carries only the mirrored house
   name. No door drawn in it, beside it, or anywhere in frame.
5. **Nothing floats.** Props rest on the marble or in a closed grip; nothing
   hangs off the counter edge with air beneath it.

### The cast
6. **Headcount.** Only the characters this panel's brief casts. An uninvited
   bartender — of any species — is fatal.
7. **Abby on model** (when cast): the approved portrait exactly — round soft
   head, big black nose close under the eyes, NO muzzle or snout of any kind,
   HUMAN-style attractive eyes (whites, iris, lids, lashes, catchlight — never
   black dog buttons), smooth cleavage with no fur in the open V, studded
   collar with gem, towel somewhere in panel, no tail.
8. **Mango on model** (when cast): mouth closed — no hanging jaw, tongue or
   bared teeth; flag pin on the LEFT lapel; wristwatch (except golf); no tail.
9. **No nails or claws** on any fingertip, any character.
10. **Nobody looks at the reader.**

### The lettering
11. **Every word real and correctly spelled at a glance.** The window reads
    THE SWINGING DOOR, mirrored, both G's present. At most two lettered
    bottles — BIRDIE BOURBON and DIVOT DRIVE GIN — all others blank.
12. **Zero words inside the television picture.** The chyron carries all the
    screen's text; footage surfaces that would carry writing are drawn blank.
    The receipt-with-scribbled-rows is the classic form of this fault.
13. **No pseudo-text anywhere** — no micro-writing, invented glyphs, or marks
    that merely look like letters, on any surface at any size.
14. **Pure black and white.** Any colour anywhere is fatal (the mechanical
    check catches this first).

## Accepted — never report
- Drew's bill shape, and Drew in one-eyed side profile.
- Mango in one-eyed three-quarter (minor note only, not fatal — this round).
- Printed props carrying five or six legible lines instead of four.
- THE SWINGING DOOR made INTO a towel, napkin, coaster or folder — that is the
  required house mark, not stray lettering.
