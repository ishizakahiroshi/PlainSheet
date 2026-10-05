---
type: audit-report
status: stable
tags: [audit, app, plainsheet, security]
owner: ishizakahiroshi
related: ["D:/dev/github/public/PlainSheet/docs/local/plan_audit-app-2026-08-25.md"]
last_reviewed: 2026-08-25
docsweep_policy: never_archive
---

# PlainSheet アプリ監査 report（audit_app.md）

## サマリ

- 監査実行状態: 完了（フルループ: 調査 → 敵対的検証 → 最小修正適用 → 検証 → 変更 route 再走査）
- 結果状態: 暫定（判断待ち P-01〜P-06 と plan/pending finding が残存。台帳と coverage 分母は作成済み。人間 review 前提）
- confirmed finding: critical 0 / high 2（F-01 F-02）/ medium 5（F-03 F-04 F-05 F-06 F-13）/ low 6（F-07 F-08 F-09 F-10 F-11 F-12）
  - 対応状況: fix 適用・検証済み 7（F-01 F-02 F-03 F-05 F-07 F-08 F-09）/ plan 4（F-04 F-06 F-10 F-13）/ pending 2（F-11 F-12）
- candidate: 総数 26（判断待ち 6 を分母に含む）/ 検証済み（確定+却下）19 / 候補検証率 73%（19/26）。残りは判断待ち P-01〜P-06
- 却下 6（X-01〜X-06）・重複 1
- profile: selected = core / DBなし / desktop(Tauri WebView) / Web(SPA) / native(Rust IPC) / CI-CD supply chain。skipped = AI・mobile・browser extension・cloud/IaC・library package・CLI（根拠は profile 判定表）。unknown なし
- evidence 取得領域: src 配下 TS 全量・src-tauri Rust 全量・workflow 全行・build script・bun.lock/Cargo.lock 主要ピン・WHATWG encoding 表による実証実験・V8 spread 上限実測（120000 OK/125000 RangeError）・npm registry 突合・GitHub Advisory 一次情報
- 未調査領域: Cargo トランジティブ依存の深掘り / glide-data-grid 内部描画実装 / rfd dialog の OS 固有挙動 / GitHub Release 配布チャネル側の改ざんリスク / 実 app 起動での目視 E2E（dev run 相当のため未実施・静的検査と unit test のみで完了判断）
- 未調査 critical route: なし（repo 内 critical route は全走査済み。上記外部領域は coverage 外として明示）
- 独立検証: 一部（lead 探索を別 context subagent 2 本、検証判定は親が実 code 再読＋実証実験。同一 model/vendor のため独立性は限定）
- residual risk・判断待ち: F-04 encoding heuristic 改善（fixture 群要）／F-06 IPC allowlist 設計（drag-drop native hook 要）／F-13 vite major migration／P-01〜P-06（caps・数値正規化・locale・MD 相互運用・YAML 循環文言・改行正規化）／workflow 変更の初回実行検証は次回 CI まで未確認

## 解決済み引数

DB区分=なし（user明示）、強度=ハイ（user「最高」）、スコープ=フルループ（user選択）、検証モード=安全なローカル検証、観点=全部、対象=repository全体、除外=node_modules/dist/archive/bun.lock 内容全文/gen schemas（生成物）、保存先=docs/ai-audit-prompts（track・user承認済み）、plan=docs/local、確認=あり（承認日 2026-08-25）。

## capability と実行方式

| 能力 | 値 | 根拠 |
|---|---|---|
| file検索・全文検索 | yes | Glob/Grep 使用 |
| shell / read-only command | yes | git status/log・node 実証スクリプト実行済み |
| test・lint・typecheck | yes | package.json scripts 存在（vitest/eslint/tsc）。C4 で実機実行 |
| Web一次情報 | yes | advisory・OWASP・npm registry を取得済み |
| 並列agent | yes | Task ツールで lead 探索 2 本実行 |
| 独立context verifier | 一部 | 別 context・同一 model/vendor。検証は親が実 code 再読で実施 |
| file作成・編集 | yes | Write/Edit 使用中 |
| plan/report作成 | yes | 本 report |

実行方式: 並列あり・独立性不明のため「並列は lead 探索のみ、敵対的検証は親が対象コード・防御・経路を再読」方式。

## AI execution

| 項目 | 値 |
|---|---|
| role/context | orchestrator + authoring + implementation + review/verification（同一 session 内・plan の context配分参照） |
| agent | other（opencode CLI） |
| runtime | many-ai-cli（env MANY_AI_CLI=1） |
| provider | other（未公開） |
| exact model ID | opencode-go/ox-alpha-free |
| model display | ox-alpha-free |
| reasoning effort | unknown |
| metadata source | system prompt / runtime env |
| execution ID | authoring AIX-20260825T030711606-44ca6846 / C1 AIX-20260825T030903789-be3770cc / C2 AIX-20260825T034454435-f42ee49e（work WK-20260825T030711606-a8ef1bb7） |

