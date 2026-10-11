# P-20261012-001 PlainSheet：基準と決定

2026-10-12(月)確認。利用者が研究の全28件を採用し、計画とdots実装を依頼した。研究P-20261011-013は[Issue #2](https://github.com/ishizakahiroshi/PlainSheet/issues/2)、手元最終検収は[原文コメント](https://github.com/ishizakahiroshi/PlainSheet/issues/2#issuecomment-6111013651)。

| 対象 | 固定状態 |
|---|---|
| main | 835b24632334724a43b00c8e0883ac9d650e0fdc |
| develop | 037c29ea4649efc81acc8f28824dca3df08e7450 |
| Draft PR #1 / 既存base branch | 8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6 / bot/20261005-004-excel-like-ux |
| 研究docs公開最終R2 | 9c34e013a62b7b1212300597313d6bb059f28c3c |
| 研究R3 | commitなし。Issue原文からbytes/hash照合で回収。今回proposal/sources/research-reviewへsnapshot化 |

研究はsource/実関数/componentを調べた提案であり、利用者のインストール版特定・実GUI/native検収ではない。既存190unit testsと資料HTML16casesは旧SHAの結果として読み、新実装の成功証拠へ流用しない。

撤回済みの誤診: filtered fillのsource/visible書込mappingは正しい。hidden rowへ書くと断定しない。modal focus/Toast live/Glide accessibility DOM/列固定/toolbar wrap/BOM出力は既存。600px前後の製品画面を未観測のまま壊れていると断定しない。

実測合成根拠: rangeTsv→parseClipboardTextで1列2行のカンマ入り文字列が2列へ広がる。fillSeriesは最後のseedの次から生成し、Glide custom fillのdestinationはseedを含む。virtual display領域と編集selection上限が異なる。CP932 Blob.textと指定decoderの結果が異なる。SearchPanel open=true継続時のfocus復帰は実component/jsdomで不足を確認した。これらを実OS/UIの観測済みbugとは書かない。

全採用の追加契約はREADMEと親子planに記録。公式研究出典は[出典一覧](sources.md)。共同編集設計候補の一次資料は[Yjs公式](https://docs.yjs.dev/) と [y-webrtc公式](https://github.com/yjs/y-webrtc)。Yjsのdata modelとnetwork providerを分離できること、y-webrtcがpublic signaling設定を持つことを確認した。採用する場合は既定の外部接続を明示無効にし、transportの暗号化だけで閲覧/編集の認可を証明したと扱わない。これらは候補であり特定library導入を必須にしない。

前案件のdotsはNode24あり/Bunなし、Chromium socket制約を申告していた。新案件環境は受付で再確認する。手元の既存候補は保持済み。共有Git・文書統合は直列所有する。
