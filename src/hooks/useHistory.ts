import { useRef, useState } from "react";
import type { HistoryEntry, Selection } from "../types/sheet";
import { cloneRows } from "./useSheet";

export const MAX_HISTORY = 50;

export function useHistory() {
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  // Mirror stacks in refs so rapid successive undo/redo (same tick, before
  // re-render) read the latest length instead of a stale closure snapshot.
  const undoRef = useRef<HistoryEntry[]>([]);
  const redoRef = useRef<HistoryEntry[]>([]);

  function record(rows: HistoryEntry["rows"], selection: Selection): void {
    const next = [...undoRef.current, { rows: cloneRows(rows), selection }].slice(
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
    const nextRedo = [
      ...redoRef.current,
      { rows: cloneRows(current.rows), selection: current.selection },
    ];
    undoRef.current = nextUndo;
    redoRef.current = nextRedo;
    setUndoStack(nextUndo);
    setRedoStack(nextRedo);
    return { rows: cloneRows(previous.rows), selection: previous.selection };
  }

  function redo(current: HistoryEntry): HistoryEntry | null {
    const stack = redoRef.current;
    const nextEntry = stack[stack.length - 1];
    if (!nextEntry) {
      return null;
    }
    const nextRedo = stack.slice(0, -1);
    const nextUndo = [
      ...undoRef.current,
      { rows: cloneRows(current.rows), selection: current.selection },
    ];
    redoRef.current = nextRedo;
    undoRef.current = nextUndo;
    setRedoStack(nextRedo);
    setUndoStack(nextUndo);
    return { rows: cloneRows(nextEntry.rows), selection: nextEntry.selection };
  }

  function reset(): void {
    undoRef.current = [];
    redoRef.current = [];
    setUndoStack([]);
    setRedoStack([]);
  }

  function snapshot(): { undo: HistoryEntry[]; redo: HistoryEntry[] } {
    return {
      undo: undoRef.current.map((entry) => ({
        rows: cloneRows(entry.rows),
        selection: { ...entry.selection },
      })),
      redo: redoRef.current.map((entry) => ({
        rows: cloneRows(entry.rows),
        selection: { ...entry.selection },
      })),
    };
  }

  function restore(undo: HistoryEntry[], redo: HistoryEntry[]): void {
    const nextUndo = undo.map((entry) => ({
      rows: cloneRows(entry.rows),
      selection: { ...entry.selection },
    }));
    const nextRedo = redo.map((entry) => ({
      rows: cloneRows(entry.rows),
      selection: { ...entry.selection },
    }));
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
