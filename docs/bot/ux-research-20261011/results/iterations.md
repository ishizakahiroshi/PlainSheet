# P-20261011-013 PlainSheet：往復記録

指示SHA a4b136e7074986caf778c39ee26e61c0c774c2bb。主対象SHA 8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6。develop SHA 037c29ea4649efc81acc8f28824dca3df08e7450。日付は2026-10-11。

## I0 受付

固定README/FACTS/REVIEW/PROGRESS全文読了。テンプレート全文取得。GitHub読取、現行公式Web、Node/既存Playwright/Chromiumの合成検査が可能。Vitest/jsdom/Bunは未利用。製品起動なし、既存製品画面なし、実IME/native/性能未確認。独立探索担当と公式比較担当を分離。

## I1 最初の質問7点

手元からのfilter/tab・検索再focus・保存通知対象・header初期値・保存して閉じる・Web文字コード・regex置換の質問をUX-001〜007へ固定。save snapshotが既に文書IDに紐付く反証、confirmが既にある反証、設定でheader解除可能、文字列置換仕様を追記。既存PRの解消項目は再提案しない。

## I2 合成関数の追加5観点

JSON/YAML文字列化=UX-009、Markdown表のみ保存=UX-010、カンマclipboard=UX-008へ統合、不正regex=UX-011、Undo dirty=UX-012。手元でのunit suite環境エラーは製品不具合と分離。READMEの型説明を尊重する。sourceの機能差と新parser bugを区別。

## I3 初回候補batch

batch-01.mdにUX-001〜014を途中提出。探索担当のfill/空セル到達性をUX-013/014へ追加。反証前なので両者は依存契約/source候補。画面再現済みとしない。手元回答、独立反証、追加根拠を同IDで追記する。

## I4 初回独立反証

提案者/探索とは別contextが固定sourceとGlide6.0.3を確認。UX-001〜016のうちUX-008/013/014は反証を通過。UX-006はWebが原本へ直接上書きしないためP1→P2。UX-015は保存値の破壊ではなくsort比較精度、UX-016はデータmappingではなく番号/住所表示に限定。候補ID全体の削除はないが、以下の根拠枝は撤回/訂正した。

- UX-008のhelper名をserializeClipboardTextからrangeTsv→serializeCsvへ訂正。
- Glide資料のWeb整形行番号を引用せず、固定commit 2abe757e65cc7c38ab4f9464c229db27be4c1a8e の物理行へ訂正。
- filtered fill誤読/hidden書込疑いを撤回。displayRows読取とtoSourceRow書込が対応、hidden更新guardあり。
- filter中fill全面無効という反対方向の誤説明も撤回。onFill/fillHandleは有効。
- 名前box jumpのensureSize説を撤回。移動はselection/focus、編集commitの配列拡張とは別。
- Web BOM書出し未搭載説を撤回。既存出力あり、取込BOM認識/保持に限定。
- Canvas-only reader不可/Toast通知なし/非modalへ一律trap必須は不成立として除外。

## I5 手元実測と追加比較

固定sourceの24files/190tests PASS（手元、jsdom/mockを含む）と実parser/serializer/Blob fixtureをIssue #2の実行記録へ紐付け。こちらでも標準Blob/TextDecoderの合成CP932/BOMを実呼出しして一致。元Webファイルは上書きしない点を維持する。

Googleの列分割/重複/空白整理、dropdown警告/拒否、Microsoft先頭0/長桁/BOM資料を追加確認。UX-017任意範囲整形、UX-018任意入力ルールはP3保留。session/local/sidecar保存と削除導線を提案。UX-019数式engine、UX-020共同編集はCSV外情報/軽量local性の代償を理由に見送り推奨。未搭載をbugとしない。

## I6 UX-002 componentの追加再現

手元は未変更SearchPanelを既存jsdom/Reactでmountし、open=true初回検索欄focus→他buttonへ移動→同じtrue再描画でfocusは戻らず→false/trueで復帰を確認と報告。source仮説のみからcomponent合成再現へ更新。App/実canvasでのCtrl/Cmd+F/H伝播、native、実IMEは未確認を維持。

UX-014はA100/A100:B101/Z1の移動/選択だけでrows/dirtyを変えない受入を追加。virtual emptyを区別し、100000×702配列の事前実体化は提案しない。

## I7 全体checkpoint R1

proposal.md/htmlを単一台帳の20IDから生成。採用/保留/見送りは初回未選択、選択肢ごとに利用者の利点/不利点、時期/概算/暫定回避/一覧復帰を用意。公式sources・13領域coverageを提出。HTMLの描画・保存・全件出力の動的検証と最終固定revision独立レビューは継続中。既存templateの検証スクリプトは配布物でなく検証用コピーにのみ差し込む。
