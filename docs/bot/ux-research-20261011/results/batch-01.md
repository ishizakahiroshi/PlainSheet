# P-20261011-013 PlainSheet：初回候補batch

作成・確認日: 2026-10-11。これは途中提出であり最終判定ではない。sourceで確認できる経路、合成fixture、実画面は別に扱う。製品は起動していない。

- 指示: `a4b136e7074986caf778c39ee26e61c0c774c2bb`
- 主対象: PR #1 `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 比較対象: develop `037c29ea4649efc81acc8f28824dca3df08e7450`
- 正本: [Issue #2](https://github.com/ishizakahiroshi/PlainSheet/issues/2)
- P0候補なし。下表の優先度は影響からの暫定値。工数・実害頻度・速度の実測はない。

## 最初に反証したい候補

| ID | 暫定優先 | 候補・分類 | caller → 処理 → 結果と反証点 |
|---|---|---|---|
| UX-001 | P2 | タブ復帰時の絞込み消失。source確定の挙動、改善提案 | TabBar → App switchTab:350–358 → applyDocument:196–205 が filter.clearAll。useDocuments:16–33 のsnapshotにfilterなし。Aを絞込→B→Aで条件を保持しない。列幅・選択・履歴は保持済みであり「全部消失」ではない。scroll/freeze/headerは別状態として切り分ける。 |
| UX-002 | P2 | 開いた検索欄へCtrl/Cmd+F/Hで戻れない可能性。source仮説 | App:907–912はsetSearchOpen(true)のみ。SearchPanel:51–57は[open]変更時だけfocus。検索を開く→gridへ戻る→再度検索キーを確認したい。Glideのイベント伝播と実focusは実画面未確認。 |
| UX-003 | P2 | 保存通知の対象タブが曖昧。機能改善 | useFile:48–50のsaveNoticeはhook全体1つ、App:1015–1017へ表示。成功文はファイル名つきだがcancel/失敗文は対象なし。保存snapshot/完了metaは文書IDへ結び付け済み(App:254–258)であり、別タブデータを書き換える旧不具合ではない。 |
| UX-004 | P2 | 先頭行を見出しと扱う設定を操作前に分かるようにする。機能改善 | settings:16–24の既定trueはglobal。App:766–771 sort、381 filter、962候補一覧に作用。headerなし合成表3,1,2の並替えで先頭3を残す。Settingsで解除可能。行固定は列固定とは別機能であり未搭載をbugと呼ばない。 |
| UX-005 | P2 | 閉じる前に保存して戻れる導線。機能改善 | App closeTab:361–375 / approveWindowClose:278–291 はdirty時にconfirm。無確認破棄ではない。保存して閉じる/破棄/戻るの選択を提案。Web downloadは完了を確認できず、勝手にdirty=falseや自動closeへ変えない。 |
| UX-006 | P1 | Webで文字コードを選べず読込結果を誤解する。機能改善 | useFile loadBrowserFile:363–408 はFile.text()/stream UTF-8でencoding=utf-8。Rust:65–121はUTF-8→CP932等の推測を行う。desktopも正解保証ではない。読込preview・明示選択・失敗時の次の行動を検討。文字化け自動修正はしない。 |
| UX-007 | P3 | 正規表現置換の$1は文字列。機能差 | App:824、845–848はcallbackがreplacementを返すので$1展開なし。文字列をそのまま入れる意図を否定しない。Google Sheetsのcapture group置換と比較し、明示切替または説明の小変更を検討。完全一致/選択内/previewは別追加案であり現存機能と混同しない。 |
| UX-008 | P1 | 自前コピーの1列複数行カンマが貼付で2列になる。source不整合候補 | App copySelection:488–508 → serializeClipboardText(TSV) → context paste:599–616 → parseClipboardText:32–36がtabなし複数行をCSV扱い。A1:A2=[North,East / South,West]が2×2へ拡張。CSV推測を意図したtestあり。右クリック経路に限定し、keyboard/HTML clipboardは別確認。 |
| UX-009 | P1 | JSON/YAML上書きで型が文字列へ変わることの予告。機能改善 | formats:47–114で数値/真偽/配列/nullをセル文字列へ、rowsToObjectsはstring。README:63に既に明記。新parser bugではない。開く時の説明と最初の上書きpreview/別名保存を検討。型保持は別の大きな設計案。 |
| UX-010 | P1 | Markdown文書中の表だけを上書きする範囲の予告。機能改善 | formats:136–175は最初のpipe表を抽出し表だけ再出力。前後本文・alignment情報はsnapshotされない。table-only設計を尊重し、本文のある文書を別名保存へ誘導する案。文書全体エディタ化は今回見送り候補。 |
| UX-011 | P2 | 不正regex/長すぎるqueryが「一致なし」に見える。source確定の診断不足 | App buildMatcher:1308–1320 → null → collectSearchMatches:14 →0件、SearchPanel:122–127がnoMatches。'['、2001文字と本当の0件を分離して修正方法を表示。 |
| UX-012 | P3 | Undoで保存内容へ戻っても未保存表示。機能改善 | App:457–462はhistory復帰時常dirty=true。保存checkpointの追加候補。Webではdownload開始しか確認できないためdesktopの直接保存と同じclean判定にしない。現状は安全側の警告でありデータ消失bugではない。 |
| UX-013 | P1 | フィル連番の元セルまで書き換わる可能性。依存契約＋source候補 | GlideSheet:491–511がfillDestination全体にfillSeries結果を書く。lockはGlide6.0.3。公式upstreamのfillDestinationが元範囲を含む契約と照合すると1,2→A5で3,4,5,6,7になりうる。Ctrl+Dも同callbackとの関係を独立反証中。canvas実観察なし。 |
| UX-014 | P1 | 遠い空セルの移動先と選択表示の不一致。source候補 | GlideSheet:179–192は大きなgridを表示する一方:254–255、301–314、395–403で実データ+8へclamp。新規表でA100/Z1クリック、名前box A100を比較したい。実画面未確認、設定最大数とvirtual gridの意図も反証対象。 |

表のpathはすべて主対象SHA。固定ソースへの入口: [App.tsx](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/App.tsx)、[GlideSheet.tsx](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/components/GlideSheet.tsx)、[useFile.ts](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/hooks/useFile.ts)、[formats.ts](https://github.com/ishizakahiroshi/PlainSheet/blob/8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6/src/lib/formats.ts)。最終版では各IDへ行付きURLを付ける。

## 新規提案から除外する既存PRの改善

保存前の未確定編集commit、IME中の保存/閉じるguard、文書IDつき保存snapshot、Web downloadの明示とdirty保持、filtered rowsのcopy/paste/clear/search一貫性、hidden destination不足時の貼付全体拒否、dialog focus trap/復帰、toolbar tooltip、検索件数上限と実総数表示、非連続header選択の履歴・統計はPR #1 source/testsに存在する。これらの未実機検証を「機能なし」と置き換えない。

## 手元Codexに確認したいこと

1. UX-008/013/014のcallerと依存契約に、取り違え・既存guard・別routeで打ち消す根拠があるか。
2. UX-009/010は意図したtable/string設計として維持し、上書き前の予告を先行する提案でよいか。無言の型推測・文書全体編集へ拡張しない。
3. UX-002は実画面未確認の仮説のままにする。既に開いた検索へ戻る入力routeの合成/手元証拠があれば同IDで追記したい。

返事待ち中も未調査の操作coverage、公式比較、keyboard/a11y/狭幅のsource経路調査を続ける。独立反証前の候補を最終確定と呼ばない。
