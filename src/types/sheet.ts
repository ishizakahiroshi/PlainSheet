export type CellValue = string;

export type SheetData = {
  rows: CellValue[][];
};

export type Selection = {
  row: number;
  col: number;
};

export type Range =
  | {
      startRow: number;
      startCol: number;
      endRow: number;
      endCol: number;
    }
  | null;

export type Encoding = "utf-8" | "utf-8-bom" | "cp932" | "euc-jp" | "latin-1";
export type Newline = "LF" | "CRLF";
export type Delimiter = "," | "\t" | ";" | "|";
export type FileFormat = "csv" | "tsv" | "markdown" | "json" | "yaml";

export type SheetMeta = {
  filePath?: string;
  fileName?: string;
  encoding: Encoding;
  newline: Newline;
  delimiter: Delimiter;
  dirty: boolean;
  format?: FileFormat;
};

export type HistoryEntry = {
  rows: CellValue[][];
  selection: Selection;
};

export type ColumnWidthMap = Record<number, number>;

export type ClipboardPayload = {
  rows: CellValue[][];
  source: "single-cell" | "range";
};

export const BUFFER_ROWS = 8;

export const DEFAULT_META: SheetMeta = {
  encoding: "utf-8",
  newline: "LF",
  delimiter: ",",
  dirty: false,
  format: "csv",
};

export const EMPTY_SELECTION: Selection = {
  row: 0,
  col: 0,
};
