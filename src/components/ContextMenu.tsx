import {
  ArrowDownAZ,
  ArrowUpAZ,
  Copy,
  ClipboardPaste,
  Columns3,
  Filter,
  Plus,
  Scissors,
  Snowflake,
  Trash2,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
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
  onCut?: () => void;
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
  onSortAsc?: () => void;
  onSortDesc?: () => void;
  onFilter?: () => void;
  onFreezeToHere?: () => void;
  onUnfreeze?: () => void;
  filterActive?: boolean;
  rowOpsDisabled?: boolean;
};

type MenuItem = {
  label: string;
  icon: ReactNode;
  action: () => void;
  disabled?: boolean;
};

export function ContextMenu({
  state,
  onClose,
  onCut,
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
  onSortAsc,
  onSortDesc,
  onFilter,
  onFreezeToHere,
  onUnfreeze,
  filterActive,
  rowOpsDisabled,
}: ContextMenuProps) {
  useEffect(() => {
    if (!state) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".contextMenu")) {
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

  const commonCellItems: MenuItem[] = [
    ...(onCut
      ? [{ label: t("cut"), icon: <Scissors size={15} aria-hidden="true" />, action: onCut }]
      : []),
    { label: t("copy"), icon: <Copy size={15} aria-hidden="true" />, action: onCopy },
    {
      label: t("paste"),
      icon: <ClipboardPaste size={15} aria-hidden="true" />,
      action: onPaste,
    },
    { label: t("clearCells"), icon: <Trash2 size={15} aria-hidden="true" />, action: onClear },
    {
      label: t("insertRowAbove"),
      icon: <Plus size={15} aria-hidden="true" />,
      action: onInsertRowAbove,
      disabled: rowOpsDisabled,
    },
    {
      label: t("insertRowBelow"),
      icon: <Plus size={15} aria-hidden="true" />,
      action: onInsertRowBelow,
      disabled: rowOpsDisabled,
    },
    {
      label: t("deleteRow"),
      icon: <Trash2 size={15} aria-hidden="true" />,
      action: onDeleteRow,
      disabled: rowOpsDisabled,
    },
  ];

  const columnItems: MenuItem[] = [
    ...(onSortAsc
      ? [{ label: t("sortAsc"), icon: <ArrowUpAZ size={15} aria-hidden="true" />, action: onSortAsc }]
      : []),
    ...(onSortDesc
      ? [
          {
            label: t("sortDesc"),
            icon: <ArrowDownAZ size={15} aria-hidden="true" />,
            action: onSortDesc,
          },
        ]
      : []),
    ...(onFilter
      ? [
          {
            label: filterActive ? t("filterClear") : t("filter"),
            icon: <Filter size={15} aria-hidden="true" />,
            action: onFilter,
          },
        ]
      : []),
    ...(onFreezeToHere
      ? [
          {
            label: t("freezeToHere"),
            icon: <Snowflake size={15} aria-hidden="true" />,
            action: onFreezeToHere,
          },
        ]
      : []),
    ...(onUnfreeze
      ? [
          {
            label: t("unfreeze"),
            icon: <Snowflake size={15} aria-hidden="true" />,
            action: onUnfreeze,
          },
        ]
      : []),
    {
      label: t("insertColLeft"),
      icon: <Plus size={15} aria-hidden="true" />,
      action: onInsertColLeft,
      disabled: rowOpsDisabled,
    },
    {
      label: t("insertColRight"),
      icon: <Plus size={15} aria-hidden="true" />,
      action: onInsertColRight,
      disabled: rowOpsDisabled,
    },
    {
      label: t("recalculateColumn"),
      icon: <Columns3 size={15} aria-hidden="true" />,
      action: onAutoFitColumn,
    },
    {
      label: t("deleteCol"),
      icon: <Trash2 size={15} aria-hidden="true" />,
      action: onDeleteCol,
      disabled: rowOpsDisabled,
    },
  ];

  const rowItems: MenuItem[] = [
    ...(onCut
      ? [{ label: t("cut"), icon: <Scissors size={15} aria-hidden="true" />, action: onCut }]
      : []),
    { label: t("copy"), icon: <Copy size={15} aria-hidden="true" />, action: onCopy },
    {
      label: t("paste"),
      icon: <ClipboardPaste size={15} aria-hidden="true" />,
      action: onPaste,
    },
    {
      label: t("insertRowAbove"),
      icon: <Plus size={15} aria-hidden="true" />,
      action: onInsertRowAbove,
      disabled: rowOpsDisabled,
    },
    {
      label: t("insertRowBelow"),
      icon: <Plus size={15} aria-hidden="true" />,
      action: onInsertRowBelow,
      disabled: rowOpsDisabled,
    },
    {
      label: t("deleteRow"),
      icon: <Trash2 size={15} aria-hidden="true" />,
      action: onDeleteRow,
      disabled: rowOpsDisabled,
    },
  ];

  const items = state.kind === "column" ? columnItems : state.kind === "row" ? rowItems : commonCellItems;

  return (
    <div
      className="contextMenu"
      role="menu"
      aria-label={state.kind === "column" ? t("columnMenu") : state.kind === "row" ? t("rowMenu") : t("cellMenu")}
      style={{ left: state.x, top: state.y }}
    >
      {items.map((item) => (
        <button
          className="contextMenu__item"
          key={item.label}
          type="button"
          role="menuitem"
          aria-label={item.label}
          disabled={item.disabled}
          onClick={() => {
            if (item.disabled) {
              return;
            }
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
