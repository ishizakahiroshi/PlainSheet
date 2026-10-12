import { describe, expect, it } from "vitest";
import { clipboardHtmlRows } from "../lib/clipboard";

describe("clipboardHtmlRows", () => {
  it("preserves raw text, whitespace, Unicode and formulas without coercion", () => {
    expect(
      clipboardHtmlRows(
        "<table><tr><th> identifier </th><th>value</th></tr><tr><td>00123</td><td>9007199254740993</td></tr><tr><td>=A1</td><td>日本語 &amp; &lt;raw&gt;\t </td></tr></table>",
      ),
    ).toEqual([
      [" identifier ", "value"],
      ["00123", "9007199254740993"],
      ["=A1", "日本語 & <raw>\t "],
    ]);
  });

  it("retains empty cells, trailing columns and trailing empty rows", () => {
    expect(
      clipboardHtmlRows(
        "<table><tr><td>a</td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr><tr></tr></table>",
      ),
    ).toEqual([
      ["a", "", ""],
      ["", "", ""],
      ["", "", ""],
    ]);
    expect(clipboardHtmlRows("<table><tr><td></td></tr></table>")).toEqual([[""]]);
  });

  it("pads short rows to a rectangular matrix", () => {
    expect(
      clipboardHtmlRows("<table><tr><td>a</td></tr><tr><td>b</td><td>c</td></tr></table>"),
    ).toEqual([
      ["a", ""],
      ["b", "c"],
    ]);
  });

  it("preserves br elements as literal cell newlines including trailing breaks", () => {
    expect(
      clipboardHtmlRows("<table><tr><td>line1<br>line2<br><br></td><td>a\nb</td></tr></table>"),
    ).toEqual([["line1\nline2\n\n", "a\nb"]]);
  });

  it("expands rowspans and colspans with text only in their top-left cell", () => {
    expect(
      clipboardHtmlRows(
        '<table><tr><td rowspan="2" colspan="2">merged</td><td>right</td></tr><tr><td>next</td></tr></table>',
      ),
    ).toEqual([
      ["merged", "", "right"],
      ["", "", "next"],
    ]);
  });

  it("keeps rows represented only by a trailing rowspan", () => {
    expect(clipboardHtmlRows('<table><tr><td rowspan="3">a</td><td>b</td></tr></table>')).toEqual([
      ["a", "b"],
      ["", ""],
      ["", ""],
    ]);
  });

  it.each(["", "plain text", "<p>text</p>", "<table></table>", "<table><tr></tr></table>"])(
    "returns null when there are no table cells: %s",
    (html) => expect(clipboardHtmlRows(html)).toBeNull(),
  );

  it("imports only the first table rather than joining unrelated tables", () => {
    expect(
      clipboardHtmlRows(
        "<table><tr><td>first</td></tr></table><table><tr><td>second</td></tr></table>",
      ),
    ).toEqual([["first"]]);
  });

  it("removes executable embedded content without inserting clipboard markup into the page", () => {
    const originalBody = document.body.innerHTML;
    const probe = "__plainsheetClipboardExecuted";
    Reflect.deleteProperty(window, probe);
    expect(
      clipboardHtmlRows(
        '<table><tr><td>safe<script>window.__plainsheetClipboardExecuted = true</script><style>bad-css</style><iframe>bad-frame</iframe><object>bad-object</object><embed src="invalid:"><img onerror="window.__plainsheetClipboardExecuted = true" src="invalid:"></td><td><a href="javascript:window.__plainsheetClipboardExecuted=true">link text</a></td></tr></table>',
      ),
    ).toEqual([["safe", "link text"]]);
    expect(Reflect.get(window, probe)).toBeUndefined();
    expect(document.body.innerHTML).toBe(originalBody);
  });

  it.each(["0", "-1", "1.5", "NaN", "Infinity", "9007199254740992"])(
    "rejects invalid span dimensions atomically: %s",
    (span) => {
      expect(clipboardHtmlRows(`<table><tr><td colspan="${span}">x</td></tr></table>`)).toBeNull();
      expect(clipboardHtmlRows(`<table><tr><td rowspan="${span}">x</td></tr></table>`)).toBeNull();
    },
  );

  it("rejects clipboard markup above the 2 MiB character limit", () => {
    const wrapper = "<table><tr><td></td></tr></table>";
    expect(clipboardHtmlRows(wrapper + " ".repeat(2 * 1024 * 1024))).toBeNull();
  });

  it("enforces the 1,000-column limit including accumulated cells", () => {
    const within = clipboardHtmlRows('<table><tr><td colspan="1000">x</td></tr></table>');
    expect(within).toHaveLength(1);
    expect(within![0]).toHaveLength(1000);
    expect(within![0][0]).toBe("x");
    expect(within![0][999]).toBe("");
    expect(clipboardHtmlRows('<table><tr><td colspan="1001">x</td></tr></table>')).toBeNull();
    expect(
      clipboardHtmlRows('<table><tr><td colspan="1000">x</td><td>overflow</td></tr></table>'),
    ).toBeNull();
  });

  it("enforces the 10,000-row limit for spans and explicit rows", () => {
    const within = clipboardHtmlRows('<table><tr><td rowspan="10000">x</td></tr></table>');
    expect(within).toHaveLength(10000);
    expect(within![9999]).toEqual([""]);
    expect(clipboardHtmlRows('<table><tr><td rowspan="10001">x</td></tr></table>')).toBeNull();
    expect(clipboardHtmlRows(`<table>${"<tr><td>x</td></tr>".repeat(10001)}</table>`)).toBeNull();
  });

  it("rejects span or final rectangular output exceeding 500,000 cells", () => {
    expect(
      clipboardHtmlRows('<table><tr><td rowspan="501" colspan="1000">x</td></tr></table>'),
    ).toBeNull();
    expect(
      clipboardHtmlRows(
        `<table><tr><td colspan="1000">wide</td></tr>${"<tr></tr>".repeat(500)}</table>`,
      ),
    ).toBeNull();
  });
});
