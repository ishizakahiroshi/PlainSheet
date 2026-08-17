import { useCallback, useState } from "react";
import {
  loadSettings,
  saveSettings,
  type AppSettings,
} from "../lib/settings";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  const update = useCallback(
    (patch: Partial<AppSettings> | ((current: AppSettings) => Partial<AppSettings>)) => {
      setSettings((current) => {
        const resolved = typeof patch === "function" ? patch(current) : patch;
        const next = { ...current, ...resolved };
        saveSettings(next);
        return next;
      });
    },
    [],
  );

  return { settings, update };
}
