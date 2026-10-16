import type { CellValue, Range } from "../types/sheet";
import { parseCsv, serializeCsv } from "./csv";

export function rangeTsv(rows: readonly (readonly CellValue[])[], range: Range): string {
  if (range === null) {
    return "";
  }

  const normalized = normalizeRange(range);
  const selected: CellValue[][] = [];
  for (let rowIndex = normalized.startRow; rowIndex <= normalized.endRow; rowIndex += 1) {
    const row: CellValue[] = [];
    for (let colIndex = normalized.startCol; colIndex <= normalized.endCol; colIndex += 1) {
      row.push(rows[rowIndex]?.[colIndex] ?? "");
    }
    selected.push(row);
  }

  return serializeCsv(selected, "\t", "LF");
}

/** Quote empty and comma-containing fields too, so one-column copies retain shape. */
export function clipboardTsv(grid: readonly (readonly CellValue[])[]): string {
  return grid
    .map((row) =>
      row
        .map((value) =>
          value === "" || /[",\t\r\n]/.test(value) || value.trim() !== value
            ? `"${value.replaceAll('"', '""')}"`
            : value,
        )
        .join("\t"),
    )
    .join("\n");
}

export function parseClipboardText(text: string): CellValue[][] {
  if (text.length === 0) return [[""]];
  // parseCsv already handles external CR/LF terminators while preserving quoted newlines.
  // Keep legacy multi-line CSV import, but never reinterpret commas in a single raw cell.
  if (!text.includes("\t") && !/[\r\n]/.test(text) && !text.startsWith('"')) return [[text]];
  const delimiter = text.includes("\t") ? "\t" : ",";
  return parseCsv(text, delimiter);
}

export function normalizeRange(range: Exclude<Range, null>): Exclude<Range, null> {
  return {
    startRow: Math.min(range.startRow, range.endRow),
    startCol: Math.min(range.startCol, range.endCol),
    endRow: Math.max(range.startRow, range.endRow),
    endCol: Math.max(range.startCol, range.endCol),
  };
}