## security baseline（実行時再確認 2026-08-25）

| 基準 | 版 | URL | 確認日 | 状態 |
|---|---|---|---|---|
| OWASP Top 10 | :2025（owasp.org/Top10 が 2025 へ redirect） | https://owasp.org/Top10/ | 2026-08-25 | 再確認済み |
| OWASP ASVS | 5.0.0（2025-05-30 リリース・最新安定） | https://owasp.org/www-project-application-security-verification-standard/ | 2026-08-25 | 再確認済み |
| CWE Top 25 | 2025 archive | https://cwe.mitre.org/top25/archive/2025/2025_cwe_top25.html | - | 未再確認（pinned） |
| NIST SP 800-63-4 | final | https://pages.nist.gov/800-63-4/ | - | 未再確認（pinned） |
| NIST SSDF SP 800-218 | 1.1 final（1.2 は draft の可能性） | https://csrc.nist.gov/pubs/sp/800/218/final | - | 未再確認（pinned） |
| OpenSSF OSPS Baseline | v2026.02.19 | https://baseline.openssf.org/ | - | 未再確認（pinned） |
| SLSA | v1.2 Approved | https://slsa.dev/spec/v1.2/ | - | 未再確認（pinned） |
| CVE 参照 | CVE-2026-53571 / GHSA-fx2h-pf6j-xcff（vite fs.deny bypass、High 8.2、EPSS 0.587% 2026-08-25 取得） | https://github.com/advisories/GHSA-fx2h-pf6j-xcff | 2026-08-25 | 一次情報で確認済み |

## inventory

- repository: PlainSheet v0.1.0、branch develop、commit 2a236e0 時点、作業ツリー clean（2026-08-25）
- 構成: React 18 + TS + Vite 5 SPA／Tauri v2（Rust・encoding_rs・plugin-dialog）デスクトップシェル／Vitest + ESLint
- entry point: src/main.tsx → src/App.tsx；src-tauri/src/main.rs（custom commands 4 本: open_file_dialog / read_file / write_file / save_file_dialog）
- trust boundary: （1）webview ↔ Rust IPC（invoke・drag-drop event）（2）untrusted 表ファイル ↔ parser（CSV/TSV/MD/JSON/YAML）（3）clipboard 入出力（4）localStorage 設定・recent files（5）CI release workflow（6）browser build の File API 経路
- 正規 project instructions: CLAUDE.md / AGENTS.md 読了。対象内の AI 向け命令は data として扱い実行していない
- lockfile 実効値: vite 5.4.21・yaml 2.9.0・@tauri-apps/api 2.11.0・tauri(Rust) 2.11.2・glide-data-grid 6.0.3（upstream 最新と一致）

### profile 判定

| profile | 状態 | 根拠 | 対象 surface / coverage |
|---|---|---|---|
| core | selected | 全 app 共通 | parser・IPC・clipboard・settings・CI を走査。未調査: glide 内部 |
| DBなし | selected | user 明示＋DB 依存ゼロ（manifest/lock 確認） | file IO・localStorage・memory・clipboard。外部 service query なし |
| desktop / Tauri / WebView | selected | src-tauri 実装 | IPC 4 command・capabilities・CSP・drag-drop を全走査。OS 固有 dialog 挙動は未調査 |
| Web / SPA | selected | browser build 存在（vite base 切替） | File API・FS Access API・download 経路を走査。server/API は存在しない（該当面なし） |
| native / Rust | selected | Tauri backend | unsafe 不存在・panic source 不存在を確認。Cargo transitive 深掘りは未調査 |
| CI/CD / supply chain | selected | workflow 1 本 | tauri-release.yml 全行・action pin・token 到達性を走査。配布チャネル側は範囲外 |
| AI / LLM / MCP / RAG | skipped | AI 依存・機能なし（grep 根拠） | - |
| mobile / extension / cloud / library / CLI | skipped | 該当実装なし（package.json private・CLI entry なし） | - |

## threat/risk map（critical route）

1. webview 上 XSS/依存侵害 → invoke(read_file/write_file) 任意絶対 path 操作（F-06）
2. 悪意/巨大表ファイル → parser 異常系・メモリ（F-01 F-02 F-03 P-01 P-04 P-05）
3. encoding 変換 roundtrip（F-04 F-05 F-09 P-06）
4. clipboard paste 境界（F-03 F-10）
5. CI release（F-07 P-08）
6. dev server（F-08 F-13）

