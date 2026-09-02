import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const galleryDir = path.join(repoRoot, "public", "gallery");
const manifestPath = path.join(galleryDir, "manifest.json");
const libManifestPath = path.join(repoRoot, "lib", "gallery-manifest.json");
const origFinalDir = "C:\\Users\\admin\\Projects\\Cartoons\\final";
const origKnockoutDir = "C:\\Users\\admin\\Projects\\Cartoons\\knockout";

const items = [];

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function cleanPrompt(p) {
  if (!p) return "";
  if (p.length <= 1500) return p;
  const sceneIdx = p.indexOf("THE SCENE:");
  if (sceneIdx !== -1) {
    return p.slice(sceneIdx, sceneIdx + 1500);
  }
  return p.slice(0, 1500) + "...";
}

// 1. Final 20 Editions & Masters
const finalDir = path.join(galleryDir, "final");
if (fs.existsSync(finalDir)) {
  const jokesFile = path.join(finalDir, "jokes-default.json");
  let jokes = [];
  if (fs.existsSync(jokesFile)) {
    try { jokes = JSON.parse(fs.readFileSync(jokesFile, "utf8")); } catch {}
  }
  const jokesMap = new Map(jokes.map((j) => [j.num, j]));

  function getMtime(subPath, fallback) {
    const origPath = path.join(origFinalDir, subPath);
    if (fs.existsSync(origPath)) {
      return fs.statSync(origPath).mtime.toISOString();
    }
    const localPath = path.join(finalDir, subPath);
    if (fs.existsSync(localPath)) {
      return fs.statSync(localPath).mtime.toISOString();
    }
    return fallback;
  }

  if (fs.existsSync(path.join(finalDir, "pair", "DUO-final.jpg"))) {
    const mtime = getMtime("pair\\DUO-final.jpg", "2026-09-01T20:34:24.000Z");
    items.push({
      id: "final-pair-duo",
      title: "DUO Final Production Master",
      category: "final",
      sceneType: "duo",
      src: "/gallery/final/pair/DUO-final.jpg",
      caption: "Drew: \"We spent six months on due diligence only to find the entire IP is an Excel macro.\"",
      tv: "CNBC LIVE · ACQUISITION COLLAPSES OVER UNDISCLOSED CORE SPREADSHEET",
      board: "DUE DILIGENCE $18 · UNCHECKED, UNFILTERED, UNREGRETTED",
      timestamp: mtime,
      formattedTime: formatTime(mtime),
    });
  }

  if (fs.existsSync(path.join(finalDir, "BASE-A.jpg"))) {
    const mtime = getMtime("BASE-A.jpg", "2026-09-01T20:20:14.000Z");
    items.push({
      id: "final-base-a",
      title: "Master Base A (Trio: Drew, Abby & Barclay)",
      category: "final",
      sceneType: "trio",
      src: "/gallery/final/BASE-A.jpg",
      caption: "Master Base A — Verified studio reference with level bar and subtle Abby smile.",
      tv: "CNBC LIVE",
      board: "THE SWINGING DOOR",
      timestamp: mtime,
      formattedTime: formatTime(mtime),
    });
  }

  if (fs.existsSync(path.join(finalDir, "BASE-B.jpg"))) {
    const mtime = getMtime("BASE-B.jpg", "2026-09-01T20:15:00.000Z");
    items.push({
      id: "final-base-b",
      title: "Master Base B (Duo: Drew & Barclay)",
      category: "final",
      sceneType: "duo",
      src: "/gallery/final/BASE-B.jpg",
      caption: "Master Base B — Verified studio reference for Drew and Barclay.",
      tv: "CNBC LIVE",
      board: "THE SWINGING DOOR",
      timestamp: mtime,
      formattedTime: formatTime(mtime),
    });
  }

  for (let i = 1; i <= 10; i++) {
    const aNum = `A${String(i).padStart(2, "0")}`;
    const aFile = path.join(finalDir, `${aNum}-preview.jpg`);
    if (fs.existsSync(aFile)) {
      const gag = jokesMap.get(aNum) || {};
      const mtime = getMtime(`${aNum}-preview.jpg`, `2026-09-01T20:${String(14 - i).padStart(2, "0")}:00.000Z`);
      items.push({
        id: `final-${aNum}`,
        title: `Edition ${aNum} (Trio)`,
        category: "final",
        sceneType: "trio",
        src: `/gallery/final/${aNum}-preview.jpg`,
        caption: gag.caption ? `${gag.speaker ? gag.speaker.toUpperCase() : "ABBY"}: "${gag.caption}"` : "",
        tv: gag.tv || "",
        tvPicture: gag.tvPicture || "",
        board: gag.board || "",
        action: gag.action || "",
        turn: gag.turn || "",
        timestamp: mtime,
        formattedTime: formatTime(mtime),
      });
    }

    const bNum = `B${String(i).padStart(2, "0")}`;
    const bFile = path.join(finalDir, `${bNum}-preview.jpg`);
    if (fs.existsSync(bFile)) {
      const gag = jokesMap.get(bNum) || {};
      const mtime = getMtime(`${bNum}-preview.jpg`, `2026-09-01T20:${String(14 - i).padStart(2, "0")}:30.000Z`);
      items.push({
        id: `final-${bNum}`,
        title: `Edition ${bNum} (Duo)`,
        category: "final",
        sceneType: "duo",
        src: `/gallery/final/${bNum}-preview.jpg`,
        caption: gag.caption ? `${gag.speaker ? gag.speaker.toUpperCase() : "DREW"}: "${gag.caption}"` : "",
        tv: gag.tv || "",
        tvPicture: gag.tvPicture || "",
        board: gag.board || "",
        action: gag.action || "",
        turn: gag.turn || "",
        timestamp: mtime,
        formattedTime: formatTime(mtime),
      });
    }
  }
}

