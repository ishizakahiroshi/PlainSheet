# [完了] C1: コア実装

> 親: [`plan_plainsheet-v010.md`](plan_plainsheet-v010.md)
> 最終更新: 2026-06-07(Sun) 09:30:38
> 親 plan の C1 を担当。セットアップからコア機能（グリッド・編集・ファイル操作・UI基礎）まで。

## context配分

| C | 種別 | 内容 | 並列 |
|---|---|---|---|
| C1 | fix | プロジェクトセットアップ・型定義・ライブラリ層 | — |
| C2 | fix | Tauri バックエンド（Rust コマンド群） | [並列OK with C3] |
| C3 | fix | グリッド表示（テーブル・ヘッダー・バッファ行・列幅） | [並列OK with C2] |
| C4 | fix | セル選択（単一・範囲・行列全選択） | — |
| C5 | fix | セル編集・Undo/Redo | — |
| C6 | fix | 行列操作・コンテキストメニュー | — |
| C7 | fix | ファイル操作（開く・保存・D&D・dirty 状態） | — |
| C8 | fix | クリップボード（TSV範囲コピペ・Excel貼り付け） | — |
| C9 | fix | UI基礎（Toolbar・StatusBar・SearchPanel・モーダル群・Toast） | — |

実行順序: `C1 → (C2, C3) → C4 → C5 → C6 → C7 → C8 → C9`

---

## 目的

PlainSheet の全機能が依存するコア層を完成させる。C2〜C9（エンコード〜リリース）は全てこの C1 完了後に着手可能。

## 前提

- Rust / cargo インストール済み
- Node.js / bun インストール済み
- Tauri 2 CLI インストール済み

---

## C1: プロジェクトセットアップ・型定義・ライブラリ層

### 作業内容

**セットアップ**
- `bunx create-tauri-app plainsheet` — React + TypeScript テンプレート選択
- ESLint / Prettier 設定
- Vitest 設定（`vite.config.ts` に `test` 設定追加）
- CSS カスタムプロパティ（デザイントークン）定義: `src/styles/variables.css`
- MIT License 追加
- `public/sample.csv` 追加（日本語データ含む10行程度）

**型定義** (`src/types/sheet.ts`)
```ts
type CellValue = string
type SheetData = { rows: CellValue[][] }
type Selection = { row: number; col: number }
type Range = { startRow: number; startCol: number; endRow: number; endCol: number } | null
type SheetMeta = {
  filePath?: string; fileName?: string
  encoding: "utf-8" | "utf-8-bom" | "cp932" | "euc-jp" | "latin-1"
  newline: "LF" | "CRLF"; delimiter: "," | "\t" | ";" | "|"; dirty: boolean
}
type HistoryEntry = { rows: CellValue[][]; selection: Selection }
```

**CSVライブラリ** (`src/lib/csv.ts`)
- `parseCsv(text, delimiter)` — RFC 4180 準拠、quoted cell・セル内改行・空セル・列数差異対応
- `serializeCsv(rows, delimiter, newline)` — 必要なセルのみクォート、`""` エスケープ
- Vitest テスト（エッジケース10ケース以上）

**列幅ライブラリ** (`src/lib/columnWidth.ts`)
- `calculateColumnWidths(rows)` — 全角=15px / ASCII=7.5px、最大1000行走査、clamp(72, 420)
- Vitest テスト

**クリップボードライブラリ** (`src/lib/clipboard.ts`)（C8 で使用するが型定義はここで）
- `rangeTsv(rows, range): string`
- `parseClipboardText(text): string[][]`

### 変更予定ファイル

- `src/types/sheet.ts` — 新規作成
- `src/lib/csv.ts` — 新規作成
- `src/lib/columnWidth.ts` — 新規作成
- `src/lib/clipboard.ts` — 新規作成
- `src/tests/csv.test.ts` — 新規作成
- `src/tests/columnWidth.test.ts` — 新規作成

### 完了条件

- `bun run test` が全テスト通過
- `bun run dev` で空の画面が起動する

---

## C2: Tauri バックエンド（Rust コマンド群）

### 作業内容

`src-tauri/src/main.rs` に以下のコマンドを実装:

```rust
#[tauri::command] async fn open_file_dialog() -> Option<String>
#[tauri::command] async fn read_file(path: String) -> Result<String, String>
#[tauri::command] async fn write_file(path: String, content: String) -> Result<(), String>
#[tauri::command] async fn save_file_dialog(default_name: String) -> Option<String>
#[tauri::command] async fn detect_encoding(path: String) -> Result<String, String>
```

`tauri.conf.json` 設定:
- `decorations: false`（カスタムタイトルバー用）
- ウィンドウサイズ: 1200×800
- ファイル関連付け: `.csv` / `.tsv`
- fs / dialog allowlist

### 変更予定ファイル

- `src-tauri/src/main.rs`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`（`encoding_rs` 追加）

### 完了条件

- `cargo build` が通る
- JS 側から `invoke("read_file", { path })` が動作する

---

## C3: グリッド表示

### 作業内容

`src/components/SheetGrid.tsx`:
- `<table>` ベースレンダリング（v0.1 は仮想スクロールなし、C4 で切替）
- 列ヘッダー（A/B/C…）: ホバーで `▾` 表示 → 右クリックで列コンテキストメニュー
- 行番号: 右クリックで行コンテキストメニュー
- 1行目ヘッダー強調（背景色・太字）
- バッファ行（`BUFFER_ROWS = 8`）常時表示、薄いグレー
- ゼブラストライプ（偶数行）
- 列幅ドラッグリサイズ（ヘッダー境界）
- `calculateColumnWidths` を開いた直後に適用

`src/components/FormulaBar.tsx`:
- セル参照表示（`A1` / `A1:C3`）
- 内容表示・直接編集（Enter で確定・Esc でキャンセル）

### 変更予定ファイル

- `src/components/SheetGrid.tsx` — 新規
- `src/components/FormulaBar.tsx` — 新規
- `src/hooks/useSheet.ts` — 新規（シートデータ管理）

### 完了条件

- sample.csv のデータがグリッドに正しく表示される
- 日本語列が自動列幅で見やすく表示される

---

## C4: セル選択

### 作業内容

`src/hooks/useSelection.ts`:

| 操作 | 動作 |
|---|---|
| クリック | 単一セル選択・範囲クリア |
| Shift+クリック | 範囲拡張 |
| Shift+矢印 | 範囲拡張 |
| Ctrl+A | 全セル選択 |
| 列ヘッダークリック | 列全体選択 |
| 行番号クリック | 行全体選択 |
| Escape | 範囲クリア |

ビジュアル:
- 選択セル: 青枠（`outline: 2px solid #1d6ed8`）
- 範囲: 水色背景（`background: #dbeafe`）
- 選択列ヘッダー・行番号: ダークブルー背景

### 変更予定ファイル

- `src/hooks/useSelection.ts` — 新規

### 完了条件

- Shift+矢印で範囲選択が正しく動く
- Ctrl+A で全セル選択される
- 列ヘッダークリックで列全体が選択される

---

## C5: セル編集・Undo/Redo

### 作業内容

`src/hooks/useEdit.ts`:
- ダブルクリック・F2・文字キー直打ちで編集開始（文字キーは上書きモード）
- Enter: 確定して下移動 / Shift+Enter: 上移動
- Tab / Shift+Tab: 右/左移動
- Esc: キャンセル（元の値に戻す）
- Delete / Backspace: セル/範囲一括削除
- バッファ行への入力: rows 配列を拡張してデータ行に昇格
- FormulaBar からの編集: Enter 確定・Esc キャンセル

`src/hooks/useHistory.ts`:
- `MAX_HISTORY = 50`
- 編集確定時に `{ rows, selection }` をスタックに push
- Ctrl+Z: Undo / Ctrl+Y / Ctrl+Shift+Z: Redo

### 変更予定ファイル

- `src/hooks/useEdit.ts` — 新規
- `src/hooks/useHistory.ts` — 新規

### 完了条件

- セルを編集して Esc でキャンセルすると元の値に戻る
- 50回 Undo できる

---

## C6: 行列操作・コンテキストメニュー

### 作業内容

`src/components/ContextMenu.tsx`（3種類）:

| トリガー | メニュー |
|---|---|
| セル右クリック | コピー / 貼り付け / セルを空に / 上下に行追加 / 行削除 |
| 列ヘッダー右クリック | 左/右に列を挿入 / 列幅再計算 / 列削除 |
| 行番号右クリック | 上/下に行を追加 / 行削除 |

