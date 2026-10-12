import { useMemo, useState } from "react";
import type { Delimiter, Encoding, FileFormat, Newline } from "../types/sheet";
import { getLocale, type Locale } from "../lib/i18n";
import { IMPORT_ENCODINGS, previewImport, type ImportPreviewOptions, type ImportPreviewRequest,
  type ImportPreviewResult } from "../lib/importPreview";
import type { ConversionPreview } from "../lib/conversionPreview";
import { FeatureDialog } from "./FeatureDialog";

export type ImportPreviewProps = {
  request: ImportPreviewRequest;
  onConfirm: (result: ImportPreviewResult) => void;
  onCancel: () => void;
  locale?: Locale;
};

const encodingLabels: Record<Encoding, string> = {
  "utf-8": "UTF-8", "utf-8-bom": "UTF-8 BOM", cp932: "Shift_JIS (CP932)",
  "euc-jp": "EUC-JP", "latin-1": "Latin-1 (Windows-1252)",
};
const formats: FileFormat[] = ["csv", "tsv", "markdown", "json", "yaml"];

/** The component owns only a preview. Cancel never calls onConfirm. */
export function ImportPreview({ request, onConfirm, onCancel, locale = getLocale() }: ImportPreviewProps) {
  const [selection, setSelection] = useState<{ request: ImportPreviewRequest; options: Partial<ImportPreviewOptions> }>(
    () => ({ request, options: {} }),
  );
  // A new pending import cannot accidentally inherit the previous file's decoder/settings.
  if (selection.request !== request) setSelection({ request, options: {} });
  const options = selection.request === request ? selection.options : {};
  const preview = useMemo(() => previewImport(request, options), [request, options]);
  const ja = locale === "ja";
  const choose = (next: Partial<ImportPreviewOptions>) => {
    setSelection((current) => ({ request, options: { ...current.options, ...next } }));
  };
  const errorLabel = preview.error?.kind === "parse"
    ? (ja ? "形式の解析に失敗しました" : "Table format could not be parsed")
    : preview.error?.kind === "encoding"
      ? (ja ? "文字コードが一致しません" : "Encoding does not match")
      : (ja ? "対応していない入力です" : "Unsupported input");
  return <FeatureDialog title={ja ? "読込みプレビュー" : "Import preview"} onClose={onCancel}>
    <p>{request.fileName}</p>
    <p>{ja ? "元のバイト列から読み直します。文字が正しいことを確認してから開いてください。" : "Each choice decodes the original bytes. Check the text before opening."}</p>
    <div className="settingsGrid">
      <label>{ja ? "文字コード" : "Encoding"}
        <select value={preview.encoding} onChange={(event) => choose({ encoding: event.target.value as Encoding })}>
          {IMPORT_ENCODINGS.map((encoding) => <option key={encoding} value={encoding}>{encodingLabels[encoding]}</option>)}
        </select>
      </label>
      <label>{ja ? "ファイル形式" : "File format"}
        <select value={preview.format} onChange={(event) => {
          const format = event.target.value as FileFormat;
          setSelection((current) => ({ request, options: { ...current.options, delimiter: undefined, format } }));
        }}>
          {formats.map((format) => <option key={format} value={format}>{format.toUpperCase()}</option>)}
        </select>
      </label>
      <label>{ja ? "区切り文字" : "Delimiter"}
        <select value={preview.delimiter} disabled={preview.format !== "csv" && preview.format !== "tsv"}
          onChange={(event) => choose({ delimiter: event.target.value as Delimiter })}>
          <option value=",">{ja ? "カンマ" : "Comma"}</option>
          <option value={"\t"}>{ja ? "タブ" : "Tab"}</option>
          <option value=";">{ja ? "セミコロン" : "Semicolon"}</option>
          <option value="|">{ja ? "パイプ" : "Pipe"}</option>
        </select>
      </label>
      <label>{ja ? "書出し改行" : "Output newline"}
        <select value={preview.newline} onChange={(event) => choose({ newline: event.target.value as Newline })}>
          <option value="LF">LF</option><option value="CRLF">CRLF</option>
        </select>
      </label>
    </div>
    <p role="status">
      {preview.detection.confidence === "bom"
        ? (ja ? "元ファイルにUTF-8 BOMがあります。既定ではBOMを保持します。" : "UTF-8 BOM found. The default keeps the BOM.")
        : preview.detection.confidence === "utf8-compatible"
          ? (ja ? "UTF-8として読めますが、文字コードを一意に確定したわけではありません。" : "These bytes are valid UTF-8; this does not uniquely identify their encoding.")
          : (ja ? "文字コードは推定です。候補を切り替えて確認してください。" : "Encoding is a guess. Compare the available candidates.")}
      {" "}{ja ? "候補: " : "Candidates: "}{preview.detection.candidates.map((encoding) => encodingLabels[encoding]).join(", ") || (ja ? "なし" : "none")}
    </p>
    {preview.hadBom && preview.encoding !== "utf-8-bom" && <p>{ja ? "現在の選択ではUTF-8 BOMを付けて書き出しません。" : "The current choice does not write a UTF-8 BOM."}</p>}
    {(preview.format === "json" || preview.format === "yaml") && <p>{ja ? "文字列表として扱います。JSON/YAMLの書出し文字コードはUTF-8です。" : "This is edited as a text table. JSON/YAML output is UTF-8."}</p>}
    {preview.format === "markdown" && <p>{ja ? "Markdownは最初に読み込んだ表だけを書き出します。" : "Markdown export writes only the imported first table."}</p>}
    {preview.encodingWarning && !preview.error && <p role="alert">{preview.encodingWarning}</p>}
    {preview.error && <p role="alert">{errorLabel}: {preview.error.message}</p>}
    <details open={Boolean(preview.error)}>
      <summary>{ja ? "文字のプレビュー（先頭2,000文字）" : "Decoded text (first 2,000 characters)"}</summary>
      <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxHeight: 160, overflow: "auto" }}>{preview.content.slice(0, 2000)}</pre>
    </details>
    {preview.result && <>
      <p>{preview.rows.length}{ja ? "行" : " rows"} · {preview.rows.reduce((max, row) => Math.max(max, row.length), 0)}{ja ? "列" : " columns"}</p>
      <div style={{ overflow: "auto", maxHeight: 240 }}>
        <table aria-label={ja ? "先頭8行・8列のプレビュー" : "Preview of first 8 rows and columns"}>
          <tbody>{preview.rows.slice(0, 8).map((row, rowIndex) => <tr key={rowIndex}>
            {row.slice(0, 8).map((cell, colIndex) => <td key={colIndex} style={{ whiteSpace: "pre-wrap", maxWidth: 180, overflowWrap: "anywhere" }}>{cell.length > 120 ? `${cell.slice(0, 120)}…` : cell}</td>)}
          </tr>)}</tbody>
        </table>
      </div>
      <ConversionImpact preview={preview.result.conversion} locale={locale} />
    </>}
    <div className="modalActions">
      <button type="button" onClick={onCancel}>{ja ? "キャンセル" : "Cancel"}</button>
      <button type="button" className="primary" disabled={!preview.result} onClick={() => { if (preview.result) onConfirm(preview.result); }}>
        {ja ? "この内容で開く" : "Open this preview"}
      </button>
    </div>
  </FeatureDialog>;
}

