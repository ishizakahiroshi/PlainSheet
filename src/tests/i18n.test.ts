import { afterEach, describe, expect, it } from "vitest";
import { getLocale, listLocales, setLocale, t } from "../lib/i18n";

afterEach(() => {
  setLocale("ja");
});

describe("i18n", () => {
  it("defaults to Japanese", () => {
    expect(getLocale()).toBe("ja");
    expect(t("open")).toBe("開く");
  });

  it("switches locale", () => {
    setLocale("en");
    expect(t("open")).toBe("Open");
  });

  it("interpolates values", () => {
    expect(t("rowsCols", { rows: 2, cols: 3 })).toBe("2行 × 3列");
  });

  it("lists supported locales", () => {
    expect(listLocales()).toEqual(["ja", "en"]);
  });
});
