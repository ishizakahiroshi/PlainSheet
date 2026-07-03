# [v0.1.0 完了] PlainSheet v0.1.0 実装計画

> 最終更新: 2026-06-08(Mon) 00:02:19 UTC

## v0.1.0 リリース状態

v0.1.0 は「CSVを開く、シートとして編集する、保存する」を中心に、デスクトップ版とWebデモ版の両方で触れる状態まで完了。

実装済み:

- Tauri 2 + React + TypeScript + Vite のアプリ構成
- CSV / TSV / Markdown Table / JSON array / YAML list の基本読み書き
- UTF-8 / UTF-8 BOM / Shift_JIS / EUC-JP / Latin-1 の読み書き基盤
- 自動列幅、手動列幅変更、行番号、列番号、ヘッダー行強調
- セル選択、範囲選択、セル編集、FormulaBar
- 行追加、列追加、行削除、列削除
- 右クリックメニュー
- Ctrl+O / Ctrl+S / Ctrl+F / Ctrl+H / Ctrl+Z / Ctrl+Y / Ctrl+C / Ctrl+V
- 検索、置換、全置換、正規表現、大小区別
- Undo / Redo
- TSV範囲コピー・貼り付け
- StatusBar、Help、Settings、Toast、light/dark/systemテーマ
- Web版のファイル選択、ドラッグ&ドロップ、ダウンロード保存 fallback
- README、GitHub Pages workflow、v0.1.0向け公開準備

次リリース以降:

- 1万行以上向けの仮想スクロールとWeb Worker
- ソート、フィルタ、データクリーニング、オートフィル
- 複数タブ、最近開いたファイル、セッション復元
- HTML / SQL / xlsx export
- Git diff ハイライト
- 全プラットフォームの実機ビルド検証とGitHub Releases配布

## context配分

| C | 種別 | 内容 | 子 plan | 並列 |
|---|---|---|---|---|
| C1 | 完了 | コア実装（セットアップ・データ層・Tauri backend・グリッド・編集・ファイル操作・クリップボード・UI基礎） | [`plan_plainsheet-v010_c1_core.md`](plan_plainsheet-v010_c1_core.md) | — |
| C2 | 実装済み | エンコード・区切り文字完全対応（EUC-JP / Latin-1 / Shift_JIS / BOM / 自動判定） | [`plan_plainsheet-v010_c2_encoding.md`](plan_plainsheet-v010_c2_encoding.md) | — |
| C3 | 実装済み | 検索・置換（Ctrl+F / Ctrl+H / 正規表現・全置換） | [`plan_plainsheet-v010_c3_search.md`](plan_plainsheet-v010_c3_search.md) | — |
| C4 | 次回以降 | 仮想スクロール・大容量対応（1万行+・Web Worker） | [`plan_plainsheet-v010_c4_performance.md`](plan_plainsheet-v010_c4_performance.md) | — |
| C5 | 基本実装済み | フォーマット対応（Markdown Table / JSON / YAML） | [`plan_plainsheet-v010_c5_formats.md`](plan_plainsheet-v010_c5_formats.md) | — |
| C6 | 次回以降 | データ操作（ソート・フィルタ・クリーニング・統計・オートフィル） | [`plan_plainsheet-v010_c6_data-ops.md`](plan_plainsheet-v010_c6_data-ops.md) | — |
| C7 | 一部実装済み | UI/UX拡張（ヘッダー固定・テーマ・タブ・セッション管理） | [`plan_plainsheet-v010_c7_ux.md`](plan_plainsheet-v010_c7_ux.md) | — |
| C8 | 次回以降 | Export強化・AI機能・Git diff | [`plan_plainsheet-v010_c8_export-ai.md`](plan_plainsheet-v010_c8_export-ai.md) | — |
| C9 | 一部実装済み | アクセシビリティ・多言語・品質確認・公開準備 | [`plan_plainsheet-v010_c9_a11y.md`](plan_plainsheet-v010_c9_a11y.md) | — |
| C10 | 進行中 | セキュリティ・脆弱性・品質監査 | [`plan_plainsheet-v010_c10_security-quality-audit.md`](plan_plainsheet-v010_c10_security-quality-audit.md) | subagent |

実行順序: `C1 → (C2, C3, C4, C5, C6, C7, C8) → C9`

---

## 概要

PlainSheet は CSV / TSV / Markdown Table / JSON / YAML などのプレーンテキスト表データを、AI にも人間にも扱いやすくするローカルファーストな軽量デスクトップエディタ。

v0.1.0 では Tauri 2 ベースのデスクトップアプリとして Windows / macOS / Linux を同時対応し、コア編集機能から仮想スクロール・多フォーマット・AI 用コピー・Git diff ハイライトまで一気に実装する。

**スコープ外:** Excel 関数・セル結合・グラフ・ピボット・クラウド同期・リアルタイム共同編集・AI API 連携（自動送信）

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | React 18 + TypeScript |
| ビルド | Vite 5 |
| デスクトップ | Tauri 2 |
| バックエンド | Rust（Tauri commands）|
| エンコード | `encoding_rs` クレート（Rust） |
| xlsx 出力 | `rust_xlsxwriter` クレート |
| スタイル | CSS Modules |
| テスト | Vitest |

---

## データモデル（共通型）

