import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { CompactSelection, GridCellKind, type DataEditor } from "@glideapps/glide-data-grid";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import App from "../App";
import { t } from "../lib/i18n";

// Execute App, GlideSheet, hooks, parsers and helpers. Only native I/O and the
// canvas renderer are replaced. This is not GUI, real IME or native acceptance.
type EditorProps = ComponentProps<typeof DataEditor>;
const capture = vi.hoisted(() => ({ props: null as unknown }));
const native = vi.hoisted(() => ({
  handler: null as ((event: { preventDefault: () => void }) => Promise<void>) | null,
  destroy: vi.fn(),
  close: vi.fn(),
  unlisten: vi.fn(),
  register: vi.fn(),
}));
vi.mock("@glideapps/glide-data-grid", async (importOriginal) => {
  const original = await importOriginal<typeof import("@glideapps/glide-data-grid")>();
  const React = await import("react");
  return {
    ...original,
    DataEditor: React.forwardRef((props: EditorProps, ref) => {
      capture.props = props;
      React.useImperativeHandle(ref, () => ({ scrollTo: vi.fn(), focus: vi.fn() }));
      return <div tabIndex={0} data-testid="canvas-proxy" />;
    }),
  };
});
vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/event", () => ({ listen: vi.fn().mockResolvedValue(() => undefined) }));
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    onCloseRequested: native.register,
    destroy: native.destroy,
    close: native.close,
  }),
}));

const editor = () => capture.props as EditorProps;
const cell = (row: number, col: number) => {
  const value = editor().getCellContent([col, row]);
  if (value.kind !== GridCellKind.Text) throw new Error("Expected a text cell");
  return value.data;
};
const matrix = (rows: number, cols = 2) =>
  Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => cell(r, c)));
const canvas = () => screen.getByTestId("canvas-proxy");
const select = (row: number, col: number, height = 1, width = 1) =>
  act(() => {
    editor().onGridSelectionChange?.({
      rows: CompactSelection.empty(),
      columns: CompactSelection.empty(),
      current: { cell: [col, row], range: { x: col, y: row, width, height }, rangeStack: [] },
    });
  });
const key = (key: string, extra: Record<string, unknown> = {}) =>
  fireEvent.keyDown(canvas(), { key, ctrlKey: true, ...extra });
const paste = (text: string) =>
  fireEvent.paste(canvas(), {
    clipboardData: { getData: () => text },
  });
const find = () => screen.getByRole("textbox", { name: t("findPlaceholder") });
const replaceText = () => screen.getByRole("textbox", { name: t("replacePlaceholder") });
const openSearch = (query: string) => {
  key("f");
  fireEvent.change(find(), { target: { value: query } });
};
const clean = () =>
  expect(screen.getByRole("tab", { selected: true })).not.toHaveAccessibleName(
    new RegExp(t("unsaved")),
  );
