import { describe, expect, it } from "vitest";
import { detectImportEncoding, previewImport } from "../lib/importPreview";

const utf8 = (value: string) => new TextEncoder().encode(value);
const cp932 = new Uint8Array([150, 188, 145, 79, 44, 146, 108, 13, 10, 147, 140, 139, 158, 44, 55, 13, 10]);
const eucjp = new Uint8Array([204, 190, 193, 176, 44, 195, 205, 13, 10, 197, 236, 181, 254, 44, 55, 13, 10]);
const japaneseRows = [["名前", "値"], ["東京", "7"]];

describe("original-byte import preview", () => {
  it("decodes valid UTF-8 and reports compatibility without claiming unique detection", () => {
    const preview = previewImport({ bytes: utf8("名前,値\n東京,7\n"), fileName: "sample.csv" });
    expect(preview.result?.rows).toEqual(japaneseRows);
    expect(preview.result?.encoding).toBe("utf-8");
    expect(preview.result?.newline).toBe("LF");
    expect(preview.detection.confidence).toBe("utf8-compatible");
    expect(preview.error).toBeNull();
  });

  it("preserves the physical UTF-8 BOM as save metadata while parsing BOM JSON", () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...utf8('[{"name":"東京"}]\r\n')]);
    const preview = previewImport({ bytes, fileName: "source.json" });
    expect(preview.result).toMatchObject({ encoding: "utf-8-bom", hadBom: true, newline: "CRLF", rows: [["name"], ["東京"]] });
    expect(preview.content.startsWith("\uFEFF")).toBe(false);
    const withoutBom = previewImport({ bytes, fileName: "source.json" }, { encoding: "utf-8" });
    expect(withoutBom.result).toMatchObject({ encoding: "utf-8", hadBom: true });
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  });

  it.each([["cp932", cp932], ["euc-jp", eucjp]] as const)("decodes synthetic %s bytes and CRLF", (encoding, bytes) => {
    const preview = previewImport({ bytes, fileName: "japanese.csv" }, { encoding });
    expect(preview.result).toMatchObject({ rows: japaneseRows, newline: "CRLF", encoding });
    expect(preview.detection.confidence).toBe("ambiguous");
  });

  it("changes encoding from the same bytes, never from replacement-filled text", () => {
    const request = { bytes: cp932.slice(), fileName: "japanese.csv" };
    const wrong = previewImport(request, { encoding: "utf-8" });
    expect(wrong.content).toContain("\uFFFD");
    expect(wrong.error?.kind).toBe("encoding");
    expect(wrong.result).toBeNull();
    const correct = previewImport(request, { encoding: "cp932" });
    expect(correct.result?.rows).toEqual(japaneseRows);
    expect(correct.encodingWarning).toBeNull();
    expect(request.bytes).toEqual(cp932);
    expect(previewImport(request, { encoding: "utf-8" }).content).toBe(wrong.content);
  });

  it("does not mistake a genuine UTF-8 replacement character for malformed encoding", () => {
    const preview = previewImport({ bytes: utf8("name\n�\n"), fileName: "replacement.csv" });
    expect(preview.result?.rows).toEqual([["name"], ["�"]]);
    expect(preview.encodingWarning).toBeNull();
    expect(preview.error).toBeNull();
  });

  it("uses Windows-1252 for the existing Latin-1 native encoding contract", () => {
    const preview = previewImport({ bytes: new Uint8Array([110, 97, 109, 101, 10, 99, 97, 102, 233, 128]), fileName: "latin.csv" }, { encoding: "latin-1" });
    expect(preview.result?.rows).toEqual([["name"], ["café€"]]);
  });

  it("separates parse errors from encoding errors and allows an explicit format choice", () => {
    const request = { bytes: utf8("name;value\r\nAlice;7\r\n"), fileName: "misnamed.json" };
    const failed = previewImport(request);
    expect(failed.error?.kind).toBe("parse");
    expect(failed.encodingWarning).toBeNull();
    expect(failed.result).toBeNull();
    const csv = previewImport(request, { format: "csv" });
    expect(csv.result).toMatchObject({ delimiter: ";", newline: "CRLF", rows: [["name", "value"], ["Alice", "7"]] });
    expect(previewImport(request, { format: "csv", delimiter: ",", newline: "LF" }).result)
      .toMatchObject({ delimiter: ",", newline: "LF", rows: [["name;value"], ["Alice;7"]] });
  });

  it.each([[255, 254, 65, 0], [254, 255, 0, 65], [65, 0, 66, 0]])("rejects UTF-16 or binary NUL bytes", (...values) => {
    const preview = previewImport({ bytes: new Uint8Array(values), fileName: "unsupported.csv" });
    expect(preview.error?.kind).toBe("unsupported");
    expect(preview.result).toBeNull();
  });

  it("rejects a nonempty Markdown document with no supported table as a parse error", () => {
    const preview = previewImport({ bytes: utf8("# Notes\nNo table here."), fileName: "readme.md" });
    expect(preview.error?.kind).toBe("parse");
    expect(preview.result).toBeNull();
  });

  it("keeps empty input valid and respects the explicit initial encoding hint", () => {
    expect(previewImport({ bytes: new Uint8Array(), fileName: "empty.csv", initialEncoding: "euc-jp" }).result)
      .toMatchObject({ rows: [], encoding: "euc-jp" });
    expect(detectImportEncoding(utf8("plain ascii"))).toMatchObject({ encoding: "utf-8", confidence: "utf8-compatible" });
  });
});
