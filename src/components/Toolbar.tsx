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

export function Toolbar({
  canUndo,
  canRedo,
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
      <button className="toolbar__button" type="button" aria-label={t("newSheet")} onClick={onNew}>
        <FilePlus2 size={16} aria-hidden="true" />
        <span>{t("newFile")}</span>
      </button>
      <button className="toolbar__button" type="button" aria-label={t("open")} onClick={onOpen}>
        <FolderOpen size={16} aria-hidden="true" />
        <span>{t("open")}</span>
      </button>
      <button className="toolbar__button" type="button" aria-label={t("save")} onClick={onSave}>
        <Save size={16} aria-hidden="true" />
        <span>{t("save")}</span>
      </button>
      <button className="toolbar__button" type="button" aria-label={t("saveAs")} onClick={onSaveAs}>
        <SaveAll size={16} aria-hidden="true" />
        <span>{t("saveAs")}</span>
      </button>
      <div className="toolbar__separator" />
      <button className="toolbar__button" type="button" aria-label={t("search")} onClick={onSearch}>
        <Search size={16} aria-hidden="true" />
        <span>{t("search")}</span>
      </button>
      <button
        className="toolbar__iconButton"
        type="button"
        aria-label={t("undo")}
        disabled={!canUndo}
        onClick={onUndo}
      >
        <Undo2 size={16} aria-hidden="true" />
      </button>
      <button
        className="toolbar__iconButton"
        type="button"
        aria-label={t("redo")}
        disabled={!canRedo}
        onClick={onRedo}
      >
        <Redo2 size={16} aria-hidden="true" />
      </button>
      <div className="toolbar__separator" />
      <button className="toolbar__button" type="button" aria-label={t("insertRow")} onClick={onInsertRow}>
        <Rows3 size={16} aria-hidden="true" />
        <span>{t("insertRow")}</span>
      </button>
      <button className="toolbar__button" type="button" aria-label={t("insertColumn")} onClick={onInsertColumn}>
        <Columns3 size={16} aria-hidden="true" />
        <span>{t("insertColumn")}</span>
      </button>
      <button className="toolbar__button toolbar__button--danger" type="button" aria-label={t("deleteRow")} onClick={onDeleteRow}>
        <Trash2 size={16} aria-hidden="true" />
        <span>{t("deleteRow")}</span>
      </button>
      <button className="toolbar__button toolbar__button--danger" type="button" aria-label={t("deleteCol")} onClick={onDeleteColumn}>
        <Trash2 size={16} aria-hidden="true" />
        <span>{t("deleteCol")}</span>
      </button>
      <div className="toolbar__separator" />
      <button className="toolbar__button" type="button" aria-label={t("autoFit")} onClick={onAutoFit}>
        <Columns3 size={16} aria-hidden="true" />
        <span>{t("autoFit")}</span>
      </button>
      <button className="toolbar__button" type="button" aria-label={t("aiCopy")} onClick={onAiCopy}>
        <Bot size={16} aria-hidden="true" />
        <span>{t("aiCopy")}</span>
      </button>
      <div className="toolbar__spacer" />
      <button className="toolbar__iconButton" type="button" aria-label={t("settings")} onClick={onSettings}>
        <Settings size={16} aria-hidden="true" />
      </button>
      <button className="toolbar__iconButton" type="button" aria-label={t("help")} onClick={onHelp}>
        <CircleHelp size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