`src/components/ConfirmDialog.tsx`:
- 削除操作前の確認ダイアログ

### 変更予定ファイル

- `src/components/ContextMenu.tsx` — 新規
- `src/components/ConfirmDialog.tsx` — 新規

### 完了条件

- 列ヘッダー右クリックで「左に列を挿入」が動作する
- 行削除時に確認ダイアログが出る

---

## C7: ファイル操作

### 作業内容

`src/hooks/useFile.ts`:
- `openFile()`: `open_file_dialog` → `read_file` → `detect_encoding` → `parseCsv` → state 更新
- `saveFile()`: `filePath` あれば `write_file`（上書き）、なければ `saveAs()`
- `saveAs()`: `save_file_dialog` → `write_file`
- `loadData()`: rows・colWidths・meta を更新し EmptyState を非表示化
- ドラッグ&ドロップ: Tauri `onFileDropEvent` を購読
- ファイル関連付け起動: `tauri://file-drop` イベント処理
- dirty 状態: 編集時 `meta.dirty = true`、保存時 `false`
- タイトルバー: `● filename.csv`（dirty 時）
- `onCloseRequested`: dirty なら確認ダイアログ

### 変更予定ファイル

- `src/hooks/useFile.ts` — 新規
- `src/components/TitleBar.tsx` — 新規

### 完了条件

- CSV を開いて編集して Ctrl+S で上書き保存し、ファイルの内容が正しく更新される
- .csv をダブルクリックでアプリが起動しファイルが開く

---

## C8: クリップボード（TSV 範囲コピペ）

### 作業内容

`src/lib/clipboard.ts` の実装:
- Ctrl+C: 選択範囲をタブ区切り（TSV）でクリップボードへ
  - 複数セル: `N×M コピーしました` toast
- Ctrl+V: クリップボードテキストをパース
  - タブ・改行があれば多セル展開（selRow/selCol 起点）
  - なければ単一セルペースト
  - 貼り付け後に貼り付け範囲を選択状態に
- Excel / LibreOffice からの TSV 貼り付けがそのまま動作する

### 変更予定ファイル

- `src/lib/clipboard.ts` — 実装追加

### 完了条件

- Excel で3×4 セルをコピーして PlainSheet に貼り付けると正しく展開される
- PlainSheet で範囲コピーして Excel に貼り付けると正しく入る

---

## C9: UI基礎

### 作業内容

`src/components/Toolbar.tsx`:
```
[開く] [保存] [名前を付けて保存] | [検索] [Undo] [Redo] | [列幅] | [AI用コピー▾] | [⚙] [?]
```

`src/components/StatusBar.tsx`:
```
10行 × 6列 | 3×4 選択中 | UTF-8 | LF | CSV (,) | 保存済み
```
- 選択範囲の合計・平均を右端に表示（数値列選択時）

`src/components/SearchPanel.tsx`:
- Ctrl+F でスライドイン
- ヒットセルを黄色ハイライト
- ↑▼ ナビゲーション・Enter/Shift+Enter・Esc で閉じる

`src/components/HelpModal.tsx`: ショートカット一覧表

`src/components/SettingsModal.tsx`: エンコード / 改行 / ゼブラ / ヘッダー強調 / テーマ

EmptyState 画面（ファイル未オープン時）:
- アプリ名・サブタイトル
- 「CSVを開く」ボタン・「サンプルを開く」ボタン
- ショートカットヒント

Toast 通知: 保存完了・コピー・行追加など（2秒で自動消去）

### 変更予定ファイル

- `src/components/Toolbar.tsx` — 新規
- `src/components/StatusBar.tsx` — 新規
- `src/components/SearchPanel.tsx` — 新規
- `src/components/HelpModal.tsx` — 新規
- `src/components/SettingsModal.tsx` — 新規
- `src/App.tsx` — 全コンポーネントを統合

### 完了条件

- sample.csv を開いてすべての UI コンポーネントが正しく動作する
- キーボードショートカットが全て機能する

---

## 完了報告フォーマット

各 C 完了時に親 plan `## context配分` 表の C1 行と本 plan の該当行を `plan` → `fix` に更新。
