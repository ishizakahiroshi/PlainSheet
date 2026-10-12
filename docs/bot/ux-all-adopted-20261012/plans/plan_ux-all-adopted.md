---
type: plan
status: in_progress
docsweep_state: planned
tags: [PlainSheet, UX, dots]
owner: ishizakahiroshi
review_status: draft
related: [docs/bot/ux-all-adopted-20261012/plans/plan_ux-all-adopted_c1_input.md, docs/bot/ux-all-adopted-20261012/plans/plan_ux-all-adopted_c2_save.md, docs/bot/ux-all-adopted-20261012/plans/plan_ux-all-adopted_c3_search.md, docs/bot/ux-all-adopted-20261012/plans/plan_ux-all-adopted_c4_workspace.md, docs/bot/ux-all-adopted-20261012/plans/plan_ux-all-adopted_c5_recovery.md, docs/bot/ux-all-adopted-20261012/plans/plan_ux-all-adopted_c6_formula.md, docs/bot/ux-all-adopted-20261012/plans/plan_ux-all-adopted_c7_collaboration.md, docs/bot/ux-all-adopted-20261012/plans/plan_ux-all-adopted_c8_acceptance.md]
last_reviewed: 2026-10-12
docsweep_delegation: external
due: 2026-10-19
---

# [計画] PlainSheet UX改善28件の全採用実装

## context配分

| C | 種別 | 内容 | 担当 | 子plan |
|---|---|---|---|---|
| C1 | planned | 入力値と編集対象を守る | dots実装 / 独立review / 手元検収 | [plan_ux-all-adopted_c1_input.md](plan_ux-all-adopted_c1_input.md) |
| C2 | planned | 保存と読込みの意味をそろえる | dots実装 / 独立review / 手元検収 | [plan_ux-all-adopted_c2_save.md](plan_ux-all-adopted_c2_save.md) |
| C3 | planned | 検索と操作への到達をそろえる | dots実装 / 独立review / 手元検収 | [plan_ux-all-adopted_c3_search.md](plan_ux-all-adopted_c3_search.md) |
| C4 | planned | タブと表の位置を見失わない | dots実装 / 独立review / 手元検収 | [plan_ux-all-adopted_c4_workspace.md](plan_ux-all-adopted_c4_workspace.md) |
| C5 | planned | 確認して整形し復元できるようにする | dots実装 / 独立review / 手元検収 | [plan_ux-all-adopted_c5_recovery.md](plan_ux-all-adopted_c5_recovery.md) |
| C6 | planned | 数式を実際に計算する | dots実装 / 独立review / 手元検収 | [plan_ux-all-adopted_c6_formula.md](plan_ux-all-adopted_c6_formula.md) |
| C7 | planned | 共有を始めた表を共同編集する | dots実装 / 独立review / 手元検収 | [plan_ux-all-adopted_c7_collaboration.md](plan_ux-all-adopted_c7_collaboration.md) |
| C8 | planned | 28件をまとめて検収する | dots実装 / 独立review / 手元検収 | [plan_ux-all-adopted_c8_acceptance.md](plan_ux-all-adopted_c8_acceptance.md) |

## 目的と利用者の決定

2026-10-12(月)、利用者から「全部採用」「計画してdotsに実装」と指示された。研究P-20261011-013のUX-001〜028をすべて実装対象とする。過去の採用推奨18/保留8/見送り2は調査時点の評価として残し、今回の全採用決定が実装範囲を上書きする。UX-019数式・UX-020共同編集を説明だけ/設計だけで済ませない。採用と初期ONは別で、内容保存・共有・計算の拡張は明示ONを守る。

守る軸は「値と対象」「保存と変換」「操作への到達」「文書ごとの画面状態」「任意拡張の独立」の5つ。C1の最初に共通契約を固定し、以降C1→C8を進める。共有App/GlideSheet/useSheetは一担当が直列で統合し、並列は独立ファイルだけ。

## 対象と成果の入口

案件 P-20261012-001 / ishizakahiroshi/PlainSheet。基準はDraft PR #1の固定SHA `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`。main/develop/既存PR #1と既存worktreeは保持。作業branch `dots/ux-all-P-20261012-001`、Draft PR baseは `bot/20261005-004-excel-like-ux` とするstacked構成。PR #1のmerge/rebase/base更新は自動実施せず、後続PRの差分に既存PRを再計上しない。

