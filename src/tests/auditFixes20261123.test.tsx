// Regression tests for the issues found in the 2026-11-23 audit:
// F-01 / F-02 unsaved-change prompts on the desktop build, F-03 reopening a
// file that has unsaved edits in another tab, F-04 Markdown text around the
// table, F-05 non-UTF-8 files in the browser build, F-06 tab switches while a
// save is pending, F-07 fill handle overwriting its source cells.
import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GridCellKind, type DataEditorProps } from "@glideapps/glide-data-grid";
import App from "../App";
import { fillAlongAxis } from "../lib/autofill";
import { streamFileText, TextEncodingError } from "../lib/csv";
import { parseMarkdownLayout, parseTableText, serializeTableText } from "../lib/formats";
import { setLocale, t } from "../lib/i18n";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "../lib/settings";
import { useFile } from "../hooks/useFile";
import type { CellValue, SheetMeta } from "../types/sheet";

type CloseEvent = { preventDefault: () => void };

const harness = vi.hoisted(() => ({
  grid: null as DataEditorProps | null,
  files: new Map<string, string>(),
  openQueue: [] as string[],
  writes: [] as { path: string; content: string }[],
  writeGate: null as Promise<void> | null,
  closeHandler: null as ((event: CloseEvent) => Promise<void> | void) | null,
  ask: null as unknown as ReturnType<typeof vi.fn>,
}));

vi.mock("@glideapps/glide-data-grid", async (original) => {
  const actual = await original<typeof import("@glideapps/glide-data-grid")>();
  return {
    ...actual,
    DataEditor: React.forwardRef((props: DataEditorProps, ref) => {
      harness.grid = props;
      React.useImperativeHandle(ref, () => ({
        scrollTo: vi.fn(),
        getBounds: () => ({ x: 30, y: 30, width: 120, height: 28 }),
        focus: vi.fn(),
      }));
      return <button data-testid="canvas-boundary">Test canvas boundary</button>;
    }),
  };
});

vi.mock("@tauri-apps/api/core", () => ({
  invoke: async (command: string, args: Record<string, unknown> = {}) => {
    if (command === "take_startup_file") return null;
    if (command === "open_file_dialog") return harness.openQueue.shift() ?? null;
    if (command === "read_file") {
      const content = harness.files.get(args.path as string);
      if (content === undefined) throw new Error("missing file");
      return { content, encoding: "utf-8" };
    }
    if (command === "write_file") {
      if (harness.writeGate) await harness.writeGate;
      harness.writes.push({ path: args.path as string, content: args.content as string });
      harness.files.set(args.path as string, args.content as string);
      return null;
    }
    throw new Error(`unexpected command ${command}`);
  },
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: () => Promise.resolve(() => undefined),
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    onCloseRequested: (handler: (event: CloseEvent) => Promise<void> | void) => {
      harness.closeHandler = handler;
      return Promise.resolve(() => {
        harness.closeHandler = null;
      });
    },
    close: vi.fn(),
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
  }),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  ask: (...args: unknown[]) => harness.ask(...args),
}));

const A = "C:\\work\\a.csv";
const B = "C:\\work\\b.csv";
const grid = () => harness.grid!;
const cell = (col: number, row: number) => {
  const value = grid().getCellContent([col, row]);
  return value.kind === GridCellKind.Text ? value.data : "";
};
const edit = (col: number, row: number, data: string) =>
  act(() => {
    grid().onCellEdited!([col, row], {
      kind: GridCellKind.Text,
      data,
      displayData: data,
      allowOverlay: true,
    });
  });
const openPath = async (path: string) => {
  harness.openQueue.push(path);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open" })));
};
const tabNames = () => screen.getAllByRole("tab").map((tab) => tab.textContent);

