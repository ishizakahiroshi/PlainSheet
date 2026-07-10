import { useEffect, useMemo, useState } from "react";
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
  const values = useMemo(
    () => (state ? uniqueColumnValues(rows, state.col) : []),
    [rows, state],
  );
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!state) {
      return;
    }
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

  const allSelected = values.length > 0 && values.every((value) => checked.has(value));

  return (
    <div
      className="filterPopover"
      role="dialog"
      aria-label={t("filter")}
      style={{ left: state.x, top: state.y }}
    >
      <div className="filterPopover__actions">
        <button
          type="button"
          onClick={() => setChecked(allSelected ? new Set() : new Set(values))}
        >
          {allSelected ? t("filterNone") : t("selectAllValues")}
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
        {values.map((value) => {
          const label = value === "" ? t("filterBlank") : value;
          return (
            <label key={value === "" ? "__blank__" : value} className="filterPopover__item">
              <input
                type="checkbox"
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
            if (checked.size === values.length) {
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
