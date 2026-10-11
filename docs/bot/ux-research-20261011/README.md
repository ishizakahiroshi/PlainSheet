---
type: reference
status: stable
tags: [ux-research, plainsheet, dots]
owner: codex
review_status: draft
related: [FACTS.md, REVIEW.md, PROGRESS.md]
last_reviewed: 2026-10-11
---

# #P-20261011-013 PlainSheet：人が使う部分のUX調査・改善提案

この指示を読んだ dots は、調査・比較・反証・提案の改善を実施する。製品を改修する依頼ではない。利用者は就寝するため、手元Codexと同じ案件会話でキャッチボールし、自律的に品質を上げる。提案は日本語の AI 用 MD と人間用の単一ファイル HTML を必ず提出する。

## 目的と調査対象

ボタン、画面、操作導線、初見の理解、編集・選択・キーボード・マウス、保存の理解、失敗からの回復など、人が使う場面の不具合と摩擦を広く深く洗い出す。Excel・Google Sheets の現行公式資料を調べ、操作の慣れを活かす施策を提案する。Excel の全機能を複製することが目的ではない。PlainSheet のローカル優先・プレーンテキスト保存という価値と両立するかを説明する。

対象repo: `ishizakahiroshi/PlainSheet`（公開）。

- 現行 develop source: `037c29ea4649efc81acc8f28824dca3df08e7450`。
- 主な提案対象となる候補版: 既存 Draft PR #1、head `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`、branch `bot/20261005-004-excel-like-ux`、base `develop`。
- main source: `835b24632334724a43b00c8e0883ac9d650e0fdc`。公開版・利用中版は今回の手元確認なし。main/develop/PR/利用中版を同一視しない。
- PR #1 は今回変更しない。develop の問題が候補で解消済みなら、その旨を記録し新規施策から外す。候補版だけの問題・残る問題を分ける。

## 許可と禁止

許可: 上記固定 source と公開資料の読取、現行公式一次資料のWeb調査、既存cacheでできる安全なunit検査・合成fixture・一時再現、別contextの探索担当と反証担当による分担、手元Codexへの中間報告、今回専用 docs branch への資料保存。

保存先は `dots/ux-research-P-20261011-013` の `docs/bot/ux-research-20261011/` のみ。このbranchの同フォルダへの調査資料・HTML・PROGRESSのcommit/push、必要時の資料だけのDraft PR、専用管理Issueへの報告は許可する。管理Issue番号はPROGRESSを参照。

禁止: 製品source・設定・lockfile・CI変更、main/develop/既存PR #1への書込、merge/tag/release/deploy、製品build/コンパイル/新規起動、依存取得・インストール、課金AI/API、実credential/実利用者データ、私有会話URL・ローカル絶対パスの転記。他案件に触らない。既存で利用可能な画面があれば観察できるが、画面が無い場合はsource調査を継続する。

公開repoなので合成データだけを使う。脆弱性や悪用に直結する詳細を発見した場合は公開branch/Issueに掲載せず概要のみ知らせる。

## 進め方：途中から往復する

1. 受付: 番号衝突、固定指示commit、2つのsource SHA、repo読取・Web調査・資料書込・unit検査・既存browser・別context反証の能力を yes/no/unknown と証拠で返す。
2. sourceから操作入口と状態遷移を棚卸しする。まず最も困りそうな候補を中間batchとして返す。完成まで返事を溜めない。
3. 手元Codexがsourceに戻って反証・質問・追加観点を返す。指摘IDを維持し、根拠追加、誤検出撤回、統合、優先度変更を記録する。返事待ちでも別の未調査操作を進める。補足は同一案件の継続であり再起動しない。
4. ExcelとSheetsの一次資料を比較し、製品・OS・Web/desktop差・確認日・参照節を明記する。公式仕様でもPlainSheetで同じ実装が必要かは別途判断する。
5. 提案者とは別contextの反証担当が、source SHA/指摘ID/重大度/画面の未確認/既存機能/保存意味/MDとHTML整合を点検する。独立contextが使えないならその事実を記録し、自己点検を独立レビューと呼ばない。
6. 手元Codexの質問に回答し、改善版MD/HTMLを提出する。未解決の仮説は「実機確認待ち」に移し、確認の方法を付ける。
7. 終了条件: 操作coverageが埋まり、重大候補の判定と反証が揃い、重複が解消され、MD/HTMLの全IDと優先度が一致し、最後の改訂で新たな重大な根拠不足が見つからない。回数を増やすこと自体を目的にしない。

利用者の判断・実機が必要な項目は保留理由と選択肢を記録し、独立してできる調査を続ける。能力不足をアプリ不具合の証拠にしない。接続拒否を迂回しない。すべての作業が外部能力不足で不可能になった時だけ停止receiptを返す。

## 操作coverage（全領域に結果または未実施理由が必要）

