# PlainSheet 実装計画書

## 0. プロジェクト概要

### プロダクト名

**PlainSheet**

### コンセプト

**Local First. CSV First. AI First.**

PlainSheet は、CSV / TSV / Markdown Table / JSON / YAML などのプレーンテキスト表データを、AIにも人間にも扱いやすくするための軽量エディタです。

AIにとってCSVは扱いやすい一方で、人間がExcel / OnlyOffice / LibreOfficeで開くと、毎回列幅調整が必要になりがちです。PlainSheetはこの小さなストレスを解消します。

### 一言でいうと

> CSVを開いた瞬間から、シートとして気持ちよく編集できるローカルファーストな軽量エディタ。

---

## 1. なぜ作るのか

### 背景

AIに表データを渡すとき、CSVは非常に相性が良いです。

- テキストなのでAIが解析しやすい
- LLMが生成・修正しやすい
- Gitで差分管理しやすい
- 余計な装飾やメタデータがない
- xlsxよりトークン効率が良い

しかし、人間がCSVを編集するときには課題があります。

- Excel / OnlyOffice / LibreOfficeで開くと列幅が最適化されない
- 毎回「列幅を広げる」操作が必要になる
- 表計算ソフトは高機能だが、CSV編集だけには重い
- VSCode拡張は機能は近いが、日常利用するUXとしては重い
- CSVビューアは軽いが、行追加・列追加・セル編集が弱い

### 既存ツール検証の結論

| ツール | 良かった点 | 足りなかった点 |
|---|---|---|
| Excel | 高機能・普及 | CSVを開くたびに列幅調整が必要。UTF-8 LFで文字化けする場合あり |
| OnlyOffice | 普段使いしやすい | CSV列幅問題は残る。SLK非対応 |
| LibreOffice Calc | 一番近い。CSV/SLK対応 | 「最適な列幅」はあるが手動操作が必要 |
| SLK | テキスト形式で列幅を持てる | 互換性が弱い。OnlyOffice不可、Excelでエラー |
| SpreadsheetML XML 2003 | AIが生成しやすい | 人間編集との往復が弱い |
| Modern CSV | CSV専用 | 求めるUXと違う |
| EmEditor | CSV表示は優秀 | 行追加・列追加などシート編集に弱い |
| VSCode + Edit CSV | 機能は近い | VSCode自体が重く、拡張画面感が強い |
| DBeaver | テーブル編集可能 | DBインポート前提で遠回り |
| CSVFileView | 軽量ビューア | 編集用途に向かない |

### 作る理由

既存ツールには「CSVを開いた瞬間にシートとして気持ちよく編集できる」体験が見つからなかったため、自作する。

---

## 2. PlainSheet の基本思想

### 2.1 Local First

- データはローカルファイルとして保持
- クラウド必須にしない
- Google Sheets / Notion / Airtable の代替ではない
- Git管理しやすいことを重視
- オフラインでも使える

### 2.2 CSV First

- 最初の正本はCSV
- xlsxは正本にしない
- 余計なメタデータを増やさない
- 列幅情報は基本的に保存しない
- 開くたびに内容から列幅を自動計算する

### 2.3 AI First

- AIが読み書きしやすい形式を維持
- CSV / TSV / Markdown Table / JSON / YAML を将来的に扱う
- xlsxのような複雑な内部構造をAIに触らせない
- 生成AI / Codex / Claude Code との相性を重視
- 差分が読みやすい保存形式を優先

---

## 3. ターゲットユーザー

### 主要ユーザー

- AIでCSVを生成・編集しているエンジニア
- Gitでデータを管理したい人
- xlsxではなくCSVを正本にしたい人
- 表計算ソフトは重いと感じる人
- Markdown / CSV / JSON / YAML をよく扱う人
- 小さな業務データを軽く編集したい人
- AIエージェントに渡す表データを整えたい人

### 非ターゲット

- 本格的なExcel代替を求める人
- ピボットテーブルや複雑な関数を使いたい人
- 共同編集クラウドサービスを求める人
- 大規模BIツールを求める人
- 帳票レイアウトや印刷機能を重視する人

---

