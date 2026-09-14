import { nextPlannedRuns, validateEditionInput, type EditionInput } from "./automation-studio-core";
export type EditionSchedule = {
  id: string; requestId: string; input: EditionInput; status: "active" | "paused";
  createdAt: string; updatedAt: string; validatedAt: string; cursorAt: string;
};
/** Exclusive persisted cursor: never skip missed dates by starting from now. */
export function scheduleBatch(schedule: EditionSchedule, now = new Date()) {
  const input = validateEditionInput(schedule.input, new Date(schedule.validatedAt));
  if (input.timing.mode !== "daily" && input.timing.mode !== "weekly") throw Error("A recurring input is required.");
  const cursor = Date.parse(schedule.cursorAt), horizon = now.getTime() + 7 * 86400000;
  if (!Number.isFinite(cursor)) throw Error("Invalid schedule cursor.");
  if (cursor >= horizon || schedule.status !== "active") return { dates: [] as string[], nextCursor: schedule.cursorAt };
  const dates = nextPlannedRuns(input, new Date(cursor + 1), 52).map(run => run.at).filter(at => Date.parse(at) <= horizon);
  return { dates, nextCursor: dates.length === 52 ? dates[51] : new Date(horizon).toISOString() };
}
