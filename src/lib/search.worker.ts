// Runs a regular-expression search off the main thread. A pattern such as
// (a+)+$ can take seconds per cell; here the app can stop it instead of the
// window freezing.
import type { SearchOptions } from "../components/SearchPanel";
import type { CellValue } from "../types/sheet";
import { findSearchHits } from "./search";

export type SearchRequest = {
  id: number;
  rows: CellValue[][];
  query: string;
  options: SearchOptions;
  allowedRows: number[] | null;
};

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<SearchRequest>) => void) | null;
  postMessage: (message: unknown) => void;
};

scope.onmessage = (event) => {
  const { id, rows, query, options, allowedRows } = event.data;
  const hits = findSearchHits(rows, query, options, allowedRows ? new Set(allowedRows) : null);
  scope.postMessage({ id, hits });
};
