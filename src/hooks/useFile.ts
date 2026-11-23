import { useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  detectDelimiter,
  detectNewline,
  hasTrailingNewline,
  parseCsvStream,
  STREAM_PARSE_THRESHOLD,
  streamFileText,
  TextEncodingError,
  type CsvParseInfo,
} from "../lib/csv";
import { parseTableDocument, serializeTableText, type SerializeOptions } from "../lib/formats";
import { t } from "../lib/i18n";
import type {
  CellValue,
  Delimiter,
  Encoding,
  FileFormat,
  FileStamp,
  MarkdownLayout,
  SheetMeta,
  StructuredSource,
} from "../types/sheet";

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
  // the rows that were written. With keepDirty the tab stays as it is (a
  // browser download, whose result the app cannot see).
  completeSave: (
    docId: string,
    savedRows: CellValue[][],
    meta: Partial<SheetMeta>,
    options?: { keepDirty?: boolean },
  ) => void;
  getRows: () => CellValue[][];
  getMeta: () => SheetMeta;
  onToast: (message: string) => void;
  confirmDiscard: () => boolean | Promise<boolean>;
  // Asked when the file changed on disk after it was opened.
  confirmOverwrite?: () => boolean | Promise<boolean>;
  /** Called when a filesystem path is opened/saved (Tauri recent-files list). */
  onRecentPath?: (path: string) => void;
  /** Returns the active document tab ID so browser file handles stay scoped per tab. */
  getActiveId?: () => string;
};

// Sent by the native side when files arrive for a running app (a second
// launch, or macOS open-document events).
const OPEN_FILE_EVENT = "plainsheet://open-file";

type FileDropPayload =
  | {
      paths?: string[];
    }
  | string[];

type ReadResult = {
  content: string;
  encoding: string;
  warning?: string | null;
  path?: string;
  stamp?: FileStamp;
};

type LoadPathOptions = {
  // Decode with this encoding instead of detecting it.
  encoding?: Encoding;
  // The caller already asked before replacing unsaved edits.
  confirmed?: boolean;
};

