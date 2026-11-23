import { useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  detectDelimiter,
  detectNewline,
  parseCsvStream,
  STREAM_PARSE_THRESHOLD,
  streamFileText,
  TextEncodingError,
} from "../lib/csv";
import {
  parseMarkdownLayout,
  parseTableText,
  serializeTableText,
  type SerializeOptions,
} from "../lib/formats";
import { t } from "../lib/i18n";
import type { CellValue, Delimiter, FileFormat, MarkdownLayout, SheetMeta } from "../types/sheet";

type UseFileOptions = {
  // Used only when a brand-new sheet is loaded (open / drop / sample / new).
  // The callback owner is expected to reset history and selection alongside
  // replacing rows. Do not invoke this for save-completed metadata patches —
  // use completeSave for that instead, otherwise every Ctrl+S wipes undo,
  // resets selection, and refits column widths. Returning false means the
  // owner did not load the rows (it already told the user why).
  loadData: (rows: CellValue[][], meta: Partial<SheetMeta>) => boolean | void;
  // Applies save-completed metadata to the tab the save started from. A save
  // awaits the disk or a dialog, and the user may switch tabs or keep typing
  // meanwhile, so the owner marks the tab clean only if its rows still equal
  // the rows that were written.
  completeSave: (docId: string, savedRows: CellValue[][], meta: Partial<SheetMeta>) => void;
  getRows: () => CellValue[][];
  getMeta: () => SheetMeta;
  onToast: (message: string) => void;
  confirmDiscard: () => boolean | Promise<boolean>;
  /** Called when a filesystem path is opened/saved (Tauri recent-files list). */
  onRecentPath?: (path: string) => void;
  /** Returns the active document tab ID so browser file handles stay scoped per tab. */
  getActiveId?: () => string;
};

// Sent by the native side when macOS delivers a document to a running app.
const OPEN_FILE_EVENT = "plainsheet://open-file";

type FileDropPayload =
  | {
      paths?: string[];
    }
  | string[];

