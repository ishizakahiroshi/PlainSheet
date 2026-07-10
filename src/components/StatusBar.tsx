import { t } from "../lib/i18n";
import { normalizeRange } from "../lib/clipboard";
import type { CellValue, Range, Selection, SheetMeta } from "../types/sheet";

type StatusBarProps = {
  rows: CellValue[][];
  columnCount: number;
  selection: Selection;
  range: Range;
  meta: SheetMeta;
  zoom?: number;
};

export type SelectionStats = {
  count: number;
  numericCount: number;
  total: string | null;
  average: string | null;
  max: string | null;
  min: string | null;
};

export function StatusBar({ rows, columnCount, selection, range, meta, zoom }: StatusBarProps) {
  const selectedRange =
    range ??
    ({
      startRow: selection.row,
      startCol: selection.col,
      endRow: selection.row,
      endCol: selection.col,
    } as const);
  const normalized = normalizeRange(selectedRange);
  const selectedRows = normalized.endRow - normalized.startRow + 1;
  const selectedCols = normalized.endCol - normalized.startCol + 1;
  const stats = calculateSelectionStats(rows, selectedRange);
  const zoomPercent = zoom !== undefined ? Math.round(zoom * 100) : null;

  return (
    <footer className="statusBar">
      <span>{t("rowsCols", { rows: rows.length, cols: columnCount })}</span>
      <span>{t("selectedRange", { rows: selectedRows, cols: selectedCols })}</span>
      <span>{meta.encoding.toUpperCase()}</span>
      <span>{meta.newline}</span>
      <span>{t("csvLabel", { delimiter: meta.delimiter === "\t" ? "TSV" : meta.delimiter })}</span>
      <span>{meta.dirty ? t("unsaved") : t("saved")}</span>
      {zoomPercent !== null ? <span>{t("zoomLabel", { percent: zoomPercent })}</span> : null}
      <span className="statusBar__stats">{formatStats(stats)}</span>
    </footer>
  );
}

export function calculateSelectionStats(
  rows: CellValue[][],
  range: Exclude<Range, null>,
): SelectionStats | null {
  const normalized = normalizeRange(range);
  const numbers: number[] = [];
  let count = 0;
  for (let rowIndex = normalized.startRow; rowIndex <= normalized.endRow; rowIndex += 1) {
    for (let colIndex = normalized.startCol; colIndex <= normalized.endCol; colIndex += 1) {
      const value = rows[rowIndex]?.[colIndex] ?? "";
      if (value.trim() !== "") {
        count += 1;
      }
      const parsed = Number(value.replace(/,/g, ""));
      if (value.trim() !== "" && Number.isFinite(parsed)) {
        numbers.push(parsed);
      }
    }
  }

  if (count === 0) {
    return null;
  }

  if (numbers.length === 0) {
    return {
      count,
      numericCount: 0,
      total: null,
      average: null,
      max: null,
      min: null,
    };
  }

  const total = numbers.reduce((sum, value) => sum + value, 0);
  const average = total / numbers.length;
  const max = Math.max(...numbers);
  const min = Math.min(...numbers);
  return {
    count,
    numericCount: numbers.length,
    total: formatNumber(total),
    average: formatNumber(average),
    max: formatNumber(max),
    min: formatNumber(min),
  };
}

function formatStats(stats: SelectionStats | null): string {
  if (!stats) {
    return "";
  }
  if (stats.numericCount === 0) {
    return t("statsCountOnly", { count: stats.count });
  }
  return t("statsFull", {
    total: stats.total ?? "",
    average: stats.average ?? "",
    count: stats.count,
    max: stats.max ?? "",
    min: stats.min ?? "",
  });
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
