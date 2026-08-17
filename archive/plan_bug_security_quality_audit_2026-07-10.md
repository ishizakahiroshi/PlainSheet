---
type: plan
status: complete
tags: [audit, security, bug]
owner: 
review_status: draft
related:
  - report_bug_security_quality_audit_2026-07-10.md
  - plan_bug_security_quality_audit.md
  - report_bug_security_quality_audit_2026-06-15.md
last_reviewed: 2026-07-10
---
# [完了] PlainSheet バグ・セキュリティ・脆弱性・保守性 再監査（2026-07-10）

> 最終更新: 2026-07-10

## context配分

| C | 種別 | 内容 | 並列 |
|---|---|---|---|
| C1 | fix | 初期把握・処理経路/永続化特定・plan/report ひな型 | — |
| C2 | fix | 観点別並列調査（バグ4分割＋セキュリティ＋依存＋保守性） | ◯ |
| C3 | fix | finding 敵対的検証（確定/却下/重複） | ◯ |
| C4 | fix | 確定 finding の最小差分修正＋再現テスト | — |
| C5 | fix | 検証（tsc/test/lint）→再調査→rubric 採点→報告完成 | — |

実行順序: `C1 → (C2) → (C3) → C4 → C5`

---

## 作業目的

2026-06-15 監査（audit-and-hardening マージ済）後の `develop` を対象に、バグ主軸＋セキュリティ・脆弱性・依存・保守性をフルループで再監査し、確定 finding を最小差分で修正する。

- 強度: ハイ / スコープ: フルループ / 観点: 全部 / 対象: リポジトリ全体 / 除外: なし
- プロンプト: `claude_ultracode_audit_db_less_app.md`
- 判定: package.json に SQL/ORM なし・永続化はローカルプレーンテキストのみ → **db_less_app**
- ブランチ: `develop`（専用ブランチ未用意のため現行ブランチで作業）

## 対象範囲 / 除外範囲

- 対象: `src/**`, `src-tauri/src/**`, 設定（tauri.conf / capabilities / package.json / eslint 等）
- レビュー対象外: `src-tauri/target/**`, `node_modules`, `dist`, `bun.lock`

## DBを使わない前提

永続化はローカルプレーンテキスト（CSV/TSV/MD/JSON/YAML）のみ。DB/SQL/ORM/migration は存在しない。

## 状態管理・永続化方式の確認

- 状態: React hooks（useSheet / useSelection / useHistory / useFile）。設定はメモリのみ
- 読込: Tauri=`read_file`（encoding_rs）、ブラウザ=File API / DnD / sample
- 保存: Tauri=`write_file`、ブラウザ=File System Access API or Blob download
- パース: csv.ts / formats.ts / clipboard.ts
- グリッド: glide-data-grid（Canvas）
- 外部コマンド/外部 API: なし（local-first、`fetch` は `/sample.csv` のみ）

## 禁止事項

- スコープ終端まで止まらない / 判断待ちは記録してパス
- DB導入禁止 / 抜本改修禁止 / ビルド禁止 / commit・push・tag 禁止 / ブランチ操作禁止

## 作業前 git 状態

- branch: develop（`75108ab Merge branch 'audit-and-hardening'`）
- 開始時に `AGENTS.md` / `CLAUDE.md` が M（many-ai-cli 注入・本監査では未変更）
- 未追跡: `.docsweep/`

## TODO

- [x] C1 初期把握 + plan/report ひな型
- [x] C2 観点別並列調査（4 並列エージェント + 自己通読）
- [x] C3 敵対的検証
- [x] C4 修正 + 再現テスト
- [x] C5 検証・再調査・rubric・報告完成

## 調査ログ

- 2026-07-10 開始。前回監査 report 確認。新規 plan/report 作成。
- C2: parse/serialize・hooks/App・UI/security・deps を並列調査。
- C3: 再現経路が言語化できるものだけ確定。設計トレードオフは判断待ち/進言へ。
- C4: 確定 finding を最小差分修正。テスト追加。
- C5: `tsc --noEmit` / vitest 73 / eslint 全通過。

## finding 一覧（確定・修正済）

