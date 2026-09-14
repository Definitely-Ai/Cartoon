/** Pure edition planning. Nothing in this module starts a worker or a schedule. */
export class AutomationError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'AutomationError';
    this.status = status;
  }
}

export type EditionInput = {
  location: {
    name: string;
    region: string;
    country: string;
    timezone: string;
    coverage: 'city' | 'town' | 'county' | 'area';
  };
  audience: string;
  quantity: number;
  cast: 'duo' | 'trio' | 'mixed';
  timing: {
    mode: 'now' | 'once' | 'daily' | 'weekly';
    date: string;
    time: string;
    weekdays: number[];
  };
};

export type SavedEditionPlan = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: 'planned' | 'archived';
  input: EditionInput;
};

export type PlannedRun = { at: string; localDate: string; label: string };
export type LocationCoverage = {
  status: 'configured' | 'pilot' | 'needs-setup';
  label: string;
  detail: string;
};

const DAY = 86_400_000;
const REQUEST_LIMIT = 12 * 1024;
const formatters = new Map<string, Intl.DateTimeFormat>();

function fail(message: string): never {
  throw new AutomationError(400, message);
}

function exactObject(raw: unknown, keys: string[], label: string): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail(`${label} must be an object.`);
  const value = raw as Record<string, unknown>;
  const actual = Object.keys(value);
  if (actual.length !== keys.length || actual.some(key => !keys.includes(key))) {
    fail(`${label} must contain exactly: ${keys.join(', ')}.`);
  }
  return value;
}

function boundedText(raw: unknown, label: string, max: number): string {
  if (typeof raw !== 'string') fail(`${label} must be text.`);
  const value = raw.trim();
  if (!value || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) {
    fail(`${label} must contain 1–${max} characters without control characters.`);
  }
  return value;
}

function choice<T extends string>(raw: unknown, allowed: readonly T[], label: string): T {
  if (typeof raw !== 'string' || !allowed.includes(raw as T)) fail(`Invalid ${label}.`);
  return raw as T;
}

function validClock(now: Date): void {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) fail('A valid planning clock is required.');
}

function dayNumber(date: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('Date must use YYYY-MM-DD.');
  const timestamp = Date.parse(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) {
    fail('Date must be a real calendar date.');
  }
  return timestamp;
}

function formatter(timezone: string): Intl.DateTimeFormat {
  const existing = formatters.get(timezone);
  if (existing) return existing;
  let result: Intl.DateTimeFormat;
  try {
    // Numeric fixed offsets are not named IANA zones. UTC and IANA aliases are allowed.
    if (/^[+-]/.test(timezone)) fail('Choose a valid IANA timezone.');
    result = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
      timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    });
  } catch {
    fail('Choose a valid IANA timezone, such as America/New_York.');
  }
  // Keep process memory bounded when handling many independently supplied locations.
  if (formatters.size >= 64) formatters.delete(formatters.keys().next().value!);
  formatters.set(timezone, result);
  return result;
}

function localParts(timestamp: number, timezone: string): { date: string; time: string; second: string } {
  const parts = formatter(timezone).formatToParts(new Date(timestamp));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)!.value;
  return {
    date: `${part('year').padStart(4, '0')}-${part('month')}-${part('day')}`,
    time: `${part('hour')}:${part('minute')}`,
    second: part('second'),
  };
}

function horizonDate(today: string): string {
  const [year, month, date] = today.split('-').map(Number);
  // A calendar year from leap day ends on February 28, not March 1.
  const nextDate = month === 2 && date === 29 ? 28 : date;
  return `${year + 1}-${String(month).padStart(2, '0')}-${String(nextDate).padStart(2, '0')}`;
}

/** Return the earlier matching instant, or null for a skipped/nonexistent wall time.
 * Nearby offsets cover ordinary DST, half-hour transitions, and date-line jumps.
 * Testing each candidate against Intl prevents an offset guess from becoming a run.
 */