export function useFile({
  loadData,
  completeSave,
  getRows,
  getMeta,
  onToast,
  confirmDiscard,
  onRecentPath,
  getActiveId,
}: UseFileOptions) {
  // Browser-only: handles returned by File System Access open/save pickers,
  // keyed by document tab ID so tabs with identical filenames never collide.
  const fileHandlesRef = useRef<Map<string, FsFileHandle>>(new Map());
  const loadGenerationRef = useRef(0);
  const loadPathRef = useRef<(path: string) => Promise<void>>(async () => undefined);
  const loadDataRef = useRef(loadData);
  const getMetaRef = useRef(getMeta);
  const confirmDiscardRef = useRef(confirmDiscard);
  const onToastRef = useRef(onToast);
  const onRecentPathRef = useRef(onRecentPath);
  const getActiveIdRef = useRef(getActiveId ?? (() => "default"));
  loadDataRef.current = loadData;
  getMetaRef.current = getMeta;
  confirmDiscardRef.current = confirmDiscard;
  onToastRef.current = onToast;
  onRecentPathRef.current = onRecentPath;
  getActiveIdRef.current = getActiveId ?? (() => "default");

  const resetSaveTarget = useCallback((docId?: string) => {
    fileHandlesRef.current.delete(docId ?? getActiveIdRef.current());
  }, []);

  const loadPath = useCallback(
    async (path: string) => {
      const generation = ++loadGenerationRef.current;
      try {
        const { content, encoding } = await invoke<{ content: string; encoding: string }>(
          "read_file",
          { path },
        );
        if (generation !== loadGenerationRef.current) {
          return;
        }
        const format = formatFromPath(path);
        const delimiter = format === "tsv" ? "\t" : detectDelimiter(content);
        const newline = detectNewline(content);
        const rows = parseTableText(content, format, delimiter);
        const loaded = loadData(rows, {
          filePath: path,
          fileName: fileNameFromPath(path),
          encoding: normalizeEncoding(encoding),
          newline,
          delimiter,
          format,
          markdown: format === "markdown" ? parseMarkdownLayout(content) : undefined,
        });
        if (loaded === false) {
          return;
        }
        onRecentPath?.(path);
        onToast(t("toastLoaded"));
      } catch {
        if (generation !== loadGenerationRef.current) {
          return;
        }
        onToast(t("toastLoadFailed"));
      }
    },
    [loadData, onToast, onRecentPath],
  );
  loadPathRef.current = loadPath;

  const openFile = useCallback(async () => {
    try {
      if (getMeta().dirty && !(await confirmDiscard())) {
        return;
      }
      if (!isTauriRuntime()) {
        await openBrowserFile(loadData, onToast, (handle) => {
          const activeId = getActiveIdRef.current();
          if (handle) {
            fileHandlesRef.current.set(activeId, handle);
          } else {
            fileHandlesRef.current.delete(activeId);
          }
        });
        return;
      }
      const path = await invoke<string | null>("open_file_dialog");
      if (path) {
        await loadPath(path);
      }
    } catch {
      onToast(t("toastLoadFailed"));
    }
  }, [confirmDiscard, getMeta, loadData, loadPath, onToast]);

  const saveAs = useCallback(async () => {
    try {
      // Capture the tab and its rows before any dialog: the user can switch
      // tabs or keep editing while the picker is open or the write is pending.
      const docId = getActiveIdRef.current();
      const rows = getRows();
      const currentMeta = getMeta();
      const defaultName = currentMeta.fileName ?? "untitled.csv";
      if (!isTauriRuntime()) {
        const fsWindow = fsAccessWindow();
        if (fsWindow?.showSaveFilePicker) {
          let handle: FsFileHandle;
          try {
            handle = await fsWindow.showSaveFilePicker({
              suggestedName: defaultName,
              types: saveFilePickerTypes(),
            });
          } catch {
            return;
          }
          const format = formatFromPath(handle.name);
          const delimiter =
            format === currentMeta.format ? currentMeta.delimiter : delimiterFromFormat(format);
          const content = serializeTableText(
            rows,
            format,
            delimiter,
            currentMeta.newline,
            serializeOptions(currentMeta, format),
          );
          await writeFileHandle(handle, content);
          fileHandlesRef.current.set(docId, handle);
          completeSave(docId, rows, {
            fileName: handle.name,
            delimiter,
            dirty: false,
            format,
            markdown: keptMarkdownLayout(currentMeta, format),
          });
          onToast(t("toastSaved"));
          return;
        }
        const fileName = window.prompt("Save as", defaultName);
        if (!fileName) {
          return;
        }
        const format = formatFromPath(fileName);
        const delimiter =
          format === currentMeta.format ? currentMeta.delimiter : delimiterFromFormat(format);
        const content = serializeTableText(
          rows,
          format,
          delimiter,
          currentMeta.newline,
          serializeOptions(currentMeta, format),
        );
        downloadText(content, fileName);
        fileHandlesRef.current.delete(docId);
        completeSave(docId, rows, {
          fileName,
          delimiter,
          dirty: false,
          format,
          markdown: keptMarkdownLayout(currentMeta, format),
        });
        onToast(t("toastDownloadStarted"));
        return;
      }
      const path = await invoke<string | null>("save_file_dialog", { defaultName });
      if (!path) {
        return;
      }
      const format = formatFromPath(path);
      const delimiter = format === currentMeta.format ? currentMeta.delimiter : delimiterFromFormat(format);
      const encoding = encodingForFormat(format, currentMeta.encoding);
      const content = serializeTableText(
        rows,
        format,
        delimiter,
        currentMeta.newline,
        serializeOptions(currentMeta, format),
      );
      await invoke("write_file", { path, content, encoding });
      completeSave(docId, rows, {
        filePath: path,
        fileName: fileNameFromPath(path),
        delimiter,
        encoding,
        dirty: false,
        format,
        markdown: keptMarkdownLayout(currentMeta, format),
      });
      onRecentPath?.(path);
      onToast(t("toastSaved"));
    } catch (error) {
      onToast(saveErrorMessage(error));
    }
  }, [getMeta, getRows, completeSave, onToast, onRecentPath]);

  const saveFile = useCallback(async () => {
    try {
      const docId = getActiveIdRef.current();
      const rows = getRows();
      const currentMeta = getMeta();
      if (!isTauriRuntime()) {
        const format = currentMeta.format ?? "csv";
        const content = serializeTableText(
          rows,
          format,
          currentMeta.delimiter,
          currentMeta.newline,
          serializeOptions(currentMeta, format),
        );
        const handle = fileHandlesRef.current.get(docId);
        if (handle && handle.name === currentMeta.fileName) {
          if (typeof handle.queryPermission === "function") {
            let permission = await handle.queryPermission({ mode: "readwrite" });
            if (permission !== "granted" && typeof handle.requestPermission === "function") {
              permission = await handle.requestPermission({ mode: "readwrite" });
            }
            if (permission !== "granted") {
              await saveAs();
              return;
            }
          }
          await writeFileHandle(handle, content);
          completeSave(docId, rows, { dirty: false });
          onToast(t("toastSaved"));
          return;
        }
        if (fsAccessWindow()?.showSaveFilePicker) {
          await saveAs();
          return;
        }
        downloadText(content, currentMeta.fileName ?? "untitled.csv");
        completeSave(docId, rows, { dirty: false });
        onToast(t("toastDownloadStarted"));
        return;
      }
      if (!currentMeta.filePath) {
        await saveAs();
        return;
      }
      const format = currentMeta.format ?? "csv";
      const encoding = encodingForFormat(format, currentMeta.encoding);
      const content = serializeTableText(
        rows,
        format,
        currentMeta.delimiter,
        currentMeta.newline,
        serializeOptions(currentMeta, format),
      );
      await invoke("write_file", {
        path: currentMeta.filePath,
        content,
        encoding,
      });
      completeSave(docId, rows, { encoding, dirty: false });
      onRecentPath?.(currentMeta.filePath);
      onToast(t("toastSaved"));
    } catch (error) {
      onToast(saveErrorMessage(error));
    }
  }, [getMeta, getRows, completeSave, onToast, saveAs, onRecentPath]);

  const loadSample = useCallback(async () => {
    try {
      if (getMeta().dirty && !(await confirmDiscard())) {
        return;
      }
      const response = await fetch(`${import.meta.env.BASE_URL}sample.csv`);
      if (!response.ok) {
        throw new Error("sample file is unavailable");
      }
      const content = await response.text();
      const rows = parseTableText(content, "csv", ",");
      const loaded = loadData(rows, {
        fileName: "sample.csv",
        delimiter: ",",
        newline: detectNewline(content),
        encoding: "utf-8",
        format: "csv",
      });
      if (loaded === false) {
        return;
      }
      resetSaveTarget();
      onToast(t("toastLoaded"));
    } catch {
      onToast(t("toastLoadFailed"));
    }
  }, [confirmDiscard, getMeta, loadData, onToast, resetSaveTarget]);

  useEffect(() => {
    if (!isTauriRuntime()) {
      const handleDragOver = (event: DragEvent) => {
        event.preventDefault();
      };
      const handleDrop = (event: DragEvent) => {
        event.preventDefault();
        // Read the file before awaiting: dataTransfer is emptied once the
        // drop event handler returns.
        const file = event.dataTransfer?.files[0];
        if (!file) {
          return;
        }
        void (async () => {
          if (getMetaRef.current().dirty && !(await confirmDiscardRef.current())) {
            return;
          }
          // D&D has no writable handle — next Save will pick a location.
          await loadBrowserFile(file, loadDataRef.current, onToastRef.current, () => {
            fileHandlesRef.current.delete(getActiveIdRef.current());
          });
        })();
      };
      window.addEventListener("dragover", handleDragOver);
      window.addEventListener("drop", handleDrop);
      return () => {
        window.removeEventListener("dragover", handleDragOver);
        window.removeEventListener("drop", handleDrop);
      };
    }

    let unlisten: (() => void) | undefined;
    let cancelled = false;
    listen<FileDropPayload>("tauri://drag-drop", async (event) => {
      const path = extractDropPath(event.payload);
      if (!path) {
        return;
      }
      if (getMetaRef.current().dirty && !(await confirmDiscardRef.current())) {
        return;
      }
      await loadPathRef.current(path);
    })
      .then((handler) => {
        if (cancelled) {
          handler();
          return;
        }
        unlisten = handler;
      })
      .catch(() => {
        if (!cancelled) {
          onToastRef.current(t("toastLoadFailed"));
        }
      });

    // A file the OS asked the app to open: named on the command line
    // (`plainsheet data.csv`, "Open with") or, on macOS, delivered as an
    // open-document event. The native side hands each one out once, so the
    // result is used even if this effect was torn down meanwhile (StrictMode).
    const openPendingFile = async () => {
      const path = await invoke<string | null>("take_startup_file");
      if (!path) {
        return;
      }
      if (getMetaRef.current().dirty && !(await confirmDiscardRef.current())) {
        return;
      }
      await loadPathRef.current(path);
    };
    const openPendingFileSafely = () => {
      openPendingFile().catch(() => onToastRef.current(t("toastLoadFailed")));
    };
    let unlistenOpen: (() => void) | undefined;
    listen(OPEN_FILE_EVENT, openPendingFileSafely)
      .then((handler) => {
        if (cancelled) {
          handler();
          return;
        }
        unlistenOpen = handler;
      })
      .catch(() => undefined);
    openPendingFileSafely();

    return () => {
      cancelled = true;
      if (unlisten) {
        unlisten();
      }
      if (unlistenOpen) {
        unlistenOpen();
      }
    };
  }, []);

  return {
    openFile,
    saveFile,
    saveAs,
    loadPath,
    loadSample,
    resetSaveTarget,
  };
}

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function fileNameFromPath(path: string): string {
  return path.split(/[\\/]/).at(-1) ?? path;
}