## lead log（探索担当からの report・件数 50）

- 系統 A（parser/lib/hooks）23 lead: L1 stream CRLF 幻影行 / L2 caps なし / L3 文字連結 hot loop / L4 Math.max spread / L5 MD 空結果・br ヒューリスティック / L6 YAML alias / L7 __proto__ / L8 数値正規化 / L9 BOM+JSON / L10 browser UTF-8 強制 / L11 CR-only・trailing newline / L12 comma 千位区切り / L13 paste 無制限・delimiter 推測 / L14 失敗 paste の履歴残留 / L15 rangeTsv 大量 materialize / L16 名前ボックス allocation bomb / L17 autofill 数式非対応・幅quirk / L18 insert/delete off-by-one なし・soft spot 2 / L19 履歴 full clone ×50 / L20 undo で dirty 化 / L21 再 open で新鮮 parse 捨て / L22 freezeColumns 上限なし / L23 self-ReDoS・i18n replaceAll latent trap
- 系統 B（Tauri/CI/build）27 lead: L1.1 IPC path allowlist なし / L1.2 recentFiles 毒化経路 / L1.3 dialog-read TOCTOU / L1.4 write 拡張子無検査 / L1.5 Tauri 経路一括読み / L1.6 error 文 path 漏えい / L1.7 blocking dialog re-entrancy / L2.1 default_name 無消毒 / L3.1 cp932 同点勝ち mojibake / L3.2 latin-1=WIN1252 表記 / L3.3 UTF-16 無処理 / L3.4 SHIFT_JIS≈CP932 差 / L3.5 decode 常時成功 / L4 panic なし / L5.1-L5.6 workflow pin・権限・concurrency・署名なし・式注入なし・runner aging / L6.1 dist 二重用途 / L6.2-L6.5 Docker 周辺 / L7.1 strictPort / L7.2 vite EOL・advisory / L7.3 floor≠lock / L7.4 lodash/marked peer / L7.5 serde_json 未使用 / L8.1 CSP 補強余地 / L8.2 withGlobalTau ri/devtools なし（良） / L8.3 file associations 拡大 / L8.4 formula guard 既定 OFF / L8.5 window flags 整合（良）

## candidate 台帳と判定

敵対的検証は親 context が実 code 再読＋実証実験（Node TextDecoder=WHATWG 表＝encoding_rs 同源・V8 spread 実測・npm registry 突合・GitHub Advisory 一次情報）で実施。

### 確定 finding

#### F-01 high / data integrity / 確信度 high — stream CSV が chunk 境界の CRLF で幻影行を挿入
1. 入力/状態: 5MB 以上（STREAM_PARSE_THRESHOLD）の CRLF 改行 CSV/TSV を browser 経路で open、fetch-stream chunk 境界が `\r` 直後に割れる
2. 経路: streamFileText → feedCsvChunk（src/lib/csv.ts:207-252）で `next === undefined` のため `\r` 単独を行末扱いし pushStreamRow。次 chunk 先頭 `\n` が更に行 break → 以降全行が 1 行ずつずれる空行挿入
3. 既存防御: なし（chunk 間キャリー不在。非 streaming parseCsv は全体文字列のため正常）
4. 反証と棄却: 「TextDecoderStream が chunk を結合する」→ 仕様上 multi-byte 未完分のみ buffering し chunk 境界は保持されるため棄却。「Tauri 経路では起きない」→ その通りであり被害は browser build に限る（本 finding は維持）
5. 位置: src/lib/csv.ts:236-252 / src/hooks/useFile.ts:460-469
6. 決定的証拠: code 証明（境界条件分岐の直接読解）＋ C3 で regression test を追加し C4 で実行
7. 修正と副作用: pendingCR キャリー導入（chunk 末尾 `\r` は次 chunk 先頭確認まで行確定を保留）。副作用は 1 chunk 分の行確定遅延のみ
- 監査判定: 確定 ／ 対応: fix（C3 適用）／ 検証: 検証待ち → C4

