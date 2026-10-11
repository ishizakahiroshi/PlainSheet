---
type: reference
status: draft
tags: [ux-research, plainsheet]
owner: dots
review_status: draft
last_reviewed: 2026-10-12
---

# P-20261011-013 PlainSheet：独立レビュー

## 初回・R1独立反証済み / R2固定artifactレビュー待ち

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

## R1独立資料レビューと修正

独立反証担当が20件のproposal MD/HTMLを読み、固定sourceと公式資料を再照合した。提案の探索・執筆担当とは別context。対象はcommit `ab15648ddf66083eceee86ded17514b16ebe6532`。

- proposal.md: 98077 bytes / SHA256 `651208f718de2a5a6c366a28ca0b5bd50a033d64e4e1c940711ad924225007d6`
- proposal.html: 194569 bytes / SHA256 `2000508ac9431e06fb4451042616498a488664f437f3bc0ba4ff0b77fc04bb2a`
- R1判定は修正待ち。重大3候補を覆す根拠や新しい製品P0/P1は見つからなかったが、全体PASSではない。

| 指摘 | R2での修正 | 再確認の状態 |
|---|---|---|
| R1-F01 MDの20件目次が題名付きheadingと不一致 | ID単独headingへ変更、全28件の短いfragmentを静的検査 | 静的一致、独立再確認待ち |
| R1-F02 UX-017回避が選択内置換と誤解される | 既存置換は全体/表示行、少数セルは手動編集と明記 | source整合、独立再確認待ち |
| R1-F03 UX-015の2行再現がheader既定trueと衝突 | 見出し設定OFFまたは見出し付き3行を明示 | 条件修正、独立再確認待ち |
| R1-F04 UX-008コピー根拠がwriteTextより前で終わる | App:488–514へ延長 | sourceリンク修正 |
| R1-F05 UX-013固定依存とdrag結合への直リンク不足 | bun.lock:178、固定Glide:2204–2212を追加 | sourceリンク修正 |
| R1-F06 UX-005保存中guardが全close経路に見える | window closeへ限定、tab closeとの差を明記 | source整合、独立再確認待ち |
| R1-F07 UX-006図が読込後も確認不可に見える | 取込前の文字コード確認なしへ限定 | 表現修正 |
| R1-F08 HTML表面の専門語が多い | 操作の説明は日本語にし、技術的な根拠をdetailsへ | 人間向け再読・描画待ち |

## 手元担当によるR1資料検査（独立反証と別）

2026-10-11 UTC / 2026-10-12 JST。上記R1のみに対する報告。製品UIの観察ではない。

- 既存の資料描画環境で、template verifyを検証用コピーへ差し込んだ。初期選択0、メモのみの回答、非表示グループを含む全ID出力、anchor、重複ID、図overflow、JS例外はPASS。1280/640pxの先頭と最初のカードを目視した報告。全28件のR2描画や製品640pxへは流用しない。
- 実HTMLを既存Node/jsdomと代替storage/clipboard APIで検査し16 cases中15 PASS、1 FAIL。同じoriginの別pathnameが保存内容を共有する問題。R2ではtask/schema/versionに加えてlocation.pathnameを保存キーへ戻した。R2再検査待ち。実OS権限や実clipboardの検証ではない。
- 公開前scanで13files・private patterns117件・4構造規則の範囲にprivate hitなし。Encoding Standard公式URLが既定allowlist外として構造検査で停止した報告がある。検証済みの公式Encoding Standardドメインだけを一時的なローカル設定で許可し、他の検査を維持して再実行した結果はexit 0、13files、117 needles、4 patterns、hit0、skip0。グローバル設定と公開資料は変更せず、一時設定は削除した報告。private情報を検出したという結果ではない。

[R1と追加実測の公開記録](https://github.com/ishizakahiroshi/PlainSheet/issues/2#issuecomment-6110628355)を2026-10-11 15:33 UTC / 10-12 00:33 JSTに再読して照合した。

こちらの資料HTML用Chromium起動は既存runtimeのsocket制限で失敗した。再試行を停止し、上の別環境結果と区別して記録する。制限を製品不具合の根拠としない。

## R2の提出時点の検査と残ゲート

R2はUX-001〜028、84選択肢、56模式図、公式41 entry。初期選択0、重複ID0、未解決HTML anchor0、MD短縮anchor一致、ID/分類/優先度/推奨の台帳一致、外部asset0、reference/draft metadata、私有URL/絶対pathの限定pattern scanを静的に確認。inline JSの構文検査はexit 0。配布する実inline JSを最小合成DOM/storage/clipboardで12 cases実行し全PASS。実ブラウザ・実保存・実clipboard・印刷・支援技術の合格ではない。

28提案の固定commitとMD/HTML SHA256を独立担当に渡して再確認する。追加21–28の既存機能・公式scope、利用者の得失と工数の分離、重複、MD/HTMLの一致、R1-F01–08の解消を対象にする。手元担当もR2資料の描画と16 casesを再検査する予定。古いrevisionの結果をR2のPASSにしない。

製品の実IME/native保存/終了・実clipboard・実canvas・支援技術・画面幅・性能は未検収のまま。調査資料としての受入と製品改修の検収は別である。
