# PlainSheet — AI 向け共通ルール

Claude・Codex など全ての AI エージェントがこのプロジェクトを操作する際に従うルール。

## パッケージマネージャー

- bun を使う
- npm は使わない
- bunx を npx の代わりに使う（例: `bunx create-tauri-app`）
- スクリプト実行は `bun run <script>`

## OSS・ツール・LLM の選定ポリシー

- 中国の OSS は採用しない
- 中国のツールは使わない
- 中国の LLM は使わない
- ライブラリを提案・採用する前に開発元を確認する
- 迷ったら採用せず、ユーザーに確認する

## 実装計画書

- 親 plan: docs/local/plan_plainsheet-v010.md
- 子 plan: docs/local/plan_plainsheet-v010_c{N}_*.md
