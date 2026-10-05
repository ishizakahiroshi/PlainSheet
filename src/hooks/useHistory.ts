import { useRef, useState } from "react";
import type { HistoryEntry, Selection } from "../types/sheet";
import { cloneRows } from "./useSheet";

export const MAX_HISTORY = 50;

export function cloneHistoryEntry(entry: HistoryEntry): HistoryEntry {
  return {
    rows: cloneRows(entry.rows),
    selection: { ...entry.selection },
    range: entry.range ? { ...entry.range } : null,
    colWidths: entry.colWidths ? { ...entry.colWidths } : undefined,
  };
}

export function useHistory() {
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  // Mirror stacks in refs so rapid successive undo/redo (same tick, before
  // re-render) read the latest length instead of a stale closure snapshot.
  const undoRef = useRef<HistoryEntry[]>([]);
  const redoRef = useRef<HistoryEntry[]>([]);

  function record(
    rows: HistoryEntry["rows"],
    selection: Selection,
    extra: Pick<HistoryEntry, "range" | "colWidths"> = {},
  ): void {
    const next = [...undoRef.current, cloneHistoryEntry({ rows, selection, ...extra })].slice(
      Math.max(0, undoRef.current.length + 1 - MAX_HISTORY),
    );
    undoRef.current = next;
    redoRef.current = [];
    setUndoStack(next);
    setRedoStack([]);
  }

  function undo(current: HistoryEntry): HistoryEntry | null {
    const stack = undoRef.current;
    const previous = stack[stack.length - 1];
    if (!previous) {
      return null;
    }
    const nextUndo = stack.slice(0, -1);
    const nextRedo = [...redoRef.current, cloneHistoryEntry(current)];
    undoRef.current = nextUndo;
    redoRef.current = nextRedo;
    setUndoStack(nextUndo);
    setRedoStack(nextRedo);
    return cloneHistoryEntry(previous);
  }

  function redo(current: HistoryEntry): HistoryEntry | null {
    const stack = redoRef.current;
    const nextEntry = stack[stack.length - 1];
    if (!nextEntry) {
      return null;
    }
    const nextRedo = stack.slice(0, -1);
    const nextUndo = [...undoRef.current, cloneHistoryEntry(current)];
    redoRef.current = nextRedo;
    undoRef.current = nextUndo;
    setRedoStack(nextRedo);
    setUndoStack(nextUndo);
    return cloneHistoryEntry(nextEntry);
  }

  function reset(): void {
    undoRef.current = [];
    redoRef.current = [];
    setUndoStack([]);
    setRedoStack([]);
  }

  function snapshot(): { undo: HistoryEntry[]; redo: HistoryEntry[] } {
    return {
      undo: undoRef.current.map(cloneHistoryEntry),
      redo: redoRef.current.map(cloneHistoryEntry),
    };
  }

  function restore(undo: HistoryEntry[], redo: HistoryEntry[]): void {
    const nextUndo = undo.map(cloneHistoryEntry);
    const nextRedo = redo.map(cloneHistoryEntry);
    undoRef.current = nextUndo;
    redoRef.current = nextRedo;
    setUndoStack(nextUndo);
    setRedoStack(nextRedo);
  }

  return {
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    record,
    undo,
    redo,
    reset,
    snapshot,
    restore,
  };
}
