import { Plus, X } from "lucide-react";
import { ActionButton } from "./ActionButton";
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
          const name = doc.meta.fileName ?? t("untitled");
          const duplicates =
            documents.filter((other) => (other.meta.fileName ?? t("untitled")) === name).length > 1;
          const label = duplicates ? `${name} · ${documents.indexOf(doc) + 1}` : name;
          return (
            <div
              key={doc.id}
              className={`tabBar__tab${active ? " tabBar__tab--active" : ""}`}
              role="tab"
              aria-selected={active}
              aria-label={`${label}${doc.meta.filePath ? ` (${doc.meta.filePath})` : ""}${doc.meta.dirty ? ` · ${t("unsaved")}` : ""}`}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(doc.id)}
              onKeyDown={(event) => {
                if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                  event.preventDefault();
                  event.stopPropagation();
                  const index = documents.indexOf(doc);
                  const next =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? documents.length - 1
                        : (index + (event.key === "ArrowRight" ? 1 : -1) + documents.length) %
                          documents.length;
                  onSelect(documents[next].id);
                  event.currentTarget.parentElement
                    ?.querySelectorAll<HTMLElement>('[role="tab"]')
                    [next]?.focus();
                }
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
                <ActionButton
                  type="button"
                  className="tabBar__close"
                  aria-label={t("closeTab")}
                  tooltip={`${t("closeTab")}: ${label}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onClose(doc.id);
                  }}
                >
                  <X size={12} aria-hidden="true" />
                </ActionButton>
              ) : null}
            </div>
          );
        })}
      </div>
      <ActionButton
        type="button"
        className="tabBar__add"
        aria-label={t("newTab")}
        tooltip={t("newTab")}
        onClick={onNew}
      >
        <Plus size={14} aria-hidden="true" />
      </ActionButton>
    </div>
  );
}
