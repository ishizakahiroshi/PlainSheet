import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type {
  CellValue,
  Delimiter,
  FileFormat,
  MarkdownAlignment,
  MarkdownLayout,
  Newline,
} from "../types/sheet";
import { parseCsv, serializeCsv } from "./csv";

export function parseTableText(text: string, format: FileFormat, delimiter: Delimiter): CellValue[][] {
  if (format === "json") {
    return parseObjectList(JSON.parse(text));
  }
  if (format === "yaml") {
    return parseObjectList(parseYaml(text));
  }
  if (format === "markdown") {
    return parseMarkdownTable(text);
  }
  return parseCsv(text, delimiter);
}

export type SerializeOptions = {
  sanitizeFormulas?: boolean;
  omitEmptyCells?: boolean;
  // Markdown only: the document the table came from. Without it the file is
  // written as the table alone.
  markdown?: MarkdownLayout;
};

export function serializeTableText(
  rows: readonly (readonly CellValue[])[],
  format: FileFormat,
  delimiter: Delimiter,
  newline: Newline,
  options: SerializeOptions = {},
): string {
  const { sanitizeFormulas = false, omitEmptyCells = false, markdown } = options;
  if (format === "json") {
    const json = JSON.stringify(rowsToObjects(rows, omitEmptyCells), null, 2);
    // JSON.stringify always emits LF; rewrite every break when the sheet asks for CRLF
    // (YAML path already does a full replace).
    return newline === "CRLF" ? `${json.replace(/\n/g, "\r\n")}\r\n` : `${json}\n`;
  }
  if (format === "yaml") {
    const yaml = stringifyYaml(rowsToObjects(rows, omitEmptyCells));
    return newline === "CRLF" ? yaml.replace(/\n/g, "\r\n") : yaml;
  }
  if (format === "markdown") {
    return markdown
      ? serializeMarkdownDocument(rows, newline, markdown)
      : serializeMarkdownTable(rows, newline);
  }
  return serializeCsv(rows, delimiter, newline, sanitizeFormulas);
}

function parseObjectList(value: unknown): CellValue[][] {
  // An empty YAML document (or comment-only file) parses to null. Treat that as
  // an empty sheet, matching how CSV/JSON empty inputs already behave, instead
  // of raising "Expected an array of objects" and failing the load.
  if (value == null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error("Expected an array of objects");
  }

  const records = value.filter((item): item is Record<string, unknown> => isPlainObject(item));
  if (records.length === 0) {
    // A non-empty array that holds no objects (an array of arrays, or of
    // scalars) is not a table this importer understands. Throwing lets the
    // caller report a load failure instead of silently showing an empty sheet.
    if (value.length > 0) {
      throw new Error("Expected an array of objects");
    }
    return [];
  }
  // Partial object lists (e.g. [{a:1}, 42, {a:2}]) used to drop non-objects
  // silently and lose rows. Require every element to be a plain object.
  if (records.length !== value.length) {
    throw new Error("Expected an array of objects");
  }
  const headers = Array.from(new Set(records.flatMap((record) => Object.keys(record))));
  if (headers.length === 0) {
    return [];
  }

  return [
    headers,
    ...records.map((record) =>
      headers.map((header) => {
        if (!Object.hasOwn(record, header)) {
          return "";
        }
        const value = record[header];
        if (value == null) {
          return "";
        }
        return typeof value === "object" ? JSON.stringify(value) : String(value);
      }),
    ),
  ];
}

