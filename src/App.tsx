import { FeatureDialog } from "./components/FeatureDialog";
import { FilterX } from "lucide-react";
import { ActionButton } from "./components/ActionButton";
import { flushSync } from "react-dom";
import type { RegisterEditorCommit } from "./components/CellTextEditor";
import {
  clearVisibleRange,
  pasteIntoView,
  selectionIndexes,
  moveColumn,
  sameRows,
} from "./lib/gridOperations";
import { ImportPreview } from "./components/ImportPreview";
import type { ImportPreviewRequest, ImportPreviewResult } from "./lib/importPreview";
import { createConversionPreview } from "./lib/conversionPreview";
import { completedSaveMeta, sameSaveContent, type SaveSnapshot } from "./lib/saveState";
import { CommandSearch } from "./components/CommandSearch";
import { type Command, dispatchCommand, shortcutCommand } from "./lib/commands";
import { collectSearchMatches, compileSearch, replaceSearchValue } from "./lib/search";
import { getCurrentWindow } from "@tauri-apps/api/window";
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
import {
  createClipboardSnapshot,
  clipboardHtmlRows,
  resolveClipboardText,
  clipboardNeedsFormatChoice,
  normalizeRange,
  type ClipboardSnapshot,
  type ClipboardFormat,
} from "./lib/clipboard";
import { setLocale, t } from "./lib/i18n";
import { parseCellRef } from "./lib/cellref";
import { NamedViewsPanel } from "./components/NamedViewsPanel";
import { namedViewStore, viewMatchesCurrent } from "./lib/namedViews";
import { SharingPanel } from "./components/SharingPanel";
import { useCollaboration } from "./hooks/useCollaboration";
import {
  activeIds,
  insertAxisActions,
  deleteAxisActions,
  sharedDocumentRows,
} from "./lib/collaboration";
import { CleanupPanel } from "./components/CleanupPanel";
import { ValidationPanel } from "./components/ValidationPanel";
import { RecoveryPanel } from "./components/RecoveryPanel";
import { createRecoveryStore, type RecoveryState } from "./lib/recovery";
import {
  validateDocument,
  validateMutation,
  type ValidationRule,
  type ValidationReport,
} from "./lib/validation";
import {
  validationHistoryBefore,
  validationHistoryError,
  restoreValidationHistory,
  type ValidationColumnChange,
} from "./lib/validationHistory";
import {
  evaluateFormulaSheet,
  exportFormulaRows,
  rewriteFormulasForStructure,
  translateFormula,
} from "./lib/formula";
import { createDocumentView, type DocumentView } from "./lib/viewState";
import { sortRows, sortRowsByKeys, type SortKey, type SortDirection } from "./lib/sort";
import { MAX_ZOOM, MIN_ZOOM, pushRecentFile, ZOOM_STEP } from "./lib/settings";
import { useDocuments, type ActiveDocumentLive, type DocumentSnapshot } from "./hooks/useDocuments";
import { isTauriRuntime, useFile } from "./hooks/useFile";
import { useFilter } from "./hooks/useFilter";
import { useHistory } from "./hooks/useHistory";
import { useSelection, selectionToRange } from "./hooks/useSelection";
import { useSettings } from "./hooks/useSettings";
import { cloneRows } from "./hooks/useSheet";
import { useSheet } from "./hooks/useSheet";
import { MAX_GRID_ROWS, MAX_GRID_COLS } from "./types/sheet";
import type {
  CellValue,
  Range,
  Selection,
  SheetMeta,
  HistoryEntry,
  CellEditIdentity,
} from "./types/sheet";

type PendingConfirm = {
  action: () => void;
} | null;

