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

# [計画] PlainSheet C6 数式を実際に計算する

親: [plan_ux-all-adopted.md](plan_ux-all-adopted.md)

## context配分

| C | 種別 | 内容 | 備考/注意点 |
|---|---|---|---|
| C1 | planned | 契約と現在のcallerを確定 | 先行Cの最新SHAを使う |
| C2 | planned | 数式を実際に計算するの実装 | 共有ファイルは直列統合 |
| C3 | planned | 境界/回帰検査と証跡 | 未実施をPASSにしない |

## 目的・採用対象

P-20261012-001の親C6。UX-019を利用者決定によりすべて採用。詳細の合成例・固定source根拠・受入条件は公開指示のproposal.mdの該当UX節を参照する。

## 作業内容

説明改善だけで代替せず、明示ONの計算モードを実装する。raw式と結果を分離し、通常文字列モードを維持。初期契約は同一表A1/範囲/絶対参照、算術・比較・SUM/AVERAGE/MIN/MAX/COUNT/IF。循環/不正参照/未対応関数/除算エラーを表示。再計算とraw式Undo、列行構造変化、保存時の式/値選択を統合。Excel全関数互換は約束しない。

## 変更予定の範囲と担当

formula parser/evaluator / dependency graph / GlideSheet / FormulaBar / export / tests。dots実装担当が所有し、独立担当はレビュー。実sourceを読んで正確な変更パスをFACTS/Issueへ追記する。近傍の無関係整形/別PR変更を含めない。

## 維持する仕様

親のraw文字列・文書ID・visible/source対応・Undo・native/Web保存契約・view/sidecar分離を維持。初期OFFの拡張を利用者の全採用と混同して自動開始しない。既存機能の重複実装をしない。

## 検証と完了条件

=1+2→3、=SUM(A1:A3)、参照先編集、絶対参照、循環、未知関数、ゼロ除算を検査。eval/Functionで入力をコード実行しない。外部参照・ネットワーク関数を許可しない。計算結果をraw文字列へ無言上書きせず、式/値exportの再open、filter/sort/Undo/非同期保存を横断。

proposal.mdの該当UX全受入条件をcoverage表へ展開し、code SHA・実行command/exit・fixture・レビュー対象SHA・未検収をIssueへ記録。過去SHAのPASSを引き継がない。GUI/IME/native/OS clipboard/性能が未観測ならpendingを残し、静的検査と区別する。公開設計・実装・検査・独立reviewの証跡が揃ってから親Cをdoneへ進める。

## 依存と実行境界

親のC順に実行。C6開始前に先行Cの対象SHA/共有契約を確認。外部配置・課金・secret・merge/releaseは追加しない。必要な環境が無い場合はコード/合成検査を進めて不足をまとめる。
