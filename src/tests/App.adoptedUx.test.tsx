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
const edit = (row: number, col: number, data: string) =>
  act(() => {
    editor().onCellsEdited?.([
      {
        location: [col, row],
        value: {
          kind: GridCellKind.Text,
          data,
          displayData: data,
          allowOverlay: true,
        },
      },
    ]);
  });
const key = (key: string, extra: Record<string, unknown> = {}) =>
  fireEvent.keyDown(canvas(), { key, ctrlKey: true, ...extra });
const paste = (text: string) =>
  fireEvent.paste(canvas(), {
    clipboardData: { getData: () => text },
  });
const contextMenu = (row: number, col: number) =>
  act(() => {
    const handler = editor().onCellContextMenu!;
    handler([col, row], {
      preventDefault: vi.fn(),
      bounds: { x: 10, y: 10, width: 40, height: 25 },
    } as unknown as Parameters<typeof handler>[1]);
  });
const undo = () => fireEvent.click(screen.getByRole("button", { name: t("undo") }));
const find = () => screen.getByRole("textbox", { name: t("findPlaceholder") });
const replaceText = () => screen.getByRole("textbox", { name: t("replacePlaceholder") });
const openSearch = (query: string) => {
  key("f");
  fireEvent.change(find(), { target: { value: query } });
};
const preview = () => screen.getByRole("dialog", { name: /Replace all preview/ });
const closeDialog = () => screen.getByRole("dialog", { name: /Save before closing/ });
const dirty = () =>
  expect(screen.getByRole("tab", { selected: true })).toHaveAccessibleName(
    new RegExp(t("unsaved")),
  );
const clean = () =>
  expect(screen.getByRole("tab", { selected: true })).not.toHaveAccessibleName(
    new RegExp(t("unsaved")),
  );
let clipboardText: string;
let writeClipboard: ReturnType<typeof vi.fn>;
let downloaded: Blob | null;
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
  downloaded = null;
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn((blob: Blob) => {
      downloaded = blob;
      return "blob:adopted-ux";
    }),
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
async function askWindowClose() {
  const event = { preventDefault: vi.fn() };
  await act(async () => {
    await native.handler!(event);
  });
  expect(event.preventDefault).toHaveBeenCalled();
}

