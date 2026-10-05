import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  detectDelimiter,
  detectNewline,
  parseCsvStream,
  STREAM_PARSE_THRESHOLD,
  streamFileText,
} from "../lib/csv";
import { parseTableText, serializeTableText, type SerializeOptions } from "../lib/formats";
import { t } from "../lib/i18n";
import { cloneRows } from "./useSheet";
import type { SaveCompletion, SaveSnapshot } from "../lib/saveState";
import type { CellValue, Delimiter, FileFormat, SheetMeta } from "../types/sheet";

type UseFileOptions = {
  // Used only when a brand-new sheet is loaded (open / drop / sample / new).
  // The callback owner is expected to reset history and selection alongside
  // replacing rows. Do not invoke this for save-completed metadata patches —
  // use updateMeta for that instead, otherwise every Ctrl+S wipes undo,
  // resets selection, and refits column widths.
  loadData: (rows: CellValue[][], meta: Partial<SheetMeta>) => void;
  getDocumentId: () => string;
  onSaved: (completion: SaveCompletion) => void;
  getRows: () => CellValue[][];
  getMeta: () => SheetMeta;
  onToast: (message: string) => void;
  /** Called when a filesystem path is opened/saved (Tauri recent-files list). */
  onRecentPath?: (path: string) => void;
};

type FileDropPayload =
  | {
      paths?: string[];
    }
  | string[];

