import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AutomationError, validateEditionInput, nextPlannedRuns, locationCoverage, readAutomationRequest,
} from '../lib/automation-studio-core.ts';

const now = new Date('2026-09-14T14:00:00Z');
const fixture = (patch = {}) => ({
  location: { name: 'Naples', region: 'Florida', country: 'US', timezone: 'America/New_York', coverage: 'city' },
  audience: 'Local newspaper readers who enjoy light, nonpartisan money humor.',
  quantity: 6, cast: 'mixed',
  timing: { mode: 'once', date: '2026-09-15', time: '09:00', weekdays: [] },
  ...patch,
});
const bad = (callback, status = 400) => assert.throws(callback, e => e instanceof AutomationError && e.status === status);
const request = (body, headers = {}, url = 'https://example.test/api/studio/automation') => new Request(url, {
  method: 'POST', body,
  headers: { origin: 'https://example.test', 'content-type': 'application/json', ...headers },
});

test('input normalizes strings and weekly days without mutating the caller', () => {
  const raw = fixture({ audience: '  Friendly local readers  ', timing: { mode: 'weekly', date: '2026-09-14', time: '09:00', weekdays: [5, 1, 5] } });
  const validated = validateEditionInput(raw, now);
  assert.equal(validated.audience, 'Friendly local readers');
  assert.deepEqual(validated.timing.weekdays, [1, 5]);
  assert.deepEqual(raw.timing.weekdays, [5, 1, 5]);
});

test('all object levels require exact keys and forbid an active-status claim', () => {
  bad(() => validateEditionInput({ ...fixture(), status: 'active' }, now));
  const missing = fixture(); delete missing.cast;
  bad(() => validateEditionInput(missing, now));
  bad(() => validateEditionInput(fixture({ location: { ...fixture().location, lat: 26 } }), now));
  bad(() => validateEditionInput(fixture({ timing: { ...fixture().timing, cron: '* * * * *' } }), now));
  bad(() => validateEditionInput([] , now));
});

test('bounded strings, quantity, enums, times and weekday values are enforced', () => {
  for (const quantity of [0, 13, 1.5, NaN, '3']) bad(() => validateEditionInput(fixture({ quantity }), now));
  bad(() => validateEditionInput(fixture({ audience: 'x'.repeat(601) }), now));
  bad(() => validateEditionInput(fixture({ audience: 'hello\u0000there' }), now));
  bad(() => validateEditionInput(fixture({ cast: 'all' }), now));
  for (const time of ['9:00', '24:00', '09:60', '09:00:00']) {
    bad(() => validateEditionInput(fixture({ timing: { ...fixture().timing, time } }), now));
  }
  for (const weekdays of [[], [7], [-1], [1.5], ['1']]) {
    bad(() => validateEditionInput(fixture({ timing: { ...fixture().timing, mode: 'weekly', weekdays } }), now));
  }
});

test('timezone and real calendar validation reject impossible dates', () => {
  for (const timezone of ['Not/AZone', '+04:00']) {
    bad(() => validateEditionInput(fixture({ location: { ...fixture().location, timezone } }), now));
  }
  for (const date of ['2026-02-29', '2026-13-01', '2026-9-15', '2026-09-31']) {
    bad(() => validateEditionInput(fixture({ timing: { ...fixture().timing, date } }), now));
  }
  bad(() => validateEditionInput(fixture(), new Date('invalid')));
});

test('creation rejects past dates, past one-off times and over-one-year starts', () => {
  bad(() => validateEditionInput(fixture({ timing: { ...fixture().timing, date: '2026-09-13' } }), now));
  bad(() => validateEditionInput(fixture({ timing: { ...fixture().timing, date: '2026-09-14', time: '09:59' } }), now));
  bad(() => validateEditionInput(fixture({ timing: { ...fixture().timing, date: '2027-09-15' } }), now));
  assert.equal(validateEditionInput(fixture({ timing: { ...fixture().timing, date: '2027-09-14' } }), now).timing.date, '2027-09-14');
  bad(() => validateEditionInput(fixture({ timing: { ...fixture().timing, mode: 'daily', date: '2026-09-13' } }), now));
});

