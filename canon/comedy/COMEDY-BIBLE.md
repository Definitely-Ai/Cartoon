# Comedy Bible

<!-- BRAND: replace when final — "The Swinging Door" is the working series/bar name throughout this document -->

Purpose: how a Swinging Door gag is built, checked, and killed. Source: the
founder's series bible, his seven reference plates, and the faults our own
shipped work has actually committed.

**How to read this document.** Everything here is a rule a writer can run in
under a minute — a count, a named shape, a yes/no question. Where an older
note said *dry*, *underplayed* or *warm*, this one says what produces those
results. Adjectives describe a finished caption; they cannot write one.

---

## The series, in one paragraph

"The Swinging Door" is both the strip title and the name of the bar in the
recurring bar scene. The primary characters are anthropomorphic and discuss
politics, culture, financial markets, institutions, sports, and American life
with dry humor, from inside a warm and familiar bar. Each cartoon is a single
frame, black-and-white ink wash, with a dry American magazine cartoon feel.

## The target reader

A thoughtful adult of any political background — the reader who follows the
news, owns an index fund or at least an opinion about one, stands for the
anthem, and can laugh at the institutions they still basically believe in.
They read gag panels in magazines and comics in the physical paper; they
distrust propaganda from every direction; they know the difference between a
joke about power and a joke about people. **The strip is for the person on the
next stool.**

## The daily test

The reader is a finance guy who looks at the cartoon for **3–10 seconds a
day**. In that window it must land, and it must feel like his world — from the
25-year-old aspiring to the life to the 82-year-old who lived it and still
does, in the Warren Buffett key: understated, moneyed, unhurried. Drew and
Mango are gentlemen; the room is high-class; the joke is dry and relatable to
people who build relationships at a good bar.

Three seconds has two consequences the rest of this document is built on:

1. **The last three words are half the joke.** Whatever the eye lands on last
   is what the reader carries away.
2. **A joke that needs a second pass is a joke that got one pass.** If the
   reader must recall a definition, look up a place name, or map four terms at
   once, the caption lands at second six and the panel is already gone.

## Political posture

Institutional-skeptical but patriotic. Avoid the cartoon feeling like partisan
propaganda: prefer jokes where thoughtful readers from any political
background can recognize the absurdity. Every cartoon is topically current
with events of the day.

## The topical engine

Every cartoon starts from **something actually going on**: a government
policy, a Fed decision, a tariff, a tax change, a debt-ceiling rerun, a
regulation, a market event, a premium renewal, a grocery total — anything that
**financially affects** people like the readers. Evergreen subjects
(retirement, golf, airline seats) qualify when they are told through their
economics.

The desks the strip files to:

`central bank` · `trade` · `credit & debt` · `equities` · `housing` ·
`household` · `civic` · `away game`

`household` is the desk with the most tape on it and the least of our work:
premiums, fares, renewals, grocery totals, rent, deductibles, dues. See
**Batch composition** for the standing quota.

The series may criticize: bureaucratic euphemisms; performative politics;
media incentives; market overreactions; judicial and regulatory ambiguity;
American rituals that become absurd through repetition; institutional
self-importance; the national debt level; corruption in government or large
business organizations; **and the pricing of ordinary life.**

---

# PART ONE — THE BUILD

## The three angles

**The TV names the story. The chalkboard prices it. The caption lands the
verdict.** One joke, three angles — and each angle must be load-bearing.

### The blank-signage test — run it in both directions

Cover the TV and the chalkboard with your thumb.

> **If the caption still lands whole, the drawing is decoration.** You have
> written a one-liner and drawn a bar behind it. Rewrite until the caption is
> *incomplete* without the signage.

Now cover the caption instead.

> **The panel must be legible, not finished.** SCENE-QC requires the gag to
> read in two seconds without the caption — meaning the reader can tell what
> the joke is *about*, not that he can already laugh at it. If a reader who
> sees only the drawing laughs and stops, the caption has no work left:
> escalate the caption or de-escalate the signage.

**A cartoon that passes only one direction of this test is not filed.**

### The three vocabularies rule

The caption may not contain a word printed on that panel's own chyron or
chalkboard, and it may not restate a fact either of them has already stated.
If the board says THE RATE HIKE, the caption may not say *rate hike*. If the
chyron says FLIGHT TO QUALITY, the caption does not book a flight to quality.
Three angles, three vocabularies.

### The chalkboard has a craft

The board is a third of the gag, and its job is **the same joke in dollars**.
A board with no number on it is a second caption written in chalk — and when
the chalk says the punchline first, the caption arrives as confirmation
instead of as the landing. Every board should be rewritable as *a thing, a
price, and one turn.*

The devices, with models:

1. **The price** — the news noun on the menu at a plausible bar price.
   *THE STARTER HOME $12 — OUTBID.* Cap: three per ten.
2. **The two prices** — the same item twice, the gap is the joke.
   *THE PAID-OFF HOUSE $14 · THE PAID-OFF HOUSE, ONE YEAR LATER $23.*
3. **The two-column pair** — two items, identical price, absurd names.
   *CANADIAN CLUB $9 · RETALIATORY CLUB $9.*