export function useFile({
  loadData,
  completeSave,
  getRows,
  getMeta,
  onToast,
  confirmDiscard,
  confirmOverwrite,
  onRecentPath,
  getActiveId,
}: UseFileOptions) {
  // Browser-only: handles returned by File System Access open/save pickers,
  // keyed by document tab ID so tabs with identical filenames never collide.
  const fileHandlesRef = useRef<Map<string, FsFileHandle>>(new Map());
  const loadGenerationRef = useRef(0);
  const loadPathsRef = useRef<(paths: string[]) => Promise<void>>(async () => undefined);
  const loadDataRef = useRef(loadData);
  const onToastRef = useRef(onToast);
  const getActiveIdRef = useRef(getActiveId ?? (() => "default"));
  loadDataRef.current = loadData;
  onToastRef.current = onToast;
  getActiveIdRef.current = getActiveId ?? (() => "default");

  const resetSaveTarget = useCallback((docId?: string) => {
    fileHandlesRef.current.delete(docId ?? getActiveIdRef.current());
  }, []);

  // Loads one file. Returns whether it was loaded, and the message to show.
  const readPath = useCallback(
    async (path: string, options: LoadPathOptions = {}): Promise<string | null> => {
      const result = await invoke<ReadResult>(
        "read_file",
        options.encoding ? { path, encoding: options.encoding } : { path },
      );
      const realPath = result.path ?? path;
      // Opening a different file adds a tab, so nothing is lost. Only reloading
      // the file shown now, over its unsaved edits, needs a yes.
      const current = getMeta();
      if (
        !options.confirmed &&
        current.dirty &&
        current.filePath &&
        samePath(current.filePath, realPath) &&
        !(await confirmDiscard())
      ) {
        return null;
      }
      const format = formatFromPath(realPath);
      const parsed = readTableText(result.content, format);
      const loaded = loadData(parsed.rows, {
        ...parsed.meta,
        filePath: realPath,
        fileName: fileNameFromPath(realPath),
        encoding: normalizeEncoding(result.encoding),
        format,
        fileStamp: result.stamp,
      });
      if (loaded === false) {
        return null;
      }
      onRecentPath?.(realPath);
      return readWarningMessage(result.warning) ?? parsed.notice ?? t("toastLoaded");
    },
    [confirmDiscard, getMeta, loadData, onRecentPath],
  );

  const loadPaths = useCallback(
    async (paths: string[], options: LoadPathOptions = {}) => {
      const generation = ++loadGenerationRef.current;
      let message: string | null = null;
      for (const path of paths) {
        try {
          const loaded = await readPath(path, options);
          message = loaded ?? message;
        } catch (error) {
          message = loadErrorMessage(error);
        }
        if (generation !== loadGenerationRef.current) {
          return;
        }
      }
      if (message) {
        onToast(message);
      }
    },
    [onToast, readPath],
  );
  loadPathsRef.current = loadPaths;

  const loadPath = useCallback((path: string) => loadPaths([path]), [loadPaths]);

  // Reads the shown file again in the given encoding (Settings). `hasEdits`
  // says whether reloading would lose cell edits: picking the encoding in
  // Settings alone already marks the sheet unsaved.
  const reopenWithEncoding = useCallback(
    async (encoding: Encoding, hasEdits = getMeta().dirty) => {
      const path = getMeta().filePath;
      if (!path || !isTauriRuntime()) {
        return;
      }
      if (hasEdits && !(await confirmDiscard())) {
        return;
      }
      await loadPaths([path], { encoding, confirmed: true });
    },
    [confirmDiscard, getMeta, loadPaths],
  );

  const openFile = useCallback(async () => {
    try {
      if (!isTauriRuntime()) {
        await openBrowserFiles(loadData, onToast, (handle) => {
          const activeId = getActiveIdRef.current();
          if (handle) {
            fileHandlesRef.current.set(activeId, handle);
          } else {
            fileHandlesRef.current.delete(activeId);
          }
        });
        return;
      }
      const paths = await invoke<string[] | string | null>("open_file_dialog");
      const list = Array.isArray(paths) ? paths : paths ? [paths] : [];
      if (list.length > 0) {
        await loadPaths(list);
      }
    } catch (error) {
      onToast(loadErrorMessage(error));
    }
  }, [loadData, loadPaths, onToast]);

  // Writes to disk. If the file changed since it was read, asks before
  // overwriting it. Returns the file's new stamp, or null when the user
  // declined to overwrite.
  const writeToDisk = useCallback(
    async (
      path: string,
      content: string,
      encoding: Encoding,
      expected: FileStamp | undefined,
    ): Promise<{ stamp: FileStamp | undefined } | null> => {
      try {
        const stamp = await invoke<FileStamp | null>("write_file", {
          path,
          content,
          encoding,
          ...(expected ? { expected } : {}),
        });
        return { stamp: stamp ?? undefined };
      } catch (error) {
        if (error !== "modified-externally") {
          throw error;
        }
        if (!(await (confirmOverwrite ?? confirmDiscard)())) {
          return null;
        }
        const stamp = await invoke<FileStamp | null>("write_file", { path, content, encoding });
        return { stamp: stamp ?? undefined };
      }
    },
    [confirmDiscard, confirmOverwrite],
  );

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
            ...savedShape(currentMeta, format, content),
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
        completeSave(
          docId,
          rows,
          { fileName, delimiter, format, ...savedShape(currentMeta, format, content) },
          { keepDirty: true },
        );
        onToast(t("toastDownloadKeepsUnsaved"));
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
      // The same file chosen again: still guard against outside changes.
      const expected =
        currentMeta.filePath && samePath(currentMeta.filePath, path) ? currentMeta.fileStamp : undefined;
      const written = await writeToDisk(path, content, encoding, expected);
      if (!written) {
        return;
      }
      completeSave(docId, rows, {
        filePath: path,
        fileName: fileNameFromPath(path),
        delimiter,
        encoding,
        dirty: false,
        format,
        fileStamp: written.stamp,
        ...savedShape(currentMeta, format, content),
      });
      onRecentPath?.(path);
      onToast(t("toastSaved"));
    } catch (error) {
      onToast(saveErrorMessage(error));
    }
  }, [getMeta, getRows, completeSave, onToast, onRecentPath, writeToDisk]);

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
          completeSave(docId, rows, { dirty: false, ...savedShape(currentMeta, format, content) });
          onToast(t("toastSaved"));
          return;
        }
        if (fsAccessWindow()?.showSaveFilePicker) {
          await saveAs();
          return;
        }
        downloadText(content, currentMeta.fileName ?? "untitled.csv");
        completeSave(docId, rows, savedShape(currentMeta, format, content), { keepDirty: true });
        onToast(t("toastDownloadKeepsUnsaved"));
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
      const written = await writeToDisk(currentMeta.filePath, content, encoding, currentMeta.fileStamp);
      if (!written) {
        return;
      }
      completeSave(docId, rows, {
        encoding,
        dirty: false,
        fileStamp: written.stamp,
        ...savedShape(currentMeta, format, content),
      });
      onRecentPath?.(currentMeta.filePath);
      onToast(t("toastSaved"));
    } catch (error) {
      onToast(saveErrorMessage(error));
    }
  }, [getMeta, getRows, completeSave, onToast, saveAs, onRecentPath, writeToDisk]);

  const loadSample = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}sample.csv`);
      if (!response.ok) {
        throw new Error("sample file is unavailable");
      }
      const content = await response.text();
      const parsed = readTableText(content, "csv");
      const loaded = loadData(parsed.rows, {
        ...parsed.meta,
        fileName: "sample.csv",
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
  }, [loadData, onToast, resetSaveTarget]);

  useEffect(() => {
    if (!isTauriRuntime()) {
      const handleDragOver = (event: DragEvent) => {
        event.preventDefault();
      };
      const handleDrop = (event: DragEvent) => {
        event.preventDefault();
        // Read the files before awaiting: dataTransfer is emptied once the
        // drop event handler returns.
        const files = Array.from(event.dataTransfer?.files ?? []);
        void (async () => {
          for (const file of files) {
            // Each file opens in its own tab. D&D has no writable handle, so
            // the next Save picks a location.
            await loadBrowserFile(file, loadDataRef.current, onToastRef.current, () => {
              fileHandlesRef.current.delete(getActiveIdRef.current());
            });
          }
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
      const paths = extractDropPaths(event.payload);
      if (paths.length > 0) {
        await loadPathsRef.current(paths);
      }
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

    // Files the OS asked the app to open: named on the command line
    // (`plainsheet data.csv`, "Open with"), handed over by a second launch, or
    // on macOS delivered as open-document events. The native side hands each
    // one out once, so the result is used even if this effect was torn down
    // meanwhile (StrictMode).
    const openPendingFiles = async () => {
      const paths = await invoke<string[] | null>("take_pending_files");
      if (paths && paths.length > 0) {
        await loadPathsRef.current(paths);
      }
    };
    const openPendingFilesSafely = () => {
      openPendingFiles().catch(() => onToastRef.current(t("toastLoadFailed")));
    };
    let unlistenOpen: (() => void) | undefined;
    listen(OPEN_FILE_EVENT, openPendingFilesSafely)
      .then((handler) => {
        if (cancelled) {
          handler();
          return;
        }
        unlistenOpen = handler;
      })
      .catch(() => undefined);
    openPendingFilesSafely();

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
    reopenWithEncoding,
    resetSaveTarget,
  };
}

type ReadTable = {
  rows: CellValue[][];
  meta: Partial<SheetMeta>;
  // A message to show instead of "Loaded".
  notice: string | null;
};

/** Parses file text and records what a save needs to write it back faithfully. */
export function readTableText(content: string, format: FileFormat): ReadTable {
  const delimiter = format === "tsv" ? "\t" : detectDelimiter(content);
  const parsed = parseTableDocument(content, format, delimiter);
  return {
    rows: parsed.rows,
    meta: { ...parsed.meta, delimiter },
    notice: parsed.unterminatedQuote ? t("toastLoadedUnterminatedQuote") : null,
  };
}

// File paths name the same file. Windows and macOS file systems ignore letter
// case by default; read_file already returns the real spelling, this covers
// paths that never went through it.
export function samePath(a: string, b: string): boolean {
  if (a === b) {
    return true;
  }
  const windowsLike = /^[a-zA-Z]:[\\/]|^\\\\/.test(a);
  if (!windowsLike) {
    return false;
  }
  const normalize = (path: string) => path.replace(/\//g, "\\").toLowerCase();
  return normalize(a) === normalize(b);
}

function readWarningMessage(warning: string | null | undefined): string | null {
  if (!warning) {
    return null;
  }
  const invalid = /^invalid-(?:utf8|bytes):(\d+)$/.exec(warning);
  if (invalid) {
    return t("toastLoadedInvalidUtf8", { count: Number(invalid[1]) });
  }
  if (warning === "guessed-latin1") {
    return t("toastLoadedGuessedLatin1");
  }
  if (warning === "roundtrip") {
    return t("toastLoadedRoundtrip");
  }
  return null;
}

const LOAD_ERROR_MESSAGES: Record<string, Parameters<typeof t>[0]> = {
  "too-large": "toastLoadTooLarge",
  utf16: "toastLoadUtf16",
  nul: "toastLoadBinary",
  "not-found": "toastLoadNotFound",
  "permission-denied": "toastLoadPermission",
  "not-table": "toastLoadNotTable",
};

export function loadErrorMessage(error: unknown): string {
  if (error instanceof TextEncodingError) {
    return t("toastLoadNotUtf8");
  }
  const code =
    typeof error === "string" ? error : error instanceof LoadError ? error.code : notTableCode(error);
  const key = code ? LOAD_ERROR_MESSAGES[code] : undefined;
  return key ? t(key) : t("toastLoadFailed");
}

// JSON / YAML that does not parse, or is not a list of objects.
function notTableCode(error: unknown): string | null {
  if (error instanceof SyntaxError) {
    return "not-table";
  }
  if (error instanceof Error && (error.name.startsWith("YAML") || /array of objects/.test(error.message))) {
    return "not-table";
  }
  return null;
}

class LoadError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "LoadError";
  }
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

function normalizeEncoding(value: string): Encoding {
  if (value === "utf-8-bom" || value === "cp932" || value === "euc-jp" || value === "latin-1") {
    return value;
  }
  return "utf-8";
}

function extractDropPaths(payload: FileDropPayload): string[] {
  return Array.isArray(payload) ? payload : (payload.paths ?? []);
}

async function openBrowserFiles(
  loadData: UseFileOptions["loadData"],
  onToast: UseFileOptions["onToast"],
  onHandle: (handle: FsFileHandle | null) => void,
): Promise<void> {
  const fsWindow = fsAccessWindow();
  if (fsWindow?.showOpenFilePicker) {
    try {
      const handles = await fsWindow.showOpenFilePicker({
        multiple: true,
        types: openFilePickerTypes(),
      });
      // Each file opens in its own tab and keeps its handle for Save.
      for (const handle of handles) {
        if (!handle?.getFile) {
          continue;
        }
        const file = await handle.getFile();
        await loadBrowserFile(file, loadData, onToast, () => onHandle(handle));
      }
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
  input.multiple = true;
  input.accept = ".csv,.tsv,.txt,.md,.markdown,.json,.yaml,.yml,text/csv,text/tab-separated-values";
  const files = await new Promise<File[]>((resolve) => {
    input.onchange = () => resolve(Array.from(input.files ?? []));
    input.click();
  });
  for (const file of files) {
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
        throw new LoadError("utf16");
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

    if ((format === "csv" || format === "tsv") && file.size >= STREAM_PARSE_THRESHOLD) {
      const peek = await file.slice(0, 64 * 1024).text();
      if (peek.includes("\0")) {
        throw new LoadError("nul");
      }
      const delimiter = format === "tsv" ? "\t" : detectDelimiter(peek);
      const newline = detectNewline(peek);
      const tail = await file.slice(Math.max(0, file.size - 2)).text();
      const info: CsvParseInfo = {};
      const rows = await parseCsvStream(streamFileText(file), delimiter, {
        totalBytes: file.size,
        onProgress: (ratio) => {
          onToast(t("toastLoading", { percent: Math.round(ratio * 100) }));
        },
        info,
      });
      const loaded = loadData(rows, {
        fileName: file.name,
        delimiter,
        newline,
        trailingNewline: hasTrailingNewline(tail),
        encoding: "utf-8",
        format,
      });
      if (loaded === false) {
        return;
      }
      onAdopt?.();
      onToast(info.unterminatedQuote ? t("toastLoadedUnterminatedQuote") : t("toastLoaded"));
      return;
    }

    // The browser build only reads and writes UTF-8. Decode strictly: a
    // Shift_JIS / EUC-JP / Latin-1 file decoded leniently turns its text into
    // U+FFFD, and saving would then overwrite the original with that.
    let content = decodeUtf8Strict(await readFileBytes(file));
    if (content.includes("\0")) {
      throw new LoadError("nul");
    }
    // Mirror the Rust decoder and the CSV parser: drop a leading UTF-8 BOM so
    // BOM'd JSON/YAML load identically in the browser build instead of dying
    // inside JSON.parse.
    content = content.replace(/^\uFEFF/, "");
    const parsed = readTableText(content, format);
    const loaded = loadData(parsed.rows, {
      ...parsed.meta,
      fileName: file.name,
      encoding: "utf-8",
      format,
    });
    if (loaded === false) {
      return;
    }
    onAdopt?.();
    onToast(parsed.notice ?? t("toastLoaded"));
  } catch (error) {
    onToast(loadErrorMessage(error));
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
    trailingNewline: sameFormat(meta, format) ? meta.trailingNewline : undefined,
    structured: sameFormat(meta, format) ? meta.structured : undefined,
  };
}

function sameFormat(meta: SheetMeta, format: FileFormat): boolean {
  return (meta.format ?? "csv") === format;
}

// What the file looks like after a save, apart from its cells: the next save
// compares against the file as written, not as first opened.
function savedShape(meta: SheetMeta, format: FileFormat, content: string): Partial<SheetMeta> {
  let structured: StructuredSource | undefined;
  if (format === "json" || format === "yaml") {
    try {
      structured = parseTableDocument(content, format, ",").meta.structured;
    } catch {
      structured = undefined;
    }
  }
  return {
    markdown: keptMarkdownLayout(meta, format),
    trailingNewline: format === "csv" || format === "tsv" ? hasTrailingNewline(content) : undefined,
    structured,
  };
}

// The text around a Markdown table belongs to that document. Keep it while the
// sheet is saved as Markdown again; saving under another format drops it.
function keptMarkdownLayout(meta: SheetMeta, format: FileFormat): MarkdownLayout | undefined {
  return format === "markdown" && meta.format === "markdown" ? meta.markdown : undefined;
}

function saveErrorMessage(error: unknown): string {
  if (error === "cannot-represent") {
    return t("toastSaveFailedEncoding");
  }
  if (error === "permission-denied") {
    return t("toastSavePermission");
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
