import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type { AddressInfo } from "node:net";
import { createCollaborationRelay } from "../../server/relay";
import { activeIds, CollaborationClient, sharedDocumentRows } from "../lib/collaboration";
import { CompactSelection, GridCellKind, type DataEditor } from "@glideapps/glide-data-grid";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import App from "../App";
import { t } from "../lib/i18n";

// Execute production App, GlideSheet, parsers, hooks and extension panels.
// Only native I/O and the canvas renderer are replaced; no GUI/native acceptance.
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
const undo = () => fireEvent.click(screen.getByRole("button", { name: t("undo") }));
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
    value: vi.fn(() => "blob:extended-ux"),
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

const value = (row: number, col: number) => {
  const result = editor().getCellContent([col, row]);
  if (result.kind !== GridCellKind.Text) throw new Error("Expected text");
  return result.displayData;
};
const calculation = () => screen.getByRole("checkbox", { name: /Calculate formulas/ });
const headerMenu = (col: number) =>
  act(() => editor().onHeaderMenuClick?.(col, { x: 0, y: 0, width: 50, height: 30 }));
const exclude = (col: number, label: string) => {
  headerMenu(col);
  fireEvent.click(screen.getByRole("menuitem", { name: t("filter") }));
  fireEvent.click(screen.getByRole("checkbox", { name: new RegExp(label) }));
  fireEvent.click(screen.getByRole("button", { name: t("filterApply") }));
};
const openRules = () => fireEvent.click(screen.getByRole("button", { name: /Validation \(/ }));
const ruleDialog = () => screen.getByRole("dialog", { name: "Input rules for this document" });
const addRule = (mode: "warning" | "reject", pattern = "[0-9]+") => {
  openRules();
  fireEvent.change(within(ruleDialog()).getByRole("combobox", { name: /^Rule$/ }), {
    target: { value: "pattern" },
  });
  fireEvent.change(within(ruleDialog()).getByRole("textbox", { name: "Full-cell pattern" }), {
    target: { value: pattern },
  });
  fireEvent.change(within(ruleDialog()).getByRole("combobox", { name: "On invalid input" }), {
    target: { value: mode },
  });
  fireEvent.click(within(ruleDialog()).getByRole("button", { name: "Add rule" }));
  fireEvent.click(within(ruleDialog()).getByRole("button", { name: /^Close$/ }));
};
const cleanupDialog = () => screen.getByRole("dialog", { name: "Clean up selected data" });
const openCleanup = () => fireEvent.click(screen.getByRole("button", { name: /Cleanup/ }));
const recoveryDialog = () => screen.getByRole("dialog", { name: "Local recovery drafts" });
const openRecovery = () => fireEvent.click(screen.getByRole("button", { name: /Recovery:/ }));

describe("document-scoped extension state", () => {
  it("isolates header meaning, filter and independent row/column freezes without dirtying data", async () => {
    await load();
    fireEvent.change(screen.getByRole("combobox", { name: /First row/ }), {
      target: { value: "data" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: /Frozen rows/ }), {
      target: { value: "2" },
    });
    headerMenu(1);
    fireEvent.click(screen.getByRole("menuitem", { name: t("freezeToHere") }));
    exclude(1, "B");
    expect(editor().freezeColumns).toBe(2);
    expect(cell(2, 0)).toBe("9007199254740993");
    expect(screen.getByLabelText(/Frozen row references/)).toHaveTextContent("00123");
    clean();
    const first = screen.getByRole("tab", { selected: true });
    fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
    expect(screen.getByRole("combobox", { name: /First row/ })).toHaveValue("header");
    expect(screen.getByRole("spinbutton", { name: /Frozen rows/ })).toHaveValue(0);
    expect(editor().freezeColumns).toBe(0);
    expect(screen.queryByRole("button", { name: t("filterAll") })).not.toBeInTheDocument();
    fireEvent.click(first);
    expect(screen.getByRole("combobox", { name: /First row/ })).toHaveValue("data");
    expect(screen.getByRole("spinbutton", { name: /Frozen rows/ })).toHaveValue(2);
    expect(editor().freezeColumns).toBe(2);
    expect(cell(2, 0)).toBe("9007199254740993");
    fireEvent.click(screen.getByRole("button", { name: t("filterAll") }));
    expect(matrix(4)).toEqual([
      ["name", "group"],
      ["00123", "A"],
      ["hidden", "B"],
      ["9007199254740993", "A"],
    ]);
    clean();
  });

  it("keeps validation rules attached to document identity across tab switches", async () => {
    await load("id,value\n11,keep");
    addRule("reject");
    const first = screen.getByRole("tab", { selected: true });
    fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
    expect(screen.getByRole("button", { name: /Validation \(0\)/ })).toBeInTheDocument();
    edit(1, 0, "free text");
    expect(cell(1, 0)).toBe("free text");
    fireEvent.click(first);
    expect(screen.getByRole("button", { name: /Validation \(1\)/ })).toBeInTheDocument();
    edit(1, 0, "bad");
    expect(cell(1, 0)).toBe("11");
    clean();
  });
});

describe("validation at central mutation boundaries", () => {
  it.each(["grid", "formula bar", "paste", "clear", "replace all", "fill", "cleanup"] as const)(
    "rejects the entire %s transaction with no history or dirty state",
    async (route) => {
      const source =
        route === "fill"
          ? "id,value\nbad,seed\n22,safe"
          : route === "cleanup"
            ? "id,value\n 11 ,keep\n 22 ,safe"
            : "id,value\n11,keep\n22,safe";
      await load(source);
      const before = matrix(3);
      addRule("reject", route === "cleanup" ? " [0-9]+ " : "[0-9]+");
      select(1, 0);
      if (route === "grid") edit(1, 0, "bad");
      if (route === "formula bar") {
        const input = screen.getByRole("textbox", { name: t("formulaInput") });
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: "bad" } });
        fireEvent.blur(input);
      }
      if (route === "paste") paste("bad\tchanged\n22\talso changed");
      if (route === "clear") act(() => editor().onDelete?.(editor().gridSelection!));
      if (route === "replace all") {
        key("f");
        fireEvent.change(screen.getByRole("textbox", { name: t("findPlaceholder") }), {
          target: { value: "11" },
        });
        fireEvent.change(screen.getByRole("textbox", { name: t("replacePlaceholder") }), {
          target: { value: "bad" },
        });
        fireEvent.click(screen.getByRole("button", { name: t("replaceAll") }));
        fireEvent.click(
          within(screen.getByRole("dialog", { name: /Replace all preview/ })).getByRole("button", {
            name: /Apply/,
          }),
        );
      }
      if (route === "fill") {
        select(1, 0, 2);
        key("d");
      }
      if (route === "cleanup") {
        select(1, 0, 2);
        openCleanup();
        fireEvent.click(within(cleanupDialog()).getByRole("button", { name: "Apply cleanup" }));
      }
      expect(matrix(3)).toEqual(before);
      expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
      clean();
      expect(screen.getByText(/Entire change rejected/)).toBeInTheDocument();
    },
  );

  it("warns while preserving raw text and keeps one Undo for bulk paste", async () => {
    await load("id,value\n00123,keep\n9007199254740993,safe");
    const before = matrix(3);
    addRule("warning");
    select(1, 0);
    paste("not numeric\tchanged\n00042\talso changed");
    expect(matrix(3)).toEqual([
      ["id", "value"],
      ["not numeric", "changed"],
      ["00042", "also changed"],
    ]);
    expect(screen.getByText(/入力ルール: 1件、拒否0件/)).toBeInTheDocument();
    undo();
    expect(matrix(3)).toEqual(before);
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
  });
});