4. **The unavailable item** — on the menu, never served.
   *THE RATE HIKE $19 — PRICED NIGHTLY, NEVER POURED.*
5. **The unbundling** — the price holds and something leaves the glass.
   *MARTINI $18 · GARNISH SOLD SEPARATELY.*
6. **The restructured hour** — happy hour rebuilt as the institution's own
   product. *DEDUCTIBLE HOUR 4–7 · THE FIRST $2,500 IS YOURS.*
7. **The ledger** — two counts, and the gap between them is the story.
   *DRINKS ORDERED TONIGHT: 4 · DRINKS CONSIDERED: 31.*

**No two boards in a batch use the same device.** At most three price a noun
in dollars. A board that carries no figure at all needs a reason you can say
aloud, and there may be at most one in ten.

### The business is the fourth angle, and it is free

The strongest panels in our own files are the ones where a drawn action
argues: two gentlemen jammed into one corner of an empty bar; a three-olive
pick carrying exactly one olive; a phone face-down under one feather-digit
while its owner quotes the lunchtime print; Abby sliding a glass the last inch
without eye contact. Write the business before the caption, and then **do not
let the caption describe it**. If the caption says what the reader can see, you
have spent your twenty words on a label.

---

## Caption rules

- Every cartoon has a caption, and it is **attributed dialogue in the house
  format**: `Drew: "…"`, `Mango: "…"`, or `Abby: "…"` — one speaker, typeset
  in italics beneath the panel by the house. The filing pipeline rejects any
  other shape (`lintCaption` in `lib/dialogue.ts`).
- The spoken line is **at most 20 words**; most land in 8–14. The linter
  enforces this, so it is the one rule you may stop thinking about.
- **The payload word goes last.** The funniest word in the line is the final
  word or the final pair. No caption ends on a function word (*it, one, that,
  them, in, too, anyway*), on a verb of state, or on a noun the chyron already
  printed. If your best word is in the middle, the sentence is built backwards.
  *The founder's endings, seven for seven: exercise, knee room, traditions,
  going to become, in operations, I'm punishing, a practice swing.*
- **Somebody is in the sentence.** *our, we, I, your, me, his* — five of the
  founder's seven put the speaker or the reader inside the line. A caption
  with no person in it is a maxim, and a maxim reads the same under a blank
  panel as under this one. Dispatches about absent third parties — *nobody,
  they, her, committed is* — are how a bar strip loses its bar.
- **Default to one sentence.** Six of every ten captions in a batch are a
  single unbroken sentence with the surprise held to the end. Two sentences is
  a licensed shape, not the house shape: it is licensed for the Downgraded
  Want, the Cheerful Concession, the Unnoticed Contradiction and the House
  Ruling, and nowhere else without a reason you can say aloud. Three sentences,
  never.
- **Three angles, three vocabularies** — no word off this panel's own signage.
- The caption **deepens the visual gag rather than explaining it.**

---

## THE TEN-SECOND TEST — joke or observation

The most common failure in this strip is not an offensive line or a long line.
It is a **well-mannered restatement of the chyron**: accurate, dry, correctly
attributed, containing no turn. It reads as competent and it is worth nothing,
because the reader already read the television.

**True and mildly wry is a kill, not a pass.** Run this on your own line
before anyone else sees it.

> ### Question one — the new-information question
> Say what the screen already said. Now say your caption.
> **Is the caption the same thing in better English?**
> If yes, it is an observation. File it as a note and write another.
>
> ### Question two — name the turn in five seconds
> Every joke has exactly one of these three, and **you must be able to name
> which in five seconds, out loud, in one word**:
>
> - **COLLISION** — one word is true in both the bar's sense and the news's
>   sense at once. *house, long, committed, raise, target, cover, spread,
>   float, delivered.*
> - **CONTRADICTION** — the second half disproves the first half and the
>   speaker goes on drinking.
> - **THEFT** — the thing is renamed into a class it does not belong to, and
>   the new class fits better than the true one.
>
> If you cannot name it, there is not one there. A fourth answer — *"it's
> true, though"* — is the observation announcing itself.

Worked, from our own files:

| Line | Verdict |
| --- | --- |
| *"Committed is money that hasn't had its second thoughts yet."* | COLLISION on **committed**. A joke. |
| *"I have never felt worse about the economy, Abby. Same again."* | CONTRADICTION he does not notice. A joke. |
| *"The middle seat is now our best-performing square foot."* | THEFT — a seat filed as real estate. A joke. |
| *"A symposium in the mountains, to tell us they are still thinking about it."* | Nothing collides, contradicts or is stolen. **An observation.** It shipped because there was no test. There is now. |
| *"I check every price in the aisle now and still come home with the same cart."* | True. No turn. **An observation.** |
| *"Inflation is quoted on the speedometer and settled on the odometer."* | An accurate metaphor, not a theft — nothing is funnier than the truth. **An observation**, and a good one for a chart page. |

### The two failure words, made checkable

The posture forbids cynicism and sentimentality. Both were previously matters
of argument. They are now tests:

- **Cynical** = the line asserts that nothing works and nobody is trying, and
  closes the subject. **Test: does the caption leave the reader something he
  can still believe in?** Drew's *"I'm not cynical. I'm just early"* passes —
  he is still waiting for the thing to work.
- **Sentimental** = the line asks for a feeling the drawing has not earned.
  **Test: strike the caption's warmest word.** If the joke survives, the word
  was doing work. If the line collapses, the word *was* the line.

An ache is not a smile. If the reader goes quiet instead of amused, you have
written an elegy with a bar behind it.

---

# PART TWO — THE MECHANISMS

## The founder's seven

The reference plates. Each is the model of a lane, and each lane below is
named for the plate that proves it.

1. *Drew: "The security line is our most successful national team-building
   exercise."* — **The Promotion.**
2. *Mango: "I've reached the age where I don't want luxury. I just want knee
   room."* — **The Downgraded Want.**
3. *Drew: "It's comforting to see our emergencies becoming traditions."* —
   **The Emotional Misfile.**
4. *Drew: "Retirement planning is just estimating how expensive your hobbies
   are going to become."* — **The Deflationary Definition.**
5. *Drew: "The republic remains blue in concept, green in operations."* —
   **The Status Report.**
6. *Mango: "I don't mind paying more. I just like to know which country I'm
   punishing."* — **The Cheerful Concession.**
7. *Drew: "Golf is the only sport where everyone complains about the speed and
   then takes a practice swing."* — **The Practice Swing.**

Rules of the register, off the plates: the target is systems, never people;
the caption under-plays while the signage escalates; Drew diagnoses, Mango
pays, Abby rules; twenty words or fewer, dry, unhurried.

Note what the seven do **not** contain: no puns, no exclamation marks, no
irritation, no line that needs a second reading, and not one repeated
mechanism. Seven plates, seven lanes, seven subjects.

## The lane index

**Every caption is written in a named lane, and the lane is recorded with the
cartoon.** This exists because the three shapes an older draft of this
document happened to name were the only three our first ten used — four of the
founder's own lanes went unrepresented across ten panels. **What is not named
is not written.**

| # | Lane | Recipe in one line | Speaker |
| --- | --- | --- | --- |
| 1 | **The Promotion** | Rename the national failure into the category where it is a roaring success, and award it the superlative | Drew |
| 2 | **The Category Theft** | File the thing under another trade's paperwork, and let the new paperwork fit better | Drew |
| 3 | **The Deflationary Definition** | [Dignified activity] is just [the clerical operation it consists of] | Drew |
| 4 | **The Emotional Misfile** | Report an alarming recurring fact and attach the wrong warm feeling to it | Drew (Abby to close) |
| 5 | **The Status Report** | [Ideal] in concept, [reality] in operations — two short parallel clauses, the second one the damage | Drew |
| 6 | **The Downgraded Want** | Name what the money was for, then swap it for the smallest physical thing you would now pay more to get | Mango |
| 7 | **The Cheerful Concession** | Grant the cost graciously, then ask the one procedural question the system cannot answer politely | Mango |
| 8 | **The Practice Swing** | [Group] complains about [problem] and then does the thing that causes it — speaker inside the group | either |
| 9 | **The Unnoticed Contradiction** | State the position in full, then perform the short action that falsifies it, and go on drinking | Mango |
| 10 | **The Itemised Bill** | Break the object in his hand into what the news actually made it, in dollars | Mango, or Abby who knows the pour cost |
| 11 | **The House Ruling** | Abby answers the macro question with the bar's own arithmetic, mid-task, on a concrete bar object | Abby |
| 12 | **The Literalist** | Take the metaphor at face value and *act* on it, visibly, in the drawing | either |

---

### 1. The Promotion — Drew

**Recipe.** Take a national failure. Rename it into a category from another
domain where it is not merely acceptable but a *triumph*. Award it the
superlative. Say **our**, not *the*, so the speaker is standing in the line
too. One sentence; the category noun last.

**Model.** *"The security line is our most successful national team-building
exercise."*

**Ours.** *Drew: "Four times a year we all fall silent for a semiconductor."*
— an earnings print promoted into the class of things a nation stands still
for, with a golden retriever drawn at attention beside it.

**Fails when** the new category is something the thing already literally is.
*"Holiday air travel is our only nationwide event with assigned seating"* is a
true description wearing the costume of a promotion — airplanes do have
assigned seating, so there is no gap to fall through. The gap between the
thing and its new name is the entire joke.

### 2. The Category Theft — Drew

**Recipe.** File the story under a different trade's vocabulary — real estate,
banking, freight, club membership, fundraising, civic ceremony — and use that
trade's own working words. The reader's pleasure is the fit, so the borrowed
vocabulary must be exact.

**Ours, all shipping-grade.**
- *Drew: "The middle seat is now our best-performing square foot."* — a fixed
  quantity of space whose price rose a quarter in a year is not a seat, it is
  real estate, and priced per square foot it has beaten anything he owns.
