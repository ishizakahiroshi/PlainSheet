# P-20261012-001 adopted research snapshot

2026-10-12利用者決定: UX-001〜028を全採用。以下の旧推奨/未選択/別案件記述は研究時点の記録で、今回のREADMEと親子planが実装範囲を上書きする。




# P-20261011-013 PlainSheet：UX調査・改善提案

版: R3（R2独立反証を反映、最終検収範囲はreview参照） / 作成 2026-10-11 UTC・2026-10-12 JST。製品改修は行わない。

## 結論

先に **UX-013 フィル、UX-008 自己コピー往復、UX-014 選択対象** の契約を揃え、その後に **UX-009/010 上書き前の変換予告** を加える。全セルをtextとして保存する強みを保つ。28 IDは28件のbugという意味ではなく、source不整合、改善、component検証、任意の拡張、見送り案を含む。

採用方針はまだ利用者が選んでいない。以下の推奨は判断材料であり実装の許可や確定した採択ではない。対になる [単一HTML](https://github.com/ishizakahiroshi/PlainSheet/issues/2) では全項目が未選択から始まる。

- 固定指示: `a4b136e7074986caf778c39ee26e61c0c774c2bb`
- 主対象: 既存Draft PR #1 `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`。候補sourceの調査であり利用中版ではない。
- 比較: develop `037c29ea4649efc81acc8f28824dca3df08e7450`。main/公開版/利用中版との一致は未確認。
- 正本: [Issue #2](https://github.com/ishizakahiroshi/PlainSheet/issues/2)。この資料branchは製品修正やPR #1のmergeを行わない。
- 関連: [coverage](https://github.com/ishizakahiroshi/PlainSheet/issues/2) / [sources](sources.md) / [独立レビュー](research-review.md) / [往復・撤回](https://github.com/ishizakahiroshi/PlainSheet/issues/2)

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
| 19 | [UX-021](#ux-021) | P2 | 機能改善（独立選択できる新機能） | 採用推奨 | スクロールしても見たい行を固定する |
| 20 | [UX-022](#ux-022) | P2 | 機能改善（独立選択できる新機能） | 採用推奨 | 複数列の並べ替えを対象確認して実行する |
| 21 | [UX-023](#ux-023) | P2 | 機能改善（独立選択できる新機能） | 採用推奨 | 選択範囲だけで検索・置換する |
| 22 | [UX-024](#ux-024) | P2 | 機能改善（独立選択できる新機能） | 採用推奨 | メニューをキーボードで開き元の場所へ戻る |
| 23 | [UX-025](#ux-025) | P2 | 機能改善（独立選択できる新機能） | 採用推奨 | 端末に合うショートカットを表示する |
| 24 | [UX-026](#ux-026) | P3 | 機能改善（独立選択できる新機能） | 保留推奨 | 操作名で探せるコマンド検索を用意する |
| 25 | [UX-027](#ux-027) | P2 | 機能改善（独立選択できる新機能） | 保留推奨 | 任意のローカル復元下書きを残す |
| 26 | [UX-028](#ux-028) | P3 | 機能改善（独立選択できる新機能） | 保留推奨 | 絞込みに名前を付けて切り替える |
| 27 | [UX-019](#ux-019) | P3 | 拡張案・今回見送り推奨 | 見送り推奨 | セルの数式を計算する |
| 28 | [UX-020](#ux-020) | P3 | 拡張案・今回見送り推奨 | 見送り推奨 | 複数人で同時編集する |

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

### UX-008

**コピーした表を同じ形で貼り戻す**

- 分類: sourceで確定した不整合（合成モデルあり）
- 優先度: P1。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：手元で実rangeTsv→parseClipboardTextの合成自己往復を確認。こちらはsourceと独立モデルで反証。実OS clipboard/UIは未検収。

**利用者・再現条件/合成入力**: A1:A2にNorth,EastとSouth,West、B列に保護したい文字を置く。copy→右クリック貼付で1列を保ちたい。

**現在のcaller→処理→結果**: App copySelection→rangeTsv→serializeCsv(TSV)。context paste→parseClipboardTextはtabなし複数行をcomma CSVと推定し2×2化。引用符1cell/末尾空行/空cellにも自己往復差のモデルあり。 手元は実rangeTsv→parseClipboardText呼出しで2×1カンマが2×2になること、a"bの1cellがTSV引用のまま戻ることを確認した。こちらの9件モデルとは別の実関数証拠として扱う。

**期待/改善後**: アプリ内でコピーしたと分かる情報と、表の行数・列数を添え、読み取れる場合は元の形で貼り付ける。外部の文字列は曖昧な場合だけ、タブ区切り・CSV・単一列の事前表示から選ぶ。HTML形式のコピー情報も使える場合だけ利用する。

**反証・既存機能・限界**: multiline CSVを便利に貼る仕様は既にtestがある。CSVを全面削除する案ではない。Glide keyboard pasteは別解析routeなので同じ誤りと一括断定しない。

**develop/PR差分**: clipboard.tsの該当処理はdevelopと同じ。PRでhidden-row安全性は改善済みだがこのformat曖昧性は残る。

**Excel/Sheets/標準の比較**: OFF-MS-15：visible copyの契約はrange/table/platformで違う。OFF-GS-02：基本copy/paste。公式資料がこのCSV推定方式を要求するわけではない。 OFF-GS-08：区切り文字を明示して列分割する先例。clipboard parser互換の証拠ではない。

**採用メリット**: 列が増えて隣を上書きする事故、引用符/空行の変化を防ぐ。

**採用デメリット・見送りの利点**: provenanceはブラウザ権限や他アプリを経由すると失われる。毎回previewでは作業が遅い。曖昧時だけ選択。

**推奨理由**: 自分でコピーした表の形を保ち、貼り付ける前に隣の列まで変わらないか確認できるようにする。

**導入時期**: 先行：次の編集品質改善で検討

**改修目安（未実測）**: M：3–5人日程度。

**依存**: clipboard format選択とshape保持。

**決まるまでの暫定回避**: 曖昧なcomma/quote/空行を含む右クリック貼付は避け、貼付直後に形と隣列を確認し誤ればUndo。別routeも検証なしに安全と保証しない。

**before / after（source説明用。実画面ではない）**

- 現在: 元は1列 × 2行 → North,East / South,West → 貼付: 2列 × 2行
- 改善後: 元は1列 × 2行 → TSVの形状を保持 → 貼付: 1列 × 2行

**固定根拠**

- [src/App.tsx:488–514](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L488-L514): copy caller、rangeTsv、writeText
- [src/App.tsx:599–616](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L599-L616): context paste caller
- [src/lib/clipboard.ts:4–36](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/clipboard.ts#L4-L36): TSV出力とCSV推定
- [src/tests/clipboard.test.ts:44–53](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/tests/clipboard.test.ts#L44-L53): CSV解釈を意図したtest
- [Issue #2 手元の合成実行記録](https://github.com/ishizakahiroshi/PlainSheet/issues/2#issuecomment-6110347439): 既存runtimeによる実parser/serializer/Blob呼出し、GUIではない
- [Issue #2 追加合成実行記録](https://github.com/ishizakahiroshi/PlainSheet/issues/2#issuecomment-6110628355): 実component/自己コピー往復/fillSeriesと未検収範囲

**受入条件**

- 1×1引用符、2×1comma、末尾空行、空cell、tab/newline/空列がcopy→pasteで一致
- 自copyと外部CSV/TSV/HTML、keyboard/context routeをそれぞれ検査
- 隣接既存cellを想定外に変えず、一括Undoできる
- filtered pasteのvisible destination不足時は既存の全体拒否を維持

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-013

**フィルで元のセルを変えない**

- 分類: source＋固定依存契約で確定した不整合
- 優先度: P1。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：handler/Glide6.0.3契約＋合成モデル。実canvas操作は未確認。

**利用者・再現条件/合成入力**: A1:A2=1,2をA5までフィル。またはA1=10のA1:A3を選んでCtrl+D。元の値を残して連番/コピーしたい。

**現在のcaller→処理→結果**: lockはGlide6.0.3。fillDestinationがseedを含む全範囲を渡す契約に対し、fillSeriesはseed後の続きから作り全destへ書く。モデルでは3,4,5,6,7と11,12,13になる。 手元の実fillSeries呼出しでは、長整数9007199254740993→9007199254740992/9007199254740994/9007199254740996、0.1/0.2→0.30000000000000004/0.4/0.5、item-001→item000/item001/item002、2026-10-11→2026-10-10/09/08の合成結果を報告。元textの数値推定/prefix/日付風文字列の解釈は別の仕様判断であり、全例を実UI不具合と一括認定しない。

**期待/改善後**: ドラッグで連番を延ばすときは元のセルを残し、追加部分だけを作る。Ctrl+D/Rはコピーとして分ける。上や左への操作と、数字以外を繰り返す場合の扱いも示す。

**反証・既存機能・限界**: 純関数単体testは続き生成を正しく確認しており、それ自体が誤りとは限らない。問題はcallerと依存の範囲契約。GUIの実再現・OS shortcutは未検収。 filtered fillの誤読/hidden書込という追加疑いは撤回。App:1088はdisplayRowsを渡し、App:1134–1140にhidden更新guardがある。fillHandle自体はfilter中も有効。

**develop/PR差分**: autofillとfill handler基本形はdevelopから存在。PRでこの部分は解消されていない。

**Excel/Sheets/標準の比較**: OFF-GS-02：Ctrl+D/Rのコピー動作の比較。OFF-GLIDE-01：固定Glide commitのfillPattern/fillDown/handleMouseUpが依存契約の根拠。競合shortcutだけで内部契約を証明しない。

**採用メリット**: 連番作成で元データを書き換える可能性を除く。

**採用デメリット・見送りの利点**: コピーと連番の選択が増えると迷う場合がある。日付や番号の解釈が曖昧なときは事前確認が必要。

**推奨理由**: 元のセルを守り、利用者が選んだコピーか連番の結果を予測できるようにする。

**導入時期**: 先行：次の編集品質改善で検討

**改修目安（未実測）**: M：3–5人日程度。 既存190 testsの外にある依存境界、上下左右、コピー/連番の仕様別の検査が必要。 設計・検査上の論点：dragとkeyboardを分岐すると仕様とテストが増える。上/左方向を場当たりで直さない。

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
- [bun.lock:178–178](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/bun.lock#L178): 解決済みGlide6.0.3の固定
- [Glide6.0.3 data-editor.tsx:2204–2212](https://github.com/glideapps/glide-data-grid/blob/2abe757e65cc7c38ab4f9464c229db27be4c1a8e/packages/core/src/data-editor/data-editor.tsx#L2204-L2212): drag destinationにsource矩形を含める
- [Issue #2 追加合成実行記録](https://github.com/ishizakahiroshi/PlainSheet/issues/2#issuecomment-6110628355): 実component/自己コピー往復/fillSeriesと未検収範囲

**受入条件**

- 1,2→A5が1,2,3,4,5でseed不変
- Ctrl+Dの10は10,10,10、Ctrl+Rもコピー
- 上/左/複数列/文字列/日付/空値の方針が明示される
- filter中は表示順で読み、元行へ正しく書き、hidden rowを変えず単一Undoを維持する
- 00123/2^53超/小数/数字suffix/日付風textについてコピーと連番のモードを明示し、元値を守る
- 曖昧な型推定は事前表示し、意図しない先頭0消失や桁丸めを避け、まとめて1Undo

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-014

**見えるセルと編集対象を一致させる**

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

**採用デメリット・見送りの利点**: 到達できる範囲の上限が変わると従来の移動に慣れた人が戸惑う。拒否される場合は理由を明示する。

**推奨理由**: 見ている番地と編集する番地を揃え、意図しないセルへ入力する迷いを減らす。

**導入時期**: 先行：次の編集品質改善で検討

**改修目安（未実測）**: M–L：5–10人日程度。 設計・検査上の論点：無制限に広げると大きな空配列を生みうる。疎な編集か明確な上限を設計する必要がある。

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

### UX-015

**大きな番号を正しい順序で並べる**

- 分類: sourceで確定した数値比較の精度不足
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：Number comparatorの合成結果。実データの発生頻度は不明。

**利用者・再現条件/合成入力**: 設定「先頭行を見出しとして扱う」をOFFにし、2行1列9007199254740993 / 9007199254740992を昇順。長いIDや精度が大事な値を扱う人。

**現在のcaller→処理→結果**: numeric判定後にNumber化して差を取り、両方が同じ値へ丸まると安定sortが入力順を維持。文字列の内容そのものは変更しない。

**期待/改善後**: sort方式を自動/文字列/数値から選べるようにし、精度を失う数値はexact比較または明示的文字列へ。先頭0、桁区切り、小数、日付、日本語の扱いを短く説明。

**反証・既存機能・限界**: 文字列型として保存する方針とsortのNumber一時変換は別。データ値の丸め保存と誤記しない。任意精度小数や日付localeの全面互換を約束しない。

**develop/PR差分**: sort.tsはdevelopから同じ比較方式。PRの自然sort改善済みと決めつけない。

**Excel/Sheets/標準の比較**: OFF-MS-12 / OFF-MS-13：textを維持する取込と自動型解釈の注意。OFF-GS-01：sort/headerの明示。どちらもPlainSheetのexact比較algorithmを規定しない。 OFF-MS-16：Excelの先頭0/長い数値の変換注意。PlainSheetのtext保存を維持する理由。

**採用メリット**: 長い識別子の順番を信用できる。

**採用デメリット・見送りの利点**: 並べ替え方式が増えると迷う。長い番号が普通の数値と違う扱いになる場合は、理由を短く示す。

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
- 合成再現はheader OFF、または見出し付き3行で比較する

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

## B · 保存と変換を理解する

### UX-003

**保存結果に対象ファイルを必ず添える**

- 分類: 機能改善
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：通知stateのscope。見間違い頻度は未測定。

**利用者・再現条件/合成入力**: A.csvで保存を開始してB.csvへ移動。Aの保存失敗/取消がBの画面へ出たとき、どのファイルか知りたい。

**現在のcaller→処理→結果**: useFileのsaveNotice/savingは全体1つ。editionNoticeへ常時表示。成功文はファイル名入り、失敗/取消は対象を含まない。snapshotのデータとmetadata更新先は文書IDで保護済み。

**期待/改善後**: 保存結果に対象ファイル名と、保存・別名保存などの操作を必ず示す。別のタブを見ていても、必要なら通知から対象の表へ戻れるようにする。

**反証・既存機能・限界**: 別タブの内容を誤保存する主張は否定。成功文には名前がある。global savingは並列保存を防ぐ意図があり、文書別表示を加えても同時書込を解禁する必要はない。

**develop/PR差分**: saveNoticeはPR側で追加された表示。developの保存完了問題そのものを再提案する項目ではない。

**Excel/Sheets/標準の比較**: OFF-MS-04 / OFF-MS-05 / OFF-GS-05：更新・コピー・downloadを区別。別タブ通知の正解UIまで競合資料が決めるものではない。

**採用メリット**: 失敗時に直すべき文書が分かる。

**採用デメリット・見送りの利点**: 別のタブの通知も見えるため、表示が多いと作業へ集中しづらくなる。短い対象名つき表示を優先する。

**推奨理由**: 失敗や取消がどのファイルのものか分かり、誤って別の表を保存し直す迷いを減らす。

**導入時期**: 次段階：先行項目と設計を合わせて検討

**改修目安（未実測）**: S：1–2人日程度。 設計・検査上の論点：通知履歴を増やすと邪魔になる。常時パネルより短い名前付き状態を優先。

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

### UX-005

**閉じる前に保存へ進める**

- 分類: 機能改善
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：confirm経路。native実動作は未検収。

**利用者・再現条件/合成入力**: 未保存のA.csvを閉じる。複数タブやアプリ全体終了で、変更を残して終えたい。

**現在のcaller→処理→結果**: closeTabとapproveWindowCloseはdirty時confirmによる破棄/取消。未確定編集commit、window closeの保存中guard、全タブdirty確認、native close event経路はPRで追加済み。 closeTabにはsaveRequestsRef guardがないため、window closeの保護と同じとは書かない。

**期待/改善後**: desktopは保存して閉じる/保存せず閉じる/戻るを対象文書名つきで選ぶ。Webはdownload開始後も保存完了を保証せず、利用者が残したことを確認して閉じる。

**反証・既存機能・限界**: 無確認破棄やnative close guardなしという旧問題は再提案しない。Webはブラウザ標準beforeunload文言を自由に変更できるとは限らない。

**develop/PR差分**: PRはnative/titlebar/全タブguardを改善済み。新提案は保存へ進む選択肢の追加のみ。

**Excel/Sheets/標準の比較**: OFF-MS-04 / OFF-MS-06 / OFF-MS-07 / OFF-GS-05：保存契約はlocal/AutoSave/downloadで違う。Excel/Sheetsが必ず保存確認を出すという主張はしない。

**採用メリット**: 戻って手動保存して再度閉じる往復が減る。

**採用デメリット・見送りの利点**: 閉じるときの選択肢が増え、複数の表でどれを残すか判断する手間が生じる。

**推奨理由**: 残したい変更をその場で保存へ進め、取消や失敗なら元の作業へ安全に戻れる。

**導入時期**: 次段階：先行項目と設計を合わせて検討

**改修目安（未実測）**: M–L：5–10人日程度。native OS確認を含む。 設計・検査上の論点：非同期dialog/保存失敗/複数文書の制御が増える。Webの完了誤認を招かない文言が必要。

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
- window closeは保存中/IME中の繰返し終了を抑え、tab close側も保存して閉じる導入時に対象保存完了との整合を検査する
- Web download開始だけでdirty解除/無条件closeしない

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-006

**文字コードと読込結果を確かめて開く**

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

- 現在: CP932の合成CSV → Web: UTF-8として開く → 取込前の文字コード確認なし
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

### UX-009

**JSON/YAMLの上書き前に変換内容を示す**

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

**採用デメリット・見送りの利点**: 保存前の確認が増える。文字列へそろえることを望む人には毎回の警告が煩わしい。

**推奨理由**: 連携先が期待する型を変える前に利用者が気づき、原本を残すか選べる。

**導入時期**: 先行：次の編集品質改善で検討

**改修目安（未実測）**: M：3–5人日程度。完全型保持はL以上の別見積り。 設計・検査上の論点：previewとschema保持にはコストがある。毎回の警告は慣れて無視されるので文書の変換内容に応じて出す。

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

### UX-010

**Markdownは表だけを保存すると伝える**

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

**採用デメリット・見送りの利点**: 表だけ書出すたびに別名を管理する必要があり、文書への反映には別の編集操作が残る。

**推奨理由**: 表の修正だけのつもりで本文まで置き換えることを防ぎ、元文書を残せる。

**導入時期**: 先行：次の編集品質改善で検討

**改修目安（未実測）**: M：3–5人日程度。文書内置換は別L。 設計・検査上の論点：本文diff表示と複数表判定に検査が必要。document全体構文保持へ広げるとPlainSheetの小ささを損なう。

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

### UX-012

**保存地点へ戻ったことを区別する**

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

**採用デメリット・見送りの利点**: 保存状態の説明が複雑になり、とくにダウンロード済みと原本保存済みを取り違えない表示が必要。

**推奨理由**: 本当に未保存の変更が残るかを分かるようにする。他の保護策を先に整えてから検討する。

**導入時期**: 先行項目の後、需要確認して判断

**改修目安（未実測）**: M：3–5人日程度。性能実測は未実施。 設計・検査上の論点：大きい表の比較負荷、履歴切り捨て、保存中編集の設計が増える。

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

### UX-002

**検索を呼ぶたび入力欄へ戻す**

- 分類: component合成再現＋sourceの診断（統合操作は未確認）
- 優先度: P2。保留推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：手元の実SearchPanel/合成DOMでopen=true再描画はfocusを戻さない。実canvasキー伝播は未確認。

**利用者・再現条件/合成入力**: 検索を開く→gridをクリック→Ctrl/Cmd+FまたはH→文字を入力。既に開いている検索にすぐ戻りたい。

**現在のcaller→処理→結果**: AppはsetSearchOpen(true)だけ、SearchPanelのfocus/select effectは[open]だけ。同じtrueではeffectが再発火しない。実際にセルへ文字が入るかは未観察。 手元の未変更SearchPanelを既存jsdom/Reactでmountした報告では、初回openで検索欄→他buttonへfocus→同じtrue再描画で他buttonのまま→false/trueで検索欄へ戻ることを再現。

**期待/改善後**: 検索を呼ぶたびに検索欄へ移り、すぐに入力できるようにする。置換を呼んだときは検索欄と置換欄のどちらへ移るかを統一する。端末ごとのキー案内はUX-025で別に選ぶ。

**反証・既存機能・限界**: 初回open時のfocusは既に実装済み。Glideが伝播を止める可能性、OS/browser shortcutの競合は未確認。存在する初回focusを「なし」と再提案しない。 2026-10-11 UTC / 10-12 JSTの手元component実測で単なるsource推論から更新。製品を起動した証拠ではない。

**develop/PR差分**: developにも同種open制御がある。PRの初回focus追加と残る繰返し経路を分ける。

**Excel/Sheets/標準の比較**: OFF-MS-03 / OFF-GS-02：検索shortcutは確認。繰返し呼出しのfocus仕様は公式資料で確立していない。 OFF-MS-17 / OFF-GS-02：Mac置換はExcelがCtrl+HまたはCommand+Shift+H、SheetsがCommand+Shift+H。PlainSheetのctrl/meta+HとShift不問を一律互換とはしない。

**採用メリット**: 検索への復帰時に入力先を探し直さずに済む。

**採用デメリット・見送りの利点**: 検索へ戻ったときに編集中のセルを確定するか残すかが変わると戸惑う。入力中の文字を失わない扱いが必要。

**推奨理由**: 検索へ戻るたび入力先を確かめ直す迷いを減らす。編集中の文字を失わず戻れることを実画面で確認してから採用する。

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
- [src/components/HelpModal.tsx:11–25](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/HelpModal.tsx#L11-L25): 現在のCtrl中心のキー表記
- [Issue #2 追加合成実行記録](https://github.com/ishizakahiroshi/PlainSheet/issues/2#issuecomment-6110628355): 実component/自己コピー往復/fillSeriesと未検収範囲

**受入条件**

- 開閉前後と既に開いた状態のCtrl/Cmd+F/Hで狙った入力欄へ移る
- セル未確定編集とIME変換を失わない
- Escで閉じた後のfocus先が明確
- UX-025のOS別キー方針と組み合わせても、検索入力への復帰契約が変わらない

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-007

**正規表現の置換ルールを明示する**

- 分類: 機能改善（競合との機能差）
- 優先度: P3。保留推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：$1がliteralになる実装。仕様違反とする根拠はない。

**利用者・再現条件/合成入力**: cell=AB-12、検索=([A-Z]+)-(\d+)、置換=$2/$1。Sheetsの操作に慣れた人が同じ結果を期待する。

**現在のcaller→処理→結果**: replaceCurrent/Allのcallbackは入力文字列そのものを返す。結果は$2/$1。regexの検索patternはJavaScriptで、SheetsのRE2と完全互換ではない。

**期待/改善後**: 既定は文字列をそのまま置換することを明示。必要なら「グループ参照を使う」を追加し結果previewを出す。改行や$記号のescapeも説明。 選択内/完全一致の検索は別カードUX-023で選ぶ。

**反証・既存機能・限界**: literal置換は普通の$文字列を壊さない利点がある。キャプチャ展開を無言で有効にすると既存ユーザーの期待を変える。

**develop/PR差分**: callback置換はPRにも残る。競合差であり既存PR不具合修正の未完了とはしない。

**Excel/Sheets/標準の比較**: OFF-GS-03：Sheets Find/Replaceの$1/$2例。OFF-GOOGLE-RE2-01：patternのbackreference禁止とreplacement参照は別。OFF-MS-03の通常検索をregex仕様として引かない。

**採用メリット**: 他の表ツールから来た人が置換結果を予測できる。

**採用デメリット・見送りの利点**: 置換方式を選ぶ操作と記号の覚え方が増え、誤った方式を選ぶと期待と違う結果になる。

**推奨理由**: まず置換ルールを説明し、参照展開は必要な人だけが選べるようにする。

**導入時期**: 先行項目の後、需要確認して判断

**改修目安（未実測）**: S：説明1人日程度、明示展開+previewはM。 設計・検査上の論点：engine差とescapeの学習が増える。すべてのregex機能を複製する負担は大きい。

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

### UX-011

**検索エラーと一致なしを分ける**

- 分類: sourceで確定した診断不足
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：invalid/too-longが0件へ合流。画面実観察はなし。

**利用者・再現条件/合成入力**: 正規表現ONで[を検索、またはASCII 2001文字のqueryを入れる。ゼロ件なのか入力が間違っているのか判断したい。

**現在のcaller→処理→結果**: buildMatcherは不正regex/長過ぎるqueryをnull、collectSearchMatchesは0件。SearchPanelはnoMatchesのみで入力errorを受け取るpropがない。 上限はJavaScript length（UTF-16 code units）であり全言語の2000文字と同一ではない。

**期待/改善後**: 未入力・正常な0件・正規表現の誤り・長さの上限超過を区別する。入力欄のすぐ下に直し方と上限を示し、入力した文字は消さない。

**反証・既存機能・限界**: 無効なregexで置換処理を止めるguard自体は安全で維持する。検索navigation上限5000と実総件数はPRで改善済み。上限なしへ変える提案ではない。

**develop/PR差分**: buildMatcherのnull経路はdevelopにも存在、PR総数改善では解消しない。

**Excel/Sheets/標準の比較**: OFF-MS-03 / OFF-GS-03：検索条件と結果の区別。OFF-W3C-03/04：keyboardで修正可能な入力とfocus。競合の具体的エラー文を捏造しない。

**採用メリット**: 検索条件を直すべきときにデータがないと誤解しない。

**採用デメリット・見送りの利点**: 入力途中の警告が頻繁に出ると集中を妨げるため、入力が落ち着いてから示す。

**推奨理由**: データがないのか検索条件を直すべきかを区別し、次の操作を迷わず選べる。

**導入時期**: 次段階：先行項目と設計を合わせて検討

**改修目安（未実測）**: S：1–2人日程度。 設計・検査上の論点：即時validateで入力途中のエラーがうるさくなる。短い遅延や確定時通知が必要。

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

### UX-023

**選択範囲だけで検索・置換する**

- 分類: 機能改善（独立選択できる新機能）
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。初版の選択scopeは現在の選択表現で厳密に表せるセル集合に限定。実canvas・IME未検収。
- 確度: 高：SearchOptions、collectSearchMatches、replaceAllの対象はsource確認。選択範囲指定UIと完全一致optionは確認した実装にない。

**利用者・再現条件/合成入力**: B2:B50の区分コード「A」だけを「B」に置換したい。隣の説明列や「AA」「A
」が変わるのは避けたい。filter中は見えている選択セルだけを扱いたい。

**現在のcaller→処理→結果**: SearchPanelのoptionはregex/caseSensitive。App→collectSearchMatchesは全セルを走査しfilter時はvisibleSetで行を制限する。replaceAllもvisibleSetを使うが選択列・選択範囲は受け取らない。範囲表示と5000件の移動上限/総件数表示はPRに既存。

**期待/改善後**: 検索範囲に「この表」「表示中の行」「選択範囲」を追加し、選択範囲は検索開始時のセル集合を固定して番地と件数を示す。filter中の初期値は従来どおり表示中の行、選択範囲指定も見える選択セルとの交差を対象にする。全表を明示選択すると非表示行も含むと表示する。「セル全体が一致」を追加し検索・1件置換・全置換で同じ判定を使う。

**反証・既存機能・限界**: 検索・case・regex・表示行scopeは既存であり欠落扱いしない。regexのアンカーによる回避はあるが、一般利用者向けの明示optionとは別。UX-007のreplacement文字列契約やUX-011のエラー表示を変更する提案ではない。

**develop/PR差分**: developのSearchPanelにもregex/caseSensitiveだけがあり、App検索callerに選択範囲optionはない。PRで加わった表示行scope・総件数を維持した上での追加機能。

**Excel/Sheets/標準の比較**: OFF-MS-03のExcel Web節はWithin=SelectionとMatch entire cell contents、Mac検索bar節は選択範囲検索を説明。OFF-GS-03のSheets Computer節はセル完全一致を説明するが、今回読めた本文だけから同じ選択scope UIまで保証しない。hidden行と検索移動で範囲を動かさない契約は今回の提案。

**採用メリット**: 直したい列やセルに置換を限定でき、似たコードや別の説明文を巻き込む不安が減る。

**採用デメリット・見送りの利点**: 狭い検索範囲が残っていると、本当は存在する語を「見つからない」と受け取りやすい。範囲と非表示行の扱いを常に示す分、検索欄の情報量が増える。

**推奨理由**: 採用推奨。全置換の対象を利用者が選べるようにし、現在の表示行優先を初期値として守る。完全一致は独立checkboxにし、普段の部分一致検索を変えない。

**導入時期**: 次段階：既存検索のエラー表示・対象整合を先行し、範囲指定を追加

**改修目安（未実測）**: M：4–6人日程度の実装概算、実測ではない。検索/置換の共通scope、選択snapshot、完全一致判定、文書切替・構造変更のguardとfixtureを含む。

**依存**: UX-007は置換文字列の意味、UX-011は診断、UX-014は選択と表示行の整合。各項目の採否を独立させ、共有scopeだけ揃える。

**決まるまでの暫定回避**: 完全一致だけならregexを理解した利用者はpatternで限定できる。範囲限定が必要なら1件ずつ位置を確かめて置換する。

**before / after（source説明用。実画面ではない）**

- 現在: B2:B50を選択 → 全置換の対象は表示行全体 → Aを含む他列も対象
- 改善後: 対象: B2:B50 の表示セル → セル全体一致: A → 対象件数を確認して置換

**固定根拠**

- [src/components/SearchPanel.tsx:6–27](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/SearchPanel.tsx#L6-L27): 現在のoptionとpropに選択範囲・完全一致はない
- [src/components/SearchPanel.tsx:63–67](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/SearchPanel.tsx#L63-L67): 全表/表示行の既存scope表示
- [src/App.tsx:407–415](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L407-L415): visibleSetを検索へ渡すcaller
- [src/lib/search.ts:7–24](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/search.ts#L7-L24): 検索対象の走査と総数/移動上限
- [src/App.tsx:835–858](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L835-L858): 表示行の全列に全置換する経路
- [src/App.tsx:1310–1320](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L1310-L1320): 部分一致regexの生成

**受入条件**

- B2:B50を選んで完全一致Aを置換しても、隣列・範囲外・AA・末尾改行つきAは変わらない
- 検索の次候補へ移動しても開始時の対象範囲が縮んだり移動したりしない
- filter中の選択scopeは非表示行を除外し、全表へ切替える場合は含まれることを表示する
- 対象なし・一致なし・無効regexを区別し、空queryは従来どおり置換を開始しない
- literal/regexとcase設定を組み合わせてもセル全体の一致判定が検索と置換で同じになる
- 全置換は総対象を処理し5000件の移動上限に引きずられず、1回のUndoで戻る
- 別タブ・行列挿入削除で古いsnapshotの範囲を黙って使わず、対象を再設定できる

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-025

**端末に合うショートカットを表示する**

- 分類: 機能改善（独立選択できる新機能）
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop、Windows/macOSを先行対象。Linux・配列差・支援技術競合は別に明示し、未検証のキーを確定扱いしない。
- 確度: 高：Ctrl固定ラベルとctrl/metaをまとめるhandlerはsource確定。各OS・配列での衝突頻度や実key伝播は未検証。

**利用者・再現条件/合成入力**: Macで保存や置換を覚えたい人がCtrl中心のtooltip/helpを読む。キーを押してもOS操作と競合するとき、使える別の入口も知りたい。

**現在のcaller→処理→結果**: Toolbarのopen/save/find/undo/redo等のtooltipとHelpModalの表はCtrl表記。Appの多くのhandlerはctrlKey||metaKeyで、HはShift有無を分けず検索を開く。Mac置換のラベルを置換すれば直るという単純な関係ではない。

**期待/改善後**: 操作ごとのplatform別キー定義からtooltip/help/aria案内を揃え、WindowsはCtrl、MacはCommand等の正しい名称を示す。Macの置換はCommand+Shift+Hなど公式慣習を参考に実機で衝突を確認して選び、Command+Hを通常のアプリ非表示操作として妨げない方針を明記する。ブラウザに優先されるキーは代替buttonを案内する。

**反証・既存機能・限界**: Cmd対応がまったくないという提案ではない。現在もmetaKeyを受ける操作はある。UX-002は開いた検索への再focusで、こちらはキーの割当・ラベル・説明の一致を独立して選ぶ。未検証キーを「OS非競合」と保証しない。

**develop/PR差分**: developのToolbarとAppにもCtrlラベルとctrl/meta共用handlerがある。PRの新しいHelpModal等も含め、表示/割当を揃える新たな一貫性機能。

**Excel/Sheets/標準の比較**: OFF-MS-17のExcel macOS節は置換にCtrl+H/Command+Shift+H、Command+Hにアプリ非表示を案内。OFF-GS-02のMac表はCommand+Shift+H、PC表はCtrl+H。製品・OS・配列で異なるため、競合の表を丸ごと互換仕様にはしない。

**採用メリット**: 自分の端末で押すキーが一目で分かり、間違った覚え直しやOS操作の意図しない呼出しを減らせる。

**採用デメリット・見送りの利点**: 端末をまたいで使う人には表示が変わり、以前覚えたキーと異なる場合がある。自動判定が外れたときの混乱を避けるため、helpで別platformの表も確認できるようにする。

**推奨理由**: 採用推奨。普段の画面にはその端末のキーを簡潔に示し、詳しいhelpで別の端末とbutton経路も探せるようにする。表示変更だけで実キーの問題が解決したと扱わない。

**導入時期**: 先行候補：実キーとの整合確認を伴う表示改善として着手

**改修目安（未実測）**: S–M：2–4人日程度の実装概算、実測ではない。キー定義の統合とtooltip/help更新、各OS/browser/配列の手動衝突確認を含む。全ショートカット互換化は対象外。

**依存**: UX-002の再focusとは別機能。UX-024/026を採用する場合、新しい入口のキーも同じ説明体系に合わせる。

**決まるまでの暫定回避**: 保存や検索は既存buttonから操作する。helpのCtrl表記をすべて機械的にCommandへ読み替えない。

**before / after（source説明用。実画面ではない）**

- 現在: Macでhelpを開く → 保存 Ctrl+S / 置換 Ctrl+H → 自分のキーへ読み替える
- 改善後: Mac用のキーを表示 → 保存 ⌘S / 置換 ⌘⇧H候補 → buttonからも同じ操作

**固定根拠**

- [src/components/Toolbar.tsx:64–103](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/Toolbar.tsx#L64-L103): open/save/searchのCtrl固定tooltip
- [src/components/Toolbar.tsx:108–133](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/Toolbar.tsx#L108-L133): undo/redo/copyのCtrl固定tooltip
- [src/components/HelpModal.tsx:11–26](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/HelpModal.tsx#L11-L26): 現在のshortcut表
- [src/App.tsx:894–940](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L894-L940): ctrl/meta共用のキー処理とHの分岐

**受入条件**

- 保存・別名保存・検索・置換・Undo/Redoの表示と実handlerが対象platformで一致する
- MacでCommand+Hを置換として要求せず、採用する置換キーは実機で確認する
- 入力欄・IME・OS予約キーを妨げず、キーが使えない環境でも同じ操作へbuttonで到達できる
- helpでWindows/Macの表示を切替えて確認でき、tooltipと相反する説明を出さない
- UX-002を未採用でも割当/表記を整えられ、再focusの修正済みとは主張しない

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-026

**操作名で探せるコマンド検索を用意する**

- 分類: 機能改善（独立選択できる新機能）
- 優先度: P3。保留推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。640px・200%表示・screen readerでの製品実測は未実施。
- 確度: 高：既存ToolbarとApp state/shortcutにはcommand検索UIが見当たらない。640pxでの発見性・操作時間は未実測。

**利用者・再現条件/合成入力**: 狭いウィンドウや拡大表示で「列幅をそろえる」「絞込みを解除」などの場所を探す。何をしたいかは分かるが、どのアイコンやmenuか思い出せない。

**現在のcaller→処理→結果**: Toolbarには名前付きbutton/tooltipとgroupがあり、CSSはwrap・max-height:30vh・overflow:autoと700px以下の調整を持つ。App/Toolbarの確認範囲に操作名からコマンドを検索する入口はない。狭幅で必ず操作不能になる証拠はない。

**期待/改善後**: 常に到達できる「操作を探す」buttonと検証済みキーから、小さなcommand検索を開く。既存の操作名・日本語/英語の別名・現在の対象・使えない理由をローカルに検索し、矢印/Enterで既存操作へ進む。セル内容検索と名称を分け、削除/保存の既存確認や対象指定はそのまま通す。AI呼出し・外部検索・利用履歴送信を必要としない。

**反証・既存機能・限界**: 既存toolbarが欠けている、640pxで使用不可、という不具合認定はしない。toolbar全面置換ではなく、同じ操作へ名前から入る追加経路。UX-024のkeyboard入口やUX-025の正しいキー表示だけでも一部の需要は満たせる。

**develop/PR差分**: developのApp/Toolbarにも基本buttonとshortcutはあるが、確認した範囲にcommand検索入口はない。PRのwrap/scroll対策は既存改善として尊重する。

**Excel/Sheets/標準の比較**: OFF-MS-20はWindows版Microsoft365 appsのcommand検索と検索box縮小、OFF-GS-10はSheetsを含むtool finderとPC/Mac別キーを説明。企業ファイル検索・cloud提案・recent履歴までPlainSheetへ移す根拠ではない。両製品の機能をローカルの操作名検索に絞って参考にする。

**採用メリット**: アイコンの位置を覚えなくても言葉で操作を探せ、狭い画面でも共通の入口を使える。

**採用デメリット・見送りの利点**: 通常検索と間違えたり、候補が多すぎて選ぶ負担が増えたりする。操作名の言い換えが合わないと結果が見つからないので、buttonやmenuの通常経路は残す。

**推奨理由**: 保留推奨。まず既存操作の名前とkeyboard経路を揃え、それでも探す場面が多いか確認する。採る場合は基本コマンドの検索だけに絞り、画面をもう一つ覚える負担を抑える。

**導入時期**: 後続：既存button/keyboardの改善後、操作発見性の評価を踏まえて判断

**改修目安（未実測）**: M：4–7人日程度の実装概算、実測ではない。共通command registry、alias/localization、無効理由、focus/IME/640pxの確認を含む。外部AIや検索APIは不要。

**依存**: UX-024/025の入口と名称を先に整理。UX-024/025がなくても独立実装は可能だが、重複した操作説明を作らない。

**決まるまでの暫定回避**: 既存toolbarのgroup・tooltip/helpを使い、狭幅では折返しとscrollで目的のbuttonへ進む。

**before / after（source説明用。実画面ではない）**

- 現在: 操作名は分かる → buttonやmenuを探す → 狭幅では折返しをたどる
- 改善後: 操作を探す: 列幅 → 候補: 幅を自動調整 → 対象を確認して実行

**固定根拠**

- [src/components/Toolbar.tsx:51–107](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/Toolbar.tsx#L51-L107): 既存buttonによるfile/search入口
- [src/components/Toolbar.tsx:139–219](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/Toolbar.tsx#L139-L219): 構造/表示/helpの既存入口
- [src/styles/app.css:768–785](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/styles/app.css#L768-L785): 既存のwrap/scroll対策
- [src/styles/app.css:920–937](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/styles/app.css#L920-L937): 狭幅の既存調整
- [src/App.tsx:58–70](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L58-L70): 検索/help/settingsのstate
- [src/App.tsx:894–958](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L894-L958): 既存shortcut入口

**受入条件**

- 640px・拡大時も入口が隠れず、keyboardだけで開く/検索/選択/取消ができる
- 「列幅」「幅を自動調整」等の決めたaliasで既存の同じ操作に到達する
- 候補には対象文書/列と無効理由が示され、filterで禁止中の構造操作を迂回できない
- Escで何も実行せず呼出し元へ戻り、IMEのEnterでコマンドを誤実行しない
- 削除は既存確認へ、保存は既存保存契約へ進み、shortcut/button経路と結果が同じ
- ローカル文字列検索だけで機能し、セル値・検索語・履歴を外部送信しない

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

## D · 作業の状態を見失わない

### UX-001

**タブを戻ったときに絞込みを保つ**

- 分類: 機能改善（現行の状態消去はsource確定）
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：filterの経路。scrollの実挙動は未確認。

**利用者・再現条件/合成入力**: A.csvの「東」だけを表示し、B.csvへ移動してAへ戻る。複数ファイルを突き合わせる人が条件を作り直す。

**現在のcaller→処理→結果**: TabBar→switchTab→applyDocumentでfilter.clearAll。snapshotはrows/meta/colWidths/selection/range/historyを持つがfilterを持たない。

**期待/改善後**: 文書ごとのfilterをsession内で復元し、条件と表示行数を常時示す。scroll/列固定の記憶は同じ容器へ後から足せる。CSV本体へview情報は書かない。 名前を付けたviewの保存・呼出しは別カードUX-028で判断する。

**反証・既存機能・限界**: 列幅・選択・履歴は既に保持される。「タブで全部失う」は撤回。globalのheader/zoom/freezeは別設定であり、scroll復帰も未観察。

**develop/PR差分**: developにもapplyDocumentでclearAllがある。PRによる解消済み項目ではない。

**Excel/Sheets/標準の比較**: OFF-MS-01 / OFF-MS-02 / OFF-GS-01：明示的な保存viewの先例。競合がタブ移動で全状態を自動復元する証拠ではない。

**採用メリット**: 比較作業を中断しても同じ対象へ戻れる。

**採用デメリット・見送りの利点**: 古い絞込みで行が隠れたままになりうるため、条件と解除場所を確認する習慣が必要。

**推奨理由**: 条件を作り直さずに比較作業へ戻り、意図した行を見続けられる。

**導入時期**: 次段階：先行項目と設計を合わせて検討

**改修目安（未実測）**: M：3–5人日程度の概算。scroll復帰を含めると追加。 設計・検査上の論点：古いfilterで行が隠れたままになりうる。解除と件数を常に見せる必要がある。

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

### UX-004

**先頭行の意味をファイルごとに選ぶ**

- 分類: 機能改善
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 高：既定値とsort/filter経路。発見性の実画面評価は未実施。

**利用者・再現条件/合成入力**: 見出しのない1列表3 / 1 / 2を開いて昇順。初めて使う人が先頭3も並べたい。

**現在のcaller→処理→結果**: global useHeaderRowの既定trueでsortは先頭を除外しfilterは保持する。Settingsで解除できる。headerHighlightは見た目、freezeColumnsは列の固定で、別の意味。

**期待/改善後**: 初回取込またはsort時に「先頭行は見出し」を短いpreviewで確認し文書単位に記憶。常時状態表示から変更可能。行固定は別の任意機能として分ける。 行見出し固定は別カードUX-021で選ぶ。

**反証・既存機能・限界**: header機能がないという指摘は誤り。自動推定だけで決める案は採らない。JSON/YAMLの列名はserializer上の見出しで、CSVの見出しなし設定を無条件に当てない。

**develop/PR差分**: default trueはdevelopにも存在。PRはSettingsからの切替を追加済み、その再実装は不要。

**Excel/Sheets/標準の比較**: OFF-MS-08 / OFF-GS-01：header有無の明示選択。OFF-MS-09 / OFF-GS-06：freezeは両軸の表示機能でheader判定とは別。

**採用メリット**: 先頭のデータを並替え忘れる意外性を減らす。

**採用デメリット・見送りの利点**: 毎ファイルの質問は煩雑。既存の選択を記憶し、曖昧な場合のみpreviewを示す。

**推奨理由**: 絞込みや並べ替えの前に先頭行の意味を確認でき、別の表へ切り替えても意図した扱いを保てる。

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

### UX-016

**絞込み後も元の行番号を分かるようにする**

- 分類: 機能改善（表示参照の整合）
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。OS依存の実画面は未確認。
- 確度: 中〜高：固定依存のrow marker契約。canvas表示は未観察。

**利用者・再現条件/合成入力**: 元表の行1/2/4だけがfilter後に表示。行の位置を他人へ伝えたり名前boxで戻りたい。

**現在のcaller→処理→結果**: Appはsource rowへmapping済み。Glide rowMarkersは連番1/2/3で、名前boxは元番地A1/A2/A4を使う。依存側はvisible ordinalをmarkerへ出す。

**期待/改善後**: 左端の行番号を元の行番号1/2/4へそろえるか、「表示3行目 / 元4行」と区別して示す。絞込み中の件数表示と解除は既存の入口を活かす。

**反証・既存機能・限界**: データmappingはPRで修正済みでありwrong-row書込bugとは別。表示順の番号を意図する設計もあり、元番地との違いが分かればよい。

**develop/PR差分**: rowMarkersのordinal表示はdevelopから。PRのsource mapping修正の再提案ではない。

**Excel/Sheets/標準の比較**: OFF-GS-07 / OFF-W3C-02：cell住所とfiltered範囲のorientation。競合資料から内部marker実装を推測しない。

**採用メリット**: 絞込後の行を元ファイルのどこか説明しやすい。

**採用デメリット・見送りの利点**: 飛び番が初心者には欠落に見える。filter状態を併記する。

**推奨理由**: 絞込み後も表示位置と元の番地を区別でき、他の人に対象を伝えるときの迷いを減らす。

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

### UX-021

**スクロールしても見たい行を固定する**

- 分類: 機能改善（独立選択できる新機能）
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通の表示案。実canvas・Windows/macOS・filter併用の実機評価は未実施。
- 確度: 高：列固定の実装と、確認したApp/GlideSheet/settingsに行固定の指定がないこと。縦スクロールの実画面は未確認。

**利用者・再現条件/合成入力**: 長い受注明細で先頭の項目名や上部2行の説明を見ながら下の行を入力する。合成例は項目行＋説明行＋明細100行。

**現在のcaller→処理→結果**: 列メニュー→onFreezeToHere→settings.freezeColumns→GlideSheet/DataEditorへ渡す経路は既存。AppSettingsはfreezeColumnsを持つがfreezeRows相当を持たず、確認したwrapperに先頭データ行を固定する指定はない。useHeaderRowとheaderHighlightは別の既存機能。

**期待/改善後**: 表示メニューで「先頭1行」「選択行まで」「行固定を解除」を追加し、固定境界を示す。行と列を独立指定し、まず文書session内に保持する。固定は見え方だけで、見出し判定・データ順・CSV出力を変更しない。filterで除かれる固定範囲内のデータ行は再表示せず、対象行数と表示状態を説明する。

**反証・既存機能・限界**: 列固定の欠落を再提案しない。DataEditorの列見出し表示と、ファイル先頭行の固定を区別する。ライブラリの潜在能力や実画面の見失い頻度は未確認。UX-004の見出し意味設定とは別に採否を選べる。

**develop/PR差分**: developのApp/GlideSheet/settingsにも列固定の同種経路がある。確認したその範囲に行固定入口はなく、PRで追加済みの列固定を新機能と数えない。

**Excel/Sheets/標準の比較**: OFF-MS-09「Freeze rows or columns」はWindows desktop Excelの上側行・左側列固定。OFF-GS-06のComputer節は行数/列数を別々に指定・解除できる。両者とも表示機能の先例で、PlainSheetでのfilter併用やCSVへの保持を保証しない。2026-10-11 UTC / 10-12 JSTに再読取。

**採用メリット**: 下へ移動しても項目名や説明を参照でき、上端へ戻って確かめる往復が減る。

**採用デメリット・見送りの利点**: 固定行が多いと編集できる表示領域が狭くなる。見出し設定や編集保護と混同しやすいため、固定中の表示と解除を見つけやすくする。

**推奨理由**: 採用推奨。長い表で役立つ任意の表示機能として加え、初期値は固定なしを維持する。見出し判定を変えたい人に行固定を要求しない。

**導入時期**: 次段階：見出し意味の明確化と、基本の選択・編集整合を先に確かめてから追加

**改修目安（未実測）**: M–L：5–8人日程度の実装概算、実測ではない。Glide6.0.3の上部データ行固定対応可否を先に調査し、代替描画が必要なら再見積り。filter/選択/zoom/keyboardの統合確認を含む。

**依存**: UX-004とは表示/意味を分ける。文書session stateの器はUX-001と共有可能だが、UX-001の採用を機能採否の条件にはしない。

**決まるまでの暫定回避**: 必要なとき上端へ移動して項目を確かめる。既存の列固定だけでは縦方向の参照は代替しない。

**before / after（source説明用。実画面ではない）**

- 現在: 項目名・説明は先頭 → 下の明細へ移動 → 先頭へ戻って確認
- 改善後: 先頭2行を固定 → 明細へスクロール → 項目名・説明を参照

**固定根拠**

- [src/lib/settings.ts:5–24](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/settings.ts#L5-L24): 既存設定は列固定・見出し判定・見出し強調を別々に持つ
- [src/App.tsx:1249–1254](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L1249-L1254): 既存の列固定caller
- [src/components/GlideSheet.tsx:683–689](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/GlideSheet.tsx#L683-L689): DataEditorへ渡すのはfreezeColumns

**受入条件**

- 先頭1行・複数行・0行を指定でき、縦スクロール時も指定範囲を識別できる
- 列固定を維持したまま行だけ解除でき、行固定でuseHeaderRowや行順を変えない
- filterで除外したデータ行を固定表示で漏らさず、解除後も選択の元行参照が一致する
- 狭幅・拡大で固定部が画面全体を占めないよう制限と解除経路がある
- 変更してもdirty・CSV/TSV出力値を変えず、別タブへ固定を無断適用しない

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-028

**絞込みに名前を付けて切り替える**

- 分類: 機能改善（独立選択できる新機能）
- 優先度: P3。保留推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktopの任意ローカル補助情報。CSV相互運用、再openの文書対応付け、全OSでの永続化は未検証。
- 確度: 高：useFilterは現在の条件Map、DocumentSnapshotは単一live状態で、確認したUIに名前付き複数viewの保存/選択がない。再利用頻度は未調査。

**利用者・再現条件/合成入力**: 同じ受注明細で「東地区の未処理」と「西地区の完了」を交互に確認する。最後の状態へ戻るだけでなく、用途ごとの絞込みを名前から呼び出したい。

**現在のcaller→処理→結果**: useFilterは現在の列別Mapを更新/解除する。Appのタブ適用はfilter.clearAll。DocumentSnapshotにはrows/meta/列幅/選択/履歴があるが、名前付きviewのcollectionはない。UIで複数条件の組を名付け、保存/複製/呼出しする入口は確認できない。

**期待/改善後**: 「表示を保存」で名前とfilter条件を保存し、同一文書で複数viewの呼出し・改名・複製・削除をできるようにする。初版はfilterと列幅だけを任意のローカル補助情報に保存し、現在のview名・条件・表示件数・変更ありを示す。データ行順を変えるsortは含めない。CSV本体に埋め込まず、再open時は利用者が同じ文書を明示選択し列構成を照合してから適用する。

**反証・既存機能・限界**: UX-001はタブごとの最後のfilterをsession内で自動復元する基本動作。UX-028は利用者が意図的に複数の名前付き条件を保存/呼出す任意機能で、UX-001の再提案ではない。ローカルpathや同名filenameだけで文書同一性が保証されるとは扱わない。

**develop/PR差分**: developのAppにもタブ適用時clearAllの同種経路がある。確認できた入口に名前付きview選択はなく、PRで解消済みの状態保存機能とは数えない。

**Excel/Sheets/標準の比較**: OFF-GS-01のComputer節は複数filter viewの命名・保存・適用・複製/削除。OFF-MS-01はworksheet別の名前付きSheet ViewsだがOneDrive/SharePoint保存条件あり。OFF-MS-02のdesktop Custom Viewsにも保存/呼出しの先例がある。CSV内へview metadataを保存できる根拠でも、PlainSheetのlocal補助情報が他端末へ付いていく根拠でもない。

**採用メリット**: 繰り返し使う条件を作り直さず、用途の名前で切り替えられる。比較作業で現在どの条件を見ているか説明しやすい。

**採用デメリット・見送りの利点**: 名前や不要viewを管理する手間が増え、古い条件で新しい行を見落とす恐れがある。補助情報はCSVと別なので他端末や他アプリへ自動で付いていかず、filter値には内容に由来する情報が残る。

**推奨理由**: 保留推奨。まずタブへ戻ったときの自然な状態保持を優先し、同じ表で複数の条件を頻繁に切り替える人向けに任意追加する。CSVを開くだけの人に命名や保存管理を求めない。

**導入時期**: 後続：自動session復帰の改善後、複数viewの反復利用が必要かを見て判断

**改修目安（未実測）**: M–L：5–9人日程度の実装概算、実測ではない。view型/CRUD、補助store、文書対応付け・列変更検知・削除/適用previewを含む。sort view・共有・他端末同期は別見積り。

**依存**: UX-001は自動session復元、UX-028は明示保存した複数preset。データ共有やcloud syncは不要。UX-022のsortを勝手にviewへ含めない。

**決まるまでの暫定回避**: 既存の列filterを必要な組合せへ変更する。UX-001を先に採用しても、同一タブ内の複数preset切替までは代替しない。

**before / after（source説明用。実画面ではない）**

- 現在: 東地区・未処理を絞る → 西地区・完了へ条件変更 → 東地区を作り直す
- 改善後: 表示: 東地区の未処理 → 表示: 西地区の完了 → 名前を選んで切替

**固定根拠**

- [src/hooks/useFilter.ts:52–87](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/hooks/useFilter.ts#L52-L87): 現在の条件Mapの更新/解除だけを持つhook
- [src/hooks/useDocuments.ts:16–33](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/hooks/useDocuments.ts#L16-L33): 文書snapshotに名前付きview collectionはない
- [src/App.tsx:184–207](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L184-L207): live取得とタブ適用時のfilter消去
- [src/lib/settings.ts:5–24](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/settings.ts#L5-L24): 現在の保存設定はnamed viewを持たない

**受入条件**

- 同一文書で少なくとも2つの名前付きfilter viewを保存/改名/複製/選択/削除できる
- 呼出しでfilterと列幅を適用し、値・行順・dirty・CSV出力を変えない
- 現在のview名/条件/表示件数と保存後変更を表示し、保存済み条件を黙って上書きしない
- 列名重複・列移動/削除・列数変更・同名別文書では自動適用せず、対応確認または再設定へ進む
- 補助情報の保存場所とCSVに付属しないことを示し、保存しない利用と個別/全削除を選べる
- UX-001だけを採用した場合も自動session復帰が使え、UX-028だけを採用した場合も明示的な呼出しが使える
- viewを閉じる/全表示へ戻る経路があり、filter内に存在しなくなった値を含む場合も状態を説明する

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

## E · 任意の拡張と見送り案

### UX-017

**選んだ範囲だけを確認して整形する**

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

**決まるまでの暫定回避**: 手動編集は小さい選択範囲で確認する。既存の検索置換は選択内ではなく全体/表示行が対象なので、対象件数とUndoを確認する。

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

### UX-018

**入力ルールを任意で確かめる**

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

**採用デメリット・見送りの利点**: 入力拒否や古いルールが自由な修正を妨げることがある。CSVだけ共有してもルールが相手へ移らず、別の設定ファイル管理も増える。

**推奨理由**: まず警告だけで役立つ場面を確かめ、値を失わずに入力の違いへ気づける方法を選ぶ。

**導入時期**: 先行項目の後、需要確認して判断

**改修目安（未実測）**: L：1–2週間以上。永続化/互換は別見積り。 設計・検査上の論点：ルール管理とCSV以外の追加ファイルが増える。古いルールによる誤警告や情報共有のずれが起こる。

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

### UX-019

**セルの数式を計算する**

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

**推奨理由**: 文字列をそのまま運べる軽さを優先し、今回は計算機能を見送る。計算しないことが初見でも分かる説明は整える。

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

- 採用を再検討する場合：式と文字列を明示的に分け、=1+2の結果3と入力式をそれぞれ確認できる
- 参照先の変更で再計算し、循環参照・未対応関数・計算エラーを値の無言置換ではなく表示する
- CSVへ式を出すか計算値を出すか選択し、別名保存と再openで契約どおりの内容を確認する
- 式の編集・再計算をUndo/Redoやfilter、タブ、保存中変更と組み合わせても元値を失わない
- 今回は未実装。説明改善だけの採用と本格計算機能の採用は分けて見積り・承認する

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-020

**複数人で同時編集する**

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

**推奨理由**: アカウントや共有先を気にせず端末内で編集できる使い方を優先し、今回は同時編集を見送る。

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

- 採用を再検討する場合：共有を明示的に開始し、参加者・閲覧/編集権限・保存先を確認できる
- 同時編集の競合を検出し、無言で他人の変更を失わず解決または履歴から回復できる
- ネット切断中の編集と再接続後の反映順、重複・競合・再送を合成参加者で検査する
- 権限取消・退出・共有停止・内容/コメント/履歴の削除で何が誰に残るか検査する
- CSV単体に同期/権限/履歴は残らないことを説明し、端末内編集の通常モードを維持する
- 今回は未実装。認証・同期・保存期間・運用を別案件で承認してから開始する

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-022

**複数列の並べ替えを対象確認して実行する**

- 分類: 機能改善（独立選択できる新機能）
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通。初版は表全体の行順変更。実画面・大規模表のpreview応答は未測定。
- 確度: 高：単一列sortのcallerと全行への適用はsource確認。利用者の誤操作頻度や実画面のpreviewは未測定。

**利用者・再現条件/合成入力**: 地域ごとにまとめ、その中で数量の多い順に確認する。合成表「地域,数量,ID」にA/2/a、B/8/b、A/10/cがある。地域昇順→数量降順という優先順を一度に指定したい。

**現在のcaller→処理→結果**: 列メニューの昇順/降順→applySort(col,direction)→sortRows(sheet.rows,col,direction,{headerRow})が全データ行の順番を変更する。sortRowsは単一比較列、空値末尾、同値時は入力順を保持。Undo記録は既存。優先キーの一覧や適用前の対象previewはこの経路にない。

**期待/改善後**: 「詳しく並べ替え」で優先キーを追加・削除・上下移動し各方向を選ぶ。初版の対象は表全体とし、ファイル名・全列を一緒に動かすこと・対象行数・見出し扱い・非表示行を含むこと・先頭数行の結果を表示して適用する。選択中の列だけを分離して並べる機能は加えない。既存の単一列quick sortは残す。

**反証・既存機能・限界**: 現行sortが壊れているという提案ではない。安定sortを副キーから主キーの順に繰り返す回避は可能。ただし優先順を利用者が管理する必要がある。数値精度はUX-015の別項目。previewがExcel/Sheetsに同じ形で存在するとは主張しない。

**develop/PR差分**: developにもapplySort(col,direction)と全行への同種callerがある。PRによるsort追加/既存修正を再提案せず、複数キーと適用前確認だけを追加対象とする。

**Excel/Sheets/標準の比較**: OFF-MS-18のWindows節「Sort by more than one column or row」はAdd Levelと優先順変更。OFF-GS-01のComputer節はAdvanced range sorting optionsと追加sort列を説明。対象preview・hidden行の明示・一括Undoは今回のPlainSheet案であり、競合資料から保証しない。

**採用メリット**: 「地域→数量」の意図を見ながら一度に実行でき、別の列を繰り返し並べる順番を覚えずに済む。行の関連を保って対象を確かめられる。

**採用デメリット・見送りの利点**: 設定が多くなり、単純な昇順だけの利用者には余計な手順となる。非表示行を含む並替えは画面外も変えるため、対象を読み飛ばすと意外性が残る。

**推奨理由**: 採用推奨。複数キーを使いたいときだけ開く詳細操作にし、普段の単一列操作は短いままにする。保存される行順が変わることを適用前に示す。

**導入時期**: 次段階：数値比較と見出し扱いを先に確定し、任意の詳細操作として追加

**改修目安（未実測）**: M：4–7人日程度の実装概算、実測ではない。既存比較器を複数キーへ分離し、優先順・対象preview・snapshot guard・Undoを確認。UX-015の修正工数は別計上。

**依存**: UX-015の精度修正とUX-004の見出し説明を先行。UX-028の保存viewを採らなくても単独で利用できる。

**決まるまでの暫定回避**: 既存の安定sortを副キーから主キーへ順に実行し、行の関連と見出し設定を確認する。

**before / after（source説明用。実画面ではない）**

- 現在: 数量を降順 → 次に地域を昇順 → 優先順を自分で管理
- 改善後: 優先1: 地域 昇順 → 優先2: 数量 降順 → 対象と結果を確認・適用

**固定根拠**

- [src/App.tsx:1229–1238](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L1229-L1238): 列メニューから単一列sortへ
- [src/App.tsx:766–772](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L766-L772): 全行の並替えとUndo記録
- [src/lib/sort.ts:5–17](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/sort.ts#L5-L17): 単一列の引数とheader option
- [src/lib/sort.ts:38–67](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/sort.ts#L38-L67): 空値・同値順序と全列を含む行移動

**受入条件**

- 例の結果がA/10/c、A/2/a、B/8/bとなり、優先キーの順を変えるとpreviewも変わる
- 見出し有無・対象文書・全データ行数・非表示行を含む範囲を適用前に表示する
- 各行の全列を一緒に移動し、全キー同値なら元の順序を維持する
- 取消では値・順序・dirtyを変えず、適用は1回のUndoで戻せる
- preview後にデータ・列構造・対象タブが変わった場合は再確認し、古い対象へ適用しない
- 空値・長い番号・日本語の比較説明を示し、UX-015の数値精度受入を回帰させない

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-024

**メニューをキーボードで開き元の場所へ戻る**

- 分類: 機能改善（独立選択できる新機能）
- 優先度: P2。採用推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Web / desktop共通案。Windows/macOS/Linux、ブラウザ、screen reader、実canvasのキー生成・focusは未検証。
- 確度: 中〜高：アプリ所有のキー入口とclose callbackを確認。Glide/OSが生成するcontextmenuと実focus伝播は未観察。

**利用者・再現条件/合成入力**: マウスを使わず選択列のfilterを開き、値を選んで適用し、そのまま表の移動を続ける。途中でEscを押したときは未適用の条件を取り消して元の場所へ戻りたい。

**現在のcaller→処理→結果**: GlideSheetはcell/headerのcontextmenuとheader menu clickをAppへ渡す。アプリのhandleKeyDown/captureに明示的なContextMenu key/Shift+F10入口は見当たらない。開いたContextMenuには初期focus・上下矢印・Escがあり、FilterPopoverにも入力focus・Esc・取消・適用がある。Appのclose callbackはstateをnullにするだけで、呼出し元への明示focus復帰はこの経路にない。

**期待/改善後**: 選択対象を保ったままContextMenu key/Shift+F10等の検証済みキーとfocus可能な「列の操作」buttonから開けるようにする。filter内は通常の入力/checkbox/適用buttonをkeyboardで操作し、Escは未適用変更を捨てる。適用/取消後は呼出し元へ戻し、行がfilterで消えた場合は同じ列の見えるセルへ戻ったことを知らせる。

**反証・既存機能・限界**: 「keyboardで全く操作できない」「Escがない」という欠陥主張はしない。Glide/ブラウザがShift+F10をcontextmenuへ変換する可能性は実機で反証が必要。追加範囲は発見可能な入口と対象保持・focus復帰を保証する一連の契約。popoverを無条件にmodal化してfocusを閉じ込めない。

**develop/PR差分**: developのApp/GlideSheet読取範囲でも明示的なContextMenu key/Shift+F10分岐はない。PRで追加済みのmenu内keyboard対応を維持し、開閉の契約だけを拡張する。

**Excel/Sheets/標準の比較**: OFF-GS-02はSheetsのcontext menuキー、OFF-MS-21はExcelのplatform別context menu入口を掲載。OFF-W3C-06はmenu buttonのEnter/Space開始、OFF-W3C-07はEsc後の呼出し元focusを示す。filter dialog内をmenuと同じ矢印動作にする根拠ではなく、APGだけでWCAG適合を判定しない。

**採用メリット**: マウスへ持ち替えず絞込みや列操作を完了でき、取消後の入力先を探し直さずに済む。

**採用デメリット・見送りの利点**: 新しいキーを覚える負担があり、OSや支援技術のキーと重なる場合もある。filterで元の行が消えると復帰先が変わるので、場所の案内が必要。

**推奨理由**: 採用推奨。キーだけに依存しない名前付き入口を用意し、開く・選ぶ・取消す・戻るまで続けて使えることを重視する。既存のEscや矢印を別機能として増やさない。

**導入時期**: 先行候補：keyboard入口の実機反証後、日常操作の一連の流れとして追加

**改修目安（未実測）**: M：3–6人日程度の実装概算、実測ではない。Glideイベントの実機確認、focus origin保持、IME/支援技術/OSキーの検証はここに含む。

**依存**: UX-025とキー名称を共通化できる。UX-026のpaletteを導入しなくても独立したkeyboard入口を提供する。

**決まるまでの暫定回避**: 現行は列menuをpointerで開いた後、menuの矢印キーやfilterのTab/checkboxを使う。閉じた後は表のセルを明示選択する。

**before / after（source説明用。実画面ではない）**

- 現在: 列メニューからfilter → 値選択・適用/Escは既存 → キー入口と復帰は要確認
- 改善後: 選択列の操作をキーで開く → 条件を選ぶ・適用/取消 → 表の同じ列へ戻る

**固定根拠**

- [src/components/GlideSheet.tsx:552–593](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/GlideSheet.tsx#L552-L593): アプリ所有のgrid key capture範囲
- [src/components/GlideSheet.tsx:701–726](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/GlideSheet.tsx#L701-L726): 既存のcontext/header menu入口
- [src/components/ContextMenu.tsx:82–96](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/ContextMenu.tsx#L82-L96): 初期focusは既存
- [src/components/ContextMenu.tsx:261–294](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/ContextMenu.tsx#L261-L294): 矢印・Esc・実行後closeは既存
- [src/components/FilterPopover.tsx:81–86](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/FilterPopover.tsx#L81-L86): filterのEscは既存
- [src/components/FilterPopover.tsx:156–173](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/FilterPopover.tsx#L156-L173): 取消と適用は既存
- [src/App.tsx:1256–1262](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L1256-L1262): filter closeはstate解除

**受入条件**

- gridのセル/列選択からマウスなしで正しい対象のmenuを開き、最初の利用可能項目へfocusする
- menuの矢印/Enter・filterのTab/Space/適用で値を選択でき、focus位置が視認できる
- filterの未適用checkbox変更をEsc/取消で捨て、元の適用条件は変えない
- 適用後と取消後に呼出し元へ戻り、元の行が非表示なら同じ列の見える対象を明示する
- menuからfilterや確認dialogへ移る途中でgridへfocusを奪い返さない
- IME変換中のキーや入力欄の通常操作を妨げず、予約キー競合時も名前付きbuttonで到達できる

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

### UX-027

**任意のローカル復元下書きを残す**

- 分類: 機能改善（独立選択できる新機能）
- 優先度: P2。保留推奨 / 利用者採否: 未選択
- source: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 環境: Webとdesktopの保存領域・消去条件は別設計。全OS、private mode、storage eviction、クラッシュ/停電の実機評価は未実施。
- 確度: 高：文書のin-memory state、settingsの永続化、通常保存callerを確認。調査範囲で文書復元store/復元UIは未検出。実クラッシュでの損失頻度は未測定。

**利用者・再現条件/合成入力**: CSVをしばらく編集した後、アプリやブラウザが予期せず終了する。元ファイルを勝手に上書きせず、最後に残った編集内容を確認して救出したい。一方で機密の表を端末へ余分に残したくない場合もある。

**現在のcaller→処理→結果**: useDocumentsはrows/meta/historyをuseStateで保持し、settingsはlocalStorageへ保存する。通常保存はuseFile→Web downloadまたはdesktop write_file。beforeunloadと終了確認は既存だが、確認したsrc/src-tauriの保存・state経路に文書内容の定期復元storeや再起動時の復元選択UIは見当たらない。FormulaBarのdraftは編集用メモリで復元保存とは別。

**期待/改善後**: 初期OFFの「この端末に復元用下書きを残す」を追加する。保存場所・残る内容・有効期限・容量上限を選択時に示し、確定済み編集のsnapshotだけを元ファイルと別領域へ保存。再起動時は文書名・snapshot時刻・失われうる直近編集を示して「復元コピーを開く/削除/後で」を選ぶ。復元コピーは元pathへ自動紐付けせず別名保存を初期経路にする。個別/全削除、OFF時削除、期限切れ整理を提供する。

**反証・既存機能・限界**: 現行終了確認がない、通常保存が無効、という指摘ではない。OS/browser独自の復旧やファイルシステムbackupの有無までは調べていない。復元はbest effortでありAutoSave/backup保証ではない。UX-005の保存して閉じるとは用途も採否も分ける。

**develop/PR差分**: developのApp/settings/useFile読取範囲にも通常の文書state・設定保存・手動保存があり、復元store入口は未確認。PRの終了guard追加を尊重し、その外側の任意の復元機能を提案する。

**Excel/Sheets/標準の比較**: OFF-MS-19の「Saved to your device」はAutoRecover有効時のDocument Recoveryを説明し、手動保存も推奨する。OFF-GS-05はSheetsのonline自動保存を説明するが、それは今回の端末内・任意・期限付き下書きと異なる契約。両者と同じ回復保証を約束しない。

**採用メリット**: 予期しない終了後にも最後に残った編集を確認でき、元ファイルを守ったまま作業を救出できる可能性が増える。

**採用デメリット・見送りの利点**: 元ファイル以外に表の内容が端末へ残り、共有端末や機密作業では露出と削除管理の負担が増える。古いsnapshotを最新版と思い込む危険があり、期限切れ・容量不足では戻せない場合もある。

**推奨理由**: 保留推奨。復元の安心と、端末に内容を残さない選択の両方が必要。採る場合は初期OFF・期限/削除の見える化・元ファイルの自動上書き禁止をひとまとまりの条件にする。

**導入時期**: 後続：保持する内容・期間・削除操作について利用者の選択を固めてから判断

**改修目安（未実測）**: L：8–15人日程度の実装概算、実測ではない。Web/desktop別store、schema/version、原子的snapshot、容量/破損/期限/削除、復元copy、異常終了fixtureを含む。OS/browserの永続性保証は別途評価。

**依存**: UX-003/005/012の通常保存状態と混同しない表示が先行。個別の復元機能であり、UX-020のcloud共同編集や常時uploadを前提にしない。

**決まるまでの暫定回避**: 途中で明示的に保存する。Webはdownload先の実ファイルを確認し、必要なら別名のcopyを手元に残す。

**before / after（source説明用。実画面ではない）**

- 現在: 編集内容はメモリ内 → 予期しない終了 → 最後の手動保存を開く
- 改善後: 復元下書き: 任意でON → 時刻・期限を見て選ぶ → 復元コピー / 削除

**固定根拠**

- [src/hooks/useDocuments.ts:16–33](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/hooks/useDocuments.ts#L16-L33): 文書内容のsnapshot型
- [src/hooks/useDocuments.ts:63–70](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/hooks/useDocuments.ts#L63-L70): 文書workspaceはReact state
- [src/lib/settings.ts:5–24](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/settings.ts#L5-L24): 永続化設定の対象
- [src/lib/settings.ts:84–108](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/settings.ts#L84-L108): settingsのみのlocalStorage経路
- [src/App.tsx:148–161](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx#L148-L161): 既存beforeunload警告
- [src/hooks/useFile.ts:107–151](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/hooks/useFile.ts#L107-L151): 通常のWeb保存はdownload
- [src/hooks/useFile.ts:153–180](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/hooks/useFile.ts#L153-L180): desktopの明示保存はwrite_file

**受入条件**

- OFFのままでは文書内容を新しい復元領域へ書かず、ONにする前に内容・場所・期限・容量と限界が読める
- snapshotは元ファイルと別で、復元しても自動上書きや保存済み扱いをしない
- 復元候補を文書名・時刻・期限で区別し、復元copyの保存は別名保存を初期経路にする
- 個別削除・全削除・OFF時の削除を実行でき、期限切れは次回起動/動作中に整理し、アプリ未起動中に必ず削除されるとは表示しない
- 容量超過・書込失敗・破損時は通常編集を維持し、下書きが残ったという虚偽の成功表示をしない
- 異常終了後の復元は最後に完了したsnapshotまでと明示し、未確定IME/直近入力が戻ると保証しない
- 元ファイルが外部で更新済みでも復元copyを隔離し、元ファイルへの保存は明示的な利用者判断を必要とする
- Web download開始だけで復元下書きを消さず、ユーザーの明示破棄/削除と整合させる

**未検証**: 製品実画面/実clipboard/OS native/実IME/支援技術/製品表示幅/性能。該当条件で上の受入検査を行う。sourceや合成モデルだけでPASSにしない。

## 実装開始前の判断

1. UX-013/008/014の実canvas・clipboard経路を合成表で再現し、採用する境界/形式契約を決める。新しい製品起動や改修は今回の権限に含まない。
2. UX-009/010はtable/string設計を維持する方針が手元から支持された。予告と別名保存を先にし、型保持・文書全体編集を自動採用しない。
3. UX-001/004/018はmetadataの寿命を決める。sessionから始める案、端末local、明示sidecarを比較し保存/解除のUIを省かない。
4. すべての変更で繰返し操作、cancel、失敗、タブ移動中の完了、Undo、filter、IME境界を検査する。公式例と似たラベルを付けるだけで問題を解いたことにしない。
5. 利用者はHTMLで採用/保留/見送りとメモを選び、全件MDを書出して戻せる。未選択やメモだけの回答を採用と推測しない。

## 公式比較のURL・参照節（確認日2026-10-11 UTC）

- **OFF-MS-01** [Worksheet-scoped Sheet Views](https://support.microsoft.com/en-us/excel/create-and-manage-sheet-views-in-excel) — “Add a Sheet View”; “Using a Sheet View”; “About differences between Sheet Views on Excel platforms”; “Frequently Asked Questions”.。対象: Excel desktop/Mac/Web等。OneDrive/SharePointの条件あり。。対応: UX-001 / UX-028。Sheet Viewsはsort/filterを名前つきで保存し、active worksheetのviewを選ぶ。 限界: 全タブのscroll/selection自動復元の証拠ではない。local copyでは利用制限あり。
- **OFF-MS-02** [Desktop Custom Views](https://support.microsoft.com/en-us/excel/create-apply-or-delete-a-custom-view) — introduction; “Create a custom view”; “Apply a custom view”.。対象: Windows desktop ExcelのCustom Views。。対応: UX-001 / UX-028。選択・filter・表示設定をworksheetに属するviewへ保存できる。 限界: 明示保存viewであり自動復元ではない。Excel tableがあるworkbookでは制限。
- **OFF-GS-01** [Filters, saved filter views, and header-aware sorting](https://support.google.com/docs/answer/3540681?co=GENIE.Platform%3DDesktop&hl=en) — “Filter your data”; “Create, save, delete, or share a filter view”; “Find an existing filter view”; “Sort data in alphabetical or numerical order”.。対象: Google Sheets Computer/browser。。対応: UX-001 / UX-004 / UX-015 / UX-022 / UX-028。filter viewの保存・再利用、sort時のData has header row、header freezeの別手順を記載。 限界: 自動header判定や全view状態の自動復元を保証しない。
- **OFF-MS-03** [Find/Replace controls and scope](https://support.microsoft.com/en-us/excel/get-started/find-or-replace-text-and-numbers-on-a-worksheet) — Windows “Find” / “Replace”; macOS “Find text or numbers from the Search bar”; Web “Find” / “Replace”.。対象: Excel Windows/Mac/Webの節を区別。。対応: UX-002 / UX-007 / UX-011 / UX-023。Find/Replace、件数/移動、case/whole-cell/scopeの選択を説明。MacとWindowsでキーの意味が異なる。 限界: 開いたpanelへの再shortcut focusやregex互換の証拠ではない。
- **OFF-GS-02** [Computer keyboard shortcuts](https://support.google.com/docs/answer/181110?co=GENIE.Platform%3DDesktop&hl=en) — “PC shortcuts”; “Mac shortcuts”; “Chrome OS shortcuts”; “Use other spreadsheet shortcuts”.。対象: Sheets PC/Mac/ChromeOSの各shortcut表。。対応: UX-002 / UX-008 / UX-013 / UX-024 / UX-025。Find/Replace・copy/paste・fill down/right等をplatform別に示す。Macの置換はCommand+Shift+H。 限界: shortcutの伝播、繰返しfocus、OS clipboardの完全互換を保証しない。
- **OFF-GS-03** [Search/Replace regex and capture references](https://support.google.com/docs/answer/62754?co=GENIE.Platform%3DDesktop&hl=en) — “Use find and replace in a spreadsheet”; “Replace with regular expressions”; “Regular expressions”.。対象: Google Sheets Computer Find/Replace。Docsとは区別。。対応: UX-007 / UX-011 / UX-023。正規表現置換に$1/$2のcapture参照例がある。case/full-cell/formula検索の選択もある。 限界: JavaScript regexとSheets RE2は完全互換ではない。
- **OFF-GS-04** [REGEXREPLACE function restrictions](https://support.google.com/docs/answer/3098245?hl=en) — “Notes”.。対象: Sheets REGEXREPLACE関数。。対応: UX-007 / UX-019。RE2を利用しUnicode character class等に制限。text入出力の関数契約。 限界: 関数の数値制限を一般Find/Replace全体へ拡張しない。
- **OFF-GOOGLE-RE2-01** [Engine restrictions](https://github.com/google/re2/blob/main/doc/syntax.txt) — “Grouping”; “Empty strings”; “Escape sequences”.。対象: Google RE2公式engine source。。対応: UX-007。capture groupは対応、pattern backreferenceやlookaroundは非対応。 限界: pattern参照とreplacement $1は別。host側の全挙動を保証しない。
- **OFF-MS-04** [Save versus Save As](https://support.microsoft.com/en-us/excel/save-your-workbook) — introduction; “Turn on AutoRecovery”.。対象: Windows desktop Excel。。対応: UX-003 / UX-005 / UX-012。Saveは既存場所への更新、Save Asは初回・別場所・別copy。AutoRecoveryとは区別。 限界: Webのlocal上書きや特定の終了dialogを証明しない。
- **OFF-MS-05** [Excel Web autosave, online copy, download](https://support.microsoft.com/en-us/accessibility/excel/basic-tasks-using-a-screen-reader-with-excel) — Web “Save your work”; “Save a copy online”; “Rename a workbook”; “Save a copy to your computer”.。対象: 長いページ内のExcel Web節。。対応: UX-003 / UX-005 / UX-012。自動保存、online copy、rename、computerへのdownloadを分けて説明。 限界: ローカル元ファイルへのwrite-backではない。
- **OFF-MS-06** [AutoSave changes the close/discard model](https://support.microsoft.com/en-us/office/collab-files/what-is-autosave) — introduction; “What happened to File > Save As?”; “I'm a subscriber with the latest version of Office. Why is AutoSave disabled?”。対象: Microsoft365 Windows/Mac、対応cloud保存先。。対応: UX-005 / UX-020。AutoSaveは適格なOneDrive/SharePointファイルへ継続保存。Save a Copyとlocal保存を区別。 限界: すべてのdesktop/local/Webファイルで同一ではない。
- **OFF-MS-07** [Closing with AutoSave is not a discard operation](https://support.microsoft.com/en-us/office/collab-files/what-you-should-know-about-autosave) — “Changing Workflows”.。対象: Office AutoSave workflow。。対応: UX-005。AutoSave中は閉じて破棄するつもりでも変更済みになっていることを注意喚起。 限界: すべてのappに保存/破棄/取消dialogを強制する資料ではない。
- **OFF-GS-05** [Automatic save, copy, download](https://support.google.com/docs/answer/49114?co=GENIE.Platform%3DDesktop&hl=en-Link) — “Save a file”; “Make a copy of a file”; “Download a copy of a file”.。対象: Google Docs Editors Computer、Sheetsを含む。。対応: UX-003 / UX-005 / UX-012 / UX-020 / UX-027。online自動保存、copy、downloadを別操作で説明。Sheetsではcell編集を確定する手順にも言及。 限界: 元localファイル上書きや全exit前の永続化完了を保証しない。
- **OFF-MS-08** [Header semantics are explicit](https://support.microsoft.com/en-us/excel/get-started/create-and-format-tables?wt.mc_id=otc_excel) — Windows/macOS table-creation steps; Web table-creation steps.。対象: Excel Windows/Mac/Webのtable作成。。対応: UX-004。table作成時にheader有無を選ぶ。Webはheaderなしのデータに列名を補う。 限界: CSV自動判定やfreezeとheaderの同一視を支持しない。
- **OFF-MS-09** [Freeze panes are geometric](https://support.microsoft.com/en-us/excel/get-started/freeze-panes-to-lock-rows-and-columns) — “Freeze rows or columns”.。対象: 掲載対象のWindows desktop Excel。。対応: UX-004 / UX-021。選択の上の行・左の列を固定する。行/列は独立した表示操作。 限界: header認識、編集保護、Web固有UIの証拠ではない。
- **OFF-GS-06** [Independent row/column freezing](https://support.google.com/docs/answer/9060449?co=GENIE.Platform%3DDesktop&hl=en) — “Freeze, group, hide, or merge rows & columns” (opening freeze procedure).。対象: Sheets Computer/browser。。対応: UX-004 / UX-021。View > Freezeで行数/列数を指定し、各軸の固定を解除できる。 限界: sortで先頭を除く意味とは別。
- **OFF-MS-10** [Desktop legacy text-encoding import](https://support.microsoft.com/en-us/excel/text-import-wizard) — introduction; “Step 1 of 3”.。対象: Windows desktopのlegacy Text Import Wizard。。対応: UX-006。Step1のFile originで文字集合を指定しpreviewを見られる。 限界: このlegacy UIをExcel WebのUIとしない。
- **OFF-MS-11** [Excel Web Text/CSV import exists](https://support.microsoft.com/en-us/excel/use-power-query-in-excel-for-the-web) — opening note; “Import data”; “Load your data”.。対象: Excel Web Power Query。plan/機能条件あり。。対応: UX-006。Data > Get DataにText/CSVがあり、gridへ読み込める。 限界: 全accountで同じ利用可否やencoding pickerがあるとは未確認。
- **OFF-MS-12** [Power Query encoding, delimiter, and type preview](https://learn.microsoft.com/en-us/power-query/connectors/text-csv) — “Summary”; “Connect from Power Query Desktop”; “Connect from Power Query Online”; “Additional information” > “Unstructured text” / “CSV”.。対象: Power QueryのText/CSV connector。hostに差あり。。対応: UX-006 / UX-009 / UX-015。File Origin、delimiter、型検出選択、text維持の選択を説明。 限界: Power Query Online全体の仕様をExcel Web固有画面と同一視しない。
- **OFF-MS-13** [CSV opening and lossy export](https://support.microsoft.com/en-us/excel/get-started/import-or-export-text-txt-or-csv-files) — “Import a text file by opening it in Excel”; “Import a text file by connecting to it (Power Query)”; “Export data to a text file by saving it”.。対象: Windows desktop Excel text/CSV import/export。。対応: UX-009 / UX-010 / UX-015 / UX-019。直openの自動型解釈に注意。text exportはactive worksheetと非対応機能の制約がある。 限界: PlainSheet JSON/Markdown保存の仕様を直接証明する資料ではない。
- **OFF-MS-14** [UTF-8 BOM handling](https://support.microsoft.com/en-us/excel/opening-csv-utf-8-files-correctly-in-excel) — main procedure (untitled).。対象: Excel。手順はPowerQuery/desktop-style importを含む。。対応: UX-006。UTF-8+BOMなら通常open可能と説明。BOMなしではimport経路を案内。 限界: BOMを付ければ任意文字コードが直るわけではなく、すべてのWeb環境を保証しない。
- **OFF-MS-15** [Clipboard visibility depends on structure/platform](https://support.microsoft.com/en-us/excel/copy-visible-cells-only) — Windows procedure; Web explanatory paragraphs.。対象: Excel WindowsとWebの節を分ける。。対応: UX-008。visible cells only、Web通常rangeとfiltered tableでcopyの扱いが違う。 限界: 一律Excel互換のvisible copy規則を作らない。Sheetsの対応保証は未取得。
- **OFF-GS-07** [Accessible grid and selection orientation](https://support.google.com/docs/answer/1632199?hl=en-en) — “Move around in your spreadsheet”; “Hear cell formatting and contents”; “Select cell ranges”; “Filter your data”.。対象: Sheets Computer+screen reader、OS別shortcut。。対応: UX-014 / UX-016 / coverage a11y。cell address/content、selection、filterに入る/出る時と表示行数のorientationを説明。 限界: PlainSheetの実reader合格を示す資料ではない。
- **OFF-W3C-01** [Modal dialog keyboard/focus pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — “Keyboard Interaction”; “Note”; “WAI-ARIA Roles, States, and Properties”.。対象: Webのmodal dialog authoring guidance。。対応: UX-005 / coverage a11y。初期focus、Tab循環、Escape、終了後focus復帰、accessible nameを示す。 限界: APGはそれ自体WCAG適合規格ではない。modeless検索やpopoverへ一律trapを要求しない。
- **OFF-W3C-02** [Interactive grid keyboard model](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) — “Data Grids For Presenting Tabular Information”; “Keyboard Interaction For Data Grids”; “Keyboard Interaction - Setting Focus and Navigating Inside Cells”.。対象: ARIA data grid authoring guidance。。対応: UX-014 / UX-016 / coverage a11y。grid内のfocus管理、keyboard移動、selectionとeditingの切替を説明。 限界: filter clipboardや再検索focusの独自契約を定めていない。
- **OFF-W3C-03** [Keyboard operability](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) — “Success Criterion (SC)”; “Intent”.。対象: WCAG2.2 SC2.1.1のUnderstanding。。対応: UX-011 / coverage a11y / UX-024 / UX-026。機能をkeyboard interfaceから操作できることの趣旨を説明。 限界: Excelと同じshortcutを要求しない。sourceだけで適合判定しない。
- **OFF-W3C-04** [Visible keyboard focus](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) — “Success Criterion (SC)”; “Intent”.。対象: WCAG2.2 SC2.4.7のUnderstanding。。対応: UX-011 / coverage a11y / UX-024 / UX-026。keyboard focusが見える必要性を説明。 限界: 特定の色や装飾を要求せず、実画面の検査が必要。
- **OFF-MS-17** [Keyboard shortcuts in Excel](https://support.microsoft.com/en-us/accessibility/excel/keyboard-shortcuts-in-excel) — macOS > Frequently used shortcuts / Work in windows and dialog boxes。対象: Excel macOSの節。対応: UX-002 / coverage日本語・OS / UX-025。置換はCtrl+HまたはCommand+Shift+H、Command+HはExcelを隠す操作。WindowsやWebの節を混ぜない。 限界: OS設定・keyboard配列・browserによる干渉は実機検証が必要。PlainSheetの全キー互換を保証しない。
- **OFF-GS-08** [Split text, remove duplicates, or trim whitespace](https://support.google.com/docs/answer/6325535?hl=en) — Split data into columns / Remove rows with repeat data / Remove extra spaces。対象: Sheets Computer。対応: UX-008 / UX-017。選択したデータの区切り変更、比較列/headerを選ぶ重複削除、空白trim。NBSPはtrim対象外。 限界: diff preview・1Undo・hidden rowの扱い・clipboard解析はこの資料から保証しない。
- **OFF-GS-09** [Create an in-cell dropdown list](https://support.google.com/docs/answer/186103?hl=en) — Create a dropdown list steps 3–4 / Change or delete a dropdown list。対象: Sheets Computer。対応: UX-018。ruleを範囲へ作り、候補外の拒否を警告へ切り替えられる。ruleの編集/削除が可能。 限界: 任意regex検証やbulk paste原子性、CSV/sidecar保存の根拠ではない。
- **OFF-MS-16** [Keeping leading zeros and large numbers](https://support.microsoft.com/en-us/excel/keeping-leading-zeros-and-large-numbers) — Convert numbers to text / Use Power Query / Excel only has 15 digits of precision。対象: 掲載Excel desktop系列。機能ごとのversion条件あり。。対応: UX-015 / UX-017。自動数値変換による先頭0や長い番号の扱いを説明し、text取込を案内する。 限界: Excelの15桁制限をPlainSheetの保存値破壊と混同しない。PlainSheetは比較時Number化が別論点。
- **OFF-W3C-05** [File API Blob.text](https://w3c.github.io/FileAPI/#dom-blob-text) — §3.3.3 The text() method。対象: 標準Web API Blob/File。対応: UX-006。Blob.textはbytesをUTF-8 decodeして返す。 限界: 具体的製品UIの成功や正しい元encoding推測を保証しない。
- **OFF-WHATWG-01** [Encoding Standard UTF-8 decode](https://encoding.spec.whatwg.org/#utf-8-decode) — UTF-8 decode。対象: Web encoding algorithm。対応: UX-006。先頭UTF-8 BOMを処理し、errorを置換してdecodeする。 限界: BOM書出しの製品機能有無は別sourceで確認する。
- **OFF-GLIDE-01** [Glide6.0.3 fixed source](https://github.com/glideapps/glide-data-grid/blob/2abe757e65cc7c38ab4f9464c229db27be4c1a8e/packages/core/src/data-editor/data-editor.tsx) — physical lines2101–2186 / 2204–2212 / 1268–1277。対象: PlainSheet lockが解決するGlide6.0.3。対応: UX-013 / UX-016。fillDestinationにseedを含む範囲、preventDefault後の標準処理不実行、fillDown/R、visible ordinal markerを確認。 限界: 実canvas実行の証拠ではない。Web整形行番号をGitHub物理行に流用しない。
- **OFF-MS-18** [Multiple-key sorting in Excel](https://support.microsoft.com/en-us/excel/sort-data-in-a-range-or-table-in-excel) — Windows > Sort by more than one column or row。対象: Excel Windows desktopの複数キーsort手順。Web節と区別。。対応: UX-022。Sortで優先列・方向を選び、Add Levelで条件を追加、上下で優先順を変える。 限界: PlainSheetの対象preview、非表示行の扱い、一括Undoを直接定めるものではない。Excelの型・色sortを複製する提案でもない。
- **OFF-MS-19** [Device AutoRecover versus cloud AutoSave](https://support.microsoft.com/en-us/office/collab-files/save-back-up-and-recover-a-file-in-microsoft-office) — Back up and recover your files > Saved to your device / Saved to OneDrive。対象: 掲載Office Windows desktop系列、Excelを含む。保存先ごとの説明を区別。。対応: UX-027。端末保存ではAutoRecover有効時に予期しない終了後のDocument Recoveryを説明。手動保存も引き続き推奨。cloud AutoSave/Version Historyとは別。 限界: PlainSheetの期限・削除・snapshot間隔・回復保証やCSVの全挙動を証明しない。初期OFF等は今回の設計案。
- **OFF-MS-20** [Command search and a collapsible entrypoint](https://support.microsoft.com/en-us/office/foundations-experiences/find-what-you-need-with-search-in-microsoft-365-apps) — introduction; Get started quickly on the web; Resizing the search box。対象: 冒頭はWindows版Microsoft365 apps、Excelを含む。Web節の機能説明も掲載されるがplatformを混同しない。。対応: UX-026。操作・help等を検索できる入口、Alt+Q、最近の操作、検索boxをiconへ畳む設定を説明。 限界: PlainSheetのlocal-only検索、全OSでのAlt+Q、AI不要の実装を保証しない。人/ファイル/cloud検索まで取り込む提案ではない。
- **OFF-MS-21** [Platform-specific keyboard entry into Excel menus](https://support.microsoft.com/en-us/accessibility/excel/keyboard-shortcuts-in-excel) — Windows > Frequently used shortcuts / Work in the ribbon with the keyboard; macOS > Work in cells or the Formula bar; Web > Frequently used shortcuts。対象: Excel Windows/macOS/Webの各menu入口。OFF-MS-17のMac置換キーとは参照節を分ける。。対応: UX-024。context menuのShift+F10とWindows Menu key等をplatformごとに掲載。Windowsでは選択buttonのmenuをAlt+Downで開く。 限界: Glide/PlainSheetの実イベント発火やscreen reader動作を保証しない。Power Pivot限定のfilter手順を通常gridへ一般化しない。
- **OFF-GS-10** [Sheets tool finder as an alternate command route](https://support.google.com/docs/answer/13466905?hl=en) — introduction; Find tools & features。対象: Google Docs/Sheets/Slides/VidsのComputer向けtool finder。。対応: UX-026。menu項目・toolの検索入口をtoolbar/Helpに置き、PC/ChromeOSはAlt+/、MacはOption+/を案内。 限界: PlainSheetの特定キー互換・offline実装・狭幅での適合を証明しない。提案は操作名検索に限定。
- **OFF-W3C-06** [Keyboard entry into a menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) — Keyboard Interaction; WAI-ARIA Roles, States, and Properties。対象: Webのmenu button authoring guidance。。対応: UX-024。buttonへのfocus中にEnter/Spaceでmenuを開き最初の項目へfocus。aria-haspopup/expanded等の意味を説明。 限界: menu buttonのpatternであり、filter内checkboxの全操作をmenu化する根拠ではない。APGだけでWCAG適合としない。
- **OFF-W3C-07** [Menu cancellation and return to the invoking context](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) — Keyboard Interaction > Escape; Note item 3。対象: Webのmenu/menubar authoring guidance。。対応: UX-024。Escでmenuを閉じ呼出し元の要素/文脈へfocusを戻す。context action後のEnterでeditor等へ戻す例も説明。 限界: filter dialogに一律focus trapを要求しない。実製品のfocus伝播やOSキー合格の証明ではない。
