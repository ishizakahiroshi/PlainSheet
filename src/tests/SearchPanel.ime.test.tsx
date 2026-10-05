import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SearchPanel } from "../components/SearchPanel";
import { t } from "../lib/i18n";

afterEach(cleanup);
it("separates total matches from bounded navigation and explains the full replacement scope", () => {
  render(
    <SearchPanel
      open
      query="match"
      replacement=""
      options={{ regex: false, caseSensitive: false }}
      current={4999}
      total={5003}
      navigationTotal={5000}
      onQueryChange={vi.fn()}
      onReplacementChange={vi.fn()}
      onOptionsChange={vi.fn()}
      onNext={vi.fn()}
      onPrevious={vi.fn()}
      onReplace={vi.fn()}
      onReplaceAll={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  expect(
    screen.getByText(t("limitedMatchCount", { current: 5000, navigation: 5000, total: 5003 })),
  ).toBeInTheDocument();
  expect(
    screen.getByText(t("limitedMatchScope", { navigation: 5000, total: 5003 })),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: t("replaceAll") })).toBeEnabled();
});
it("does not navigate or close search while Enter/Escape belongs to composition", () => {
  const next = vi.fn();
  const previous = vi.fn();
  const close = vi.fn();
  render(
    <SearchPanel
      open
      query="日本語"
      replacement=""
      options={{ regex: false, caseSensitive: false }}
      current={0}
      total={2}
      onQueryChange={vi.fn()}
      onReplacementChange={vi.fn()}
      onOptionsChange={vi.fn()}
      onNext={next}
      onPrevious={previous}
      onReplace={vi.fn()}
      onReplaceAll={vi.fn()}
      onClose={close}
    />,
  );
  const input = screen.getByRole("textbox", { name: t("findPlaceholder") });
  fireEvent.compositionStart(input);
  expect(fireEvent.keyDown(input, { key: "Enter" })).toBe(true);
  expect(fireEvent.keyDown(input, { key: "Escape" })).toBe(true);
  expect(next).not.toHaveBeenCalled();
  expect(previous).not.toHaveBeenCalled();
  expect(close).not.toHaveBeenCalled();
  fireEvent.compositionEnd(input);
  fireEvent.keyDown(input, { key: "Enter", isComposing: true });
  fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
  expect(next).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: "Enter" });
  fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
  fireEvent.keyDown(input, { key: "Escape" });
  expect(next).toHaveBeenCalledOnce();
  expect(previous).toHaveBeenCalledOnce();
  expect(close).toHaveBeenCalledOnce();
});