- *Drew: "The market raised rates last week; December is where we go for the
  ribbon-cutting."* — a decision known in advance is not a decision, it is the
  ceremonial opening of a building already occupied.
- *Drew: "The deed makes you an owner; the renewal notice makes you a member
  in good standing."* — ownership requiring an annual payment to continue is a
  club subscription.

**Fails when** it names the mechanism instead of stealing the category.
*"The quarter was made on the float"* identifies the machinery correctly and
gets a nod; *"that is a bank with shopping carts"* steals the category and
gets the laugh.

### 3. The Deflationary Definition — Drew

**Recipe.** *X is just Y*, where X is a large professionalised activity and Y
is the small undignified accounting operation it actually consists of. Y must
survive being checked — if the reader tests it and it holds, it lands; if it
is only a putdown, it dies. **The word *just* is the demotion marker and is
not optional.** Contract the verbs inside it.

**Model.** *"Retirement planning is just estimating how expensive your hobbies
are going to become."*

**Ours.** *Drew: "A tax we get back in the autumn is not a tax. It is a
Christmas club."*

**Fails when** the definition arrives after a clause of explanation. Fourteen
words of mechanism before the payload is a lecture with a punchline stapled on.

### 4. The Emotional Misfile — Drew

**Recipe.** Report an alarming recurring fact and attach the **wrong warm
feeling** to it — *comforting, reassuring, a relief, good to see, charming*.
The wrongness of the emotion is the entire mechanism. Do not also comment on
the fact. The crisis must have happened at least twice in living memory.

**Model.** *"It's comforting to see our emergencies becoming traditions."*

**Speaker note.** Drew, or Abby if the room needs closing. Never Mango — he is
not calm enough for the misfile to be funny.

**Fails when** the warm word is doing a wink. He is not being ironic at the
reader; he genuinely finds it comforting, and that is why it lands.

### 5. The Status Report — Drew

**Recipe.** File on an institution in balanced project-management clause pairs
— *remains X in concept, Y in operations* — where the same words are also
literally true of the picture on the television. Both clauses short, both
scanning to the same rhythm, the second one the damage. Two readings at once;
the reader supplies the decay.

**Model.** *"The republic remains blue in concept, green in operations."*

**Standing note.** The driest shape in the canon and the one we have most
often failed to produce on request. If the batch has no Status Report in it,
somebody should say why.

### 6. The Downgraded Want — Mango

**Recipe.** Name the abstract thing the money was supposed to buy. Then, in
the second sentence, swap it for the smallest **physical, touchable, priced**
object you would now genuinely pay more to get. The drop in altitude between
the two nouns is the joke; the small noun goes last. Knee room, an armrest, a
parking space, an ice cube, a printed receipt.

**Model.** *"I've reached the age where I don't want luxury. I just want knee
room."*

**Speaker.** Mango, always. It is a confession, and only the one who pays gets
to make it.

**Fails when** it is the plate with the nouns swapped. Founder plate 2 owns
airline seating and the view-to-armrest downgrade twelve inches away from knee
room is a cover version, not a lane. Take the shape somewhere the plate has
not been.

### 7. The Cheerful Concession — Mango

**Recipe.** Concede the cost graciously in sentence one — *I don't mind
paying* — then in sentence two ask for one small operational detail that only
makes sense if you have understood the policy is theatre. **Put the speaker in
the agent seat:** he is the one doing the punishing, not the one being
punished. Never indignant; the good manners are what make it land.

**Model.** *"I don't mind paying more. I just like to know which country I'm
punishing."*

**Fails when** it puts him only in the checkout queue. *"I had one of each. It
felt patriotic both times"* is a well-built consumer line and a weaker cousin
of the plate that gives him agency. Perfect current fit: the renewal, the
fare, the grocery total. He does not mind paying; he would just like to know
what he bought.

### 8. The Practice Swing — either

**Recipe.** Name one ritual in which the group's complaint and the group's own
behaviour are the same act, joined by *and then*. Nobody is blamed because
everybody is guilty, the speaker included. The reader must recognise himself
doing it.

**Model.** *"Golf is the only sport where everyone complains about the speed
and then takes a practice swing."*

**Ours.** *Mango: "I shop every carrier in August and re-sign with the same
company by Labor Day."*

**Speaker.** Drew when the group is professional, Mango when the group is
domestic.

**This is the one lane licensed to implicate the reader**, and the licence is
conditional: **the speaker is implicated first, in the same sentence.** He
takes the swing too. That is not punching down — it is the house buying a
round.

### 9. The Unnoticed Contradiction — Mango

*The lane no earlier draft of this bible named, and the one our own best
caption was written in by accident.*

**Recipe.** State the position at full size. Then perform the short act that
falsifies it, in the same breath, without noticing. Three hard rules:

1. **The refutation is an ACTION or an ACCOUNTING, never a second opinion.**
2. **It comes second.**
3. **It is markedly shorter than the claim** — two to five words.

The sentence was the sentiment; the action is the truth. The reader does the
arithmetic and that is the laugh.

**Model.** *"I have never felt worse about the economy, Abby. Same again."*

