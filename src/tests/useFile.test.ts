import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFile } from "../hooks/useFile";
import { DEFAULT_META } from "../types/sheet";
import { t } from "../lib/i18n";

const mocks = vi.hoisted(() => ({ invoke: vi.fn(), listen: vi.fn() }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: mocks.invoke }));
vi.mock("@tauri-apps/api/event", () => ({ listen: mocks.listen }));
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};
function options() {
  const state = {
    id: "A",
    rows: [["00123", "日本語"]],
    meta: { ...DEFAULT_META, dirty: true, fileName: "same.csv", filePath: "/a/same.csv" },
  };
  const onSaved = vi.fn();
  return {
    state,
    onSaved,
    props: {
      getDocumentId: () => state.id,
      getRows: () => state.rows,
      getMeta: () => state.meta,
      loadData: vi.fn(),
      onSaved,
      onToast: vi.fn(),
      confirmDiscard: () => true,
    },
  };
}
beforeEach(() => {
  mocks.invoke.mockReset();
  mocks.listen.mockResolvedValue(() => undefined);
});
afterEach(() => {
  Reflect.deleteProperty(window, "__TAURI_INTERNALS__");
  vi.restoreAllMocks();
});

describe("production native save hook", () => {
  beforeEach(() =>
    Object.defineProperty(window, "__TAURI_INTERNALS__", { value: {}, configurable: true }),
  );
  it("captures document/rows before a deferred Save As dialog and never switches to another same-name tab", async () => {
    const dialog = deferred<string | null>();
    const write = deferred<void>();
    const { state, onSaved, props } = options();
    mocks.invoke.mockImplementation((command: string) =>
      command === "save_file_dialog" ? dialog.promise : write.promise,
    );
    const { result } = renderHook(() => useFile(props));
    let saving!: Promise<void>;
    act(() => {
      saving = result.current.saveAs();
    });
    state.id = "B";
    state.rows = [["other tab"]];
    state.meta = { ...state.meta, filePath: "/b/same.csv" };
    await act(async () => {
      dialog.resolve("/new/same.csv");
      await Promise.resolve();
    });
    expect(mocks.invoke).toHaveBeenCalledWith("write_file", {
      path: "/new/same.csv",
      content: "00123,日本語",
      encoding: "utf-8",
    });
    await act(async () => {
      write.resolve();
      await saving;
    });
    expect(onSaved.mock.calls[0][0]).toMatchObject({
      snapshot: { documentId: "A", rows: [["00123", "日本語"]] },
      patch: { filePath: "/new/same.csv" },
      method: "direct",
    });
  });
  it("does not patch metadata on cancellation or failure and retains an actionable notice", async () => {
    const { props, onSaved } = options();
    mocks.invoke.mockResolvedValueOnce(null);
    const { result } = renderHook(() => useFile(props));
    await act(async () => {
      await result.current.saveAs();
    });
    expect(onSaved).not.toHaveBeenCalled();
    expect(result.current.saveNotice).toBe(t("saveCancelled"));
    mocks.invoke.mockRejectedValueOnce("disk full");
    await act(async () => {
      await result.current.saveFile();
    });
    expect(onSaved).not.toHaveBeenCalled();
    expect(result.current.saveNotice).toBe(t("toastSaveFailed"));
  });
  it("does not issue a second write while the first is pending", async () => {
    const write = deferred<void>();
    mocks.invoke.mockReturnValue(write.promise);
    const { props } = options();
    const { result } = renderHook(() => useFile(props));
    let saving!: Promise<void>;
    act(() => {
      saving = result.current.saveFile();
    });
    await act(async () => {
      await result.current.saveFile();
    });
    expect(mocks.invoke).toHaveBeenCalledTimes(1);
    await act(async () => {
      write.resolve();
      await saving;
    });
  });
});

describe("browser download-only save", () => {
  it("never requests a writable picker/handle, and reports initiation rather than a file write", async () => {
    const { props, onSaved } = options();
    const picker = vi.fn();
    Object.defineProperty(window, "showSaveFilePicker", { value: picker, configurable: true });
    Object.defineProperty(URL, "createObjectURL", {
      value: vi.fn(() => "blob:test"),
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), configurable: true });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    const { result } = renderHook(() => useFile(props));
    await act(async () => {
      await result.current.saveFile();
    });
    expect(picker).not.toHaveBeenCalled();
    expect(click).toHaveBeenCalledOnce();
    expect(mocks.invoke).not.toHaveBeenCalled();
    expect(onSaved.mock.calls[0][0].method).toBe("download");
    expect(onSaved.mock.calls[0][0].patch).not.toHaveProperty("dirty", false);
    expect(result.current.saveNotice).toBe(t("browserDownloadNotice", { name: "same.csv" }));
    Reflect.deleteProperty(window, "showSaveFilePicker");
  });
  it("keeps cancelled Download As unchanged", async () => {
    const { props, onSaved } = options();
    vi.spyOn(window, "prompt").mockReturnValue(null);
    const { result } = renderHook(() => useFile(props));
    await act(async () => {
      await result.current.saveAs();
    });
    expect(onSaved).not.toHaveBeenCalled();
    expect(result.current.saveNotice).toBe(t("saveCancelled"));
  });
});
