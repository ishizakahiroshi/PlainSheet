import type { CellValue, Range, Selection } from "../types/sheet";
import { normalizeRange } from "./clipboard";
import { columnName } from "./columns";

export type TargetKind = "cell" | "row" | "column";
export type SelectionTarget = {
  kind: TargetKind;
  rows: number[];
  columns: number[];
  anchor: Selection;
  rowTargets: number[];
  columnTargets: number[];
};

export const boundedIndexes = (indexes: readonly number[], size: number): number[] =>
  [...new Set(indexes.filter((i) => Number.isInteger(i) && i >= 0 && i < size))].sort(
    (a, b) => a - b,
  );
export const isContiguous = (indexes: readonly number[]): boolean =>
  indexes.every((value, index) => index === 0 || value === indexes[index - 1]! + 1);
export const indexesBetween = (start: number, end: number, size: number): number[] => {
  const low = Math.max(0, Math.min(start, end));
  const high = Math.min(size - 1, Math.max(start, end));
  return Array.from({ length: Math.max(0, high - low + 1) }, (_, i) => low + i);
};

export function resolveTarget(options: {
  selection: Selection;
  range: Range;
  selectedRows: number[];
  selectedColumns: number[];
  rowCount: number;
  columnCount: number;
  visibleRows: number[];
  visibleColumns: number[];
  filtered: boolean;
  context?: { kind: TargetKind; row: number; col: number };
}): SelectionTarget {
  const {
    selection,
    range,
    selectedRows,
    selectedColumns,
    rowCount,
    columnCount,
    visibleRows,
    visibleColumns,
    filtered,
    context,
  } = options;
  const rect = normalizeRange(
    range ?? {
      startRow: selection.row,
      endRow: selection.row,
      startCol: selection.col,
      endCol: selection.col,
    },
  );
  let kind: TargetKind = selectedRows.length ? "row" : selectedColumns.length ? "column" : "cell";
  let rowTargets = boundedIndexes(selectedRows, rowCount);
  let columnTargets = boundedIndexes(selectedColumns, columnCount);
  let anchor = { row: rect.startRow, col: rect.startCol };
  let cellRect = rect;
  if (context) {
    const inRows = selectedRows.includes(context.row);
    const inCols = selectedColumns.includes(context.col);
    const inRect =
      context.row >= rect.startRow &&
      context.row <= rect.endRow &&
      context.col >= rect.startCol &&
      context.col <= rect.endCol;
    if ((context.kind === "row" || context.kind === "cell") && kind === "row" && inRows) {
      kind = "row";
    } else if (
      (context.kind === "column" || context.kind === "cell") &&
      kind === "column" &&
      inCols
    ) {
      kind = "column";
    } else if (context.kind === "cell" && kind === "cell" && inRect) {
      kind = "cell";
    } else {
      kind = context.kind;
      rowTargets = kind === "row" ? boundedIndexes([context.row], rowCount) : [];
      columnTargets = kind === "column" ? boundedIndexes([context.col], columnCount) : [];
      cellRect = {
        startRow: context.row,
        endRow: context.row,
        startCol: context.col,
        endCol: context.col,
      };
      anchor = { row: context.row, col: context.col };
    }
  }
  if (kind === "row") {
    anchor = { row: rowTargets[0] ?? context?.row ?? selection.row, col: 0 };
    return {
      kind,
      rowTargets,
      columnTargets: [],
      rows: rowTargets,
      columns: indexesBetween(0, columnCount - 1, columnCount),
      anchor,
    };
  }
  if (kind === "column") {
    anchor = {
      row: filtered ? (visibleRows[0] ?? rowCount) : 0,
      col: columnTargets[0] ?? context?.col ?? selection.col,
    };
    return {
      kind,
      rowTargets: [],
      columnTargets,
      rows: filtered ? visibleRows : indexesBetween(0, rowCount - 1, rowCount),
      columns: columnTargets,
      anchor,
    };
  }
  const rowSet = new Set(visibleRows),
    colSet = new Set(visibleColumns);
  const rows = indexesBetween(cellRect.startRow, cellRect.endRow, rowCount).filter((i) =>
    rowSet.has(i),
  );
  const columns = indexesBetween(cellRect.startCol, cellRect.endCol, columnCount).filter((i) =>
    colSet.has(i),
  );
  return { kind, rows, columns, rowTargets: rows, columnTargets: columns, anchor };
}

export function targetGrid(rows: CellValue[][], target: SelectionTarget): CellValue[][] {
  return target.rows.map((r) => target.columns.map((c) => rows[r]?.[c] ?? ""));
}
export function targetHasContent(rows: CellValue[][], target: SelectionTarget): boolean {
  return target.rows.some((r) => target.columns.some((c) => (rows[r]?.[c] ?? "") !== ""));
}
export function targetContiguous(target: SelectionTarget): boolean {
  return isContiguous(target.rows) && isContiguous(target.columns);
}
export function targetRanges(indexes: number[], columns = false): string {
  const label = (i: number) => (columns ? columnName(i) : String(i + 1));
  const ranges: string[] = [];
  for (let i = 0; i < indexes.length; i++) {
    const start = indexes[i]!;
    let end = start;
    while (i + 1 < indexes.length && indexes[i + 1] === end + 1) end = indexes[++i]!;
    ranges.push(start === end ? label(start) : `${label(start)}–${label(end)}`);
  }
  return ranges.join(", ");
}
