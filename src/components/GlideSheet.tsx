import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CompactSelection,
  DataEditor,
  GridCellKind,
  type DataEditorRef,
  type EditableGridCell,
  type FillPatternEventArgs,
  type GridCell,
  type GridColumn,
  type GridSelection,
  type Highlight,
  type Item,
  type Rectangle,
  type Theme,
  type ProvideEditorComponent,
} from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";
import { BUFFER_COLS, BUFFER_ROWS, MIN_GRID_COLS, MIN_GRID_ROWS } from "../types/sheet";
import type { CellValue, ColumnWidthMap, Range } from "../types/sheet";
import type { ContextMenuKind } from "./ContextMenu";
import { columnName } from "../lib/columns";
import { CellTextEditor, type RegisterEditorCommit } from "./CellTextEditor";
import { dataEdge } from "../lib/gridOperations";
import { fillSeries } from "../lib/autofill";

type GlideSheetProps = {
  rows: CellValue[][];
  /** Optional mapping from visible row index → source row index (filter mode). */
  rowSourceIndexes?: number[] | null;
  columnCount: number;
  colWidths: ColumnWidthMap;
  selection: { row: number; col: number };
  range: Range;
  searchHits: Set<string>;
  activeSearchHit: string | null;
  scrollNonce: number;
  focusCell?: { row: number; col: number; nonce: number } | null;
  theme: "light" | "dark";
  zebra: boolean;
  headerHighlight: boolean;
  freezeColumns?: number;
  zoom?: number;
  onEdit: (row: number, col: number, value: string) => void;
  onColumnResize: (col: number, width: number) => void;
  onSelectionChange: (selection: { row: number; col: number }, range: Range) => void;
  onRowsSelected?: (indexes: number[]) => void;
  onColumnsSelected?: (indexes: number[]) => void;
  onPasteGrid: (startRow: number, startCol: number, grid: CellValue[][]) => void;
  onFill?: (updates: { row: number; col: number; value: string }[]) => void;
  onCut?: () => void;
  onClear?: () => void;
  onColumnMove?: (from: number, to: number) => void;
  registerCommit?: RegisterEditorCommit;
  onOpenContextMenu: (
    kind: ContextMenuKind,
    row: number,
    col: number,
    x: number,
    y: number,
  ) => void;
  onHeaderMenuClick?: (
    col: number,
    bounds: { x: number; y: number; width: number; height: number },
  ) => void;
};

const LIGHT_THEME: Partial<Theme> = {
  accentColor: "#1d6ed8",
  accentLight: "#dbeafe",
  bgCell: "#ffffff",
  bgCellMedium: "#eef2f6",
  bgHeader: "#edf2f7",
  bgHeaderHasFocus: "#dde5ee",
  bgHeaderHovered: "#e5ebf2",
  textDark: "#18212f",
  textMedium: "#5d6878",
  textLight: "#5d6878",
  textHeader: "#18212f",
  borderColor: "#cfd8e3",
  horizontalBorderColor: "#cfd8e3",
};

const DARK_THEME: Partial<Theme> = {
  accentColor: "#66a6ff",
  accentLight: "#153456",
  bgCell: "#181d23",
  bgCellMedium: "#222a32",
  bgHeader: "#222a32",
  bgHeaderHasFocus: "#2d3844",
  bgHeaderHovered: "#2d3844",
  textDark: "#edf2f7",
  textMedium: "#aab5c2",
  textLight: "#aab5c2",
  textHeader: "#edf2f7",
  borderColor: "#3b4654",
  horizontalBorderColor: "#3b4654",
};

const EMPTY_SELECTION: GridSelection = {
  columns: CompactSelection.empty(),
  rows: CompactSelection.empty(),
};

function compactToIndexes(selection: CompactSelection): number[] {
  const indexes: number[] = [];
  for (const index of selection) {
    indexes.push(index);
  }
  return indexes;
}

