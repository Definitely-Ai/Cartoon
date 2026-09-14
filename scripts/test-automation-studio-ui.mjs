// Focused component-logic regressions. This is a small hook/JSX harness, not a
// browser, hydration, layout, or accessibility-tree verification.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const source = file => fs.readFileSync(new URL(file, root), 'utf8');
const initialNow = '2026-09-15T03:59:30.000Z';
const example = { id: 'example', speaker: 'Drew', caption: 'Example.', tv: 'TEST', board: ['Test'], src: '/test.png', previewSrc: '/test.webp' };
const fixture = () => ({
  location: { name: 'Naples', region: 'Florida', country: 'US', timezone: 'America/New_York', coverage: 'city' },
  audience: 'Local readers', quantity: 3, cast: 'mixed',
  timing: { mode: 'now', date: '2026-09-14', time: '08:00', weekdays: [1] },
});
const plan = (id, input = fixture()) => ({ id, input, status: 'planned', createdAt: initialNow, updatedAt: initialNow });
const nodes = tree => !tree ? [] : Array.isArray(tree) ? tree.flatMap(nodes)
  : typeof tree !== 'object' ? [] : [tree, ...nodes(tree.props?.children)];
const find = (tree, predicate) => {
  const result = nodes(tree).find(predicate);
  assert.ok(result, 'Expected component element was rendered');
  return result;
};
const submit = tree => find(tree, node => node.type === 'button' && node.props.type === 'submit');
const alerts = tree => nodes(tree).filter(node => node.props?.role === 'alert').map(node => node.props.children);

function harness({ input = fixture(), now = initialNow, fetchImpl = async () => { throw Error('Unexpected network request'); } } = {}) {
  let currentNow = now;
  let cursor = 0;
  let mounted = false;
  const state = [input];
  const effects = [];
  const timers = [];
  const cleanups = [];
  const downloads = [];
  let downloadedBlob;
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [currentNow])); }
    static now() { return new Date(currentNow).getTime(); }
  }
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!Object.hasOwn(state, index)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    },
    useMemo: callback => callback(),
    useEffect: callback => { if (!mounted) effects.push(callback); },
  };
  const jsx = (type, props) => ({ type, props });
  const globals = {
    Date: ClockDate, Intl, Map, Set, Error, Blob, TextDecoder, Uint8Array, Request, Response, AbortController,
    fetch: (...args) => fetchImpl(...args),
    setInterval: callback => { timers.push(callback); return timers.length; }, clearInterval: () => {},
    setTimeout: callback => { callback(); return 1; },
    URL: { createObjectURL: blob => { downloadedBlob = blob; return 'blob:test'; }, revokeObjectURL: () => {} },
    document: { createElement: () => ({ click() { downloads.push(downloadedBlob); } }) },
  };
  function compile(file, require) {
    const exports = {};
    const compiled = ts.transpileModule(source(file), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
    } }).outputText;
    vm.runInNewContext(compiled, { ...globals, exports, require }, { filename: fileURLToPath(new URL(file, root)) });
    return exports;
  }
  const core = compile('lib/automation-studio-core.ts', () => { throw Error('Unexpected core import'); });
  const client = compile('app/(studio)/gallery/automation/AutomationStudio.tsx', name => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === '@/lib/automation-studio-core') return core;
    if (name === 'next/image' || name === 'next/link') return { default: 'next-component' };
    throw Error(`Unexpected client import: ${name}`);
  });
  return {
    state, downloads, core,
    render() { cursor = 0; const tree = client.default({ canManage: true, initialNow, examples: [example] }); mounted = true; return tree; },
    mountEffects() { for (const effect of effects.splice(0)) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); } },
    advance(next) { currentNow = next; for (const timer of timers) timer(); },
    dispose() { for (const cleanup of cleanups) cleanup(); },
  };
}

