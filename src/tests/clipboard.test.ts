import { describe, expect, it } from "vitest";
import {
  clipboardNeedsFormatChoice,
  createClipboardSnapshot,
  normalizeRange,
  parseClipboardText,
  rangeTsv,
  readClipboardSnapshot,
  resolveClipboardText,
} from "../lib/clipboard";

describe("rangeTsv", () => {
  it("serializes a selected range as TSV", () => {
    expect(
      rangeTsv(
        [
          ["a", "b", "c"],
          ["d", "e", "f"],
        ],
        { startRow: 0, startCol: 1, endRow: 1, endCol: 2 },
      ),
    ).toBe("b\tc\ne\tf");
  });

  it("fills missing cells with empty strings", () => {
    expect(rangeTsv([["a"], ["b", "c"]], { startRow: 0, startCol: 0, endRow: 1, endCol: 1 })).toBe(
      "a\t\nb\tc",
    );
  });

  it("returns an empty string for null range", () => {
    expect(rangeTsv([["a"]], null)).toBe("");
  });
});

describe("parseClipboardText", () => {
  it("parses Excel TSV", () => {
    expect(parseClipboardText("a\tb\nc\td\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("parses quoted tabs and newlines", () => {
    expect(parseClipboardText('"a\tb"\t"c\n d"')).toEqual([["a\tb", "c\n d"]]);
  });

  it("keeps a single value as a 1x1 grid", () => {
    expect(parseClipboardText("plain")).toEqual([["plain"]]);
  });

  it("keeps a single comma line as one cell (commas are data, not columns)", () => {
    expect(parseClipboardText("a, b, c")).toEqual([["a, b, c"]]);
  });

  it("splits multi-line comma text into a grid when CSV is explicitly chosen", () => {
    expect(parseClipboardText("a,b\nc,d", "csv")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });
});

describe("normalizeRange", () => {
  it("normalizes reversed corners", () => {
    expect(normalizeRange({ startRow: 4, startCol: 3, endRow: 1, endCol: 0 })).toEqual({
      startRow: 1,
      startCol: 0,
      endRow: 4,
      endCol: 3,
    });
  });
});

describe("clipboard provenance", () => {
  it.each([
    [["North,East"], ["South,West"]],
    [['a"b']],
    [["last"], [""]],
    [[""]],
    [
      ["a\tb", ""],
      ["line1\r\nline2", ""],
    ],
    [
      ["", ""],
      ["", ""],
    ],
    [["\ufeffraw BOM", " spaced "]],
  ])("round-trips exact raw values and shape: %j", (...rows) => {
    const matrix = rows as string[][];
    const snapshot = createClipboardSnapshot(matrix, {
      startRow: 0,
      startCol: 0,
      endRow: matrix.length - 1,
      endCol: matrix[0]!.length - 1,
    });
    expect(resolveClipboardText(snapshot.text, snapshot)).toEqual(matrix);
    const restored = readClipboardSnapshot(JSON.stringify(snapshot), snapshot.text);
    expect(restored).toEqual(snapshot);
    expect(resolveClipboardText(snapshot.text, restored)).toEqual(matrix);
  });

  it("isolates the captured and returned matrix from later mutations", () => {
    const source = [["a"]];
    const snapshot = createClipboardSnapshot(source, {
      startRow: 0,
      startCol: 0,
      endRow: 0,
      endCol: 0,
    });
    source[0]![0] = "edited";
    const pasted = resolveClipboardText(snapshot.text, snapshot);
    pasted[0]![0] = "changed";
    expect(resolveClipboardText(snapshot.text, snapshot)).toEqual([["a"]]);
  });

  it("does not use stale self-copy provenance for different clipboard text", () => {
    const snapshot = createClipboardSnapshot([["a", "b"]], {
      startRow: 0,
      startCol: 0,
      endRow: 0,
      endCol: 1,
    });
    expect(resolveClipboardText("external,comma", snapshot)).toEqual([["external,comma"]]);
    expect(readClipboardSnapshot(JSON.stringify(snapshot), "other")).toBeNull();
  });

  it("rejects malformed custom data, spoofed text, and untrusted dimensions", () => {
    expect(readClipboardSnapshot("not json", "a")).toBeNull();
    expect(
      readClipboardSnapshot(
        JSON.stringify({ version: 1, text: "a", rows: [["b"]], rowCount: 1, colCount: 1 }),
        "a",
      ),
    ).toBeNull();
    expect(
      readClipboardSnapshot(
        JSON.stringify({ version: 1, text: "a", rows: [["a"]], rowCount: 2, colCount: 1 }),
        "a",
      ),
    ).toBeNull();
  });
});

describe("external clipboard choices", () => {
  it("never expands comma-only external text without a choice", () => {
    const text = "North,East\nSouth,West";
    expect(clipboardNeedsFormatChoice(text)).toBe(true);
    expect(parseClipboardText(text)).toEqual([["North,East"], ["South,West"]]);
    expect(parseClipboardText(text, "csv")).toEqual([
      ["North", "East"],
      ["South", "West"],
    ]);
    expect(parseClipboardText(text, "tsv")).toEqual([["North,East"], ["South,West"]]);
  });

  it("distinguishes quoted TSV/CSV parsing from literal single-column text", () => {
    expect(clipboardNeedsFormatChoice('"a""b"')).toBe(true);
    expect(parseClipboardText('"a""b"', "tsv")).toEqual([['a"b']]);
    expect(parseClipboardText('"a""b"', "single-column")).toEqual([['"a""b"']]);
    expect(parseClipboardText('"North,East","a""b"', "csv")).toEqual([["North,East", 'a"b']]);
  });

  it("handles external empty text, CRLF, and final line endings", () => {
    expect(parseClipboardText("")).toEqual([[""]]);
    expect(parseClipboardText("a\r\nb\r\n", "single-column")).toEqual([["a"], ["b"]]);
    expect(parseClipboardText("a\n\n", "single-column")).toEqual([["a"], [""]]);
    expect(clipboardNeedsFormatChoice("a\n\n")).toBe(true);
    expect(clipboardNeedsFormatChoice("a\tb\r\n")).toBe(false);
  });
});
