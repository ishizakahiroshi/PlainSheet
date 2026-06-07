# PlainSheet 技術方針決定メモ

## 決定事項

PlainSheet v0.1 は、**Tauri + React + TypeScript** で実装する。

- 本命: Tauri Desktop App
- デモ: React Web版 / GitHub Pages
- UI: React + TypeScript
- ローカルファイル操作: Tauri / Rust
- 初期ターゲット: Windows
- 将来: macOS / Linux / Web Demo

---

## なぜブラウザ版だけにしないのか

PlainSheet のコア体験は、CSVを開き、最初からシート表示し、編集し、Ctrl+Sでそのまま保存することです。

ブラウザ版だけで作る場合、ローカルファイル保存は File System Access API に依存します。Chrome / Edge では比較的よい体験を作れますが、Firefox / Safari では保存時にダウンロード保存へ落ちる可能性があります。

その場合、保存のたびにダウンロードフォルダへCSVが増える体験になり、PlainSheet の価値である「CSVを気持ちよく直接編集する」から外れます。

そのため、ブラウザ版だけを本命にはしません。

---

## なぜ完全ネイティブアプリにしないのか

Rust / Go で完全ネイティブGUIを作る案もあります。

しかし、PlainSheet の価値は、グリッドUI、セル編集、キーボード操作、日本語IME対応、見やすい列幅、軽快なUXにあります。

完全ネイティブGUIでこれらを一から作ると、UI実装の負担が大きくなります。また、スターを狙うOSSとしては、できるだけ早く触れるものを出したい。

そのため、v0.1では完全ネイティブGUIは採用しません。

---

## なぜElectronにしないのか

Electronは開発しやすいですが、PlainSheet の思想とは少し合いません。

PlainSheet は、

- Local First
- CSV First
- AI First
- 軽量
- シンプル

を重視します。

ElectronはChromiumとNode.jsを同梱するため、CSVを軽く開くツールとしては重くなりやすいです。

今回欲しいのは巨大なアプリではなく、CSVを開いて、見やすく編集して、保存するための小さなエディタです。

そのため、Electronはv0.1では採用しません。

---

## なぜTauriにするのか

Tauri は、Web UI とネイティブファイル操作のバランスが良いです。

### UIをReactで作れる

- シートUIを作りやすい
- セル編集を実装しやすい
- キーボード操作を作り込みやすい
- Web版デモに流用できる

### ファイル操作をネイティブ側で担保できる

- CSVを開く
- CSVを保存する
- Ctrl+Sで上書き保存する
- 名前を付けて保存する
- 未保存時に確認する

### Electronより軽量にしやすい

TauriはOSのWebViewを利用するため、ElectronのようにChromiumを丸ごと同梱する方向とは異なります。PlainSheet の「軽量エディタ」というコンセプトに合っています。

---

## 採用アーキテクチャ

```text
PlainSheet
├── React + TypeScript
│   ├── グリッドUI
│   ├── セル編集
│   ├── 行・列操作
│   ├── 列幅自動調整
│   └── 状態管理
│
└── Tauri / Rust
    ├── ファイルを開く
    ├── ファイルを保存
    ├── 名前を付けて保存
    ├── ネイティブダイアログ
    └── アプリメニュー
```

---

## Web版デモの位置づけ

Web版は捨てません。ただし、本命ではなく **デモ用途** とします。

### Web版の目的

- GitHub Pagesで気軽に試せる
- READMEからすぐ触れる
- GitHubスター獲得に使う
- UIの雰囲気を見せる
- インストール前に価値を伝える

### Web版の保存仕様

- Chrome / Edge: File System Access API が使える場合は上書き保存
- それ以外: ダウンロード保存
- READMEにブラウザ制約を明記する

---

## v0.1 の実装方針

### 本命

```text
Tauri Desktop App
```

### デモ

```text
React Web App on GitHub Pages
```

### 技術スタック

```text
Tauri
React
TypeScript
Vite
Rust
```

### 初期対応OS

```text
Windows
```

### 将来対応

```text
macOS
Linux
```

---

## v0.1 で最優先する体験

```text
CSVを開く
↓
自動で列幅が整う
↓
シートとして編集できる
↓
行追加・列追加できる
↓
Ctrl+Sでそのまま保存できる
```

### 重要な差別化

- xlsxに変換しない
- CSVを正本にする
- 数値や日付を勝手に変換しない
- 001を001のまま扱う
- 余計なメタデータを保存しない
- AIがそのまま読める状態を維持する

---

## v0.1 着手前に必ずやるスパイク

### Spike 1: Tauri ファイル保存

目的:

- CSVを開く
- 編集する
- Ctrl+Sで同じファイルに上書き保存
- 名前を付けて保存
- 未保存時の確認

成果物:

```text
spikes/tauri-file-access/
```

完了条件:

- WindowsでCSVを開ける
- Ctrl+Sで上書き保存できる
- 保存先を保持できる
- アプリ再起動後も基本動作する

---

### Spike 2: グリッド方式比較

目的:

v0.1で使うグリッド実装方式を決定する。

候補:

1. 自作 HTML table
2. 自作 div grid
3. 既存グリッドライブラリ

比較データ:

```text
100行 x 20列
1,000行 x 30列
5,000行 x 50列
```

確認項目:

