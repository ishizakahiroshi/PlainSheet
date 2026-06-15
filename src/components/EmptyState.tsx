import { FilePlus2, FolderOpen, TableProperties } from "lucide-react";
import { t } from "../lib/i18n";

type EmptyStateProps = {
  onNew: () => void;
  onOpen: () => void;
  onSample: () => void;
};

export function EmptyState({ onNew, onOpen, onSample }: EmptyStateProps) {
  return (
    <main className="emptyState">
      <div className="emptyState__content">
        <h1>{t("appName")}</h1>
        <p>{t("appSubtitle")}</p>
        <div className="emptyState__actions">
          <button type="button" aria-label={t("newSheet")} onClick={onNew}>
            <FilePlus2 size={18} aria-hidden="true" />
            <span>{t("newSheet")}</span>
          </button>
          <button type="button" aria-label={t("openCsv")} onClick={onOpen}>
            <FolderOpen size={18} aria-hidden="true" />
            <span>{t("openCsv")}</span>
          </button>
          <button type="button" aria-label={t("openSample")} onClick={onSample}>
            <TableProperties size={18} aria-hidden="true" />
            <span>{t("openSample")}</span>
          </button>
        </div>
        <div className="emptyState__hint">{t("emptyHint")}</div>
      </div>
    </main>
  );
}
