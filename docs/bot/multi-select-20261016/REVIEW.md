# P-20261016-003 PlainSheet: independent review

The reviewer must be a separate dots worker from the implementer. Read README, FACTS and SPEC, then inspect every product/test change from the recorded first instructions-only commit to the submitted product SHA. Instruction documents are expected scoped files, not unrelated changes. Do not use test counts as proof that an event reaches the intended operation.

Review these failure paths in particular:

1. Right click on selected row markers, column headers and selected cells preserves the whole selection; outside clicks replace it. Counts and action targets agree. Stale target/document revisions cannot execute.
2. Discontiguous batch targets neither touch gaps nor expand to the virtual grid. Insert-below and duplicate anchor after the maximum selected target, not after the clicked middle target.
3. Actual hooks/App are exercised. Tests that copy the implementation algorithm or only assert a helper's shape cannot establish integration behavior.
4. Clear and cut preserve trailing positions; failed clipboard writes never clear. Paste into discontiguous targets has an explicit reason instead of gap overwrites. Long identifiers and quoted tabs/newlines survive.
5. One Undo/Redo restores the complete operation and the necessary widths/visibility/selection state. No-op, cancellation and view-only operations have the correct dirty/history behavior.
6. Hidden and filtered source indices remain correct after edits, column structural operations and tab switches. Save includes hidden data. All-hidden state has an accessible reveal path.
7. Keyboard/menu focus, viewport edges and IME are assessed in an available real UI or explicitly recorded as unobserved. Existing single-selection paths and save/format behavior remain compatible.
8. Scope excludes old UX branches, workflows/manifests/locks/new dependencies, formulas/collaboration and external operations. Check the real base SHA has not been changed by this task.

Output: reviewer identity/ownership, exact reviewed code SHA, diff baseline, paths read, commands/exit statuses, severity/reproduction/expected-versus-actual for each finding, fixed/rechecked findings at the revised SHA, and unobserved gates. No findings also requires this coverage statement. Publish the report under `docs/bot/multi-select-20261016/results/` and link it in the management Issue and board.

The local coordinating AI reviews the assembled candidate independently after this report. Its findings return through the same task thread and Issue. Keep implementing bounded fixes until verified; the user is not the message carrier.

