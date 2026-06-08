import { t } from "../lib/i18n";
import type { SheetMeta } from "../types/sheet";

type TitleBarProps = {
  meta: SheetMeta;
};

export function TitleBar({ meta }: TitleBarProps) {
  const title = `${meta.dirty ? "● " : ""}${meta.fileName ?? t("appName")}`;
  return (
    <header className="titleBar" data-tauri-drag-region>
      <div className="titleBar__brand" data-tauri-drag-region>
        {t("appName")}
      </div>
      <div className="titleBar__file" data-tauri-drag-region>
        {title}
      </div>
    </header>
  );
}