| ID | 重大度 | ファイル | 問題 | 修正 | スコア |
|---|---|---|---|---|---|
| F1 | high | FormulaBar.tsx | Escape が blur 経由で編集をコミット | skipBlurCommit | バグ/ロジック +3 |
| F2 | medium | FormulaBar.tsx | Enter が二重コミット（ファントム undo） | 同上 | バグ/ロジック +1 |
| F3 | high | App.tsx replaceRowsFromHistory | 保存後 undo で dirty が false のまま | dirty=true | バグ/ロジック +3 |
| F4 | high | useFile.ts drag-drop | Tauri listen リーク（deps 再登録） | ref + 1回 subscribe | バグ/並行 +3 |
| F5 | medium | useFile.ts loadPath | 並行 open の last-write-wins | loadGenerationRef | バグ/並行 +1 |
| F6 | medium | useSheet deleteRow | 最終行削除で []→EmptyState | 最低1行残す | バグ/境界 +1 |
| F7 | high | App ContextMenu | Copy/Paste/Clear が古い選択を使用 | rangeFromContextMenu 同期 | バグ/ロジック +3 |
| F8 | medium | App settings | csvFormulaGuard/omitEmptyCells が dirty にしない | dirty:true | バグ/ロジック +1 |
| F9 | medium | useSheet clearRange | バッファ空セル Clear で no-op dirty | 既存セルのみ / 変更なしは return | バグ/境界 +1 |
| F10 | medium | useFile loadSample | GH Pages で sample が 404 | BASE_URL | バグ/I/O +1 |
| F11 | high | csv parseCsv | ブラウザ BOM が先頭セルに残る | BOM strip | バグ/I/O +2 |
| F12 | high | formats markdown | セル内 lone CR でテーブル破壊 | CR も `<br>` | バグ/I/O +2 |
| F13 | high | formats rowsToObjects | ヘッダ幅超の列が JSON/YAML で消失 | maxCols 拡張 | バグ/ロジック +2 |
| F14 | high | formats rowsToObjects | ヘッダのみ→`[]` で列名消失 | sentinel 空オブジェクト | バグ/ロジック +2 |
| F15 | medium | formats parseObjectList | 混在配列で非 object を黙って破棄 | 長さ不一致 throw | バグ/例外 +1 |
| F16 | medium | formats JSON CRLF | 内部 LF のまま | 全 `\n`→`\r\n` | バグ/I/O +1 |
| F17 | medium | App/GlideSheet | zebra/header/theme 設定が無効果 | Glide theme 配線 | バグ/UX +2 |
| F18 | medium | App theme system | system が常に light | matchMedia | バグ/UX +1 |
| F19 | medium | SearchPanel | Ctrl+F で入力にフォーカスしない | auto focus | バグ/UX +1 |
| F20 | medium | ContextMenu | 外側クリックで閉じない | pointerdown | バグ/UX +1 |
| F21 | medium | modals | Escape/backdrop で閉じない | keydown + backdrop | バグ/UX +1 |
| F22 | medium | App autoFit | 「列再計算」が全列 autoFit | autoFitColumn | バグ/UX +1 |
| F23 | low | App toast | 連続 toast が早期クリア | timer ref | バグ/境界 +0.5→1 |
| F24 | medium | useHistory | 連続 undo の stale closure | ref mirror | バグ/並行 +1 |
| F25 | low | eslint | scripts/*.mjs の no-undef | node globals | 保守 +1 |

## 却下 / 重複（要約）

| 候補 | 結果 | 理由 |
|---|---|---|
| XSS via cells | 却下 | Canvas 描画・innerHTML なし |
| CSV formula default off | 既知仕様 | オプトイン維持（前回監査） |
| Path absolute only | 既知ハードニング | セッション allowlist は進言 |
| YAML 数値型・JSON bigint | 判断待ち/進言 | 仕様トレードオフ |
| ReDoS 完全対策 | 進言 | 2000字 cap 済み |
| detectDelimiter 5行 | 判断待ち | 性能とのトレードオフ |
| Clipboard 複数行カンマ | 判断待ち | UX 仕様 |
| uniqueHeaders trim | 却下寄り | 空ヘッダ処理のため意図的 |

## 確認済みルール

1. Markdown serialize は末尾改行なし・LF 結合がテストロック
2. CellValue は string のみ。JSON/YAML の型損失は設計トレードオフ
3. csvFormulaGuard / omitEmptyCells はオプトイン（既定 false）だが変更時は dirty
4. Canvas グリッドのため XSS 経路は構造上なし
5. ブラウザ版は UTF-8 読込だが BOM は parseCsv で除去
6. Tauri drag-drop は v2 名 `tauri://drag-drop`、listen は1回だけ
7. 最終行削除は EmptyState に落とさず `[[""]]` を維持
8. コンテキストメニュー操作は setState 後の selection を読まず、menu 座標から同期構築

## 実施した修正

（結果報告 md と同期）

## 実行した検証

- `bun x tsc --noEmit` → OK
- `bun run test` → 73 件全通過
- `bun run lint` → OK

## 実行しなかった検証

- `bun run build` / `cargo build` / `tauri build`: 監査制約

## 判断待ち事項

1. YAML 非引用スカラーの数値化（leading zero 消失）— 完全保持は parser 変更が大。README 明記 or 専用 schema は将来。
2. JSON 大きな整数の精度損失 — JSON.parse 制約。bigint ライブラリ導入は抜本。
3. detectDelimiter サンプル行数 — 5→N の閾値は性能判断。
4. クリップボード複数行のカンマ分割ヒューリスティック — 仕様判断。
5. クリップボードへの formula guard 適用 — オプトイン設定と連動させるか。

## 進言事項

1. Tauri `read_file`/`write_file` のセッション path allowlist（dialog/drop 由来のみ）
2. ReDoS: worker + timeout / RE2
3. 設定の localStorage 永続化（`plan_group-a-ux_c1`）
4. 履歴に colWidths を載せる
5. `vite --host 0.0.0.0` は dev 時 esbuild 系リスクを広げる — localhost 既定推奨
6. 非 UTF-8 高 replacement デコードの確認ダイアログ
7. blocking dialog を async コマンドから外す

## 完了条件（rubric）

1–15: 全充足（結果報告・確認済みルール・DBなし記録・調査・敵対的検証・最小修正・抜本なし・機能維持・tsc/test/lint・git status・commit/build なし・スコアヘッダ・スコア影響・対処手順・逐次 report）
