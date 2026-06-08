# [v0.1.0 完了] PlainSheet 実装計画

> 最終更新: 2026-06-08(Mon) UTC

## 現在の結論

PlainSheet v0.1.0 は、CSVを中心にしたローカルファーストな表エディタとして、触れる状態まで完了。

完了済み:

- Tauri 2 + React + TypeScript + Vite のアプリ構成
- CSV / TSV / Markdown Table / JSON array / YAML list の基本読み書き
- UTF-8 / UTF-8 BOM / Shift_JIS / EUC-JP / Latin-1 の読み書き基盤
- CSV parser / serializer
- 自動列幅計算、手動列幅変更
- シート表示、行番号、列番号、ヘッダー行強調
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

## 品質チェック

2回チェック済み。

- 1回目: test / build / lint を実行
- 1回目で JSON/YAML の欠損値が `""` ではなく `"\"\""` になるバグを検出して修正
- 修正後: 45 tests passed
- 2回目: test / lint / GitHub Pages build を再実行して通過

実行結果:

```text
npm run test   -> 5 files, 45 tests passed
npm run build  -> passed
npm run lint   -> passed
GITHUB_PAGES=1 npm run build -> passed
```

追加済み:

```text
.github/workflows/tauri-release.yml -> Windows / macOS / Linux の Tauri build。ブランチ/PRではビルド確認のみ、手動実行ではartifact確認、v*タグではRelease添付。
```

未確認:

- `cargo check --manifest-path src-tauri/Cargo.toml`

理由:

```text
error: linker `cc` not found
```

この環境に `cc/gcc/clang` と `sudo` がないため、Rust/Tauri 側のビルド確認は環境ブロック。ソース更新とフロントエンド品質チェックは完了済み。

## v0.1.0 完成条件との対応

| 条件 | 状態 |
|---|---|
| CSVを開ける | 完了 |
| 自動列幅で表示される | 完了 |
| セル編集できる | 完了 |
| 行追加できる | 完了 |
| 列追加できる | 完了 |
| 行削除・列削除できる | 完了 |
| CSV保存できる | 完了 |
| 変更あり/なし表示 | 完了 |
| Ctrl+S保存 | 完了 |
| Webデモ用 build | 完了 |
| README | 完了 |
| GitHub Pages workflow | 完了 |
| Tauri release workflow | 完了 |
| Tauri実機ビルド | 環境未確認 |

## 次リリース以降

- 1万行以上向けの仮想スクロールとWeb Worker
- ソート、フィルタ、データクリーニング、オートフィル
- 複数タブ、最近開いたファイル、セッション復元
- HTML / SQL / xlsx export
- Git diff ハイライト
- 全プラットフォームの実機ビルド検証とGitHub Releases配布

## 注意

詳細な作業用 plan は `docs/local/plan_plainsheet-v010.md` にもあるが、`docs/local/` は `.gitignore` 対象。公開・確認用の正本はこのファイル。
