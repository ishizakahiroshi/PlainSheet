import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { ContextMenu, type ContextMenuKind, type ContextMenuState } from "./components/ContextMenu";
import { EmptyState } from "./components/EmptyState";
import { FormulaBar } from "./components/FormulaBar";
import { HelpModal } from "./components/HelpModal";
import { SearchPanel, type SearchOptions } from "./components/SearchPanel";
import { SheetGrid, columnName } from "./components/SheetGrid";
import { SettingsModal } from "./components/SettingsModal";
import { StatusBar } from "./components/StatusBar";
import { TitleBar } from "./components/TitleBar";
import { Toast } from "./components/Toast";
import { Toolbar } from "./components/Toolbar";
import { parseClipboardText, rangeTsv, normalizeRange } from "./lib/clipboard";
import { t } from "./lib/i18n";
import { useEdit } from "./hooks/useEdit";
import { useFile } from "./hooks/useFile";
import { useHistory } from "./hooks/useHistory";
import { useSelection, selectionToRange } from "./hooks/useSelection";
import { cloneRows } from "./hooks/useSheet";
import { useSheet } from "./hooks/useSheet";
import type { CellValue, Range, Selection } from "./types/sheet";

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
  const edit = useEdit();
  const history = useHistory();
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [zebra, setZebra] = useState(true);
  const [headerHighlight, setHeaderHighlight] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    regex: false,
    caseSensitive: false,
  });
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);

  const rowsRef = useRef(sheet.rows);
  const metaRef = useRef(sheet.meta);

  useEffect(() => {
    rowsRef.current = sheet.rows;
  }, [sheet.rows]);

  useEffect(() => {
    metaRef.current = sheet.meta;
    document.title = `${sheet.meta.dirty ? "● " : ""}${sheet.meta.fileName ?? t("appName")}`;
  }, [sheet.meta]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!metaRef.current.dirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2000);
  }, []);

  const file = useFile({
    loadData: (rows, meta) => {
      sheet.loadData(rows, meta);
      history.reset();
      selectionState.setSelection({ row: 0, col: 0 });
    },
    getRows: () => rowsRef.current,
    getMeta: () => metaRef.current,
    onToast: showToast,
    confirmDiscard: () => window.confirm(t("confirmUnsaved")),
  });

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
    }
  }, [activeSearchIndex, searchHits.length]);

  const currentValue = sheet.rows[selectionState.selection.row]?.[selectionState.selection.col] ?? "";
  const selectedReference = referenceForSelection(selectionState.selection, selectionState.range);

  const recordBeforeChange = useCallback(() => {
    history.record(sheet.rows, selectionState.selection);
  }, [history, selectionState.selection, sheet.rows]);

  const replaceRowsFromHistory = (entry: { rows: CellValue[][]; selection: Selection }) => {
    sheet.replaceRows(entry.rows, false);
    selectionState.setSelection(entry.selection);
  };

  const moveAfterCommit = (direction: "none" | "down" | "up" | "right" | "left") => {
    if (direction === "none") {
      return;
    }
    const deltas = {
      down: [1, 0],
      up: [-1, 0],
      right: [0, 1],
      left: [0, -1],
    } as const;
    const [rowDelta, colDelta] = deltas[direction];
    selectionState.moveSelection(
      rowDelta,
      colDelta,
      false,
      sheet.rows.length + 8,
      Math.max(sheet.columnCount, 6),
    );
  };

  const commitCell = (
    row: number,
    col: number,
    value: string,
    direction: "none" | "down" | "up" | "right" | "left" = "none",
  ) => {
    const previousValue = sheet.rows[row]?.[col] ?? "";
    if (previousValue !== value) {
      recordBeforeChange();
      sheet.updateCell(row, col, value);
    }
    edit.cancelEditing();
    selectionState.selectCell(row, col, false);
    moveAfterCommit(direction);
  };

  const copySelection = async () => {
    const selected = selectionToRange(selectionState.selection, selectionState.range);
    const normalized = normalizeRange(selected);
    const text = rangeTsv(sheet.rows, selected);
    if (!navigator.clipboard) {
      showToast(t("toastClipboardUnavailable"));
      return;
    }
    await navigator.clipboard.writeText(text);
    showToast(
      t("toastCopiedRange", {
        rows: normalized.endRow - normalized.startRow + 1,
        cols: normalized.endCol - normalized.startCol + 1,
      }),
    );
  };

  const pasteClipboard = async () => {
    if (!navigator.clipboard) {
      showToast(t("toastClipboardUnavailable"));
      return;
    }
    const text = await navigator.clipboard.readText();
    const grid = parseClipboardText(text);
    recordBeforeChange();
    const pastedRange = sheet.pasteGrid(selectionState.selection.row, selectionState.selection.col, grid);
    selectionState.selectRange(pastedRange);
    const normalized = normalizeRange(pastedRange);
    showToast(
      t("toastPastedRange", {
        rows: normalized.endRow - normalized.startRow + 1,
        cols: normalized.endCol - normalized.startCol + 1,
      }),
    );
  };

  const clearSelectedCells = () => {
    recordBeforeChange();
    sheet.clearRange(selectionToRange(selectionState.selection, selectionState.range));
  };

  const openContextMenu = (kind: ContextMenuKind, row: number, col: number, x: number, y: number) => {
    setContextMenu({ kind, row, col, x, y });
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

  const insertRow = (offset: 0 | 1) => {
    recordBeforeChange();
    sheet.insertRow((contextMenu?.row ?? selectionState.selection.row) + offset);
  };

  const insertColumn = (offset: 0 | 1) => {
    recordBeforeChange();
    sheet.insertColumn((contextMenu?.col ?? selectionState.selection.col) + offset);
  };

  const deleteRowWithConfirm = () => {
    const row = contextMenu?.row ?? selectionState.selection.row;
    setPendingConfirm({
      action: () => {
        recordBeforeChange();
        sheet.deleteRow(row);
        selectionState.selectCell(Math.max(0, row - 1), selectionState.selection.col, false);
      },
    });
  };

  const deleteColumnWithConfirm = () => {
    const col = contextMenu?.col ?? selectionState.selection.col;
    setPendingConfirm({
      action: () => {
        recordBeforeChange();
        sheet.deleteColumn(col);
        selectionState.selectCell(selectionState.selection.row, Math.max(0, col - 1), false);
      },
    });
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
    recordBeforeChange();
    const next = cloneRows(sheet.rows);
    next[hit.row][hit.col] = next[hit.row][hit.col].replace(matcher, replacement);
    sheet.replaceRows(next);
  };

  const replaceAll = () => {
    const matcher = buildMatcher(query, searchOptions);
    if (!matcher) {
      return;
    }
    recordBeforeChange();
    let count = 0;
    const next = sheet.rows.map((row) =>
      row.map((cell) =>
        cell.replace(matcher, () => {
          count += 1;
          return replacement;
        }),
      ),
    );
    sheet.replaceRows(next);
    showToast(t("toastSearchDone", { count }));
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
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a" && !editingText) {
      event.preventDefault();
      selectionState.selectAll(Math.max(sheet.rows.length, 1), Math.max(sheet.columnCount, 1));
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
      event.preventDefault();
      runUndo();
    } else if (
      ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") ||
      ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "z")
    ) {
      event.preventDefault();
      runRedo();
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c" && !editingText) {
      event.preventDefault();
      void copySelection();
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v" && !editingText) {
      event.preventDefault();
      void pasteClipboard();
    } else if (!editingText && event.key === "Escape") {
      selectionState.clearRange();
      setSearchOpen(false);
      setContextMenu(null);
    } else if (!editingText && event.key === "Delete") {
      event.preventDefault();
      clearSelectedCells();
    } else if (!editingText && event.key === "Backspace") {
      event.preventDefault();
      clearSelectedCells();
    } else if (!editingText && event.key === "F2") {
      event.preventDefault();
      edit.startEditing(selectionState.selection.row, selectionState.selection.col, currentValue);
    } else if (!editingText && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      const delta = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      }[event.key] as [number, number];
      selectionState.moveSelection(
        delta[0],
        delta[1],
        event.shiftKey,
        sheet.rows.length + 8,
        Math.max(sheet.columnCount, 6),
      );
    } else if (!editingText && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      edit.startEditing(selectionState.selection.row, selectionState.selection.col, currentValue, event.key);
    }
  };

  const hasData = sheet.rows.length > 0;

  return (
    <div className="appShell" onKeyDown={handleKeyDown}>
      <TitleBar meta={sheet.meta} />
      <Toolbar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
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
            reference={selectedReference}
            value={currentValue}
            onCommit={(value) => commitCell(selectionState.selection.row, selectionState.selection.col, value)}
          />
          <SheetGrid
            rows={sheet.rows}
            columnCount={sheet.columnCount}
            colWidths={sheet.colWidths}
            selection={selectionState.selection}
            range={selectionState.range}
            editing={edit.editing}
            searchHits={searchHitSet}
            activeSearchHit={activeSearchHit}
            zebra={zebra}
            headerHighlight={headerHighlight}
            onSelectCell={(row, col, extend) => selectionState.selectCell(row, col, extend)}
            onSelectRow={(row) => selectionState.selectRow(row, Math.max(sheet.columnCount, 1))}
            onSelectColumn={(col) => selectionState.selectColumn(col, Math.max(sheet.rows.length, 1))}
            onStartEdit={(row, col, overwrite) => edit.startEditing(row, col, sheet.rows[row]?.[col] ?? "", overwrite)}
            onUpdateEdit={edit.updateEditingValue}
            onCommitEdit={commitCell}
            onCancelEdit={edit.cancelEditing}
            onOpenContextMenu={openContextMenu}
            onResizeColumn={sheet.setColumnWidth}
          />
        </>
      ) : (
        <EmptyState onOpen={() => void file.openFile()} onSample={() => void file.loadSample()} />
      )}
      <StatusBar
        rows={sheet.rows}
        columnCount={sheet.columnCount}
        selection={selectionState.selection}
        range={selectionState.range}
        meta={sheet.meta}
      />
      <ContextMenu
        state={contextMenu}
        onClose={() => setContextMenu(null)}
        onCopy={() => {
          selectContextCell();
          void copySelection();
        }}
        onPaste={() => {
          selectContextCell();
          void pasteClipboard();
        }}
        onClear={() => {
          selectContextCell();
          clearSelectedCells();
        }}
        onInsertRowAbove={() => insertRow(0)}
        onInsertRowBelow={() => insertRow(1)}
        onDeleteRow={deleteRowWithConfirm}
        onInsertColLeft={() => insertColumn(0)}
        onInsertColRight={() => insertColumn(1)}
        onDeleteCol={deleteColumnWithConfirm}
        onAutoFitColumn={() => {
          sheet.autoFitColumns();
          showToast(t("toastAutoFit"));
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
        encoding={sheet.meta.encoding}
        newline={sheet.meta.newline}
        zebra={zebra}
        headerHighlight={headerHighlight}
        theme={theme}
        onEncodingChange={(encoding) => sheet.setMeta({ encoding, dirty: true })}
        onNewlineChange={(newline) => sheet.setMeta({ newline, dirty: true })}
        onZebraChange={setZebra}
        onHeaderHighlightChange={setHeaderHighlight}
        onThemeChange={setTheme}
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
      }
    }
  }
  return hits;
}

function buildMatcher(query: string, options: SearchOptions): RegExp | null {
  if (query === "") {
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
