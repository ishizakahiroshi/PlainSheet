import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type { AddressInfo } from "node:net";
import { CompactSelection, GridCellKind, type DataEditor } from "@glideapps/glide-data-grid";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { createCollaborationRelay } from "../../server/relay";
import {
  activeIds,
  cellKey,
  CollaborationClient,
  sharedDocumentRows,
  type Axis,
  type CollaborationAction,
} from "../lib/collaboration";
import App from "../App";
import { t } from "../lib/i18n";

// FC-01/02/04 regressions execute the production App, editors, hooks, client and
// provider over lifecycle-managed loopback HTTP. Only native I/O and the canvas
// renderer are mocked. These are not native, real-canvas or separate-device QA.
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

const nativeFetch = globalThis.fetch.bind(globalThis);
const origin = "http://localhost:1420";
let relay: ReturnType<typeof createCollaborationRelay> | undefined;
let endpoint = "";
let sample = "first,A\nsecond,B";
const peers: CollaborationClient[] = [];
const gates: (() => void)[] = [];
const editor = () => capture.props as EditorProps;
const cell = (row: number, col: number) => {
  const value = editor().getCellContent([col, row]);
  if (value.kind !== GridCellKind.Text) throw new Error("Expected a text cell");
  return value.data;
};
const matrix = (rows: number, cols = 2) =>
  Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => cell(row, col)),
  );
const select = (row: number, col: number) =>
  act(() => {
    editor().onGridSelectionChange?.({
      rows: CompactSelection.empty(),
      columns: CompactSelection.empty(),
      current: { cell: [col, row], range: { x: col, y: row, width: 1, height: 1 }, rangeStack: [] },
    });
  });
const edit = (row: number, col: number, data: string) =>
  act(() => {
    editor().onCellsEdited?.([
      {
        location: [col, row],
        value: { kind: GridCellKind.Text, data, displayData: data, allowOverlay: true },
      },
    ]);
  });
const clean = () =>
  expect(screen.getByRole("tab", { selected: true })).not.toHaveAccessibleName(
    new RegExp(t("unsaved")),
  );
const sharingDialog = () => screen.getByRole("dialog", { name: "Share this table" });
const openSharing = () => fireEvent.click(screen.getByRole("button", { name: /Sharing:/ }));
const closeSharing = () =>
  fireEvent.click(within(sharingDialog()).getByRole("button", { name: /^Close$/ }));
const closeDialog = () => screen.getByRole("dialog", { name: /Save before closing/ });
const unload = () => {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
};
const newTab = () => fireEvent.click(screen.getByRole("button", { name: t("newTab") }));

