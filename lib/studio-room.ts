import { createHash } from "node:crypto";
import manifest from "@/canon/plates/parts.json";
import { findLibraryImageById, findLibraryImageByPath, readStudioLibrary } from "./studio-library";
import { readLocalPartIdentity, readLocalPartManifest } from "./studio-part-approval";
import type { StudioLibraryImage } from "./studio-library-types";

export type RoomImage = Pick<StudioLibraryImage, "id" | "title" | "imageUrl" | "thumbnailUrl" | "width" | "height" | "viewingWidth" | "viewingHeight" | "date"> & { path: string };
export type RoomCandidate = RoomImage & { matches: { partId: string; kind: "part-name" | "related-name"; explanation: string }[] };
export type ArchitectureStudy = RoomImage & { label: string; artistNote: string | null; startingPoint: boolean; stage: "geometry" | "values" | "render" | "history" };
export type RoomPart = {
  id: string; title: string; note: string; mode: string; enabled: boolean; order: number;
  sourcePath: string | null; source: RoomImage | null; outline: number[][];
  respectsCast: boolean | null; toneMatch: boolean | null; feather: number | null;
  status: "source" | "missing" | "code";
};
export type StudioRoom = {
  manifestHash: string; inventoryAt: string; width: number; height: number;
  basePath: string; base: RoomImage | null; parts: RoomPart[]; candidates: RoomCandidate[];
  architectureStudies: ArchitectureStudy[];
  history: { label: string; note: string; image: RoomImage | null; path: string }[];
  lighting: string;
};

