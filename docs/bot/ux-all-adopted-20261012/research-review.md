# P-20261012-001 adopted research snapshot

2026-10-12利用者決定: UX-001〜028を全採用。以下の旧推奨/未選択/別案件記述は研究時点の記録で、今回のREADMEと親子planが実装範囲を上書きする。


# P-20261011-013 R3 独立差分・最終内容レビュー

確認: 2026-10-11 15:44–15:46 UTC / 2026-10-12 00:44–00:46 JST。

## 判定

**内容・固定sourceとの整合・資料の静的構造は合格。この範囲のblocking指摘は残っていない。** R2-F01〜04の解消を新しい凍結bytesで確認した。28件の分類・優先度・推奨・確度・根拠・反証に、裏付けのない変更はない。

実ブラウザ描画/操作とremote commit公開は別ゲート。現時点でR3に関するその結果を本担当は受け取っていないため、資料全体・公開完了・製品の受入を無条件PASSとはしない。R1/R2の描画やruntime結果はR3へ流用しない。

## 対象bytes

- `proposal.md`: 159,715 bytes、SHA256 `755f93cd5fe2f26a24629ee8d215a5b5cf37f47a1ff825a8baf3f811e7c2359b`。
- `proposal.html`: 299,229 bytes、SHA256 `eec4056644ac32dfc94110dff256c6c56ce9ddb8991ca7aa935ba6f5ec268470`。
- 両hash/byte数は本担当と別contextの構造担当が独立に実読した。
- docs commit: **未作成との親報告、成功SHAなし、公開未確認**。R3 create_treeは一度拒否され、親による再試行は `user cancelled MCP tool call` で成功SHAを返さなかった。親は公開操作を打ち切っている。本担当はその操作を再試行せず、remote書込なし。R2の`9c34e013a62b7b1212300597313d6bb059f28c3c`をR3commitとして扱わない。
- fixed sourceは不変: PR1 `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`、develop `037c29ea4649efc81acc8f28824dca3df08e7450`、Glide `2abe757e65cc7c38ab4f9464c229db27be4c1a8e`。
- R2比較は`checks/frozen-r2/`の既知hashに一致するcopyを使用。途中R3の82f7…/541e…はこの判定の対象ではない。

## 指摘の解消

| 指摘 | R3の実読結果 |
|---|---|
| R2-F01 UX-022地域順 | 解消。MD1553の入力はA/2/a、B/8/b、A/10/c、MD1593の期待はA/10/c、A/2/a、B/8/b。HTML/candidatesも一致。標準Intl.Collatorと数値比較だけの合成モデルで期待順を確認、exit 0。製品sort関数やUIの実行ではない。 |
| R2-F02 HTML意味破損 | 解消。ContextMenuを壊さず「メニューキー」、focus可能を「キーボードで選べる」、UX-016は「左端の行番号」、UX-007のengineは「正規表現の処理方式の違い」。session/local/Undo/snapshot時刻等の既知の壊れた語を除去。UX-002/003/008/011/013/016の改善後と推奨文が自然な説明へ変わったが技術的根拠はdetailsに保持。 |
| R2-F03回答保存場所 | 解消。HTML65はブラウザ保存領域、HTML自体へ書込なし、他端末へはMD出力と明記。69/99–125のlocalStorage契約と一致。 |
| R2-F04採用時受入 | 解消。019はMD1477–1481に計算・再計算・循環/未対応/エラー・式/値出力・履歴との組合せ、020はMD1534–1539に権限・競合・切断復帰・共有停止/削除を追加。見送り推奨、未実装、別案件承認の境界を保つ。 |

R1-F01〜07の解消はR3でも回帰なし。F08の意味破損は今回修正された。専門用語が詳細・工数にあること自体は誤りではなく、利用者の判断欄のcostと工数も分離されている。

### 軽微・非blockingの編集注記

HTML52、UX-028の導入時期に「タブごとの状態を自動で戻す改善の改善後」という重複が残る。「タブごとの状態を自動で戻せるようになった後」等が滑らか。意味・分類・採否は変わらず、内容受入を止める指摘とはしない。修正する場合はHTMLの新hashと描画対象を揃える。

## Sourceと意味の差分検査

全28候補についてR2とR3のID/priority/kind/confidence/decision/proof/actual/counter/comparisonsを比較し、これらの根拠を表すfieldに変更がないことを確認した。表示用の言い換えと新受入条件はMDdiffとHTML可視文を読んで意味を検査した。詳細なcaller→処理→結果の28件判定はR2reportに記載し、R3で変わった部分は以下を再確認した。

