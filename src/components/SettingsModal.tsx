import { useEffect } from "react";
import { t } from "../lib/i18n";
import type { Encoding, Newline } from "../types/sheet";

type SettingsModalProps = {
  open: boolean;
  encoding: Encoding;
  newline: Newline;
  zebra: boolean;
  headerHighlight: boolean;
  csvFormulaGuard: boolean;
  omitEmptyCells: boolean;
  theme: "light" | "dark" | "system";
  onEncodingChange: (encoding: Encoding) => void;
  onNewlineChange: (newline: Newline) => void;
  onZebraChange: (enabled: boolean) => void;
  onHeaderHighlightChange: (enabled: boolean) => void;
  onCsvFormulaGuardChange: (enabled: boolean) => void;
  onOmitEmptyCellsChange: (enabled: boolean) => void;
  onThemeChange: (theme: "light" | "dark" | "system") => void;
  onClose: () => void;
};

export function SettingsModal({
  open,
  encoding,
  newline,
  zebra,
  headerHighlight,
  csvFormulaGuard,
  omitEmptyCells,
  theme,
  onEncodingChange,
  onNewlineChange,
  onZebraChange,
  onHeaderHighlightChange,
  onCsvFormulaGuardChange,
  onOmitEmptyCellsChange,
  onThemeChange,
  onClose,
}: SettingsModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="modalBackdrop" role="presentation" onClick={onClose}>
      <section
        className="modal modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="settings-title">{t("settingsTitle")}</h2>
        <div className="settingsGrid">
          <label>
            <span>{t("encoding")}</span>
            <select
              aria-label={t("encoding")}
              value={encoding}
              onChange={(event) => onEncodingChange(event.target.value as Encoding)}
            >
              <option value="utf-8">UTF-8</option>
              <option value="utf-8-bom">UTF-8 BOM</option>
              <option value="cp932">Shift_JIS</option>
              <option value="euc-jp">EUC-JP</option>
              <option value="latin-1">Latin-1</option>
            </select>
          </label>
          <label>
            <span>{t("newline")}</span>
            <select
              aria-label={t("newline")}
              value={newline}
              onChange={(event) => onNewlineChange(event.target.value as Newline)}
            >
              <option value="LF">LF</option>
              <option value="CRLF">CRLF</option>
            </select>
          </label>
          <label className="checkControl">
            <input
              aria-label={t("zebra")}
              type="checkbox"
              checked={zebra}
              onChange={(event) => onZebraChange(event.target.checked)}
            />
            <span>{t("zebra")}</span>
          </label>
          <label className="checkControl">
            <input
              aria-label={t("headerHighlight")}
              type="checkbox"
              checked={headerHighlight}
              onChange={(event) => onHeaderHighlightChange(event.target.checked)}
            />
            <span>{t("headerHighlight")}</span>
          </label>
          <label className="checkControl">
            <input
              aria-label={t("csvFormulaGuard")}
              type="checkbox"
              checked={csvFormulaGuard}
              onChange={(event) => onCsvFormulaGuardChange(event.target.checked)}
            />
            <span>{t("csvFormulaGuard")}</span>
          </label>
          <label className="checkControl">
            <input
              aria-label={t("omitEmptyCells")}
              type="checkbox"
              checked={omitEmptyCells}
              onChange={(event) => onOmitEmptyCellsChange(event.target.checked)}
            />
            <span>{t("omitEmptyCells")}</span>
          </label>
          <label>
            <span>{t("theme")}</span>
            <select
              aria-label={t("theme")}
              value={theme}
              onChange={(event) => onThemeChange(event.target.value as "light" | "dark" | "system")}
            >
              <option value="light">{t("light")}</option>
              <option value="dark">{t("dark")}</option>
              <option value="system">{t("system")}</option>
            </select>
          </label>
        </div>
        <div className="modal__actions">
          <button type="button" aria-label={t("close")} onClick={onClose}>
            {t("close")}
          </button>
        </div>
      </section>
    </div>
  );
}
