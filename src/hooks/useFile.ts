import { useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { detectDelimiter, detectNewline } from "../lib/csv";
import { parseTableText, serializeTableText, type SerializeOptions } from "../lib/formats";
import { t } from "../lib/i18n";
import type { CellValue, Delimiter, FileFormat, SheetMeta } from "../types/sheet";

type UseFileOptions = {
  loadData: (rows: CellValue[][], meta: Partial<SheetMeta>) => void;
  getRows: () => CellValue[][];
  getMeta: () => SheetMeta;
  onToast: (message: string) => void;
  confirmDiscard: () => boolean;
};

type FileDropPayload =
  | {
      paths?: string[];
    }
  | string[];

export function useFile({ loadData, getRows, getMeta, onToast, confirmDiscard }: UseFileOptions) {
  // Browser-only: handle returned by the File System Access save picker, reused
  // for overwrite saves. Only reused when its name still matches the sheet name.
  const fileHandleRef = useRef<FsFileHandle | null>(null);

  // Forget the previously chosen save target whenever a new file is loaded, so a
  // later Ctrl+S can't overwrite an unrelated file that merely shares a name.
  const resetSaveTarget = useCallback(() => {
    fileHandleRef.current = null;
  }, []);

  const loadPath = useCallback(
    async (path: string) => {
      try {
        // Read bytes and detect encoding in a single command so the content and
        // its encoding always come from the same read (no double I/O, no race).
        const { content, encoding } = await invoke<{ content: string; encoding: string }>(
          "read_file",
          { path },
        );
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
        onToast(t("toastLoaded"));
      } catch {
        onToast(t("toastLoadFailed"));
      }
    },
    [loadData, onToast],
  );

  const openFile = useCallback(async () => {
    try {
      if (getMeta().dirty && !confirmDiscard()) {
        return;
      }
      if (!isTauriRuntime()) {
        await openBrowserFile(loadData, onToast, resetSaveTarget);
        return;
      }
      const path = await invoke<string | null>("open_file_dialog");
      if (path) {
        await loadPath(path);
      }
    } catch {
      onToast(t("toastLoadFailed"));
    }
  }, [confirmDiscard, getMeta, loadData, loadPath, onToast, resetSaveTarget]);

  const saveAs = useCallback(async () => {
    try {
      const currentMeta = getMeta();
      const defaultName = currentMeta.fileName ?? "untitled.csv";
      if (!isTauriRuntime()) {
        const fsWindow = fsAccessWindow();
        if (fsWindow) {
          let handle: FsFileHandle;
          try {
            handle = await fsWindow.showSaveFilePicker!({
              suggestedName: defaultName,
              types: saveFilePickerTypes(),
            });
          } catch {
            // user cancelled the picker
            return;
          }
          const format = formatFromPath(handle.name);
          const delimiter =
            format === currentMeta.format ? currentMeta.delimiter : delimiterFromFormat(format);
          const content = serializeTableText(
            getRows(),
            format,
            delimiter,
            currentMeta.newline,
            serializeOptions(currentMeta),
          );
          await writeFileHandle(handle, content);
          fileHandleRef.current = handle;
          loadData(getRows(), {
            ...currentMeta,
            fileName: handle.name,
            delimiter,
            dirty: false,
            format,
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
          getRows(),
          format,
          delimiter,
          currentMeta.newline,
          serializeOptions(currentMeta),
        );
        downloadText(content, fileName);
        loadData(getRows(), {
          ...currentMeta,
          fileName,
          delimiter,
          dirty: false,
          format,
        });
        onToast(t("toastDownloadStarted"));
        return;
      }
      const path = await invoke<string | null>("save_file_dialog", { defaultName });
      if (!path) {
        return;
      }
      const format = formatFromPath(path);
      // Keep the original delimiter when the format is unchanged so a ';' or '|'
      // CSV is not silently rewritten with commas; only re-derive on a switch.
      const delimiter = format === currentMeta.format ? currentMeta.delimiter : delimiterFromFormat(format);
      const encoding = encodingForFormat(format, currentMeta.encoding);
      const content = serializeTableText(
        getRows(),
        format,
        delimiter,
        currentMeta.newline,
        serializeOptions(currentMeta),
      );
      await invoke("write_file", { path, content, encoding });
      loadData(getRows(), {
        ...currentMeta,
        filePath: path,
        fileName: fileNameFromPath(path),
        delimiter,
        encoding,
        dirty: false,
        format,
      });
      onToast(t("toastSaved"));
    } catch (error) {
      onToast(saveErrorMessage(error));
    }
  }, [getMeta, getRows, loadData, onToast]);

  const saveFile = useCallback(async () => {
    try {
      const currentMeta = getMeta();
      if (!isTauriRuntime()) {
        const content = serializeTableText(
          getRows(),
          currentMeta.format ?? "csv",
          currentMeta.delimiter,
          currentMeta.newline,
          serializeOptions(currentMeta),
        );
        const handle = fileHandleRef.current;
        // Reuse the chosen save target only while it still refers to this sheet.
        if (handle && handle.name === currentMeta.fileName) {
          await writeFileHandle(handle, content);
          loadData(getRows(), { ...currentMeta, dirty: false });
          onToast(t("toastSaved"));
          return;
        }
        // No bound handle yet: let the user pick a location (with overwrite support).
        if (fsAccessWindow()) {
          await saveAs();
          return;
        }
        downloadText(content, currentMeta.fileName ?? "untitled.csv");
        loadData(getRows(), { ...currentMeta, dirty: false });
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
        getRows(),
        format,
        currentMeta.delimiter,
        currentMeta.newline,
        serializeOptions(currentMeta),
      );
      await invoke("write_file", {
        path: currentMeta.filePath,
        content,
        encoding,
      });
      loadData(getRows(), { ...currentMeta, encoding, dirty: false });
      onToast(t("toastSaved"));
    } catch (error) {
      onToast(saveErrorMessage(error));
    }
  }, [getMeta, getRows, loadData, onToast, saveAs]);

  const loadSample = useCallback(async () => {
    try {
      if (getMeta().dirty && !confirmDiscard()) {
        return;
      }
      const response = await fetch("/sample.csv");
      if (!response.ok) {
        throw new Error("sample file is unavailable");
      }
      const content = await response.text();
      const rows = parseTableText(content, "csv", ",");
      resetSaveTarget();
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
  }, [confirmDiscard, getMeta, loadData, onToast, resetSaveTarget]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    if (!isTauriRuntime()) {
      const handleDragOver = (event: DragEvent) => {
        event.preventDefault();
      };
      const handleDrop = (event: DragEvent) => {
        event.preventDefault();
        if (getMeta().dirty && !confirmDiscard()) {
          return;
        }
        const file = event.dataTransfer?.files[0];
        if (file) {
          void loadBrowserFile(file, loadData, onToast, resetSaveTarget);
        }
      };
      window.addEventListener("dragover", handleDragOver);
      window.addEventListener("drop", handleDrop);
      return () => {
        window.removeEventListener("dragover", handleDragOver);
        window.removeEventListener("drop", handleDrop);
      };
    }

    listen<FileDropPayload>("tauri://file-drop", (event) => {
      const path = extractDropPath(event.payload);
      if (!path) {
        return;
      }
      if (getMeta().dirty && !confirmDiscard()) {
        return;
      }
      void loadPath(path);
    })
      .then((handler) => {
        unlisten = handler;
      })
      .catch(() => onToast(t("toastLoadFailed")));

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [confirmDiscard, getMeta, loadData, loadPath, onToast, resetSaveTarget]);

  return {
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
  onAdopt?: () => void,
): Promise<void> {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".csv,.tsv,.txt,.md,.markdown,.json,.yaml,.yml,text/csv,text/tab-separated-values";
  const file = await new Promise<File | null>((resolve) => {
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
  if (file) {
    await loadBrowserFile(file, loadData, onToast, onAdopt);
  }
}

async function loadBrowserFile(
  file: File,
  loadData: UseFileOptions["loadData"],
  onToast: UseFileOptions["onToast"],
  onAdopt?: () => void,
): Promise<void> {
  try {
    const content = await file.text();
    const format = formatFromPath(file.name);
    const delimiter = format === "tsv" ? "\t" : detectDelimiter(content);
    const rows = parseTableText(content, format, delimiter);
    onAdopt?.();
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

// JSON and YAML are interchange formats that downstream tools read as UTF-8, so
// never write them in a legacy single-byte encoding even if the sheet was opened
// in one. Other text formats keep the user's selected encoding.
function encodingForFormat(
  format: FileFormat,
  encoding: SheetMeta["encoding"],
): SheetMeta["encoding"] {
  return format === "json" || format === "yaml" ? "utf-8" : encoding;
}

// Opt-in export guards carried on the sheet meta.
function serializeOptions(meta: SheetMeta): SerializeOptions {
  return { sanitizeFormulas: meta.csvFormulaGuard, omitEmptyCells: meta.omitEmptyCells };
}

// Surface the cause when the desktop backend rejects a save because the selected
// encoding can't represent some characters; fall back to the generic message.
function saveErrorMessage(error: unknown): string {
  if (typeof error === "string" && error.includes("cannot represent")) {
    return t("toastSaveFailedEncoding");
  }
  return t("toastSaveFailed");
}

type FsWritable = {
  write: (data: string | Blob) => Promise<void>;
  close: () => Promise<void>;
};

type FsFileHandle = {
  name: string;
  createWritable: () => Promise<FsWritable>;
};

type SaveFilePickerType = {
  description?: string;
  accept: Record<string, string[]>;
};

type SaveFilePickerOptions = {
  suggestedName?: string;
  types?: SaveFilePickerType[];
};

type FsWindow = Window & {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FsFileHandle>;
};

function fsAccessWindow(): FsWindow | null {
  if (typeof window !== "undefined" && typeof (window as FsWindow).showSaveFilePicker === "function") {
    return window as FsWindow;
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
