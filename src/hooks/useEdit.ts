import { useState } from "react";
import type { CellValue } from "../types/sheet";

export type EditingCell = {
  row: number;
  col: number;
  initialValue: CellValue;
  value: CellValue;
};

export function useEdit() {
  const [editing, setEditing] = useState<EditingCell | null>(null);

  function startEditing(row: number, col: number, currentValue: CellValue, overwriteValue?: CellValue): void {
    setEditing({
      row,
      col,
      initialValue: currentValue,
      value: overwriteValue ?? currentValue,
    });
  }

  function updateEditingValue(value: CellValue): void {
    setEditing((current) => (current ? { ...current, value } : current));
  }

  function cancelEditing(): void {
    setEditing(null);
  }

  function commitEditing(onCommit: (row: number, col: number, value: CellValue) => void): void {
    if (!editing) {
      return;
    }
    onCommit(editing.row, editing.col, editing.value);
    setEditing(null);
  }

  return {
    editing,
    startEditing,
    updateEditingValue,
    cancelEditing,
    commitEditing,
  };
}
