import { t } from "../lib/i18n";
import { normalizeRange } from "../lib/clipboard";
import type { CellValue, Range, Selection, SheetMeta } from "../types/sheet";

type StatusBarProps = {
  rows: CellValue[][];
  columnCount: number;
  selection: Selection;
  range: Range;
  meta: SheetMeta;
};

export function StatusBar({ rows, columnCount, selection, range, meta }: StatusBarProps) {
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

  return (
    <footer className="statusBar">
      <span>{t("rowsCols", { rows: rows.length, cols: columnCount })}</span>
      <span>{t("selectedRange", { rows: selectedRows, cols: selectedCols })}</span>
      <span>{meta.encoding.toUpperCase()}</span>
      <span>{meta.newline}</span>
      <span>{t("csvLabel", { delimiter: meta.delimiter === "\t" ? "TSV" : meta.delimiter })}</span>
      <span>{meta.dirty ? t("unsaved") : t("saved")}</span>
      <span className="statusBar__stats">
        {stats ? t("totalAverage", { total: stats.total, average: stats.average }) : ""}
      </span>
    </footer>
  );
}

export function calculateSelectionStats(rows: CellValue[][], range: Exclude<Range, null>) {
  const normalized = normalizeRange(range);
  const numbers: number[] = [];
  for (let rowIndex = normalized.startRow; rowIndex <= normalized.endRow; rowIndex += 1) {
    for (let colIndex = normalized.startCol; colIndex <= normalized.endCol; colIndex += 1) {
      const value = rows[rowIndex]?.[colIndex] ?? "";
      const parsed = Number(value.replace(/,/g, ""));
      if (value.trim() !== "" && Number.isFinite(parsed)) {
        numbers.push(parsed);
      }
    }
  }

  if (numbers.length === 0) {
    return null;
  }

  const total = numbers.reduce((sum, value) => sum + value, 0);
  const average = total / numbers.length;
  return {
    total: formatNumber(total),
    average: formatNumber(average),
  };
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