export function formatFromPath(path: string): FileFormat {
  const lower = path.toLowerCase();
  if (lower.endsWith(".tsv")) {
    return "tsv";
  }
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) {
    return "markdown";
  }
  if (lower.endsWith(".json")) {
    return "json";
  }
  if (lower.endsWith(".yaml") || lower.endsWith(".yml")) {
    return "yaml";
  }
  return "csv";
}

export function delimiterFromFormat(format: FileFormat): Delimiter {
  return format === "tsv" ? "\t" : ",";
}

function normalizeEncoding(value: string): SheetMeta["encoding"] {
  if (value === "utf-8-bom" || value === "cp932" || value === "euc-jp" || value === "latin-1") {
    return value;
  }
  return "utf-8";
}

function extractDropPath(payload: FileDropPayload): string | null {
  if (Array.isArray(payload)) {
    return payload[0] ?? null;
  }
  return payload.paths?.[0] ?? null;
}

async function openBrowserFile(
  loadData: UseFileOptions["loadData"],
  onToast: UseFileOptions["onToast"],
  onHandle: (handle: FsFileHandle | null) => void,
): Promise<void> {
  const fsWindow = fsAccessWindow();
  if (fsWindow?.showOpenFilePicker) {
    try {
      const [handle] = await fsWindow.showOpenFilePicker({
        multiple: false,
        types: openFilePickerTypes(),
      });
      if (!handle?.getFile) {
        return;
      }
      const file = await handle.getFile();
      await loadBrowserFile(file, loadData, onToast, () => onHandle(handle));
      return;
    } catch (error) {
      // User cancel → AbortError; fall through only for unexpected errors.
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      // Fall back to <input type=file>.
    }
  }

  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".csv,.tsv,.txt,.md,.markdown,.json,.yaml,.yml,text/csv,text/tab-separated-values";
  const file = await new Promise<File | null>((resolve) => {
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
  if (file) {
    await loadBrowserFile(file, loadData, onToast, () => onHandle(null));
  }
}

async function assertBrowserFileNotBinary(file: File): Promise<void> {
  if (typeof file.slice === "function") {
    const headerSlice = file.slice(0, 2);
    if (typeof headerSlice.arrayBuffer === "function") {
      const bytes = new Uint8Array(await headerSlice.arrayBuffer());
      if (
        bytes.length >= 2 &&
        ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff))
      ) {
        throw new Error("UTF-16 files are not supported");
      }
    }
  }
}

