---
type: reference
status: draft
tags: [PlainSheet, UX, dots]
owner: codex
review_status: reviewed
related: []
last_reviewed: 2026-10-12
---

# P-20261012-001 PlainSheet：UX改善28件の全採用実装

2026-10-12(月)。利用者の指示は「せっかくだから全部採用しますよ 計画して dots に実装させてみて」。前の研究案件P-20261011-013のUX-001〜028を全部実装する。保留8件・見送り2件を外さず、数式計算と共同編集も実装する。旧proposalの推薦や「別案件」「未選択」は歴史的評価として読み、今回の指示が上書きする。

専用Issue: https://github.com/ishizakahiroshi/PlainSheet/issues/3 。初回指示公開commit / 実装review diff起点: `bf7e54689742c35a2158c16f79823a66cb59ad85`。送信時の固定指示commitはIssue本文と送信receiptへ記録する。

## 正本と読む順

1. このREADME、[FACTS](FACTS.md)、[全体plan](plans/plan_ux-all-adopted.md)。
2. [proposal.md](proposal.md)の28節すべて。固定source/合成例/反証/全受入条件を読む。
3. 各子plan、[REVIEW](REVIEW.md)、[PROGRESS](PROGRESS.md)、[公式出典](sources.md)。
4. 独立レビュー時は[研究最終review](research-review.md)も読んで、撤回済み誤診を再導入しない。

## 対象・branch・提出先

- Repo: `ishizakahiroshi/PlainSheet`。
- 作業branch: `dots/ux-all-P-20261012-001`。この指示branchへ実装も重ねる。
- 挙動oracle/継承したPR #1のhead: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`。
- Draft PR base: `bot/20261005-004-excel-like-ux`。既存Draft PR #1に積む別Draft PR。main/develop向けに重複したPRを新規作成しない。
- review diffは固定指示公開commitから新code SHA。指示公開後に専用IssueへそのSHAを固定して送る。看板はbranch最新版、挙動oracleとは別。
- GitHub Issue #3への受付/進捗/提出/独立review/手元検収コメントが状態の正本。

## 依存順と担当

全体planのC1〜C8を順に進める。C1で5軸の共通契約を確認した後、C1入力4件、C2保存6件、C3検索6件、C4画面状態7件、C5整形/validation/復元3件、C6数式1件、C7共同編集1件、C8統合検収となる。合計28件。受入項目を先に28行のtraceability表へ展開し、各機能のUI入口、実処理、test、source SHA、review SHA、残件を追えるようにする。

実装担当と独立レビュー担当を分ける。共有のApp/GlideSheet/useSheet/useFileは統合担当1名が直列所有する。独立したhelper/testのみ並列可。横断設計判断はAI間で解決してdesign.mdへ記録し、定型の確認質問で工程を止めない。C1〜C7を統合して総合review→修正→再reviewし、手元での個別機能再テストを毎回要求しない。

## 実装の深さと互換性

28件すべてUIから実処理へ接続する。説明、schema、APIのstub、mockだけを実装済みにしない。数式はraw式と結果を分離し、算術/同一表参照/範囲/絶対参照/主要集計/IF、依存再計算、循環/未対応/計算エラー、式/値exportまで実装。Excel全関数互換は約束しない。

共同編集は利用者が明示開始する別モード。参加者・権限・共有先・同期・保持/削除を表示し、少なくとも2参加者の値と行列構造を実同期する。競合の履歴回復、offline再送、閲覧者拒否/権限取消/退出/共有停止まで対象。データmodelとproviderは分離し、無償OSSの必要最小限の利用を許可する。任意self-host relayのコード・設定例・試験手順を用意する。defaultのpublic signaling/STUN/relayや有料サービスへ自動接続しない。BroadcastChannelのみの同一端末demoは端末間受入の代替にしない。

通常は文字列のローカル編集を維持。数式・復元下書き・内容の共有は初期OFF。ユーザーの全採用はこれらを無断起動する意味ではない。CSVにview/validation/同期metadataを混ぜない。既存の列固定、tooltip、BOM書出し、modal/Toast、hidden行mapping等を再利用する。

## 許可する作業

