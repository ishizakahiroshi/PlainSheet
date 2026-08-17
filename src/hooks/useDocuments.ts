import { useCallback, useRef, useState } from "react";
import type {
  CellValue,
  ColumnWidthMap,
  HistoryEntry,
  Range,
  Selection,
  SheetMeta,
} from "../types/sheet";
import { DEFAULT_META, EMPTY_SELECTION } from "../types/sheet";
import { calculateColumnWidths } from "../lib/columnWidth";
import { cloneRows } from "./useSheet";

export type DocumentSnapshot = {
  id: string;
  rows: CellValue[][];
  meta: SheetMeta;
  colWidths: ColumnWidthMap;
  selection: Selection;
  range: Range;
  history: { undo: HistoryEntry[]; redo: HistoryEntry[] };
};

export type ActiveDocumentLive = {
  rows: CellValue[][];
  meta: SheetMeta;
  colWidths: ColumnWidthMap;
  selection: Selection;
  range: Range;
  history: { undo: HistoryEntry[]; redo: HistoryEntry[] };
};

function createId(): string {
  return `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneHistory(entries: HistoryEntry[]): HistoryEntry[] {
  return entries.map((entry) => ({
    rows: cloneRows(entry.rows),
    selection: { ...entry.selection },
  }));
}

export function createDocument(
  rows: CellValue[][] = [[""]],
  meta: Partial<SheetMeta> = {},
): DocumentSnapshot {
  const cloned = cloneRows(rows);
  return {
    id: createId(),
    rows: cloned,
    meta: { ...DEFAULT_META, ...meta, dirty: meta.dirty ?? false },
    colWidths: calculateColumnWidths(cloned),
    selection: { ...EMPTY_SELECTION },
    range: null,
    history: { undo: [], redo: [] },
  };
}

/**
 * Multi-document tab state. Inactive docs are fully serialized; the active
 * document is mirrored into useSheet/useSelection/useHistory by App.
 */
export function useDocuments(initial?: DocumentSnapshot) {
  const first = initial ?? createDocument([[""]], { dirty: false });
  const [documents, setDocuments] = useState<DocumentSnapshot[]>([first]);
  const [activeId, setActiveId] = useState(first.id);
  const documentsRef = useRef(documents);
  documentsRef.current = documents;
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const active = documents.find((doc) => doc.id === activeId) ?? documents[0]!;
  const anyDirty = documents.some((doc) => doc.meta.dirty);

  const captureActive = useCallback((live: ActiveDocumentLive) => {
    const id = activeIdRef.current;
    setDocuments((current) =>
      current.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              rows: cloneRows(live.rows),
              meta: { ...live.meta },
              colWidths: { ...live.colWidths },
              selection: { ...live.selection },
              range: live.range ? { ...live.range } : null,
              history: {
                undo: cloneHistory(live.history.undo),
                redo: cloneHistory(live.history.redo),
              },
            }
          : doc,
      ),
    );
  }, []);

  const openDocument = useCallback(
    (rows: CellValue[][], meta: Partial<SheetMeta>, live?: ActiveDocumentLive): DocumentSnapshot => {
      if (live) {
        captureActive(live);
      }
      if (meta.filePath) {
        const match = documentsRef.current.find(
          (doc) => doc.meta.filePath && doc.meta.filePath === meta.filePath,
        );
        if (match) {
          setActiveId(match.id);
          return match;
        }
      }
      const doc = createDocument(rows, meta);
      setDocuments((current) => [...current, doc]);
      setActiveId(doc.id);
      return doc;
    },
    [captureActive],
  );

  const addBlankDocument = useCallback(
    (live?: ActiveDocumentLive): DocumentSnapshot => {
      if (live) {
        captureActive(live);
      }
      const doc = createDocument([[""]], { dirty: false });
      setDocuments((current) => [...current, doc]);
      setActiveId(doc.id);
      return doc;
    },
    [captureActive],
  );

  const switchTo = useCallback(
    (id: string, live?: ActiveDocumentLive): DocumentSnapshot | null => {
      if (id === activeIdRef.current) {
        return documentsRef.current.find((doc) => doc.id === id) ?? null;
      }
      // Snapshot the live active doc before switching so we read the pre-capture list.
      let frozen: DocumentSnapshot[] | null = null;
      if (live) {
        frozen = documentsRef.current.map((doc) =>
          doc.id === activeIdRef.current
            ? {
                ...doc,
                rows: cloneRows(live.rows),
                meta: { ...live.meta },
                colWidths: { ...live.colWidths },
                selection: { ...live.selection },
                range: live.range ? { ...live.range } : null,
                history: {
                  undo: cloneHistory(live.history.undo),
                  redo: cloneHistory(live.history.redo),
                },
              }
            : doc,
        );
        setDocuments(frozen);
        documentsRef.current = frozen;
      }
      const source = frozen ?? documentsRef.current;
      const target = source.find((doc) => doc.id === id);
      if (!target) {
        return null;
      }
      setActiveId(id);
      return target;
    },
    [],
  );

  const closeDocument = useCallback(
    (id: string, live?: ActiveDocumentLive): { closed: boolean; next: DocumentSnapshot | null } => {
      let source = documentsRef.current;
      if (live && id !== activeIdRef.current) {
        source = source.map((doc) =>
          doc.id === activeIdRef.current
            ? {
                ...doc,
                rows: cloneRows(live.rows),
                meta: { ...live.meta },
                colWidths: { ...live.colWidths },
                selection: { ...live.selection },
                range: live.range ? { ...live.range } : null,
                history: {
                  undo: cloneHistory(live.history.undo),
                  redo: cloneHistory(live.history.redo),
                },
              }
            : doc,
        );
      }
      if (source.length <= 1) {
        return { closed: false, next: null };
      }
      const remaining = source.filter((doc) => doc.id !== id);
      if (remaining.length === source.length) {
        return { closed: false, next: null };
      }
      let nextActiveId = activeIdRef.current;
      if (nextActiveId === id) {
        const closedIndex = source.findIndex((doc) => doc.id === id);
        nextActiveId = remaining[Math.min(closedIndex, remaining.length - 1)]!.id;
      }
      setDocuments(remaining);
      documentsRef.current = remaining;
      setActiveId(nextActiveId);
      return {
        closed: true,
        next: remaining.find((doc) => doc.id === nextActiveId) ?? remaining[0]!,
      };
    },
    [],
  );

  const replaceActiveContent = useCallback((rows: CellValue[][], meta: Partial<SheetMeta>) => {
    const id = activeIdRef.current;
    const cloned = cloneRows(rows);
    setDocuments((current) =>
      current.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              rows: cloned,
              meta: { ...DEFAULT_META, ...meta, dirty: false },
              colWidths: calculateColumnWidths(cloned),
              selection: { ...EMPTY_SELECTION },
              range: null,
              history: { undo: [], redo: [] },
            }
          : doc,
      ),
    );
  }, []);

  return {
    documents,
    activeId: active.id,
    active,
    anyDirty,
    captureActive,
    openDocument,
    addBlankDocument,
    switchTo,
    closeDocument,
    replaceActiveContent,
  };
}
