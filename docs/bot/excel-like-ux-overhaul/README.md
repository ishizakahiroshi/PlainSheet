# 案件 #20261005-004 Excel 風 UX 刷新（PlainSheet）

GitHub Issue/PR 番号とは別の案件番号。

## 最新の追加指示（2026-10-05）

[HTML版＋アプリ版のUX再点検と修正](DUAL-EDITION-UX.md) を先に読む。依頼者は両版の提供と共通操作の改善を採用した。既存の停止・引継ぎから同じPRで再開する条件、未実施受入、アイコン監査の範囲は追加指示を優先する。旧C1の未確認項目が合格したという意味ではない。

## 進め方（連鎖の依頼）

- 承認は最初の 1 回だけ。止まる条件に当たらない限り、C1 から C8 を確認なしで順に進める。会話への報告は「受付」「停止」「最後」の 3 回。
- 止まる条件:
  1. 同じ理由の CI 失敗が 2 回続いた
  2. 「変更してよい範囲」の外を触る必要が出た
  3. 新しい依存・課金・認証情報・外部サービスが要る
  4. 重大なレビュー指摘が 2 回直しても残る
  5. 指示と設計の食い違いが見つかった
  6. 持ち主の操作が要る（GitHub の確認画面、CI が始まらない等）
  7. 1 工程が 90 分を超えた
- C1 が「技術基盤（グリッド部品）の差し替え」を推奨した場合は、着手せず停止して報告する。
- 検証: 作業環境で依存を取得できない場合がある。その場合は最初に Draft PR を出し、各工程の合否は PR の CI で決める。看板に写すエラー原文のホームの絶対パスは `~/...` に置き換える。
- 印: commit 末尾に `Agent: dot`、PR にラベル。merge はしない。

## 目的

PlainSheet（ローカルファーストの plain text 表エディタ。CSV/TSV/Markdown Table/JSON/YAML を開き、同じ形式で保存する）を、Excel や Google スプレッドシートに近い手触りで迷わず使えるようにする。現状の実装や技術選択が正しいという前提は置かない。ユーザー体験が良くなるなら構成の見直しも検討対象（判定は C1）。

## 対象

- repo: `ishizakahiroshi/PlainSheet`
- 作業 branch の基点と PR の base: `develop`
- 挙動 oracle SHA: `c37b30064cb7a4abe4cda9bb3891a6f9c310de1d`
- 技術: React 18 + TypeScript + Vite 5、グリッドは `@glideapps/glide-data-grid`（canvas）、デスクトップは Tauri v2（Rust は薄い。ファイル入出力と文字コード変換が中心）、パッケージ管理は Bun
- 検証コマンド: `bun install`、`bun run test`、`bun run lint`、`bun run build`（`bun run dev` で Web 版を起動）

## 現状（コードで確認済み）

- 大きいファイル: `src/App.tsx` 992 行、`src/hooks/useFile.ts` 603 行、`src/components/GlideSheet.tsx` 544 行
- 既にある（コード上）: ソート `src/lib/sort.ts`、フィルタ `src/hooks/useFilter.ts`・`src/components/FilterPopover.tsx`、タブ `src/components/TabBar.tsx`・`src/hooks/useDocuments.ts`、フィルハンドル関連（`GlideSheet.tsx` の `fillHandle` / `onFillPattern`、`src/lib/autofill.ts`）、ウィンドウ枠固定の記述、ズーム、右クリックメニュー、検索・置換
- 無い: 列のドラッグ移動（`onColumnMoved` が `src` に存在しない）
- 未確認（C1 で画面を実際に操作して確認する）: 各機能が Excel と同じキー操作で動くか、日本語入力中の挙動、Enter/Tab 後の移動方向、フィルハンドルとウィンドウ枠固定が画面で使えるか。「コードにある」と「画面で使える」は別として扱う。

## 変更してよい範囲 / 維持すること / 対象外

- 変更してよい: `src/` 配下、`docs/` 配下の新規 md（下記）、`README.md`
- 維持する: 5 形式（CSV/TSV/Markdown Table/JSON/YAML）と文字コード（UTF-8/UTF-8 BOM/Shift_JIS/EUC-JP/Latin-1）の読み書き結果、既存の Ctrl+C/V（TSV）、Undo/Redo、設定の保存形式、テーマ切替（light/dark/system）。既存テストを壊さない
- 触らない: `src-tauri/` の Rust コード、`.github/workflows/`、依存の追加（グリッド部品は C1 の判定が差し替えでない限り変えない）
- 対象外: 数式の計算、複数シート、xlsx 読み書き、1 万行超の大容量対応、クラウド同期、AI API 呼び出し。ローカルファーストの原則（サーバー送信なし）は変えない

## 判定基準（C1 で実測する）

