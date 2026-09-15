// Build a separate, pinned local runtime. Never modify the working art studio.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';
import { REQUIRED_PRODUCTION_FILES } from './production-adapter.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--check-only');
const value = name => { const n = args.indexOf(name); if (n < 0 || !args[n + 1]) throw Error(`Missing ${name}`); return args[n + 1]; };
const studio = await fs.realpath(value('--studio'));
const release = await fs.realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'));
const destination = path.resolve(value('--destination'));
const configRoot = path.resolve(value('--config-root'));
const configName=args.includes('--config-name')?value('--config-name'):'worker.json';
if(!/^worker(?:-[a-z0-9-]+)?\.json$/.test(configName))throw Error('Use a scoped worker config filename.');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
if (!path.isAbsolute(destination) || destination === studio || destination === release || path.parse(destination).root === destination) throw Error('Use a dedicated absolute runtime destination.');
if (await fs.stat(destination).catch(() => null)) throw Error('Runtime destination already exists. Choose a new release directory; installed snapshots are not overwritten.');
if (!dryRun) {
  await fs.mkdir(destination, { recursive: true, mode: 0o700 });
  await fs.mkdir(configRoot, { recursive: true, mode: 0o700 });
}

const queue = [...REQUIRED_PRODUCTION_FILES, 'scripts/automation/worker.mjs', 'scripts/automation/worker-core.mjs',
  'scripts/automation/production-adapter.mjs', 'scripts/automation/start-worker.ps1', 'scripts/automation/install-worker.ps1',
  'scripts/automation/uninstall-worker.ps1'];
const pins = [], visited = new Set();
for (let index = 0; index < queue.length; index++) {
  const relative = queue[index].replaceAll('\\', '/');
  if (visited.has(relative)) continue;
  if (relative.startsWith('../') || path.isAbsolute(relative)) throw Error('Dependency escaped the studio.');
  visited.add(relative);
  const sourceRoot = relative.startsWith('scripts/automation/') ? release : studio;
  const source = await fs.realpath(path.join(sourceRoot, relative));
  if (path.relative(sourceRoot, source).startsWith('..')) throw Error('Dependency symlink escapes its source.');
  const bytes = await fs.readFile(source);
  const target = path.join(destination, relative);
  if (!dryRun) {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(source, target, fs.constants.COPYFILE_EXCL);
  }
  pins.push({ path: relative, sha256: digest(bytes) });
  if (/\.[cm]?js$/.test(relative)) {
    const text = bytes.toString('utf8');
    const imports = [...text.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['"]([^'"]+)['"]/g)].map(match => match[1]);
    for (const dependency of imports) {
      if (dependency.startsWith('.')) queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(relative), dependency)));
      else if (!dependency.startsWith('node:') && !['sharp', 'opentype.js'].includes(dependency)) throw Error(`Unreviewed external dependency: ${dependency}`);
    }
  }
}
if (dryRun) { console.log(JSON.stringify({ sourceFiles: pins.length, files: pins.map(pin => pin.path), written: false })); process.exit(0); }
const packageFile = { name: 'swinging-door-local-worker', version: '1.0.0', private: true, type: 'module',
  dependencies: { sharp: '0.35.4', 'opentype.js': '2.0.0' } };
await fs.writeFile(path.join(destination, 'package.json'), JSON.stringify(packageFile, null, 2) + '\n', { flag: 'wx' });
const tokenFile = path.join(configRoot, 'worker-token.txt');
try { await fs.writeFile(tokenFile, randomBytes(32).toString('base64url'), { flag: 'wx', mode: 0o600 }); }
catch (error) { if (error.code !== 'EEXIST') throw error; }
const token = (await fs.readFile(tokenFile, 'utf8')).trim();
if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw Error('Existing worker token is invalid; it was not overwritten.');
const cronFile = path.join(configRoot, 'cron-token.txt');
try { await fs.writeFile(cronFile, randomBytes(32).toString('base64url'), { flag: 'wx', mode: 0o600 }); }
catch (error) { if (error.code !== 'EEXIST') throw error; }
const config = {
  apiOrigin: 'https://cartoon-brown-seven.vercel.app', storageOrigin: 'https://ypecehqzzxhdpiesteaw.supabase.co',
  workerId: 'studio-4090', tokenFile, workspaceRoot: destination, stateRoot: path.join(configRoot, 'state'),
  sharedGpuLockRoot: 'Z:/ImageGenerator/local-studio/locks', pollMs: 5_000, heartbeatMs: 5_000,
  production: { writerModel: 'qwen3.8:27b', criticModel: 'gpt-oss:20b', visionModel:'mistral-small3.2:24b-instruct-2506-q4_K_M', captionAttempts: 12,
    locations: JSON.parse(await fs.readFile(path.join(release,'scripts/automation/city-demo-sources.json'),'utf8')) },
  runtimePins: pins.sort((a, b) => a.path.localeCompare(b.path)),
  windowsLauncher: { startupTimeoutSeconds: 600, requireGpu: true,
    readinessUrl: 'https://cartoon-brown-seven.vercel.app/gallery/automation', modelServices: [
      { name: 'ollama', executable: 'Z:/ImageGenerator/local-studio/ollama-v0.34.0/ollama.exe', arguments: ['serve'],
        workingDirectory: 'Z:/ImageGenerator/local-studio', port: 11435, healthUrl: 'http://127.0.0.1:11435/api/tags',
        environment: { OLLAMA_HOST: '127.0.0.1:11435', OLLAMA_MODELS: 'Z:/ai-models/ollama', OLLAMA_NO_CLOUD: '1',
          OLLAMA_KEEP_ALIVE: '0', OLLAMA_MAX_LOADED_MODELS: '1', OLLAMA_NUM_PARALLEL: '1', OLLAMA_CONTEXT_LENGTH: '32768',
          OLLAMA_FLASH_ATTENTION: '1', OLLAMA_KV_CACHE_TYPE: 'q8_0' } },
      { name: 'comfyui', executable: 'Z:/ComfyUI/.venv/Scripts/python.exe',
        arguments: ['main.py', '--listen', '127.0.0.1', '--port', '8188', '--disable-auto-launch', '--preview-method', 'none'],
        workingDirectory: 'Z:/ComfyUI', port: 8188, healthUrl: 'http://127.0.0.1:8188/system_stats' },
    ] },
};
const configFile = path.join(configRoot, configName);
await fs.writeFile(configFile, JSON.stringify(config, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
await fs.writeFile(path.join(destination, 'snapshot-provenance.json'), JSON.stringify({ createdAt: new Date().toISOString(), studio, release, files: pins }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ destination, configFile, files: pins.length, tokenHash: digest(token), next: 'Install pinned npm dependencies, restrict runtime/config ACLs, register the token hash, then preview the Windows task.' }));
