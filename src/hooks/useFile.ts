import { useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { detectDelimiter, detectNewline } from "../lib/csv";
import { parseTableText, serializeTableText } from "../lib/formats";
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
  const loadPath = useCallback(
    async (path: string) => {
      try {
        const content = await invoke<string>("read_file", { path });
        const encoding = await invoke<string>("detect_encoding", { path });
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
  }, [confirmDiscard, getMeta, loadData, loadPath, onToast]);

  const saveAs = useCallback(async () => {
    try {
      const currentMeta = getMeta();
      const defaultName = currentMeta.fileName ?? "untitled.csv";
      if (!isTauriRuntime()) {
        const fileName = window.prompt("Save as", defaultName);
        if (!fileName) {
          return;
        }
        const format = formatFromPath(fileName);
        const delimiter = delimiterFromFormat(format);
        const content = serializeTableText(getRows(), format, delimiter, currentMeta.newline);
        downloadText(content, fileName);
        loadData(getRows(), {
          ...currentMeta,
          fileName,
          delimiter,
          dirty: false,
          format,
        });
        onToast(t("toastSaved"));
        return;
      }
      const path = await invoke<string | null>("save_file_dialog", { defaultName });
      if (!path) {
        return;
      }
      const format = formatFromPath(path);
      const delimiter = delimiterFromFormat(format);
      const content = serializeTableText(getRows(), format, delimiter, currentMeta.newline);
      await invoke("write_file", { path, content, encoding: currentMeta.encoding });
      loadData(getRows(), {
        ...currentMeta,
        filePath: path,
        fileName: fileNameFromPath(path),
        delimiter,
        dirty: false,
        format: formatFromPath(path),
      });
      onToast(t("toastSaved"));
    } catch {
      onToast(t("toastSaveFailed"));
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
        );
        downloadText(content, currentMeta.fileName ?? "untitled.csv");
        loadData(getRows(), { ...currentMeta, dirty: false });
        onToast(t("toastSaved"));
        return;
      }
      if (!currentMeta.filePath) {
        await saveAs();
        return;
      }
      const content = serializeTableText(
        getRows(),
        currentMeta.format ?? "csv",
        currentMeta.delimiter,
        currentMeta.newline,
      );
      await invoke("write_file", {
        path: currentMeta.filePath,
        content,
        encoding: currentMeta.encoding,
      });
      loadData(getRows(), { ...currentMeta, dirty: false });
      onToast(t("toastSaved"));
    } catch {
      onToast(t("toastSaveFailed"));
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
  }, [confirmDiscard, getMeta, loadData, onToast]);

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
          void loadBrowserFile(file, loadData, onToast);
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
  }, [confirmDiscard, getMeta, loadData, loadPath, onToast]);

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
): Promise<void> {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".csv,.tsv,.txt,.md,.markdown,.json,.yaml,.yml,text/csv,text/tab-separated-values";
  const file = await new Promise<File | null>((resolve) => {
    input.onchange = () => resolve(input.files?.[0] ?? null);
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
    const content = await file.text();
    const format = formatFromPath(file.name);
    const delimiter = format === "tsv" ? "\t" : detectDelimiter(content);
    const rows = parseTableText(content, format, delimiter);
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

function downloadText(content: string, fileName: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
