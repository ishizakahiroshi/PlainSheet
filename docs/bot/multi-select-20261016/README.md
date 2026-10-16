# P-20261016-003 PlainSheet: multi-row and multi-column context actions

Shared implementation instructions, 2026-10-16. These documents are public and use synthetic examples only.

## Start here

Implement the complete [SPEC.md](SPEC.md), in C1 → C2 → C3 → C4 order. The user explicitly requested dots implementation and direct discussion between dots and the local coordinating AI. Do not ask the user to relay technical questions, progress, findings, or revision requests. The coordinating AI owns ordinary scope decisions and the final local review.

- Repository: `ishizakahiroshi/PlainSheet`.
- Work branch: `dots/multi-select-P-20261016-003`.
- Draft PR base: `develop`.
- Behavior oracle and starting product SHA: `037c29ea4649efc81acc8f28824dca3df08e7450`.
- Instructions: `docs/bot/multi-select-20261016/` on the work branch.
- Dedicated management Issue: https://github.com/ishizakahiroshi/PlainSheet/issues/5 . Record all acknowledgment, questions, submissions and review outcomes here.
- Product review diff baseline: first instructions-only commit `e676daae5224842ae238d4e0a8047cb0f2307f89`. Keep it distinct from the behavior oracle, current instructions revision, product SHA, and reviewed SHA.

Start from this branch, not an older UX candidate. Existing PRs #1 and #4 and their remote branches are separate unfinished work. Do not merge, rebase, replace, or push them. Local changes outside this branch and private files are not inputs to this task. This bounded base intentionally matches the product source used to write this feature plan; any later integration of other UX candidates is a separate action.

## Delivery and communication

1. Acknowledge the task number, number collision check, exact instructions SHA read, branch/base/oracle, available OS/toolchain, installed dependencies, browser capability, and independent review ownership.
2. Implement all basic and additional operations in SPEC, retaining single-selection behavior. Keep shared App/grid/state/dictionary edits serialized. Use separate workers only for exclusive files; the integrator owns shared changes.
3. Submit a Draft PR to `develop` early enough for existing CI to verify the work. Use the existing Tauri Build workflow; do not change workflows. Existing lockfile dependency installation by CI is allowed. In the dots environment, use dependencies already available; do not make a new download or package installation a requirement for progress.
4. An implementation-independent reviewer follows [REVIEW.md](REVIEW.md), records a target code SHA, and reviews the full bounded diff. Resolve findings and re-review affected paths at the new SHA.
5. At acknowledgment, questions, checkpoints, submission, interruption, and completion, write a short management Issue comment as well as the current task thread. Slack-only replies cannot wake the local Issue watcher. Every reply starts `#P-20261016-003 PlainSheet: <report>`.
6. Reply only in the same task thread. Ordinary design questions go to the coordinating AI, not the user. Continue independent work while a bounded question is pending; do not create a duplicate task or request a restart.
7. Update [PROGRESS.md](PROGRESS.md) with evidence links. Issue comments are the progress source of truth. Include C-by-C paths, expected/actual results, command/exit status, code SHA, reviewed SHA, CI run/job links and skipped steps, remaining GUI/native acceptance, and rollback instructions.

Owner-side Issue comments end with `<!-- owner-side P-20261016-003 -->`. Do not put that marker on dots reports. This distinguishes the two sides when the same GitHub account posts both.

## Permitted writes

- Commit and push scoped source, tests, and task documents to `dots/multi-select-P-20261016-003`.
- Create/update this task's Draft PR targeting `develop`, management Issue comments, and task board.
- Add needed source helpers/tests under the existing frontend directories using existing dependencies.
- Resolve independent/local review findings within SPEC and submit corrections through the same branch and thread.

## Boundaries

- No direct push to `main`, `develop`, older UX branches, or other repositories. No merge, force push, tags, release, deployment, production data/DB operation, or unrelated Issue/Project creation.
- No changes to workflows, manifests, lockfiles, authentication, formula/collaboration features, or persistence schemas. No new dependencies, charges, secrets, or external services.
- No local product build or product launch without separate instruction. Existing PR-triggered CI may build on its normal platforms; its result is separate from real GUI/native acceptance.
- Never include user attachment values, private paths, private chat locators, credentials, or local watchlists in public text/tests. Use synthetic values.
- If execution approval or policy rejects an operation, preserve the exact stop boundary and partial output. Do not retry through another worker, wording, or transport to bypass it. Report the action and reason to the coordinating AI. Owner-only approval still belongs to the user when the execution platform requires it.

Routine implementation choices are authorized inside SPEC. Stop only for a necessary operation outside these boundaries, a contradictory requirement that cannot be resolved within SPEC, an explicit execution rejection, a repeated critical failure with preserved evidence, or a user-only external approval. Report usable partial code and the next bounded step instead of abandoning the task.

## Completion states

Source implementation, independent review, CI, local comprehensive review, real GUI/canvas/IME, and Windows OS clipboard/native save acceptance are separate states. No whole-task completion claim from test counts alone. The local coordinator will review the assembled candidate once, send one consolidated findings list, then recheck the corrected candidate. Do not require the user to retest each feature or relay findings.
