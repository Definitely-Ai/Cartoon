# Approved Barclay reference face

Owner approval, September 14, 2026: "I like it fully implement him in all of the
cartoons and update the 38 cartoons with him".

`approved-portrait.png` is the approved portrait. `owner-reference.png` is the
unchanged earlier bar scene the owner supplied as the likeness reference. Earlier
means the previous design, not a request for age marks or a new character.

The identity has a rounded head, soft full muzzle and cheeks, a warm black smile
line, short fine fur, rounded floppy ear, expressive eyes and an upright neck.
Keep the current suit, flag pin, shirt, watch and furry hands without claws.

The five `acting/` plates share one facial identity. The two Barclay-speaking
plates use a bounded open-mouth edit; the Abby-speaking plate uses upward-looking
eyes. Other cast members retain their original acting. Every speaker opens their
mouth, and every listener looks toward the speaker.

`acting/verification.json` pins the exact plates and approved portrait identity.
The production worker must verify those hashes. Old queued checkpoint results
belong to their old runtime; never rewrite a running job's art assets.

The 38 selected cartoons and two city editions use these identical facial pixel
changes. Captions, TV, chalkboard, clothing, hands and all pixels outside the
bounded Barclay head/neck region are preserved. Original closed-mouth plate
pixels restore the real bar revealed by the removed old speaking jaw. No modeled
background or cloned wall texture is used for the final restoration.

The old artwork remains in the studio and Git history. Release evidence is in
`docs/artwork/barclay-reference-rollout.json` and `lib/cast-identity.json`.
