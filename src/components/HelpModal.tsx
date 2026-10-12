import { useEffect, useRef, useState } from "react";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { isTauriRuntime } from "../hooks/useFile";
import { shortcutLabel, currentPlatform, type Platform } from "../lib/commands";
import { t } from "../lib/i18n";

type HelpModalProps = {
  open: boolean;
  onClose: () => void;
};

const shortcuts = [
  ["Ctrl+O", "shortcutOpen"],
  ["Ctrl+S / Ctrl+Shift+S", "shortcutSave"],
  ["Ctrl+F", "shortcutSearch"],
  ["Ctrl+H", "shortcutReplace"],
  ["Ctrl+A", "shortcutSelectAll"],
  ["Ctrl+C / Ctrl+X / Ctrl+V", "shortcutCopyPaste"],
  ["Arrows / Tab / Enter", "shortcutNavigate"],
  ["Type / F2 / Double-click", "shortcutEditCell"],
  ["Delete", "shortcutClearCell"],
  ["Ctrl+Z / Ctrl+Y", "shortcutUndoRedo"],
  ["Name box + Enter", "shortcutJump"],
  ["Ctrl+D / Ctrl+R", "shortcutFill"],
  ["Enter / Shift+Enter / Tab / Shift+Tab / Alt+Enter", "editNavigationHelp"],
  ["Ctrl+= / Ctrl+- / Ctrl+0", "shortcutZoom"],
] as const;

export function HelpModal({ open, onClose }: HelpModalProps) {
  const dialog = useRef<HTMLElement>(null);
  const [platform, setPlatform] = useState<Platform>(currentPlatform);
  useDialogFocus(dialog, open);
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.isComposing && event.keyCode !== 229) {
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
        ref={dialog}
        className="modal modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="help-title">{t("helpTitle")}</h2>
        <p>{isTauriRuntime() ? t("appSaveHint") : t("browserSaveHint")}</p>
        <p>{t("sortSaveHelp")}</p>
        <p>{t("searchScopeHelp")}</p>
        <label>
          キー表示 / Platform{" "}
          <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
            <option value="windows">Windows / Linux (Ctrl)</option>
            <option value="mac">macOS (Command)</option>
          </select>
        </label>
        <p>
          macOSのCommand+Hはアプリ非表示のため保持します。OS・ブラウザ・配列によりキーが優先される場合はボタンを使用してください。
        </p>
        <p>
          操作を探す: {shortcutLabel("commands", platform)}
          。列の操作は名前付きボタンまたはShift+F10。
        </p>
        <table className="shortcutTable">
          <tbody>
            {shortcuts.map(([key, label]) => (
              <tr key={key}>
                <th>
                  {key === "Ctrl+H"
                    ? shortcutLabel("replace", platform)
                    : key === "Ctrl+Z / Ctrl+Y"
                      ? `${shortcutLabel("undo", platform)} / ${shortcutLabel("redo", platform)}`
                      : platform === "mac"
                        ? key.replaceAll("Ctrl", "Command")
                        : key}
                </th>
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
