import { useCallback, useMemo, useState } from "react";
import type { CellValue } from "../types/sheet";

export type FilterMap = Map<number, Set<string>>;

export type VisibleRow = {
  /** Index into the original rows array. */
  sourceIndex: number;
  values: CellValue[];
};

export function applyFilters(rows: CellValue[][], filters: FilterMap): VisibleRow[] {
  if (filters.size === 0) {
    return rows.map((values, sourceIndex) => ({ sourceIndex, values }));
  }

  return rows
    .map((values, sourceIndex) => ({ sourceIndex, values }))
    .filter(({ values }) => {
      for (const [col, allowed] of filters) {
        if (allowed.size === 0) {
          return false;
        }
        const cell = values[col] ?? "";
        if (!allowed.has(cell)) {
          return false;
        }
      }
      return true;
    });
}

export function uniqueColumnValues(rows: CellValue[][], colIndex: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const row of rows) {
    const value = row[colIndex] ?? "";
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push(value);
  }
  return result;
}

export function useFilter() {
  const [filters, setFilters] = useState<FilterMap>(() => new Map());

  const setColumnFilter = useCallback((colIndex: number, allowed: Set<string> | null) => {
    setFilters((current) => {
      const next = new Map(current);
      if (allowed === null) {
        next.delete(colIndex);
      } else {
        next.set(colIndex, new Set(allowed));
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setFilters(new Map());
  }, []);

  const hasFilters = filters.size > 0;

  const getVisibleRows = useCallback(
    (rows: CellValue[][]) => applyFilters(rows, filters),
    [filters],
  );

  return useMemo(
    () => ({
      filters,
      hasFilters,
      setColumnFilter,
      clearAll,
      getVisibleRows,
    }),
    [filters, hasFilters, setColumnFilter, clearAll, getVisibleRows],
  );
}
