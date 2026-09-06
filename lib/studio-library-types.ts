export interface LibraryOrigin { source: string; label: string; path: string }
export interface StudioLibraryImage {
  id: string; title: string; category: string; date: string; dateBasis: string;
  width: number; height: number; bytes: number; format: string; animated: boolean;
  origins: LibraryOrigin[]; thumbnailUrl: string; imageUrl: string;
  viewingBytes: number; thumbnailBytes: number; viewingWidth: number; viewingHeight: number; characters: string[];
  characterEvidence?: { source: string; path: string; method: string; characters: string[] }[];
}
export interface StudioLibraryManifest {
  version: number; generatedAt: string; timezone: string;
  summary: { sourceFiles: number; uniqueImages: number; duplicateCopies: number; originalBytes: number; viewingBytes: number };
  coverage: { id: string; label: string; status: string; files: number; bytes: number; checkedAt: string; snapshotAt: string | null }[];
  historyStatus: string;
  unavailable: (LibraryOrigin & { reason: string })[];
  limits: string[]; items: StudioLibraryImage[];
}
