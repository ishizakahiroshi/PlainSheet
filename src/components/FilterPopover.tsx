import { useEffect, useMemo, useRef, useState } from "react";
import { t } from "../lib/i18n";
import { uniqueColumnValues } from "../hooks/useFilter";
import type { CellValue } from "../types/sheet";

export type FilterPopoverState = {
  col: number;
  x: number;
  y: number;
} | null;

type FilterPopoverProps = {
  state: FilterPopoverState;
  rows: CellValue[][];
  selected: Set<string> | null;
  onApply: (col: number, allowed: Set<string> | null) => void;
  onClose: () => void;
};

export function FilterPopover({ state, rows, selected, onApply, onClose }: FilterPopoverProps) {
  const values = useMemo(() => (state ? uniqueColumnValues(rows, state.col) : []), [rows, state]);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    if (state)
      for (const row of rows) {
        const value = row[state.col] ?? "";
        map.set(value, (map.get(value) ?? 0) + 1);
      }
    return map;
  }, [rows, state]);
  const shown = values.filter((value) =>
    value.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!state) {
      return;
    }
    setSearch("");
    inputRef.current?.focus();
    if (selected) {
      setChecked(new Set(selected));
    } else {
      setChecked(new Set(uniqueColumnValues(rows, state.col)));
    }
  }, [state, selected, rows]);

  useEffect(() => {
    if (!state) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".filterPopover")) {
        return;
      }
      onClose();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [state, onClose]);

  if (!state) {
    return null;
  }

  const allSelected = shown.length > 0 && shown.every((value) => checked.has(value));

  return (
    <div
      className="filterPopover"
      role="dialog"
      aria-label={t("filter")}
      style={{
        left: Math.max(8, Math.min(state.x, window.innerWidth - 280)),
        top: Math.max(8, Math.min(state.y, window.innerHeight - 380)),
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <input
        ref={inputRef}
        className="filterPopover__search"
        aria-label={t("filterValuesSearch")}
        placeholder={t("filterValuesSearch")}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="filterPopover__actions">
        <button
          type="button"
          onClick={() =>
            setChecked((current) => {
              const next = new Set(current);
              shown.forEach((value) => {
                if (allSelected) next.delete(value);
                else next.add(value);
              });
              return next;
            })
          }
        >
          {search
            ? allSelected
              ? t("clearShownValues")
              : t("selectShownValues")
            : allSelected
              ? t("filterNone")
              : t("selectAllValues")}
        </button>
        <button
          type="button"
          onClick={() => {
            onApply(state.col, null);
            onClose();
          }}
        >
          {t("filterClear")}
        </button>
      </div>
      <div className="filterPopover__list">
        {shown.map((value) => {
          const label = value === "" ? t("filterBlank") : value;
          return (
            <label key={value} className="filterPopover__item">
              <input
                type="checkbox"
                aria-label={t("filterValueCount", { value: label, count: counts.get(value) ?? 0 })}
                checked={checked.has(value)}
                onChange={(event) => {
                  setChecked((current) => {
                    const next = new Set(current);
                    if (event.target.checked) {
                      next.add(value);
                    } else {
                      next.delete(value);
                    }
                    return next;
                  });
                }}
              />
              <span title={label}>{label}</span>
              <small>{counts.get(value) ?? 0}</small>
            </label>
          );
        })}
      </div>
      <div className="filterPopover__footer">
        <button type="button" onClick={onClose}>
          {t("cancel")}
        </button>
        <button
          type="button"
          className="filterPopover__apply"
          onClick={() => {
            if (values.every((value) => checked.has(value))) {
              onApply(state.col, null);
            } else {
              onApply(state.col, checked);
            }
            onClose();
          }}
        >
          {t("filterApply")}
        </button>
      </div>
    </div>
  );
}
