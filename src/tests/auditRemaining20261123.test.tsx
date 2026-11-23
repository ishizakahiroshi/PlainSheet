// Regression tests for the rest of the 2026-11-23 audit findings (F-08 to
// F-29) and the round trips F-31 asked for.
import React from "react";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilterPopover, FILTER_LIST_LIMIT } from "../components/FilterPopover";
import { FormulaBar } from "../components/FormulaBar";
import { calculateSelectionStats } from "../components/StatusBar";
import { ensureSize } from "../hooks/useSheet";
import { loadErrorMessage, samePath, useFile } from "../hooks/useFile";
import { SEARCH_TIMEOUT_MS, useSearchHits } from "../hooks/useSearchHits";
import { fillSeries } from "../lib/autofill";
import { parseClipboardText } from "../lib/clipboard";
import { detectNewline, parseCsv, parseCsvStream } from "../lib/csv";
import { parseTableDocument, serializeTableText } from "../lib/formats";
import { setLocale, t } from "../lib/i18n";
import { sortRows } from "../lib/sort";
import type { CellValue, FileFormat, SheetMeta } from "../types/sheet";
// @ts-expect-error plain .mjs release scripts have no type declarations
import { chooseDistTag } from "../../scripts/release/publish-npm.mjs";

const invoke = vi.hoisted(() => vi.fn());
vi.mock("@tauri-apps/api/core", () => ({ invoke: (...args: unknown[]) => invoke(...args) }));
vi.mock("@tauri-apps/api/event", () => ({ listen: () => Promise.resolve(() => undefined) }));

beforeEach(() => setLocale("en"));
afterEach(() => {
  cleanup();
  invoke.mockReset();
  vi.useRealTimers();
  delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
});

// Reads a file the way the app does and writes it back unchanged.
function roundTrip(text: string, format: FileFormat, delimiter: "," | "\t" = ",") {
  const parsed = parseTableDocument(text, format, delimiter);
  const meta = parsed.meta;
  return {
    rows: parsed.rows,
    write: (rows: CellValue[][] = parsed.rows) =>
      serializeTableText(rows, format, delimiter, meta.newline ?? "LF", {
        trailingNewline: meta.trailingNewline,
        structured: meta.structured,
        markdown: meta.markdown,
      }),
  };
}

describe("CSV quotes (F-10, F-20)", () => {
  it("keeps text that follows a closing quote, quotes included", () => {
    expect(parseCsv('a,"Hello" she said,b')).toEqual([["a", '"Hello" she said', "b"]]);
    expect(parseClipboardText('"hello" world')).toEqual([['"hello" world']]);
  });

  it("still drops spaces between a closing quote and the delimiter", () => {
    expect(parseCsv('"a" ,b')).toEqual([["a", "b"]]);
  });

  it("reads an unterminated quote as a character instead of swallowing the file", async () => {
    const info: { unterminatedQuote?: boolean } = {};
    const text = '1,"open\n2,b\n3,c\n';
    expect(parseCsv(text, ",", info)).toEqual([
      ["1", '"open'],
      ["2", "b"],
      ["3", "c"],
    ]);
    expect(info.unterminatedQuote).toBe(true);
    async function* chunks() {
      yield text.slice(0, 5);
      yield text.slice(5);
    }
    expect(await parseCsvStream(chunks())).toEqual(parseCsv(text));
  });
});

describe("CSV line endings (F-17)", () => {
  it("keeps the final line break", () => {
    expect(roundTrip("a,b\n1,2\n", "csv").write()).toBe("a,b\n1,2\n");
    expect(roundTrip("a,b\n1,2", "csv").write()).toBe("a,b\n1,2");
  });

  it("uses the line break most lines use", () => {
    expect(detectNewline("a\nb\nc\r\nd\n")).toBe("LF");
    expect(detectNewline("a\r\nb\r\nc\n")).toBe("CRLF");
  });
});

describe("editing a ragged CSV (F-16)", () => {
  it("widens only the edited row", () => {
    const rows = ensureSize([["a", "b", "c"], ["d"], ["e", "f"]], 1, 2, 0);
    expect(rows).toEqual([["a", "b", "c"], ["d"], ["e", "f"]]);
    expect(ensureSize([["a", "b", "c"], ["d"], ["e", "f"]], 3, 3, 2)).toEqual([
      ["a", "b", "c"],
      ["d"],
      ["e", "f", ""],
    ]);
  });
});

