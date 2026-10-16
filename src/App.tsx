import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "./components/ConfirmDialog";
import {
  ContextMenu,
  type ContextMenuKind,
  type ContextMenuState,
  type ContextAction,
} from "./components/ContextMenu";
import { EmptyState } from "./components/EmptyState";
import { FilterPopover, type FilterPopoverState } from "./components/FilterPopover";
import { FormulaBar } from "./components/FormulaBar";
import { HelpModal } from "./components/HelpModal";
import { SearchPanel, type SearchOptions } from "./components/SearchPanel";
import { GlideSheet } from "./components/GlideSheet";
import { columnName } from "./lib/columns";
import { SettingsModal } from "./components/SettingsModal";
import { StatusBar } from "./components/StatusBar";
import { TabBar } from "./components/TabBar";
import { TitleBar } from "./components/TitleBar";
import { Toast } from "./components/Toast";
import { Toolbar } from "./components/Toolbar";
import { parseClipboardText, clipboardTsv, normalizeRange } from "./lib/clipboard";
import { setLocale, t } from "./lib/i18n";
import { parseCellRef } from "./lib/cellref";
import { sortRows, type SortDirection } from "./lib/sort";
import { MAX_ZOOM, MIN_ZOOM, pushRecentFile, ZOOM_STEP } from "./lib/settings";
import { useDocuments, type ActiveDocumentLive, type DocumentSnapshot } from "./hooks/useDocuments";
import { useFile } from "./hooks/useFile";
import { useFilter } from "./hooks/useFilter";
import { useHistory } from "./hooks/useHistory";
import { useSelection } from "./hooks/useSelection";
import { useSettings } from "./hooks/useSettings";
import { cloneRows } from "./hooks/useSheet";
import { useSheet } from "./hooks/useSheet";
import {
  emptyView,
  MAX_GRID_ROWS,
  MAX_GRID_COLS,
  type HistoryEntry,
  type SheetView,
} from "./types/sheet";
import { calculateColumnWidths } from "./lib/columnWidth";
import {
  boundedIndexes,
  indexesBetween,
  isContiguous,
  resolveTarget,
  targetContiguous,
  targetGrid,
  targetHasContent,
  targetRanges,
  type SelectionTarget,
} from "./lib/selectionTarget";
import type { CellValue, Range, Selection, SheetMeta } from "./types/sheet";

type PendingConfirm = {
  action: () => void;
  message: string;
} | null;

type SearchHit = {
  row: number;
  col: number;
};