## 4. MVPのゴール

### v0.1で実現すること

**CSVを開いて、最初からシートとして編集し、Ctrl+SでCSV保存できること。**

### v0.1の必須機能

- CSVファイルを開く
- UTF-8 CSVを読み込む
- CSVを表形式で表示する
- 開いた瞬間に列幅を自動調整する
- セルを編集する
- 行を追加する
- 列を追加する
- 行を削除する
- 列を削除する
- Ctrl+SでCSV保存する
- 保存時にCSV構造を壊さない
- 変更あり/なしをタイトルやUIで表示する
- Windowsで使える

### v0.1でやらないこと

- Excel関数
- セル装飾
- セル結合
- グラフ
- ピボットテーブル
- クラウド同期
- 複数人リアルタイム共同編集
- xlsx正本対応
- ユーザーアカウント
- AI API連携

---

## 5. UX要件

### 5.1 起動体験

理想の流れ:

1. アプリを起動
2. CSVを開く
3. すぐシート表示
4. すぐ編集可能

ユーザーに余計な設定を求めない。

### 5.2 CSVを開いた直後の状態

- 1行目をヘッダーっぽく表示
- 列幅を内容に応じて自動調整
- 長文列は広げすぎず、最大幅を設定
- 行番号・列番号を表示
- A1セルを選択状態にする
- すぐキーボード入力できる

### 5.3 列幅自動調整

列幅は保存しない。開くたびに計算する。

基本方針:

- 各列の先頭N行を走査
- ヘッダーとセル内容の表示幅を推定
- 日本語・全角文字は幅2相当で計算
- ASCIIは幅1相当
- 最小幅・最大幅を設ける
- 長文列は最大幅で止め、セル内は省略表示または横スクロール

初期値案:

```ts
const COLUMN_WIDTH = {
  min: 80,
  max: 420,
  padding: 32,
  asciiChar: 8,
  wideChar: 16,
};
```

より正確にするならCanvasの `measureText` を使う。

### 5.4 セル編集

- ダブルクリックで編集
- Enterで編集確定して下へ移動
- Tabで右へ移動
- Shift+Tabで左へ移動
- Escで編集キャンセル
- 矢印キーでセル移動
- F2で編集開始
- 文字入力で即編集開始
- コピー/ペースト対応

### 5.5 行・列操作

#### 行追加

- ツールバーに「行追加」
- 右クリックメニューに「上に行を追加」「下に行を追加」
- 最終行の下でEnterすると行追加

#### 列追加

- ツールバーに「列追加」
- 右クリックメニューに「左に列を追加」「右に列を追加」

#### 削除

- 行番号右クリックで行削除
- 列ヘッダー右クリックで列削除
- Deleteでセル内容削除

### 5.6 保存

- Ctrl+Sで即保存
- 保存後に「保存しました」を控えめに表示
- 変更ありの場合はタイトルに `*` を付ける
- 未保存で閉じる場合は確認ダイアログ

### 5.7 文字コード

v0.1:

- UTF-8 読み込み
- UTF-8 保存
- BOMなしを標準

v0.2以降:

- UTF-8 BOM付き保存
- CP932 / Shift_JIS 読み込み
- CP932保存
- 改行コード LF / CRLF 切替

Excel向けには「UTF-8 BOM + CRLF」保存オプションを用意する。

### 5.8 区切り文字

v0.1:

- カンマ区切りCSV

v0.2:

- TSV
- セミコロン
- パイプ
- 自動判定

---

## 6. 画面構成

### 6.1 メイン画面

```text
┌─────────────────────────────────────────────┐
│ PlainSheet                         sample.csv │
├─────────────────────────────────────────────┤
│ [開く] [保存] [行追加] [列追加] [削除] [検索] │
├────┬────────┬──────┬──────────┬────────────┤
│    │ A      │ B    │ C        │ D          │
├────┼────────┼──────┼──────────┼────────────┤
│ 1  │ 氏名   │ 年齢 │ 部署     │ 入社日     │
│ 2  │ 石坂宏 │ 41   │ 情報シス │ 2018-04-01 │
│ 3  │ 山田   │ 35   │ 営業     │ 2020-10-01 │
└────┴────────┴──────┴──────────┴────────────┘
│ 3行 x 4列 | UTF-8 | LF | 未保存なし           │
└─────────────────────────────────────────────┘
```

