# Agent Entry Point (PlainSheet)

This repository's operational guidance is maintained in `CLAUDE.md`.

- Project overview, tech stack & build rules: `./CLAUDE.md`
- README: `./README.md`
- Local/private additions (if present, not committed): `./*.local.md`, `./docs/local/`

Personal/global AI rules are intentionally kept outside this repository. Use each
AI tool's supported global instruction location for user-specific rules; this
file must remain valid for a fresh public clone with no private files.

If any project guidance conflicts, follow `CLAUDE.md`.

## AI 作業共通ルール

- ビルド・コミット禁止、secrets-scan 責務、plan/bugfix/pending md の作成ルール等の AI 作業共通ルールは、各利用者のグローバル AI 設定に従う（作者環境の例: `~/.claude/CLAUDE.md` および `~/.claude/guides/`）