async function loadBrowserFile(
  file: File,
  loadData: UseFileOptions["loadData"],
  onToast: UseFileOptions["onToast"],
  onAdopt?: () => void,
): Promise<void> {
  try {
    await assertBrowserFileNotBinary(file);
    const format = formatFromPath(file.name);
    let content = "";
    let rows: CellValue[][];

    if ((format === "csv" || format === "tsv") && file.size >= STREAM_PARSE_THRESHOLD) {
      const peek = await file.slice(0, 64 * 1024).text();
      if (peek.includes("\0")) {
        throw new Error("file contains NUL bytes");
      }
      const delimiter = format === "tsv" ? "\t" : detectDelimiter(peek);
      const newline = detectNewline(peek);
      rows = await parseCsvStream(streamFileText(file), delimiter, {
        totalBytes: file.size,
        onProgress: (ratio) => {
          onToast(t("toastLoading", { percent: Math.round(ratio * 100) }));
        },
      });
      const loaded = loadData(rows, {
        fileName: file.name,
        delimiter,
        newline,
        encoding: "utf-8",
        format,
      });
      if (loaded === false) {
        return;
      }
      onAdopt?.();
      onToast(t("toastLoaded"));
      return;
    }

    // The browser build only reads and writes UTF-8. Decode strictly: a
    // Shift_JIS / EUC-JP / Latin-1 file decoded leniently turns its text into
    // U+FFFD, and saving would then overwrite the original with that.
    content = decodeUtf8Strict(await readFileBytes(file));
    if (content.includes("\0")) {
      throw new Error("file contains NUL bytes");
    }
    // Mirror the Rust decoder and the CSV parser: drop a leading UTF-8 BOM so
    // BOM'd JSON/YAML load identically in the browser build instead of dying
    // inside JSON.parse.
    content = content.replace(/^\uFEFF/, "");
    const delimiter = format === "tsv" ? "\t" : detectDelimiter(content);
    rows = parseTableText(content, format, delimiter);
    const loaded = loadData(rows, {
      fileName: file.name,
      delimiter,
      newline: detectNewline(content),
      encoding: "utf-8",
      format,
      markdown: format === "markdown" ? parseMarkdownLayout(content) : undefined,
    });
    if (loaded === false) {
      return;
    }
    onAdopt?.();
    onToast(t("toastLoaded"));
  } catch (error) {
    onToast(error instanceof TextEncodingError ? t("toastLoadNotUtf8") : t("toastLoadFailed"));
  }
}

