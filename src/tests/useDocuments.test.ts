import { describe, expect, it } from "vitest";
import { createDocument } from "../hooks/useDocuments";

describe("createDocument", () => {
  it("creates an independent snapshot with defaults", () => {
    const doc = createDocument(
      [
        ["a", "b"],
        ["1", "2"],
      ],
      { fileName: "demo.csv", format: "csv" },
    );
    expect(doc.id).toMatch(/^doc-/);
    expect(doc.meta.fileName).toBe("demo.csv");
    expect(doc.meta.dirty).toBe(false);
    expect(doc.rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
    expect(doc.history).toEqual({ undo: [], redo: [] });
    // Mutating returned rows must not affect a second create from the same source.
    doc.rows[0]![0] = "x";
    const other = createDocument(
      [
        ["a", "b"],
        ["1", "2"],
      ],
      { fileName: "demo.csv" },
    );
    expect(other.rows[0]![0]).toBe("a");
  });
});
