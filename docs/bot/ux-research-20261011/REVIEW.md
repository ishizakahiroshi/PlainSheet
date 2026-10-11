---
type: reference
status: stable
tags: [ux-research, independent-review]
owner: codex
review_status: draft
related: [README.md, FACTS.md, PROGRESS.md]
last_reviewed: 2026-10-11
---

# 独立反証レビュー

提案者と別contextの担当がREADME/FACTSと固定sourceを読み、実際のcaller→結果まで調べる。独立担当を利用できなければ自己点検と明示する。

特に反証すること:

1. developにだけ残りPR #1で解決した問題を、候補の不具合として再提案していないか。
2. 新機能を不具合と誤分類していないか。ソースのabsence、操作不能、未確認を分けているか。
3. 保存/cancel/失敗/dirty、clipboard/hidden rows、履歴/selection/タブに根拠があるか。
4. 公式資料が支持するのは何か。Excel desktop/Web、Google Sheets、OS差を混ぜていないか。
5. ラベル変更だけで実際の操作問題を解いたことにしていないか。UI増加や確認の増加で作業を遅くしないか。
6. 数式・書式・複数sheet・コメントなどを採用すると、プレーンテキスト保存で何が失われるか説明しているか。
7. HTML/MDのID・分類・優先度・採否・確度・根拠が一致するか。HTMLが模式図を実画面と偽っていないか。
8. 全領域に実施/未実施理由があり、実画面/IME/native/performanceの未検証を隠していないか。
9. 再現していない影響や秒数・工数を実測として書いていないか。見送り案にも利用者の理由があるか。

提出: 対象source SHA/提案revision、担当分離の方法、各指摘への反証結果、撤回/統合/修正、実行commandと結果、未検証。指摘なしも調べた範囲を書く。古いrevisionのPASSを新しい成果に流用しない。
