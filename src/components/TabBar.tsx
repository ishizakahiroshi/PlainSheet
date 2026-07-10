import { Plus, X } from "lucide-react";
import { t } from "../lib/i18n";
import type { DocumentSnapshot } from "../hooks/useDocuments";

type TabBarProps = {
  documents: DocumentSnapshot[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
};

export function TabBar({ documents, activeId, onSelect, onClose, onNew }: TabBarProps) {
  return (
    <div className="tabBar" role="tablist" aria-label={t("tabsLabel")}>
      <div className="tabBar__tabs">
        {documents.map((doc) => {
          const active = doc.id === activeId;
          const label = doc.meta.fileName ?? t("untitled");
          return (
            <div
              key={doc.id}
              className={`tabBar__tab${active ? " tabBar__tab--active" : ""}`}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(doc.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(doc.id);
                }
              }}
            >
              <span className="tabBar__label" title={doc.meta.filePath ?? label}>
                {doc.meta.dirty ? "● " : ""}
                {label}
              </span>
              {documents.length > 1 ? (
                <button
                  type="button"
                  className="tabBar__close"
                  aria-label={t("closeTab")}
                  onClick={(event) => {
                    event.stopPropagation();
                    onClose(doc.id);
                  }}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      <button type="button" className="tabBar__add" aria-label={t("newTab")} onClick={onNew}>
        <Plus size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
