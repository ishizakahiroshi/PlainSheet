import React from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CompactSelection,
  GridCellKind,
  type SizedGridColumn,
  type DataEditorProps,
} from "@glideapps/glide-data-grid";
import App from "../App";
import { parseCsv, serializeCsv } from "../lib/csv";
import { setLocale } from "../lib/i18n";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "../lib/settings";
import type { CellValue } from "../types/sheet";

const harness = vi.hoisted(() => ({
  grid: null as DataEditorProps | null,
  fixture: [] as CellValue[][],
  saved: [] as CellValue[][],
  bounds: { x: 30, y: 30, width: 120, height: 28 },
}));
vi.mock("@glideapps/glide-data-grid", async (original) => {
  const actual = await original<typeof import("@glideapps/glide-data-grid")>();
  return {
    ...actual,
    DataEditor: React.forwardRef((_props: DataEditorProps, ref) => {
      harness.grid = _props;
      React.useImperativeHandle(ref, () => ({
        scrollTo: vi.fn(),
        getBounds: () => harness.bounds,
        focus: vi.fn(),
      }));
      return <button data-testid="canvas-boundary">Test canvas boundary</button>;
    }),
  };
});
vi.mock("../hooks/useFile", () => ({
  isTauriRuntime: () => false,
  useFile: (options: {
    loadData: (rows: CellValue[][], meta: object) => void;
    getRows: () => CellValue[][];
  }) => ({
    loadSample: () => options.loadData(harness.fixture, { fileName: "synthetic.csv" }),
    openFile: () => options.loadData(harness.fixture, { fileName: "another.csv" }),
    saveFile: () => {
      harness.saved = options.getRows().map((row) => [...row]);
    },
    saveAs: vi.fn(),
    loadPath: vi.fn(),
  }),
}));

const originalRows = () =>
  Array.from({ length: 8 }, (_, i) => [
    `R${i + 1}`,
    `B${i + 1}`,
    `C${i + 1}`,
    `D${i + 1}`,
    `E${i + 1}`,
    `F${i + 1}`,
  ]);
const grid = () => harness.grid!;
const cell = (col: number, row: number) => {
  const value = grid().getCellContent([col, row]);
  return value.kind === GridCellKind.Text ? value.data : "";
};
const data = (height: number, width = 6) =>
  Array.from({ length: height }, (_, r) => Array.from({ length: width }, (_, c) => cell(c, r)));
const selection = (axis: "row" | "column", indexes: number[]) =>
  act(() => {
    let selected = CompactSelection.empty();
    indexes.forEach((i) => {
      selected = selected.add(i);
    });
    grid().onGridSelectionChange!({
      rows: axis === "row" ? selected : CompactSelection.empty(),
      columns: axis === "column" ? selected : CompactSelection.empty(),
    });
  });
const rectangle = (x: number, y: number, width = 1, height = 1) =>
  act(() =>
    grid().onGridSelectionChange!({
      rows: CompactSelection.empty(),
      columns: CompactSelection.empty(),
      current: { cell: [x, y], range: { x, y, width, height }, rangeStack: [] },
    }),
  );
const context = async (col: number, row: number, header = false, x = 25, y = 25) => {
  await act(async () => {
    const event = { preventDefault: vi.fn(), bounds: { x, y, width: 120, height: 28 } };
    if (header)
      grid().onHeaderContextMenu!(
        col,
        event as unknown as Parameters<NonNullable<DataEditorProps["onHeaderContextMenu"]>>[1],
      );
    else
      grid().onCellContextMenu!(
        [col, row],
        event as unknown as Parameters<NonNullable<DataEditorProps["onCellContextMenu"]>>[1],
      );
    // Glide performs this after its public context callback for an outside target.
    if (!header)
      grid().onGridSelectionChange!({
        rows: CompactSelection.empty(),
        columns: CompactSelection.empty(),
        current: {
          cell: [Math.max(0, col), row],
          range: { x: Math.max(0, col), y: row, width: 1, height: 1 },
          rangeStack: [],
        },
      });
  });
};
const action = async (name: RegExp) => {
  await act(async () =>
    fireEvent.click(within(screen.getByRole("menu")).getByRole("menuitem", { name })),
  );
};
const start = async (fixture = originalRows()) => {
  harness.fixture = fixture;
  render(<App />);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open sample" })));
};
const undo = () => fireEvent.click(screen.getByRole("button", { name: "Undo" }));
const redo = () => fireEvent.click(screen.getByRole("button", { name: "Redo" }));

