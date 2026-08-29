export const meta = {
  name: 'inspect-batch',
  description: 'Read every panel of a batch against canon/INSPECTION.md; confirm each claimed fault independently',
  whenToUse: 'After a batch draws, before the founder sees it. Pass the batch folder name as args.',
  phases: [
    { title: 'Inspect', detail: 'one reader per panel, rulebook from canon/INSPECTION.md' },
    { title: 'Confirm', detail: 'independent second opinion on every claimed fatal' },
  ],
}

// args: the batch folder name under briefs/, e.g.
//   "20260829-142804-twenty-five-cartoons-at-the-bar"
// The rulebook is NOT baked into this script on purpose: it is read from
// canon/INSPECTION.md at run time, so a mistake added to the checklist once is
// checked on every batch after, with no workflow edit.

if (!args || typeof args !== 'string') {
  throw new Error('Pass the batch folder name as args, e.g. "20260829-142804-twenty-five-cartoons-at-the-bar"')
}
const BATCH = `/home/user/Cartoon/briefs/${args}`

const FINDING_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['score', 'note', 'fatal', 'minor'],
  properties: {
    score: { type: 'integer', minimum: 1, maximum: 10, description: 'As the founder would score it; 6+ = printable.' },
    note: { type: 'string', description: 'One or two plain sentences.' },
    fatal: { type: 'array', items: { type: 'string' }, description: 'Redraw-level faults, each as "region: what is wrong".' },
    minor: { type: 'array', items: { type: 'string' } },
  },
}
const CONFIRM_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['real', 'reason'],
  properties: {
    real: { type: 'boolean' },
    reason: { type: 'string', description: 'What you actually see at that spot.' },
  },
}
const PANELS_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['files', 'rules'],
  properties: {
    files: { type: 'array', items: { type: 'string' }, description: 'panel .png filenames from plan.json, in order' },
    rules: { type: 'string', description: 'the full text of canon/INSPECTION.md, verbatim' },
  },
}

phase('Inspect')

// One cheap agent gathers the ground truth: the panel list from the plan and
// the current rulebook. Everything downstream conditions on its output, so the
// inspection always runs against today's checklist, not a stale copy.
const setup = await agent(
  `Read /home/user/Cartoon/briefs/${args}/plan.json and return every panel's "file" value in order, ` +
  `plus the complete verbatim text of /home/user/Cartoon/canon/INSPECTION.md as "rules". Return data only.`,
  { label: 'setup', phase: 'Inspect', schema: PANELS_SCHEMA, effort: 'low' }
)
if (!setup || !setup.files?.length) throw new Error('setup agent returned no panel list')
const RULES = setup.rules
log(`${setup.files.length} panels, rulebook ${RULES.length} chars`)

const results = await pipeline(
  setup.files,
  (file) => agent(
    `You are inspecting one finished cartoon panel against the studio's fault checklist.\n\n${RULES}\n\n` +
    `Open ${BATCH}/${file} and study it region by region — zoom into faces, hands, bottle labels, the ` +
    `television picture, and the counter line. The cast list and full prompt are in ` +
    `${BATCH}/${file.replace(/\.png$/, '.txt')} — read it; lettering the brief did not ask for is a fault, ` +
    `and a character the brief did not cast is fatal. Report only what you can SEE, quoting any lettering ` +
    `exactly. Score as the founder would: 6 or better means printable.`,
    { label: `inspect:${file.slice(0, 2)}`, phase: 'Inspect', schema: FINDING_SCHEMA, model: 'sonnet' }
  ).then((r) => ({ file, r })),
  ({ file, r }) => {
    if (!r || r.fatal.length === 0) {
      return Promise.resolve({ file, ...(r ?? { score: null, note: 'inspector returned nothing', minor: [] }), confirmedFatal: [] })
    }
    // Every claimed fatal costs a redraw, so each gets a fresh pair of eyes
    // that has not seen the first reader's reasoning. Past rounds produced
    // false alarms that would have discarded good panels AND excuses that
    // would have shipped bad ones; the second opinion is told to be fair in
    // both directions.
    return parallel(r.fatal.map((f) => () =>
      agent(
        `${RULES}\n\nOpen ${BATCH}/${file}. Someone claims this fault:\n\n    "${f}"\n\n` +
        `Go to that exact region and look hard. Confirm only what is genuinely visible; be fair in both directions.`,
        { label: `confirm:${file.slice(0, 2)}`, phase: 'Confirm', schema: CONFIRM_SCHEMA, model: 'opus' }
      ).then((v) => (v && v.real ? f : null))
    )).then((votes) => {
      const confirmedFatal = votes.filter(Boolean)
      log(`${file.slice(0, 2)}: score ${r.score}, ${r.fatal.length} claimed -> ${confirmedFatal.length} confirmed`)
      return { file, ...r, confirmedFatal }
    })
  }
)

const clean = results.filter(Boolean)
const pass = clean.filter((x) => x.confirmedFatal.length === 0 && (x.score ?? 0) >= 6)
const redraw = clean.filter((x) => x.confirmedFatal.length > 0 || (x.score ?? 0) < 6)
log(`PASS ${pass.length}/${setup.files.length} — REDRAW ${redraw.length}/${setup.files.length}`)
return {
  batch: args,
  pass: pass.map((x) => ({ file: x.file, score: x.score })),
  redraw: redraw.map((x) => ({ file: x.file, score: x.score, fatal: x.confirmedFatal, note: x.note })),
  meanScore: clean.length ? Math.round(clean.reduce((a, x) => a + (x.score ?? 0), 0) / clean.length * 10) / 10 : null,
}
