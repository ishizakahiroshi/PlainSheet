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

# [計画] PlainSheet C5 確認して整形し復元できるようにする

親: [plan_ux-all-adopted.md](plan_ux-all-adopted.md)

## context配分

| C | 種別 | 内容 | 備考/注意点 |
|---|---|---|---|
| C1 | planned | 契約と現在のcallerを確定 | 先行Cの最新SHAを使う |
| C2 | planned | 確認して整形し復元できるようにするの実装 | 共有ファイルは直列統合 |
| C3 | planned | 境界/回帰検査と証跡 | 未実施をPASSにしない |

## 目的・採用対象

P-20261012-001の親C5。UX-017, UX-018, UX-027を利用者決定によりすべて採用。詳細の合成例・固定source根拠・受入条件は公開指示のproposal.mdの該当UX節を参照する。

## 作業内容

範囲整形・重複削除はpreviewと一括Undo。任意の入力ルールは警告/拒否を明示し、sidecarへ分離。復元下書きは初期OFF、期限/容量/内容/場所を説明してON。通常保存と分けたsnapshotを復元copyへ戻し、個別/全削除/OFF時削除を実装する。

## 変更予定の範囲と担当

cleanup / validation / recovery storage / App.tsx / tests。dots実装担当が所有し、独立担当はレビュー。実sourceを読んで正確な変更パスをFACTS/Issueへ追記する。近傍の無関係整形/別PR変更を含めない。

## 維持する仕様

親のraw文字列・文書ID・visible/source対応・Undo・native/Web保存契約・view/sidecar分離を維持。初期OFFの拡張を利用者の全採用と混同して自動開始しない。既存機能の重複実装をしない。

## 検証と完了条件

00123/長桁/全角空白/hidden行/範囲外を守りcancel変更0。paste時のvalidation全体整合。quota/破損/書込失敗でも通常編集継続。期限切れ整理、OFF時内容書込0、元ファイル外部更新後の隔離復元、Web download開始では下書きを消さない。

proposal.mdの該当UX全受入条件をcoverage表へ展開し、code SHA・実行command/exit・fixture・レビュー対象SHA・未検収をIssueへ記録。過去SHAのPASSを引き継がない。GUI/IME/native/OS clipboard/性能が未観測ならpendingを残し、静的検査と区別する。公開設計・実装・検査・独立reviewの証跡が揃ってから親Cをdoneへ進める。

## 依存と実行境界

親のC順に実行。C5開始前に先行Cの対象SHA/共有契約を確認。外部配置・課金・secret・merge/releaseは追加しない。必要な環境が無い場合はコード/合成検査を進めて不足をまとめる。

## 実装・証跡更新（2026-10-12 UTC）

候補code7831c3c2、Draft PR4。全28候補統合、49files607tests/TypeScript/ESLint成功。詳細は親ディレクトリのcoverage.md、verification.md、remediation.mdを参照。C1/C3/C4とC2/C5の独立再review中。C6/C7修正後独立再reviewは未実施、実GUI/nativeの条件はpending。公開証跡・独立確認・実環境受入が未完のため、この計画をdoneにはしない。

最終source候補更新: ac8194cb09a79d38332ba3421dc10a15d0aa00f3、49files625tests/TypeScript/ESLint成功。範囲別独立確認/未検収はverification.mdと各review報告を参照し、doneとはしない。


最新source更新: `76ab986ceeff7fb0d2dcba17cf6096489c45ff33`、50 files /641 tests、TypeScript/ESLint成功。構造Undo/Redoの後付け規則維持と規則単位ヘッダー適用判定を追加修正。C1/C3/C4は前候補ac8194cbの限定receipt取得済み、C2/C5は最新固定SHAで限定再確認中。C6/C7修正後独立再reviewは未実施、実GUI/native受入は保留。

最終提出source: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`。50 files /646 tests、TypeScript/ESLint成功。規則履歴の100件/列上限を原子的に事前検査し、拒否時もデータと両履歴stackを維持。最新receipt/CIと未検収はHANDOFF.md・verification.md・Issue 3を参照。
