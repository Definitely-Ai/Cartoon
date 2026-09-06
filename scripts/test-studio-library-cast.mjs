import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { filenameCast, promptCast, workflowCast, createLibraryCastResolver } from "./lib/studio-library-cast.mjs";

test("named files preserve current cast and the legacy Mango name", () => {
  assert.deepEqual(filenameCast("canon/characters/flamingo/full-body-sheet.png"), ["Drew"]);
  assert.deepEqual(filenameCast("Mango-Abbyface.png"), ["Barclay", "Abby"]);
  assert.deepEqual(filenameCast("gallery/B03-preview.jpg"), []);
});

test("long assembled prompts use selected sections, not generic references to absent cast", () => {
  const generic = "REFERENCE Drew, Barclay and Abby. Never add new people. ".repeat(100);
  assert.deepEqual(promptCast(`${generic}\nDREW. White flamingo.\nBARCLAY. Golden retriever.`, true), ["Drew", "Barclay"]);
  assert.deepEqual(promptCast(generic, true), []);
  assert.deepEqual(promptCast("SWDABBY smiling portrait in SWDINK"), ["Abby"]);
});

test("explicit exclusions avoid tagging absent characters", () => {
  assert.deepEqual(promptCast("Drew and Barclay at the counter. No Abby.", true), ["Drew", "Barclay"]);
  assert.deepEqual(promptCast("Draw the room. Remove Drew and Barclay.", true), []);
  assert.deepEqual(promptCast("Abby serves drinks. Without Drew, Barclay, and Abby.", true), []);
  assert.deepEqual(promptCast("Keep Drew and Barclay. No extra characters. Do not change Abby.", true), ["Drew", "Barclay", "Abby"]);
  assert.deepEqual(promptCast("Drew and Barclay reference only. Remove both characters.", true), []);
  assert.deepEqual(promptCast("The artist drew the window.", true), []);
});

function workflow(positive = "Drew and Barclay sit at the bar.") {
  return { 1: { class_type: "CLIPTextEncode", inputs: { text: positive } }, 2: { class_type: "CLIPTextEncode", inputs: { text: "Abby, extra people, text artifacts" } }, 3: { class_type: "KSampler", inputs: { positive: ["1", 0], negative: ["2", 0] } } };
}

test("embedded workflows follow positive conditioning and ignore negative prompts", () => {
  assert.deepEqual(workflowCast(workflow()), ["Drew", "Barclay"]);
  assert.deepEqual(workflowCast({ 2: workflow()[2] }), []);
  const graph = workflow();
  graph[4] = { inputs: { conditioning_1: ["1", 0], conditioning_2: ["4", 0] } };
  graph[3].inputs.positive = ["4", 0];
  assert.deepEqual(workflowCast(graph), ["Drew", "Barclay"]);
});

function pngWithPrompt(graph) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const data = Buffer.from(`prompt\0${JSON.stringify(graph)}`);
  const chunk = Buffer.alloc(data.length + 12);
  chunk.writeUInt32BE(data.length); chunk.write("tEXt", 4); data.copy(chunk, 8);
  return Buffer.concat([signature, chunk]);
}

test("cast associations require exact image metadata and preserve source-relative evidence", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "studio-cast-test-"));
  try {
    await fs.mkdir(path.join(root, "briefs", "example", "finished"), { recursive: true });
    await fs.writeFile(path.join(root, "briefs/example/plan.json"), JSON.stringify({ panels: [{ n: 1, file: "panel.png", still: "tv.png", characters: ["drew", "barclay"] }] }));
    await fs.writeFile(path.join(root, "duo.json"), JSON.stringify({ cast: "duo" }));
    await fs.writeFile(path.join(root, "faces.json"), JSON.stringify({ faces: { drew: {}, barclay: {} } }));
    await fs.writeFile(path.join(root, "gen_123_test.png"), pngWithPrompt(workflow()));
    const resolve = await createLibraryCastResolver([{ id: "project", root }]);
    const origin = (file) => [{ source: "project", path: file }];
    assert.deepEqual((await resolve(origin("duo.png"))).characters, []);
    assert.deepEqual((await resolve(origin("briefs/example/tv.png"))).characters, []);
    assert.deepEqual((await resolve(origin("briefs/example/finished/panel.r2.png"))).characters, ["Drew", "Barclay"]);
    assert.deepEqual((await resolve(origin("faces.png"))).characters, ["Drew", "Barclay"]);
    const thumbnail = await resolve(origin("thumb_gen_123_test.png"));
    assert.deepEqual(thumbnail.characters, ["Drew", "Barclay"]);
    assert.equal(thumbnail.characterEvidence[0].path, "gen_123_test.png#png-prompt");
    assert.equal(JSON.stringify(thumbnail).includes(root), false);
    assert.deepEqual((await resolve(origin("thumb_gen_unknown.png"))).characters, []);
  } finally {
    const resolved = path.resolve(root);
    assert(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith("studio-cast-test-"));
    await fs.rm(resolved, { recursive: true, force: true });
  }
});
