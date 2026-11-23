export type CellValue = string;

export type SheetData = {
  rows: CellValue[][];
};

export type Selection = {
  row: number;
  col: number;
};

export type Range = {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
} | null;

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
  // Markdown files: the document around the edited table, kept so saving
  // rewrites only the table.
  markdown?: MarkdownLayout;
  // CSV / TSV: whether the file ended with a line break.
  trailingNewline?: boolean;
  // JSON / YAML files: each cell's value as the file held it, so a save keeps
  // types and untouched values.
  structured?: StructuredSource;
  // Desktop: the file's modification time and size when it was read or last
  // saved, to notice changes made by other apps.
  fileStamp?: FileStamp;
};

export type FileStamp = {
  modified: string;
  size: number;
};

export type ValueKind = "string" | "number" | "boolean" | "null" | "object";

export type StructuredValue = {
  kind: ValueKind;
  // The cell text the sheet shows for this value.
  cell: string;
  // JSON only: the value's JSON text to write while the cell is unchanged.
  json?: string;
};

export type StructuredSource = {
  format: "json" | "yaml";
  // One entry per data row, keyed by the object's keys.
  records: Record<string, StructuredValue>[];
  // The value types each key held in the file.
  kinds: Record<string, ValueKind[]>;
  // YAML only: the original document, edited in place on save.
  text?: string;
};

export type MarkdownAlignment = "none" | "left" | "center" | "right";

export type MarkdownLayout = {
  // Whether the file held a table. When false, `before` is the whole file.
  hasTable: boolean;
  // Text before the table, including the line break that ends it.
  before: string;
  // Text after the table, starting with the line break that ended the table.
  after: string;
  // Column alignments from the separator row (`:---`, `---:`, `:---:`).
  alignments: MarkdownAlignment[];
};

export type HistoryEntry = {
  rows: CellValue[][];
  selection: Selection;
  range?: Range;
  selectedRows?: number[];
  selectedColumns?: number[];
  colWidths?: ColumnWidthMap;
  view?: SheetView;
  dirty?: boolean;
};

export type SheetView = {
  hiddenRows: number[];
  hiddenColumns: number[];
  freezeColumns: number;
  filters: [number, string[]][];
};
export const emptyView = (): SheetView => ({
  hiddenRows: [],
  hiddenColumns: [],
  freezeColumns: 0,
  filters: [],
});

export type ColumnWidthMap = Record<number, number>;

export const BUFFER_ROWS = 8;
export const BUFFER_COLS = 8;

// Excel-like baseline grid size shown even for small/empty sheets. The grid is
// virtualized, so only visible cells are rendered regardless of these numbers.
export const MIN_GRID_ROWS = 100000;
export const MIN_GRID_COLS = 702; // up to column "ZZ"

// Hard ceilings for parsed cell references (Excel parity). Without them a name
// box jump like A99999999 flows into ensureSize and tries to materialize the
// backing arrays for every skipped row.
export const MAX_GRID_ROWS = 1048576;
export const MAX_GRID_COLS = 16384;

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
