import { useState } from "react";
import type { HistoryEntry, Selection } from "../types/sheet";
import { cloneRows } from "./useSheet";

export const MAX_HISTORY = 50;

export function useHistory() {
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);

  function record(rows: HistoryEntry["rows"], selection: Selection): void {
    setUndoStack((current) => {
      const next = [...current, { rows: cloneRows(rows), selection }];
      return next.slice(Math.max(0, next.length - MAX_HISTORY));
    });
    setRedoStack([]);
  }

  function undo(current: HistoryEntry): HistoryEntry | null {
    const previous = undoStack[undoStack.length - 1];
    if (!previous) {
      return null;
    }
    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((stack) => [...stack, { rows: cloneRows(current.rows), selection: current.selection }]);
    return { rows: cloneRows(previous.rows), selection: previous.selection };
  }

  function redo(current: HistoryEntry): HistoryEntry | null {
    const nextEntry = redoStack[redoStack.length - 1];
    if (!nextEntry) {
      return null;
    }
    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((stack) => [...stack, { rows: cloneRows(current.rows), selection: current.selection }]);
    return { rows: cloneRows(nextEntry.rows), selection: nextEntry.selection };
  }

  function reset(): void {
    setUndoStack([]);
    setRedoStack([]);
  }

  return {
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    record,
    undo,
    redo,
    reset,
  };
}