### 6.2 ツールバー

必須:

- 開く
- 保存
- 行追加
- 列追加
- 削除
- 検索
- 設定

将来:

- TSVとして保存
- Markdown Tableとして保存
- JSONとして保存
- YAMLとして保存
- Git diff表示
- AI用コピー

### 6.3 ステータスバー

表示項目:

- 行数
- 列数
- 文字コード
- 改行コード
- 区切り文字
- 保存状態
- 自動列幅ON/OFF

例:

```text
128行 x 12列 | UTF-8 | LF | comma | 自動列幅 ON | 保存済み
```

---

## 7. ファイル仕様

### 7.1 CSV読み込み

最低限サポート:

- カンマ区切り
- ダブルクォート対応
- セル内カンマ対応
- セル内改行対応
- 空セル対応
- 行ごとの列数差異に対応

推奨ライブラリ:

- Papa Parse

ただし依存は最小にする。自前実装する場合はCSV仕様の罠が多いため注意。

### 7.2 CSV保存

保存ルール:

- カンマを含むセルはダブルクォートで囲む
- ダブルクォートは `""` にエスケープ
- 改行を含むセルはダブルクォートで囲む
- 末尾の不要なカンマは付けない
- 行数・列数は内部データに従う
- 空セルは空文字として保存

例:

```csv
氏名,年齢,部署,メモ
石坂宏,41,情報システム,"AI, CSV, Git"
山田太郎,35,営業,
```

---

## 8. 技術スタック候補

### 方針

最初は軽く作る。スターを狙うなら、試しやすさが重要。

### 候補A: Webアプリ + PWA

おすすめ度: 高

- Vite
- React
- TypeScript
- CSS Modules or plain CSS
- File System Access API
- PWA対応

メリット:

- ブラウザで試せる
- GitHub Pagesでデモ公開できる
- インストール不要
- OSSとして見てもらいやすい
- 将来デスクトップ化しやすい

デメリット:

- File System Access APIはブラウザ差がある
- Safariで制限あり

### 候補B: Tauri + Web UI

おすすめ度: 高

- Tauri
- React
- TypeScript
- Rust backend

メリット:

- 軽量なデスクトップアプリになる
- Windows配布しやすい
- ローカルファイル操作が安定
- Electronより軽い

デメリット:

- セットアップが少し重い
- Rust/Tauriのビルド環境が必要

### 候補C: 単一HTML

おすすめ度: 中

- HTML
- CSS
- JavaScript

メリット:

- 最も軽い
- offline-md-editor-viewerの経験を活かせる
- すぐ作れる

デメリット:

- プロダクトとして育てると構造化がつらい
- テストや拡張で苦しくなる

### 推奨

まずは **Vite + React + TypeScript** でWeb版を作る。

その後、Tauriでデスクトップ化する。

```text
v0.1 Web版
v0.2 PWA
v0.3 Tauri Windows版
```

---

## 9. ディレクトリ構成案

```text
plainsheet/
├── README.md
├── LICENSE
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── public/
│   ├── icon.svg
│   └── sample.csv
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── styles/
│   │   ├── global.css
│   │   └── sheet.css
│   ├── components/
│   │   ├── Toolbar.tsx
│   │   ├── SheetGrid.tsx
│   │   ├── Cell.tsx
│   │   ├── StatusBar.tsx
│   │   ├── ContextMenu.tsx
│   │   └── FileDropZone.tsx
│   ├── hooks/
│   │   ├── useSheetData.ts
│   │   ├── useKeyboard.ts
│   │   ├── useSelection.ts
│   │   └── useFileAccess.ts
│   ├── lib/
│   │   ├── csv.ts
│   │   ├── columnWidth.ts
│   │   ├── encoding.ts
│   │   ├── clipboard.ts
│   │   └── table.ts
│   ├── types/
│   │   └── sheet.ts
│   └── tests/
│       ├── csv.test.ts
│       └── columnWidth.test.ts
└── docs/
    ├── concept.md
    ├── roadmap.md
    └── screenshots/
```

