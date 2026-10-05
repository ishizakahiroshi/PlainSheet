import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { CompactSelection, type DataEditor } from "@glideapps/glide-data-grid";
import App from "../App";
import { t } from "../lib/i18n";

type EditorProps = ComponentProps<typeof DataEditor>;
const capture = vi.hoisted(() => ({ props: null as unknown }));
vi.mock("@glideapps/glide-data-grid", async (importOriginal) => {
  const original = await importOriginal<typeof import("@glideapps/glide-data-grid")>();
  const React = await import("react");
  return {
    ...original,
    DataEditor: React.forwardRef((props: EditorProps, ref) => {
      capture.props = props;
      React.useImperativeHandle(ref, () => ({ scrollTo: vi.fn() }));
      return <div data-testid="canvas-proxy" />;
    }),
  };
});
const editor = () => capture.props as EditorProps;
beforeEach(() => {
  localStorage.clear();
  Reflect.deleteProperty(window, "__TAURI_INTERNALS__");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "1,A,x\n100,B,y\n2,C,z",
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("App and Glide selection history with only the canvas renderer mocked", () => {
  it("shows one selected cell outside existing data without inventing statistics", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: t("openSample") }));
    await waitFor(() => expect(editor().getCellContent([0, 1])).toMatchObject({ data: "100" }));
    act(() =>
      editor().onGridSelectionChange?.({
        rows: CompactSelection.empty(),
        columns: CompactSelection.empty(),
        current: {
          cell: [3, 4],
          range: { x: 3, y: 4, width: 1, height: 1 },
          rangeStack: [],
        },
      }),
    );
    expect(screen.getByText(t("selectedRange", { rows: 1, cols: 1 }))).toBeInTheDocument();
    expect(editor().getCellContent([3, 4])).toMatchObject({ data: "" });
    expect(screen.queryByText(/合計/)).not.toBeInTheDocument();
    act(() =>
      editor().onGridSelectionChange?.({
        rows: CompactSelection.empty().add(4),
        columns: CompactSelection.empty(),
      }),
    );
    expect(screen.getByText(t("selectedRange", { rows: 1, cols: 3 }))).toBeInTheDocument();
    expect(screen.queryByText(/合計/)).not.toBeInTheDocument();
  });
  it.each(["rows", "columns"] as const)(
    "preserves exact %s markers and excludes gaps through Clear, Undo, Clear and Redo",
    async (axis) => {
      render(<App />);
      fireEvent.click(screen.getByRole("button", { name: t("openSample") }));
      await waitFor(() => expect(editor().getCellContent([0, 1])).toMatchObject({ data: "100" }));
      act(() =>
        editor().onGridSelectionChange?.({
          rows: axis === "rows" ? CompactSelection.empty().add(0).add(2) : CompactSelection.empty(),
          columns:
            axis === "columns" ? CompactSelection.empty().add(0).add(2) : CompactSelection.empty(),
        }),
      );
      expect([...editor().gridSelection![axis]]).toEqual([0, 2]);
      if (axis === "rows") {
        expect(screen.getByText(t("selectedRange", { rows: 2, cols: 3 }))).toBeInTheDocument();
        expect(screen.getByText(/合計 3(?:\s|$)/)).toBeInTheDocument();
      }
      const gap: [number, number] = axis === "rows" ? [0, 1] : [1, 1];
      const expectedGap = axis === "rows" ? "100" : "B";
      act(() => {
        editor().onDelete?.(editor().gridSelection!);
      });
      expect(editor().getCellContent(gap)).toMatchObject({ data: expectedGap });
      fireEvent.click(screen.getByRole("button", { name: t("undo") }));
      expect([...editor().gridSelection![axis]]).toEqual([0, 2]);
      expect(editor().getCellContent([0, 0])).toMatchObject({ data: "1" });
      act(() => {
        editor().onDelete?.(editor().gridSelection!);
      });
      expect([...editor().gridSelection![axis]]).toEqual([0, 2]);
      expect(editor().getCellContent([0, 0])).toMatchObject({ data: "" });
      expect(editor().getCellContent(gap)).toMatchObject({ data: expectedGap });
      fireEvent.click(screen.getByRole("button", { name: t("undo") }));
      fireEvent.click(screen.getByRole("button", { name: t("redo") }));
      expect([...editor().gridSelection![axis]]).toEqual([0, 2]);
      expect(editor().getCellContent(gap)).toMatchObject({ data: expectedGap });
    },
  );
});
