// Legacy bible pages share the current presentation copy and portraits.
// The full historical character bibles remain unchanged in /canon.

import fs from "node:fs";
import path from "node:path";

import { renderMarkdown } from "@/lib/markdown";
import { castPresentation, castPortrait } from "@/lib/cast-presentation";

const repoRoot = process.cwd();

export type CastMember = {
  key: string;
  name: string;
  tagline: string;
  /** One paragraph of who they are, written for a reader — not spec language. */
  bio: string;
  /** A handful of defining details, in plain words. */
  details: string[];
  /** Alt text for the portrait. */
  alt: string;
};

export const CAST: CastMember[] = castPresentation.map(member => ({
  key: member.bibleKey,
  name: member.name,
  tagline: member.role,
  bio: member.bio,
  details: member.details,
  alt: member.alt,
}));

/** Explicit versioned portraits; never silently fall back to old concepts. */
export function portraitPath(member: CastMember): string {
  const current = castPresentation.find(character => character.bibleKey === member.key);
  if (!current) throw new Error(`No current cast portrait for ${member.key}`);
  return castPortrait(current.id);
}

/**
 * The character's full bible, rendered to HTML. The document's own H1 is the
 * page's heading, so it is dropped from the body. Returns null when the file
 * is missing.
 */
export function readBibleHtml(key: string): string | null {
  const file = path.join(repoRoot, "canon", "characters", key, "CHARACTER-BIBLE.md");
  if (!fs.existsSync(file)) return null;
  const body = fs.readFileSync(file, "utf8").replace(/^#\s+.*\n/, "");
  return renderMarkdown(body);
}
