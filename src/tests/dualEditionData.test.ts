import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  clearVisibleRange,
  dataEdge,
  moveColumn,
  pasteIntoView,
  selectedSourceRows,
} from "../lib/gridOperations";
import { serializeTableText, parseTableText } from "../lib/formats";
import { useHistory } from "../hooks/useHistory";
import { useSelection } from "../hooks/useSelection";
import { useSheet } from "../hooks/useSheet";
import { applyFilters } from "../hooks/useFilter";
import { completedSaveMeta, type SaveCompletion } from "../lib/saveState";
import { createDocument, useDocuments } from "../hooks/useDocuments";
import { DEFAULT_META, type FileFormat } from "../types/sheet";

const rows = [
  ["name", "group"],
  ["00123", "A"],
  ["hidden", "B"],
  ["9007199254740993", "A"],
  ["tail", "B"],
];
const range = { startRow: 1, startCol: 0, endRow: 3, endCol: 0 };

describe("production filtered operations", () => {
  it("pastes into noncontiguous visible source rows without changing hidden rows or source input", () => {
    const before = structuredClone(rows);
    const result = pasteIntoView(rows, 1, 0, [["日本語"], ["=text"]], [0, 1, 3])!;
    expect(result.rows).toEqual([
      ["name", "group"],
      ["日本語", "A"],
      ["hidden", "B"],
      ["=text", "A"],
      ["tail", "B"],
    ]);
    expect(rows).toEqual(before);
    expect(result.range).toEqual(range);
  });
  it("rejects the complete paste at a missing/virtual target or beyond the visible end", () => {
    expect(pasteIntoView(rows, 3, 0, [["x"], ["y"]], [0, 1, 3])).toBeNull();
    expect(pasteIntoView(rows, 2, 0, [["x"]], [0, 1, 3])).toBeNull();
    expect(pasteIntoView(rows, 5, 0, [["x"]], [0, 1, 3])).toBeNull();
    expect(pasteIntoView(rows, 0, 0, [["x"]], [])).toBeNull();
  });
  it("selects and clears visible rows only, including a reversed range", () => {
    expect(selectedSourceRows(rows.length, range, [0, 1, 3])).toEqual([1, 3]);
    const cleared = clearVisibleRange(rows, { ...range, startRow: 3, endRow: 1 }, [0, 1, 3]);
    expect(cleared[1][0]).toBe("");
    expect(cleared[3][0]).toBe("");
    expect(cleared[2]).toEqual(rows[2]);
    expect(cleared[4]).toEqual(rows[4]);
  });
  it("pins the first row only when the explicit header setting is enabled", () => {
    const filters = new Map([[1, new Set(["A"])]]);
    expect(applyFilters(rows, filters, true).map((r) => r.sourceIndex)).toEqual([0, 1, 3]);
    expect(applyFilters(rows, filters, false).map((r) => r.sourceIndex)).toEqual([1, 3]);
    expect(serializeTableText(rows, "csv", ",", "LF")).toContain("hidden,B");
  });
});