function rowsToObjects(
  rows: readonly (readonly CellValue[])[],
  omitEmpty = false,
): Record<string, string>[] {
  // Widen the header row to the widest data row so extra cells past the last
  // named column are not dropped on JSON/YAML export (Markdown already keeps them).
  const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const headerSource = Array.from({ length: maxCols }, (_, index) => rows[0]?.[index] ?? "");
  const headers = uniqueHeaders(headerSource);
  const dataRows = rows.slice(1);
  // Header-only sheets must not serialize to [] — reopen would wipe column names.
  if (dataRows.length === 0 && headers.length > 0) {
    return [Object.fromEntries(headers.map((header) => [header, ""]))];
  }
  return dataRows.map((row, dataIndex) => {
    const entries = headers
      .map((header, index): [string, string] => [header, row[index] ?? ""])
      // Per-row omit drops empty values, but the first data row keeps every
      // header so a save-and-reopen round-trip preserves the original column
      // order (parseObjectList unions keys in first-appearance order).
      .filter(([, value]) => !omitEmpty || value !== "" || dataIndex === 0);
    return Object.fromEntries(entries);
  });
}

// Object keys must be unique, so build a 1:1 list of column keys: fill blanks
// with column_N and give any remaining duplicate a numeric suffix. Without
// this, same-named columns collapse to one key and silently drop data when a
// sheet is exported to JSON/YAML.
function uniqueHeaders(headerRow: readonly CellValue[]): string[] {
  const reserved = new Set(headerRow.map((header) => header.trim()).filter(Boolean));
  const used = new Set<string>();
  return headerRow.map((header, index) => {
    const trimmed = header.trim();
    if (trimmed !== "" && !used.has(trimmed)) {
      used.add(trimmed);
      return trimmed;
    }
    const base = trimmed || `column_${index + 1}`;
    let name = base;
    let suffix = 2;
    while (used.has(name) || reserved.has(name)) {
      name = `${base}_${suffix}`;
      suffix += 1;
    }
    used.add(name);
    return name;
  });
}

type MarkdownLine = { text: string; eol: string };

// Splits text into lines and keeps each line's own break, so the parts of a
// Markdown document around the table can be written back byte for byte.
// Indexes match text.split(/\r\n|\n|\r/).
function splitMarkdownLines(text: string): MarkdownLine[] {
  const lines: MarkdownLine[] = [];
  const pattern = /([^\r\n]*)(\r\n|\n|\r|$)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    lines.push({ text: match[1]!, eol: match[2]! });
    if (match[2] === "") {
      break;
    }
  }
  return lines;
}

// The first table: its header line index and the index just past its last row.
function locateMarkdownTable(lines: readonly string[]): { start: number; end: number } | null {
  const start = lines.findIndex(
    (line, index) => isMarkdownRow(line) && isSeparatorRow(lines[index + 1] ?? ""),
  );
  if (start === -1) {
    return null;
  }
  let end = start;
  while (end < lines.length && isMarkdownRow(lines[end]!)) {
    end += 1;
  }
  return { start, end };
}

function parseMarkdownTable(text: string): CellValue[][] {
  const lines = text.split(/\r\n|\n|\r/);
  const table = locateMarkdownTable(lines);
  if (!table) {
    return [];
  }

  const rows: CellValue[][] = [];
  for (let index = table.start; index < table.end; index += 1) {
    if (index === table.start + 1) {
      continue; // separator row
    }
    rows.push(splitMarkdownRow(lines[index]!));
  }
  return rows;
}

/**
 * Records what surrounds the first table of a Markdown document, so a save
 * rewrites only the table and keeps headings, prose, other tables and the
 * column alignments. A document without a table is kept whole in `before`.
 */
export function parseMarkdownLayout(text: string): MarkdownLayout {
  const lines = splitMarkdownLines(text);
  const table = locateMarkdownTable(lines.map((line) => line.text));
  if (!table) {
    return { hasTable: false, before: text, after: "", alignments: [] };
  }
  const join = (part: readonly MarkdownLine[]) =>
    part.map((line) => line.text + line.eol).join("");
  return {
    hasTable: true,
    before: join(lines.slice(0, table.start)),
    after: lines[table.end - 1]!.eol + join(lines.slice(table.end)),
    alignments: splitMarkdownRow(lines[table.start + 1]!.text).map(alignmentOf),
  };
}

function alignmentOf(cell: string): MarkdownAlignment {
  const token = cell.trim();
  const left = token.startsWith(":");
  const right = token.endsWith(":");
  if (left && right) {
    return "center";
  }
  if (left) {
    return "left";
  }
  return right ? "right" : "none";
}