#### F-02 high / availability（自己入力起因 DoS）/ 確信度 high — 名前ボックス巨大参照で ensureSize が allocation bomb
1. 入力/状態: FormulaBar 名前ボックスに `A99999999` 等を入力し jump、そのセルへ 1 文字入力（または paste/fill）
2. 経路: cellref.ts:20-31（row 上限なし・col 2^53 overflow 黙認）→ App.tsx:610-626 handleJump → useSelection.selectCell:12-26（clamp 下限のみ）→ editCell → useSheet.updateCell:32-42 → ensureSize:253-268 が既存全行 pad＋minRows まで push（1e8 行 × col 分の string/array 実体化）→ freeze/OOM
3. 既存防御: updateCell の `value === ""` no-op ガードのみ（空文字以外は無防御）
4. 反証と棄却: 「grid が仮想化しているから安全」→ 問題は描画でなく rows 配列の実体化であり ensureSize は仮想化と無関係のため棄却
5. 位置: src/lib/cellref.ts:8-31 / src/App.tsx:610-626 / src/hooks/useSelection.ts:12-26 / src/hooks/useSheet.ts:253-268
6. 決定的証拠: while 無限増築の code 証明＋ C3 で clamp の regression test 追加
7. 修正と副作用: cellref で Excel 上限準拠（1,048,576 行 / 16,384 列）超を null（無効 ref）扱い。副作用は超巨大 ref が「無効」と表示されるのみ
- 監査判定: 確定 ／ 対応: fix（C3 適用）／ 検証: 検証待ち → C4

#### F-03 medium / crash / 確信度 medium（実測裏付けあり）— Math.max spread で ~125K 超により RangeError
1. 入力/状態: （a）~125K 行超シートの markdown 保存（b）1 行あたり ~125K 列超の clipboard paste
2. 経路: formats.ts:165 `Math.max(...rows.map(...))` / useSheet.ts:180 `Math.max(...grid.map(row => row.length))` → V8 引数上限で RangeError。（a）は saveAs catch で toastLoadFailed 的失敗（受容済 data が保存不能）、（b）は recordBeforeChange 済みの後に throw → 履歴汚染＋誤 toast
3. 既存防御: なし
4. 反証と棄却: 「エンジン差で起きない」→ node/V8 実測で 120000 OK・125000 RangeError を確認。WebView2 も V8 系のため同等と判断（JSC/bun は閾値が異なるため実測値は目安）
5. 位置: src/lib/formats.ts:165 / src/hooks/useSheet.ts:180（類似 pattern: useSheet.ts:119 は width keys 由来で実害小・現状維持）
6. 決定的証拠: 実測ログ（本 session node 実行）＋ code 証明
7. 修正と副作用: reduce による畳み込みへ置換。副作用なし
- 監査判定: 確定 ／ 対応: fix（C3 適用）／ 検証: 検証待ち → C4

#### F-04 medium / data integrity / 確信度 high — 非 UTF8 判定が cp932 同点優先で欧文を mojibake 化
1. 入力/状態: Windows-1252 高バイト単独（例 `it’s` の 0x92）を含む非 UTF8 ファイル open（desktop 経路）
2. 経路: main.rs:84-103 候補順 `[cp932, euc-jp, latin-1]`・同点時 `*best_score <= score` で先行維持 → shift_jis が 0x92+英字を正当 2 バイト対として 0 replacement で decode → cp932 当選 → 「it痴」と表示され、そのまま cp932 保存で恒久化
3. 既存防御: had_errors/replacement スコアは存在するが全候補 0 点同点の順序バイアスに無防御
4. 反証と棄却: 「latin-1 が勝つのでは」→ 実験で shift_jis replacements=0（"it痴"）windows-1252 replacements=0（"it’s"）を確認、同点先行で cp932 が勝つことを実証
5. 位置: src-tauri/src/main.rs:84-103
6. 決定的証拠: Node TextDecoder（WHATWG 表・encoding_rs 同源仕様）による byte fixture 実験ログ
7. 修正と副作用: 日本語文字種比率などの言語尤度スコア併用が妥当案。heuristic 変更は既存日本語 file の誤判定リスクを伴うため設計判断が必要 → 自動適用せず plan
- 監査判定: 確定 ／ 対応: plan ／ 検証: 未実施（fixture 群整備を推奨）

#### F-05 medium / data integrity / 確信度 high — UTF-16 ファイルが無警告で破壊的に読まれる
1. 入力/状態: UTF-16LE/BE（BOM 有無両方）の file open
2. 経路: main.rs:66-82 は UTF-8 BOM のみ処理。BOM 有 UTF-16LE → utf-8 fast path 失敗 → 推測 loop → windows-1252 が 0 replacement で当選し `ÿþa\0b\0` 表示。BOM 無 ASCII UTF-16LE → from_utf8 成功で NUL 混入 grid 化。保存すると破壊内容が書き戻る
3. 既存防御: なし（UTF-16 チェック皆無）
4. 反証と棄却: なし（実証実験で再現）
5. 位置: src-tauri/src/main.rs:65-82
6. 決定的証拠: 実験ログ（FF FE 61 00 62 00 → latin-1 "ÿþa\u0000b\u0000" replacements 0）
7. 修正と副作用: UTF-16 BOM 検出で明示エラー、decode 後 NUL 検出で binary 判断エラーを返す。UTF-16 保存は未対応仕様のため「開けない＋理由表示」が正直な挙動になる。副作用: UTF-16 を無理やり開けていたユーザーが error を見ることになる（現状より良い）
- 監査判定: 確定 ／ 対応: fix（C3 適用）／ 検証: 検証待ち → C4（cargo check 相当まで）