```ts
type CellValue = string;
type SheetData = { rows: CellValue[][] };
type Selection = { row: number; col: number };
type Range = { startRow: number; startCol: number; endRow: number; endCol: number } | null;
type SheetMeta = {
  filePath?: string;
  fileName?: string;
  encoding: "utf-8" | "utf-8-bom" | "cp932" | "euc-jp" | "latin-1";
  newline: "LF" | "CRLF";
  delimiter: "," | "\t" | ";" | "|";
  dirty: boolean;
};
```

---

## 画面レイアウト（確定）

```
TitleBar（カスタム・ドラッグ可）
Toolbar: [開く][保存][名前を付けて保存] | [検索][Undo][Redo] | [列幅] | [AI用コピー▾] | [⚙][?]
FormulaBar: [A1] | セル内容
─────────────────────────────────────────
    │ A        B        C     ← 列ヘッダー右クリックで列操作
────┼──────────────────────
  1 │ ヘッダー行（強調）
  2 │ データ行
 .. │
  N │ 最終データ行
N+1 │ (バッファ行 × 8)        ← 入力でデータ行に昇格
─────────────────────────────────────────
StatusBar: 行数 × 列数 | N×M 選択中 | エンコード | 改行 | 区切り | 保存状態
```

---

## 完成の定義

**ファイル操作**
- CSV / TSV / セミコロン区切りをネイティブダイアログで開ける
- Markdown / JSON / YAML を開いてテーブル編集できる
- .csv / .tsv / .md / .json / .yaml ダブルクリックでアプリ起動
- UTF-8 / UTF-8 BOM / Shift_JIS / EUC-JP を正しく読み書き
- Ctrl+S で上書き保存（ダイアログなし）

**グリッド・編集**
- 開いた瞬間に自動列幅で表示
- セル編集・バッファ行入力・列ヘッダー右クリック列操作
- 範囲選択・TSVコピペ・Excel 貼り付け対応
- Undo / Redo 50段
- 1万行以上で快適動作（仮想スクロール）

**データ操作**
- ソート・フィルタ・重複削除・空白トリム・列分割/結合

**検索・置換**
- Ctrl+F 検索・Ctrl+H 置換・全置換・正規表現

**表示・統計**
- ダーク/ライトテーマ・列統計パネル・ステータスバーに合計/平均

**ファイル管理**
- 最近開いたファイル・カーソル位置記憶・複数タブ・自動バックアップ

**エクスポート**
- HTML / SQL / xlsx / Clipboard（CSV・TSV・Markdown・JSON・SQL）

**AI / Git**
- プロンプト付き Markdown/JSON コピー・Git diff ハイライト

**アクセシビリティ・多言語**
- キーボードのみ全操作・日本語/英語 UI 切替

**クロスプラットフォーム**
- Windows / macOS / Linux ビルド・GitHub Releases バイナリ配布

---

## C1 概要

→ 詳細: [`plan_plainsheet-v010_c1_core.md`](plan_plainsheet-v010_c1_core.md)

セットアップ〜コア機能の全実装。他の C はすべて C1 完了後に並列着手可能。

## C2 概要

→ 詳細: [`plan_plainsheet-v010_c2_encoding.md`](plan_plainsheet-v010_c2_encoding.md)

EUC-JP・Latin-1・Shift_JIS・BOM・自動判定・引用符スタイル。

## C3 概要

→ 詳細: [`plan_plainsheet-v010_c3_search.md`](plan_plainsheet-v010_c3_search.md)

検索パネルを置換パネルに拡張。正規表現・大小区別・全置換。

## C4 概要

→ 詳細: [`plan_plainsheet-v010_c4_performance.md`](plan_plainsheet-v010_c4_performance.md)

SheetGrid を仮想スクロール対応に書き換え。Web Worker で CSV パース非同期化。

## C5 概要

→ 詳細: [`plan_plainsheet-v010_c5_formats.md`](plan_plainsheet-v010_c5_formats.md)

Markdown Table 抽出・編集・書き戻し。JSON array / YAML list の読み書き。

## C6 概要

→ 詳細: [`plan_plainsheet-v010_c6_data-ops.md`](plan_plainsheet-v010_c6_data-ops.md)

ソート・フィルタ・クリーニング・統計パネル・オートフィル・フィルハンドル。

## C7 概要

→ 詳細: [`plan_plainsheet-v010_c7_ux.md`](plan_plainsheet-v010_c7_ux.md)

ヘッダー固定・テーマ切替・複数タブ・セッション管理・最近開いたファイル。

## C8 概要

→ 詳細: [`plan_plainsheet-v010_c8_export-ai.md`](plan_plainsheet-v010_c8_export-ai.md)

HTML/SQL/xlsx Export・AI 用コピー（プロンプト付き）・Git diff ハイライト。

## C9 概要

→ 詳細: [`plan_plainsheet-v010_c9_a11y.md`](plan_plainsheet-v010_c9_a11y.md)

アクセシビリティ・日英 UI・全プラットフォームビルド・GitHub Releases 公開。

## C10 概要

→ 詳細: [`plan_plainsheet-v010_c10_security-quality-audit.md`](plan_plainsheet-v010_c10_security-quality-audit.md)

DB を使わない前提で、ローカルファイル入出力、Tauri capability、壊れた入力ファイル、未保存状態、依存関係、非ビルド検証を監査する。