- 初期描画速度
- スクロール
- セル編集
- 行追加
- 列追加
- 列幅自動調整
- 日本語IME
- 実装しやすさ
- 将来の仮想スクロール対応

現時点の仮説:

```text
v0.1は自作 div grid が有力
```

理由:

- HTML tableより将来拡張しやすい
- Canvas系グリッドよりセル編集やIME対応を作り込みやすい
- v0.1の規模なら十分軽い可能性が高い

---

### Spike 3: 日本語IME編集

目的:

日本語入力が壊れないセル編集を確認する。

確認項目:

- ひらがな入力
- 漢字変換
- EnterでIME確定
- Enterでセル編集確定
- 変換中の矢印キー
- Escキャンセル
- F2編集開始
- 文字入力で編集開始

実装方針:

- compositionstart / compositionend を見る
- KeyboardEvent.isComposing を見る
- 必要に応じて keyCode 229 を補助的に扱う
- IME変換中はセル移動系ショートカットを発火させない

完了条件:

- 日本語入力中に勝手にセル移動しない
- IME確定とセル確定が衝突しない
- Windows + Chrome WebView2環境で問題なく入力できる

---

### Spike 4: CSVラウンドトリップ

目的:

CSVを読み込んで保存したときに、不要な差分や破壊が起きにくいか確認する。

v0.1で保持したいもの:

- LF / CRLF
- 末尾改行の有無
- 区切り文字
- UTF-8 / UTF-8 BOM
- 行ごとの列数差異

v0.1で完全保持しない可能性があるもの:

- 不要なダブルクォートの有無
- セルごとの元のquote状態
- 空白の表現差

保存方針:

- セル内容を壊さないことを最優先
- 改行コードは読み込んだ形式を保持
- 末尾改行の有無を保持
- 行ごとの列数差異を可能な限り保持
- quote完全保持は将来の strict round-trip mode で対応検討

---

## 状態管理方針

Undo / Redo は後付けするとつらいため、v0.1から状態更新はUndoを見据えた設計にします。

### v0.1の方針

- SheetDataはimmutableに更新する
- セル編集・行追加・列追加・削除を操作単位で扱う
- 初期実装はスナップショット履歴でよい
- 最大履歴数は100程度
- 入力中の1文字ごとではなく、編集確定時に1履歴として保存する

### 将来

- Command pattern
- 差分ベースUndo
- 大容量CSV向け履歴最適化

---

## CSV Parser / Serializer 方針

### Parser

v0.1では Papa Parse を採用候補とします。

理由:

- quoted comma
- quoted newline
- escaped quote
- irregular columns

など、CSV仕様の罠を自前実装しすぎないため。

ただし、採用前に以下を確認します。

- ライセンス
- メンテナンス状況
- バンドルサイズ
- 不要な通信やtelemetryがないこと
- 中国系ベンダー由来でないこと

### Serializer

保存処理は自前実装を基本とします。

理由:

- 改行コード保持
- 末尾改行保持
- quote方針制御
- 将来の最小diff保存
- Excel向け保存モード

---

## 列幅計算方針

列幅は保存しません。

開くたびに内容から自動計算します。

### 方針

- CanvasRenderingContext2D.measureText を使う
- 実際のUIフォントで測る
- ヘッダー行と先頭N行を見る
- 最大幅を超える場合は最大幅で止める
- 長文セルは横にはみ出し/省略表示を検討
- 列幅は保存しない

### 初期値

```ts
const autoWidthOptions = {
  minWidth: 72,
  maxWidth: 420,
  padding: 32,
  scanRows: 1000,
};
```

---

## READMEで明記すること

### 一言コピー

```text
A local-first plain text spreadsheet editor for humans and AI.
```

### 強いコピー

```text
AI loves CSV. Humans don't love fixing column widths every time.
```

### v0.1で明記する制約

- v0.1は小〜中規模CSV向け
- 大容量CSV対応は今後
- Web demoは保存体験に制限あり
- 本命はTauri Desktop App
- CSVを正本にし、xlsx代替ではない
- 数値や日付を勝手に変換しない

---

## GitHub Topics

```text
csv
editor
spreadsheet
local-first
ai
typescript
react
tauri
rust
plain-text
offline
markdown-table
```

---

## ロードマップ修正版

### v0.1

- Tauri Desktop App
- Windows対応
- CSV読み込み
- シート表示
- 自動列幅
- セル編集
- 行追加
- 列追加
- CSV保存
- GitHub Pagesデモ

### v0.2

- UTF-8 BOM / CP932
- TSV
- 検索・置換
- Undo / Redo強化
- クリップボード複数セル

### v0.3

- Markdown Table対応
- Markdown内の表編集

### v0.4

- JSON array
- YAML list

### v0.5

- macOS / Linux
- Portable build
- Installer
- ファイル関連付け

### v1.0

- 大容量CSV対応
- 仮想スクロール
- Git diff helper
- 安定版

---

## 最終決定

PlainSheetは、Webだけのアプリではなく、**Tauriベースのローカルファーストなデスクトップアプリ**として作る。

ただし、UIはWeb技術で作り、GitHub Pagesで試せるデモも提供する。

```text
UIはWebで作る。
保存体験はネイティブで担保する。
だからTauri。
```

この方針でv0.1を進める。
