import { Copy, ClipboardPaste, Columns3, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { t } from "../lib/i18n";

export type ContextMenuKind = "cell" | "row" | "column";

export type ContextMenuState = {
  kind: ContextMenuKind;
  row: number;
  col: number;
  x: number;
  y: number;
} | null;

type ContextMenuProps = {
  state: ContextMenuState;
  onClose: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onClear: () => void;
  onInsertRowAbove: () => void;
  onInsertRowBelow: () => void;
  onDeleteRow: () => void;
  onInsertColLeft: () => void;
  onInsertColRight: () => void;
  onDeleteCol: () => void;
  onAutoFitColumn: () => void;
};

type MenuItem = {
  label: string;
  icon: ReactNode;
  action: () => void;
};

export function ContextMenu({
  state,
  onClose,
  onCopy,
  onPaste,
  onClear,
  onInsertRowAbove,
  onInsertRowBelow,
  onDeleteRow,
  onInsertColLeft,
  onInsertColRight,
  onDeleteCol,
  onAutoFitColumn,
}: ContextMenuProps) {
  if (!state) {
    return null;
  }

  const commonCellItems: MenuItem[] = [
    { label: t("copy"), icon: <Copy size={15} aria-hidden="true" />, action: onCopy },
    {
      label: t("paste"),
      icon: <ClipboardPaste size={15} aria-hidden="true" />,
      action: onPaste,
    },
    { label: t("clearCells"), icon: <Trash2 size={15} aria-hidden="true" />, action: onClear },
    { label: t("insertRowAbove"), icon: <Plus size={15} aria-hidden="true" />, action: onInsertRowAbove },
    { label: t("insertRowBelow"), icon: <Plus size={15} aria-hidden="true" />, action: onInsertRowBelow },
    { label: t("deleteRow"), icon: <Trash2 size={15} aria-hidden="true" />, action: onDeleteRow },
  ];

  const columnItems: MenuItem[] = [
    { label: t("insertColLeft"), icon: <Plus size={15} aria-hidden="true" />, action: onInsertColLeft },
    { label: t("insertColRight"), icon: <Plus size={15} aria-hidden="true" />, action: onInsertColRight },
    {
      label: t("recalculateColumn"),
      icon: <Columns3 size={15} aria-hidden="true" />,
      action: onAutoFitColumn,
    },
    { label: t("deleteCol"), icon: <Trash2 size={15} aria-hidden="true" />, action: onDeleteCol },
  ];

  const rowItems: MenuItem[] = [
    { label: t("insertRowAbove"), icon: <Plus size={15} aria-hidden="true" />, action: onInsertRowAbove },
    { label: t("insertRowBelow"), icon: <Plus size={15} aria-hidden="true" />, action: onInsertRowBelow },
    { label: t("deleteRow"), icon: <Trash2 size={15} aria-hidden="true" />, action: onDeleteRow },
  ];

  const items = state.kind === "column" ? columnItems : state.kind === "row" ? rowItems : commonCellItems;

  return (
    <div
      className="contextMenu"
      role="menu"
      aria-label={state.kind === "column" ? t("columnMenu") : state.kind === "row" ? t("rowMenu") : t("cellMenu")}
      style={{ left: state.x, top: state.y }}
      onMouseLeave={onClose}
    >
      {items.map((item) => (
        <button
          className="contextMenu__item"
          key={item.label}
          type="button"
          role="menuitem"
          aria-label={item.label}
          onClick={() => {
            item.action();
            onClose();
          }}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
