// The cast, in one place. The index page (/models) and the per-character
// bible pages (/models/[character]) both read from here, so a character is
// described once: the founder-facing introduction lives in this file, and the
// art department's full CHARACTER-BIBLE.md is read from /canon on demand.
//
// `study` is the drawn plate the reader meets the character through, made by
// ?study= on the smoke route. `concept` is the founder's own image, kept as
// the fallback until a study exists and as the thing the pipeline actually
// conditions on — but it is a photograph of a print, so it is second choice
// on a page rather than first.

import fs from "node:fs";
import path from "node:path";

import { renderMarkdown } from "@/lib/markdown";

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
  study: string;
  concept: string;
};

export const CAST: CastMember[] = [
  {
    key: "flamingo",
    name: "Drew",
    tagline: "The arch observer — a flamingo first, a gentleman second.",
    bio:
      "Drew is a flamingo — a real one, not a man in a bird suit — and he treats " +
      "that fact as entirely unremarkable. Mid-forties, comfortable, never ruffled. " +
      "He reads the day's news the way he reads a wine list, finds the mechanism " +
      "behind the headline, and delivers the verdict in one dry sentence. Then he " +
      "goes back to his martini.",
    details: [
      "Black silk bow tie, always",
      "Martini — one olive, one pick",
      "Heavy-lidded, amiable, unimpressed",
      "Sits frame-left, with Mango on his right",
    ],
    alt: "Drew — a flamingo in a black bow tie, drawn in ink",
    study: "studies/drew.png",
    concept: "drew-plate1-bar-reference.jpg",
  },
  {
    key: "dog",
    name: "Mango",
    tagline: "The worried everyman — the golden retriever who pays the bill.",
    bio:
      "Mango is a golden retriever in a good suit, and every worry he has shows up " +
      "in his eyebrows first. He reads the same headline as Drew and feels it in " +
      "his wallet — he is the one who pays the bill, and the one who says out loud " +
      "what things actually cost. Earnest, dignified, and a little more " +
      "tender-hearted than the room he drinks in.",
    details: [
      "Old fashioned — one large cube, one cherry",
      "US flag pin on whatever he wears",
      "True black dog lips, the founder's favourite feature",
      "Sits frame-right; never looks at the reader",
    ],
    alt: "Mango — a golden retriever in a suit jacket, drawn in ink",
    study: "studies/mango.png",
    concept: "mango-reference.jpg",
  },
  {
    key: "abby",
    name: "Abby",
    tagline: "The proprietor — her word settles the argument.",
    bio:
      "Abby is a West Highland terrier, and The Swinging Door is her bar. She has " +
      "heard every argument at that counter at least twice, which is why she never " +
      "loses one. Warm, quick, and entirely in command, she polishes glasses while " +
      "the gentlemen debate — and when she finally weighs in, the matter is settled.",
    details: [
      "Owns the bar, and works it herself",
      "Studded collar with a single teardrop gem",
      "White towel — over her shoulder or in her hands, never both",
      "Appears when the gag needs her",
    ],
    alt: "Abby — a West Highland terrier in a studded collar, drawn in ink",
    study: "studies/abby.png",
    concept: "abby-reference.jpg",
  },
];

/** The portrait to show: the drawn study when it exists, the concept otherwise. */
export function portraitPath(member: CastMember): string {
  const drawn = fs.existsSync(path.join(repoRoot, "canon", "vision", member.study));
  return `/vision/${drawn ? member.study : member.concept}`;
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
