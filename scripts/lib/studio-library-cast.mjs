import fs from "node:fs/promises";
import path from "node:path";

const names = ["Drew", "Barclay", "Abby"];
const canonical = (value) => ({ drew: "Drew", barclay: "Barclay", mango: "Barclay", abby: "Abby" })[String(value).toLowerCase()];
const ordered = (values) => names.filter((name) => values.includes(name));
const slash = (value) => value.replaceAll("\\", "/");
const stem = (value) => path.basename(value).replace(/\.[^.]+$/, "").replace(/(?:[.-](?:r\d+|raw|preview))+$/gi, "");

export function filenameCast(filename) {
  const words = filename.toLowerCase().split(/[^a-z]+/);
  const found = [];
  for (const name of names) {
    const detail = new RegExp(`^${name.toLowerCase()}(?:face|hands?|head|body|chest|towel|portrait)$`);
    if (words.some((word) => word === name.toLowerCase() || detail.test(word))) found.push(name);
  }
  if (words.includes("mango") || /(?:canon\/characters|public\/canon)\/dog\//i.test(filename)) found.push("Barclay");
  if (/(?:canon\/characters|public\/canon)\/flamingo\//i.test(filename)) found.push("Drew");
  return ordered(found);
}

/** Use only named character sections in long assembled prompts. Their generic
 * rules mention the whole cast even when individual characters are absent. */
export function promptCast(text, allowShortDescription = false) {
  if (typeof text !== "string" || !text.trim()) return [];
  const tokens = [...text.matchAll(/\bSWD(DREW|BARCLAY|MANGO|ABBY)\b/g)].map((match) => canonical(match[1]));
  const sections = [...text.matchAll(/(?:^|\n)\s*(DREW|BARCLAY|MANGO|ABBY)[.:]\s/g)].map((match) => canonical(match[1]));
  let candidates = ordered([...tokens, ...sections]);
  if (!candidates.length && allowShortDescription && text.length <= 4500) candidates = ordered([...text.matchAll(/\b(Drew|DREW|Barclay|BARCLAY|Mango|MANGO|Abby|ABBY)\b/g)].map((match) => canonical(match[1])));
  if (/\b(?:no|without any|without|remove all|remove both)\s+(?:human\s+or\s+animal\s+)?characters\b/i.test(text) && !/\b(?:no|without)\s+(?:extra|additional|new)\s+characters\b/i.test(text)) return [];
  const excluded = [];
  for (const match of text.matchAll(/\b(?:no|without|exclude|omit|remove|do not (?:add|draw|include|depict))\s+(?:any\s+|the\s+)?((?:Drew|Barclay|Mango|Abby)(?:\s*(?:,\s*(?:and\s+)?|\band\b\s*|\bor\b\s*)(?:Drew|Barclay|Mango|Abby))*)\b/gi)) {
    excluded.push(...[...match[1].matchAll(/\b(Drew|Barclay|Mango|Abby)\b/gi)].map((entry) => canonical(entry[1])));
  }
  // Explicit exclusions override an earlier mention. Do not mistake "do not
  // change Abby" or "no nails on Abby's hands" for an absent character.
  return candidates.filter((name) => {
    if (excluded.includes(name)) return false;
    const aliases = name === "Barclay" ? "(?:Barclay|Mango)" : name;
    return !new RegExp(`\\b(?:no|without|exclude|omit|remove|do not (?:add|draw|include|depict))\\s+(?:any\\s+|the\\s+)?${aliases}\\b|\\b${aliases}\\s+(?:is |must be |should be )?(?:absent|not present|not shown|removed|omitted)\\b`, "i").test(text);
  });
}

function declaredCast(record) {
  if (!record || typeof record !== "object") return [];
  const list = Array.isArray(record.characters) ? record.characters : Array.isArray(record.cast) ? record.cast : [];
  const faces = record.faces && typeof record.faces === "object" ? Object.keys(record.faces) : [];
  return ordered([...list, ...faces, record.character, record.characterId].map(canonical).filter(Boolean));
}

/** Follow positive conditioning only. Negative prompts commonly name characters
 * specifically to exclude them, so never scan every string in a workflow. */
export function workflowCast(graph) {
  if (!graph || typeof graph !== "object" || Array.isArray(graph)) return [];
  const starts = Object.values(graph).map((node) => node?.inputs?.positive).filter(Array.isArray);
  const visited = new Set();
  const found = [];
  function visit(id) {
    if (visited.has(String(id)) || visited.size > 1000) return;
    visited.add(String(id));
    const node = graph[id];
    if (!node?.inputs || typeof node.inputs !== "object") return;
    for (const [key, value] of Object.entries(node.inputs)) {
      if (/^(?:text|prompt|text_g|text_l)$/.test(key) && typeof value === "string") found.push(...promptCast(value, true));
      if (Array.isArray(value) && /^(?:positive|conditioning(?:_\d+)?|text|prompt)$/.test(key)) visit(value[0]);
    }
  }
  starts.forEach((link) => visit(link[0]));
  return ordered(found);
}

async function embeddedPngCast(file) {
  let handle;
  try {
    handle = await fs.open(file, "r");
    const signature = Buffer.alloc(8);
    if ((await handle.read(signature, 0, 8, 0)).bytesRead !== 8 || !signature.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return [];
    let offset = 8;
    for (let count = 0; count < 10000; count++) {
      const header = Buffer.alloc(8);
      if ((await handle.read(header, 0, 8, offset)).bytesRead !== 8) return [];
      const size = header.readUInt32BE(0);
      const type = header.toString("ascii", 4, 8);
      if (type === "IEND") return [];
      if (type === "tEXt" && size <= 2 * 1024 * 1024) {
        const data = Buffer.alloc(size);
        if ((await handle.read(data, 0, size, offset + 8)).bytesRead !== size) return [];
        const zero = data.indexOf(0);
        if (data.toString("latin1", 0, zero) === "prompt") return workflowCast(JSON.parse(data.toString("utf8", zero + 1)));
      }
      offset += size + 12;
    }
  } catch { return []; }
  finally { await handle?.close(); }
  return [];
}

/** All evidence paths are source-relative. No raw prompt text is shipped. */
export async function createLibraryCastResolver(sources) {
  const cache = new Map();
  const roots = new Map();
  const exact = new Map();
  const pngCache = new Map();
  const readPngCast = (file) => {
    if (!pngCache.has(file)) pngCache.set(file, embeddedPngCast(file));
    return pngCache.get(file);
  };
  const read = (file) => {
    if (!cache.has(file)) cache.set(file, fs.readFile(file, "utf8").catch(() => null));
    return cache.get(file);
  };
  async function json(file) { try { const text = await read(file); return text ? JSON.parse(text) : null; } catch { return null; } }
  function addExact(source, imagePath, characters, evidencePath, method) {
    if (!characters.length || typeof imagePath !== "string") return;
    const key = `${source}:${slash(imagePath).replace(/^\//, "")}`;
    const entries = exact.get(key) || [];
    entries.push({ source, path: slash(evidencePath), method, characters });
    exact.set(key, entries);
  }
  for (const source of sources) {
    try { if (!(await fs.stat(source.root)).isDirectory()) continue; } catch { continue; }
    roots.set(source.id, path.resolve(source.root));
    for (const file of ["lib/gallery-manifest.json", "public/gallery/manifest.json"]) {
      const rows = await json(path.join(source.root, file));
      if (!Array.isArray(rows)) continue;
      for (const record of rows) {
        const cast = declaredCast(record);
        // Titles/actions name a particular image. sceneType='duo' alone does
        // not identify its cast, nor does an edition number such as B03.
        const chars = cast.length ? cast : promptCast([record.title, record.action, record.scene].filter(Boolean).join("\n"), true);
        if (typeof record.src === "string" && record.src.startsWith("/")) addExact(source.id, `public${record.src}`, chars, `${file}#${record.id || record.src}`, cast.length ? "Gallery cast list" : "Named gallery description");
      }
    }
    const history = await json(path.join(source.root, "history.json"));
    if (Array.isArray(history)) for (const record of history) {
      const explicit = declaredCast(record).concat(declaredCast(record.metadata));
      const cast = explicit.length ? ordered(explicit) : promptCast(record.prompt, true);
      const evidence = `history.json#${record.id || record.filename}`;
      if (record.filename) addExact(source.id, path.basename(record.filename), cast, evidence, explicit.length ? "Generation cast list" : "Named generation prompt");
      if (record.thumb_url) addExact(source.id, path.basename(record.thumb_url), cast, evidence, explicit.length ? "Generation cast list" : "Named generation prompt");
    }
    const crops = await json(path.join(source.root, "scripts/training/crop-manifest.json"));
    if (Array.isArray(crops?.sheets)) for (const sheet of crops.sheets) {
      const cast = ordered((sheet.crops || []).flatMap((crop) => promptCast(crop.caption, true)));
      addExact(source.id, sheet.file, cast, "scripts/training/crop-manifest.json", "Training caption character tokens");
    }
  }

  async function resolveOrigin(origin) {
    const evidence = [];
    const fileNames = filenameCast(origin.path);
    if (fileNames.length) evidence.push({ source: origin.source, path: origin.path, method: "Named file or canonical character folder", characters: fileNames });
    evidence.push(...(exact.get(`${origin.source}:${origin.path}`) || []));
    const root = roots.get(origin.source);
    if (!root) return evidence;
    const file = path.resolve(root, origin.path);
    const relative = path.relative(root, file);
    if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return evidence;
    if (/\.png$/i.test(file)) {
      const cast = await readPngCast(file);
      if (cast.length) evidence.push({ source: origin.source, path: `${origin.path}#png-prompt`, method: "Embedded positive generation prompt", characters: cast });
    }
    // The generator's saved thumbnail name identifies its exact PNG source.
    // Only follow it when that source exists and contains positive metadata.
    if (/^thumb_gen_.+\.(?:jpg|jpeg|webp|png)$/i.test(path.basename(file))) {
      const original = path.join(path.dirname(file), path.basename(file).replace(/^thumb_/, "").replace(/\.[^.]+$/, ".png"));
      const cast = await readPngCast(original);
      if (cast.length) evidence.push({ source: origin.source, path: `${slash(path.relative(root, original))}#png-prompt`, method: "Exact generation thumbnail source prompt", characters: cast });
    }
    const base = file.replace(/\.[^.]+$/, "");
    const direct = await json(`${base}.json`);
    const directCast = declaredCast(direct);
    if (directCast.length) evidence.push({ source: origin.source, path: slash(path.relative(root, `${base}.json`)), method: "Image sidecar cast or face coordinates", characters: directCast });
    let directory = path.dirname(file);
    for (let depth = 0; depth < 4 && directory.startsWith(root); depth++) {
      const gagFile = path.join(directory, "gag.json");
      const gag = await json(gagFile);
      const gagCast = declaredCast(gag);
      if (gagCast.length) evidence.push({ source: origin.source, path: slash(path.relative(root, gagFile)), method: "Gag cast list (associated versions and details)", characters: gagCast });
      const planFile = path.join(directory, "plan.json");
      const plan = await json(planFile);
      for (const panel of Array.isArray(plan?.panels) ? plan.panels : []) {
        const candidates = [panel.file, panel.finished].filter((value) => typeof value === "string");
        if (!candidates.some((value) => stem(value) === stem(file))) continue;
        const cast = declaredCast(panel);
        if (cast.length) evidence.push({ source: origin.source, path: `${slash(path.relative(root, planFile))}#panel-${panel.n || panel.slug || panel.file}`, method: "Matching panel plan cast list", characters: cast });
      }
      // Only exact image sidecars (including finished/ -> parent prompt). A
      // broad folder prompt is not attached to unrelated images by proximity.
      for (const suffix of [".txt", ".prompt.txt"]) {
        const sidecar = path.join(directory, path.basename(base) + suffix);
        const text = await read(sidecar);
        const cast = promptCast(text, true);
        if (cast.length) evidence.push({ source: origin.source, path: slash(path.relative(root, sidecar)), method: /(?:^|\n)\s*(DREW|BARCLAY|MANGO|ABBY)[.:]\s/.test(text) ? "Named character section in image prompt" : "Named image prompt or training caption", characters: cast });
      }
      if (directory === root) break;
      directory = path.dirname(directory);
    }
    return evidence;
  }
  return async function resolve(origins) {
    const collected = (await Promise.all(origins.map(resolveOrigin))).flat();
    const evidence = [...new Map(collected.map((entry) => [`${entry.source}:${entry.path}:${entry.method}:${entry.characters.join(",")}`, entry])).values()];
    return { characters: ordered(evidence.flatMap((entry) => entry.characters)), characterEvidence: evidence };
  };
}