基盤を維持する条件は 3 つ。
1. 日本語入力（IME）で打ち始めのセル編集が Excel と同じように始まり、確定で崩れない
2. 範囲選択・フィルハンドル・列移動・枠固定が実用の速さで動く（2,000 行×30 列で操作に引っかかりがない）
3. 選択色・罫線・フォントを Excel に近い見た目へ寄せられる

見立て（未検証）: canvas のグリッドは速いが、セル内編集や IME の自然さで不利になりやすい。ただし差し替えは全面書き直しになるため、基準を割った場合だけ提案し、着手せず停止する。

## 実装順・担当・共有ファイル所有

C1 → C2 → C3 → C4 → C5 → C6 → C7 → C8 の直列。C2〜C5 は `src/components/GlideSheet.tsx` と `src/hooks/useSheet.ts` を共有するため並列にしない。担当の分け方は dots に任せる。ただし独立レビュー担当は実装担当と別にする。

## C 詳細

### C1 UX 差分監査と基盤判定

- 作業: Web 版を起動し、次の約 40 操作を実際に試す。文字キーで入力、F2、Enter/Tab/Shift+Tab/矢印、Esc、Delete、Ctrl+矢印、Shift+矢印、Ctrl+A、ヘッダークリック、フィルハンドルのドラッグ、Ctrl+D/R、コピー貼り付け、列幅ダブルクリック、列移動、枠固定、ソート、フィルタ、検索、Undo/Redo、日本語入力での編集開始。各操作に「Excel と同じ / 違う / 無い」を付け、違う・無いものを影響の大きい順（初めて使う人が詰まるか、毎日使う人が毎回困るか。実装の手間は順位に使わない）に並べる。判定基準 3 つを実測して基盤を維持/差し替えで判定する
- 変更ファイル: `docs/ux-gap-and-stack-decision.md`（新規）のみ。コードは変更しない
- 完了条件: 約 40 操作すべてに判定と確認方法（画面かテスト）がある／差分が影響順に並び C2〜C7 のどれで直すかが対応づいている／基盤判定が 3 基準の実測値つきで書かれている／差し替え推奨なら停止している

### C2 編集の核

- 作業: 文字キーで即編集（既存値は置換）、F2 で末尾から編集、ダブルクリックでも編集。Enter で下、Shift+Enter で上、Tab で右、Shift+Tab で左へ確定移動。Esc で取消。Delete で選択範囲をクリア。フィルハンドルのドラッグで連続データ・コピー入力、Ctrl+D（下へコピー）・Ctrl+R（右へコピー）。日本語入力の変換確定の Enter でセルを移動しない。変更は Undo 1 回で戻せる
- 変更ファイル: `src/components/GlideSheet.tsx`、`src/hooks/useSheet.ts`、`src/lib/autofill.ts`、`src/tests/useSheet.test.ts`、`src/tests/autofill.test.ts`
- 完了条件: 文字キーで選択セルが編集状態になり確定で値が入る／Enter・Tab・Shift+Tab・Shift+Enter の移動先が上記どおり／日本語の変換確定でセルが移動しない／フィルハンドルで 1,2 → 3,4,5 の連続入力ができる／Ctrl+D・Ctrl+R で範囲コピーでき Undo 1 回で戻る

### C3 選択とナビゲーション

- 作業: Ctrl+矢印でデータの端へ移動、Ctrl+Shift+矢印で端まで選択、Home / Ctrl+Home / End、PageUp / PageDown。Ctrl+A で全選択、列見出しクリックで列全体、行番号クリックで行全体（Shift で範囲拡張）。数式バーの左に名前ボックスを置き、`B12` や `A1:C5` を入力して移動・選択
- 変更ファイル: `src/components/GlideSheet.tsx`、`src/hooks/useSelection.ts`、`src/components/FormulaBar.tsx`、`src/lib/cellref.ts`
- 完了条件: Ctrl+矢印で空白の手前・次のデータ位置へ移動する（テスト）／列見出しクリックで列全体が選択される／名前ボックスに `C3` で C3 が選択され `A1:B2` で範囲選択される／不正入力でアプリが落ちず入力欄が元の表示に戻る

### C4 列・行の操作

- 作業: 列見出しのドラッグで列移動（Undo 対応）。列境界のダブルクリックで自動幅（`src/lib/columnWidth.ts`）。列見出し・行番号の右クリックメニュー整理（挿入・削除・幅・固定）。ウィンドウ枠固定の導線を 1 つに集約
- 変更ファイル: `src/components/GlideSheet.tsx`、`src/components/ContextMenu.tsx`、`src/hooks/useSheet.ts`、`src/lib/columns.ts`
- 維持: 保存時の列順は画面の列順と一致する
- 完了条件: 列をドラッグして移動でき保存した CSV の列順が画面と一致する（テスト追加）／列移動は Undo 1 回で戻る／枠固定をメニューから設定・解除でき固定部分がスクロールで動かない／列境界ダブルクリックで内容に合う幅になる

