import { selectionIndexes } from "../lib/gridOperations";
import { t } from "../lib/i18n";
import type { CellValue, Range, Selection, SheetMeta } from "../types/sheet";

type StatusBarProps = {
  rows: CellValue[][];
  columnCount: number;
  selection: Selection;
  range: Range;
  meta: SheetMeta;
  zoom?: number;
  visibleSourceRows?: number[] | null;
  browser?: boolean;
  selectedRowIndexes?: readonly number[];
  selectedColumnIndexes?: readonly number[];
};

export type SelectionStats = {
  count: number;
  numericCount: number;
  total: string | null;
  average: string | null;
  max: string | null;
  min: string | null;
};

export function StatusBar({
  rows,
  columnCount,
  selection,
  range,
  meta,
  zoom,
  visibleSourceRows = null,
  browser = false,
  selectedRowIndexes = [],
  selectedColumnIndexes = [],
}: StatusBarProps) {
  const selectedRange =
    range ??
    ({
      startRow: selection.row,
      startCol: selection.col,
      endRow: selection.row,
      endCol: selection.col,
    } as const);
  const indexes = selectionIndexes(
    rows,
    selectedRange,
    visibleSourceRows,
    selectedRowIndexes,
    selectedColumnIndexes,
  );
  const selectedRows = indexes.rows.length;
  const selectedCols = indexes.columns.length;
  const stats = calculateSelectionStats(
    rows,
    selectedRange,
    selectedRowIndexes,
    selectedColumnIndexes,
    visibleSourceRows,
  );
  const zoomPercent = zoom !== undefined ? Math.round(zoom * 100) : null;

  return (
    <footer className="statusBar">
      <span>
        {visibleSourceRows
          ? t("filteredCount", { visible: visibleSourceRows.length, total: rows.length })
          : t("rowsCols", { rows: rows.length, cols: columnCount })}
      </span>
      <span>{t("selectedRange", { rows: selectedRows, cols: selectedCols })}</span>
      <span>{meta.encoding.toUpperCase()}</span>
      <span>{meta.newline}</span>
      <span>{t("formatLabel", { format: (meta.format ?? "csv").toUpperCase() })}</span>
      <span>{meta.dirty ? t("unsaved") : browser ? t("originalUnchanged") : t("saved")}</span>
      {zoomPercent !== null ? <span>{t("zoomLabel", { percent: zoomPercent })}</span> : null}
      <span className="statusBar__stats">{formatStats(stats)}</span>
    </footer>
  );
}

export function calculateSelectionStats(
  rows: CellValue[][],
  range: Exclude<Range, null>,
  selectedRows: readonly number[] = [],
  selectedColumns: readonly number[] = [],
  visible: readonly number[] | null = null,
): SelectionStats | null {
  const indexes = selectionIndexes(rows, range, visible, selectedRows, selectedColumns);
  const numbers: number[] = [];
  let count = 0;
  for (const rowIndex of indexes.rows) {
    for (const colIndex of indexes.columns) {
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