- UX-008: 実rangeTsv→parseClipboardText自己往復の手元証拠を独立モデルより弱いものへ戻していない。右click/app clipboard route、外部曖昧性、keyboard route、実OS未検収の区別は保持。
- UX-013: seedを含む固定Glide契約、preventDefault後の独自生成、手元の実fillSeries数値/文字列fixtureを保持。filtered wrong-source/hidden書込説の撤回、filter中fill有効、App1088/1134–1140の反証も保持。
- UX-014: jump ensureSize説を復活させず、移動/rangeのみではrows/dirty不変・巨大配列を実体化しない受入を維持。
- UX-006: Web原本上書き損失を主張せず、既存BOM exportを否定しない。
- 追加021〜028は任意新機能と分類し、行freezeとheader、複数キーと数値精度、選択検索と置換展開/診断、keyboard入口とキー表記/command検索、復元と通常保存、named viewと最後の状態保持を独立採否として保持。
- 019/020は見送り推奨のままafterと採用再検討条件が対応した。これは実装承認ではない。

一次資料のscope・caller行範囲はR2で固定source/公式ページへ戻って確認済み。R3で証拠URL/引用範囲/比較主張は不変。今回、全41entryを再度web取得したという主張はしない。R3に旧artifactの動的PASSをコピーすることと、変わらない固定sourceの確認結果を利用することを区別した。

## 新しい静的検査

本担当に加え、提案執筆とは別contextの構造担当がR3に対して新しく実行した。製品/ブラウザ起動、build、compile、install、remote書込なし。

- 28 MD sections / 28 HTML cards、ID・一覧・group一致。
- 分類・優先度・推奨・確度・source・現在/改善後・tradeoffs・依存・受入・proofがcandidates.jsonと一致。HTMLの自然な表示用訳は意味も確認。
- 84radio、初期選択0、各cardの推薦1、56模式図。
- 118根拠instancesが両形式で一致。ローカルにある106PR source行範囲はすべて実在する物理行内。bun.lock178はR2時に独立connector再取得で確認、Glideも固定commitの物理行で確認済み。
- 重複ID0、壊れた内部anchor0、欠けた相対file0、未定義公式参照ID0。
- MD front matter / HTML docsweep-metaはtype:reference、status:draft。
- 自動外部resource読込、script通信構文、限定patternの私有URL/絶対pathなし。
- inline JSはR2とbyte-equivalent。提供templateとの差はtask/schema/version/pathname STORE_KEYとdownload filenameのみ。R3runtime成功をこれだけで推論しない。
- schema1、ID単位の回答、string-array keys/string memo、未選択/メモだけ/全group出力、選択だけresetと保存回答削除の違い、失敗時警告の静的意味を維持。
- `Con文字列Menu`、`この端末ization`、`元に戻すする`、`元に戻すして`、`row 見出し行`、`端末この端末`、`間内`、`保存時点の内容時刻`、`回答はこのHTML内だけに保存`はHTML内0件。

実行例: sha256sum、wc -c、R2copyとのdiff -u、Python標準HTMLParser/json/reによる可視文/台帳/ID/リンク検査。修正したUX-022の標準API合成比較の結果は `[["A","10","c"],["A","2","a"],["B","8","b"]]`、exit 0。製品の関数を実行したfixtureではない。

## Companion資料

以下のR3状態を読み取った。後でreview/PROGRESSへ検査結果を書き足す場合は追記であることを明示し、提案MD/HTMLbytesが変わらないことを確認する。

| ファイル | SHA256 |
|---|---|
| coverage.md | `829ad56398d09420ee3d7eeabb45f68b9c93b54bdcb6f669e833146ab3ff3106` |
| sources.md | `475ec6d649e27188834b41617f8c4a5b811fd79d7c209d66dd0a4736746072c2` |
| review.md | `562ee6eb07ac480fa5e00d55520a27d8bd243e826ec8fe345db93870fc7dc7ef` |
| iterations.md | `48e6cc117c0b1ddd0b5d2d6b5a7792ac273bee011625172112e56589f2a1c1b5` |
| PROGRESS.md | `1a58c09636a277f71b9f23ffd670dd6c760b74eeb52e103cf0219d8d9fa659e8` |

## 残ゲート

1. 同じR3bytesの実描画/提供verify/全28図/640px/keyboard等を担当が確認し、新しい結果として記録する。R2の16全PASSをR3結果と呼ばない。
2. R3 commit作成・remote refのreadbackは未確認。親は公開操作を打ち切った。本担当もこの未解決事項を残してレビューを完結する。拒否/取消を回避する別経路は試さず、作成未確認のcommitやpushを捏造しない。
3. 製品の実canvas、実IME、native保存/終了、実clipboard、支援技術、表示幅/性能は未検収のまま。資料の静的合格がこれらの合格を意味しない。

上記bytesの内容・source・静的整合について追加修正要求なし。後続revisionへの無条件流用は不可。
