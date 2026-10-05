# #20261005-004 手元検収チェックリスト

追加指示: `c22439b45dd27bbf6c0e56c7d6858a804242f715`。同じ PR #1。以下は依頼者/ローカル担当が実施する手順であり、dot が画面受入済みという記録ではない。最終 code SHA と review SHA は PROGRESS / PR の最終記録を合わせて確認する。

## 最初の一手

**同じ PR の最終 head を手元で開き、下記 Browser 版の約10分の代表作業を、使い捨ての合成 CSV コピーで実施する。** 実データや元ファイルを使わない。異常が出たら、その操作で止め、値・範囲・保存先・SHA・画面を記録する。原因不明のまま上書き保存しない。

### 合成 sample

CSV は引用符・セル内改行を正しく含めて作る。列は `id,部署,値`。行には `00123`、`9007199254740993`、`1-2`、`=text`、空欄、日本語、`a"b`、セル内2行文字列を入れる。部署は営業/開発を交互にし、営業だけの filter で元の非連続行が残るようにする。別フォルダに同名 sample を2つ用意し、片方だけ識別値を変える。

無編集 byte 同一、JSON/YAMLの数値型・欠損、Markdown前後空白までの完全保持は保証していない。READMEのFormat Notesを参照する。CSV/TSVでは上の文字列値が意図せず変わらないかを確認する。

## Browser 版: 約10分

| 時間 | 操作 | 期待 | 結果 |
|---|---|---|---|
| 0–1分 | 初回→ファイルを開く | Browser / download / 元ファイル未変更の説明。内容は端末内で処理 | 未実施 |
| 1–3分 | 検索、日本語を含む5セル変更、F2、文字置換、Enter/Shift+Enter/Tab/Shift+Tab、Alt+Enter、Esc | 方向と改行を区別。既存値を保つ/置換する意図が一致。日本語変換確定Enterで余計に移動しない | 未実施、実IME担当 |
| 3–4分 | 2×2選択、範囲内右クリックCopy→Paste→Undo1回→Redo | 範囲が単セルにならず、変更全体が戻る。Shift逆方向で範囲が縮む。Ctrl+端/Ctrl+Aは実データ基準 | 未実施 |
| 4–6分 | 営業filter→非連続表示2行へPaste→解除→Undo。表示行不足でも試す | 非表示元行は変わらない。行不足なら全体拒否。header設定ON/OFFで先頭行扱いが変わる。表示/全件数とfilter印/解除が分かる | 未実施 |
| 6–7分 | filter中に隠れた行だけの語を検索/全置換、解除 | 対象は表示行と明示され、隠れた行は変わらない。Undoで回復 | 未実施 |
| 7–8分 | 手動幅→列移動→Paste→Undo | 値/幅/順序/選択が一致し、通常編集で手動幅が変わらない | 未実施 |
| 8–10分 | 未確定編集でCtrl+S、Download as取消、Download→コピーを再読込 | 最新値を含むコピーをdownload。元ファイルは変わらず、開始を上書き成功と表示しない。取消でclean化しない。日本語/長い番号等を照合 | 未実施 |

補足: Browserのdownload完了/保存先はアプリから検証できない。コピーを実際に開くまで完了扱いにしない。編集中/変換中にreload/closeで警告が出るかを合成コピーで確認する。選択・clipboard待機中のtab切替では、誤ったtabへPaste/Cutしないことも確認する。

## Windows Tauri app: 約10分 + 実IME確認

1. 同名2ファイルを別tabで開く。path/番号で見分け、先のtabだけ編集→Save→両ファイルを開き直す。書込先が一致すること。未実施。
2. Save As dialogを開いて取消。未保存表示とUndoを保持する。可能なら安全な読み取り専用の合成コピーで保存失敗を起こし、失敗通知と未保存保持を確認。未実施。
3. 保存中の追加編集/他tab切替を試せる環境では、元文書だけに結果が返り、追加編集/他文書がcleanにならないことを確認。自動試験はmock I/Oであり、この実機確認の代わりではない。未実施。
4. 日本語IMEで編集開始/候補選択/変換確定Enter、その後のEnter移動、Esc、F2末尾、Alt+Enterを確認。貼付けやsynthetic compositionイベントだけで合格にしない。未実施。
5. 5形式の代表sampleを保存/再読込。CSV/TSV/Markdownは既存UTF-8/BOM/Shift_JIS/EUC-JP/Latin-1、JSON/YAMLは既存UTF-8方針を確認。表現不能文字の失敗も確認し、勝手に形式/文字を落とさない。未実施。
6. アプリ内title-bar閉じるを合成未保存documentで試し、取消で内容を残す。**OS/menu/Alt+F4経路の保護は未確認・別範囲。先に保存し、この経路をデータ損失防止済みと扱わない。**

## 別枠の画面/性能/見た目（上記10分に含めない）

- 2,000×30: 範囲選択、fill、列移動、枠固定。引っかかり、処理時間、表示崩れを記録。未実施。
- light/dark/system、通常幅/約640px幅、ズーム変更: 操作の消失・重なり・文字切れ・選択色/罫線/フォント。頻用操作とscrollで全ボタンに届くか。未実施。
- キーボードだけでTab/Shift+Tab、tooltip、menu上下、dialogのfocus復帰、tabの左右移動を確認。未実施。
- 空表、1×1、列数が異なる行、長いセル文字列、繰り返しUndo/Redo、開く取消、filter解除/再設定、閉じる取消を確認。未実施。
- 取り込み前の別製品AIによる全行確認はローカル担当の残件。独立コードレビューと別に記録する。

## 未解決の別範囲

- Linux packaging: `.github/workflows/tauri-release.yml` の Linux binary selector / staging 検証が対象候補。frontend / Tauri build 成功と梱包exit2を分け、workflowは変更していない。
- Native外部close: 現 capability は `core:window:allow-close` を持ち、`allow-destroy` を持たない。導入済みJS APIの `onCloseRequested` は防止しない場合内部で `destroy()` を呼ぶ。試作listenerは公開前に除去。API + destroyの設計を採るなら capability 対象範囲と権限の別承認が必要。代替設計も含めowner側で検討し、現時点ではnative全経路の保護を保証しない。
- ブランド: 既存app iconとSVGは2列3行の表と青いセルのモチーフ。`index.html` はfavicon linkを持たない。既存favicon SVGの参照には許可外の `index.html` が候補。配布バイナリアイコン/assets生成は変更していない。

## 受入記録

`code SHA / review SHA / OS / Browserまたはapp / IME / 操作番号 / 期待 / 実結果 / 画面 / 所要時間` を記す。コード修正済、静的検査済、CI全成功、画面確認済、Windows実機確認済、利用者受入を別状態にする。C1基盤判定は実測が揃うまで保留。