describe("cleanup and calculation integration", () => {
  it("trims only visible selected cells, leaves hidden rows raw, and undoes atomically", async () => {
    await load("id,group\n 00123 ,A\n hidden ,B\n 9007199254740993 ,A");
    exclude(1, "B");
    select(1, 0, 2);
    openCleanup();
    expect(cleanupDialog()).toHaveTextContent("2 changed cells");
    fireEvent.click(within(cleanupDialog()).getByRole("button", { name: "Cancel" }));
    expect(cell(1, 0)).toBe(" 00123 ");
    clean();
    openCleanup();
    fireEvent.click(within(cleanupDialog()).getByRole("button", { name: "Apply cleanup" }));
    fireEvent.click(screen.getByRole("button", { name: t("filterAll") }));
    expect(matrix(4)).toEqual([
      ["id", "group"],
      ["00123", "A"],
      [" hidden ", "B"],
      ["9007199254740993", "A"],
    ]);
    undo();
    expect(matrix(4)).toEqual([
      ["id", "group"],
      [" 00123 ", "A"],
      [" hidden ", "B"],
      [" 9007199254740993 ", "A"],
    ]);
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
  });

  it("dedupes selected keys with structural formula rewrites and restores both with one Undo", async () => {
    await load("id,value\nx,=B4\nx,placeholder\nlast,9");
    const before = matrix(4);
    fireEvent.click(calculation());
    expect(value(1, 1)).toBe("9");
    select(1, 0, 2);
    openCleanup();
    fireEvent.change(within(cleanupDialog()).getByRole("combobox", { name: "Operation" }), {
      target: { value: "dedupe" },
    });
    fireEvent.click(within(cleanupDialog()).getByRole("checkbox", { name: /complete row/ }));
    fireEvent.click(within(cleanupDialog()).getByRole("button", { name: "Apply cleanup" }));
    expect(matrix(3)).toEqual([
      ["id", "value"],
      ["x", "=B3"],
      ["last", "9"],
    ]);
    expect(value(1, 1)).toBe("9");
    undo();
    expect(matrix(4)).toEqual(before);
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
  });

  it("starts calculation OFF, separates raw editing and results, and keeps the toggle per document", async () => {
    await load("number,result\n2,=A2*2");
    expect(calculation()).not.toBeChecked();
    expect(cell(1, 1)).toBe("=A2*2");
    expect(value(1, 1)).toBe("=A2*2");
    fireEvent.click(calculation());
    expect(value(1, 1)).toBe("4");
    expect(cell(1, 1)).toBe("=A2*2");
    select(1, 1);
    expect(screen.getByRole("textbox", { name: t("formulaInput") })).toHaveValue("=A2*2");
    clean();
    const first = screen.getByRole("tab", { selected: true });
    fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
    expect(calculation()).not.toBeChecked();
    edit(0, 0, "=1+1");
    expect(value(0, 0)).toBe("=1+1");
    fireEvent.click(first);
    expect(calculation()).toBeChecked();
    edit(1, 0, "5");
    expect(value(1, 1)).toBe("10");
    // The established toolbar action inserts AFTER the selected row. Selecting
    // header row 0 inserts at source index 1 and moves =A2*2 to =A3*2.
    select(0, 0);
    fireEvent.click(screen.getByRole("button", { name: t("insertRow") }));
    expect(cell(2, 1)).toBe("=A3*2");
    expect(value(2, 1)).toBe("10");
    undo();
    expect(cell(1, 1)).toBe("=A2*2");
    expect(value(1, 1)).toBe("10");
    undo();
    expect(value(1, 1)).toBe("4");
  });

  it("exports calculated values as a separate copy while preserving the raw save checkpoint", async () => {
    await load("number,result\n2,=A2*2", true);
    fireEvent.click(calculation());
    fireEvent.click(screen.getByRole("button", { name: t("save") }));
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith(
        "write_file",
        expect.objectContaining({ path: "saved.csv", content: "number,result\n2,=A2*2" }),
      ),
    );
    await waitFor(clean);
    edit(1, 0, "5");
    dirty();
    vi.mocked(invoke).mockImplementation(async (command) =>
      command === "save_file_dialog" ? "values.csv" : undefined,
    );
    fireEvent.click(screen.getByRole("button", { name: /Export values copy/ }));
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith(
        "write_file",
        expect.objectContaining({ path: "values.csv", content: "number,result\n5,10" }),
      ),
    );
    expect(cell(1, 1)).toBe("=A2*2");
    expect(screen.getByRole("tab", { selected: true })).toHaveAccessibleName(/saved.csv/);
    dirty();
    undo();
    await waitFor(clean);
    expect(cell(1, 0)).toBe("2");
    expect(cell(1, 1)).toBe("=A2*2");
  });
});