async function readFileBytes(file: Blob): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === "function") {
    return new Uint8Array(await file.arrayBuffer());
  }
  return new Uint8Array(
    await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error ?? new Error("failed to read file"));
      reader.readAsArrayBuffer(file);
    }),
  );
}

function decodeUtf8Strict(bytes: Uint8Array): string {
  try {
    // ignoreBOM keeps a leading BOM in the text; the caller strips it.
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new TextEncodingError();
  }
}

function encodingForFormat(
  format: FileFormat,
  encoding: SheetMeta["encoding"],
): SheetMeta["encoding"] {
  return format === "json" || format === "yaml" ? "utf-8" : encoding;
}

function serializeOptions(meta: SheetMeta, format: FileFormat): SerializeOptions {
  return {
    sanitizeFormulas: meta.csvFormulaGuard,
    omitEmptyCells: meta.omitEmptyCells,
    markdown: keptMarkdownLayout(meta, format),
  };
}

// The text around a Markdown table belongs to that document. Keep it while the
// sheet is saved as Markdown again; saving under another format drops it.
function keptMarkdownLayout(meta: SheetMeta, format: FileFormat): MarkdownLayout | undefined {
  return format === "markdown" && meta.format === "markdown" ? meta.markdown : undefined;
}

function saveErrorMessage(error: unknown): string {
  if (typeof error === "string" && error.includes("cannot represent")) {
    return t("toastSaveFailedEncoding");
  }
  return t("toastSaveFailed");
}

type FsPermissionMode = "read" | "readwrite";

type FsWritable = {
  write: (data: string | Blob) => Promise<void>;
  close: () => Promise<void>;
};

type FsFileHandle = {
  name: string;
  createWritable: () => Promise<FsWritable>;
  getFile?: () => Promise<File>;
  queryPermission?: (descriptor?: { mode?: FsPermissionMode }) => Promise<PermissionState>;
  requestPermission?: (descriptor?: { mode?: FsPermissionMode }) => Promise<PermissionState>;
};

type SaveFilePickerType = {
  description?: string;
  accept: Record<string, string[]>;
};

type SaveFilePickerOptions = {
  suggestedName?: string;
  types?: SaveFilePickerType[];
};

type OpenFilePickerOptions = {
  multiple?: boolean;
  types?: SaveFilePickerType[];
};

type FsWindow = Window & {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FsFileHandle>;
  showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FsFileHandle[]>;
};

function fsAccessWindow(): FsWindow | null {
  if (typeof window === "undefined") {
    return null;
  }
  const candidate = window as FsWindow;
  if (
    typeof candidate.showSaveFilePicker === "function" ||
    typeof candidate.showOpenFilePicker === "function"
  ) {
    return candidate;
  }
  return null;
}

function saveFilePickerTypes(): SaveFilePickerType[] {
  return [
    {
      description: "Plain text table",
      accept: {
        "text/csv": [".csv"],
        "text/tab-separated-values": [".tsv"],
        "text/markdown": [".md", ".markdown"],
        "application/json": [".json"],
        "application/x-yaml": [".yaml", ".yml"],
        "text/plain": [".txt"],
      },
    },
  ];
}

function openFilePickerTypes(): SaveFilePickerType[] {
  return saveFilePickerTypes();
}

async function writeFileHandle(handle: FsFileHandle, content: string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

function downloadText(content: string, fileName: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
