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
import {
  BUFFER_COLS,
  BUFFER_ROWS,
  MIN_GRID_COLS,
  MIN_GRID_ROWS,
  MAX_GRID_COLS,
  MAX_GRID_ROWS,
} from "../types/sheet";
import type { CellValue, ColumnWidthMap, Range, CellEditIdentity } from "../types/sheet";
import type { ContextMenuKind } from "./ContextMenu";
import { columnName } from "../lib/columns";
import { CellTextEditor, type RegisterEditorCommit } from "./CellTextEditor";
import { dataEdge } from "../lib/gridOperations";
import { translateFormula } from "../lib/formula";
import { buildFillUpdates } from "../lib/autofill";

type GlideSheetProps = {
  rows: CellValue[][];
  /** Optional mapping from visible row index → source row index (filter mode). */
  rowSourceIndexes?: number[] | null;
  columnCount: number;
  colWidths: ColumnWidthMap;
  selection: { row: number; col: number };
  range: Range;
  /** Source-coordinate header axes, controlled together with the cell range. */
  selectedRowIndexes?: readonly number[];
  selectedColumnIndexes?: readonly number[];
  searchHits: Set<string>;
  activeSearchHit: string | null;
  scrollNonce: number;
  focusCell?: { row: number; col: number; nonce: number } | null;
  theme: "light" | "dark";
  zebra: boolean;
  headerHighlight: boolean;
  freezeColumns?: number;
  freezeRows?: number;
  zoom?: number;
  fillMode?: "copy" | "series";
  formulaEnabled?: boolean;
  readOnly?: boolean;
  displayValues?: (row: number, col: number) => string;
  onFillPreview?: (updates: { row: number; col: number; value: string }[]) => void;
  onCopy?: () => void;
  onPasteText?: (text: string) => void;
  onPasteHtml?: (html: string) => void;
  onInputError?: (message: string) => void;
  onEdit: (row: number, col: number, value: string, identity?: CellEditIdentity) => void;
  getEditIdentity?: (row: number, col: number) => CellEditIdentity | undefined;
  onColumnResize: (col: number, width: number) => void;
  onSelectionChange: (selection: { row: number; col: number }, range: Range) => void;
  onRowsSelected?: (indexes: number[]) => void;
  onColumnsSelected?: (indexes: number[]) => void;
  onPasteGrid: (startRow: number, startCol: number, grid: CellValue[][]) => void;
  onFill?: (
    updates: { row: number; col: number; value: string; identity?: CellEditIdentity }[],
  ) => void;
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
    preserveSelection?: boolean,
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
  selectedRowIndexes,
  selectedColumnIndexes,
  searchHits,
  activeSearchHit,
  scrollNonce,
  focusCell,
  theme,
  zebra,
  headerHighlight,
  freezeColumns = 0,
  freezeRows = 0,
  zoom = 1,
  fillMode = "copy",
  displayValues,
  formulaEnabled = false,
  readOnly = false,
  onFillPreview,
  onCopy,
  onPasteText,
  onPasteHtml,
  onInputError,
  onEdit,
  getEditIdentity,
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
  const [visibleColumns, setVisibleColumns] = useState({ start: 0, count: 8 });
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
      Array.from(
        {
          length: Math.min(
            MAX_GRID_COLS,
            Math.max(
              columnCount + BUFFER_COLS,
              MIN_GRID_COLS,
              selection.col + 1,
              (range?.endCol ?? 0) + 1,
              (range?.startCol ?? 0) + 1,
            ),
          ),
        },
        (_, index) => ({
          title: columnName(index),
          id: String(index),
          width: colWidths[index] ?? 120,
          hasMenu: true,
        }),
      ),
    [columnCount, colWidths, selection.col, range?.startCol, range?.endCol],
  );

  const rowCount = rowSourceIndexes
    ? Math.max(rows.length, 1)
    : Math.min(
        MAX_GRID_ROWS,
        Math.max(
          rows.length + BUFFER_ROWS,
          MIN_GRID_ROWS,
          selection.row + 1,
          (range?.endRow ?? 0) + 1,
          (range?.startRow ?? 0) + 1,
        ),
      );
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
        displayData: displayValues?.(toSourceRow(row), col) ?? data,
        allowOverlay: !readOnly && toSourceRow(row) >= 0,
        readonly: readOnly || toSourceRow(row) < 0,
        editIdentity: getEditIdentity?.(toSourceRow(row), col),
      } as GridCell & { editIdentity?: CellEditIdentity };
    },
    [rows, toSourceRow, displayValues, readOnly, getEditIdentity],
  );

  const onCellEdited = useCallback(
    (cell: Item, newValue: EditableGridCell) => {
      if (newValue.kind !== GridCellKind.Text) {
        return;
      }
      const sourceRow = toSourceRow(cell[1]);
      if (sourceRow >= 0) {
        const identity = (newValue as EditableGridCell & { editIdentity?: CellEditIdentity })
          .editIdentity;
        if (identity) onEdit(sourceRow, cell[0], newValue.data, identity);
        else onEdit(sourceRow, cell[0], newValue.data);
      }
    },
    [onEdit, toSourceRow],
  );

  const handleGridSelectionChange = useCallback(
    (next: GridSelection) => {
      if (rowSourceIndexes && rows.length === 0) return;
      const maxRow = Math.max(0, rowCount - 1);
      const maxCol = Math.max(0, columns.length - 1);

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
      rowCount,
      columns.length,
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
    ref.current?.focus();
  }, [focusCell?.nonce, focusCell?.row, focusCell?.col, toVisibleRow]);

  const rangeStartRow = range?.startRow;
  const rangeStartCol = range?.startCol;
  const rangeEndRow = range?.endRow;
  const rangeEndCol = range?.endCol;
  useEffect(() => {
    const maxRow = Math.max(0, rowCount - 1);
    const maxCol = Math.max(0, columns.length - 1);
    if (toVisibleRow(selection.row) < 0) {
      setGridSelection(EMPTY_SELECTION);
      return;
    }
    const col = Math.min(Math.max(0, selection.col), maxCol);
    const row = Math.min(Math.max(0, toVisibleRow(selection.row)), maxRow);
    if (selectedRowIndexes?.length || selectedColumnIndexes?.length) {
      let headerRows = CompactSelection.empty();
      let headerColumns = CompactSelection.empty();
      for (const sourceRow of selectedRowIndexes ?? []) {
        const visibleRow = toVisibleRow(sourceRow);
        if (visibleRow >= 0 && visibleRow <= maxRow) headerRows = headerRows.add(visibleRow);
      }
      for (const column of selectedColumnIndexes ?? []) {
        if (column >= 0 && column <= maxCol) headerColumns = headerColumns.add(column);
      }
      setGridSelection({ rows: headerRows, columns: headerColumns });
      return;
    }
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
      if (
        selectedRowIndexes === undefined &&
        selectedColumnIndexes === undefined &&
        !previous.current &&
        rangeStartRow !== undefined
      ) {
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
    selectedRowIndexes,
    selectedColumnIndexes,
    rowCount,
    columns.length,
  ]);

  const fillUpdates = useCallback(
    (source: Rectangle, dest: Rectangle, mode: "copy" | "series") => {
      if (source.width * source.height > 500_000 || dest.width * dest.height > 500_000) {
        onInputError?.("フィルは50万セルまで / Fill limit: 500,000 cells");
        return [];
      }
      return buildFillUpdates(rowsRef.current, source, dest, { mode }).map((u) => {
        const r =
          source.y + ((((u.row - source.y) % source.height) + source.height) % source.height);
        const c = source.x + ((((u.col - source.x) % source.width) + source.width) % source.width);
        const raw = rowsRef.current[r]?.[c] ?? "";
        return {
          ...u,
          row: toSourceRow(u.row),
          value:
            formulaEnabled && raw.startsWith("=")
              ? translateFormula(raw, {
                  rowDelta: toSourceRow(u.row) - toSourceRow(r),
                  colDelta: u.col - c,
                })
              : u.value,
        };
      });
    },
    [formulaEnabled, toSourceRow, onInputError],
  );

  const handleFillPattern = useCallback(
    (event: FillPatternEventArgs) => {
      if (!onFill) {
        return;
      }
      event.preventDefault();
      const updates = fillUpdates(event.patternSource, event.fillDestination, fillMode);
      if (updates.length > 0) {
        if (fillMode === "series" && onFillPreview) onFillPreview(updates);
        else onFill(updates);
      }
    },
    [onFill, onFillPreview, fillMode, fillUpdates],
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
      if (event.nativeEvent.isComposing || event.keyCode === 229) return;
      if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
        event.preventDefault();
        event.stopPropagation();
        const row = gridSelection.current?.cell[1] ?? toVisibleRow(selection.row);
        const col = gridSelection.current?.cell[0] ?? selection.col;
        const columns = compactToIndexes(gridSelection.columns);
        const selectedHeaderRows = compactToIndexes(gridSelection.rows);
        const kind = columns.length ? "column" : selectedHeaderRows.length ? "row" : "cell";
        onOpenContextMenu(
          kind,
          toSourceRow(selectedHeaderRows[0] ?? row),
          columns[0] ?? col,
          20,
          120,
          true,
        );
        return;
      }
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === "c" && onCopy) {
        event.preventDefault();
        event.stopPropagation();
        onCopy();
        return;
      }
      if (mod && ["d", "r"].includes(event.key.toLowerCase()) && gridSelection.current && onFill) {
        event.preventDefault();
        event.stopPropagation();
        const dest = gridSelection.current.range;
        const source =
          event.key.toLowerCase() === "d" ? { ...dest, height: 1 } : { ...dest, width: 1 };
        onFill(fillUpdates(source, dest, "copy"));
        return;
      }
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
    [
      onCut,
      onCopy,
      onFill,
      fillUpdates,
      toSourceRow,
      toVisibleRow,
      selection,
      onOpenContextMenu,
      gridSelection,
      rows,
      columnCount,
      handleGridSelectionChange,
    ],
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
    <div
      className="glideSheet"
      onKeyDownCapture={handleKeyDownCapture}
      onPasteCapture={(event) => {
        if (
          !onPasteText ||
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        )
          return;
        event.preventDefault();
        event.stopPropagation();
        const types = [...(event.clipboardData.types ?? [])];
        const plain = event.clipboardData.getData("text/plain");
        const html = event.clipboardData.getData("text/html");
        if (types.includes("text/plain") || plain) onPasteText(plain);
        else if (html && onPasteHtml) onPasteHtml(html);
      }}
    >
      {freezeRows > 0 && (
        <div className="frozenReference" aria-label="固定行の参照 / Frozen row references">
          <span>
            先頭{freezeRows}元行の表示対象だけ固定。編集は表から / Frozen references, edit in grid
          </span>
          <table>
            <tbody>
              {rows.flatMap((values, visibleRow) =>
                toSourceRow(visibleRow) < freezeRows
                  ? [
                      <tr key={toSourceRow(visibleRow)}>
                        <th scope="row">元{toSourceRow(visibleRow) + 1}</th>
                        {Array.from(
                          { length: Math.min(30, visibleColumns.count) },
                          (_, offset) => visibleColumns.start + offset,
                        ).map((col) => (
                          <td key={col}>
                            <button
                              title={values[col] ?? ""}
                              onClick={() => {
                                onRowsSelected?.([]);
                                onColumnsSelected?.([]);
                                onSelectionChange({ row: toSourceRow(visibleRow), col }, null);
                                ref.current?.scrollTo(col, visibleRow);
                                ref.current?.focus();
                              }}
                            >
                              {columnName(col)}: {values[col] ?? ""}
                            </button>
                          </td>
                        ))}
                      </tr>,
                    ]
                  : [],
              )}
            </tbody>
          </table>
        </div>
      )}
      {rowSourceIndexes && (
        <div role="status" className="rowOrientation">
          表示{Math.max(0, toVisibleRow(selection.row)) + 1}行目 / 元の{selection.row + 1}行目 ·{" "}
          {columnName(selection.col)}
          {selection.row + 1}
        </div>
      )}
      <DataEditor
        ref={ref}
        onVisibleRegionChanged={(region) =>
          setVisibleColumns((prev) =>
            prev.start === region.x && prev.count === region.width
              ? prev
              : { start: region.x, count: region.width },
          )
        }
        className="glideSheet__editor"
        width="100%"
        height="100%"
        columns={columns}
        rows={rowCount}
        theme={gridTheme}
        getRowThemeOverride={getRowThemeOverride}
        getCellContent={getCellContent}
        keybindings={{ activateCell: "F2| |Enter|shift+Enter", downFill: false, rightFill: false }}
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
                    identity: (item.value as EditableGridCell & { editIdentity?: CellEditIdentity })
                      .editIdentity,
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
          const maxRow = Math.max(0, rowCount - 1);
          const maxCol = Math.max(0, columns.length - 1);
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
