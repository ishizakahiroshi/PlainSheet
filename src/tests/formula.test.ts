import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_FORMULA_LIMITS,
  FORMULA_ROW_SORT_POLICY,
  adjustFormulaReferences,
  evaluateFormulaSheet,
  exportFormulaRows,
  isFormula,
  reorderFormulaRows,
  rewriteFormulasForStructure,
  translateFormula,
  type FormulaOptions,
  type FormulaStructuralChange,
} from "../lib/formula";
import { parseCsv, serializeCsv } from "../lib/csv";

const calculate = (rows: string[][], options: FormulaOptions = {}) =>
  evaluateFormulaSheet(rows, { enabled: true, ...options });
const result = (raw: string) => calculate([[raw]]).displayRows[0][0];

describe("opt-in raw/formula separation", () => {
  it("is OFF by default, including value export", () => {
    const raw = [["=1+2", "0012", "' =1+2", " =1+2", "'\u003d1+2"]];
    expect(evaluateFormulaSheet(raw).displayRows).toEqual(raw);
    expect(evaluateFormulaSheet(raw).dependencies.size).toBe(0);
    expect(exportFormulaRows(raw, "values")).toEqual(raw);
    expect(isFormula("=1+2")).toBe(true);
    expect(isFormula(" =1+2")).toBe(false);
    expect(isFormula("'=1+2")).toBe(false);
  });

  it("keeps raw/history values unchanged and display formatting distinct", () => {
    const raw = [["0012", "=A1+3", " =1+2", "'=1+2"]];
    const before = structuredClone(raw);
    const calculated = calculate(raw);
    expect(calculated.displayRows).toEqual([["0012", "15", " =1+2", "'=1+2"]]);
    expect(calculated.getCellResult(0, 1)).toEqual({
      kind: "value",
      raw: "=A1+3",
      value: 15,
      display: "15",
      formula: true,
    });
    expect(raw).toEqual(before);
    calculated.displayRows[0][0] = "changed derived value";
    expect(raw).toEqual(before);
  });

  it("owns a stable snapshot even if the source is later changed", () => {
    const raw = [["2", "=A1+1"]];
    const snapshot = calculate(raw);
    raw[0][0] = "10";
    raw.push(["new"]);
    expect(snapshot.getCellResult(0, 1).display).toBe("3");
    expect(snapshot.getCellResult(1, 0).display).toBe("");
    expect(calculate(raw).displayRows[0][1]).toBe("11");
  });
});

