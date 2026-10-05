import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GridCellKind, type Theme } from "@glideapps/glide-data-grid";
import { CellTextEditor } from "../components/CellTextEditor";
import { FormulaBar } from "../components/FormulaBar";
import { t } from "../lib/i18n";
import { cleanup } from "@testing-library/react";

afterEach(cleanup);
function editor() {
  const onChange = vi.fn();
  const onFinishedEditing = vi.fn();
  let commit: (() => boolean) | null = null;
  const registerCommit = (fn: () => boolean) => {
    commit = fn;
    return () => {
      commit = null;
    };
  };
  render(
    <CellTextEditor
      value={{ kind: GridCellKind.Text, data: "00123", displayData: "00123", allowOverlay: true }}
      onChange={onChange}
      onFinishedEditing={onFinishedEditing}
      isHighlighted={false}
      target={{ x: 0, y: 0, width: 100, height: 30 }}
      forceEditMode={false}
      theme={{} as Theme}
      registerCommit={registerCommit}
    />,
  );
  return {
    onChange,
    onFinishedEditing,
    commit: () => commit?.(),
    field: screen.getByRole("textbox"),
  };
}

describe("production cell editor", () => {
  it.each([
    ["Enter", false, [0, 1]],
    ["Enter", true, [0, -1]],
    ["Tab", false, [1, 0]],
    ["Tab", true, [-1, 0]],
  ] as const)("commits %s shift=%s to the expected neighbor", (key, shiftKey, movement) => {
    const { field, onFinishedEditing } = editor();
    fireEvent.change(field, { target: { value: "日本語" } });
    fireEvent.keyDown(field, { key, shiftKey });
    expect(onFinishedEditing).toHaveBeenCalledWith(
      expect.objectContaining({ data: "日本語" }),
      movement,
    );
  });
  it("cancels without committing and starts F2-style editing at the end", () => {
    const { field, onFinishedEditing } = editor();
    expect((field as HTMLTextAreaElement).selectionStart).toBe(5);
    fireEvent.change(field, { target: { value: "discard" } });
    fireEvent.keyDown(field, { key: "Escape" });
    expect(onFinishedEditing).toHaveBeenCalledWith(undefined, [0, 0]);
  });
  it("does not navigate or permit saving during composition; a later commit uses the latest draft", () => {
    const { field, onFinishedEditing, commit } = editor();
    fireEvent.compositionStart(field);
    fireEvent.change(field, { target: { value: "日本語" } });
    fireEvent.keyDown(field, { key: "Enter", isComposing: true });
    expect(commit()).toBe(false);
    expect(onFinishedEditing).not.toHaveBeenCalled();
    fireEvent.compositionEnd(field);
    expect(commit()).toBe(true);
    expect(onFinishedEditing).toHaveBeenCalledWith(
      expect.objectContaining({ data: "日本語" }),
      [0, 0],
    );
  });
  it("inserts a cell newline only with Alt+Enter", () => {
    const { field, onChange, onFinishedEditing } = editor();
    fireEvent.keyDown(field, { key: "Enter", altKey: true });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ data: "00123\n" }));
    expect(onFinishedEditing).not.toHaveBeenCalled();
  });
});

describe("production formula bar", () => {
  it("leaves composition Enter and Escape to the IME in the name box", () => {
    const jump = vi.fn();
    render(
      <FormulaBar row={1} col={1} reference="B2" value="x" onCommit={vi.fn()} onJump={jump} />,
    );
    const reference = screen.getByRole("textbox", { name: t("nameBox") });
    fireEvent.focus(reference);
    fireEvent.compositionStart(reference);
    fireEvent.change(reference, { target: { value: "日本語" } });
    fireEvent.keyDown(reference, { key: "Enter" });
    fireEvent.keyDown(reference, { key: "Escape" });
    expect(reference).toHaveValue("日本語");
    expect(reference).toHaveAttribute("aria-invalid", "false");
    expect(jump).not.toHaveBeenCalled();
    fireEvent.compositionEnd(reference);
    fireEvent.change(reference, { target: { value: "C3" } });
    fireEvent.keyDown(reference, { key: "Enter" });
    expect(jump).toHaveBeenCalledWith({ kind: "cell", row: 2, col: 2 });
  });
  it("restores an invalid reference and visibly marks it invalid", () => {
    render(<FormulaBar row={1} col={1} reference="B2" value="x" onCommit={vi.fn()} />);
    const reference = screen.getByRole("textbox", { name: t("nameBox") });
    fireEvent.focus(reference);
    fireEvent.change(reference, { target: { value: "INVALID" } });
    fireEvent.keyDown(reference, { key: "Enter" });
    expect(reference).toHaveValue("B2");
    expect(reference).toHaveAttribute("aria-invalid", "true");
  });
  it("commits the latest draft for Save and does not lose edits typed after that save", () => {
    const commit = vi.fn();
    let prepare: (() => boolean) | null = null;
    const register = (fn: () => boolean) => {
      prepare = fn;
      return () => {
        prepare = null;
      };
    };
    render(
      <FormulaBar
        row={1}
        col={1}
        reference="B2"
        value="old"
        onCommit={commit}
        registerCommit={register}
      />,
    );
    const input = screen.getByRole("textbox", { name: t("formulaInput") });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "first" } });
    act(() => {
      expect(prepare?.()).toBe(true);
    });
    expect(commit).toHaveBeenLastCalledWith(1, 1, "first", false);
    fireEvent.change(input, { target: { value: "second" } });
    fireEvent.blur(input);
    expect(commit).toHaveBeenLastCalledWith(1, 1, "second", false);
  });
});