// 2. Master Reference Plates & Character Studies
const visionDir = path.join(galleryDir, "vision");
if (fs.existsSync(visionDir)) {
  const plates = [
    { file: "staging-plate.jpg", title: "Bar Staging Master Plate (Level Slab)", date: "2026-09-01T20:31:00.000Z", sceneType: "base", desc: "The official master set plate: dead-level marble slab and square camera alignment." },
    { file: "drew-plate1-bar-reference.jpg", title: "Drew Bar Reference (Plate 1)", date: "2026-08-31T18:00:00.000Z", sceneType: "solo", desc: "Definitive flamingo anatomy: long S-curve neck, small refined head, deadpan heavy lid." },
    { file: "barclay-reference.jpg", title: "Barclay Reference Study", date: "2026-08-31T18:00:00.000Z", sceneType: "solo", desc: "Definitive golden retriever study: soft warm eyes, drop ears, closed-lip smile." },
    { file: "abby-reference.jpg", title: "Abby Bartender Study", date: "2026-08-31T18:00:00.000Z", sceneType: "solo", desc: "Definitive Westie study: round groomed show head, warm knowing smile, white bar towel." },
    { file: "plate-1-security-and-martini-menu.jpg", title: "Harrington Plate 1: The Security Line", date: "2026-08-25T12:00:00.000Z", sceneType: "duo", desc: "Harrington print: The security line and martini menu by fare class." },
    { file: "plate-2-debt-ceiling-and-retirement.jpg", title: "Harrington Plate 2: Debt Ceiling Week", date: "2026-08-26T12:00:00.000Z", sceneType: "duo", desc: "Harrington print: 16th annual Debt Ceiling Week & retirement planning." },
    { file: "plate-3-national-mall.jpg", title: "Harrington Plate 3: The National Mall", date: "2026-08-27T12:00:00.000Z", sceneType: "duo", desc: "Harrington print: Blue in concept, green in operations." },
    { file: "plate-4-nineteenth-hole-and-tariffs.jpg", title: "Harrington Plate 4: The 19th Hole", date: "2026-08-28T12:00:00.000Z", sceneType: "duo", desc: "Harrington print: Patriotic imported beer & the priced globe." },
    { file: "the-cast.jpg", title: "The Cast: Drew, Barclay & Abby", date: "2026-08-29T12:00:00.000Z", sceneType: "trio", desc: "Studio portrait of the complete cast." },
    { file: "tv-reference.jpg", title: "Television & Back Bar Reference", date: "2026-08-29T14:00:00.000Z", sceneType: "base", desc: "Flatscreen TV broadcast containment and bottle shelving reference." }
  ];

  for (const p of plates) {
    if (fs.existsSync(path.join(visionDir, p.file))) {
      items.push({
        id: `master-${p.file.replace(/\.[^.]+$/, "")}`,
        title: p.title,
        category: "master",
        sceneType: p.sceneType,
        src: `/gallery/vision/${p.file}`,
        caption: p.desc,
        timestamp: p.date,
        formattedTime: formatTime(p.date),
      });
    }
  }
}

