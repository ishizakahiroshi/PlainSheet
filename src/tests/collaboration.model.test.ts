import { describe, expect, it } from "vitest";
import {
  actionsForCellMatrix,
  activeIds,
  applyCollaborationOperation,
  createSharedDocument,
  deleteAxisActions,
  insertAxisActions,
  sharedDocumentRows,
} from "../lib/collaboration";

describe("stable collaboration model", () => {
  it("keeps raw strings and preserves identity through reorder and conditional Undo", () => {
    const before = createSharedDocument([
      ["000123", "=A1"],
      ["12345678901234567890", "plain"],
    ]);
    const rowIds = activeIds(before, "row");
    const operation = {
      id: "sort",
      baseRevision: 0,
      actions: [{ type: "reorder" as const, axis: "row" as const, ids: [...rowIds].reverse() }],
    };
    const sorted = applyCollaborationOperation(before, operation);
    expect(sharedDocumentRows(sorted.document)).toEqual([
      ["12345678901234567890", "plain"],
      ["000123", "=A1"],
    ]);
    const undone = applyCollaborationOperation(sorted.document, {
      id: "undo-sort",
      baseRevision: 1,
      actions: sorted.inverse,
    });
    expect(sharedDocumentRows(undone.document)).toEqual(sharedDocumentRows(before));
    expect(activeIds(undone.document, "row")).toEqual(rowIds);
  });

  it("requires explicit structural operations rather than guessing identity from matrix differences", () => {
    const document = createSharedDocument([["a", "b"]]);
    expect(actionsForCellMatrix(document, [["a", "new"]])).toHaveLength(1);
    expect(() => actionsForCellMatrix(document, [["a"], ["b"]])).toThrow("structural operation");
    const actions = insertAxisActions(document, "row", 0, 2);
    const expanded = applyCollaborationOperation(document, {
      id: "insert",
      baseRevision: 0,
      actions,
    });
    expect(sharedDocumentRows(expanded.document)).toEqual([
      ["", ""],
      ["", ""],
      ["a", "b"],
    ]);
    const removed = applyCollaborationOperation(expanded.document, {
      id: "delete",
      baseRevision: 1,
      actions: deleteAxisActions(expanded.document, "column", [0]),
    });
    expect(sharedDocumentRows(removed.document)).toEqual([[""], [""], ["b"]]);
  });

  it("rejects a stale reorder when another participant inserted a row", () => {
    const before = createSharedDocument([["a"], ["b"]]);
    const ids = activeIds(before, "row");
    const inserted = applyCollaborationOperation(before, {
      id: "insert",
      baseRevision: 0,
      actions: insertAxisActions(before, "row", 1),
    });
    expect(() =>
      applyCollaborationOperation(inserted.document, {
        id: "stale-sort",
        baseRevision: 0,
        actions: [{ type: "reorder", axis: "row", ids: [...ids].reverse() }],
      }),
    ).toThrow("Rows or columns changed");
  });

  it("rejects non-string data, oversized cells, prototype-shaped invalid IDs and duplicate identities", () => {
    expect(() => createSharedDocument([[123]])).toThrow();
    expect(() => createSharedDocument([["x".repeat(32769)]])).toThrow();
    const document = createSharedDocument([[""]]);
    expect(() =>
      applyCollaborationOperation(document, {
        id: "bad",
        baseRevision: 0,
        actions: [{ type: "set-cell", rowId: "a:b", columnId: "__proto__", value: "x" }],
      }),
    ).toThrow();
    expect(() =>
      applyCollaborationOperation(document, {
        id: "duplicate",
        baseRevision: 0,
        actions: [{ type: "insert", axis: "row", id: document.rows[0].id, afterId: null }],
      }),
    ).toThrow("already in use");
  });
});