**Ours.**
- *Mango: "I'm waiting on rates to come down, Drew. The truck has waited
  ninety thousand miles."* — the odometer does the arguing, not him.
- *Drew: "I don't look at it during the day, Mango. It was down a percent at
  lunch."* — the rare Drew version, where composure is what hides the
  contradiction: a man that calm does not file knowing the number as watching.
- *Mango: "I've quit flying, Drew. October, November, and Christmas."* — the
  itinerary is longer than the renunciation.

**Speaker.** Mango, effectively. His sincerity is what makes the seam
invisible to him and visible to the reader, and his behaviour is the reader's
behaviour, so the refutation implicates rather than mocks. Abby can *receive*
it; she does not speak it.

**Fails when** the trap has a hatch in it. *"I've quit flying anywhere I don't
have to"* excuses all three trips before the list arrives; the renunciation
must be absolute or there is nothing to falsify. **And it fails when it is
also a correct decision** — paying a year's premium up front to capture the
discount is prudence, not blindness, and the reader knows it.

**Batch note.** This lane is a machine with an audible hinge. Two in a batch
is the limit, and never two in the same week with the same joint.

### 10. The Itemised Bill — wallet height

*The height where three of the founder's seven live and where our first ten
scored zero.*

**Recipe.** Take the object physically in front of him — a glass, a check, a
receipt, a renewal letter — and break it into what the news has actually made
it. **The units must be dollars the reader has personally handed over.** The
second component is the payload and goes last.

**Ours.** *Abby: "There's about four dollars of whiskey in that glass and
fourteen dollars of roof."* — an $18 old fashioned itemised into product and
insurance, said by the only person who knows the pour cost, while a renewal
envelope sits spiked on the check spindle.

**Also this lane.** *Mango: "Their basket hasn't changed since 2020. Mine's
down a chicken."*

**Why it is a lane and not a mood.** Our smallest number across ten shipped
captions was $9 and our largest was $3 trillion, and no reader has ever paid
either. The founder's strongest three plates are a seat, a tariff at the till,
and his own retirement; his weakest is the one furthest from a price. The
correlation runs one way and it is the whole instruction: **the closer the
joke gets to a number the reader personally pays, the harder it lands.**

**Conduct, absolutely.** Joke about what it costs. **Never about what it costs
somebody.** See the scan, question 4.

### 11. The House Ruling — Abby

**Recipe.** Abby answers a macro question with the bar's own arithmetic —
present tense, mid-task, one short declarative, and **at least one concrete
bar object in the sentence** (a glass, a pour, a bottle, a price card, an
olive). She rules; she does not banter upward, does not diagnose, does not
complain, and never puns. Leave one term deliberately unmapped, or the reader
finishes the crossword and there is nothing left for him to do.

**Ours.** *Abby: "I haven't raised a number in three years, gentlemen, but I
have reconsidered the olive."* — shrinkflation announced from the authority
side in the institution's own verb, with the lid going back on the jar and a
three-olive pick carrying one olive.

**The variant worth having: the Sell.** She does not comment on the news, she
prices against it. *Abby: "The stools are free, gentlemen, and the ice is
local."*

**Fails when** she reports a bill that landed on her, which is Mango's chair,
or names a mechanism, which is Drew's. The gags that hold are the ones where
she **prices** something. And she is scarce by canon — *"not a primary
character; she should not appear in most cartoons"* — so a repeat of her most
recent move inside a fortnight is the most expensive mistake available.

### 12. The Literalist — either

**Recipe.** Take the financial metaphor at face value and **act on it in the
drawing**. The action must be visible and the caption must not repeat the
metaphor's own words.

**Ours.** *Mango: "The first two thousand of any storm is mine. I've been
building tolerance."* — a deductible is money you must lose before anything is
covered, so he rehearses losing it, an inch of old fashioned at a time, poured
off into a set-aside glass.

**Fails, twice over, in the same way:**
- **The first pun.** If the phrase makes the joke by itself — *flight to
  quality* plus a middle seat, *nowhere to hide* plus a hiding place — the
  reader made it before the panel did. Take the second reading, not the first.
- **The echo.** If the chyron prints the metaphor and the caption speaks it,
  the caption is the drawing's echo. The chyron owns the phrase; the caption
  owns what somebody did about it.

---

## Register, made countable

*Dry*, *underplayed* and *warm* are results. They are produced by five
mechanical habits. Write the habits; the adjectives arrive.

1. **No intensifiers.** Cut *very, really, absolutely, completely, quite, so,
   truly, entirely.* The founder's seven contain zero.
2. **The emotion word is one size too small for the news.** The screen says a
   trillion; the mouth says *comforting*, *I don't mind*, *respectful*, *a
   separate decision*. Understatement is not a mood — it is a deliberate
   mismatch between the size of the number on the TV and the size of the
   adjective in the caption. Name the mismatch before you write the line.
3. **No volume.** No exclamation marks, no capitals, no italics for emphasis,
   no caption ending in a question mark.
4. **The speaker does not react to his own joke.** No *of course*, no
   *apparently*, no *naturally* deployed as a wink, and no closing tag that
   explains what the line meant.