---

## 10. データモデル

```ts
export type CellValue = string;

export type SheetData = {
  rows: CellValue[][];
};

export type Selection = {
  row: number;
  col: number;
};

export type SheetMeta = {
  fileName?: string;
  encoding: "utf-8" | "utf-8-bom" | "cp932";
  newline: "LF" | "CRLF";
  delimiter: "," | "\t" | ";" | "|";
  dirty: boolean;
};

export type ColumnInfo = {
  index: number;
  width: number;
  header: string;
};

export type AppState = {
  sheet: SheetData;
  meta: SheetMeta;
  selected: Selection;
  columnWidths: number[];
};
```

---

## 11. 主要機能の実装仕様

### 11.1 CSV Parse

```ts
parseCsv(text: string, delimiter = ","): SheetData
```

要件:

- quoted cell対応
- escaped quote対応
- newline inside quote対応
- empty cell対応
- irregular columns対応

### 11.2 CSV Serialize

```ts
serializeCsv(sheet: SheetData, delimiter = ",", newline = "\n"): string
```

要件:

- 必要なセルだけquote
- quote内の `"` を `""` に変換
- 改行コード指定
- 最終行末の改行は設定可能

### 11.3 Auto Column Width

```ts
calculateColumnWidths(sheet: SheetData, options?: ColumnWidthOptions): number[]
```

計算方針:

- 最大走査行数は初期値1000
- ヘッダー行は必ず見る
- 全角文字幅を考慮
- 最大幅を超えない
- 空列は最小幅

疑似コード:

```ts
for each column:
  maxDisplayWidth = 0
  for each row up to limit:
    text = cell value
    displayWidth = measureDisplayWidth(text)
    maxDisplayWidth = max(maxDisplayWidth, displayWidth)

  px = maxDisplayWidth * charPx + padding
  width = clamp(px, minWidth, maxWidth)
```

### 11.4 Keyboard Navigation

対応:

- Arrow keys
- Enter
- Shift+Enter
- Tab
- Shift+Tab
- Ctrl+S
- Ctrl+O
- Ctrl+F
- Delete
- F2
- Esc

### 11.5 Clipboard

v0.1:

- 単一セルコピー
- 単一セル貼り付け

v0.2:

- 複数セルコピー
- Excel/LibreOfficeから貼り付け
- TSVとしてクリップボードに出す

### 11.6 Context Menu

セル右クリック:

- コピー
- 貼り付け
- セルを空にする
- 上に行追加
- 下に行追加
- 左に列追加
- 右に列追加

列ヘッダー右クリック:

- 左に列追加
- 右に列追加
- 列削除
- 列幅を再計算

行ヘッダー右クリック:

- 上に行追加
- 下に行追加
- 行削除

---

## 12. UXでスターを狙うポイント

### 12.1 最初の5秒で良さが伝わる

READMEにGIFを置く。

GIF内容:

1. CSVをドラッグ&ドロップ
2. 自動でシート表示
3. 列幅が見やすい
4. セル編集
5. 行追加
6. Ctrl+S保存

### 12.2 デモURLを用意

GitHub Pagesで動くデモを公開。

```text
https://ishizakahiroshi.github.io/plainsheet/
```

READMEの一番上に配置。

### 12.3 キャッチコピー

候補:

> A local-first plain text spreadsheet editor for humans and AI.

日本語:

> AIと人間のための、ローカルファーストなプレーンテキスト表エディタ。

### 12.4 スターが付きやすいREADME構成

```md
# PlainSheet

A local-first plain text spreadsheet editor for humans and AI.

![demo](docs/demo.gif)

## Why?

AI loves CSV. Humans don't love fixing column widths every time.

PlainSheet makes CSV pleasant to edit without turning it into XLSX.

## Features

- Open CSV as a sheet instantly
- Auto-fit columns on open
- Edit cells directly
- Add/delete rows and columns
- Save back to CSV
- Local-first and offline-friendly
- Designed for AI workflows

## Roadmap

- TSV
- Markdown Table
- JSON
- YAML
- Tauri desktop app
```

