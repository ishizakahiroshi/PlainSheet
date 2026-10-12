export type Platform = "mac" | "windows";
export type CommandId =
  | "new"
  | "open"
  | "save"
  | "saveAs"
  | "find"
  | "replace"
  | "undo"
  | "redo"
  | "copy"
  | "insertRow"
  | "insertColumn"
  | "deleteRow"
  | "deleteColumn"
  | "autoFit"
  | "clearFilter"
  | "columnMenu"
  | "settings"
  | "help";
export type Command = {
  id: CommandId;
  label: string;
  aliases: string;
  target: string;
  disabled?: string;
  run: () => void;
};
export function currentPlatform(): Platform {
  return /Mac|iPhone|iPad/.test(navigator.platform) ? "mac" : "windows";
}
export function shortcutLabel(id: string, platform = currentPlatform()): string {
  const mod = platform === "mac" ? "Command" : "Ctrl";
  const labels: Record<string, string> = {
    open: `${mod}+O`,
    save: `${mod}+S`,
    saveAs: `${mod}+Shift+S`,
    find: `${mod}+F`,
    replace: platform === "mac" ? "Command+Shift+H" : "Ctrl+H",
    undo: `${mod}+Z`,
    redo: platform === "mac" ? "Command+Shift+Z" : "Ctrl+Y",
    copy: `${mod}+C`,
    commands: `${mod}+Shift+P`,
  };
  return labels[id] ?? "";
}
export function shortcutCommand(
  event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey">,
  platform = currentPlatform(),
): CommandId | "commands" | null {
  if (
    event.altKey ||
    (platform === "mac" ? !event.metaKey || event.ctrlKey : !event.ctrlKey || event.metaKey)
  )
    return null;
  const key = event.key.toLowerCase();
  if (key === "h")
    return platform === "mac"
      ? event.shiftKey
        ? "replace"
        : null
      : !event.shiftKey
        ? "replace"
        : null;
  if (key === "p" && event.shiftKey) return "commands";
  if (key === "s") return event.shiftKey ? "saveAs" : "save";
  if (key === "z") return event.shiftKey ? "redo" : "undo";
  if (!event.shiftKey && key === "y" && platform === "windows") return "redo";
  if (event.shiftKey) return null;
  return ({ o: "open", f: "find", c: "copy" } as Record<string, CommandId>)[key] ?? null;
}
export function dispatchCommand(commands: Command[], id: CommandId): boolean {
  const command = commands.find((item) => item.id === id);
  if (!command || command.disabled) return false;
  command.run();
  return true;
}
