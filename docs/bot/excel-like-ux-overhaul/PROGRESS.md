# 看板 #20261005-004 Excel 風 UX 刷新

- repo: `ishizakahiroshi/PlainSheet`
- base: `develop`
- 作業 branch: `bot/20261005-004-excel-like-ux`
- 更新日時: 2026-10-05 02:30 UTC
- 受付済み。同一案件番号の既存 PR / 作業 branch との衝突なし（開始時検索）。
- 固定指示 `README.md` と `REVIEW.md` を SHA `037c29ea4649efc81acc8f28824dca3df08e7450` で全読了。
- C1 から直列実施。各工程は PR CI と別担当レビューで判定。merge / release はしない。

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
