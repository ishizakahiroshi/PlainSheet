import { describe, expect, it } from "vitest";
import { parseTableText, serializeTableText } from "../lib/formats";

describe("table formats", () => {
  it("parses a markdown table", () => {
    expect(
      parseTableText(
        `# Data

| name | age |
|---|---:|
| Taro | 35 |
| Hanako | 29 |`,
        "markdown",
        ",",
      ),
    ).toEqual([
      ["name", "age"],
      ["Taro", "35"],
      ["Hanako", "29"],
    ]);
  });

  it("serializes a markdown table", () => {
    expect(
      serializeTableText(
        [
          ["name", "memo"],
          ["Taro", "uses | pipes"],
        ],
        "markdown",
        ",",
        "LF",
      ),
    ).toBe("| name | memo |\n| --- | --- |\n| Taro | uses \\| pipes |");
  });

  it("parses json object arrays", () => {
    expect(parseTableText(`[{"name":"Taro","age":35},{"name":"Hanako"}]`, "json", ",")).toEqual([
      ["name", "age"],
      ["Taro", "35"],
      ["Hanako", ""],
    ]);
  });

  it("serializes json object arrays", () => {
    expect(
      serializeTableText(
        [
          ["name", "age"],
          ["Taro", "35"],
        ],
        "json",
        ",",
        "LF",
      ),
    ).toBe('[\n  {\n    "name": "Taro",\n    "age": "35"\n  }\n]\n');
  });

  it("parses yaml object arrays", () => {
    expect(parseTableText("- name: Taro\n  age: 35\n- name: Hanako\n", "yaml", ",")).toEqual([
      ["name", "age"],
      ["Taro", "35"],
      ["Hanako", ""],
    ]);
  });

  it("keeps duplicate-header columns distinct when serializing JSON", () => {
    const json = serializeTableText([["a", "a"], ["1", "2"]], "json", ",", "LF");
    expect(JSON.parse(json)).toEqual([{ a: "1", a_2: "2" }]);
  });

  it("disambiguates a generated column name that collides with a real header", () => {
    const json = serializeTableText([["column_2", ""], ["x", "y"]], "json", ",", "LF");
    expect(JSON.parse(json)).toEqual([{ column_2: "x", column_2_2: "y" }]);
  });

  it("round-trips an in-cell newline through Markdown", () => {
    const rows = [
      ["a", "b"],
      ["line1\nline2", "c"],
    ];
    const md = serializeTableText(rows, "markdown", ",", "LF");
    expect(parseTableText(md, "markdown", ",")).toEqual(rows);
  });

  it("preserves a literal <br> in a cell instead of decoding it as a newline", () => {
    const rows = [["a"], ["x<br>y"]];
    const md = serializeTableText(rows, "markdown", ",", "LF");
    expect(parseTableText(md, "markdown", ",")).toEqual(rows);
  });

  it("round-trips a cell with both a literal <br> and a real newline", () => {
    const rows = [["a"], ["lit<br>tag\nnext line"]];
    const md = serializeTableText(rows, "markdown", ",", "LF");
    expect(parseTableText(md, "markdown", ",")).toEqual(rows);
  });

  it("honors CRLF when serializing Markdown and YAML", () => {
    const rows = [["name"], ["Taro"]];
    expect(serializeTableText(rows, "markdown", ",", "CRLF")).toContain("\r\n");
    expect(serializeTableText(rows, "yaml", ",", "CRLF")).toContain("\r\n");
    expect(serializeTableText(rows, "markdown", ",", "LF")).not.toContain("\r");
  });

  it("rejects a non-empty JSON array that is not a list of objects", () => {
    expect(() => parseTableText('[["a","b"],["1","2"]]', "json", ",")).toThrow();
    expect(() => parseTableText('["a","b","c"]', "json", ",")).toThrow();
  });

  it("treats an empty JSON array as an empty sheet", () => {
    expect(parseTableText("[]", "json", ",")).toEqual([]);
  });

  it("omits empty cells from JSON objects when requested", () => {
    const json = serializeTableText([["a", "b"], ["1", ""]], "json", ",", "LF", {
      omitEmptyCells: true,
    });
    expect(JSON.parse(json)).toEqual([{ a: "1" }]);
  });

  it("keeps empty cells in JSON objects by default", () => {
    const json = serializeTableText([["a", "b"], ["1", ""]], "json", ",", "LF");
    expect(JSON.parse(json)).toEqual([{ a: "1", b: "" }]);
  });
});