export default function App() {
  const sheet = useSheet();
  const selectionState = useSelection();
  const history = useHistory();
  const workspace = useDocuments();
  const { settings, update: updateSettings } = useSettings();
  const filter = useFilter();

  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [filterPopover, setFilterPopover] = useState<FilterPopoverState>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    regex: false,
    caseSensitive: false,
  });
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [searchScrollNonce, setSearchScrollNonce] = useState(0);
  const [focusCell, setFocusCell] = useState<{ row: number; col: number; nonce: number } | null>(
    null,
  );
  const resizeTransaction = useRef<{
    id: string;
    entry: HistoryEntry;
    widths: Record<number, number>;
    ending: boolean;
  } | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<number[]>([]);

  const [view, setView] = useState<SheetView>(() => ({
    ...emptyView(),
    freezeColumns: settings.freezeColumns,
  }));
  const viewRef = useRef(view);
  const selectedRowsRef = useRef(selectedRows),
    selectedColumnsRef = useRef(selectedColumns);
  selectedRowsRef.current = selectedRows;
  selectedColumnsRef.current = selectedColumns;
  const currentView = {
    ...view,
    filters: [...filter.filters].map(([c, values]): [number, string[]] => [c, [...values]]),
  };
  viewRef.current = currentView;
  const revision = useRef({
    value: 0,
    rows: sheet.rows,
    widths: sheet.colWidths,
    view,
    filters: filter.filters,
    id: workspace.activeId,
  });
  if (
    revision.current.rows !== sheet.rows ||
    revision.current.widths !== sheet.colWidths ||
    revision.current.view !== view ||
    revision.current.filters !== filter.filters ||
    revision.current.id !== workspace.activeId
  ) {
    revision.current = {
      value: revision.current.value + 1,
      rows: sheet.rows,
      widths: sheet.colWidths,
      view,
      filters: filter.filters,
      id: workspace.activeId,
    };
  }
  const revisionNumber = revision.current.value;
  useEffect(() => {
    setContextMenu(null);
    setPendingConfirm(null);
    setFilterPopover(null);
  }, [revisionNumber]);

  const rowsRef = useRef(sheet.rows);
  const metaRef = useRef(sheet.meta);
  const colWidthsRef = useRef(sheet.colWidths);
  const selectionRef = useRef(selectionState.selection);
  const rangeRef = useRef(selectionState.range);

  useEffect(() => {
    rowsRef.current = sheet.rows;
  }, [sheet.rows]);
  useEffect(() => {
    metaRef.current = sheet.meta;
    document.title = `${sheet.meta.dirty ? "● " : ""}${sheet.meta.fileName ?? t("appName")}`;
  }, [sheet.meta]);
  useEffect(() => {
    colWidthsRef.current = sheet.colWidths;
  }, [sheet.colWidths]);
  useEffect(() => {
    selectionRef.current = selectionState.selection;
  }, [selectionState.selection]);
  useEffect(() => {
    rangeRef.current = selectionState.range;
  }, [selectionState.range]);

  useEffect(() => {
    setLocale(settings.locale);
  }, [settings.locale]);

  const [systemIsDark, setSystemIsDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false,
  );
  const effectiveTheme: "light" | "dark" =
    settings.theme === "system" ? (systemIsDark ? "dark" : "light") : settings.theme;

  useEffect(() => {
    document.documentElement.dataset.theme = effectiveTheme;
  }, [effectiveTheme]);

  useEffect(() => {
    if (settings.theme !== "system") {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemIsDark(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [settings.theme]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!workspace.anyDirty && !metaRef.current.dirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [workspace.anyDirty]);

  const toastTimerRef = useRef<number | null>(null);
  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2000);
  }, []);

  const getLive = useCallback((): ActiveDocumentLive => {
    const snap = history.snapshot();
    return {
      rows: rowsRef.current,
      meta: metaRef.current,
      colWidths: colWidthsRef.current,
      selection: selectionRef.current,
      range: rangeRef.current,
      history: snap,
      view: viewRef.current,
      selectedRows: selectedRowsRef.current,
      selectedColumns: selectedColumnsRef.current,
    };
  }, [history]);

  const applyDocument = useCallback(
    (doc: DocumentSnapshot) => {
      sheet.restoreState(doc.rows, doc.meta, doc.colWidths);
      history.restore(doc.history.undo, doc.history.redo);
      if (doc.range) {
        selectionState.selectRange(doc.range);
      } else {
        selectionState.setSelection(doc.selection);
      }
      const restoredView = doc.view ?? emptyView();
      setView(restoredView);
      filter.restore(restoredView.filters);
      setSelectedRows(doc.selectedRows ?? []);
      setSelectedColumns(doc.selectedColumns ?? []);
      setContextMenu(null);
      setPendingConfirm(null);
    },
    [sheet, history, selectionState, filter],
  );

  const isBlankStarter = useCallback(() => {
    const emptyRows =
      sheet.rows.length === 0 ||
      (sheet.rows.length === 1 &&
        (sheet.rows[0]?.length ?? 0) <= 1 &&
        (sheet.rows[0]?.[0] ?? "") === "");
    return (
      workspace.documents.length === 1 &&
      !sheet.meta.dirty &&
      !sheet.meta.filePath &&
      !sheet.meta.fileName &&
      emptyRows
    );
  }, [workspace.documents.length, sheet.meta, sheet.rows]);

  const loadIntoWorkspace = useCallback(
    (rows: CellValue[][], meta: Partial<SheetMeta>) => {
      if (isBlankStarter()) {
        workspace.replaceActiveContent(rows, meta);
        sheet.loadData(rows, meta);
        history.reset();
        setView(emptyView());
        setSelectedRows([]);
        setSelectedColumns([]);
        selectionState.setSelection({ row: 0, col: 0 });
        filter.clearAll();
        return;
      }
      const doc = workspace.openDocument(rows, meta, getLive());
      applyDocument(doc);
    },
    [isBlankStarter, sheet, history, selectionState, filter, workspace, getLive, applyDocument],
  );

  const file = useFile({
    loadData: loadIntoWorkspace,
    updateMeta: (meta) => sheet.setMeta(meta),
    getRows: () => rowsRef.current,
    getMeta: () => metaRef.current,
    onToast: showToast,
    confirmDiscard: () => window.confirm(t("confirmUnsaved")),
    onRecentPath: (path) => {
      updateSettings((current) => ({
        recentFiles: pushRecentFile(current.recentFiles, path),
      }));
    },
  });

  const newFile = useCallback(() => {
    if (isBlankStarter()) {
      sheet.loadData([[""]], { fileName: undefined, format: "csv", delimiter: "," });
      history.reset();
      setView(emptyView());
      setSelectedRows([]);
      setSelectedColumns([]);
      selectionState.setSelection({ row: 0, col: 0 });
      filter.clearAll();
      return;
    }
    const doc = workspace.addBlankDocument(getLive());
    applyDocument(doc);
  }, [isBlankStarter, sheet, history, selectionState, filter, workspace, getLive, applyDocument]);

  const switchTab = useCallback(
    (id: string) => {
      const doc = workspace.switchTo(id, getLive());
      if (doc) {
        applyDocument(doc);
      }
    },
    [workspace, getLive, applyDocument],
  );

  const closeTab = useCallback(
    (id: string) => {
      const target = workspace.documents.find((doc) => doc.id === id);
      if (!target) {
        return;
      }
      const dirty = id === workspace.activeId ? sheet.meta.dirty : target.meta.dirty;
      if (dirty && !window.confirm(t("confirmCloseTab"))) {
        return;
      }
      const result = workspace.closeDocument(id, getLive());
      if (result.closed && result.next) {
        applyDocument(result.next);
      }
    },
    [workspace, sheet.meta.dirty, getLive, applyDocument],
  );

  const visibleRows = useMemo(
    () =>
      filter.getVisibleRows(sheet.rows).filter((row) => !view.hiddenRows.includes(row.sourceIndex)),
    [filter, sheet.rows, view.hiddenRows],
  );
  const displayRows = useMemo(() => visibleRows.map((row) => row.values), [visibleRows]);
  const rowSourceIndexes = useMemo(() => visibleRows.map((row) => row.sourceIndex), [visibleRows]);
  const columnSourceIndexes = useMemo(
    () =>
      indexesBetween(0, sheet.columnCount - 1, sheet.columnCount).filter(
        (c) => !view.hiddenColumns.includes(c),
      ),
    [sheet.columnCount, view.hiddenColumns],
  );

  const searchHits = useMemo(
    () => findSearchHits(sheet.rows, query, searchOptions),
    [sheet.rows, query, searchOptions],
  );
  const searchHitSet = useMemo(
    () => new Set(searchHits.map((hit) => `${hit.row}:${hit.col}`)),
    [searchHits],
  );
  const activeSearchHit = searchHits[activeSearchIndex]
    ? `${searchHits[activeSearchIndex].row}:${searchHits[activeSearchIndex].col}`
    : null;

  useEffect(() => {
    if (activeSearchIndex >= searchHits.length) {
      setActiveSearchIndex(0);
      setSearchScrollNonce((nonce) => nonce + 1);
    }
  }, [activeSearchIndex, searchHits.length]);

  useEffect(() => {
    setSearchScrollNonce((nonce) => nonce + 1);
  }, [query, searchOptions]);

  const currentValue =
    sheet.rows[selectionState.selection.row]?.[selectionState.selection.col] ?? "";
  const selectedReference = referenceForSelection(selectionState.selection, selectionState.range);

  const snapshot = (): HistoryEntry => ({
    rows: sheet.rows,
    selection: selectionState.selection,
    range: selectionState.range,
    selectedRows,
    selectedColumns,
    colWidths: sheet.colWidths,
    view: currentView,
  });
  const recordBeforeChange = () => history.record(sheet.rows, selectionState.selection, snapshot());
  const replaceRowsFromHistory = (entry: HistoryEntry) => {
    const dataChanged = JSON.stringify(entry.rows) !== JSON.stringify(sheet.rows);
    sheet.restoreState(
      entry.rows,
      { ...sheet.meta, dirty: dataChanged || sheet.meta.dirty },
      entry.colWidths ?? sheet.colWidths,
    );
    if (entry.range) selectionState.selectRange(entry.range);
    else selectionState.setSelection(entry.selection);
    setSelectedRows(entry.selectedRows ?? []);
    setSelectedColumns(entry.selectedColumns ?? []);
    if (entry.view) {
      setView(entry.view);
      filter.restore(entry.view.filters);
    }
  };
  const commitCell = (row: number, col: number, value: string, reselect: boolean) => {
    if ((sheet.rows[row]?.[col] ?? "") !== value) {
      recordBeforeChange();
      sheet.updateCell(row, col, value);
    }
    if (reselect) {
      selectionState.selectCell(row, col, false);
      setSelectedRows([]);
      setSelectedColumns([]);
    }
  };
  const editCell = (row: number, col: number, value: string) => commitCell(row, col, value, false);
  const liveTarget = (context?: { kind: ContextMenuKind; row: number; col: number }) =>
    resolveTarget({
      selection: selectionState.selection,
      range: selectionState.range,
      selectedRows,
      selectedColumns,
      rowCount: sheet.rows.length,
      columnCount: sheet.columnCount,
      visibleRows: rowSourceIndexes,
      visibleColumns: columnSourceIndexes,
      filtered: filter.hasFilters,
      context,
    });
  const validSnapshot = (id: string, rev: number) =>
    revision.current.id === id && revision.current.value === rev;
  const actionTarget = () => contextMenu?.target ?? liveTarget();
  const guardMenu = () => {
    if (contextMenu && !validSnapshot(contextMenu.documentId, contextMenu.revision)) {
      showToast(t("staleTarget"));
      return false;
    }
    return true;
  };
  const openContextMenu = (
    kind: ContextMenuKind,
    row: number,
    col: number,
    x: number,
    y: number,
  ) => {
    const target = liveTarget({ kind, row, col });
    if (target.kind === "row") {
      setSelectedRows(target.rowTargets.length ? target.rowTargets : [row]);
      setSelectedColumns([]);
      if (!selectedRows.includes(row))
        selectionState.selectRow(target.anchor.row, sheet.columnCount);
    } else if (target.kind === "column") {
      setSelectedColumns(target.columnTargets.length ? target.columnTargets : [col]);
      setSelectedRows([]);
      if (!selectedColumns.includes(col))
        selectionState.selectColumn(target.anchor.col, sheet.rows.length);
    } else {
      setSelectedRows([]);
      setSelectedColumns([]);
      const inside =
        selectionState.range &&
        row >= Math.min(selectionState.range.startRow, selectionState.range.endRow) &&
        row <= Math.max(selectionState.range.startRow, selectionState.range.endRow) &&
        col >= Math.min(selectionState.range.startCol, selectionState.range.endCol) &&
        col <= Math.max(selectionState.range.startCol, selectionState.range.endCol);
      if (!inside) selectionState.selectCell(row, col, false);
    }
    setContextMenu({
      kind: target.kind,
      row,
      col,
      x,
      y,
      target,
      documentId: workspace.activeId,
      revision: revision.current.value,
    });
  };
  const copySelection = async (target = actionTarget()) => {
    if (!guardMenu() || !target.rows.length || !target.columns.length) return false;
    if (!navigator.clipboard) {
      showToast(t("toastClipboardUnavailable"));
      return false;
    }
    try {
      await navigator.clipboard.writeText(clipboardTsv(targetGrid(sheet.rows, target)));
      showToast(t("toastCopiedRange", { rows: target.rows.length, cols: target.columns.length }));
      return true;
    } catch {
      showToast(t("toastClipboardUnavailable"));
      return false;
    }
  };
  const contentReason = (target: SelectionTarget) =>
    !target.rows.length || !target.columns.length
      ? t("virtualTarget")
      : filter.hasFilters
        ? t("filteredEdit")
        : undefined;
  const clearSelectedCells = (target = actionTarget()) => {
    const reason = contentReason(target);
    if (!guardMenu() || reason) {
      if (reason) showToast(reason);
      return;
    }
    if (!targetHasContent(sheet.rows, target)) return;
    recordBeforeChange();
    sheet.clearTargets(target.rows, target.columns);
  };
  const cutSelection = async (target = actionTarget()) => {
    const reason = contentReason(target);
    if (reason || !guardMenu()) {
      if (reason) showToast(reason);
      return;
    }
    const id = workspace.activeId,
      rev = revision.current.value;
    if (await copySelection(target)) {
      if (!validSnapshot(id, rev)) {
        showToast(t("staleTarget"));
        return;
      }
      clearSelectedCells(target);
    }
  };
  // Only the immediate append row/column may expand the model. The distant
  // canvas baseline is navigation space, not a request to allocate skipped cells.
  const pasteAnchorReason = (row: number, col: number) =>
    row < 0 || col < 0 || row > sheet.rows.length || col > sheet.columnCount
      ? t("boundedPaste")
      : undefined;
  const pasteReason = (target: SelectionTarget) =>
    filter.hasFilters
      ? t("filteredEdit")
      : !targetContiguous(target)
        ? t("contiguousRequired")
        : pasteAnchorReason(target.anchor.row, target.anchor.col);
  const pasteGrid = (row: number, col: number, grid: CellValue[][], target = actionTarget()) => {
    const reason = pasteReason(target) ?? pasteAnchorReason(row, col);
    if (!guardMenu() || reason) {
      if (reason) showToast(reason);
      return;
    }
    const height = grid.length,
      width = grid.reduce((max, r) => Math.max(max, r.length), 0);
    if (!height || !width) return;
    if (row + height > MAX_GRID_ROWS || col + width > MAX_GRID_COLS) {
      showToast(t("boundedPaste"));
      return;
    }
    if (
      view.hiddenRows.some((i) => i >= row && i < row + height) ||
      view.hiddenColumns.some((i) => i >= col && i < col + width)
    ) {
      showToast(t("hiddenPaste"));
      return;
    }
    const shapeChanged =
      row + height > sheet.rows.length ||
      grid.some((_, ri) => col + width > (sheet.rows[row + ri]?.length ?? 0));
    if (
      !shapeChanged &&
      !grid.some((r, ri) =>
        r.some((value, ci) => (sheet.rows[row + ri]?.[col + ci] ?? "") !== value),
      )
    )
      return;
    recordBeforeChange();
    const pasted = sheet.pasteGrid(row, col, grid);
    selectionState.selectRange(pasted);
    setSelectedRows([]);
    setSelectedColumns([]);
  };
  const pasteClipboard = async (target = actionTarget()) => {
    const reason = pasteReason(target);
    if (!guardMenu() || reason) {
      if (reason) showToast(reason);
      return;
    }
    if (!navigator.clipboard) {
      showToast(t("toastClipboardUnavailable"));
      return;
    }
    const id = workspace.activeId,
      rev = revision.current.value;
    try {
      const text = await navigator.clipboard.readText();
      if (!validSnapshot(id, rev)) {
        showToast(t("staleTarget"));
        return;
      }
      pasteGrid(target.anchor.row, target.anchor.col, parseClipboardText(text), target);
    } catch {
      showToast(t("toastClipboardUnavailable"));
    }
  };
  const axisIndexes = (axis: "row" | "column", target: SelectionTarget) =>
    axis === "row"
      ? target.kind === "row"
        ? target.rowTargets
        : boundedIndexes([target.anchor.row], sheet.rows.length)
      : target.kind === "column"
        ? target.columnTargets
        : boundedIndexes([target.anchor.col], sheet.columnCount);
  const structuralReason = (indexes: number[], insertion = false) =>
    filter.hasFilters
      ? t("filteredEdit")
      : !indexes.length && !insertion
        ? t("virtualTarget")
        : undefined;
  const visibleSelection = (
    proposed: Selection,
    nextView: SheetView,
    rowCount = sheet.rows.length,
    columnCount = sheet.columnCount,
  ): Selection => {
    const filteredRows = filter.hasFilters
      ? new Set(filter.getVisibleRows(sheet.rows).map((row) => row.sourceIndex))
      : null;
    const choose = (
      index: number,
      count: number,
      hidden: number[],
      allowed?: Set<number> | null,
    ) => {
      const hiddenSet = new Set(hidden);
      const visible = (i: number) => !hiddenSet.has(i) && (!allowed || allowed.has(i));
      if (index >= count || visible(index)) return index;
      for (let i = 0; i < count; i += 1) if (visible(i)) return i;
      // All hidden: select the first blank append cell, never hidden data.
      return count;
    };
    return {
      row: choose(proposed.row, rowCount, nextView.hiddenRows, filteredRows),
      col: choose(proposed.col, columnCount, nextView.hiddenColumns),
    };
  };
  const remapState = (axis: "row" | "column", order: number[], selected: number[]) => {
    const mapping = new Map<number, number>();
    order.forEach((old, index) => {
      if (old >= 0 && !mapping.has(old)) mapping.set(old, index);
    });
    const remap = (items: number[]) =>
      items.flatMap((i) => (mapping.has(i) ? [mapping.get(i)!] : []));
    const nextView = {
      ...currentView,
      hiddenRows: axis === "row" ? remap(view.hiddenRows) : view.hiddenRows,
      hiddenColumns: axis === "column" ? remap(view.hiddenColumns) : view.hiddenColumns,
    };
    if (axis === "column") {
      // Structural edits with active filters are blocked; empty filter indices cannot drift.
      nextView.freezeColumns = Math.max(
        0,
        ...order.map((old, i) => (old >= 0 && old < view.freezeColumns ? i + 1 : 0)),
      );
    }
    setView(nextView);
    const nextSelection = {
      ...selectionState.selection,
      ...(axis === "row" && selectedRows.length
        ? { col: selectionState.range?.startCol ?? 0 }
        : {}),
      ...(axis === "column" && selectedColumns.length
        ? { row: selectionState.range?.startRow ?? 0 }
        : {}),
      [axis === "row" ? "row" : "col"]:
        selected[0] ??
        Math.min(
          mapping.get(
            axis === "row" ? selectionState.selection.row : selectionState.selection.col,
          ) ?? 0,
          Math.max(0, order.length - 1),
        ),
    };
    selectionState.setSelection(
      visibleSelection(
        nextSelection,
        nextView,
        axis === "row" ? Math.max(1, order.length) : sheet.rows.length,
        axis === "column" ? Math.max(1, order.length) : sheet.columnCount,
      ),
    );
    setSelectedRows(axis === "row" ? selected : remapOther(selectedRows, sheet.rows.length));
    setSelectedColumns(
      axis === "column" ? selected : remapOther(selectedColumns, sheet.columnCount),
    );
  };
  const insertAxis = (axis: "row" | "column", offset: 0 | 1) => {
    if (!guardMenu()) return;
    const target = actionTarget(),
      indexes = axisIndexes(axis, target),
      reason = structuralReason(indexes, true);
    if (reason) {
      showToast(reason);
      return;
    }
    const size = axis === "row" ? sheet.rows.length : sheet.columnCount;
    const count = Math.max(1, indexes.length);
    const base = indexes.length
      ? offset
        ? indexes[indexes.length - 1]! + 1
        : indexes[0]!
      : Math.min(size, axis === "row" ? target.anchor.row : target.anchor.col);
    const order = indexesBetween(0, size - 1, size);
    order.splice(base, 0, ...Array<number>(count).fill(-1));
    recordBeforeChange();
    if (axis === "row") sheet.insertRows(base, count);
    else sheet.insertColumns(base, count);
    remapState(axis, order, indexesBetween(base, base + count - 1, size + count));
  };
  const insertRow = (offset: 0 | 1) => insertAxis("row", offset);
  const insertColumn = (offset: 0 | 1) => insertAxis("column", offset);
  const deleteAxisWithConfirm = (axis: "row" | "column") => {
    if (!guardMenu()) return;
    const indexes = axisIndexes(axis, actionTarget()),
      reason = structuralReason(indexes);
    if (reason) {
      showToast(reason);
      return;
    }
    const id = workspace.activeId,
      rev = revision.current.value;
    setPendingConfirm({
      message: t("confirmTargets", {
        count: indexes.length,
        ranges: targetRanges(indexes, axis === "column"),
      }),
      action: () => {
        if (!validSnapshot(id, rev)) {
          showToast(t("staleTarget"));
          return;
        }
        const size = axis === "row" ? sheet.rows.length : sheet.columnCount;
        const remove = new Set(indexes),
          order = indexesBetween(0, size - 1, size).filter((i) => !remove.has(i));
        recordBeforeChange();
        if (axis === "row") sheet.deleteRows(indexes);
        else sheet.deleteColumns(indexes);
        remapState(axis, order, []);
      },
    });
  };
  const deleteRowWithConfirm = () => deleteAxisWithConfirm("row");
  const deleteColumnWithConfirm = () => deleteAxisWithConfirm("column");
  const duplicateAxis = (axis: "row" | "column") => {
    if (!guardMenu()) return;
    const indexes = axisIndexes(axis, actionTarget()),
      reason = structuralReason(indexes);
    if (reason) {
      showToast(reason);
      return;
    }
    const size = axis === "row" ? sheet.rows.length : sheet.columnCount,
      base = indexes[indexes.length - 1]! + 1;
    const order = indexesBetween(0, size - 1, size);
    order.splice(base, 0, ...Array<number>(indexes.length).fill(-1));
    recordBeforeChange();
    sheet.duplicateTargets(axis, indexes);
    remapState(axis, order, indexesBetween(base, base + indexes.length - 1, size + indexes.length));
  };
  const moveReason = (axis: "row" | "column", indexes: number[], delta: -1 | 1) => {
    const structural = structuralReason(indexes);
    if (structural) return structural;
    if (!isContiguous(indexes)) return t("contiguousRequired");
    const first = indexes[0]!,
      last = indexes[indexes.length - 1]!,
      size = axis === "row" ? sheet.rows.length : sheet.columnCount;
    if (first + delta < 0 || last + delta >= size) return t("boundaryMove");
    if (
      axis === "column" &&
      view.freezeColumns > Math.min(first, first + delta) &&
      view.freezeColumns <= Math.max(last, last + delta)
    )
      return t("frozenMove");
    return undefined;
  };
  const moveAxis = (axis: "row" | "column", delta: -1 | 1) => {
    if (!guardMenu()) return;
    const indexes = axisIndexes(axis, actionTarget()),
      reason = moveReason(axis, indexes, delta);
    if (reason) {
      showToast(reason);
      return;
    }
    const size = axis === "row" ? sheet.rows.length : sheet.columnCount,
      order = indexesBetween(0, size - 1, size);
    const block = order.splice(indexes[0]!, indexes.length);
    order.splice(indexes[0]! + delta, 0, ...block);
    recordBeforeChange();
    sheet.moveTargets(axis, indexes, delta);
    remapState(
      axis,
      order,
      indexes.map((i) => i + delta),
    );
  };
  const changeVisibility = (axis: "row" | "column", hide: boolean, indexes: number[]) => {
    if (!guardMenu()) return;
    const key = axis === "row" ? "hiddenRows" : "hiddenColumns";
    const changed = hide
      ? boundedIndexes(
          [...view[key], ...indexes],
          axis === "row" ? sheet.rows.length : sheet.columnCount,
        )
      : view[key].filter((i) => !indexes.includes(i));
    if (JSON.stringify(changed) === JSON.stringify(view[key])) return;
    recordBeforeChange();
    const nextView = { ...currentView, [key]: changed };
    setView(nextView);
    setSelectedRows([]);
    setSelectedColumns([]);
    selectionState.setSelection(visibleSelection({ row: 0, col: 0 }, nextView));
  };
  const showAll = () => {
    if (!guardMenu()) return;
    if (!view.hiddenRows.length && !view.hiddenColumns.length) return;
    recordBeforeChange();
    setView({ ...currentView, hiddenRows: [], hiddenColumns: [] });
  };
  const resizeColumns = (indexes: number[], width?: number) => {
    if (!guardMenu() || !indexes.length) return;
    const fitted = calculateColumnWidths(sheet.rows),
      widths = { ...sheet.colWidths };
    indexes.forEach((i) => {
      widths[i] =
        width === undefined ? (fitted[i] ?? 120) : Math.max(48, Math.min(720, Math.round(width)));
    });
    if (indexes.every((i) => (sheet.colWidths[i] ?? 120) === widths[i])) return;
    recordBeforeChange();
    sheet.setColWidths(widths);
  };
  const startColumnResize = () => {
    if (resizeTransaction.current) return;
    resizeTransaction.current = {
      id: workspace.activeId,
      entry: snapshot(),
      widths: { ...sheet.colWidths },
      ending: false,
    };
  };
  const dragColumnResize = (col: number, width: number) => {
    const transaction = resizeTransaction.current;
    if (!transaction) {
      resizeColumns([col], width);
      return;
    }
    if (transaction.id !== workspace.activeId) {
      resizeTransaction.current = null;
      return;
    }
    transaction.widths[col] = Math.max(48, Math.min(720, Math.round(width)));
    sheet.setColWidths({ ...transaction.widths });
  };
  const endColumnResize = (col: number, width: number) => {
    const transaction = resizeTransaction.current;
    if (!transaction) return;
    dragColumnResize(col, width);
    if (transaction.ending) return;
    transaction.ending = true;
    // Glide emits the selected-column callbacks synchronously in one mouseup.
    queueMicrotask(() => {
      if (resizeTransaction.current !== transaction) return;
      resizeTransaction.current = null;
      if (revision.current.id !== transaction.id) return;
      if (
        Object.entries(transaction.widths).some(
          ([key, value]) => value !== (transaction.entry.colWidths?.[Number(key)] ?? 120),
        )
      ) {
        history.record(transaction.entry.rows, transaction.entry.selection, transaction.entry);
      }
    });
  };
  const applySort = (col: number, direction: SortDirection) => {
    if (!guardMenu()) return;
    const sorted = sortRows(sheet.rows, col, direction, { headerRow: settings.useHeaderRow });
    if (JSON.stringify(sorted) === JSON.stringify(sheet.rows)) return;
    // Stable per-value queues preserve duplicate row identity in linear time
    // after sorting, without repeated full-row searches or array splices.
    const available = new Map<string, { indexes: number[]; next: number }>();
    sheet.rows.forEach((row, index) => {
      const key = JSON.stringify(row);
      const bucket = available.get(key) ?? { indexes: [], next: 0 };
      bucket.indexes.push(index);
      available.set(key, bucket);
    });
    const order = sorted.map((row) => {
      const bucket = available.get(JSON.stringify(row))!;
      return bucket.indexes[bucket.next++]!;
    });
    recordBeforeChange();
    sheet.replaceRows(sorted, true, false);
    remapState("row", order, []);
  };
  const runUndo = () => {
    const previous = history.undo(snapshot());
    if (previous) replaceRowsFromHistory(previous);
  };
  const runRedo = () => {
    const next = history.redo(snapshot());
    if (next) replaceRowsFromHistory(next);
  };

  const prepareNavigation = (row: number, col: number, endRow = row, endCol = col) => {
    if (
      filter.hasFilters &&
      !filter.getVisibleRows(sheet.rows).some((r) => r.sourceIndex === row)
    ) {
      showToast(t("filteredEdit"));
      return false;
    }
    const nextView = {
      ...currentView,
      hiddenRows: view.hiddenRows.filter((r) => r < row || r > endRow),
      hiddenColumns: view.hiddenColumns.filter((c) => c < col || c > endCol),
    };
    if (
      nextView.hiddenRows.length !== view.hiddenRows.length ||
      nextView.hiddenColumns.length !== view.hiddenColumns.length
    ) {
      recordBeforeChange();
      setView(nextView);
    }
    setSelectedRows([]);
    setSelectedColumns([]);
    return true;
  };
  const jumpSearch = (direction: 1 | -1) => {
    if (searchHits.length === 0) {
      return;
    }
    const nextIndex = (activeSearchIndex + direction + searchHits.length) % searchHits.length;
    const hit = searchHits[nextIndex];
    if (!prepareNavigation(hit.row, hit.col)) return;
    setActiveSearchIndex(nextIndex);
    setSearchScrollNonce((nonce) => nonce + 1);
    selectionState.selectCell(hit.row, hit.col, false);
  };

  const replaceCurrent = () => {
    const hit = searchHits[activeSearchIndex];
    if (!hit) {
      return;
    }
    const matcher = buildMatcher(query, searchOptions);
    if (!matcher) {
      return;
    }
    const singleShot = new RegExp(matcher.source, matcher.flags.replace("g", ""));
    const previous = sheet.rows[hit.row]?.[hit.col] ?? "";
    const replaced = previous.replace(singleShot, () => replacement);
    if (replaced === previous) {
      return;
    }
    recordBeforeChange();
    const next = cloneRows(sheet.rows);
    next[hit.row][hit.col] = replaced;
    sheet.replaceRows(next, true, false);
    setSearchScrollNonce((nonce) => nonce + 1);
  };

  const replaceAll = () => {
    const matcher = buildMatcher(query, searchOptions);
    if (!matcher) {
      return;
    }
    let count = 0;
    const next = sheet.rows.map((row) =>
      row.map((cell) =>
        cell.replace(matcher, () => {
          count += 1;
          return replacement;
        }),
      ),
    );
    if (count === 0) {
      showToast(t("toastSearchDone", { count }));
      return;
    }
    recordBeforeChange();
    sheet.replaceRows(next, true, false);
    showToast(t("toastSearchDone", { count }));
  };

  const handleJump = (ref: ReturnType<typeof parseCellRef>) => {
    if (!ref) {
      return;
    }
    if (ref.kind === "cell") {
      if (!prepareNavigation(ref.row, ref.col)) return;
      selectionState.selectCell(ref.row, ref.col, false);
      setFocusCell({ row: ref.row, col: ref.col, nonce: Date.now() });
      return;
    }
    if (!prepareNavigation(ref.startRow, ref.startCol, ref.endRow, ref.endCol)) return;
    selectionState.selectRange({
      startRow: ref.startRow,
      startCol: ref.startCol,
      endRow: ref.endRow,
      endCol: ref.endCol,
    });
    setFocusCell({ row: ref.startRow, col: ref.startCol, nonce: Date.now() });
  };

  const adjustZoom = (delta: number) => {
    const next = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, Math.round((settings.zoom + delta) * 10) / 10),
    );
    updateSettings({ zoom: next });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const target = event.target;
    const editingText =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable);

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "o") {
      event.preventDefault();
      void file.openFile();
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void file.saveFile();
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
      event.preventDefault();
      setSearchOpen(true);
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "h") {
      event.preventDefault();
      setSearchOpen(true);
    } else if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "z" &&
      !event.shiftKey &&
      !editingText
    ) {
      event.preventDefault();
      runUndo();
    } else if (
      !editingText &&
      (((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "z"))
    ) {
      event.preventDefault();
      runRedo();
    } else if (
      !editingText &&
      (event.ctrlKey || event.metaKey) &&
      (event.key === "=" || event.key === "+")
    ) {
      event.preventDefault();
      adjustZoom(ZOOM_STEP);
    } else if (!editingText && (event.ctrlKey || event.metaKey) && event.key === "-") {
      event.preventDefault();
      adjustZoom(-ZOOM_STEP);
    } else if (!editingText && (event.ctrlKey || event.metaKey) && event.key === "0") {
      event.preventDefault();
      updateSettings({ zoom: 1 });
    } else if (!editingText && event.key === "Escape") {
      if (settingsOpen) {
        setSettingsOpen(false);
        return;
      }
      if (helpOpen) {
        setHelpOpen(false);
        return;
      }
      if (pendingConfirm) {
        setPendingConfirm(null);
        return;
      }
      setSearchOpen(false);
      setContextMenu(null);
      setFilterPopover(null);
    }
  };

  const hasData = sheet.rows.length > 0;
  const columnFilterSelected = filterPopover
    ? (filter.filters.get(filterPopover.col) ?? null)
    : null;

  const menuTarget = contextMenu?.target;
  const menuCount = menuTarget
    ? menuTarget.kind === "row"
      ? menuTarget.rowTargets.length
      : menuTarget.kind === "column"
        ? menuTarget.columnTargets.length
        : menuTarget.rows.length * menuTarget.columns.length
    : 0;
  const menuHeading =
    menuTarget?.kind === "row"
      ? t("selectionRows", { count: menuCount })
      : menuTarget?.kind === "column"
        ? t("selectionColumns", { count: menuCount })
        : t("selectionCells", {
            rows: menuTarget?.rows.length ?? 0,
            cols: menuTarget?.columns.length ?? 0,
          });
  const menuDetail = menuTarget
    ? t("targetDetail", {
        rows: targetRanges(menuTarget.rows) || "—",
        cols: targetRanges(menuTarget.columns, true) || "—",
      })
    : "";
  const menuItems: ContextAction[] = [];
  if (menuTarget) {
    const add = (label: string, action: () => void, reason?: string, count = menuCount) =>
      menuItems.push({ label: t("targetCount", { action: label, count }), action, reason });
    add(t("cut"), () => void cutSelection(menuTarget), contentReason(menuTarget));
    add(
      t("copy"),
      () => void copySelection(menuTarget),
      !menuTarget.rows.length || !menuTarget.columns.length ? t("virtualTarget") : undefined,
    );
    add(t("paste"), () => void pasteClipboard(menuTarget), pasteReason(menuTarget));
    add(t("clearCells"), () => clearSelectedCells(menuTarget), contentReason(menuTarget));
    const axis = menuTarget.kind === "column" ? "column" : "row";
    const indexes = axisIndexes(axis, menuTarget),
      reason = structuralReason(indexes);
    add(
      t(axis === "row" ? "insertRowAbove" : "insertColLeft"),
      () => insertAxis(axis, 0),
      structuralReason(indexes, true),
      Math.max(1, indexes.length),
    );
    add(
      t(axis === "row" ? "insertRowBelow" : "insertColRight"),
      () => insertAxis(axis, 1),
      structuralReason(indexes, true),
      Math.max(1, indexes.length),
    );
    add(
      t(axis === "row" ? "deleteRow" : "deleteCol"),
      () => deleteAxisWithConfirm(axis),
      reason,
      indexes.length,
    );
    add(t("duplicateTargets"), () => duplicateAxis(axis), reason, indexes.length);
    add(t("moveBefore"), () => moveAxis(axis, -1), moveReason(axis, indexes, -1), indexes.length);
    add(t("moveAfter"), () => moveAxis(axis, 1), moveReason(axis, indexes, 1), indexes.length);
    add(
      t("hideTargets"),
      () => changeVisibility(axis, true, indexes),
      !indexes.length ? t("virtualTarget") : undefined,
      indexes.length,
    );
    if (view.hiddenRows.length || view.hiddenColumns.length)
      menuItems.push({ label: t("showAll"), action: showAll });
    if (menuTarget.kind === "column" && contextMenu) {
      const col = contextMenu.col,
        width = sheet.colWidths[col] ?? 120;
      add(
        t("recalculateColumn"),
        () => resizeColumns(indexes),
        !indexes.length ? t("virtualTarget") : undefined,
      );
      add(
        t("matchWidth", { width }),
        () => resizeColumns(indexes, width),
        !indexes.length ? t("virtualTarget") : undefined,
      );
      menuItems.push(
        {
          label: t("sortAsc"),
          action: () => applySort(col, "asc"),
          reason: !indexes.length ? t("virtualTarget") : undefined,
        },
        {
          label: t("sortDesc"),
          action: () => applySort(col, "desc"),
          reason: !indexes.length ? t("virtualTarget") : undefined,
        },
      );
      menuItems.push({
        label: filter.filters.has(col) ? t("filterClear") : t("filter"),
        action: () => {
          if (!guardMenu()) return;
          if (filter.filters.has(col)) filter.setColumnFilter(col, null);
          else setFilterPopover({ col, x: contextMenu.x, y: contextMenu.y });
        },
        reason: !indexes.length ? t("virtualTarget") : undefined,
      });
      menuItems.push(
        {
          label: t("freezeToHere"),
          action: () => {
            if (guardMenu()) setView({ ...currentView, freezeColumns: col + 1 });
          },
          reason: !indexes.length ? t("virtualTarget") : undefined,
        },
        {
          label: t("unfreeze"),
          action: () => {
            if (guardMenu()) setView({ ...currentView, freezeColumns: 0 });
          },
        },
      );
    }
  }

  return (
    <div className="appShell" onKeyDown={handleKeyDown}>
      <TitleBar meta={sheet.meta} />
      <TabBar
        documents={workspace.documents}
        activeId={workspace.activeId}
        onSelect={switchTab}
        onClose={closeTab}
        onNew={newFile}
      />
      <Toolbar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onNew={newFile}
        onOpen={() => void file.openFile()}
        onSave={() => void file.saveFile()}
        onSaveAs={() => void file.saveAs()}
        onSearch={() => setSearchOpen(true)}
        onUndo={runUndo}
        onRedo={runRedo}
        onInsertRow={() => insertRow(1)}
        onInsertColumn={() => insertColumn(1)}
        onDeleteRow={deleteRowWithConfirm}
        onDeleteColumn={deleteColumnWithConfirm}
        onAutoFit={() => {
          resizeColumns(
            selectedColumns.length
              ? boundedIndexes(selectedColumns, sheet.columnCount)
              : columnSourceIndexes,
          );
          showToast(t("toastAutoFit"));
        }}
        onAiCopy={() => void copySelection()}
        onSettings={() => setSettingsOpen(true)}
        onHelp={() => setHelpOpen(true)}
      />
      <SearchPanel
        open={searchOpen}
        query={query}
        replacement={replacement}
        options={searchOptions}
        current={activeSearchIndex}
        total={searchHits.length}
        onQueryChange={setQuery}
        onReplacementChange={setReplacement}
        onOptionsChange={setSearchOptions}
        onNext={() => jumpSearch(1)}
        onPrevious={() => jumpSearch(-1)}
        onReplace={replaceCurrent}
        onReplaceAll={replaceAll}
        onClose={() => setSearchOpen(false)}
      />
      {hasData ? (
        <>
          <FormulaBar
            row={selectionState.selection.row}
            col={selectionState.selection.col}
            reference={selectedReference}
            value={currentValue}
            onCommit={(row, col, value, reselect) => commitCell(row, col, value, reselect)}
            onJump={handleJump}
          />
          {(view.hiddenRows.length > 0 || view.hiddenColumns.length > 0) && (
            <div className="visibilityBar" aria-label={t("showAll")}>
              <button onClick={showAll}>{t("showAll")}</button>
              {hiddenGroups(view.hiddenRows).map((group) => (
                <button key={`r${group[0]}`} onClick={() => changeVisibility("row", false, group)}>
                  {t("revealRows", { ranges: targetRanges(group) })}
                </button>
              ))}
              {hiddenGroups(view.hiddenColumns).map((group) => (
                <button
                  key={`c${group[0]}`}
                  onClick={() => changeVisibility("column", false, group)}
                >
                  {t("revealColumns", { ranges: targetRanges(group, true) })}
                </button>
              ))}
            </div>
          )}
          <GlideSheet
            rows={displayRows}
            rowSourceIndexes={rowSourceIndexes}
            sourceRowCount={sheet.rows.length}
            columnSourceIndexes={columnSourceIndexes}
            selectedRows={selectedRows}
            selectedColumns={selectedColumns}
            hiddenRows={view.hiddenRows}
            hiddenColumns={view.hiddenColumns}
            onReveal={(axis, indexes) => changeVisibility(axis, false, indexes)}
            columnCount={sheet.columnCount}
            colWidths={sheet.colWidths}
            selection={selectionState.selection}
            range={selectionState.range}
            searchHits={searchHitSet}
            activeSearchHit={activeSearchHit}
            scrollNonce={searchScrollNonce}
            focusCell={focusCell}
            theme={effectiveTheme}
            zebra={settings.zebra}
            headerHighlight={settings.headerHighlight}
            freezeColumns={columnSourceIndexes.filter((c) => c < view.freezeColumns).length}
            zoom={settings.zoom}
            onEdit={editCell}
            onColumnResize={dragColumnResize}
            onColumnResizeStart={startColumnResize}
            onColumnResizeEnd={endColumnResize}
            onSelectionChange={(sel, range) => {
              if (range) {
                selectionState.selectRange(range);
              } else {
                selectionState.selectCell(sel.row, sel.col, false);
              }
            }}
            onRowsSelected={setSelectedRows}
            onColumnsSelected={setSelectedColumns}
            onPasteGrid={(startRow, startCol, grid) =>
              pasteGrid(startRow, startCol, grid, liveTarget())
            }
            onFill={(updates) => {
              if (updates.length === 0) {
                return;
              }
              recordBeforeChange();
              const next = cloneRows(sheet.rows);
              let maxRow = next.length;
              let maxCol = sheet.columnCount;
              for (const update of updates) {
                maxRow = Math.max(maxRow, update.row + 1);
                maxCol = Math.max(maxCol, update.col + 1);
              }
              while (next.length < maxRow) {
                next.push(Array.from({ length: maxCol }, () => ""));
              }
              for (const row of next) {
                while (row.length < maxCol) {
                  row.push("");
                }
              }
              for (const update of updates) {
                next[update.row]![update.col] = update.value;
              }
              sheet.replaceRows(next, true, false);
            }}
            onCut={() => void cutSelection()}
            onCopy={() => void copySelection()}
            onPaste={() => void pasteClipboard()}
            onClear={() => clearSelectedCells()}
            onOpenContextMenu={openContextMenu}
            onHeaderMenuClick={(col, bounds) => {
              openContextMenu("column", 0, col, bounds.x, bounds.y + bounds.height);
            }}
          />
        </>
      ) : (
        <EmptyState
          onNew={newFile}
          onOpen={() => void file.openFile()}
          onSample={() => void file.loadSample()}
          recentFiles={settings.recentFiles}
          onOpenRecent={(path) => void file.loadPath(path)}
        />
      )}
      <StatusBar
        rows={sheet.rows}
        columnCount={sheet.columnCount}
        selection={selectionState.selection}
        range={selectionState.range}
        meta={sheet.meta}
        zoom={settings.zoom}
      />
      <ContextMenu
        state={contextMenu}
        heading={menuHeading}
        detail={menuDetail}
        items={menuItems}
        onClose={() => setContextMenu(null)}
      />
      <FilterPopover
        state={filterPopover}
        rows={sheet.rows}
        selected={columnFilterSelected}
        onApply={(col, allowed) => filter.setColumnFilter(col, allowed)}
        onClose={() => setFilterPopover(null)}
      />
      <ConfirmDialog
        open={pendingConfirm !== null}
        message={pendingConfirm?.message}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => {
          pendingConfirm?.action();
          setPendingConfirm(null);
        }}
      />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <SettingsModal
        open={settingsOpen}
        encoding={sheet.meta.encoding}
        newline={sheet.meta.newline}
        zebra={settings.zebra}
        headerHighlight={settings.headerHighlight}
        csvFormulaGuard={sheet.meta.csvFormulaGuard}
        omitEmptyCells={sheet.meta.omitEmptyCells}
        theme={settings.theme}
        useHeaderRow={settings.useHeaderRow}
        onEncodingChange={(encoding) => sheet.setMeta({ encoding, dirty: true })}
        onNewlineChange={(newline) => sheet.setMeta({ newline, dirty: true })}
        onZebraChange={(zebra) => updateSettings({ zebra })}
        onHeaderHighlightChange={(headerHighlight) => updateSettings({ headerHighlight })}
        onCsvFormulaGuardChange={(value) => sheet.setMeta({ csvFormulaGuard: value, dirty: true })}
        onOmitEmptyCellsChange={(value) => sheet.setMeta({ omitEmptyCells: value, dirty: true })}
        onThemeChange={(theme) => updateSettings({ theme })}
        onUseHeaderRowChange={(useHeaderRow) => updateSettings({ useHeaderRow })}
        onClose={() => setSettingsOpen(false)}
      />
      <Toast message={toast} />
    </div>
  );
}