let clipboardText: string;
let writeClipboard: ReturnType<typeof vi.fn>;
beforeEach(() => {
  localStorage.clear();
  Reflect.deleteProperty(window, "__TAURI_INTERNALS__");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
  Object.defineProperty(navigator, "platform", { configurable: true, value: "Win32" });
  vi.stubGlobal("fetch", vi.fn());
  clipboardText = "";
  writeClipboard = vi.fn(async (text: string) => {
    clipboardText = text;
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: writeClipboard,
      readText: vi.fn(async () => clipboardText),
    },
  });
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:review-corrections"),
  });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  vi.mocked(listen).mockResolvedValue(() => undefined);
  native.handler = null;
  native.destroy.mockReset().mockResolvedValue(undefined);
  native.close.mockReset().mockResolvedValue(undefined);
  native.unlisten.mockReset();
  native.register.mockReset().mockImplementation(async (handler: typeof native.handler) => {
    native.handler = handler;
    return native.unlisten;
  });
  vi.mocked(invoke)
    .mockReset()
    .mockImplementation(async (command) =>
      command === "save_file_dialog" ? "saved.csv" : undefined,
    );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function load(
  content = "name,group\n00123,A\nhidden,B\n9007199254740993,A",
  nativeMode = false,
) {
  if (nativeMode)
    Object.defineProperty(window, "__TAURI_INTERNALS__", { configurable: true, value: {} });
  vi.mocked(fetch).mockResolvedValue({ ok: true, text: async () => content } as Response);
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: t("openSample") }));
  await waitFor(() =>
    expect(screen.getByRole("tab", { selected: true })).toHaveAccessibleName("sample.csv"),
  );
}
describe("review regressions: input, search and workspace", () => {
  it("keyboard menu should preserve single-cell clear target", async () => {
    await load("header,keep\nfirst,keep\nsecond,keep");
    select(1, 0);
    key("F10", { ctrlKey: false, shiftKey: true });
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    act(() => editor().onDelete?.(editor().gridSelection!));
    expect(matrix(3)).toEqual([
      ["header", "keep"],
      ["", "keep"],
      ["second", "keep"],
    ]);
  });
  it("keyboard paste should use the same top-left destination as context paste", async () => {
    await load("a,b,c\nd,e,f\ng,h,i");
    act(() =>
      editor().onGridSelectionChange?.({
        rows: CompactSelection.empty(),
        columns: CompactSelection.empty(),
        current: { cell: [1, 1], range: { x: 0, y: 0, width: 2, height: 2 }, rangeStack: [] },
      }),
    );
    paste("X\tY\nZ\tW");
    expect(matrix(3, 3)).toEqual([
      ["X", "Y", "c"],
      ["Z", "W", "f"],
      ["g", "h", "i"],
    ]);
  });
  it.each([
    ["rows.json", '[{"z":"b"},{"z":"a"}]'],
    ["rows.yaml", "- z: b\n- z: a"],
  ])("object-list headers cannot be sorted into data by Settings: %s", async (path, content) => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", { configurable: true, value: {} });
    vi.mocked(invoke).mockImplementation(async (command) =>
      command === "open_file_dialog"
        ? path
        : command === "read_file_bytes"
          ? [...new TextEncoder().encode(content)]
          : undefined,
    );
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: t("open") })[0]);
    fireEvent.click(await screen.findByRole("button", { name: "この内容で開く" }));
    await waitFor(() => expect(cell(0, 0)).toBe("z"));
    expect(screen.getByRole("combobox", { name: /First row/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: t("settings") }));
    expect(screen.getByRole("checkbox", { name: t("useHeaderRow") })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: t("useHeaderRow") }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: t("close") }));
    act(() => editor().onHeaderMenuClick?.(0, { x: 0, y: 0, width: 120, height: 32 }));
    fireEvent.click(screen.getByRole("menuitem", { name: t("sortAsc") }));
    expect(matrix(3, 1)).toEqual([["z"], ["a"], ["b"]]);
  });

  it("non-text clipboard payload must not erase an existing value", async () => {
    await load("original,keep");
    select(0, 0);
    fireEvent.paste(canvas(), { clipboardData: { types: ["image/png"], getData: () => "" } });
    expect(cell(0, 0)).toBe("original");
    clean();
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
  });
  it("explicit empty plain text clears one cell and remains one-step undoable", async () => {
    await load("original,keep");
    select(0, 0);
    fireEvent.paste(canvas(), { clipboardData: { types: ["text/plain"], getData: () => "" } });
    expect(matrix(1)).toEqual([["", "keep"]]);
    fireEvent.click(screen.getByRole("button", { name: t("undo") }));
    expect(matrix(1)).toEqual([["original", "keep"]]);
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
  });
  it("plain text retains priority when HTML is also available", async () => {
    await load("old,neighbor");
    select(0, 0);
    fireEvent.paste(canvas(), {
      clipboardData: {
        types: ["text/plain", "text/html"],
        getData: (format: string) =>
          format === "text/plain"
            ? "00123\t9007199254740993"
            : "<table><tr><td>123</td><td>9007199254740992</td></tr></table>",
      },
    });
    expect(matrix(1)).toEqual([["00123", "9007199254740993"]]);
  });
  it("available HTML-only table paste should not be treated as an empty cell", async () => {
    await load("old,neighbor");
    select(0, 0);
    fireEvent.paste(canvas(), {
      clipboardData: {
        types: ["text/html"],
        getData: (format: string) =>
          format === "text/html" ? "<table><tr><td>new</td><td>value</td></tr></table>" : "",
      },
    });
    expect(matrix(1)).toEqual([["new", "value"]]);
    fireEvent.click(screen.getByRole("button", { name: t("undo") }));
    expect(matrix(1)).toEqual([["old", "neighbor"]]);
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
  });
  it("literal replacement preserves a pasted newline", async () => {
    await load("match,keep");
    openSearch("match");
    fireEvent.change(replaceText(), { target: { value: "line1\nline2" } });
    fireEvent.click(screen.getByRole("button", { name: t("replace") }));
    expect(cell(0, 0)).toBe("line1\nline2");
  });
  it("persisted named-view groups carry the loaded document display name", async () => {
    await load("name,group\nvalue,A");
    fireEvent.click(screen.getByRole("button", { name: /Named views/ }));
    fireEvent.change(screen.getByRole("textbox", { name: /新しい表示名|New view name/ }), {
      target: { value: "Current" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /現在の表示を新規保存|Save current as new view/ }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: /この文書の表示を端末に保存|Keep this document/ }),
    );
    expect(JSON.parse(localStorage.getItem("plainsheet.namedViews.v1")!).groups[0].fileName).toBe(
      "sample.csv",
    );
  });

  it("formula-bar navigation cannot create a column beyond the grid ceiling", async () => {
    await load("original,keep");
    const name = screen.getByRole("textbox", { name: t("nameBox") });
    fireEvent.change(name, { target: { value: "XFD1" } });
    fireEvent.keyDown(name, { key: "Enter" });
    let input = screen.getByRole("textbox", { name: t("formulaInput") });
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "Tab" });
    input = screen.getByRole("textbox", { name: t("formulaInput") });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "outside" } });
    fireEvent.blur(input);
    expect({
      address: (name as HTMLInputElement).value,
      canvas: editor().gridSelection?.current?.cell,
      overflow: cell(0, 16384),
    }).toEqual({ address: "XFD1", canvas: [16383, 0], overflow: "" });
  });
  it.each([
    ["A1048576", "Enter", false, [0, 1048575]],
    ["A1", "Enter", true, [0, 0]],
    ["A1", "Tab", true, [0, 0]],
  ])(
    "formula navigation preserves valid bounds without editing at %s with %s",
    async (address, pressed, shiftKey, selected) => {
      await load("original,keep");
      const name = screen.getByRole("textbox", { name: t("nameBox") });
      fireEvent.change(name, { target: { value: address } });
      fireEvent.keyDown(name, { key: "Enter" });
      const input = screen.getByRole("textbox", { name: t("formulaInput") });
      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: pressed, shiftKey });
      expect(name).toHaveValue(address);
      expect(editor().gridSelection?.current?.cell).toEqual(selected);
      expect(matrix(1)).toEqual([["original", "keep"]]);
      clean();
      expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
    },
  );
  it("clicking a frozen reference resets stale whole-column selection before Copy", async () => {
    await load("header,other\nfirst,keep");
    fireEvent.change(screen.getByRole("spinbutton", { name: /Frozen rows/ }), {
      target: { value: "1" },
    });
    act(() =>
      editor().onGridSelectionChange?.({
        rows: CompactSelection.empty(),
        columns: CompactSelection.empty().add(1),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "A: header" }));
    key("c");
    await waitFor(() => expect(writeClipboard).toHaveBeenCalled());
    expect(clipboardText).toBe("header");
  });
  it("an all-sheet search cannot simultaneously claim visible-only scope", async () => {
    await load("value,group\nmatch,A\nmatch,B");
    act(() => editor().onHeaderMenuClick?.(1, { x: 0, y: 0, width: 50, height: 30 }));
    fireEvent.click(screen.getByRole("menuitem", { name: t("filter") }));
    fireEvent.click(screen.getByRole("checkbox", { name: /B/ }));
    fireEvent.click(screen.getByRole("button", { name: t("filterApply") }));
    openSearch("match");
    fireEvent.change(screen.getByRole("combobox", { name: /Scope/ }), {
      target: { value: "sheet" },
    });
    expect(screen.queryByText(t("searchVisibleScope"))).not.toBeInTheDocument();
  });
});