export function GlideSheet({
  rows,
  rowSourceIndexes,
  columnCount,
  colWidths,
  selection,
  range,
  searchHits,
  activeSearchHit,
  scrollNonce,
  focusCell,
  theme,
  zebra,
  headerHighlight,
  freezeColumns = 0,
  zoom = 1,
  onEdit,
  onColumnResize,
  onSelectionChange,
  onRowsSelected,
  onColumnsSelected,
  onPasteGrid,
  onFill,
  onCut,
  onClear,
  onColumnMove,
  registerCommit,
  onOpenContextMenu,
  onHeaderMenuClick,
}: GlideSheetProps) {
  const ref = useRef<DataEditorRef>(null);
  const f2EditingRef = useRef(false);
  const [gridSelection, setGridSelection] = useState<GridSelection>(EMPTY_SELECTION);
  const activeHitRef = useRef(activeSearchHit);
  activeHitRef.current = activeSearchHit;
  const selectionChangeRef = useRef(onSelectionChange);
  selectionChangeRef.current = onSelectionChange;
  const headerSelectionRef = useRef({ onRowsSelected, onColumnsSelected });
  headerSelectionRef.current = { onRowsSelected, onColumnsSelected };
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const sourceMapRef = useRef(rowSourceIndexes);
  sourceMapRef.current = rowSourceIndexes;

  const toSourceRow = useCallback((visibleRow: number): number => {
    const map = sourceMapRef.current;
    if (map && visibleRow >= 0 && visibleRow < map.length) {
      return map[visibleRow]!;
    }
    return map ? -1 : visibleRow;
  }, []);

  const toVisibleRow = useCallback((sourceRow: number): number => {
    const map = sourceMapRef.current;
    if (!map) {
      return sourceRow;
    }
    const index = map.indexOf(sourceRow);
    return index;
  }, []);

  const columns = useMemo<GridColumn[]>(
    () =>
      Array.from({ length: Math.max(columnCount + BUFFER_COLS, MIN_GRID_COLS) }, (_, index) => ({
        title: columnName(index),
        id: String(index),
        width: colWidths[index] ?? 120,
        hasMenu: true,
      })),
    [columnCount, colWidths],
  );

  const rowCount = rowSourceIndexes
    ? Math.max(rows.length, 1)
    : Math.max(rows.length + BUFFER_ROWS, MIN_GRID_ROWS);
  const rowHeight = Math.round(28 * zoom);
  const headerHeight = Math.round(32 * zoom);
  const fontSize = Math.max(11, Math.round(13 * zoom));

  const gridTheme = useMemo<Partial<Theme>>(() => {
    const base = theme === "dark" ? DARK_THEME : LIGHT_THEME;
    return {
      ...base,
      baseFontStyle: `${fontSize}px`,
      headerFontStyle: `600 ${fontSize}px`,
      editorFontSize: `${fontSize}px`,
    };
  }, [theme, fontSize]);

  const getRowThemeOverride = useCallback(
    (row: number): Partial<Theme> | undefined => {
      if (headerHighlight && toSourceRow(row) === 0) {
        return {
          bgCell: theme === "dark" ? "#2d3844" : "#dde5ee",
          textDark: theme === "dark" ? "#edf2f7" : "#18212f",
        };
      }
      if (zebra && row % 2 === 1) {
        return {
          bgCell: theme === "dark" ? "#14191f" : "#f3f6f9",
        };
      }
      return undefined;
    },
    [headerHighlight, zebra, theme, toSourceRow],
  );

  const getCellContent = useCallback(
    (cell: Item): GridCell => {
      const [col, row] = cell;
      const data = rows[row]?.[col] ?? "";
      return {
        kind: GridCellKind.Text,
        data,
        displayData: data,
        allowOverlay: toSourceRow(row) >= 0,
        readonly: toSourceRow(row) < 0,
      };
    },
    [rows, toSourceRow],
  );

  const onCellEdited = useCallback(
    (cell: Item, newValue: EditableGridCell) => {
      if (newValue.kind !== GridCellKind.Text) {
        return;
      }
      const sourceRow = toSourceRow(cell[1]);
      if (sourceRow >= 0) onEdit(sourceRow, cell[0], newValue.data);
    },
    [onEdit, toSourceRow],
  );

  const handleGridSelectionChange = useCallback(
    (next: GridSelection) => {
      if (rowSourceIndexes && rows.length === 0) return;
      const maxRow = Math.max(0, rows.length + (rowSourceIndexes ? 0 : BUFFER_ROWS) - 1);
      const maxCol = Math.max(0, columnCount + BUFFER_COLS - 1);

      const selectedRows = compactToIndexes(next.rows).filter((index) => index <= maxRow);
      const selectedCols = compactToIndexes(next.columns).filter((index) => index <= maxCol);
      if (selectedRows.length > 0) {
        onRowsSelected?.(selectedRows.map(toSourceRow));
      } else {
        onRowsSelected?.([]);
      }
      if (selectedCols.length > 0) {
        onColumnsSelected?.(selectedCols);
      } else {
        onColumnsSelected?.([]);
      }

      const current = next.current;
      if (!current) {
        setGridSelection(next);
        if (selectedRows.length > 0) {
          const first = selectedRows[0]!;
          const last = selectedRows[selectedRows.length - 1]!;
          onSelectionChange(
            { row: toSourceRow(first), col: 0 },
            {
              startRow: toSourceRow(first),
              startCol: 0,
              endRow: toSourceRow(last),
              endCol: Math.max(0, columnCount - 1),
            },
          );
        } else if (selectedCols.length > 0) {
          const first = selectedCols[0]!;
          const last = selectedCols[selectedCols.length - 1]!;
          onSelectionChange(
            { row: toSourceRow(0), col: first },
            {
              startRow: toSourceRow(0),
              startCol: first,
              endRow: toSourceRow(Math.max(0, rows.length - 1)),
              endCol: last,
            },
          );
        }
        return;
      }

      const col = Math.min(current.cell[0], maxCol);
      const row = Math.min(current.cell[1], maxRow);
      if (col !== current.cell[0] || row !== current.cell[1]) {
        setGridSelection({
          columns: CompactSelection.empty(),
          rows: CompactSelection.empty(),
          current: {
            cell: [col, row],
            range: { x: col, y: row, width: 1, height: 1 },
            rangeStack: [],
          },
        });
        onSelectionChange({ row: toSourceRow(row), col }, null);
        return;
      }
      setGridSelection(next);
      const rect = current.range;
      const rangeValue: Range =
        rect.width <= 1 && rect.height <= 1
          ? null
          : {
              startRow: toSourceRow(rect.y),
              startCol: rect.x,
              endRow: toSourceRow(Math.min(rect.y + rect.height - 1, maxRow)),
              endCol: Math.min(rect.x + rect.width - 1, maxCol),
            };
      onSelectionChange({ row: toSourceRow(row), col }, rangeValue);
    },
    [
      onSelectionChange,
      onRowsSelected,
      onColumnsSelected,
      rows.length,
      columnCount,
      toSourceRow,
      rowSourceIndexes,
    ],
  );

  const highlightRegions = useMemo<Highlight[]>(() => {
    const regions: Highlight[] = [];
    for (const key of searchHits) {
      const [sourceRow, col] = key.split(":").map(Number);
      const visibleRow = toVisibleRow(sourceRow);
      if (rowSourceIndexes && (visibleRow < 0 || !rowSourceIndexes.includes(sourceRow))) {
        continue;
      }
      regions.push({
        color: key === activeSearchHit ? "#ffd34d66" : "#fff3b033",
        range: { x: col, y: visibleRow, width: 1, height: 1 },
        style: key === activeSearchHit ? "solid-outline" : "no-outline",
      });
    }
    return regions;
  }, [searchHits, activeSearchHit, toVisibleRow, rowSourceIndexes]);

  useEffect(() => {
    const hit = activeHitRef.current;
    if (!hit) {
      return;
    }
    const [sourceRow, col] = hit.split(":").map(Number);
    const row = toVisibleRow(sourceRow);
    if (row < 0) return;
    setGridSelection({
      columns: CompactSelection.empty(),
      rows: CompactSelection.empty(),
      current: { cell: [col, row], range: { x: col, y: row, width: 1, height: 1 }, rangeStack: [] },
    });
    headerSelectionRef.current.onRowsSelected?.([]);
    headerSelectionRef.current.onColumnsSelected?.([]);
    selectionChangeRef.current({ row: sourceRow, col }, null);
    ref.current?.scrollTo(col, row);
  }, [scrollNonce, toVisibleRow]);

  useEffect(() => {
    if (!focusCell) {
      return;
    }
    const row = toVisibleRow(focusCell.row);
    if (row < 0) return;
    const col = focusCell.col;
    setGridSelection({
      columns: CompactSelection.empty(),
      rows: CompactSelection.empty(),
      current: { cell: [col, row], range: { x: col, y: row, width: 1, height: 1 }, rangeStack: [] },
    });
    ref.current?.scrollTo(col, row);
  }, [focusCell?.nonce, focusCell?.row, focusCell?.col, toVisibleRow]);

  const rangeStartRow = range?.startRow;
  const rangeStartCol = range?.startCol;
  const rangeEndRow = range?.endRow;
  const rangeEndCol = range?.endCol;
  useEffect(() => {
    const maxRow = Math.max(0, rows.length + (rowSourceIndexes ? 0 : BUFFER_ROWS) - 1);
    const maxCol = Math.max(0, columnCount + BUFFER_COLS - 1);
    if (toVisibleRow(selection.row) < 0) {
      setGridSelection(EMPTY_SELECTION);
      return;
    }
    const col = Math.min(Math.max(0, selection.col), maxCol);
    const row = Math.min(Math.max(0, toVisibleRow(selection.row)), maxRow);
    let rect: { x: number; y: number; width: number; height: number };
    if (
      rangeStartRow !== undefined &&
      rangeStartCol !== undefined &&
      rangeEndRow !== undefined &&
      rangeEndCol !== undefined
    ) {
      const startRow = Math.min(toVisibleRow(rangeStartRow), toVisibleRow(rangeEndRow));
      const startCol = Math.min(rangeStartCol, rangeEndCol);
      const endRow = Math.min(
        Math.max(toVisibleRow(rangeStartRow), toVisibleRow(rangeEndRow)),
        maxRow,
      );
      const endCol = Math.min(Math.max(rangeStartCol, rangeEndCol), maxCol);
      rect = {
        x: startCol,
        y: startRow,
        width: endCol - startCol + 1,
        height: endRow - startRow + 1,
      };
    } else {
      rect = { x: col, y: row, width: 1, height: 1 };
    }
    setGridSelection((previous) => {
      // App echoes the bounding range, but header selections can contain gaps.
      // Keep the original markers so an echo does not visually select those gaps.
      if (!previous.current && rangeStartRow !== undefined) {
        const selectedRows = compactToIndexes(previous.rows);
        const selectedCols = compactToIndexes(previous.columns);
        const rowEcho =
          selectedRows.length > 0 &&
          rect.y === selectedRows[0] &&
          rect.height === selectedRows.at(-1)! - selectedRows[0] + 1 &&
          rect.x === 0 &&
          rect.width === columnCount;
        const columnEcho =
          selectedCols.length > 0 &&
          rect.x === selectedCols[0] &&
          rect.width === selectedCols.at(-1)! - selectedCols[0] + 1 &&
          rect.y === 0 &&
          rect.height === rows.length;
        if (rowEcho || columnEcho) return previous;
      }
      return {
        columns: CompactSelection.empty(),
        rows: CompactSelection.empty(),
        current: { cell: [col, row], range: rect, rangeStack: [] },
      };
    });
  }, [
    selection.row,
    selection.col,
    rangeStartRow,
    rangeStartCol,
    rangeEndRow,
    rangeEndCol,
    rows.length,
    columnCount,
    toVisibleRow,
    rowSourceIndexes,
  ]);

  const handleFillPattern = useCallback(
    (event: FillPatternEventArgs) => {
      if (!onFill) {
        return;
      }
      event.preventDefault();
      const source = event.patternSource;
      const dest = event.fillDestination;
      const updates: { row: number; col: number; value: string }[] = [];
      const data = rowsRef.current;

      // Vertical fill (same columns as source, rows below/above).
      if (dest.x === source.x && dest.width === source.width) {
        for (let colOffset = 0; colOffset < source.width; colOffset += 1) {
          const col = source.x + colOffset;
          const sourceValues: string[] = [];
          for (let rowOffset = 0; rowOffset < source.height; rowOffset += 1) {
            sourceValues.push(data[source.y + rowOffset]?.[col] ?? "");
          }
          const filled = fillSeries(sourceValues, dest.height);
          for (let rowOffset = 0; rowOffset < dest.height; rowOffset += 1) {
            updates.push({
              row: toSourceRow(dest.y + rowOffset),
              col,
              value: filled[rowOffset] ?? "",
            });
          }
        }
      } else if (dest.y === source.y && dest.height === source.height) {
        // Horizontal fill.
        for (let rowOffset = 0; rowOffset < source.height; rowOffset += 1) {
          const visibleRow = source.y + rowOffset;
          const sourceValues: string[] = [];
          for (let colOffset = 0; colOffset < source.width; colOffset += 1) {
            sourceValues.push(data[visibleRow]?.[source.x + colOffset] ?? "");
          }
          const filled = fillSeries(sourceValues, dest.width);
          for (let colOffset = 0; colOffset < dest.width; colOffset += 1) {
            updates.push({
              row: toSourceRow(visibleRow),
              col: dest.x + colOffset,
              value: filled[colOffset] ?? "",
            });
          }
        }
      } else {
        // Fallback: tile copy.
        for (let rowOffset = 0; rowOffset < dest.height; rowOffset += 1) {
          for (let colOffset = 0; colOffset < dest.width; colOffset += 1) {
            const srcRow = source.y + (rowOffset % source.height);
            const srcCol = source.x + (colOffset % source.width);
            updates.push({
              row: toSourceRow(dest.y + rowOffset),
              col: dest.x + colOffset,
              value: data[srcRow]?.[srcCol] ?? "",
            });
          }
        }
      }
      if (updates.length > 0) {
        onFill(updates);
      }
    },
    [onFill, toSourceRow],
  );

  const handleKeyDownCapture = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      )
        return;
      if (event.key === "F2") {
        f2EditingRef.current = true;
        return;
      }
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === "x" && onCut) {
        event.preventDefault();
        event.stopPropagation();
        onCut();
        return;
      }
      const current = gridSelection.current;
      if (!current || rows.length === 0 || columnCount === 0) return;
      if (mod && event.key.toLowerCase() === "a") {
        event.preventDefault();
        event.stopPropagation();
        handleGridSelectionChange({
          ...EMPTY_SELECTION,
          current: {
            cell: [0, 0],
            range: { x: 0, y: 0, width: columnCount, height: rows.length },
            rangeStack: [],
          },
        });
        return;
      }
      const directions: Record<string, { row: number; col: number }> = {
        ArrowUp: { row: -1, col: 0 },
        ArrowDown: { row: 1, col: 0 },
        ArrowLeft: { row: 0, col: -1 },
        ArrowRight: { row: 0, col: 1 },
      };
      if (!(mod && directions[event.key]) && event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();
      event.stopPropagation();
      const anchor = { row: current.cell[1], col: current.cell[0] };
      const rect = current.range;
      const start = event.shiftKey
        ? {
            row: anchor.row === rect.y ? rect.y + rect.height - 1 : rect.y,
            col: anchor.col === rect.x ? rect.x + rect.width - 1 : rect.x,
          }
        : anchor;
      const next =
        event.key === "Home"
          ? { row: mod ? 0 : start.row, col: 0 }
          : event.key === "End"
            ? { row: mod ? rows.length - 1 : start.row, col: columnCount - 1 }
            : dataEdge(rows, start, directions[event.key]);
      const cell: Item = event.shiftKey ? current.cell : [next.col, next.row];
      const range = event.shiftKey
        ? {
            x: Math.min(anchor.col, next.col),
            y: Math.min(anchor.row, next.row),
            width: Math.abs(anchor.col - next.col) + 1,
            height: Math.abs(anchor.row - next.row) + 1,
          }
        : { x: next.col, y: next.row, width: 1, height: 1 };
      handleGridSelectionChange({ ...EMPTY_SELECTION, current: { cell, range, rangeStack: [] } });
      ref.current?.scrollTo(next.col, next.row);
    },
    [onCut, gridSelection, rows, columnCount, handleGridSelectionChange],
  );

  const textEditor = useCallback<ProvideEditorComponent<GridCell>>(
    (props) => (
      <CellTextEditor
        {...props}
        isHighlighted={f2EditingRef.current ? false : props.isHighlighted}
        registerCommit={registerCommit}
      />
    ),
    [registerCommit],
  );

  const rowMarkerTheme = useMemo(
    () => ({
      bgCell: theme === "dark" ? "#222a32" : "#edf2f7",
    }),
    [theme],
  );

  return (
    <div className="glideSheet" onKeyDownCapture={handleKeyDownCapture}>
      <DataEditor
        ref={ref}
        className="glideSheet__editor"
        width="100%"
        height="100%"
        columns={columns}
        rows={rowCount}
        theme={gridTheme}
        getRowThemeOverride={getRowThemeOverride}
        getCellContent={getCellContent}
        keybindings={{ activateCell: "F2| |Enter|shift+Enter", downFill: true, rightFill: true }}
        onFinishedEditing={() => {
          f2EditingRef.current = false;
        }}
        onCellEdited={onCellEdited}
        provideEditor={(cell) =>
          cell.kind === GridCellKind.Text ? { editor: textEditor } : undefined
        }
        onCellsEdited={(items) => {
          const updates = items.flatMap((item) =>
            item.value.kind === GridCellKind.Text && toSourceRow(item.location[1]) >= 0
              ? [
                  {
                    row: toSourceRow(item.location[1]),
                    col: item.location[0],
                    value: item.value.data,
                  },
                ]
              : [],
          );
          if (onFill) onFill(updates);
          else updates.forEach((update) => onEdit(update.row, update.col, update.value));
          return true;
        }}
        onDelete={() => {
          onClear?.();
          return false;
        }}
        onColumnMoved={onColumnMove}
        getCellsForSelection={true}
        fillHandle={true}
        onFillPattern={handleFillPattern}
        freezeColumns={Math.max(0, freezeColumns)}
        rowHeight={rowHeight}
        headerHeight={headerHeight}
        onPaste={(target, values) => {
          onPasteGrid(
            toSourceRow(target[1]),
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
          const maxRow = Math.max(0, rows.length + (rowSourceIndexes ? 0 : BUFFER_ROWS) - 1);
          const maxCol = Math.max(0, columnCount + BUFFER_COLS - 1);
          const visibleRow = Math.min(cell[1], maxRow);
          onOpenContextMenu(
            "cell",
            toSourceRow(visibleRow),
            Math.min(cell[0], maxCol),
            event.bounds.x,
            event.bounds.y + event.bounds.height,
          );
        }}
        onHeaderContextMenu={(colIndex, event) => {
          event.preventDefault();
          onOpenContextMenu(
            "column",
            0,
            colIndex,
            event.bounds.x,
            event.bounds.y + event.bounds.height,
          );
        }}
        onHeaderMenuClick={(colIndex, bounds: Rectangle) => {
          onHeaderMenuClick?.(colIndex, bounds);
        }}
        rowMarkers="both"
        rowMarkerTheme={rowMarkerTheme}
        highlightRegions={highlightRegions}
        smoothScrollX
        smoothScrollY
        rangeSelect="rect"
        columnSelect="multi"
        rowSelect="multi"
      />
    </div>
  );
}
