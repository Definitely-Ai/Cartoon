// Verify the local-only boundary without starting a render or contacting a provider.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cacheRoot = path.join(repoRoot, "node_modules", ".cache");
fs.mkdirSync(cacheRoot, { recursive: true });
const build = fs.mkdtempSync(path.join(cacheRoot, "local-image-policy-"));
const config = path.join(build, "tsconfig.json");
fs.writeFileSync(config, JSON.stringify({
  compilerOptions: {
    outDir: build, rootDir: repoRoot, module: "commonjs", moduleResolution: "node",
    target: "es2022", esModuleInterop: true, skipLibCheck: true,
    baseUrl: repoRoot, paths: { "@/*": ["*"] },
  },
  files: ["lib/generate.ts", "lib/auravision.ts"].map((file) => path.join(repoRoot, file)),
}));
execFileSync("npx", ["tsc", "-p", config], { cwd: repoRoot, stdio: "inherit", shell: process.platform === "win32" });
for (const name of fs.readdirSync(path.join(build, "lib"))) {
  if (!name.endsWith(".js")) continue;
  const file = path.join(build, "lib", name);
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/require\("@\/lib\//g, 'require("./'));
}
fs.writeFileSync(path.join(build, "package.json"), JSON.stringify({ type: "commonjs" }));

const previousOrigin = process.env.AURAVISION_URL;
const previousModel = process.env.IMAGE_MODEL;
const realFetch = globalThis.fetch;
process.env.AURAVISION_URL = "http://127.0.0.1:8000";
const require = createRequire(import.meta.url);
const { generateImageAuraVision } = require(path.join(build, "lib", "auravision.js"));
const { generateCartoonArt } = require(path.join(build, "lib", "generate.js"));

try {
  let calls = [];
  globalThis.fetch = async (...args) => {
    calls.push(args);
    throw new Error("Unexpected network request");
  };
  for (const model of ["openai/gpt-image-2", "black-forest-labs/flux-kontext-pro", "replicate/qwen-image-edit", "qwen-image-edit-2511"]) {
    await assert.rejects(() => generateImageAuraVision(model, { prompt: "test" }), /local RTX 4090 only/);
    await assert.rejects(() => generateCartoonArt({ model, prompt: "test", characters: ["drew"] }), /local RTX 4090 only/);
  }
  process.env.IMAGE_MODEL = "openai/gpt-image-2";
  await assert.rejects(() => generateCartoonArt({ prompt: "test", characters: ["drew"] }), /local RTX 4090 only/);
  assert.equal(calls.length, 0, "hosted IDs and environment overrides must fail before all network traffic");

  const pixels = Buffer.from([137, 80, 78, 71]);
  globalThis.fetch = async (url, init) => {
    calls.push([String(url), init]);
    return init?.method === "POST"
      ? Response.json({ success: true, image_url: "/outputs/local-policy-test.png" })
      : new Response(pixels);
  };
  assert.deepEqual(await generateImageAuraVision("local/sensenova-u1.5", { prompt: "test", seed: 4, steps: 8 }), pixels);
  assert.equal(calls.length, 2);
  const payload = JSON.parse(calls[0][1].body);
  assert.equal(payload.provider, "local");
  assert.equal(payload.model, "local/sensenova-u1.5");
  assert.equal(payload.seed, 4);
  assert.equal(payload.steps, 8);
  assert.equal(calls[1][0], "http://127.0.0.1:8000/outputs/local-policy-test.png");
  assert.equal(calls[1][1].redirect, "error");

  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push([String(url), init]);
    return Response.json({ success: true, image_url: "https://hosted-provider.example/output.png" });
  };
  await assert.rejects(() => generateImageAuraVision("local/qwen-image-edit-2511", { prompt: "test" }), /outside the studio server/);
  assert.equal(calls.length, 1, "an external output URL must not be fetched");
  console.log("Local image policy passed: hosted overrides blocked; local payload preserved; external downloads blocked. No render or provider call made.");
} finally {
  globalThis.fetch = realFetch;
  if (previousOrigin === undefined) delete process.env.AURAVISION_URL;
  else process.env.AURAVISION_URL = previousOrigin;
  if (previousModel === undefined) delete process.env.IMAGE_MODEL;
  else process.env.IMAGE_MODEL = previousModel;
}
