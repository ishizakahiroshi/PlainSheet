import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { CompactSelection, GridCellKind, type DataEditor } from "@glideapps/glide-data-grid";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import App from "../App";
import { t } from "../lib/i18n";

// Execute App, GlideSheet, hooks, parsers and helpers. Only native I/O and the
// canvas renderer are replaced. A transparent collaboration-hook wrapper captures
// the actual App boundary so a deterministic late remote update can be delivered.
// This is not GUI, real IME, relay or native acceptance.
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
const closeDialog = () => screen.getByRole("dialog", { name: /Save before closing/ });
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
  vi.useRealTimers();
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

type CollaborationOptions = Parameters<
  typeof import("../hooks/useCollaboration").useCollaboration
>[0];
const shared = vi.hoisted(() => ({ options: null as CollaborationOptions | null }));
vi.mock("../hooks/useCollaboration", async (importOriginal) => {
  const original = await importOriginal<typeof import("../hooks/useCollaboration")>();
  return {
    ...original,
    useCollaboration: (options: CollaborationOptions) => {
      shared.options = options;
      return original.useCollaboration(options);
    },
  };
});
const openRules = () => fireEvent.click(screen.getByRole("button", { name: /Validation \(/ }));
const recoveryDialog = () => screen.getByRole("dialog", { name: "Local recovery drafts" });
const openRecovery = () => fireEvent.click(screen.getByRole("button", { name: /Recovery:/ }));
const enableRecovery = () => {
  openRecovery();
  fireEvent.click(within(recoveryDialog()).getByRole("checkbox", { name: /I agree/ }));
  fireEvent.click(within(recoveryDialog()).getByRole("button", { name: "Enable local recovery" }));
  fireEvent.click(within(recoveryDialog()).getByRole("button", { name: "Later" }));
};
const recoveryState = () => JSON.parse(localStorage.getItem("plainsheet.recovery.v1")!);
const delay = (ms: number) =>
  act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });

