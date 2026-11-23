import { ask } from "@tauri-apps/plugin-dialog";
import { isTauriRuntime } from "../hooks/useFile";
import { t } from "./i18n";

/**
 * Asks the user to confirm an action that would discard unsaved work.
 *
 * Desktop builds must not use window.confirm: tauri-plugin-dialog replaces it
 * with an async function, so `!window.confirm(...)` is always false and every
 * "discard unsaved changes?" guard silently lets the action through. The
 * plugin's `ask` dialog is awaited instead. A dialog that cannot be shown
 * counts as "No" so the unsaved work is kept.
 */
export async function confirmDiscard(message: string): Promise<boolean> {
  if (!isTauriRuntime()) {
    return window.confirm(message);
  }
  try {
    return await ask(message, { title: t("appName"), kind: "warning" });
  } catch {
    return false;
  }
}
