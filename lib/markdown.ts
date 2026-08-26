// A very small Markdown renderer, sized exactly to what the canon documents
// use: headings, rules, blockquotes, tables, bullet lists and paragraphs, with
// bold/italic/code inline. The character bibles are the studio's own writing
// and the site shows them verbatim, so the renderer lives here rather than
// pulling a dependency the build does not otherwise need.
//
// It escapes first and marks up second, so nothing in a bible can inject HTML.

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
}

function tableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let index = 0;

  const flushParagraph = (buffer: string[]) => {
    if (buffer.length === 0) return;
    out.push("<p>" + inline(buffer.join(" ")) + "</p>");
    buffer.length = 0;
  };

  const paragraph: string[] = [];

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      flushParagraph(paragraph);
      index += 1;
      continue;
    }

    // Horizontal rule
    if (/^\s*---+\s*$/.test(line)) {
      flushParagraph(paragraph);
      out.push("<hr />");
      index += 1;
      continue;
    }

    // Heading
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph(paragraph);
      const level = heading[1].length;
      out.push("<h" + level + ">" + inline(heading[2]) + "</h" + level + ">");
      index += 1;
      continue;
    }

    // Table — a header row followed by a separator row
    if (line.trim().startsWith("|") && /^\s*\|[\s:|-]+\|\s*$/.test(lines[index + 1] ?? "")) {
      flushParagraph(paragraph);
      const head = tableRow(line);
      index += 2;
      const body: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        body.push(tableRow(lines[index]));
        index += 1;
      }
      out.push(
        "<table><thead><tr>" +
          head.map((cell) => "<th>" + inline(cell) + "</th>").join("") +
          "</tr></thead><tbody>" +
          body
            .map((row) => "<tr>" + row.map((cell) => "<td>" + inline(cell) + "</td>").join("") + "</tr>")
            .join("") +
          "</tbody></table>"
      );
      continue;
    }

    // Blockquote — consecutive "> " lines become one quote
    if (/^\s*>/.test(line)) {
      flushParagraph(paragraph);
      const quoted: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quoted.push(lines[index].replace(/^\s*>\s?/, ""));
        index += 1;
      }
      out.push("<blockquote>" + inline(quoted.join(" ")) + "</blockquote>");
      continue;
    }

    // Bullet list — continuation lines are indented under their item
    if (/^\s*[-*]\s+/.test(line)) {
      flushParagraph(paragraph);
      const items: string[] = [];
      while (index < lines.length && (/^\s*[-*]\s+/.test(lines[index]) || (/^\s{2,}\S/.test(lines[index]) && items.length > 0))) {
        if (/^\s*[-*]\s+/.test(lines[index])) {
          items.push(lines[index].replace(/^\s*[-*]\s+/, ""));
        } else {
          items[items.length - 1] += " " + lines[index].trim();
        }
        index += 1;
      }
      out.push("<ul>" + items.map((item) => "<li>" + inline(item) + "</li>").join("") + "</ul>");
      continue;
    }

    paragraph.push(line.trim());
    index += 1;
  }

  flushParagraph(paragraph);
  return out.join("\n");
}