describe("adopted clipboard UX through production App and GlideSheet", () => {
  it.each(["keyboard", "context"] as const)(
    "keeps self-copy one column through %s paste and one Undo",
    async (route) => {
      await load('"North,East",keep-1\n"South,West",keep-2\nold-a,target-a\nold-b,target-b');
      const before = matrix(4);
      select(0, 0, 2);
      if (route === "keyboard") key("c");
      else {
        contextMenu(0, 0);
        fireEvent.click(screen.getByRole("menuitem", { name: new RegExp(t("copy")) }));
      }
      await waitFor(() => expect(writeClipboard).toHaveBeenCalledOnce());
      select(2, 0);
      if (route === "keyboard") paste(clipboardText);
      else {
        contextMenu(2, 0);
        fireEvent.click(screen.getByRole("menuitem", { name: new RegExp(t("paste")) }));
      }
      await waitFor(() => expect(cell(3, 0)).toBe("South,West"));
      expect(matrix(4)).toEqual([
        before[0],
        before[1],
        ["North,East", "target-a"],
        ["South,West", "target-b"],
      ]);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      undo();
      expect(matrix(4)).toEqual(before);
      expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
    },
  );
  it("preserves multiline, quotes and a trailing blank self-copied row", async () => {
    await load('"line1\nline2",a\n"a""b",b\n,c\nx,d\ny,e\nz,f');
    select(0, 0, 3);
    key("c");
    await waitFor(() => expect(writeClipboard).toHaveBeenCalledOnce());
    select(3, 0);
    paste(clipboardText);
    expect(matrix(3)).toEqual(
      matrix(6)
        .slice(3)
        .map((row, i) => [row[0], ["a", "b", "c"][i]]),
    );
    expect(matrix(6).slice(3)).toEqual([
      ["line1\nline2", "d"],
      ['a"b', "e"],
      ["", "f"],
    ]);
  });
  it("previews ambiguous external text, cancels without edits, then explicitly applies CSV atomically", async () => {
    await load("original,neighbor\nsecond,protected");
    const before = matrix(2);
    paste("North,East\nSouth,West");
    let dialog = screen.getByRole("dialog", { name: /Paste format/ });
    expect(within(dialog).getByRole("combobox")).toHaveValue("single-column");
    expect(dialog).toHaveTextContent("North,East");
    expect(matrix(2)).toEqual(before);
    fireEvent.click(within(dialog).getByRole("button", { name: /Cancel/ }));
    clean();
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
    paste("North,East\nSouth,West");
    dialog = screen.getByRole("dialog", { name: /Paste format/ });
    fireEvent.change(within(dialog).getByRole("combobox"), { target: { value: "csv" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /Apply/ }));
    expect(matrix(2)).toEqual([
      ["North", "East"],
      ["South", "West"],
    ]);
    undo();
    expect(matrix(2)).toEqual(before);
  });
  it("rejects a clipboard preview that belongs to another document", async () => {
    await load();
    paste("North,East");
    expect(screen.getByRole("dialog", { name: /Paste format/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
    expect(screen.queryByRole("dialog", { name: /Paste format/ })).not.toBeInTheDocument();
    expect(cell(0, 0)).toBe("");
    clean();
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
    fireEvent.click(screen.getAllByRole("tab")[0]);
    expect(cell(0, 0)).toBe("name");
    clean();
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
  });
  it("refuses an old clipboard preview after cells change in the same document", async () => {
    await load("original,keep");
    paste("North,East");
    expect(screen.getByRole("dialog", { name: /Paste format/ })).toBeInTheDocument();
    edit(0, 1, "new neighbor");
    fireEvent.click(
      within(screen.getByRole("dialog", { name: /Paste format/ })).getByRole("button", {
        name: /Apply/,
      }),
    );
    expect(matrix(1)).toEqual([["original", "new neighbor"]]);
    expect(screen.getByText(t("clipboardContextChanged"))).toBeInTheDocument();
    undo();
    expect(matrix(1)).toEqual([["original", "keep"]]);
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
  });
  it.each(["d", "r"])(
    "captures Ctrl+%s as copy fill even when series mode is selected",
    async (direction) => {
      await load("1,2\n3,4");
      fireEvent.change(screen.getByRole("combobox", { name: /Fill/ }), {
        target: { value: "series" },
      });
      select(0, 0, 2, 2);
      key(direction);
      expect(matrix(2)).toEqual(
        direction === "d"
          ? [
              ["1", "2"],
              ["1", "2"],
            ]
          : [
              ["1", "1"],
              ["3", "3"],
            ],
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      undo();
      expect(matrix(2)).toEqual([
        ["1", "2"],
        ["3", "4"],
      ]);
    },
  );
});

describe("adopted search UX through production App and matcher", () => {
  it.each(["f", "h"])(
    "refocuses and selects the query on repeated Ctrl+%s without consuming composition Enter/Escape",
    async (shortcut) => {
      await load("match,keep\nmatch,keep");
      openSearch("match");
      const input = find() as HTMLInputElement;
      screen.getByRole("textbox", { name: t("formulaInput") }).focus();
      key(shortcut);
      expect(input).toHaveFocus();
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(5);
      const before = editor().gridSelection?.current?.cell;
      fireEvent.compositionStart(input);
      fireEvent.keyDown(input, { key: "Enter", isComposing: true });
      fireEvent.keyDown(input, { key: "Escape", isComposing: true });
      expect(input).toBeInTheDocument();
      expect(editor().gridSelection?.current?.cell).toEqual(before);
      fireEvent.compositionEnd(input);
      fireEvent.keyDown(input, { key: "Enter" });
      expect(editor().gridSelection?.current?.cell).toEqual([0, 1]);
      fireEvent.keyDown(input, { key: "Escape" });
      expect(screen.queryByRole("textbox", { name: t("findPlaceholder") })).not.toBeInTheDocument();
    },
  );
  it("distinguishes literal bracket hits, invalid regex, no matches and the 2000/2001 query boundary", async () => {
    await load("[,keep\n" + "x".repeat(2000) + ",keep");
    openSearch("[");
    expect(find()).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByRole("button", { name: t("replaceAll") })).toBeEnabled();
    fireEvent.click(screen.getByRole("checkbox", { name: t("regex") }));
    expect(find()).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/Invalid regular expression/)).toBeInTheDocument();
    expect(screen.queryByText(t("noMatches"))).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("replaceAll") })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: t("regex") }));
    fireEvent.change(find(), { target: { value: "absent" } });
    expect(screen.getByText(t("noMatches"))).toBeInTheDocument();
    fireEvent.change(find(), { target: { value: "x".repeat(2000) } });
    expect(find()).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByRole("button", { name: t("replaceAll") })).toBeEnabled();
    fireEvent.change(find(), { target: { value: "x".repeat(2001) } });
    expect(find()).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/Maximum 2000/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("replaceAll") })).toBeDisabled();
  });
  it("freezes the exact whole-cell scope across next-hit navigation and invalidates it after a structure change", async () => {
    await load("outside,heading\nmatch,match\nmatch,matchish\nmatch,match\nmatch,match");
    select(1, 1, 3);
    key("f");
    fireEvent.change(screen.getByRole("combobox", { name: /Scope/ }), {
      target: { value: "selection" },
    });
    fireEvent.change(find(), { target: { value: "match" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /Whole cell/ }));
    expect(screen.getByText("B2:B4 (3 cells)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: t("next") }));
    expect(editor().gridSelection?.current?.cell).toEqual([1, 3]);
    fireEvent.change(replaceText(), { target: { value: "done" } });
    fireEvent.click(screen.getByRole("button", { name: t("replaceAll") }));
    expect(preview()).toHaveTextContent("2 cells");
    fireEvent.click(within(preview()).getByRole("button", { name: /Apply/ }));
    expect(matrix(5)).toEqual([
      ["outside", "heading"],
      ["match", "done"],
      ["match", "matchish"],
      ["match", "done"],
      ["match", "match"],
    ]);
    undo();
    expect(cell(1, 1)).toBe("match");
    expect(cell(3, 1)).toBe("match");
    fireEvent.click(screen.getByRole("button", { name: t("insertRow") }));
    expect(screen.getByRole("button", { name: t("replaceAll") })).toBeDisabled();
    expect(screen.getByText(/No target; reset selection/)).toBeInTheDocument();
  });
  it("previews and replaces all 5003 matching cells beyond the navigation cap and restores them with one Undo", async () => {
    await load(Array.from({ length: 5003 }, () => "match match,keep").join("\n"));
    openSearch("match");
    fireEvent.change(replaceText(), { target: { value: "done" } });
    expect(
      screen.getByText(t("limitedMatchCount", { current: 1, navigation: 5000, total: 5003 })),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: t("replaceAll") }));
    expect(preview()).toHaveTextContent("5003 cells");
    expect(cell(5002, 0)).toBe("match match");
    fireEvent.click(within(preview()).getByRole("button", { name: /Cancel/ }));
    expect(cell(0, 0)).toBe("match match");
    clean();
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: t("replaceAll") }));
    fireEvent.click(within(preview()).getByRole("button", { name: /Apply/ }));
    expect(matrix(5003).every((row) => row[0] === "done done" && row[1] === "keep")).toBe(true);
    undo();
    expect(matrix(5003).every((row) => row[0] === "match match" && row[1] === "keep")).toBe(true);
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
  });
  it("keeps hidden rows out of visible replacement and includes them only with explicit all-sheet scope", async () => {
    await load("value,group\nmatch,A\nmatch,B\nmatch,A");
    act(() => editor().onHeaderMenuClick?.(1, { x: 0, y: 0, width: 50, height: 30 }));
    fireEvent.click(screen.getByRole("menuitem", { name: t("filter") }));
    fireEvent.click(screen.getByRole("checkbox", { name: /B/ }));
    fireEvent.click(screen.getByRole("button", { name: t("filterApply") }));
    openSearch("match");
    fireEvent.change(replaceText(), { target: { value: "done" } });
    fireEvent.click(screen.getByRole("button", { name: t("replaceAll") }));
    expect(preview()).toHaveTextContent("2 cells");
    fireEvent.click(within(preview()).getByRole("button", { name: /Apply/ }));
    fireEvent.click(screen.getByRole("button", { name: t("filterAll") }));
    expect(matrix(4)).toEqual([
      ["value", "group"],
      ["done", "A"],
      ["match", "B"],
      ["done", "A"],
    ]);
    undo();
    act(() => editor().onHeaderMenuClick?.(1, { x: 0, y: 0, width: 50, height: 30 }));
    fireEvent.click(screen.getByRole("menuitem", { name: t("filter") }));
    fireEvent.click(screen.getByRole("checkbox", { name: /B/ }));
    fireEvent.click(screen.getByRole("button", { name: t("filterApply") }));
    fireEvent.change(screen.getByRole("combobox", { name: /Scope/ }), {
      target: { value: "sheet" },
    });
    fireEvent.click(screen.getByRole("button", { name: t("replaceAll") }));
    expect(preview()).toHaveTextContent("3 cells");
    expect(preview()).toHaveTextContent("Includes hidden rows");
    fireEvent.click(within(preview()).getByRole("button", { name: /Apply/ }));
    fireEvent.click(screen.getByRole("button", { name: t("filterAll") }));
    expect(matrix(4).slice(1)).toEqual([
      ["done", "A"],
      ["done", "B"],
      ["done", "A"],
    ]);
    undo();
    expect(matrix(4).slice(1)).toEqual([
      ["match", "A"],
      ["match", "B"],
      ["match", "A"],
    ]);
  });
  it("rejects a replace-all preview after switching documents", async () => {
    await load("match,keep");
    openSearch("match");
    fireEvent.change(replaceText(), { target: { value: "wrong document" } });
    fireEvent.click(screen.getByRole("button", { name: t("replaceAll") }));
    expect(preview()).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
    expect(screen.queryByRole("dialog", { name: /Replace all preview/ })).not.toBeInTheDocument();
    expect(cell(0, 0)).toBe("");
    clean();
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
    fireEvent.click(screen.getAllByRole("tab")[0]);
    expect(cell(0, 0)).toBe("match");
    clean();
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
  });
  it("refuses an old replace-all preview after cells change in the same document", async () => {
    await load("match,keep");
    openSearch("match");
    fireEvent.change(replaceText(), { target: { value: "stale replacement" } });
    fireEvent.click(screen.getByRole("button", { name: t("replaceAll") }));
    expect(preview()).toBeInTheDocument();
    edit(0, 1, "new neighbor");
    fireEvent.click(within(preview()).getByRole("button", { name: /Apply/ }));
    expect(matrix(1)).toEqual([["match", "new neighbor"]]);
    expect(screen.getByText(t("clipboardContextChanged"))).toBeInTheDocument();
    undo();
    expect(matrix(1)).toEqual([["match", "keep"]]);
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
  });
  it.each([false, true])(
    "uses the same replacement rules in preview and mutation with capture references %s",
    async (groups) => {
      await load("ab,keep");
      openSearch("(a)(b)");
      fireEvent.click(screen.getByRole("checkbox", { name: t("regex") }));
      if (groups) fireEvent.click(screen.getByRole("checkbox", { name: /Capture references/ }));
      fireEvent.change(replaceText(), { target: { value: "$2-$1-$$-$3" } });
      fireEvent.click(screen.getByRole("button", { name: t("replaceAll") }));
      const expected = groups ? "b-a-$-$3" : "$2-$1-$$-$3";
      expect(preview()).toHaveTextContent(`ab → ${expected}`);
      fireEvent.click(within(preview()).getByRole("button", { name: /Apply/ }));
      expect(cell(0, 0)).toBe(expected);
      expect(cell(0, 1)).toBe("keep");
      undo();
      expect(cell(0, 0)).toBe("ab");
    },
  );
});

