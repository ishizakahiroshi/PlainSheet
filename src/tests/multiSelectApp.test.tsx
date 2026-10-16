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
import { setLocale } from "../lib/i18n";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "../lib/settings";
import type { CellValue } from "../types/sheet";

const harness = vi.hoisted(() => ({
  grid: null as DataEditorProps | null,
  fixture: [] as CellValue[][],
  saved: [] as CellValue[][],
}));
vi.mock("@glideapps/glide-data-grid", async (original) => {
  const actual = await original<typeof import("@glideapps/glide-data-grid")>();
  return {
    ...actual,
    DataEditor: React.forwardRef((_props: DataEditorProps, ref) => {
      harness.grid = _props;
      React.useImperativeHandle(ref, () => ({
        scrollTo: vi.fn(),
        getBounds: () => ({ x: 30, y: 30, width: 120, height: 28 }),
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