export default function App() {
  const sheet = useSheet();
  const selectionState = useSelection();
  const history = useHistory();
  const workspace = useDocuments();
  const { settings, update: updateSettings } = useSettings();
  const filter = useFilter();
  const viewStatesRef = useRef(new Map<string, DocumentView>());
  const [viewState, setView] = useState<DocumentView>(createDocumentView);
  const view = useMemo(
    () =>
      sheet.meta.format === "json" || sheet.meta.format === "yaml"
        ? { ...viewState, useHeaderRow: true }
        : viewState,
    [viewState, sheet.meta.format],
  );
  const viewRef = useRef(view);
  viewRef.current = view;
  const filterRef = useRef(filter.filters);
  filterRef.current = filter.filters;
  const [rulesById, setRulesById] = useState<Record<string, ValidationRule[]>>({});
  const rules = rulesById[workspace.activeId] ?? [];
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [validationOpen, setValidationOpen] = useState(false);
  const [cleanupOpen, setCleanupOpen] = useState<{
    rows: CellValue[][];
    cells: Selection[];
    documentId: string;
  } | null>(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [sharingOpen, setSharingOpen] = useState(false);
  const sharingContextRef = useRef<{ documentId: string; rows: CellValue[][] } | null>(null);
  const [namedViewsOpen, setNamedViewsOpen] = useState(false);
  const [activeViewById, setActiveViewById] = useState<Record<string, string | null>>({});
  const [recoveryStore] = useState(() => {
    try {
      return createRecoveryStore(window.localStorage, isTauriRuntime() ? "desktop" : "browser");
    } catch {
      return createRecoveryStore(
        {
          getItem() {
            throw new Error("Storage unavailable");
          },
          setItem() {
            throw new Error("Storage unavailable");
          },
          removeItem() {
            throw new Error("Storage unavailable");
          },
        },
        isTauriRuntime() ? "desktop" : "browser",
      );
    }
  });
  const [recoveryState, setRecoveryState] = useState<RecoveryState | null>(() => {
    const result = recoveryStore.inspect();
    return result.ok ? result.value : null;
  });
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  useEffect(() => {
    const result = recoveryStore.inspect();
    if (result.ok && result.value.enabled && result.value.drafts.length) setRecoveryOpen(true);
    if (!result.ok) setRecoveryError(result.error);
  }, [recoveryStore]);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortKeys, setSortKeys] = useState<SortKey[]>([
    { colIndex: 0, direction: "asc", mode: "auto" },
  ]);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [filterPopover, setFilterPopover] = useState<FilterPopoverState>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFocusNonce, setSearchFocusNonce] = useState(0);
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchScope, setSearchScope] = useState<"sheet" | "visible" | "selection">("visible");
  const [searchSelection, setSearchSelection] = useState<{
    documentId: string;
    cells: Set<string>;
    label: string;
  } | null>(null);
  const checkpointsRef = useRef(new Map<string, { rows: CellValue[][]; meta: SheetMeta }>());
  const [importRequest, setImportRequest] = useState<{
    request: ImportPreviewRequest;
    resolve: (value: ImportPreviewResult | null) => void;
  } | null>(null);
  const [savePreview, setSavePreview] = useState<{
    name: string;
    detail: string;
    resolve: (value: "save" | "saveAs" | "cancel") => void;
  } | null>(null);
  const [closeRequest, setCloseRequest] = useState<{
    ids: string[];
    window: boolean;
    downloaded?: boolean;
  } | null>(null);
  const [closeBusy, setCloseBusy] = useState(false);
  const copiedOriginRef = useRef<{ rows: number[]; columns: number[] } | null>(null);
  const clipboardSnapshotRef = useRef<ClipboardSnapshot | null>(null);
  const [pastePreview, setPastePreview] = useState<{
    text: string;
    apply: (format: ClipboardFormat) => void;
  } | null>(null);
  const [pasteFormat, setPasteFormat] = useState<ClipboardFormat>("single-column");
  const [fillMode, setFillMode] = useState<"copy" | "series">("copy");
  const [pendingPreview, setPendingPreview] = useState<{
    title: string;
    detail: string;
    apply: () => void;
  } | null>(null);
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
  const selectedRowsRef = useRef(selectedRows);
  const selectedColumnsRef = useRef(selectedColumns);
  selectedRowsRef.current = selectedRows;
  selectedColumnsRef.current = selectedColumns;

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
  const saveRequestsRef = useRef(0);
  const pendingSharingRef = useRef<() => string[]>(() => []);
  const downloadedCloseSnapshots = useRef<Map<string, SaveSnapshot> | null>(null);
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
        (!workspace.anyDirty &&
          !metaRef.current.dirty &&
          !editorCommitRef.current &&
          pendingSharingRef.current().length === 0)
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

  const collaboration = useCollaboration({
    activeId: workspace.activeId,
    getRows: (id) =>
      id === activeDocumentIdRef.current
        ? rowsRef.current
        : documentsRef.current.find((d) => d.id === id)?.rows,
    applyRows: (id, rows) => {
      workspace.replaceDocumentRows(id, rows);
      if (id === activeDocumentIdRef.current) {
        sheet.replaceRows(rows, true, false);
        setSearchSelection(null);
      }
    },
    onError: showToast,
  });
  const openSharing = () => {
    sharingContextRef.current = {
      documentId: activeDocumentIdRef.current,
      rows: cloneRows(rowsRef.current),
    };
    setSharingOpen(true);
  };
  pendingSharingRef.current = collaboration.pendingDocumentIds;
  const sharingHistory = collaboration.state?.snapshot?.history ?? [];
  const canUndo = collaboration.client
    ? !collaboration.readOnly &&
      sharingHistory.some(
        (e) =>
          e.memberId === collaboration.state?.memberId &&
          !e.undoOf &&
          !sharingHistory.some((u) => u.undoOf === e.id),
      )
    : history.canUndo;
  const canRedo = collaboration.client
    ? !collaboration.readOnly && sharingHistory.some((e) => Boolean(e.undoOf))
    : history.canRedo;
  const replaceRows = (next: CellValue[][], dirty = true, recalcWidths = false) => {
    if (collaboration.client) {
      collaboration.replaceMatrix(next);
      return;
    }
    sheet.replaceRows(next, dirty, recalcWidths);
  };

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
      viewStatesRef.current.set(activeDocumentIdRef.current, {
        ...viewRef.current,
        filters: [...filterRef.current].map(([col, values]) => [col, [...values]]),
      });
      const nextView = viewStatesRef.current.get(doc.id) ?? createDocumentView();
      setView(nextView);
      filter.restore(nextView.filters);
      sheet.restoreState(doc.rows, doc.meta, doc.colWidths);
      history.restore(doc.history.undo, doc.history.redo);
      selectionState.setSelectionRange(doc.selection, doc.range);
      setSearchSelection(null);
      setValidationReport(null);
      setCleanupOpen(null);
      setSortOpen(false);
      setSortKeys([{ colIndex: 0, direction: "asc", mode: "auto" }]);
      setPendingPreview(null);
      setPastePreview(null);
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
      !collaboration.hasSession(activeDocumentIdRef.current) &&
      sharingContextRef.current?.documentId !== activeDocumentIdRef.current &&
      emptyRows
    );
  }, []);

  const loadIntoWorkspace = useCallback(
    (rows: CellValue[][], meta: Partial<SheetMeta>) => {
      if (!finishPendingEdit()) return;
      if (isBlankStarter()) {
        workspace.replaceActiveContent(rows, meta);
        setView(createDocumentView());
        setSortKeys([{ colIndex: 0, direction: "asc", mode: "auto" }]);
        viewStatesRef.current.delete(activeDocumentIdRef.current);
        setRulesById((current) => ({ ...current, [activeDocumentIdRef.current]: [] }));
        setActiveViewById((current) => ({ ...current, [activeDocumentIdRef.current]: null }));
        namedViewStore.forgetDocument(activeDocumentIdRef.current);
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
    requestImportPreview: (request) =>
      new Promise((resolve) => {
        setImportRequest((previous) => {
          previous?.resolve(null);
          return { request, resolve };
        });
      }),
    beforeSave: async (snapshot, chooseName) => {
      if (chooseName || !isTauriRuntime() || !snapshot.meta.filePath || !snapshot.meta.sourceText)
        return "save";
      const preview = createConversionPreview({
        content: snapshot.meta.sourceText,
        format: snapshot.meta.format ?? "csv",
        rows: snapshot.rows,
        delimiter: snapshot.meta.delimiter,
        newline: snapshot.meta.newline,
        omitEmptyCells: snapshot.meta.omitEmptyCells,
      });
      if (!preview.hasLoss) return "save";
      return new Promise((resolve) =>
        setSavePreview({
          name: snapshot.meta.fileName ?? "untitled",
          detail: JSON.stringify(preview, null, 2),
          resolve,
        }),
      );
    },
    onSaved: (completion) => {
      if (completion.method === "direct")
        checkpointsRef.current.set(completion.snapshot.documentId, {
          rows: cloneRows(completion.snapshot.rows),
          meta: { ...completion.snapshot.meta, ...completion.patch },
        });
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
    saveRequestsRef.current += 1;
    void (as ? file.saveAs() : file.saveFile()).finally(() => {
      saveRequestsRef.current -= 1;
    });
  };

  const approveWindowClose = useCallback(() => {
    if (closeApprovedRef.current) return true;
    if (saveRequestsRef.current > 0) {
      showToast(t("saving"));
      return false;
    }
    if (!finishPendingEdit()) return false;
    const dirty =
      metaRef.current.dirty ||
      documentsRef.current.some((doc) => doc.id !== activeDocumentIdRef.current && doc.meta.dirty);
    const pendingIds = pendingSharingRef.current();
    if (dirty || pendingIds.length) {
      const ids = documentsRef.current
        .filter(
          (doc) =>
            (doc.id === activeDocumentIdRef.current ? metaRef.current.dirty : doc.meta.dirty) ||
            pendingIds.includes(doc.id),
        )
        .map((doc) => doc.id);
      setCloseRequest({ ids, window: true });
      return false;
    }
    closeApprovedRef.current = true;
    return true;
  }, [finishPendingEdit, showToast]);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let disposed = false;
    let unlisten: (() => void) | undefined;
    let closing = false;
    const appWindow = getCurrentWindow();
    void appWindow
      .onCloseRequested(async (event) => {
        // Prevent first, including repeated OS requests while destruction is pending.
        event.preventDefault();
        if (disposed || closing || !approveWindowClose()) return;
        closing = true;
        try {
          await appWindow.destroy();
        } catch {
          closeApprovedRef.current = false;
          showToast(t("windowCloseFailed"));
        } finally {
          closing = false;
        }
      })
      .then((stop) => {
        if (disposed) stop();
        else unlisten = stop;
      })
      .catch(() => {
        if (!disposed) showToast(t("windowCloseGuardFailed"));
      });
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [approveWindowClose, showToast]);

  const newFile = useCallback(() => {
    if (!finishPendingEdit()) return;
    if (isBlankStarter()) {
      setView(createDocumentView());
      viewStatesRef.current.delete(activeDocumentIdRef.current);
      checkpointsRef.current.delete(activeDocumentIdRef.current);
      setRulesById((current) => {
        const next = { ...current };
        delete next[activeDocumentIdRef.current];
        return next;
      });
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
      if (collaboration.hasSession(id)) {
        showToast(
          "共有から退出してからタブを閉じてください / Leave sharing before closing the tab",
        );
        if (id === workspace.activeId) openSharing();
        return;
      }
      const target = workspace.documents.find((doc) => doc.id === id);
      if (!target) {
        return;
      }
      const dirty = id === workspace.activeId ? metaRef.current.dirty : target.meta.dirty;
      if (saveRequestsRef.current > 0 || file.saving) {
        showToast(t("saving"));
        return;
      }
      if (dirty) {
        setCloseRequest({ ids: [id], window: false });
        return;
      }
      const result = workspace.closeDocument(id, getLive());
      if (result.closed && result.next) {
        namedViewStore.forgetDocument(id);
        viewStatesRef.current.delete(id);
        checkpointsRef.current.delete(id);
        applyDocument(result.next);
      }
    },
    [workspace, getLive, applyDocument, finishPendingEdit, file.saving, showToast],
  );

  const closeSnapshots = () =>
    new Map(
      documentsRef.current.map((doc) => [
        doc.id,
        {
          documentId: doc.id,
          rows: doc.id === activeDocumentIdRef.current ? rowsRef.current : doc.rows,
          meta: { ...(doc.id === activeDocumentIdRef.current ? metaRef.current : doc.meta) },
        },
      ]),
    );
  const closeSnapshotMatches = (
    snapshots: Map<string, SaveSnapshot>,
    windowClose: boolean,
    ids: string[],
  ) => {
    const current = closeSnapshots();
    if (
      windowClose &&
      (current.size !== snapshots.size || [...current.keys()].some((id) => !snapshots.has(id)))
    )
      return false;
    return [...snapshots].every(([id, snapshot]) => {
      if (!windowClose && !ids.includes(id)) return true;
      const live = current.get(id);
      return live && sameSaveContent(live.rows, live.meta, snapshot);
    });
  };
  const completeCloseRequest = async (request: NonNullable<typeof closeRequest>) => {
    if (request.window) {
      closeApprovedRef.current = true;
      try {
        await getCurrentWindow().destroy();
        setCloseRequest(null);
      } catch {
        closeApprovedRef.current = false;
        showToast(t("windowCloseFailed"));
      }
    } else {
      const result = workspace.closeDocument(request.ids[0], getLive());
      if (result.closed && result.next) applyDocument(result.next);
      setCloseRequest(null);
    }
  };
  const finishClose = async () => {
    if (!closeRequest || closeBusy || saveRequestsRef.current > 0 || !finishPendingEdit()) return;
    if (
      closeRequest.downloaded &&
      downloadedCloseSnapshots.current &&
      !closeSnapshotMatches(downloadedCloseSnapshots.current, closeRequest.window, closeRequest.ids)
    ) {
      showToast("ダウンロード後に変更されました。再保存するか明示的に破棄してください。");
      setCloseRequest({ ...closeRequest, downloaded: false });
      return;
    }
    await completeCloseRequest(closeRequest);
  };
  const saveThenClose = async () => {
    if (!closeRequest || closeBusy || !finishPendingEdit()) return;
    const request = closeRequest;
    const snapshots = closeSnapshots();
    setCloseBusy(true);
    saveRequestsRef.current += 1;
    let downloaded = false;
    let success = true;
    try {
      for (const id of request.ids) {
        const snapshot = snapshots.get(id);
        if (!snapshot) {
          success = false;
          break;
        }
        const outcome = await file.saveDocument(false, snapshot);
        if (outcome.status !== "direct" && outcome.status !== "download") {
          success = false;
          break;
        }
        if (outcome.savedMeta) snapshots.set(id, { ...snapshot, meta: outcome.savedMeta });
        downloaded ||= outcome.status === "download";
      }
    } finally {
      saveRequestsRef.current -= 1;
      setCloseBusy(false);
    }
    if (!success) return;
    // Recheck EVERY original document after the LAST asynchronous write, including
    // documents saved earlier and documents that were initially clean.
    if (!closeSnapshotMatches(snapshots, request.window, request.ids)) {
      showToast("保存中に変更されました。閉じずに内容を確認してください。");
      return;
    }
    if (pendingSharingRef.current().some((id) => request.window || request.ids.includes(id))) {
      showToast(
        "共同編集の未送信操作が残っています。同期を確認するか、明示的に破棄して閉じてください。",
      );
      return;
    }
    if (downloaded) {
      downloadedCloseSnapshots.current = snapshots;
      setCloseRequest({ ...request, downloaded: true });
      return;
    }
    await completeCloseRequest(request);
  };

  useEffect(() => {
    const checkpoint = checkpointsRef.current.get(workspace.activeId);
    if (!checkpoint) return;
    const dirty = !sameSaveContent(sheet.rows, sheet.meta, checkpoint);
    if (dirty !== sheet.meta.dirty) sheet.setMeta({ dirty });
  }, [sheet.rows, sheet.meta, workspace.activeId]);

  const visibleRows = useMemo(
    () => filter.getVisibleRows(sheet.rows, view.useHeaderRow),
    [filter, sheet.rows, view.useHeaderRow],
  );
  const formulaEvaluation = useMemo(
    () => evaluateFormulaSheet(sheet.rows, { enabled: view.formulaEnabled }),
    [sheet.rows, view.formulaEnabled],
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
    if (missing && (point.row !== first || range !== null)) {
      selectionState.setSelection({ row: first, col: point.col });
      setSelectedRows([]);
      setSelectedColumns([]);
    }
  }, [rowSourceIndexes]);
  const visibleMapRef = useRef(rowSourceIndexes);
  visibleMapRef.current = rowSourceIndexes;
  const visibleSet = useMemo(
    () => (rowSourceIndexes ? new Set(rowSourceIndexes) : null),
    [rowSourceIndexes],
  );

  const compiledSearch = useMemo(() => compileSearch(query, searchOptions), [query, searchOptions]);
  const inSearchScope = useCallback(
    (row: number, col: number) =>
      searchScope === "sheet" ||
      (searchScope === "visible"
        ? !visibleSet || visibleSet.has(row)
        : searchSelection?.documentId === workspace.activeId &&
          searchSelection.cells.has(`${row}:${col}`)),
    [searchScope, visibleSet, searchSelection, workspace.activeId],
  );
  const searchResult = useMemo(
    () => collectSearchMatches(sheet.rows, compiledSearch.matcher, null, inSearchScope),
    [sheet.rows, compiledSearch, inSearchScope],
  );
  const changeSearchScope = (scope: "sheet" | "visible" | "selection") => {
    if (scope === "selection") {
      const range = normalizeRange(selectionToRange(selectionRef.current, rangeRef.current));
      const indexes = selectionIndexes(
        rowsRef.current,
        range,
        visibleMapRef.current,
        selectedRowsRef.current,
        selectedColumnsRef.current,
      );
      const cells = new Set(indexes.rows.flatMap((r) => indexes.columns.map((c) => `${r}:${c}`)));
      setSearchSelection({
        documentId: activeDocumentIdRef.current,
        cells,
        label: `${referenceForSelection(selectionRef.current, rangeRef.current)} (${cells.size} cells)`,
      });
    }
    setSearchScope(scope);
    setActiveSearchIndex(0);
  };
  const openSearch = () => {
    if (!finishPendingEdit()) return;
    setSearchOpen(true);
    setSearchFocusNonce((n) => n + 1);
  };
  const invalidateSearchScope = () => {
    setSearchSelection(null);
    if (searchScope === "selection")
      showToast("選択範囲を再設定してください / Reset search selection");
  };

  const searchHits = searchResult.hits;
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

  useEffect(() => {
    if (!collaboration.client) return;
    const report = validateDocument(sheet.rows, rules);
    setValidationReport(report.totalIssues || report.ruleErrors.length ? report : null);
  }, [sheet.rows, rules, collaboration.client]);

  const currentValue =
    sheet.rows[selectionState.selection.row]?.[selectionState.selection.col] ?? "";
  const selectedReference = referenceForSelection(selectionState.selection, selectionState.range);

  const recordBeforeChange = useCallback(
    (columnChanges?: ValidationColumnChange[]) => {
      if (collaboration.client) return;
      history.record(sheet.rows, selectionState.selection, {
        range: selectionState.range,
        colWidths: sheet.colWidths,
        selectedRows,
        selectedColumns,
        ...validationHistoryBefore(rules, columnChanges),
      });
    },
    [
      history,
      selectionState.selection,
      selectionState.range,
      sheet.rows,
      sheet.colWidths,
      selectedRows,
      selectedColumns,
      collaboration.client,
      rules,
    ],
  );

  const validateNext = (
    next: CellValue[][],
    nextRules = rules,
    allCells = false,
    beforeRows = sheet.rows,
    newlyApplicableRules: readonly { row: number; ruleId: string }[] = [],
  ) => {
    if (collaboration.readOnly) {
      showToast("閲覧専用または権限失効 / Read-only sharing session");
      return false;
    }
    const report = validateMutation(
      allCells ? [] : beforeRows,
      next,
      nextRules,
      undefined,
      newlyApplicableRules,
    );
    setValidationReport(report.totalIssues || report.ruleErrors.length ? report : null);
    if (!report.allowed) {
      showToast("入力ルールにより操作全体を拒否しました / Entire change rejected by validation");
      return false;
    }
    return true;
  };

  const recoveryTimers = useRef(new Map<string, number>());
  const recoveryObserved = useRef(new Map<string, SaveSnapshot>());
  const cancelRecoverySnapshots = (ids?: string[]) => {
    for (const [id, timer] of recoveryTimers.current) {
      if (!ids || ids.includes(id)) {
        window.clearTimeout(timer);
        recoveryTimers.current.delete(id);
      }
    }
  };
  useEffect(() => {
    if (!recoveryState?.enabled) {
      cancelRecoverySnapshots();
      recoveryObserved.current.clear();
      return;
    }
    for (const document of workspace.documents) {
      const rows = document.id === workspace.activeId ? sheet.rows : document.rows;
      const meta = document.id === workspace.activeId ? sheet.meta : document.meta;
      if (!meta.dirty) continue;
      const previous = recoveryObserved.current.get(document.id);
      if (previous && sameSaveContent(rows, meta, previous)) continue;
      const snapshot = { documentId: document.id, rows, meta: { ...meta } };
      recoveryObserved.current.set(document.id, snapshot);
      const previousTimer = recoveryTimers.current.get(document.id);
      if (previousTimer !== undefined) window.clearTimeout(previousTimer);
      const timer = window.setTimeout(() => {
        recoveryTimers.current.delete(document.id);
        const result = recoveryStore.writeSnapshot(snapshot);
        if (!result.ok) setRecoveryError(result.error);
        else {
          setRecoveryError(null);
          const current = recoveryStore.inspect();
          if (current.ok) setRecoveryState(current.value);
        }
      }, 1000);
      recoveryTimers.current.set(document.id, timer);
    }
  }, [
    sheet.rows,
    sheet.meta,
    workspace.documents,
    workspace.activeId,
    recoveryState?.enabled,
    recoveryStore,
  ]);
  useEffect(
    () => () => {
      for (const timer of recoveryTimers.current.values()) window.clearTimeout(timer);
    },
    [],
  );

  const replaceRowsFromHistory = (entry: HistoryEntry) => {
    invalidateSearchScope();
    sheet.restoreState(
      entry.rows,
      { ...sheet.meta, dirty: true },
      entry.colWidths ?? sheet.colWidths,
    );
    selectionState.setSelectionRange(entry.selection, entry.range ?? null);
    setSelectedRows(entry.selectedRows ?? []);
    setSelectedColumns(entry.selectedColumns ?? []);
    if (entry.validationChanges)
      setRulesById((current) => ({
        ...current,
        [workspace.activeId]: restoreValidationHistory(current[workspace.activeId] ?? [], entry),
      }));
  };

  const getEditIdentity = (row: number, col: number): CellEditIdentity | undefined => {
    const document = collaboration.client?.getDocument();
    if (!document) return undefined;
    const rowId = activeIds(document, "row")[row];
    const columnId = activeIds(document, "column")[col];
    return rowId && columnId ? { documentId: workspace.activeId, rowId, columnId } : undefined;
  };
  const resolveEditTarget = (
    row: number,
    col: number,
    identity?: CellEditIdentity,
  ): Selection | null => {
    if (!identity) return { row, col };
    const document = collaboration.client?.getDocument();
    if (!document || identity.documentId !== workspace.activeId) return null;
    const target = {
      row: activeIds(document, "row").indexOf(identity.rowId),
      col: activeIds(document, "column").indexOf(identity.columnId),
    };
    if (target.row < 0 || target.col < 0) {
      showToast(
        "編集中のセルが削除されました。変更は適用していません / Edited cell was deleted; draft not applied",
      );
      return null;
    }
    return target;
  };
  const commitCell = (
    row: number,
    col: number,
    value: string,
    reselect: boolean,
    identity?: CellEditIdentity,
  ) => {
    const target = resolveEditTarget(row, col, identity);
    if (!target) return;
    ({ row, col } = target);
    if (
      !Number.isInteger(row) ||
      !Number.isInteger(col) ||
      row < 0 ||
      col < 0 ||
      row >= MAX_GRID_ROWS ||
      col >= MAX_GRID_COLS
    )
      return;
    const previousValue = sheet.rows[row]?.[col] ?? "";
    if (previousValue !== value) {
      const next = cloneRows(sheet.rows);
      while (next.length <= row) next.push([]);
      while (next[row].length <= col) next[row].push("");
      next[row][col] = value;
      if (!validateNext(next)) return;
      recordBeforeChange();
      replaceRows(next, true, false);
    }
    if (reselect) {
      selectionState.selectCell(row, col, false);
    }
  };

  const editCell = (row: number, col: number, value: string, identity?: CellEditIdentity) => {
    const target = resolveEditTarget(row, col, identity);
    if (!target) return;
    ({ row, col } = target);
    if (
      workspace.activeId !== activeDocumentIdRef.current ||
      row < 0 ||
      col < 0 ||
      row >= MAX_GRID_ROWS ||
      col >= MAX_GRID_COLS
    )
      return;
    const previousValue = sheet.rows[row]?.[col] ?? "";
    if (previousValue !== value) {
      const next = cloneRows(sheet.rows);
      while (next.length <= row) next.push([]);
      while (next[row].length <= col) next[row].push("");
      next[row][col] = value;
      if (!validateNext(next)) return;
      recordBeforeChange();
      replaceRows(next, true, false);
    }
  };

  const copySelection = async (overrideRange?: Exclude<Range, null>) => {
    const selected =
      overrideRange ?? selectionToRange(selectionState.selection, selectionState.range);
    const normalized = normalizeRange(selected);
    const rowCount = rowSourceIndexes
      ? rowSourceIndexes.filter((r) => r >= normalized.startRow && r <= normalized.endRow).length
      : (overrideRange ? 0 : selectedRows.length) || normalized.endRow - normalized.startRow + 1;
    const colCount =
      (overrideRange ? 0 : selectedColumns.length) || normalized.endCol - normalized.startCol + 1;
    if (rowCount * colCount > 500_000) {
      showToast("コピーは50万セルまで / Copy limit: 500,000 cells");
      return false;
    }
    const indexes = {
      rows: rowSourceIndexes
        ? rowSourceIndexes.filter(
            (r) =>
              r >= normalized.startRow &&
              r <= normalized.endRow &&
              (overrideRange || !selectedRows.length || selectedRows.includes(r)),
          )
        : !overrideRange && selectedRows.length
          ? selectedRows
          : Array.from({ length: rowCount }, (_, n) => normalized.startRow + n),
      columns:
        !overrideRange && selectedColumns.length
          ? selectedColumns
          : Array.from({ length: colCount }, (_, n) => normalized.startCol + n),
    };
    if (indexes.rows.length === 0 || indexes.columns.length === 0) return false;
    const snapshot = createClipboardSnapshot(
      indexes.rows.map((row) => indexes.columns.map((col) => sheet.rows[row]?.[col] ?? "")),
      {
        startCol: 0,
        endCol: indexes.columns.length - 1,
        startRow: 0,
        endRow: indexes.rows.length - 1,
      },
    );
    if (!navigator.clipboard) {
      showToast(t("toastClipboardUnavailable"));
      return false;
    }
    try {
      await navigator.clipboard.writeText(snapshot.text);
      clipboardSnapshotRef.current = snapshot;
      copiedOriginRef.current = indexes;
      showToast(
        t("toastCopiedRange", {
          rows: indexes.rows.length,
          cols: indexes.columns.length,
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
    selection: JSON.stringify([
      selectionRef.current,
      rangeRef.current,
      selectedRowsRef.current,
      selectedColumnsRef.current,
    ]),
    visible: visibleMapRef.current,
  });
  const clipboardContextValid = (context: ReturnType<typeof clipboardContext>) =>
    context.documentId === activeDocumentIdRef.current &&
    context.rows === rowsRef.current &&
    context.selection ===
      JSON.stringify([
        selectionRef.current,
        rangeRef.current,
        selectedRowsRef.current,
        selectedColumnsRef.current,
      ]) &&
    context.visible === visibleMapRef.current;

  const clearSelectedCells = (overrideRange?: Exclude<Range, null>) => {
    const selected =
      overrideRange ?? selectionToRange(selectionState.selection, selectionState.range);
    const next = clearVisibleRange(
      sheet.rows,
      selected,
      rowSourceIndexes,
      overrideRange ? [] : selectedRows,
      overrideRange ? [] : selectedColumns,
    );
    if (sameRows(sheet.rows, next)) return;
    if (!validateNext(next)) return;
    recordBeforeChange();
    replaceRows(next, true, false);
  };

  const cutSelection = async (overrideRange?: Exclude<Range, null>) => {
    const context = clipboardContext();
    if (!(await copySelection(overrideRange))) return;
    if (!clipboardContextValid(context)) {
      showToast(t("clipboardContextChanged"));
      return;
    }
    clearSelectedCells(overrideRange);
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
      if (!validateNext(pasted.rows)) return;
      recordBeforeChange();
      replaceRows(pasted.rows, true, false);
    }
    selectionState.selectRange(pasted.range);
    setSelectedRows([]);
    setSelectedColumns([]);
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
      let text: string;
      if (navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        const plain = items.find((item) => item.types.includes("text/plain"));
        const html = items.find((item) => item.types.includes("text/html"));
        if (!plain) {
          if (html) {
            const data = await (await html.getType("text/html")).text();
            if (!clipboardContextValid(context)) {
              showToast(t("clipboardContextChanged"));
              return;
            }
            const grid = clipboardHtmlRows(data);
            if (grid) pasteGrid(row, col, grid);
            else showToast("貼り付け可能な表がありません / No supported clipboard table");
          } else showToast("貼り付け可能な文字列がありません / No clipboard text");
          return;
        }
        text = await (await plain.getType("text/plain")).text();
      } else text = await navigator.clipboard.readText();
      if (!clipboardContextValid(context)) {
        showToast(t("clipboardContextChanged"));
        return;
      }
      acceptClipboardText(text, row, col, context);
    } catch {
      showToast(t("toastClipboardUnavailable"));
    }
  };

  const acceptClipboardText = (
    text: string,
    row = normalizeRange(selectionToRange(selectionRef.current, rangeRef.current)).startRow,
    col = normalizeRange(selectionToRange(selectionRef.current, rangeRef.current)).startCol,
    context = clipboardContext(),
  ) => {
    const apply = (format: ClipboardFormat = "auto") => {
      if (!clipboardContextValid(context)) {
        showToast(t("clipboardContextChanged"));
        return;
      }
      let grid = resolveClipboardText(text, clipboardSnapshotRef.current ?? undefined, format);
      if (
        view.formulaEnabled &&
        clipboardSnapshotRef.current?.text === text &&
        copiedOriginRef.current
      ) {
        const origin = copiedOriginRef.current;
        const offset = rowSourceIndexes?.indexOf(row) ?? row;
        grid = grid.map((values, r) =>
          values.map((value, c) =>
            translateFormula(value, {
              rowDelta: (rowSourceIndexes?.[offset + r] ?? row + r) - origin.rows[r],
              colDelta: col + c - origin.columns[c],
            }),
          ),
        );
      }
      pasteGrid(row, col, grid);
    };
    if (clipboardSnapshotRef.current?.text !== text && clipboardNeedsFormatChoice(text)) {
      setPasteFormat("single-column");
      setPastePreview({ text, apply });
    } else apply();
  };

  const applyUpdates = (
    updates: { row: number; col: number; value: string; identity?: CellEditIdentity }[],
  ) => {
    const resolved = updates.map((update) => {
      const target = resolveEditTarget(update.row, update.col, update.identity);
      return target ? { ...update, ...target } : null;
    });
    if (resolved.some((update) => !update)) return;
    updates = resolved as typeof updates;
    if (
      workspace.activeId !== activeDocumentIdRef.current ||
      sheet.rows !== rowsRef.current ||
      rowSourceIndexes !== visibleMapRef.current
    ) {
      showToast(t("clipboardContextChanged"));
      return;
    }
    if (!updates.length || updates.some((u) => u.row < 0 || (visibleSet && !visibleSet.has(u.row))))
      return;
    if (updates.every((u) => (sheet.rows[u.row]?.[u.col] ?? "") === u.value)) return;
    const next = cloneRows(sheet.rows);
    for (const u of updates) {
      while (next.length <= u.row) next.push([]);
      while (next[u.row].length <= u.col) next[u.row].push("");
      next[u.row][u.col] = u.value;
    }
    if (!validateNext(next)) return;
    recordBeforeChange();
    replaceRows(next, true, false);
  };

  const previewUpdates = (updates: { row: number; col: number; value: string }[]) => {
    const context = clipboardContext();
    setPendingPreview({
      title: "連番の確認 / Fill series",
      detail:
        `元のセルは変更しません。${updates.length} cells. 数値は正確な10進数、同じ接頭語の番号は連番、日付風・不明な文字列はコピーします。\n` +
        updates
          .slice(0, 12)
          .map(
            (u) =>
              `${columnName(u.col)}${u.row + 1}: ${sheet.rows[u.row]?.[u.col] ?? ""} → ${u.value}`,
          )
          .join("\n"),
      apply: () => {
        if (!clipboardContextValid(context)) {
          showToast(t("clipboardContextChanged"));
          return;
        }
        applyUpdates(updates);
      },
    });
  };

  const openContextMenu = (
    kind: ContextMenuKind,
    row: number,
    col: number,
    x: number,
    y: number,
    preserveSelection = false,
  ) => {
    const selected = normalizeRange(
      selectionToRange(selectionState.selection, selectionState.range),
    );
    const inside =
      row >= selected.startRow &&
      row <= selected.endRow &&
      col >= selected.startCol &&
      col <= selected.endCol &&
      (selectedRows.length === 0 || selectedRows.includes(row)) &&
      (selectedColumns.length === 0 || selectedColumns.includes(col));
    if (kind === "cell" && !inside && !preserveSelection) {
      selectionState.selectCell(row, col, false);
      setSelectedRows([]);
      setSelectedColumns([]);
    }
    if (kind === "column" && !preserveSelection) {
      setSelectedRows([]);
      setSelectedColumns([col]);
      selectionState.setSelectionRange(
        { row: rowSourceIndexes?.[0] ?? 0, col },
        {
          startRow: rowSourceIndexes?.[0] ?? 0,
          startCol: col,
          endRow: rowSourceIndexes?.at(-1) ?? Math.max(0, sheet.rows.length - 1),
          endCol: col,
        },
      );
    }
    if (kind === "row" && !preserveSelection) {
      setSelectedRows([row]);
      setSelectedColumns([]);
      selectionState.selectRow(row, sheet.columnCount);
    }
    setContextMenu({ kind, row, col, x, y, preserveSelection });
  };

  const rangeFromContextMenu = (): Exclude<Range, null> | null => {
    if (!contextMenu || contextMenu.preserveSelection) {
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
    // Cell menus act on the exact current selection, including header-selection gaps.
    return null;
  };

  const ensureRowOpsAllowed = (): boolean => {
    if (collaboration.readOnly) {
      showToast("閲覧専用 / Read-only");
      return false;
    }
    if (filter.hasFilters) {
      showToast(t("toastFilterBlocksRowOps"));
      return false;
    }
    return true;
  };

  const rowsToInsert = selectedRows.length > 0 ? selectedRows.length : 1;
  const colsToInsert = selectedColumns.length > 0 ? selectedColumns.length : 1;

  const insertRow = (offset: 0 | 1) => {
    if (!ensureRowOpsAllowed()) return;
    const base = contextMenu?.row ?? selectionState.selection.row;
    const index = Math.max(0, Math.min(base + offset, sheet.rows.length));
    if (sheet.rows.length + rowsToInsert > MAX_GRID_ROWS) return;
    let next = cloneRows(sheet.rows);
    next.splice(
      index,
      0,
      ...Array.from({ length: rowsToInsert }, () =>
        Array.from({ length: Math.max(1, sheet.columnCount) }, () => ""),
      ),
    );
    const comparison: CellValue[][] = [];
    sheet.rows.forEach((row, source) => {
      comparison[source < index ? source : source + rowsToInsert] = row;
    });
    const newlyApplicable =
      index === 0
        ? rules
            .filter((rule) => rule.skipHeader)
            .map((rule) => ({ row: rowsToInsert, ruleId: rule.id }))
        : [];
    if (view.formulaEnabled)
      next = rewriteFormulasForStructure(next, {
        type: "insert",
        axis: "row",
        index,
        count: rowsToInsert,
      });
    if (!validateNext(next, rules, false, comparison, newlyApplicable)) return;
    if (collaboration.client) {
      collaboration.structure(
        insertAxisActions(collaboration.client.getDocument()!, "row", index, rowsToInsert),
        view.formulaEnabled ? () => next : undefined,
      );
    } else {
      recordBeforeChange();
      replaceRows(next, true, false);
    }
    invalidateSearchScope();
  };
  const insertColumn = (offset: 0 | 1) => {
    if (!ensureRowOpsAllowed()) return;
    const base = contextMenu?.col ?? selectionState.selection.col;
    const index = Math.max(0, Math.min(base + offset, sheet.columnCount));
    if (sheet.columnCount + colsToInsert > MAX_GRID_COLS) return;
    let next = sheet.rows.map((row) => {
      const copy = [...row];
      while (copy.length < index) copy.push("");
      copy.splice(index, 0, ...Array.from({ length: colsToInsert }, () => ""));
      return copy;
    });
    const comparison = cloneRows(next);
    if (view.formulaEnabled)
      next = rewriteFormulasForStructure(next, {
        type: "insert",
        axis: "col",
        index,
        count: colsToInsert,
      });
    const nextRules = rules.map((rule) => ({
      ...rule,
      column: rule.column >= index ? rule.column + colsToInsert : rule.column,
    }));
    if (!validateNext(next, nextRules, false, comparison)) return;
    if (collaboration.client) {
      if (
        !collaboration.structure(
          insertAxisActions(collaboration.client.getDocument()!, "column", index, colsToInsert),
          view.formulaEnabled ? () => next : undefined,
        )
      )
        return;
    } else {
      recordBeforeChange([{ type: "insert", index, count: colsToInsert }]);
      sheet.insertColumns(index, colsToInsert);
      replaceRows(next, true, false);
    }
    setRulesById((current) => ({ ...current, [workspace.activeId]: nextRules }));
    invalidateSearchScope();
  };
  const deleteRowWithConfirm = () => {
    if (!ensureRowOpsAllowed()) return;
    const documentId = activeDocumentIdRef.current;
    const rows = rowsRef.current;
    const indexes = [
      ...new Set(
        selectedRows.length ? selectedRows : [contextMenu?.row ?? selectionState.selection.row],
      ),
    ]
      .filter((index) => index >= 0 && index < rows.length)
      .sort((a, b) => b - a);
    setPendingConfirm({
      action: () => {
        if (documentId !== activeDocumentIdRef.current || rows !== rowsRef.current) {
          showToast(t("clipboardContextChanged"));
          return;
        }
        let next = cloneRows(rows);
        for (const index of indexes) {
          next.splice(index, 1);
          if (view.formulaEnabled)
            next = rewriteFormulasForStructure(next, {
              type: "delete",
              axis: "row",
              index,
              count: 1,
            });
        }
        if (!next.length && !collaboration.client) next = [[""]];
        const comparison = rows.filter((_, row) => !indexes.includes(row));
        if (!validateNext(next, rules, false, comparison)) return;
        if (collaboration.client)
          collaboration.structure(
            deleteAxisActions(collaboration.client.getDocument()!, "row", indexes),
            view.formulaEnabled ? () => next : undefined,
          );
        else {
          recordBeforeChange();
          replaceRows(next, true, false);
        }
        invalidateSearchScope();
        selectionState.selectCell(
          Math.max(0, Math.min(...indexes) - 1),
          selectionState.selection.col,
          false,
        );
        setSelectedRows([]);
      },
    });
  };
  const deleteColumnWithConfirm = () => {
    if (!ensureRowOpsAllowed()) return;
    const documentId = activeDocumentIdRef.current;
    const rows = rowsRef.current;
    const indexes = [
      ...new Set(
        selectedColumns.length
          ? selectedColumns
          : [contextMenu?.col ?? selectionState.selection.col],
      ),
    ]
      .filter((index) => index >= 0 && index < sheet.columnCount)
      .sort((a, b) => b - a);
    setPendingConfirm({
      action: () => {
        if (documentId !== activeDocumentIdRef.current || rows !== rowsRef.current) {
          showToast(t("clipboardContextChanged"));
          return;
        }
        let next = cloneRows(rows);
        for (const index of indexes) {
          next = next.map((row) => row.filter((_, col) => col !== index));
          if (view.formulaEnabled)
            next = rewriteFormulasForStructure(next, {
              type: "delete",
              axis: "col",
              index,
              count: 1,
            });
        }
        const nextRules = rules
          .filter((rule) => !indexes.includes(rule.column))
          .map((rule) => ({
            ...rule,
            column: rule.column - indexes.filter((index) => index < rule.column).length,
          }));
        const comparison = rows.map((row) => row.filter((_, col) => !indexes.includes(col)));
        if (!validateNext(next, nextRules, false, comparison)) return;
        if (collaboration.client) {
          if (
            !collaboration.structure(
              deleteAxisActions(collaboration.client.getDocument()!, "column", indexes),
              view.formulaEnabled ? () => next : undefined,
            )
          )
            return;
        } else {
          recordBeforeChange([{ type: "delete", indexes }]);
          sheet.deleteColumns(indexes);
          replaceRows(next, true, false);
        }
        setRulesById((current) => ({ ...current, [workspace.activeId]: nextRules }));
        invalidateSearchScope();
        selectionState.selectCell(
          selectionState.selection.row,
          Math.max(0, Math.min(...indexes) - 1),
          false,
        );
        setSelectedColumns([]);
      },
    });
  };

  const applySortedRows = (sorted: CellValue[][]) => {
    const comparison = [...sorted];
    let newlyApplicable: { row: number; ruleId: string }[] = [];
    if (rules.some((rule) => rule.skipHeader) && !view.useHeaderRow) {
      const oldFirst = JSON.stringify(sheet.rows[0]);
      const movedFirst = sorted.findIndex((row) => JSON.stringify(row) === oldFirst);
      if (movedFirst > 0)
        newlyApplicable = rules
          .filter((rule) => rule.skipHeader)
          .map((rule) => ({ row: movedFirst, ruleId: rule.id }));
    }
    if (!validateNext(sorted, rules, false, comparison, newlyApplicable)) return;
    if (collaboration.client) {
      const doc = collaboration.client.getDocument()!;
      const raw = sharedDocumentRows(doc);
      const ids = activeIds(doc, "row");
      const pools = new Map<string, string[]>();
      raw.forEach((row, i) => {
        const key = JSON.stringify(row);
        pools.set(key, [...(pools.get(key) ?? []), ids[i]]);
      });
      const order = sorted.map((row) => pools.get(JSON.stringify(row))?.shift());
      if (order.some((id) => !id)) {
        showToast("同期後に並べ替えを再確認 / Recheck sort after sync");
        return;
      }
      collaboration.submit([
        { type: "reorder", axis: "row", ids: order as string[], ifRevision: doc.revision },
      ]);
      return;
    }
    recordBeforeChange();
    replaceRows(sorted, true, false);
  };

  const applySort = (col: number, direction: SortDirection) => {
    invalidateSearchScope();
    const sorted = sortRows(sheet.rows, col, direction, {
      headerRow: view.useHeaderRow,
    });
    applySortedRows(sorted);
  };

  const runUndo = () => {
    if (collaboration.client) {
      const client = collaboration.client;
      const state = client.getState();
      const entry = state.snapshot?.history
        .slice()
        .reverse()
        .find(
          (e) =>
            e.memberId === state.memberId &&
            !e.undoOf &&
            !state.snapshot?.history.some((u) => u.undoOf === e.id),
        );
      if (entry) void client.undo(entry.id).catch((error) => showToast(String(error)));
      return;
    }
    const target = history.snapshot().undo.at(-1);
    const ruleError = validationHistoryError(rules, target);
    if (ruleError) {
      showToast(ruleError);
      return;
    }
    const previous = history.undo({
      rows: sheet.rows,
      selection: selectionState.selection,
      range: selectionState.range,
      colWidths: sheet.colWidths,
      selectedRows,
      selectedColumns,
      ...validationHistoryBefore(rules, target?.validationChanges),
    });
    if (previous) {
      replaceRowsFromHistory(previous);
    }
  };

  const runRedo = () => {
    if (collaboration.client) {
      openSharing();
      showToast("共有履歴から戻す内容を選んでください / Choose a shared history entry");
      return;
    }
    const target = history.snapshot().redo.at(-1);
    const ruleError = validationHistoryError(rules, target);
    if (ruleError) {
      showToast(ruleError);
      return;
    }
    const next = history.redo({
      rows: sheet.rows,
      selection: selectionState.selection,
      range: selectionState.range,
      colWidths: sheet.colWidths,
      selectedRows,
      selectedColumns,
      ...validationHistoryBefore(rules, target?.validationChanges),
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
    const matcher = compiledSearch.matcher;
    if (!matcher) {
      return;
    }
    const singleShot = new RegExp(matcher.source, matcher.flags.replace("g", ""));
    const previous = sheet.rows[hit.row]?.[hit.col] ?? "";
    const replaced = replaceSearchValue(
      previous,
      singleShot,
      replacement,
      Boolean(searchOptions.regex && searchOptions.groups),
      true,
    );
    if (replaced === previous) {
      return;
    }
    const next = cloneRows(sheet.rows);
    next[hit.row][hit.col] = replaced;
    if (!validateNext(next)) return;
    recordBeforeChange();
    replaceRows(next, true, false);
    setSearchScrollNonce((nonce) => nonce + 1);
  };

  const replaceAll = () => {
    const matcher = compiledSearch.matcher;
    if (!matcher) {
      return;
    }
    let count = 0;
    const next = sheet.rows.map((row, r) =>
      row.map((cell, c) => {
        if (!inSearchScope(r, c)) return cell;
        const value = replaceSearchValue(
          cell,
          matcher,
          replacement,
          Boolean(searchOptions.regex && searchOptions.groups),
        );
        if (value !== cell) count += 1;
        return value;
      }),
    );
    if (!count) {
      showToast(t("toastSearchDone", { count }));
      return;
    }
    const context = clipboardContext();
    setPendingPreview({
      title: "全置換の確認 / Replace all preview",
      detail:
        `${count} cells. ${searchScope === "sheet" ? "非表示行も含む / Includes hidden rows" : "指定範囲のみ / Scoped cells"}\n` +
        sheet.rows
          .flatMap((row, r) =>
            row.flatMap((v, c) =>
              next[r][c] !== v ? [`${columnName(c)}${r + 1}: ${v} → ${next[r][c]}`] : [],
            ),
          )
          .slice(0, 20)
          .join("\n"),
      apply: () => {
        if (!clipboardContextValid(context)) {
          showToast(t("clipboardContextChanged"));
          return;
        }
        if (!validateNext(next)) return;
        recordBeforeChange();
        replaceRows(next, true, false);
        showToast(t("toastSearchDone", { count }));
      },
    });
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
    setSelectedRows([]);
    setSelectedColumns([]);
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

  const targetName = sheet.meta.fileName ?? "untitled";
  const activeNamedView = namedViewStore
    .document(workspace.activeId, targetName)
    .views.find((v) => v.id === activeViewById[workspace.activeId]);
  const namedViewModified = activeNamedView
    ? !viewMatchesCurrent(activeNamedView, filter.filters, sheet.colWidths)
    : false;
  const commands: Command[] = [
    { id: "new", label: "新規 / New", aliases: "blank", run: newFile },
    {
      id: "open",
      label: "開く / Open",
      aliases: "import 読込",
      run: () => {
        if (finishPendingEdit()) void file.openFile();
      },
    },
    {
      id: "save",
      label: "保存 / Save",
      aliases: "download export",
      disabled: file.saving ? "保存中 / Saving" : undefined,
      run: () => requestSave(),
    },
    {
      id: "saveAs",
      label: "別名保存 / Save As",
      aliases: "download export copy",
      disabled: file.saving ? "保存中 / Saving" : undefined,
      run: () => requestSave(true),
    },
    { id: "find", label: "検索 / Find", aliases: "search 探す", run: openSearch },
    { id: "replace", label: "置換 / Replace", aliases: "search replace", run: openSearch },
    {
      id: "undo",
      label: "元に戻す / Undo",
      aliases: "undo",
      disabled: !canUndo ? "履歴なし / No history" : undefined,
      run: runUndo,
    },
    {
      id: "redo",
      label: "やり直す / Redo",
      aliases: "redo",
      disabled: !canRedo ? "履歴なし / No history" : undefined,
      run: runRedo,
    },
    { id: "copy", label: "コピー / Copy", aliases: "clipboard", run: () => void copySelection() },
    {
      id: "insertRow",
      label: "行挿入 / Insert row",
      aliases: "add row",
      disabled: filter.hasFilters ? t("toastFilterBlocksRowOps") : undefined,
      run: () => insertRow(1),
    },
    {
      id: "insertColumn",
      label: "列挿入 / Insert column",
      aliases: "add column",
      disabled: filter.hasFilters ? t("toastFilterBlocksRowOps") : undefined,
      run: () => insertColumn(1),
    },
    {
      id: "deleteRow",
      label: "行削除 / Delete row",
      aliases: "remove row",
      disabled: filter.hasFilters ? t("toastFilterBlocksRowOps") : undefined,
      run: deleteRowWithConfirm,
    },
    {
      id: "deleteColumn",
      label: "列削除 / Delete column",
      aliases: "remove column",
      disabled: filter.hasFilters ? t("toastFilterBlocksRowOps") : undefined,
      run: deleteColumnWithConfirm,
    },
    {
      id: "autoFit",
      label: "幅を自動調整 / Auto fit width",
      aliases: "列幅 column width",
      run: () => sheet.autoFitColumns(),
    },
    {
      id: "clearFilter",
      label: "絞込み解除 / Clear filters",
      aliases: "filter all",
      disabled: !filter.hasFilters ? "絞込みなし / No filters" : undefined,
      run: filter.clearAll,
    },
    {
      id: "columnMenu",
      label: "列の操作 / Column actions",
      aliases: "filter sort menu",
      run: () =>
        openContextMenu(
          "column",
          selectionState.selection.row,
          selectionState.selection.col,
          20,
          120,
          true,
        ),
    },
    {
      id: "settings",
      label: "設定 / Settings",
      aliases: "preferences",
      run: () => setSettingsOpen(true),
    },
    { id: "help", label: "ヘルプ / Help", aliases: "shortcuts", run: () => setHelpOpen(true) },
  ].map((c) => ({ ...c, target: `${targetName}: ${selectedReference}` })) as Command[];

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target;
    const editingText =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement;

    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const command = shortcutCommand(event.nativeEvent);
    if (
      command &&
      (!editingText || ["open", "save", "saveAs", "find", "replace", "commands"].includes(command))
    ) {
      event.preventDefault();
      if (command === "commands") setCommandOpen(true);
      else dispatchCommand(commands, command);
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
    () => (view.useHeaderRow ? sheet.rows.slice(1) : sheet.rows),
    [view.useHeaderRow, sheet.rows],
  );
  const columnFilterSelected = filterPopover
    ? (filter.filters.get(filterPopover.col) ?? null)
    : null;

  return (
    <div className="appShell" onKeyDown={handleKeyDown}>
      <TitleBar
        meta={sheet.meta}
        beforeClose={approveWindowClose}
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
        canUndo={canUndo}
        canRedo={canRedo}
        onNew={() => dispatchCommand(commands, "new")}
        onOpen={() => dispatchCommand(commands, "open")}
        onSave={() => dispatchCommand(commands, "save")}
        onSaveAs={() => dispatchCommand(commands, "saveAs")}
        onSearch={() => dispatchCommand(commands, "find")}
        onUndo={() => dispatchCommand(commands, "undo")}
        onRedo={() => dispatchCommand(commands, "redo")}
        onInsertRow={() => dispatchCommand(commands, "insertRow")}
        onInsertColumn={() => dispatchCommand(commands, "insertColumn")}
        onDeleteRow={() => dispatchCommand(commands, "deleteRow")}
        onDeleteColumn={() => dispatchCommand(commands, "deleteColumn")}
        onAutoFit={() => dispatchCommand(commands, "autoFit")}
        onCopy={() => dispatchCommand(commands, "copy")}
        onSettings={() => dispatchCommand(commands, "settings")}
        onHelp={() => dispatchCommand(commands, "help")}
      />
      <div className="featureBar">
        <button onClick={() => setCommandOpen(true)}>操作を探す / Commands</button>
        <button onClick={() => dispatchCommand(commands, "columnMenu")}>
          列の操作 / Column actions
        </button>
        <button onClick={() => setNamedViewsOpen(true)}>表示を保存・切替 / Named views</button>
        {activeNamedView && (
          <span role="status">
            表示: {activeNamedView.name}
            {namedViewModified ? "（変更あり / modified）" : ""} · {filter.filters.size}条件 ·{" "}
            {Math.max(0, displayRows.length - (view.useHeaderRow && displayRows.length ? 1 : 0))}行
          </span>
        )}
        <label>
          先頭行 / First row{" "}
          <select
            value={view.useHeaderRow ? "header" : "data"}
            disabled={sheet.meta.format === "json" || sheet.meta.format === "yaml"}
            onChange={(e) => setView((v) => ({ ...v, useHeaderRow: e.target.value === "header" }))}
          >
            <option value="header">見出し / Header</option>
            <option value="data">データ / Data</option>
          </select>
        </label>
        <label>
          固定行 / Frozen rows{" "}
          <input
            aria-label="固定行 / Frozen rows"
            type="number"
            min={0}
            max={10}
            value={view.freezeRows}
            onChange={(e) =>
              setView((v) => ({
                ...v,
                freezeRows: Math.max(0, Math.min(10, Number(e.target.value) || 0)),
              }))
            }
          />
        </label>
        <button
          onClick={() =>
            setView((v) => ({ ...v, freezeRows: Math.min(10, selectionState.selection.row + 1) }))
          }
        >
          選択行まで固定 / Freeze to row
        </button>
        <button onClick={() => setView((v) => ({ ...v, freezeRows: 0 }))}>
          行固定解除 / Unfreeze rows
        </button>
        <button
          onClick={() => {
            if (finishPendingEdit()) {
              setSortKeys((keys) => {
                const valid = keys.filter(
                  (key) => key.colIndex >= 0 && key.colIndex < sheet.columnCount,
                );
                return valid.length ? valid : [{ colIndex: 0, direction: "asc", mode: "auto" }];
              });
              setSortOpen(true);
            }
          }}
        >
          詳しく並べ替え / Sort
        </button>
        <button
          onClick={() => {
            if (!finishPendingEdit()) return;
            const indexes = selectionIndexes(
              sheet.rows,
              selectionToRange(selectionState.selection, selectionState.range),
              rowSourceIndexes,
              selectedRows,
              selectedColumns,
            );
            setCleanupOpen({
              documentId: workspace.activeId,
              rows: sheet.rows,
              cells: indexes.rows.flatMap((row) => indexes.columns.map((col) => ({ row, col }))),
            });
          }}
        >
          整形 / Cleanup
        </button>
        <button onClick={() => setValidationOpen(true)}>
          入力ルール / Validation ({rules.length})
        </button>
        <button onClick={() => setRecoveryOpen(true)}>
          復元下書き / Recovery: {recoveryError ? "ERROR" : recoveryState?.enabled ? "ON" : "OFF"}
        </button>
        <button
          onClick={() => {
            if (finishPendingEdit()) openSharing();
          }}
        >
          共同編集 / Sharing: {collaboration.state?.status ?? "OFF"}
        </button>
        {collaboration.state && (
          <span role="status">
            {collaboration.state.endpoint} · pending={collaboration.state.pendingCount}{" "}
            {collaboration.readOnly ? "閲覧専用 / Read only" : "編集可能 / Editable"}{" "}
            {collaboration.state.error}
          </span>
        )}
        <label>
          <input
            type="checkbox"
            checked={view.formulaEnabled}
            onChange={(e) => {
              if (finishPendingEdit()) setView((v) => ({ ...v, formulaEnabled: e.target.checked }));
            }}
          />
          数式計算 / Calculate formulas (opt-in)
        </label>
        <button
          disabled={!view.formulaEnabled || file.saving}
          onClick={() => {
            if (!finishPendingEdit()) return;
            const snapshot = {
              documentId: activeDocumentIdRef.current,
              rows: cloneRows(rowsRef.current),
              meta: { ...metaRef.current },
            };
            saveRequestsRef.current += 1;
            void file
              .saveDocument(
                true,
                snapshot,
                exportFormulaRows(snapshot.rows, "values", { enabled: true }),
              )
              .finally(() => {
                saveRequestsRef.current -= 1;
              });
          }}
        >
          計算値を別名書出し / Export values copy
        </button>
        {view.formulaEnabled && (
          <span>
            通常保存は式。計算結果=
            {formulaEvaluation.displayRows[selectionState.selection.row]?.[
              selectionState.selection.col
            ] ?? ""}{" "}
            · errors={formulaEvaluation.errors.length}
            。同一表・算術・比較・SUM/AVERAGE/MIN/MAX/COUNT/IF。並べ替え後もA1は位置参照。
          </span>
        )}
        <label>
          フィル / Fill{" "}
          <select
            value={fillMode}
            onChange={(e) => setFillMode(e.target.value as "copy" | "series")}
          >
            <option value="copy">コピー / Copy</option>
            <option value="series">連番を確認 / Preview series</option>
          </select>
        </label>
      </div>
      <div className="editionNotice" role="status">
        <span>{isTauriRuntime() ? t("appSaveHint") : t("browserSaveHint")}</span>
        {file.saveNotice ? (
          <span className="saveNotice">
            {file.saveNotice}{" "}
            {file.saveTargetId && (
              <button onClick={() => switchTab(file.saveTargetId!)}>対象へ / Open target</button>
            )}
          </span>
        ) : null}
      </div>
      {recoveryError && (
        <p role="status" className="featureError">
          復元下書きは保存できていません: {recoveryError}
        </p>
      )}
      {validationReport && (
        <details className="featureError">
          <summary role="status">
            入力ルール: {validationReport.totalIssues}件、拒否{validationReport.rejectedIssues}件
          </summary>
          <pre>{JSON.stringify(validationReport, null, 2)}</pre>
        </details>
      )}
      <span id="cell-edit-help" className="srOnly">
        {t("editNavigationHelp")}
      </span>
      {filter.hasFilters && (
        <div className="filterBar" role="status">
          <strong>{t("filterActiveLabel")}</strong>
          <span>
            {t("filteredCount", { visible: displayRows.length, total: sheet.rows.length })}
            {view.useHeaderRow ? ` (${t("headerIncluded")})` : ""}
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
      {rules
        .filter(
          (rule) =>
            rule.kind === "enum" &&
            rule.column === selectionState.selection.col &&
            !(rule.skipHeader && selectionState.selection.row === 0),
        )
        .map((rule) => (
          <label key={rule.id}>
            入力候補 / Allowed values ({rule.mode})
            <select
              aria-label="入力候補 / Allowed values"
              disabled={collaboration.readOnly}
              value=""
              onChange={(event) => {
                if (event.target.value !== "")
                  commitCell(
                    selectionState.selection.row,
                    selectionState.selection.col,
                    rule.values?.[Number(event.target.value)] ?? "",
                    false,
                  );
              }}
            >
              <option value="">値を選ぶ / Choose value</option>
              {rule.values?.map((value, index) => (
                <option key={index} value={index}>
                  {value || "(empty)"}
                </option>
              ))}
            </select>
          </label>
        ))}
      <SearchPanel
        focusNonce={searchFocusNonce}
        error={compiledSearch.error}
        scope={searchScope}
        scopeLabel={
          searchScope === "selection"
            ? searchSelection?.documentId === workspace.activeId
              ? searchSelection.label
              : "対象なし。選択を再設定 / No target; reset selection"
            : undefined
        }
        onScopeChange={changeSearchScope}
        filtered={filter.hasFilters}
        open={searchOpen}
        query={query}
        replacement={replacement}
        options={searchOptions}
        current={activeSearchIndex}
        total={searchResult.total}
        navigationTotal={searchHits.length}
        onQueryChange={setQuery}
        onReplacementChange={setReplacement}
        onOptionsChange={setSearchOptions}
        onNext={() => jumpSearch(1)}
        onPrevious={() => jumpSearch(-1)}
        onReplace={replaceCurrent}
        onReplaceAll={replaceAll}
        onClose={() => {
          setSearchOpen(false);
          setFocusCell({ ...selectionRef.current, nonce: Date.now() });
        }}
      />
      {hasData ? (
        <>
          <FormulaBar
            key={`formula-${workspace.activeId}`}
            row={selectionState.selection.row}
            col={selectionState.selection.col}
            reference={selectedReference}
            value={currentValue}
            onCommit={commitCell}
            editIdentity={getEditIdentity(
              selectionState.selection.row,
              selectionState.selection.col,
            )}
            onJump={handleJump}
            registerCommit={registerEditorCommit}
            disabled={
              collaboration.readOnly ||
              (visibleSet !== null && !visibleSet.has(selectionState.selection.row))
            }
            onMove={(row, col, dr, dc, identity) => {
              const target = resolveEditTarget(row, col, identity);
              if (!target) return;
              ({ row, col } = target);
              const nextRow = rowSourceIndexes
                ? (rowSourceIndexes[
                    Math.max(
                      0,
                      Math.min(rowSourceIndexes.length - 1, rowSourceIndexes.indexOf(row) + dr),
                    )
                  ] ?? row)
                : Math.max(0, Math.min(MAX_GRID_ROWS - 1, row + dr));
              selectionState.selectCell(
                nextRow,
                Math.max(0, Math.min(MAX_GRID_COLS - 1, col + dc)),
              );
              setFocusCell({
                row: nextRow,
                col: Math.max(0, Math.min(MAX_GRID_COLS - 1, col + dc)),
                nonce: Date.now(),
              });
            }}
          />
          <GlideSheet
            selectedRowIndexes={selectedRows}
            selectedColumnIndexes={selectedColumns}
            key={`grid-${workspace.activeId}`}
            rows={displayRows}
            readOnly={collaboration.readOnly}
            formulaEnabled={view.formulaEnabled}
            displayValues={(row, col) => formulaEvaluation.displayRows[row]?.[col] ?? ""}
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
            freezeColumns={view.freezeColumns}
            freezeRows={view.freezeRows}
            zoom={settings.zoom}
            onEdit={editCell}
            getEditIdentity={getEditIdentity}
            onInputError={showToast}
            registerCommit={registerEditorCommit}
            onClear={() => clearSelectedCells()}
            onColumnMove={(from, to) => {
              if (!ensureRowOpsAllowed()) return;
              const moved = moveColumn(sheet.rows, sheet.colWidths, sheet.columnCount, from, to);
              if (!moved) {
                if (from !== to) showToast(t("moveDataColumnsOnly"));
                return;
              }
              const nextRules = rules.map((rule) => ({
                ...rule,
                column:
                  rule.column === from
                    ? to
                    : from < to && rule.column > from && rule.column <= to
                      ? rule.column - 1
                      : from > to && rule.column >= to && rule.column < from
                        ? rule.column + 1
                        : rule.column,
              }));
              if (!validateNext(moved.rows, nextRules, false, moved.rows)) return;
              if (collaboration.client) {
                const doc = collaboration.client.getDocument()!;
                const ids = activeIds(doc, "column");
                ids.splice(to, 0, ids.splice(from, 1)[0]);
                collaboration.submit([
                  { type: "reorder", axis: "column", ids, ifRevision: doc.revision },
                ]);
              } else {
                recordBeforeChange([{ type: "move", from, to }]);
                replaceRows(moved.rows, true, false);
              }
              invalidateSearchScope();
              setRulesById((current) => ({ ...current, [workspace.activeId]: nextRules }));
              sheet.setColWidths(moved.widths);
              selectionState.selectColumn(to, sheet.rows.length);
              setSelectedRows([]);
              setSelectedColumns([to]);
            }}
            onColumnResize={sheet.setColumnWidth}
            onSelectionChange={(sel, range) => selectionState.setSelectionRange(sel, range)}
            onRowsSelected={setSelectedRows}
            onColumnsSelected={setSelectedColumns}
            onPasteGrid={pasteGrid}
            onFill={applyUpdates}
            onFillPreview={previewUpdates}
            fillMode={fillMode}
            onCopy={() => void copySelection()}
            onPasteText={(text) => acceptClipboardText(text)}
            onPasteHtml={(html) => {
              const grid = clipboardHtmlRows(html);
              const range = normalizeRange(
                selectionToRange(selectionRef.current, rangeRef.current),
              );
              if (grid) pasteGrid(range.startRow, range.startCol, grid);
              else showToast("貼り付け可能な表がありません / No supported clipboard table");
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
        selectedRowIndexes={selectedRows}
        selectedColumnIndexes={selectedColumns}
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
        onClose={() => {
          setContextMenu(null);
          window.setTimeout(() => {
            if (!document.querySelector('[role="dialog"], .filterPopover'))
              setFocusCell({ ...selectionRef.current, nonce: Date.now() });
          }, 0);
        }}
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
            setView((v) => ({ ...v, freezeColumns: contextMenu.col + 1 }));
          }
        }}
        onUnfreeze={() => setView((v) => ({ ...v, freezeColumns: 0 }))}
      />
      <FilterPopover
        state={filterPopover}
        rows={filterValueRows}
        selected={columnFilterSelected}
        onApply={(col, allowed) => filter.setColumnFilter(col, allowed)}
        onClose={() => {
          setFilterPopover(null);
          window.setTimeout(() => setFocusCell({ ...selectionRef.current, nonce: Date.now() }), 0);
        }}
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
        useHeaderRow={view.useHeaderRow}
        headerLocked={sheet.meta.format === "json" || sheet.meta.format === "yaml"}
        onEncodingChange={(encoding) => sheet.setMeta({ encoding, dirty: true })}
        onNewlineChange={(newline) => sheet.setMeta({ newline, dirty: true })}
        onZebraChange={(zebra) => updateSettings({ zebra })}
        onHeaderHighlightChange={(headerHighlight) => updateSettings({ headerHighlight })}
        onCsvFormulaGuardChange={(value) => sheet.setMeta({ csvFormulaGuard: value, dirty: true })}
        onOmitEmptyCellsChange={(value) => sheet.setMeta({ omitEmptyCells: value, dirty: true })}
        onThemeChange={(theme) => updateSettings({ theme })}
        onUseHeaderRowChange={(useHeaderRow) => {
          if (sheet.meta.format === "json" || sheet.meta.format === "yaml") {
            showToast("JSON/YAMLの先頭行はキー行です / JSON/YAML requires a key row");
            return;
          }
          setView((v) => ({ ...v, useHeaderRow }));
        }}
        onClose={() => setSettingsOpen(false)}
      />
      {namedViewsOpen && (
        <NamedViewsPanel
          documentId={workspace.activeId}
          fileName={sheet.meta.fileName}
          rows={sheet.rows}
          filters={filter.filters}
          colWidths={sheet.colWidths}
          headerRow={view.useHeaderRow}
          visibleCount={Math.max(
            0,
            displayRows.length - (view.useHeaderRow && displayRows.length ? 1 : 0),
          )}
          activeViewId={activeViewById[workspace.activeId]}
          onApply={(preset) => {
            filter.restore(preset.filters);
            sheet.setColWidths(preset.colWidths);
            setActiveViewById((current) => ({ ...current, [workspace.activeId]: preset.id }));
          }}
          onClose={() => setNamedViewsOpen(false)}
        />
      )}
      {sharingOpen && (
        <SharingPanel
          rows={sharingContextRef.current?.rows ?? sheet.rows}
          client={collaboration.client}
          state={collaboration.state}
          onClose={() => {
            sharingContextRef.current = null;
            setSharingOpen(false);
          }}
          onDetached={() => {
            collaboration.detach(workspace.activeId);
            history.reset();
          }}
          onConnected={(client, mode) => {
            if (mode === "join") {
              const rows = sharedDocumentRows(client.getDocument()!);
              const doc = workspace.openDocument(
                rows,
                {
                  fileName: `shared-${client.getState().snapshot?.roomId}.csv`,
                  filePath: undefined,
                  dirty: true,
                },
                getLive(),
              );
              applyDocument(doc);
              collaboration.attach(doc.id, client);
            } else {
              const targetId = sharingContextRef.current?.documentId ?? workspace.activeId;
              if (!documentsRef.current.some((doc) => doc.id === targetId)) {
                client.forget();
                return;
              }
              collaboration.attach(targetId, client);
              if (targetId !== activeDocumentIdRef.current) {
                sharingContextRef.current = null;
                setSharingOpen(false);
                showToast(
                  "元の文書で共有を開始しました / Sharing started for the original document",
                );
                return;
              }
            }
            history.reset();
          }}
        />
      )}
      {cleanupOpen && (
        <CleanupPanel
          rows={cleanupOpen.rows}
          cells={cleanupOpen.cells}
          hasHeader={view.useHeaderRow}
          onClose={() => setCleanupOpen(null)}
          onApply={(next, metadata) => {
            if (
              cleanupOpen.documentId !== activeDocumentIdRef.current ||
              cleanupOpen.rows !== rowsRef.current
            ) {
              showToast(t("clipboardContextChanged"));
              return;
            }
            const deleted = metadata?.deletedRows ?? [];
            const rewrite = (rows: CellValue[][]) =>
              view.formulaEnabled
                ? [...deleted]
                    .sort((a, b) => b - a)
                    .reduce(
                      (data, index) =>
                        rewriteFormulasForStructure(data, {
                          type: "delete",
                          axis: "row",
                          index,
                          count: 1,
                        }),
                      rows,
                    )
                : rows;
            const finalRows = rewrite(next);
            const beforeCleanup = sheet.rows.filter((_, row) => !deleted.includes(row));
            if (!validateNext(finalRows, rules, false, beforeCleanup)) return;
            if (deleted.length && collaboration.client)
              collaboration.structure(
                deleteAxisActions(collaboration.client.getDocument()!, "row", deleted),
                rewrite,
              );
            else {
              recordBeforeChange();
              replaceRows(finalRows, true, false);
            }
            invalidateSearchScope();
            setCleanupOpen(null);
          }}
        />
      )}
      {validationOpen && (
        <ValidationPanel
          key={workspace.activeId}
          rows={sheet.rows}
          rules={rules}
          onRulesChange={(next) =>
            setRulesById((current) => ({ ...current, [workspace.activeId]: next }))
          }
          onClose={() => setValidationOpen(false)}
          onExportRules={(json) => {
            const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = "plainsheet-validation.json";
            a.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        />
      )}
      {recoveryOpen && (
        <RecoveryPanel
          store={recoveryStore}
          onStateChange={setRecoveryState}
          onDeleteCompleted={cancelRecoverySnapshots}
          onRestore={(copy) => {
            if (!finishPendingEdit()) return;
            const doc = workspace.openDocument(
              copy.rows,
              { ...copy.meta, filePath: undefined, dirty: true },
              getLive(),
            );
            applyDocument(doc);
            setRecoveryOpen(false);
          }}
          onClose={() => setRecoveryOpen(false)}
        />
      )}
      {sortOpen && (
        <FeatureDialog
          title="複数列の並べ替え / Multi-column sort"
          onClose={() => setSortOpen(false)}
        >
          <p>
            {targetName}: 全列を一緒に移動、{sheet.rows.length - (view.useHeaderRow ? 1 : 0)}
            データ行。非表示行も含みます。先頭行={view.useHeaderRow ? "見出し" : "データ"}。
          </p>
          <p>
            数値は10進数を正確に比較。空値は末尾、日本語はja順、文字列モードは字句順。全キー同値は元順を維持。
          </p>
          {sortKeys.map((key, i) => (
            <div key={i}>
              <select
                aria-label={`Sort column ${i + 1}`}
                value={key.colIndex}
                onChange={(e) =>
                  setSortKeys((keys) =>
                    keys.map((k, n) => (n === i ? { ...k, colIndex: Number(e.target.value) } : k)),
                  )
                }
              >
                {Array.from({ length: sheet.columnCount }, (_, c) => (
                  <option key={c} value={c}>
                    {columnName(c)}: {view.useHeaderRow ? sheet.rows[0]?.[c] : ""}
                  </option>
                ))}
              </select>
              <select
                value={key.direction}
                onChange={(e) =>
                  setSortKeys((keys) =>
                    keys.map((k, n) =>
                      n === i ? { ...k, direction: e.target.value as SortDirection } : k,
                    ),
                  )
                }
              >
                <option value="asc">昇順 / Asc</option>
                <option value="desc">降順 / Desc</option>
              </select>
              <select
                value={key.mode}
                onChange={(e) =>
                  setSortKeys((keys) =>
                    keys.map((k, n) =>
                      n === i ? { ...k, mode: e.target.value as "auto" | "text" | "numeric" } : k,
                    ),
                  )
                }
              >
                <option value="auto">自動 / Auto</option>
                <option value="text">文字列 / Text</option>
                <option value="numeric">数値 / Numeric</option>
              </select>
              <button
                disabled={i === 0}
                onClick={() =>
                  setSortKeys((keys) => {
                    const next = [...keys];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    return next;
                  })
                }
              >
                上へ / Up
              </button>
              <button
                disabled={sortKeys.length === 1}
                onClick={() => setSortKeys((keys) => keys.filter((_, n) => n !== i))}
              >
                削除 / Remove
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              setSortKeys((keys) => [...keys, { colIndex: 0, direction: "asc", mode: "auto" }])
            }
          >
            キー追加 / Add key
          </button>
          <pre>
            {JSON.stringify(
              sortRowsByKeys(sheet.rows, sortKeys, { headerRow: view.useHeaderRow }).slice(0, 8),
              null,
              2,
            )}
          </pre>
          <button onClick={() => setSortOpen(false)}>取消 / Cancel</button>
          <button
            onClick={() => {
              const context = clipboardContext();
              const data = sortRowsByKeys(sheet.rows, sortKeys, { headerRow: view.useHeaderRow });
              const header = view.useHeaderRow;
              setSortOpen(false);
              setPendingPreview({
                title: "並べ替え適用 / Apply sort",
                detail: `${targetName}: 非表示行を含む全表、全列同時移動。\n${JSON.stringify(data.slice(0, 8))}`,
                apply: () => {
                  if (!clipboardContextValid(context) || viewRef.current.useHeaderRow !== header) {
                    showToast(t("clipboardContextChanged"));
                    return;
                  }
                  invalidateSearchScope();
                  applySortedRows(data);
                },
              });
            }}
          >
            結果を確認 / Confirm preview
          </button>
        </FeatureDialog>
      )}
      {commandOpen && <CommandSearch commands={commands} onClose={() => setCommandOpen(false)} />}
      {importRequest && (
        <ImportPreview
          request={importRequest.request}
          onConfirm={(result) => {
            importRequest.resolve(result);
            setImportRequest(null);
          }}
          onCancel={() => {
            importRequest.resolve(null);
            setImportRequest(null);
          }}
        />
      )}
      {savePreview && (
        <FeatureDialog
          title={`${savePreview.name}: 上書き変換の確認`}
          onClose={() => {
            savePreview.resolve("cancel");
            setSavePreview(null);
          }}
        >
          <p>原本の型や表以外の文章は維持されません。別名保存を推奨します。</p>
          <pre>{savePreview.detail}</pre>
          <button
            onClick={() => {
              savePreview.resolve("saveAs");
              setSavePreview(null);
            }}
          >
            別名保存 / Save As
          </button>
          <button
            onClick={() => {
              savePreview.resolve("save");
              setSavePreview(null);
            }}
          >
            変換して上書き / Overwrite
          </button>
          <button
            onClick={() => {
              savePreview.resolve("cancel");
              setSavePreview(null);
            }}
          >
            取消 / Cancel
          </button>
        </FeatureDialog>
      )}
      {closeRequest && !savePreview && (
        <FeatureDialog
          title="変更を保存して閉じる / Save before closing"
          onClose={() => {
            if (!closeBusy) setCloseRequest(null);
          }}
        >
          <ul>
            {closeRequest.ids.map((id) => (
              <li key={id}>
                {documentsRef.current.find((d) => d.id === id)?.meta.fileName ?? "untitled"}
              </li>
            ))}
          </ul>
          {pendingSharingRef.current().length > 0 && (
            <p role="alert">
              共同編集の未送信操作があります。ローカル保存は同期完了ではありません。「保存せず閉じる」はこの端末の未送信キューを破棄します。
            </p>
          )}
          <p>
            {closeRequest.downloaded
              ? "ダウンロード開始は保存完了の保証ではありません。保存先のファイルを確認してから閉じてください。"
              : "保存失敗・取消・保存中の変更があれば閉じません。"}
          </p>
          <button disabled={closeBusy} onClick={() => setCloseRequest(null)}>
            戻る / Back
          </button>
          <button disabled={closeBusy} onClick={() => void saveThenClose()}>
            保存して閉じる / Save and close
          </button>
          <button disabled={closeBusy} onClick={() => void finishClose()}>
            {closeRequest.downloaded
              ? "保存先を確認したので閉じる / Confirm download and close"
              : "保存せず閉じる / Discard and close"}
          </button>
        </FeatureDialog>
      )}
      {pastePreview && (
        <FeatureDialog title="貼り付け形式 / Paste format" onClose={() => setPastePreview(null)}>
          <p>区切りが曖昧です。元の形と隣のセルへの影響を確認してください。</p>
          <label>
            形式{" "}
            <select
              value={pasteFormat}
              onChange={(e) => setPasteFormat(e.target.value as ClipboardFormat)}
            >
              <option value="single-column">1列 / Single column</option>
              <option value="tsv">TSV</option>
              <option value="csv">CSV</option>
            </select>
          </label>
          <pre>
            {JSON.stringify(
              resolveClipboardText(pastePreview.text, undefined, pasteFormat).slice(0, 12),
              null,
              2,
            )}
          </pre>
          <button onClick={() => setPastePreview(null)}>取消 / Cancel</button>
          <button
            onClick={() => {
              pastePreview.apply(pasteFormat);
              setPastePreview(null);
            }}
          >
            適用 / Apply
          </button>
        </FeatureDialog>
      )}
      {pendingPreview && (
        <FeatureDialog title={pendingPreview.title} onClose={() => setPendingPreview(null)}>
          <pre>{pendingPreview.detail}</pre>
          <button onClick={() => setPendingPreview(null)}>取消 / Cancel</button>
          <button
            onClick={() => {
              pendingPreview.apply();
              setPendingPreview(null);
            }}
          >
            適用 / Apply
          </button>
        </FeatureDialog>
      )}
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
