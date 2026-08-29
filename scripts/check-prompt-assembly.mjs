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

// writersRoom imports through the "@/" alias, which the tsc CLI cannot be told
// about with a flag — only a tsconfig carries paths. So the compile runs off a
// generated one rather than a long argv.
const tsconfig = path.join(build, "tsconfig.json");
fs.writeFileSync(
  tsconfig,
  JSON.stringify({
    compilerOptions: {
      outDir: build,
      // Keep the lib/ prefix on the emitted files, so the require path below is
      // the same shape as the source tree.
      rootDir: repoRoot,
      // CommonJS so the emitted extensionless imports resolve without a loader.
      module: "commonjs",
      moduleResolution: "node",
      target: "es2022",
      esModuleInterop: true,
      skipLibCheck: true,
      baseUrl: repoRoot,
      paths: { "@/*": ["*"] },
    },
    // writersRoom too: the length check below has to measure the scene text
    // production actually sends, not a short one written for the test.
    files: [path.join(repoRoot, "lib/generate.ts"), path.join(repoRoot, "lib/writersRoom.ts")],
  })
);
execFileSync("npx", ["tsc", "-p", tsconfig], { cwd: repoRoot, stdio: "inherit" });

// tsconfig "paths" tells the COMPILER where "@/lib/x" lives; it does not rewrite
// the require() the compiler emits, so the output still asks Node for a module
// named "@/lib/githubPublish" and Node has never heard of it. Every emitted file
// lands under build/lib/, so the alias is a sibling reference there.
for (const name of fs.readdirSync(path.join(build, "lib"))) {
  if (!name.endsWith(".js")) continue;
  const file = path.join(build, "lib", name);
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/require\("@\/lib\//g, 'require("./'));
}

// The repo's package.json says "type": "module" (Vercel's middleware pipeline
// requires it), which would make Node parse the CommonJS output above as ESM.
// A local package.json in the build dir restores the correct parse mode.
fs.writeFileSync(path.join(build, "package.json"), JSON.stringify({ type: "commonjs" }));

const master = fs.readFileSync(path.join(repoRoot, "canon", "MASTER-PROMPT.md"), "utf8");
const require = createRequire(import.meta.url);
const { assemblePrompt, generateCartoonArt, isFineTuned } = require(path.join(build, "lib", "generate.js"));
const { stage } = require(path.join(build, "lib", "writersRoom.js"));

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

// THE REAL THING, NOT A STAND-IN. The three fixtures above are short scenes
// written by hand, and for a long time the length check measured those and
// passed while production failed: a genuine three-hander assembled to 32,824
// characters against a 32,000 ceiling, so all twelve Abby panels of an edition
// died on the length guard, silently, retried and died again. The batch drew
// only the cartoons Abby was not in and nothing said why.
//
// So the widest case is built the way the brief route builds it — a gag through
// stage(), with the full cast — and it is the one the ceiling is checked
// against. A check that cannot fail the way production fails is not a check.
const widestGag = stage({
  speaker: "abby",
  caption: 'Abby: "There is about four dollars of whiskey in that glass and fourteen dollars of roof."',
  action:
    "Abby slides Mango's old fashioned across the marble past the check spindle, where a renewal envelope " +
    "thick as a paperback is spiked and still sealed, tall enough to bury the spindle",
  characters: ["drew", "mango", "abby"],
  away: "",
  signs: [],
  turn: "reclassification",
  tv: "TWO IN THREE HOUSEHOLDS SAW PREMIUMS RISE",
  tvPicture: "A small tidy house standing behind a mailbox too full to close, with no people in the shot",
  board: "DEDUCTIBLE HOUR 4-7 - THE FIRST $2,500 IS YOURS",
});

check("IMAGE_MODEL decides which path runs", () => {
  process.env.IMAGE_MODEL = "black-forest-labs/flux-kontext-pro";
  assert.equal(isFineTuned(), false);
  process.env.IMAGE_MODEL = "rick/swinging-door:abc123";
  assert.equal(isFineTuned(), true);
  delete process.env.IMAGE_MODEL;
  assert.equal(isFineTuned(), false, "the default house model is reference-conditioned, not a fine-tune");
});

check("the fine-tune is given trigger words, not descriptions", () => {
  const prompt = assemblePrompt(master, bar, true);
  assert.match(prompt, /SWDINK/);
  assert.match(prompt, /SWDDREW/);
  assert.match(prompt, /SWDMANGO/);
  assert.doesNotMatch(prompt, /Preserve Drew exactly/, "the identity paragraph is the token's job now");
  assert.doesNotMatch(prompt, /Mango matches the attached/);
  assert.doesNotMatch(prompt, /attached image is the reference board/);
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

check("no barroom furniture travels to an away game on the house path", () => {
  // The check above tests the FINE-TUNED path, which never had this bug. The
  // path production actually draws with is the multi-reference one, and it
  // shipped a golf-course batch carrying the marble counter, the club chairs,
  // the fixed bar height, the television, the chalkboard and the whole SIDES
  // block that stands Abby behind a counter. Ten paid drawings were told to
  // render a fairway and a barroom at once.
  const away = assemblePrompt(master, boat, false, false, true);

  const mustNotTravel = [
    [/THE ROOM\./, "the room"],
    // Not /THE STAGE\./ — the away fence has a stage paragraph of its own,
    // and should. What must not travel is the BAR's stage.
    [/CROPPED AT THE COUNTER/, "the counter crop"],
    [/THE BAR IS ONE LEVEL/, "the one-level bar rule"],
    [/THE BAR HEIGHT IS FIXED/, "the bar-height rule"],
    [/THE SEATING IS THE SAME EVERY DAY/, "the club chairs"],
    [/THE SIDES —/, "the sides block"],
    [/NEAREST THE READER/, "the sides block's near depth"],
    [/NEXT, BEYOND THEIR SHOULDERS/, "the sides block's middle depth"],
    [/FARTHEST, PAST THE COUNTER/, "the sides block's far depth"],
    [/The TV and the chalkboard are OPTIONAL/, "the screen-and-board paragraph"],
    [/\bmarble\b/i, "marble"],
    [/\bchalkboard\b/i, "a chalkboard"],
    [/\bback bar\b/i, "the back bar"],
  ];
  for (const [pattern, what] of mustNotTravel) {
    assert.doesNotMatch(away, pattern, `a boat prompt must not carry ${what}`);
  }

  // What SHOULD travel: the cast and the drawing hand belong everywhere.
  assert.match(away, /DREW\./, "Drew's construction travels to every setting");
  assert.match(away, /MANGO\./, "so does Mango's");
  assert.match(away, /steel engraving/, "and so does the style");
  assert.match(away, /two-thwart fishing boat/, "and the setting Rick asked for is in there");
});

check("an away game names a hard crop edge, not a soft one", () => {
  // The bar's rule is countable and absolute: nothing below the counter is
  // ever in frame, and it lists the parts. The away game's first version said
  // only "composed close in, filling the frame from roughly the waist up",
  // which is a suggestion. The model drew past the waist, reached the legs,
  // had no instruction about feet, and ended both trouser legs in rounded
  // stumps planted in the turf. Countable beats relational -- this repo's
  // own first law, failed by the person quoting it.
  const away = assemblePrompt(master, boat, false, false, true);
  assert.match(away, /CROPPED AT THE BELT/, "the away crop must be named, not implied");
  for (const part of ["thighs", "knees", "legs", "feet", "shoes"]) {
    assert.match(
      away,
      new RegExp(`no ${part}`, "i"),
      `the away crop must forbid ${part} by name, the way the counter crop does`
    );
  }
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

check("the widest real prompt fits the model's ceiling with room to spare", () => {
  // Measured on the multi-reference house path, which is what production runs.
  const prompt = assemblePrompt(
    master,
    { scene: widestGag.scene, tv: widestGag.tv, board: widestGag.board, setting: widestGag.setting, characters: widestGag.characters },
    false,
    false,
    true
  );
  const CEILING = 32_000;
  // The margin is not decoration. A scene is written per panel and varies by a
  // few hundred characters, so a prompt that only just fits on this gag will
  // fail on the next one, one panel at a time, invisibly.
  const MARGIN = 1_500;
  assert.ok(
    prompt.length <= CEILING - MARGIN,
    `the widest real prompt is ${prompt.length} characters; the ceiling is ${CEILING} and this check ` +
      `insists on ${MARGIN} to spare, so trim a canon fence by ${prompt.length - (CEILING - MARGIN)}`
  );
});

check("Kontext still gets the full description and the board instruction", () => {
  // Explicitly the single-board branch: the house model is multi-reference
  // now, so the Kontext path has to be asked for by name.
  const prompt = assemblePrompt(master, withAbby, false, false, false);
  assert.match(prompt, /attached image is the reference board/);
  assert.match(prompt, /Preserve Drew exactly/);
  assert.match(prompt, /West Highland White Terrier/, "the Abby fence is appended when she is in the cast");
  assert.doesNotMatch(prompt, /SWDDREW/, "trigger words mean nothing to a model that never trained on them");
});

check("Abby's fence does not leak an unfilled slot", () => {
  // Her paragraph mentions [SCENE] itself, so it has to be in place before
  // the slots are filled rather than appended afterwards.
  assert.doesNotMatch(assemblePrompt(master, withAbby, false, false, false), /\[SCENE\]/);
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
