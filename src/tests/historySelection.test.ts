import { act, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { cloneHistoryEntry, useHistory } from "../hooks/useHistory";
import type { HistoryEntry } from "../types/sheet";

it("clones exact axes and restores them across undo, redo and serialized tab history", () => {
  const before: HistoryEntry = {
    rows: [["a"], ["gap"], ["c"]],
    selection: { row: 0, col: 0 },
    range: { startRow: 0, startCol: 0, endRow: 2, endCol: 0 },
    selectedRows: [0, 2],
    selectedColumns: [],
  };
  const cloned = cloneHistoryEntry(before);
  cloned.selectedRows!.push(1);
  expect(before.selectedRows).toEqual([0, 2]);
  const { result } = renderHook(() => useHistory());
  act(() => result.current.record(before.rows, before.selection, before));
  const after = { ...before, rows: [[""], ["gap"], [""]] };
  let restored: HistoryEntry | null = null;
  act(() => {
    restored = result.current.undo(after);
  });
  expect(restored).toMatchObject(before);
  act(() => {
    restored = result.current.redo(before);
  });
  expect(restored).toMatchObject(after);
  const snapshot = result.current.snapshot();
  act(() => result.current.restore(snapshot.undo, snapshot.redo));
  snapshot.undo[0].selectedRows!.push(1);
  act(() => {
    restored = result.current.undo(after);
  });
  expect(restored!.selectedRows).toEqual([0, 2]);
});
