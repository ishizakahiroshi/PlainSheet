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
  // Opt-in save guards (off by default to keep round-trips faithful).
  csvFormulaGuard: boolean; // prefix =/+/-/@ cells with ' on CSV/TSV export
  omitEmptyCells: boolean; // drop empty values from JSON/YAML objects
};

export type HistoryEntry = {
  rows: CellValue[][];
  selection: Selection;
};

export type ColumnWidthMap = Record<number, number>;

export const BUFFER_ROWS = 8;
export const BUFFER_COLS = 8;

// Excel-like baseline grid size shown even for small/empty sheets. The grid is
// virtualized, so only visible cells are rendered regardless of these numbers.
export const MIN_GRID_ROWS = 100000;
export const MIN_GRID_COLS = 702; // up to column "ZZ"

export const DEFAULT_META: SheetMeta = {
  encoding: "utf-8",
  newline: "LF",
  delimiter: ",",
  dirty: false,
  format: "csv",
  csvFormulaGuard: false,
  omitEmptyCells: false,
};

export const EMPTY_SELECTION: Selection = {
  row: 0,
  col: 0,
};
