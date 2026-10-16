# P-20261016-003 PlainSheet: facts and baseline

Public snapshot, checked 2026-10-16.

| Fact | Evidence |
|---|---|
| User goal | Select multiple rows/columns and use right click for deletion and other batch actions. The user subsequently requested dots implementation, with the coordinating AI handling direct questions and review iterations |
| Repository identity | `git remote get-url origin`: `https://github.com/ishizakahiroshi/PlainSheet.git`; GitHub reports a public repository |
| Product baseline | Remote `develop` = `037c29ea4649efc81acc8f28824dca3df08e7450` at dispatch preparation |
| Existing unrelated candidates | PR #1 head `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`, PR #4 head `95fc453d1279facece6a1079acdd6797511d448b`; neither is this task's base or write target |
| Grid selection | `src/components/GlideSheet.tsx` uses multi row/column selection and sends selected index arrays to App. Cell/column-header context entry points exist; row-marker entry needs verification and connection |
| Batch changes | `src/hooks/useSheet.ts` already exposes insertRows/deleteRows/insertColumns/deleteColumns. App deletion uses selected arrays and insertion uses selection count |
| Inconsistent target paths | App rangeFromContextMenu/selectContextCell resolve a single context row/column/cell; clipboard/clear and single-column auto-fit do not share a full multi-selection target |
| Content-only clear | useSheet.clearRange trims trailing empty rows; batch clear must preserve the row/column positions promised in SPEC |
| History | `HistoryEntry` currently stores rows and one Selection; restoring widths, multi-selection, and visibility requires an explicit compatible extension |
| Existing test limit | Some useSheet tests reproduce algorithm shapes instead of invoking actual hooks/callers. Add behavior checks through real hooks/App, not copies of implementation |
| Existing CI | `.github/workflows/tauri-release.yml`: PR-triggered 3-platform lint/tests/native compilation. Public PR artifact upload and tag-only release are skipped; do not count skips as executed acceptance |
| Test tooling | package.json: Bun, Vitest, Testing Library, jsdom, TypeScript noEmit, ESLint; no new dependency is needed |

The source snapshot is not proof of the user's currently running executable or native GUI behavior. Private plans and attachments are not available to dots; SPEC contains the needed requirements.

Initial instruction publication commit / product diff baseline: `e676daae5224842ae238d4e0a8047cb0f2307f89`.
Dedicated management Issue: https://github.com/ishizakahiroshi/PlainSheet/issues/5 .

