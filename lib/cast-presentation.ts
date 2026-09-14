import data from "./cast-presentation.json";
import dossiers from "./cast-dossiers.json";

export const CAST_EDITION = "September 2026";
export const CAST_ASSET_ROOT = "/gallery/cast-september-2026";
export const castPresentation = data;
export type CastPresentation = (typeof castPresentation)[number];
export const castPortrait = (id: string) => `${CAST_ASSET_ROOT}/${id}.png`;
export const CAST_DOSSIER_ROOT = "/gallery/cast-dossiers-20260914-v1";
export const castPDF = (id: string) => `${CAST_DOSSIER_ROOT}/${id === "all" ? "the-swinging-door-cast" : id}.pdf`;
export const castDossiers = data.map(member => ({ ...member, ...dossiers.find(d => d.id === member.id)! }));
export type CastDossier = (typeof castDossiers)[number];
export const castDetail = (id: string, key: string) => `${CAST_DOSSIER_ROOT}/${id}-${key}.png`;