function referenceForSelection(selection: Selection, range: Range): string {
  if (!range) {
    return `${columnName(selection.col)}${selection.row + 1}`;
  }
  const normalized = normalizeRange(range);
  return `${columnName(normalized.startCol)}${normalized.startRow + 1}:${columnName(normalized.endCol)}${
    normalized.endRow + 1
  }`;
}

const SEARCH_HIT_CAP = 5000;

function findSearchHits(rows: CellValue[][], query: string, options: SearchOptions): SearchHit[] {
  const matcher = buildMatcher(query, options);
  if (!matcher) {
    return [];
  }

  const hits: SearchHit[] = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    for (let colIndex = 0; colIndex < rows[rowIndex].length; colIndex += 1) {
      matcher.lastIndex = 0;
      if (matcher.test(rows[rowIndex][colIndex])) {
        hits.push({ row: rowIndex, col: colIndex });
        if (hits.length >= SEARCH_HIT_CAP) {
          return hits;
        }
      }
    }
  }
  return hits;
}

const MAX_QUERY_LENGTH = 2000;

function buildMatcher(query: string, options: SearchOptions): RegExp | null {
  if (query === "" || query.length > MAX_QUERY_LENGTH) {
    return null;
  }

  const flags = `${options.caseSensitive ? "" : "i"}g`;
  try {
    return options.regex ? new RegExp(query, flags) : new RegExp(escapeRegExp(query), flags);
  } catch {
    return null;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function remapOther(indexes: number[], size: number): number[] {
  return boundedIndexes(indexes, size);
}
function hiddenGroups(indexes: number[]): number[][] {
  const groups: number[][] = [];
  for (const i of indexes) {
    const last = groups[groups.length - 1];
    if (last && last[last.length - 1] === i - 1) last.push(i);
    else groups.push([i]);
  }
  return groups;
}