describe("review regressions: saving, recovery and validation", () => {
  it("F1 must not destroy after a previously saved A receives a late shared update during B write", async () => {
    await load("id,value\n11,keep", true);
    const aId = shared.options!.activeId;
    edit(1, 0, "A edit");
    fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
    edit(0, 0, "B edit");
    let writes = 0,
      finishSecond!: () => void;
    vi.mocked(invoke).mockImplementation(async (command, args) => {
      if (command === "save_file_dialog") return (args as { defaultName: string }).defaultName;
      if (command === "write_file" && ++writes === 2)
        return await new Promise<void>((r) => {
          finishSecond = r;
        });
    });
    await askWindowClose();
    fireEvent.click(within(closeDialog()).getByRole("button", { name: /Save and close/ }));
    await waitFor(() => expect(finishSecond).toBeDefined());
    act(() =>
      shared.options!.applyRows(aId, [
        ["id", "value"],
        ["late shared edit", "keep"],
      ]),
    );
    expect(screen.getAllByRole("tab")[0]).toHaveAccessibleName(new RegExp(t("unsaved")));
    await act(async () => finishSecond());
    expect(native.destroy).not.toHaveBeenCalled();
  });
  it("F1 also blocks close when an initially clean document changes during another write", async () => {
    await load("id,value\n11,keep", true);
    const initiallyCleanId = shared.options!.activeId;
    fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
    edit(0, 0, "dirty second document");
    let finishWrite!: () => void;
    vi.mocked(invoke).mockImplementation(async (command, args) => {
      if (command === "save_file_dialog") return (args as { defaultName: string }).defaultName;
      if (command === "write_file")
        return await new Promise<void>((resolve) => {
          finishWrite = resolve;
        });
    });
    await askWindowClose();
    fireEvent.click(within(closeDialog()).getByRole("button", { name: /Save and close/ }));
    await waitFor(() => expect(finishWrite).toBeDefined());
    act(() =>
      shared.options!.applyRows(initiallyCleanId, [
        ["id", "value"],
        ["new remote text", "keep"],
      ]),
    );
    expect(screen.getAllByRole("tab")[0]).toHaveAccessibleName(new RegExp(t("unsaved")));
    await act(async () => finishWrite());
    expect(native.destroy).not.toHaveBeenCalled();
    expect(within(closeDialog()).getByRole("button", { name: /Save and close/ })).toBeEnabled();
  });
  it("F2 deleting drafts cancels pending content snapshots", async () => {
    await load("id,value\n11,keep");
    edit(1, 0, "old");
    enableRecovery();
    await delay(1100);
    expect(recoveryState().drafts).toHaveLength(1);
    edit(1, 0, "pending content");
    openRecovery();
    fireEvent.click(
      within(recoveryDialog()).getByRole("button", { name: "Delete all recovery drafts" }),
    );
    expect(recoveryState().drafts).toHaveLength(0);
    await delay(1100);
    expect(recoveryState().drafts).toHaveLength(0);
    expect(
      within(recoveryDialog()).getByRole("list", { name: "Recovery drafts" }),
    ).toBeEmptyDOMElement();
  });
  it("F2 deleting an inactive document cancels its pending snapshot but permits a distinct later edit", async () => {
    await load("id,value\n11,keep");
    const aId = shared.options!.activeId;
    edit(1, 0, "old");
    vi.useFakeTimers();
    enableRecovery();
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    expect(recoveryState().drafts).toHaveLength(1);
    edit(1, 0, "pending deleted content");
    fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
    openRecovery();
    fireEvent.click(within(recoveryDialog()).getByRole("button", { name: "Delete this draft" }));
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    expect(recoveryState().drafts).toHaveLength(0);
    expect(
      within(recoveryDialog()).getByRole("list", { name: "Recovery drafts" }),
    ).toBeEmptyDOMElement();
    fireEvent.click(within(recoveryDialog()).getByRole("button", { name: "Later" }));
    act(() =>
      shared.options!.applyRows(aId, [
        ["id", "value"],
        ["distinct later edit", "keep"],
      ]),
    );
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    expect(recoveryState().drafts).toEqual([
      expect.objectContaining({
        documentId: aId,
        fileName: "sample.csv",
        rows: [
          ["id", "value"],
          ["distinct later edit", "keep"],
        ],
      }),
    ]);
    openRecovery();
    expect(
      within(recoveryDialog()).getAllByRole("button", { name: "Delete this draft" }),
    ).toHaveLength(1);
  });
  it("F2 turning recovery off deletes drafts and blocks pending or subsequent snapshots", async () => {
    await load("id,value\n11,keep");
    edit(1, 0, "old");
    vi.useFakeTimers();
    enableRecovery();
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    edit(1, 0, "pending content");
    openRecovery();
    fireEvent.click(
      within(recoveryDialog()).getByRole("button", { name: "Turn off and delete all drafts" }),
    );
    expect(localStorage.getItem("plainsheet.recovery.v1")).toBeNull();
    expect(within(recoveryDialog()).getByRole("status")).toHaveTextContent("Recovery: OFF");
    fireEvent.click(within(recoveryDialog()).getByRole("button", { name: "Later" }));
    edit(1, 0, "new content while off");
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    expect(localStorage.getItem("plainsheet.recovery.v1")).toBeNull();
  });
  it("F3 switching tabs preserves a pending originating-document snapshot", async () => {
    await load("id,value\n11,keep");
    edit(1, 0, "old");
    enableRecovery();
    await delay(1100);
    edit(1, 0, "latest committed");
    fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
    await delay(1300);
    expect(recoveryState().drafts[0].rows[1][0]).toBe("latest committed");
  });
  it.each([
    ["/source.json", '[{"qty":7}]'],
    ["/source.yaml", "- qty: 7"],
    ["/source.md", "Outside table\n\n| qty |\n| --- |\n| 7 |"],
  ])(
    "F4 lossy save-and-close leaves an actionable conversion prompt for %s",
    async (path, content) => {
      Object.defineProperty(window, "__TAURI_INTERNALS__", { configurable: true, value: {} });
      vi.mocked(invoke).mockImplementation(async (command) => {
        if (command === "open_file_dialog") return path;
        if (command === "read_file_bytes") return [...new TextEncoder().encode(content)];
      });
      render(<App />);
      fireEvent.click(screen.getAllByRole("button", { name: t("open") })[0]);
      await waitFor(() =>
        expect(screen.getByRole("dialog", { name: /読込み|Import preview/ })).toBeInTheDocument(),
      );
      fireEvent.click(screen.getByRole("button", { name: /この内容で開く|Open this preview/ }));
      await waitFor(() => expect(cell(1, 0)).toBe("7"));
      edit(1, 0, "8");
      await askWindowClose();
      fireEvent.click(within(closeDialog()).getByRole("button", { name: /Save and close/ }));
      await waitFor(() =>
        expect(screen.getByRole("dialog", { name: /上書き変換/ })).toBeInTheDocument(),
      );
      const dialogs = screen.getAllByRole("dialog");
      expect(dialogs.at(-1)).toHaveAccessibleName(/上書き変換/);
      expect(dialogs).toHaveLength(1);
      fireEvent.click(within(dialogs[0]).getByRole("button", { name: /Cancel/ }));
      await waitFor(() =>
        expect(within(closeDialog()).getByRole("button", { name: /Save and close/ })).toBeEnabled(),
      );
      expect(native.destroy).not.toHaveBeenCalled();
      expect(vi.mocked(invoke).mock.calls.some(([command]) => command === "write_file")).toBe(
        false,
      );
    },
  );
  it("F5 structural formula rewrite must be validated after rewriting", async () => {
    await load("id,value\nx,=B4\nx,placeholder\nlast,9");
    fireEvent.click(screen.getByRole("checkbox", { name: /Calculate formulas/ }));
    fireEvent.click(screen.getByRole("button", { name: /Validation \(/ }));
    const rules = screen.getByRole("dialog", { name: "Input rules for this document" });
    fireEvent.change(within(rules).getByRole("spinbutton", { name: "Column number" }), {
      target: { value: "2" },
    });
    fireEvent.change(within(rules).getByRole("combobox", { name: /^Rule$/ }), {
      target: { value: "enum" },
    });
    fireEvent.change(within(rules).getByRole("textbox", { name: "Allowed values, one per line" }), {
      target: { value: "=B4\nplaceholder\n9" },
    });
    fireEvent.change(within(rules).getByRole("combobox", { name: "On invalid input" }), {
      target: { value: "reject" },
    });
    fireEvent.click(within(rules).getByRole("button", { name: "Add rule" }));
    fireEvent.click(within(rules).getByRole("button", { name: "Close" }));
    select(1, 0, 2);
    fireEvent.click(screen.getByRole("button", { name: /Cleanup/ }));
    const dialog = screen.getByRole("dialog", { name: "Clean up selected data" });
    fireEvent.change(within(dialog).getByRole("combobox", { name: "Operation" }), {
      target: { value: "dedupe" },
    });
    fireEvent.click(within(dialog).getByRole("checkbox", { name: /complete row/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Apply cleanup" }));
    expect(matrix(4)).toEqual([
      ["id", "value"],
      ["x", "=B4"],
      ["x", "placeholder"],
      ["last", "9"],
    ]);
  });
});

describe("further C8 boundaries", () => {
  it("F6 reject-mode rules also cover structural insertions before history changes", async () => {
    await load("id,value\n11,keep");
    openRules();
    const dialog = screen.getByRole("dialog", { name: "Input rules for this document" });
    fireEvent.change(within(dialog).getByRole("combobox", { name: "On invalid input" }), {
      target: { value: "reject" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add rule" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    select(1, 0);
    fireEvent.click(screen.getByRole("button", { name: t("insertRow") }));
    openRules();
    expect(screen.getByRole("dialog", { name: "Input rules for this document" })).toHaveTextContent(
      "Current data: 0 rule violations",
    );
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
  });
  it("F7 startup storage corruption is surfaced instead of reporting OFF", async () => {
    localStorage.setItem("plainsheet.recovery.v1", "{invalid JSON");
    render(<App />);
    expect(
      screen.queryByText(/damaged|cannot be read|unavailable|復元下書きは保存できていません/i),
    ).toBeInTheDocument();
  });
  it("F8 conversion preview warns before empty-object records are removed", async () => {
    const { createConversionPreview } = await import("../lib/conversionPreview");
    const preview = createConversionPreview({ content: "[{},{}]", format: "json" });
    expect(preview.outputContent.trim()).toBe("[]");
    expect(preview.hasLoss).toBe(true);
  });
});

describe("browser import supersession", () => {
  it("F9 older byte reads cannot replace a newer pending import preview", async () => {
    render(<App />);
    let finishFirst!: (buffer: ArrayBuffer) => void;
    const first = {
      name: "older.csv",
      arrayBuffer: () =>
        new Promise<ArrayBuffer>((r) => {
          finishFirst = r;
        }),
    };
    const second = {
      name: "newer.csv",
      arrayBuffer: async () => new TextEncoder().encode("newer,data").buffer,
    };
    fireEvent.drop(window, { dataTransfer: { files: [first] } });
    fireEvent.drop(window, { dataTransfer: { files: [second] } });
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveTextContent("newer.csv"));
    await act(async () => finishFirst(new TextEncoder().encode("older,data").buffer));
    expect(screen.getByRole("dialog")).toHaveTextContent("newer.csv");
  });
});
