import { describe, expect, it } from "vitest";
import { previewCleanup, previewDedupe } from "../lib/cleanup";

describe("exact-source cleanup", () => {
  it("preserves IDs and hidden / unselected cells without mutating before Apply", () => {
    const rows = [
      [" 00123 ", " 900719925474099312345 "],
      [" hidden ", " gap "],
      ["　tail　", "\u00a0keep\u00a0"],
    ];
    const preview = previewCleanup(
      rows,
      [
        { row: 0, col: 0 },
        { row: 0, col: 0 },
        { row: 2, col: 0 },
      ],
      { asciiWhitespace: true, fullwidthSpace: false },
    );
    expect(rows[0][0]).toBe(" 00123 ");
    expect(preview.nextRows).toEqual([
      ["00123", " 900719925474099312345 "],
      [" hidden ", " gap "],
      ["　tail　", "\u00a0keep\u00a0"],
    ]);
    expect(preview.changedCells).toBe(1);
    expect(preview.targetedCells).toBe(2);
    expect(
      previewCleanup(rows, [{ row: 2, col: 0 }], { asciiWhitespace: false, fullwidthSpace: true })
        .nextRows[2],
    ).toEqual(["tail", "\u00a0keep\u00a0"]);
  });
  it("handles empty and ragged cells and caps preview without capping changes", () => {
    const rows = Array.from({ length: 201 }, () => [" 900719925474099312345 ", ""]);
    const preview = previewCleanup(
      rows,
      [...rows.map((_, row) => ({ row, col: 0 })), { row: -1, col: 0 }, { row: 0, col: 20 }],
      { asciiWhitespace: true, fullwidthSpace: true },
    );
    expect(preview.changedCells).toBe(201);
    expect(preview.changes).toHaveLength(100);
    expect(preview.truncated).toBe(true);
    expect(preview.nextRows[200][0]).toBe("900719925474099312345");
  });
  it("deduplicates selected rows using explicit keys/header/case without hidden participation", () => {
    const rows = [
      ["ID", "name"],
      ["00123", "A"],
      ["00123", "HIDDEN"],
      ["00123", "a"],
      ["123", "a"],
      ["00123", "A"],
    ];
    const preview = previewDedupe(rows, [0, 1, 3, 4, 5], {
      keyColumns: [0, 1],
      caseSensitive: false,
      hasHeader: true,
    });
    expect(preview.removedSourceRows).toEqual([3, 5]);
    expect(preview.nextRows).toEqual([rows[0], rows[1], rows[2], rows[4]]);
    expect(rows).toHaveLength(6);
    expect(
      previewDedupe(rows, [1, 3], { keyColumns: [0, 1], caseSensitive: true, hasHeader: true })
        .removedSourceRows,
    ).toEqual([]);
    expect(
      previewDedupe(rows, [1, 3], { keyColumns: [], caseSensitive: true, hasHeader: false }).error,
    ).toBeTruthy();
  });
  it("does not collide composite values or numeric-looking long IDs", () => {
    const rows = [
      ["a,b", "c"],
      ["a", "b,c"],
      ["9007199254740992", ""],
      ["9007199254740993", ""],
    ];
    expect(
      previewDedupe(rows, [0, 1, 2, 3], {
        keyColumns: [0, 1],
        caseSensitive: true,
        hasHeader: false,
      }).removedSourceRows,
    ).toEqual([]);
  });
});
