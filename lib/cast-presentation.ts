import data from "./cast-presentation.json";

export const CAST_EDITION = "September 2026";
export const CAST_ASSET_ROOT = "/gallery/cast-september-2026";
export const castPresentation = data;
export type CastPresentation = (typeof castPresentation)[number];
export const castPortrait = (id: string) => `${CAST_ASSET_ROOT}/${id}.png`;
export const castPDF = (id: string) => `${CAST_ASSET_ROOT}/${id === "all" ? "the-swinging-door-cast" : id}.pdf`;
