import { describe, expect, it } from "vitest";
import { detectDelimiter, detectNewline, parseCsv, serializeCsv } from "../lib/csv";

describe("parseCsv", () => {
  it("parses simple comma-separated rows", () => {
    expect(parseCsv("a,b\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("parses quoted cells containing delimiters", () => {
    expect(parseCsv("id,\"last, first\"\n1,\"Doe, Jane\"")).toEqual([
      ["id", "last, first"],
      ["1", "Doe, Jane"],
    ]);
  });

  it("parses escaped quotes inside quoted cells", () => {
    expect(parseCsv("\"a \"\"quoted\"\" value\",b")).toEqual([["a \"quoted\" value", "b"]]);
  });

  it("parses quoted cells containing newlines", () => {
    expect(parseCsv("a,\"line1\nline2\",c")).toEqual([["a", "line1\nline2", "c"]]);
  });

  it("parses CRLF newlines", () => {
    expect(parseCsv("a,b\r\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("does not add an empty row for a trailing newline", () => {
    expect(parseCsv("a,b\n")).toEqual([["a", "b"]]);
  });

  it("preserves empty cells", () => {
    expect(parseCsv("a,,c\n,d,")).toEqual([
      ["a", "", "c"],
      ["", "d", ""],
    ]);
  });

  it("allows rows with different column counts", () => {
    expect(parseCsv("a,b,c\n1\n2,3")).toEqual([["a", "b", "c"], ["1"], ["2", "3"]]);
  });

  it("parses tabs when requested", () => {
    expect(parseCsv("a\tb\nc\td", "\t")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("returns an empty array for empty text", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("serializeCsv", () => {
  it("serializes rows with LF newlines", () => {
    expect(
      serializeCsv(
        [
          ["a", "b"],
          ["c", "d"],
        ],
        ",",
        "LF",
      ),
    ).toBe("a,b\nc,d");
  });

  it("quotes only cells that require quoting", () => {
    expect(serializeCsv([["a,b", "plain", "quote \"here\""]])).toBe(
      "\"a,b\",plain,\"quote \"\"here\"\"\"",
    );
  });

  it("quotes leading and trailing spaces to preserve them", () => {
    expect(serializeCsv([[" leading", "trailing "]])).toBe("\" leading\",\"trailing \"");
  });

  it("supports CRLF", () => {
    expect(serializeCsv([["a"], ["b"]], ",", "CRLF")).toBe("a\r\nb");
  });

  it("prefixes formula-like cells with ' when the guard is on", () => {
    expect(serializeCsv([["=SUM(A1)", "+1", "-2", "@x", "ok"]], ",", "LF", true)).toBe(
      "'=SUM(A1),'+1,'-2,'@x,ok",
    );
  });

  it("leaves formula-like cells untouched when the guard is off", () => {
    expect(serializeCsv([["=SUM(A1)"]], ",", "LF")).toBe("=SUM(A1)");
  });
});

describe("delimiter and newline detection", () => {
  it("detects tabs", () => {
    expect(detectDelimiter("a\tb\n1\t2")).toBe("\t");
  });

  it("detects semicolons", () => {
    expect(detectDelimiter("a;b\n1;2")).toBe(";");
  });

  it("detects CRLF", () => {
    expect(detectNewline("a,b\r\nc,d")).toBe("CRLF");
  });
});
