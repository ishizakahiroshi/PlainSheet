# P-20261011-013 PlainSheet：UX調査・改善提案

版: R1（独立最終レビュー前の固定候補） / 作成 2026-10-11 UTC・2026-10-12 JST。製品改修は行わない。

## 結論

先に **UX-013 フィル、UX-008 自己コピー往復、UX-014 選択対象** の契約を揃え、その後に **UX-009/010 上書き前の変換予告** を加える。全セルをtextとして保存する強みを保つ。20 IDは20件のbugという意味ではなく、source不整合、改善、component検証、任意の拡張、見送り案を含む。

採用方針はまだ利用者が選んでいない。以下の推奨は判断材料であり実装の許可や確定した採択ではない。対になる [単一HTML](proposal.html) では全項目が未選択から始まる。

- 固定指示: `a4b136e7074986caf778c39ee26e61c0c774c2bb`
- 主対象: 既存Draft PR #1 `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`。候補sourceの調査であり利用中版ではない。
- 比較: develop `037c29ea4649efc81acc8f28824dca3df08e7450`。main/公開版/利用中版との一致は未確認。
- 正本: [Issue #2](https://github.com/ishizakahiroshi/PlainSheet/issues/2)。この資料branchは製品修正やPR #1のmergeを行わない。
- 関連: [coverage](coverage.md) / [sources](sources.md) / [独立レビュー](review.md) / [往復・撤回](iterations.md)

## 証拠の層

1. **source**: 固定SHAのcaller→処理→結果。実画面を観察したという意味ではない。
2. **既存unit（手元報告）**: 固定PR SHAの `bun run test`、24 files / 190 tests、exit 0。[実行記録](https://github.com/ishizakahiroshi/PlainSheet/issues/2#issuecomment-6110347439)。初回collect失敗はdirectory junctionの環境要因で、physical worktreeで成功。jsdomとmock grid/native APIを含むため実canvas/IME/native保存の合格ではない。
3. **手元の実関数呼出し**: JSON/Markdown/clipboard parser/serializerとBlob.textの合成入力。製品UI起動なし。SearchPanelは未変更componentの合成DOM再現。統合shortcutやOS動作と分ける。
4. **こちらの合成モデル**: Node v24.19.0で9件の文字列/算術モデル。source文字列guardつきだが製品関数/React/Glideの実行ではない。独立反証担当も再実行、exit 0。Blob/TextDecoderは標準APIの実呼出し2fixtureを実施。
5. **公式比較**: Microsoft/Google/W3C/WHATWG/Glideの節を確認。各資料が支持する範囲のみ利用し、競合の印象を仕様にしない。
6. **未検収**: 製品実画面、実clipboard、Windows/macOS/Linux native、実日本語IME、支援技術、製品640px/高コントラスト、速度/負荷。HTML資料の描画検査とは別。

## 推奨順と優先度

P0なし。P1は意図しない値/対象/上書き変換へ直結する経路、P2は誤解・回復・比較精度、P3は高度用途や任意拡張。頻度と秒数は未実測。工数は経験則の相対概算で、担当者・基盤・実機確認で変わる。

| 順 | ID | 優先 | 分類 | 推奨 | 題名 |
|---|---|---|---|---|---|
| 1 | [UX-013](#ux-013) | P1 | source＋固定依存契約で確定した不整合 | 採用推奨 | フィルで元のセルを変えない |
| 2 | [UX-008](#ux-008) | P1 | sourceで確定した不整合（合成モデルあり） | 採用推奨 | コピーした表を同じ形で貼り戻す |
| 3 | [UX-014](#ux-014) | P1 | sourceで確定した境界不整合（画面影響は仮説） | 採用推奨 | 見えるセルと編集対象を一致させる |
| 4 | [UX-009](#ux-009) | P1 | 機能改善（意図した文字列セル設計） | 採用推奨 | JSON/YAMLの上書き前に変換内容を示す |
| 5 | [UX-010](#ux-010) | P1 | 機能改善（table-only設計の境界） | 採用推奨 | Markdownは表だけを保存すると伝える |
| 6 | [UX-011](#ux-011) | P2 | sourceで確定した診断不足 | 採用推奨 | 検索エラーと一致なしを分ける |
| 7 | [UX-006](#ux-006) | P2 | 機能改善（Web/desktopの読込契約差） | 採用推奨 | 文字コードと読込結果を確かめて開く |
| 8 | [UX-003](#ux-003) | P2 | 機能改善 | 採用推奨 | 保存結果に対象ファイルを必ず添える |
| 9 | [UX-001](#ux-001) | P2 | 機能改善（現行の状態消去はsource確定） | 採用推奨 | タブを戻ったときに絞込みを保つ |
| 10 | [UX-004](#ux-004) | P2 | 機能改善 | 採用推奨 | 先頭行の意味をファイルごとに選ぶ |
| 11 | [UX-015](#ux-015) | P2 | sourceで確定した数値比較の精度不足 | 採用推奨 | 大きな番号を正しい順序で並べる |
| 12 | [UX-016](#ux-016) | P2 | 機能改善（表示参照の整合） | 採用推奨 | 絞込み後も元の行番号を分かるようにする |
| 13 | [UX-005](#ux-005) | P2 | 機能改善 | 採用推奨 | 閉じる前に保存へ進める |
| 14 | [UX-002](#ux-002) | P2 | component合成再現＋sourceの診断（統合操作は未確認） | 保留推奨 | 検索を呼ぶたび入力欄へ戻す |
| 15 | [UX-012](#ux-012) | P3 | 機能改善（保守的なdirty判定） | 保留推奨 | 保存地点へ戻ったことを区別する |
| 16 | [UX-007](#ux-007) | P3 | 機能改善（競合との機能差） | 保留推奨 | 正規表現の置換ルールを明示する |
| 17 | [UX-017](#ux-017) | P3 | 機能改善（任意の新機能） | 保留推奨 | 選んだ範囲だけを確認して整形する |
| 18 | [UX-018](#ux-018) | P3 | 機能改善（CSV外metadataを伴う新機能） | 保留推奨 | 入力ルールを任意で確かめる |
| 19 | [UX-019](#ux-019) | P3 | 拡張案・今回見送り推奨 | 見送り推奨 | セルの数式を計算する |
| 20 | [UX-020](#ux-020) | P3 | 拡張案・今回見送り推奨 | 見送り推奨 | 複数人で同時編集する |

## 既存PRで直ったことを再提案しない

- 保存前の未確定編集commit、IME中のcommit拒否、native/titlebar/window closeの全タブguard
- 文書IDに紐付く保存snapshot、保存中に生じた別変更のdirty維持、Web download表示とdirty保持
- filtered rowsのcopy/paste/clear/searchの元行mapping、宛先不足時の貼付全体拒否
- exact非連続header選択のUndo/Redo・統計、tooltip、dialog focus trap/復帰、検索総件数とnavigation capの区別

sourceと既存testsの実装を確認したもので、実機検収済みという意味ではない。詳細はcoverageに記す。

## Plain textと画面状態の保存境界

- CSV/TSVは値のtext。見出し解釈・filter・scroll・freeze・validation・書式・コメントはCSV本体へ勝手に混ぜない。
- まずview/ruleをsession内に置く。端末localへ残すなら対象ファイルとの結付け、保存場所の説明、解除/全削除をUIに設ける。別端末・他人へCSVだけ渡しても移らないことを表示する。
- sidecar採用時はファイル名/同伴共有/移動/rename/削除を明示。元ファイルから個人データを複製する必要を最小化する。勝手に生成しない。
- 数式、書式、複数sheet、コメント、共同編集を採用するとCSVでは表現できない情報が生じる。保存形式か別metadataを決めずに追加しない。今回は本格数式/共同編集を見送る。

## A · 入力した値と対象を守る

### UX-008 コピーした表を同じ形で貼り戻す

- 分類: sourceで確定した不整合（合成モデルあり）
- 優先度: P1。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：右クリック/toolbar copy→context paste。OS clipboard実経路は未観察。

**利用者・再現条件/合成入力**: A1:A2にNorth,EastとSouth,West、B列に保護したい文字を置く。copy→右クリック貼付で1列を保ちたい。

**現在のcaller→処理→結果**: App copySelection→rangeTsv→serializeCsv(TSV)。context paste→parseClipboardTextはtabなし複数行をcomma CSVと推定し2×2化。引用符1cell/末尾空行/空cellにも自己往復差のモデルあり。

**期待/改善後**: 自アプリのcopyへ形状とTSV provenanceを添え、読めるときはその形を優先。外部textはTSV/CSV/単一列のpreview・明示選択を必要時に出す。HTML clipboardも検討するが常に存在すると仮定しない。

**反証・既存機能・限界**: multiline CSVを便利に貼る仕様は既にtestがある。CSVを全面削除する案ではない。Glide keyboard pasteは別解析routeなので同じ誤りと一括断定しない。

**develop/PR差分**: clipboard.tsの該当処理はdevelopと同じ。PRでhidden-row安全性は改善済みだがこのformat曖昧性は残る。

**Excel/Sheets/標準の比較**: OFF-MS-15：visible copyの契約はrange/table/platformで違う。OFF-GS-02：基本copy/paste。公式資料がこのCSV推定方式を要求するわけではない。 OFF-GS-08：区切り文字を明示して列分割する先例。clipboard parser互換の証拠ではない。

**採用メリット**: 列が増えて隣を上書きする事故、引用符/空行の変化を防ぐ。

**採用デメリット・見送りの利点**: provenanceはブラウザ権限や他アプリを経由すると失われる。毎回previewでは作業が遅い。曖昧時だけ選択。

**推奨理由**: 単純な自己往復を最優先に直す。全貼付を同じ純関数契約に寄せ、上書き範囲を確認可能にする。

**導入時期**: 先行：次の編集品質改善で検討

**改修目安（未実測）**: M：3–5人日程度。

**依存**: clipboard format選択とshape保持。

**決まるまでの暫定回避**: 曖昧なcomma/quote/空行を含む右クリック貼付は避け、貼付直後に形と隣列を確認し誤ればUndo。別routeも検証なしに安全と保証しない。

**before / after（source説明用。実画面ではない）**

- 現在: 元は1列 × 2行 → North,East / South,West → 貼付: 2列 × 2行
- 改善後: 元は1列 × 2行 → TSVの形状を保持 → 貼付: 1列 × 2行

**固定根拠**

- [src/App.tsx:488–508](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L488-L508): copy callerとwriteText
- [src/App.tsx:599–616](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L599-L616): context paste caller
- [src/lib/clipboard.ts:4–36](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/clipboard.ts#L4-L36): TSV出力とCSV推定
- [src/tests/clipboard.test.ts:44–53](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/tests/clipboard.test.ts#L44-L53): CSV解釈を意図したtest
- [Issue #2 手元の合成実行記録](https://github.com/ishizakahiroshi/PlainSheet/issues/2#issuecomment-6110347439): 既存runtimeによる実parser/serializer/Blob呼出し、GUIではない

**受入条件**

- 1×1引用符、2×1comma、末尾空行、空cell、tab/newline/空列がcopy→pasteで一致
- 自copyと外部CSV/TSV/HTML、keyboard/context routeをそれぞれ検査
- 隣接既存cellを想定外に変えず、一括Undoできる
- filtered pasteのvisible destination不足時は既存の全体拒否を維持

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-013 フィルで元のセルを変えない

- 分類: source＋固定依存契約で確定した不整合
- 優先度: P1。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：handler/Glide6.0.3契約＋合成モデル。実canvas操作は未確認。

**利用者・再現条件/合成入力**: A1:A2=1,2をA5までフィル。またはA1=10のA1:A3を選んでCtrl+D。元の値を残して連番/コピーしたい。

**現在のcaller→処理→結果**: lockはGlide6.0.3。fillDestinationがseedを含む全範囲を渡す契約に対し、fillSeriesはseed後の続きから作り全destへ書く。モデルでは3,4,5,6,7と11,12,13になる。

**期待/改善後**: drag連番はseedを除く拡張部分だけ生成。Ctrl+D/Rはコピーとして分ける。上/左方向や数値以外の繰返しも明示。

**反証・既存機能・限界**: 純関数単体testは続き生成を正しく確認しており、それ自体が誤りとは限らない。問題はcallerと依存の範囲契約。GUIの実再現・OS shortcutは未検収。 filtered fillの誤読/hidden書込という追加疑いは撤回。App:1088はdisplayRowsを渡し、App:1134–1140にhidden更新guardがある。fillHandle自体はfilter中も有効。

**develop/PR差分**: autofillとfill handler基本形はdevelopから存在。PRでこの部分は解消されていない。

**Excel/Sheets/標準の比較**: OFF-GS-02：Ctrl+D/Rのコピー動作の比較。OFF-GLIDE-01：固定Glide commitのfillPattern/fillDown/handleMouseUpが依存契約の根拠。競合shortcutだけで内部契約を証明しない。

**採用メリット**: 連番作成で元データを書き換える可能性を除く。

**採用デメリット・見送りの利点**: dragとkeyboardを分岐すると仕様とテストが増える。上/左方向を場当たりで直さない。

**推奨理由**: 既存190testsの外にある依存境界の回帰検査を優先して追加する候補。

**導入時期**: 先行：次の編集品質改善で検討

**改修目安（未実測）**: M：3–5人日程度。

**依存**: 固定Glide6.0.3のevent contract確認、実canvas受入。

**決まるまでの暫定回避**: 連番fill/Ctrl+D/Rへ依存せず値を直接入力し、fill後はseedと出力を確認。誤ればUndoする。

**before / after（source説明用。実画面ではない）**

- 現在: 元: 1 / 2 → A5までフィル → モデル: 3 / 4 / 5 / 6 / 7
- 改善後: 元: 1 / 2 を維持 → 続きだけ追加 → 1 / 2 / 3 / 4 / 5

**固定根拠**

- [src/components/GlideSheet.tsx:486–533](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/GlideSheet.tsx#L486-L533): 全destへfillSeriesを書込
- [src/components/GlideSheet.tsx:655–686](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/GlideSheet.tsx#L655-L686): downFill/rightFillとcallback
- [src/lib/autofill.ts:3–42](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/autofill.ts#L3-L42): seed後の連番生成
- [src/App.tsx:1087–1142](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L1087-L1142): displayRows入力とhidden更新guard
- [Glide6.0.3 data-editor.tsx:2101–2186](https://github.com/glideapps/glide-data-grid/blob/2abe757e65cc7c38ab4f9464c229db27be4c1a8e/packages/core/src/data-editor/data-editor.tsx#L2101-L2186): 全destをcallbackへ、既定処理のseed除外とfillDown

**受入条件**

- 1,2→A5が1,2,3,4,5でseed不変
- Ctrl+Dの10は10,10,10、Ctrl+Rもコピー
- 上/左/複数列/文字列/日付/空値の方針が明示される
- filter中は表示順で読み、元行へ正しく書き、hidden rowを変えず単一Undoを維持する

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-014 見えるセルと編集対象を一致させる

- 分類: sourceで確定した境界不整合（画面影響は仮説）
- 優先度: P1。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：clamp値。画面focus/selection effectの見え方は未確認。

**利用者・再現条件/合成入力**: 非filterの1×1新規表でA100やZ1をクリック、名前boxでA100へ移動。見える場所を編集したい。

**現在のcaller→処理→結果**: 表示最小は100000行/702列。一方selection/contextmenu/control effectのmaxは実データ+8。1×1ならA100クリックはA9、Z1はI1へ丸める。名前boxはApp A100を保ちgrid側A9へ丸める経路。

**期待/改善後**: 表示範囲・選択・名前box・編集・貼付の境界を同じ契約へ統一。広い空範囲へ移動可能にするか、到達不能部分を表示しないかを選ぶ。無断で隣セルへ移さない。

**反証・既存機能・限界**: PR末尾の空cell dimension修正はgetCellContentのspan等であり、この独立clampは残る。表示上どちらのeffectが目に見えるかは実機未確認。データ誤書込を実観察したとは言わない。 handleJumpはensureSizeせず移動だけ。内容commitによる拡張は別経路であり、移動のclampを反証しない。

**develop/PR差分**: developにも表示minとselection bufferの不一致。PRの空cellspan修正済み項目と混同しない。

**Excel/Sheets/標準の比較**: OFF-W3C-02 / OFF-GS-07：cell addressとfocus/selectionを一貫して扱う基準。100000行という規模を競合が要求するわけではない。

**採用メリット**: 狙った番地と表示選択が食い違うリスクを減らす。

**採用デメリット・見送りの利点**: 無制限に広げると大きな空配列を生みうる。疎な編集か明確な上限を設計する必要がある。

**推奨理由**: 現在の大きなgridを維持するなら、保存データの巨大化を避けつつ操作境界を統一。

**導入時期**: 先行：次の編集品質改善で検討

**改修目安（未実測）**: M–L：5–10人日程度。

**依存**: grid境界の設計選択、実canvas検収。

**決まるまでの暫定回避**: 現在データに近いcellから編集し、名前boxと選択表示の一致を確認する。

**before / after（source説明用。実画面ではない）**

- 現在: 名前box: A100 → gridの選択: A9（source） → どちらを編集する？
- 改善後: 名前box: A100 → gridの選択: A100 → 対象を統一

**固定根拠**

- [src/types/sheet.ts:48–60](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/types/sheet.ts#L48-L60): grid最小寸法とbuffer
- [src/components/GlideSheet.tsx:179–192](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/GlideSheet.tsx#L179-L192): 表示寸法
- [src/components/GlideSheet.tsx:251–314](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/GlideSheet.tsx#L251-L314): click selection clamp
- [src/components/GlideSheet.tsx:376–403](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/GlideSheet.tsx#L376-L403): nameboxとcontrolled selection
- [src/App.tsx:860–883](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L860-L883): namebox caller

**受入条件**

- 1×1でA100/Z1のclick/namebox/keyboard/編集対象が一致
- 上限超過は説明つき拒否、別番地へ黙って丸めない
- 遠方1cell編集で不要な巨大データ生成がないか検査
- filtered source行対応と空表/全行filterの既存回帰を維持
- A100/A100:B101/Z1への移動・範囲選択だけではrows/dirtyを変えない
- 実値のあるcellとvirtual emptyを分離し、100000×702の配列を事前実体化しない
- 名前boxとclickで同じ対象へ空入力/編集できるか合成と実GUIを別に検査

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-015 大きな番号を正しい順序で並べる

- 分類: sourceで確定した数値比較の精度不足
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：Number comparatorの合成結果。実データの発生頻度は不明。

**利用者・再現条件/合成入力**: 見出しなしで9007199254740993 / 9007199254740992を昇順。長いIDや精度が大事な値を扱う人。

**現在のcaller→処理→結果**: numeric判定後にNumber化して差を取り、両方が同じ値へ丸まると安定sortが入力順を維持。文字列の内容そのものは変更しない。

**期待/改善後**: sort方式を自動/文字列/数値から選べるようにし、精度を失う数値はexact比較または明示的文字列へ。先頭0、桁区切り、小数、日付、日本語の扱いを短く説明。

**反証・既存機能・限界**: 文字列型として保存する方針とsortのNumber一時変換は別。データ値の丸め保存と誤記しない。任意精度小数や日付localeの全面互換を約束しない。

**develop/PR差分**: sort.tsはdevelopから同じ比較方式。PRの自然sort改善済みと決めつけない。

**Excel/Sheets/標準の比較**: OFF-MS-12 / OFF-MS-13：textを維持する取込と自動型解釈の注意。OFF-GS-01：sort/headerの明示。どちらもPlainSheetのexact比較algorithmを規定しない。 OFF-MS-16：Excelの先頭0/長い数値の変換注意。PlainSheetのtext保存を維持する理由。

**採用メリット**: 長い識別子の順番を信用できる。

**採用デメリット・見送りの利点**: sort方式が増えると迷う。safe integerを超える場合の説明と合理的な既定が必要。

**推奨理由**: 値を変えず比較精度を守る。利用頻度が低ければ文字列sort選択を先行。

**導入時期**: 次段階：先行項目と設計を合わせて検討

**改修目安（未実測）**: M：3–5人日程度。

**依存**: UX-004のheader説明。

**決まるまでの暫定回避**: 大きなIDの数値sortを信用せず、元順を残して別のexact比較で確認する。

**before / after（source説明用。実画面ではない）**

- 現在: 9007199254740993 → 9007199254740992 → 昇順でも同じ順序
- 改善後: 比較方式: 正確な数値 → 9007199254740992 → 9007199254740993

**固定根拠**

- [src/lib/sort.ts:23–67](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/sort.ts#L23-L67): numeric判定とNumber比較
- [src/App.tsx:766–771](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L766-L771): sort caller

**受入条件**

- 2^53近辺の隣接整数が正しく並ぶ
- 先頭0/カンマ/負数/小数/空/日本語を列型方針別に検査
- sortでセル文字列は変わらずUndo可能

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

## B · 保存と変換を理解する

### UX-003 保存結果に対象ファイルを必ず添える

- 分類: 機能改善
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：通知stateのscope。見間違い頻度は未測定。

**利用者・再現条件/合成入力**: A.csvで保存を開始してB.csvへ移動。Aの保存失敗/取消がBの画面へ出たとき、どのファイルか知りたい。

**現在のcaller→処理→結果**: useFileのsaveNotice/savingは全体1つ。editionNoticeへ常時表示。成功文はファイル名入り、失敗/取消は対象を含まない。snapshotのデータとmetadata更新先は文書IDで保護済み。

**期待/改善後**: 通知をdocumentId/表示名/操作種別と結び付け、A.csvの保存失敗、と示す。必要なら対象タブへ戻る操作を付ける。

**反証・既存機能・限界**: 別タブの内容を誤保存する主張は否定。成功文には名前がある。global savingは並列保存を防ぐ意図があり、文書別表示を加えても同時書込を解禁する必要はない。

**develop/PR差分**: saveNoticeはPR側で追加された表示。developの保存完了問題そのものを再提案する項目ではない。

**Excel/Sheets/標準の比較**: OFF-MS-04 / OFF-MS-05 / OFF-GS-05：更新・コピー・downloadを区別。別タブ通知の正解UIまで競合資料が決めるものではない。

**採用メリット**: 失敗時に直すべき文書が分かる。

**採用デメリット・見送りの利点**: 通知履歴を増やすと邪魔になる。常時パネルより短い名前付き状態を優先。

**推奨理由**: 低い変更範囲で保存への信頼を上げる。成功/失敗/cancelを同じ対象モデルにする。

**導入時期**: 次段階：先行項目と設計を合わせて検討

**改修目安（未実測）**: S：1–2人日程度。

**依存**: UX-005の保存して閉じるの対象管理と共用。

**決まるまでの暫定回避**: 保存完了文のファイル名と対象タブの未保存印を照合する。

**before / after（source説明用。実画面ではない）**

- 現在: B.csv を表示中 → 保存に失敗しました → 対象は A? B?
- 改善後: B.csv を表示中 → A.csv: 保存に失敗 → A.csvへ戻る

**固定根拠**

- [src/hooks/useFile.ts:48–50](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/hooks/useFile.ts#L48-L50): 全体通知state
- [src/hooks/useFile.ts:107–191](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/hooks/useFile.ts#L107-L191): snapshotと完了通知
- [src/App.tsx:251–258](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L251-L258): 文書IDによるmeta更新
- [src/App.tsx:1015–1018](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L1015-L1018): 通知の表示先

**受入条件**

- A保存中にBへ移動しても通知名はA
- 失敗/取消/重複保存要求がどの対象か分かる
- 既存の文書ID snapshot保護とdirty保持を回帰させない

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-005 閉じる前に保存へ進める

- 分類: 機能改善
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：confirm経路。native実動作は未検収。

**利用者・再現条件/合成入力**: 未保存のA.csvを閉じる。複数タブやアプリ全体終了で、変更を残して終えたい。

**現在のcaller→処理→結果**: closeTabとapproveWindowCloseはdirty時confirmによる破棄/取消。未確定編集commit、保存中guard、全タブdirty確認、native close event経路はPRで追加済み。

**期待/改善後**: desktopは保存して閉じる/保存せず閉じる/戻るを対象文書名つきで選ぶ。Webはdownload開始後も保存完了を保証せず、利用者が残したことを確認して閉じる。

**反証・既存機能・限界**: 無確認破棄やnative close guardなしという旧問題は再提案しない。Webはブラウザ標準beforeunload文言を自由に変更できるとは限らない。

**develop/PR差分**: PRはnative/titlebar/全タブguardを改善済み。新提案は保存へ進む選択肢の追加のみ。

**Excel/Sheets/標準の比較**: OFF-MS-04 / OFF-MS-06 / OFF-MS-07 / OFF-GS-05：保存契約はlocal/AutoSave/downloadで違う。Excel/Sheetsが必ず保存確認を出すという主張はしない。

**採用メリット**: 戻って手動保存して再度閉じる往復が減る。

**採用デメリット・見送りの利点**: 非同期dialog/保存失敗/複数文書の制御が増える。Webの完了誤認を招かない文言が必要。

**推奨理由**: desktopの直接保存が成功した場合のみ自動close。Webは別の確認を維持。

**導入時期**: 次段階：先行項目と設計を合わせて検討

**改修目安（未実測）**: M–L：5–10人日程度。native OS確認を含む。

**依存**: UX-003の対象通知、保存結果return contract。

**決まるまでの暫定回避**: 取消で戻り、対象を保存またはdownload確認してから閉じる。

**before / after（source説明用。実画面ではない）**

- 現在: 変更があります → 破棄 / 戻る → 保存は一旦戻って実行
- 改善後: A.csv の変更 → 保存して閉じる → 破棄 / 戻る

**固定根拠**

- [src/App.tsx:270–325](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L270-L325): 保存requestとwindow close guard
- [src/App.tsx:361–375](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L361-L375): タブのconfirm
- [src/lib/saveState.ts:25–41](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/saveState.ts#L25-L41): downloadでdirtyを勝手に消さない

**受入条件**

- 保存取消/失敗で閉じず、元文書と編集を維持
- A/B双方dirtyの終了で全対象が明示される
- 保存中やIME中の繰返し終了で二重処理しない
- Web download開始だけでdirty解除/無条件closeしない

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-006 文字コードと読込結果を確かめて開く

- 分類: 機能改善（Web/desktopの読込契約差）
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：decode経路。任意の実ファイルが化けるとは断定しない。

**利用者・再現条件/合成入力**: 合成CP932バイトの日本語CSVをWebへ開く。日本語表を確認・修正する人が誤読を避けたい。

**現在のcaller→処理→結果**: Web File.text()/streamはUTF-8扱い、metaもutf-8。desktop RustはUTF-8、CP932/EUC-JP等の候補推測。encoding UIのWeb非UTF8はdisabledで、保存設定で読込済み文字列を復元できない。 Blob.textは先頭BOMを除き、Web metaはutf-8となるので元BOMの有無を保持しない。UTF-8 BOMを選んで書出す機能は既にある（SettingsModal:89–90 / useFile:141–143）。

**期待/改善後**: 読込previewでUTF-8/Shift_JIS等を明示選択。推定候補は確定扱いしない。unsupported形式/文字コード/parse失敗を分け、UTF-8へ変換またはdesktop利用という次の行動を表示。

**反証・既存機能・限界**: desktopにも曖昧推測があるため「desktopなら必ず正しい」は否定。UTF8データに置換文字が含まれるだけで誤判定しない。自動文字化け修復は採らない。 Webは元ファイルを直接上書きせずdownloadするためP1からP2へ変更。BOM出力の新設ではなく取込時の認識/保持を改善する。JSON/YAMLは出力をUTF-8に固定する。

**develop/PR差分**: WebとRustの差はdevelopから存在。PRの保存edition表示は改善済み、そこへ読込情報を追加する。

**Excel/Sheets/標準の比較**: OFF-MS-10 / OFF-MS-12：文字コード・区切り・型preview。OFF-MS-11でExcel WebにもText/CSV取込があるが、そのencoding UIは未確認。Sheetsのencoding指定を保証する一次資料は未取得。 OFF-W3C-05 / OFF-WHATWG-01：Blob.textのUTF8固定とBOM除去。

**採用メリット**: 文字化けしたまま内容を修正して保存するリスクを減らす。

**採用デメリット・見送りの利点**: 取込操作が一段増え、encoding選択が初心者には難しい。正常なUTF8は簡易previewで済ませる。

**推奨理由**: データを変える前に確認できる導線を優先。変換はユーザー選択後。

**導入時期**: 次段階：先行項目と設計を合わせて検討

**改修目安（未実測）**: M–L：5–10人日程度。

**依存**: 取込preview共通枠をUX-009/010にも利用。

**決まるまでの暫定回避**: 合成previewや信頼できる変換でUTF-8化してから開く。BOM付き出力は既存設定で選ぶ。

**before / after（source説明用。実画面ではない）**

- 現在: CP932の合成CSV → Web: UTF-8として開く → 結果確認の入口がない
- 改善後: 取込preview → 文字コード: Shift_JIS → 読めることを確認 → 開く

**固定根拠**

- [src/hooks/useFile.ts:363–410](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/hooks/useFile.ts#L363-L410): Web読込経路
- [src/lib/csv.ts:306–323](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/csv.ts#L306-L323): streamFileTextのUTF-8 decoder
- [src-tauri/src/main.rs:65–121](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src-tauri/src/main.rs#L65-L121): desktop推測
- [src/components/SettingsModal.tsx:82–100](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/SettingsModal.tsx#L82-L100): Web保存文字コード選択
- [File API / Blob.text](https://w3c.github.io/FileAPI/#dom-blob-text): 常にUTF-8でdecodeする標準契約
- [Issue #2 手元の合成実行記録](https://github.com/ishizakahiroshi/PlainSheet/issues/2#issuecomment-6110347439): 既存runtimeによる実parser/serializer/Blob呼出し、GUIではない

**受入条件**

- UTF8/BOM/合成CP932/EUC-JPと改行をfixture化
- 指定を変えると元bytesから再decodeし二重変換しない
- cancel時は既存文書を変更しない
- encodingを一意判定できない場合は確度と選択肢を示す
- BOM付き入力の検出/保持方針を示し、既存BOM書出し選択を尊重する

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-009 JSON/YAMLの上書き前に変換内容を示す

- 分類: 機能改善（意図した文字列セル設計）
- 優先度: P1。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：parse/serializeとREADME。新しいparser bugではない。

**利用者・再現条件/合成入力**: [{"qty":7,"active":true,"note":null,"tags":["x"]}]を開き、値の一部を修正して同名保存。元の型を使う連携先がある人。

**現在のcaller→処理→結果**: parseObjectListはnullを空、object/arrayをJSON文字列、他をString化。rowsToObjectsはstringを出力。READMEに型変換の説明は既にある。missing/空キーのomit設定にも意味の差がある。

**期待/改善後**: 開く時に「文字列表として扱う」を示し、直接上書き前に数値→文字列等の差をpreview。既定の安全な選択は別名へ書出す。型保持編集はmetadataと型変更仕様が必要な別案件として保留。

**反証・既存機能・限界**: データを黙って捨てる新規実装と誤分類しない。すべてstringのJSONなら型変換差は小さい。意図して文字列正規化したい用途もある。

**develop/PR差分**: formatsの基本設計とREADME説明はdevelopから存在。新規parser bugではない。

**Excel/Sheets/標準の比較**: OFF-MS-12 / OFF-MS-13：自動型変換の制御、text export制約の説明という先例。Excel/SheetsがこのJSON roundtripを保証するという意味ではない。

**採用メリット**: 後段が数値/boolean/arrayを期待するファイルを意図せず変える前に選べる。

**採用デメリット・見送りの利点**: previewとschema保持にはコストがある。毎回の警告は慣れて無視されるので文書の変換内容に応じて出す。

**推奨理由**: 型保持を安易に追加せず、現行の文字列編集価値を明確化。最初の上書きと形式変更時に予告を優先。

**導入時期**: 先行：次の編集品質改善で検討

**改修目安（未実測）**: M：3–5人日程度。完全型保持はL以上の別見積り。

**依存**: UX-006のimport preview、UX-010の変換予告。

**決まるまでの暫定回避**: 元ファイルを残して別名書出しし、型差を確認してから連携先で使う。

**before / after（source説明用。実画面ではない）**

- 現在: qty: 7 / active: true → 文字列表へ変換 → 上書き: "7" / "true"
- 改善後: 変更内容をpreview → 数値 → 文字列を表示 → 別名書出し / 上書き / 戻る

**固定根拠**

- [src/lib/formats.ts:47–114](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/formats.ts#L47-L114): 型からセルと文字列objectへ
- [src/hooks/useFile.ts:161–179](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/hooks/useFile.ts#L161-L179): serialize→直接write
- [README.md:60–65](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/README.md#L60-L65): 既存の変換説明
- [Issue #2 手元の合成実行記録](https://github.com/ishizakahiroshi/PlainSheet/issues/2#issuecomment-6110347439): 既存runtimeによる実parser/serializer/Blob呼出し、GUIではない

**受入条件**

- 数値/true/null/array/missing/空文字の変換前後が分かる
- 取消で書込しない、別名保存を選べる
- 型保持を実装する場合も編集値の型を無言推定しない
- JSON/YAMLのheader-only/重複列名等の既存回帰検査を保持

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-010 Markdownは表だけを保存すると伝える

- 分類: 機能改善（table-only設計の境界）
- 優先度: P1。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：抽出/保存範囲。実ファイル損失の実観察なし。

**利用者・再現条件/合成入力**: Intro

| A | B |
| :--- | ---: |
| x | y |

Footerを開いてdesktopで同名保存。文書中の表だけ直したい人。

**現在のcaller→処理→結果**: parseMarkdownTableは最初のpipe表を抽出。serializerは表だけ、区切りは---で再出力。前後本文/整列指定/後続表は保持するモデルにない。

**期待/改善後**: 本文を含む.mdを検出したら「表のみを書出す」を表示し別名保存を優先。同名上書きには範囲差を明示。文書中の表だけ置換する高機能版は別の設計判断とする。

**反証・既存機能・限界**: Markdown文書エディタではなくtable editorという現行設計は合理的。セル空白保持のREADME旧説明はPRsourceとずれがあるため本件根拠に使わない。

**develop/PR差分**: 該当formats処理はdevelopから存在。PRの個別Markdown escape/空白回帰とは別。

**Excel/Sheets/標準の比較**: OFF-MS-13：text exportが保持できない範囲を説明する先例。Microsoft/Googleに同じMarkdown編集仕様があるとは主張しない。

**採用メリット**: 表外の文章を保持したい利用者が上書き前に気づける。

**採用デメリット・見送りの利点**: 本文diff表示と複数表判定に検査が必要。document全体構文保持へ広げるとPlainSheetの小ささを損なう。

**推奨理由**: table-onlyのまま説明と別名保存で保護。文書全体編集は今回見送り。

**導入時期**: 先行：次の編集品質改善で検討

**改修目安（未実測）**: M：3–5人日程度。文書内置換は別L。

**依存**: UX-009と変換差previewを共用。

**決まるまでの暫定回避**: 本文を含む.mdは同名保存せず表だけ別名へ書出す。

**before / after（source説明用。実画面ではない）**

- 現在: Intro + 表 + Footer → 表だけを編集 → 同名保存 → 表だけ
- 改善後: 表のみを書出します → 本文・整列は含みません → 別名保存 / 戻る

**固定根拠**

- [src/lib/formats.ts:136–175](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/formats.ts#L136-L175): 表抽出と表のみserialize
- [src/hooks/useFile.ts:168–179](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/hooks/useFile.ts#L168-L179): 表文字列のwrite
- [Issue #2 手元の合成実行記録](https://github.com/ishizakahiroshi/PlainSheet/issues/2#issuecomment-6110347439): 既存runtimeによる実parser/serializer/Blob呼出し、GUIではない

**受入条件**

- 前後本文/複数表/alignmentの合成fixtureで出力範囲を明示
- 純粋な表だけの場合は不必要な警告を減らす
- 同名上書きと別名書出しで対象・影響が分かる
- cancel時は元ファイルに書かない

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-012 保存地点へ戻ったことを区別する

- 分類: 機能改善（保守的なdirty判定）
- 優先度: P3。保留推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：Undo常dirty。改善の重要度は低め。

**利用者・再現条件/合成入力**: desktopでAを直接保存→Bへ編集→UndoしてAへ戻る。未保存印が残り追加保存/終了警告が出る。

**現在のcaller→処理→結果**: replaceRowsFromHistoryは必ずdirty:true。保存時の内容・metadataと一致したかをUndo復帰で比較するcheckpointはない。

**期待/改善後**: 直接保存成功時の内容/保存設定をcheckpointとして持ち、Undo/Redoで戻った時に表示を更新。Webはdownload開始と実保存済みを別状態にする。

**反証・既存機能・限界**: 現状は保存忘れを防ぐ安全側。データ消失や保存内容不一致ではない。行だけ同じでもencoding/newline/formatが違えばcleanにしない。

**develop/PR差分**: developにも履歴復帰のdirty true。PRの正しい非同期保存完了チェックを置き換えない。

**Excel/Sheets/標準の比較**: OFF-MS-04 / OFF-MS-05 / OFF-GS-05：永続化とexportの区別。競合が特定のhistory checkpoint方式を使う証拠ではない。

**採用メリット**: 本当に残る変更があるかが分かり、不要な保存確認を減らせる。

**採用デメリット・見送りの利点**: 大きい表の比較負荷、履歴切り捨て、保存中編集の設計が増える。

**推奨理由**: 他のP1/P2を先にし、必要性があれば追加。

**導入時期**: 先行項目の後、需要確認して判断

**改修目安（未実測）**: M：3–5人日程度。性能実測は未実施。

**依存**: 保存snapshot/serializer設定の比較契約。

**決まるまでの暫定回避**: 未保存警告を安全側として扱い、必要なら再保存する。

**before / after（source説明用。実画面ではない）**

- 現在: 保存 A → 編集 B → Undo → A → 未保存の印が残る
- 改善後: 保存 A → 編集 B → Undo → A → 直接保存地点へ戻った

**固定根拠**

- [src/App.tsx:457–465](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L457-L465): 履歴復帰dirty true
- [src/App.tsx:774–799](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L774-L799): undo/redo caller
- [src/lib/saveState.ts:16–41](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/saveState.ts#L16-L41): 直接保存とdownloadの違い

**受入条件**

- 直接保存→編集→Undoでrowsと全保存設定一致時のみclean
- 保存中の新編集とUndo/Redoを混同しない
- download開始だけをdurable checkpointにしない

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

## C · 探す・直すを迷わず行う

### UX-002 検索を呼ぶたび入力欄へ戻す

- 分類: component合成再現＋sourceの診断（統合操作は未確認）
- 優先度: P2。保留推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：手元の実SearchPanel/合成DOMでopen=true再描画はfocusを戻さない。実canvasキー伝播は未確認。

**利用者・再現条件/合成入力**: 検索を開く→gridをクリック→Ctrl/Cmd+FまたはH→文字を入力。既に開いている検索にすぐ戻りたい。

**現在のcaller→処理→結果**: AppはsetSearchOpen(true)だけ、SearchPanelのfocus/select effectは[open]だけ。同じtrueではeffectが再発火しない。実際にセルへ文字が入るかは未観察。 手元の未変更SearchPanelを既存jsdom/Reactでmountした報告では、初回openで検索欄→他buttonへfocus→同じtrue再描画で他buttonのまま→false/trueで検索欄へ戻ることを再現。

**期待/改善後**: openとは別のfocus要求を渡し、呼出しのたび検索欄へfocus。Hで置換欄を直接狙うかは一貫した仕様を決める。

**反証・既存機能・限界**: 初回open時のfocusは既に実装済み。Glideが伝播を止める可能性、OS/browser shortcutの競合は未確認。存在する初回focusを「なし」と再提案しない。 2026-10-11 UTC / 10-12 JSTの手元component実測で単なるsource推論から更新。製品を起動した証拠ではない。

**develop/PR差分**: developにも同種open制御がある。PRの初回focus追加と残る繰返し経路を分ける。

**Excel/Sheets/標準の比較**: OFF-MS-03 / OFF-GS-02：検索shortcutは確認。繰返し呼出しのfocus仕様は公式資料で確立していない。

**採用メリット**: 検索への復帰時に入力先を探し直さずに済む。

**採用デメリット・見送りの利点**: 編集中のセルを確定/維持/取消のどれにするかを決めずfocusだけ変えると入力が失われうる。

**推奨理由**: 実画面で再現確認してから採用。モデルレス検索へmodalのfocus trapを持ち込まない。

**導入時期**: 採用前に実機確認

**改修目安（未実測）**: S：1–2人日程度。IME/OS確認は別枠。

**依存**: 実画面での再focus再現が採用条件。

**決まるまでの暫定回避**: 検索を閉じて開き直す、または検索欄を直接選ぶ。

**before / after（source説明用。実画面ではない）**

- 現在: 検索を開く → gridへ戻る → Ctrl+F: focusは？
- 改善後: 検索を開く → gridへ戻る → Ctrl+F → 検索入力

**固定根拠**

- [src/App.tsx:894–912](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L894-L912): shortcut入口
- [src/components/SearchPanel.tsx:48–61](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/SearchPanel.tsx#L48-L61): focus effect

**受入条件**

- 開閉前後と既に開いた状態のCtrl/Cmd+F/Hで狙った入力欄へ移る
- セル未確定編集とIME変換を失わない
- Escで閉じた後のfocus先が明確

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-007 正規表現の置換ルールを明示する

- 分類: 機能改善（競合との機能差）
- 優先度: P3。保留推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：$1がliteralになる実装。仕様違反とする根拠はない。

**利用者・再現条件/合成入力**: cell=AB-12、検索=([A-Z]+)-(\d+)、置換=$2/$1。Sheetsの操作に慣れた人が同じ結果を期待する。

**現在のcaller→処理→結果**: replaceCurrent/Allのcallbackは入力文字列そのものを返す。結果は$2/$1。regexの検索patternはJavaScriptで、SheetsのRE2と完全互換ではない。

**期待/改善後**: 既定は文字列をそのまま置換することを明示。必要なら「グループ参照を使う」を追加し結果previewを出す。改行や$記号のescapeも説明。

**反証・既存機能・限界**: literal置換は普通の$文字列を壊さない利点がある。キャプチャ展開を無言で有効にすると既存ユーザーの期待を変える。

**develop/PR差分**: callback置換はPRにも残る。競合差であり既存PR不具合修正の未完了とはしない。

**Excel/Sheets/標準の比較**: OFF-GS-03：Sheets Find/Replaceの$1/$2例。OFF-GOOGLE-RE2-01：patternのbackreference禁止とreplacement参照は別。OFF-MS-03の通常検索をregex仕様として引かない。

**採用メリット**: 他の表ツールから来た人が置換結果を予測できる。

**採用デメリット・見送りの利点**: engine差とescapeの学習が増える。すべてのregex機能を複製する負担は大きい。

**推奨理由**: まず説明を追加。参照展開は利用頻度を見て保留。

**導入時期**: 先行項目の後、需要確認して判断

**改修目安（未実測）**: S：説明1人日程度、明示展開+previewはM。

**依存**: UX-011の正規表現エラー、将来の範囲preview。

**決まるまでの暫定回避**: $1の展開を期待せずliteral置換を使い、結果を確認してUndoする。

**before / after（source説明用。実画面ではない）**

- 現在: AB-12 → 検索: 2つのグループ → 置換 $2/$1 → $2/$1
- 改善後: 置換方式を表示 → 参照を使う（任意） → preview: 12/AB

**固定根拠**

- [src/App.tsx:813–857](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L813-L857): 単独/全置換のcallback
- [src/components/SearchPanel.tsx:98–120](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/SearchPanel.tsx#L98-L120): 置換入力とregex選択

**受入条件**

- literalモードで$1と改行文字列をそのまま入れられる
- 参照モードを追加するなら$1/$2/存在しない群/$$を定義
- 全置換previewとUndoが同じ置換規則を使う

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-011 検索エラーと一致なしを分ける

- 分類: sourceで確定した診断不足
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：invalid/too-longが0件へ合流。画面実観察はなし。

**利用者・再現条件/合成入力**: 正規表現ONで[を検索、またはASCII 2001文字のqueryを入れる。ゼロ件なのか入力が間違っているのか判断したい。

**現在のcaller→処理→結果**: buildMatcherは不正regex/長過ぎるqueryをnull、collectSearchMatchesは0件。SearchPanelはnoMatchesのみで入力errorを受け取るpropがない。 上限はJavaScript length（UTF-16 code units）であり全言語の2000文字と同一ではない。

**期待/改善後**: 空query / 正常0件 / invalid regex / 長さ上限を分け、入力直下へ修正可能なエラーと上限を出す。入力は消さない。

**反証・既存機能・限界**: 無効なregexで置換処理を止めるguard自体は安全で維持する。検索navigation上限5000と実総件数はPRで改善済み。上限なしへ変える提案ではない。

**develop/PR差分**: buildMatcherのnull経路はdevelopにも存在、PR総数改善では解消しない。

**Excel/Sheets/標準の比較**: OFF-MS-03 / OFF-GS-03：検索条件と結果の区別。OFF-W3C-03/04：keyboardで修正可能な入力とfocus。競合の具体的エラー文を捏造しない。

**採用メリット**: 検索条件を直すべきときにデータがないと誤解しない。

**採用デメリット・見送りの利点**: 即時validateで入力途中のエラーがうるさくなる。短い遅延や確定時通知が必要。

**推奨理由**: 小さな修正で明確な診断差を作れるため先行候補。

**導入時期**: 次段階：先行項目と設計を合わせて検討

**改修目安（未実測）**: S：1–2人日程度。

**依存**: UX-007のregex説明。

**決まるまでの暫定回避**: regexを一旦OFFにして入力を確認し、短いpatternへ切り分ける。

**before / after（source説明用。実画面ではない）**

- 現在: 検索: [  regex ON → 一致なし → 原因が分からない
- 改善後: 検索: [  regex ON → 正規表現が不完全です → ] を確認 / 入力を修正

**固定根拠**

- [src/App.tsx:1308–1324](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L1308-L1324): matcherのnull
- [src/lib/search.ts:7–24](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/search.ts#L7-L24): nullを0件へ
- [src/components/SearchPanel.tsx:122–127](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/SearchPanel.tsx#L122-L127): noMatches表示

**受入条件**

- [はregexエラー、literalモードでは通常検索
- 空queryは未入力、正常不一致は0件
- 2000/2001文字境界を説明し入力を保持
- 修正後はerrorが消え、replace disabled状態と通知が一致

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

## D · 作業の状態を見失わない

### UX-001 タブを戻ったときに絞込みを保つ

- 分類: 機能改善（現行の状態消去はsource確定）
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：filterの経路。scrollの実挙動は未確認。

**利用者・再現条件/合成入力**: A.csvの「東」だけを表示し、B.csvへ移動してAへ戻る。複数ファイルを突き合わせる人が条件を作り直す。

**現在のcaller→処理→結果**: TabBar→switchTab→applyDocumentでfilter.clearAll。snapshotはrows/meta/colWidths/selection/range/historyを持つがfilterを持たない。

**期待/改善後**: 文書ごとのfilterをsession内で復元し、条件と表示行数を常時示す。scroll/列固定の記憶は同じ容器へ後から足せる。CSV本体へview情報は書かない。

**反証・既存機能・限界**: 列幅・選択・履歴は既に保持される。「タブで全部失う」は撤回。globalのheader/zoom/freezeは別設定であり、scroll復帰も未観察。

**develop/PR差分**: developにもapplyDocumentでclearAllがある。PRによる解消済み項目ではない。

**Excel/Sheets/標準の比較**: OFF-MS-01 / OFF-MS-02 / OFF-GS-01：明示的な保存viewの先例。競合がタブ移動で全状態を自動復元する証拠ではない。

**採用メリット**: 比較作業を中断しても同じ対象へ戻れる。

**採用デメリット・見送りの利点**: 古いfilterで行が隠れたままになりうる。解除と件数を常に見せる必要がある。

**推奨理由**: まずfilterだけを文書単位に保持する。常時の新しい確認dialogは増やさない。

**導入時期**: 次段階：先行項目と設計を合わせて検討

**改修目安（未実測）**: M：3–5人日程度の概算。scroll復帰を含めると追加。

**依存**: UX-004のheaderを文書単位にする設計と合わせる。

**決まるまでの暫定回避**: タブを戻ったら条件と表示件数を確認し、必要なfilterを再指定する。

**before / after（source説明用。実画面ではない）**

- 現在: A.csv  条件: 東 → B.csv を開く → A.csv  条件なし
- 改善後: A.csv  条件: 東 → B.csv を開く → A.csv  条件: 東（復元）

**固定根拠**

- [src/App.tsx:184–207](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L184-L207): live取得とfilter消去
- [src/App.tsx:350–358](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L350-L358): タブ移動caller
- [src/hooks/useDocuments.ts:16–33](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/hooks/useDocuments.ts#L16-L33): 文書状態の型

**受入条件**

- A→B→Aで列別複数条件と件数が復元される
- filter解除はその文書だけ、データ/dirty/CSV出力は変わらない
- 閉じた文書の条件を別文書へ再利用しない

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-004 先頭行の意味をファイルごとに選ぶ

- 分類: 機能改善
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：既定値とsort/filter経路。発見性の実画面評価は未実施。

**利用者・再現条件/合成入力**: 見出しのない1列表3 / 1 / 2を開いて昇順。初めて使う人が先頭3も並べたい。

**現在のcaller→処理→結果**: global useHeaderRowの既定trueでsortは先頭を除外しfilterは保持する。Settingsで解除できる。headerHighlightは見た目、freezeColumnsは列の固定で、別の意味。

**期待/改善後**: 初回取込またはsort時に「先頭行は見出し」を短いpreviewで確認し文書単位に記憶。常時状態表示から変更可能。行固定は別の任意機能として分ける。

**反証・既存機能・限界**: header機能がないという指摘は誤り。自動推定だけで決める案は採らない。JSON/YAMLの列名はserializer上の見出しで、CSVの見出しなし設定を無条件に当てない。

**develop/PR差分**: default trueはdevelopにも存在。PRはSettingsからの切替を追加済み、その再実装は不要。

**Excel/Sheets/標準の比較**: OFF-MS-08 / OFF-GS-01：header有無の明示選択。OFF-MS-09 / OFF-GS-06：freezeは両軸の表示機能でheader判定とは別。

**採用メリット**: 先頭のデータを並替え忘れる意外性を減らす。

**採用デメリット・見送りの利点**: 毎ファイルの質問は煩雑。既存の選択を記憶し、曖昧な場合のみpreviewを示す。

**推奨理由**: filter/並替え前の説明とファイル単位の記憶を先行。行固定追加は保留。

**導入時期**: 次段階：先行項目と設計を合わせて検討

**改修目安（未実測）**: M：3–5人日程度。

**依存**: UX-001とview state scopeを共通化。

**決まるまでの暫定回避**: 並替え前に設定の先頭行見出しON/OFFを確認する。

**before / after（source説明用。実画面ではない）**

- 現在: 見出しなし 3 / 1 / 2 → 昇順 → 3 / 1 / 2
- 改善後: 先頭行: データ → 昇順 → 1 / 2 / 3

**固定根拠**

- [src/lib/settings.ts:5–24](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/settings.ts#L5-L24): global設定とdefault true
- [src/App.tsx:766–771](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L766-L771): sortがheaderを参照
- [src/App.tsx:960–963](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L960-L963): filter候補の先頭除外
- [src/components/SettingsModal.tsx:159–171](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/SettingsModal.tsx#L159-L171): 既存解除UI

**受入条件**

- headerなし3/1/2の昇順が1/2/3
- headerあり「数量」/3/1は見出しを維持
- Aのheader変更でBを変えず、再openの扱いを明示
- 行固定・列固定・見出しハイライトを混同しない

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-016 絞込み後も元の行番号を分かるようにする

- 分類: 機能改善（表示参照の整合）
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 中〜高：固定依存のrow marker契約。canvas表示は未観察。

**利用者・再現条件/合成入力**: 元表の行1/2/4だけがfilter後に表示。行の位置を他人へ伝えたり名前boxで戻りたい。

**現在のcaller→処理→結果**: Appはsource rowへmapping済み。Glide rowMarkersは連番1/2/3で、名前boxは元番地A1/A2/A4を使う。依存側はvisible ordinalをmarkerへ出す。

**期待/改善後**: row headerを元行番号1/2/4へ対応させる、または「表示3行目 / 元4行」を明示。filter中の件数と解除は既存UIを活かす。

**反証・既存機能・限界**: データmappingはPRで修正済みでありwrong-row書込bugとは別。表示順の番号を意図する設計もあり、元番地との違いが分かればよい。

**develop/PR差分**: rowMarkersのordinal表示はdevelopから。PRのsource mapping修正の再提案ではない。

**Excel/Sheets/標準の比較**: OFF-GS-07 / OFF-W3C-02：cell住所とfiltered範囲のorientation。競合資料から内部marker実装を推測しない。

**採用メリット**: 絞込後の行を元ファイルのどこか説明しやすい。

**採用デメリット・見送りの利点**: 飛び番が初心者には欠落に見える。filter状態を併記する。

**推奨理由**: 正しいdata mappingを保ち、表示と読み上げの参照を揃える小さな提案。

**導入時期**: 次段階：先行項目と設計を合わせて検討

**改修目安（未実測）**: S–M：2–3人日程度。

**依存**: UX-014のtarget consistencyとは別根因だが受入を共有。

**決まるまでの暫定回避**: 絞込中は名前boxの元番地を用い、必要ならfilter解除して対象行を確認する。

**before / after（source説明用。実画面ではない）**

- 現在: 表示行: 1 / 2 / 3 → 名前box: A4 → 元表の何行目？
- 改善後: 元行: 1 / 2 / 4 → 名前box: A4 → 絞込み中 3行表示

**固定根拠**

- [src/App.tsx:380–409](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L380-L409): visible/source mapping
- [src/components/GlideSheet.tsx:151–176](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/GlideSheet.tsx#L151-L176): source行変換
- [src/components/GlideSheet.tsx:698–735](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/GlideSheet.tsx#L698-L735): rowMarkers=bothとselection入口
- [Glide6.0.3 data-editor.tsx:1268–1277](https://github.com/glideapps/glide-data-grid/blob/2abe757e65cc7c38ab4f9464c229db27be4c1a8e/packages/core/src/data-editor/data-editor.tsx#L1268-L1277): visible indexから行番号を構成

**受入条件**

- 1/2/4の表示で元行4を示す番地が一貫
- copy/clear/paste/searchが元行へ正しく作用する既存動作を維持
- filter解除後に参照番号が自然に戻る
- 読み上げが表示位置と元番地の意味を伝える

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

## E · 任意の拡張と見送り案

### UX-017 選んだ範囲だけを確認して整形する

- 分類: 機能改善（任意の新機能）
- 優先度: P3。保留推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 中：sourceに専用整形UIなし。利用頻度は未調査。

**利用者・再現条件/合成入力**: 列分割、重複削除、空白除去をしたいが、IDの先頭0や意味のある空白は残したい。

**現在のcaller→処理→結果**: 固定sourceには基本編集/検索置換/単列sort/filterがある。専用の整形previewは見当たらない。なくても表エディタの欠陥とはしない。

**期待/改善後**: 選択範囲と対象列を指定し、変更前後と件数をpreviewして一括適用/1回Undo。全cell textを維持し、全角/半角空白、大小文字、header、hidden行の扱いを明示。

**反証・既存機能・限界**: 単純置換で足りる用途もある。空白trimや重複削除をopen時に自動実行しない。Sheetsの機能を全部再現する提案ではない。

**develop/PR差分**: develop/PR双方で専用入口の追加案。バグ数へ計上しない。

**Excel/Sheets/標準の比較**: OFF-GS-08：選択範囲の列分割/重複削除/空白trim。diff previewと単一Undoの仕様はPlainSheetへの独自提案。OFF-MS-16は全text保持の価値を補強。 優先度は未調査需要を尊重しP3とする。

**採用メリット**: 手作業の繰返しを減らし、何が変わるか見てから適用できる。

**採用デメリット・見送りの利点**: 操作を増やすと誤削除を招く。対象範囲・header・hidden行の選択が増える。

**推奨理由**: UX-008/013/014と保存説明を優先後、頻度の高い整形を1つだけ試す。

**導入時期**: 先行項目の後、需要確認して判断

**改修目安（未実測）**: L：1–2週間程度。範囲/preview/Undo込みの概算。

**依存**: UX-008のformat preview、既存exact selection/visible mapping。

**決まるまでの暫定回避**: 既存検索置換と手動編集を、小さい選択範囲・Undo確認で行う。

**before / after（source説明用。実画面ではない）**

- 現在: 選択表を手で修正 → 区切り・重複・空白 → 何が変わるか不明
- 改善後: 範囲を選択 → preview → 変更 3件 / 対象外は維持 → 適用 / 戻る · 1回Undo

**固定根拠**

- [src/components/Toolbar.tsx:23–43](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/Toolbar.tsx#L23-L43): 現行操作のprops
- [src/App.tsx:835–858](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L835-L858): 既存一括置換とUndoの入口
- [src/lib/gridOperations.ts:58–87](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/gridOperations.ts#L58-L87): visible対象の一括更新を参考にできる

**受入条件**

- 対象範囲外とhidden行の扱いがpreviewと結果で一致
- 00123/16桁超/全角空白/空cellを勝手に型変換しない
- cancelは変更ゼロ、applyはまとめて1Undo
- 重複判定に使う列・大小文字・headerを明示

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-018 入力ルールを任意で確かめる

- 分類: 機能改善（CSV外metadataを伴う新機能）
- 優先度: P3。保留推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 中：sourceに専用validation機能なし。必要な業務は未調査。

**利用者・再現条件/合成入力**: 同じ列へ決まった区分を入力する、必須空欄やID形式の間違いだけ見つけたい。

**現在のcaller→処理→結果**: すべてセル文字列として編集できる。候補dropdownや必須/形式ルールの永続化はsourceに見当たらない。自由入力は強みでもある。

**期待/改善後**: ルールは警告のみを既定にし、拒否は利用者が選ぶ。まずsession内、必要なら端末localまたは明示sidecarへ保存。保存場所・対象ファイル・削除/解除導線を示し、CSVへ埋め込まない。

**反証・既存機能・限界**: 入力拒否は貼付/既存データの修正を妨げる。欠陥修正ではなく選べる支援。共有CSVだけ渡してもルールは相手へ移らないことを説明する。

**develop/PR差分**: 両sourceにない任意機能。未搭載を不具合と数えない。

**Excel/Sheets/標準の比較**: OFF-GS-09：Sheets dropdownの範囲・拒否/警告の選択。CSV外のsession/local/sidecar保存はSheets仕様の模倣ではなく独自の制約対応。

**採用メリット**: 表の決まりを覚えていなくても違いに気づける。

**採用デメリット・見送りの利点**: ルール管理とCSV以外の追加ファイルが増える。古いルールによる誤警告や情報共有のずれが起こる。

**推奨理由**: まず警告だけのsession試作を保留候補にし、永続化は保存先・削除方法を決めてから。

**導入時期**: 先行項目の後、需要確認して判断

**改修目安（未実測）**: L：1–2週間以上。永続化/互換は別見積り。

**依存**: UX-017の範囲preview、UX-001のview metadata保存方針。

**決まるまでの暫定回避**: ルールは別の説明として持ち、入力後に一覧を確認する。

**before / after（source説明用。実画面ではない）**

- 現在: 自由に文字列入力 → 表の決まりは別に覚える → CSVにルールはない
- 改善後: 区分: 候補から選択（任意） → 違反は警告 / 拒否を選ぶ → ルール保存場所と解除を表示

**固定根拠**

- [src/types/sheet.ts:1–35](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/types/sheet.ts#L1-L35): セル/保存metaの現行契約
- [src/components/CellTextEditor.tsx:12–97](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/CellTextEditor.tsx#L12-L97): 自由text編集
- [src/lib/settings.ts:5–14](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/settings.ts#L5-L14): global設定scope

**受入条件**

- 警告/拒否が明示され警告中も文字列値を失わない
- bulk pasteの対象・エラー一覧・Undoが一貫
- session終了/local消去/sidecar削除で何が残るか説明
- CSV単体へルールを埋め込まず共有時に欠落を明示

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-019 セルの数式を計算する

- 分類: 拡張案・今回見送り推奨
- 優先度: P3。見送り推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：現在はtext editor、実装工数は大きく不確実。

**利用者・再現条件/合成入力**: Excel式の計算を期待する初見ユーザーに、=SUM(...)の扱いを説明したい。

**現在のcaller→処理→結果**: セルはstringでGlide Textとして表示し、編集は文字列更新。統計表示はあるがセル数式評価ではない。UIラベルも「セル内容」。式のような文字はtextとして保存する。

**期待/改善後**: 任意の計算モードを設け、式と計算結果を別に扱う。計算互換、循環参照、CSVへ式か値のどちらを残すかを明示する。本案は今回見送り推奨。

**反証・既存機能・限界**: formulaというcomponent名だけで評価機能を推測しない。集計のSUM表示は数式エンジンではない。式をliteralで運ぶ用途とlocal textの価値を壊さない。

**develop/PR差分**: 両sourceのtext設計の評価。機能不足bugとして数えない。

**Excel/Sheets/標準の比較**: OFF-MS-13：CSVでは豊かな情報の保持に制約。OFF-GS-04は関数の個別仕様例で、互換エンジンの必要性を示すものではない。

**採用メリット**: 表の中で集計や計算を行い、値の変更に合わせて結果を更新できる。

**採用デメリット・見送りの利点**: 互換性・再計算・式と値の保存ルールが増える。文字列をそのまま運ぶ軽さを損ない、CSVでは全状態を保持できない。

**推奨理由**: 今回見送り。説明改善だけは学習支援として実施候補。

**導入時期**: 将来の別案件。今回は追加しない

**改修目安（未実測）**: 説明はS。本格engineはXL・別案件見積り。

**依存**: 仕様判断と別保存形式を要する。

**決まるまでの暫定回避**: 計算が必要なときは対応する表計算ツールで行い、text出力を確認して戻す。

**before / after（source説明用。実画面ではない）**

- 現在: セル内容: =1+2 → 文字列として扱う → 統計と数式は別
- 改善後: 数式: =1+2 / 結果: 3 → 式と値を分けて扱う → 保存方式の追加判断が必要

**固定根拠**

- [src/types/sheet.ts:1–6](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/types/sheet.ts#L1-L6): CellValue string
- [src/components/GlideSheet.tsx:206–242](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/GlideSheet.tsx#L206-L242): Text cellの提供
- [src/components/FormulaBar.tsx:59–68](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/FormulaBar.tsx#L59-L68): セル内容のUI
- [src/lib/i18n.ts:66–73](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/i18n.ts#L66-L73): formulaInputはセル内容

**受入条件**

- =1+2を入力してtextのままであることを初見説明で分かる
- export先Excelで評価される可能性と既存guard選択を説明
- 将来拡張でも式/値/型の保存契約を事前に決める

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-020 複数人で同時編集する

- 分類: 拡張案・今回見送り推奨
- 優先度: P3。見送り推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 中：local-first契約と設計代償の評価。需要は未調査。

**利用者・再現条件/合成入力**: 複数人で同じ表を同時編集したい、コメントや履歴も共有したいという将来用途。

**現在のcaller→処理→結果**: ローカルで開いてtext保存し、サーバへ内容を送らない方針。複数人同時同期の専用経路は今回調査対象sourceにない。

**期待/改善後**: 共有を明示的に始めた別モードで、参加者・権限・同期状態を示し、競合とoffline復帰を管理する。コメントや履歴をCSV外に保存する必要がある。本案は今回見送り推奨。

**反証・既存機能・限界**: 不在をbugとしない。ローカルファイルを外部サービスで共有することとリアルタイム共同編集は別。現行があらゆるネットワーク通信をしないという監査保証はしていない。

**develop/PR差分**: 両sourceの主目的と異なる新機能。今回の不具合件数へ含めない。

**Excel/Sheets/標準の比較**: OFF-GS-05 / OFF-MS-06：クラウド保存・同期の異なる契約。PlainSheetへ同じ基盤を持ち込む義務はない。

**採用メリット**: 複数人が同じ表を見ながら編集し、ファイルの受渡しや変更の突合せを減らせる。

**採用デメリット・見送りの利点**: アカウント・共有権限・サーバ・同期・保存期間の管理が必要。内容が端末外へ出る契約となり、現在のlocal優先の単純さを失う。

**推奨理由**: 今回見送り。現在の入力/保存の信頼を先にする。

**導入時期**: 将来の別案件。今回は追加しない

**改修目安（未実測）**: XL：別案件の要件/運用/費用見積りが必要。

**依存**: 新しい共有・認証・保存契約が必要。

**決まるまでの暫定回避**: ファイルを別名でやり取りし、同時上書きを避ける運用を選ぶ。

**before / after（source説明用。実画面ではない）**

- 現在: CSVを端末内で編集 → 保存してファイルを渡す → 常時同期はしない
- 改善後: 共有モード（任意） → 参加者・権限・同期を表示 → 内容が端末外へ出る契約

**固定根拠**

- [README.md:3–8](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/README.md#L3-L8): local-firstの価値
- [src/components/EmptyState.tsx:23–26](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/EmptyState.tsx#L23-L26): local性の説明
- [src/lib/i18n.ts:20–22](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/i18n.ts#L20-L22): 内容をサーバへ送らない説明

**受入条件**

- 現行の内容ローカル説明を誤ってcloud sync済みと変えない
- 将来は共有先/権限/保存期間/削除を明示
- コメント/書式/複数sheet等CSV外情報の保存先を先に決める

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

## 実装開始前の判断

1. UX-013/008/014の実canvas・clipboard経路を合成表で再現し、採用する境界/形式契約を決める。新しい製品起動や改修は今回の権限に含まない。
2. UX-009/010はtable/string設計を維持する方針が手元から支持された。予告と別名保存を先にし、型保持・文書全体編集を自動採用しない。
3. UX-001/004/018はmetadataの寿命を決める。sessionから始める案、端末local、明示sidecarを比較し保存/解除のUIを省かない。
4. すべての変更で繰返し操作、cancel、失敗、タブ移動中の完了、Undo、filter、IME境界を検査する。公式例と似たラベルを付けるだけで問題を解いたことにしない。
5. 利用者はHTMLで採用/保留/見送りとメモを選び、全件MDを書出して戻せる。未選択やメモだけの回答を採用と推測しない。

## 公式比較のURL・参照節（確認日2026-10-11 UTC）

- **OFF-MS-01** [Worksheet-scoped Sheet Views](https://support.microsoft.com/en-us/excel/create-and-manage-sheet-views-in-excel) — “Add a Sheet View”; “Using a Sheet View”; “About differences between Sheet Views on Excel platforms”; “Frequently Asked Questions”.。対象: Excel desktop/Mac/Web等。OneDrive/SharePointの条件あり。。対応: UX-001。Sheet Viewsはsort/filterを名前つきで保存し、active worksheetのviewを選ぶ。 限界: 全タブのscroll/selection自動復元の証拠ではない。local copyでは利用制限あり。
- **OFF-MS-02** [Desktop Custom Views](https://support.microsoft.com/en-us/excel/create-apply-or-delete-a-custom-view) — introduction; “Create a custom view”; “Apply a custom view”.。対象: Windows desktop ExcelのCustom Views。。対応: UX-001。選択・filter・表示設定をworksheetに属するviewへ保存できる。 限界: 明示保存viewであり自動復元ではない。Excel tableがあるworkbookでは制限。
- **OFF-GS-01** [Filters, saved filter views, and header-aware sorting](https://support.google.com/docs/answer/3540681?co=GENIE.Platform%3DDesktop&hl=en) — “Filter your data”; “Create, save, delete, or share a filter view”; “Find an existing filter view”; “Sort data in alphabetical or numerical order”.。対象: Google Sheets Computer/browser。。対応: UX-001 / UX-004 / UX-015。filter viewの保存・再利用、sort時のData has header row、header freezeの別手順を記載。 限界: 自動header判定や全view状態の自動復元を保証しない。
- **OFF-MS-03** [Find/Replace controls and scope](https://support.microsoft.com/en-us/excel/get-started/find-or-replace-text-and-numbers-on-a-worksheet) — Windows “Find” / “Replace”; macOS “Find text or numbers from the Search bar”; Web “Find” / “Replace”.。対象: Excel Windows/Mac/Webの節を区別。。対応: UX-002 / UX-007 / UX-011。Find/Replace、件数/移動、case/whole-cell/scopeの選択を説明。MacとWindowsでキーの意味が異なる。 限界: 開いたpanelへの再shortcut focusやregex互換の証拠ではない。
- **OFF-GS-02** [Computer keyboard shortcuts](https://support.google.com/docs/answer/181110?co=GENIE.Platform%3DDesktop&hl=en) — “PC shortcuts”; “Mac shortcuts”; “Chrome OS shortcuts”; “Use other spreadsheet shortcuts”.。対象: Sheets PC/Mac/ChromeOSの各shortcut表。。対応: UX-002 / UX-008 / UX-013。Find/Replace・copy/paste・fill down/right等をplatform別に示す。Macの置換はCommand+Shift+H。 限界: shortcutの伝播、繰返しfocus、OS clipboardの完全互換を保証しない。
- **OFF-GS-03** [Search/Replace regex and capture references](https://support.google.com/docs/answer/62754?co=GENIE.Platform%3DDesktop&hl=en) — “Use find and replace in a spreadsheet”; “Replace with regular expressions”; “Regular expressions”.。対象: Google Sheets Computer Find/Replace。Docsとは区別。。対応: UX-007 / UX-011。正規表現置換に$1/$2のcapture参照例がある。case/full-cell/formula検索の選択もある。 限界: JavaScript regexとSheets RE2は完全互換ではない。
- **OFF-GS-04** [REGEXREPLACE function restrictions](https://support.google.com/docs/answer/3098245?hl=en) — “Notes”.。対象: Sheets REGEXREPLACE関数。。対応: UX-007 / UX-019。RE2を利用しUnicode character class等に制限。text入出力の関数契約。 限界: 関数の数値制限を一般Find/Replace全体へ拡張しない。
- **OFF-GOOGLE-RE2-01** [Engine restrictions](https://github.com/google/re2/blob/main/doc/syntax.txt) — “Grouping”; “Empty strings”; “Escape sequences”.。対象: Google RE2公式engine source。。対応: UX-007。capture groupは対応、pattern backreferenceやlookaroundは非対応。 限界: pattern参照とreplacement $1は別。host側の全挙動を保証しない。
- **OFF-MS-04** [Save versus Save As](https://support.microsoft.com/en-us/excel/save-your-workbook) — introduction; “Turn on AutoRecovery”.。対象: Windows desktop Excel。。対応: UX-003 / UX-005 / UX-012。Saveは既存場所への更新、Save Asは初回・別場所・別copy。AutoRecoveryとは区別。 限界: Webのlocal上書きや特定の終了dialogを証明しない。
- **OFF-MS-05** [Excel Web autosave, online copy, download](https://support.microsoft.com/en-us/accessibility/excel/basic-tasks-using-a-screen-reader-with-excel) — Web “Save your work”; “Save a copy online”; “Rename a workbook”; “Save a copy to your computer”.。対象: 長いページ内のExcel Web節。。対応: UX-003 / UX-005 / UX-012。自動保存、online copy、rename、computerへのdownloadを分けて説明。 限界: ローカル元ファイルへのwrite-backではない。
- **OFF-MS-06** [AutoSave changes the close/discard model](https://support.microsoft.com/en-us/office/collab-files/what-is-autosave) — introduction; “What happened to File > Save As?”; “I'm a subscriber with the latest version of Office. Why is AutoSave disabled?”。対象: Microsoft365 Windows/Mac、対応cloud保存先。。対応: UX-005 / UX-020。AutoSaveは適格なOneDrive/SharePointファイルへ継続保存。Save a Copyとlocal保存を区別。 限界: すべてのdesktop/local/Webファイルで同一ではない。
- **OFF-MS-07** [Closing with AutoSave is not a discard operation](https://support.microsoft.com/en-us/office/collab-files/what-you-should-know-about-autosave) — “Changing Workflows”.。対象: Office AutoSave workflow。。対応: UX-005。AutoSave中は閉じて破棄するつもりでも変更済みになっていることを注意喚起。 限界: すべてのappに保存/破棄/取消dialogを強制する資料ではない。
- **OFF-GS-05** [Automatic save, copy, download](https://support.google.com/docs/answer/49114?co=GENIE.Platform%3DDesktop&hl=en-Link) — “Save a file”; “Make a copy of a file”; “Download a copy of a file”.。対象: Google Docs Editors Computer、Sheetsを含む。。対応: UX-003 / UX-005 / UX-012 / UX-020。online自動保存、copy、downloadを別操作で説明。Sheetsではcell編集を確定する手順にも言及。 限界: 元localファイル上書きや全exit前の永続化完了を保証しない。
- **OFF-MS-08** [Header semantics are explicit](https://support.microsoft.com/en-us/excel/get-started/create-and-format-tables?wt.mc_id=otc_excel) — Windows/macOS table-creation steps; Web table-creation steps.。対象: Excel Windows/Mac/Webのtable作成。。対応: UX-004。table作成時にheader有無を選ぶ。Webはheaderなしのデータに列名を補う。 限界: CSV自動判定やfreezeとheaderの同一視を支持しない。
- **OFF-MS-09** [Freeze panes are geometric](https://support.microsoft.com/en-us/excel/get-started/freeze-panes-to-lock-rows-and-columns) — “Freeze rows or columns”.。対象: 掲載対象のWindows desktop Excel。。対応: UX-004。選択の上の行・左の列を固定する。行/列は独立した表示操作。 限界: header認識、編集保護、Web固有UIの証拠ではない。
- **OFF-GS-06** [Independent row/column freezing](https://support.google.com/docs/answer/9060449?co=GENIE.Platform%3DDesktop&hl=en) — “Freeze, group, hide, or merge rows & columns” (opening freeze procedure).。対象: Sheets Computer/browser。。対応: UX-004。View > Freezeで行数/列数を指定し、各軸の固定を解除できる。 限界: sortで先頭を除く意味とは別。
- **OFF-MS-10** [Desktop legacy text-encoding import](https://support.microsoft.com/en-us/excel/text-import-wizard) — introduction; “Step 1 of 3”.。対象: Windows desktopのlegacy Text Import Wizard。。対応: UX-006。Step1のFile originで文字集合を指定しpreviewを見られる。 限界: このlegacy UIをExcel WebのUIとしない。
- **OFF-MS-11** [Excel Web Text/CSV import exists](https://support.microsoft.com/en-us/excel/use-power-query-in-excel-for-the-web) — opening note; “Import data”; “Load your data”.。対象: Excel Web Power Query。plan/機能条件あり。。対応: UX-006。Data > Get DataにText/CSVがあり、gridへ読み込める。 限界: 全accountで同じ利用可否やencoding pickerがあるとは未確認。
- **OFF-MS-12** [Power Query encoding, delimiter, and type preview](https://learn.microsoft.com/en-us/power-query/connectors/text-csv) — “Summary”; “Connect from Power Query Desktop”; “Connect from Power Query Online”; “Additional information” > “Unstructured text” / “CSV”.。対象: Power QueryのText/CSV connector。hostに差あり。。対応: UX-006 / UX-009 / UX-015。File Origin、delimiter、型検出選択、text維持の選択を説明。 限界: Power Query Online全体の仕様をExcel Web固有画面と同一視しない。
- **OFF-MS-13** [CSV opening and lossy export](https://support.microsoft.com/en-us/excel/get-started/import-or-export-text-txt-or-csv-files) — “Import a text file by opening it in Excel”; “Import a text file by connecting to it (Power Query)”; “Export data to a text file by saving it”.。対象: Windows desktop Excel text/CSV import/export。。対応: UX-009 / UX-010 / UX-015 / UX-019。直openの自動型解釈に注意。text exportはactive worksheetと非対応機能の制約がある。 限界: PlainSheet JSON/Markdown保存の仕様を直接証明する資料ではない。
- **OFF-MS-14** [UTF-8 BOM handling](https://support.microsoft.com/en-us/excel/opening-csv-utf-8-files-correctly-in-excel) — main procedure (untitled).。対象: Excel。手順はPowerQuery/desktop-style importを含む。。対応: UX-006。UTF-8+BOMなら通常open可能と説明。BOMなしではimport経路を案内。 限界: BOMを付ければ任意文字コードが直るわけではなく、すべてのWeb環境を保証しない。
- **OFF-MS-15** [Clipboard visibility depends on structure/platform](https://support.microsoft.com/en-us/excel/copy-visible-cells-only) — Windows procedure; Web explanatory paragraphs.。対象: Excel WindowsとWebの節を分ける。。対応: UX-008。visible cells only、Web通常rangeとfiltered tableでcopyの扱いが違う。 限界: 一律Excel互換のvisible copy規則を作らない。Sheetsの対応保証は未取得。
- **OFF-GS-07** [Accessible grid and selection orientation](https://support.google.com/docs/answer/1632199?hl=en-en) — “Move around in your spreadsheet”; “Hear cell formatting and contents”; “Select cell ranges”; “Filter your data”.。対象: Sheets Computer+screen reader、OS別shortcut。。対応: UX-014 / UX-016 / coverage a11y。cell address/content、selection、filterに入る/出る時と表示行数のorientationを説明。 限界: PlainSheetの実reader合格を示す資料ではない。
- **OFF-W3C-01** [Modal dialog keyboard/focus pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — “Keyboard Interaction”; “Note”; “WAI-ARIA Roles, States, and Properties”.。対象: Webのmodal dialog authoring guidance。。対応: UX-005 / coverage a11y。初期focus、Tab循環、Escape、終了後focus復帰、accessible nameを示す。 限界: APGはそれ自体WCAG適合規格ではない。modeless検索やpopoverへ一律trapを要求しない。
- **OFF-W3C-02** [Interactive grid keyboard model](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) — “Data Grids For Presenting Tabular Information”; “Keyboard Interaction For Data Grids”; “Keyboard Interaction - Setting Focus and Navigating Inside Cells”.。対象: ARIA data grid authoring guidance。。対応: UX-014 / UX-016 / coverage a11y。grid内のfocus管理、keyboard移動、selectionとeditingの切替を説明。 限界: filter clipboardや再検索focusの独自契約を定めていない。
- **OFF-W3C-03** [Keyboard operability](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) — “Success Criterion (SC)”; “Intent”.。対象: WCAG2.2 SC2.1.1のUnderstanding。。対応: UX-011 / coverage a11y。機能をkeyboard interfaceから操作できることの趣旨を説明。 限界: Excelと同じshortcutを要求しない。sourceだけで適合判定しない。
- **OFF-W3C-04** [Visible keyboard focus](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) — “Success Criterion (SC)”; “Intent”.。対象: WCAG2.2 SC2.4.7のUnderstanding。。対応: UX-011 / coverage a11y。keyboard focusが見える必要性を説明。 限界: 特定の色や装飾を要求せず、実画面の検査が必要。
- **OFF-GS-08** [Split text, remove duplicates, or trim whitespace](https://support.google.com/docs/answer/6325535?hl=en) — Split data into columns / Remove rows with repeat data / Remove extra spaces。対象: Sheets Computer。対応: UX-008 / UX-017。選択したデータの区切り変更、比較列/headerを選ぶ重複削除、空白trim。NBSPはtrim対象外。 限界: diff preview・1Undo・hidden rowの扱い・clipboard解析はこの資料から保証しない。
- **OFF-GS-09** [Create an in-cell dropdown list](https://support.google.com/docs/answer/186103?hl=en) — Create a dropdown list steps 3–4 / Change or delete a dropdown list。対象: Sheets Computer。対応: UX-018。ruleを範囲へ作り、候補外の拒否を警告へ切り替えられる。ruleの編集/削除が可能。 限界: 任意regex検証やbulk paste原子性、CSV/sidecar保存の根拠ではない。
- **OFF-MS-16** [Keeping leading zeros and large numbers](https://support.microsoft.com/en-us/excel/keeping-leading-zeros-and-large-numbers) — Convert numbers to text / Use Power Query / Excel only has 15 digits of precision。対象: 掲載Excel desktop系列。機能ごとのversion条件あり。。対応: UX-015 / UX-017。自動数値変換による先頭0や長い番号の扱いを説明し、text取込を案内する。 限界: Excelの15桁制限をPlainSheetの保存値破壊と混同しない。PlainSheetは比較時Number化が別論点。
- **OFF-W3C-05** [File API Blob.text](https://w3c.github.io/FileAPI/#dom-blob-text) — §3.3.3 The text() method。対象: 標準Web API Blob/File。対応: UX-006。Blob.textはbytesをUTF-8 decodeして返す。 限界: 具体的製品UIの成功や正しい元encoding推測を保証しない。
- **OFF-WHATWG-01** [Encoding Standard UTF-8 decode](https://encoding.spec.whatwg.org/#utf-8-decode) — UTF-8 decode。対象: Web encoding algorithm。対応: UX-006。先頭UTF-8 BOMを処理し、errorを置換してdecodeする。 限界: BOM書出しの製品機能有無は別sourceで確認する。
- **OFF-GLIDE-01** [Glide6.0.3 fixed source](https://github.com/glideapps/glide-data-grid/blob/2abe757e65cc7c38ab4f9464c229db27be4c1a8e/packages/core/src/data-editor/data-editor.tsx) — physical lines2101–2186 / 2204–2212 / 1268–1277。対象: PlainSheet lockが解決するGlide6.0.3。対応: UX-013 / UX-016。fillDestinationにseedを含む範囲、preventDefault後の標準処理不実行、fillDown/R、visible ordinal markerを確認。 限界: 実canvas実行の証拠ではない。Web整形行番号をGitHub物理行に流用しない。