const TITLES: Record<string, string> = {
  board: "Chalkboard", marble: "Marble counter", "window-view": "View through the window",
  "window-frame": "Window frame & wall corner", "shelf-top": "Upper liquor shelf",
  "shelf-lower": "Lower liquor shelf", "barclay-ear": "Barclay’s ear & the back of his head",
  sign: "Window lettering", "sconce-right": "Right wall light", drinks: "Drinks & small props",
};
const RELATED_NAMES: Record<string, string[]> = {
  "barclay-ear": ["barclay"], "shelf-top": ["shelf"], "shelf-lower": ["shelf"],
  "window-view": ["window"], "window-frame": ["window"], "sconce-right": ["sconce"],
};
const imageRecord = (item: StudioLibraryImage, file: string): RoomImage => ({
  id: item.id, title: item.title, imageUrl: item.imageUrl, thumbnailUrl: item.thumbnailUrl,
  width: item.width, height: item.height, viewingWidth: item.viewingWidth, viewingHeight: item.viewingHeight,
  date: item.date, path: file,
});
function catalogImage(file: string | undefined): RoomImage | null {
  if (!file) return null;
  const item = findLibraryImageByPath(file);
  return item ? imageRecord(item, file) : null;
}
function includesName(file: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[-_./])${escaped}(?:[-_./]|$)`, "i").test(file);
}

/** Read-only view of the art manifest and content-addressed image inventory.
 * Source existence means cataloged in the dated inventory, not newly approved.
 * Filename matches never assign a candidate to a part or imply approval.
 */
export async function readStudioRoom(liveLocal = false): Promise<StudioRoom> {
  const currentManifest = liveLocal ? await readLocalPartManifest(process.cwd()) : manifest;
  const raw = currentManifest as unknown as {
    plate: { width: number; height: number; base: string };
    parts: { id: string; note?: string; mode?: string; enabled?: boolean; order?: number; source?: string;
      outline?: number[][]; respectsCast?: boolean; toneMatch?: boolean; feather?: number }[];
    lighting?: { prompt?: string };
  };
  const parts: RoomPart[] = (await Promise.all(raw.parts.map(async (part): Promise<RoomPart> => {
    let source = catalogImage(part.source);
    if (liveLocal && part.source?.startsWith("canon/plates/parts/")) {
      const identity = await readLocalPartIdentity(process.cwd(), part.source);
      const liveImage = identity ? findLibraryImageById(identity) : null;
      source = liveImage ? imageRecord(liveImage, part.source) : null;
    }
    return {
      id: part.id, title: TITLES[part.id] || part.id.replaceAll("-", " "), note: part.note || "No note recorded.",
      mode: part.mode || "not recorded", enabled: part.enabled === true, order: part.order ?? 0,
      sourcePath: part.source || null, source, outline: part.outline || [],
      respectsCast: part.respectsCast ?? null, toneMatch: part.toneMatch ?? null, feather: part.feather ?? null,
      status: part.mode === "code" ? "code" : source ? "source" : "missing",
    };
  }))).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const library = readStudioLibrary();
  const architectureStudies: ArchitectureStudy[] = library.items.flatMap((item) => {
    const origin = item.origins.find((entry) => entry.source === "project" && entry.path.startsWith("canon/room-kit/v2/"));
    if (!origin) return [];
    const filename = origin.path.split("/").pop() || "";
    const seed = filename.match(/^06-from-values-s(\d+)\.png$/)?.[1];
    const startingPoint = filename === "06-from-values-s1.png";
    const stage: ArchitectureStudy["stage"] = filename === "00-lines.png" ? "geometry" : filename === "01-values.png" ? "values" : seed ? "render" : "history";
    return [{
      ...imageRecord(item, origin.path),
      label: stage === "geometry" ? "01 · Draw the construction" : stage === "values" ? "02 · Set the light and shade" : seed ? `Rendered room · seed ${seed}` : filename.replace(/\.[^.]+$/, "").replaceAll("-", " "),
      startingPoint, stage,
      artistNote: startingPoint
        ? "Claude favors this rendered candidate. Counter depth and the slightly flat window return still need refinement. ChatGPT also found two faint horizontal guide marks in the window; remove those and compare the hatch weight with the cast before approval. The bartender’s walkway is intentionally outside the frame."
        : stage === "geometry" ? "The construction drawing sets the panel bays, member widths, counter edges and window perspective before materials are rendered. Review the proportions here first."
        : stage === "values" ? "Flat tones set a shared lighting target: bright glass and marble, a wall that darkens away from the window, and a shaded counter front. Every rendered part still needs a lighting and stroke check."
        : stage === "history" ? "An earlier strip, scratch or panelling study. Preserved as process history; the geometry-and-values method now leads the base development." : null,
    }];
  }).sort((a, b) => Number(b.startingPoint) - Number(a.startingPoint) || a.path.localeCompare(b.path));
  const candidates: RoomCandidate[] = library.items.flatMap((item) => {
    const origins = item.origins.filter((origin) => origin.source === "project" && origin.path.startsWith("canon/plates/work/"));
    if (!origins.length) return [];
    const file = origins[0].path;
    const filenames = origins.map((origin) => origin.path.split("/").pop() || "");
    const matches = parts.flatMap((part): RoomCandidate["matches"] => {
      if (filenames.some((name) => includesName(name, part.id))) return [{ partId: part.id, kind: "part-name" as const, explanation: `Filename contains “${part.id}”; image and intended part still need confirmation.` }];
      const related = RELATED_NAMES[part.id]?.find((word) => filenames.some((name) => includesName(name, word)));
      return related ? [{ partId: part.id, kind: "related-name" as const, explanation: `Related filename only: “${related}”. This may be a whole-scene or speaker study, not a replacement for this part.` }] : [];
    });
    return [{ ...imageRecord(item, file), matches }];
  });
  const history = [
    { label: "Earlier duo plate", note: "Historical comparison. Its room, cast and furniture are not the new bare structure.", path: "public/studio-room/previous-duo.png" },
    { label: "Earlier trio plate", note: "Historical comparison with Abby. Preserve it while the new room is developed.", path: "public/studio-room/previous-trio.png" },
    { label: "Rejected structure study", note: "Rejected by the owner: construction problems and furnishings added too early. This is not the new base or an approved direction.", path: "public/studio-room/00-room-structure.png" },
  ].map((entry) => ({ ...entry, image: catalogImage(entry.path) }));
  return {
    manifestHash: createHash("sha256").update(JSON.stringify(currentManifest)).digest("hex"),
    inventoryAt: library.generatedAt, width: raw.plate.width, height: raw.plate.height,
    basePath: raw.plate.base, base: catalogImage(raw.plate.base), parts, candidates, architectureStudies, history,
    lighting: raw.lighting?.prompt || "No lighting instruction recorded.",
  };
}
