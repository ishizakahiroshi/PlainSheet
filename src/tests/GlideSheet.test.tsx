import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type { DataEditor } from "@glideapps/glide-data-grid";
import { CompactSelection, GridCellKind, type Theme } from "@glideapps/glide-data-grid";
import { GlideSheet } from "../components/GlideSheet";

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
      return <div tabIndex={0} data-testid="canvas-proxy" />;
    }),
  };
});
afterEach(cleanup);
function setup(overrides: Partial<ComponentProps<typeof GlideSheet>> = {}) {
  const change = vi.fn();
  const paste = vi.fn();
  const clear = vi.fn();
  const edit = vi.fn();
  const props: ComponentProps<typeof GlideSheet> = {
    rows: [["a", "b", "", "c"], ["d"]],
    columnCount: 4,
    colWidths: {},
    selection: { row: 0, col: 0 },
    range: null,
    searchHits: new Set(),
    activeSearchHit: null,
    scrollNonce: 0,
    theme: "light",
    zebra: false,
    headerHighlight: false,
    onEdit: edit,
    onColumnResize: vi.fn(),
    onSelectionChange: change,
    onPasteGrid: paste,
    onOpenContextMenu: vi.fn(),
    onClear: clear,
    ...overrides,
  };
  const view = render(<GlideSheet {...props} />);
  return { change, paste, clear, edit, view, props, editor: () => capture.props as EditorProps };
}