| 領域 | 必須の利用シナリオ |
|---|---|
| 初回・空状態 | 新規/サンプル/ファイルを開く、対応形式、数式が評価されるかの理解、Web/desktop差 |
| ボタン・発見性 | ラベル/tooltip/ショートカット、disabled理由、危険操作の対象、主操作と補助操作、狭い幅で到達可能か |
| セル編集 | 文字入力/F2/ダブルクリック、Enter/Tab/Shift、Esc、数式バー、改行/長文、貼付とIMEの区別 |
| 選択・移動 | 行列全体、複数範囲、名前box、Ctrl矢印/Home/End/Page、フォーカス復帰、固定/スクロール/ズーム |
| クリップボード | Excel/Sheets往復、TSV引用符/改行/空セル、切取失敗、複数行列、一括貼付、上書き範囲 |
| 表構造 | 行列挿入/削除/移動/幅自動調整、headerの意味、対象選択とundo |
| データ整理 | sort（数値/日付/空/日本語）、filter/hidden row、複数条件、選択対象と検索/コピー/削除の一貫性 |
| 検索置換 | 候補移動/件数、selection/all/filtered、regexエラー、全置換、復帰・undo |
| 保存と回復 | dirty/保存中/成功/失敗、Web download/desktop overwrite、Save As/cancel、形式/文字コード/改行、閉じる/タブ/複数ファイル |
| 日本語・OS | IME/変換中のEnter、Cmd/Ctrl、native dialog/close。sourceで実IME合格にしない |
| アクセシビリティ | キーボードのみ、dialog trap/初期focus/復帰、読み上げ/状態通知、canvas代替、色以外の状態表現 |
| 表示・性能 | 長文/広い表、dark/light/高コントラスト、640px/拡大、負荷中の反応。実測なしで秒数を作らない |
| 学習・信頼 | 操作help、用語、エラーの次の行動、失敗前のpreview、ローカル性と保存場所、回復可能性 |

## 1件ごとの書式

安定ID `UX-001` 等、題名、分類（sourceで確定した不具合 / 観察した摩擦 / sourceからの仮説 / 機能改善 / 解消済み）、対象source SHA、Web/desktop/OS、誰がどの操作で困るか、再現条件・合成入力、期待/実際、caller→処理→結果の根拠 `path:line` と固定GitHub URL、反証と確度、Excel/Sheets公式比較、before/after、採用/見送りの利用者メリット・デメリット、推奨理由、優先度（P0〜P3）と利用者影響、依存、改修目安（実測ではない概算）、受入条件、未検証環境を含める。

画面を見ていないものを「観察した」としない。不具合か否かの判断と実害/優先順位は別。スクリーンショット/fixture/自動検査/source/公式資料を区別する。新機能は現行の欠陥と断定しない。

## 提出物

- `results/proposal.md`: AI向け。全指摘、シナリオ、caller、根拠、比較表、採用案/見送り案、依存順、受入条件、未確認、実装を開始する前の判断を自己完結にする。
- `results/proposal.html`: 人間向け。単一HTML・inline CSS/JS・外部通信なし。最初におすすめの順序、次にグループ切替と現在/改善後の画面模式図、ID対応の困りごと/効き目/デメリット/採用理由/改修目安。技術用語を本文に散らさず詳細に畳む。採用/保留/見送り・メモを保存し、全グループの回答をMDへ出力する。未選択を勝手に採用扱いにしない。localStorageが使えない時は明示して出力を使わせる。print、640px/通常幅、キーボード操作にも対応する。
- `results/coverage.md`: 全領域、調査source/経路、確認方法・結果、未実施とその理由。
- `results/sources.md`: 現行Microsoft/Google/W3C等一次資料のURL/確認日/支持するID/節。競合の印象を仕様にしない。
- `results/review.md`: 独立担当のsource/提案revision、反証/誤検出/修正/未確認。手元Codexレビューとは別。
- `results/iterations.md`: 往復ごとの質問・回答・IDの判定変更、撤回理由。
- `PROGRESS.md`: 結果入口、固定source、残件。状態の正本は専用Issueコメント。

HTMLの資料配色は cream `#f7f3ea`、ink `#241f1a`、accent `#ff7a3d`、card `#fffdf8`、ok `#2e7d4f`、warn `#b8860b`、bad `#b3261e`。画面模式図の中はPlainSheetの現行UIの配色/言語を尊重し、模式図と実画面を明示して区別する。装飾グラデ・絵文字・罫線文字アートは使わない。

HTMLは同梱 `templates/feature-selection.html` の保存・全グループ出力・独立選択を再利用し、カード内容/グループ/模式図/見出しを案件用に置き換える。検証時だけコピーに `templates/verify.html` を差し込み、jsErrors/壊れたanchor/表示幅と出力を確認する。verifyの実行能力が無ければその範囲は未検証と記録する。

初回中間batchと最終提出を、同じSlackスレッドおよび専用Issueへ知らせる。ファイルはSlackへ添付せずgitで渡し、commit SHA/path/bytes/SHA256を返す。毎回1行目は `#P-20261011-013 PlainSheet：報告内容`。送信の成功・受付・調査・レビュー・実画面確認は別の状態として報告する。