describe("JSON and YAML values (F-09)", () => {
  const json =
    '[{"n":1,"b":true,"z":null,"o":{"x":1},"big":12345678901234567890,"d":1.50},{"n":2}]';

  it("writes untouched values back with their types", () => {
    const { rows, write } = roundTrip(json, "json");
    expect(rows[1]).toEqual(["1", "true", "", '{"x":1}', "12345678901234567890", "1.50"]);
    const out = write();
    expect(out).toContain('"big": 12345678901234567890');
    expect(out).toContain('"d": 1.50');
    expect(out).toContain('"z": null');
    expect(out).toContain('"b": true');
    expect(out).toContain('"o": {"x":1}');
    // The second record had only "n"; its other keys stay absent.
    expect(JSON.parse(out)[1]).toEqual({ n: 2 });
  });

  it("writes an edited cell with its column's type", () => {
    const { rows, write } = roundTrip(json, "json");
    const edited = rows.map((row) => [...row]);
    edited[1]![0] = "10";
    edited[1]![1] = "false";
    edited[2]![0] = "not a number";
    const parsed = JSON.parse(write(edited));
    expect(parsed[0].n).toBe(10);
    expect(parsed[0].b).toBe(false);
    expect(parsed[1].n).toBe("not a number");
  });

  it("keeps YAML comments and number formats", () => {
    const yaml =
      "# people\n- name: Taro # first\n  age: 35\n  rate: 1.50\n- name: Hanako\n  age: 28\n";
    const { rows, write } = roundTrip(yaml, "yaml");
    expect(write()).toBe(yaml);
    const edited = rows.map((row) => [...row]);
    edited[2]![1] = "29";
    const out = write(edited);
    expect(out).toContain("# people");
    expect(out).toContain("# first");
    expect(out).toContain("age: 29");
    expect(out).not.toContain('"29"');
  });
});

describe("formula bar (F-08)", () => {
  it("keeps line breaks in the cell it edits", () => {
    const onCommit = vi.fn();
    render(
      <FormulaBar row={0} col={0} reference="A1" value={"line1\nline2"} onCommit={onCommit} />,
    );
    const box = screen.getByRole("textbox", { name: t("formulaInput") });
    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: "line1\nline2!" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onCommit).toHaveBeenCalledWith(0, 0, "line1\nline2!", true);
  });
});

describe("status bar totals (F-13)", () => {
  it("counts only rows that are shown", () => {
    const rows = [["10"], ["1000"], ["20"]];
    const stats = calculateSelectionStats(
      rows,
      { startRow: 0, startCol: 0, endRow: 2, endCol: 0 },
      { isRowVisible: (row) => row !== 1 },
    );
    expect(stats?.total).toBe("30");
    expect(stats?.count).toBe(2);
  });
});

