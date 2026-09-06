export const meta = {
  name: 'inspect-local',
  description: 'Read every panel of a LOCAL batch folder against canon/INSPECTION.md; confirm each claimed fault independently',
  whenToUse: 'After scripts/draw-local.mjs draws a batch, before the founder sees it. Pass the ABSOLUTE batch folder as args.',
  phases: [
    { title: 'Inspect', detail: 'one reader per panel image, rulebook from canon/INSPECTION.md' },
    { title: 'Confirm', detail: 'independent second opinion on every claimed fatal' },
  ],
}

// Twin of inspect-batch.js for batches drawn on the studio's own GPU from a
// Windows checkout. args: { batch: "<absolute folder>", files?: ["01-….png", …] }
// — when files is omitted every *.png at the top of the folder is read (rolls
// included), so a multi-roll batch is judged roll by roll.

if (!args || typeof args !== 'object' || !args.batch) {
  throw new Error('Pass { batch: "<absolute batch folder>", files?: [...] } as args')
}
const BATCH = String(args.batch).replace(/[\\/]+$/, '')
const REPO = 'Z:\\ImageGenerator\\Cartoon'

const FINDING_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['score', 'note', 'fatal', 'minor', 'regions'],
  properties: {
    score: { type: 'integer', minimum: 1, maximum: 10, description: 'As the founder would score the SCENE; 6+ = printable.' },
    note: { type: 'string', description: 'First impression in one or two plain sentences, faults before praise.' },
    fatal: { type: 'array', items: { type: 'string' }, description: 'Redraw-level faults, each as "region: what is wrong".' },
    minor: { type: 'array', items: { type: 'string' } },
    regions: { type: 'array', items: { type: 'string' }, description: 'The regions actually examined at 100% (bottom edge, each head, each pair of hands, each arm, every piece of lettering, every prop).' },
  },
}
const CONFIRM_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['real', 'reason'],
  properties: { real: { type: 'boolean' }, reason: { type: 'string', description: 'What you actually see at that spot.' } },
}
const SETUP_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['files', 'rules'],
  properties: {
    files: { type: 'array', items: { type: 'string' } },
    rules: { type: 'string', description: 'the full text of canon/INSPECTION.md, verbatim' },
  },
}

phase('Inspect')
const setup = await agent(
  `List every *.png file directly inside the folder ${BATCH} (not in subfolders), sorted by name` +
  (args.files ? `, but keep only these: ${JSON.stringify(args.files)}` : '') +
  `. Then read ${REPO}\\canon\\INSPECTION.md and return its complete verbatim text as "rules". Return data only.`,
  { label: 'setup', phase: 'Inspect', schema: SETUP_SCHEMA, effort: 'low' }
)
if (!setup || !setup.files?.length) throw new Error('setup agent returned no panel list')
const RULES = setup.rules
log(`${setup.files.length} images, rulebook ${RULES.length} chars`)

const results = await pipeline(
  setup.files,
  (file) => agent(
    `You are inspecting one finished cartoon panel against the studio's fault checklist.\n\n${RULES}\n\n` +
    `Also read ${REPO}\\canon\\creation\\PANEL-INSPECTION.md for the METHOD: look whole once, then crop and enlarge each region, then sweep; ` +
    `say what is wrong before what is right.\n\n` +
    `Open ${BATCH}\\${file} and study it region by region — zoom into the bottom edge, each head, each pair of hands, each arm, ` +
    `the bottle labels, the television picture and chyron, the chalkboard, the window lettering and the counter line. The cast, caption ` +
    `and full prompt are in ${BATCH}\\${file.replace(/(\.r\d+)?\.png$/, '$1.txt')} — read it; lettering the brief did not ask for is a fault, ` +
    `and a character the brief did not cast is fatal. Compare each face with its study: ${REPO}\\canon\\vision\\studies\\drew.png, ` +
    `barclay.png, abby.png. Report only what you can SEE, quoting any lettering exactly. Score as the founder would: 6 or better means printable.`,
    { label: `inspect:${file.slice(0, 2)}`, phase: 'Inspect', schema: FINDING_SCHEMA, effort: 'high' }
  ).then((r) => ({ file, r })),
  ({ file, r }) => {
    if (!r || r.fatal.length === 0) {
      return Promise.resolve({ file, ...(r ?? { score: null, note: 'inspector returned nothing', minor: [], regions: [] }), confirmedFatal: [] })
    }
    return parallel(r.fatal.map((f) => () =>
      agent(
        `${RULES}\n\nOpen ${BATCH}\\${file}. Someone claims this fault:\n\n    "${f}"\n\n` +
        `Go to that exact region, crop and enlarge it, and look hard. Confirm only what is genuinely visible; be fair in both directions.`,
        { label: `confirm:${file.slice(0, 2)}`, phase: 'Confirm', schema: CONFIRM_SCHEMA, effort: 'high' }
      ).then((v) => (v && v.real ? f : null))
    )).then((votes) => {
      const confirmedFatal = votes.filter(Boolean)
      log(`${file}: score ${r.score}, ${r.fatal.length} claimed -> ${confirmedFatal.length} confirmed`)
      return { file, ...r, confirmedFatal }
    })
  }
)

const clean = results.filter(Boolean)
const pass = clean.filter((x) => x.confirmedFatal.length === 0 && (x.score ?? 0) >= 6)
const redraw = clean.filter((x) => x.confirmedFatal.length > 0 || (x.score ?? 0) < 6)
log(`PASS ${pass.length}/${setup.files.length} — REDRAW ${redraw.length}/${setup.files.length}`)
return {
  batch: BATCH,
  pass: pass.map((x) => ({ file: x.file, score: x.score, note: x.note, minor: x.minor })),
  redraw: redraw.map((x) => ({ file: x.file, score: x.score, fatal: x.confirmedFatal, claimed: x.fatal, note: x.note, minor: x.minor })),
  meanScore: clean.length ? Math.round(clean.reduce((a, x) => a + (x.score ?? 0), 0) / clean.length * 10) / 10 : null,
}