beforeEach(() => {
  harness.grid = null;
  harness.files = new Map([
    [A, "id,name\n1,orig-a\n"],
    [B, "id,name\n2,orig-b\n"],
  ]);
  harness.openQueue = [];
  harness.writes = [];
  harness.writeGate = null;
  harness.closeHandler = null;
  harness.ask = vi.fn().mockResolvedValue(false);
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
  (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
  // What tauri-plugin-dialog's init script installs in the desktop webview:
  // an async window.confirm, whose Promise is always truthy.
  window.confirm = (async () => false) as unknown as typeof window.confirm;
});

afterEach(() => {
  cleanup();
  delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  vi.restoreAllMocks();
});

describe("desktop unsaved-change prompts (F-01, F-02)", () => {
  it("keeps a tab with unsaved edits open when the user answers No", async () => {
    render(<App />);
    await openPath(A);
    await edit(1, 1, "EDITED");
    harness.ask.mockResolvedValueOnce(true); // discard prompt when opening b.csv
    await openPath(B);
    expect(tabNames()).toEqual(["● a.csv", "b.csv"]);

    const tabA = screen.getByRole("tab", { name: /a\.csv/ });
    await act(async () => fireEvent.click(within(tabA).getByRole("button", { name: "Close tab" })));

    expect(harness.ask).toHaveBeenLastCalledWith(t("confirmCloseTab"), expect.anything());
    expect(tabNames()).toEqual(["● a.csv", "b.csv"]);
  });

  it("asks before the OS closes the window and keeps it open on No", async () => {
    render(<App />);
    await openPath(A);
    expect(harness.closeHandler).not.toBeNull();

    const clean = { preventDefault: vi.fn() };
    await act(async () => harness.closeHandler!(clean));
    expect(harness.ask).not.toHaveBeenCalled();
    expect(clean.preventDefault).not.toHaveBeenCalled();

    await edit(1, 1, "EDITED");
    const dirty = { preventDefault: vi.fn() };
    await act(async () => harness.closeHandler!(dirty));
    expect(harness.ask).toHaveBeenCalledWith(t("confirmUnsaved"), expect.anything());
    expect(dirty.preventDefault).toHaveBeenCalledTimes(1);

    harness.ask.mockResolvedValueOnce(true);
    const confirmed = { preventDefault: vi.fn() };
    await act(async () => harness.closeHandler!(confirmed));
    expect(confirmed.preventDefault).not.toHaveBeenCalled();
  });
});

describe("reopening a file that has unsaved edits in another tab (F-03)", () => {
  it("shows that tab instead of reloading it from disk", async () => {
    render(<App />);
    await openPath(A);
    await edit(1, 1, "EDITED");
    harness.ask.mockResolvedValueOnce(true);
    await openPath(B);
    expect(cell(1, 1)).toBe("orig-b");

    await openPath(A);

    expect(tabNames()).toEqual(["● a.csv", "b.csv"]);
    expect(cell(1, 1)).toBe("EDITED");
    expect(await screen.findByText(t("toastAlreadyOpenUnsaved"))).toBeInTheDocument();
  });
});

describe("tab switches while a save is pending (F-06)", () => {
  it("marks only the saved tab as saved", async () => {
    render(<App />);
    await openPath(A);
    await edit(1, 1, "EDITED-A");
    harness.ask.mockResolvedValueOnce(true);
    await openPath(B);
    await edit(1, 1, "EDITED-B");
    await act(async () => fireEvent.click(screen.getByRole("tab", { name: /a\.csv/ })));
    expect(tabNames()).toEqual(["● a.csv", "● b.csv"]);

    let release!: () => void;
    harness.writeGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save" })));
    await act(async () => fireEvent.click(screen.getByRole("tab", { name: /b\.csv/ })));
    await act(async () => {
      release();
      await harness.writeGate;
    });

    expect(harness.writes).toEqual([{ path: A, content: "id,name\n1,EDITED-A" }]);
    expect(tabNames()).toEqual(["a.csv", "● b.csv"]);
  });

  it("keeps the tab unsaved when it was edited while the write was pending", async () => {
    render(<App />);
    await openPath(A);
    await edit(1, 1, "FIRST");
    let release!: () => void;
    harness.writeGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save" })));
    await edit(1, 1, "SECOND");
    await act(async () => {
      release();
      await harness.writeGate;
    });
    expect(harness.writes[0]!.content).toBe("id,name\n1,FIRST");
    expect(tabNames()).toEqual(["● a.csv"]);
  });
});

describe("Markdown documents (F-04)", () => {
  const doc = [
    "# Title",
    "",
    "Intro with a pipe | in prose.",
    "",
    "| a | b |",
    "| :--- | ---: |",
    "| 1 | 2 |",
    "",
    "Footer.",
    "",
    "| x | y |",
    "| --- | --- |",
    "| 3 | 4 |",
    "",
  ].join("\n");

  it("writes an unedited document back unchanged", () => {
    const rows = parseTableText(doc, "markdown", ",");
    const layout = parseMarkdownLayout(doc);
    expect(serializeTableText(rows, "markdown", ",", "LF", { markdown: layout })).toBe(doc);
  });

  it("rewrites only the first table when a cell changes", () => {
    const rows = parseTableText(doc, "markdown", ",");
    rows[1]![1] = "20";
    const out = serializeTableText(rows, "markdown", ",", "LF", {
      markdown: parseMarkdownLayout(doc),
    });
    expect(out).toBe(doc.replace("| 1 | 2 |", "| 1 | 20 |"));
  });

  it("keeps CRLF documents and documents without a trailing newline", () => {
    const crlf = "Intro\r\n\r\n| a |\r\n| --- |\r\n| 1 |";
    const rows = parseTableText(crlf, "markdown", ",");
    expect(
      serializeTableText(rows, "markdown", ",", "CRLF", { markdown: parseMarkdownLayout(crlf) }),
    ).toBe(crlf);
  });

  it("keeps a document that has no table and appends a new table after it", () => {
    const prose = "# Notes\n\nNo table here.\n";
    const layout = parseMarkdownLayout(prose);
    expect(parseTableText(prose, "markdown", ",")).toEqual([]);
    expect(serializeTableText([], "markdown", ",", "LF", { markdown: layout })).toBe(prose);
    expect(serializeTableText([["h"], ["v"]], "markdown", ",", "LF", { markdown: layout })).toBe(
      "# Notes\n\nNo table here.\n\n| h |\n| --- |\n| v |\n",
    );
  });

  it("saves a .md opened in the desktop app without dropping its prose", async () => {
    const path = "C:\\work\\README.md";
    harness.files.set(path, doc);
    render(<App />);
    await openPath(path);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save" })));
    expect(harness.writes).toEqual([{ path, content: doc }]);
  });
});

describe("fill handle (F-07)", () => {
  it("continues the series past the source without touching the source", () => {
    expect(fillAlongAxis(["1", "2"], 5, 5, 4)).toEqual([
      { index: 7, value: "3" },
      { index: 8, value: "4" },
    ]);
  });

  it("counts backwards when dragged above the source", () => {
    expect(fillAlongAxis(["1", "2"], 5, 3, 4)).toEqual([
      { index: 3, value: "-1" },
      { index: 4, value: "0" },
    ]);
  });

  it("keeps the source cells when glide reports source plus extension", async () => {
    harness.files.set(A, "n\n1\n2\n");
    render(<App />);
    await openPath(A);
    await act(async () => {
      grid().onFillPattern!({
        patternSource: { x: 0, y: 1, width: 1, height: 2 },
        fillDestination: { x: 0, y: 1, width: 1, height: 4 },
        preventDefault: vi.fn(),
      });
    });
    expect([cell(0, 0), cell(0, 1), cell(0, 2), cell(0, 3), cell(0, 4)]).toEqual([
      "n",
      "1",
      "2",
      "3",
      "4",
    ]);
  });
});

describe("browser build reading non-UTF-8 files (F-05)", () => {
  // Shift_JIS for "東京,a\n1,2\n".
  const sjis = new Uint8Array([0x93, 0x8c, 0x8b, 0x9e, 0x2c, 0x61, 0x0a, 0x31, 0x2c, 0x32, 0x0a]);
  const fileOf = (bytes: Uint8Array, name: string) =>
    ({
      name,
      size: bytes.length,
      slice: (start?: number, end?: number) => new Blob([bytes.slice(start, end)]),
      // A browser's File.text() decodes leniently (invalid bytes become U+FFFD).
      text: async () => new TextDecoder("utf-8").decode(bytes),
      arrayBuffer: async () => bytes.slice().buffer,
    }) as unknown as File;

  const openInBrowser = async (file: File) => {
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
    const handle = { name: file.name, getFile: async () => file, createWritable: vi.fn() };
    (window as unknown as Record<string, unknown>).showOpenFilePicker = vi
      .fn()
      .mockResolvedValue([handle]);
    const loadData = vi.fn();
    const onToast = vi.fn();
    const { result } = renderHook(() =>
      useFile({
        loadData,
        completeSave: vi.fn(),
        getRows: () => [],
        getMeta: () => ({ dirty: false }) as SheetMeta,
        onToast,
        confirmDiscard: () => true,
      }),
    );
    await act(async () => result.current.openFile());
    delete (window as unknown as Record<string, unknown>).showOpenFilePicker;
    return { loadData, onToast };
  };

  it("refuses a Shift_JIS file instead of loading replacement characters", async () => {
    const { loadData, onToast } = await openInBrowser(fileOf(sjis, "tokyo.csv"));
    expect(loadData).not.toHaveBeenCalled();
    expect(onToast).toHaveBeenCalledWith(t("toastLoadNotUtf8"));
  });

  it("still opens UTF-8 files", async () => {
    const utf8 = new TextEncoder().encode("東京,a\n1,2\n");
    const { loadData } = await openInBrowser(fileOf(utf8, "tokyo.csv"));
    expect(loadData).toHaveBeenCalledTimes(1);
    expect((loadData.mock.calls[0] as [CellValue[][]])[0][0]).toEqual(["東京", "a"]);
  });

  it("refuses non-UTF-8 bytes in the streaming reader for large files", async () => {
    const blob = { arrayBuffer: async () => sjis.slice().buffer } as unknown as Blob;
    const chunks = streamFileText(blob);
    await expect(chunks.next()).rejects.toBeInstanceOf(TextEncodingError);
  });
});
