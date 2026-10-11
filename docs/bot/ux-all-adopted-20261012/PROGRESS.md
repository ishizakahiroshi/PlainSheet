# P-20261012-001 PlainSheet：全採用実装の看板

作成: 2026-10-12(月)。作業repo `ishizakahiroshi/PlainSheet`。branch `dots/ux-all-P-20261012-001`。base `bot/20261005-004-excel-like-ux` / oracle `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`。指示書保存先 `docs/bot/ux-all-adopted-20261012/`。

手元Codex: 方針・指示・送信・差分総合検収。dots: 実装統合と別担当の独立review。初回の指示公開commit、Issue URL、最終固定指示commitは送信前の追記で確定する。Draft PR/code SHA/review SHA/CI runは実測後に追記する。

状態の正本は専用Issueコメント。利用者は28件を採用済み。計画の公開と送信を、受付/実装着手として数えない。

| 工程 | 担当 | Issueの証跡 | 残件 |
|---|---|---|---|
| 計画・指示 | 手元Codex | 公開後に指示SHAとIssueを追記 | 送信/受付未確認 |
| C1〜C7実装 | dots | 受付/対象SHA/28coverageの報告待ち | 全28件未実装 |
| C8独立review | dots別担当 | 対象SHA固定の報告待ち | 初回と修正後再review |
| CI/統合検査 | dots・手元 | run/command/exitの実測待ち | 古い190test成功は流用しない |
| 手元総合検収 | Codex | 統合候補提出待ち | 全差分、まとめたbug一覧→修正→再検査 |
| 実GUI/native | 手元/利用者の実環境 | 実観測待ち | IME/clipboard/終了保存/支援技術/幅/性能 |

## 28件のtraceability入口

各UXの仕様と全受入条件はproposal.md、追加契約はplans/親子plan。C1:008/013/014/015、C2:003/005/006/009/010/012、C3:002/007/011/023/025/026、C4:001/004/016/021/022/024/028、C5:017/018/027、C6:019、C7:020。C8は全件総合検収。

次の一手: 固定指示を読んだ受付の確認、C1共通契約と意味ある再現testsから着手。すでに進行中なら最新Issue/PR/headを確認し、重複セッションを起動しない。
