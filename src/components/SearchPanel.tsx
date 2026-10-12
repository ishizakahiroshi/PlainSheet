import { ChevronDown, ChevronUp, Replace, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ActionButton } from "./ActionButton";
import { t } from "../lib/i18n";

export type SearchOptions = {
  regex: boolean;
  caseSensitive: boolean;
  wholeCell?: boolean;
  groups?: boolean;
};

type SearchPanelProps = {
  open: boolean;
  filtered?: boolean;
  focusNonce?: number;
  error?: string | null;
  scope?: "sheet" | "visible" | "selection";
  scopeLabel?: string;
  onScopeChange?: (scope: "sheet" | "visible" | "selection") => void;
  query: string;
  replacement: string;
  options: SearchOptions;
  current: number;
  total: number;
  navigationTotal?: number;
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
  focusNonce = 0,
  error,
  scope,
  scopeLabel,
  onScopeChange,
  query,
  replacement,
  options,
  current,
  total,
  navigationTotal = total,
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
  const composing = useRef(false);

  useEffect(() => {
    if (open) {
      // Ctrl+F / Ctrl+H should land keystrokes in the find box, not the grid.
      findInputRef.current?.focus();
      findInputRef.current?.select();
    }
  }, [open, focusNonce]);

  if (!open) {
    return null;
  }

  return (
    <aside
      className="searchPanel"
      aria-label={t("search")}
      onKeyDown={(e) => {
        if (e.nativeEvent.isComposing || e.keyCode === 229) e.stopPropagation();
      }}
    >
      <span className="searchPanel__scope">
        {filtered ? t("searchVisibleScope") : t("searchAllScope")}
      </span>
      {onScopeChange && (
        <label>
          対象 / Scope{" "}
          <select
            value={scope}
            onChange={(e) => onScopeChange(e.target.value as "sheet" | "visible" | "selection")}
          >
            <option value="sheet">全表（非表示行を含む） / All cells</option>
            <option value="visible">表示行 / Visible rows</option>
            <option value="selection">選択を固定 / Freeze selection</option>
          </select>
        </label>
      )}
      {scopeLabel && <span>{scopeLabel}</span>}
      <input
        ref={findInputRef}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "search-error" : undefined}
        aria-label={t("findPlaceholder")}
        value={query}
        placeholder={t("findPlaceholder")}
        onChange={(event) => onQueryChange(event.target.value)}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          composing.current = false;
        }}
        onKeyDown={(event) => {
          if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) {
            event.stopPropagation();
            return;
          }
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
      <label>
        <input
          type="checkbox"
          checked={Boolean(options.wholeCell)}
          onChange={(e) => onOptionsChange({ ...options, wholeCell: e.target.checked })}
        />
        セル全体一致 / Whole cell
      </label>
      <label>
        <input
          type="checkbox"
          checked={Boolean(options.groups)}
          disabled={!options.regex}
          onChange={(e) => onOptionsChange({ ...options, groups: e.target.checked })}
        />
        置換の群参照 / Capture references
      </label>
      <span>
        {options.regex && options.groups
          ? "$1/$2: group, $$: $, missing group: literal"
          : "置換は入力文字列そのまま / Literal replacement"}
      </span>
      {error && (
        <span id="search-error" role="status" className="featureError">
          {error}
        </span>
      )}
      <div className="searchPanel__count">
        {error
          ? "入力を修正 / Correct the query"
          : query === ""
            ? "未入力 / Enter a query"
            : total === 0
              ? t("noMatches")
              : navigationTotal < total
                ? t("limitedMatchCount", {
                    current: current + 1,
                    navigation: navigationTotal,
                    total,
                  })
                : t("matchCount", { current: current + 1, total })}
      </div>
      {navigationTotal < total && (
        <span className="searchPanel__scope">
          {t("limitedMatchScope", { navigation: navigationTotal, total })}
        </span>
      )}
      <ActionButton
        type="button"
        className="toolbar__iconButton"
        aria-label={t("previous")}
        tooltip={`${t("previous")} (Shift+Enter)`}
        disabled={navigationTotal === 0 || Boolean(error)}
        onClick={onPrevious}
      >
        <ChevronUp size={16} aria-hidden="true" />
      </ActionButton>
      <ActionButton
        type="button"
        className="toolbar__iconButton"
        aria-label={t("next")}
        tooltip={`${t("next")} (Enter)`}
        disabled={navigationTotal === 0 || Boolean(error)}
        onClick={onNext}
      >
        <ChevronDown size={16} aria-hidden="true" />
      </ActionButton>
      <ActionButton
        type="button"
        className="toolbar__button"
        aria-label={t("replace")}
        tooltip={t("replace")}
        disabled={navigationTotal === 0 || Boolean(error)}
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
        disabled={total === 0 || Boolean(error)}
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