5. **The line lets someone off.** That is what *warm* means mechanically:
   somebody in the room — Mango, Abby, the country, the reader — is treated
   fondly in the same sentence that convicts the system.

**Contract where he tosses it off; do not contract the verdict.** The
founder's rule read off his plates: first-person and thrown-away phrases
contract (*I've reached*, *It's comforting*, *I don't mind*), while a formal
verdict stays uncontracted because formality is the costume (*is our most
successful*, *remains blue in concept*). We once shipped *"It is called
research"* where the bible had *"It's called research"* and killed the
toss-off the whole line depended on.

## Each speaker, and the swap test

- **Drew** — deadpan verdicts. Certainty worn lightly. He reclassifies,
  defines, and files, then goes back to his martini.
  *"Rates will come down. I've simply stopped asking when."*
- **Mango** — the worried everyman who pays the bill. He converts the macro
  number into his own tab, and his dignity while saying it is why it lands.
  *"The chart goes up and I still feel it going down."*
- **Abby** — the authority. She rules; she does not banter upward. Her word
  settles it, delivered while finishing a task.
  *"The house protects its own. Read it again, gentlemen."*

> **The swap test.** Put another speaker's name on the caption. **If nothing
> is lost, the name was carrying no weight** and the line is a generic clever
> sentence with an attribution stapled on.

Two attribution faults to watch, both of which we have shipped:

- **Mango as macro commentator.** *"Nobody pays a tab like that. They renew
  it."* is a verdict about the Treasury delivered from outside his own wallet,
  by the character whose entire job is the cost landing on him personally.
  When Mango narrates sovereign behaviour he becomes a second Drew and the
  panel goes flat.
- **The crossed speaker.** The caption says *I* while the drawing gives the
  action to the other character. If the business hands Mango the car keys and
  the twenty years of careful driving, the twenty-year claim record does not
  belong in Drew's mouth. One possessive usually fixes it: make the record
  *his*, and Drew is back to diagnosing.

---

# PART THREE — THE CHECKS

## Batch composition — the ten

Individually good cartoons make a bad week if nobody counts. Our first ten put
the same central bank on screen three times in one week, two of those carrying
the same figure, and ran one mechanism six times out of ten. No rule prevented
it because no rule existed. **A daily reader learns the gear by Thursday and
stops looking on Friday, and no individual caption in that six is bad enough
for anyone to notice why.**

Every batch of ten is checked against all of the following before any of it
files.

**Subject**
- No more than **three from one desk**.
- No more than **two on a single news event**, and never two whose chyrons
  state the same figure.
- **At least four of ten at household height** — a cost the reader paid
  himself in the last month: a premium, a fare, a renewal, a grocery total, a
  rent cheque, a deductible. Our first ten scored zero. This is the standing
  shortfall.
- **At least one away game** — golf, boat, plane, ballpark, kitchen table —
  and it must be funny *about that place*. Test: swap the number for a
  different number in the same units. If the joke does not change, it is a
  rate joke wearing golf clothes; send it back.

**Shape**
- **No two captions share a lane.** No lane more than twice under any
  circumstances.
- **No two chalkboards share a device**; at most three price a noun in
  dollars; at most one carries no figure at all.
- **At least six of ten are a single sentence.**
- **Payload word last, ten of ten.** Read only the final words of the batch
  down the page: if you see *it, one, in, decision*, the batch is not ready.
- **Somebody inside the sentence, at least eight of ten.**

**Cast**
- Speakers land near **Drew 4 / Mango 4 / Abby 2**. Drift is fine; a shutout
  is not, and a Drew monopoly is the drift we actually have — three of the
  founder's seven are Mango's, and two of those are the household-height ones.
- **At most two Abby captions, never two running**, and never two consecutive
  weeks in the same Abby lane.
- **An address tag** (*Mango, / Abby, / gentlemen*) at most **twice per ten**.
  It costs a word out of twenty, and it appeared in both Abby lines out of two.

**Standing repeat check.** Before filing, read the caption against the last
thirty. Same lane, same last word, or same collision word inside thirty days
is a rewrite. Two gags built on the same underlying idea — *safety has become
expensive*, *renounce and then list three* — never run in the same fortnight,
however different their nouns.

---

## The kill list

Named failure shapes, every one of them taken from a caption this room
actually wrote and a judge actually killed. **These are not close calls; they
are the specific ways competent writing fails.**

### The shapes

1. **THE ECHO** — the caption restates in words a fact the chalkboard or the
   chyron has already stated in words.
   *Board: THE RATE HIKE $19 — PRICED NIGHTLY, NEVER POURED. Caption: "Best
   seller all year. Nobody has ever had to make one."* Two angles and an echo.

2. **THE MAXIM** — nobody is in the sentence and it would run unaltered in a
   sell-side note, a column, or a conference slide.
   *"Inflation is quoted on the speedometer and settled on the odometer."*
   A fortune cookie in a bow tie.

3. **THE TAG** — a final clause telling the reader what the joke he just heard
   meant. *"…administered as a matching gift campaign, and we are the
   donors." / "…so I practice." / "…and I'm waiting for a push." / "It is
   called research."* Cut the tag; the line is the shoulder it was thrown
   over.

4. **THE NARRATED DRAWING** — the caption describes the business.
   *"I check every price in the aisle now"* said over a drawing of a man
   checking a price. The reader is being told what he is looking at.

5. **THE FIRST PUN** — the joke the phrase makes by itself, which the reader
   made before the panel did. *Flight to quality, in coach.* Also: any caption
   turning on a word meaning two things where the pleasure is admiring the
   writer. None of the founder's seven is a pun.

6. **THE BORROWED JOKE** — *"Nobody is spending. I have never had this much
   trouble getting a table"* is Yogi Berra in a dinner jacket. The reader will
   not think you are quoting; he will think you do not know it exists, and
   that costs more than a flat day.

7. **THE RERUN** — a shipped mechanism with new nouns. *A second Abby line in
   a fortnight where the house moves its price before the institution moves
   its rate. A second austerity-announced-then-refuted order. A third pass at
   matched tariffs.* Better staging on a used mechanism is still a rerun.

8. **THE ARITHMETIC ENDING** — the line resolves into a sum instead of a
   verdict. *"I bought his round, he bought mine, and we're each eleven
   dollars poorer."* True; not a joke.

9. **THE ANALYST'S NOTE** — a fair reading of the release with a bar setting
   attached, at terminal height, with the drawing doing nothing.
   *"Anyone can pour a drink. Prying a credit out of the customs office is a
   career."*

10. **THE FUNCTION-WORD ENDING** — *…had to make one. / They renew it. / …
    still thinking about it. / …the kind anyone lives in.* Four of our first
    ten. The reader's eye lands on nothing.

11. **THE CROSSED SPEAKER** — the caption's *I* is doing what the other
    character is drawn doing. See the swap test.

12. **THE UNPRICED BOARD** — a chalkboard carrying a verdict instead of a
    number: *NOBODY LEAVES AHEAD · RESTITUTION HANDLED ELSEWHERE ·
    TEMPORARILY UNAVAILABLE IN EITHER DIRECTION.* A second caption in chalk,
    and twice it announced the punchline a line early.

13. **THE MISPINNED PANEL** — a conduct failure that lives in the chyron, not
    the caption. A wealthy man's mock sacrifice above a television picture of
    two people at a kitchen table with a calculator and one envelope. However
    the caption is aimed, the drawing makes the kitchen table the setup and
    the reader laughs across it. Repin the story or cut the panel.

14. **THE FALSE PREMISE** — a setup the finance reader knows to be untrue.
    *"The basket they measure hasn't changed since 2020"* — it changes
    constantly, and the changing is the real complaint. A premise the reader
    catches costs more trust than a mediocre joke does.

### Retired phrases

Retired because they were good. A signature used four times is a tic, and the
reader who looks for three seconds a day notices tics faster than jokes.
Reinstatement is the founder's call.

- **"It is called X."** — appears in this bible's own older example, in Drew's
  character bible, and in a shipped caption. Write the reclassification
  **without the tag** for ninety days; the lane survives the loss of its
  catchphrase.
- **Any pun on *house*** (the house wins / the house always / house money).
- **"Same again."** as a closing beat. Spent, and worth what it cost.
- **"Priced in"** in a caption. It belongs on the chalkboard now.
- **Patriotism as the punch noun** (*it felt patriotic*). Mango's love of
  country sets jokes up; it is not the payoff.
- **The soft landing, the long term, the debt clock** as caption subjects.
  They may still appear as chyrons.

### Retired shapes

- Any caption containing an exclamation mark, or ending in a question mark.
- Any caption ending on a function word.
- Three or more sentences. Ever.
- Any caption using a word printed on that panel's own chalkboard or chyron.
- Any caption in which a principal reports his own intoxication. Abby's house
  has no drunks.

---

## Conduct — the fifteen-second scan

**Absolute. Not adjustable in the room, not tradeable against a laugh.** Seven
questions, run in order against the finished caption **and** against the
chyron, the chalkboard and the business. Any *yes* is a rewrite, not an edit.
This is the whole conduct list; there is no other.

| # | Question | The line |
| --- | --- | --- |
| 1 | **A cheap word?** | **No cussing. Ever.** The vocabulary is a gentleman's; the joke never needs it. The linter catches profanity; it does not catch sneering, and sneering fails too. |
| 2 | **Is a person the target?** | **No slandering — not named people, not unnamed ones.** The target is a rule, an incentive, a habit, an institution. **Test: delete the person from the caption. If the joke changes, the person was the target.** A chyron may state a public event as a plain fact; nothing may characterise, judge or mock anyone, and an unnamed analyst is a person. Aim at the published target, never the practitioner. |
| 3 | **Body, faith, family, misfortune?** | Appearance, illness, addiction, bereavement, war casualties, human suffering, religion. There is no version dry enough to run. |
| 4 | **Wallet height — the price, or the coping?** | A premium, a fare, a renewal, a grocery total, a rent number, a deductible: **fair game, and the strip needs more of it.** Selling possessions, missing a payment, rationing a prescription, a second shift taken to cover a bill: **never, in any register, however sympathetic.** *Joke about what it costs. Never about what it costs somebody.* The man on the next stool is feeling these numbers himself; he will laugh at the invoice and he will not laugh at himself drowning. |
| 5 | **Would it work with the parties reversed?** | If it only works against one side it is an argument, not a gag. Not a demand for balance — the target is a mechanism, and mechanisms are bipartisan. |
| 6 | **Punching down?** | At staff, at the young, at anyone with less money than the speaker. Drew and Mango are wealthy; **the only person they may make ridiculous is themselves.** |
| 7 | **Does the affection survive it?** | Abby still likes the regulars, Mango still stands for the anthem, the reader still owns the index fund. If the caption makes any of the three look foolish for it, cut it. |

The principals are successful people in their prime — Drew and Mango
mid-forties and accomplished, Abby a successful proprietor — and they carry
wisdom. Respect is demanded by carriage, not volume. Every caption should
sound like it was said by someone worth listening to.

**Tiebreaker only:** if a line passes all seven and the room is still split —
*would Warren Buffett say it at a nice bar?* It settles ties. It does not
decide cases, because two writers who disagree about a caption will also
disagree about the oracle.

---

# PART FOUR — REFERENCE

## Voice calibration — pre-format drafts

> These eight are **voice references, not models.** They pre-date the
> three-angle format: five of the eight have no chalkboard and none is dated
> to a news day, so imitating their *structure* produces a panel this pipeline
> is not built to draw and this bible's own topical engine forbids. Read them
> for the sound of the room. Take structure from **The three angles** and
> shape from **the lane index**.

1. TV reads MARKETS OPEN; both watching. → *"We're long-term investors, Mango.
   The market has been open for an hour."*
2. Drew holds a one-page fee statement at wing's length. → *"The fee is one
   percent, which mostly covers the cost of explaining the fee."*
3. TV reads SOFT LANDING; neither has moved. → *"They've achieved a soft
   landing, Mango. Nobody can say on what."*
4. Mango squints at his phone; TV shows a jagged coin chart. → *"It's called
   crypto. Now we can lose money without leaving the bar."* *(Note: the tag is
   now retired — see the kill list.)*