### C5 データ操作

- 作業: 列見出しに▼を出し、昇順/降順/フィルタ/クリアを 1 つのメニューにまとめる。フィルタは値のチェックリスト（全選択/全解除、件数付き、検索ボックス付き）。フィルタ中の列に印、絞り込み件数を状態バーに表示、解除は 1 クリック。Ctrl+F は画面上部の細いバーで、入力しながらヒット箇所を強調し Enter で次へ
- 変更ファイル: `src/components/FilterPopover.tsx`、`src/hooks/useFilter.ts`、`src/lib/sort.ts`、`src/components/SearchPanel.tsx`
- 維持: フィルタ/ソートは表示だけを変え、保存データの行順は変えない（現状の挙動を C1 で確認し、変わっている場合は現状を維持）
- 完了条件: 見出しの▼から昇順・降順・フィルタ設定ができる／チェックリストで 2 値を選ぶと該当行だけが表示され件数が状態バーに出る／フィルタ解除後に全行が元の順で見える／検索で入力中にヒット箇所が強調され Enter で次へ移動する

### C6 初見の分かりやすさ

- 作業: ツールバーを「ファイル / 編集 / 行列 / 表示」にグループ化し、全ボタンにショートカット付きツールチップ。空画面に「開く / ドロップ / 新規」を大きく出し最近使ったファイルを一覧表示。未保存の状態をタイトルバーに表示し閉じる前の確認文言を分かりやすくする。文言は `src/lib/i18n.ts` の日英両方
- 変更ファイル: `src/components/Toolbar.tsx`、`src/components/EmptyState.tsx`、`src/components/TitleBar.tsx`、`src/lib/i18n.ts`
- 完了条件: 全ツールバーボタンにツールチップでショートカットが出る／空画面から 1 クリックでファイルを開ける／未保存の変更があるとタイトルバーに印が出る／日英の翻訳キーが過不足なく揃う（`src/tests/i18n.test.ts`）

### C7 見た目の仕上げ

- 作業: 罫線・行高・フォントサイズ・選択範囲の色（枠線と薄い塗り）・ヘッダー色を Excel 風に調整（ライト/ダーク両対応）。状態バーに選択範囲の件数・数値セルの合計・平均を表示。1 行目のヘッダー強調は維持
- 変更ファイル: `src/styles/app.css`、`src/styles/variables.css`、`src/components/StatusBar.tsx`、`src/tests/statusBar.test.ts`
- 完了条件: 数値を含む範囲を選ぶと状態バーに合計・平均・件数が出る（テスト）／ライト/ダーク両方で選択範囲が背景と区別できる／文字列だけの範囲では合計・平均を出さない

### C8 統合検証と手動確認用チェックリスト

- 作業: `bun run test`、`bun run lint`、`bun run build` を全件実行。Web 版で C2〜C7 の完了条件を画面で確認しスクリーンショットを残す。`docs/manual-check-excel-like-ux.md` に、依頼者が 10 分で確認できる手順を書く（Web 版と Tauri 実機に分け、確認できなかった項目は「未確認」と明記）。変更点を README の該当箇所へ反映
- 変更ファイル: `docs/manual-check-excel-like-ux.md`（新規）、`README.md`、検証で見つかった不具合の修正箇所
- 完了条件: test / lint / build の全成功が PR の CI で確認できる／C2〜C7 の各完了条件に確認方法（テストか画面）と結果がある／Tauri 実機で見る項目が分けて書かれ、確認していないものは「未確認」とされている

## 完了条件（案件全体）

C1〜C8 の各完了条件を満たし、独立レビュー（`REVIEW.md`）で重大指摘が残っていないこと。dots の作業環境で確認できないもの（Windows 実機の Tauri ウィンドウ、実際の日本語入力の体感）は「未実施」と明記し、完了扱いにしない。

## 提出

- `develop` 向けの Draft PR。最初に空に近い状態でも先に出し、以降は同じ PR を更新する
- 提出時に書くこと: 実 code SHA、実行した command と exit code、残件、rollback 方法
- merge・release はしない

## 受付

同じ案件会話へ、次を返信する。案件番号の認識／番号の衝突の有無／読んだ指示 commit／環境能力（bun と Node の有無と版、依存取得の可否、ブラウザ操作の可否）。

## 進捗

`PROGRESS.md` を区切り（開始・停止・検証・指摘修正）ごとに更新し、同じ会話に要約と看板 URL を報告する。

## 公開情報の扱い

私有情報は書かない。テストデータは合成データにする。
