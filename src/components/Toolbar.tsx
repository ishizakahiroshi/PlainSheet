import {
  Bot,
  CircleHelp,
  Columns3,
  FilePlus2,
  FolderOpen,
  Rows3,
  Redo2,
  Save,
  SaveAll,
  Search,
  Settings,
  Trash2,
  Undo2,
} from "lucide-react";
import { t } from "../lib/i18n";

type ToolbarProps = {
  canUndo: boolean;
  canRedo: boolean;
  // Whether the selection holds data rows / columns to delete. When it does
  // not, the buttons are disabled instead of answering a click with an error.
  canDeleteRow?: boolean;
  canDeleteColumn?: boolean;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onSearch: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onInsertRow: () => void;
  onInsertColumn: () => void;
  onDeleteRow: () => void;
  onDeleteColumn: () => void;
  onAutoFit: () => void;
  onAiCopy: () => void;
  onSettings: () => void;
  onHelp: () => void;
};

// The button's name, with its shortcut, as a tooltip.
const tip = (label: string, keys?: string) => (keys ? `${label} (${keys})` : label);

export function Toolbar({
  canUndo,
  canRedo,
  canDeleteRow = true,
  canDeleteColumn = true,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onSearch,
  onUndo,
  onRedo,
  onInsertRow,
  onInsertColumn,
  onDeleteRow,
  onDeleteColumn,
  onAutoFit,
  onAiCopy,
  onSettings,
  onHelp,
}: ToolbarProps) {
  return (
    <nav className="toolbar" aria-label={t("toolbarLabel")}>
      <button
        className="toolbar__button"
        type="button"
        aria-label={t("newSheet")}
        title={t("newSheet")}
        onClick={onNew}
      >
        <FilePlus2 size={16} aria-hidden="true" />
        <span>{t("newFile")}</span>
      </button>
      <button
        className="toolbar__button"
        type="button"
        aria-label={t("open")}
        title={tip(t("open"), "Ctrl+O")}
        onClick={onOpen}
      >
        <FolderOpen size={16} aria-hidden="true" />
        <span>{t("open")}</span>
      </button>
      <button
        className="toolbar__button"
        type="button"
        aria-label={t("save")}
        title={tip(t("save"), "Ctrl+S")}
        onClick={onSave}
      >
        <Save size={16} aria-hidden="true" />
        <span>{t("save")}</span>
      </button>
      <button
        className="toolbar__button"
        type="button"
        aria-label={t("saveAs")}
        title={t("saveAs")}
        onClick={onSaveAs}
      >
        <SaveAll size={16} aria-hidden="true" />
        <span>{t("saveAs")}</span>
      </button>
      <div className="toolbar__separator" />
      <button
        className="toolbar__button"
        type="button"
        aria-label={t("search")}
        title={tip(t("search"), "Ctrl+F")}
        onClick={onSearch}
      >
        <Search size={16} aria-hidden="true" />
        <span>{t("search")}</span>
      </button>
      <button
        className="toolbar__iconButton"
        type="button"
        aria-label={t("undo")}
        title={tip(t("undo"), "Ctrl+Z")}
        disabled={!canUndo}
        onClick={onUndo}
      >
        <Undo2 size={16} aria-hidden="true" />
      </button>
      <button
        className="toolbar__iconButton"
        type="button"
        aria-label={t("redo")}
        title={tip(t("redo"), "Ctrl+Y")}
        disabled={!canRedo}
        onClick={onRedo}
      >
        <Redo2 size={16} aria-hidden="true" />
      </button>
      <div className="toolbar__separator" />
      <button
        className="toolbar__button"
        type="button"
        aria-label={t("insertRow")}
        title={t("insertRow")}
        onClick={onInsertRow}
      >
        <Rows3 size={16} aria-hidden="true" />
        <span>{t("insertRow")}</span>
      </button>
      <button
        className="toolbar__button"
        type="button"
        aria-label={t("insertColumn")}
        title={t("insertColumn")}
        onClick={onInsertColumn}
      >
        <Columns3 size={16} aria-hidden="true" />
        <span>{t("insertColumn")}</span>
      </button>
      <button
        className="toolbar__button toolbar__button--danger"
        type="button"
        aria-label={t("deleteRow")}
        title={t("deleteRow")}
        disabled={!canDeleteRow}
        onClick={onDeleteRow}
      >
        <Trash2 size={16} aria-hidden="true" />
        <span>{t("deleteRow")}</span>
      </button>
      <button
        className="toolbar__button toolbar__button--danger"
        type="button"
        aria-label={t("deleteCol")}
        title={t("deleteCol")}
        disabled={!canDeleteColumn}
        onClick={onDeleteColumn}
      >
        <Trash2 size={16} aria-hidden="true" />
        <span>{t("deleteCol")}</span>
      </button>
      <div className="toolbar__separator" />
      <button
        className="toolbar__button"
        type="button"
        aria-label={t("autoFit")}
        title={t("autoFit")}
        onClick={onAutoFit}
      >
        <Columns3 size={16} aria-hidden="true" />
        <span>{t("autoFit")}</span>
      </button>
      <button
        className="toolbar__button"
        type="button"
        aria-label={t("aiCopy")}
        title={t("aiCopy")}
        onClick={onAiCopy}
      >
        <Bot size={16} aria-hidden="true" />
        <span>{t("aiCopy")}</span>
      </button>
      <div className="toolbar__spacer" />
      <button
        className="toolbar__iconButton"
        type="button"
        aria-label={t("settings")}
        title={t("settings")}
        onClick={onSettings}
      >
        <Settings size={16} aria-hidden="true" />
      </button>
      <button
        className="toolbar__iconButton"
        type="button"
        aria-label={t("help")}
        title={t("help")}
        onClick={onHelp}
      >
        <CircleHelp size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
