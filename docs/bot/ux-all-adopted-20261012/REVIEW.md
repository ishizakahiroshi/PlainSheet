# P-20261012-001 PlainSheet：独立レビュー指示

実装担当から独立した担当が、指示公開commit→提出code SHAの全差分を読む。PR #1の継承差分を今回変更へ再計上しない。対象SHA、初回/再review、実行command/exit、重大度付きfinding、未検証をreportへ書く。指摘なしも見た範囲を明記する。

## 必須の反証

- 全28 IDにUI入口・実処理・意味ある境界検査・受入coverageがあるか。旧見送り2件がstub/説明だけになっていないか。
- filtered visible/source/hidden行、virtual empty/copy/fill/scope/構造変更で他cellを黙って変えないか。長桁・先頭0をNumberで破壊しないか。
- 文書ID snapshot・保存中編集・取消・閉じる・checkpoint・復元が整合し、download開始を耐久保存完了と扱っていないか。
- 28機能の設定がglobalに漏れず、sidecarの同名file誤適用/容量/期限/破損/削除が説明どおりか。
- 数式がeval/Function/外部通信を使わずrawと結果を分離するか。参照・循環・sort/行列変更・Undo・式/値exportの相互作用。
- 共同編集の実transport、認可、同時構造操作、offline再送、競合履歴回復、revocationが機能するか。readonlyがUIだけでないか。defaultでpublic signalingへ接続しないか。
- keyboard/IME/OS予約キー、focus入口/復帰、Canvas accessibilityは実観測と静的推論を分けるか。既存機能を失っていないか。
- 新依存license/固定版/lock/サイズ/rollback、合成fixture、秘密スキャン。無関係差分・CI workflow改変がないか。

## 横断検査

filter×scope×copy/fill、保存中タブ切替×checkpoint×復元、formula×sort/構造/Undo、collab×readonly/権限取消/切断×通常保存を調べる。重大/中findingを実装修正担当へ返し、修正後新SHAを再確認する。古いSHAのPASSを引き継がない。GUI/native不足は未検収に残す。

手元Codexが最後に全差分と独立報告を読む。dots内のreview合格を手元UI/native受入やmerge許可として扱わない。
