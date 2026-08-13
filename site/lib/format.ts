// Date formatting for print-style chrome. Hand-rolled month tables instead
// of Intl so build output never depends on the build machine's locale data.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// AP-style abbreviations, the ones a newspaper copy desk would use.
const MONTHS_AP = [
  "Jan.", "Feb.", "March", "April", "May", "June",
  "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec.",
];

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

function parts(iso: string): { y: number; m: number; d: number; weekday: number } {
  const [y, m, d] = iso.split("-").map(Number);
  // Zeller-free: Date.UTC is deterministic for a fixed Y-M-D.
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, weekday };
}

/** "August 1, 2026" */
export function formatDateLong(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "Aug. 1, 2026" */
export function formatDateAP(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${MONTHS_AP[m - 1]} ${d}, ${y}`;
}

/** "Saturday, August 1, 2026" — the full broadsheet dateline. */
export function formatDateline(iso: string): string {
  const { weekday } = parts(iso);
  return `${WEEKDAYS[weekday]}, ${formatDateLong(iso)}`;
}

/** 1-based day of the year for an ISO date — deterministic rotation index. */
export function dayOfYear(iso: string): number {
  const { y, m, d } = parts(iso);
  const start = Date.UTC(y, 0, 1);
  const today = Date.UTC(y, m - 1, d);
  return Math.round((today - start) / 86_400_000) + 1;
}