test('now previews the actual instant in the location timezone, not a fake worker run', () => {
  const input = validateEditionInput(fixture({ timing: { mode: 'now', date: '2026-09-14', time: '00:00', weekdays: [] } }), now);
  const runs = nextPlannedRuns(input, now);
  assert.equal(runs.length, 1); assert.equal(runs[0].at, now.toISOString());
  assert.equal(runs[0].localDate, '2026-09-14'); assert.match(runs[0].label, /America\/New_York/);
  assert.equal('status' in runs[0], false);
  bad(() => validateEditionInput(fixture({ timing: { ...fixture().timing, mode: 'now' } }), now));
});

test('date boundary is local, not UTC, including fractional-offset zones', () => {
  const clock = new Date('2026-09-14T20:00:00Z');
  const input = fixture({ location: { ...fixture().location, timezone: 'Asia/Kathmandu' }, timing: { mode: 'now', date: '2026-09-15', time: '00:00', weekdays: [] } });
  assert.equal(nextPlannedRuns(validateEditionInput(input, clock), clock)[0].localDate, '2026-09-15');
  const once = fixture({ ...input, timing: { ...input.timing, mode: 'once', time: '09:00' } });
  assert.equal(nextPlannedRuns(validateEditionInput(once, clock), clock)[0].at, '2026-09-15T03:15:00.000Z');
});

test('one-off spring clock gap rejects rather than silently shifting the hour', () => {
  const clock = new Date('2027-03-13T12:00:00Z');
  const raw = fixture({ timing: { mode: 'once', date: '2027-03-14', time: '02:30', weekdays: [] } });
  assert.throws(() => validateEditionInput(raw, clock), /does not exist/);
});

test('daily spring gap skips that day and returns the next real local dates', () => {
  const clock = new Date('2027-03-13T12:00:00Z');
  const input = validateEditionInput(fixture({ timing: { mode: 'daily', date: '2027-03-13', time: '02:30', weekdays: [] } }), clock);
  const runs = nextPlannedRuns(input, clock, 2);
  assert.deepEqual(runs.map(r => r.localDate), ['2027-03-15', '2027-03-16']);
  assert.equal(runs[0].at, '2027-03-15T06:30:00.000Z');
});

test('fall clock repeat chooses the earlier instant, once only', () => {
  const clock = new Date('2026-10-31T12:00:00Z');
  const input = validateEditionInput(fixture({ timing: { mode: 'daily', date: '2026-11-01', time: '01:30', weekdays: [] } }), clock);
  const runs = nextPlannedRuns(input, clock, 2);
  assert.deepEqual(runs.map(r => r.at), ['2026-11-01T05:30:00.000Z', '2026-11-02T06:30:00.000Z']);
  const afterEarlier = new Date('2026-11-01T06:00:00Z');
  assert.equal(nextPlannedRuns(input, afterEarlier, 1)[0].localDate, '2026-11-02');
  bad(() => validateEditionInput(fixture({ timing: { ...input.timing, mode: 'once' } }), afterEarlier));
});

test('half-hour DST gaps are skipped too', () => {
  const clock = new Date('2026-10-02T12:00:00Z');
  const input = validateEditionInput(fixture({ location: { ...fixture().location, timezone: 'Australia/Lord_Howe' }, timing: { mode: 'daily', date: '2026-10-04', time: '02:15', weekdays: [] } }), clock);
  const runs = nextPlannedRuns(input, clock, 2);
  assert.deepEqual(runs.map(r => r.localDate), ['2026-10-05', '2026-10-06']);
});

test('weekly matching uses local weekday and the start date, not UTC weekday', () => {
  const input = validateEditionInput(fixture({ timing: { mode: 'weekly', date: '2026-09-15', time: '23:30', weekdays: [1, 5] } }), now);
  const runs = nextPlannedRuns(input, now, 3);
  assert.deepEqual(runs.map(r => r.localDate), ['2026-09-18', '2026-09-21', '2026-09-25']);
  assert.equal(runs[0].at, '2026-09-19T03:30:00.000Z');
});

