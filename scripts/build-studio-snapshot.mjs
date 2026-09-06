import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Works in PowerShell and Vercel's Linux builders. npm still runs the existing
// prebuild hooks, which validate and retain the reviewed serving snapshots.
const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
  cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  env: { ...process.env, STUDIO_ASSET_MODE: "snapshot" },
  stdio: "inherit",
  // Windows needs a shell for npm.cmd; every command/argument here is fixed.
  shell: process.platform === "win32",
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
