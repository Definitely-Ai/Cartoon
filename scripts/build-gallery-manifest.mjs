import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const galleryDir = path.join(repoRoot, "public", "gallery");
const manifestPath = path.join(galleryDir, "manifest.json");
const libManifestPath = path.join(repoRoot, "lib", "gallery-manifest.json");
const origFinalDir = "C:\\Users\\admin\\Projects\\Cartoons\\final";

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

// 1. Final Editions & Bases (STRICT QUALITY: NO alcohol gags, NO drink pouring, NO phantom Abby in Duo)
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

  // Master Base A (Trio)
  if (fs.existsSync(path.join(finalDir, "BASE-A.jpg"))) {
    const mtime = getMtime("BASE-A.jpg", "2026-09-01T20:20:14.000Z");
    items.push({
      id: "final-base-a",
      title: "Master Base A (Trio: Drew, Abby & Barclay)",
      category: "final",
      sceneType: "trio",
      src: "/gallery/final/BASE-A.jpg",
      caption: "Master Base A — Level marble counter from left to right, Abby polishing glassware, Drew and Barclay in conversation.",
      tv: "CNBC LIVE",
      board: "THE SWINGING DOOR",
      timestamp: mtime,
      formattedTime: formatTime(mtime),
    });
  }

  // Master Base B (Duo)
  if (fs.existsSync(path.join(finalDir, "BASE-B.jpg"))) {
    const mtime = getMtime("BASE-B.jpg", "2026-09-01T20:15:00.000Z");
    items.push({
      id: "final-base-b",
      title: "Master Base B (Duo: Drew & Barclay)",
      category: "final",
      sceneType: "duo",
      src: "/gallery/final/BASE-B.jpg",
      caption: "Master Base B — Two-hander at the bar with continuous level counter and CNBC flatscreen background.",
      tv: "CNBC LIVE",
      board: "THE SWINGING DOOR",
      timestamp: mtime,
      formattedTime: formatTime(mtime),
    });
  }

  // Trio Editions A01 - A10
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
  }

  // Duo Editions: ONLY True Duo cartoons (Drew & Barclay).
  // Strictly excluded: B02, B04, B06, B10 which mistakenly included Abby / drink pouring.
  const trueDuoNums = ["B01", "B03", "B05", "B07", "B08", "B09"];
  for (const bNum of trueDuoNums) {
    const bFile = path.join(finalDir, `${bNum}-preview.jpg`);
    if (fs.existsSync(bFile)) {
      const gag = jokesMap.get(bNum) || {};
      const mtime = getMtime(`${bNum}-preview.jpg`, `2026-09-01T20:12:00.000Z`);
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

// 2. Master Reference Plates & Character Studies (from public/gallery/vision)
const visionDir = path.join(galleryDir, "vision");
if (fs.existsSync(visionDir)) {
  const plates = [
    { file: "staging-plate.jpg", title: "Bar Staging Master Plate (Level Slab)", date: "2026-09-01T20:31:00.000Z", sceneType: "base", desc: "The official master set plate: dead-level marble slab, centered television, and square camera alignment." },
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

// 3. Completed Money Series (from public/gallery/briefs)
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
      const mtime = new Date(Date.UTC(2026, 7, 31, 20, 45 + i, 0)).toISOString();
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

// 4. SORT STRICTLY BY TIME GENERATED (NEWEST FIRST)
items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

const jsonContent = JSON.stringify(items, null, 2);
fs.writeFileSync(manifestPath, jsonContent);
fs.writeFileSync(libManifestPath, jsonContent);
console.log(`Gallery manifest rebuilt: ${items.length} verified pristine items sorted by time generated.`);
