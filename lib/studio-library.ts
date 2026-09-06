import manifestData from "./studio-library-manifest.json";
import type { StudioLibraryManifest } from "./studio-library-types";

export function readStudioLibrary(): StudioLibraryManifest {
  return manifestData as StudioLibraryManifest;
}

export function findLibraryImageByPath(path: string) {
  const normalized = path.replaceAll("\\", "/");
  return readStudioLibrary().items.find((item) => item.origins.some((origin) => origin.source === "project" && origin.path === normalized));
}

export function findLibraryImageById(id: string) {
  if (!/^[a-f0-9]{64}$/.test(id)) return undefined;
  return readStudioLibrary().items.find((item) => item.id === id);
}
