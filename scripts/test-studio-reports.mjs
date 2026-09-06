import assert from "node:assert/strict";
import test from "node:test";
import { easternDay, githubWindow, imageChanges, readableSubject, summarizeReport, validReportDay } from "../lib/studio-reports-core.ts";

test("Eastern dates put overnight UTC work on the actual local day", () => {
  assert.equal(easternDay("2026-09-03T02:15:00Z"), "2026-09-02");
  assert.equal(easternDay("2026-09-03T04:15:00Z"), "2026-09-03");
  assert.equal(easternDay("2026-01-03T04:30:00Z"), "2026-01-02");
  assert.equal(easternDay("2026-01-03T05:30:00Z"), "2026-01-03");
});

test("invalid calendar dates are rejected; DST days fit the GitHub fetch interval", () => {
  assert.equal(validReportDay("2026-02-30"), false);
  assert.equal(validReportDay("2028-02-29"), true);
  assert.equal(validReportDay("2026-9-3"), false);
  for (const [day, first, last] of [
    ["2026-03-08", "2026-03-08T05:00:00Z", "2026-03-09T03:59:59Z"],
    ["2026-11-01", "2026-11-01T04:00:00Z", "2026-11-02T04:59:59Z"],
  ]) {
    const range = githubWindow(day);
    assert.ok(new Date(range.since) <= new Date(first));
    assert.ok(new Date(range.until) >= new Date(last));
    assert.equal(easternDay(first), day);
    assert.equal(easternDay(last), day);
  }
});

const commit = (sha, committedAt, files, merge = false) => ({ sha, committedAt, files, merge, day: easternDay(committedAt), subject: "fix(gallery): revise duo reference", filesComplete: true });

test("daily picture evidence uses the last saved version and omits deleted files", () => {
  const commits = [
    commit("old", "2026-09-02T13:00:00Z", [{ path: "canon/old.png", status: "added" }, { path: "canon/room.png", status: "added" }]),
    commit("new", "2026-09-02T14:00:00Z", [{ path: "canon/old.png", status: "removed" }, { path: "canon/room.png", status: "modified" }]),
    commit("merge", "2026-09-02T15:00:00Z", [{ path: "canon/room.png", status: "modified" }], true),
  ];
  assert.deepEqual(imageChanges(commits), [{ path: "canon/room.png", status: "modified", sha: "new" }]);
  assert.equal(summarizeReport(commits)[0].fileCount, 2);
  assert.equal(summarizeReport(commits)[0].changes.length, 1);
  assert.equal(readableSubject("fix(gallery): revise duo reference"), "Revise two-character scene reference");
});