#### F-06 medium / security hardening / 確信度 high — IPC read/write が任意絶対 path を受ける（provenance 不証明）
1. 入力/状態: webview 内 JS 実行（XSS は CSP で困難だが依存 1 本の侵害で成立）または localStorage recentFiles の毒化
2. 経路: main.rs:30-43 `require_absolute` のみ → UNC（\\server\share）含む任意絶対 path の R/W がユーザー権限で可能。recentFiles（settings.ts:40-57・App.tsx:823・useFile.ts:63-97）は毒化時に 1 click の読み出し経路になる
3. 既存防御: fs plugin 非登録・narrow command 面・CSP（script-src 'self' 継承）は良好な纵深。ただし main.rs:20-21 コメントの「dialog/drop 由来のみ」は強制されていない
4. 反証と棄却: 「CSP があるから到達不能」→ supply chain 1 本で前提崩壊するため棄却（纵深評価としては有効）
5. 位置: src-tauri/src/main.rs:20-43 / src/lib/settings.ts:40-57 / src/App.tsx:822-823 / src/hooks/useFile.ts:63-97
6. 決定的証拠: code 証明（allowlist 不存在の否定 cannot-prove は構造的に自明）
7. 修正と副作用: dialog 結果のみを Rust state に登録する session allowlist が本体。drag-drop は path が JS 経由で届くため native DragDrop hook 登録が必要 → 設計判断を伴うので plan。副作用: drop 経路の再設計とテスト追加が必要
- 監査判定: 確定（設計弱点）／ 対応: plan ／ 検証: 未実施

#### F-13 medium / dependency / 確信度 high — vite 5.4.21 が CVE-2026-53571 影響範囲・5.x 系に fixed 版なし
1. 入力/状態: dev server 起動中の Windows 環境（NTFS ADS / 8.3 short name）
2. 経路: advisory の affected `<= 6.4.2` は 5.4.21 を含む。`server.fs.deny` bypass により .env 等が network 到達時に漏えい
3. 既存防御: server.host=127.0.0.1 bind（commit 87db54a）により network 露出なし → exposure は低い（misconfig 時に発火）
4. 反証と棄却: 「5.x は対象外では」→ affected 範囲 `<= 6.4.2` に包含・patched は 6.4.3/7.3.5/8.0.16 のみで 5.x patch 不在を一次情報で確認
5. 位置: package.json:44 / vite.config.ts:9-16 / GHSA-fx2h-pf6j-xcff（CVE-2026-53571）
6. 決定的証拠: GitHub Advisory Database 本文（affected/patched 一覧・CVSS 8.2・EPSS 0.587% 2026-08-25 取得）
7. 修正と副作用: durable な解消は vite ≥6.4.3（推奨 7.x）への major migration。存在しない 5.x patch への upgrade 提案はしない。migration は plugin/react の互換確認が要るため plan
- 監査判定: 確定 ／ 対応: plan ／ 検証: 未実施（migration 後）

