import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { CellValue, Delimiter, FileFormat, Newline } from "../types/sheet";
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
};

export function serializeTableText(
  rows: readonly (readonly CellValue[])[],
  format: FileFormat,
  delimiter: Delimiter,
  newline: Newline,
  options: SerializeOptions = {},
): string {
  const { sanitizeFormulas = false, omitEmptyCells = false } = options;
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
    return serializeMarkdownTable(rows, newline);
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
  const used = new Set<string>();
  return headerRow.map((header, index) => {
    const base = header.trim() || `column_${index + 1}`;
    let name = base;
    let suffix = 2;
    while (used.has(name)) {
      name = `${base}_${suffix}`;
      suffix += 1;
    }
    used.add(name);
    return name;
  });
}

function parseMarkdownTable(text: string): CellValue[][] {
  const lines = text.split(/\r\n|\n|\r/);
  const start = lines.findIndex((line, index) => isMarkdownRow(line) && isSeparatorRow(lines[index + 1] ?? ""));
  if (start === -1) {
    return [];
  }

  const rows: CellValue[][] = [];
  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index];
    if (!isMarkdownRow(line)) {
      break;
    }
    if (index === start + 1 && isSeparatorRow(line)) {
      continue;
    }
    rows.push(splitMarkdownRow(line));
  }
  return rows;
}

function serializeMarkdownTable(
  rows: readonly (readonly CellValue[])[],
  newline: Newline = "LF",
): string {
  if (rows.length === 0) {
    return "";
  }

  const columnCount = Math.max(...rows.map((row) => row.length), 1);
  const normalized = rows.map((row) =>
    Array.from({ length: columnCount }, (_, index) => escapeMarkdownCell(row[index] ?? "")),
  );
  const header = normalized[0];
  const separator = Array.from({ length: columnCount }, () => "---");
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
