import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toolbar } from "../components/Toolbar";
import { FilterPopover } from "../components/FilterPopover";
import { SettingsModal } from "../components/SettingsModal";
import { StatusBar } from "../components/StatusBar";
import { TitleBar } from "../components/TitleBar";
import { TabBar } from "../components/TabBar";
import { HelpModal } from "../components/HelpModal";
import { DEFAULT_META } from "../types/sheet";
import { createDocument } from "../hooks/useDocuments";
import { t } from "../lib/i18n";

const native = vi.hoisted(() => ({
  close: vi.fn().mockResolvedValue(undefined),
  minimize: vi.fn().mockResolvedValue(undefined),
  toggleMaximize: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@tauri-apps/api/window", () => ({ getCurrentWindow: () => native }));
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, "__TAURI_INTERNALS__");
  vi.clearAllMocks();
});
const toolbar = {
  canUndo: true,
  canRedo: false,
  onNew: vi.fn(),
  onOpen: vi.fn(),
  onSave: vi.fn(),
  onSaveAs: vi.fn(),
  onSearch: vi.fn(),
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  onInsertRow: vi.fn(),
  onInsertColumn: vi.fn(),
  onDeleteRow: vi.fn(),
  onDeleteColumn: vi.fn(),
  onAutoFit: vi.fn(),
  onCopy: vi.fn(),
  onSettings: vi.fn(),
  onHelp: vi.fn(),
};

describe("edition-specific names and keyboard discoverability", () => {
  it("uses Download/Download as for browser and presents a keyboard-focus tooltip", () => {
    render(<Toolbar {...toolbar} browser />);
    const download = screen.getByRole("button", { name: t("download") });
    expect(download).toHaveTextContent(t("download"));
    expect(screen.getByRole("button", { name: t("downloadAs") })).toBeEnabled();
    fireEvent.focus(download);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Ctrl+S");
    expect(download).toHaveAttribute("aria-describedby", screen.getByRole("tooltip").id);
    expect(screen.queryByText(t("aiCopy"))).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("copyPlainText") })).toBeEnabled();
  });
  it("uses Save/Save as for the app and disables structure operations while filtered", () => {
    render(<Toolbar {...toolbar} rowOpsDisabled />);
    expect(screen.getByRole("button", { name: t("save") })).toBeEnabled();
    expect(screen.getByRole("button", { name: t("saveAs") })).toBeEnabled();
    expect(screen.getByRole("button", { name: t("deleteRow") })).toBeDisabled();
    expect(screen.getByRole("button", { name: t("deleteCol") })).toBeDisabled();
  });
  it("retains unshown filter choices while searching values and presents per-value counts", () => {
    const apply = vi.fn();
    render(
      <FilterPopover
        state={{ col: 0, x: 0, y: 0 }}
        rows={[["A"], ["A"], ["B"]]}
        selected={null}
        onApply={apply}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("checkbox", { name: t("filterValueCount", { value: "A", count: 2 }) }),
    ).toBeChecked();
    fireEvent.change(screen.getByRole("textbox", { name: t("filterValuesSearch") }), {
      target: { value: "A" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: t("filterValueCount", { value: "A", count: 2 }) }),
    );
    fireEvent.click(screen.getByRole("button", { name: t("filterApply") }));
    expect(apply).toHaveBeenCalledWith(0, new Set(["B"]));
  });
  it("counts only visible selected rows and does not label browser state as saved to the original", () => {
    render(
      <StatusBar
        rows={[["head"], ["1"], ["hidden"], ["2"]]}
        columnCount={1}
        selection={{ row: 1, col: 0 }}
        range={{ startRow: 1, startCol: 0, endRow: 3, endCol: 0 }}
        meta={DEFAULT_META}
        visibleSourceRows={[0, 1, 3]}
        browser
      />,
    );
    expect(screen.getByText(t("filteredCount", { visible: 3, total: 4 }))).toBeInTheDocument();
    expect(screen.getByText(t("selectedRange", { rows: 2, cols: 1 }))).toBeInTheDocument();
    expect(screen.getByText(t("originalUnchanged"))).toBeInTheDocument();
    expect(screen.queryByText(t("saved"))).not.toBeInTheDocument();
  });
  it("keeps duplicate filenames distinguishable and lets arrow keys select tabs", () => {
    const a = createDocument([["a"]], { fileName: "same.csv", filePath: "/a/same.csv" });
    const b = createDocument([["b"]], { fileName: "same.csv", filePath: "/b/same.csv" });
    const select = vi.fn();
    render(
      <TabBar
        documents={[a, b]}
        activeId={a.id}
        onSelect={select}
        onClose={vi.fn()}
        onNew={vi.fn()}
      />,
    );
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveTextContent("same.csv · 1");
    expect(tabs[1]).toHaveTextContent("same.csv · 2");
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(select).toHaveBeenCalledWith(b.id);
    expect(tabs[1]).toHaveFocus();
  });
  it("guards the custom native title-bar close without using destroy", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", { value: {}, configurable: true });
    const beforeClose = vi.fn().mockReturnValue(false);
    const view = render(<TitleBar meta={DEFAULT_META} beforeClose={beforeClose} />);
    fireEvent.click(screen.getByRole("button", { name: t("windowClose") }));
    expect(native.close).not.toHaveBeenCalled();
    beforeClose.mockReturnValue(true);
    view.rerender(<TitleBar meta={DEFAULT_META} beforeClose={beforeClose} />);
    fireEvent.click(screen.getByRole("button", { name: t("windowClose") }));
    expect(native.close).toHaveBeenCalledOnce();
  });
  it("keeps browser encoding controls honest while preserving app encoding choices", () => {
    const p = {
      open: true,
      encoding: "utf-8" as const,
      newline: "LF" as const,
      zebra: false,
      headerHighlight: false,
      csvFormulaGuard: false,
      omitEmptyCells: false,
      theme: "light" as const,
      onEncodingChange: vi.fn(),
      onNewlineChange: vi.fn(),
      onZebraChange: vi.fn(),
      onHeaderHighlightChange: vi.fn(),
      onCsvFormulaGuardChange: vi.fn(),
      onOmitEmptyCellsChange: vi.fn(),
      onThemeChange: vi.fn(),
      onClose: vi.fn(),
    };
    const view = render(<SettingsModal {...p} browser />);
    expect(screen.getByRole("option", { name: "Shift_JIS" })).toBeDisabled();
    view.rerender(<SettingsModal {...p} browser={false} />);
    expect(screen.getByRole("option", { name: "Shift_JIS" })).toBeEnabled();
    expect(screen.getByRole("option", { name: "UTF-8 BOM" })).toBeEnabled();
  });
  it("focuses Help and includes save, newline and saved-order behavior", () => {
    render(<HelpModal open onClose={vi.fn()} />);
    const close = screen.getByRole("button", { name: t("close") });
    expect(close).toHaveFocus();
    expect(screen.getByText(t("sortSaveHelp"))).toBeInTheDocument();
    expect(screen.getByText(t("editNavigationHelp"))).toBeInTheDocument();
    fireEvent.keyDown(close, { key: "Tab" });
    expect(close).toHaveFocus();
  });
});