// 3. Completed Money Series
const briefsDir = path.join(galleryDir, "briefs");
if (fs.existsSync(briefsDir)) {
  const planFile = path.join(briefsDir, "plan.json");
  let plan = { panels: [] };
  if (fs.existsSync(planFile)) {
    try { plan = JSON.parse(fs.readFileSync(planFile, "utf8")); } catch {}
  }
  const planMap = new Map((plan.panels || []).map((p) => [p.file, p]));

  for (let i = 1; i <= 10; i++) {
    const files = fs.readdirSync(briefsDir);
    const prefix = String(i).padStart(2, "0");
    const file = files.find((f) => f.startsWith(prefix) && f.endsWith(".png"));
    if (file) {
      const panel = planMap.get(file) || {};
      const mtime = "2026-08-31T20:5" + i + ":00.000Z";
      items.push({
        id: `showcase-${prefix}`,
        title: `Money Series #${prefix}`,
        category: "showcase",
        sceneType: panel.characters?.includes("abby") ? "trio" : "duo",
        src: `/gallery/briefs/${file}`,
        caption: panel.caption || panel.line || "",
        tv: panel.tv || "",
        board: panel.board || "",
        prompt: cleanPrompt(panel.prompt || ""),
        timestamp: mtime,
        formattedTime: formatTime(mtime),
      });
    }
  }
}

// 4. Clean Early Full-Panel Concept Previews ONLY (NO raw slices, NO ugly sub-crops!)
const knockoutDir = path.join(galleryDir, "knockout");
if (fs.existsSync(knockoutDir)) {
  const folders = fs.readdirSync(knockoutDir, { withFileTypes: true });
  for (const folder of folders) {
    if (!folder.isDirectory()) continue;
    const fPath = path.join(knockoutDir, folder.name);
    const origFPath = path.join(origKnockoutDir, folder.name);

    let gag = {};
    let prompt = "";
    if (fs.existsSync(path.join(fPath, "gag.json"))) {
      try { gag = JSON.parse(fs.readFileSync(path.join(fPath, "gag.json"), "utf8")); } catch {}
    }
    if (fs.existsSync(path.join(fPath, "prompt.txt"))) {
      try { prompt = fs.readFileSync(path.join(fPath, "prompt.txt"), "utf8"); } catch {}
    }

    const files = fs.readdirSync(fPath);
    const cleanPreviews = files.filter((f) => {
      if (!/\.(jpe?g|png)$/i.test(f)) return false;
      if (/^(k1|k2|c11|c12|c21|c22|zoom|align|bar\d|ceil|center|cand|m-|rev|A\d|align|slices|crops)/i.test(f)) return false;
      if (/crop|raw|slice/i.test(f)) return false;
      return /^(preview|FINAL|ptrio|pduo)/i.test(f);
    });

    for (const file of cleanPreviews.slice(0, 2)) {
      let mtime = "2026-09-01T16:00:00.000Z";
      const fullOrig = path.join(origFPath, file);
      if (fs.existsSync(fullOrig)) {
        mtime = fs.statSync(fullOrig).mtime.toISOString();
      } else {
        const fullLocal = path.join(fPath, file);
        if (fs.existsSync(fullLocal)) {
          mtime = fs.statSync(fullLocal).mtime.toISOString();
        }
      }

      const isTrio = /abby/i.test(prompt) || /trio/i.test(file);
      items.push({
        id: `draft-${folder.name}-${file.replace(/\.[^.]+$/, "")}`,
        title: `Draft: ${folder.name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
        category: "drafts",
        sceneType: isTrio ? "trio" : "duo",
        src: `/gallery/knockout/${folder.name}/${file}`,
        caption: gag.caption ? `"${gag.caption}"` : "",
        tv: gag.tv || "",
        board: gag.board || "",
        prompt: cleanPrompt(prompt),
        timestamp: mtime,
        formattedTime: formatTime(mtime),
      });
    }
  }
}

// 5. SORT STRICTLY BY TIME GENERATED (NEWEST FIRST)
items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

const jsonContent = JSON.stringify(items, null, 2);
fs.writeFileSync(manifestPath, jsonContent);
fs.writeFileSync(libManifestPath, jsonContent);
console.log(`Gallery manifest rebuilt: ${items.length} curated items sorted by time generated.`);
