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

  it("clamps huge virtual ranges to stored rows and columns", () => {
    const stats = calculateSelectionStats(rows, {
      startRow: 0,
      startCol: 0,
      endRow: 1_048_575,
      endCol: 16_383,
    });
    expect(stats).toMatchObject({
      count: 7,
      numericCount: 3,
      total: "35",
      max: "20",
      min: "5",
    });
  });

  it("computes min and max over >130k numeric cells without stack overflow", () => {
    const bigRow = Array.from({ length: 130_000 }, (_, i) => String(i + 1));
    const stats = calculateSelectionStats([bigRow], {
      startRow: 0,
      startCol: 0,
      endRow: 0,
      endCol: bigRow.length - 1,
    });
    expect(stats).toMatchObject({
      count: 130_000,
      numericCount: 130_000,
      min: "1",
      max: "130000",
    });
  });
});