describe("real hook history and column state", () => {
  it("restores one multi-cell change, selection and manual widths in one undo/redo", () => {
    const { result } = renderHook(() => ({ sheet: useSheet(), history: useHistory() }));
    act(() => result.current.sheet.loadData(rows, {}));
    act(() => result.current.sheet.setColumnWidth(0, 321));
    const before = {
      rows: result.current.sheet.rows,
      selection: { row: 1, col: 0 },
      range,
      colWidths: result.current.sheet.colWidths,
    };
    const pasted = pasteIntoView(before.rows, 1, 0, [["x"], ["y"]], [0, 1, 3])!;
    act(() => {
      result.current.history.record(before.rows, before.selection, before);
      result.current.sheet.replaceRows(pasted.rows);
    });
    expect(result.current.sheet.colWidths[0]).toBe(321);
    let restored: ReturnType<typeof result.current.history.undo> = null;
    act(() => {
      restored = result.current.history.undo({ ...before, rows: pasted.rows });
    });
    expect(restored).toEqual(before);
    expect(result.current.history.canUndo).toBe(false);
    let redone: ReturnType<typeof result.current.history.redo> = null;
    act(() => {
      redone = result.current.history.redo(before);
    });
    expect(redone).toEqual({ ...before, rows: pasted.rows });
  });
  it("moves values and widths together and preserves the new saved column order", () => {
    const moved = moveColumn(rows, { 0: 300, 1: 80 }, 2, 0, 1)!;
    expect(moved.rows[1]).toEqual(["A", "00123"]);
    expect(moved.widths).toEqual({ 0: 80, 1: 300 });
    expect(parseTableText(serializeTableText(moved.rows, "csv", ",", "LF"), "csv", ",")).toEqual(
      moved.rows,
    );
    expect(moveColumn(rows, {}, 2, 0, 3)).toBeNull();
  });
  it("keeps the actual grid active-cell anchor when a range grows and shrinks", () => {
    const { result } = renderHook(() => useSelection());
    act(() =>
      result.current.setSelectionRange(
        { row: 1, col: 1 },
        { startRow: 1, startCol: 1, endRow: 3, endCol: 3 },
      ),
    );
    expect(result.current.selection).toEqual({ row: 1, col: 1 });
    act(() =>
      result.current.setSelectionRange(
        { row: 1, col: 1 },
        { startRow: 1, startCol: 1, endRow: 2, endCol: 2 },
      ),
    );
    expect(result.current.range?.endRow).toBe(2);
    expect(result.current.selection).toEqual({ row: 1, col: 1 });
  });
  it("navigates to data runs and next data, without virtual padding", () => {
    const data = [["a", "b", "", "c", "d"], ["1"], ["2"], [""], ["3"]];
    expect(dataEdge(data, { row: 0, col: 0 }, { row: 0, col: 1 })).toEqual({ row: 0, col: 1 });
    expect(dataEdge(data, { row: 0, col: 1 }, { row: 0, col: 1 })).toEqual({ row: 0, col: 3 });
    expect(dataEdge(data, { row: 0, col: 0 }, { row: 1, col: 0 })).toEqual({ row: 2, col: 0 });
    expect(dataEdge(data, { row: 2, col: 0 }, { row: 1, col: 0 })).toEqual({ row: 4, col: 0 });
  });
});

for (const format of ["csv", "tsv", "markdown", "json", "yaml"] as FileFormat[]) {
  it(`preserves the synthetic string values through ${format} edit/save/reload`, () => {
    const data = [
      ["id", "value"],
      ["00123", "9007199254740993"],
      ["1-2", "=text"],
      ["", "日本語"],
      ['a"b', "line1\nline2"],
    ];
    const delimiter = format === "tsv" ? "\t" : ",";
    expect(
      parseTableText(serializeTableText(data, format, delimiter, "LF"), format, delimiter),
    ).toEqual(data);
  });
}

describe("save completion identity/state", () => {
  const snapshot = {
    documentId: "A",
    rows: [["original"]],
    meta: { ...DEFAULT_META, dirty: true, filePath: "/a/same.csv" },
  };
  const completion: SaveCompletion = {
    snapshot,
    patch: { filePath: "/a/same.csv" },
    method: "direct",
  };
  it("marks only an unchanged snapshot clean, retaining edits and settings made during a write", () => {
    expect(completedSaveMeta(snapshot.rows, snapshot.meta, completion).dirty).toBe(false);
    expect(completedSaveMeta([["edited during save"]], snapshot.meta, completion).dirty).toBe(true);
    const changed = { ...snapshot.meta, encoding: "cp932" as const };
    expect(
      completedSaveMeta(snapshot.rows, changed, { ...completion, patch: { encoding: "utf-8" } }),
    ).toMatchObject({ encoding: "cp932", dirty: true });
    expect(
      completedSaveMeta(snapshot.rows, snapshot.meta, { ...completion, method: "download" }).dirty,
    ).toBe(true);
  });
  it("updates only the matching inactive document, and ignores a closed document", () => {
    const a = createDocument(snapshot.rows, snapshot.meta);
    const { result } = renderHook(() => useDocuments(a));
    let b: ReturnType<typeof createDocument>;
    act(() => {
      b = result.current.openDocument([["B"]], { filePath: "/b/same.csv", dirty: true });
    });
    act(() =>
      result.current.completeSave({ ...completion, snapshot: { ...snapshot, documentId: a.id } }),
    );
    expect(result.current.documents.find((doc) => doc.id === a.id)!.meta.dirty).toBe(false);
    expect(result.current.documents.find((doc) => doc.id === b.id)!.meta.dirty).toBe(true);
    act(() => result.current.closeDocument(a.id));
    act(() =>
      result.current.completeSave({ ...completion, snapshot: { ...snapshot, documentId: a.id } }),
    );
    expect(result.current.documents).toHaveLength(1);
    expect(result.current.documents[0].id).toBe(b!.id);
  });
});
