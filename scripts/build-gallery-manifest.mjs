import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const galleryDir = path.join(repoRoot, "public", "gallery");
const manifestPath = path.join(galleryDir, "manifest.json");
const libManifestPath = path.join(repoRoot, "lib", "gallery-manifest.json");

const items = [];

// Helper to extract clean dynamic prompt
function cleanPrompt(p) {
  if (!p) return "";
  if (p.length <= 1500) return p;
  // If it's a huge base prompt, extract the dynamic/scene part or trim
  const sceneIdx = p.indexOf("THE SCENE:");
  if (sceneIdx !== -1) {
    return p.slice(sceneIdx, sceneIdx + 1500);
  }
  return p.slice(0, 1500) + "...";
}

// 1. Index Final editions
const finalDir = path.join(galleryDir, "final");
if (fs.existsSync(finalDir)) {
  const jokesFile = path.join(finalDir, "jokes-default.json");
  let jokes = [];
  if (fs.existsSync(jokesFile)) {
    try {
      jokes = JSON.parse(fs.readFileSync(jokesFile, "utf8"));
    } catch {}
  }
  const jokesMap = new Map(jokes.map((j) => [j.num, j]));

  if (fs.existsSync(path.join(finalDir, "BASE-A.jpg"))) {
    items.push({
      id: "final-base-a",
      title: "Master Base A (Trio: Drew, Abby & Barclay)",
      category: "final",
      sceneType: "trio",
      src: "/gallery/final/BASE-A.jpg",
      caption: "Master Base A — Verified studio reference with level bar and subtle Abby smile.",
      tv: "CNBC LIVE",
      board: "THE SWINGING DOOR",
      date: "2026-09-01",
    });
  }
  if (fs.existsSync(path.join(finalDir, "BASE-B.jpg"))) {
    items.push({
      id: "final-base-b",
      title: "Master Base B (Duo: Drew & Barclay)",
      category: "final",
      sceneType: "duo",
      src: "/gallery/final/BASE-B.jpg",
      caption: "Master Base B — Verified studio reference for Drew and Barclay.",
      tv: "CNBC LIVE",
      board: "THE SWINGING DOOR",
      date: "2026-09-01",
    });
  }
  if (fs.existsSync(path.join(finalDir, "pair", "DUO-final.jpg"))) {
    items.push({
      id: "final-pair-duo",
      title: "DUO Final Production Master",
      category: "final",
      sceneType: "duo",
      src: "/gallery/final/pair/DUO-final.jpg",
      caption: "Final verified Duo edition.",
      date: "2026-09-01",
    });
  }

  for (let i = 1; i <= 10; i++) {
    const aNum = `A${String(i).padStart(2, "0")}`;
    const aFile = path.join(finalDir, `${aNum}-preview.jpg`);
    if (fs.existsSync(aFile)) {
      const gag = jokesMap.get(aNum) || {};
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
        date: "2026-09-01",
      });
    }

    const bNum = `B${String(i).padStart(2, "0")}`;
    const bFile = path.join(finalDir, `${bNum}-preview.jpg`);
    if (fs.existsSync(bFile)) {
      const gag = jokesMap.get(bNum) || {};
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
        date: "2026-09-01",
      });
    }
  }
}

// 2. Index Knockouts
const knockoutDir = path.join(galleryDir, "knockout");
if (fs.existsSync(knockoutDir)) {
  const folders = fs.readdirSync(knockoutDir, { withFileTypes: true });
  for (const folder of folders) {
    if (!folder.isDirectory()) continue;
    const fPath = path.join(knockoutDir, folder.name);
    let gag = {};
    let prompt = "";
    if (fs.existsSync(path.join(fPath, "gag.json"))) {
      try {
        gag = JSON.parse(fs.readFileSync(path.join(fPath, "gag.json"), "utf8"));
      } catch {}
    }
    if (fs.existsSync(path.join(fPath, "prompt.txt"))) {
      try {
        prompt = fs.readFileSync(path.join(fPath, "prompt.txt"), "utf8");
      } catch {}
    }

    const files = fs.readdirSync(fPath);
    for (const file of files) {
      if (!/\.(jpg|jpeg|png|webp)$/i.test(file)) continue;
      items.push({
        id: `knockout-${folder.name}-${file}`,
        title: `${folder.name.replace(/-/g, " ")} (${file})`,
        category: "knockout",
        batch: folder.name,
        src: `/gallery/knockout/${folder.name}/${file}`,
        caption: gag.caption || "",
        tv: gag.tv || "",
        board: gag.board || "",
        prompt: cleanPrompt(prompt),
        date: "2026-09-01",
      });
    }
  }
}

// 3. Index Inspect Candidates
const inspectDir = path.join(galleryDir, "inspect");
if (fs.existsSync(inspectDir)) {
  const files = fs.readdirSync(inspectDir);
  for (const file of files) {
    if (!/\.(jpg|jpeg|png|webp)$/i.test(file)) continue;
    items.push({
      id: `inspect-${file}`,
      title: `Inspect Plate: ${file}`,
      category: "inspect",
      src: `/gallery/inspect/${file}`,
      date: "2026-09-01",
    });
  }
}

const jsonContent = JSON.stringify(items, null, 2);
fs.writeFileSync(manifestPath, jsonContent);
fs.writeFileSync(libManifestPath, jsonContent);
console.log(`Gallery manifest built: ${items.length} items indexed (size: ${Math.round(jsonContent.length / 1024)} KB).`);