export function ConversionImpact({ preview, locale = getLocale() }: { preview: ConversionPreview; locale?: Locale }) {
  const ja = locale === "ja";
  if (!preview.hasLoss) return null;
  return <section aria-label={ja ? "書出しによる変換" : "Export changes"}>
    <p>{ja ? "書出し時に変わる内容" : "What changes on export"}</p>
    <ul>{preview.issues.map((issue) => <li key={issue.kind}>{ja ? issue.messageJa : issue.message} ({issue.count})</li>)}</ul>
    <ul>{preview.examples.map((example, index) => <li key={index}>
      <span>{example.location}: </span>
      <span style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{shorten(example.before)}</span>
      {" → "}<span style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{shorten(example.after)}</span>
    </li>)}</ul>
  </section>;
}

export type ConversionSaveChoice = "save-as" | "overwrite" | null;

export function ConversionPreviewDialog({ fileName, preview, onChoose, locale = getLocale() }: {
  fileName: string;
  preview: ConversionPreview;
  onChoose: (choice: ConversionSaveChoice) => void;
  locale?: Locale;
}) {
  const ja = locale === "ja";
  return <FeatureDialog title={ja ? "上書き前に変換内容を確認" : "Review changes before overwriting"} onClose={() => onChoose(null)}>
    <p>{fileName}</p>
    <p>{ja ? "別名保存で原本を残せます。同名への上書きは以下の変更を原本へ適用します。" : "Save As keeps the original. Overwriting this file applies the changes below to the original."}</p>
    <ConversionImpact preview={preview} locale={locale} />
    <div className="modalActions">
      <button type="button" className="primary" onClick={() => onChoose("save-as")}>{ja ? "別名保存（推奨）" : "Save As (recommended)"}</button>
      <button type="button" onClick={() => onChoose(null)}>{ja ? "キャンセル" : "Cancel"}</button>
      <button type="button" onClick={() => onChoose("overwrite")}>{ja ? "変換を承知して上書き" : "Overwrite with these changes"}</button>
    </div>
  </FeatureDialog>;
}

function shorten(value: string): string {
  return value.length > 240 ? `${value.slice(0, 240)}…` : value;
}
