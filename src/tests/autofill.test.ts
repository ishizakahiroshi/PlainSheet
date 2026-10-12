import { describe, expect, it } from "vitest";
import { buildFillUpdates, fillSeries } from "../lib/autofill";

describe("fillSeries", () => {
  it("extends numeric sequences by step", () => {
    expect(fillSeries(["1", "2"], 3)).toEqual(["3", "4", "5"]);
    expect(fillSeries(["10"], 2)).toEqual(["11", "12"]);
  });

  it("extends trailing numbers", () => {
    expect(fillSeries(["item1"], 3)).toEqual(["item2", "item3", "item4"]);
    expect(fillSeries(["A01", "A02"], 2)).toEqual(["A03", "A04"]);
  });

  it("cycle-copies non-numeric text", () => {
    expect(fillSeries(["a", "b"], 4)).toEqual(["a", "b", "a", "b"]);
  });

  it("handles empty source and zero count", () => {
    expect(fillSeries([], 2)).toEqual(["", ""]);
    expect(fillSeries(["1"], 0)).toEqual([]);
  });
});

describe("exact numeric and raw-text series", () => {
  it("does not round integers beyond 2^53 or base-10 decimals", () => {
    expect(fillSeries(["9007199254740993"], 3)).toEqual([
      "9007199254740994",
      "9007199254740995",
      "9007199254740996",
    ]);
    expect(fillSeries(["0.1", "0.2"], 3)).toEqual(["0.3", "0.4", "0.5"]);
    expect(fillSeries(["0.10", "0.20"], 2)).toEqual(["0.30", "0.40"]);
    expect(fillSeries(["-0.2", "-0.1"], 3)).toEqual(["0.0", "0.1", "0.2"]);
  });

  it("retains leading zero width, grouping and meaningful decimal padding", () => {
    expect(fillSeries(["00123"], 2)).toEqual(["00124", "00125"]);
    expect(fillSeries(["009.90", "010.00"], 2)).toEqual(["010.10", "010.20"]);
    expect(fillSeries(["9,999"], 2)).toEqual(["10,000", "10,001"]);
    expect(fillSeries([" +001 "], 1)).toEqual([" +002 "]);
  });

  it("treats dates and incompatible suffix prefixes as raw text", () => {
    expect(fillSeries(["2026-10-11"], 2)).toEqual(["2026-10-11", "2026-10-11"]);
    expect(fillSeries(["A01", "B02"], 3)).toEqual(["A01", "B02", "A01"]);
    expect(fillSeries(["item-001"], 2)).toEqual(["item-002", "item-003"]);
    expect(fillSeries(["1,2"], 2)).toEqual(["1,2", "1,2"]);
  });

  it("falls back to copy for an oversized numeric suffix instead of throwing", () => {
    const text = "item" + "1".repeat(10001);
    expect(fillSeries([text], 1)).toEqual([text]);
  });

  it("explicit copy never interprets numeric, padded, suffix or date values", () => {
    const values = ["00123", "9007199254740993", "0.1", "item-001", "2026-10-11", ""];
    expect(fillSeries(values, values.length, "copy")).toEqual(values);
    expect(fillSeries(["10"], 2, "copy")).toEqual(["10", "10"]);
  });
});

