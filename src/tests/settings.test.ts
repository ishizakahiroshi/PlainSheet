import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  pushRecentFile,
  saveSettings,
  SETTINGS_STORAGE_KEY,
} from "../lib/settings";

afterEach(() => {
  localStorage.removeItem(SETTINGS_STORAGE_KEY);
});

describe("settings store", () => {
  it("returns defaults when nothing is stored", () => {
    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, recentFiles: [] });
  });

  it("persists and restores settings", () => {
    saveSettings({
      ...DEFAULT_SETTINGS,
      theme: "dark",
      zebra: false,
      zoom: 1.2,
      freezeColumns: 2,
      recentFiles: ["C:/a.csv"],
    });
    expect(loadSettings()).toMatchObject({
      theme: "dark",
      zebra: false,
      zoom: 1.2,
      freezeColumns: 2,
      recentFiles: ["C:/a.csv"],
    });
  });

  it("merges missing keys with defaults", () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ theme: "system" }));
    expect(loadSettings()).toMatchObject({
      theme: "system",
      zebra: DEFAULT_SETTINGS.zebra,
      headerHighlight: DEFAULT_SETTINGS.headerHighlight,
      zoom: DEFAULT_SETTINGS.zoom,
    });
  });

  it("falls back to defaults for broken JSON", () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, "{not-json");
    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, recentFiles: [] });
  });

  it("clamps zoom and freezes invalid values", () => {
    saveSettings({
      ...DEFAULT_SETTINGS,
      zoom: 9,
      freezeColumns: -3,
    } as never);
    const loaded = loadSettings();
    expect(loaded.zoom).toBeLessThanOrEqual(1.6);
    expect(loaded.freezeColumns).toBe(0);
  });

  it("pushes recent files to the front and dedupes", () => {
    expect(pushRecentFile(["a", "b"], "b")).toEqual(["b", "a"]);
    expect(pushRecentFile(["a"], "c")).toEqual(["c", "a"]);
  });
});
