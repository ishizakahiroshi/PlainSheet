import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImportPreview, ConversionPreviewDialog } from "../components/ImportPreview";
import { createConversionPreview } from "../lib/conversionPreview";

const bytes = (value: string) => new TextEncoder().encode(value);
afterEach(cleanup);

describe("ImportPreview actual component", () => {
  it("redecodes original CP932 bytes, changes delimiter/newline, and confirms the shown result", () => {
    const confirm = vi.fn();
    const request = { fileName: "japanese.csv", bytes: new Uint8Array([150, 188, 145, 79, 44, 146, 108, 13, 10, 147, 140, 139, 158, 44, 55, 13, 10]), initialEncoding: "utf-8" as const };
    render(<ImportPreview request={request} onConfirm={confirm} onCancel={vi.fn()} locale="en" />);
    expect(screen.getByRole("button", { name: "Open this preview" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Encoding does not match");
    fireEvent.change(screen.getByRole("combobox", { name: "Encoding" }), { target: { value: "cp932" } });
    expect(screen.getByRole("table")).toHaveTextContent("東京");
    fireEvent.change(screen.getByRole("combobox", { name: "Delimiter" }), { target: { value: ";" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Output newline" }), { target: { value: "LF" } });
    fireEvent.click(screen.getByRole("button", { name: "Open this preview" }));
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ encoding: "cp932", delimiter: ";", newline: "LF", rows: [["名前,値"], ["東京,7"]] }));
  });

  it("cancel and Escape never commit or mutate the caller's existing document", () => {
    const current = { rows: [["keep me"]] };
    const confirm = vi.fn((result) => { current.rows = result.rows; });
    const cancel = vi.fn();
    render(<ImportPreview request={{ fileName: "new.csv", bytes: bytes("new,data") }} onConfirm={confirm} onCancel={cancel} locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(confirm).not.toHaveBeenCalled();
    expect(current.rows).toEqual([["keep me"]]);
  });

  it("separates valid decoding from a parse failure and recovers by choosing CSV", () => {
    render(<ImportPreview request={{ fileName: "misnamed.json", bytes: bytes("a;b\n1;2") }} onConfirm={vi.fn()} onCancel={vi.fn()} locale="en" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Table format could not be parsed");
    fireEvent.change(screen.getByRole("combobox", { name: "File format" }), { target: { value: "csv" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Delimiter" })).toHaveValue(";");
    expect(screen.getByRole("button", { name: "Open this preview" })).toBeEnabled();
  });

  it("shows concrete conversion effects and BOM policy before opening", () => {
    render(<ImportPreview request={{ fileName: "typed.json", bytes: new Uint8Array([0xef, 0xbb, 0xbf, ...bytes('[{"qty":7,"active":true,"note":null,"tags":["x"]}]')]) }} onConfirm={vi.fn()} onCancel={vi.fn()} locale="en" />);
    expect(screen.getByRole("status")).toHaveTextContent("UTF-8 BOM found");
    expect(screen.getByRole("region", { name: "Export changes" })).toHaveTextContent('7 → "7"');
    expect(screen.getByRole("region", { name: "Export changes" })).toHaveTextContent('true → "true"');
    expect(screen.getByText(/This is edited as a text table/)).toBeInTheDocument();
  });

  it("resets the selections when a different pending import replaces the request", () => {
    const props = { onConfirm: vi.fn(), onCancel: vi.fn(), locale: "en" as const };
    const { rerender } = render(<ImportPreview {...props} request={{ fileName: "old.csv", bytes: bytes("a,b") }} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Encoding" }), { target: { value: "latin-1" } });
    rerender(<ImportPreview {...props} request={{ fileName: "new.tsv", bytes: bytes("a\tb") }} />);
    expect(screen.getByRole("combobox", { name: "Encoding" })).toHaveValue("utf-8");
    expect(screen.getByRole("combobox", { name: "File format" })).toHaveValue("tsv");
    expect(screen.getByRole("combobox", { name: "Delimiter" })).toHaveValue("\t");
  });
});

describe("ConversionPreviewDialog", () => {
  const preview = createConversionPreview({ content: '[{"qty":7}]', format: "json" });
  it("focuses the safer Save As choice and returns each explicit action", () => {
    const choose = vi.fn();
    render(<ConversionPreviewDialog fileName="original.json" preview={preview} onChoose={choose} locale="en" />);
    expect(screen.getByText("original.json")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save As (recommended)" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Save As (recommended)" }));
    fireEvent.click(screen.getByRole("button", { name: "Overwrite with these changes" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(choose.mock.calls).toEqual([["save-as"], ["overwrite"], [null]]);
  });
  it("treats Escape as cancellation and does not act on an IME confirmation", () => {
    const choose = vi.fn();
    render(<ConversionPreviewDialog fileName="original.json" preview={preview} onChoose={choose} locale="en" />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", isComposing: true });
    expect(choose).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(choose).toHaveBeenCalledWith(null);
  });
});