### 12.5 「既存ツールとの違い」を明確にする

READMEに比較表を置く。

| Tool | Opens CSV as sheet | Auto-fit on open | Add rows/cols | Lightweight | Local-first | AI-friendly |
|---|---|---|---|---|---|---|
| Excel | yes | no | yes | no | yes | medium |
| LibreOffice | yes | manual | yes | medium | yes | medium |
| VSCode Edit CSV | yes | partial | yes | no | yes | good |
| PlainSheet | yes | yes | yes | yes | yes | yes |

---

## 13. 開発フェーズ

### Phase 0: リポジトリ作成

- GitHub repo作成
- README初稿
- LICENSE追加
- Issueテンプレート
- GitHub Pages設定
- package setup

完了条件:

- `npm install`
- `npm run dev`
- 空の画面が起動する

### Phase 1: CSV読み込み・表示

実装:

- CSV parse
- sample.csv表示
- HTML table rendering
- 行番号/列番号表示
- 自動列幅計算

完了条件:

- sample.csvがシート表示される
- 長文セルを含む列が見やすく表示される

### Phase 2: セル編集

実装:

- セル選択
- ダブルクリック編集
- Enter確定
- Escキャンセル
- Tab移動
- 矢印移動

完了条件:

- Excel風に最低限編集できる

### Phase 3: 行列操作

実装:

- 行追加
- 列追加
- 行削除
- 列削除
- 右クリックメニュー

完了条件:

- マウス操作で行列を増減できる

### Phase 4: ファイル保存

実装:

- ファイルオープン
- Ctrl+S保存
- 名前を付けて保存
- dirty state
- 未保存確認

完了条件:

- CSVを開いて編集し、CSVとして保存できる

### Phase 5: UX改善

実装:

- ドラッグ&ドロップ
- ステータスバー
- 検索
- Undo/Redo
- ショートカットヘルプ
- サンプルデータ

完了条件:

- 初見ユーザーが迷わず使える

### Phase 6: 公開準備

実装:

- README整備
- demo.gif
- スクリーンショット
- GitHub Pages
- release v0.1.0

完了条件:

- note / X / GitHubで公開できる

---

## 14. v0.1の詳細タスク

### Setup

- [ ] `npm create vite@latest plainsheet -- --template react-ts`
- [ ] ESLint / Prettier設定
- [ ] 基本CSS作成
- [ ] GitHub repo作成
- [ ] MIT License追加

### CSV

- [ ] `parseCsv()` 実装
- [ ] `serializeCsv()` 実装
- [ ] quoted comma対応
- [ ] quoted newline対応
- [ ] quote escape対応
- [ ] 単体テスト追加

### Grid

- [ ] `SheetGrid` 作成
- [ ] 行番号表示
- [ ] 列番号表示 A/B/C...
- [ ] セル表示
- [ ] 選択セル表示
- [ ] スクロール対応

### Column Width

- [ ] `measureDisplayWidth()` 実装
- [ ] 日本語全角対応
- [ ] `calculateColumnWidths()` 実装
- [ ] 最小幅/最大幅設定
- [ ] 再計算ボタン追加

### Editing

- [ ] セルダブルクリック編集
- [ ] F2編集
- [ ] 文字入力で編集開始
- [ ] Enter確定
- [ ] Escキャンセル
- [ ] Tab移動
- [ ] Deleteでセルクリア

### Row/Column

- [ ] 行追加
- [ ] 列追加
- [ ] 行削除
- [ ] 列削除
- [ ] 右クリックメニュー

### File

- [ ] ファイル選択でCSV読み込み
- [ ] Drag & Drop読み込み
- [ ] Ctrl+S保存
- [ ] 名前を付けて保存
- [ ] dirty state
- [ ] beforeunload警告

### UI

- [ ] Toolbar
- [ ] StatusBar
- [ ] Empty State
- [ ] Help Modal
- [ ] About Modal
- [ ] Keyboard Shortcut一覧

### Docs

- [ ] README
- [ ] demo.gif
- [ ] concept.md
- [ ] roadmap.md
- [ ] sample.csv

---

