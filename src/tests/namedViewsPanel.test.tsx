import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NamedViewsPanel, type NamedViewsPanelProps } from "../components/NamedViewsPanel";
import { createColumnSignature, NAMED_VIEWS_STORAGE_KEY, NamedViewStore, type NamedViewApplication } from "../lib/namedViews";

const rows = [["Region", "Status"], ["East", "Pending"], ["West", "Done"]];
const east = new Map([[0, new Set(["East"])], [1, new Set(["Pending"])]]);
afterEach(() => { cleanup(); localStorage.clear(); });
function props(overrides: Partial<NamedViewsPanelProps> = {}): NamedViewsPanelProps {
  return { documentId: "A", fileName: "orders.csv", rows, filters: east, colWidths: { 0: 160 }, onApply: vi.fn(), onClose: vi.fn(), locale: "en", store: new NamedViewStore(), ...overrides };
}
function save(name: string) {
  fireEvent.change(screen.getByLabelText("New view name"), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: "Save current as new view" }));
}

describe("NamedViewsPanel with the real store", () => {
  it("saves two views, applies exact filters/widths, renames, duplicates, deletes and returns to all rows", () => {
    const store = new NamedViewStore(); const applied = vi.fn();
    const initialRows = JSON.stringify(rows);
    function Harness() {
      const [filters, setFilters] = useState(east); const [widths, setWidths] = useState({ 0: 160 }); const [activeId, setActiveId] = useState<string | null>(null);
      const onApply = (view: NamedViewApplication) => { applied(view); setFilters(new Map(view.filters.map(([col, values]) => [col, new Set(values)]))); setWidths(view.colWidths as { 0: number }); setActiveId(view.id); };
      return <><button onClick={() => { setFilters(new Map([[0, new Set(["West"])], [1, new Set(["Done"])]])); setWidths({ 0: 240 }); }}>West conditions</button><NamedViewsPanel {...props({ store, filters, colWidths: widths, onApply, activeViewId: activeId })} /></>;
    }
    render(<Harness />); save("East pending");
    fireEvent.click(screen.getByRole("button", { name: "West conditions" }));
    expect(screen.getByText(/Current view: East pending \(modified\)/)).toBeInTheDocument();
    save("West done");
    fireEvent.click(screen.getByRole("button", { name: "Apply East pending" }));
    expect(applied).toHaveBeenLastCalledWith(expect.objectContaining({ name: "East pending", filters: [[0, ["East"]], [1, ["Pending"]]], colWidths: { 0: 160 } }));
    expect(screen.getByText(/Current view: East pending · 1 \/ 2 rows shown/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Rename East pending" }));
    fireEvent.change(screen.getByLabelText("Rename to"), { target: { value: "East work" } });
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    fireEvent.click(screen.getByRole("button", { name: "Duplicate East work" }));
    expect(store.document("A").views).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Delete West done" }));
    expect(store.document("A").views).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Show all rows / leave view" }));
    expect(applied).toHaveBeenLastCalledWith({ id: null, name: null, filters: [], colWidths: { 0: 160 } });
    expect(JSON.stringify(rows)).toBe(initialRows); expect(localStorage.getItem(NAMED_VIEWS_STORAGE_KEY)).toBeNull();
  });

  it("reports values no longer present and never silently edits the saved filters", () => {
    const store = new NamedViewStore(); const preset = store.save("A", "North", new Map([[0, new Set(["North"])]]), {}, createColumnSignature(rows));
    render(<NamedViewsPanel {...props({ store, filters: new Map([[0, new Set(["North"])]]), activeViewId: preset.id })} />);
    expect(screen.getByText(/Filter values no longer in this table: Column 1: North/)).toBeInTheDocument();
    expect(screen.getByText(/Current view: North \(modified\) · 0 \/ 2 rows shown/)).toBeInTheDocument();
    expect(store.document("A").views[0].filters).toEqual([[0, ["North"]]]);
  });

  it("disables unsafe schema apply and explains how to recreate a view", () => {
    const store = new NamedViewStore(); store.save("A", "East", east, {}, createColumnSignature(rows));
    render(<NamedViewsPanel {...props({ store, rows: [["Status", "Region"], ["Pending", "East"]] })} />);
    expect(screen.getByRole("button", { name: "Apply East" })).toBeDisabled();
    expect(screen.getByText("Column names or order changed. Recreate this view.")).toBeInTheDocument();
  });

  it("requires explicit no-header position confirmation and invalidates it when data changes", () => {
    const store = new NamedViewStore(); const plain = [["East", "Pending"]];
    store.save("A", "Positional", east, {}, createColumnSignature(plain, false));
    const p = props({ store, rows: plain, headerRow: false });
    const { rerender } = render(<NamedViewsPanel {...p} />);
    expect(screen.getByRole("button", { name: "Apply Positional" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText("I verified that column positions still correspond to the saved conditions"));
    expect(screen.getByRole("button", { name: "Apply Positional" })).toBeEnabled();
    rerender(<NamedViewsPanel {...p} rows={[["Pending", "East"]]} />);
    expect(screen.getByRole("button", { name: "Apply Positional" })).toBeDisabled();
  });

  it("requires selecting a previous document, reviewing schema and confirming import without automatic apply", () => {
    const store = new NamedViewStore(); store.document("old", "orders.csv");
    store.save("old", "East", east, { 0: 160 }, createColumnSignature(rows)); store.setPersistent("old", true);
    const onApply = vi.fn(); render(<NamedViewsPanel {...props({ store, onApply })} />);
    expect(screen.queryByRole("button", { name: "Apply East" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Choose a previously saved document" }));
    const picker = screen.getByLabelText("Saved document group"); expect(picker).toHaveValue("");
    fireEvent.change(picker, { target: { value: store.document("old").id } });
    expect(screen.getByText(/Current columns: 2 · 1: Region · 2: Status/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import reviewed views" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText("This is the intended document and I verified every column's meaning and position"));
    fireEvent.click(screen.getByRole("button", { name: "Import reviewed views" }));
    expect(screen.getByRole("button", { name: "Apply East" })).toBeInTheDocument(); expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Apply East" })); expect(onApply).toHaveBeenCalledTimes(1);
  });

  it("offers explicit persistence/opt-out and cancel-safe all deletion", () => {
    const store = new NamedViewStore(); render(<NamedViewsPanel {...props({ store })} />); save("East");
    const keep = screen.getByLabelText("Keep this document's views on this device"); expect(keep).not.toBeChecked();
    fireEvent.click(keep); expect(localStorage.getItem(NAMED_VIEWS_STORAGE_KEY)).not.toBeNull();
    fireEvent.click(keep); expect(localStorage.getItem(NAMED_VIEWS_STORAGE_KEY)).toBeNull(); expect(store.document("A").views).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Delete all views for this document" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel deletion" })); expect(store.document("A").views).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Delete all views for this document" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete all" })); expect(store.document("A").views).toHaveLength(0);
  });

  it("shows storage failure without pretending that persistence succeeded", () => {
    const store = new NamedViewStore(() => { throw new Error("Denied"); });
    render(<NamedViewsPanel {...props({ store })} />); save("Session");
    fireEvent.click(screen.getByLabelText("Keep this document's views on this device"));
    expect(screen.getByRole("alert")).toHaveTextContent("Device storage is unavailable or full");
    expect(screen.getByLabelText("Keep this document's views on this device")).not.toBeChecked();
    expect(store.document("A").views).toHaveLength(1);
  });

  it("clears pending rename/import state on document switch and preserves the first document's views", () => {
    const store = new NamedViewStore(); const p = props({ store }); const { rerender } = render(<NamedViewsPanel {...p} />); save("East");
    fireEvent.click(screen.getByRole("button", { name: "Rename East" }));
    rerender(<NamedViewsPanel {...p} documentId="B" />);
    expect(screen.queryByLabelText("Rename to")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Apply East" })).not.toBeInTheDocument();
    rerender(<NamedViewsPanel {...p} />);
    expect(screen.getByRole("button", { name: "Apply East" })).toBeInTheDocument();
  });

  it("closes with Escape, guards IME Escape, traps focus and returns focus after unmount", () => {
    const onClose = vi.fn(); const opener = document.createElement("button"); document.body.append(opener); opener.focus();
    const { unmount } = render(<NamedViewsPanel {...props({ onClose })} />);
    const dialog = screen.getByRole("dialog"); const first = within(dialog).getByRole("button", { name: "Show all rows / leave view" });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true }); expect(within(dialog).getByRole("button", { name: "Close" })).toHaveFocus();
    fireEvent.keyDown(dialog, { key: "Escape", isComposing: true }); expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(dialog, { key: "Escape" }); expect(onClose).toHaveBeenCalledTimes(1);
    unmount(); expect(opener).toHaveFocus(); opener.remove();
  });
});
