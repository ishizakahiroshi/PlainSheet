import { describe, expect, it } from "vitest";
import { createConversionPreview } from "../lib/conversionPreview";
import { parseTableText, serializeTableText } from "../lib/formats";

const fixture = '[{"qty":7,"active":true,"note":null,"tags":["x"],"config":{"a":1},"empty":""},{"qty":8}]';

describe("structured-text conversion preview", () => {
  it("shows concrete numeric, boolean, null, array, object, missing and empty examples", () => {
    const preview = createConversionPreview({ content: fixture, format: "json" });
    expect(preview.hasLoss).toBe(true);
    expect(preview.examples).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "number", before: "7", after: '"7"' }),
      expect.objectContaining({ kind: "boolean", before: "true", after: '"true"' }),
      expect.objectContaining({ kind: "null", before: "null", after: '""' }),
      expect.objectContaining({ kind: "array", before: '["x"]', after: '"[\\"x\\"]"' }),
      expect.objectContaining({ kind: "object", before: '{"a":1}', after: '"{\\"a\\":1}"' }),
      expect.objectContaining({ kind: "missing", before: "(missing)", after: '""' }),
      expect.objectContaining({ kind: "empty-string", before: '""', after: '""' }),
    ]));
    expect(preview.outputContent).toBe(serializeTableText(parseTableText(fixture, "json", ","), "json", ",", "LF"));
  });

  it("inspects YAML types using the same parser and output serializer", () => {
    const content = '- qty: 7\n  active: true\n  note: null\n  tags: [x]\n  empty: ""\n- qty: 8\n';
    const preview = createConversionPreview({ content, format: "yaml", newline: "CRLF" });
    expect(preview.issues.map((issue) => issue.kind)).toEqual(expect.arrayContaining(["number", "boolean", "null", "array", "missing"]));
    expect(preview.outputContent).toContain('qty: "7"\r\n');
  });

  it("does not warn on ordinary all-string documents", () => {
    const preview = createConversionPreview({ content: '[{"qty":"7","active":"true","empty":""}]', format: "json" });
    expect(preview.hasLoss).toBe(false);
    expect(preview.issues).toEqual([]);
  });

  it("matches omit-empty rules, including the first row retained to preserve headers", () => {
    const content = '[{"a":"","b":""},{"a":"","b":null},{}]';
    const preview = createConversionPreview({ content, format: "json", omitEmptyCells: true });
    expect(JSON.parse(preview.outputContent)).toEqual([{ a: "", b: "" }, {}, {}]);
    expect(preview.examples).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "empty-string", location: "[0].a", after: '""' }),
      expect.objectContaining({ kind: "empty-omitted", location: "[1].a", after: "(missing)" }),
      expect.objectContaining({ kind: "null", location: "[1].b", after: "(missing)" }),
    ]));
    expect(preview.issues.some((issue) => issue.kind === "missing")).toBe(false);
  });

  it("shows output based on the current save snapshot rather than stale imported values", () => {
    const preview = createConversionPreview({ content: '[{"qty":7}]', format: "json", rows: [["qty"], ["9"]] });
    expect(preview.examples[0]).toMatchObject({ before: "7", after: '"9"' });
  });

  it("reports serializer header normalization, preserving duplicate and header-only output", () => {
    const preview = createConversionPreview({ content: '[{"a":"x"}]', format: "json", rows: [["a", "a", ""]] });
    expect(JSON.parse(preview.outputContent)).toEqual([{ a: "", a_2: "", column_3: "" }]);
    expect(preview.issues).toContainEqual(expect.objectContaining({ kind: "header", count: 2 }));
  });

  it("maps reordered numeric-looking headers to their actual serialized keys", () => {
    const preview = createConversionPreview({ content: '[{"1":1,"2":2}]', format: "json", rows: [["2", "1"], ["second", "first"]] });
    expect(preview.examples).toEqual(expect.arrayContaining([
      expect.objectContaining({ location: "[0].1", after: '"first"' }),
      expect.objectContaining({ location: "[0].2", after: '"second"' }),
    ]));
    expect(preview.issues.some((issue) => issue.kind === "header")).toBe(false);
  });

  it("caps examples by kind while retaining complete occurrence counts", () => {
    const preview = createConversionPreview({ content: JSON.stringify(Array.from({ length: 30 }, (_, qty) => ({ qty }))), format: "json" });
    expect(preview.issues).toContainEqual(expect.objectContaining({ kind: "number", count: 30 }));
    expect(preview.examples.filter((example) => example.kind === "number")).toHaveLength(2);
  });
});

describe("Markdown table-only conversion preview", () => {
  it("reports body, subsequent tables and alignment with actual before/after examples", () => {
    const content = 'Intro\n\n| A | B |\n| :--- | ---: |\n| x | y |\n\nFooter\n\n| C |\n| --- |\n| z |';
    const preview = createConversionPreview({ content, format: "markdown" });
    expect(preview.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "markdown-body", count: 2 }),
      expect.objectContaining({ kind: "markdown-tables", count: 1 }),
      expect.objectContaining({ kind: "markdown-alignment", count: 1 }),
    ]));
    expect(preview.examples).toEqual(expect.arrayContaining([
      expect.objectContaining({ before: "Intro", after: "(not included)" }),
      expect.objectContaining({ before: "Footer", after: "(not included)" }),
      expect.objectContaining({ kind: "markdown-alignment", after: "| --- | --- |" }),
    ]));
    expect(preview.outputContent).toBe("| A | B |\n| --- | --- |\n| x | y |");
  });

  it("does not warn on a pure table without alignment metadata", () => {
    const preview = createConversionPreview({ content: "\n| A |\n| --- |\n| x |\n", format: "markdown" });
    expect(preview.hasLoss).toBe(false);
  });

  it("explains contiguous additional tables as flattening rather than falsely claiming omission", () => {
    const preview = createConversionPreview({ content: "| A |\n| --- |\n| x |\n| C |\n| --- |\n| z |", format: "markdown" });
    expect(preview.examples).toContainEqual(expect.objectContaining({ kind: "markdown-tables", after: "(flattened into ordinary rows of the first table)" }));
    expect(preview.outputContent).toContain("| z |");
  });
});
