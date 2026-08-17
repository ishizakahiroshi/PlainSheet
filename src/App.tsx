import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { ContextMenu, type ContextMenuKind, type ContextMenuState } from "./components/ContextMenu";
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
import { parseClipboardText, rangeTsv, normalizeRange } from "./lib/clipboard";
import { setLocale, t } from "./lib/i18n";
import { parseCellRef } from "./lib/cellref";
import { sortRows, type SortDirection } from "./lib/sort";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  pushRecentFile,
  ZOOM_STEP,
} from "./lib/settings";
import { useDocuments, type ActiveDocumentLive, type DocumentSnapshot } from "./hooks/useDocuments";
import { useFile } from "./hooks/useFile";
import { useFilter } from "./hooks/useFilter";
import { useHistory } from "./hooks/useHistory";
import { useSelection, selectionToRange } from "./hooks/useSelection";
import { useSettings } from "./hooks/useSettings";
import { cloneRows } from "./hooks/useSheet";
import { useSheet } from "./hooks/useSheet";
import type { CellValue, Range, Selection, SheetMeta } from "./types/sheet";

type PendingConfirm = {
  action: () => void;
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
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<number[]>([]);

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
    typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : false,
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
      filter.clearAll();
      setSelectedRows([]);
      setSelectedColumns([]);
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
      const dirty =
        id === workspace.activeId ? sheet.meta.dirty : target.meta.dirty;
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

  const visibleRows = useMemo(() => filter.getVisibleRows(sheet.rows), [filter, sheet.rows]);
  const displayRows = useMemo(() => visibleRows.map((row) => row.values), [visibleRows]);
  const rowSourceIndexes = useMemo(
    () => (filter.hasFilters ? visibleRows.map((row) => row.sourceIndex) : null),
    [filter.hasFilters, visibleRows],
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

  const currentValue = sheet.rows[selectionState.selection.row]?.[selectionState.selection.col] ?? "";
  const selectedReference = referenceForSelection(selectionState.selection, selectionState.range);

  const recordBeforeChange = useCallback(() => {
    history.record(sheet.rows, selectionState.selection);
  }, [history, selectionState.selection, sheet.rows]);

  const replaceRowsFromHistory = (entry: { rows: CellValue[][]; selection: Selection }) => {
    sheet.replaceRows(entry.rows, true, false);
    selectionState.setSelection(entry.selection);
  };

  const commitCell = (row: number, col: number, value: string, reselect: boolean) => {
    const previousValue = sheet.rows[row]?.[col] ?? "";
    if (previousValue !== value) {
      recordBeforeChange();
      sheet.updateCell(row, col, value);
    }
    if (reselect) {
      selectionState.selectCell(row, col, false);
    }
  };

  const editCell = (row: number, col: number, value: string) => {
    const previousValue = sheet.rows[row]?.[col] ?? "";
    if (previousValue !== value) {
      recordBeforeChange();
      sheet.updateCell(row, col, value);
    }
  };

  const copySelection = async (overrideRange?: Exclude<Range, null>) => {
    const selected = overrideRange ?? selectionToRange(selectionState.selection, selectionState.range);
    const normalized = normalizeRange(selected);
    const text = rangeTsv(sheet.rows, selected);
    if (!navigator.clipboard) {
      showToast(t("toastClipboardUnavailable"));
      return false;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast(
        t("toastCopiedRange", {
          rows: normalized.endRow - normalized.startRow + 1,
          cols: normalized.endCol - normalized.startCol + 1,
        }),
      );
      return true;
    } catch {
      showToast(t("toastClipboardUnavailable"));
      return false;
    }
  };

  const cutSelection = async (overrideRange?: Exclude<Range, null>) => {
    const selected = overrideRange ?? selectionToRange(selectionState.selection, selectionState.range);
    const ok = await copySelection(selected);
    if (!ok) {
      return;
    }
    const normalized = normalizeRange(selected);
    let wouldChange = false;
    for (let r = normalized.startRow; r <= normalized.endRow && !wouldChange; r += 1) {
      const row = sheet.rows[r];
      if (!row) {
        continue;
      }
      for (let c = normalized.startCol; c <= normalized.endCol; c += 1) {
        if ((row[c] ?? "") !== "") {
          wouldChange = true;
          break;
        }
      }
    }
    if (!wouldChange) {
      return;
    }
    recordBeforeChange();
    sheet.clearRange(selected);
  };

  const pasteClipboard = async (start?: { row: number; col: number }) => {
    if (!navigator.clipboard) {
      showToast(t("toastClipboardUnavailable"));
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      const grid = parseClipboardText(text);
      const row = start?.row ?? selectionState.selection.row;
      const col = start?.col ?? selectionState.selection.col;
      recordBeforeChange();
      const pastedRange = sheet.pasteGrid(row, col, grid);
      selectionState.selectRange(pastedRange);
      const normalized = normalizeRange(pastedRange);
      showToast(
        t("toastPastedRange", {
          rows: normalized.endRow - normalized.startRow + 1,
          cols: normalized.endCol - normalized.startCol + 1,
        }),
      );
    } catch {
      showToast(t("toastClipboardUnavailable"));
    }
  };

  const clearSelectedCells = (overrideRange?: Exclude<Range, null>) => {
    const selected = overrideRange ?? selectionToRange(selectionState.selection, selectionState.range);
    const normalized = normalizeRange(selected);
    let wouldChange = false;
    for (let r = normalized.startRow; r <= normalized.endRow && !wouldChange; r += 1) {
      const row = sheet.rows[r];
      if (!row) {
        continue;
      }
      for (let c = normalized.startCol; c <= normalized.endCol; c += 1) {
        if ((row[c] ?? "") !== "") {
          wouldChange = true;
          break;
        }
      }
    }
    if (!wouldChange) {
      return;
    }
    recordBeforeChange();
    sheet.clearRange(selected);
  };

  const openContextMenu = (kind: ContextMenuKind, row: number, col: number, x: number, y: number) => {
    setContextMenu({ kind, row, col, x, y });
  };

  const rangeFromContextMenu = (): Exclude<Range, null> | null => {
    if (!contextMenu) {
      return null;
    }
    if (contextMenu.kind === "column") {
      return {
        startRow: 0,
        startCol: contextMenu.col,
        endRow: Math.max(0, sheet.rows.length - 1),
        endCol: contextMenu.col,
      };
    }
    if (contextMenu.kind === "row") {
      return {
        startRow: contextMenu.row,
        startCol: 0,
        endRow: contextMenu.row,
        endCol: Math.max(0, sheet.columnCount - 1),
      };
    }
    return {
      startRow: contextMenu.row,
      startCol: contextMenu.col,
      endRow: contextMenu.row,
      endCol: contextMenu.col,
    };
  };

  const selectContextCell = () => {
    if (!contextMenu) {
      return;
    }
    if (contextMenu.kind === "column") {
      selectionState.selectColumn(contextMenu.col, Math.max(sheet.rows.length, 1));
    } else if (contextMenu.kind === "row") {
      selectionState.selectRow(contextMenu.row, Math.max(sheet.columnCount, 1));
    } else {
      selectionState.selectCell(contextMenu.row, contextMenu.col, false);
    }
  };

  const ensureRowOpsAllowed = (): boolean => {
    if (filter.hasFilters) {
      showToast(t("toastFilterBlocksRowOps"));
      return false;
    }
    return true;
  };

  const rowsToInsert = selectedRows.length > 0 ? selectedRows.length : 1;
  const colsToInsert = selectedColumns.length > 0 ? selectedColumns.length : 1;

  const insertRow = (offset: 0 | 1) => {
    if (!ensureRowOpsAllowed()) {
      return;
    }
    const base = contextMenu?.row ?? selectionState.selection.row;
    recordBeforeChange();
    sheet.insertRows(base + offset, rowsToInsert);
  };

  const insertColumn = (offset: 0 | 1) => {
    if (!ensureRowOpsAllowed()) {
      return;
    }
    const base = contextMenu?.col ?? selectionState.selection.col;
    recordBeforeChange();
    sheet.insertColumns(base + offset, colsToInsert);
  };

  const deleteRowWithConfirm = () => {
    if (!ensureRowOpsAllowed()) {
      return;
    }
    const indexes =
      selectedRows.length > 0
        ? selectedRows
        : [contextMenu?.row ?? selectionState.selection.row];
    setPendingConfirm({
      action: () => {
        recordBeforeChange();
        sheet.deleteRows(indexes);
        const nextRow = Math.max(0, Math.min(...indexes) - 1);
        selectionState.selectCell(nextRow, selectionState.selection.col, false);
        setSelectedRows([]);
      },
    });
  };

  const deleteColumnWithConfirm = () => {
    if (!ensureRowOpsAllowed()) {
      return;
    }
    const indexes =
      selectedColumns.length > 0
        ? selectedColumns
        : [contextMenu?.col ?? selectionState.selection.col];
    setPendingConfirm({
      action: () => {
        recordBeforeChange();
        sheet.deleteColumns(indexes);
        const nextCol = Math.max(0, Math.min(...indexes) - 1);
        selectionState.selectCell(selectionState.selection.row, nextCol, false);
        setSelectedColumns([]);
      },
    });
  };

  const applySort = (col: number, direction: SortDirection) => {
    recordBeforeChange();
    const sorted = sortRows(sheet.rows, col, direction, {
      headerRow: settings.useHeaderRow,
    });
    sheet.replaceRows(sorted, true, false);
  };

  const runUndo = () => {
    const previous = history.undo({ rows: sheet.rows, selection: selectionState.selection });
    if (previous) {
      replaceRowsFromHistory(previous);
    }
  };

  const runRedo = () => {
    const next = history.redo({ rows: sheet.rows, selection: selectionState.selection });
    if (next) {
      replaceRowsFromHistory(next);
    }
  };

  const jumpSearch = (direction: 1 | -1) => {
    if (searchHits.length === 0) {
      return;
    }
    const nextIndex = (activeSearchIndex + direction + searchHits.length) % searchHits.length;
    setActiveSearchIndex(nextIndex);
    setSearchScrollNonce((nonce) => nonce + 1);
    const hit = searchHits[nextIndex];
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
      selectionState.selectCell(ref.row, ref.col, false);
      setFocusCell({ row: ref.row, col: ref.col, nonce: Date.now() });
      return;
    }
    selectionState.selectRange({
      startRow: ref.startRow,
      startCol: ref.startCol,
      endRow: ref.endRow,
      endCol: ref.endCol,
    });
    setFocusCell({ row: ref.startRow, col: ref.startCol, nonce: Date.now() });
  };

  const adjustZoom = (delta: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((settings.zoom + delta) * 10) / 10));
    updateSettings({ zoom: next });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target;
    const editingText =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement;

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
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey && !editingText) {
      event.preventDefault();
      runUndo();
    } else if (
      !editingText &&
      (((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "z"))
    ) {
      event.preventDefault();
      runRedo();
    } else if (!editingText && (event.ctrlKey || event.metaKey) && (event.key === "=" || event.key === "+")) {
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
    ? filter.filters.get(filterPopover.col) ?? null
    : null;

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
          sheet.autoFitColumns();
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
          <GlideSheet
            rows={displayRows}
            rowSourceIndexes={rowSourceIndexes}
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
            freezeColumns={settings.freezeColumns}
            zoom={settings.zoom}
            onEdit={editCell}
            onColumnResize={sheet.setColumnWidth}
            onSelectionChange={(sel, range) => {
              if (range) {
                selectionState.selectRange(range);
              } else {
                selectionState.selectCell(sel.row, sel.col, false);
              }
            }}
            onRowsSelected={setSelectedRows}
            onColumnsSelected={setSelectedColumns}
            onPasteGrid={(startRow, startCol, grid) => {
              recordBeforeChange();
              const pasted = sheet.pasteGrid(startRow, startCol, grid);
              selectionState.selectRange(pasted);
            }}
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
        rowOpsDisabled={filter.hasFilters}
        filterActive={contextMenu ? filter.filters.has(contextMenu.col) : false}
        onClose={() => setContextMenu(null)}
        onCut={() => {
          const range = rangeFromContextMenu();
          selectContextCell();
          void cutSelection(range ?? undefined);
        }}
        onCopy={() => {
          const range = rangeFromContextMenu();
          selectContextCell();
          void copySelection(range ?? undefined);
        }}
        onPaste={() => {
          const menu = contextMenu;
          selectContextCell();
          void pasteClipboard(menu ? { row: menu.row, col: menu.col } : undefined);
        }}
        onClear={() => {
          const range = rangeFromContextMenu();
          selectContextCell();
          clearSelectedCells(range ?? undefined);
        }}
        onInsertRowAbove={() => insertRow(0)}
        onInsertRowBelow={() => insertRow(1)}
        onDeleteRow={deleteRowWithConfirm}
        onInsertColLeft={() => insertColumn(0)}
        onInsertColRight={() => insertColumn(1)}
        onDeleteCol={deleteColumnWithConfirm}
        onAutoFitColumn={() => {
          const col = contextMenu?.col ?? selectionState.selection.col;
          sheet.autoFitColumn(col);
          showToast(t("toastAutoFit"));
        }}
        onSortAsc={() => {
          if (contextMenu) {
            applySort(contextMenu.col, "asc");
          }
        }}
        onSortDesc={() => {
          if (contextMenu) {
            applySort(contextMenu.col, "desc");
          }
        }}
        onFilter={() => {
          if (!contextMenu) {
            return;
          }
          if (filter.filters.has(contextMenu.col)) {
            filter.setColumnFilter(contextMenu.col, null);
            return;
          }
          setFilterPopover({
            col: contextMenu.col,
            x: contextMenu.x,
            y: contextMenu.y,
          });
        }}
        onFreezeToHere={() => {
          if (contextMenu) {
            updateSettings({ freezeColumns: contextMenu.col + 1 });
          }
        }}
        onUnfreeze={() => updateSettings({ freezeColumns: 0 })}
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
