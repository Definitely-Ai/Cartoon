// The Registry — the studio's record of original work. One page that says
// what has been made, when, and in what form: the three characters, every
// finished panel with its caption, and the written canon that constitutes
// the series bible. It is an inventory an owner can print and hand to a
// lawyer — not a legal filing, and it invents nothing: every name, caption,
// count and word total is read from the repository when the page is opened,
// and every date comes from git history or from a date the repository
// itself recorded. Where neither exists, the page says "date not recorded".

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { formatDateLong } from "@/lib/format";

export const metadata = { title: "The Registry" };

// A record must describe the repository as it stands when it is opened,
// not as it stood when the site was built.
export const dynamic = "force-dynamic";

const serif = "Georgia, 'Times New Roman', serif";
const repoRoot = process.cwd();

/* ------------------------------------------------------------ dates */

/** Every date on this page is the Eastern calendar day, like the rest of
 *  the studio — a panel committed after eight at night is not dated
 *  tomorrow. Returns YYYY-MM-DD or null when the input is not a date. */
function toDay(iso: string | null | undefined): string | null {
  if (!iso || Number.isNaN(Date.parse(iso))) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** "August 28, 2026", or the honest admission. */
function shown(day: string | null): string {
  return day ? formatDateLong(day) : "date not recorded";
}

/**
 * When each file under /canon and /briefs first entered the repository:
 * one read-only `git log` walk, oldest commit first, keyed by repo-relative
 * path. If git is not available where this page runs (a deployment without
 * the .git directory), the map is empty and every date that depended on it
 * falls back to a date recorded in a file, or to "date not recorded" —
 * never to a guess.
 */
function firstCommitDates(): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const out = execFileSync(
      "git",
      ["log", "--diff-filter=A", "--format=~%aI", "--name-only", "--reverse", "--", "canon", "briefs"],
      { cwd: repoRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }
    );
    let current = "";
    for (const raw of out.split("\n")) {
      const line = raw.trim();
      if (line.startsWith("~")) current = line.slice(1);
      else if (line && current && !map.has(line)) map.set(line, current);
    }
  } catch {
    // No git here; file-recorded dates carry the page.
  }
  return map;
}

/* ------------------------------------------------------- characters */

type CharacterRecord = {
  key: string;
  name: string;
  line: string;
  portrait: string;
  alt: string;
  bibleDay: string | null;
  bibleWords: number;
};