beforeEach(() => {
  harness.grid = null;
  harness.saved = [];
  harness.bounds = { x: 30, y: 30, width: 120, height: 28 };
  localStorage.clear();
  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({ ...DEFAULT_SETTINGS, locale: "en", useHeaderRow: false }),
  );
  setLocale("en");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue("paste"),
    },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("real App + GlideSheet public context paths", () => {
  it("preserves five whole rows through selected cell and row-marker context, replacing outside", async () => {
    await start();
    selection("row", [1, 2, 3, 4, 5]);
    await context(2, 3);
    expect(screen.getByRole("menu")).toHaveAccessibleName("5 rows selected");
    expect([...grid().gridSelection!.rows]).toEqual([1, 2, 3, 4, 5]);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await context(-1, 4);
    expect(screen.getByRole("menu")).toHaveAccessibleName("5 rows selected");
    await action(/^Copy/);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      originalRows()
        .slice(1, 6)
        .map((r) => r.join("\t"))
        .join("\n"),
    );
    await context(-1, 7);
    expect(screen.getByRole("menu")).toHaveAccessibleName("1 rows selected");
    expect([...grid().gridSelection!.rows]).toEqual([7]);
  });
  it("preserves selected columns from cell and header context and copies discontiguous columns", async () => {
    await start();
    selection("column", [1, 3, 5]);
    await context(3, 4);
    expect(screen.getByRole("menu")).toHaveAccessibleName("3 columns selected");
    expect(
      within(screen.getByRole("menu")).getByRole("menuitem", { name: /^Paste/ }),
    ).toBeDisabled();
    await action(/^Copy/);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      originalRows()
        .map((r) => [r[1], r[3], r[5]].join("\t"))
        .join("\n"),
    );
    await context(1, 0, true);
    expect(screen.getByRole("menu")).toHaveAccessibleName("3 columns selected");
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await context(0, 0, true);
    expect(screen.getByRole("menu")).toHaveAccessibleName("1 columns selected");
  });
  it("deletes only selected rows with count/ranges, cancellation no-op and one undo/redo", async () => {
    await start();
    selection("row", [1, 3, 5]);
    await context(-1, 3);
    await action(/^Delete row/);
    expect(screen.getByRole("dialog")).toHaveTextContent("Delete 3 targets: 2, 4, 6");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(data(8)).toEqual(originalRows());
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
    await context(-1, 3);
    await action(/^Delete row/);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(data(5).map((r) => r[0])).toEqual(["R1", "R3", "R5", "R7", "R8"]);
    undo();
    expect(data(8)).toEqual(originalRows());
    expect([...grid().gridSelection!.rows]).toEqual([1, 3, 5]);
    redo();
    expect(data(5).map((r) => r[0])).toEqual(["R1", "R3", "R5", "R7", "R8"]);
  });
  it("inserts below the maximum selected row and duplicates in original order", async () => {
    await start();
    selection("row", [1, 2, 3, 4, 5]);
    await context(-1, 3);
    await action(/below/i);
    expect(data(14).map((r) => r[0])).toEqual([
      "R1",
      "R2",
      "R3",
      "R4",
      "R5",
      "R6",
      "",
      "",
      "",
      "",
      "",
      "R7",
      "R8",
      "",
    ]);
    undo();
    selection("row", [1, 3, 5]);
    await context(-1, 3);
    await action(/^Duplicate/);
    expect(data(11).map((r) => r[0])).toEqual([
      "R1",
      "R2",
      "R3",
      "R4",
      "R5",
      "R6",
      "R2",
      "R4",
      "R6",
      "R7",
      "R8",
    ]);
  });
  it("clears trailing discontiguous rows without deleting positions and failed cut never clears", async () => {
    await start();
    selection("row", [1, 3, 7]);
    await context(-1, 3);
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(
      new Error("synthetic clipboard failure"),
    );
    await action(/^Cut/);
    expect(data(8)).toEqual(originalRows());
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
    await context(-1, 3);
    await action(/^Clear/);
    expect(data(8)[7]).toEqual(Array(6).fill(""));
    expect(data(8)[2]).toEqual(originalRows()[2]);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(harness.saved).toHaveLength(8);
    undo();
    expect(data(8)).toEqual(originalRows());
  });
  it("supports column delete/insert-right/duplicate and all-target editability", async () => {
    await start();
    selection("column", [1, 3, 5]);
    await context(3, 0, true);
    await action(/^Duplicate/);
    expect(data(1, 9)[0]).toEqual(["R1", "B1", "C1", "D1", "E1", "F1", "B1", "D1", "F1"]);
    undo();
    await context(3, 0, true);
    await action(/right/i);
    expect(data(1, 9)[0]).toEqual(["R1", "B1", "C1", "D1", "E1", "F1", "", "", ""]);
    undo();
    selection("column", [0, 1, 2, 3, 4, 5]);
    await context(3, 0, true);
    await action(/^Delete col/);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(cell(0, 0)).toBe("");
    expect(screen.getByTestId("canvas-boundary")).toBeInTheDocument();
    undo();
    expect(data(8)).toEqual(originalRows());
  });
  it("keeps virtual operations bounded and disables destructive actions", async () => {
    await start();
    await context(-1, 99999);
    expect(screen.getByRole("menu")).toHaveAccessibleName("0 rows selected");
    expect(
      within(screen.getByRole("menu")).getByRole("menuitem", { name: /^Delete row/ }),
    ).toBeDisabled();
    await action(/below/i);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(harness.saved).toHaveLength(9);
  });
});

