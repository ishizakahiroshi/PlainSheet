# P-20261012-001 PlainSheet：全採用実装の看板

作成: 2026-10-12(月)。作業repo `ishizakahiroshi/PlainSheet`。branch `dots/ux-all-P-20261012-001`。base `bot/20261005-004-excel-like-ux` / oracle `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`。指示書保存先 `docs/bot/ux-all-adopted-20261012/`。

手元Codex: 方針・指示・送信・差分総合検収。dots: 実装統合と別担当の独立review。初回の指示公開commit、Issue URL、最終固定指示commitは送信前の追記で確定する。Draft PR/code SHA/review SHA/CI runは実測後に追記する。

専用Issue: https://github.com/ishizakahiroshi/PlainSheet/issues/3 。初回指示公開commit / review diff起点: `bf7e54689742c35a2158c16f79823a66cb59ad85`。送信時の固定指示commitはIssue本文/送信記録が示す。本文と各snapshotの実ファイルを公開後に照合する。

状態の正本は専用Issueコメント。利用者は28件を採用済み。計画の公開と送信を、受付/実装着手として数えない。

| 工程 | 担当 | Issue/公開証跡 | 現在の残件 |
|---|---|---|---|
| 計画・指示 | 手元Codex | 固定8204b544、Issue3受付保存済み | なし |
| C1〜C7候補実装 | dots | Draft PR4、code 6dba8bd1、28coverage/135条件 | 全体受入は保留 |
| C1〜C5独立確認 | 独立review | C1/C3/C4: ac8194cb限定PASS、C2/C5: 6dba8bd1限定PASS | 実GUI/native条件は保留 |
| C6/C7独立確認 | 独立review | 初回4件の保存済み報告と修正/合成回帰 | 修正後独立再review未実施。停止したreviewは再開しない |
| CI/統合検査 | dots | 新規50files646tests/typecheck/lint成功。ac8194cbの3OS CI成功 | 最終head CI読取確認 |
| 手元総合検収 | Codex | 統合候補と全差分/指摘修正記録を提出 | 範囲別未検収の判断 |
| 実GUI/native | 手元/利用者の実環境 | manual-acceptance.md | IME/clipboard/終了保存/支援技術/幅/性能 |


## 28件のtraceability入口

各UXの仕様と全受入条件はproposal.md、追加契約はplans/親子plan。C1:008/013/014/015、C2:003/005/006/009/010/012、C3:002/007/011/023/025/026、C4:001/004/016/021/022/024/028、C5:017/018/027、C6:019、C7:020。C8は全件総合検収。

次の一手: 最終固定sourceの限定独立確認とCI結果を保存し、範囲別の検収保留をまとめて手元へ提出。新しい実装セッションを重複起動しない。

## 実装候補の更新（2026-10-12 UTC）

- 固定指示 `8204b5442f602164148b725c3ad07190630e33c4` を全文照合して受付。受付記録: [Issue 3 comment](https://github.com/ishizakahiroshi/PlainSheet/issues/3#issuecomment-6115240361)。
- [Draft PR 4](https://github.com/ishizakahiroshi/PlainSheet/pull/4)、初回候補code SHA `a632ef64a2631e2dd00e63a84f6e12d8effb5469`。C1〜C7全28件の候補実装を統合。
- 新規実測で43 files /515 tests・TypeScript・ESLint成功。ただしC8独立reviewで具体的な統合不具合を検出しているため、実装完了/受入済みとは扱わない。
- 現在: 固定候補の全面独立review、修正一覧の収集。次: 一括修正、回帰追加、新SHAで全体再検査・独立再review。
- 28行/全135受入条件はcoverage.md、実測と残件はverification.md、実環境の一括検収項目はmanual-acceptance.mdへ集約。
- 実GUI/native/IME/OS clipboard/支援技術/狭幅/性能/Bun/Rustはpending。製品通常起動・手動build・workflow変更・merge/release/deployは実施していない。

上部の「未実装/受付待ち」は指示公開時の記録。この更新とIssue 3の新しいコメントを現在状態として読む。親C/子Cをdoneへ進めるのは公開設計・実装・実測・修正後独立reviewの証跡が揃ってから。

## 最終source候補への更新

- code `ac8194cb09a79d38332ba3421dc10a15d0aa00f3`、新規実測49files625tests/TypeScript/ESLint成功。初回22件と再review7件を修正し、永久回帰へ追加。
- 前候補7831c3c2のCIは3OSとも成功。最終codeのCIは読取追跡中。
- C1〜C5の限定再確認中。C6/C7修正後独立再reviewは未実施、C8/全28検収は保留。実GUI/nativeの未検収を継続。


## 提出時の限定独立確認

C1/C3/C4: ac8194cbの限定最終確認で180恒久/20独立PASS。C2/C5: 6dba8bd1の限定最終確認で48恒久/18独立PASS、対象範囲に残指摘なし。全体50files646tests/TypeScript/ESLint成功。C6/C7の修正後独立再reviewは未実施で再開していないため、C8/全28検収は保留。資料専用headと最終CIはIssue 3へ記録。
