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

export function serializeTableText(
  rows: readonly (readonly CellValue[])[],
  format: FileFormat,
  delimiter: Delimiter,
  newline: Newline,
): string {
  if (format === "json") {
    return `${JSON.stringify(rowsToObjects(rows), null, 2)}${newline === "CRLF" ? "\r\n" : "\n"}`;
  }
  if (format === "yaml") {
    return stringifyYaml(rowsToObjects(rows));
  }
  if (format === "markdown") {
    return serializeMarkdownTable(rows);
  }
  return serializeCsv(rows, delimiter, newline);
}

function parseObjectList(value: unknown): CellValue[][] {
  if (!Array.isArray(value)) {
    throw new Error("Expected an array of objects");
  }

  const records = value.filter((item): item is Record<string, unknown> => isPlainObject(item));
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

function rowsToObjects(rows: readonly (readonly CellValue[])[]): Record<string, string>[] {
  const headers = rows[0]?.map((header, index) => header.trim() || `column_${index + 1}`) ?? [];
  return rows.slice(1).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])),
  );
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

function serializeMarkdownTable(rows: readonly (readonly CellValue[])[]): string {
  if (rows.length === 0) {
    return "";
  }

  const columnCount = Math.max(...rows.map((row) => row.length), 1);
  const normalized = rows.map((row) =>
    Array.from({ length: columnCount }, (_, index) => escapeMarkdownCell(row[index] ?? "")),
  );
  const header = normalized[0];
  const separator = Array.from({ length: columnCount }, () => "---");
  return [header, separator, ...normalized.slice(1)].map((row) => `| ${row.join(" | ")} |`).join("\n");
}

function splitMarkdownRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells: string[] = [];
  let cell = "";
  let escaped = false;
  for (const char of trimmed) {
    if (escaped) {
      cell += char;
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === "|") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function escapeMarkdownCell(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("|", "\\|").replace(/\r?\n/g, "<br>");
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
