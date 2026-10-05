# 看板 #20261005-004 Excel 風 UX 刷新

- repo: `ishizakahiroshi/PlainSheet`
- base: `develop`
- 作業 branch: `bot/20261005-004-excel-like-ux`
- 更新日時: 2026-10-05 04:06 UTC
- 受付済み。同一案件番号の既存 PR / 作業 branch との衝突なし（開始時検索）。
- 固定指示 `README.md` と `REVIEW.md` を SHA `037c29ea4649efc81acc8f28824dca3df08e7450` で全読了。
- C1 から直列実施。各工程は PR CI と別担当レビューで判定。merge / release はしない。

## 再開: HTML/ブラウザ版 + アプリ版（U1〜U5）

追加指示 SHA `c22439b45dd27bbf6c0e56c7d6858a804242f715` の `DUAL-EDITION-UX.md` と同 commit の README を全読了。既存 PR #1 / branch の受領時 head は `075cb6b4adae6829efa26ac618ed0cc8b7ded091`。ローカル担当は実装を変更していないと依頼者から明示され、dot が同じ実装・Git を一担当で所有する。独立レビューは作業と別担当。以下の U1〜U5 の範囲だけ旧停止・C2 禁止を改訂する。下記 C 表と既存履歴は当時の未完了記録であり、C1 合格へ変更しない。

| 工程 | 旧工程対応 | 担当 | 現在の状態 / 次の確認 |
|---|---|---|---|
| U1 再監査 / 共通仕様 | C1 追補 | dot | ソース監査・共通仕様を記録。画面監査は未実施 |
| U2 データ / 保存修正 | C2〜C5 | dot（単一実装担当） | 一次修正・回帰146件PASS。最終独立レビュー/U4待ち |
| U3 アイコン / 導線 / 状態 | C6〜C7 | dot | 一次修正/静的検証済。画面受入は未実施 |
| U4 検証 / 独立レビュー | C8 | dot + 別担当 reviewer | 進行中（04:06 UTC開始）。最終code SHAを別担当が確認 |
| U5 同じ PR へ提出 / 検収 | C8 / 手元受入 | dot / ローカル担当 | READMEと版別10分チェックリストを準備。手元受入は未実施 |

- 許可: src、公開 docs、README。依存 / lockfile、src-tauri、workflow、配布用アイコンは変更しない。merge / release / deploy しない。
- 環境: Node v24.19.0、既存 Bun 1.3.14。`bun install --frozen-lockfile`: exit 0、Checked 313 installs / 366 packages / no changes。lockfile 差分なし。共有ツールを読むだけで追加インストールなし。
- ブラウザ: dot のクラウドブラウザでは先の loopback 到達が `ERR_BLOCKED_BY_CLIENT`。同じ拒否先を回避 / 再試行せず、画面合格を付けない。実画面・Windows app・実 IME は手元担当が検収。
- 既知 Linux staging exit 2 は修正範囲外として残すが、追加指示により裏付けられる src 修正まで全停止しない。新しい test / lint / build の問題と区別する。
- 受付時 code は `037c29e…` と同じ。受領時 docs head `075cb6b…` の独立レビュー / CI failure は PR の確定記録を参照。今回の code / review SHA は実装後に別記する。

## 旧 C 工程の履歴（追加指示受領前）

| 工程 | 担当 | 状態 | 証跡・残件・次の一手 |
|---|---|---|---|
| C1 UX 差分監査と基盤判定 | dot | STOP・未完了 | 停止条件 1・2・6。CI の Linux 梱包が 2 回同理由で失敗、workflow 修正は範囲外。クラウド実画面は未検証、手元部分実測は下記。[停止記録](../../ux-gap-and-stack-decision.md) |
| C2 編集の核 | dot | 未着手・停止 | 依頼者の最新指示どおり開始しない |
| C3 選択とナビゲーション | dot | pending | C2 後 |
| C4 列・行の操作 | dot | pending | C3 後 |
| C5 データ操作 | dot | pending | C4 後 |
| C6 初見の分かりやすさ | dot | pending | C5 後 |
| C7 見た目の仕上げ | dot | pending | C6 後 |
| C8 統合検証・手動チェックリスト | dot | pending | `docs/manual-check-excel-like-ux.md` |
| 独立レビュー | dot（作業と別担当） | 停止記録を確認済み | `052c465…` に重大指摘なし。C1 / UX 合格ではない。最終 head の追記差分も再確認する |
| 手元の別 AI による全行確認 | 依頼者側 | pending | 取り込む前に実施 |
| 手元検収（Windows 実機・日本語入力） | 依頼者 | 未実施 | 実機の Tauri / 実際の IME の体感は Web 自動操作・貼付けで代替しない |

