import { useMemo, useState } from "react";
import { calculateColumnWidths } from "../lib/columnWidth";
import type { CellValue, ColumnWidthMap, Range, SheetMeta } from "../types/sheet";
import { DEFAULT_META } from "../types/sheet";
import { normalizeRange } from "../lib/clipboard";

export function useSheet() {
  const [rows, setRowsState] = useState<CellValue[][]>([]);
  const [meta, setMetaState] = useState<SheetMeta>(DEFAULT_META);
  const [colWidths, setColWidths] = useState<ColumnWidthMap>({});

  const columnCount = useMemo(() => getColumnCount(rows), [rows]);

  function setRows(nextRows: CellValue[][], dirty = true): void {
    setRowsState(cloneRows(nextRows));
    if (dirty) {
      setMetaState((current) => ({ ...current, dirty: true }));
    }
  }

  function setMeta(nextMeta: Partial<SheetMeta>): void {
    setMetaState((current) => ({ ...current, ...nextMeta }));
  }

  function loadData(nextRows: CellValue[][], nextMeta: Partial<SheetMeta>): void {
    const cloned = cloneRows(nextRows);
    setRowsState(cloned);
    setMetaState({ ...DEFAULT_META, ...nextMeta, dirty: false });
    setColWidths(calculateColumnWidths(cloned));
  }

  function updateCell(rowIndex: number, colIndex: number, value: CellValue): void {
    setRowsState((currentRows) => {
      if (rowIndex >= currentRows.length && value === "") {
        return currentRows;
      }
      const next = ensureSize(currentRows, rowIndex + 1, colIndex + 1);
      next[rowIndex][colIndex] = value;
      return trimTrailingEmptyRows(next);
    });
    setMetaState((current) => ({ ...current, dirty: true }));
  }

  function replaceRows(nextRows: CellValue[][], dirty = true, recalcWidths = true): void {
    setRows(nextRows, dirty);
    // History restore keeps the user's manual column widths; only structural
    // edits (insert/delete/paste) re-fit them.
    if (recalcWidths) {
      setColWidths(calculateColumnWidths(nextRows));
    }
  }

  function insertRows(index: number, count = 1): void {
    const n = Math.max(1, Math.floor(count));
    const boundedIndex = Math.max(0, Math.min(index, rows.length));
    const next = cloneRows(rows);
    const blank = () => Array.from({ length: Math.max(columnCount, 1) }, () => "");
    next.splice(boundedIndex, 0, ...Array.from({ length: n }, blank));
    replaceRows(next);
  }

  function insertRow(index: number): void {
    insertRows(index, 1);
  }

  function deleteRows(indexes: number[]): void {
    const unique = [...new Set(indexes.filter((i) => i >= 0 && i < rows.length))].sort(
      (a, b) => b - a,
    );
    if (unique.length === 0) {
      return;
    }
    const next = cloneRows(rows);
    for (const index of unique) {
      next.splice(index, 1);
    }
    // Never collapse to [] — that switches the UI to EmptyState mid-edit.
    // Keep a single blank row so the grid (and undo) stay available.
    if (next.length === 0) {
      next.push([""]);
    }
    replaceRows(next);
  }

  function deleteRow(index: number): void {
    deleteRows([index]);
  }

  function insertColumns(index: number, count = 1): void {
    const n = Math.max(1, Math.floor(count));
    const target = Math.max(0, Math.min(index, Math.max(columnCount, 1)));
    const baseRows = rows.length > 0 ? rows : [[""]];
    const next = baseRows.map((row) => {
      const copy = [...row];
      while (copy.length < target) {
        copy.push("");
      }
      copy.splice(target, 0, ...Array.from({ length: n }, () => ""));
      return copy;
    });
    replaceRows(next);
  }

  function insertColumn(index: number): void {
    insertColumns(index, 1);
  }

  function deleteColumns(indexes: number[]): void {
    const unique = new Set(indexes.filter((i) => i >= 0 && i < columnCount));
    if (unique.size === 0) {
      return;
    }
    const next = rows.map((row) => row.filter((_, colIndex) => !unique.has(colIndex)));
    // Drop widths for deleted columns and shift remaining ones so resize history
    // does not stick to the wrong column after a multi-delete.
    setColWidths((current) => {
      const remapped: ColumnWidthMap = {};
      let dest = 0;
      const maxCol = Math.max(columnCount - 1, ...Object.keys(current).map(Number), 0);
      for (let src = 0; src <= maxCol; src += 1) {
        if (unique.has(src)) {
          continue;
        }
        if (current[src] !== undefined) {
          remapped[dest] = current[src]!;
        }
        dest += 1;
      }
      return remapped;
    });
    setRows(next, true);
  }

  function deleteColumn(index: number): void {
    deleteColumns([index]);
  }

  function restoreState(
    nextRows: CellValue[][],
    nextMeta: SheetMeta,
    nextColWidths: ColumnWidthMap,
  ): void {
    setRowsState(cloneRows(nextRows));
    setMetaState({ ...nextMeta });
    setColWidths({ ...nextColWidths });
  }

  function clearRange(range: Range): void {
    if (range === null) {
      return;
    }
    const normalized = normalizeRange(range);
    // Only touch cells that already exist in the data model. Expanding into the
    // virtual buffer just to write "" would dirty the sheet and push a no-op
    // undo entry for an empty clear.
    let changed = false;
    const next = cloneRows(rows);
    for (let rowIndex = normalized.startRow; rowIndex <= normalized.endRow; rowIndex += 1) {
      if (rowIndex >= next.length) {
        continue;
      }
      for (let colIndex = normalized.startCol; colIndex <= normalized.endCol; colIndex += 1) {
        if (colIndex >= next[rowIndex].length) {
          continue;
        }
        if (next[rowIndex][colIndex] !== "") {
          next[rowIndex][colIndex] = "";
          changed = true;
        }
      }
    }
    if (!changed) {
      return;
    }
    replaceRows(trimTrailingEmptyRows(next));
  }

  function pasteGrid(startRow: number, startCol: number, grid: CellValue[][]): Exclude<Range, null> {
    const rowCount = Math.max(grid.length, 1);
    const colCount = Math.max(...grid.map((row) => row.length), 1);
    const next = ensureSize(rows, startRow + rowCount, startCol + colCount);
    for (let rowOffset = 0; rowOffset < grid.length; rowOffset += 1) {
      for (let colOffset = 0; colOffset < grid[rowOffset].length; colOffset += 1) {
        next[startRow + rowOffset][startCol + colOffset] = grid[rowOffset][colOffset];
      }
    }
    replaceRows(trimTrailingEmptyRows(next));
    return {
      startRow,
      startCol,
      endRow: startRow + rowCount - 1,
      endCol: startCol + colCount - 1,
    };
  }

  function autoFitColumns(): void {
    setColWidths(calculateColumnWidths(rows));
  }

  function autoFitColumn(colIndex: number): void {
    if (colIndex < 0) {
      return;
    }
    const fitted = calculateColumnWidths(rows);
    setColWidths((current) => ({
      ...current,
      [colIndex]: fitted[colIndex] ?? 120,
    }));
  }

  function setColumnWidth(colIndex: number, width: number): void {
    setColWidths((current) => ({
      ...current,
      [colIndex]: Math.max(48, Math.min(720, Math.round(width))),
    }));
  }

  return {
    rows,
    meta,
    colWidths,
    columnCount,
    setRows,
    setMeta,
    loadData,
    updateCell,
    replaceRows,
    insertRow,
    insertRows,
    deleteRow,
    deleteRows,
    insertColumn,
    insertColumns,
    deleteColumn,
    deleteColumns,
    clearRange,
    pasteGrid,
    autoFitColumns,
    autoFitColumn,
    setColumnWidth,
    restoreState,
  };
}

export function cloneRows(rows: readonly (readonly CellValue[])[]): CellValue[][] {
  return rows.map((row) => [...row]);
}

export function getColumnCount(rows: readonly (readonly CellValue[])[]): number {
  return rows.reduce((max, row) => Math.max(max, row.length), 0);
}

export function ensureSize(
  rows: readonly (readonly CellValue[])[],
  minRows: number,
  minCols: number,
): CellValue[][] {
  const next = cloneRows(rows);
  while (next.length < minRows) {
    next.push([]);
  }
  for (const row of next) {
    while (row.length < minCols) {
      row.push("");
    }
  }
  return next;
}

export function trimTrailingEmptyRows(rows: CellValue[][]): CellValue[][] {
  const next = cloneRows(rows);
  // Keep at least one row so clearing the final cell does not collapse the
  // whole sheet back to the empty state mid-edit.
  while (next.length > 1 && next[next.length - 1].every((cell) => cell === "")) {
    next.pop();
  }
  return next;
}