export function useFile({
  loadData,
  getDocumentId,
  onSaved,
  getRows,
  getMeta,
  onToast,
  onRecentPath,
}: UseFileOptions) {
  const saveBusyRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const loadGenerationRef = useRef(0);
  const loadPathRef = useRef<(path: string) => Promise<void>>(async () => undefined);
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;

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
        const delimiter = detectDelimiter(content);
        const newline = detectNewline(content);
        const rows = parseTableText(content, format, delimiter);
        loadData(rows, {
          filePath: path,
          fileName: fileNameFromPath(path),
          encoding: normalizeEncoding(encoding),
          newline,
          delimiter,
          format,
        });
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
      if (!isTauriRuntime()) {
        await openBrowserFile(loadData, onToast);
        return;
      }
      const path = await invoke<string | null>("open_file_dialog");
      if (path) {
        await loadPath(path);
      }
    } catch {
      onToast(t("toastLoadFailed"));
    }
  }, [loadData, loadPath, onToast]);

  const performSave = useCallback(
    async (chooseName: boolean) => {
      if (saveBusyRef.current) {
        setSaveNotice(t("saving"));
        return;
      }
      // Capture before any await: dialogs and I/O must never read another tab's live data.
      const snapshot: SaveSnapshot = {
        documentId: getDocumentId(),
        rows: cloneRows(getRows()),
        meta: { ...getMeta() },
      };
      const currentMeta = snapshot.meta;
      const defaultName = currentMeta.fileName ?? "untitled.csv";
      saveBusyRef.current = true;
      setSaving(true);
      setSaveNotice(null);
      try {
        if (!isTauriRuntime()) {
          const fileName = chooseName ? window.prompt(t("downloadAs"), defaultName) : defaultName;
          if (!fileName) {
            setSaveNotice(t("saveCancelled"));
            return;
          }
          const format = chooseName ? formatFromPath(fileName) : (currentMeta.format ?? "csv");
          const delimiter =
            format === currentMeta.format ? currentMeta.delimiter : delimiterFromFormat(format);
          const content = serializeTableText(
            snapshot.rows,
            format,
            delimiter,
            currentMeta.newline,
            serializeOptions(currentMeta),
          );
          const encoding =
            encodingForFormat(format, currentMeta.encoding) === "utf-8-bom" ? "utf-8-bom" : "utf-8";
          downloadText((encoding === "utf-8-bom" ? "\uFEFF" : "") + content, fileName);
          onSaved({
            snapshot,
            patch: { fileName, format, delimiter, encoding },
            method: "download",
          });
          setSaveNotice(t("browserDownloadNotice", { name: fileName }));
          onToast(t("toastDownloadStarted"));
          return;
        }
        const path =
          chooseName || !currentMeta.filePath
            ? await invoke<string | null>("save_file_dialog", { defaultName })
            : currentMeta.filePath;
        if (!path) {
          setSaveNotice(t("saveCancelled"));
          return;
        }
        const format =
          chooseName || !currentMeta.filePath
            ? formatFromPath(path)
            : (currentMeta.format ?? "csv");
        const delimiter =
          format === currentMeta.format ? currentMeta.delimiter : delimiterFromFormat(format);
        const encoding = encodingForFormat(format, currentMeta.encoding);
        const content = serializeTableText(
          snapshot.rows,
          format,
          delimiter,
          currentMeta.newline,
          serializeOptions(currentMeta),
        );
        await invoke("write_file", { path, content, encoding });
        onSaved({
          snapshot,
          patch: { filePath: path, fileName: fileNameFromPath(path), format, delimiter, encoding },
          method: "direct",
        });
        onRecentPath?.(path);
        setSaveNotice(t("savedFileNotice", { name: fileNameFromPath(path) }));
        onToast(t("toastSaved"));
      } catch (error) {
        const message = saveErrorMessage(error);
        setSaveNotice(message);
        onToast(message);
      } finally {
        saveBusyRef.current = false;
        setSaving(false);
      }
    },
    [getDocumentId, getMeta, getRows, onSaved, onToast, onRecentPath],
  );

  const saveAs = useCallback(() => performSave(true), [performSave]);
  const saveFile = useCallback(() => performSave(false), [performSave]);

  const loadSample = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}sample.csv`);
      if (!response.ok) {
        throw new Error("sample file is unavailable");
      }
      const content = await response.text();
      const rows = parseTableText(content, "csv", ",");
      loadData(rows, {
        fileName: "sample.csv",
        delimiter: ",",
        newline: detectNewline(content),
        encoding: "utf-8",
        format: "csv",
      });
      onToast(t("toastLoaded"));
    } catch {
      onToast(t("toastLoadFailed"));
    }
  }, [loadData, onToast]);

  useEffect(() => {
    if (!isTauriRuntime()) {
      const handleDragOver = (event: DragEvent) => {
        event.preventDefault();
      };
      const handleDrop = (event: DragEvent) => {
        event.preventDefault();
        const file = event.dataTransfer?.files[0];
        if (file) {
          void loadBrowserFile(file, loadData, onToastRef.current);
        }
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
    listen<FileDropPayload>("tauri://drag-drop", (event) => {
      const path = extractDropPath(event.payload);
      if (!path) {
        return;
      }
      void loadPathRef.current(path);
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

    return () => {
      cancelled = true;
      if (unlisten) {
        unlisten();
      }
    };
  }, [loadData]);

  return {
    saving,
    saveNotice,
    openFile,
    saveFile,
    saveAs,
    loadPath,
    loadSample,
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
      await loadBrowserFile(file, loadData, onToast);
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
    input.addEventListener("cancel", () => resolve(null), { once: true });
    input.click();
  });
  if (file) {
    await loadBrowserFile(file, loadData, onToast);
  }
}

async function loadBrowserFile(
  file: File,
  loadData: UseFileOptions["loadData"],
  onToast: UseFileOptions["onToast"],
): Promise<void> {
  try {
    const format = formatFromPath(file.name);
    let content = "";
    let rows: CellValue[][];

    if ((format === "csv" || format === "tsv") && file.size >= STREAM_PARSE_THRESHOLD) {
      const peek = await file.slice(0, 64 * 1024).text();
      const delimiter = format === "tsv" ? "\t" : detectDelimiter(peek);
      const newline = detectNewline(peek);
      rows = await parseCsvStream(streamFileText(file), delimiter, {
        totalBytes: file.size,
        onProgress: (ratio) => {
          onToast(t("toastLoading", { percent: Math.round(ratio * 100) }));
        },
      });
      loadData(rows, {
        fileName: file.name,
        delimiter,
        newline,
        encoding: "utf-8",
        format,
      });
      onToast(t("toastLoaded"));
      return;
    }

    content = await file.text();
    // Mirror the Rust decoder and the CSV parser: drop a leading UTF-8 BOM so
    // BOM'd JSON/YAML load identically in the browser build instead of dying
    // inside JSON.parse.
    content = content.replace(/^\uFEFF/, "");
    const delimiter = format === "tsv" ? "\t" : detectDelimiter(content);
    rows = parseTableText(content, format, delimiter);
    loadData(rows, {
      fileName: file.name,
      delimiter,
      newline: detectNewline(content),
      encoding: "utf-8",
      format,
    });
    onToast(t("toastLoaded"));
  } catch {
    onToast(t("toastLoadFailed"));
  }
}

function encodingForFormat(
  format: FileFormat,
  encoding: SheetMeta["encoding"],
): SheetMeta["encoding"] {
  return format === "json" || format === "yaml" ? "utf-8" : encoding;
}

function serializeOptions(meta: SheetMeta): SerializeOptions {
  return { sanitizeFormulas: meta.csvFormulaGuard, omitEmptyCells: meta.omitEmptyCells };
}

function saveErrorMessage(error: unknown): string {
  if (typeof error === "string" && error.includes("cannot represent")) {
    return t("toastSaveFailedEncoding");
  }
  return t("toastSaveFailed");
}

type FsFileHandle = { name: string; getFile?: () => Promise<File> };

type SaveFilePickerType = {
  description?: string;
  accept: Record<string, string[]>;
};

type OpenFilePickerOptions = {
  multiple?: boolean;
  types?: SaveFilePickerType[];
};

type FsWindow = Window & {
  showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FsFileHandle[]>;
};

function fsAccessWindow(): FsWindow | null {
  if (typeof window === "undefined") {
    return null;
  }
  const candidate = window as FsWindow;
  if (typeof candidate.showOpenFilePicker === "function") {
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

function downloadText(content: string, fileName: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
