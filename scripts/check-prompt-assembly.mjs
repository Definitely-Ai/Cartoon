// Checks how a cartoon request becomes an image-model request.
//
// There are two very different paths through lib/generate.ts and the studio
// silently switches between them on the value of IMAGE_MODEL. Kontext has to
// be told in words what everyone looks like, and is handed a reference board
// to copy from. A fine-tune already knows, and repeating the description only
// fights its own trigger words.
//
// The check that matters most is the last one. The whole reason to fine-tune
// is that Rick's sentence decides the setting, so a prompt about a boat must
// not carry a paragraph of barroom along with it.
//
//   npm run check:prompt
//
// The module is TypeScript and the repo has no test runner, so this compiles
// the two files it needs to a scratch directory and requires the result.

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Built inside node_modules rather than a temp directory: the compiled output
// imports sharp, and only a path under the repo resolves it.
const build = path.join(repoRoot, "node_modules", ".cache", "swd-prompt-check");
fs.rmSync(build, { recursive: true, force: true });
fs.mkdirSync(build, { recursive: true });

execFileSync(
  "npx",
  [
    "tsc",
    "lib/generate.ts",
    "--outDir", build,
    // Keep the lib/ prefix on the emitted files, so the require path below is
    // the same shape as the source tree.
    "--rootDir", ".",
    // CommonJS so the emitted extensionless imports resolve without a loader.
    "--module", "commonjs",
    "--moduleResolution", "node",
    "--target", "es2022",
    "--esModuleInterop",
    "--skipLibCheck",
  ],
  { cwd: repoRoot, stdio: "inherit" }
);

const master = fs.readFileSync(path.join(repoRoot, "canon", "MASTER-PROMPT.md"), "utf8");
const require = createRequire(import.meta.url);
const { assemblePrompt, generateCartoonArt, isFineTuned } = require(path.join(build, "lib", "generate.js"));

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

const bar = {
  scene: "Mango is mid-story with a raised hand while Drew signals toward the taps.",
  tv: "MARKETS OPEN",
  board: "PATIENCE, SERVED DAILY",
  characters: ["drew", "mango"],
};
const boat = {
  scene: "Drew works the oars while Mango reads the tide table.",
  setting: "a small two-thwart fishing boat on calm water",
  characters: ["drew", "mango"],
};
const withAbby = { ...bar, characters: ["drew", "mango", "abby"] };

check("IMAGE_MODEL decides which path runs", () => {
  process.env.IMAGE_MODEL = "black-forest-labs/flux-kontext-pro";
  assert.equal(isFineTuned(), false);
  process.env.IMAGE_MODEL = "rick/swinging-door:abc123";
  assert.equal(isFineTuned(), true);
  delete process.env.IMAGE_MODEL;
  assert.equal(isFineTuned(), false, "the default is Kontext");
});

check("the fine-tune is given trigger words, not descriptions", () => {
  const prompt = assemblePrompt(master, bar, true);
  assert.match(prompt, /SWDINK/);
  assert.match(prompt, /SWDDREW/);
  assert.match(prompt, /SWDMANGO/);
  assert.doesNotMatch(prompt, /Preserve Drew exactly/, "the identity paragraph is the token's job now");
  assert.doesNotMatch(prompt, /Mango matches the attached/);
  assert.doesNotMatch(prompt, /attached image is the character reference board/);
});

check("Abby brings her trigger word and leaves her paragraph behind", () => {
  const prompt = assemblePrompt(master, withAbby, true);
  assert.match(prompt, /SWDABBY/);
  assert.doesNotMatch(prompt, /West Highland White Terrier/);
});

check("the stage rules survive into the fine-tuned prompt", () => {
  // Physical plausibility is not something a character fine-tune can learn —
  // it has to keep being asked for.
  assert.match(assemblePrompt(master, bar, true), /THE STAGE\./);
  assert.match(assemblePrompt(master, boat, true), /THE STAGE\./);
});

check("the room comes along only when the scene is in the bar", () => {
  assert.match(assemblePrompt(master, bar, true), /THE ROOM\./);

  const away = assemblePrompt(master, boat, true);
  assert.doesNotMatch(away, /THE ROOM\./, "a boat prompt must not carry the barroom");
  assert.doesNotMatch(away, /dark-wood bar runs straight/, "nor the room's furniture");
  assert.match(away, /THE SETTING\./);
  assert.match(away, /two-thwart fishing boat/);
});