describe("recovery opt-in and restore-copy integration", () => {
  it("writes no content while OFF, snapshots only after consent and restores a dirty pathless formula-OFF copy", async () => {
    await load("number,result\n2,=A2*2", true);
    fireEvent.click(calculation());
    fireEvent.click(screen.getByRole("button", { name: t("save") }));
    await waitFor(clean);
    edit(1, 0, "5");
    expect(localStorage.getItem("plainsheet.recovery.v1")).toBeNull();
    openRecovery();
    expect(recoveryDialog()).toHaveTextContent("Recovery: OFF");
    expect(
      within(recoveryDialog()).getByRole("button", { name: "Enable local recovery" }),
    ).toBeDisabled();
    fireEvent.click(within(recoveryDialog()).getByRole("checkbox", { name: /I agree/ }));
    fireEvent.click(
      within(recoveryDialog()).getByRole("button", { name: "Enable local recovery" }),
    );
    fireEvent.click(within(recoveryDialog()).getByRole("button", { name: "Later" }));
    await waitFor(() => expect(localStorage.getItem("plainsheet.recovery.v1")).toContain("=A2*2"), {
      timeout: 2500,
    });
    const snapshot = localStorage.getItem("plainsheet.recovery.v1")!;
    expect(snapshot).not.toContain('"filePath"');
    openRecovery();
    fireEvent.click(within(recoveryDialog()).getByRole("button", { name: "Open recovery copy" }));
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tab", { selected: true })).toHaveAccessibleName(/Recovered-saved.csv/);
    dirty();
    expect(calculation()).not.toBeChecked();
    expect(matrix(2)).toEqual([
      ["number", "result"],
      ["5", "=A2*2"],
    ]);
    vi.mocked(invoke).mockClear();
    vi.mocked(invoke).mockImplementation(async (command) =>
      command === "save_file_dialog" ? "recovered.csv" : undefined,
    );
    fireEvent.click(screen.getByRole("button", { name: t("save") }));
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith(
        "save_file_dialog",
        expect.objectContaining({ defaultName: "Recovered-saved.csv" }),
      ),
    );
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith(
        "write_file",
        expect.objectContaining({ path: "recovered.csv" }),
      ),
    );
  });
});

