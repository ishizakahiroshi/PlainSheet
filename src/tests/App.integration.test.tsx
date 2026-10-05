import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import App from "../App";
import type { GlideSheet } from "../components/GlideSheet";
import { t } from "../lib/i18n";

type GridProps = ComponentProps<typeof GlideSheet>;
const holder = vi.hoisted(() => ({ grid: null as unknown }));
vi.mock("../components/GlideSheet", () => ({
  GlideSheet: (props: GridProps) => {
    holder.grid = props;
    return <div data-testid="grid" />;
  },
}));
vi.mock("@tauri-apps/api/event", () => ({ listen: vi.fn().mockResolvedValue(() => undefined) }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
const sample = "name,group\n00123,A\nhidden,B\n9007199254740993,A";
const grid = () => holder.grid as GridProps;
let downloaded: Blob | null;
let writeClipboard: ReturnType<typeof vi.fn>;
let readClipboard: ReturnType<typeof vi.fn>;
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
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => sample }));
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn((blob: Blob) => {
      downloaded = blob;
      return "blob:test";
    }),
  });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  vi.spyOn(window, "confirm").mockReturnValue(true);
  writeClipboard = vi.fn().mockResolvedValue(undefined);
  readClipboard = vi.fn().mockResolvedValue("paste");
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: writeClipboard, readText: readClipboard },
  });
  downloaded = null;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function load() {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: t("openSample") }));
  await waitFor(() => expect(grid().rows).toHaveLength(4));
}
const blobText = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsText(blob);
  });

describe("production App wiring with a mocked canvas surface", () => {
  it("commits a pending formula edit before Ctrl+S serialization and preserves edits when clicking the active tab", async () => {
    await load();
    act(() => grid().onSelectionChange({ row: 1, col: 0 }, null));
    const input = screen.getByRole("textbox", { name: t("formulaInput") });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "日本語 changed" } });
    fireEvent.keyDown(input, { key: "s", ctrlKey: true });
    await waitFor(() => expect(downloaded).not.toBeNull());
    expect(await blobText(downloaded!)).toContain("日本語 changed,A");
    expect(await blobText(downloaded!)).toContain("hidden,B");
    expect(grid().rows[1][0]).toBe("日本語 changed");
    fireEvent.change(input, { target: { value: "second" } });
    fireEvent.click(screen.getByRole("tab", { selected: true }));
    expect(grid().rows[1][0]).toBe("second");
  });
  it("keeps a 2×2 range for context Copy/Clear and restores the whole change with one Undo", async () => {
    await load();
    const range = { startRow: 1, startCol: 0, endRow: 2, endCol: 1 };
    act(() => grid().onSelectionChange({ row: 1, col: 0 }, range));
    act(() => grid().onOpenContextMenu("cell", 1, 1, 0, 0));
    fireEvent.click(screen.getByRole("menuitem", { name: new RegExp(t("copy")) }));
    await waitFor(() => expect(writeClipboard).toHaveBeenCalledWith("00123\tA\nhidden\tB"));
    act(() => grid().onOpenContextMenu("cell", 1, 1, 0, 0));
    fireEvent.click(screen.getByRole("menuitem", { name: new RegExp(t("clearCells")) }));
    expect(grid().rows.slice(1, 3)).toEqual([
      ["", ""],
      ["", ""],
    ]);
    fireEvent.click(screen.getByRole("button", { name: t("undo") }));
    expect(grid().rows.slice(1, 3)).toEqual([
      ["00123", "A"],
      ["hidden", "B"],
    ]);
    expect(screen.getByRole("button", { name: t("undo") })).toBeDisabled();
  });
  it("aborts a clipboard paste if the user switches to a new tab while permission is pending", async () => {
    await load();
    let resolve!: (value: string) => void;
    readClipboard.mockReturnValue(
      new Promise<string>((done) => {
        resolve = done;
      }),
    );
    act(() => grid().onOpenContextMenu("cell", 1, 0, 0, 0));
    fireEvent.click(screen.getByRole("menuitem", { name: new RegExp(t("paste")) }));
    fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
    await act(async () => {
      resolve("wrong tab data");
    });
    expect(grid().rows).toEqual([[""]]);
    expect(screen.getByText(t("clipboardContextChanged"))).toBeInTheDocument();
  });
  it("warns on unload while a clean file has an uncommitted draft, including composition", async () => {
    await load();
    act(() => grid().onSelectionChange({ row: 1, col: 0 }, null));
    const input = screen.getByRole("textbox", { name: t("formulaInput") });
    fireEvent.focus(input);
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "未確定" } });
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(grid().rows[1][0]).toBe("00123");
  });
  it("keeps a pending value in a pristine starter when New creates the next tab", async () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: t("newSheet") })[0]);
    const input = screen.getByRole("textbox", { name: t("formulaInput") });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "keep me" } });
    fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(grid().rows).toEqual([[""]]);
    fireEvent.click(screen.getAllByRole("tab")[0]);
    expect(grid().rows).toEqual([["keep me"]]);
  });
  it("preserves a backwards range anchor through a tab round trip and rejects stale canvas writes", async () => {
    await load();
    const selected = { row: 2, col: 1 };
    const range = { startRow: 0, startCol: 0, endRow: 2, endCol: 1 };
    act(() => grid().onSelectionChange(selected, range));
    const oldPaste = grid().onPasteGrid;
    const oldFill = grid().onFill;
    fireEvent.click(screen.getByRole("button", { name: t("newTab") }));
    act(() => {
      oldPaste(0, 0, [["stale"]]);
      oldFill?.([{ row: 0, col: 0, value: "stale" }]);
    });
    expect(grid().rows).toEqual([[""]]);
    fireEvent.click(screen.getAllByRole("tab")[0]);
    expect(grid().selection).toEqual(selected);
    expect(grid().range).toEqual(range);
  });
  it("filters nonadjacent rows, protects hidden data for paste/search/replace, and clears from an explicit control", async () => {
    await load();
    act(() => grid().onHeaderMenuClick?.(1, { x: 0, y: 0, width: 50, height: 30 }));
    fireEvent.click(screen.getByRole("menuitem", { name: t("filter") }));
    fireEvent.click(screen.getByRole("checkbox", { name: /B/ }));
    fireEvent.click(screen.getByRole("button", { name: t("filterApply") }));
    expect(grid().rowSourceIndexes).toEqual([0, 1, 3]);
    act(() => grid().onPasteGrid(1, 0, [["first"], ["second"]]));
    expect(grid().rows.map((row) => row[0])).toEqual(["name", "first", "second"]);
    fireEvent.click(screen.getByRole("button", { name: t("search") }));
    fireEvent.change(screen.getByRole("textbox", { name: t("findPlaceholder") }), {
      target: { value: "hidden" },
    });
    expect(screen.getByRole("button", { name: t("replaceAll") })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: t("filterAll") }));
    expect(grid().rows.map((row) => row[0])).toEqual(["name", "first", "hidden", "second"]);
    fireEvent.click(screen.getByRole("button", { name: t("undo") }));
    expect(grid().rows.map((row) => row[0])).toEqual([
      "name",
      "00123",
      "hidden",
      "9007199254740993",
    ]);
  });
});
