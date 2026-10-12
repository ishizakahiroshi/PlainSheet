import type { CellValue, Range } from "../types/sheet";
import { parseCsv, serializeCsv } from "./csv";

export type ClipboardFormat = "auto" | "tsv" | "csv" | "single-column";
export type ClipboardSnapshot = {
  version: 1;
  text: string;
  rowCount: number;
  colCount: number;
  rows: CellValue[][];
};
export const PLAINSHEET_CLIPBOARD_MIME = "application/x-plainsheet-grid+json";

/** Capture before copy; retain only after the clipboard write succeeds. */
export function createClipboardSnapshot(
  rows: readonly (readonly CellValue[])[],
  range: Exclude<Range, null>,
): ClipboardSnapshot {
  const normalized = normalizeRange(range);
  const selected: CellValue[][] = [];
  for (let rowIndex = normalized.startRow; rowIndex <= normalized.endRow; rowIndex += 1) {
    const row: CellValue[] = [];
    for (let colIndex = normalized.startCol; colIndex <= normalized.endCol; colIndex += 1)
      row.push(rows[rowIndex]?.[colIndex] ?? "");
    selected.push(row);
  }
  return {
    version: 1,
    text: serializeCsv(selected, "\t", "LF"),
    rowCount: selected.length,
    colCount: normalized.endCol - normalized.startCol + 1,
    rows: selected,
  };
}

export function rangeTsv(rows: readonly (readonly CellValue[])[], range: Range): string {
  return range === null ? "" : createClipboardSnapshot(rows, range).text;
}

/** Validate optional custom clipboard data against its accompanying plain text. */
export function readClipboardSnapshot(serialized: string, text: string): ClipboardSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!isMatchingSnapshot(parsed, text)) return null;
    return { ...parsed, rows: parsed.rows.map((row) => [...row]) };
  } catch {
    return null;
  }
}

/**
 * Exact last-copy provenance is session-local and never inferred from content.
 * A changed clipboard falls back to the external-text parser. Return a clone so
 * pasting cannot change a future paste's source or the document being copied.
 */
export function resolveClipboardText(
  text: string,
  snapshot?: ClipboardSnapshot | null,
  format: ClipboardFormat = "auto",
): CellValue[][] {
  if (snapshot && isMatchingSnapshot(snapshot, text)) return snapshot.rows.map((row) => [...row]);
  return parseClipboardText(text, format);
}

/**
 * External text: TSV is automatic only with a tab. Comma/quoted one-column
 * input is ambiguous and must be previewed before the user selects CSV/TSV.
 * Safe auto keeps literal comma/quote text intact. Explicit CSV remains fully
 * supported. A final line terminator is ignored for external clipboard text;
 * exact self-copy dimensions (including trailing blank rows) use provenance.
 */
export function parseClipboardText(text: string, format: ClipboardFormat = "auto"): CellValue[][] {
  if (format === "csv" || format === "tsv" || (format === "auto" && text.includes("\t"))) {
    return text === "" ? [[""]] : parseCsv(text, format === "csv" ? "," : "\t");
  }
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
  return lines.map((line) => [line]);
}

/** Whether external input warrants a TSV/CSV/single-column preview choice. */
export function clipboardNeedsFormatChoice(text: string): boolean {
  if (text.includes("\t")) return false;
  return text.includes(",") || text.includes('"') || /(?:\r\n|\n|\r){2}$/.test(text);
}

function isMatchingSnapshot(value: unknown, text: string): value is ClipboardSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<ClipboardSnapshot>;
  return (
    snapshot.version === 1 &&
    snapshot.text === text &&
    Number.isSafeInteger(snapshot.rowCount) &&
    snapshot.rowCount! > 0 &&
    Number.isSafeInteger(snapshot.colCount) &&
    snapshot.colCount! > 0 &&
    Array.isArray(snapshot.rows) &&
    snapshot.rows.length === snapshot.rowCount &&
    snapshot.rows.every(
      (row) =>
        Array.isArray(row) &&
        row.length === snapshot.colCount &&
        row.every((cell) => typeof cell === "string"),
    ) &&
    serializeCsv(snapshot.rows, "\t", "LF") === text
  );
}

export function normalizeRange(range: Exclude<Range, null>): Exclude<Range, null> {
  return {
    startRow: Math.min(range.startRow, range.endRow),
    startCol: Math.min(range.startCol, range.endCol),
    endRow: Math.max(range.startRow, range.endRow),
    endCol: Math.max(range.startCol, range.endCol),
  };
}