describe("named views through the workspace", () => {
  it("saves, reapplies and isolates explicit presets without mutating rows or leaking to same-name reopened documents", async () => {
    await load();
    exclude(1, "B");
    const open = () => fireEvent.click(screen.getByRole("button", { name: /Named views/ }));
    const dialog = () =>
      screen.getByRole("dialog", { name: /Named filter views|名前付きフィルタ表示/ });
    const close = () =>
      fireEvent.click(within(dialog()).getByRole("button", { name: /^(Close|閉じる)$/ }));
    open();
    expect(within(dialog()).getByRole("status")).toHaveTextContent("2 / 3");
    fireEvent.change(
      within(dialog()).getByRole("textbox", { name: /New view name|新しい表示名/ }),
      { target: { value: "Only A" } },
    );
    fireEvent.click(
      within(dialog()).getByRole("button", {
        name: /Save current as new view|現在の表示を新規保存/,
      }),
    );
    expect(localStorage.getItem("plainsheet.namedViews.v1")).toBeNull();
    fireEvent.click(
      within(dialog()).getByRole("checkbox", {
        name: /Keep this document|この文書の表示を端末に保存/,
      }),
    );
    expect(localStorage.getItem("plainsheet.namedViews.v1")).toContain("Only A");
    close();
    clean();
    fireEvent.click(screen.getByRole("button", { name: t("filterAll") }));
    expect(cell(2, 0)).toBe("hidden");
    open();
    fireEvent.click(within(dialog()).getByRole("button", { name: /^(Apply|適用) Only A$/ }));
    close();
    expect(cell(2, 0)).toBe("9007199254740993");
    clean();
    const first = screen.getByRole("tab", { selected: true });
    fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
    open();
    expect(
      within(dialog()).queryByRole("button", { name: /^(Apply|適用) Only A$/ }),
    ).not.toBeInTheDocument();
    close();
    fireEvent.click(first);
    expect(cell(2, 0)).toBe("9007199254740993");
    clean();
    cleanup();
    await load();
    expect(cell(2, 0)).toBe("hidden");
    open();
    expect(
      within(dialog()).queryByRole("button", { name: /^(Apply|適用) Only A$/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(dialog()).getByRole("button", {
        name: /Choose a previously saved document|以前に保存した文書を選ぶ/,
      }),
    );
    const groups = within(dialog()).getByRole("combobox", {
      name: /Saved document group|保存文書のグループ/,
    });
    const group = within(groups)
      .getAllByRole("option")
      .find((option) => (option as HTMLOptionElement).value)! as HTMLOptionElement;
    fireEvent.change(groups, { target: { value: group.value } });
    fireEvent.click(
      within(dialog()).getByRole("checkbox", { name: /intended document|対象の文書と/ }),
    );
    fireEvent.click(
      within(dialog()).getByRole("button", {
        name: /Import reviewed views|確認した表示を取り込む/,
      }),
    );
    expect(cell(2, 0)).toBe("hidden");
    fireEvent.click(within(dialog()).getByRole("button", { name: /^(Apply|適用) Only A$/ }));
    close();
    expect(cell(2, 0)).toBe("9007199254740993");
    clean();
  });
});

const nativeFetch = globalThis.fetch.bind(globalThis);
const sharingOrigin = "http://localhost:1420";
let relay: ReturnType<typeof createCollaborationRelay> | undefined;
const peers: CollaborationClient[] = [];
async function connectSyntheticRelay() {
  relay = createCollaborationRelay({ allowedOrigins: [sharingOrigin] });
  await new Promise<void>((resolve) => relay!.server.listen(0, "127.0.0.1", resolve));
  const endpoint = `http://127.0.0.1:${(relay.server.address() as AddressInfo).port}`;
  // Bridge jsdom's AbortSignal realm to Node fetch and supply the browser Origin.
  // The bytes still travel over a real lifecycle-managed loopback HTTP socket.
  vi.mocked(fetch).mockImplementation((input, init) =>
    nativeFetch(input, {
      ...init,
      signal: undefined,
      headers: { ...init?.headers, Origin: sharingOrigin },
    }),
  );
  return endpoint;
}
const sharingDialog = () => screen.getByRole("dialog", { name: "Share this table" });
const openSharing = () => fireEvent.click(screen.getByRole("button", { name: /Sharing:/ }));
const closeSharing = () =>
  fireEvent.click(within(sharingDialog()).getByRole("button", { name: /^Close$/ }));

describe("sharing UI connected to central App mutations and real HTTP", () => {
  afterEach(async () => {
    cleanup();
    peers.splice(0).forEach((peer) => peer.dispose());
    if (relay) {
      relay.server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        relay!.server.close((error) => (error ? reject(error) : resolve())),
      );
      relay = undefined;
    }
  });

  it("starts OFF, uploads only after explicit consent, syncs raw edits and structural formulas, and undoes through the provider", async () => {
    await load("number,result\n2,=A2*2");
    const endpoint = await connectSyntheticRelay();
    expect(fetch).toHaveBeenCalledTimes(1);
    fireEvent.click(calculation());
    openSharing();
    expect(within(sharingDialog()).getByRole("textbox", { name: "Relay endpoint" })).toHaveValue(
      "",
    );
    expect(within(sharingDialog()).getByRole("button", { name: "Start sharing" })).toBeDisabled();
    fireEvent.change(within(sharingDialog()).getByRole("textbox", { name: "Relay endpoint" }), {
      target: { value: endpoint },
    });
    fireEvent.change(within(sharingDialog()).getByRole("textbox", { name: "Display name" }), {
      target: { value: "Synthetic owner" },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    fireEvent.click(within(sharingDialog()).getByRole("checkbox", { name: /I understand/ }));
    fireEvent.click(within(sharingDialog()).getByRole("button", { name: "Start sharing" }));
    await waitFor(() => expect(sharingDialog()).toHaveTextContent("Your permission: owner"));
    fireEvent.click(
      within(sharingDialog()).getByRole("button", { name: "Create editor invitation" }),
    );
    await waitFor(() =>
      expect(
        within(sharingDialog()).getByRole("textbox", { name: "Invitation token" }),
      ).toBeInTheDocument(),
    );
    const room = (
      within(sharingDialog()).getByRole("textbox", {
        name: "Invitation room ID",
      }) as HTMLInputElement
    ).value;
    const token = (
      within(sharingDialog()).getByRole("textbox", { name: "Invitation token" }) as HTMLInputElement
    ).value;
    const peer = new CollaborationClient({ endpoint, origin: sharingOrigin });
    peers.push(peer);
    await act(async () => {
      await peer.joinRoom(room, token, "Synthetic peer");
    });
    closeSharing();
    edit(1, 0, "5");
    expect(value(1, 1)).toBe("10");
    dirty();
    await waitFor(async () => {
      await peer.sync();
      expect(sharedDocumentRows(peer.getDocument()!)).toEqual([
        ["number", "result"],
        ["5", "=A2*2"],
      ]);
    });
    expect(peer.getState().snapshot!.history).toHaveLength(1);
    // The established toolbar action inserts AFTER the selected row. Selecting
    // header row 0 inserts at source index 1 and moves =A2*2 to =A3*2.
    select(0, 0);
    fireEvent.click(screen.getByRole("button", { name: t("insertRow") }));
    expect(cell(2, 1)).toBe("=A3*2");
    expect(value(2, 1)).toBe("10");
    await waitFor(async () => {
      await peer.sync();
      expect(peer.getState().snapshot!.history).toHaveLength(2);
    });
    expect(sharedDocumentRows(peer.getDocument()!)).toEqual([
      ["number", "result"],
      ["", ""],
      ["5", "=A3*2"],
    ]);
    undo();
    await waitFor(() => expect(cell(1, 1)).toBe("=A2*2"));
    await act(async () => {
      await peer.sync();
    });
    expect(peer.getState().snapshot!.history.at(-1)?.undoOf).toBeTruthy();
    await act(async () => {
      const document = peer.getDocument()!;
      await peer.submit([
        {
          type: "set-cell",
          rowId: activeIds(document, "row")[1],
          columnId: activeIds(document, "column")[0],
          value: "7",
        },
      ]);
    });
    openSharing();
    fireEvent.click(within(sharingDialog()).getByRole("button", { name: "Refresh room" }));
    await waitFor(() => expect(value(1, 1)).toBe("14"));
    closeSharing();
    expect(cell(1, 1)).toBe("=A2*2");
    expect(localStorage.getItem("plainsheet.recovery.v1")).toBeNull();
  });

  it("joins a viewer as a fresh document, rejects local mutation routes, and preserves the original local tab", async () => {
    await load("local,only\n00123,keep");
    const first = screen.getByRole("tab", { selected: true });
    const endpoint = await connectSyntheticRelay();
    const owner = new CollaborationClient({ endpoint, origin: sharingOrigin });
    peers.push(owner);
    const room = await owner.createRoom(
      [
        ["shared", "raw"],
        ["2", "=A2*2"],
      ],
      "Owner",
    );
    const invitation = await owner.invite("viewer");
    openSharing();
    fireEvent.change(within(sharingDialog()).getByRole("textbox", { name: "Relay endpoint" }), {
      target: { value: endpoint },
    });
    fireEvent.change(within(sharingDialog()).getByRole("textbox", { name: "Display name" }), {
      target: { value: "Synthetic viewer" },
    });
    fireEvent.change(within(sharingDialog()).getByRole("combobox", { name: "Sharing action" }), {
      target: { value: "join" },
    });
    fireEvent.change(within(sharingDialog()).getByRole("textbox", { name: "Room ID" }), {
      target: { value: room.roomId },
    });
    fireEvent.change(within(sharingDialog()).getByLabelText("Single-use invitation token"), {
      target: { value: invitation.token },
    });
    fireEvent.click(within(sharingDialog()).getByRole("checkbox", { name: /I understand/ }));
    fireEvent.click(within(sharingDialog()).getByRole("button", { name: "Join room" }));
    await waitFor(() => expect(sharingDialog()).toHaveTextContent("Your permission: viewer"));
    closeSharing();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(calculation()).not.toBeChecked();
    expect(screen.getByRole("textbox", { name: t("formulaInput") })).toBeDisabled();
    expect(editor().getCellContent([0, 1])).toMatchObject({ readonly: true, allowOverlay: false });
    const before = matrix(2);
    select(1, 0);
    edit(1, 0, "forbidden");
    paste("forbidden\tedit");
    act(() => editor().onDelete?.(editor().gridSelection!));
    expect(matrix(2)).toEqual(before);
    await owner.sync();
    expect(owner.getState().snapshot!.history).toHaveLength(0);
    fireEvent.click(first);
    expect(matrix(2)).toEqual([
      ["local", "only"],
      ["00123", "keep"],
    ]);
    clean();
    expect(screen.getByRole("button", { name: /Sharing: OFF/ })).toBeInTheDocument();
    edit(1, 0, "local edit");
    expect(cell(1, 0)).toBe("local edit");
    await owner.sync();
    expect(sharedDocumentRows(owner.getDocument()!)).toEqual(before);
  });
});