## 15. UIデザイン方針

### 色

- ベース: 白 / グレー
- アクセント: 緑
- 選択セル: 緑枠
- 未保存: 黄色 or ドット表示
- エラー: 赤

### 雰囲気

- Excelより軽い
- VSCode拡張より親しみやすい
- Google Sheetsよりローカル感
- CSV専用だが、将来Plain Text Table全般へ広げられる雰囲気

### UI原則

- 開いたらすぐ編集できる
- 操作を隠しすぎない
- 右クリックを便利にする
- キーボード操作を強くする
- 初心者にも分かる
- エンジニアにも邪魔にならない

---

## 16. アクセシビリティ

- キーボードのみで基本操作可能
- フォーカス位置を明確に表示
- コントラストを十分に確保
- ボタンにaria-label
- スクリーンリーダー対応は段階的に対応

---

## 17. パフォーマンス方針

### v0.1対象

- 数百行〜数千行
- 数十列

### v0.2以降

- 仮想スクロール
- 1万行以上対応
- Web Workerでparse
- 大容量CSVプレビュー

### 初期制限を明記

READMEに以下を記載:

> v0.1 is optimized for small to medium CSV files. Large file support is planned.

---

## 18. セキュリティ・プライバシー

- ファイルはローカルで処理
- サーバーに送信しない
- AI APIにも勝手に送らない
- 外部通信なしを目指す
- 将来オンライン機能を入れる場合も明示的なオプトイン

### 依存関係ポリシー

- 依存は最小限
- メンテナンス状況を確認
- 中国系ベンダー・不明瞭な依存は避ける
- 可能な限り広く使われているOSSを採用
- telemetry系ライブラリは入れない

---

## 19. 将来ロードマップ

### v0.1

- CSVエディタ基本機能
- Web版
- GitHub Pagesデモ

### v0.2

- TSV対応
- UTF-8 BOM / CP932対応
- 検索・置換
- Undo / Redo
- クリップボード複数セル対応

### v0.3

- Markdown Table対応
- Markdown内のテーブルだけ編集
- mdとして保存

### v0.4

- JSON array対応
- YAML list対応
- Import/Export強化

### v0.5

- Tauri desktop app
- Windows portable exe
- ファイル関連付け

### v1.0

- 安定版
- 大容量ファイル対応
- Git diff helper
- plugin system検討

---

## 20. Markdown Table対応構想

Markdown Tableを開くと、テーブル部分だけをシートとして編集できる。

入力:

```md
| name | age | team |
|---|---:|---|
| Taro | 35 | Sales |
| Hanako | 29 | HR |
```

PlainSheetでは表として表示。

保存時:

```md
| name | age | team |
|---|---:|---|
| Taro | 35 | Sales |
| Hanako | 29 | HR |
```

将来的には、Markdown文書内に複数テーブルがある場合、テーブル一覧から選んで編集できるようにする。

---

## 21. JSON/YAML対応構想

### JSON array

```json
[
  { "name": "Taro", "age": 35, "team": "Sales" },
  { "name": "Hanako", "age": 29, "team": "HR" }
]
```

これを表として表示。

### YAML list

```yaml
- name: Taro
  age: 35
  team: Sales
- name: Hanako
  age: 29
  team: HR
```

これを表として表示。

### 方針

- v0.1ではやらない
- ただし内部データモデルは将来対応できるようにしておく
- CSVに依存しすぎない設計にする

---

## 22. Codex向け実装プロンプト例

### 初期セットアップ

```text
PlainSheetというReact + TypeScript + Viteのプロジェクトを作成してください。
目的はCSVをローカルで開き、シート形式で編集し、CSVとして保存できる軽量エディタです。
まずは以下を実装してください。

- Vite + React + TypeScript
- App.tsx
- sample.csvを読み込んだような初期データ
- SheetGridコンポーネント
- 行番号と列番号
- セル表示
- シンプルなCSS
```

### CSVパーサー

```text
src/lib/csv.ts にCSVパーサーとシリアライザーを実装してください。
要件:
- カンマ区切り
- ダブルクォート対応
- セル内カンマ対応
- セル内改行対応
- ダブルクォートのエスケープ対応
- parseCsv(text): string[][]
- serializeCsv(rows): string
- Vitestで単体テストを追加
```