// The one-line descriptions are the studio's own, condensed from each
// CHARACTER-BIBLE.md; the name is read from the bible's heading so the
// record and the document can never disagree.
const CHARACTER_SOURCES = [
  {
    key: "flamingo",
    fallbackName: "Drew",
    line: "The arch observer — a flamingo in a black silk bow tie, martini in reach, never ruffled.",
    study: "studies/drew.png",
    concept: "drew-plate1-bar-reference.jpg",
    alt: "Drew — a flamingo in a black bow tie, drawn in ink",
  },
  {
    key: "dog",
    fallbackName: "Mango",
    line: "The worried everyman — a golden retriever in a good suit, the one who pays the bill.",
    study: "studies/mango.png",
    concept: "mango-reference.jpg",
    alt: "Mango — a golden retriever in a suit jacket, drawn in ink",
  },
  {
    key: "abby",
    fallbackName: "Abby",
    line: "The proprietor — a West Highland terrier; the bar is hers, and her word settles the argument.",
    study: "studies/abby.png",
    concept: "abby-reference.jpg",
    alt: "Abby — a West Highland terrier behind the bar, drawn in ink",
  },
];

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function readCharacters(firstAdds: Map<string, string>): CharacterRecord[] {
  return CHARACTER_SOURCES.map((source) => {
    const rel = `canon/characters/${source.key}/CHARACTER-BIBLE.md`;
    const file = path.join(repoRoot, rel);
    let markdown = "";
    try {
      markdown = fs.readFileSync(file, "utf8");
    } catch {
      // A missing bible still gets a row; the words column says 0.
    }
    // "# Drew — Character Bible" → "Drew"
    const heading = markdown.match(/^#\s+(.+)$/m)?.[1] ?? "";
    const name = heading.split("—")[0]?.trim() || source.fallbackName;
    const drawn = fs.existsSync(path.join(repoRoot, "canon", "vision", source.study));
    return {
      key: source.key,
      name,
      line: source.line,
      portrait: `/vision/${drawn ? source.study : source.concept}`,
      alt: source.alt,
      bibleDay: toDay(firstAdds.get(rel) ?? null),
      bibleWords: wordCount(markdown),
    };
  });
}

/* --------------------------------------------------------- cartoons */

type PanelRecord = {
  file: string;
  n: number | null;
  speaker: string;
  caption: string;
  lettering: string; // TV headline and chalkboard text drawn into the panel
  day: string | null;
};

type BatchRecord = {
  batch: string;
  brief: string;
  day: string | null;
  planned: number;
  panels: PanelRecord[];
};

type RetiredPanel = {
  file: string;
  caption: string;
  note: string;
  day: string | null;
};

const SPEAKERS: Record<string, string> = { drew: "Drew", mango: "Mango", abby: "Abby" };

function speakerName(key: string): string {
  if (!key) return "";
  return SPEAKERS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

/** The current batches: briefs/<batch>/NN-slug.png, captioned by the
 *  batch's plan.json. Only panels that exist on disk are counted — a plan
 *  is an intention, a PNG is a work. */
function readBatches(firstAdds: Map<string, string>): BatchRecord[] {
  const briefsDir = path.join(repoRoot, "briefs");
  if (!fs.existsSync(briefsDir)) return [];
  const batches: BatchRecord[] = [];
  const folders = fs
    .readdirSync(briefsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(); // batch ids start with a UTC stamp, so sorted is oldest first

  for (const batch of folders) {
    const dir = path.join(briefsDir, batch);
    let plan: {
      brief?: string;
      createdAt?: string;
      panels?: { file?: string; n?: number; speaker?: string; caption?: string; tv?: string; board?: string }[];
    } = {};
    try {
      plan = JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8"));
    } catch {
      // A batch without a readable plan still lists its drawn files below.
    }
    const planned = Array.isArray(plan.panels) ? plan.panels : [];
    const byFile = new Map(planned.filter((p) => p.file).map((p) => [p.file as string, p]));
    const batchDay = toDay(plan.createdAt ?? null);

    const drawn = fs
      .readdirSync(dir)
      .filter((file) => file.endsWith(".png"))
      .sort();
    if (drawn.length === 0) continue;

    const panels: PanelRecord[] = drawn.map((file) => {
      const entry = byFile.get(file);
      const lettering = [entry?.tv ? `TV: ${entry.tv}` : "", entry?.board ? `Board: ${entry.board}` : ""]
        .filter(Boolean)
        .join(" · ");
      return {
        file,
        n: typeof entry?.n === "number" ? entry.n : null,
        speaker: speakerName(entry?.speaker ?? ""),
        caption: entry?.caption ?? "caption not recorded",
        lettering,
        day: toDay(firstAdds.get(`briefs/${batch}/${file}`) ?? null) ?? batchDay,
      };
    });

    batches.push({
      batch,
      brief: plan.brief ?? "brief not recorded",
      day: batchDay,
      planned: planned.length,
      panels,
    });
  }
  return batches;
}

/** The earlier finished set, retired from display but part of the record.
 *  Its index.json names each file, its caption, and the TV headline; the
 *  source field carries the stamp of the day each panel was made. */
function readRetired(): RetiredPanel[] {
  const file = path.join(repoRoot, "canon", "showcase-retired", "index.json");
  if (!fs.existsSync(file)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as {
      file?: string;
      caption?: string;
      note?: string;
      source?: string;
    }[];
    if (!Array.isArray(parsed)) return [];
    const dir = path.join(repoRoot, "canon", "showcase-retired");
    return parsed
      .filter((entry) => entry.file && fs.existsSync(path.join(dir, entry.file)))
      .map((entry) => {
        const stamp = entry.source?.match(/^(\d{4})(\d{2})(\d{2})-/);
        return {
          file: entry.file as string,
          caption: entry.caption ?? "caption not recorded",
          note: entry.note ?? "",
          day: stamp ? `${stamp[1]}-${stamp[2]}-${stamp[3]}` : null,
        };
      });
  } catch {
    return [];
  }
}

/* ----------------------------------------------------- written work */

type DocRecord = {
  rel: string;
  title: string;
  line: string;
  words: number;
  day: string | null;
};

// What each canon document is, in one plain line. A document this map does
// not know still appears — with its own heading and a generic line — so the
// record can never silently omit a new bible.
const DOC_LINES: Record<string, string> = {
  "canon/MASTER-PROMPT.md": "The master instruction for drawing a panel — the document the pipeline reads first.",
  "canon/HARRINGTON-VISION.md": "The founder's visual standard — what the reference plates established, and how disputes are settled.",
  "canon/README.md": "How the canon is organized and which document wins when two disagree.",
  "canon/comedy/COMEDY-BIBLE.md": "How a Swinging Door joke is built — the turns, the taboos, and the daily test.",
  "canon/settings/SETTINGS-BIBLE.md": "The rooms — the bar first, and every place the strip is allowed to go.",
  "canon/style/STYLE-BIBLE.md": "The ink — line, wash, lettering, and the finish of a panel.",
  "canon/personality/PERSONALITIES.md": "The voices — how each character speaks, and what each would never say.",
  "canon/characters/flamingo/CHARACTER-BIBLE.md": "Drew in full — every rule of his design, each traced to a founder correction.",
  "canon/characters/dog/CHARACTER-BIBLE.md": "Mango in full — every rule of his design, each traced to a founder correction.",
  "canon/characters/abby/CHARACTER-BIBLE.md": "Abby in full — every rule of her design, each traced to a founder correction.",
  "canon/characters/flamingo/DESCRIPTION.md": "Drew in one page — the canonical short description.",
  "canon/characters/dog/DESCRIPTION.md": "Mango in one page — the canonical short description.",
  "canon/characters/abby/DESCRIPTION.md": "Abby in one page — the canonical short description.",
  "canon/characters/flamingo/PROMPT-BLOCKS.md": "The exact wording the pipeline uses to ask for Drew.",
  "canon/characters/dog/PROMPT-BLOCKS.md": "The exact wording the pipeline uses to ask for Mango.",
  "canon/characters/abby/PROMPT-BLOCKS.md": "The exact wording the pipeline uses to ask for Abby.",
  "canon/characters/flamingo/QUALITY-CONTROL.md": "The checks a drawing of Drew must pass before it is kept.",
  "canon/characters/dog/QUALITY-CONTROL.md": "The checks a drawing of Mango must pass before it is kept.",
  "canon/characters/abby/QUALITY-CONTROL.md": "The checks a drawing of Abby must pass before it is kept.",
  "canon/creation/WORKFLOW.md": "How a cartoon travels from a one-line brief to a finished panel.",
  "canon/creation/PANEL-INSPECTION.md": "The inspection a finished panel gets before anyone sees it.",
  "canon/creation/SCENE-QC.md": "The scene checks — room, props, and continuity.",
  "canon/creation/SAMPLE-ART-PROMPTS.md": "The prompt set used to draw the sample art.",
};

// The reading order of the record: the series-wide bibles first, then each
// character's papers, then the working documents. Anything new lands after
// these, alphabetically.
const DOC_ORDER = [
  "canon/MASTER-PROMPT.md",
  "canon/HARRINGTON-VISION.md",
  "canon/comedy/COMEDY-BIBLE.md",
  "canon/settings/SETTINGS-BIBLE.md",
  "canon/style/STYLE-BIBLE.md",
  "canon/personality/PERSONALITIES.md",
  "canon/characters/flamingo/CHARACTER-BIBLE.md",
  "canon/characters/dog/CHARACTER-BIBLE.md",
  "canon/characters/abby/CHARACTER-BIBLE.md",
  "canon/characters/flamingo/DESCRIPTION.md",
  "canon/characters/dog/DESCRIPTION.md",
  "canon/characters/abby/DESCRIPTION.md",
  "canon/characters/flamingo/PROMPT-BLOCKS.md",
  "canon/characters/dog/PROMPT-BLOCKS.md",
  "canon/characters/abby/PROMPT-BLOCKS.md",
  "canon/characters/flamingo/QUALITY-CONTROL.md",
  "canon/characters/dog/QUALITY-CONTROL.md",
  "canon/characters/abby/QUALITY-CONTROL.md",
  "canon/creation/WORKFLOW.md",
  "canon/creation/PANEL-INSPECTION.md",
  "canon/creation/SCENE-QC.md",
  "canon/creation/SAMPLE-ART-PROMPTS.md",
  "canon/README.md",
];

function titleFromFilename(rel: string): string {
  const base = path.basename(rel, ".md").replace(/[-_]+/g, " ").toLowerCase();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function readDocuments(firstAdds: Map<string, string>): DocRecord[] {
  const canonDir = path.join(repoRoot, "canon");
  if (!fs.existsSync(canonDir)) return [];
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".md")) found.push(path.relative(repoRoot, full));
    }
  };
  walk(canonDir);

  const rank = new Map(DOC_ORDER.map((rel, i) => [rel, i]));
  found.sort((a, b) => {
    const ra = rank.get(a) ?? DOC_ORDER.length;
    const rb = rank.get(b) ?? DOC_ORDER.length;
    return ra === rb ? a.localeCompare(b) : ra - rb;
  });

  return found.map((rel) => {
    let text = "";
    try {
      text = fs.readFileSync(path.join(repoRoot, rel), "utf8");
    } catch {
      // Unreadable file: recorded by name, 0 words.
    }
    return {
      rel,
      title: text.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? titleFromFilename(rel),
      line: DOC_LINES[rel] ?? "A canon document of the series bible.",
      words: wordCount(text),
      day: toDay(firstAdds.get(rel) ?? null),
    };
  });
}