beforeEach(async () => {
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
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(""),
    },
  });
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:sharing-corrections"),
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
  sample = "first,A\nsecond,B";
  relay = createCollaborationRelay({ allowedOrigins: [origin] });
  await new Promise<void>((resolve) => relay!.server.listen(0, "127.0.0.1", resolve));
  endpoint = `http://127.0.0.1:${(relay.server.address() as AddressInfo).port}`;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input, init) => {
      if (String(input).endsWith("sample.csv"))
        return { ok: true, text: async () => sample } as Response;
      if (!String(input).startsWith(`${endpoint}/`))
        throw new Error(`Unexpected non-loopback request: ${String(input)}`);
      // Bridge jsdom's AbortSignal realm while retaining real HTTP and Origin checks.
      return nativeFetch(input, {
        ...init,
        signal: undefined,
        headers: { ...init?.headers, Origin: origin },
      });
    }),
  );
});
afterEach(async () => {
  cleanup(); // Unmount first so production subscriptions and polling are disposed.
  gates.splice(0).forEach((release) => release());
  peers.splice(0).forEach((peer) => peer.dispose());
  if (relay) {
    relay.server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      relay!.server.close((error) => (error ? reject(error) : resolve())),
    );
    relay = undefined;
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function load(content = sample, nativeMode = false) {
  sample = content;
  if (nativeMode)
    Object.defineProperty(window, "__TAURI_INTERNALS__", { configurable: true, value: {} });
  render(<App />);
  await loadSample();
}
async function loadSample(content = sample) {
  sample = content;
  fireEvent.click(screen.getByRole("button", { name: t("openSample") }));
  await waitFor(() =>
    expect(screen.getByRole("tab", { selected: true })).toHaveAccessibleName("sample.csv"),
  );
}
function beginSharing() {
  openSharing();
  fireEvent.change(within(sharingDialog()).getByRole("textbox", { name: "Relay endpoint" }), {
    target: { value: endpoint },
  });
  fireEvent.change(within(sharingDialog()).getByRole("textbox", { name: "Display name" }), {
    target: { value: "Synthetic owner" },
  });
  fireEvent.click(within(sharingDialog()).getByRole("checkbox", { name: /I understand/ }));
  fireEvent.click(within(sharingDialog()).getByRole("button", { name: "Start sharing" }));
}
async function invitePeer() {
  fireEvent.click(
    within(sharingDialog()).getByRole("button", { name: "Create editor invitation" }),
  );
  await waitFor(() =>
    expect(
      within(sharingDialog()).getByRole("textbox", { name: "Invitation token" }),
    ).toBeInTheDocument(),
  );
  const room = (
    within(sharingDialog()).getByRole("textbox", { name: "Invitation room ID" }) as HTMLInputElement
  ).value;
  const token = (
    within(sharingDialog()).getByRole("textbox", { name: "Invitation token" }) as HTMLInputElement
  ).value;
  const peer = new CollaborationClient({ endpoint, origin });
  peers.push(peer);
  await act(async () => {
    await peer.joinRoom(room, token, "Synthetic peer");
  });
  return peer;
}
async function share() {
  beginSharing();
  await waitFor(() => expect(sharingDialog()).toHaveTextContent("Your permission: owner"));
  const peer = await invitePeer();
  closeSharing();
  return peer;
}
function delayResponse(path: string) {
  const original = vi.mocked(fetch).getMockImplementation()!;
  let release!: () => void;
  let arrived!: () => void;
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  const entered = new Promise<void>((resolve) => {
    arrived = resolve;
  });
  let used = false;
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const response = await original(input, init);
    if (!used && init?.method === "POST" && String(input).endsWith(path)) {
      used = true;
      arrived();
      await waiting;
    }
    return response;
  });
  gates.push(release);
  return { entered, release };
}
async function requestNativeClose() {
  const preventDefault = vi.fn();
  await waitFor(() => expect(native.handler).not.toBeNull());
  await act(async () => {
    await native.handler!({ preventDefault });
  });
  expect(preventDefault).toHaveBeenCalledOnce();
}
async function saveLocally() {
  fireEvent.click(screen.getByRole("button", { name: t("save") }));
  await waitFor(clean);
}
function disconnect() {
  openSharing();
  fireEvent.click(within(sharingDialog()).getByRole("button", { name: "Disconnect" }));
  closeSharing();
}

