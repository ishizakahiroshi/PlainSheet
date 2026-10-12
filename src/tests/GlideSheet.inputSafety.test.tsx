import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import {
  CompactSelection,
  GridCellKind,
  type DataEditor,
  type FillPatternEventArgs,
} from "@glideapps/glide-data-grid";
import { GlideSheet } from "../components/GlideSheet";

type EditorProps = ComponentProps<typeof DataEditor>;
type SheetProps = ComponentProps<typeof GlideSheet>;
const capture = vi.hoisted(() => ({ props: null as unknown }));
vi.mock("@glideapps/glide-data-grid", async (importOriginal) => {
  const original = await importOriginal<typeof import("@glideapps/glide-data-grid")>();
  const React = await import("react");
  return {
    ...original,
    DataEditor: React.forwardRef((props: EditorProps, ref) => {
      capture.props = props;
      React.useImperativeHandle(ref, () => ({ scrollTo: vi.fn() }));
      return <div tabIndex={0} data-testid="input-safety-canvas-proxy" />;
    }),
  };
});
afterEach(cleanup);

function setup(overrides: Partial<SheetProps> = {}) {
  const change = vi.fn();
  const fill = vi.fn();
  const preview = vi.fn();
  const edit = vi.fn();
  const paste = vi.fn();
  const props: SheetProps = {
    rows: [["1"], ["2"]],
    columnCount: 1,
    colWidths: {},
    selection: { row: 0, col: 0 },
    range: null,
    searchHits: new Set(),
    activeSearchHit: null,
    scrollNonce: 0,
    theme: "light",
    zebra: false,
    headerHighlight: false,
    fillMode: "series",
    onFill: fill,
    onFillPreview: preview,
    onEdit: edit,
    onSelectionChange: change,
    onColumnResize: vi.fn(),
    onPasteGrid: paste,
    onOpenContextMenu: vi.fn(),
    ...overrides,
  };
  const view = render(<GlideSheet {...props} />);
  return {
    props,
    view,
    change,
    fill,
    preview,
    edit,
    paste,
    editor: () => capture.props as EditorProps,
  };
}

function fillEvent(
  patternSource: FillPatternEventArgs["patternSource"],
  fillDestination: FillPatternEventArgs["fillDestination"],
): FillPatternEventArgs {
  return { patternSource, fillDestination, preventDefault: vi.fn() };
}