### 列幅自動計算

```text
src/lib/columnWidth.ts を作成してください。
CSVの各列について、内容に応じた表示幅をpxで返す関数を実装してください。
日本語など全角文字は幅2、ASCIIは幅1として概算し、最小80px、最大420pxに制限してください。
```

### セル編集

```text
SheetGridでセル編集を実装してください。
要件:
- セルクリックで選択
- ダブルクリックで編集
- Enterで確定
- Escでキャンセル
- Tabで右に移動
- Deleteでセル内容削除
- 編集後はdirty stateをtrueにする
```

### 行列追加

```text
行追加・列追加・行削除・列削除を実装してください。
Toolbarにボタンを追加し、選択中のセルを基準に操作してください。
```

### ファイル読み書き

```text
ブラウザのFile APIを使ってCSVファイルを開けるようにしてください。
保存はBlobを使ってダウンロードしてください。
可能ならFile System Access APIで上書き保存にも対応してください。
対応できないブラウザでは名前を付けて保存で構いません。
```

---

## 23. GitHub公開戦略

### リポジトリ名

候補:

- `plainsheet`
- `plain-sheet`
- `plainsheet-editor`

推奨:

```text
plainsheet
```

### Topics

```text
csv
editor
spreadsheet
local-first
ai
typescript
react
markdown-table
plain-text
offline
```

### README冒頭

```md
# PlainSheet

A local-first plain text spreadsheet editor for humans and AI.

AI loves CSV. Humans don't love fixing column widths every time.
PlainSheet makes CSV pleasant to edit without turning it into XLSX.
```

### スターを狙う要素

- GIFで一瞬で価値を見せる
- ブラウザデモを用意
- 既存ツールとの比較表
- 「AI loves CSV. Humans don't love fixing column widths.」のような強いコピー
- v0.1でも触れるものを出す
- ロードマップを明確にする
- Issuesを歓迎する
- 日本語・英語README両方用意する

---

## 24. 最初のREADMEドラフト

```md
# PlainSheet

A local-first plain text spreadsheet editor for humans and AI.

> AI loves CSV. Humans don't love fixing column widths every time.

PlainSheet is a lightweight editor that opens CSV files as clean, editable sheets.
It keeps your data plain, local, and AI-friendly.

## Features

- Open CSV as a sheet instantly
- Auto-fit columns on open
- Edit cells directly
- Add and delete rows
- Add and delete columns
- Save back to CSV
- Local-first
- Offline-friendly
- Designed for AI workflows

## Why PlainSheet?

CSV is great for AI:

- easy to parse
- easy to generate
- Git-friendly
- no unnecessary metadata

But CSV is not always pleasant for humans to edit.

PlainSheet bridges that gap.

## Roadmap

- CSV
- TSV
- Markdown Table
- JSON Array
- YAML List
- Tauri desktop app

## License

MIT
```

---

## 25. 完成の定義

v0.1完成条件:

- GitHub Pagesでデモが動く
- CSVを開ける
- 自動列幅で表示される
- セル編集できる
- 行追加できる
- 列追加できる
- CSV保存できる
- READMEにGIFがある
- X/noteで公開できる
- Issueで改善要望を受けられる

---

## 26. 最優先で守ること

### やる

- シンプルにする
- 起動を軽くする
- CSVを壊さない
- キーボード操作を快適にする
- 初見で意味が分かるUIにする
- READMEを強くする

### やらない

- Excel代替を目指さない
- クラウド同期を最初から入れない
- 関数や装飾に深入りしない
- 独自メタデータを増やしすぎない
- 複雑な設定画面を作らない
- AI API連携を最初から入れない

---

## 27. 最後に

PlainSheetは、新しい表計算ソフトではない。

CSVやMarkdown Tableのようなプレーンテキストの表を、AIにも人間にも心地よくするための小さなエディタである。

最初は小さくていい。

CSVを開く。
見やすい。
編集できる。
保存できる。

それだけで、十分に価値がある。

**Local First. CSV First. AI First.**
