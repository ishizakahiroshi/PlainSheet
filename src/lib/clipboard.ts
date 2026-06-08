import type { CellValue, ClipboardPayload, Range } from "../types/sheet";
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

export function parseClipboardText(text: string): CellValue[][] {
  if (text.length === 0) {
    return [[]];
  }

  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const withoutTrailingNewline = normalized.endsWith("\n") ? normalized.slice(0, -1) : normalized;
  const delimiter = withoutTrailingNewline.includes("\t") ? "\t" : ",";
  return parseCsv(withoutTrailingNewline, delimiter);
}

export function classifyClipboardText(text: string): ClipboardPayload {
  const rows = parseClipboardText(text);
  const isRange = rows.length > 1 || rows.some((row) => row.length > 1);
  return {
    rows,
    source: isRange ? "range" : "single-cell",
  };
}

export function normalizeRange(range: Exclude<Range, null>): Exclude<Range, null> {
  return {
    startRow: Math.min(range.startRow, range.endRow),
    startCol: Math.min(range.startCol, range.endCol),
    endRow: Math.max(range.startRow, range.endRow),
    endCol: Math.max(range.startCol, range.endCol),
  };
}
