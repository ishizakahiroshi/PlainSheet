import { describe, expect, it } from "vitest";
import {
  detectDelimiter,
  detectNewline,
  parseCsv,
  parseCsvStream,
  serializeCsv,
} from "../lib/csv";

describe("parseCsv", () => {
  it("parses simple comma-separated rows", () => {
    expect(parseCsv("a,b\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("strips a leading UTF-8 BOM so browser File.text() matches desktop decode", () => {
    expect(parseCsv("\uFEFFname,age\n1,2")).toEqual([
      ["name", "age"],
      ["1", "2"],
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

  it("guards cells whose formula trigger sits behind invisibles or a BOM", () => {
    const bom = "﻿";
    const bomEq = `${bom}=cmd|'/c calc'!A1`;
    const lfEq = "\n=HYPERLINK(\"x\")";
    const tabEq = "\t=SUM(A1)";
    const output = serializeCsv([[bomEq, lfEq, tabEq]], ",", "LF", true);
    // The single-quote guard is inserted before the leading invisible, so the
    // sequence is ' → invisible → trigger character.
    expect(output.includes(`'${bom}=`)).toBe(true);
    expect(output.includes("'\n=")).toBe(true);
    expect(output.includes("'\t=")).toBe(true);
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

  it("prefers the dominant delimiter when a single outlier row has more of another", () => {
    // Two of three rows use commas; one row throws in pipes. The detector
    // should not let the single outlier flip the whole sheet to '|'.
    expect(detectDelimiter("a,b\nc|d|e\n1,2")).toBe(",");
  });
});

describe("stream CSV parse", () => {
  it("joins chunks that split mid-row and mid-quote", async () => {
    async function* chunks() {
      yield "a,\"hel";
      yield "lo, world\"\nb,c";
    }
    const rows = await parseCsvStream(chunks());
    expect(rows).toEqual([
      ["a", "hello, world"],
      ["b", "c"],
    ]);
  });

  it("matches parseCsv when content is split across chunks", async () => {
    const text = "id,name\n1,\"Doe, Jane\"\n2,Bob\n";
    async function* chunks() {
      yield text.slice(0, 7);
      yield text.slice(7, 20);
      yield text.slice(20);
    }
    expect(await parseCsvStream(chunks())).toEqual(parseCsv(text));
  });
});