describe("view, keyboard, and asynchronous integration", () => {
  it("changes selected widths only, undoes width and does not dirty CSV", async () => {
    await start();
    act(() => grid().onColumnResize!({ title: "D", width: 120 }, 333, 3, 333));
    const before = grid().columns.map((c) => (c as SizedGridColumn).width);
    selection("column", [1, 3, 5]);
    await context(3, 0, true);
    await action(/^Set width to 333/);
    expect((grid().columns[1] as SizedGridColumn).width).toBe(333);
    expect((grid().columns[5] as SizedGridColumn).width).toBe(333);
    expect((grid().columns[2] as SizedGridColumn).width).toBe(before[2]);
    expect(document.title.startsWith("●")).toBe(false);
    undo();
    expect(grid().columns.map((c) => (c as SizedGridColumn).width)).toEqual(before);
  });
  it("hides gaps, edits correct sources, saves all data and retains view through tabs", async () => {
    await start();
    selection("row", [1, 3]);
    await context(-1, 1);
    await action(/^Hide/);
    expect(cell(0, 1)).toBe("R3");
    expect(screen.getByRole("button", { name: "Reveal hidden rows 2" })).toBeInTheDocument();
    act(() =>
      grid().onCellEdited!([0, 1], {
        kind: GridCellKind.Text,
        data: "edited R3",
        displayData: "edited R3",
        allowOverlay: true,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(harness.saved[2][0]).toBe("edited R3");
    expect(harness.saved[1][0]).toBe("R2");
    fireEvent.click(screen.getByRole("button", { name: "New sheet" }));
    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[0]);
    expect(cell(0, 1)).toBe("edited R3");
    expect(screen.getByRole("button", { name: "Show all" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show all" }));
    expect(cell(0, 1)).toBe("R2");
  });
  it("keeps Show all reachable with every row and column hidden, and undo restores visibility", async () => {
    await start();
    selection("row", [0, 1, 2, 3, 4, 5, 6, 7]);
    await context(-1, 2);
    await action(/^Hide/);
    expect(cell(0, 0)).toBe("");
    expect(screen.getByRole("button", { name: "Show all" })).toBeVisible();
    undo();
    expect(data(8)).toEqual(originalRows());
    selection("column", [0, 1, 2, 3, 4, 5]);
    await context(2, 0, true);
    await action(/^Hide/);
    expect(grid().columns[0].title).toBe("G");
    fireEvent.click(screen.getByRole("button", { name: "Show all" }));
    expect(cell(0, 0)).toBe("R1");
  });
  it("moves selected blocks and width state, while discontiguous and boundary moves explain disabled state", async () => {
    await start();
    selection("row", [1, 2]);
    await context(-1, 1);
    await action(/^Move one position after/);
    expect(data(4).map((r) => r[0])).toEqual(["R1", "R4", "R2", "R3"]);
    undo();
    selection("row", [1, 3]);
    await context(-1, 1);
    expect(
      within(screen.getByRole("menu")).getByRole("menuitem", { name: /^Move one position after/ }),
    ).toHaveTextContent("Select a contiguous range first");
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    selection("row", [0]);
    await context(-1, 0);
    expect(
      within(screen.getByRole("menu")).getByRole("menuitem", { name: /^Move one position before/ }),
    ).toHaveTextContent("sheet boundary");
  });
  it("opens the same menu by keyboard with arrows, Enter, Escape focus return and IME guards", async () => {
    await start();
    selection("row", [1, 2, 3, 4, 5]);
    const canvas = screen.getByTestId("canvas-boundary");
    canvas.focus();
    fireEvent.keyDown(canvas, { key: "F10", shiftKey: true, isComposing: true });
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.keyDown(canvas, { key: "F10", shiftKey: true });
    expect(screen.getByRole("menu")).toHaveAccessibleName("5 rows selected");
    const menu = screen.getByRole("menu");
    const first = within(menu).getAllByRole("menuitem")[0];
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: "ArrowDown" });
    expect(within(menu).getByRole("menuitem", { name: /^Copy/ })).toHaveFocus();
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(canvas).toHaveFocus();
    expect([...grid().gridSelection!.rows]).toEqual([1, 2, 3, 4, 5]);
  });
  it("ignores async cut completion after changing document", async () => {
    await start();
    let finish!: () => void;
    vi.mocked(navigator.clipboard.writeText).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    selection("row", [1]);
    await context(-1, 1);
    await action(/^Cut/);
    fireEvent.click(screen.getByRole("button", { name: "New sheet" }));
    await act(async () => finish());
    fireEvent.click(screen.getAllByRole("tab")[0]);
    expect(data(8)).toEqual(originalRows());
  });
  it("uses source-aware copy under filters and blocks filtered mutations", async () => {
    await start([
      ["keep", "A"],
      ["drop", "B"],
      ["keep", "C"],
    ]);
    await context(0, 0, true);
    await action(/^Filter$/);
    // FilterPopover exposes real checkboxes for unique synthetic values.
    fireEvent.click(screen.getByRole("checkbox", { name: "drop" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(cell(1, 1)).toBe("C");
    selection("column", [1]);
    await context(1, 0, true);
    expect(screen.getByRole("menu")).toHaveTextContent("Rows 1, 3");
    expect(
      within(screen.getByRole("menu")).getByRole("menuitem", { name: /^Clear/ }),
    ).toBeDisabled();
    await action(/^Copy/);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("A\nC");
  });
  it("preserves rectangular selection and bounds the menu at narrow viewport edges", async () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(320);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(240);
    await start();
    rectangle(1, 1, 2, 2);
    await context(2, 2, false, 900, 900);
    expect(screen.getByRole("menu")).toHaveAccessibleName("2 rows × 2 columns selected");
    expect(Number.parseInt(screen.getByRole("menu").style.left)).toBeLessThanOrEqual(316);
    expect(Number.parseInt(screen.getByRole("menu").style.top)).toBeLessThanOrEqual(236);
    await action(/^Copy/);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("B2\tC2\nB3\tC3");
  });
});

describe("consolidated review regressions: source targets and persisted shape", () => {
  const save = () => fireEvent.click(screen.getByRole("button", { name: "Save" }));
  const key = async (key: string, ctrlKey = false) => {
    await act(async () =>
      fireEvent.keyDown(screen.getByTestId("canvas-boundary"), { key, ctrlKey }),
    );
  };
  const jump = (reference: string) => {
    const input = screen.getByRole("textbox", { name: "Name box" });
    act(() => input.focus());
    fireEvent.change(input, { target: { value: reference } });
    fireEvent.keyDown(input, { key: "Enter" });
  };
  it.each(["row", "column"] as const)(
    "aligns every immediate edit target after hiding the first %s",
    async (axis) => {
      await start();
      selection(axis, [0]);
      await context(axis === "row" ? -1 : 0, 0, axis === "column");
      await action(/^Hide/);
      const sourceRow = axis === "row" ? 1 : 0,
        sourceCol = axis === "column" ? 1 : 0;
      expect(grid().gridSelection?.current?.cell).toEqual([0, 0]);
      expect(screen.getByRole("textbox", { name: "Name box" })).toHaveValue(
        axis === "row" ? "A2" : "B1",
      );
      expect(screen.getByRole("textbox", { name: "Cell content" })).toHaveValue(
        originalRows()[sourceRow][sourceCol],
      );
      await key("c", true);
      expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(
        originalRows()[sourceRow][sourceCol],
      );
      const formula = screen.getByRole("textbox", { name: "Cell content" });
      act(() => formula.focus());
      fireEvent.change(formula, { target: { value: "visible edit" } });
      fireEvent.keyDown(formula, { key: "Enter" });
      save();
      expect(harness.saved[sourceRow][sourceCol]).toBe("visible edit");
      expect(harness.saved[0][0]).toBe("R1");
      await key("Delete");
      save();
      expect(harness.saved[sourceRow][sourceCol]).toBe("");
      expect(harness.saved[0][0]).toBe("R1");
      await key("v", true);
      save();
      expect(harness.saved[sourceRow][sourceCol]).toBe("paste");
      expect(harness.saved[0][0]).toBe("R1");
    },
  );
  it.each(["row", "column"] as const)(
    "keeps fallback selection visible after deleting beside a hidden %s",
    async (axis) => {
      await start();
      selection(axis, [0]);
      await context(axis === "row" ? -1 : 0, 0, axis === "column");
      await action(/^Hide/);
      selection(axis, [0]);
      await context(axis === "row" ? -1 : 0, 0, axis === "column");
      await action(axis === "row" ? /^Delete row/ : /^Delete col/);
      fireEvent.click(screen.getByRole("button", { name: "Delete" }));
      expect(screen.getByRole("textbox", { name: "Name box" })).toHaveValue(
        axis === "row" ? "A2" : "B1",
      );
      await key("Delete");
      save();
      expect(harness.saved[0][0]).toBe("R1");
      expect(axis === "row" ? harness.saved[1][0] : harness.saved[0][1]).toBe("");
    },
  );
  it.each(["row", "column"] as const)(
    "uses an explicit blank append target with all %ss hidden",
    async (axis) => {
      await start();
      selection(
        axis,
        Array.from({ length: axis === "row" ? 8 : 6 }, (_, i) => i),
      );
      await context(axis === "row" ? -1 : 0, 0, axis === "column");
      await action(/^Hide/);
      expect(screen.getByRole("textbox", { name: "Name box" })).toHaveValue(
        axis === "row" ? "A9" : "G1",
      );
      expect(screen.getByRole("textbox", { name: "Cell content" })).toHaveValue("");
      await key("Delete");
      save();
      expect(harness.saved).toEqual(originalRows());
      await key("v", true);
      save();
      expect(axis === "row" ? harness.saved[8][0] : harness.saved[0][6]).toBe("paste");
      expect(harness.saved.slice(0, 8).map((r) => r.slice(0, 6))).toEqual(originalRows());
      undo();
      save();
      expect(harness.saved).toEqual(originalRows());
    },
  );
  it.each(["row", "column"] as const)(
    "replaces old whole-%s targets for Name box cells and rectangles",
    async (axis) => {
      await start();
      selection(axis, [1, 3]);
      jump("B3");
      expect([...grid().gridSelection!.rows]).toEqual([]);
      expect([...grid().gridSelection!.columns]).toEqual([]);
      expect(grid().gridSelection?.current?.cell).toEqual([1, 2]);
      await key("c", true);
      expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith("B3");
      await key("Delete");
      expect(cell(1, 2)).toBe("");
      expect(cell(1, 1)).toBe("B2");
      selection(axis, [1, 3]);
      jump("C5:D6");
      expect(grid().gridSelection?.current?.range).toEqual({ x: 2, y: 4, width: 2, height: 2 });
      await key("c", true);
      expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith("C5\tD5\nC6\tD6");
    },
  );
  it.each(["row", "column"] as const)(
    "replaces whole-%s targets on search navigation and reveals hidden hits",
    async (axis) => {
      await start();
      selection("row", [6]);
      await context(-1, 6);
      await action(/^Hide/);
      selection(axis, [1, 3]);
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      fireEvent.change(screen.getByRole("textbox", { name: "Find" }), { target: { value: "B7" } });
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      expect(screen.getByRole("textbox", { name: "Name box" })).toHaveValue("B7");
      expect(grid().gridSelection?.current?.cell).toEqual([1, 6]);
      expect([...grid().gridSelection!.rows]).toEqual([]);
      expect([...grid().gridSelection!.columns]).toEqual([]);
      await key("c", true);
      expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith("B7");
    },
  );
  it("refuses filtered Name box ranges with an excluded endpoint or interior row", async () => {
    await start([
      ["keep", "A"],
      ["drop", "B"],
      ["keep", "C"],
    ]);
    await context(0, 0, true);
    await action(/^Filter$/);
    fireEvent.click(screen.getByRole("checkbox", { name: "drop" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    rectangle(0, 0);
    for (const reference of ["A1:A2", "A1:A3", "B3:A1"]) {
      jump(reference);
      expect(screen.getByRole("textbox", { name: "Name box" })).toHaveValue("A1");
      expect(screen.getByRole("textbox", { name: "Cell content" })).toHaveValue("keep");
      expect(grid().gridSelection?.current?.cell).toEqual([0, 0]);
      expect(screen.getByRole("status")).toHaveTextContent("Clear filters before editing");
    }
    const formula = screen.getByRole("textbox", { name: "Cell content" });
    act(() => formula.focus());
    fireEvent.change(formula, { target: { value: "visible" } });
    fireEvent.keyDown(formula, { key: "Enter" });
    save();
    expect(harness.saved[1]).toEqual(["drop", "B"]);
    expect(harness.saved[0][0]).toBe("visible");
  });
  it("normalizes reversed Name box ranges before revealing hidden rows and columns", async () => {
    await start();
    selection("row", [1]);
    await context(-1, 1);
    await action(/^Hide/);
    selection("column", [1]);
    await context(1, 0, true);
    await action(/^Hide/);
    jump("C3:A1");
    expect(grid().gridSelection?.current?.range).toEqual({ x: 0, y: 0, width: 3, height: 3 });
    expect(screen.getByRole("textbox", { name: "Name box" })).toHaveValue("A1:C3");
    expect(screen.getByRole("textbox", { name: "Cell content" })).toHaveValue("C3");
    await key("c", true);
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(
      "R1\tB1\tC1\nR2\tB2\tC2\nR3\tB3\tC3",
    );
    undo();
    expect(screen.getByRole("button", { name: "Reveal hidden rows 2" })).toBeInTheDocument();
    redo();
    expect(grid().gridSelection?.current?.range).toEqual({ x: 0, y: 0, width: 3, height: 3 });
  });
  it.each([false, true])(
    "normalizes filtered active source after apply and new column context (%s)",
    async (reopenColumn) => {
      await start([
        ["keep", "A"],
        ["drop", "B"],
      ]);
      await context(0, 0, true);
      await action(/^Filter$/);
      fireEvent.click(screen.getByRole("checkbox", { name: "drop" }));
      fireEvent.click(screen.getByRole("button", { name: "Apply" }));
      if (reopenColumn) {
        await context(1, 0, true);
        fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
      }
      expect(screen.getByRole("textbox", { name: "Name box" })).toHaveValue(
        reopenColumn ? "B1" : "A1",
      );
      const formula = screen.getByRole("textbox", { name: "Cell content" });
      expect(formula).toHaveValue(reopenColumn ? "A" : "keep");
      act(() => formula.focus());
      fireEvent.change(formula, { target: { value: "visible" } });
      fireEvent.keyDown(formula, { key: "Enter" });
      save();
      expect(harness.saved[1]).toEqual(["drop", "B"]);
      expect(harness.saved[0][reopenColumn ? 1 : 0]).toBe("visible");
      undo();
      save();
      expect(harness.saved).toEqual([
        ["keep", "A"],
        ["drop", "B"],
      ]);
      redo();
      save();
      expect(harness.saved[1]).toEqual(["drop", "B"]);
      expect(harness.saved[0][reopenColumn ? 1 : 0]).toBe("visible");
    },
  );
  it("rejects distant virtual paste through menu, shortcut and native adapter without history", async () => {
    await start();
    await context(-1, 99999);
    expect(
      within(screen.getByRole("menu")).getByRole("menuitem", { name: /^Paste/ }),
    ).toBeDisabled();
    expect(screen.getByRole("menu")).toHaveTextContent("immediate next row/column");
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await key("v", true);
    act(() => {
      const paste = grid().onPaste;
      if (typeof paste !== "function") throw new Error("App paste callback missing");
      paste([0, 99999], [["far"]]);
    });
    save();
    expect(harness.saved).toEqual(originalRows());
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
    expect(document.title.startsWith("●")).toBe(false);
    expect(navigator.clipboard.readText).not.toHaveBeenCalled();
  });
  it("preserves all-empty clipboard dimensions, raw values and real CSV/TSV reopen shapes", async () => {
    await start([[""]]);
    rectangle(0, 0);
    vi.mocked(navigator.clipboard.readText).mockResolvedValueOnce('""\n""\n""');
    await key("v", true);
    save();
    expect(harness.saved).toEqual([[""], [""], [""]]);
    expect(parseCsv(serializeCsv(harness.saved))).toEqual(harness.saved);
    undo();
    save();
    expect(harness.saved).toEqual([[""]]);
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
    rectangle(0, 0);
    vi.mocked(navigator.clipboard.readText).mockResolvedValueOnce('""\t""\t""');
    await key("v", true);
    save();
    expect(harness.saved).toEqual([["", "", ""]]);
    expect(parseCsv(serializeCsv(harness.saved, "\t"), "\t")).toEqual(harness.saved);
    undo();
    vi.mocked(navigator.clipboard.readText).mockResolvedValueOnce('""');
    await key("v", true);
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  });
  it("retains cleared trailing single-column records through save serialization", async () => {
    await start([["00123"], ["日本語"], ["900719925474099312345"], ["last"]]);
    selection("row", [3]);
    await context(-1, 3);
    await action(/^Clear/);
    save();
    for (const delimiter of [",", "\t"] as const)
      expect(parseCsv(serializeCsv(harness.saved, delimiter, "CRLF"), delimiter)).toEqual([
        ["00123"],
        ["日本語"],
        ["900719925474099312345"],
        [""],
      ]);
    undo();
    expect(cell(0, 3)).toBe("last");
  });
  it("groups selected-column resize callbacks into one view-only undo, including a no-op drag", async () => {
    await start();
    selection("column", [1, 3]);
    const before = grid().columns.map((c) => (c as SizedGridColumn).width);
    const resize = (
      phase: "onColumnResizeStart" | "onColumnResize" | "onColumnResizeEnd",
      col: number,
      width: number,
    ) => grid()[phase]!({ title: String(col), width }, width, col, width);
    act(() => resize("onColumnResizeStart", 1, before[1]));
    act(() => resize("onColumnResize", 1, 200));
    act(() => resize("onColumnResize", 1, 250));
    await act(async () => {
      resize("onColumnResize", 3, 250);
      resize("onColumnResizeEnd", 1, 250);
      resize("onColumnResizeEnd", 3, 250);
    });
    expect((grid().columns[1] as SizedGridColumn).width).toBe(250);
    expect((grid().columns[3] as SizedGridColumn).width).toBe(250);
    expect(document.title.startsWith("●")).toBe(false);
    undo();
    expect(grid().columns.map((c) => (c as SizedGridColumn).width)).toEqual(before);
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
    redo();
    expect((grid().columns[1] as SizedGridColumn).width).toBe(250);
    undo();
    await act(async () => {
      resize("onColumnResizeStart", 1, before[1]);
      resize("onColumnResize", 1, 200);
      resize("onColumnResizeEnd", 1, before[1]);
    });
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  });
  it("repositions gap controls on smooth-scroll offsets, widths and viewport resize", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({
      x: 0,
      y: 0,
      width: 600,
      height: 400,
      top: 0,
      left: 0,
      bottom: 400,
      right: 600,
      toJSON: () => ({}),
    }));
    await start();
    selection("row", [1]);
    await context(-1, 1);
    harness.bounds = { x: 30, y: 80, width: 120, height: 28 };
    await action(/^Hide/);
    const gap = () =>
      screen
        .getAllByRole("button", { name: "Reveal hidden rows 2" })
        .find((button) => button.classList.contains("glideSheet__gap"))!;
    expect(gap().style.top).toBe("80px");
    act(() => grid().onVisibleRegionChanged!({ x: 0, y: 0, width: 4, height: 8 }, 0, 0, {}));
    harness.bounds = { ...harness.bounds, y: 70 };
    act(() => grid().onVisibleRegionChanged!({ x: 0, y: 0, width: 4, height: 8 }, 0, -10, {}));
    expect(gap().style.top).toBe("70px");
    harness.bounds = { ...harness.bounds, y: 60 };
    act(() => grid().onColumnResize!({ title: "A", width: 120 }, 150, 0, 150));
    expect(gap().style.top).toBe("60px");
    harness.bounds = { ...harness.bounds, y: 50 };
    fireEvent(window, new Event("resize"));
    expect(gap().style.top).toBe("50px");
  });
  it("executes keyboard Enter once and ignores composing Enter in the formula bar", async () => {
    await start();
    rectangle(0, 0);
    const canvas = screen.getByTestId("canvas-boundary");
    canvas.focus();
    fireEvent.keyDown(canvas, { key: "ContextMenu" });
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    await act(async () => fireEvent.keyDown(document.activeElement!, { key: "Enter" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).toBeNull();
    const formula = screen.getByRole("textbox", { name: "Cell content" });
    act(() => formula.focus());
    fireEvent.change(formula, { target: { value: "composing" } });
    fireEvent.keyDown(formula, { key: "Enter", isComposing: true });
    save();
    expect(harness.saved[0][0]).toBe("R1");
  });
  it("keeps duplicate-row visibility identity while sorting a representative medium table", async () => {
    const fixture = Array.from({ length: 4000 }, (_, i) => [String(3999 - i), "00123", "日本語"]);
    fixture[2] = [...fixture[1]];
    await start(fixture);
    selection("row", [1]);
    await context(-1, 1);
    await action(/^Hide/);
    await context(0, 0, true);
    await action(/^Sort ascending/);
    save();
    expect(harness.saved).toHaveLength(4000);
    expect(harness.saved[3997]).toEqual(fixture[1]);
    expect(harness.saved[3998]).toEqual(fixture[2]);
    expect(screen.getByRole("button", { name: "Reveal hidden rows 3998" })).toBeInTheDocument();
    undo();
    save();
    expect(harness.saved).toEqual(fixture);
    expect(screen.getByRole("button", { name: "Reveal hidden rows 2" })).toBeInTheDocument();
  });
});