// Session identity is consent scope: another document must never inherit it.
describe("FC-01: blank starter sharing cannot leak a subsequently opened document", () => {
  it("opens a sample as a fresh unshared document and leaves the original room unchanged after edits and refresh", async () => {
    render(<App />);
    const peer = await share();
    const originalTab = screen.getByRole("tab", { selected: true });
    const originalDocument = peer.getDocument()!;
    await loadSample("private,not-shared\nsecret,do-not-upload");
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tab", { selected: true })).not.toBe(originalTab);
    expect(screen.getByRole("button", { name: /Sharing: OFF/ })).toBeInTheDocument();
    edit(1, 0, "secret-changed");
    await act(async () => {
      await peer.sync();
    });
    expect(peer.getDocument()).toEqual(originalDocument);
    expect(matrix(2)).toEqual([
      ["private", "not-shared"],
      ["secret-changed", "do-not-upload"],
    ]);
    fireEvent.click(originalTab);
    openSharing();
    fireEvent.click(within(sharingDialog()).getByRole("button", { name: "Refresh room" }));
    await waitFor(() => expect(sharingDialog()).toHaveTextContent("Your permission: owner"));
    closeSharing();
    expect(screen.queryByTestId("canvas-proxy")).not.toBeInTheDocument();
    await act(async () => {
      await peer.sync();
    });
    expect(sharedDocumentRows(peer.getDocument()!)).toEqual([]);
    expect(peer.getState().snapshot!.history).toHaveLength(0);
  });

  it("native Open and import preview create a fresh unshared document from a shared blank starter", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", { configurable: true, value: {} });
    render(<App />);
    const peer = await share();
    const oldTab = screen.getByRole("tab", { selected: true });
    vi.mocked(invoke).mockImplementation(async (command) => {
      if (command === "open_file_dialog") return "/synthetic/private.csv";
      if (command === "read_file_bytes")
        return [...new TextEncoder().encode("private,not-shared\nsecret,do-not-upload")];
      return undefined;
    });
    fireEvent.click(screen.getAllByRole("button", { name: t("open") })[0]);
    const preview = await screen.findByRole("dialog", { name: /Import preview|読込みプレビュー/ });
    fireEvent.click(
      within(preview).getByRole("button", { name: /Open this preview|この内容で開く/ }),
    );
    await waitFor(() =>
      expect(screen.getByRole("tab", { selected: true })).toHaveAccessibleName(/private.csv/),
    );
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tab", { selected: true })).not.toBe(oldTab);
    expect(screen.getByRole("button", { name: /Sharing: OFF/ })).toBeInTheDocument();
    edit(1, 0, "still-local");
    await act(async () => {
      await peer.sync();
    });
    expect(sharedDocumentRows(peer.getDocument()!)).toEqual([]);
    expect(peer.getState().snapshot!.history).toHaveLength(0);
    expect(matrix(2)).toEqual([
      ["private", "not-shared"],
      ["still-local", "do-not-upload"],
    ]);
  });

  it("New from a shared blank starter creates an independent unshared tab", async () => {
    render(<App />);
    const peer = await share();
    const oldTab = screen.getByRole("tab", { selected: true });
    newTab();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tab", { selected: true })).not.toBe(oldTab);
    expect(screen.getByRole("button", { name: /Sharing: OFF/ })).toBeInTheDocument();
    edit(0, 0, "local-only");
    await act(async () => {
      await peer.sync();
    });
    expect(sharedDocumentRows(peer.getDocument()!)).toEqual([]);
    fireEvent.click(oldTab);
    expect(screen.queryByTestId("canvas-proxy")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sharing: online/ })).toBeInTheDocument();
  });

  it("does not reuse or attach a new file to a blank document whose create response is still pending", async () => {
    render(<App />);
    const originalTab = screen.getByRole("tab", { selected: true });
    const delayed = delayResponse("/rooms");
    beginSharing();
    await delayed.entered;
    // Native file events can arrive during a modal request; invoke the ordinary
    // production load command without first resolving the sharing request.
    await loadSample("private,not-shared\nsecret,do-not-upload");
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    await act(async () => {
      delayed.release();
    });
    await waitFor(() =>
      expect(screen.queryByText("Sharing request in progress…")).not.toBeInTheDocument(),
    );
    if (screen.queryByRole("dialog", { name: "Share this table" })) closeSharing();
    expect(screen.getByRole("button", { name: /Sharing: OFF/ })).toBeInTheDocument();
    const newDocumentTab = screen.getByRole("tab", { selected: true });
    edit(1, 0, "secret-changed");
    fireEvent.click(originalTab);
    openSharing();
    await waitFor(() => expect(sharingDialog()).toHaveTextContent("Your permission: owner"));
    const peer = await invitePeer();
    closeSharing();
    expect(sharedDocumentRows(peer.getDocument()!)).toEqual([]);
    expect(peer.getState().snapshot!.history).toHaveLength(0);
    fireEvent.click(newDocumentTab);
    expect(matrix(2)).toEqual([
      ["private", "not-shared"],
      ["secret-changed", "do-not-upload"],
    ]);
  });
});

