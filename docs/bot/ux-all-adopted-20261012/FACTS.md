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

## 新案件の実測追記（2026-10-12 UTC）

- 固定指示全文:8204b5442f602164148b725c3ad07190630e33c4。新規に基準190testsを実行し、旧研究の成功は流用していない。
- branch:dots/ux-all-P-20261012-001、[Draft PR4](https://github.com/ishizakahiroshi/PlainSheet/pull/4)、code7831c3c2fc7f8e89ec517b845e0b0485c9f3d2e9。共有App/Glide/useFileは単一統合担当で直列変更。
- Cloud Linux / Node24.19.0 / npm11.9.0 / Python3.12.14。local Bun/Rust/Cargoなし。接続済みdesktopは今回の操作許可なし、saved environmentなし。既存cloud/connectorで許可内作業。
- 49files607tests、TypeScript、ESLint成功。ネットワーク共同編集は実HTTP loopback合成確認済み。GUI/native操作の未検収は別。
- 新規依存なし。既存npm実測とBun lock再現性を区別。詳細はdependency-ledger.md。
- 独立review初回22件と修正はremediation.md。C6/C7修正後独立再reviewは未実施、C8/全28受入済みとはしない。

### 実際の変更source/test paths（code SHA7831c3c2）

- `server/relay.ts`
- `server/run.mjs`
- `server/serve.ts`
- `src-tauri/src/main.rs`
- `src-tauri/tauri.conf.json`
- `src/App.tsx`
- `src/components/CleanupPanel.tsx`
- `src/components/CommandSearch.tsx`
- `src/components/FeatureDialog.tsx`
- `src/components/FilterPopover.tsx`
- `src/components/FormulaBar.tsx`
- `src/components/GlideSheet.tsx`
- `src/components/HelpModal.tsx`
- `src/components/ImportPreview.tsx`
- `src/components/NamedViewsPanel.tsx`
- `src/components/RecoveryPanel.tsx`
- `src/components/SearchPanel.tsx`
- `src/components/SettingsModal.tsx`
- `src/components/SharingPanel.tsx`
- `src/components/Toolbar.tsx`
- `src/components/ValidationPanel.tsx`
- `src/hooks/useCollaboration.ts`
- `src/hooks/useDialogFocus.ts`
- `src/hooks/useDocuments.ts`
- `src/hooks/useFile.ts`
- `src/hooks/useFilter.ts`
- `src/hooks/useHistory.ts`
- `src/lib/autofill.ts`
- `src/lib/cleanup.ts`
- `src/lib/clipboard.ts`
- `src/lib/collaboration/client.ts`
- `src/lib/collaboration/index.ts`
- `src/lib/collaboration/model.ts`
- `src/lib/commands.ts`
- `src/lib/conversionPreview.ts`
- `src/lib/decimal.ts`
- `src/lib/formula.ts`
- `src/lib/gridOperations.ts`
- `src/lib/importPreview.ts`
- `src/lib/namedViews.ts`
- `src/lib/recovery.ts`
- `src/lib/saveState.ts`
- `src/lib/search.ts`
- `src/lib/sort.ts`
- `src/lib/validation.ts`
- `src/lib/viewState.ts`
- `src/styles/app.css`
- `src/tests/App.adoptedUx.test.tsx`
- `src/tests/App.extendedUx.test.tsx`
- `src/tests/App.integration.test.tsx`
- `src/tests/App.reviewCorrections.test.tsx`
- `src/tests/App.reviewInputCorrections.test.tsx`
- `src/tests/App.sharingCorrections.test.tsx`
- `src/tests/GlideSheet.inputSafety.test.tsx`
- `src/tests/GlideSheet.test.tsx`
- `src/tests/ImportPreview.test.tsx`
- `src/tests/autofill.bounds.test.ts`
- `src/tests/autofill.test.ts`
- `src/tests/c5Panels.test.tsx`
- `src/tests/cleanup.test.ts`
- `src/tests/clipboard.test.ts`
- `src/tests/clipboardHtml.test.ts`
- `src/tests/collaboration.model.test.ts`
- `src/tests/collaboration.panel.test.tsx`
- `src/tests/collaboration.revisionGuard.test.ts`
- `src/tests/collaboration.runner.test.ts`
- `src/tests/collaboration.transport.test.ts`
- `src/tests/conversionPreview.test.ts`
- `src/tests/decimal.test.ts`
- `src/tests/dualEditionUi.test.tsx`
- `src/tests/formula.test.ts`
- `src/tests/importPreview.test.ts`
- `src/tests/namedViews.test.ts`
- `src/tests/namedViewsPanel.test.tsx`
- `src/tests/recovery.test.ts`
- `src/tests/sort.test.ts`
- `src/tests/useCollaboration.test.tsx`
- `src/tests/useFile.test.ts`
- `src/tests/validation.test.ts`
- `src/types/sheet.ts`

最終source候補はac8194cb09a79d38332ba3421dc10a15d0aa00f3へ更新。上の変更一覧に加えてContextMenu.tsxの選択維持フラグを変更。source/test総81paths。49files625tests/TypeScript/ESLint成功。


最新source更新: `76ab986ceeff7fb0d2dcba17cf6096489c45ff33`、50 files /641 tests、TypeScript/ESLint成功。構造Undo/Redoの後付け規則維持と規則単位ヘッダー適用判定を追加修正。C1/C3/C4は前候補ac8194cbの限定receipt取得済み、C2/C5は最新固定SHAで限定再確認中。C6/C7修正後独立再reviewは未実施、実GUI/native受入は保留。

追加source: src/lib/validationHistory.ts、追加test: src/tests/validationHistory.test.ts。source/test変更総83 paths。

最終提出source: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`。50 files /646 tests、TypeScript/ESLint成功。規則履歴の100件/列上限を原子的に事前検査し、拒否時もデータと両履歴stackを維持。最新receipt/CIと未検収はHANDOFF.md・verification.md・Issue 3を参照。
