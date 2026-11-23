import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchOptions } from "../components/SearchPanel";
import { findSearchHits, type SearchHit } from "../lib/search";
import type { SearchRequest } from "../lib/search.worker";
import type { CellValue } from "../types/sheet";

// How long to wait after the last keystroke before a regular-expression search.
const DEBOUNCE_MS = 150;
// A regular-expression search that takes longer is stopped.
export const SEARCH_TIMEOUT_MS = 2000;

export type SearchState = {
  hits: SearchHit[];
  // The last regular-expression search was stopped for taking too long.
  timedOut: boolean;
};

const EMPTY: SearchState = { hits: [], timedOut: false };

function createWorker(): Worker | null {
  if (typeof Worker === "undefined") {
    return null;
  }
  try {
    return new Worker(new URL("../lib/search.worker.ts", import.meta.url), { type: "module" });
  } catch {
    return null;
  }
}

/**
 * Cells that match the search. Plain-text search is linear and runs at once;
 * a regular expression runs in a worker after typing pauses, and is stopped
 * after SEARCH_TIMEOUT_MS so a catastrophic pattern cannot freeze the window.
 */
export function useSearchHits(
  rows: CellValue[][],
  query: string,
  options: SearchOptions,
  allowedRows: Set<number> | null,
): SearchState {
  const workerRef = useRef<Worker | null>(null);
  const requestRef = useRef(0);
  const [result, setResult] = useState<SearchState>(EMPTY);
  const inWorker = options.regex && query !== "" && typeof Worker !== "undefined";

  const syncHits = useMemo(
    () => (inWorker ? null : findSearchHits(rows, query, options, allowedRows)),
    [inWorker, rows, query, options, allowedRows],
  );

  useEffect(() => {
    if (!inWorker) {
      return;
    }
    const id = ++requestRef.current;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const debounce = setTimeout(() => {
      const worker = workerRef.current ?? createWorker();
      if (!worker) {
        setResult({ hits: findSearchHits(rows, query, options, allowedRows), timedOut: false });
        return;
      }
      workerRef.current = worker;
      worker.onmessage = (event: MessageEvent<{ id: number; hits: SearchHit[] }>) => {
        if (event.data.id !== requestRef.current) {
          return;
        }
        clearTimeout(timeout);
        setResult({ hits: event.data.hits, timedOut: false });
      };
      timeout = setTimeout(() => {
        if (id !== requestRef.current) {
          return;
        }
        worker.terminate();
        workerRef.current = null;
        setResult({ hits: [], timedOut: true });
      }, SEARCH_TIMEOUT_MS);
      const request: SearchRequest = {
        id,
        rows,
        query,
        options,
        allowedRows: allowedRows ? [...allowedRows] : null,
      };
      worker.postMessage(request);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(debounce);
      clearTimeout(timeout);
    };
  }, [inWorker, rows, query, options, allowedRows]);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    [],
  );

  return syncHits ? { hits: syncHits, timedOut: false } : result;
}
