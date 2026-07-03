import { Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauriRuntime } from "../hooks/useFile";
import { t } from "../lib/i18n";
import type { SheetMeta } from "../types/sheet";

type TitleBarProps = {
  meta: SheetMeta;
};

export function TitleBar({ meta }: TitleBarProps) {
  const title = `${meta.dirty ? "● " : ""}${meta.fileName ?? t("appName")}`;
  const showWindowControls = isTauriRuntime();

  return (
    <header className="titleBar" data-tauri-drag-region>
      <div className="titleBar__brand" data-tauri-drag-region>
        {t("appName")}
      </div>
      <div className="titleBar__file" data-tauri-drag-region>
        {title}
      </div>
      {showWindowControls && (
        <div className="titleBar__controls">
          <button
            type="button"
            className="titleBar__control"
            aria-label={t("windowMinimize")}
            onClick={() => void getCurrentWindow().minimize()}
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            className="titleBar__control"
            aria-label={t("windowMaximize")}
            onClick={() => void getCurrentWindow().toggleMaximize()}
          >
            <Square size={12} />
          </button>
          <button
            type="button"
            className="titleBar__control titleBar__control--close"
            aria-label={t("windowClose")}
            onClick={() => void getCurrentWindow().close()}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </header>
  );
}