describe("safe parser and arithmetic", () => {
  it.each([
    ["=1+2", "3"],
    ["=2+3*4", "14"],
    ["=(2+3)*4", "20"],
    ["=2^3^2", "512"],
    ["=-2^2", "-4"],
    ["=(-2)^2", "4"],
    ["=2^-2", "0.25"],
    ["=--2", "2"],
    ["=50%*200", "100"],
    ["=1e2+.5+2.", "102.5"],
    ["=1/4", "0.25"],
    ["=+5-8", "-3"],
    ["=-0", "0"],
    ["=TRUE+2", "3"],
    ['="2"+3', "5"],
    ['="a""b"', 'a"b'],
    ["=1<=2", "TRUE"],
    ["=2<>2", "FALSE"],
    ["=2>=2", "TRUE"],
    ["=2>3", "FALSE"],
    ["=2<3", "TRUE"],
    ['="alpha"="ALPHA"', "TRUE"],
    ['="1"=1', "TRUE"],
  ])("%s returns %s", (formula, expected) => expect(result(formula)).toBe(expected));

  it.each([
    "=",
    "=1+",
    "=()",
    "=SUM(1,)",
    "=1 2",
    "=1..2",
    "=SUM(1",
    '="unclosed',
    "=1)2",
    "=A1:B2:C3",
    "=1 constructor 2",
  ])("rejects malformed input %s", (formula) => expect(result(formula)).toBe("#ERROR!"));

  it.each([
    ["=1/0", "#DIV/0!"],
    ["=0/0", "#DIV/0!"],
    ["=1e309", "#NUM!"],
    ["=10^9999", "#NUM!"],
    ["=(-1)^0.5", "#NUM!"],
    ['="text"+1', "#VALUE!"],
    ["=UNKNOWN(1)", "#NAME?"],
    ["=LOG10(100)", "#NAME?"],
    ["=missing_name", "#NAME?"],
    ["=A0", "#REF!"],
    ["=XFE1", "#REF!"],
    ["=A1048577", "#REF!"],
    ["=#REF!+2", "#REF!"],
    ["=A1:B2", "#CYCLE!"],
    ["=C1:D2+1", "#VALUE!"],
  ])("reports %s as %s without replacing raw text", (formula, error) => {
    const raw = [[formula]];
    expect(calculate(raw).errors).toEqual([{ row: 0, col: 0, error }]);
    expect(raw).toEqual([[formula]]);
  });

  it("does not execute JS, external references, or network functions", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    try {
      for (const raw of [
        '=globalThis.fetch("https://example.com")',
        '=WEBSERVICE("https://example.com")',
        '=IMPORTDATA("https://example.com")',
        '=SUM.constructor("return 5")()',
        "=(()=>42)()",
        "=Sheet1!A1",
        "='other sheet'!A1",
        "=[Book]Sheet1!A1",
      ]) {
        expect(calculate([[raw]]).errors).toHaveLength(1);
      }
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("references, ranges and dependency recalculation", () => {
  it("supports A1, mixed/absolute refs, multi-letter columns and blank virtual cells", () => {
    const raw = [["2", "=$A$1+A$1+$A1+A1+AA1+XFD1048576", ...Array<string>(24).fill(""), "3"]];
    const computed = calculate(raw);
    expect(computed.displayRows[0][1]).toBe("11");
    expect(computed.dependencies.get("B1")).toEqual(["A1", "AA1", "XFD1048576"]);
    expect(computed.getCellResult(-1, 0).display).toBe("#REF!");
    expect(computed.getCellResult(1_048_576, 0).display).toBe("#REF!");
  });

  it("recalculates transitive dependencies after edit, undo and redo snapshots", () => {
    const before = [["1", "=A1+1", "=B1*2"]];
    const edited = [["5", "=A1+1", "=B1*2"]];
    expect(calculate(before).displayRows).toEqual([["1", "2", "4"]]);
    expect(calculate(edited).displayRows).toEqual([["5", "6", "12"]]);
    expect(calculate(before).displayRows).toEqual([["1", "2", "4"]]);
    expect(calculate(edited).displayRows).toEqual([["5", "6", "12"]]);
  });

  it("handles forward/shared dependencies without false cycles", () => {
    const calculated = calculate([["=B1+C1", "=D1", "=D1*2", "4"]]);
    expect(calculated.displayRows).toEqual([["12", "4", "8", "4"]]);
    expect(calculated.dependencies.get("A1")).toEqual(["B1", "C1"]);
  });

  it("reports direct, indirect and range cycles and propagates errors", () => {
    expect(result("=A1")).toBe("#CYCLE!");
    expect(calculate([["=B1", "=C1", "=A1", "=A1+1", "=1+1"]]).displayRows).toEqual([
      ["#CYCLE!", "#CYCLE!", "#CYCLE!", "#CYCLE!", "2"],
    ]);
    expect(result("=SUM(A1:A3)")).toBe("#CYCLE!");
    expect(calculate([["=1/0", "=A1+1"]]).displayRows).toEqual([["#DIV/0!", "#DIV/0!"]]);
  });

  it("reads source rows including hidden rows; filtering is not part of evaluation", () => {
    const rows = [["1"], ["100"], ["3"], ["=SUM(A1:A3)"]];
    expect(calculate(rows).displayRows[3][0]).toBe("104");
  });

  it.each([
    ["SUM", "6"],
    ["AVERAGE", "2"],
    ["MIN", "1"],
    ["MAX", "3"],
    ["COUNT", "3"],
  ])("calculates %s over numeric strings, blanks, text and reverse ranges", (fn, expected) => {
    const raw = [["1", `=${fn}(A5:A1)`], ["2"], ["3"], [""], ["text"]];
    expect(calculate(raw).displayRows[0][1]).toBe(expected);
  });

  it("supports multiple ranges/arguments and ignores non-numeric aggregate values", () => {
    expect(
      calculate([
        ["1", "2", '=SUM(A1:B2, 4, "5", "no", TRUE)'],
        ["3", ""],
      ]).displayRows[0][2],
    ).toBe("15");
    expect(result('=COUNT(TRUE,FALSE,"text","12",1)')).toBe("2");
    expect(result("=SUM()")).toBe("0");
    expect(result("=MIN()")).toBe("0");
    expect(result("=MAX()")).toBe("0");
    expect(result("=COUNT()")).toBe("0");
    expect(result("=AVERAGE()")).toBe("#DIV/0!");
  });

  it("keeps literal error-looking text ordinary text", () => {
    const raw = [["#REF!", "=A1", "=SUM(A1)"]];
    expect(calculate(raw).errors).toEqual([]);
    expect(calculate(raw).displayRows).toEqual([["#REF!", "#REF!", "0"]]);
  });
});

describe("lazy IF", () => {
  it.each([
    ["=IF(TRUE, 3, 1/0)", "3"],
    ["=IF(FALSE, A1, 7)", "7"],
    ["=IF(0, UNKNOWN(), 5)", "5"],
    ["=IF(1, 8, XFE1)", "8"],
    ["=IF(FALSE, SUM(A1:A1048576), 2)", "2"],
    ['=IF(1<2, "yes", "no")', "yes"],
    ["=IF(FALSE,1)", "FALSE"],
    ["=IF(TRUE,1)", "1"],
    ['=IF("",1,2)', "2"],
    ['=IF("FALSE",1,2)', "2"],
    ['=IF("text",1,2)', "#VALUE!"],
    ["=IF()", "#VALUE!"],
    ["=IF(1)", "#VALUE!"],
    ["=IF(1,2,3,4)", "#VALUE!"],
  ])("%s returns %s", (raw, expected) => expect(result(raw)).toBe(expected));

  it("tracks only live dependencies and changes the graph when conditions change", () => {
    const rows = [["1", "=IF(A1,C1,D1)", "4", "=1/0"]];
    const first = calculate(rows);
    expect(first.displayRows[0][1]).toBe("4");
    expect(first.dependencies.get("B1")).toEqual(["A1", "C1"]);
    rows[0][0] = "0";
    const second = calculate(rows);
    expect(second.displayRows[0][1]).toBe("#DIV/0!");
    expect(second.dependencies.get("B1")).toEqual(["A1", "D1"]);
  });
});

describe("calculation limits", () => {
  it.each([
    ["=1+2", { maxFormulaLength: 3 }],
    ["=1+2+3", { maxTokens: 3 }],
    ["=((((1))))", { maxDepth: 3 }],
    ["=SUM(B1:B5)", { maxRangeCells: 4 }],
    ["=1+2+3+4", { maxOperations: 3 }],
  ])("bounds %s", (raw, limits) =>
    expect(calculate([[raw]], { limits }).displayRows[0][0]).toBe("#LIMIT!"),
  );

  it("bounds formula count while retaining literal cells", () => {
    expect(
      calculate([["=1", "=2", "literal"]], { limits: { maxFormulaCells: 1 } }).displayRows,
    ).toEqual([["1", "#LIMIT!", "literal"]]);
  });

  it("bounds dependency chains and combined expression/reference recursion", () => {
    const chain = Array.from({ length: 200 }, (_, i) => [`=A${i + 2}`]);
    chain.push(["1"]);
    expect(calculate(chain, { limits: { maxDependencyDepth: 10 } }).displayRows[0][0]).toBe(
      "#LIMIT!",
    );
    const nestedChain = Array.from({ length: 200 }, (_, i) => [
      "=" + "IF(TRUE,".repeat(30) + `A${i + 2}` + ",0)".repeat(30),
    ]);
    nestedChain.push(["1"]);
    expect(() => calculate(nestedChain)).not.toThrow();
    expect(calculate(nestedChain).displayRows[0][0]).toBe("#LIMIT!");
  });

  it("rejects giant ranges without allocating the grid and clamps caller overrides", () => {
    expect(result("=SUM(B1:XFD1048576)")).toBe("#LIMIT!");
    const raw = "=" + " ".repeat(DEFAULT_FORMULA_LIMITS.maxFormulaLength) + "1";
    expect(
      calculate([[raw]], { limits: { maxFormulaLength: Number.MAX_SAFE_INTEGER } })
        .displayRows[0][0],
    ).toBe("#LIMIT!");
    expect(result("=A999999999999999999999")).toBe("#REF!");
    expect(result("=ZZZZZZZZZZZZZZZZZZ1")).toBe("#REF!");
  });
});

describe("copy/fill reference translation", () => {
  it("translates relative axes and preserves absolute axes", () => {
    expect(translateFormula("=A1+$B$2+C$3+$D4", { rowDelta: 2, colDelta: 1 })).toBe(
      "=B3+$B$2+D$3+$D6",
    );
    expect(translateFormula("=SUM(A1:$B$3)", { rowDelta: 1, colDelta: 1 })).toBe("=SUM(B2:$B$3)");
  });

  it("uses source coordinate gaps when filling filtered rows", () => {
    expect(translateFormula("=A2", { rowDelta: 7 - 1, colDelta: 0 })).toBe("=A8");
  });

  it("preserves strings, spacing, unchanged case and non-formulas", () => {
    expect(translateFormula('= if(A1>0, "A1", $b$2 )', { rowDelta: 1, colDelta: 0 })).toBe(
      '= if(A2>0, "A1", $b$2 )',
    );
    expect(translateFormula("=a1 + b2", { rowDelta: 0, colDelta: 0 })).toBe("=a1 + b2");
    expect(translateFormula(" A1", { rowDelta: 2, colDelta: 2 })).toBe(" A1");
    expect(translateFormula("'=A1", { rowDelta: 2, colDelta: 2 })).toBe("'=A1");
  });

  it("returns #REF! for out-of-grid targets and keeps malformed input intact", () => {
    expect(translateFormula("=A1+B2", { rowDelta: -1, colDelta: 0 })).toBe("=#REF!+B1");
    expect(translateFormula("=SUM(A1:B2)", { rowDelta: -1, colDelta: 0 })).toBe("=SUM(#REF!)");
    expect(translateFormula("=XFD1", { rowDelta: 0, colDelta: 1 })).toBe("=#REF!");
    expect(translateFormula("=SUM(A1", { rowDelta: 1, colDelta: 1 })).toBe("=SUM(A1");
    expect(() => translateFormula("=A1", { rowDelta: 0.5, colDelta: 0 })).toThrow(RangeError);
  });
});

describe("structural references", () => {
  const change = (
    type: "insert" | "delete",
    axis: "row" | "col",
    index: number,
    count = 1,
  ): FormulaStructuralChange => ({ type, axis, index, count });

  it("shifts all anchors after row/column insertion", () => {
    expect(adjustFormulaReferences("=A1+$A$2+A$3+$B4", change("insert", "row", 1, 2))).toBe(
      "=A1+$A$4+A$5+$B6",
    );
    expect(adjustFormulaReferences("=A1+$B$2+C$3+$D4", change("insert", "col", 1, 2))).toBe(
      "=A1+$D$2+E$3+$F4",
    );
  });

  it("expands intersected ranges and shifts ranges starting at insertion", () => {
    expect(adjustFormulaReferences("=SUM(A1:A5)", change("insert", "row", 2, 2))).toBe(
      "=SUM(A1:A7)",
    );
    expect(adjustFormulaReferences("=SUM(A1:A5)", change("insert", "row", 0, 2))).toBe(
      "=SUM(A3:A7)",
    );
    expect(adjustFormulaReferences("=SUM(A1:A5)", change("insert", "row", 5, 2))).toBe(
      "=SUM(A1:A5)",
    );
  });

  it.each([
    [0, 2, "=SUM(A1:A3)"],
    [1, 2, "=SUM(A1:A3)"],
    [3, 2, "=SUM(A1:A3)"],
    [0, 5, "=SUM(#REF!)"],
    [4, 5, "=SUM(A1:A4)"],
    [5, 1, "=SUM(A1:A5)"],
  ])("shrinks range on row deletion at %s count %s", (index, count, expected) => {
    expect(adjustFormulaReferences("=SUM(A1:A5)", change("delete", "row", index, count))).toBe(
      expected,
    );
  });

  it("shrinks column ranges and preserves reversed endpoints and $ markers", () => {
    expect(adjustFormulaReferences("=SUM($E$5:$A1)", change("delete", "col", 1, 2))).toBe(
      "=SUM($C$5:$A1)",
    );
    expect(adjustFormulaReferences("=SUM(A$5:$A$1)", change("delete", "row", 1, 2))).toBe(
      "=SUM(A$3:$A$1)",
    );
    expect(adjustFormulaReferences("=SUM(A1:E5)", change("delete", "col", 0, 5))).toBe(
      "=SUM(#REF!)",
    );
  });

  it("marks deleted single refs, including absolute refs", () => {
    expect(adjustFormulaReferences("=A1+$A$2+A3", change("delete", "row", 1))).toBe("=A1+#REF!+A2");
    expect(adjustFormulaReferences("=A1+$B$2+C3", change("delete", "col", 1))).toBe("=A1+#REF!+B3");
  });

  it("rewrites an already-edited raw grid without mutating it and recalculates", () => {
    const before = [["1", "=SUM(A1:A3)"], ["2"], ["3"]];
    const inserted = [before[0], ["7"], before[1], before[2]];
    const rewritten = rewriteFormulasForStructure(inserted, change("insert", "row", 1));
    expect(inserted[0][1]).toBe("=SUM(A1:A3)");
    expect(rewritten[0][1]).toBe("=SUM(A1:A4)");
    expect(calculate(rewritten).displayRows[0][1]).toBe("13");
    expect(calculate(before).displayRows[0][1]).toBe("6");
  });

  it("rejects invalid edits, handles ceilings and leaves quoted addresses untouched", () => {
    expect(() => adjustFormulaReferences("=A1", change("delete", "row", -1))).toThrow(RangeError);
    expect(() => adjustFormulaReferences("=A1", change("delete", "row", 0, 0))).toThrow(RangeError);
    expect(() => adjustFormulaReferences("=A1", change("insert", "col", 16383, 2))).toThrow(
      RangeError,
    );
    expect(adjustFormulaReferences("=XFD1", change("insert", "col", 0))).toBe("=#REF!");
    expect(adjustFormulaReferences('=IF(A1, "A2", $A$2)', change("insert", "row", 1))).toBe(
      '=IF(A1, "A2", $A$3)',
    );
  });
});

describe("sort and export contracts", () => {
  it("sorts raw rows with positional refs and does not apply copy translation", () => {
    const raw = [
      ["2", "=A1*10"],
      ["1", "=A2*10"],
    ];
    const sorted = reorderFormulaRows(raw, [1, 0]);
    expect(FORMULA_ROW_SORT_POLICY).toBe("move-raw-rows-keep-positional-references");
    expect(sorted).toEqual([
      ["1", "=A2*10"],
      ["2", "=A1*10"],
    ]);
    expect(calculate(sorted).displayRows).toEqual([
      ["1", "20"],
      ["2", "10"],
    ]);
    expect(calculate(raw).displayRows).toEqual([
      ["2", "20"],
      ["1", "10"],
    ]);
    expect(() => reorderFormulaRows(raw, [0, 0])).toThrow(RangeError);
    expect(() => reorderFormulaRows(raw, [0])).toThrow(RangeError);
    expect(() => reorderFormulaRows(raw, [0, 2])).toThrow(RangeError);
  });

  it("exports independent raw-formula or calculated-value snapshots, including errors", () => {
    const raw = [["001", "=A1+2", "=1/0"]];
    const formulas = exportFormulaRows(raw, "formulas", { enabled: true });
    const values = exportFormulaRows(raw, "values", { enabled: true });
    expect(formulas).toEqual(raw);
    expect(values).toEqual([["001", "3", "#DIV/0!"]]);
    formulas[0][0] = "changed";
    expect(raw[0][0]).toBe("001");
  });

  it("reopens CSV formula/value exports with the chosen content and no metadata", () => {
    const raw = [
      ["001", "=A1+2"],
      ["name,quoted", '=IF(TRUE,"a,b","x")'],
    ];
    const formulas = exportFormulaRows(raw, "formulas", { enabled: true });
    const values = exportFormulaRows(raw, "values", { enabled: true });
    expect(parseCsv(serializeCsv(formulas, ",", "LF"), ",")).toEqual(formulas);
    expect(parseCsv(serializeCsv(values, ",", "LF"), ",")).toEqual(values);
    expect(calculate(parseCsv(serializeCsv(formulas, ",", "LF"), ",")).displayRows).toEqual(values);
  });
});

describe("adversarial invariants", () => {
  it("never throws for deterministic malformed user expressions", () => {
    let seed = 0x23a710;
    const alphabet = 'A1B0$:=+-*/^%(),<>._#!?" \t';
    for (let sample = 0; sample < 2_000; sample += 1) {
      let raw = "=";
      for (let i = 0; i < sample % 37; i += 1) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        raw += alphabet[seed % alphabet.length];
      }
      expect(() => calculate([[raw]])).not.toThrow();
      expect(() => translateFormula(raw, { rowDelta: -2, colDelta: 1 })).not.toThrow();
      expect(() =>
        adjustFormulaReferences(raw, { type: "delete", axis: "row", index: 0, count: 2 }),
      ).not.toThrow();
    }
  });

  it("range deletion preserves exactly the surviving target cells for both orientations", () => {
    for (let low = 0; low < 5; low += 1) {
      for (let high = low; high < 6; high += 1) {
        for (let index = 0; index < 7; index += 1) {
          for (let count = 1; count <= 3; count += 1) {
            const numbers = Array.from({ length: 10 }, (_, i) => i + 1);
            const selectedSurvivors = numbers.filter(
              (_n, i) => i >= low && i <= high && !(i >= index && i < index + count),
            );
            numbers.splice(index, count);
            const expected = selectedSurvivors.length
              ? String(selectedSurvivors.reduce((a, b) => a + b, 0))
              : "#REF!";
            for (const reversed of [false, true]) {
              const raw = reversed
                ? `=SUM($A$${high + 1}:A${low + 1})`
                : `=SUM($A$${low + 1}:A${high + 1})`;
              const adjusted = adjustFormulaReferences(raw, {
                type: "delete",
                axis: "row",
                index,
                count,
              });
              const rows = numbers.map((number) => [String(number)]);
              rows.push([adjusted]);
              expect(calculate(rows).displayRows.at(-1)?.[0]).toBe(expected);
            }
          }
        }
      }
    }
  });

  it("range insertion includes only new cells inside its existing boundaries", () => {
    for (let index = 0; index < 7; index += 1) {
      const rows = Array.from({ length: 7 }, (_, i) => [String(i + 1)]);
      rows.splice(index, 0, ["10"], ["20"]);
      const raw = adjustFormulaReferences("=SUM($A$2:A5)", {
        type: "insert",
        axis: "row",
        index,
        count: 2,
      });
      rows.push([raw]);
      expect(calculate(rows).displayRows.at(-1)?.[0]).toBe(
        String(2 + 3 + 4 + 5 + (index > 1 && index <= 4 ? 30 : 0)),
      );
    }
  });
});
