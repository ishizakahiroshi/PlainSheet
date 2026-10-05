import { ChevronDown, ChevronUp, Replace, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ActionButton } from "./ActionButton";
import { t } from "../lib/i18n";

export type SearchOptions = {
  regex: boolean;
  caseSensitive: boolean;
};

type SearchPanelProps = {
  open: boolean;
  filtered?: boolean;
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
  filtered = false,
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
  const findInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Ctrl+F / Ctrl+H should land keystrokes in the find box, not the grid.
      findInputRef.current?.focus();
      findInputRef.current?.select();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <aside className="searchPanel" aria-label={t("search")}>
      <span className="searchPanel__scope">
        {filtered ? t("searchVisibleScope") : t("searchAllScope")}
      </span>
      <input
        ref={findInputRef}
        aria-label={t("findPlaceholder")}
        value={query}
        placeholder={t("findPlaceholder")}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
          }
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
      <ActionButton
        type="button"
        className="toolbar__iconButton"
        aria-label={t("previous")}
        tooltip={`${t("previous")} (Shift+Enter)`}
        disabled={total === 0}
        onClick={onPrevious}
      >
        <ChevronUp size={16} aria-hidden="true" />
      </ActionButton>
      <ActionButton
        type="button"
        className="toolbar__iconButton"
        aria-label={t("next")}
        tooltip={`${t("next")} (Enter)`}
        disabled={total === 0}
        onClick={onNext}
      >
        <ChevronDown size={16} aria-hidden="true" />
      </ActionButton>
      <ActionButton
        type="button"
        className="toolbar__button"
        aria-label={t("replace")}
        tooltip={t("replace")}
        disabled={total === 0}
        onClick={onReplace}
      >
        <Replace size={15} aria-hidden="true" />
        <span>{t("replace")}</span>
      </ActionButton>
      <ActionButton
        type="button"
        className="toolbar__button"
        aria-label={t("replaceAll")}
        tooltip={t("replaceAll")}
        disabled={total === 0}
        onClick={onReplaceAll}
      >
        <Replace size={15} aria-hidden="true" />
        <span>{t("replaceAll")}</span>
      </ActionButton>
      <ActionButton
        type="button"
        className="toolbar__iconButton"
        aria-label={t("close")}
        tooltip={`${t("close")} (Esc)`}
        onClick={onClose}
      >
        <X size={16} aria-hidden="true" />
      </ActionButton>
    </aside>
  );
}