## SHA

- 挙動 oracle SHA: `c37b30064cb7a4abe4cda9bb3891a6f9c310de1d`
- 読了した指示 SHA: `037c29ea4649efc81acc8f28824dca3df08e7450`
- 作業開始 develop SHA: `037c29ea4649efc81acc8f28824dca3df08e7450`
- 実 code SHA: `037c29ea4649efc81acc8f28824dca3df08e7450`（開始時。oracle との差分は指示 docs 3 件のみ）
- review 済み SHA: `e45bafe56e67689f17e1740e101198f60f92a962`（停止記録と追記を別担当が再確認、修正要求なし。UI 未検証）
- 初回 docs commit: `64640094ef74412247836eff93209782cce78677`
- Draft PR: https://github.com/ishizakahiroshi/PlainSheet/pull/1
- 初回 PR CI: https://github.com/ishizakahiroshi/PlainSheet/actions/runs/37254444488 （02:13 UTC: 実行中。最終 head の結果は PR を参照）

## 環境の自己報告と実測

これは dot のクラウド Linux x86_64 環境での実測。依頼者の Windows 実機での確認とは区別する。

| 項目 | 結果 |
|---|---|
| Node | `v24.19.0` |
| Bun | `1.3.14`。既存の共有ツールを使用。プロジェクトに Bun の版固定なし |
| 依存取得 | `bun install --frozen-lockfile` exit 0、310 packages、10.48 秒。既存 `bun.lock` を保持し依存追加なし |
| Web 起動 | `bun run dev` が Vite 5.4.21 ready を表示。loopback `http://127.0.0.1:1420/`、起動 308 ms。HTTP 200 / curl exit 0 を確認 |
| ブラウザ操作 | クラウド Chrome の操作 API 使用可。ただし対象 loopback URL を開くと `net::ERR_BLOCKED_BY_CLIENT`。アプリ画面での C1 操作はまだ未実施 |
| native / IME | Windows Tauri 実機、実際の日本語 IME の変換確定は未実施。合格扱いにしない |

## 履歴

### 2026-10-05 02:10 UTC — 開始 / 受付記録

- 担当: dot
- 変更 path: `docs/bot/excel-like-ux-overhaul/PROGRESS.md` のみ。初回 Draft PR のための開始記録。
- `git clone --branch develop --single-branch https://github.com/ishizakahiroshi/PlainSheet.git`: exit 0。
- `git diff c37b30064cb7a4abe4cda9bb3891a6f9c310de1d HEAD --stat`: exit 0、指示 docs 3 件のみ。
- `node --version` / `bun --version`: exit 0。
- `bun install --frozen-lockfile`: exit 0。lockfile と package.json に差分なし。
- `bun run dev`: 起動成功、継続プロセスのため終了コードは未確定。HTTP health check: exit 0 / 200。
- browser: `http://127.0.0.1:1420/` への初回到達は `net::ERR_BLOCKED_BY_CLIENT`。セキュリティ設定・bind host の変更はしていない。
- 次の一手: Draft PR 作成、CI 開始確認、サポートされたブラウザ到達経路の確認。C1 は実画面操作、約 40 操作の判定、2,000×30 と IME を含む 3 基準の証拠が揃うまで完了にしない。
- rollback: この docs-only PR を close すれば develop のコードは変更されない。

### 2026-10-05 02:13 UTC — 停止 / 初期検証

