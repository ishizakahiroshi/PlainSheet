---
type: reference
status: draft
tags: [ux-research, handoff]
owner: codex
review_status: draft
related: [README.md, FACTS.md, REVIEW.md]
last_reviewed: 2026-10-11
---

# #P-20261011-013 PlainSheet：調査資料への入口

- 対象/保存先: `ishizakahiroshi/PlainSheet`（公開）
- 資料branch: `dots/ux-research-P-20261011-013`
- source: develop `037c29ea4649efc81acc8f28824dca3df08e7450` / PR #1 `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`
- 管理Issue: https://github.com/ishizakahiroshi/PlainSheet/issues/2
- この依頼は調査・提案。製品変更/merge/build/起動は含まない。

| 工程 | 担当 | 証跡・残件 |
|---|---|---|
| 指示公開・送信・受付 | 手元Codex / dots | 状態は管理Issueコメントに記録 |
| 操作棚卸し・比較調査 | dots | `results/coverage.md` / `results/sources.md`（未提出） |
| 中間batch・往復反証 | dots / 手元Codex | `results/iterations.md`（未提出） |
| 独立contextレビュー | dots別担当 | `results/review.md`（未提出） |
| 最終MD / HTML | dots / 手元Codex | `results/proposal.md` / `results/proposal.html`（未提出） |
| 実画面/Windows/実IME | 環境を持つ担当 | 今回未確認。sourceだけで合格にしない |

指示commitはgit履歴および管理Issueで固定する。source SHA・指示SHA・成果SHA・review対象SHAを別々に記録する。私有会話locatorを公開資料へ書かない。


## 2026-10-11 調査開始・途中候補

[初回候補batch](results/batch-01.md) / [往復記録](results/iterations.md)。安定ID UX-001〜014、暫定優先度と反証質問を提出。最終MD/HTML・全coverage・公式sources・独立反証は作業中。

GitHub固定source読取とWeb一次資料は実施。Node/既存Playwright/Chromiumを使う資料・合成検査は可能。Vitest依存の取得、製品build/compile/新規起動はしていない。実画面/Windows/native/実IME/性能は未確認。
