---
type: plan
status: draft
docsweep_state: planned
tags: [PlainSheet, UX, dots]
owner: ishizakahiroshi
review_status: draft
related: [docs/bot/ux-all-adopted-20261012/plans/plan_ux-all-adopted.md]
last_reviewed: 2026-10-12
docsweep_delegation: external
due: 2026-10-19
docsweep_parent: docs/bot/ux-all-adopted-20261012/plans/plan_ux-all-adopted.md
---

# [計画] PlainSheet C7 共有を始めた表を共同編集する

親: [plan_ux-all-adopted.md](plan_ux-all-adopted.md)

## context配分

| C | 種別 | 内容 | 備考/注意点 |
|---|---|---|---|
| C1 | planned | 契約と現在のcallerを確定 | 先行Cの最新SHAを使う |
| C2 | planned | 共有を始めた表を共同編集するの実装 | 共有ファイルは直列統合 |
| C3 | planned | 境界/回帰検査と証跡 | 未実施をPASSにしない |

## 目的・採用対象

P-20261012-001の親C7。UX-020を利用者決定によりすべて採用。詳細の合成例・固定source根拠・受入条件は公開指示のproposal.mdの該当UX節を参照する。

## 作業内容

通常ローカル編集から明示開始する別モードを実装。共有先/参加者/閲覧・編集権限/接続状態/保存先/保持・削除を表示。stable row/column identityと競合解決・回復履歴、offline再送を設計し、2参加者で値・構造・undoの実同期まで作る。任意のself-host providerを実装可能にし、default public signaling/STUN/relayへ勝手に接続しない。

## 変更予定の範囲と担当

collaboration model/provider / sharing UI / optional relay / tests / manual。dots実装担当が所有し、独立担当はレビュー。実sourceを読んで正確な変更パスをFACTS/Issueへ追記する。近傍の無関係整形/別PR変更を含めない。

## 維持する仕様

親のraw文字列・文書ID・visible/source対応・Undo・native/Web保存契約・view/sidecar分離を維持。初期OFFの拡張を利用者の全採用と混同して自動開始しない。既存機能の重複実装をしない。

## 検証と完了条件

合成2参加者の同時cell/行列編集、同cell競合の履歴回復、遅延/逆順/重複/再送/切断復帰、閲覧者書込拒否、失効/退出/共有停止を検査。クライアントUIだけの権限制御は不可。共有停止後のコピー/削除不能範囲、CSVに残らない権限/履歴を説明。mock/BroadcastChannelだけを端末間共同編集完了とは扱わない。

proposal.mdの該当UX全受入条件をcoverage表へ展開し、code SHA・実行command/exit・fixture・レビュー対象SHA・未検収をIssueへ記録。過去SHAのPASSを引き継がない。GUI/IME/native/OS clipboard/性能が未観測ならpendingを残し、静的検査と区別する。公開設計・実装・検査・独立reviewの証跡が揃ってから親Cをdoneへ進める。

## 依存と実行境界

親のC順に実行。C7開始前に先行Cの対象SHA/共有契約を確認。外部配置・課金・secret・merge/releaseは追加しない。必要な環境が無い場合はコード/合成検査を進めて不足をまとめる。