test('on-demand preview stays valid when the local day rolls over', () => {
  const h = harness({ fetchImpl: () => new Promise(() => {}) });
  assert.equal(submit(h.render()).props.disabled, false);
  h.mountEffects();
  h.advance('2026-09-15T04:00:30.000Z');
  const tree = h.render();
  assert.deepEqual(alerts(tree), []);
  assert.equal(submit(tree).props.disabled, false);
  assert.equal(h.state[0].timing.date, '2026-09-14', 'Preview must not mutate the editable input');
  h.dispose();
});

test('switching to on-demand with an incomplete timezone does not throw', () => {
  const input = fixture(); input.location.timezone = 'America/'; input.timing.mode = 'daily';
  const h = harness({ input });
  const option = find(h.render(), node => node.type === 'input' && node.props.type === 'radio' && node.props.value === 'now');
  assert.doesNotThrow(() => option.props.onChange());
  const tree = h.render();
  assert.equal(h.state[0].timing.mode, 'now');
  assert.equal(submit(tree).props.disabled, true);
  assert.match(alerts(tree)[0], /valid IANA timezone/);
});

test('a late initial list cannot erase a save confirmed while it was loading', async () => {
  let finishList;
  const saved = plan('new');
  const older = plan('old', { ...fixture(), audience: 'Older plan' });
  const h = harness({ fetchImpl: async (_url, options = {}) => options.method === 'POST'
    ? { ok: true, json: async () => ({ plan: saved }) }
    : new Promise(resolve => { finishList = resolve; }) });
  const tree = h.render(); h.mountEffects();
  await find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(Array.from(h.state[4], value => value.id), ['new']);
  finishList({ ok: true, json: async () => ({ plans: [{ ...saved, status: 'archived' }, older] }) });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(Array.from(h.state[4], value => value.id), ['new', 'old']);
  assert.equal(h.state[4][0].status, 'planned', 'An older list snapshot must not replace the confirmed save');
  h.dispose();
});

test('multiline audience notes validate in preview and normalize in the POST body', async () => {
  const input = fixture(); input.audience = '  Homeowners\n\nRetirees\r\n\tLocal business owners  ';
  let body;
  const h = harness({ input, fetchImpl: async (_url, options) => {
    body = JSON.parse(options.body);
    return { ok: true, json: async () => ({ plan: plan('saved', body) }) };
  } });
  const tree = h.render();
  assert.deepEqual(alerts(tree), []);
  assert.equal(submit(tree).props.disabled, false);
  await find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(body.audience, 'Homeowners Retirees Local business owners');
  assert.equal(h.state[0].audience, input.audience, 'Keep the owner’s textarea formatting while editing');
});

test('downloaded brief uses the current local date and normalized audience', async () => {
  const input = fixture(); input.audience = 'Retirees\n Professionals';
  const h = harness({ input, now: '2026-09-15T04:00:30.000Z' });
  const tree = h.render();
  find(tree, node => node.type === 'button' && node.props.children === 'Download edition brief').props.onClick();
  assert.equal(h.downloads.length, 1);
  const brief = JSON.parse(await h.downloads[0].text());
  assert.equal(brief.input.timing.date, '2026-09-15');
  assert.equal(brief.input.audience, 'Retirees Professionals');
  assert.equal(brief.executionEnabled, false);
});

test('all three named control groups expose the group role', () => {
  const input = fixture(); input.timing.mode = 'weekly';
  const tree = harness({ input }).render();
  for (const label of ['Weekly run days', 'Explore speaking poses', 'Explore production stages']) {
    assert.equal(find(tree, node => node.props?.['aria-label'] === label).props.role, 'group');
  }
});

test('normalization does not weaken wire validation or shift explicitly dated plans', () => {
  const input = fixture(); input.audience = 'Two\nlines';
  const h = harness();
  assert.throws(() => h.core.validateEditionInput(input), /control characters/);
  const dated = fixture(); dated.timing.mode = 'daily'; dated.timing.date = '2026-09-13';
  const tree = harness({ input: dated }).render();
  assert.equal(submit(tree).props.disabled, true);
  assert.match(alerts(tree)[0], /cannot be in the past/);
});
