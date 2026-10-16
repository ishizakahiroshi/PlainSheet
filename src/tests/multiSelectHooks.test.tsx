import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSheet } from "../hooks/useSheet";
import { useHistory } from "../hooks/useHistory";
import { createDocument, useDocuments } from "../hooks/useDocuments";
import { clipboardTsv, parseClipboardText } from "../lib/clipboard";
import { emptyView } from "../types/sheet";

const sample = Array.from({ length: 8 }, (_, i) => [
  `R${i + 1}`,
  "00123",
  "123456789012345678901234567890",
  "日本語",
  "a\tb",
  "line1\nline2",
]);

describe("real multi-target sheet hooks", () => {
  it("deletes only discontiguous rows and preserves a complete editable shape when all are deleted", () => {
    const { result } = renderHook(useSheet);
    act(() => result.current.loadData(sample, {}));
    act(() => result.current.deleteRows([5, 1, 3, 3, 999]));
    expect(result.current.rows.map((r) => r[0])).toEqual(["R1", "R3", "R5", "R7", "R8"]);
    act(() => result.current.deleteRows([0, 1, 2, 3, 4]));
    expect(result.current.rows).toEqual([Array(6).fill("")]);
  });
  it("clears discontiguous targets without collapsing trailing positions or refitting widths", () => {
    const { result } = renderHook(useSheet);
    act(() => result.current.loadData(sample, {}));
    act(() => result.current.setColumnWidth(1, 333));
    act(() => result.current.clearTargets([1, 3, 7], [0, 1, 2, 3, 4, 5]));
    expect(result.current.rows).toHaveLength(8);
    expect(result.current.rows[7]).toEqual(Array(6).fill(""));
    expect(result.current.rows[2]).toEqual(sample[2]);
    expect(result.current.colWidths[1]).toBe(333);
  });
  it("does not dirty an empty clear", () => {
    const { result } = renderHook(useSheet);
    act(() => result.current.loadData([["", ""]], {}));
    act(() => result.current.clearTargets([0, 999], [0, 1, 999]));
    expect(result.current.meta.dirty).toBe(false);
  });
  it("inserts and duplicates ordered blocks, retaining ragged row values", () => {
    const { result } = renderHook(useSheet);
    act(() => result.current.loadData([["a"], ["b", "B"], ["c"], ["d", "D"]], {}));
    act(() => result.current.duplicateTargets("row", [1, 3]));
    expect(result.current.rows).toEqual([
      ["a"],
      ["b", "B"],
      ["c"],
      ["d", "D"],
      ["b", "B"],
      ["d", "D"],
    ]);
    act(() => result.current.insertRows(4, 2));
    expect(result.current.rows.slice(4, 6)).toEqual([
      ["", ""],
      ["", ""],
    ]);
  });
  it("moves entire row and column blocks with their widths", () => {
    const { result } = renderHook(useSheet);
    act(() => result.current.loadData(sample, {}));
    act(() => result.current.setColumnWidth(1, 333));
    act(() => result.current.moveTargets("row", [1, 2], 1));
    expect(result.current.rows.map((r) => r[0])).toEqual([
      "R1",
      "R4",
      "R2",
      "R3",
      "R5",
      "R6",
      "R7",
      "R8",
    ]);
    act(() => result.current.moveTargets("column", [1, 2], 1));
    expect(result.current.rows[0]).toEqual([
      "R1",
      "日本語",
      "00123",
      "123456789012345678901234567890",
      "a\tb",
      "line1\nline2",
    ]);
    expect(result.current.colWidths[2]).toBe(333);
  });
  it("remaps widths on column insertion/deletion/duplication", () => {
    const { result } = renderHook(useSheet);
    act(() => result.current.loadData([["a", "b", "c"]], {}));
    act(() => result.current.setColumnWidth(1, 333));
    act(() => result.current.insertColumns(1, 2));
    expect(result.current.colWidths[3]).toBe(333);
    act(() => result.current.deleteColumns([1, 2]));
    expect(result.current.colWidths[1]).toBe(333);
    act(() => result.current.duplicateTargets("column", [1]));
    expect(result.current.colWidths[2]).toBe(333);
    expect(result.current.rows[0]).toEqual(["a", "b", "b", "c"]);
  });
  it("keeps editable rows after removing every column", () => {
    const { result } = renderHook(useSheet);
    act(() => result.current.loadData([["a", "b"], ["c"]], {}));
    act(() => result.current.deleteColumns([0, 1]));
    expect(result.current.rows).toEqual([[""], [""]]);
    expect(result.current.columnCount).toBe(1);
  });
});

describe("actual history and document view snapshots", () => {
  it("clones and restores widths, visibility, filter and whole-target selection in one undo/redo", () => {
    const { result } = renderHook(useHistory);
    const before = {
      rows: sample,
      selection: { row: 1, col: 1 },
      colWidths: { 1: 333 },
      selectedRows: [1, 3, 5],
      selectedColumns: [],
      view: {
        ...emptyView(),
        hiddenRows: [2],
        hiddenColumns: [4],
        filters: [[1, ["00123"]] as [number, string[]]],
        freezeColumns: 2,
      },
    };
    act(() => result.current.record(before.rows, before.selection, before));
    before.view.hiddenRows.push(7);
    let undone: ReturnType<typeof result.current.undo>;
    act(() => {
      undone = result.current.undo({ ...before, rows: [["changed"]], colWidths: { 1: 444 } });
    });
    expect(undone!.view?.hiddenRows).toEqual([2]);
    expect(undone!.selectedRows).toEqual([1, 3, 5]);
    expect(undone!.colWidths).toEqual({ 1: 333 });
    expect(result.current.canUndo).toBe(false);
    let redone: ReturnType<typeof result.current.redo>;
    act(() => {
      redone = result.current.redo(undone!);
    });
    expect(redone!.rows).toEqual([["changed"]]);
    expect(redone!.colWidths).toEqual({ 1: 444 });
  });
  it("keeps view state isolated through A to B to A", () => {
    const first = createDocument(sample, {});
    const { result } = renderHook(() => useDocuments(first));
    const live = {
      ...first,
      view: { ...emptyView(), hiddenRows: [1, 3], hiddenColumns: [2], freezeColumns: 1 },
      selectedRows: [5],
    };
    act(() => {
      result.current.addBlankDocument(live);
    });
    expect(result.current.active.view?.hiddenRows).toEqual([]);
    let restored: ReturnType<typeof result.current.switchTo>;
    act(() => {
      restored = result.current.switchTo(first.id, result.current.active);
    });
    expect(restored!.view).toEqual(live.view);
    expect(restored!.selectedRows).toEqual([5]);
    expect(restored!.rows).toEqual(sample);
  });
});

it("round-trips synthetic raw strings and trailing empty clipboard positions", () => {
  const grid = [
    ["00123", "123456789012345678901234567890", "日本語", "a\tb", "x\r\ny", 'a"b'],
    ["", "", "", "", "", ""],
  ];
  expect(parseClipboardText(clipboardTsv(grid))).toEqual(grid);
  expect(parseClipboardText(clipboardTsv([["a,b"], ["c,d"], [""]]))).toEqual([
    ["a,b"],
    ["c,d"],
    [""],
  ]);
  expect(parseClipboardText(clipboardTsv([['a"b']]))).toEqual([['a"b']]);
});
