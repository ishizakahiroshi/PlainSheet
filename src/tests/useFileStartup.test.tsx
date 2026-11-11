import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SheetMeta } from "../types/sheet";

const invoke = vi.fn();
const listeners = new Map<string, () => void>();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invoke(...args),
}));
vi.mock("@tauri-apps/api/event", () => ({
  listen: (event: string, handler: () => void) => {
    listeners.set(event, handler);
    return Promise.resolve(() => listeners.delete(event));
  },
}));

import { useFile } from "../hooks/useFile";

const STARTUP_PATH = "C:\\work\\data.csv";

function setup({ dirty = false, confirm = true, pending = [STARTUP_PATH] as (string | null)[] }) {
  const queue = [...pending];
  invoke.mockImplementation((command: string) => {
    if (command === "take_startup_file") {
      return Promise.resolve(queue.shift() ?? null);
    }
    if (command === "read_file") {
      return Promise.resolve({ content: "a,b\n1,2\n", encoding: "utf-8" });
    }
    return Promise.reject(new Error(`unexpected command ${command}`));
  });
  const loadData = vi.fn();
  const confirmDiscard = vi.fn(() => confirm);
  const onToast = vi.fn();
  renderHook(() =>
    useFile({
      loadData,
      updateMeta: vi.fn(),
      getRows: () => [],
      getMeta: () => ({ dirty }) as SheetMeta,
      onToast,
      confirmDiscard,
    }),
  );
  return { loadData, confirmDiscard, onToast };
}

const commands = () => invoke.mock.calls.map(([command]) => command);

describe("opening the file the app was started with", () => {
  beforeEach(() => {
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
  });
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
    invoke.mockReset();
    listeners.clear();
  });

  it("loads the file named at launch", async () => {
    const { loadData } = setup({});
    await waitFor(() => expect(loadData).toHaveBeenCalledTimes(1));
    expect(invoke).toHaveBeenCalledWith("read_file", { path: STARTUP_PATH });
    expect(loadData.mock.calls[0][1]).toMatchObject({
      filePath: STARTUP_PATH,
      fileName: "data.csv",
      format: "csv",
    });
  });

  it("stays empty when the app was started without a file", async () => {
    const { loadData, onToast } = setup({ pending: [] });
    await waitFor(() => expect(commands()).toContain("take_startup_file"));
    await Promise.resolve();
    expect(commands()).not.toContain("read_file");
    expect(loadData).not.toHaveBeenCalled();
    expect(onToast).not.toHaveBeenCalled();
  });

  it("keeps unsaved work when the user declines to discard it", async () => {
    const { loadData, confirmDiscard } = setup({ dirty: true, confirm: false });
    await waitFor(() => expect(confirmDiscard).toHaveBeenCalledTimes(1));
    expect(commands()).not.toContain("read_file");
    expect(loadData).not.toHaveBeenCalled();
  });

  it("loads a file delivered while the app is already running", async () => {
    const { loadData } = setup({ pending: [null, STARTUP_PATH] });
    await waitFor(() => expect(listeners.has("plainsheet://open-file")).toBe(true));
    expect(loadData).not.toHaveBeenCalled();
    listeners.get("plainsheet://open-file")?.();
    await waitFor(() => expect(loadData).toHaveBeenCalledTimes(1));
  });
});
