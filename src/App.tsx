import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { ContextMenu, type ContextMenuKind, type ContextMenuState } from "./components/ContextMenu";
import { EmptyState } from "./components/EmptyState";
import { FormulaBar } from "./components/FormulaBar";
import { HelpModal } from "./components/HelpModal";
import { SearchPanel, type SearchOptions } from "./components/SearchPanel";
import { GlideSheet } from "./components/GlideSheet";
import { columnName } from "./lib/columns";
import { SettingsModal } from "./components/SettingsModal";
import { StatusBar } from "./components/StatusBar";
import { TitleBar } from "./components/TitleBar";
import { Toast } from "./components/Toast";
import { Toolbar } from "./components/Toolbar";
import { parseClipboardText, rangeTsv, normalizeRange } from "./lib/clipboard";
import { t } from "./lib/i18n";
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
  // Bumped only by deliberate search actions (typing a query, toggling options,
  // Next/Prev) so the grid scrolls for those — but not when an unrelated cell
  // edit happens to shift the active match.
  const [searchScrollNonce, setSearchScrollNonce] = useState(0);

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
    // Save paths use this so that flipping dirty:false on the meta doesn't drag
    // along history.reset, the A1 selection jump, or the column-width refit.
    updateMeta: (meta) => sheet.setMeta(meta),
    getRows: () => rowsRef.current,
    getMeta: () => metaRef.current,
    onToast: showToast,
    confirmDiscard: () => window.confirm(t("confirmUnsaved")),
  });

  const newFile = useCallback(() => {
    if (sheet.meta.dirty && !window.confirm(t("confirmUnsaved"))) {
      return;
    }
    sheet.loadData([[""]], { fileName: undefined, format: "csv", delimiter: "," });
    history.reset();
    selectionState.setSelection({ row: 0, col: 0 });
  }, [sheet, history, selectionState]);

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
      // Edits can shrink the hit list out from under the cursor. Bump the
      // scroll nonce so the grid follows the reset to whatever's now hit 0,
      // rather than leaving focus stranded on the old (now-removed) match.
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
    sheet.replaceRows(entry.rows, false, false);
    selectionState.setSelection(entry.selection);
  };

  const commitCell = (row: number, col: number, value: string, reselect: boolean) => {
    const previousValue = sheet.rows[row]?.[col] ?? "";
    if (previousValue !== value) {
      recordBeforeChange();
      sheet.updateCell(row, col, value);
    }
    // On blur the selection may already have moved to the cell the user clicked,
    // so only pull the selection back when committing explicitly (Enter).
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

  const copySelection = async () => {
    const selected = selectionToRange(selectionState.selection, selectionState.range);
    const normalized = normalizeRange(selected);
    const text = rangeTsv(sheet.rows, selected);
    if (!navigator.clipboard) {
      showToast(t("toastClipboardUnavailable"));
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast(
        t("toastCopiedRange", {
          rows: normalized.endRow - normalized.startRow + 1,
          cols: normalized.endCol - normalized.startCol + 1,
        }),
      );
    } catch {
      showToast(t("toastClipboardUnavailable"));
    }
  };

  const pasteClipboard = async () => {
    if (!navigator.clipboard) {
      showToast(t("toastClipboardUnavailable"));
      return;
    }
    try {
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
    } catch {
      showToast(t("toastClipboardUnavailable"));
    }
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
    // Replace only the first match in the active cell so users get one-at-a-time
    // replace semantics (matching VS Code / Notepad++); the unconditional 'g'
    // flag used by findSearchHits would otherwise blow away every occurrence
    // inside the cell in a single click.
    const singleShot = new RegExp(matcher.source, matcher.flags.replace("g", ""));
    const previous = sheet.rows[hit.row]?.[hit.col] ?? "";
    // Function replacer keeps the replacement literal so $&/$1/$$ don't become
    // accidental patterns; same as replaceAll.
    const replaced = previous.replace(singleShot, () => replacement);
    if (replaced === previous) {
      return;
    }
    recordBeforeChange();
    const next = cloneRows(sheet.rows);
    next[hit.row][hit.col] = replaced;
    // Keep the user's manually adjusted column widths — a content edit isn't a
    // structural change. (Same reason history restore passes recalcWidths=false.)
    sheet.replaceRows(next, true, false);
    // After the cell mutates, the searchHits memo will shrink/shift. Bump the
    // scroll nonce so the grid follows whatever match now sits at the current
    // activeSearchIndex; the existing index-out-of-range effect handles wrap.
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
      // No-op replace must not push a phantom undo entry, dirty the file, or
      // clear the redo stack — just report 0 matches and bail.
      showToast(t("toastSearchDone", { count }));
      return;
    }
    recordBeforeChange();
    // recalcWidths=false: same rationale as replaceCurrent — content edits
    // should not undo the user's manual column widths.
    sheet.replaceRows(next, true, false);
    showToast(t("toastSearchDone", { count }));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target;
    const editingText =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement;

    // Cell navigation, in-cell editing, copy/paste, select-all and clearing are
    // owned by the Glide data grid. App-level handling is limited to global
    // shortcuts that the grid does not provide.
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
    } else if (!editingText && event.key === "Escape") {
      setSearchOpen(false);
      setContextMenu(null);
    }
  };

  const hasData = sheet.rows.length > 0;

  return (
    <div className="appShell" onKeyDown={handleKeyDown}>
      <TitleBar meta={sheet.meta} />
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
          />
          <GlideSheet
            rows={sheet.rows}
            columnCount={sheet.columnCount}
            colWidths={sheet.colWidths}
            selection={selectionState.selection}
            range={selectionState.range}
            searchHits={searchHitSet}
            activeSearchHit={activeSearchHit}
            scrollNonce={searchScrollNonce}
            onEdit={editCell}
            onColumnResize={sheet.setColumnWidth}
            onSelectionChange={(sel, range) => {
              if (range) {
                selectionState.selectRange(range);
              } else {
                selectionState.selectCell(sel.row, sel.col, false);
              }
            }}
            onPasteGrid={(startRow, startCol, grid) => {
              recordBeforeChange();
              const pasted = sheet.pasteGrid(startRow, startCol, grid);
              selectionState.selectRange(pasted);
            }}
            onOpenContextMenu={openContextMenu}
          />
        </>
      ) : (
        <EmptyState onNew={newFile} onOpen={() => void file.openFile()} onSample={() => void file.loadSample()} />
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
        csvFormulaGuard={sheet.meta.csvFormulaGuard}
        omitEmptyCells={sheet.meta.omitEmptyCells}
        theme={theme}
        onEncodingChange={(encoding) => sheet.setMeta({ encoding, dirty: true })}
        onNewlineChange={(newline) => sheet.setMeta({ newline, dirty: true })}
        onZebraChange={setZebra}
        onHeaderHighlightChange={setHeaderHighlight}
        onCsvFormulaGuardChange={(value) => sheet.setMeta({ csvFormulaGuard: value })}
        onOmitEmptyCellsChange={(value) => sheet.setMeta({ omitEmptyCells: value })}
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

// Bound the hit list so a common-letter query on a large sheet (e.g. 'e' over
// 100k cells) doesn't recompute and re-render tens of thousands of Highlight
// regions on every keystroke. Next/Prev still work inside the cap.
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

// A modest cap to keep a pathological user-supplied regex from locking the UI.
// Full ReDoS protection (RE2 / a worker with a timeout) is a post-release item.
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
