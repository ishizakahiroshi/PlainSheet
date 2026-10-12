# P-20261012-001 PlainSheet 統合候補の引継ぎ

全28 UXの候補実装を[Draft PR 4](https://github.com/ishizakahiroshi/PlainSheet/pull/4)へ保存。**全28検収完了ではありません。**

- 作業branch: `dots/ux-all-P-20261012-001`
- 指定base: `bot/20261005-004-excel-like-ux`
- 最終source code: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`
- 固定指示: `8204b5442f602164148b725c3ad07190630e33c4`
- 挙動oracle: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 総合review差分: `bf7e54689742c35a2158c16f79823a66cb59ad85...6dba8bd1fb42b22b065fc9e8003d8d137e054610`
- 状態の正本: [Issue 3](https://github.com/ishizakahiroshi/PlainSheet/issues/3)

## 用意したもの

全28のUI入口・処理・意味ある境界testsを実装。数式は安全な限定parser/evaluator、共同編集は明示providerの実HTTP client/relayまで含む。設計だけの提出ではない。数式・復元内容保存・共有は初期OFF。共有先の既定public signaling/STUN/relayなし。

- [28行coverageと全135受入条件](coverage.md)
- [共有契約/設計](design.md)、[数式契約](formula-contract.md)、[共同編集契約](collaboration-contract.md)
- [保存・読込契約](c2-contract.md)、[整形/validation/復元契約](c5-contract.md)、[名前付き表示契約](named-views-contract.md)
- [独立指摘と周辺再検査の修正/回帰](remediation.md)
- [検査記録](verification.md)、[依存/lock/rollback台帳](dependency-ledger.md)
- [実環境でまとめて確認する項目](manual-acceptance.md)

最終sourceで新規実行: TypeScript no-emit、ESLint、**50 files /646 testsが成功**。実HTTP loopbackの機能回帰を含み、試験server/clientは終了処理済み。新規OSS依存・manifest/lock変更なし。

## 検収範囲

C1/C3/C4は前候補ac8194cbの限定最終確認で独立20件・恒久180件PASS。C2/C5は最新6dba8bd1の最終限定確認で恒久48件・独立18件PASS、当該範囲の残指摘なし。列履歴/ヘッダー適用/復元上限の再確認は各固定SHAで段階別に保存。各receiptの対象SHAを個別review文書とIssue 3で確認する。

C6/C7は初回独立review本文・検査結果が保存済みで、その指摘を修正し合成回帰も実行した。ただし、そのreview sessionが停止したため**修正後のC6/C7独立再reviewは未実施**。同じreviewを再開・別経路で代替していない。このためC8/全28独立検収をdoneにしない。

実GUI、実IME、OS clipboard、native保存/終了操作、支援技術、狭幅/拡大/性能、別device/TLS/native共有通信は未検収。CIのBun frozen-lock/native build結果やcanvas/native API mockを、実操作の観測へ置き換えない。

## 保持した実行境界

PR #1/main/developへの直接変更、merge、release、deploy、workflow変更・手動dispatch、通常製品起動、手動product build、実データ/アカウント/秘密情報の利用は行っていない。既存PR CIの自動実行だけを読取確認した。試験用HTTP relayはloopbackのみで、サービスを配置していない。

コードと資料は指定branchに限定。Rollbackはこの作業のcommitsをrevertし、復元下書きと名前付き表示の利用者が明示保存したlocal dataはUIで別途削除する。共有roomの寿命・削除・他参加者のcopyが消せない限界は共同編集契約に記載した。
