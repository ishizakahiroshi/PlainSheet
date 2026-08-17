import { describe, expect, it } from "vitest";
import { calculateSelectionStats } from "../components/StatusBar";

describe("calculateSelectionStats", () => {
  const rows = [
    ["a", "10", ""],
    ["b", "20", "x"],
    ["c", "5", ""],
  ];

  it("returns count, max, min for numeric selection", () => {
    const stats = calculateSelectionStats(rows, {
      startRow: 0,
      startCol: 1,
      endRow: 2,
      endCol: 1,
    });
    expect(stats).toMatchObject({
      count: 3,
      numericCount: 3,
      total: "35",
      average: "11.67",
      max: "20",
      min: "5",
    });
  });

  it("returns count only when no numbers", () => {
    const stats = calculateSelectionStats(rows, {
      startRow: 0,
      startCol: 0,
      endRow: 2,
      endCol: 0,
    });
    expect(stats).toEqual({
      count: 3,
      numericCount: 0,
      total: null,
      average: null,
      max: null,
      min: null,
    });
  });

  it("returns null for fully empty selection", () => {
    expect(
      calculateSelectionStats(rows, {
        startRow: 0,
        startCol: 2,
        endRow: 0,
        endCol: 2,
      }),
    ).toBeNull();
  });
});