/* ------------------------------------------------------------- page */

const th: React.CSSProperties = {
  fontFamily: serif,
  textAlign: "left",
  fontWeight: 600,
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#6b6153",
  borderBottom: "2px solid #221d16",
  padding: "8px 12px 6px",
  verticalAlign: "bottom",
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #e8e2d6",
  padding: "9px 12px",
  verticalAlign: "top",
  fontSize: 15,
  lineHeight: 1.55,
  color: "#2c261e",
};

const tdDate: React.CSSProperties = { ...td, whiteSpace: "nowrap", fontFamily: serif, fontSize: 14, color: "#4a4136" };

function PanelTable({ label, panels }: { label: string; panels: PanelRecord[] }) {
  return (
    <div className="reg-tablewrap">
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <caption className="reg-visually-hidden">{label}</caption>
        <thead>
          <tr>
            <th scope="col" style={{ ...th, width: 44 }}>
              No.
            </th>
            <th scope="col" style={th}>
              Caption
            </th>
            <th scope="col" style={{ ...th, whiteSpace: "nowrap" }}>
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {panels.map((panel, i) => (
            <tr key={panel.file}>
              <td style={{ ...tdDate, textAlign: "right" }}>{panel.n ?? i + 1}</td>
              <td style={td}>
                {panel.speaker ? (
                  <span style={{ fontFamily: serif, color: "#6b6153" }}>{panel.speaker}: </span>
                ) : null}
                <span style={{ fontFamily: serif }}>&ldquo;{panel.caption}&rdquo;</span>
                {panel.lettering ? (
                  <span style={{ display: "block", fontSize: 13, color: "#8a7f6d", marginTop: 3 }}>
                    Lettered in the panel — {panel.lettering}
                  </span>
                ) : null}
                <span style={{ display: "block", fontSize: 12.5, color: "#a99e8b", marginTop: 3 }}>
                  <code style={{ fontSize: 12 }}>{panel.file}</code>
                </span>
              </td>
              <td style={tdDate}>{shown(panel.day)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RegistryPage() {
  const firstAdds = firstCommitDates();
  const characters = readCharacters(firstAdds);
  const batches = readBatches(firstAdds);
  const retired = readRetired();
  const documents = readDocuments(firstAdds);

  const drawnCount = batches.reduce((sum, b) => sum + b.panels.length, 0);
  const panelCount = drawnCount + retired.length;
  const bibleWords = documents.reduce((sum, d) => sum + d.words, 0);

  // Every day this record knows about, for the first/latest lines. Only
  // dates actually found in git or in the files count; nothing is guessed.
  const allDays = [
    ...characters.map((c) => c.bibleDay),
    ...retired.map((p) => p.day),
    ...batches.flatMap((b) => b.panels.map((p) => p.day)),
    ...documents.map((d) => d.day),
  ].filter((d): d is string => Boolean(d));
  const firstDay = allDays.length ? allDays.reduce((a, b) => (a < b ? a : b)) : null;
  const latestDay = allDays.length ? allDays.reduce((a, b) => (a > b ? a : b)) : null;

  const panelDays = [...retired.map((p) => p.day), ...batches.flatMap((b) => b.panels.map((p) => p.day))].filter(
    (d): d is string => Boolean(d)
  );
  const firstPanelDay = panelDays.length ? panelDays.reduce((a, b) => (a < b ? a : b)) : null;
  const latestPanelDay = panelDays.length ? panelDays.reduce((a, b) => (a > b ? a : b)) : null;

  const today = toDay(new Date().toISOString());

  const summary: [string, React.ReactNode][] = [
    ["Series", <span key="s">The Swinging Door — a daily single-panel black-and-white gag cartoon</span>],
    ["Owner", <span key="o">The studio and its founder</span>],
    ["Original characters", <span key="c">{characters.length} — {characters.map((c) => c.name).join(", ")}</span>],
    [
      "Finished panels",
      <span key="p">
        {panelCount} — {retired.length} in the retired set, {drawnCount} in the current batches
      </span>,
    ],
    [
      "Series bible",
      <span key="b">
        {documents.length} documents, {bibleWords.toLocaleString("en-US")} words
      </span>,
    ],
    ["First recorded work", <span key="f">{shown(firstDay)}</span>],
    ["Most recent work", <span key="l">{shown(latestDay)}</span>],
  ];

  return (
    <main
      className="registry"
      style={
        {
          maxWidth: 1080,
          margin: "24px auto 48px",
          padding: "26px 34px 72px",
          color: "#221d16",
          background: "#fdfbf6",
          borderRadius: 8,
          boxShadow: "0 2px 18px rgba(0,0,0,0.35)",
          // The dark-room chrome sets the focus ring to paper-white; on
          // this paper page that ring would vanish, so it is ink here.
          "--focus-ink": "#221d16",
        } as React.CSSProperties
      }
    >
      <header style={{ textAlign: "center", margin: "30px 0 8px" }}>
        <p style={{ fontFamily: serif, letterSpacing: 3, fontSize: 12, textTransform: "uppercase", color: "#8a7f6d", margin: 0 }}>
          Registry of Original Work
        </p>
        <h1 style={{ fontFamily: serif, fontSize: 44, margin: "8px 0 0", letterSpacing: 0.5 }}>The Swinging Door</h1>
        <p
          style={{
            fontFamily: serif,
            fontStyle: "italic",
            fontSize: 17,
            color: "#5a5145",
            margin: "12px auto 0",
            maxWidth: 640,
            lineHeight: 1.6,
          }}
        >
          The Swinging Door and its characters are the original work of the studio.
          This page records what has been made and when.
        </p>
        <p style={{ fontFamily: serif, fontSize: 13.5, color: "#8a7f6d", margin: "10px 0 0" }}>
          Compiled from the studio&rsquo;s repository{today ? ` · ${formatDateLong(today)}` : ""}
        </p>
      </header>

      <nav
        className="reg-pagenav"
        aria-label="On this page"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          flexWrap: "wrap",
          fontFamily: serif,
          fontSize: 14,
          margin: "20px 0 36px",
          color: "#6b6153",
        }}
      >
        <a href="#glance" style={{ color: "#6b6153" }}>At a glance</a>
        <span aria-hidden>·</span>
        <a href="#characters" style={{ color: "#6b6153" }}>The characters</a>
        <span aria-hidden>·</span>
        <a href="#cartoons" style={{ color: "#6b6153" }}>The cartoons</a>
        <span aria-hidden>·</span>
        <a href="#writing" style={{ color: "#6b6153" }}>The written work</a>
      </nav>

      {/* -------------------------------------------------- at a glance */}
      <section id="glance" style={{ margin: "0 0 48px", scrollMarginTop: 20 }}>
        <h2 style={{ fontFamily: serif, fontSize: 28, borderBottom: "2px solid #1a1a1a", paddingBottom: 8, margin: 0 }}>
          The record at a glance
        </h2>
        <div className="reg-tablewrap">
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14, maxWidth: 780 }}>
            <caption className="reg-visually-hidden">Summary of the body of work</caption>
            <tbody>
              {summary.map(([label, value]) => (
                <tr key={label}>
                  <th
                    scope="row"
                    style={{
                      ...td,
                      fontFamily: serif,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      width: 200,
                      color: "#4a4136",
                      textAlign: "left",
                    }}
                  >
                    {label}
                  </th>
                  <td style={td}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13.5, color: "#8a7f6d", marginTop: 12, maxWidth: 720, lineHeight: 1.6 }}>
          Dates are the days work entered the studio&rsquo;s repository, on the founder&rsquo;s clock (Eastern time).
          Where the repository holds no date, this page says so rather than guessing.
        </p>
      </section>

      {/* --------------------------------------------------- characters */}
      <section id="characters" style={{ margin: "48px 0", scrollMarginTop: 20 }}>
        <h2 style={{ fontFamily: serif, fontSize: 28, borderBottom: "2px solid #1a1a1a", paddingBottom: 8, margin: 0 }}>
          The characters <span style={{ fontSize: 17, color: "#8a7f6d" }}>({characters.length})</span>
        </h2>
        <p style={{ color: "#5a5145", marginTop: 10, maxWidth: 740, lineHeight: 1.6 }}>
          Three original characters, each defined by a written character bible kept in the repository at{" "}
          <code style={{ fontSize: 13 }}>canon/characters/</code>. The portrait shown is the current definitive study.
        </p>
        <div className="reg-castgrid">
          {characters.map((member) => (
            <article
              key={member.key}
              style={{
                border: "1px solid #ded7c9",
                borderRadius: 10,
                background: "#fffdf8",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={member.portrait}
                alt={member.alt}
                style={{
                  display: "block",
                  width: "100%",
                  aspectRatio: "3 / 4",
                  objectFit: "cover",
                  background: "#fff",
                  borderBottom: "1px solid #e5dfd3",
                }}
              />
              <div style={{ padding: "16px 20px 20px" }}>
                <h3 style={{ fontFamily: serif, fontSize: 26, margin: 0 }}>{member.name}</h3>
                <p style={{ fontFamily: serif, fontStyle: "italic", color: "#5a5145", fontSize: 14.5, margin: "6px 0 0", lineHeight: 1.55 }}>
                  {member.line}
                </p>
                <dl style={{ margin: "14px 0 0", padding: "10px 0 0", borderTop: "1px solid #ece6d9", fontSize: 13.5, color: "#4a4136" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <dt style={{ fontFamily: serif, fontWeight: 600 }}>Bible first committed</dt>
                    <dd style={{ margin: 0 }}>{shown(member.bibleDay)}</dd>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <dt style={{ fontFamily: serif, fontWeight: 600 }}>Bible today</dt>
                    <dd style={{ margin: 0 }}>{member.bibleWords.toLocaleString("en-US")} words</dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------- cartoons */}
      <section id="cartoons" style={{ margin: "48px 0", scrollMarginTop: 20 }}>
        <h2 style={{ fontFamily: serif, fontSize: 28, borderBottom: "2px solid #1a1a1a", paddingBottom: 8, margin: 0 }}>
          The cartoons <span style={{ fontSize: 17, color: "#8a7f6d" }}>({panelCount})</span>
        </h2>
        <p style={{ color: "#5a5145", marginTop: 10, maxWidth: 740, lineHeight: 1.6 }}>
          {panelCount} finished panels
          {firstPanelDay && latestPanelDay ? (
            <>
              , made between <strong>{formatDateLong(firstPanelDay)}</strong> and{" "}
              <strong>{formatDateLong(latestPanelDay)}</strong>
            </>
          ) : null}
          . Each panel is a drawing with its caption; the caption is the written half of the work and is recorded
          here in full, together with any headline or chalkboard text lettered into the drawing itself. The retired
          set lives at <code style={{ fontSize: 13 }}>canon/showcase-retired/</code>; the current batches live under{" "}
          <code style={{ fontSize: 13 }}>briefs/</code>. The seven dated panels under <code style={{ fontSize: 13 }}>cartoons/</code>{" "}
          are development samples, recorded as such in that folder, and are not counted here.
        </p>

        {retired.length > 0 ? (
          <article style={{ marginTop: 30 }}>
            <h3 style={{ fontFamily: serif, fontSize: 21, margin: 0 }}>
              The retired set <span style={{ fontSize: 15, color: "#8a7f6d" }}>({retired.length} panels)</span>
            </h3>
            <p style={{ fontFamily: serif, fontStyle: "italic", color: "#5a5145", fontSize: 14.5, margin: "6px 0 0", maxWidth: 740 }}>
              An earlier finished set, since taken off display while the characters were rebuilt — retired from the
              wall, not from the record.
            </p>
            <div className="reg-tablewrap">
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                <caption className="reg-visually-hidden">The retired set of panels</caption>
                <thead>
                  <tr>
                    <th scope="col" style={{ ...th, width: 44 }}>No.</th>
                    <th scope="col" style={th}>Caption</th>
                    <th scope="col" style={th}>On the TV</th>
                    <th scope="col" style={{ ...th, whiteSpace: "nowrap" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {retired.map((panel, i) => (
                    <tr key={panel.file}>
                      <td style={{ ...tdDate, textAlign: "right" }}>{i + 1}</td>
                      <td style={td}>
                        <span style={{ fontFamily: serif }}>{panel.caption}</span>
                        <span style={{ display: "block", fontSize: 12.5, color: "#a99e8b", marginTop: 3 }}>
                          <code style={{ fontSize: 12 }}>{panel.file}</code>
                        </span>
                      </td>
                      <td style={{ ...td, fontSize: 13, color: "#6b6153" }}>{panel.note || "—"}</td>
                      <td style={tdDate}>{shown(panel.day)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ) : null}

        {batches.map((batch) => (
          <article key={batch.batch} style={{ marginTop: 34 }}>
            <h3 style={{ fontFamily: serif, fontSize: 21, margin: 0 }}>
              Batch of {batch.day ? formatDateLong(batch.day) : "an unrecorded date"}{" "}
              <span style={{ fontSize: 15, color: "#8a7f6d" }}>
                ({batch.panels.length} {batch.panels.length === 1 ? "panel" : "panels"}
                {batch.planned > batch.panels.length ? ` drawn of ${batch.planned} planned` : ""})
              </span>
            </h3>
            <p style={{ fontFamily: serif, fontStyle: "italic", color: "#5a5145", fontSize: 14.5, margin: "6px 0 0", maxWidth: 740, lineHeight: 1.6 }}>
              The brief: &ldquo;{batch.brief}&rdquo;
            </p>
            <p style={{ fontSize: 12.5, color: "#a99e8b", margin: "4px 0 0" }}>
              <code style={{ fontSize: 12 }}>briefs/{batch.batch}/</code>
            </p>
            <PanelTable
              label={`Panels in the batch of ${batch.day ? formatDateLong(batch.day) : batch.batch}`}
              panels={batch.panels}
            />
          </article>
        ))}
      </section>

      {/* ------------------------------------------------- written work */}
      <section id="writing" style={{ margin: "48px 0 24px", scrollMarginTop: 20 }}>
        <h2 style={{ fontFamily: serif, fontSize: 28, borderBottom: "2px solid #1a1a1a", paddingBottom: 8, margin: 0 }}>
          The written work <span style={{ fontSize: 17, color: "#8a7f6d" }}>({documents.length} documents)</span>
        </h2>
        <p style={{ color: "#5a5145", marginTop: 10, maxWidth: 740, lineHeight: 1.6 }}>
          The series bible: every canon document in the repository, {bibleWords.toLocaleString("en-US")} words in
          all. Word counts are the documents as they stand today; the date is the day each document first entered
          the repository.
        </p>
        <div className="reg-tablewrap">
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14 }}>
            <caption className="reg-visually-hidden">The canon documents</caption>
            <thead>
              <tr>
                <th scope="col" style={th}>Document</th>
                <th scope="col" style={th}>What it is</th>
                <th scope="col" style={{ ...th, textAlign: "right" }}>Words</th>
                <th scope="col" style={{ ...th, whiteSpace: "nowrap" }}>First committed</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.rel}>
                  <td style={td}>
                    <span style={{ fontFamily: serif, fontWeight: 600 }}>{doc.title}</span>
                    <span style={{ display: "block", fontSize: 12.5, color: "#a99e8b", marginTop: 3 }}>
                      <code style={{ fontSize: 12 }}>{doc.rel}</code>
                    </span>
                  </td>
                  <td style={{ ...td, fontSize: 14 }}>{doc.line}</td>
                  <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {doc.words.toLocaleString("en-US")}
                  </td>
                  <td style={tdDate}>{shown(doc.day)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={2} style={{ ...td, fontFamily: serif, fontWeight: 600, borderTop: "2px solid #221d16", textAlign: "left" }}>
                  In all
                </th>
                <td style={{ ...td, textAlign: "right", fontWeight: 600, borderTop: "2px solid #221d16", whiteSpace: "nowrap" }}>
                  {bibleWords.toLocaleString("en-US")}
                </td>
                <td style={{ ...td, borderTop: "2px solid #221d16" }} />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <footer style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #ded7c9" }}>
        <p style={{ fontFamily: serif, fontSize: 13.5, color: "#8a7f6d", maxWidth: 720, lineHeight: 1.6, margin: 0 }}>
          This page is an inventory, generated from the studio&rsquo;s repository each time it is opened. It is a
          record of the work, not a legal filing. Every caption, count and word total above is read from the files;
          every date comes from the repository&rsquo;s history or from a date the files themselves record.
        </p>
      </footer>

      <style>{`
        .reg-visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
          border: 0;
        }
        .reg-tablewrap { overflow-x: auto; }
        .reg-castgrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .registry a:focus-visible { outline: 2px solid #221d16; outline-offset: 2px; }
        @media (max-width: 560px) {
          .registry { padding-left: 16px !important; padding-right: 16px !important; }
          .registry h1 { font-size: 34px !important; }
        }
        @media print {
          .br-head, .br-staff-links, .br-foot, .reg-pagenav { display: none !important; }
          .backroom { background: #fff !important; color: #000 !important; }
          .registry {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .registry a { color: inherit !important; text-decoration: none !important; }
          .registry tr, .registry article { break-inside: avoid; }
          .registry h2 { break-after: avoid; }
          .registry section { margin: 24px 0 !important; }
          .reg-castgrid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </main>
  );
}