const source = "r0c0,r0c1,r0c2\nr1c0,r1c1,r1c2\nr2c0,r2c1,r2c2";
const axes: Axis[] = ["row", "column"];
describe("FC-02: formula drafts retain their original stable cell identity", () => {
  it.each(
    axes.flatMap((axis) =>
      ["insert", "delete-before", "reorder"].map((change) => ({ axis, change })),
    ),
  )(
    "commits to the original target after a peer $axis $change without changing a neighbor",
    async ({ axis, change }) => {
      await load(source);
      const peer = await share();
      const before = peer.getDocument()!;
      const rowId = activeIds(before, "row")[2];
      const columnId = activeIds(before, "column")[2];
      select(2, 2);
      const input = screen.getByRole("textbox", { name: t("formulaInput") });
      act(() => input.focus());
      fireEvent.change(input, { target: { value: "edited-original-target" } });
      const ids = activeIds(before, axis);
      const action: CollaborationAction =
        change === "insert"
          ? { type: "insert", axis, id: `peer-${axis}-insert`, afterId: null }
          : change === "delete-before"
            ? { type: "delete", axis, id: ids[0] }
            : { type: "reorder", axis, ids: [ids[2], ids[0], ids[1]] };
      await act(async () => {
        await peer.submit([action]);
      });
      const changed = peer.getDocument()!;
      const row = activeIds(changed, "row").indexOf(rowId);
      const col = activeIds(changed, "column").indexOf(columnId);
      const expected = sharedDocumentRows(changed);
      await waitFor(() => expect(matrix(expected.length, expected[0].length)).toEqual(expected), {
        timeout: 4000,
      });
      expect(input).toHaveValue("edited-original-target");
      fireEvent.keyDown(input, { key: "Enter" });
      expected[row][col] = "edited-original-target";
      await waitFor(async () => {
        await peer.sync();
        expect(sharedDocumentRows(peer.getDocument()!)).toEqual(expected);
      });
      expect(peer.getDocument()!.cells[cellKey(rowId, columnId)].value).toBe(
        "edited-original-target",
      );
      expect(peer.getState().snapshot!.history).toHaveLength(2);
    },
  );

  it("keeps the source-row identity through a filtered view and a peer reorder", async () => {
    await load("name,group\nkeep,A\nhidden,B\ntarget,A");
    const peer = await share();
    const ids = activeIds(peer.getDocument()!, "row");
    act(() => editor().onHeaderMenuClick?.(1, { x: 0, y: 0, width: 50, height: 30 }));
    fireEvent.click(screen.getByRole("menuitem", { name: t("filter") }));
    fireEvent.click(screen.getByRole("checkbox", { name: /B/ }));
    fireEvent.click(screen.getByRole("button", { name: t("filterApply") }));
    expect(matrix(3)).toEqual([
      ["name", "group"],
      ["keep", "A"],
      ["target", "A"],
    ]);
    select(2, 0); // Visible row 2 is stable source row 3.
    const input = screen.getByRole("textbox", { name: t("formulaInput") });
    act(() => input.focus());
    fireEvent.change(input, { target: { value: "edited filtered target" } });
    await act(async () => {
      await peer.submit([{ type: "reorder", axis: "row", ids: [ids[0], ids[3], ids[1], ids[2]] }]);
    });
    await waitFor(() => expect(cell(1, 0)).toBe("target"), { timeout: 4000 });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(async () => {
      await peer.sync();
      expect(sharedDocumentRows(peer.getDocument()!)).toEqual([
        ["name", "group"],
        ["edited filtered target", "A"],
        ["keep", "A"],
        ["hidden", "B"],
      ]);
    });
  });

  it("keeps a distant name-box target through remote insertion and IME composition", async () => {
    const rows = Array.from({ length: 121 }, (_, index) => [`row-${index}`, `value-${index}`]);
    await load(rows.map((row) => row.join(",")).join("\n"));
    const peer = await share();
    const rowId = activeIds(peer.getDocument()!, "row")[100];
    const columnId = activeIds(peer.getDocument()!, "column")[1];
    const nameBox = screen.getByRole("textbox", { name: t("nameBox") });
    fireEvent.change(nameBox, { target: { value: "B101" } });
    fireEvent.keyDown(nameBox, { key: "Enter" });
    const input = screen.getByRole("textbox", { name: t("formulaInput") });
    expect(input).toHaveValue("value-100");
    act(() => input.focus());
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "遠いセルの編集中" } });
    await act(async () => {
      await peer.submit([
        { type: "insert", axis: "row", id: "peer-before-distant", afterId: null },
      ]);
    });
    await waitFor(() => expect(cell(101, 1)).toBe("value-100"), { timeout: 4000 });
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229, isComposing: true });
    await peer.sync();
    expect(peer.getDocument()!.cells[cellKey(rowId, columnId)].value).toBe("value-100");
    expect(input).toHaveValue("遠いセルの編集中");
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: "Enter" });
    const expected = [["", ""], ...rows];
    expected[101][1] = "遠いセルの編集中";
    await waitFor(async () => {
      await peer.sync();
      expect(sharedDocumentRows(peer.getDocument()!)).toEqual(expected);
    });
    expect(peer.getState().snapshot!.history).toHaveLength(2);
  });

  it.each(axes)(
    "retains a draft when its %s was deleted and never writes into the replacement coordinate",
    async (axis) => {
      await load(source);
      const peer = await share();
      select(1, 1);
      const input = screen.getByRole("textbox", { name: t("formulaInput") });
      act(() => input.focus());
      fireEvent.change(input, { target: { value: "keep this unresolved draft" } });
      await act(async () => {
        await peer.submit([{ type: "delete", axis, id: activeIds(peer.getDocument()!, axis)[1] }]);
      });
      const expected = sharedDocumentRows(peer.getDocument()!);
      await waitFor(() => expect(matrix(expected.length, expected[0].length)).toEqual(expected), {
        timeout: 4000,
      });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(input).toHaveValue("keep this unresolved draft");
      expect(screen.getByText(/Edited cell was deleted/)).toBeVisible();
      await act(async () => {
        await peer.sync();
      });
      expect(sharedDocumentRows(peer.getDocument()!)).toEqual(expected);
      expect(peer.getState().snapshot!.history).toHaveLength(1);
    },
  );
});

