import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  CompactSelection,
  DataEditor,
  GridCellKind,
  type DataEditorRef,
  type EditableGridCell,
  type FillPatternEventArgs,
  type GridCell,
  type GridColumn,
  type GridMouseEventArgs,
  type GridSelection,
  type Highlight,
  type Item,
  type Rectangle,
  type Theme,
} from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";
import { BUFFER_COLS, BUFFER_ROWS, MIN_GRID_COLS, MIN_GRID_ROWS } from "../types/sheet";
import type { CellValue, ColumnWidthMap, Range } from "../types/sheet";
import type { ContextMenuKind } from "./ContextMenu";
import { columnName } from "../lib/columns";
import { t } from "../lib/i18n";
import { targetRanges } from "../lib/selectionTarget";
import { fillSeries } from "../lib/autofill";

type GlideSheetProps = {
  rows: CellValue[][];
  /** Optional mapping from visible row index → source row index (filter mode). */
  rowSourceIndexes?: number[] | null;
  columnCount: number;
  sourceRowCount?: number;
  columnSourceIndexes?: number[];
  selectedRows?: number[];
  selectedColumns?: number[];
  hiddenRows?: number[];
  hiddenColumns?: number[];
  onReveal?: (axis: "row" | "column", indexes: number[]) => void;
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
  onColumnResizeStart?: () => void;
  onColumnResizeEnd?: (col: number, width: number) => void;
  onSelectionChange: (selection: { row: number; col: number }, range: Range) => void;
  onRowsSelected?: (indexes: number[]) => void;
  onColumnsSelected?: (indexes: number[]) => void;
  onPasteGrid: (startRow: number, startCol: number, grid: CellValue[][]) => void;
  onFill?: (updates: { row: number; col: number; value: string }[]) => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onClear?: () => void;
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

function compactToIndexes(selection: CompactSelection, maxIndex?: number): number[] {
  const indexes: number[] = [];
  for (const index of selection) {
    if (maxIndex !== undefined && index > maxIndex) break;
    indexes.push(index);
  }
  return indexes;
}

function compactFromIndexes(indexes: readonly number[]): CompactSelection {
  let selection = CompactSelection.empty();
  for (const index of indexes) {
    selection = selection.add(index);
  }
  return selection;
}

function buildAxisRange(anchor: number, target: number, base: readonly number[]): number[] {
  const start = Math.min(anchor, target);
  const end = Math.max(anchor, target);
  const set = new Set<number>(base);
  for (let i = start; i <= end; i += 1) {
    set.add(i);
  }
  return [...set].sort((a, b) => a - b);
}

type HeaderDragState = {
  axis: "row" | "column";
  anchor: number;
  base: number[];
  target: number;
  isMod: boolean;
  isShift: boolean;
  keepSingle: boolean;
};

export function GlideSheet({
  rows,
  rowSourceIndexes,
  columnCount,
  sourceRowCount = rows.length,
  columnSourceIndexes,
  selectedRows = [],
  selectedColumns = [],
  hiddenRows,
  hiddenColumns,
  onReveal,
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
  onColumnResizeStart,
  onColumnResizeEnd,
  onSelectionChange,
  onRowsSelected,
  onColumnsSelected,
  onPasteGrid,
  onFill,
  onCut,
  onCopy,
  onPaste,
  onClear,
  onOpenContextMenu,
  onHeaderMenuClick,
}: GlideSheetProps) {
  const ref = useRef<DataEditorRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportNonce, setViewportNonce] = useState(0);
  const viewportKey = useRef("");
  const onViewportChanged = useCallback((rect: Rectangle, tx: number, ty: number) => {
    const key = `${rect.x}:${rect.y}:${rect.width}:${rect.height}:${tx}:${ty}`;
    if (key !== viewportKey.current) {
      viewportKey.current = key;
      setViewportNonce((value) => value + 1);
    }
  }, []);
  useEffect(() => {
    const refresh = () => setViewportNonce((value) => value + 1);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(refresh);
    if (containerRef.current) observer?.observe(containerRef.current);
    window.addEventListener("resize", refresh);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", refresh);
    };
  }, []);
  const [gapButtons, setGapButtons] = useState<
    { axis: "row" | "column"; indexes: number[]; left: number; top: number }[]
  >([]);
  const [gridSelection, setGridSelection] = useState<GridSelection>(EMPTY_SELECTION);
  const suppressContextSelection = useRef(false);
  const suppressHeaderMenuRef = useRef(false);
  const lastPointerRef = useRef<GridMouseEventArgs | null>(null);
  const colAnchorRef = useRef<number | null>(null);
  const rowAnchorRef = useRef<number | null>(null);
  const headerDragRef = useRef<HeaderDragState | null>(null);
  const activeHitRef = useRef(activeSearchHit);
  activeHitRef.current = activeSearchHit;
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const sourceMapRef = useRef(rowSourceIndexes);
  sourceMapRef.current = rowSourceIndexes;

  useEffect(() => {
    const handleMouseUp = () => {
      headerDragRef.current = null;
      queueMicrotask(() => {
        suppressHeaderMenuRef.current = false;
      });
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const toSourceRow = useCallback(
    (visibleRow: number): number => {
      const map = sourceMapRef.current;
      return map
        ? (map[visibleRow] ?? sourceRowCount + Math.max(0, visibleRow - map.length))
        : visibleRow;
    },
    [sourceRowCount],
  );
  const toVisibleRow = useCallback(
    (sourceRow: number): number => {
      const map = sourceMapRef.current;
      if (!map) return sourceRow;
      return sourceRow >= sourceRowCount
        ? map.length + sourceRow - sourceRowCount
        : map.indexOf(sourceRow);
    },
    [sourceRowCount],
  );
  const toSourceCol = useCallback(
    (visibleCol: number): number =>
      columnSourceIndexes
        ? (columnSourceIndexes[visibleCol] ??
          columnCount + Math.max(0, visibleCol - columnSourceIndexes.length))
        : visibleCol,
    [columnSourceIndexes, columnCount],
  );
  const toVisibleCol = useCallback(
    (sourceCol: number): number =>
      !columnSourceIndexes
        ? sourceCol
        : sourceCol >= columnCount
          ? columnSourceIndexes.length + sourceCol - columnCount
          : columnSourceIndexes.indexOf(sourceCol),
    [columnSourceIndexes, columnCount],
  );
  const visibleColumnCount = columnSourceIndexes?.length ?? columnCount;

  useLayoutEffect(() => {
    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return;
    const buttons: typeof gapButtons = [];
    for (const axis of ["row", "column"] as const) {
      const indexes = axis === "row" ? (hiddenRows ?? []) : (hiddenColumns ?? []);
      const groups: number[][] = [];
      for (const index of indexes) {
        const group = groups[groups.length - 1];
        if (group && group[group.length - 1] === index - 1) group.push(index);
        else groups.push([index]);
      }
      for (const group of groups) {
        const source = group[group.length - 1]! + 1;
        const visible = axis === "row" ? toVisibleRow(source) : toVisibleCol(source);
        if (visible < 0) continue;
        const bounds = ref.current?.getBounds(
          axis === "column" ? visible : 0,
          axis === "row" ? visible : 0,
        );
        if (!bounds) continue;
        const left = axis === "column" ? bounds.x - container.x : 0;
        const top = axis === "row" ? bounds.y - container.y : 0;
        if (left >= 0 && top >= 0 && left <= container.width && top <= container.height)
          buttons.push({ axis, indexes: group, left, top });
      }
    }
    setGapButtons(buttons);
  }, [hiddenRows, hiddenColumns, toVisibleRow, toVisibleCol, viewportNonce, colWidths, zoom]);

  const columns = useMemo<GridColumn[]>(
    () =>
      Array.from(
        { length: Math.max(visibleColumnCount + BUFFER_COLS, MIN_GRID_COLS) },
        (_, index) => ({
          title: columnName(toSourceCol(index)),
          id: String(toSourceCol(index)),
          width: colWidths[toSourceCol(index)] ?? 120,
          hasMenu: true,
        }),
      ),
    [visibleColumnCount, colWidths, toSourceCol],
  );

  const rowCount = Math.max(rows.length + BUFFER_ROWS, MIN_GRID_ROWS);
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
      const data = rows[row]?.[toSourceCol(col)] ?? "";
      return {
        kind: GridCellKind.Text,
        data,
        displayData: data,
        allowOverlay: true,
      };
    },
    [rows, toSourceCol],
  );

  const onCellEdited = useCallback(
    (cell: Item, newValue: EditableGridCell) => {
      if (newValue.kind !== GridCellKind.Text) {
        return;
      }
      onEdit(toSourceRow(cell[1]), toSourceCol(cell[0]), newValue.data);
    },
    [onEdit, toSourceRow, toSourceCol],
  );

  const applyAxisSelection = useCallback(
    (axis: "row" | "column", indexes: number[]) => {
      if (axis === "row") {
        setGridSelection({
          columns: CompactSelection.empty(),
          rows: compactFromIndexes(indexes),
          current: undefined,
        });
        onColumnsSelected?.([]);
        onRowsSelected?.(indexes.map(toSourceRow));
        if (indexes.length > 0) {
          const first = indexes[0]!;
          const last = indexes[indexes.length - 1]!;
          onSelectionChange(
            { row: toSourceRow(first), col: toSourceCol(0) },
            {
              startRow: toSourceRow(first),
              startCol: toSourceCol(0),
              endRow: toSourceRow(last),
              endCol: Math.max(0, columnCount - 1),
            },
          );
        }
      } else {
        setGridSelection({
          columns: compactFromIndexes(indexes),
          rows: CompactSelection.empty(),
          current: undefined,
        });
        onRowsSelected?.([]);
        onColumnsSelected?.(indexes.map(toSourceCol));
        if (indexes.length > 0) {
          const first = indexes[0]!;
          const last = indexes[indexes.length - 1]!;
          onSelectionChange(
            { row: toSourceRow(0), col: toSourceCol(first) },
            {
              startRow: toSourceRow(0),
              startCol: toSourceCol(first),
              endRow: toSourceRow(Math.max(0, rows.length - 1)),
              endCol: toSourceCol(last),
            },
          );
        }
      }
    },
    [
      onSelectionChange,
      onRowsSelected,
      onColumnsSelected,
      rows.length,
      columnCount,
      toSourceRow,
      toSourceCol,
    ],
  );

  const handleMouseMove = useCallback(
    (args: GridMouseEventArgs) => {
      const maxRow = Math.max(0, rows.length + BUFFER_ROWS - 1);
      const maxCol = Math.max(0, visibleColumnCount + BUFFER_COLS - 1);
      if ((args.buttons & 1) === 0) {
        lastPointerRef.current = args;
        headerDragRef.current = null;
        return;
      }
      if (!headerDragRef.current) {
        if (args.kind === "header" && args.location[0] >= 0 && !args.isEdge) {
          const col = Math.min(args.location[0], maxCol);
          headerDragRef.current = {
            axis: "column",
            anchor: colAnchorRef.current ?? col,
            base: [],
            target: col,
            isMod: false,
            isShift: false,
            keepSingle: false,
          };
        } else if (args.kind === "cell" && args.location[0] === -1 && args.location[1] >= 0) {
          const row = Math.min(args.location[1], maxRow);
          headerDragRef.current = {
            axis: "row",
            anchor: rowAnchorRef.current ?? row,
            base: [],
            target: row,
            isMod: false,
            isShift: false,
            keepSingle: false,
          };
        }
      }
      const drag = headerDragRef.current;
      if (!drag) return;
      if (drag.axis === "column") {
        const rawCol = args.location[0];
        if (rawCol >= 0) {
          const targetCol = Math.min(rawCol, maxCol);
          if (targetCol !== drag.target) {
            drag.target = targetCol;
            suppressHeaderMenuRef.current = true;
            const nextCols = buildAxisRange(drag.anchor, targetCol, drag.base);
            applyAxisSelection("column", nextCols);
          }
        }
      } else {
        const rawRow = args.location[1];
        if (rawRow >= 0) {
          const targetRow = Math.min(rawRow, maxRow);
          if (targetRow !== drag.target) {
            drag.target = targetRow;
            const nextRows = buildAxisRange(drag.anchor, targetRow, drag.base);
            applyAxisSelection("row", nextRows);
          }
        }
      }
    },
    [rows.length, visibleColumnCount, applyAxisSelection],
  );

  const handleMouseDownCapture = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        headerDragRef.current = null;
        return;
      }
      const pointer = lastPointerRef.current;
      if (!pointer) return;
      const maxRow = Math.max(0, rows.length + BUFFER_ROWS - 1);
      const maxCol = Math.max(0, visibleColumnCount + BUFFER_COLS - 1);

      if (pointer.kind === "header") {
        if (pointer.isEdge || pointer.location[0] < 0) {
          headerDragRef.current = null;
          return;
        }
        const clickedCol = Math.min(pointer.location[0], maxCol);
        const isMod = event.ctrlKey || event.metaKey;
        const isShift = event.shiftKey;
        const currentVisibleCols = selectedColumns
          .map(toVisibleCol)
          .filter((i) => i >= 0 && i <= maxCol);
        const fallbackAnchor =
          currentVisibleCols[0] ?? Math.min(Math.max(0, toVisibleCol(selection.col)), maxCol);
        const anchor = isShift ? (colAnchorRef.current ?? fallbackAnchor) : clickedCol;
        if (!isShift) {
          colAnchorRef.current = clickedCol;
        }
        const base = isMod ? currentVisibleCols.filter((c) => isShift || c !== clickedCol) : [];
        headerDragRef.current = {
          axis: "column",
          anchor,
          base,
          target: clickedCol,
          isMod,
          isShift,
          keepSingle: false,
        };
        const isOverMenu =
          pointer.bounds.width > 35 && pointer.localEventX > pointer.bounds.width - 30;
        if (isOverMenu && (isShift || isMod)) {
          suppressHeaderMenuRef.current = true;
          const nextCols = isShift
            ? buildAxisRange(anchor, clickedCol, base)
            : currentVisibleCols.includes(clickedCol)
              ? base
              : [...base, clickedCol].sort((a, b) => a - b);
          applyAxisSelection("column", nextCols);
        }
        return;
      }

      if (pointer.kind === "cell" && pointer.location[0] === -1 && pointer.location[1] >= 0) {
        const clickedRow = Math.min(pointer.location[1], maxRow);
        const isMod = event.ctrlKey || event.metaKey;
        const isShift = event.shiftKey;
        const currentVisibleRows = selectedRows
          .map(toVisibleRow)
          .filter((i) => i >= 0 && i <= maxRow);
        const fallbackAnchor =
          currentVisibleRows[0] ?? Math.min(Math.max(0, toVisibleRow(selection.row)), maxRow);
        const anchor = isShift ? (rowAnchorRef.current ?? fallbackAnchor) : clickedRow;
        if (!isShift) {
          rowAnchorRef.current = clickedRow;
        }
        const base = isMod ? currentVisibleRows.filter((r) => isShift || r !== clickedRow) : [];
        const keepSingle =
          !isMod && !isShift && currentVisibleRows.length === 1 && currentVisibleRows[0] === clickedRow;
        headerDragRef.current = {
          axis: "row",
          anchor,
          base,
          target: clickedRow,
          isMod,
          isShift,
          keepSingle,
        };
        return;
      }

      headerDragRef.current = null;
      if (pointer.kind === "cell" && pointer.location[0] >= 0 && pointer.location[1] >= 0) {
        colAnchorRef.current = Math.min(pointer.location[0], maxCol);
        rowAnchorRef.current = Math.min(pointer.location[1], maxRow);
      }
    },
    [
      rows.length,
      visibleColumnCount,
      selectedColumns,
      selectedRows,
      selection.col,
      selection.row,
      toVisibleCol,
      toVisibleRow,
      applyAxisSelection,
    ],
  );

  const handleGridSelectionChange = useCallback(
    (next: GridSelection) => {
      if (suppressContextSelection.current) return;
      const maxRow = Math.max(0, rows.length + BUFFER_ROWS - 1);
      const maxCol = Math.max(0, visibleColumnCount + BUFFER_COLS - 1);

      const drag = headerDragRef.current;
      if (!next.current && drag) {
        if (drag.axis === "column" && (drag.isShift || drag.target !== drag.anchor)) {
          applyAxisSelection("column", buildAxisRange(drag.anchor, drag.target, drag.base));
          return;
        }
        if (
          drag.axis === "row" &&
          (drag.isShift ||
            drag.target !== drag.anchor ||
            (drag.keepSingle && next.rows.length === 0))
        ) {
          applyAxisSelection("row", buildAxisRange(drag.anchor, drag.target, drag.base));
          return;
        }
      }

      if (
        !next.current &&
        next.rows.length >= rowCount &&
        selectedRows.length > maxRow &&
        lastPointerRef.current?.kind === "header" &&
        lastPointerRef.current.location[0] === -1
      ) {
        applyAxisSelection("row", []);
        return;
      }

      const nextSelectedRows = compactToIndexes(next.rows, maxRow);
      const nextSelectedCols = compactToIndexes(next.columns, maxCol);
      if (nextSelectedRows.length === 1) {
        rowAnchorRef.current = nextSelectedRows[0]!;
      }
      if (nextSelectedCols.length === 1) {
        colAnchorRef.current = nextSelectedCols[0]!;
      }
      if (nextSelectedRows.length > 0) {
        onRowsSelected?.(nextSelectedRows.map(toSourceRow));
      } else {
        onRowsSelected?.([]);
      }
      if (nextSelectedCols.length > 0) {
        onColumnsSelected?.(nextSelectedCols.map(toSourceCol));
      } else {
        onColumnsSelected?.([]);
      }

      const current = next.current;
      if (!current) {
        setGridSelection(next);
        if (nextSelectedRows.length > 0) {
          const first = nextSelectedRows[0]!;
          const last = nextSelectedRows[nextSelectedRows.length - 1]!;
          onSelectionChange(
            { row: toSourceRow(first), col: toSourceCol(0) },
            {
              startRow: toSourceRow(first),
              startCol: toSourceCol(0),
              endRow: toSourceRow(last),
              endCol: Math.max(0, columnCount - 1),
            },
          );
        } else if (nextSelectedCols.length > 0) {
          const first = nextSelectedCols[0]!;
          const last = nextSelectedCols[nextSelectedCols.length - 1]!;
          onSelectionChange(
            { row: toSourceRow(0), col: toSourceCol(first) },
            {
              startRow: toSourceRow(0),
              startCol: toSourceCol(first),
              endRow: toSourceRow(Math.max(0, rows.length - 1)),
              endCol: toSourceCol(last),
            },
          );
        }
        return;
      }

      const col = Math.min(current.cell[0], maxCol);
      const row = Math.min(current.cell[1], maxRow);
      colAnchorRef.current = col;
      rowAnchorRef.current = row;
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
        onSelectionChange({ row: toSourceRow(row), col: toSourceCol(col) }, null);
        return;
      }
      setGridSelection(next);
      const rect = current.range;
      const rangeValue: Range =
        rect.width <= 1 && rect.height <= 1
          ? null
          : {
              startRow: toSourceRow(rect.y),
              startCol: toSourceCol(rect.x),
              endRow: toSourceRow(Math.min(rect.y + rect.height - 1, maxRow)),
              endCol: toSourceCol(Math.min(rect.x + rect.width - 1, maxCol)),
            };
      onSelectionChange({ row: toSourceRow(row), col: toSourceCol(col) }, rangeValue);
    },
    [
      onSelectionChange,
      onRowsSelected,
      onColumnsSelected,
      rows.length,
      rowCount,
      selectedRows.length,
      columnCount,
      visibleColumnCount,
      toSourceRow,
      toSourceCol,
      applyAxisSelection,
    ],
  );

  const highlightRegions = useMemo<Highlight[]>(() => {
    const regions: Highlight[] = [];
    for (const key of searchHits) {
      const [sourceRow, sourceCol] = key.split(":").map(Number);
      const col = toVisibleCol(sourceCol);
      if (col < 0) continue;
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
  }, [searchHits, activeSearchHit, toVisibleRow, toVisibleCol, rowSourceIndexes]);

  useEffect(() => {
    const hit = activeHitRef.current;
    if (!hit) {
      return;
    }
    const [sourceRow, sourceCol] = hit.split(":").map(Number);
    const col = toVisibleCol(sourceCol);
    const row = toVisibleRow(sourceRow);
    if (row < 0 || col < 0) return;
    ref.current?.scrollTo(col, row);
  }, [scrollNonce, toVisibleRow, toVisibleCol]);

  useEffect(() => {
    if (!focusCell) {
      return;
    }
    const row = toVisibleRow(focusCell.row);
    const col = toVisibleCol(focusCell.col);
    if (row < 0 || col < 0) return;
    ref.current?.scrollTo(col, row);
  }, [focusCell?.nonce, focusCell?.row, focusCell?.col, toVisibleRow, toVisibleCol]);

  const rangeStartRow = range?.startRow;
  const rangeStartCol = range?.startCol;
  const rangeEndRow = range?.endRow;
  const rangeEndCol = range?.endCol;
  useEffect(() => {
    const maxRow = Math.max(0, rows.length + BUFFER_ROWS - 1);
    const maxCol = Math.max(0, visibleColumnCount + BUFFER_COLS - 1);
    const col = Math.min(Math.max(0, toVisibleCol(selection.col)), maxCol);
    const row = Math.min(Math.max(0, toVisibleRow(selection.row)), maxRow);
    let rect: { x: number; y: number; width: number; height: number };
    if (
      rangeStartRow !== undefined &&
      rangeStartCol !== undefined &&
      rangeEndRow !== undefined &&
      rangeEndCol !== undefined
    ) {
      const startRow = Math.max(
        0,
        Math.min(toVisibleRow(rangeStartRow), toVisibleRow(rangeEndRow)),
      );
      const startCol = Math.max(
        0,
        Math.min(toVisibleCol(rangeStartCol), toVisibleCol(rangeEndCol)),
      );
      const endRow = Math.min(
        Math.max(toVisibleRow(rangeStartRow), toVisibleRow(rangeEndRow), startRow),
        maxRow,
      );
      const endCol = Math.min(
        Math.max(toVisibleCol(rangeStartCol), toVisibleCol(rangeEndCol), startCol),
        maxCol,
      );
      rect = {
        x: startCol,
        y: startRow,
        width: endCol - startCol + 1,
        height: endRow - startRow + 1,
      };
    } else {
      rect = { x: col, y: row, width: 1, height: 1 };
    }
    let selectedRowSet = CompactSelection.empty(),
      selectedColSet = CompactSelection.empty();
    selectedRows
      .map(toVisibleRow)
      .filter((i) => i >= 0)
      .forEach((i) => {
        selectedRowSet = selectedRowSet.add(i);
      });
    selectedColumns
      .map(toVisibleCol)
      .filter((i) => i >= 0)
      .forEach((i) => {
        selectedColSet = selectedColSet.add(i);
      });
    setGridSelection({
      columns: selectedColSet,
      rows: selectedRowSet,
      current:
        selectedRows.length || selectedColumns.length
          ? undefined
          : { cell: [col, row], range: rect, rangeStack: [] },
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
    visibleColumnCount,
    selectedRows,
    selectedColumns,
    toVisibleRow,
    toVisibleCol,
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
            sourceValues.push(data[source.y + rowOffset]?.[toSourceCol(col)] ?? "");
          }
          const filled = fillSeries(sourceValues, dest.height);
          for (let rowOffset = 0; rowOffset < dest.height; rowOffset += 1) {
            updates.push({
              row: toSourceRow(dest.y + rowOffset),
              col: toSourceCol(col),
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
            sourceValues.push(data[visibleRow]?.[toSourceCol(source.x + colOffset)] ?? "");
          }
          const filled = fillSeries(sourceValues, dest.width);
          for (let colOffset = 0; colOffset < dest.width; colOffset += 1) {
            updates.push({
              row: toSourceRow(visibleRow),
              col: toSourceCol(dest.x + colOffset),
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
              col: toSourceCol(dest.x + colOffset),
              value: data[srcRow]?.[toSourceCol(srcCol)] ?? "",
            });
          }
        }
      }
      if (updates.length > 0) {
        onFill(updates);
      }
    },
    [onFill, toSourceRow, toSourceCol],
  );

  const handleKeyDownCapture = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    )
      return;
    if ((event.shiftKey && event.key === "F10") || event.key === "ContextMenu") {
      event.preventDefault();
      event.stopPropagation();
      const bounds = ref.current?.getBounds(
        Math.max(0, toVisibleCol(selection.col)),
        Math.max(0, toVisibleRow(selection.row)),
      );
      onOpenContextMenu(
        selectedRows.length ? "row" : selectedColumns.length ? "column" : "cell",
        selectedRows[0] ?? selection.row,
        selectedColumns[0] ?? selection.col,
        bounds?.x ?? 8,
        (bounds?.y ?? 8) + (bounds?.height ?? 0),
      );
      return;
    }
    const command = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    const action =
      command && key === "x"
        ? onCut
        : command && key === "c"
          ? onCopy
          : command && key === "v"
            ? onPaste
            : !command && (key === "delete" || key === "backspace")
              ? onClear
              : undefined;
    if (action) {
      event.preventDefault();
      event.stopPropagation();
      action();
    }
  };

  const rowMarkerTheme = useMemo(
    () => ({
      bgCell: theme === "dark" ? "#222a32" : "#edf2f7",
    }),
    [theme],
  );

  return (
    <div
      ref={containerRef}
      className="glideSheet"
      tabIndex={-1}
      onKeyDownCapture={handleKeyDownCapture}
      onMouseDownCapture={handleMouseDownCapture}
    >
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
        onCellEdited={onCellEdited}
        onVisibleRegionChanged={onViewportChanged}
        onMouseMove={handleMouseMove}
        onItemHovered={handleMouseMove}
        getCellsForSelection={true}
        fillHandle={true}
        onFillPattern={handleFillPattern}
        freezeColumns={Math.max(0, freezeColumns)}
        rowHeight={rowHeight}
        headerHeight={headerHeight}
        onPaste={(target, values) => {
          onPasteGrid(
            toSourceRow(target[1]),
            toSourceCol(target[0]),
            values.map((row) => [...row]),
          );
          return false;
        }}
        gridSelection={gridSelection}
        onGridSelectionChange={handleGridSelectionChange}
        onColumnResizeStart={() => onColumnResizeStart?.()}
        onColumnResizeEnd={(_column, newSize, colIndex) =>
          onColumnResizeEnd?.(toSourceCol(colIndex), newSize)
        }
        onColumnResize={(_column, newSize, colIndex) =>
          onColumnResize(toSourceCol(colIndex), newSize)
        }
        onCellContextMenu={(cell, event) => {
          event.preventDefault();
          suppressContextSelection.current = true;
          queueMicrotask(() => {
            suppressContextSelection.current = false;
          });
          onOpenContextMenu(
            cell[0] < 0 ? "row" : "cell",
            toSourceRow(cell[1]),
            cell[0] < 0 ? toSourceCol(0) : toSourceCol(cell[0]),
            event.bounds.x,
            event.bounds.y + event.bounds.height,
          );
        }}
        onHeaderContextMenu={(colIndex, event) => {
          event.preventDefault();
          if (colIndex < 0) return;
          onOpenContextMenu(
            "column",
            toSourceRow(0),
            toSourceCol(colIndex),
            event.bounds.x,
            event.bounds.y + event.bounds.height,
          );
        }}
        onHeaderMenuClick={(colIndex, bounds: Rectangle) => {
          if (suppressHeaderMenuRef.current) {
            suppressHeaderMenuRef.current = false;
            return;
          }
          onHeaderMenuClick?.(toSourceCol(colIndex), bounds);
        }}
        onDelete={() => {
          onClear?.();
          return false;
        }}
        rowMarkers="both"
        rowSelectionMode="multi"
        rowMarkerTheme={rowMarkerTheme}
        highlightRegions={highlightRegions}
        smoothScrollX
        smoothScrollY
        rangeSelect="rect"
        columnSelect="multi"
        rowSelect="multi"
      />
      {gapButtons.map((gap) => (
        <button
          key={`${gap.axis}:${gap.indexes[0]}`}
          className="glideSheet__gap"
          style={{ left: gap.left, top: gap.top }}
          title={t(gap.axis === "row" ? "revealRows" : "revealColumns", {
            ranges: targetRanges(gap.indexes, gap.axis === "column"),
          })}
          aria-label={t(gap.axis === "row" ? "revealRows" : "revealColumns", {
            ranges: targetRanges(gap.indexes, gap.axis === "column"),
          })}
          onClick={() => onReveal?.(gap.axis, gap.indexes)}
        >
          ⋯
        </button>
      ))}
    </div>
  );
}
