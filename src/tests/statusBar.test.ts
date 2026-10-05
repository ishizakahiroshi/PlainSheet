import { describe, expect, it } from "vitest";
import { calculateSelectionStats } from "../components/StatusBar";

describe("calculateSelectionStats", () => {
  it("excludes gaps in exact row and column selections from all statistics", () => {
    const values = [
      ["1", "100", ""],
      ["100", "100", "100"],
      ["2", "100", ""],
    ];
    const stats = calculateSelectionStats(
      values,
      { startRow: 0, startCol: 0, endRow: 2, endCol: 2 },
      [0, 2],
      [0, 2],
    );
    expect(stats).toEqual({
      count: 2,
      numericCount: 2,
      total: "3",
      average: "1.50",
      max: "2",
      min: "1",
    });
  });
  it("intersects exact selected rows with filter visibility", () => {
    expect(
      calculateSelectionStats(
        [["1"], ["100"], ["2"]],
        { startRow: 0, startCol: 0, endRow: 2, endCol: 0 },
        [0, 2],
        [],
        [0, 1],
      ),
    ).toMatchObject({ count: 1, numericCount: 1, total: "1", average: "1" });
  });
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