describe("FC-04: a successful local save cannot discard unsent sharing work", () => {
  it.each([false, true])(
    "guards browser and native close with a saved offline queue (inactive document: %s), including cancel and save-close",
    async (inactive) => {
      await load(undefined, true);
      const peer = await share();
      disconnect();
      edit(1, 0, "offline edit");
      expect(screen.getByText(/pending=1/)).toBeInTheDocument();
      await saveLocally();
      if (inactive) newTab();
      clean();
      expect(unload().defaultPrevented).toBe(true);
      await requestNativeClose();
      expect(native.destroy).not.toHaveBeenCalled();
      expect(within(closeDialog()).getByRole("alert")).toHaveTextContent(/未送信|pending|unsent/i);
      fireEvent.click(within(closeDialog()).getByRole("button", { name: /Back/ }));
      expect(screen.queryByRole("dialog", { name: /Save before closing/ })).not.toBeInTheDocument();
      expect(unload().defaultPrevented).toBe(true);
      await requestNativeClose();
      fireEvent.click(within(closeDialog()).getByRole("button", { name: /Save and close/ }));
      await waitFor(() =>
        expect(within(closeDialog()).getByRole("button", { name: /Save and close/ })).toBeEnabled(),
      );
      expect(native.destroy).not.toHaveBeenCalled();
      expect(unload().defaultPrevented).toBe(true);
      await act(async () => {
        await peer.sync();
      });
      expect(sharedDocumentRows(peer.getDocument()!)).toEqual([
        ["first", "A"],
        ["second", "B"],
      ]);
      fireEvent.click(within(closeDialog()).getByRole("button", { name: /Discard and close/ }));
      await waitFor(() => expect(native.destroy).toHaveBeenCalledOnce());
    },
  );

  it("titlebar close requires explicit abandonment even when the saved document is clean", async () => {
    await load(undefined, true);
    const peer = await share();
    disconnect();
    edit(1, 0, "offline edit");
    await saveLocally();
    fireEvent.click(screen.getByRole("button", { name: t("windowClose") }));
    expect(native.close).not.toHaveBeenCalled();
    expect(native.destroy).not.toHaveBeenCalled();
    expect(within(closeDialog()).getByRole("alert")).toHaveTextContent(/未送信|pending|unsent/i);
    fireEvent.click(within(closeDialog()).getByRole("button", { name: /Discard and close/ }));
    await waitFor(() => expect(native.destroy).toHaveBeenCalledOnce());
    await peer.sync();
    expect(sharedDocumentRows(peer.getDocument()!)[1][0]).toBe("second");
  });

  it("guards a locally saved in-flight operation until its real relay acknowledgement arrives", async () => {
    await load(undefined, true);
    const peer = await share();
    const delayed = delayResponse("/operations");
    edit(1, 0, "awaiting acknowledgement");
    await delayed.entered;
    await saveLocally();
    expect(screen.getByText(/pending=1/)).toBeInTheDocument();
    expect(unload().defaultPrevented).toBe(true);
    await requestNativeClose();
    expect(native.destroy).not.toHaveBeenCalled();
    fireEvent.click(within(closeDialog()).getByRole("button", { name: /Back/ }));
    await act(async () => {
      delayed.release();
    });
    await waitFor(() => expect(screen.getByText(/pending=0/)).toBeInTheDocument());
    clean();
    expect(unload().defaultPrevented).toBe(false);
    await requestNativeClose();
    expect(native.destroy).toHaveBeenCalledOnce();
    await peer.sync();
    expect(sharedDocumentRows(peer.getDocument()!)[1][0]).toBe("awaiting acknowledgement");
  });
});
