import { ChevronDown, ChevronUp, Replace, X } from "lucide-react";
import { t } from "../lib/i18n";

export type SearchOptions = {
  regex: boolean;
  caseSensitive: boolean;
};

type SearchPanelProps = {
  open: boolean;
  query: string;
  replacement: string;
  options: SearchOptions;
  current: number;
  total: number;
  onQueryChange: (value: string) => void;
  onReplacementChange: (value: string) => void;
  onOptionsChange: (options: SearchOptions) => void;
  onNext: () => void;
  onPrevious: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
  onClose: () => void;
};

export function SearchPanel({
  open,
  query,
  replacement,
  options,
  current,
  total,
  onQueryChange,
  onReplacementChange,
  onOptionsChange,
  onNext,
  onPrevious,
  onReplace,
  onReplaceAll,
  onClose,
}: SearchPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <aside className="searchPanel" aria-label={t("search")}>
      <input
        aria-label={t("findPlaceholder")}
        value={query}
        placeholder={t("findPlaceholder")}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.shiftKey) {
            onPrevious();
          } else if (event.key === "Enter") {
            onNext();
          } else if (event.key === "Escape") {
            onClose();
          }
        }}
      />
      <input
        aria-label={t("replacePlaceholder")}
        value={replacement}
        placeholder={t("replacePlaceholder")}
        onChange={(event) => onReplacementChange(event.target.value)}
      />
      <label className="checkControl">
        <input
          aria-label={t("regex")}
          type="checkbox"
          checked={options.regex}
          onChange={(event) => onOptionsChange({ ...options, regex: event.target.checked })}
        />
        <span>{t("regex")}</span>
      </label>
      <label className="checkControl">
        <input
          aria-label={t("caseSensitive")}
          type="checkbox"
          checked={options.caseSensitive}
          onChange={(event) => onOptionsChange({ ...options, caseSensitive: event.target.checked })}
        />
        <span>{t("caseSensitive")}</span>
      </label>
      <div className="searchPanel__count">
        {total === 0 ? t("noMatches") : t("matchCount", { current: current + 1, total })}
      </div>
      <button type="button" className="toolbar__iconButton" aria-label={t("previous")} onClick={onPrevious}>
        <ChevronUp size={16} aria-hidden="true" />
      </button>
      <button type="button" className="toolbar__iconButton" aria-label={t("next")} onClick={onNext}>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <button type="button" className="toolbar__button" aria-label={t("replace")} onClick={onReplace}>
        <Replace size={15} aria-hidden="true" />
        <span>{t("replace")}</span>
      </button>
      <button type="button" className="toolbar__button" aria-label={t("replaceAll")} onClick={onReplaceAll}>
        <Replace size={15} aria-hidden="true" />
        <span>{t("replaceAll")}</span>
      </button>
      <button type="button" className="toolbar__iconButton" aria-label={t("close")} onClick={onClose}>
        <X size={16} aria-hidden="true" />
      </button>
    </aside>
  );
}