5. Abby polishing a glass between the two of them, mid-argument. → *"The house
   position is that both of you need water."*
6. Chalkboard reads HAPPY HOUR 4–?; Drew checking his wrist (no watch). →
   *"Happy hour coincides with the closing bell. This is called liquidity."*
7. TV reads BREAKING; the room is peaceful. → *"Turn it up, Abby. I want to
   hear nothing, louder."*
8. Mango mid-story, hand raised; Drew signaling Abby without looking away. →
   *"Three olives, Abby. It's a hearing day."*

## The caption log — what failed, and why it is worth knowing

Drew's character bible spent six rounds on one beak and came out with three
laws. They apply to captions, and the comedy side had learned none of them:

1. **Countable beats relational.** *"Short, dry, and underplayed"* moved
   nothing across ten cartoons. *"Six of ten are one sentence; the payload
   word goes last; at most three dollar-sign boards; four of ten at household
   height"* can be checked by anyone in under a minute, including the writer
   at 2 a.m.
2. **Negation summons.** An older draft of this document carried seven
   *nevers* and three named shapes, and got back captions in the three shapes.
   **Name the right thing instead of forbidding the wrong one.** That is what
   the lane index is for, and it is why four of the founder's own lanes had
   never once been written.
3. **The reference out-votes the text.** When a note has been reworded three
   times and nothing changes, stop rewording. Go back to the founder's seven
   and copy the *shape* — sentence count, last word, lane — not the subject.

