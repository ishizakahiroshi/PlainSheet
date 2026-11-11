import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createDocument, useDocuments } from "../hooks/useDocuments";
import { resolveTarget } from "../lib/selectionTarget";

describe("createDocument", () => {
  it("creates an independent snapshot with defaults", () => {
    const doc = createDocument(
      [
        ["a", "b"],
        ["1", "2"],
      ],
      { fileName: "demo.csv", format: "csv" },
    );
    expect(doc.id).toMatch(/^doc-/);
    expect(doc.meta.fileName).toBe("demo.csv");
    expect(doc.meta.dirty).toBe(false);
    expect(doc.rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
    expect(doc.history).toEqual({ undo: [], redo: [] });
    // Mutating returned rows must not affect a second create from the same source.
    doc.rows[0]![0] = "x";
    const other = createDocument(
      [
        ["a", "b"],
        ["1", "2"],
      ],
      { fileName: "demo.csv" },
    );
    expect(other.rows[0]![0]).toBe("a");
  });

  it("refreshes content when reopening a document with the same filePath", () => {
    const first = createDocument([["old"]], {
      filePath: "/tmp/demo.csv",
      fileName: "demo.csv",
    });
    const { result } = renderHook(() => useDocuments(first));
    let reopened: ReturnType<typeof result.current.openDocument>;
    act(() => {
      reopened = result.current.openDocument([["new", "row"]], {
        filePath: "/tmp/demo.csv",
        fileName: "demo.csv",
      });
    });
    expect(reopened!.id).toBe(first.id);
    expect(reopened!.rows).toEqual([["new", "row"]]);
  });

  it("excludes manually hidden rows and columns from whole-axis resolveTarget", () => {
    const colTarget = resolveTarget({
      selection: { row: 1, col: 0 },
      range: null,
      selectedRows: [],
      selectedColumns: [0],
      rowCount: 3,
      columnCount: 2,
      visibleRows: [1, 2],
      visibleColumns: [0, 1],
      filtered: false,
    });
    expect(colTarget.rows).toEqual([1, 2]);
    expect(colTarget.anchor).toEqual({ row: 1, col: 0 });

    const rowTarget = resolveTarget({
      selection: { row: 0, col: 1 },
      range: null,
      selectedRows: [0],
      selectedColumns: [],
      rowCount: 3,
      columnCount: 2,
      visibleRows: [0, 1, 2],
      visibleColumns: [1],
      filtered: false,
    });
    expect(rowTarget.columns).toEqual([1]);
    expect(rowTarget.anchor).toEqual({ row: 0, col: 1 });
  });
});
