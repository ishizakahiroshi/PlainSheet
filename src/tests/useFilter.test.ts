import { describe, expect, it } from "vitest";
import { applyFilters, uniqueColumnValues } from "../hooks/useFilter";

describe("applyFilters", () => {
  const rows = [
    ["a", "1"],
    ["b", "2"],
    ["a", "3"],
    ["c", "2"],
  ];

  it("returns all rows when no filters", () => {
    expect(applyFilters(rows, new Map()).map((r) => r.sourceIndex)).toEqual([0, 1, 2, 3]);
  });

  it("filters a single column", () => {
    const filters = new Map([[0, new Set(["a"])]]);
    expect(applyFilters(rows, filters).map((r) => r.sourceIndex)).toEqual([0, 2]);
  });

  it("applies AND across columns", () => {
    const filters = new Map([
      [0, new Set(["a", "c"])],
      [1, new Set(["2"])],
    ]);
    expect(applyFilters(rows, filters).map((r) => r.sourceIndex)).toEqual([3]);
  });
});

describe("uniqueColumnValues", () => {
  it("returns first-seen order without duplicates", () => {
    expect(uniqueColumnValues([["x"], ["y"], ["x"], ["z"]], 0)).toEqual(["x", "y", "z"]);
  });
});
