import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CompactSelection,
  DataEditor,
  GridCellKind,
  type DataEditorRef,
  type EditableGridCell,
  type GridCell,
  type GridColumn,
  type GridSelection,
  type Highlight,
  type Item,
} from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";
import { BUFFER_COLS, BUFFER_ROWS, MIN_GRID_COLS, MIN_GRID_ROWS } from "../types/sheet";
import type { CellValue, ColumnWidthMap, Range } from "../types/sheet";
import type { ContextMenuKind } from "./ContextMenu";
import { columnName } from "../lib/columns";

type GlideSheetProps = {
  rows: CellValue[][];
  columnCount: number;
  colWidths: ColumnWidthMap;
  searchHits: Set<string>;
  activeSearchHit: string | null;
  scrollNonce: number;
  onEdit: (row: number, col: number, value: string) => void;
  onColumnResize: (col: number, width: number) => void;
  onSelectionChange: (selection: { row: number; col: number }, range: Range) => void;
  onPasteGrid: (startRow: number, startCol: number, grid: CellValue[][]) => void;
  onOpenContextMenu: (kind: ContextMenuKind, row: number, col: number, x: number, y: number) => void;
};

const EMPTY_SELECTION: GridSelection = {
  columns: CompactSelection.empty(),
  rows: CompactSelection.empty(),
};

export function GlideSheet({
  rows,
  columnCount,
  colWidths,
  searchHits,
  activeSearchHit,
  scrollNonce,
  onEdit,
  onColumnResize,
  onSelectionChange,
  onPasteGrid,
  onOpenContextMenu,
}: GlideSheetProps) {
  const ref = useRef<DataEditorRef>(null);
  const [gridSelection, setGridSelection] = useState<GridSelection>(EMPTY_SELECTION);
  // Latest active hit, read imperatively by the scroll effect so the effect can
  // depend on scrollNonce alone (and not re-run on every active-hit change).
  const activeHitRef = useRef(activeSearchHit);
  activeHitRef.current = activeSearchHit;

  const columns = useMemo<GridColumn[]>(
    () =>
      Array.from({ length: Math.max(columnCount + BUFFER_COLS, MIN_GRID_COLS) }, (_, index) => ({
        title: columnName(index),
        id: String(index),
        width: colWidths[index] ?? 120,
      })),
    [columnCount, colWidths],
  );

  const rowCount = Math.max(rows.length + BUFFER_ROWS, MIN_GRID_ROWS);

  const getCellContent = useCallback(
    (cell: Item): GridCell => {
      const [col, row] = cell;
      const data = rows[row]?.[col] ?? "";
      return {
        kind: GridCellKind.Text,
        data,
        displayData: data,
        allowOverlay: true,
      };
    },
    [rows],
  );

  const onCellEdited = useCallback(
    (cell: Item, newValue: EditableGridCell) => {
      if (newValue.kind !== GridCellKind.Text) {
        return;
      }
      onEdit(cell[1], cell[0], newValue.data);
    },
    [onEdit],
  );

  const handleGridSelectionChange = useCallback(
    (selection: GridSelection) => {
      const current = selection.current;
      if (!current) {
        setGridSelection(selection);
        return;
      }
      const maxRow = Math.max(0, rows.length + BUFFER_ROWS - 1);
      const maxCol = Math.max(0, columnCount + BUFFER_COLS - 1);
      const col = Math.min(current.cell[0], maxCol);
      const row = Math.min(current.cell[1], maxRow);
      if (col !== current.cell[0] || row !== current.cell[1]) {
        // Snap a click past the editable data+buffer window back to the boundary
        // so a far edit/paste can't balloon the sheet into a huge sparse array.
        setGridSelection({
          columns: CompactSelection.empty(),
          rows: CompactSelection.empty(),
          current: { cell: [col, row], range: { x: col, y: row, width: 1, height: 1 }, rangeStack: [] },
        });
        onSelectionChange({ row, col }, null);
        return;
      }
      setGridSelection(selection);
      const rect = current.range;
      const range: Range =
        rect.width <= 1 && rect.height <= 1
          ? null
          : {
              startRow: rect.y,
              startCol: rect.x,
              endRow: Math.min(rect.y + rect.height - 1, maxRow),
              endCol: Math.min(rect.x + rect.width - 1, maxCol),
            };
      onSelectionChange({ row, col }, range);
    },
    [onSelectionChange, rows.length, columnCount],
  );

  const highlightRegions = useMemo<Highlight[]>(() => {
    const regions: Highlight[] = [];
    for (const key of searchHits) {
      const [row, col] = key.split(":").map(Number);
      regions.push({
        color: key === activeSearchHit ? "#ffd34d66" : "#fff3b033",
        range: { x: col, y: row, width: 1, height: 1 },
        style: key === activeSearchHit ? "solid-outline" : "no-outline",
      });
    }
    return regions;
  }, [searchHits, activeSearchHit]);

  // Scroll to and select the active search hit, but only when a deliberate
  // search action bumps scrollNonce — never on an incidental cell edit that
  // reshuffles the hit set.
  useEffect(() => {
    const hit = activeHitRef.current;
    if (!hit) {
      return;
    }
    const [row, col] = hit.split(":").map(Number);
    setGridSelection({
      columns: CompactSelection.empty(),
      rows: CompactSelection.empty(),
      current: { cell: [col, row], range: { x: col, y: row, width: 1, height: 1 }, rangeStack: [] },
    });
    ref.current?.scrollTo(col, row);
  }, [scrollNonce]);

  return (
    <div className="glideSheet">
      <DataEditor
        ref={ref}
        className="glideSheet__editor"
        width="100%"
        height="100%"
        columns={columns}
        rows={rowCount}
        getCellContent={getCellContent}
        onCellEdited={onCellEdited}
        getCellsForSelection={true}
        onPaste={(target, values) => {
          onPasteGrid(
            target[1],
            target[0],
            values.map((row) => [...row]),
          );
          return false;
        }}
        gridSelection={gridSelection}
        onGridSelectionChange={handleGridSelectionChange}
        onColumnResize={(_column, newSize, colIndex) => onColumnResize(colIndex, newSize)}
        onCellContextMenu={(cell, event) => {
          event.preventDefault();
          const maxRow = Math.max(0, rows.length + BUFFER_ROWS - 1);
          const maxCol = Math.max(0, columnCount + BUFFER_COLS - 1);
          onOpenContextMenu(
            "cell",
            Math.min(cell[1], maxRow),
            Math.min(cell[0], maxCol),
            event.bounds.x,
            event.bounds.y + event.bounds.height,
          );
        }}
        onHeaderContextMenu={(colIndex, event) => {
          event.preventDefault();
          onOpenContextMenu("column", 0, colIndex, event.bounds.x, event.bounds.y + event.bounds.height);
        }}
        highlightRegions={highlightRegions}
        rowMarkers="number"
        smoothScrollX
        smoothScrollY
        rangeSelect="rect"
        columnSelect="none"
        rowSelect="none"
      />
    </div>
  );
}