- 停止条件 6: 持ち主の操作が必要。cloud browser で開発サーバーを開けず、現在利用できるサポートされた経路では実画面検証を続けられない。原因の詳細は未確認。環境のセキュリティ設定や bind host の変更、外部トンネルの追加で回避していない。
- 変更 path: `docs/ux-gap-and-stack-decision.md`（新規）と本看板のみ。C1 は未完了、基盤維持 / 差し替えは未判定、C2〜C8 未着手。
- 初回 docs head `64640094ef74412247836eff93209782cce78677` で `bun run test`: exit 0、13 files / 110 tests PASS。
- 同 SHA で `bun run lint`: exit 0、`bun run build`: exit 0。Glide PURE コメント・500 kB 超 chunk の既存警告あり。これは画面操作・実 IME・Tauri 実機の合格証拠ではない。
- PR CI は開始済み。workflow の frontend checks は明示的に lint / test を実行。Tauri build とその設定の確認を含めて最終 head の結果を判断する。
- PR の `Agent: dot` ラベル追加は tool が `user cancelled MCP tool call` を返したため未適用、再試行しない。commit 末尾の `Agent: dot` は付与済み。
- 独立レビュー: この停止記録の exact SHA を別担当が確認予定。C1 の UI 判定は未完了のまま。
- 次の一手: 依頼者側で利用可能な実画面操作環境または手元の検証結果が必要。再開までは実装しない。残件は監査 doc の 42 操作と 3 基準を参照。

### 2026-10-05 02:19 UTC — 独立レビュー / CI 確認

