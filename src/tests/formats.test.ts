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
});