const contextMenu = (row: number, col: number) =>
  act(() => {
    const handler = editor().onCellContextMenu!;
    handler([col, row], {
      preventDefault: vi.fn(),
      bounds: { x: 10, y: 10, width: 40, height: 25 },
    } as unknown as Parameters<typeof handler>[1]);
  });

describe("corrected candidate additional boundary challenges", () => {
  it.each(["json", "yaml"])(
    "R01 maintains mandatory object-list header when a headerless CSV is saved as %s",
    async (format) => {
      await load("z\nb\na", true);
      fireEvent.change(screen.getByRole("combobox", { name: /First row/ }), {
        target: { value: "data" },
      });
      vi.mocked(invoke).mockImplementation(async (command) =>
        command === "save_file_dialog" ? `converted.${format}` : undefined,
      );
      key("s", { shiftKey: true });
      await waitFor(() =>
        expect(screen.getByRole("tab", { selected: true })).toHaveAccessibleName(
          new RegExp(`converted\\.${format}`),
        ),
      );
      const header = screen.getByRole("combobox", { name: /First row/ });
      expect(header).toBeDisabled();
      act(() => editor().onHeaderMenuClick?.(0, { x: 0, y: 0, width: 120, height: 32 }));
      fireEvent.click(screen.getByRole("menuitem", { name: t("sortAsc") }));
      expect(matrix(3, 1)).toEqual([["z"], ["a"], ["b"]]);
    },
  );
  it.each(["json", "yaml"])(
    "R01 keeps saved %s key rows through tab switching, filters and advanced sort",
    async (format) => {
      await load("z\nb\na", true);
      fireEvent.change(screen.getByRole("combobox", { name: /First row/ }), {
        target: { value: "data" },
      });
      vi.mocked(invoke).mockImplementation(async (command) =>
        command === "save_file_dialog" ? `converted.${format}` : undefined,
      );
      key("s", { shiftKey: true });
      await waitFor(() =>
        expect(screen.getByRole("tab", { selected: true })).toHaveAccessibleName(
          new RegExp(`converted\\.${format}`),
        ),
      );
      fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
      fireEvent.click(screen.getByRole("tab", { name: new RegExp(`converted\\.${format}`) }));
      expect(screen.getByRole("combobox", { name: /First row/ })).toBeDisabled();
      expect(screen.getByRole("combobox", { name: /First row/ })).toHaveValue("header");
      act(() => editor().onHeaderMenuClick?.(0, { x: 0, y: 0, width: 120, height: 32 }));
      fireEvent.click(screen.getByRole("menuitem", { name: t("filter") }));
      const filterDialog = screen.getByRole("dialog", { name: t("filter") });
      expect(within(filterDialog).queryByRole("checkbox", { name: /^z/ })).not.toBeInTheDocument();
      expect(within(filterDialog).getByRole("checkbox", { name: /^a/ })).toBeChecked();
      expect(within(filterDialog).getByRole("checkbox", { name: /^b/ })).toBeChecked();
      fireEvent.click(within(filterDialog).getByRole("button", { name: t("cancel") }));
      fireEvent.click(screen.getByRole("button", { name: /詳しく並べ替え/ }));
      fireEvent.click(screen.getByRole("button", { name: /Confirm preview/ }));
      fireEvent.click(
        within(screen.getByRole("dialog", { name: /Apply sort/ })).getByRole("button", {
          name: /Apply/,
        }),
      );
      expect(matrix(3, 1)).toEqual([["z"], ["a"], ["b"]]);
    },
  );
  it("R02 a context text paste uses the already acquired ClipboardItem snapshot", async () => {
    await load("original,neighbor");
    select(0, 0);
    const getType = vi.fn(async () => ({ text: async () => "snapshot" }));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        read: vi.fn(async () => [{ types: ["text/plain"], getType }]),
        readText: vi.fn(async () => ""),
        writeText: writeClipboard,
      },
    });
    contextMenu(0, 0);
    fireEvent.click(screen.getByRole("menuitem", { name: t("paste") }));
    await waitFor(() => expect(cell(0, 0)).toBe("snapshot"));
    expect(getType).toHaveBeenCalledWith("text/plain");
    expect(navigator.clipboard.readText).not.toHaveBeenCalled();
    expect(cell(0, 1)).toBe("neighbor");
  });
  it("R03 a bulk-fill limit rejection explains why nothing was changed", async () => {
    await load("original,keep");
    act(() =>
      editor().onFillPattern?.({
        patternSource: { x: 0, y: 0, width: 1, height: 1 },
        fillDestination: { x: 0, y: 0, width: 1000, height: 501 },
        preventDefault: vi.fn(),
      }),
    );
    expect(cell(0, 0)).toBe("original");
    clean();
    expect(screen.getByText(/Fill limit/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
  });
  it("R04 the keyboard menu exposes column actions for an exact column selection", async () => {
    await load("header,other\nfirst,keep");
    act(() =>
      editor().onGridSelectionChange?.({
        rows: CompactSelection.empty(),
        columns: CompactSelection.empty().add(1),
      }),
    );
    fireEvent.keyDown(canvas(), { key: "F10", shiftKey: true });
    expect(screen.getByRole("menuitem", { name: t("sortAsc") })).toBeInTheDocument();
  });
  it.each(["columns", "rows"] as const)(
    "R04 keyboard-menu cancellation preserves disjoint exact %s and the Copy target",
    async (axis) => {
      await load("a0,b0,c0\na1,b1,c1\na2,b2,c2\na3,b3,c3");
      act(() =>
        editor().onGridSelectionChange?.({
          rows: axis === "rows" ? CompactSelection.empty().add(1).add(3) : CompactSelection.empty(),
          columns:
            axis === "columns" ? CompactSelection.empty().add(0).add(2) : CompactSelection.empty(),
        }),
      );
      const selection = editor().gridSelection;
      fireEvent.keyDown(canvas(), { key: "F10", shiftKey: true });
      const menu = screen.getByRole("menu", {
        name: t(axis === "columns" ? "columnMenu" : "rowMenu"),
      });
      expect(
        within(menu).getByRole("menuitem", {
          name: t(axis === "columns" ? "sortAsc" : "deleteRow"),
        }),
      ).toBeInTheDocument();
      fireEvent.keyDown(menu, { key: "Escape" });
      expect(editor().gridSelection).toEqual(selection);
      key("c");
      await waitFor(() => expect(writeClipboard).toHaveBeenCalled());
      expect(clipboardText).toBe(
        axis === "columns" ? "a0\tc0\na1\tc1\na2\tc2\na3\tc3" : "a1\tb1\tc1\na3\tb3\tc3",
      );
      clean();
      expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
    },
  );
});

