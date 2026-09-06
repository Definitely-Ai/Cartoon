import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshot = JSON.parse(fs.readFileSync(path.join(root, "lib/studio-reports-snapshot.json"), "utf8"));

function loadReportService(fetch) {
  const load = (file, require) => {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(compiled, { module, exports: module.exports, require, fetch, Response, AbortSignal, URLSearchParams, process: { env: {} }, Date, Intl, console });
    return module.exports;
  };
  const core = load("lib/studio-reports-core.ts", () => { throw new Error("Unexpected dependency"); });
  return load("lib/studio-reports.ts", (name) => {
    if (name === "./studio-reports-core") return core;
    if (name === "./studio-reports-snapshot.json") return snapshot;
    throw new Error(`Unexpected dependency ${name}`);
  });
}

function githubRecord(sha, date) {
  return { sha, commit: { message: "fix: improve the report", committer: { date }, author: { date } }, parents: [{ sha: "parent" }] };
}

test("a successful current-day check can establish zero GitHub updates", async () => {
  let calls = 0;
  const service = loadReportService(async () => {
    calls++;
    return Response.json([githubRecord("a".repeat(40), "2026-09-03T02:00:00Z")]);
  });
  const report = await service.getStudioReport("2026-09-03");
  assert.equal(report.source, "live");
  assert.equal(report.complete, true);
  assert.equal(report.commits.length, 0);
  assert.ok(report.checkedAt);
  assert.equal(calls, 1);
});

test("a failed live lookup retains dated evidence and never claims a live zero", async () => {
  const service = loadReportService(async () => new Response("Rate limited", { status: 403 }));
  const day = snapshot.commits[0].day;
  const report = await service.getStudioReport(day);
  assert.equal(report.source, "snapshot");
  assert.equal(report.checkedAt, snapshot.githubCheckedAt);
  assert.equal(report.commits.length, snapshot.commits.filter((commit) => commit.day === day).length);
  assert.match(report.notes[0], /limiting requests/);
});

test("live pagination includes later pages and fetches new file evidence", async () => {
  const first = githubRecord("b".repeat(40), "2026-09-03T15:00:00Z");
  const second = githubRecord("c".repeat(40), "2026-09-03T14:00:00Z");
  const calls = [];
  const service = loadReportService(async (url) => {
    calls.push(url);
    if (url.includes("/commits?")) {
      return url.endsWith("&page=1")
        ? Response.json([first], { headers: { Link: '<https://api.github.com/next>; rel="next"' } })
        : Response.json([second]);
    }
    return Response.json({ ...first, files: [{ filename: "canon/plates/room.png", status: "added" }] });
  });
  const report = await service.getStudioReport("2026-09-03");
  assert.equal(report.source, "live");
  assert.equal(report.complete, true);
  assert.equal(report.commits.length, 2);
  assert.ok(report.commits.every((commit) => commit.filesComplete && commit.files[0].path === "canon/plates/room.png"));
  assert.equal(calls.length, 4);
  await service.getStudioReport("2026-09-03");
  assert.equal(calls.length, 4, "short-lived server cache avoids repeating a successful check");
  await service.getStudioReport("2026-09-03", true);
  assert.equal(calls.length, 8, "explicit refresh performs a new check");
});