// This exercises the production wrapper and the installed Glide event types.
// Canvas, native clipboard, actual OS keys and IME remain separate manual checks.
describe("Glide input safety at the production wrapper boundary", () => {
  it("previews only 3,4,5 when Glide supplies a destination containing seeds 1,2", () => {
    const { editor, fill, preview, props } = setup();
    const event = fillEvent(
      { x: 0, y: 0, width: 1, height: 2 },
      { x: 0, y: 0, width: 1, height: 5 },
    );
    act(() => editor().onFillPattern?.(event));
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(preview).toHaveBeenCalledOnce();
    expect(preview).toHaveBeenCalledWith([
      { row: 2, col: 0, value: "3" },
      { row: 3, col: 0, value: "4" },
      { row: 4, col: 0, value: "5" },
    ]);
    expect(fill).not.toHaveBeenCalled();
    expect(props.rows).toEqual([["1"], ["2"]]);
  });

  it("sends one transaction with raw copied values in explicit copy mode", () => {
    const { editor, fill, preview } = setup({ rows: [["00123"]], fillMode: "copy" });
    act(() =>
      editor().onFillPattern?.(
        fillEvent({ x: 0, y: 0, width: 1, height: 1 }, { x: 0, y: 0, width: 1, height: 3 }),
      ),
    );
    expect(fill).toHaveBeenCalledOnce();
    expect(fill).toHaveBeenCalledWith([
      { row: 1, col: 0, value: "00123" },
      { row: 2, col: 0, value: "00123" },
    ]);
    expect(preview).not.toHaveBeenCalled();
  });

  it.each([
    {
      key: "d",
      endRow: 2,
      endCol: 0,
      expected: [
        { row: 1, col: 0, value: "10" },
        { row: 2, col: 0, value: "10" },
      ],
    },
    {
      key: "r",
      endRow: 0,
      endCol: 2,
      expected: [
        { row: 0, col: 1, value: "10" },
        { row: 0, col: 2, value: "10" },
      ],
    },
  ])("Ctrl+$key copies even while the drag mode is series", ({ key, endRow, endCol, expected }) => {
    const { fill, preview, editor } = setup({
      rows: [["10"]],
      range: { startRow: 0, startCol: 0, endRow, endCol },
    });
    fireEvent.keyDown(screen.getByTestId("input-safety-canvas-proxy"), { key, ctrlKey: true });
    expect(fill).toHaveBeenCalledOnce();
    expect(fill).toHaveBeenCalledWith(expected);
    expect(preview).not.toHaveBeenCalled();
    expect(editor().keybindings).toMatchObject({ downFill: false, rightFill: false });
  });

  it("maps visible fill coordinates once and never includes hidden source rows", () => {
    const source = Array.from({ length: 12 }, (_, row) => [`hidden-${row}`]);
    source[1] = ["1"];
    source[4] = ["2"];
    const visibleIndexes = [1, 4, 7, 9, 11];
    const { editor, preview } = setup({
      rows: visibleIndexes.map((row) => source[row]!),
      rowSourceIndexes: visibleIndexes,
      selection: { row: 1, col: 0 },
    });
    act(() =>
      editor().onFillPattern?.(
        fillEvent({ x: 0, y: 0, width: 1, height: 2 }, { x: 0, y: 0, width: 1, height: 5 }),
      ),
    );
    const updates = preview.mock.calls[0]![0] as { row: number; col: number; value: string }[];
    expect(updates).toEqual([
      { row: 7, col: 0, value: "3" },
      { row: 9, col: 0, value: "4" },
      { row: 11, col: 0, value: "5" },
    ]);
    const result = source.map((row) => [...row]);
    for (const update of updates) result[update.row]![update.col] = update.value;
    for (let row = 0; row < source.length; row += 1) {
      if (![7, 9, 11].includes(row)) expect(result[row]).toEqual(source[row]);
    }
  });

  it.each([
    { row: 99, col: 0, address: "A100" },
    { row: 0, col: 25, address: "Z1" },
  ])(
    "keeps controlled $address, clicked selection and edit coordinates equal in a 1x1 sheet",
    ({ row, col }) => {
      const rows = [["seed"]];
      const { editor, view, props, change, edit, fill } = setup({ rows, selection: { row, col } });
      expect(editor().gridSelection?.current?.cell).toEqual([col, row]);
      expect(editor().getCellContent([col, row])).toMatchObject({ data: "", readonly: false });
      act(() =>
        editor().onGridSelectionChange?.({
          rows: CompactSelection.empty(),
          columns: CompactSelection.empty(),
          current: {
            cell: [col, row],
            range: { x: col, y: row, width: 1, height: 1 },
            rangeStack: [],
          },
        }),
      );
      expect(change).toHaveBeenLastCalledWith({ row, col }, null);
      view.rerender(<GlideSheet {...props} selection={{ row, col }} />);
      expect(editor().gridSelection?.current?.cell).toEqual([col, row]);
      expect(rows).toEqual([["seed"]]);
      expect(edit).not.toHaveBeenCalled();
      expect(fill).not.toHaveBeenCalled();
      act(() =>
        editor().onCellEdited?.([col, row], {
          kind: GridCellKind.Text,
          data: "",
          displayData: "",
          allowOverlay: true,
        }),
      );
      expect(edit).toHaveBeenCalledWith(row, col, "");
    },
  );

  it("selects virtual A100:B101 without materializing any cells", () => {
    const rows = [["seed"]];
    const { editor, edit, fill } = setup({
      rows,
      selection: { row: 99, col: 0 },
      range: { startRow: 99, startCol: 0, endRow: 100, endCol: 1 },
    });
    expect(editor().gridSelection?.current?.range).toEqual({ x: 0, y: 99, width: 2, height: 2 });
    expect(rows).toEqual([["seed"]]);
    expect(edit).not.toHaveBeenCalled();
    expect(fill).not.toHaveBeenCalled();
  });

  it("routes keyboard copy and original clipboard text through the application parser", () => {
    const copy = vi.fn();
    const pasteText = vi.fn();
    const { paste } = setup({ onCopy: copy, onPasteText: pasteText });
    const canvas = screen.getByTestId("input-safety-canvas-proxy");
    fireEvent.keyDown(canvas, { key: "c", ctrlKey: true });
    expect(copy).toHaveBeenCalledOnce();
    const original = "North,East\nSouth,West\n";
    const getData = vi.fn(() => original);
    fireEvent.paste(canvas, { clipboardData: { getData } });
    expect(getData).toHaveBeenCalledWith("text/plain");
    expect(pasteText).toHaveBeenCalledWith(original);
    expect(paste).not.toHaveBeenCalled();
  });

  it("does not interpret fill shortcut keys during IME composition", () => {
    const { fill, preview } = setup({ range: { startRow: 0, startCol: 0, endRow: 2, endCol: 0 } });
    fireEvent.keyDown(screen.getByTestId("input-safety-canvas-proxy"), {
      key: "d",
      ctrlKey: true,
      isComposing: true,
    });
    expect(fill).not.toHaveBeenCalled();
    expect(preview).not.toHaveBeenCalled();
  });
});