describe("review regressions: sort schema changes", () => {
  it("R05 multi-sort resets invalid previous-document keys instead of presenting A while sorting a missing column", async () => {
    await load("name,group,rank\nb,2,20\na,1,10", true);
    fireEvent.click(screen.getByRole("button", { name: /詳しく並べ替え/ }));
    fireEvent.change(screen.getByRole("combobox", { name: "Sort column 1" }), {
      target: { value: "2" },
    });
    fireEvent.click(
      within(screen.getByRole("dialog", { name: /Multi-column sort/ })).getByRole("button", {
        name: /Cancel/,
      }),
    );
    vi.mocked(invoke).mockImplementation(async (command) =>
      command === "open_file_dialog"
        ? "narrow.csv"
        : command === "read_file_bytes"
          ? [...new TextEncoder().encode("name\nb\na")]
          : undefined,
    );
    fireEvent.click(screen.getAllByRole("button", { name: t("open") })[0]);
    fireEvent.click(await screen.findByRole("button", { name: "この内容で開く" }));
    await waitFor(() =>
      expect(screen.getByRole("tab", { selected: true })).toHaveAccessibleName(/narrow.csv/),
    );
    fireEvent.click(screen.getByRole("button", { name: /詳しく並べ替え/ }));
    expect(screen.getByRole("combobox", { name: "Sort column 1" })).toHaveValue("0");
    fireEvent.click(screen.getByRole("button", { name: /Confirm preview/ }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: /Apply sort/ })).getByRole("button", {
        name: /Apply/,
      }),
    );
    expect(matrix(3, 1)).toEqual([["name"], ["a"], ["b"]]);
  });
});