**Standing entries.**

| Fault | Where it showed | The rule that now catches it |
| --- | --- | --- |
| An observation shipped as a joke | *"A symposium in the mountains…"* | The ten-second test |
| The two-beat crutch | 8 of the first 10 | One sentence, six of ten |
| Ending on a function word | *"…make one." "They renew it." "…lives in."* | The payload word goes last |
| Nobody in the sentence | 6 of the first 10 | Somebody inside, eight of ten |
| The caption echoing the board | 6 of the first 10 | Three angles, three vocabularies |
| Board monoculture | 6 of 10 priced a noun; 5 landed on $18–$19 | Seven board devices, no repeats, max three prices |
| One mechanism, six times | 6 of 10 turned the headline into a bar object | No two captions share a lane |
| Same desk three times in a week | one central bank, two identical figures | Desk caps in Batch composition |
| Wallet height at zero | all ten | Four of ten at household height; the Itemised Bill |
| A signature worn into a tic | *"It is called X"* ×3 across canon and ships | The kill list |
| A rich man's joke over a household in distress | a golf gag pinned to a kitchen-table chyron | Scan question 4; The Mispinned Panel |
| A caption aimed at an unnamed person | *"Her target follows the price…"* | Scan question 2 — delete the person and see |

**This table grows.** When the founder's feedback names a recurring caption
fault, it is added here with the countable rule that catches it — never with
an adjective.