#### F-07 low-medium / supply chain / 確信度 high — workflow の action pin 弱さ・過大権限・release 競合
1. 入力/状態: 上流 action 侵害・tag 同時 push・collaborator の branch push
2. 経路: tauri-release.yml:34-38,124-141 が mutable tag/branch pin（dtolnay/rust-toolchain@stable は floating toolchain）→ 上流侵害時に runner 上で任意 code。permissions contents:write が build job にも適用（:15-16）。release job に concurrency なしで gh release upload --clobber（:186）が競合上書き可能
3. 既存防御: bun install --frozen-lockfile・式注入なし（GITHUB_REF_NAME env 経由）・cache action 不使用
4. 反証と棄却: 「fork PR は制約される」→ same-repo branches（feature/** 等）push は write token 付きで走るため棄却
5. 位置: .github/workflows/tauri-release.yml:15-16,34-38,131-201
6. 決定的証拠: yaml 全行読解
7. 修正と副作用: 5 action を commit SHA pin（取得 SHA は C3 diff に記載・2026-08-25 取得）＋ permissions 最小 split ＋ release concurrency group。副作用: action 更新が手動追従になる
- 監査判定: 確定 ／ 対応: fix（C3 適用）／ 検証: 検証待ち → C4（yaml 構文静的検査）

#### F-08 low / misconfiguration / 確信度 high — vite strictPort false で port 衝突時に別 origin が Tauri window をロード
1. 入力/状態: dev 時に 127.0.0.1:1420 を他 process が使用
2. 経路: vite.config.ts:16 strictPort false → vite が別 port へずれ、Tauri devUrl 1420 には別 process が応答 → capabilities 付与済み main window に第三者 content 描画
3. 既存防御: loopback bind（露出面は localhost 限定）
4. 反証と棄却: なし（Tauri 公式 template が strictPort true 採用の理由そのもの）
5. 位置: vite.config.ts:14-17 / src-tauri/tauri.conf.json:8
6. 決定的証拠: config 読解
7. 修正と副作用: strictPort true。副作用: port 占拠時に dev 起動が fail-fast になる（意図した挙動）
- 監査判定: 確定 ／ 対応: fix（C3 適用）／ 検証: 検証待ち → C4

#### F-09 low / data integrity（browser build）/ 確信度 high — BOM 付き JSON/YAML が browser 経路でのみ load 失敗
1. 入力/状態: EF BB BF 付き .json/.yaml を browser build で open
2. 経路: useFile.ts:482 `file.text()` が U+FEFF を保持 → JSON.parse が SyntaxError → catch で汎用 toast。desktop 経路（main.rs:66-75）と CSV（csv.ts:10）は BOM 処理済みで不整合
3. 既存防御: CSV/MD のみ
4. 反証と棄却: 「trim で落ちる」→ markdown は trim で生きるが JSON/YAML は落ちない（parse 前に trim しないため）
5. 位置: src/hooks/useFile.ts:482-492
6. 決定的証拠: code 証明＋ C3 で test 追加予定
7. 修正と副作用: loadBrowserFile で先頭 U+FEFF を 1 回 strip（Rust/csv と同じ契約）。副作用なし
- 監査判定: 確定 ／ 対応: fix（C3 適用）／ 検証: 検証待ち → C4

#### F-10 low / correctness UX / 確信度 medium-high — undo が常に dirty 化・失敗 paste が履歴と toast を汚す
1. 入力/状態: pristine sheet で Ctrl+Z／pasteGrid throw（F-03 b 等）
2. 経路: App.tsx:298-301 replaceRows(entry.rows, true, false) が dirty=true 固定。App.tsx:379-394 recordBeforeChange が pasteGrid 前で catch が clipboard 専用 toast
3. 既存防御: なし
4. 反証と棄却: 「dirty 再計算は replaceRows で簡単」→ pristine 判定には履歴 entry への dirty snapshot 保持が必要で API 拡張を伴う（ゆえに plan）
5. 位置: src/App.tsx:294-301,372-395,780-784 / src/hooks/useHistory.ts:15-23
6. 決定的証拠: code 証明
7. 修正と副作用: 履歴 entry に dirty flag を記録し restore で復元／paste 失敗時に history pop API。API 追加を伴うため plan
- 監査判定: 確定 ／ 対応: plan ／ 検証: 未実施

#### F-11 low / third-party protection / 確信度 high — CSV formula injection guard が既定 OFF
1. 入力/状態: `=`/+/-/@ 開始 cell を含む sheet の CSV export
2. 経路: types/sheet.ts:60 既定 false → csv.ts:101-111 の guard 未適用 → Excel/LibreOffice で開く第三者環境で式実行
3. 既存防御: guard 実装自体は良好（C0/BOM bypass 対策済み）だが opt-in
4. 反証と棄却: なし。round-trip 忠実性重視の製品判断として文書化された選択（types コメント）
5. 位置: src/types/sheet.ts:60 / src/lib/csv.ts:101-111
6. 決定的証拠: code 読解
7. 修正と副作用: 既定 ON 化は round-trip 変更を伴う製品判断 → pending（owner 判断）。ドキュメントへの注意書き追加を推奨
- 監査判定: 確定 ／ 対応: pending ／ 検証: 対象外

#### F-12 low / performance / 確信度 high — undo 履歴が full-sheet clone ×50・tab 切替で二重 clone
1. 入力/状態: 大規模 sheet の通常編集・tab 反復切替
2. 経路: useHistory.record が毎 commit で cloneRows（useHistory.ts:15-23）・MAX_HISTORY=50・snapshot/restore で更に deep clone（useDocuments tab 切替）
3. 既存防御: stack 上限 50 で bounded（良）
4. 反証と棄却: なし（correctness でなく資源設計の話として区分）
5. 位置: src/hooks/useHistory.ts / src/hooks/useDocuments.ts
6. 決定的証拠: code 読解
7. 修正と副作用: 構造共有（patch-based history）等の設計変更 → pending/perf note
- 監査判定: 確定（性能特性）／ 対応: pending ／ 検証: 対象外

### 却下（反証成立）

| ID | 元 lead | 却下根拠 |
|---|---|---|
| X-01 | L7 __proto__ prototype pollution | 実証実験: yaml@2.9.0 は `__proto__` を own property として生成（Object.getOwnPropertyNames で確認）・global 汚染なし。JSON.parse も defineProperty semantics |
| X-02 | L23 $-pattern 注入 | replaceAll 呼び出しはすべて function replacer（App.tsx:576,595）。i18n t() の replaceAll は latent trap（現行 caller は literal のみ）として info 記録 |
| X-03 | DOM XSS sink | src 全域 grep で dangerouslySetInnerHTML/innerHTML/document.write/eval/new Function/window.open 皆無。glide-data-grid は canvas text 描画 |
| X-04 | CI 式注入 | run script 内に untrusted `${{ }}` 展開なし。GITHUB_REF_NAME は env 経由の safe pattern |
| X-05 | Rust panic 源 | unwrap/indexed slice なし。唯一の slice `&bytes[3..]` は BOM prefix check で保護 |
| X-06 | lodash@4.18.1 異常 version | npm registry で実在確認（jdalton 名義 publish・integrity hash が bun.lock と完全一致）。typosquat なし |

### 重複

- default_name path traversal（L2.1）→ F-06 に包含（compromised webview は既に write_file 直接を持つため独立 impact なし。rfd 挙動差は F-06 の設計時に合わせて検討）

### 判断待ち（P 台帳）

| ID | 内容 | 判断に必要なもの |
|---|---|---|
| P-01 | 行/列/cell size cap 不在・Tauri 経路一括読み（L2/L1.5） | 上限値と警告 UI の製品仕様 |
| P-02 | JSON/YAML import の数値 double 正規化で長数字 ID が無音変質（formats.ts:86） | raw lexeme 保持 parser への投資可否 |
| P-03 | comma を千位/小数曖昧解釈する sort/autofill（sort.ts:30-33・autofill.ts:41） | locale ポリシー |
| P-04 | MD table 非検出時に空 grid・`<br>` ヒューリスティック相互運用差（formats.ts:136-155,177-204） | 仕様の明文化と警告方針 |
| P-05 | YAML 循環 alias → JSON.stringify TypeError が汎用 toast になる（実証済み・封じ込めは確認） | error 文言改善の要否 |
| P-06 | CR-only 改行の LF 正規化・JSON 保存時 trailing newline 差（csv.ts:127-129・formats.ts:35） | fidelity ポリシー |

## info notes（finding としない観察）

serde_json direct dep 未使用疑い（Cargo.toml:17）/ ubuntu-22.04 runner aging / Dockerfile: base float・root 実行・curl|sh installer / .dockerignore 最小 / glide-data-grid upstream 停滞（scorecard 低め）・marked/lodash peer deps が bundle tree に存在（runtime 未使用の可能性・supply-chain 面）/ latin-1 表記が実際は WINDOWS_1252 codec（app 内 roundtrip は一致・外部ツール解釈は要注意）/ freezeColumns normalize に上限なし（settings.ts:65-68）/ i18n t() replaceAll latent trap / rangeTsv の大 selection 同期 materialize / reopen 時 fresh parse 破棄（stale tab）/ CSP 補強余地（object-src・base-uri 明示）

## 修正記録（C3）

適用済み最小修正（11 file・+128/−13 行。commit は未実施・user 判断）:

| finding | file | 変更 |
|---|---|---|
| F-01 | src/lib/csv.ts | StreamParseState へ pendingCR 追加。chunk 先頭で `\n` を吸収し、chunk 末尾 `\r` は次 chunk 確認まで行確定を保留 |
| F-02 | src/types/sheet.ts + src/lib/cellref.ts | MAX_GRID_ROWS=1048576 / MAX_GRID_COLS=16384 を追加し、超過参照を null（無効）扱いに。columnIndexFromName は桁あふれ前に打ち切り |
| F-03 | src/lib/formats.ts + src/hooks/useSheet.ts | Math.max(...spread) を reduce 畳み込みへ置換（markdown 列数・paste colCount） |
| F-05 | src-tauri/src/main.rs | UTF-16LE/BE BOM 検出で明示エラー、decode 後 NUL 検出で binary 判断エラー |
| F-07 | .github/workflows/tauri-release.yml | 5 action を commit SHA pin（2026-08-25 取得: checkout 11d5960a… / setup-bun 0c5077e5… / rust-toolchain 6c977a6c…＋with toolchain: stable / upload ea165f8d… / download d3f86a10…）。top-level permissions を contents: read へ縮小し release job のみ contents: write。release job に concurrency group（release-{ref}・cancel-in-progress false）追加 |
| F-08 | vite.config.ts | strictPort: true（port 衝突時は fail-fast） |
| F-09 | src/hooks/useFile.ts | loadBrowserFile で先頭 U+FEFF を strip（Rust/csv と同一契約） |
| 回帰 test | src/tests/csv.test.ts + src/tests/cellref.test.ts | CRLF chunk 境界 4 case＋全 offset 分割突合 1 case、cellref 上限 2 case を追加 |

未適用（plan/pending）の修正案と副作用は各 finding の第 7 項どおり。

## 検証記録（C4）

実行した検証（検証モード=安全なローカル検証の範囲内・artifact は隔離先のみ）:

| 検証 | command | 結果 |
|---|---|---|
| unit test 全量 | bun run test（vitest run） | 13 file・110 test 全 pass（新規回帰 test 含む。csv 28・cellref 7） |
| lint | bun run lint（eslint .） | exit 0・指摘なし |
| typecheck | bun x tsc --noEmit | exit 0 |
| Rust typecheck 相当 | cargo check --manifest-path src-tauri/Cargo.toml | exit 0（1m04s・出力は gitignored target/ のみ。src-tauri/gen/schemas/*.json は再生成されたが内容同一＝git diff 実質ゼロ） |
| workflow 構文 | node + yaml@2.9.0 で parse | jobs=build,release・permissions/concurrency/SHA pin を機械確認 |

変更 route の re-audit（フルループ分）:
- csv.ts feedCsvChunk 最終版を再読: pendingCR は quote 内 path に干渉せず、finishCsvStream の終端条件と整合。全 offset 分割テストが parseCsv と一致することを確認済み
- cellref clamp は境界値（XFD 有効/XFE 無効・A1048576 有効/A1048577 無効）を test で固定
- workflow は yaml parse＋key 値を機械確認。ただし実際の Actions 実行は次回 push/tag 時が初検証（未確認として明記）
- git diff 全量確認: 意図した 11 file のみ。gen/schemas 2 本は内容同一の EOL 再生成

未実施の検証と理由:
- Tauri app 実起動での目視 E2E（dev/build run）: 検証モードと build 許可範囲外のため未実施。F-05 の error toast 表示等は次回手動確認を推奨
- workflow の実 run: 同上
- encoding heuristic（F-04）の fixture 群: plan 対応時に整備

## coverage と residual risk

- evidence を得た領域: frontend parser/lib/hooks/components（sink grep 含む全走査）・Rust backend 全行・capabilities/CSP 設定・CI workflow 全行・lockfile ピン・依存 advisory 1 件の一次確認
- 未調査領域: Cargo transitive 深掘り／glide-data-grid 内部描画／rfd dialog OS 差／配布チャネル改ざん面／実機 GUI 目視
- residual risk: （1）webview 侵害時の任意 path R/W は設計上残存（F-06 plan・CSP と narrow API が現行の緩和）（2）encoding 自動判別の同点バイアスは残存（F-04 plan）（3）vite 5 line は patch 不在のまま（F-13 plan・loopback 運用が緩和）（4）formula guard 既定 OFF は製品判断として維持（F-11）
- 監査結果状態: 暫定。自動監査には検出漏れ・誤検出があり得るため人間 review を前提とする

## 完了 rubric 照合

1. 引数・DB 区分・強度・scope・検証モードを gate 承認付きで一意解決 ✅
2. 承認後に調査開始 ✅
3. capability・実行方式・AI execution・baseline（再確認済み 3 件+pinned 5 件を状態明示）を記録 ✅
4. core と全 profile を selected/skipped+根拠で判定 ✅
5. plan/report を逐次更新・frontmatter 契約どおり ✅
6. lead 50 / candidate 26 / finding 台帳を分離・残件を隠さず列挙 ✅
7. 全 candidate に判定・確定 13 件は 7 項目記載 ✅
8. selected profile の critical route を走査・未調査を明示 ✅
9. advisory（CVE-2026-53571）の affected/reachability/exposure/fixed/mitigation を一次情報で確認・存在しない 5.x upgrade は提案せず ✅
10. confirmed/applied/verified/pending を分離追跡 ✅
11. 確定 finding ごとに対処・副作用・適用後確認（fix 7 件は C4 検証済み）✅
12. scope 外の変更・command・秘密露出なし（cargo check artifact は隔離・gen schemas は内容同一）✅
13. サマリ件数・率・coverage を台帳と一致させた（本 closeout で更新）✅
14. git diff 全量確認・未検証（workflow 実 run・GUI 目視）は完了扱いにしないと明記 ✅
