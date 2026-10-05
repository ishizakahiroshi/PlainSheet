import { Minus, Square, X, Table2 } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauriRuntime } from "../hooks/useFile";
import { ActionButton } from "./ActionButton";
import { t } from "../lib/i18n";
import type { SheetMeta } from "../types/sheet";

type TitleBarProps = {
  meta: SheetMeta;
  beforeClose?: () => boolean;
  onCloseFailed?: () => void;
};

export function TitleBar({ meta, beforeClose, onCloseFailed }: TitleBarProps) {
  const title = `${meta.dirty ? "● " : ""}${meta.fileName ?? t("appName")}`;
  const showWindowControls = isTauriRuntime();

  return (
    <header className="titleBar" data-tauri-drag-region>
      <div className="titleBar__brand" data-tauri-drag-region>
        <Table2 size={17} aria-hidden="true" />
        {t("appName")}
        <span className="titleBar__edition">
          {showWindowControls ? t("appEdition") : t("browserEdition")}
        </span>
      </div>
      <div className="titleBar__file" data-tauri-drag-region>
        {title}
      </div>
      {showWindowControls && (
        <div className="titleBar__controls">
          <ActionButton
            type="button"
            className="titleBar__control"
            aria-label={t("windowMinimize")}
            tooltip={t("windowMinimize")}
            onClick={() => void getCurrentWindow().minimize()}
          >
            <Minus size={14} />
          </ActionButton>
          <ActionButton
            type="button"
            className="titleBar__control"
            aria-label={t("windowMaximize")}
            tooltip={t("windowMaximize")}
            onClick={() => void getCurrentWindow().toggleMaximize()}
          >
            <Square size={12} />
          </ActionButton>
          <ActionButton
            type="button"
            className="titleBar__control titleBar__control--close"
            aria-label={t("windowClose")}
            tooltip={t("windowClose")}
            onClick={() => {
              if (beforeClose?.() === false) return;
              void getCurrentWindow()
                .close()
                .catch(() => onCloseFailed?.());
            }}
          >
            <X size={14} />
          </ActionButton>
        </div>
      )}
    </header>
  );
}
