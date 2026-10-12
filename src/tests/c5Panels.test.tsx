import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CleanupPanel } from "../components/CleanupPanel";
import { ValidationPanel } from "../components/ValidationPanel";
import { RecoveryPanel } from "../components/RecoveryPanel";
import { createRecoveryStore, type RecoveryStorage } from "../lib/recovery";
import type { ValidationRule } from "../lib/validation";

afterEach(cleanup);
describe("C5 callback panels", () => {
  it("cancel does not apply trim, Apply submits one complete change", () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <CleanupPanel
        rows={[[" 00123 "], [" hidden "]]}
        cells={[{ row: 0, col: 0 }]}
        hasHeader={false}
        onApply={onApply}
        onClose={onClose}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("1 changed cells");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Apply cleanup" }));
    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply).toHaveBeenCalledWith([["00123"], [" hidden "]], undefined);
  });
  it("dedupe requires complete-row consent and submits deleted source indexes", () => {
    const onApply = vi.fn();
    render(
      <CleanupPanel
        rows={[
          ["x", "first"],
          ["x", "hidden"],
          ["x", "last"],
        ]}
        cells={[
          { row: 0, col: 0 },
          { row: 2, col: 0 },
        ]}
        hasHeader={false}
        onApply={onApply}
        onClose={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText("Operation"), { target: { value: "dedupe" } });
    expect(screen.getByRole("button", { name: "Apply cleanup" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/Remove each duplicate's complete row/));
    fireEvent.click(screen.getByRole("button", { name: "Apply cleanup" }));
    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply).toHaveBeenCalledWith(
      [
        ["x", "first"],
        ["x", "hidden"],
      ],
      { deletedRows: [2] },
    );
  });
  it("shows warning default and supports add/edit/remove and separate rules export", () => {
    const onExportRules = vi.fn();
    function Subject() {
      const [rules, setRules] = useState<ValidationRule[]>([]);
      return (
        <ValidationPanel
          rows={[["header"], [""]]}
          rules={rules}
          onRulesChange={setRules}
          onClose={() => {}}
          onExportRules={onExportRules}
        />
      );
    }
    render(<Subject />);
    expect(screen.getByLabelText("On invalid input")).toHaveValue("warning");
    fireEvent.click(screen.getByRole("button", { name: "Add rule" }));
    expect(screen.getByRole("status")).toHaveTextContent("1 rule violations");
    expect(within(screen.getByLabelText("Existing rules")).getByText(/warning/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit rule" }));
    fireEvent.change(screen.getByLabelText("On invalid input"), { target: { value: "reject" } });
    fireEvent.click(screen.getByRole("button", { name: "Save rule" }));
    fireEvent.click(screen.getByRole("button", { name: "Export separate rules JSON" }));
    expect(onExportRules).toHaveBeenCalledOnce();
    expect(JSON.parse(onExportRules.mock.calls[0][0]).rules[0].mode).toBe("reject");
    fireEvent.click(screen.getByRole("button", { name: "Remove rule" }));
    expect(screen.getByRole("status")).toHaveTextContent("0 rule violations");
  });
  it("requires consent and displays location/limits before enabling recovery", () => {
    const data = new Map<string, string>();
    const storage: RecoveryStorage = {
      getItem: (key) => data.get(key) ?? null,
      setItem: vi.fn((key, value) => {
        data.set(key, value);
      }),
      removeItem: (key) => {
        data.delete(key);
      },
    };
    const store = createRecoveryStore(storage, "desktop");
    const onStateChange = vi.fn();
    render(
      <RecoveryPanel
        store={store}
        onRestore={vi.fn()}
        onStateChange={onStateChange}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/this app's local webview storage/)).toBeTruthy();
    expect(screen.getByText(/2 MiB and 50 documents/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Enable local recovery" })).toBeDisabled();
    expect(storage.setItem).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText(/I agree to retain document contents/));
    fireEvent.click(screen.getByRole("button", { name: "Enable local recovery" }));
    expect(onStateChange).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    fireEvent.click(screen.getByRole("button", { name: "Turn off and delete all drafts" }));
    expect(data.size).toBe(0);
  });
  it("lists identical names by identity/time and opens dirty isolated copies", () => {
    const data = new Map<string, string>();
    let id = 0;
    const store = createRecoveryStore(
      {
        getItem: (key) => data.get(key) ?? null,
        setItem: (key, value) => {
          data.set(key, value);
        },
        removeItem: (key) => {
          data.delete(key);
        },
      },
      "browser",
      { createId: () => `recovery-example-${++id}` },
    );
    store.enable({ acceptLocalContentStorage: true });
    store.writeSnapshot({
      documentId: "first",
      rows: [["first"]],
      meta: { fileName: "same.csv", filePath: "/first/same.csv" },
    });
    store.writeSnapshot({
      documentId: "second",
      rows: [["second"]],
      meta: { fileName: "same.csv", filePath: "/second/same.csv" },
    });
    const onRestore = vi.fn();
    render(<RecoveryPanel store={store} onRestore={onRestore} onClose={() => {}} />);
    expect(screen.getAllByText("same.csv")).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: "Open recovery copy" })[1]);
    expect(onRestore).toHaveBeenCalledWith(
      expect.objectContaining({
        rows: [["second"]],
        meta: expect.objectContaining({ dirty: true }),
      }),
    );
    expect(onRestore.mock.calls[0][0].meta.filePath).toBeUndefined();
    expect(store.inspect()).toMatchObject({
      ok: true,
      value: {
        drafts: expect.arrayContaining([expect.objectContaining({ documentId: "second" })]),
      },
    });
  });
});