describe("adopted saving and close UX with synthetic native I/O", () => {
  it("keeps completion notice and checkpoint attached to A while B is active and dirty", async () => {
    await load(undefined, true);
    edit(1, 0, "saved A");
    let complete!: () => void;
    vi.mocked(invoke).mockImplementation(async (command) => {
      if (command === "save_file_dialog") return "A.csv";
      if (command === "write_file")
        return await new Promise<void>((resolve) => {
          complete = resolve;
        });
    });
    key("s");
    await waitFor(() => expect(complete).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
    edit(0, 0, "unsaved B");
    await act(async () => complete());
    expect(cell(0, 0)).toBe("unsaved B");
    dirty();
    expect(screen.getByText(t("savedFileNotice", { name: "A.csv" }))).toBeInTheDocument();
    expect(invoke).toHaveBeenCalledWith(
      "write_file",
      expect.objectContaining({ path: "A.csv", content: expect.stringContaining("saved A,A") }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Open target/ }));
    expect(cell(1, 0)).toBe("saved A");
    clean();
    fireEvent.click(screen.getAllByRole("tab")[1]);
    expect(cell(0, 0)).toBe("unsaved B");
    dirty();
  });
  it("returns to a direct-save checkpoint only when data and serialization settings match", async () => {
    await load(undefined, true);
    edit(1, 0, "saved");
    key("s");
    await waitFor(() =>
      expect(screen.getByText(t("savedFileNotice", { name: "saved.csv" }))).toBeInTheDocument(),
    );
    clean();
    edit(1, 0, "new");
    dirty();
    undo();
    expect(cell(1, 0)).toBe("saved");
    clean();
    fireEvent.click(screen.getByRole("button", { name: t("redo") }));
    dirty();
    undo();
    clean();
    fireEvent.click(screen.getByRole("button", { name: t("settings") }));
    fireEvent.change(screen.getByRole("combobox", { name: t("newline") }), {
      target: { value: "CRLF" },
    });
    dirty();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    edit(1, 0, "new");
    undo();
    expect(cell(1, 0)).toBe("saved");
    dirty();
  });
  it("never treats a browser download or Undo back to it as a durable checkpoint", async () => {
    await load();
    edit(1, 0, "downloaded");
    key("s");
    await waitFor(() => expect(downloaded).not.toBeNull());
    dirty();
    edit(1, 0, "new");
    undo();
    expect(cell(1, 0)).toBe("downloaded");
    dirty();
  });
  it.each(["cancel", "failure"])(
    "keeps the dirty tab and original edits when save-and-close ends with %s",
    async (outcome) => {
      await load(undefined, true);
      edit(1, 0, "keep edit");
      fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
      fireEvent.click(
        within(screen.getAllByRole("tab")[0]).getByRole("button", { name: t("closeTab") }),
      );
      expect(within(closeDialog()).getByText("sample.csv")).toBeInTheDocument();
      vi.mocked(invoke).mockImplementation(async (command) => {
        if (command === "save_file_dialog") return outcome === "cancel" ? null : "saved.csv";
        if (command === "write_file") throw new Error("synthetic write failure");
      });
      fireEvent.click(within(closeDialog()).getByRole("button", { name: /Save and close/ }));
      await waitFor(() =>
        expect(within(closeDialog()).getByRole("button", { name: /Back/ })).toBeEnabled(),
      );
      expect(screen.getAllByRole("tab")).toHaveLength(2);
      expect(native.destroy).not.toHaveBeenCalled();
      fireEvent.click(within(closeDialog()).getByRole("button", { name: /Back/ }));
      fireEvent.click(screen.getAllByRole("tab")[0]);
      expect(cell(1, 0)).toBe("keep edit");
      dirty();
    },
  );
  it("lists every dirty document and waits for every direct write before window destruction", async () => {
    await load(undefined, true);
    edit(1, 0, "A change");
    fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
    edit(0, 0, "B change");
    let writes = 0;
    let finishSecond!: () => void;
    vi.mocked(invoke).mockImplementation(async (command, args) => {
      if (command === "save_file_dialog") return (args as { defaultName: string }).defaultName;
      if (command === "write_file" && ++writes === 2)
        return await new Promise<void>((resolve) => {
          finishSecond = resolve;
        });
    });
    await askWindowClose();
    expect(within(closeDialog()).getByText("sample.csv")).toBeInTheDocument();
    expect(within(closeDialog()).getByText("untitled")).toBeInTheDocument();
    fireEvent.click(within(closeDialog()).getByRole("button", { name: /Save and close/ }));
    await waitFor(() => expect(finishSecond).toBeDefined());
    expect(native.destroy).not.toHaveBeenCalled();
    await askWindowClose();
    expect(within(closeDialog()).getByRole("button", { name: /Back/ })).toBeDisabled();
    await act(async () => finishSecond());
    await waitFor(() => expect(native.destroy).toHaveBeenCalledOnce());
  });
  it("does not close when the document changes while save-and-close is pending", async () => {
    await load(undefined, true);
    edit(1, 0, "before write");
    let complete!: () => void;
    vi.mocked(invoke).mockImplementation(async (command) => {
      if (command === "save_file_dialog") return "saved.csv";
      if (command === "write_file")
        return await new Promise<void>((resolve) => {
          complete = resolve;
        });
    });
    await askWindowClose();
    fireEvent.click(within(closeDialog()).getByRole("button", { name: /Save and close/ }));
    await waitFor(() => expect(complete).toBeDefined());
    edit(1, 0, "new edit");
    await act(async () => complete());
    expect(native.destroy).not.toHaveBeenCalled();
    expect(closeDialog()).toBeInTheDocument();
    expect(cell(1, 0)).toBe("new edit");
    dirty();
  });
  it("requires explicit confirmation after browser download before removing a dirty tab", async () => {
    await load();
    edit(1, 0, "keep");
    fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
    fireEvent.click(
      within(screen.getAllByRole("tab")[0]).getByRole("button", { name: t("closeTab") }),
    );
    fireEvent.click(within(closeDialog()).getByRole("button", { name: /Save and close/ }));
    await waitFor(() =>
      expect(
        within(closeDialog()).getByRole("button", { name: /Confirm download and close/ }),
      ).toBeEnabled(),
    );
    expect(downloaded).not.toBeNull();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getAllByRole("tab")[0]).toHaveAccessibleName(new RegExp(t("unsaved")));
    fireEvent.click(
      within(closeDialog()).getByRole("button", { name: /Confirm download and close/ }),
    );
    expect(screen.getAllByRole("tab")).toHaveLength(1);
    expect(cell(0, 0)).toBe("");
  });
  it("reports a failed native close-listener registration instead of claiming protection", async () => {
    native.register.mockRejectedValueOnce(new Error("synthetic listener failure"));
    Object.defineProperty(window, "__TAURI_INTERNALS__", { configurable: true, value: {} });
    render(<App />);
    await waitFor(() => expect(screen.getByText(t("windowCloseGuardFailed"))).toBeInTheDocument());
    expect(native.destroy).not.toHaveBeenCalled();
  });
});
