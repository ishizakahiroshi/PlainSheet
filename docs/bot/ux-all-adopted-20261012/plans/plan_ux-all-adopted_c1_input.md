---
type: plan
status: in_progress
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

# [計画] PlainSheet C1 入力値と編集対象を守る

親: [plan_ux-all-adopted.md](plan_ux-all-adopted.md)

## context配分

| C | 種別 | 内容 | 備考/注意点 |
|---|---|---|---|
| C1 | planned | 契約と現在のcallerを確定 | 先行Cの最新SHAを使う |
| C2 | planned | 入力値と編集対象を守るの実装 | 共有ファイルは直列統合 |
| C3 | planned | 境界/回帰検査と証跡 | 未実施をPASSにしない |

## 目的・採用対象

P-20261012-001の親C1。UX-008, UX-013, UX-014, UX-015を利用者決定によりすべて採用。詳細の合成例・固定source根拠・受入条件は公開指示のproposal.mdの該当UX節を参照する。

## 作業内容

まず値・対象・保存・操作・任意拡張の5軸で共通契約を確定する。文書ID・source/visible行対応・view設定・saved checkpoint・拡張sidecarの境界を設計に記録。実装は自己copyを外部CSV推定と分け、seed不変のfill/copyモード、仮想空cellと編集上限の一致、精度を失わない比較へ進む。

## 変更予定の範囲と担当

App.tsx / GlideSheet.tsx / useSheet.ts / clipboard / fillSeries / sort / tests。dots実装担当が所有し、独立担当はレビュー。実sourceを読んで正確な変更パスをFACTS/Issueへ追記する。近傍の無関係整形/別PR変更を含めない。

## 維持する仕様

親のraw文字列・文書ID・visible/source対応・Undo・native/Web保存契約・view/sidecar分離を維持。初期OFFの拡張を利用者の全採用と混同して自動開始しない。既存機能の重複実装をしない。

## 検証と完了条件

1列2行のNorth,East/South,Westを1列のまま往復。1,2を5行へ伸ばして1,2,3,4,5。Ctrl+D/Rはcopy。00123、2^53超、0.1/0.2、引用符/改行/空欄を回帰検査。A100/Z1の移動だけではdirty/巨大配列を作らない。filtered hidden行は不変。

proposal.mdの該当UX全受入条件をcoverage表へ展開し、code SHA・実行command/exit・fixture・レビュー対象SHA・未検収をIssueへ記録。過去SHAのPASSを引き継がない。GUI/IME/native/OS clipboard/性能が未観測ならpendingを残し、静的検査と区別する。公開設計・実装・検査・独立reviewの証跡が揃ってから親Cをdoneへ進める。

## 依存と実行境界

親のC順に実行。C1開始前に先行Cの対象SHA/共有契約を確認。外部配置・課金・secret・merge/releaseは追加しない。必要な環境が無い場合はコード/合成検査を進めて不足をまとめる。

## 実装・証跡更新（2026-10-12 UTC）

候補code7831c3c2、Draft PR4。全28候補統合、49files607tests/TypeScript/ESLint成功。詳細は親ディレクトリのcoverage.md、verification.md、remediation.mdを参照。C1/C3/C4とC2/C5の独立再review中。C6/C7修正後独立再reviewは未実施、実GUI/nativeの条件はpending。公開証跡・独立確認・実環境受入が未完のため、この計画をdoneにはしない。

最終source候補更新: ac8194cb09a79d38332ba3421dc10a15d0aa00f3、49files625tests/TypeScript/ESLint成功。範囲別独立確認/未検収はverification.mdと各review報告を参照し、doneとはしない。


最新source更新: `76ab986ceeff7fb0d2dcba17cf6096489c45ff33`、50 files /641 tests、TypeScript/ESLint成功。構造Undo/Redoの後付け規則維持と規則単位ヘッダー適用判定を追加修正。C1/C3/C4は前候補ac8194cbの限定receipt取得済み、C2/C5は最新固定SHAで限定再確認中。C6/C7修正後独立再reviewは未実施、実GUI/native受入は保留。

最終提出source: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`。50 files /646 tests、TypeScript/ESLint成功。規則履歴の100件/列上限を原子的に事前検査し、拒否時もデータと両履歴stackを維持。最新receipt/CIと未検収はHANDOFF.md・verification.md・Issue 3を参照。
