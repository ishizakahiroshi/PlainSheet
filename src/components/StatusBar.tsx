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
  const formatBadge =
    meta.format === "json" || meta.format === "yaml" || meta.format === "markdown"
      ? meta.format.toUpperCase()
      : t("csvLabel", { delimiter: meta.delimiter === "\t" ? "TSV" : meta.delimiter });

  return (
    <footer className="statusBar">
      <span>{t("rowsCols", { rows: rows.length, cols: columnCount })}</span>
      <span>{t("selectedRange", { rows: selectedRows, cols: selectedCols })}</span>
      <span>{meta.encoding.toUpperCase()}</span>
      <span>{meta.newline}</span>
      <span>{formatBadge}</span>
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
  const endRow = Math.min(normalized.endRow, rows.length - 1);
  let count = 0;
  let numericCount = 0;
  let total = 0;
  let max = -Infinity;
  let min = Infinity;

  for (let rowIndex = Math.max(0, normalized.startRow); rowIndex <= endRow; rowIndex += 1) {
    const row = rows[rowIndex];
    if (!row) {
      continue;
    }
    const endCol = Math.min(normalized.endCol, row.length - 1);
    for (let colIndex = Math.max(0, normalized.startCol); colIndex <= endCol; colIndex += 1) {
      const value = row[colIndex] ?? "";
      const trimmed = value.trim();
      if (trimmed === "") {
        continue;
      }
      count += 1;
      const parsed = Number(trimmed.replace(/,/g, ""));
      if (Number.isFinite(parsed)) {
        numericCount += 1;
        total += parsed;
        if (parsed > max) {
          max = parsed;
        }
        if (parsed < min) {
          min = parsed;
        }
      }
    }
  }

  if (count === 0) {
    return null;
  }

  if (numericCount === 0) {
    return {
      count,
      numericCount: 0,
      total: null,
      average: null,
      max: null,
      min: null,
    };
  }

  const average = total / numericCount;
  return {
    count,
    numericCount,
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