- 別担当が `037c29ea4649efc81acc8f28824dca3df08e7450` → `052c465c048e57cb995bb81d0a0f29e2c7d1b06c` を確認。停止記録への P0/P1/P2/P3 修正要求なし。結果は [PR #1](https://github.com/ishizakahiroshi/PlainSheet/pull/1) のコメントに記録。
- reviewer の `git diff --check`: exit 0。`src/`、`src-tauri/`、`.github/`、`package.json`、`bun.lock` の base → review SHA 比較と初回検証 SHA → review SHA 比較はいずれも exit 0、差分なし。
- 保存済み test / lint / build / dev ログを独立照合。reviewer は実 UI、依存取得、HTTP check を再実行していない。元実行の exit code は作業担当の記録。
- exact-head CI `052c465…`: [run 37254711195](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/37254711195)、02:18 UTC 時点で実行中。`.github/workflows/tauri-release.yml` の lint/test と `src-tauri/tauri.conf.json` の `beforeBuildCommand: bun run build` を確認済み。全成功の断定はしない。
- この追記は記録のみ。最終 head は PR で検証し、旧 SHA の PASS を引き継がない。C1 は STOP のまま。持ち主の画面操作環境または手元検証が整うまで C2 以降は開始しない。

### 2026-10-05 02:21 UTC — CI 失敗 2 回 / 範囲外修正のため停止を維持

- 初回 head `64640094ef74412247836eff93209782cce78677`: [run 37254444488](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/37254444488) は failure。Windows / macOS は success。Linux は frontend checks と Tauri build が success、その後の `Stage release files (Linux)` で exit 2。
- 次 head `052c465c048e57cb995bb81d0a0f29e2c7d1b06c`: [run 37254711195](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/37254711195) の Linux が同じ step / exit 2。02:21 UTC 時点で Windows は実行中、macOS は success。run 全体の完了は未確定だが、Linux の同理由失敗 2 回は確認済み。
- 両ログで `Built application at: ~/work/PlainSheet/PlainSheet/src-tauri/target/release/plainsheet` の後、既存 workflow の `bin=$(ls -1 "$rel/PlainSheet" "$rel/plainsheet" 2>/dev/null | head -n1)` が `set -euo pipefail` 下で失敗。
- 合成の空ファイル `plainsheet` 1 個だけを置いた一時ディレクトリで同じ selector を実行すると exit 2、lowercase ファイル存在確認は成功。存在しない uppercase 候補の `ls` 失敗が pipeline に伝わることを再現。repository のファイルは変更していない。
- 停止条件 1（同理由 CI 失敗 2 回）と 2（修正対象 `.github/workflows/tauri-release.yml` が許可範囲外）に該当。workflow 修正・CI 再実行要求はしていない。C1 の実画面未確認による停止条件 6 も継続。
- `e45bafe56e67689f17e1740e101198f60f92a962` でローカル test / lint / build を再実行: すべて exit 0、13 files / 110 tests。独立増分レビューも修正要求なし。CI [run 37254958985](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/37254958985) は 02:21 UTC 時点で実行中であり、合格扱いにしない。
- この最終停止記録の head は PR の最新 SHA を参照。docs 更新により自動開始する CI も、旧 head の結果から推定しない。CI の詳細結果と最終追記の独立確認は PR コメントへ追記する。
- 次の一手: 許可された UI 操作環境に加え、依頼者による既存 workflow の修正、または当該ファイルだけを対象とする明示的な追加指示が必要。追加指示までは実装・workflow 修正に進まない。

### 2026-10-05 02:30 UTC — 依頼者の手元 C1 部分実測 / 最新 CI 境界

これは依頼者からの実画面観測報告であり、dot のクラウドブラウザによる再検証ではない。対象は `037c29e` の Web 版、Windows 標準 Chrome、既存 frozen lock、合成 sample。依頼者の手元部分実測は終了。C1 完了でも基盤維持 / 差し替え判定でもなく、基盤判定は保留、C2 は未着手のまま。

確認済み（依頼者報告）:
- F2 / ダブルクリックで既存値を保って編集、文字キー x で置換編集、Esc 取消。
- Enter で B2→B3、Tab で B2→C2、Shift+Tab で C2→B2、通常矢印移動。
- 名前ボックス B2 / A1:B2、列全体 B1:B10・行全体 A2:F2 の選択。
- Ctrl+F 検索と Enter で次ヒット、2 値フィルタ、未保存表示、範囲統計。

差分（依頼者報告。実装はしない）:
- C2: B2 編集→End→追記→Shift+Enter は上移動せず編集欄に改行し、欄が残る。
- C3: Ctrl+右は B2→N2（データ端 F2 超過）、Ctrl+下は A2→A18（データ端 A10 超過）。不正名 INVALID は Enter 後も欄に残る。Shift 選択の左 / 上で縮小せず拡大する例あり。Ctrl+A は実データ 10×6 に対して仮想空白を含む 18×14。
- C5: 部署の営業 / 開発の 2 値フィルタで 5 行表示されるがヘッダー行も消え、状態バーは 10 行×6 列のまま。ポップアップに検索欄 / 値別件数がない。

未確認: 実 IME、2,000×30 負荷、light / dark / system 比較、fill、列ドラッグ、ソート / フィルタ保存結果、Undo 等。これらと残り操作を部分結果から合格へ変換しない。全体の影響順位と 3 基準の判定は引き続き未完了。

最新の完了済み CI 境界:
- `181296621399bed5b56da2ecb2dbdbf439c61e9a` の [run 37255158631](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/37255158631) は completed / failure。Windows・macOS は success、Ubuntu は frontend checks と Tauri build が success の後、Linux staging が exit 2。dot が API / raw log で確認し、依頼者も同じ終端状態を確認。古い SHA の PASS を代用しない。
- 同 SHA の停止記録は独立レビュー済み、重大指摘なし。これは docs のレビューであり C1 / UX 合格ではない。この追記で生じる新しい docs head の CI 結果は別途 PR へ記録する。
- 最初の 3 PR runs `37254444488 / 37254711195 / 37254958985`（heads `6464009 / 052c465 / e45bafe`）を比較し、すべて同じ Linux staging exit 2、frontend / Tauri build 成功、Windows / macOS 成功を確認。workflow blob は同一。
- main の [2026-08-17 run 32029383313](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/32029383313)、[2026-09-06 run 34066294861](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/34066294861)、[2026-09-27 run 36332813977](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/36332813977) の生ログにも lowercase binary 生成後の同 selector / exit 2 がある。この docs PR による初発とは判断しない。現在列挙できた main 7 runs 中の最古の一致は 8 月 17 日であり、初発・導入 commit は未確定。以前の runs は lint / build で先に停止し、一部ログは 410 で取得不能。
- 原因説明は shell-level の強い裏付けがある見立て。ログは stderr を捨てており「uppercase が無い」という明示エラーではない。別途合成 fixture で再現した結果と合わせて記録する。
- Upload は public PR / 非 tag main では条件で skipped（成功した OS も同じ）。Release job は tag-only かつ build 成功に依存する。後続の artifact download / archive 検証 / SHA-256 / publish は未実行。すべての skipped を Linux 失敗だけが原因としない。
- 停止条件 1・2・6 継続。必要な修正範囲は `.github/workflows/tauri-release.yml` の Linux binary selector と staging 検証。現在は禁止範囲なので変更も retry もしていない。追加指示までは実装しない。

### 2026-10-05 02:40 UTC — 4 導線の読み取り再評価 / 追加操作を整理

- 依頼者の追加指示に従い、初めて CSV を使う人 / Excel 利用者の「開く編集保存、選択コピー貼付けUndo、列幅列順、フィルタ検索解除」を再評価。[既存 C1 監査文書](../../ux-gap-and-stack-decision.md) に優先度・根拠・最小 6 操作を追記。
- 優先度: 保存先・非表示セルの誤書込リスク → 選択の一貫性 → フィルタ状態と復帰 → 外観。手元観測とソース仮説を分離。Ctrl+S 未確定保存、同名ファイルの handle、フィルタ paste / 全置換、右クリックの対象変更等は未再現の仮説であり、実測済みとは書かない。
- 最小 6 操作: 未確定 Ctrl+S、別フォルダ同名 2 タブ保存、2×2 右クリック Copy/Paste/Undo、非連続フィルタ 2 行 Paste/解除/Undo、非表示語の検索全置換/解除/Undo、手動列幅/Paste/Undo と一度の列ドラッグ。すべて使い捨て合成コピーで行う提案で、依頼者の終了済み部分実測と混同しない。
- 確認済み編集キー、新規 / 開く / 保存ラベル、未保存表示等は維持候補。全面 toolbar 再編や色寄せは後順位。ただし実 IME / 2,000×30 / テーマ比較は基盤判定の必須残件のままで、免除しない。Glide 固有限界か app / wrapper の設計かは未判定。
- `d47550c878f1ffa983dc755edb159b43caec69ce` の docs の過去の独立レビュー記録は今回確認できていない。今回の最終追記は別担当が改めて確認し、結果を PR へ記録する。[run 37255800037](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/37255800037) は completed / failure。Windows / macOS は success、Ubuntu は同じ Linux staging exit 2（job 111592476389、生ログ照合）。旧 SHA の PASS は使わない。
- この追記で生じる最新 head も PR の CI / 独立レビューで別途確認する。必要な修正範囲は引き続き許可外の `.github/workflows/tauri-release.yml`。CI 停止、C1 基盤判定保留、C2 未着手を維持。コード・依存・workflow の変更はしていない。

### 2026-10-05 03:23 UTC — 追加指示取り込み / U1 開始

追加指示の 2 docs を既存 head に安全に取り込み、コード差分なしで受付記録を更新。7 場面は既存観測とソース仮説を保持して再点検する。共通編集、ブラウザのダウンロード、アプリの直接保存を明示する方針。保存・非表示行への誤書込を優先し、U2 に入る前に回帰条件を監査へ記す。

### 2026-10-05 03:27 UTC — U1 ソース再監査 / U2 開始

監査へ版別の期待・現状・根拠・重大度・旧C対応・確認担当・未確認を追記。別担当も非同期保存/clipboard の文書混同、filter source rectangle、history の幅欠落を重点確認。`273c622…` と同じ source で test/lint/build 全 exit 0（110 tests）、既存 PURE / chunk 警告。これから本番経路を通す回帰を追加して原因を修正する。GUI/実 IME は未確認。

### 2026-10-05 03:40 UTC — U2 一次修正 / 静的検証 / U3 開始

- 変更: src の保存 snapshot と文書別完了処理、browser download-only、編集確定境界、visible-row操作、選択保持、列移動と幅履歴、回帰テスト。Rust / workflow / 依存 / lockfile 差分なし。
- 保存開始前に文書 ID / rows / meta を固定。別タブへの完了誤反映を防ぎ、保存中の編集を未保存として保持。browser は元ファイルを書換えず、download 開始後も未保存保護を維持する。
- Filter Paste は表示行 mapping だけを更新し、行不足は全体拒否。Cut/Clear/Delete、bulk edit / fill と clipboard 待機中の tab / 範囲変更も保護。header は useHeaderRow の場合だけ保持。検索/置換を表示行に限定。
- Enter / Shift+Enter / Tab / Shift+Tab、Alt+Enter、Esc と composition guard を共通化。Ctrl端/全選択は実データ基準。右クリック範囲保持、名前 invalid 復帰、列移動の値/幅/保存順とUndoを実装。
- 同じ source の `bun run test`: exit 0、18 files / 146 tests。`bun run lint`: exit 0。`bun run build`: exit 0（既存 PURE / chunk 警告）。hook/component/App配線の試験であり、canvas renderer と native I/O は mock。実画面・実 IME・実 native の合格ではない。
- 開発中に翻訳キー不足、テストの型注釈、CSV末尾改行の期待値を修正し、上記全検証を再実行。既存serializerの末尾改行規則は変更していない。
- `273c622…` / run `37259331229` と `939b7ab…` / run `37259516185`: 両方 completed/failure、Windows/macOS success、Linux lowercase binary 生成後に同 selector/exit2。raw log 照合済み。追加指示どおり既知梱包問題と今回src検証を分離する。
- 独立 reviewer は作業と別担当で危険経路を点検中。このU2 checkpointの code SHA、後続U3修正後の review SHA、exact-head CI は最終提出で明示する。U3は版表示、件数、clear、tooltip、keyboard、small-window、help を整える。

### 2026-10-05 04:06 UTC — U3 一次修正 / 指摘修正 / U4 開始

- U2 code SHA: `d813e6b839544bb3950b97edda8e615f2a2ea592`。その CI run `37260396888` は completed/failure。Windows/macOS success、Linux 18 files/146 tests・Tauri build success後、同selectorでstaging exit2。raw log照合済み。今回U3の検証へ古いPASSを流用しない。
- UI: Browser Download/Download as、App Save/Save as、持続する保存通知、未保存保護、filter件数/解除/対象表示、値検索と件数、範囲統計のvisible-row対応。Toolbarをファイル/編集/行列/表示へ分け、Bot/AIコピーを通常の表コピーへ。行と列の削除、clearとdeleteを区別。
- ActionButtonはhoverとkeyboard focusで同じtooltip/accessible name。Tabの左右/Home/End、dialog focus trap/復帰、ContextMenu上下/Esc、同名tabの番号/path説明。CSSは狭幅の折返し/scroll、テーマ変数/focus/disabledを使用。実画面検証ではなくソース/DOM確認。
- 別担当の指摘を修正: F2とCtrl+D/Rの実キーbinding、F2末尾指定、未確定editor/IMEを含むbrowser unload警告、tab復帰時のanchor/range保持、pristine Newで確定値を消さないこと、古いcanvas callbackから他tabへ書かないこと。対応する回帰を追加。
- Native closeの一部は停止・別範囲: 現capabilityはallow-closeでallow-destroyなし。JS API onCloseRequestedは内部destroyを使うため、試作listenerは未公開のまま除去。既存close機能は維持し、アプリ内title-barボタンだけ確認を足して既存allow-closeを使う。OS/menu/Alt+F4保護は未確認。capability/Rust/window securityは変更していない。
- ブランド監査: app icon PNGを視認、既存icon.svg/favicon.svgの2列3行と青セルのモチーフを照合。index.htmlにfavicon linkなし。参照追加は許可外index.htmlの候補として記録のみ。配布用binary/assets生成なし。
- `bun run test`: exit0、19 files/159 tests。`bun run lint`: exit0。`bun run build`: exit0（既存PURE/chunk警告）。Browser download encodingの途中修正とfilter accessible-nameの試験指摘を直して再実行済み。native I/O/canvasはmock、実画面/IME/native/performanceは未実施。
- READMEと `docs/manual-check-excel-like-ux.md` に両版の保存/操作/互換限界、約10分の代表検収、OS close/favicons/workflowの別範囲を記した。
- このU3 commitをU4の独立review対象に渡し、code SHA/review SHAとexact-head CIの確定結果をPRへ記録する。手元担当の次の一手は、最終headを開いてBrowser版の合成CSVチェックから始めること。全体完了/配布可能とはしない。

### 2026-10-05 — ローカル並列引き継ぎ / 追加承認

- 依頼者が残りの修正・検証を承認。Linux workflow の binary selector、main window の終了保護に必要な最小 capability、既存 favicon の参照を追加許可範囲として扱う。merge / tag / release は行わない。
- dots はアプリ・共有 Git・看板への書き込みを停止し、公開 head `21e7784efc6c25d8c7534fc8d73eccf139c140f1` の読み取り結果を引き渡した。未公開の6ファイルの試作はdots側に保持し、ローカル側は独立した差分を作成している。
- ローカルの3担当で Linux 梱包、native 終了保護、独立 UX レビューを並列化。OS終了は先にpreventし、保存中・変換中・全タブの未保存状態を確認した後にdestroyする。権限追加はmainの `core:window:allow-destroy` のみ。
- 追加指摘: 検索ヒットと操作対象のずれ、非連続の行列選択の中間セルへの誤操作、削除確認中の文書変更、5,000セル超の検索件数、検索・名前欄のIME確定キー。合成回帰を伴う修正中。
- Windows native の初回 build は成功。ただし並行編集前の frontend を含むため、最終統合後に再buildする。実際のOS終了・IME・native I/Oの受入をこの成功から推定しない。
- Chrome の実ページ操作では、sample の B2編集→EnterでB3、Undo1回でB2値復帰、検索「営業」3セル→C2の参照/値同期、Download開始通知と未保存保持を確認。captureScreenshotはtimeoutし、canvasの見た目・狭幅・テーマの視覚検収は未成立。downloadコピーの再読込も未確認。
- 最終 test / lint / build、統合差分の独立レビュー、push後の同SHAのCI結果は次の追記で記録する。C1基盤判定・全体受入は引き続き保留。

### 2026-10-05 04:34 UTC — 統合候補の静的検証 / 独立レビュー

- 追加指摘を修正。飛び飛びの選択はcopy/cut/clearとセルメニューでも隙間を処理しない。別の行列ヘッダーのメニュー、参照移動、Undo、filterによる移動では古い選択を残さない。clipboard待機中のexact選択変更と、削除確認中の文書/行変更は中止する。
- 検索一致総セル数と先頭5,000セルの移動対象を区別し、全置換の対象を説明。検索ヒットのsource座標を操作対象へ同期。検索/参照欄のIMEイベントを保護。
- 同じ統合sourceの `bun run test`: 22 files / 182 tests、exit0。`bun run lint`、`bun run build`: exit0。既存Rollup PURE/chunk警告あり。canvas/native/IMEの模擬回帰と実機確認を混同しない。
- 作業担当とは別のローカルreviewerが19ファイルの全差分を確認し、header-context/filter-resetの最終修正まで確認。未解決のcode blockerなし。reviewer自身が書いたGlide/検索/IME差分は統合担当が別途全行確認。別製品AIの全PR差分レビューはpush後にdotsへ依頼する。
- このcommitのSHAをcode/review対象として、PRのコメントへ同SHAのCIと最終Windows生成物の証跡を追記する。CI全成功・実機受入・配布可能はまだ宣言しない。

### 2026-10-05 04:49 UTC — dots の追加レビュー指摘を修正

- 中間候補 `e326df77d059f9fa9ae575768498b2987375583b` の [CI run 37264182445](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/37264182445) は3OS成功。182 tests、native build、staging成功を確認。Linuxの既知exit2は解消。公開PRのUpload・非tagのReleaseはskipで、配布は行っていない。
- dots別担当が全PR/増分レビューで追加P1/P2を再現: 不連続選択→Clear→Undo→Clearで隙間のセルを消す経路と、状態バーが隙間の値まで集計する経路。canvas描画だけを模擬した結合再現であり実画面ではない。中間候補のCI成功から受入完了を推定しない。
- 履歴でexact行列配列を保存・deep clone・復元。AppからGlideのマーカーを制御し、選択解除も反映する。StatusBarの寸法・統計はexact選択と表示行の交差から計算する。
- 実App + 実Glide wrapperを組み合わせ、DataEditor描画だけを模擬した新しい結合回帰を追加。行/列のClear→Undo→Clear→Undo→Redoでマーカーとgap値を確認し、1/100/2の不連続行集計が3・2×3になることを確認。
- 新候補sourceのローカル `bun run test`: 24 files / 189 tests、exit0。lint / Web buildもexit0。Windows候補再buildと、新SHAのCI・dots再レビューを別途確定する。実IME/native I/O/OS操作、visual/performanceは未検収。