describe("regular-expression search (F-14)", () => {
  it("stops a search that takes too long", async () => {
    vi.useFakeTimers();
    const terminate = vi.fn();
    class SilentWorker {
      onmessage: unknown = null;
      postMessage() {}
      terminate = terminate;
    }
    vi.stubGlobal("Worker", SilentWorker);
    const options = { caseSensitive: false, regex: true };
    const rows = [["aaaa"]];
    const { result } = renderHook(() => useSearchHits(rows, "(a+)+$", options, null));
    await act(async () => {
      vi.advanceTimersByTime(SEARCH_TIMEOUT_MS + 500);
    });
    expect(result.current.timedOut).toBe(true);
    expect(terminate).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe("autofill series (F-19)", () => {
  it("continues hyphenated names, dates, padded numbers and decimals", () => {
    expect(fillSeries(["item-1"], 2)).toEqual(["item-2", "item-3"]);
    expect(fillSeries(["2026-11-30"], 2)).toEqual(["2026-12-01", "2026-12-02"]);
    expect(fillSeries(["001"], 2)).toEqual(["002", "003"]);
    expect(fillSeries(["0.1", "0.2"], 2)).toEqual(["0.3", "0.4"]);
  });
});

describe("sorting (F-21)", () => {
  it("sorts hexadecimal-looking codes as text", () => {
    // As numbers 0x10 would be 16 and sort last; as text (with natural digit
    // order) it sorts first.
    const sorted = sortRows([["0x10"], ["9"], ["11"]], 0, "asc");
    expect(sorted.map((row) => row[0])).toEqual(["0x10", "9", "11"]);
    expect(sortRows([["1e1"], ["9"], ["11"]], 0, "asc").map((row) => row[0])).toEqual([
      "9",
      "1e1",
      "11",
    ]);
  });
});

describe("filter list (F-22)", () => {
  it("draws a bounded list, narrows by search, and tells blanks from the text __blank__", () => {
    const rows = [["h"], [""], ["__blank__"], ...Array.from({ length: 800 }, (_, i) => [`v${i}`])];
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <FilterPopover
        state={{ col: 0, x: 0, y: 0 }}
        rows={rows}
        selected={null}
        headerRow
        onApply={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("checkbox")).toHaveLength(FILTER_LIST_LIMIT);
    expect(screen.getByText(t("filterBlank"))).toBeInTheDocument();
    expect(screen.getByText("__blank__")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "v79" } });
    expect(screen.getAllByRole("checkbox")).toHaveLength(11); // v79, v790–v799
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });
});

describe("loading and saving files (F-12, F-15, F-24, F-26)", () => {
  function setup(meta: Partial<SheetMeta>, extra: { confirmOverwrite?: () => boolean } = {}) {
    const completeSave = vi.fn();
    const onToast = vi.fn();
    const { result } = renderHook(() =>
      useFile({
        loadData: vi.fn(),
        completeSave,
        getRows: () => [["a"], ["1"]],
        getMeta: () => ({ ...meta }) as SheetMeta,
        onToast,
        confirmDiscard: () => true,
        confirmOverwrite: extra.confirmOverwrite,
      }),
    );
    return { result, completeSave, onToast };
  }

  it("keeps a browser download marked unsaved", async () => {
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    const { result, completeSave, onToast } = setup({
      fileName: "a.csv",
      format: "csv",
      delimiter: ",",
    });
    await act(() => result.current.saveFile());
    expect(completeSave).toHaveBeenCalledWith(
      expect.any(String),
      expect.anything(),
      expect.anything(),
      {
        keepDirty: true,
      },
    );
    expect(completeSave.mock.calls[0]![2]).not.toHaveProperty("dirty");
    expect(onToast).toHaveBeenCalledWith(t("toastDownloadKeepsUnsaved"));
    click.mockRestore();
  });

  it("asks before overwriting a file another app changed, and keeps it when declined", async () => {
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
    invoke.mockImplementation((command: string, args: Record<string, unknown>) =>
      command === "write_file" && args.expected
        ? Promise.reject("modified-externally")
        : Promise.resolve({ modified: "2", size: 4 }),
    );
    const confirmOverwrite = vi.fn(() => false);
    const { result, completeSave } = setup(
      {
        filePath: "C:\\work\\a.csv",
        format: "csv",
        delimiter: ",",
        encoding: "utf-8",
        fileStamp: { modified: "1", size: 3 },
      },
      { confirmOverwrite },
    );
    await act(() => result.current.saveFile());
    expect(confirmOverwrite).toHaveBeenCalledTimes(1);
    expect(completeSave).not.toHaveBeenCalled();
    expect(invoke.mock.calls.filter(([command]) => command === "write_file")).toHaveLength(1);
  });

  it("treats Windows paths that differ only in letter case as one file", () => {
    expect(samePath("C:\\Work\\Data.csv", "c:/work/data.csv")).toBe(true);
    expect(samePath("/data/Data.csv", "/data/data.csv")).toBe(false);
  });

  it("says why a file could not be opened", () => {
    expect(loadErrorMessage("too-large")).toBe(t("toastLoadTooLarge"));
    expect(loadErrorMessage("utf16")).toBe(t("toastLoadUtf16"));
    expect(loadErrorMessage("nul")).toBe(t("toastLoadBinary"));
    expect(loadErrorMessage(new SyntaxError("Unexpected token"))).toBe(t("toastLoadNotTable"));
    expect(loadErrorMessage(new Error("other"))).toBe(t("toastLoadFailed"));
  });
});

describe("npm dist-tag (F-29)", () => {
  it("does not move latest back to an older version", () => {
    expect(chooseDistTag("0.1.0", "0.1.1")).toBe("previous");
    expect(chooseDistTag("0.1.2", "0.1.1")).toBe("latest");
    expect(chooseDistTag("0.2.0-rc.1", "0.1.1")).toBe("next");
    expect(chooseDistTag("0.1.0", null)).toBe("latest");
  });
});

describe("Markdown round trip (F-31)", () => {
  it("writes an unchanged document back byte for byte", () => {
    const doc = "# T\n\n| a | b |\n| :--- | ---: |\n| 1 | 2 |\n\nafter\n";
    expect(roundTrip(doc, "markdown").write()).toBe(doc);
  });
});
