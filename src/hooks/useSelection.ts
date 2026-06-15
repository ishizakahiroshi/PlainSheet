import { useState } from "react";
import type { Range, Selection } from "../types/sheet";
import { EMPTY_SELECTION } from "../types/sheet";
import { normalizeRange } from "../lib/clipboard";
import { clamp } from "../lib/columnWidth";

export function useSelection() {
  const [selection, setSelectionState] = useState<Selection>(EMPTY_SELECTION);
  const [range, setRange] = useState<Range>(null);
  const [anchor, setAnchor] = useState<Selection>(EMPTY_SELECTION);

  function selectCell(row: number, col: number, extend = false): void {
    const next = { row: Math.max(0, row), col: Math.max(0, col) };
    if (extend) {
      setRange({
        startRow: anchor.row,
        startCol: anchor.col,
        endRow: next.row,
        endCol: next.col,
      });
    } else {
      setAnchor(next);
      setRange(null);
    }
    setSelectionState(next);
  }

  function selectRange(nextRange: Exclude<Range, null>): void {
    const normalized = normalizeRange(nextRange);
    setAnchor({ row: normalized.startRow, col: normalized.startCol });
    setSelectionState({ row: normalized.endRow, col: normalized.endCol });
    setRange(normalized);
  }

  function selectRow(row: number, colCount: number): void {
    selectRange({
      startRow: row,
      startCol: 0,
      endRow: row,
      endCol: Math.max(0, colCount - 1),
    });
  }

  function selectColumn(col: number, rowCount: number): void {
    selectRange({
      startRow: 0,
      startCol: col,
      endRow: Math.max(0, rowCount - 1),
      endCol: col,
    });
  }

  function moveSelection(
    rowDelta: number,
    colDelta: number,
    extend: boolean,
    maxRows: number,
    maxCols: number,
  ): void {
    const nextRow = clamp(selection.row + rowDelta, 0, Math.max(0, maxRows - 1));
    const nextCol = clamp(selection.col + colDelta, 0, Math.max(0, maxCols - 1));
    selectCell(nextRow, nextCol, extend);
  }

  function setSelection(next: Selection): void {
    setSelectionState(next);
    setAnchor(next);
    setRange(null);
  }

  return {
    selection,
    range,
    selectCell,
    selectRange,
    selectRow,
    selectColumn,
    moveSelection,
    setSelection,
  };
}

export function selectionToRange(selection: Selection, range: Range): Exclude<Range, null> {
  return (
    range ?? {
      startRow: selection.row,
      startCol: selection.col,
      endRow: selection.row,
      endCol: selection.col,
    }
  );
}
