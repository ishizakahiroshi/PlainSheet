import type { CellValue, ColumnWidthMap, Range, Selection } from "../types/sheet";
import { normalizeRange } from "./clipboard";
import { cloneRows } from "../hooks/useSheet";

/** A source-coordinate rectangle is not a contiguous source selection when filtered. */
export function selectedSourceRows(
  length: number,
  range: Exclude<Range, null>,
  visible: readonly number[] | null,
): number[] {
  const r = normalizeRange(range);
  if (visible)
    return visible.filter((index) => index >= r.startRow && index <= r.endRow && index < length);
  const start = Math.max(0, r.startRow);
  const end = Math.min(length - 1, r.endRow);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}

export function clearVisibleRange(
  rows: CellValue[][],
  range: Exclude<Range, null>,
  visible: readonly number[] | null,
  exactRows: readonly number[] = [],
  exactColumns: readonly number[] = [],
): CellValue[][] {
  const indexes = selectionIndexes(rows, range, visible, exactRows, exactColumns);
  const next = cloneRows(rows);
  for (const row of indexes.rows) {
    for (const col of indexes.columns) {
      if (col < next[row].length) next[row][col] = "";
    }
  }
  return next;
}

/** Header selections retain their gaps; explicit context-menu rectangles omit exact axes. */
export function selectionIndexes(
  rows: CellValue[][],
  range: Exclude<Range, null>,
  visible: readonly number[] | null,
  exactRows: readonly number[] = [],
  exactColumns: readonly number[] = [],
): { rows: number[]; columns: number[] } {
  const r = normalizeRange(range);
  const sourceRows = selectedSourceRows(rows.length, r, visible);
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const columns = Array.from(
    { length: Math.max(0, Math.min(width - 1, r.endCol) - Math.max(0, r.startCol) + 1) },
    (_, i) => Math.max(0, r.startCol) + i,
  );
  return {
    rows: exactRows.length ? sourceRows.filter((row) => exactRows.includes(row)) : sourceRows,
    columns: exactColumns.length ? columns.filter((col) => exactColumns.includes(col)) : columns,
  };
}

/** Reject the complete paste if a filtered view has insufficient destinations. Never spill into hidden rows. */
export function pasteIntoView(
  rows: CellValue[][],
  startRow: number,
  startCol: number,
  grid: CellValue[][],
  visible: readonly number[] | null,
): { rows: CellValue[][]; range: Exclude<Range, null> } | null {
  if (startRow < 0 || startCol < 0 || grid.length === 0) return null;
  const offset = visible?.indexOf(startRow) ?? startRow;
  if (visible && (offset < 0 || offset + grid.length > visible.length)) return null;
  const destinations = grid.map((_, i) => (visible ? visible[offset + i] : startRow + i));
  const width = grid.reduce((max, row) => Math.max(max, row.length), 1);
  const next = cloneRows(rows);
  while (next.length <= destinations[destinations.length - 1]) next.push([]);
  grid.forEach((row, i) => {
    const destination = next[destinations[i]];
    while (destination.length < startCol + row.length) destination.push("");
    row.forEach((value, col) => {
      destination[startCol + col] = value;
    });
  });
  return {
    rows: next,
    range: {
      startRow,
      startCol,
      endRow: destinations[destinations.length - 1],
      endCol: startCol + width - 1,
    },
  };
}

export function moveColumn(
  rows: CellValue[][],
  widths: ColumnWidthMap,
  count: number,
  from: number,
  to: number,
): { rows: CellValue[][]; widths: ColumnWidthMap } | null {
  if (from === to || from < 0 || to < 0 || from >= count || to >= count) return null;
  const order = Array.from({ length: count }, (_, i) => i);
  order.splice(to, 0, order.splice(from, 1)[0]);
  const nextWidths = { ...widths };
  order.forEach((source, dest) => {
    if (widths[source] === undefined) delete nextWidths[dest];
    else nextWidths[dest] = widths[source];
  });
  return { rows: rows.map((row) => order.map((index) => row[index] ?? "")), widths: nextWidths };
}

/** Excel-style contiguous-data/next-data navigation, bounded by actual data rather than virtual padding. */
export function dataEdge(rows: CellValue[][], start: Selection, direction: Selection): Selection {
  const maxRow = Math.max(0, rows.length - 1);
  const maxCol = Math.max(0, rows.reduce((max, row) => Math.max(max, row.length), 0) - 1);
  let row = Math.min(maxRow, Math.max(0, start.row));
  let col = Math.min(maxCol, Math.max(0, start.col));
  const inBounds = (r: number, c: number) => r >= 0 && c >= 0 && r <= maxRow && c <= maxCol;
  const filled = (r: number, c: number) => (rows[r]?.[c] ?? "") !== "";
  const contiguous = filled(row, col) && filled(row + direction.row, col + direction.col);
  while (inBounds(row + direction.row, col + direction.col)) {
    const nextRow = row + direction.row;
    const nextCol = col + direction.col;
    if (contiguous && !filled(nextRow, nextCol)) break;
    row = nextRow;
    col = nextCol;
    if (!contiguous && filled(row, col)) break;
  }
  return { row, col };
}

export function sameRows(left: CellValue[][], right: CellValue[][]): boolean {
  return (
    left.length === right.length &&
    left.every(
      (row, i) => row.length === right[i].length && row.every((v, col) => v === right[i][col]),
    )
  );
}