function localInstant(date: string, time: string, timezone: string): number | null {
  const wall = Date.parse(`${date}T${time}:00.000Z`);
  const offsets = new Set<number>();
  for (let hours = -48; hours <= 48; hours += 6) {
    const sample = wall + hours * 3_600_000;
    const parts = localParts(sample, timezone);
    offsets.add(Date.parse(`${parts.date}T${parts.time}:${parts.second}.000Z`) - sample);
  }
  const matches: number[] = [];
  for (const offset of offsets) {
    const candidate = wall - offset;
    const parts = localParts(candidate, timezone);
    if (parts.date === date && parts.time === time && parts.second === '00') matches.push(candidate);
  }
  return matches.length ? Math.min(...matches) : null;
}

export function validateEditionInput(raw: unknown, now: Date = new Date()): EditionInput {
  validClock(now);
  const root = exactObject(raw, ['location', 'audience', 'quantity', 'cast', 'timing'], 'Edition input');
  const place = exactObject(root.location, ['name', 'region', 'country', 'timezone', 'coverage'], 'Location');
  const timing = exactObject(root.timing, ['mode', 'date', 'time', 'weekdays'], 'Timing');
  const location: EditionInput['location'] = {
    name: boundedText(place.name, 'Location name', 80),
    region: boundedText(place.region, 'Region', 80),
    country: boundedText(place.country, 'Country', 64),
    timezone: boundedText(place.timezone, 'Timezone', 80),
    coverage: choice(place.coverage, ['city', 'town', 'county', 'area'], 'location coverage'),
  };
  formatter(location.timezone);
  const audience = boundedText(root.audience, 'Audience', 600);
  if (typeof root.quantity !== 'number' || !Number.isInteger(root.quantity) || root.quantity < 1 || root.quantity > 12) {
    fail('Quantity must be a whole number from 1 to 12.');
  }
  const cast = choice(root.cast, ['duo', 'trio', 'mixed'], 'cast');
  const mode = choice(timing.mode, ['now', 'once', 'daily', 'weekly'], 'timing mode');
  if (typeof timing.date !== 'string') fail('Date must use YYYY-MM-DD.');
  dayNumber(timing.date);
  if (typeof timing.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(timing.time)) fail('Time must use 24-hour HH:mm.');
  if (!Array.isArray(timing.weekdays) || timing.weekdays.length > 7 ||
      timing.weekdays.some(day => typeof day !== 'number' || !Number.isInteger(day) || day < 0 || day > 6)) {
    fail('Weekdays must be an array of at most seven integers, from 0 (Sunday) to 6 (Saturday).');
  }
  const weekdays = [...new Set(timing.weekdays as number[])].sort((a, b) => a - b);
  if (mode === 'weekly' && !weekdays.length) fail('Choose at least one weekday for a weekly plan.');
  const today = localParts(now.getTime(), location.timezone).date;
  if (timing.date < today) fail('The planned start date cannot be in the past.');
  if (timing.date > horizonDate(today)) fail('The planned start date must be within one calendar year.');
  if (mode === 'now' && timing.date !== today) fail('An immediate plan must use today in the location timezone.');
  if (mode === 'once') {
    const at = localInstant(timing.date, timing.time, location.timezone);
    if (at === null) fail('That local time does not exist because the clocks change. Choose another time.');
    if (at < now.getTime()) fail('The one-off planned time cannot be in the past.');
  }
  return {
    location, audience, quantity: root.quantity, cast,
    timing: { mode, date: timing.date, time: timing.time, weekdays },
  };
}

/** Preview only; there is no active scheduler. At most one run per local day.
 * Recurring plans skip nonexistent spring-forward times. A repeated fall-back time
 * uses its earlier instant only; if that instant has passed, the day is skipped.
 * Occurrences beyond one calendar year from the preview clock are not returned.
 * Saved, older recurring plans can still be previewed without rewriting their date.
 */