check("every slot is filled on both paths", () => {
  for (const fineTuned of [true, false]) {
    for (const candidate of [bar, boat, withAbby]) {
      const prompt = assemblePrompt(master, candidate, fineTuned);
      assert.doesNotMatch(prompt, /\[SCENE\]|\[TV\]|\[BOARD\]|\[SETTING\]/);
      assert.ok(prompt.includes(candidate.scene), "the scene Rick asked for is always in there");
    }
  }
});

check("Kontext still gets the full description and the board instruction", () => {
  const prompt = assemblePrompt(master, withAbby, false);
  assert.match(prompt, /attached image is the character reference board/);
  assert.match(prompt, /Preserve Drew exactly/);
  assert.match(prompt, /West Highland White Terrier/, "the Abby fence is appended when she is in the cast");
  assert.doesNotMatch(prompt, /SWDDREW/, "trigger words mean nothing to a model that never trained on them");
});

check("Abby's fence does not leak an unfilled slot", () => {
  // Her paragraph mentions [SCENE] itself, so it has to be in place before
  // the slots are filled rather than appended afterwards.
  assert.doesNotMatch(assemblePrompt(master, withAbby, false), /\[SCENE\]/);
});

check("an unknown cast is refused rather than drawn as nobody", () => {
  assert.throws(() => assemblePrompt(master, { ...bar, characters: ["gerald"] }, true), /mango, drew, or abby/);
});

// Everything above reads a string. This one watches what actually goes out on
// the wire, because the expensive mistake is not a wrong prompt — it is the
// fine-tuned path still building and uploading a reference board, paying for
// a GitHub round trip and an upload per cartoon to condition a model that
// does not take a conditioning image.
const asyncChecks = [];
asyncChecks.push([
  "the fine-tuned path sends a prompt and nothing else",
  async () => {
    const calls = [];
    const body = [];
    const realFetch = globalThis.fetch;
    process.env.REPLICATE_API_TOKEN = "test-token";
    process.env.IMAGE_MODEL = "rick/swinging-door:abc123";
    try {
      globalThis.fetch = async (url, init) => {
        calls.push(String(url));
        if (String(url).endsWith("/predictions")) {
          body.push(JSON.parse(init.body));
          return new Response(
            JSON.stringify({ id: "p1", status: "succeeded", output: "https://example.test/out.png" }),
            { headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(new Uint8Array([1, 2, 3]));
      };
      await generateCartoonArt({ prompt: "SWDINK single-panel cartoon.", characters: ["drew", "mango"] });

      assert.ok(!calls.some((u) => u.endsWith("/v1/files")), "no file upload on the fine-tuned path");
      assert.ok(!calls.some((u) => u.includes("api.github.com")), "no model sheets fetched either");
      assert.equal(body.length, 1);
      assert.ok(!("input_image" in body[0].input), "a fine-tune takes no conditioning image");
      assert.equal(body[0].input.lora_scale, 0.9, "the strength dial defaults to 0.9");
      // A versioned model goes to POST /predictions with the version hash in
      // the body — the /models/<name>/predictions form is for latest-version
      // names only and 404s when a hash is appended.
      assert.match(calls[0], /\/v1\/predictions$/);
      assert.equal(body[0].version, "abc123");
    } finally {
      globalThis.fetch = realFetch;
      delete process.env.REPLICATE_API_TOKEN;
      delete process.env.IMAGE_MODEL;
    }
  },
]);

let failed = 0;
for (const [name, fn] of checks) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed++;
    console.error(`  FAIL ${name}\n       ${error.message.split("\n")[0]}`);
  }
}
for (const [name, fn] of asyncChecks) {
  try {
    await fn();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed++;
    console.error(`  FAIL ${name}\n       ${error.message.split("\n")[0]}`);
  }
}
fs.rmSync(build, { recursive: true, force: true });

const total = checks.length + asyncChecks.length;
console.log(`\n${total - failed}/${total} checks passed`);
process.exit(failed ? 1 : 0);
