---
type: reference
status: stable
tags: [ux-research, source-evidence]
owner: codex
review_status: draft
related: [README.md, REVIEW.md, PROGRESS.md]
last_reviewed: 2026-10-11
---

# 調査開始時の事実

- repoは公開。remoteとGitHub repo metadataで確認。
- develop `037c29ea4649efc81acc8f28824dca3df08e7450`、main `835b24632334724a43b00c8e0883ac9d650e0fdc`、Draft PR #1 head `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6` は2026-10-11のremote確認値。
- 手元developはclean。既存PRはOPEN/DRAFT。既存実装をマージした状態ではない。
- React18/TypeScript/Vite/Bun、Glide canvas grid、Tauri2。CSV/TSV/MD/JSON/YAMLを扱う。
- Web保存はdownload、desktopはRust IOでoverwrite。数式評価はREADMEだけから推測せずsourceへ戻る。
- 主入口: `src/App.tsx`、componentsのToolbar/GlideSheet/FormulaBar/FilterPopover/SearchPanel/ConfirmDialog/SettingsModal/HelpModal/EmptyState/TabBar/StatusBar/TitleBar/ContextMenu、hooksのuseFile/useDocuments/useSheet/useSelection/useHistory/useFilter、libのclipboard/formats/csv/sort/autofill/settings/i18n、styles、Rust IO/close。
- 既存PRの `docs/ux-gap-and-stack-decision.md` と `docs/bot/excel-like-ux-overhaul/PROGRESS.md` に旧未完了工程と後続再開工程が混在。先頭の停止記録だけで候補全体の状態を断定せず、後続記録と実sourceを照合する。
- 前回のクラウド画面操作はloopbackへのERR_BLOCKED_BY_CLIENTで未実施という記録。今回の能力は受付で確かめる。静的検査で実IME/Windows native成功を主張しない。

## 一次資料の調査起点

- Excel keyboard shortcuts: https://support.microsoft.com/en-us/accessibility/excel/keyboard-shortcuts-in-excel
- Google Sheets keyboard shortcuts: https://support.google.com/docs/answer/181110
- Sheets filter/basic filter/filter view: https://developers.google.com/workspace/sheets/api/guides/filters
- W3C WAI ARIA APG: https://www.w3.org/WAI/ARIA/apg/

URLは起点であり、全提案の根拠になったことを意味しない。各指摘を支持するページと節を読んでsourcesへ対応付ける。