export function nextPlannedRuns(input: EditionInput, now: Date = new Date(), count = 5): PlannedRun[] {
  validClock(now);
  if (!Number.isInteger(count) || count < 1 || count > 52) fail('Preview count must be from 1 to 52.');
  const timezone = input.location.timezone;
  const today = localParts(now.getTime(), timezone).date;
  const endDate = horizonDate(today);
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
  const run = (timestamp: number, date: string): PlannedRun => ({
    at: new Date(timestamp).toISOString(), localDate: date,
    label: `${dateLabel.format(new Date(timestamp))} (${timezone})`,
  });
  const timing = input.timing;
  if (timing.mode === 'now') return [run(now.getTime(), today)];
  if (timing.mode === 'once') {
    if (timing.date < today || timing.date > endDate) return [];
    const at = localInstant(timing.date, timing.time, timezone);
    return at !== null && at >= now.getTime() ? [run(at, timing.date)] : [];
  }
  const result: PlannedRun[] = [];
  const start = dayNumber(timing.date > today ? timing.date : today);
  const end = dayNumber(endDate);
  for (let day = start; day <= end && result.length < count; day += DAY) {
    const calendarDate = new Date(day);
    if (timing.mode === 'weekly' && !timing.weekdays.includes(calendarDate.getUTCDay())) continue;
    const date = calendarDate.toISOString().slice(0, 10);
    const at = localInstant(date, timing.time, timezone);
    if (at !== null && at >= now.getTime()) result.push(run(at, date));
  }
  return result;
}

export function locationCoverage(input: EditionInput): LocationCoverage {
  const place = input.location;
  const normalize = (value: string) => value.trim().toLowerCase().replace(/\./g, '');
  const us = ['us', 'usa', 'united states', 'united states of america'].includes(normalize(place.country));
  const florida = ['fl', 'florida'].includes(normalize(place.region));
  if (place.coverage === 'city' && florida && us && normalize(place.name) === 'naples') {
    return {
      status: 'configured', label: 'Naples sources configured',
      detail: 'Existing Naples research sources have supported reviewed local proofs. Sources still need current verification; this plan does not start a run.',
    };
  }
  if (place.coverage === 'city' && florida && us && normalize(place.name) === 'sarasota') {
    return {
      status: 'pilot', label: 'Sarasota source pilot',
      detail: 'A limited Sarasota discovery pilot exists. Source coverage and audience direction need review before production; this is not a proven end-to-end city edition.',
    };
  }
  return {
    status: 'needs-setup', label: 'Local source setup needed',
    detail: 'This location needs a reviewed audience brief and suitable authoritative source registry. Saving a plan does not establish local coverage or activate generation.',
  };
}

/** Same-origin, bounded JSON body. The body is EditionInput itself, not a wrapper. */
export async function readAutomationRequest(request: Request, now: Date = new Date()): Promise<EditionInput> {
  let expectedOrigin: string;
  try { expectedOrigin = new URL(request.url).origin; } catch { fail('Invalid request URL.'); }
  if (expectedOrigin === 'null' || request.headers.get('origin') !== expectedOrigin) {
    throw new AutomationError(403, 'A same-origin request is required.');
  }
  if (request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
    throw new AutomationError(415, 'Content-Type must be application/json.');
  }
  const length = request.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length)))) fail('Invalid Content-Length.');
  if (length !== null && Number(length) > REQUEST_LIMIT) throw new AutomationError(413, 'Request body exceeds 12 KiB.');
  if (!request.body) fail('A JSON request body is required.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > REQUEST_LIMIT) {
        await reader.cancel().catch(() => undefined);
        throw new AutomationError(413, 'Request body exceeds 12 KiB.');
      }
      chunks.push(chunk.value);
    }
  } catch (error) {
    if (error instanceof AutomationError) throw error;
    throw new AutomationError(400, 'The JSON request body could not be read.');
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let raw: unknown;
  try { raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new AutomationError(400, 'Request body must be valid UTF-8 JSON.'); }
  return validateEditionInput(raw, now);
}