describe("full-destination fill contract", () => {
  it("keeps 1,2 seeds unchanged and produces only the 3,4,5 extension", () => {
    const rows = [["1"], ["2"]];
    expect(
      buildFillUpdates(
        rows,
        { x: 0, y: 0, width: 1, height: 2 },
        { x: 0, y: 0, width: 1, height: 5 },
      ),
    ).toEqual([
      { row: 2, col: 0, value: "3" },
      { row: 3, col: 0, value: "4" },
      { row: 4, col: 0, value: "5" },
    ]);
    expect(rows).toEqual([["1"], ["2"]]);
  });

  it("fills backward and horizontally without replacing the source rectangle", () => {
    expect(
      buildFillUpdates(
        [[""], [""], ["3"], ["4"]],
        { x: 0, y: 2, width: 1, height: 2 },
        { x: 0, y: 0, width: 1, height: 4 },
      ),
    ).toEqual([
      { row: 0, col: 0, value: "1" },
      { row: 1, col: 0, value: "2" },
    ]);
    expect(
      buildFillUpdates(
        [["", "", "003", "004"]],
        { x: 2, y: 0, width: 2, height: 1 },
        { x: 0, y: 0, width: 4, height: 1 },
      ),
    ).toEqual([
      { row: 0, col: 0, value: "001" },
      { row: 0, col: 1, value: "002" },
    ]);
    expect(
      buildFillUpdates(
        [["1", "2"]],
        { x: 0, y: 0, width: 2, height: 1 },
        { x: 0, y: 0, width: 4, height: 1 },
      ),
    ).toEqual([
      { row: 0, col: 2, value: "3" },
      { row: 0, col: 3, value: "4" },
    ]);
  });

  it("copy mode gives Ctrl+D/R their copy behavior", () => {
    expect(
      buildFillUpdates(
        [["10"]],
        { x: 0, y: 0, width: 1, height: 1 },
        { x: 0, y: 0, width: 1, height: 3 },
        { mode: "copy" },
      ),
    ).toEqual([
      { row: 1, col: 0, value: "10" },
      { row: 2, col: 0, value: "10" },
    ]);
    expect(
      buildFillUpdates(
        [["10"]],
        { x: 0, y: 0, width: 1, height: 1 },
        { x: 0, y: 0, width: 3, height: 1 },
        { mode: "copy" },
      ),
    ).toEqual([
      { row: 0, col: 1, value: "10" },
      { row: 0, col: 2, value: "10" },
    ]);
  });

  it("handles multiple columns, empty values, and text separately", () => {
    expect(
      buildFillUpdates(
        [
          ["1", "x", ""],
          ["2", "y", ""],
        ],
        { x: 0, y: 0, width: 3, height: 2 },
        { x: 0, y: 0, width: 3, height: 3 },
      ),
    ).toEqual([
      { row: 2, col: 0, value: "3" },
      { row: 2, col: 1, value: "x" },
      { row: 2, col: 2, value: "" },
    ]);
  });

  it("anchors tile copies to the source, including above and left", () => {
    const updates = buildFillUpdates(
      [[], ["", "a", "b"], ["", "c", "d"]],
      { x: 1, y: 1, width: 2, height: 2 },
      { x: 0, y: 0, width: 4, height: 4 },
    );
    expect(updates.find(({ row, col }) => row === 0 && col === 0)?.value).toBe("d");
    expect(updates.find(({ row, col }) => row === 3 && col === 3)?.value).toBe("a");
    expect(updates).toHaveLength(12);
  });

  it("leaves source-row mapping to the caller once, preserving hidden rows", () => {
    const original = [["1"], ["hidden"], ["2"], ["hidden"], [""], ["hidden"]];
    const visibleIndexes = [0, 2, 4];
    const visible = visibleIndexes.map((index) => original[index]!);
    const updates = buildFillUpdates(
      visible,
      { x: 0, y: 0, width: 1, height: 2 },
      { x: 0, y: 0, width: 1, height: 3 },
    );
    const next = original.map((row) => [...row]);
    for (const update of updates) next[visibleIndexes[update.row]!]![update.col] = update.value;
    expect(next).toEqual([["1"], ["hidden"], ["2"], ["hidden"], ["3"], ["hidden"]]);
  });

  it("returns no writes for an unchanged or invalid destination", () => {
    const source = { x: 0, y: 0, width: 1, height: 1 };
    expect(buildFillUpdates([["1"]], source, source)).toEqual([]);
    expect(buildFillUpdates([["1"]], source, { ...source, height: 0 })).toEqual([]);
    expect(buildFillUpdates([["1"]], source, { ...source, y: -1 })).toEqual([]);
  });
});
