import fs from "node:fs";
import path from "node:path";

// Reads /canon/characters/* at build time so the characters pages track the
// canon documents as they get written. Today the canon is templates, so
// everything degrades gracefully: a null bio means "render your variant's
// 'being written with the founder' placeholder", and an empty modelSheets
// array means "render an empty framed slot labeled coming soon".

export type ModelSheetSlot = {
  /** e.g. "Identity sheet" */
  label: string;
  /** Public URL if the image exists (prebuild copied it), else null. */
  src: string | null;
};

export type CharacterCanon = {
  /** Folder name under /canon/characters, e.g. "flamingo". */
  id: string;
  /** Display name parsed from DESCRIPTION.md's H1, e.g. "The Flamingo". */
  name: string;
  /** Canonical description prose once written; null while the canon is pending. */
  bio: string | null;
  /** The two standard sheets, present or not. */
  modelSheets: ModelSheetSlot[];
};

const SHEETS = [
  { file: "identity-sheet.png", label: "Identity sheet" },
  { file: "full-body-sheet.png", label: "Full-body sheet" },
];

function charactersRoot(): string {
  const candidates = [
    path.resolve(process.cwd(), "..", "canon", "characters"),
    path.resolve(process.cwd(), "canon", "characters"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  throw new Error(
    `Cannot find /canon/characters (looked in: ${candidates.join(", ")}). ` +
      `On Vercel, set Root Directory to "site" AND enable ` +
      `"Include source files outside of the Root Directory in the Build Step".`
  );
}

function parseCharacter(root: string, id: string): CharacterCanon {
  const descriptionPath = path.join(root, id, "DESCRIPTION.md");
  let name = id.charAt(0).toUpperCase() + id.slice(1);
  let bio: string | null = null;

  if (fs.existsSync(descriptionPath)) {
    const text = fs.readFileSync(descriptionPath, "utf8");
    const h1 = text.match(/^#\s+(.+)$/m);
    if (h1) name = h1[1].split("—")[0].trim();

    // The Canonical Description Block becomes the public bio once it stops
    // being a "(pending)" placeholder. Take the first real paragraph under
    // that heading; ignore blockquote prompts and pending markers.
    const section = text.split(/^##\s+Canonical Description Block\s*$/m)[1]?.split(/^##\s+/m)[0];
    if (section) {
      const paragraph = section
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .find((p) => p && !p.startsWith(">") && !p.startsWith("_(pending"));
      if (paragraph) bio = paragraph.replace(/^>\s*/gm, "");
    }
  }

  const modelSheets = SHEETS.map(({ file, label }) => ({
    label,
    src: fs.existsSync(path.join(root, id, file)) ? `/canon/${id}/${file}` : null,
  }));

  return { id, name, bio, modelSheets };
}

/** The cast, flamingo first (billing order), then anyone added later. */
export function getCharacters(): CharacterCanon[] {
  const root = charactersRoot();
  const ids = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const billing = ["flamingo", "dog"];
  ids.sort((a, b) => {
    const ai = billing.indexOf(a);
    const bi = billing.indexOf(b);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? billing.length : ai) - (bi === -1 ? billing.length : bi);
    return a.localeCompare(b);
  });
  return ids.map((id) => parseCharacter(root, id));
}
