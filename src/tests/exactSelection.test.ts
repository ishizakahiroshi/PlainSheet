import { describe, expect, it } from "vitest";
import { clearVisibleRange, selectionIndexes } from "../lib/gridOperations";

const rows = [
  ["a", "b", "c"],
  ["d", "e", "f"],
  ["g", "h", "i"],
];
const range = { startRow: 0, endRow: 2, startCol: 0, endCol: 2 };
describe("exact header selections", () => {
  it("retains nonadjacent rows and columns without modifying gaps", () => {
    expect(selectionIndexes(rows, range, null, [0, 2], [0, 2])).toEqual({
      rows: [0, 2],
      columns: [0, 2],
    });
    expect(clearVisibleRange(rows, range, null, [0, 2], [0, 2])).toEqual([
      ["", "b", ""],
      ["d", "e", "f"],
      ["", "h", ""],
    ]);
    expect(rows[0]).toEqual(["a", "b", "c"]);
  });
  it("intersects exact rows with visible rows and retains rectangle overrides", () => {
    expect(selectionIndexes(rows, range, [0, 1], [0, 2])).toEqual({
      rows: [0],
      columns: [0, 1, 2],
    });
    expect(clearVisibleRange(rows, range, [0, 2])).toEqual([
      ["", "", ""],
      ["d", "e", "f"],
      ["", "", ""],
    ]);
  });
});
