import type { Locale } from "./i18n";

export type ThemeSetting = "light" | "dark" | "system";

export type AppSettings = {
  theme: ThemeSetting;
  zebra: boolean;
  headerHighlight: boolean;
  locale: Locale;
  zoom: number;
  freezeColumns: number;
  useHeaderRow: boolean;
  recentFiles: string[];
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  zebra: true,
  headerHighlight: true,
  locale: "ja",
  zoom: 1,
  freezeColumns: 0,
  useHeaderRow: true,
  recentFiles: [],
};

export const SETTINGS_STORAGE_KEY = "plainsheet.settings";
export const MAX_RECENT_FILES = 10;
export const MIN_ZOOM = 0.7;
export const MAX_ZOOM = 1.6;
export const ZOOM_STEP = 0.1;

function clampZoom(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SETTINGS.zoom;
  }
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 10) / 10));
}

function normalizeRecentFiles(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string" || entry.trim() === "" || seen.has(entry)) {
      continue;
    }
    seen.add(entry);
    result.push(entry);
    if (result.length >= MAX_RECENT_FILES) {
      break;
    }
  }
  return result;
}

function normalizeSettings(raw: Partial<AppSettings> | null | undefined): AppSettings {
  const theme =
    raw?.theme === "light" || raw?.theme === "dark" || raw?.theme === "system"
      ? raw.theme
      : DEFAULT_SETTINGS.theme;
  const locale = raw?.locale === "en" || raw?.locale === "ja" ? raw.locale : DEFAULT_SETTINGS.locale;
  const freezeColumns =
    typeof raw?.freezeColumns === "number" && Number.isFinite(raw.freezeColumns) && raw.freezeColumns >= 0
      ? Math.floor(raw.freezeColumns)
      : DEFAULT_SETTINGS.freezeColumns;

  return {
    theme,
    zebra: typeof raw?.zebra === "boolean" ? raw.zebra : DEFAULT_SETTINGS.zebra,
    headerHighlight:
      typeof raw?.headerHighlight === "boolean" ? raw.headerHighlight : DEFAULT_SETTINGS.headerHighlight,
    locale,
    zoom: clampZoom(typeof raw?.zoom === "number" ? raw.zoom : DEFAULT_SETTINGS.zoom),
    freezeColumns,
    useHeaderRow:
      typeof raw?.useHeaderRow === "boolean" ? raw.useHeaderRow : DEFAULT_SETTINGS.useHeaderRow,
    recentFiles: normalizeRecentFiles(raw?.recentFiles),
  };
}

export function loadSettings(): AppSettings {
  if (typeof localStorage === "undefined") {
    return { ...DEFAULT_SETTINGS, recentFiles: [] };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS, recentFiles: [] };
    }
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return normalizeSettings(parsed);
  } catch {
    return { ...DEFAULT_SETTINGS, recentFiles: [] };
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalizeSettings(settings)));
  } catch {
    // Quota or private mode — ignore so the UI still works in-memory.
  }
}

export function pushRecentFile(recentFiles: string[], path: string): string[] {
  const trimmed = path.trim();
  if (trimmed === "") {
    return recentFiles;
  }
  return [trimmed, ...recentFiles.filter((entry) => entry !== trimmed)].slice(0, MAX_RECENT_FILES);
}
