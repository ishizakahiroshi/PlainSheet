import { describe, expect, it } from "vitest";
import { sortRows, sortRowsByKeys } from "../lib/sort";

describe("sortRows", () => {
  it("sorts numbers ascending and descending", () => {
    const rows = [["3"], ["1"], ["2"]];
    expect(sortRows(rows, 0, "asc")).toEqual([["1"], ["2"], ["3"]]);
    expect(sortRows(rows, 0, "desc")).toEqual([["3"], ["2"], ["1"]]);
  });

  it("sorts strings with localeCompare", () => {
    const rows = [["c"], ["a"], ["b"]];
    expect(sortRows(rows, 0, "asc")).toEqual([["a"], ["b"], ["c"]]);
  });

  it("keeps empty cells at the end", () => {
    const rows = [["2"], [""], ["1"], [""]];
    expect(sortRows(rows, 0, "asc")).toEqual([["1"], ["2"], [""], [""]]);
  });

  it("keeps the header row fixed when requested", () => {
    const rows = [
      ["name", "score"],
      ["b", "2"],
      ["a", "10"],
    ];
    expect(sortRows(rows, 1, "asc", { headerRow: true })).toEqual([
      ["name", "score"],
      ["b", "2"],
      ["a", "10"],
    ]);
    expect(sortRows(rows, 0, "asc", { headerRow: true })).toEqual([
      ["name", "score"],
      ["a", "10"],
      ["b", "2"],
    ]);
  });
});

describe("exact and explicit sort modes", () => {
  it("orders adjacent long integers exactly without changing raw cell strings", () => {
    const rows = [["9007199254740993"], ["9007199254740992"], ["9007199254740994"]];
    expect(sortRows(rows, 0, "asc")).toEqual([
      ["9007199254740992"],
      ["9007199254740993"],
      ["9007199254740994"],
    ]);
    expect(rows[0]).toEqual(["9007199254740993"]);
  });

  it("compares signs, decimals, correctly grouped numbers and zero-padded values exactly", () => {
    const rows = [
      ["1,000"],
      ["0002"],
      ["-0.10"],
      ["0.00000000000000000002"],
      ["0.00000000000000000001"],
      ["-2"],
      [""],
    ];
    expect(sortRows(rows, 0, "asc")).toEqual([
      ["-2"],
      ["-0.10"],
      ["0.00000000000000000001"],
      ["0.00000000000000000002"],
      ["0002"],
      ["1,000"],
      [""],
    ]);
    expect(sortRows(rows, 0, "desc")[0]).toEqual(["1,000"]);
    expect(sortRows(rows, 0, "desc").at(-1)).toEqual([""]);
  });

  it("retains stable ordering for equal numeric values including padding", () => {
    const rows = [
      ["0001", "first"],
      ["1.0", "second"],
      ["1", "third"],
    ];
    expect(sortRows(rows, 0, "desc")).toEqual(rows);
  });

  it("makes text mode lexical and numeric mode exact with invalid text last", () => {
    const rows = [["2"], ["10"], ["日本語"], [""]];
    expect(sortRows(rows, 0, "asc", { mode: "text" })).toEqual([["10"], ["2"], ["日本語"], [""]]);
    expect(sortRows(rows, 0, "asc", { mode: "numeric" })).toEqual([
      ["2"],
      ["10"],
      ["日本語"],
      [""],
    ]);
    expect(sortRows(rows, 0, "desc", { mode: "numeric" })).toEqual([
      ["10"],
      ["2"],
      ["日本語"],
      [""],
    ]);
  });

  it("preserves natural mixed-text ordering in auto while explicit text is lexical", () => {
    expect(sortRows([["item10"], ["item2"]], 0, "asc")).toEqual([["item2"], ["item10"]]);
    expect(sortRows([["item10"], ["item2"]], 0, "asc", { mode: "text" })).toEqual([
      ["item10"],
      ["item2"],
    ]);
  });

  it("does not treat malformed comma grouping or dates as decimal numbers", () => {
    expect(sortRows([["1,2"], ["3"]], 0, "asc", { mode: "numeric" })).toEqual([["3"], ["1,2"]]);
    expect(sortRows([["2026-10-11"], ["3"]], 0, "asc", { mode: "numeric" })).toEqual([
      ["3"],
      ["2026-10-11"],
    ]);
  });
});

describe("multi-key sorting", () => {
  it("keeps the header, sorts whole rows, and uses each key's mode and direction", () => {
    const rows = [
      ["group", "score", "id"],
      ["B", "1", "x"],
      ["A", "2", "y"],
      ["A", "10", "z"],
      ["A", "10", "stable"],
    ];
    expect(
      sortRowsByKeys(
        rows,
        [
          { colIndex: 0, direction: "asc", mode: "text" },
          { colIndex: 1, direction: "desc", mode: "numeric" },
        ],
        { headerRow: true },
      ),
    ).toEqual([
      ["group", "score", "id"],
      ["A", "10", "z"],
      ["A", "10", "stable"],
      ["A", "2", "y"],
      ["B", "1", "x"],
    ]);
  });

  it("uses subsequent keys for equally empty first keys", () => {
    expect(
      sortRowsByKeys(
        [
          ["", "2"],
          ["", "1"],
          ["A", "3"],
        ],
        [
          { colIndex: 0, direction: "desc" },
          { colIndex: 1, direction: "asc" },
        ],
      ),
    ).toEqual([
      ["A", "3"],
      ["", "1"],
      ["", "2"],
    ]);
  });

  it("returns deep row clones for no keys or invalid indexes", () => {
    const rows = [["a"]];
    const result = sortRowsByKeys(rows, [{ colIndex: -1, direction: "asc" }]);
    expect(result).toEqual(rows);
    expect(result[0]).not.toBe(rows[0]);
    expect(sortRowsByKeys([], [])).toEqual([]);
  });
});