- 上記branchへのcode/test/doc/看板commit・push、専用Draft PR作成/更新、専用Issueへの進捗/検査記録、review指摘修正。
- `src/**`、`src-tauri/**`、`src/tests/**`、必要な`package.json`/Bun lock、必要なら共同編集の`server/**`と試験script、README/CHANGELOG/機能manual、案件`docs/bot`。正確なpathは作業開始時に記録する。
- 無償OSSの機能上必要な最小依存。固定版、license、目的、bundle/運用影響、lock再現性、rollbackをdesign/依存台帳へ記録。deps未取得なら成功と数えない。
- 合成fixtureのunit/component/integration、lint/typecheck、既存CIの結果取得。共同編集試験のloopbackプロセスは試験として起動/終了を記録。

## 行わない操作

- main/develop/既存PR #1 branchへの直接push、既存PR #1のmerge/rebase、今回Draft PRのmerge、tag/release/deploy、CI workflow変更。
- 明示依頼のない製品buildや通常製品起動。既存CIの自動buildと手元製品buildは別に記録。
- 実データ/実アカウント/secret/課金/ホスティング配置、private repo/手元認証/私有会話へのアクセス。
- 環境の修理・権限回避・検査skip・無関係なリファクタ。CI/buildが止まってもテストを消して通さない。

## 検証と提出

24files/190testsは旧基準の結果。今回SHAで既存回帰と必要な追加testsを行う。Node/Bun/browser/Rustが今回使えるか受付で確認。Bunが無ければ既存Vitestを使えるNode実行やPR CIを使い、実行したcommand/exitを記録。install/build/CI成功を仮定しない。

提出はDraft PR URL、code SHA、28件coverage、対象SHA固定の独立review全文と修正後再review、command/exit/CI run/実行範囲、diff/依存/rollback、実画面とnative受入の未実施一覧。実IME/OS clipboard/native終了保存/支援技術/製品幅/性能をsource/unitで合格にしない。手元AIが全差分・レビュー報告を読む。

## 進め方・停止・返信

利用者は実装を依頼済み。途中の工程承認を繰り返し求めず、範囲内の実装/設計/review修正を自律継続する。範囲外・課金・secret・実配置・実行側承認拒否/取消は停止してIssueへ理由と未完了・安全な再開の一手を残す。同じ書込を取消後に自動再試行しない。特定環境が不足しても安全な別Cやコード/合成検査を進める。長時間になれば checkpoint を残して範囲を落とさず再開可能にする。

同じ案件の会話内だけで返信し、毎回1行目を `#P-20261012-001 PlainSheet：<報告内容>` とする。受付では案件/指示commit/衝突/作業branch/base/独立担当/OS・Node/Bun/Rust/依存取得/GUI/CI能力を報告。進捗・停止・提出はIssueに同じ事実を記録し、PROGRESSはその証跡へのリンクを更新する。私有locator・実ホームpath・秘密値は公開文書へ書かない。

## 実装候補と検収状態（2026-10-12 UTC追記）

[Draft PR4](https://github.com/ishizakahiroshi/PlainSheet/pull/4)、code7831c3c2fc7f8e89ec517b845e0b0485c9f3d2e9。全28の候補実装/統合と合成回帰を用意した。受入条件135項目と28行追跡は[coverage](coverage.md)、設計は[design](design.md)、実測は[verification](verification.md)、指摘修正は[remediation](remediation.md)、実環境一括検収は[manual-acceptance](manual-acceptance.md)。

49files607tests/TypeScript/ESLint成功は候補の実測。C1/C3/C4とC2/C5は独立再review中、C6/C7の修正後独立再reviewは未実施。実GUI/native/IME/clipboard/支援技術/性能もpending。C8と全28受入をdoneにせず範囲別に引き継ぐ。状態の正本はIssue3。

最新source候補: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3`、49files625tests。上記7831c3c2は前候補として保持。最新の範囲別検収・CIはverification.md/Issue3を参照。


最新source更新: `76ab986ceeff7fb0d2dcba17cf6096489c45ff33`、50 files /641 tests、TypeScript/ESLint成功。構造Undo/Redoの後付け規則維持と規則単位ヘッダー適用判定を追加修正。C1/C3/C4は前候補ac8194cbの限定receipt取得済み、C2/C5は最新固定SHAで限定再確認中。C6/C7修正後独立再reviewは未実施、実GUI/native受入は保留。

最終提出source: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`。50 files /646 tests、TypeScript/ESLint成功。規則履歴の100件/列上限を原子的に事前検査し、拒否時もデータと両履歴stackを維持。最新receipt/CIと未検収はHANDOFF.md・verification.md・Issue 3を参照。
