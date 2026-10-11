---
type: reference
status: draft
tags: [ux-research, plainsheet]
owner: dots
review_status: draft
last_reviewed: 2026-10-12
---

# P-20261011-013 PlainSheet：公式出典台帳

確認日は公開/更新日ではない。初回27件は2026-10-11 UTC（同日JST）、追加Google/Microsoft4ページは2026-10-11 15:05:50–15:05:58 UTC / 2026-10-12 00:05:50–00:05:58 JST。BOMページは同じOFF-MS-14を再確認して重複計上しない。出典数は下の個別entryを正とする。追加8提案の参照資料も別記した。実競合画面は操作していない。

## OFF-MS-01 Worksheet-scoped Sheet Views

- URL: [Worksheet-scoped Sheet Views](https://support.microsoft.com/en-us/excel/create-and-manage-sheet-views-in-excel)
- 参照節: “Add a Sheet View”; “Using a Sheet View”; “About differences between Sheet Views on Excel platforms”; “Frequently Asked Questions”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Excel desktop/Mac/Web等。OneDrive/SharePointの条件あり。
- 支持するID: UX-001 / UX-028
- 確認した内容: Sheet Viewsはsort/filterを名前つきで保存し、active worksheetのviewを選ぶ。
- 限界: 全タブのscroll/selection自動復元の証拠ではない。local copyでは利用制限あり。

## OFF-MS-02 Desktop Custom Views

- URL: [Desktop Custom Views](https://support.microsoft.com/en-us/excel/create-apply-or-delete-a-custom-view)
- 参照節: introduction; “Create a custom view”; “Apply a custom view”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Windows desktop ExcelのCustom Views。
- 支持するID: UX-001 / UX-028
- 確認した内容: 選択・filter・表示設定をworksheetに属するviewへ保存できる。
- 限界: 明示保存viewであり自動復元ではない。Excel tableがあるworkbookでは制限。

## OFF-GS-01 Filters, saved filter views, and header-aware sorting

- URL: [Filters, saved filter views, and header-aware sorting](https://support.google.com/docs/answer/3540681?co=GENIE.Platform%3DDesktop&hl=en)
- 参照節: “Filter your data”; “Create, save, delete, or share a filter view”; “Find an existing filter view”; “Sort data in alphabetical or numerical order”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Google Sheets Computer/browser。
- 支持するID: UX-001 / UX-004 / UX-015 / UX-022 / UX-028
- 確認した内容: filter viewの保存・再利用、sort時のData has header row、header freezeの別手順を記載。
- 限界: 自動header判定や全view状態の自動復元を保証しない。

## OFF-MS-03 Find/Replace controls and scope

- URL: [Find/Replace controls and scope](https://support.microsoft.com/en-us/excel/get-started/find-or-replace-text-and-numbers-on-a-worksheet)
- 参照節: Windows “Find” / “Replace”; macOS “Find text or numbers from the Search bar”; Web “Find” / “Replace”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Excel Windows/Mac/Webの節を区別。
- 支持するID: UX-002 / UX-007 / UX-011 / UX-023
- 確認した内容: Find/Replace、件数/移動、case/whole-cell/scopeの選択を説明。MacとWindowsでキーの意味が異なる。
- 限界: 開いたpanelへの再shortcut focusやregex互換の証拠ではない。

## OFF-GS-02 Computer keyboard shortcuts

- URL: [Computer keyboard shortcuts](https://support.google.com/docs/answer/181110?co=GENIE.Platform%3DDesktop&hl=en)
- 参照節: “PC shortcuts”; “Mac shortcuts”; “Chrome OS shortcuts”; “Use other spreadsheet shortcuts”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Sheets PC/Mac/ChromeOSの各shortcut表。
- 支持するID: UX-002 / UX-008 / UX-013 / UX-024 / UX-025
- 確認した内容: Find/Replace・copy/paste・fill down/right等をplatform別に示す。Macの置換はCommand+Shift+H。
- 限界: shortcutの伝播、繰返しfocus、OS clipboardの完全互換を保証しない。

## OFF-GS-03 Search/Replace regex and capture references

- URL: [Search/Replace regex and capture references](https://support.google.com/docs/answer/62754?co=GENIE.Platform%3DDesktop&hl=en)
- 参照節: “Use find and replace in a spreadsheet”; “Replace with regular expressions”; “Regular expressions”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Google Sheets Computer Find/Replace。Docsとは区別。
- 支持するID: UX-007 / UX-011 / UX-023
- 確認した内容: 正規表現置換に$1/$2のcapture参照例がある。case/full-cell/formula検索の選択もある。
- 限界: JavaScript regexとSheets RE2は完全互換ではない。

## OFF-GS-04 REGEXREPLACE function restrictions

- URL: [REGEXREPLACE function restrictions](https://support.google.com/docs/answer/3098245?hl=en)
- 参照節: “Notes”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Sheets REGEXREPLACE関数。
- 支持するID: UX-007 / UX-019
- 確認した内容: RE2を利用しUnicode character class等に制限。text入出力の関数契約。
- 限界: 関数の数値制限を一般Find/Replace全体へ拡張しない。

## OFF-GOOGLE-RE2-01 Engine restrictions

- URL: [Engine restrictions](https://github.com/google/re2/blob/main/doc/syntax.txt)
- 参照節: “Grouping”; “Empty strings”; “Escape sequences”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Google RE2公式engine source。
- 支持するID: UX-007
- 確認した内容: capture groupは対応、pattern backreferenceやlookaroundは非対応。
- 限界: pattern参照とreplacement $1は別。host側の全挙動を保証しない。

## OFF-MS-04 Save versus Save As

- URL: [Save versus Save As](https://support.microsoft.com/en-us/excel/save-your-workbook)
- 参照節: introduction; “Turn on AutoRecovery”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Windows desktop Excel。
- 支持するID: UX-003 / UX-005 / UX-012
- 確認した内容: Saveは既存場所への更新、Save Asは初回・別場所・別copy。AutoRecoveryとは区別。
- 限界: Webのlocal上書きや特定の終了dialogを証明しない。

## OFF-MS-05 Excel Web autosave, online copy, download

- URL: [Excel Web autosave, online copy, download](https://support.microsoft.com/en-us/accessibility/excel/basic-tasks-using-a-screen-reader-with-excel)
- 参照節: Web “Save your work”; “Save a copy online”; “Rename a workbook”; “Save a copy to your computer”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: 長いページ内のExcel Web節。
- 支持するID: UX-003 / UX-005 / UX-012
- 確認した内容: 自動保存、online copy、rename、computerへのdownloadを分けて説明。
- 限界: ローカル元ファイルへのwrite-backではない。

## OFF-MS-06 AutoSave changes the close/discard model

- URL: [AutoSave changes the close/discard model](https://support.microsoft.com/en-us/office/collab-files/what-is-autosave)
- 参照節: introduction; “What happened to File > Save As?”; “I'm a subscriber with the latest version of Office. Why is AutoSave disabled?”
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Microsoft365 Windows/Mac、対応cloud保存先。
- 支持するID: UX-005 / UX-020
- 確認した内容: AutoSaveは適格なOneDrive/SharePointファイルへ継続保存。Save a Copyとlocal保存を区別。
- 限界: すべてのdesktop/local/Webファイルで同一ではない。

## OFF-MS-07 Closing with AutoSave is not a discard operation

- URL: [Closing with AutoSave is not a discard operation](https://support.microsoft.com/en-us/office/collab-files/what-you-should-know-about-autosave)
- 参照節: “Changing Workflows”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Office AutoSave workflow。
- 支持するID: UX-005
- 確認した内容: AutoSave中は閉じて破棄するつもりでも変更済みになっていることを注意喚起。
- 限界: すべてのappに保存/破棄/取消dialogを強制する資料ではない。

## OFF-GS-05 Automatic save, copy, download

- URL: [Automatic save, copy, download](https://support.google.com/docs/answer/49114?co=GENIE.Platform%3DDesktop&hl=en-Link)
- 参照節: “Save a file”; “Make a copy of a file”; “Download a copy of a file”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Google Docs Editors Computer、Sheetsを含む。
- 支持するID: UX-003 / UX-005 / UX-012 / UX-020 / UX-027
- 確認した内容: online自動保存、copy、downloadを別操作で説明。Sheetsではcell編集を確定する手順にも言及。
- 限界: 元localファイル上書きや全exit前の永続化完了を保証しない。

## OFF-MS-08 Header semantics are explicit

- URL: [Header semantics are explicit](https://support.microsoft.com/en-us/excel/get-started/create-and-format-tables?wt.mc_id=otc_excel)
- 参照節: Windows/macOS table-creation steps; Web table-creation steps.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Excel Windows/Mac/Webのtable作成。
- 支持するID: UX-004
- 確認した内容: table作成時にheader有無を選ぶ。Webはheaderなしのデータに列名を補う。
- 限界: CSV自動判定やfreezeとheaderの同一視を支持しない。

## OFF-MS-09 Freeze panes are geometric

- URL: [Freeze panes are geometric](https://support.microsoft.com/en-us/excel/get-started/freeze-panes-to-lock-rows-and-columns)
- 参照節: “Freeze rows or columns”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: 掲載対象のWindows desktop Excel。
- 支持するID: UX-004 / UX-021
- 確認した内容: 選択の上の行・左の列を固定する。行/列は独立した表示操作。
- 限界: header認識、編集保護、Web固有UIの証拠ではない。

## OFF-GS-06 Independent row/column freezing

- URL: [Independent row/column freezing](https://support.google.com/docs/answer/9060449?co=GENIE.Platform%3DDesktop&hl=en)
- 参照節: “Freeze, group, hide, or merge rows & columns” (opening freeze procedure).
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Sheets Computer/browser。
- 支持するID: UX-004 / UX-021
- 確認した内容: View > Freezeで行数/列数を指定し、各軸の固定を解除できる。
- 限界: sortで先頭を除く意味とは別。

## OFF-MS-10 Desktop legacy text-encoding import

- URL: [Desktop legacy text-encoding import](https://support.microsoft.com/en-us/excel/text-import-wizard)
- 参照節: introduction; “Step 1 of 3”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Windows desktopのlegacy Text Import Wizard。
- 支持するID: UX-006
- 確認した内容: Step1のFile originで文字集合を指定しpreviewを見られる。
- 限界: このlegacy UIをExcel WebのUIとしない。

## OFF-MS-11 Excel Web Text/CSV import exists

- URL: [Excel Web Text/CSV import exists](https://support.microsoft.com/en-us/excel/use-power-query-in-excel-for-the-web)
- 参照節: opening note; “Import data”; “Load your data”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Excel Web Power Query。plan/機能条件あり。
- 支持するID: UX-006
- 確認した内容: Data > Get DataにText/CSVがあり、gridへ読み込める。
- 限界: 全accountで同じ利用可否やencoding pickerがあるとは未確認。

## OFF-MS-12 Power Query encoding, delimiter, and type preview

- URL: [Power Query encoding, delimiter, and type preview](https://learn.microsoft.com/en-us/power-query/connectors/text-csv)
- 参照節: “Summary”; “Connect from Power Query Desktop”; “Connect from Power Query Online”; “Additional information” > “Unstructured text” / “CSV”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Power QueryのText/CSV connector。hostに差あり。
- 支持するID: UX-006 / UX-009 / UX-015
- 確認した内容: File Origin、delimiter、型検出選択、text維持の選択を説明。
- 限界: Power Query Online全体の仕様をExcel Web固有画面と同一視しない。

## OFF-MS-13 CSV opening and lossy export

- URL: [CSV opening and lossy export](https://support.microsoft.com/en-us/excel/get-started/import-or-export-text-txt-or-csv-files)
- 参照節: “Import a text file by opening it in Excel”; “Import a text file by connecting to it (Power Query)”; “Export data to a text file by saving it”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Windows desktop Excel text/CSV import/export。
- 支持するID: UX-009 / UX-010 / UX-015 / UX-019
- 確認した内容: 直openの自動型解釈に注意。text exportはactive worksheetと非対応機能の制約がある。
- 限界: PlainSheet JSON/Markdown保存の仕様を直接証明する資料ではない。

## OFF-MS-14 UTF-8 BOM handling

- URL: [UTF-8 BOM handling](https://support.microsoft.com/en-us/excel/opening-csv-utf-8-files-correctly-in-excel)
- 参照節: main procedure (untitled).
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Excel。手順はPowerQuery/desktop-style importを含む。
- 支持するID: UX-006
- 確認した内容: UTF-8+BOMなら通常open可能と説明。BOMなしではimport経路を案内。
- 限界: BOMを付ければ任意文字コードが直るわけではなく、すべてのWeb環境を保証しない。

## OFF-MS-15 Clipboard visibility depends on structure/platform

- URL: [Clipboard visibility depends on structure/platform](https://support.microsoft.com/en-us/excel/copy-visible-cells-only)
- 参照節: Windows procedure; Web explanatory paragraphs.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Excel WindowsとWebの節を分ける。
- 支持するID: UX-008
- 確認した内容: visible cells only、Web通常rangeとfiltered tableでcopyの扱いが違う。
- 限界: 一律Excel互換のvisible copy規則を作らない。Sheetsの対応保証は未取得。

## OFF-GS-07 Accessible grid and selection orientation

- URL: [Accessible grid and selection orientation](https://support.google.com/docs/answer/1632199?hl=en-en)
- 参照節: “Move around in your spreadsheet”; “Hear cell formatting and contents”; “Select cell ranges”; “Filter your data”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Sheets Computer+screen reader、OS別shortcut。
- 支持するID: UX-014 / UX-016 / coverage a11y
- 確認した内容: cell address/content、selection、filterに入る/出る時と表示行数のorientationを説明。
- 限界: PlainSheetの実reader合格を示す資料ではない。

## OFF-W3C-01 Modal dialog keyboard/focus pattern

- URL: [Modal dialog keyboard/focus pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- 参照節: “Keyboard Interaction”; “Note”; “WAI-ARIA Roles, States, and Properties”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: Webのmodal dialog authoring guidance。
- 支持するID: UX-005 / coverage a11y
- 確認した内容: 初期focus、Tab循環、Escape、終了後focus復帰、accessible nameを示す。
- 限界: APGはそれ自体WCAG適合規格ではない。modeless検索やpopoverへ一律trapを要求しない。

## OFF-W3C-02 Interactive grid keyboard model

- URL: [Interactive grid keyboard model](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)
- 参照節: “Data Grids For Presenting Tabular Information”; “Keyboard Interaction For Data Grids”; “Keyboard Interaction - Setting Focus and Navigating Inside Cells”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: ARIA data grid authoring guidance。
- 支持するID: UX-014 / UX-016 / coverage a11y
- 確認した内容: grid内のfocus管理、keyboard移動、selectionとeditingの切替を説明。
- 限界: filter clipboardや再検索focusの独自契約を定めていない。

## OFF-W3C-03 Keyboard operability

- URL: [Keyboard operability](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)
- 参照節: “Success Criterion (SC)”; “Intent”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: WCAG2.2 SC2.1.1のUnderstanding。
- 支持するID: UX-011 / coverage a11y / UX-024 / UX-026
- 確認した内容: 機能をkeyboard interfaceから操作できることの趣旨を説明。
- 限界: Excelと同じshortcutを要求しない。sourceだけで適合判定しない。

## OFF-W3C-04 Visible keyboard focus

- URL: [Visible keyboard focus](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
- 参照節: “Success Criterion (SC)”; “Intent”.
- 確認日: 2026-10-11 UTC / 2026-10-11 JST（初回読取）
- 製品/環境: WCAG2.2 SC2.4.7のUnderstanding。
- 支持するID: UX-011 / coverage a11y / UX-024 / UX-026
- 確認した内容: keyboard focusが見える必要性を説明。
- 限界: 特定の色や装飾を要求せず、実画面の検査が必要。

## OFF-MS-17 Keyboard shortcuts in Excel

- URL: [Keyboard shortcuts in Excel](https://support.microsoft.com/en-us/accessibility/excel/keyboard-shortcuts-in-excel)
- 参照節: macOS > Frequently used shortcuts / Work in windows and dialog boxes
- 確認日: 2026-10-11 UTC / 2026-10-12 JST（追加読取）
- 製品/環境: Excel macOSの節
- 支持するID: UX-002 / coverage日本語・OS / UX-025
- 確認した内容: 置換はCtrl+HまたはCommand+Shift+H、Command+HはExcelを隠す操作。WindowsやWebの節を混ぜない。
- 限界: OS設定・keyboard配列・browserによる干渉は実機検証が必要。PlainSheetの全キー互換を保証しない。

## OFF-GS-08 Split text, remove duplicates, or trim whitespace

- URL: [Split text, remove duplicates, or trim whitespace](https://support.google.com/docs/answer/6325535?hl=en)
- 参照節: Split data into columns / Remove rows with repeat data / Remove extra spaces
- 確認日: 2026-10-11 UTC / 2026-10-12 JST（追加読取）
- 製品/環境: Sheets Computer
- 支持するID: UX-008 / UX-017
- 確認した内容: 選択したデータの区切り変更、比較列/headerを選ぶ重複削除、空白trim。NBSPはtrim対象外。
- 限界: diff preview・1Undo・hidden rowの扱い・clipboard解析はこの資料から保証しない。

## OFF-GS-09 Create an in-cell dropdown list

- URL: [Create an in-cell dropdown list](https://support.google.com/docs/answer/186103?hl=en)
- 参照節: Create a dropdown list steps 3–4 / Change or delete a dropdown list
- 確認日: 2026-10-11 UTC / 2026-10-12 JST（追加読取）
- 製品/環境: Sheets Computer
- 支持するID: UX-018
- 確認した内容: ruleを範囲へ作り、候補外の拒否を警告へ切り替えられる。ruleの編集/削除が可能。
- 限界: 任意regex検証やbulk paste原子性、CSV/sidecar保存の根拠ではない。

## OFF-MS-16 Keeping leading zeros and large numbers

- URL: [Keeping leading zeros and large numbers](https://support.microsoft.com/en-us/excel/keeping-leading-zeros-and-large-numbers)
- 参照節: Convert numbers to text / Use Power Query / Excel only has 15 digits of precision
- 確認日: 2026-10-11 UTC / 2026-10-12 JST（追加読取）
- 製品/環境: 掲載Excel desktop系列。機能ごとのversion条件あり。
- 支持するID: UX-015 / UX-017
- 確認した内容: 自動数値変換による先頭0や長い番号の扱いを説明し、text取込を案内する。
- 限界: Excelの15桁制限をPlainSheetの保存値破壊と混同しない。PlainSheetは比較時Number化が別論点。

## OFF-W3C-05 File API Blob.text

- URL: [File API Blob.text](https://w3c.github.io/FileAPI/#dom-blob-text)
- 参照節: §3.3.3 The text() method
- 確認日: 2026-10-11 UTC / 2026-10-12 JST（追加読取）
- 製品/環境: 標準Web API Blob/File
- 支持するID: UX-006
- 確認した内容: Blob.textはbytesをUTF-8 decodeして返す。
- 限界: 具体的製品UIの成功や正しい元encoding推測を保証しない。

## OFF-WHATWG-01 Encoding Standard UTF-8 decode

- URL: [Encoding Standard UTF-8 decode](https://encoding.spec.whatwg.org/#utf-8-decode)
- 参照節: UTF-8 decode
- 確認日: 2026-10-11 UTC / 2026-10-12 JST（追加読取）
- 製品/環境: Web encoding algorithm
- 支持するID: UX-006
- 確認した内容: 先頭UTF-8 BOMを処理し、errorを置換してdecodeする。
- 限界: BOM書出しの製品機能有無は別sourceで確認する。

## OFF-GLIDE-01 Glide6.0.3 fixed source

- URL: [Glide6.0.3 fixed source](https://github.com/glideapps/glide-data-grid/blob/2abe757e65cc7c38ab4f9464c229db27be4c1a8e/packages/core/src/data-editor/data-editor.tsx)
- 参照節: physical lines2101–2186 / 2204–2212 / 1268–1277
- 確認日: 2026-10-11 UTC / 2026-10-12 JST（追加読取）
- 製品/環境: PlainSheet lockが解決するGlide6.0.3
- 支持するID: UX-013 / UX-016
- 確認した内容: fillDestinationにseedを含む範囲、preventDefault後の標準処理不実行、fillDown/R、visible ordinal markerを確認。
- 限界: 実canvas実行の証拠ではない。Web整形行番号をGitHub物理行に流用しない。

## OFF-MS-18 Multiple-key sorting in Excel

- URL: [Multiple-key sorting in Excel](https://support.microsoft.com/en-us/excel/sort-data-in-a-range-or-table-in-excel)
- 参照節: Windows > Sort by more than one column or row
- 確認日: 2026-10-11 UTC / 2026-10-12 JST（追加読取）
- 製品/環境: Excel Windows desktopの複数キーsort手順。Web節と区別。
- 支持するID: UX-022
- 確認した内容: Sortで優先列・方向を選び、Add Levelで条件を追加、上下で優先順を変える。
- 限界: PlainSheetの対象preview、非表示行の扱い、一括Undoを直接定めるものではない。Excelの型・色sortを複製する提案でもない。

## OFF-MS-19 Device AutoRecover versus cloud AutoSave

- URL: [Device AutoRecover versus cloud AutoSave](https://support.microsoft.com/en-us/office/collab-files/save-back-up-and-recover-a-file-in-microsoft-office)
- 参照節: Back up and recover your files > Saved to your device / Saved to OneDrive
- 確認日: 2026-10-11 UTC / 2026-10-12 JST（追加読取）
- 製品/環境: 掲載Office Windows desktop系列、Excelを含む。保存先ごとの説明を区別。
- 支持するID: UX-027
- 確認した内容: 端末保存ではAutoRecover有効時に予期しない終了後のDocument Recoveryを説明。手動保存も引き続き推奨。cloud AutoSave/Version Historyとは別。
- 限界: PlainSheetの期限・削除・snapshot間隔・回復保証やCSVの全挙動を証明しない。初期OFF等は今回の設計案。

## OFF-MS-20 Command search and a collapsible entrypoint

- URL: [Command search and a collapsible entrypoint](https://support.microsoft.com/en-us/office/foundations-experiences/find-what-you-need-with-search-in-microsoft-365-apps)
- 参照節: introduction; Get started quickly on the web; Resizing the search box
- 確認日: 2026-10-11 UTC / 2026-10-12 JST（追加読取）
- 製品/環境: 冒頭はWindows版Microsoft365 apps、Excelを含む。Web節の機能説明も掲載されるがplatformを混同しない。
- 支持するID: UX-026
- 確認した内容: 操作・help等を検索できる入口、Alt+Q、最近の操作、検索boxをiconへ畳む設定を説明。
- 限界: PlainSheetのlocal-only検索、全OSでのAlt+Q、AI不要の実装を保証しない。人/ファイル/cloud検索まで取り込む提案ではない。

## OFF-MS-21 Platform-specific keyboard entry into Excel menus

- URL: [Platform-specific keyboard entry into Excel menus](https://support.microsoft.com/en-us/accessibility/excel/keyboard-shortcuts-in-excel)
- 参照節: Windows > Frequently used shortcuts / Work in the ribbon with the keyboard; macOS > Work in cells or the Formula bar; Web > Frequently used shortcuts
- 確認日: 2026-10-11 UTC / 2026-10-12 JST（追加読取）
- 製品/環境: Excel Windows/macOS/Webの各menu入口。OFF-MS-17のMac置換キーとは参照節を分ける。
- 支持するID: UX-024
- 確認した内容: context menuのShift+F10とWindows Menu key等をplatformごとに掲載。Windowsでは選択buttonのmenuをAlt+Downで開く。
- 限界: Glide/PlainSheetの実イベント発火やscreen reader動作を保証しない。Power Pivot限定のfilter手順を通常gridへ一般化しない。

## OFF-GS-10 Sheets tool finder as an alternate command route

- URL: [Sheets tool finder as an alternate command route](https://support.google.com/docs/answer/13466905?hl=en)
- 参照節: introduction; Find tools & features
- 確認日: 2026-10-11 UTC / 2026-10-12 JST（追加読取）
- 製品/環境: Google Docs/Sheets/Slides/VidsのComputer向けtool finder。
- 支持するID: UX-026
- 確認した内容: menu項目・toolの検索入口をtoolbar/Helpに置き、PC/ChromeOSはAlt+/、MacはOption+/を案内。
- 限界: PlainSheetの特定キー互換・offline実装・狭幅での適合を証明しない。提案は操作名検索に限定。

## OFF-W3C-06 Keyboard entry into a menu button

- URL: [Keyboard entry into a menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
- 参照節: Keyboard Interaction; WAI-ARIA Roles, States, and Properties
- 確認日: 2026-10-11 UTC / 2026-10-12 JST（追加読取）
- 製品/環境: Webのmenu button authoring guidance。
- 支持するID: UX-024
- 確認した内容: buttonへのfocus中にEnter/Spaceでmenuを開き最初の項目へfocus。aria-haspopup/expanded等の意味を説明。
- 限界: menu buttonのpatternであり、filter内checkboxの全操作をmenu化する根拠ではない。APGだけでWCAG適合としない。

## OFF-W3C-07 Menu cancellation and return to the invoking context

- URL: [Menu cancellation and return to the invoking context](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)
- 参照節: Keyboard Interaction > Escape; Note item 3
- 確認日: 2026-10-11 UTC / 2026-10-12 JST（追加読取）
- 製品/環境: Webのmenu/menubar authoring guidance。
- 支持するID: UX-024
- 確認した内容: Escでmenuを閉じ呼出し元の要素/文脈へfocusを戻す。context action後のEnterでeditor等へ戻す例も説明。
- 限界: filter dialogに一律focus trapを要求しない。実製品のfocus伝播やOSキー合格の証明ではない。

## 比較の結論と空白

- 自動view復元、繰返しCtrl+Fのrefocus、常に保存して閉じるdialogが出ることは、比較資料からは確定しない。
- Excel WebにもText/CSV importがある。desktopのlegacy wizard、汎用Power Query Onlineと同一UI扱いしない。
- Sheetsは$1/$2置換参照を支持。pattern backreferenceと混同しない。
- visible clipboardはExcelのplatformとtable/rangeで差がある。PlainSheetは自分の保存・選択契約を明示する。
- 整形diff preview、1Undo、validationのsession/local/sidecar保存は独自提案。競合資料の既存機能のように記述しない。
- 全cell textは先頭0や長桁IDを保存する上で長所。ただしsort/集計などの一時Number変換と切り分ける。