公開指示: `docs/bot/ux-all-adopted-20261012/README.md`、本計画と子planの公開copyは同フォルダのplans配下。新案件は [Issue #3](https://github.com/ishizakahiroshi/PlainSheet/issues/3)。初回指示公開commit / review diff起点は `bf7e54689742c35a2158c16f79823a66cb59ad85`。送信時の固定指示SHAは公開後に受付・実装記録へ追記する。研究のR3原文と公式出典を同フォルダへsnapshotとして置く。以前のR2branchだけでは最終R3を読めないため今回のsnapshotを使う。

## 実装の範囲・互換性

全28件の受入条件は公開snapshot `proposal.md` の各UX節を使い、子planの追加契約と合わせて満たす。既存tooltip/列固定/Toast/live/メニュー基本操作/文字コード書出し/filter行mappingを作り直さず再利用する。raw cell文字列とCSV/TSVの値をview設定で変えない。新sidecar/schemaはversion・容量・削除・同名文書隔離を設計し、共有CSVへ黙って混ぜない。既存native/Webの保存差と単一Undoを維持。

数式と共同編集はC6/C7で現仕様を実装可能な契約へ具体化し、設計・根拠を記録して実装まで続ける。無償OSSの最小依存は追加可能だが、版・license・採用理由・サイズ・rollbackを台帳へ記録し、lockfileを再現可能に更新する。課金、外部アカウント、実データ、実認証情報、既定の外部通信、ホスティング配置は行わない。self-host relayのコード/合成fixture/手順は対象。実サーバへの配置は別の実行境界。

## 検証・提出・完了条件

dotsはbranchへのコード/テスト/指示/看板push、上記base向けDraft PR、同Issueの証跡更新、独立review後の修正を行う。テスト/lint/typecheckは実行できる環境で行い、Bun/browser/nativeの不足を受付で申告する。許可された既存CI結果と手元検証は区別。明示指示のない製品build・製品起動・CI workflow変更・main/develop/PR #1直push・merge/release/deployは行わない。試験用loopbackプロセスは合成テストとして所有/終了を記録する。

実装の提出条件は全28行の対象SHA/実装/検査/残件表、対象SHAを固定した独立reviewと修正後再review、差分/依存/rollback、CIの実測結果。機能はUI入口から実処理に接続し、stubや説明画面だけを実装済みにしない。GUI/IME/nativeが観測できなければ未検収として残す。手元AIは統合候補を一度総合監査し、まとめたbug一覧→修正→総合再検査のループを回す。

資料の作成・送信・受付・実装・独立review・CI・手元UI/native検収・採用反映は別状態。Cのdoneは必要証跡が揃ってから記録し、機能実装の自己報告だけで親を完了にしない。研究で確認済みの190tests/資料16casesを新code SHAへ流用しない。

## 記録と次の一手

手元担当Codex、exact model IDはunknown/unavailable。docsweepの有効設定はprovenance checkが無効を返したため設定変更/汎用実行台帳を作らない。未取得のモデルを推測しない。

次のAIは本親planを入口に新案件Issue・PROGRESS・最新Draft PR headを確認し、進行中のCを再開する。routine設計判断はAI間で解決し、重大なscope逸脱・課金/secret/本番配置・実行側承認取消だけを停止理由として証跡化する。取消後は同じ書込を自動再試行しない。新しい書込制限が出ても、安全に進められる別Cや可読差分の準備を続ける。

## 実装・証跡更新（2026-10-12 UTC）

候補code7831c3c2、Draft PR4。全28候補統合、49files607tests/TypeScript/ESLint成功。詳細は親ディレクトリのcoverage.md、verification.md、remediation.mdを参照。C1/C3/C4とC2/C5の独立再review中。C6/C7修正後独立再reviewは未実施、実GUI/nativeの条件はpending。公開証跡・独立確認・実環境受入が未完のため、この計画をdoneにはしない。

最終source候補更新: ac8194cb09a79d38332ba3421dc10a15d0aa00f3、49files625tests/TypeScript/ESLint成功。範囲別独立確認/未検収はverification.mdと各review報告を参照し、doneとはしない。


最新source更新: `76ab986ceeff7fb0d2dcba17cf6096489c45ff33`、50 files /641 tests、TypeScript/ESLint成功。構造Undo/Redoの後付け規則維持と規則単位ヘッダー適用判定を追加修正。C1/C3/C4は前候補ac8194cbの限定receipt取得済み、C2/C5は最新固定SHAで限定再確認中。C6/C7修正後独立再reviewは未実施、実GUI/native受入は保留。

最終提出source: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`。50 files /646 tests、TypeScript/ESLint成功。規則履歴の100件/列上限を原子的に事前検査し、拒否時もデータと両履歴stackを維持。最新receipt/CIと未検収はHANDOFF.md・verification.md・Issue 3を参照。