test('old saved recurring plans remain previewable while expired one-offs return no future run', () => {
  const input = fixture({ timing: { mode: 'daily', date: '2026-09-01', time: '11:00', weekdays: [] } });
  assert.equal(nextPlannedRuns(input, now, 1)[0].localDate, '2026-09-14');
  assert.deepEqual(nextPlannedRuns(fixture({ timing: { ...input.timing, mode: 'once' } }), now), []);
  for (const count of [0, 53, 1.5]) bad(() => nextPlannedRuns(input, now, count));
});

test('leap-day horizon clamps to February 28 and preview stays bounded', () => {
  const clock = new Date('2028-02-29T12:00:00Z');
  const input = fixture({ timing: { mode: 'daily', date: '2029-02-28', time: '09:00', weekdays: [] } });
  const normalized = validateEditionInput(input, clock);
  assert.equal(nextPlannedRuns(normalized, clock, 5).length, 1);
  bad(() => validateEditionInput(fixture({ timing: { ...input.timing, date: '2029-03-01' } }), clock));
});

test('location coverage is narrowly qualified, not inferred from near-matching names', () => {
  assert.equal(locationCoverage(fixture()).status, 'configured');
  assert.equal(locationCoverage(fixture({ location: { ...fixture().location, name: ' Naples ', region: 'FL', country: 'U.S.A.' } })).status, 'configured');
  assert.equal(locationCoverage(fixture({ location: { ...fixture().location, name: 'Sarasota' } })).status, 'pilot');
  for (const change of [{ name: 'North Naples' }, { name: 'Naples, Florida' }, { region: 'Texas' }, { country: 'Italy' }, { coverage: 'county' }]) {
    assert.equal(locationCoverage(fixture({ location: { ...fixture().location, ...change } })).status, 'needs-setup');
  }
});

test('same-origin JSON request returns the validated contract', async () => {
  const result = await readAutomationRequest(request(JSON.stringify(fixture()), { 'content-type': 'application/json; charset=utf-8' }), now);
  assert.deepEqual(result, fixture());
});

test('foreign/missing origins and non-JSON types are rejected', async () => {
  for (const origin of ['https://evil.test', 'null', 'https://example.test.evil.test', '']) {
    await assert.rejects(readAutomationRequest(request('{}', { origin }), now), e => e.status === 403);
  }
  await assert.rejects(readAutomationRequest(request('{}', { 'content-type': 'text/plain' }), now), e => e.status === 415);
  const noOrigin = new Request('https://example.test/api', { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } });
  await assert.rejects(readAutomationRequest(noOrigin, now), e => e.status === 403);
});

test('body limits count real streamed bytes even with a misleading Content-Length', async () => {
  await assert.rejects(readAutomationRequest(request('{}', { 'content-length': '12289' }), now), e => e.status === 413);
  await assert.rejects(readAutomationRequest(request(' '.repeat(12289), { 'content-length': '2' }), now), e => e.status === 413);
  await assert.rejects(readAutomationRequest(request('{}', { 'content-length': 'wat' }), now), e => e.status === 400);
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(7000)); controller.enqueue(new Uint8Array(7000)); },
    cancel() { cancelled = true; },
  });
  const req = new Request('https://example.test/api', { method: 'POST', body: stream, duplex: 'half', headers: { origin: 'https://example.test', 'content-type': 'application/json' } });
  await assert.rejects(readAutomationRequest(req, now), e => e.status === 413);
  assert.equal(cancelled, true);
});

test('empty, malformed, invalid-UTF8, and unknown-key bodies fail without reaching persistence', async () => {
  for (const body of ['', '{', 'null', JSON.stringify({ ...fixture(), active: true }), new Uint8Array([0xc3, 0x28])]) {
    await assert.rejects(readAutomationRequest(request(body), now), e => e.status === 400);
  }
});
