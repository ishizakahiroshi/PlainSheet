import { FilterX } from "lucide-react";
import { ActionButton } from "./components/ActionButton";
import { flushSync } from "react-dom";
import type { RegisterEditorCommit } from "./components/CellTextEditor";
import {
  clearVisibleRange,
  pasteIntoView,
  selectedSourceRows,
  moveColumn,
  sameRows,
} from "./lib/gridOperations";
import { completedSaveMeta } from "./lib/saveState";
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
import { MAX_ZOOM, MIN_ZOOM, pushRecentFile, ZOOM_STEP } from "./lib/settings";
import { useDocuments, type ActiveDocumentLive, type DocumentSnapshot } from "./hooks/useDocuments";
import { isTauriRuntime, useFile } from "./hooks/useFile";
import { useFilter } from "./hooks/useFilter";
import { useHistory } from "./hooks/useHistory";
import { useSelection, selectionToRange } from "./hooks/useSelection";
import { useSettings } from "./hooks/useSettings";
import { cloneRows } from "./hooks/useSheet";
import { useSheet } from "./hooks/useSheet";
import type { CellValue, Range, Selection, SheetMeta, HistoryEntry } from "./types/sheet";

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

  const activeDocumentIdRef = useRef(workspace.activeId);
  activeDocumentIdRef.current = workspace.activeId;
  rowsRef.current = sheet.rows;
  metaRef.current = sheet.meta;
  colWidthsRef.current = sheet.colWidths;
  selectionRef.current = selectionState.selection;
  rangeRef.current = selectionState.range;
  const editorCommitRef = useRef<(() => boolean) | null>(null);
  const documentsRef = useRef(workspace.documents);
  documentsRef.current = workspace.documents;
  const closeApprovedRef = useRef(false);
  const registerEditorCommit: RegisterEditorCommit = useCallback((commit) => {
    editorCommitRef.current = commit;
    return () => {
      if (editorCommitRef.current === commit) editorCommitRef.current = null;
    };
  }, []);
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
      if (
        closeApprovedRef.current ||
        (!workspace.anyDirty && !metaRef.current.dirty && !editorCommitRef.current)
      ) {
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

  const finishPendingEdit = useCallback(() => {
    let ready = true;
    flushSync(() => {
      ready = editorCommitRef.current?.() ?? true;
    });
    if (!ready) showToast(t("finishComposition"));
    return ready;
  }, [showToast]);

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
      selectionState.setSelectionRange(doc.selection, doc.range);
      filter.clearAll();
      setFocusCell(null);
      setSelectedRows([]);
      setSelectedColumns([]);
    },
    [sheet, history, selectionState, filter],
  );

  const isBlankStarter = useCallback(() => {
    const rows = rowsRef.current;
    const meta = metaRef.current;
    const emptyRows =
      rows.length === 0 ||
      (rows.length === 1 && (rows[0]?.length ?? 0) <= 1 && (rows[0]?.[0] ?? "") === "");
    return (
      documentsRef.current.length === 1 &&
      !meta.dirty &&
      !meta.filePath &&
      !meta.fileName &&
      emptyRows
    );
  }, []);

  const loadIntoWorkspace = useCallback(
    (rows: CellValue[][], meta: Partial<SheetMeta>) => {
      if (!finishPendingEdit()) return;
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
    [
      isBlankStarter,
      sheet,
      history,
      selectionState,
      filter,
      workspace,
      getLive,
      applyDocument,
      finishPendingEdit,
    ],
  );

  const file = useFile({
    loadData: loadIntoWorkspace,
    getDocumentId: () => activeDocumentIdRef.current,
    onSaved: (completion) => {
      workspace.completeSave(completion);
      if (activeDocumentIdRef.current === completion.snapshot.documentId) {
        sheet.setMeta(completedSaveMeta(rowsRef.current, metaRef.current, completion));
      }
    },
    getRows: () => rowsRef.current,
    getMeta: () => metaRef.current,
    onToast: showToast,
    onRecentPath: (path) => {
      updateSettings((current) => ({
        recentFiles: pushRecentFile(current.recentFiles, path),
      }));
    },
  });

  const requestSave = (as = false) => {
    if (!finishPendingEdit()) return;
    void (as ? file.saveAs() : file.saveFile());
  };

  const newFile = useCallback(() => {
    if (!finishPendingEdit()) return;
    if (isBlankStarter()) {
      sheet.loadData([[""]], { fileName: undefined, format: "csv", delimiter: "," });
      history.reset();
      selectionState.setSelection({ row: 0, col: 0 });
      filter.clearAll();
      return;
    }
    const doc = workspace.addBlankDocument(getLive());
    applyDocument(doc);
  }, [
    isBlankStarter,
    sheet,
    history,
    selectionState,
    filter,
    workspace,
    getLive,
    applyDocument,
    finishPendingEdit,
  ]);

  const switchTab = useCallback(
    (id: string) => {
      if (!finishPendingEdit() || id === activeDocumentIdRef.current) return;
      const doc = workspace.switchTo(id, getLive());
      if (doc) {
        applyDocument(doc);
      }
    },
    [workspace, getLive, applyDocument, finishPendingEdit],
  );

  const closeTab = useCallback(
    (id: string) => {
      if (!finishPendingEdit()) return;
      const target = workspace.documents.find((doc) => doc.id === id);
      if (!target) {
        return;
      }
      const dirty = id === workspace.activeId ? metaRef.current.dirty : target.meta.dirty;
      if (dirty && !window.confirm(t("confirmCloseTab"))) {
        return;
      }
      const result = workspace.closeDocument(id, getLive());
      if (result.closed && result.next) {
        applyDocument(result.next);
      }
    },
    [workspace, getLive, applyDocument, finishPendingEdit],
  );

  const visibleRows = useMemo(
    () => filter.getVisibleRows(sheet.rows, settings.useHeaderRow),
    [filter, sheet.rows, settings.useHeaderRow],
  );
  const displayRows = useMemo(() => visibleRows.map((row) => row.values), [visibleRows]);
  const rowSourceIndexes = useMemo(
    () => (filter.hasFilters ? visibleRows.map((row) => row.sourceIndex) : null),
    [filter.hasFilters, visibleRows],
  );

  useEffect(() => {
    if (!rowSourceIndexes) return;
    const point = selectionRef.current;
    const range = rangeRef.current;
    const missing =
      !rowSourceIndexes.includes(point.row) ||
      (range &&
        (!rowSourceIndexes.includes(range.startRow) || !rowSourceIndexes.includes(range.endRow)));
    const first = rowSourceIndexes[0] ?? 0;
    if (missing && (point.row !== first || range !== null))
      selectionState.setSelection({ row: first, col: point.col });
  }, [rowSourceIndexes]);
  const visibleMapRef = useRef(rowSourceIndexes);
  visibleMapRef.current = rowSourceIndexes;
  const visibleSet = useMemo(
    () => (rowSourceIndexes ? new Set(rowSourceIndexes) : null),
    [rowSourceIndexes],
  );

  const searchHits = useMemo(
    () => findSearchHits(sheet.rows, query, searchOptions, visibleSet),
    [sheet.rows, query, searchOptions, visibleSet],
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

  const recordBeforeChange = useCallback(() => {
    history.record(sheet.rows, selectionState.selection, {
      range: selectionState.range,
      colWidths: sheet.colWidths,
    });
  }, [history, selectionState.selection, selectionState.range, sheet.rows, sheet.colWidths]);

  const replaceRowsFromHistory = (entry: HistoryEntry) => {
    sheet.restoreState(
      entry.rows,
      { ...sheet.meta, dirty: true },
      entry.colWidths ?? sheet.colWidths,
    );
    selectionState.setSelectionRange(entry.selection, entry.range ?? null);
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
    if (workspace.activeId !== activeDocumentIdRef.current || row < 0) return;
    const previousValue = sheet.rows[row]?.[col] ?? "";
    if (previousValue !== value) {
      recordBeforeChange();
      sheet.updateCell(row, col, value);
    }
  };

  const copySelection = async (overrideRange?: Exclude<Range, null>) => {
    const selected =
      overrideRange ?? selectionToRange(selectionState.selection, selectionState.range);
    const normalized = normalizeRange(selected);
    const indexes = selectedSourceRows(sheet.rows.length, normalized, rowSourceIndexes);
    if (indexes.length === 0) return false;
    const text = rangeTsv(
      indexes.map((index) => sheet.rows[index]),
      { ...normalized, startRow: 0, endRow: indexes.length - 1 },
    );
    if (!navigator.clipboard) {
      showToast(t("toastClipboardUnavailable"));
      return false;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast(
        t("toastCopiedRange", {
          rows: indexes.length,
          cols: normalized.endCol - normalized.startCol + 1,
        }),
      );
      return true;
    } catch {
      showToast(t("toastClipboardUnavailable"));
      return false;
    }
  };

  const clipboardContext = () => ({
    documentId: activeDocumentIdRef.current,
    rows: rowsRef.current,
    selection: JSON.stringify([selectionRef.current, rangeRef.current]),
    visible: visibleMapRef.current,
  });
  const clipboardContextValid = (context: ReturnType<typeof clipboardContext>) =>
    context.documentId === activeDocumentIdRef.current &&
    context.rows === rowsRef.current &&
    context.selection === JSON.stringify([selectionRef.current, rangeRef.current]) &&
    context.visible === visibleMapRef.current;

  const clearSelectedCells = (overrideRange?: Exclude<Range, null>) => {
    const selected =
      overrideRange ?? selectionToRange(selectionState.selection, selectionState.range);
    const next = clearVisibleRange(sheet.rows, selected, rowSourceIndexes);
    if (sameRows(sheet.rows, next)) return;
    recordBeforeChange();
    sheet.replaceRows(next, true, false);
  };

  const cutSelection = async (overrideRange?: Exclude<Range, null>) => {
    const context = clipboardContext();
    const selected =
      overrideRange ?? selectionToRange(selectionState.selection, selectionState.range);
    if (!(await copySelection(selected))) return;
    if (!clipboardContextValid(context)) {
      showToast(t("clipboardContextChanged"));
      return;
    }
    clearSelectedCells(selected);
  };

  const pasteGrid = (row: number, col: number, grid: CellValue[][]) => {
    if (
      workspace.activeId !== activeDocumentIdRef.current ||
      sheet.rows !== rowsRef.current ||
      rowSourceIndexes !== visibleMapRef.current
    ) {
      showToast(t("clipboardContextChanged"));
      return;
    }
    const pasted = pasteIntoView(sheet.rows, row, col, grid, rowSourceIndexes);
    if (!pasted) {
      showToast(t("filteredPasteOverflow"));
      return;
    }
    if (!sameRows(sheet.rows, pasted.rows)) {
      recordBeforeChange();
      sheet.replaceRows(pasted.rows, true, false);
    }
    selectionState.selectRange(pasted.range);
  };

  const pasteClipboard = async (start?: { row: number; col: number }) => {
    if (!navigator.clipboard) {
      showToast(t("toastClipboardUnavailable"));
      return;
    }
    const context = clipboardContext();
    const selected = normalizeRange(
      selectionToRange(selectionState.selection, selectionState.range),
    );
    const row = start?.row ?? selected.startRow;
    const col = start?.col ?? selected.startCol;
    try {
      const text = await navigator.clipboard.readText();
      if (!clipboardContextValid(context)) {
        showToast(t("clipboardContextChanged"));
        return;
      }
      pasteGrid(row, col, parseClipboardText(text));
    } catch {
      showToast(t("toastClipboardUnavailable"));
    }
  };

  const openContextMenu = (
    kind: ContextMenuKind,
    row: number,
    col: number,
    x: number,
    y: number,
  ) => {
    const selected = normalizeRange(
      selectionToRange(selectionState.selection, selectionState.range),
    );
    const inside =
      row >= selected.startRow &&
      row <= selected.endRow &&
      col >= selected.startCol &&
      col <= selected.endCol;
    if (kind === "cell" && !inside) selectionState.selectCell(row, col, false);
    if (kind === "column")
      selectionState.setSelectionRange(
        { row: rowSourceIndexes?.[0] ?? 0, col },
        {
          startRow: rowSourceIndexes?.[0] ?? 0,
          startCol: col,
          endRow: rowSourceIndexes?.at(-1) ?? Math.max(0, sheet.rows.length - 1),
          endCol: col,
        },
      );
    if (kind === "row") selectionState.selectRow(row, sheet.columnCount);
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
    return selectionToRange(selectionState.selection, selectionState.range);
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
      selectedRows.length > 0 ? selectedRows : [contextMenu?.row ?? selectionState.selection.row];
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
    const previous = history.undo({
      rows: sheet.rows,
      selection: selectionState.selection,
      range: selectionState.range,
      colWidths: sheet.colWidths,
    });
    if (previous) {
      replaceRowsFromHistory(previous);
    }
  };

  const runRedo = () => {
    const next = history.redo({
      rows: sheet.rows,
      selection: selectionState.selection,
      range: selectionState.range,
      colWidths: sheet.colWidths,
    });
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
    const next = sheet.rows.map((row, rowIndex) =>
      visibleSet && !visibleSet.has(rowIndex)
        ? [...row]
        : row.map((cell) =>
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
    const startRow = ref.kind === "cell" ? ref.row : ref.startRow;
    const endRow = ref.kind === "cell" ? ref.row : ref.endRow;
    if (visibleSet && (!visibleSet.has(startRow) || !visibleSet.has(endRow))) {
      showToast(t("hiddenReference"));
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
    const next = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, Math.round((settings.zoom + delta) * 10) / 10),
    );
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
      if (finishPendingEdit()) void file.openFile();
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      requestSave(event.shiftKey);
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
  const filterValueRows = useMemo(
    () => (settings.useHeaderRow ? sheet.rows.slice(1) : sheet.rows),
    [settings.useHeaderRow, sheet.rows],
  );
  const columnFilterSelected = filterPopover
    ? (filter.filters.get(filterPopover.col) ?? null)
    : null;

  return (
    <div className="appShell" onKeyDown={handleKeyDown}>
      <TitleBar
        meta={sheet.meta}
        beforeClose={() => {
          const dirty =
            metaRef.current.dirty ||
            documentsRef.current.some(
              (doc) => doc.id !== activeDocumentIdRef.current && doc.meta.dirty,
            );
          if ((dirty || editorCommitRef.current) && !window.confirm(t("confirmUnsaved")))
            return false;
          closeApprovedRef.current = true;
          return true;
        }}
        onCloseFailed={() => {
          closeApprovedRef.current = false;
          showToast(t("windowCloseFailed"));
        }}
      />
      <TabBar
        documents={workspace.documents.map((doc) =>
          doc.id === workspace.activeId ? { ...doc, meta: sheet.meta } : doc,
        )}
        activeId={workspace.activeId}
        onSelect={switchTab}
        onClose={closeTab}
        onNew={newFile}
      />
      <Toolbar
        browser={!isTauriRuntime()}
        saving={file.saving}
        rowOpsDisabled={filter.hasFilters}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onNew={newFile}
        onOpen={() => {
          if (finishPendingEdit()) void file.openFile();
        }}
        onSave={() => requestSave()}
        onSaveAs={() => requestSave(true)}
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
        onCopy={() => void copySelection()}
        onSettings={() => setSettingsOpen(true)}
        onHelp={() => setHelpOpen(true)}
      />
      <div className="editionNotice" role="status">
        <span>{isTauriRuntime() ? t("appSaveHint") : t("browserSaveHint")}</span>
        {file.saveNotice ? <span className="saveNotice">{file.saveNotice}</span> : null}
      </div>
      <span id="cell-edit-help" className="srOnly">
        {t("editNavigationHelp")}
      </span>
      {filter.hasFilters && (
        <div className="filterBar" role="status">
          <strong>{t("filterActiveLabel")}</strong>
          <span>
            {t("filteredCount", { visible: displayRows.length, total: sheet.rows.length })}
            {settings.useHeaderRow ? ` (${t("headerIncluded")})` : ""}
          </span>
          <ActionButton
            className="toolbar__button"
            type="button"
            tooltip={t("filterAll")}
            onClick={filter.clearAll}
          >
            <FilterX size={16} aria-hidden="true" />
            {t("filterAll")}
          </ActionButton>
          <span>{t("toastFilterBlocksRowOps")}</span>
        </div>
      )}
      <SearchPanel
        filtered={filter.hasFilters}
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
            key={`formula-${workspace.activeId}`}
            row={selectionState.selection.row}
            col={selectionState.selection.col}
            reference={selectedReference}
            value={currentValue}
            onCommit={(row, col, value, reselect) => commitCell(row, col, value, reselect)}
            onJump={handleJump}
            registerCommit={registerEditorCommit}
            disabled={visibleSet !== null && !visibleSet.has(selectionState.selection.row)}
            onMove={(row, col, dr, dc) => {
              const nextRow = rowSourceIndexes
                ? (rowSourceIndexes[
                    Math.max(
                      0,
                      Math.min(rowSourceIndexes.length - 1, rowSourceIndexes.indexOf(row) + dr),
                    )
                  ] ?? row)
                : Math.max(0, row + dr);
              selectionState.selectCell(nextRow, Math.max(0, col + dc));
              setFocusCell({ row: nextRow, col: Math.max(0, col + dc), nonce: Date.now() });
            }}
          />
          <GlideSheet
            key={`grid-${workspace.activeId}`}
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
            registerCommit={registerEditorCommit}
            onClear={() => clearSelectedCells()}
            onColumnMove={(from, to) => {
              if (!ensureRowOpsAllowed()) return;
              const moved = moveColumn(sheet.rows, sheet.colWidths, sheet.columnCount, from, to);
              if (!moved) {
                if (from !== to) showToast(t("moveDataColumnsOnly"));
                return;
              }
              recordBeforeChange();
              sheet.replaceRows(moved.rows, true, false);
              sheet.setColWidths(moved.widths);
              selectionState.selectColumn(to, sheet.rows.length);
            }}
            onColumnResize={sheet.setColumnWidth}
            onSelectionChange={(sel, range) => selectionState.setSelectionRange(sel, range)}
            onRowsSelected={setSelectedRows}
            onColumnsSelected={setSelectedColumns}
            onPasteGrid={pasteGrid}
            onFill={(updates) => {
              if (
                workspace.activeId !== activeDocumentIdRef.current ||
                sheet.rows !== rowsRef.current ||
                rowSourceIndexes !== visibleMapRef.current
              ) {
                showToast(t("clipboardContextChanged"));
                return;
              }
              if (
                updates.length === 0 ||
                updates.some(
                  (update) => update.row < 0 || (visibleSet && !visibleSet.has(update.row)),
                )
              ) {
                return;
              }
              if (
                updates.every(
                  (update) => (sheet.rows[update.row]?.[update.col] ?? "") === update.value,
                )
              )
                return;
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
              for (const update of updates) {
                while (next[update.row].length <= update.col) next[update.row].push("");
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
          onOpen={() => {
            if (finishPendingEdit()) void file.openFile();
          }}
          onSample={() => void file.loadSample()}
          recentFiles={isTauriRuntime() ? settings.recentFiles : []}
          onOpenRecent={isTauriRuntime() ? (path) => void file.loadPath(path) : undefined}
        />
      )}
      <StatusBar
        visibleSourceRows={rowSourceIndexes}
        browser={!isTauriRuntime()}
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
        onClearFilter={() => {
          if (contextMenu) filter.setColumnFilter(contextMenu.col, null);
        }}
        onClose={() => setContextMenu(null)}
        onCut={() => {
          const range = rangeFromContextMenu();
          void cutSelection(range ?? undefined);
        }}
        onCopy={() => {
          const range = rangeFromContextMenu();
          void copySelection(range ?? undefined);
        }}
        onPaste={() => {
          void pasteClipboard();
        }}
        onClear={() => {
          const range = rangeFromContextMenu();
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
        rows={filterValueRows}
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
        browser={!isTauriRuntime()}
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

function findSearchHits(
  rows: CellValue[][],
  query: string,
  options: SearchOptions,
  visible: Set<number> | null = null,
): SearchHit[] {
  const matcher = buildMatcher(query, options);
  if (!matcher) {
    return [];
  }

  const hits: SearchHit[] = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    if (visible && !visible.has(rowIndex)) continue;
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
