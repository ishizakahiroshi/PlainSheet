import {
  CircleHelp,
  Clipboard,
  Columns3,
  Download,
  FileDown,
  FilePenLine,
  FilePlus2,
  FolderOpen,
  Rows3,
  Redo2,
  Save,
  Search,
  Settings,
  Undo2,
  Minus,
  Plus,
  MoveHorizontal,
} from "lucide-react";
import { t } from "../lib/i18n";
import { ActionButton } from "./ActionButton";

type ToolbarProps = {
  canUndo: boolean;
  canRedo: boolean;
  saving?: boolean;
  browser?: boolean;
  rowOpsDisabled?: boolean;
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
  onCopy: () => void;
  onSettings: () => void;
  onHelp: () => void;
};

export function Toolbar(p: ToolbarProps) {
  const SaveIcon = p.browser ? Download : Save;
  const SaveAsIcon = p.browser ? FileDown : FilePenLine;
  const saveLabel = p.saving ? t("saving") : p.browser ? t("download") : t("save");
  const saveAsLabel = p.browser ? t("downloadAs") : t("saveAs");
  return (
    <nav className="toolbar" aria-label={t("toolbarLabel")}>
      <div className="toolbar__group" role="group" aria-label={t("fileActions")}>
        <ActionButton
          className="toolbar__button"
          type="button"
          aria-label={t("newSheet")}
          tooltip={t("newSheet")}
          onClick={p.onNew}
        >
          <FilePlus2 size={16} aria-hidden="true" />
          <span>{t("newFile")}</span>
        </ActionButton>
        <ActionButton
          className="toolbar__button"
          type="button"
          aria-label={t("open")}
          tooltip={`${t("open")} (Ctrl+O)`}
          onClick={p.onOpen}
        >
          <FolderOpen size={16} aria-hidden="true" />
          <span>{t("open")}</span>
        </ActionButton>
        <ActionButton
          className="toolbar__button toolbar__button--primary"
          type="button"
          aria-label={saveLabel}
          tooltip={`${saveLabel} (Ctrl+S)`}
          disabled={p.saving}
          onClick={p.onSave}
        >
          <SaveIcon size={16} aria-hidden="true" />
          <span>{saveLabel}</span>
        </ActionButton>
        <ActionButton
          className="toolbar__button"
          type="button"
          aria-label={saveAsLabel}
          tooltip={`${saveAsLabel} (Ctrl+Shift+S)`}
          disabled={p.saving}
          onClick={p.onSaveAs}
        >
          <SaveAsIcon size={16} aria-hidden="true" />
          <span>{saveAsLabel}</span>
        </ActionButton>
      </div>
      <div className="toolbar__group" role="group" aria-label={t("editActions")}>
        <ActionButton
          className="toolbar__button"
          type="button"
          aria-label={t("search")}
          tooltip={`${t("search")} (Ctrl+F)`}
          onClick={p.onSearch}
        >
          <Search size={16} aria-hidden="true" />
          <span>{t("search")}</span>
        </ActionButton>
        <ActionButton
          className="toolbar__iconButton"
          type="button"
          aria-label={t("undo")}
          tooltip={`${t("undo")} (Ctrl+Z)`}
          disabled={!p.canUndo}
          onClick={p.onUndo}
        >
          <Undo2 size={16} aria-hidden="true" />
        </ActionButton>
        <ActionButton
          className="toolbar__iconButton"
          type="button"
          aria-label={t("redo")}
          tooltip={`${t("redo")} (Ctrl+Y / Ctrl+Shift+Z)`}
          disabled={!p.canRedo}
          onClick={p.onRedo}
        >
          <Redo2 size={16} aria-hidden="true" />
        </ActionButton>
        <ActionButton
          className="toolbar__button"
          type="button"
          aria-label={t("copyPlainText")}
          tooltip={`${t("copyPlainText")} (Ctrl+C)`}
          onClick={p.onCopy}
        >
          <Clipboard size={16} aria-hidden="true" />
          <span>{t("copyPlainText")}</span>
        </ActionButton>
      </div>
      <div className="toolbar__group" role="group" aria-label={t("structureActions")}>
        <ActionButton
          className="toolbar__button"
          type="button"
          aria-label={t("insertRow")}
          tooltip={p.rowOpsDisabled ? t("toastFilterBlocksRowOps") : t("insertRow")}
          disabled={p.rowOpsDisabled}
          onClick={p.onInsertRow}
        >
          <Rows3 size={16} aria-hidden="true" />
          <Plus size={11} aria-hidden="true" />
          <span>{t("insertRow")}</span>
        </ActionButton>
        <ActionButton
          className="toolbar__button"
          type="button"
          aria-label={t("insertColumn")}
          tooltip={p.rowOpsDisabled ? t("toastFilterBlocksRowOps") : t("insertColumn")}
          disabled={p.rowOpsDisabled}
          onClick={p.onInsertColumn}
        >
          <Columns3 size={16} aria-hidden="true" />
          <Plus size={11} aria-hidden="true" />
          <span>{t("insertColumn")}</span>
        </ActionButton>
        <ActionButton
          className="toolbar__button toolbar__button--danger"
          type="button"
          aria-label={t("deleteRow")}
          tooltip={p.rowOpsDisabled ? t("toastFilterBlocksRowOps") : t("deleteRow")}
          disabled={p.rowOpsDisabled}
          onClick={p.onDeleteRow}
        >
          <Rows3 size={16} aria-hidden="true" />
          <Minus size={11} aria-hidden="true" />
          <span>{t("deleteRow")}</span>
        </ActionButton>
        <ActionButton
          className="toolbar__button toolbar__button--danger"
          type="button"
          aria-label={t("deleteCol")}
          tooltip={p.rowOpsDisabled ? t("toastFilterBlocksRowOps") : t("deleteCol")}
          disabled={p.rowOpsDisabled}
          onClick={p.onDeleteColumn}
        >
          <Columns3 size={16} aria-hidden="true" />
          <Minus size={11} aria-hidden="true" />
          <span>{t("deleteCol")}</span>
        </ActionButton>
      </div>
      <div className="toolbar__group" role="group" aria-label={t("viewActions")}>
        <ActionButton
          className="toolbar__button"
          type="button"
          aria-label={t("autoFit")}
          tooltip={t("autoFit")}
          onClick={p.onAutoFit}
        >
          <MoveHorizontal size={16} aria-hidden="true" />
          <span>{t("autoFit")}</span>
        </ActionButton>
        <ActionButton
          className="toolbar__iconButton"
          type="button"
          aria-label={t("settings")}
          tooltip={t("settings")}
          onClick={p.onSettings}
        >
          <Settings size={16} aria-hidden="true" />
        </ActionButton>
        <ActionButton
          className="toolbar__iconButton"
          type="button"
          aria-label={t("help")}
          tooltip={t("help")}
          onClick={p.onHelp}
        >
          <CircleHelp size={16} aria-hidden="true" />
        </ActionButton>
      </div>
    </nav>
  );
}
