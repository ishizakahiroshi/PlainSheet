# P-20261011-013 PlainSheet：独立レビュー

## 初回反証済み / 最終artifact未受入

主対象source 8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6、比較develop037c29ea4649efc81acc8f28824dca3df08e7450。確認日2026-10-11 UTC / 10-11〜12 JST。提案/編集探索/公式比較とは別contextの反証担当が固定sourceへ戻った。

初回対象: batch commit460a03dd6f50f622bb6723bdae2071503f8dabd6、batch-01.md SHA25639434f99522a0d3263a37c5745086173773673cc664963d3809e7042ddfbdfa7。UX-015/016は追加候補説明を対象に確認。初回反証を最終MD/HTMLのPASSに流用しない。

- UX-008: copySelection→rangeTsv→serializeCsv→独自context parserの自己往復不整合は残る。keyboard routeへ一般化しない。
- UX-013: lock6.0.3/公式fixedcommitと照合。fillDestinationはseedを含む全体、独自preventDefaultが標準seed除外を止める。source＋依存契約として確定、実canvas再現ではない。
- UX-014: display最小100000×702とdata+8 selection clampはsourceで不一致。名前boxの移動は行拡張しない。実画面への影響は未検収。
- UX-006: P1→P2。Web原本を上書きせず、非UTF8import条件の違いとして扱う。BOM出力は既存。
- UX-002: 初回はsource仮説。その後手元component合成再現が追加、実canvas/OSshortcutは未確認。
- UX-015: sort比較精度のみ、保存された文字列は保持。headerなしfixtureを明示。
- UX-016: source行mapping自体は正しい。表示ordinalと元住所の曖昧さに限定。
- UX-001/003/004/005/007/009/010/011/012は反証と既存機能を明記して維持。JSON型/Markdown表のみの設計をparser新bug扱いしない。

撤回された枝と理由はiterations.md/coverage.mdに全件記載。独立担当はNode合成モデル9件を再実行、exit0。製品/React/Glide実行ではない。固定GitHub sourceの物理行を確認し、旧Web整形行番号を訂正した。

## R1の残ゲート

20IDのMD/HTML分類・優先度・推奨・確度の一致、追加17–20の根拠、sources範囲、全coverage、storage失敗/全グループMD出力/最新化/print/640pxを最終revisionで確認する。

資料HTMLの初回headless launchはsandbox socket権限制限で失敗。これは資料検査能力の制限であり製品の不具合ではない。動的検証/視覚確認はこの時点で未完了。製品の実IME/native/clipboard/画面/性能は一貫して未確認。