describe("production Glide wrapper with the canvas renderer mocked", () => {
  it("restores exact controlled header markers and removes them when App switches to a rectangle", () => {
    const range = { startRow: 0, startCol: 0, endRow: 2, endCol: 2 };
    const { editor, view, props } = setup({
      rows: [["a", "b", "c"], ["d"], ["e"]],
      columnCount: 3,
      range,
      selectedRowIndexes: [0, 2],
      selectedColumnIndexes: [],
    });
    expect([...editor().gridSelection!.rows]).toEqual([0, 2]);
    view.rerender(<GlideSheet {...props} selectedRowIndexes={[]} selectedColumnIndexes={[]} />);
    expect([...editor().gridSelection!.rows]).toEqual([]);
    expect(editor().gridSelection!.current?.range).toEqual({ x: 0, y: 0, width: 3, height: 3 });
    view.rerender(<GlideSheet {...props} selectedRowIndexes={[]} selectedColumnIndexes={[0, 2]} />);
    expect([...editor().gridSelection!.columns]).toEqual([0, 2]);
    expect(editor().gridSelection!.current).toBeUndefined();
  });
  it("restores source header axes through a filtered view without selecting hidden markers", () => {
    const { editor } = setup({
      rows: [["a"], ["b"]],
      columnCount: 1,
      rowSourceIndexes: [1, 3],
      selection: { row: 1, col: 0 },
      selectedRowIndexes: [1, 2, 3],
      selectedColumnIndexes: [],
    });
    expect([...editor().gridSelection!.rows]).toEqual([0, 1]);
  });
  it("synchronizes the application selection when search focuses a hit", () => {
    const rowsSelected = vi.fn();
    const columnsSelected = vi.fn();
    const { editor, change, view, props } = setup({
      onRowsSelected: rowsSelected,
      onColumnsSelected: columnsSelected,
    });
    view.rerender(<GlideSheet {...props} activeSearchHit="1:0" scrollNonce={1} />);
    expect(editor().gridSelection?.current?.cell).toEqual([0, 1]);
    expect(change).toHaveBeenLastCalledWith({ row: 1, col: 0 }, null);
    expect(rowsSelected).toHaveBeenLastCalledWith([]);
    expect(columnsSelected).toHaveBeenLastCalledWith([]);
    view.rerender(
      <GlideSheet
        {...props}
        selection={{ row: 1, col: 0 }}
        activeSearchHit="1:0"
        scrollNonce={1}
      />,
    );
    expect(change).toHaveBeenCalledTimes(1);
  });
  it.each(["rows", "columns"] as const)(
    "keeps disjoint %s selected when App echoes their bounding range",
    (kind) => {
      const { editor, change, view, props } = setup({
        rows: [["a", "b", "c"], ["d"], ["e"]],
        columnCount: 3,
      });
      act(() =>
        editor().onGridSelectionChange?.({
          rows: kind === "rows" ? CompactSelection.empty().add(0).add(2) : CompactSelection.empty(),
          columns:
            kind === "columns" ? CompactSelection.empty().add(0).add(2) : CompactSelection.empty(),
        }),
      );
      const [selection, range] = change.mock.calls.at(-1)!;
      view.rerender(<GlideSheet {...props} selection={selection} range={range} />);
      expect(editor().gridSelection?.current).toBeUndefined();
      expect([...editor().gridSelection![kind]]).toEqual([0, 2]);
    },
  );
  it("uses actual data runs for Ctrl+Arrow and actual data dimensions for Ctrl+A", () => {
    const { change } = setup();
    const canvas = screen.getByTestId("canvas-proxy");
    fireEvent.keyDown(canvas, { key: "ArrowRight", ctrlKey: true });
    expect(change).toHaveBeenLastCalledWith({ row: 0, col: 1 }, null);
    fireEvent.keyDown(canvas, { key: "a", ctrlKey: true });
    expect(change).toHaveBeenLastCalledWith(
      { row: 0, col: 0 },
      { startRow: 0, startCol: 0, endRow: 1, endCol: 3 },
    );
  });
  it("wires F2 and fill shortcuts and requests an end caret for F2", () => {
    const { editor } = setup();
    expect(editor().keybindings).toMatchObject({
      activateCell: "F2| |Enter|shift+Enter",
      downFill: true,
      rightFill: true,
    });
    fireEvent.keyDown(screen.getByTestId("canvas-proxy"), { key: "F2" });
    const value = {
      kind: GridCellKind.Text as const,
      data: "existing",
      displayData: "existing",
      allowOverlay: true,
    };
    const provided = editor().provideEditor?.(value);
    if (!provided || typeof provided !== "object" || !("editor" in provided))
      throw new Error("Text editor not supplied");
    const Editor = provided.editor;
    render(
      <Editor
        value={value}
        onChange={vi.fn()}
        onFinishedEditing={vi.fn()}
        isHighlighted={true}
        target={{ x: 0, y: 0, width: 100, height: 30 }}
        forceEditMode={true}
        theme={{} as Theme}
      />,
    );
    const input = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(input.selectionStart).toBe(8);
    expect(input.selectionEnd).toBe(8);
  });
  it("preserves the active anchor when controlled selection echoes back from App", () => {
    const { editor, change, view, props } = setup();
    act(() =>
      editor().onGridSelectionChange?.({
        rows: CompactSelection.empty(),
        columns: CompactSelection.empty(),
        current: { cell: [1, 0], range: { x: 0, y: 0, width: 2, height: 2 }, rangeStack: [] },
      }),
    );
    const [selection, range] = change.mock.calls.at(-1)!;
    view.rerender(<GlideSheet {...props} selection={selection} range={range} />);
    expect(editor().gridSelection?.current?.cell).toEqual([1, 0]);
  });
  it("limits filtered rows to the view and refuses to edit virtual rows", () => {
    const { editor, edit } = setup({
      rows: [["visible"]],
      rowSourceIndexes: [3],
      selection: { row: 3, col: 0 },
    });
    expect(editor().rows).toBe(1);
    const cell = editor().getCellContent([0, 1]);
    expect(cell).toMatchObject({ readonly: true, allowOverlay: false });
    act(() =>
      editor().onCellsEdited?.([
        {
          location: [0, 1],
          value: { kind: GridCellKind.Text, data: "bad", displayData: "bad", allowOverlay: true },
        },
      ]),
    );
    expect(edit).not.toHaveBeenCalled();
  });
  it("routes Delete to one application transaction instead of per-cell edits", () => {
    const { editor, clear } = setup();
    const accepted = editor().onDelete?.({
      rows: CompactSelection.empty(),
      columns: CompactSelection.empty(),
    });
    expect(accepted).toBe(false);
    expect(clear).toHaveBeenCalledOnce();
  });
});
