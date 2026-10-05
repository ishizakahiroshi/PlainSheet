# 看板 #20261005-004 Excel 風 UX 刷新

- repo: `ishizakahiroshi/PlainSheet`
- base: `develop`
- 作業 branch: `bot/20261005-004-excel-like-ux`
- 更新日時: 2026-10-05 02:13 UTC
- 受付済み。同一案件番号の既存 PR / 作業 branch との衝突なし（開始時検索）。
- 固定指示 `README.md` と `REVIEW.md` を SHA `037c29ea4649efc81acc8f28824dca3df08e7450` で全読了。
- C1 から直列実施。各工程は PR CI と別担当レビューで判定。merge / release はしない。

| 工程 | 担当 | 状態 | 証跡・残件・次の一手 |
|---|---|---|---|
| C1 UX 差分監査と基盤判定 | dot | STOP・未完了 | 停止条件 6。実画面が開けず 42 操作・3 基準は未判定。[停止記録](../../ux-gap-and-stack-decision.md) |
| C2 編集の核 | dot | pending | C1 判定後 |
| C3 選択とナビゲーション | dot | pending | C2 後 |
| C4 列・行の操作 | dot | pending | C3 後 |
| C5 データ操作 | dot | pending | C4 後 |
| C6 初見の分かりやすさ | dot | pending | C5 後 |
| C7 見た目の仕上げ | dot | pending | C6 後 |
| C8 統合検証・手動チェックリスト | dot | pending | `docs/manual-check-excel-like-ux.md` |
| 独立レビュー | dot（作業と別担当） | pending | 対象 SHA・指摘・再検証 |
| 手元の別 AI による全行確認 | 依頼者側 | pending | 取り込む前に実施 |
| 手元検収（Windows 実機・日本語入力） | 依頼者 | 未実施 | 実機の Tauri / 実際の IME の体感は Web 自動操作・貼付けで代替しない |

## SHA

- 挙動 oracle SHA: `c37b30064cb7a4abe4cda9bb3891a6f9c310de1d`
- 読了した指示 SHA: `037c29ea4649efc81acc8f28824dca3df08e7450`
- 作業開始 develop SHA: `037c29ea4649efc81acc8f28824dca3df08e7450`
- 実 code SHA: `037c29ea4649efc81acc8f28824dca3df08e7450`（開始時。oracle との差分は指示 docs 3 件のみ）
- review 済み SHA: 未
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