const ALIGNMENT_MARKERS: Record<MarkdownAlignment, string> = {
  none: "---",
  left: ":---",
  center: ":---:",
  right: "---:",
};

function serializeMarkdownDocument(
  rows: readonly (readonly CellValue[])[],
  newline: Newline,
  layout: MarkdownLayout,
): string {
  const table = serializeMarkdownTable(rows, newline, layout.alignments);
  if (layout.hasTable) {
    return layout.before + table + layout.after;
  }
  if (table === "") {
    return layout.before;
  }
  // A table added to a document that had none goes after the existing text,
  // separated by a blank line.
  const nl = newline === "CRLF" ? "\r\n" : "\n";
  if (layout.before === "") {
    return table + nl;
  }
  const gap = /(\r\n|\n|\r)$/.test(layout.before) ? nl : nl + nl;
  return layout.before + gap + table + nl;
}

function serializeMarkdownTable(
  rows: readonly (readonly CellValue[])[],
  newline: Newline = "LF",
  alignments: readonly MarkdownAlignment[] = [],
): string {
  if (rows.length === 0) {
    return "";
  }

  // reduce instead of Math.max(...spread): a ~125K-row sheet would exceed the
  // engine's call-argument limit and throw on save.
  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 1);
  const normalized = rows.map((row) =>
    Array.from({ length: columnCount }, (_, index) => escapeMarkdownCell(row[index] ?? "")),
  );
  const header = normalized[0];
  const separator = Array.from(
    { length: columnCount },
    (_, index) => ALIGNMENT_MARKERS[alignments[index] ?? "none"],
  );
  return [header, separator, ...normalized.slice(1)]
    .map((row) => `| ${row.join(" | ")} |`)
    .join(newline === "CRLF" ? "\r\n" : "\n");
}

// Matches the <br> markers escapeMarkdownCell writes for in-cell newlines.
const BR_MARKER = /^<br\s*\/?>/i;

function splitMarkdownRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells: string[] = [];
  let cell = "";
  let escaped = false;
  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index];
    if (escaped) {
      cell += char;
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === "|") {
      cells.push(stripSerializerPadding(cell));
      cell = "";
    } else if (char === "<") {
      // An unescaped <br> is the newline marker; a user's literal <br> arrives
      // escaped (\<br>) and is handled by the `escaped` branch above, so it
      // never reaches here and is preserved as text.
      const match = BR_MARKER.exec(trimmed.slice(index));
      if (match) {
        cell += "\n";
        index += match[0].length - 1;
      } else {
        cell += char;
      }
    } else {
      cell += char;
    }
  }
  cells.push(stripSerializerPadding(cell));
  return cells;
}

// The serializer always inserts exactly one space of padding around each cell
// (`| a |`), so the parser should strip exactly that one leading and trailing
// space, not greedy whitespace. Greedy trim used to silently drop cells that
// were a single newline, started with a space, or contained only whitespace.
function stripSerializerPadding(cell: string): string {
  let result = cell;
  if (result.startsWith(" ")) {
    result = result.slice(1);
  }
  if (result.endsWith(" ")) {
    result = result.slice(0, -1);
  }
  return result;
}

function escapeMarkdownCell(value: string): string {
  return (
    value
      .replaceAll("\\", "\\\\")
      // Escape any literal <br> the user typed so it round-trips as text and is
      // not decoded as a newline on reopen.
      .replace(/<br\s*\/?>/gi, "\\$&")
      .replaceAll("|", "\\|")
      // Normalize lone CR as well as CRLF/LF so parseMarkdownTable's line split
      // on \r cannot fracture an in-cell carriage return into a broken table.
      .replace(/\r\n|\r|\n/g, "<br>")
  );
}

function isMarkdownRow(line: string): boolean {
  return line.trim().startsWith("|") && line.includes("|");
}

function isSeparatorRow(line: string): boolean {
  const cells = splitMarkdownRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
