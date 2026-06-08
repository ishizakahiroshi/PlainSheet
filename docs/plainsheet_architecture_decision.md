# PlainSheet 技術方針決定メモ

> 最終更新: 2026-06-08(Mon) UTC

## 決定事項

PlainSheet v0.1.0 は、**Tauri 2 + React + TypeScript + Vite** で実装する。

- 本命: Tauri Desktop App
- デモ: React Web版 / GitHub Pages
- UI: React + TypeScript
- ローカルファイル操作: Tauri / Rust
- Web fallback: browser file picker + download save
- 初期ターゲット: Windows
- 将来: macOS / Linux / Web Demo 継続

## 採用理由

PlainSheet の核は、CSVを開き、見やすいシートとして編集し、Ctrl+Sでそのまま保存する体験。

ブラウザのみだと直接上書き保存が File System Access API に依存し、Firefox / Safari では保存体験が弱くなる。そのため、v0.1.0 の本命は Tauri Desktop App とする。

Electron は開発しやすいが、軽量なCSVエディタという思想に対して重くなりやすい。Tauri は OS WebView と Rust backend を使えるため、Web UI の作りやすさとローカルファイル操作の安定性のバランスがよい。

## v0.1.0 の実装状態

```text
PlainSheet
├── React + TypeScript
│   ├── グリッドUI
│   ├── セル編集
│   ├── 行・列操作
│   ├── 検索・置換
│   ├── Undo / Redo
│   ├── クリップボード範囲操作
│   ├── 列幅自動調整
│   └── Web fallback
│
└── Tauri / Rust
    ├── ファイルを開く
    ├── ファイルを保存
    ├── 名前を付けて保存
    ├── ネイティブダイアログ
    ├── エンコード検出
    └── エンコード変換保存
```

## 対応フォーマット

- CSV
- TSV
- Markdown Table
- JSON array
- YAML list

## エンコード方針

Tauri版:

- UTF-8
- UTF-8 BOM
- Shift_JIS / CP932
- EUC-JP
- Latin-1

Web版:

- Browser File API の制約に従い、基本は UTF-8 テキストとして扱う
- 保存は直接上書きではなくダウンロード fallback

## 今後の方針

v0.1.0 は小〜中規模CSVを快適に扱う範囲で完成。次以降で、仮想スクロール、大容量ファイル、複数タブ、最近開いたファイル、エクスポート強化、Git diff helper を進める。
