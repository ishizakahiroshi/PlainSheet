import { useEffect } from "react";
import { t } from "../lib/i18n";

type HelpModalProps = {
  open: boolean;
  onClose: () => void;
};

const shortcuts = [
  ["Ctrl+O", "shortcutOpen"],
  ["Ctrl+S", "shortcutSave"],
  ["Ctrl+F", "shortcutSearch"],
  ["Ctrl+H", "shortcutReplace"],
  ["Ctrl+A", "shortcutSelectAll"],
  ["Ctrl+C / Ctrl+V", "shortcutCopyPaste"],
  ["F2", "shortcutEditCell"],
  ["Delete", "shortcutClearCell"],
] as const;

export function HelpModal({ open, onClose }: HelpModalProps) {
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
        aria-labelledby="help-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="help-title">{t("helpTitle")}</h2>
        <table className="shortcutTable">
          <tbody>
            {shortcuts.map(([key, label]) => (
              <tr key={key}>
                <th>{key}</th>
                <td>{t(label)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="modal__actions">
          <button type="button" aria-label={t("close")} onClick={onClose}>
            {t("close")}
          </button>
        </div>
      </section>
    </div>
  );
}
