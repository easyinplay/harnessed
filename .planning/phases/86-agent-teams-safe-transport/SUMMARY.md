# Phase 86 — Agent Teams safe transport — SUMMARY

Shipped as **v5.0.13** (2026-11-08). Source of the requirement: GSD 1.18.0's
fix for open-gsd/gsd-core#1355 — a chat notification is not a reliable
completion signal for parallel sub-workflows.

## What shipped

- Parallel sub-workflows now complete from a **persisted result artifact**:
  `harnessed prompt <sub>` prints the exact result file the sub must write
  (final result + the verbatim `<promise>COMPLETE</promise>` line), and
  `harnessed checkpoint complete <sub> --result-file <path> --wait <seconds>`
  polls it with a bounded wait. A sub that never signals fails closed with
  `result-wait-timeout`; the ledger stays pending instead of hanging.
- `harnessed gates` refuses an Agent Teams escalation that cannot execute.
- Claude Code (two model tiers) confirmed the artifact transport as
  load-bearing; refusing teammate mode was rejected — setup auto-enables
  `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, so refusal would be permanently
  true and would fix no robustness.

## Evidence

- Commits `2811a18` (implementation) + `4b8c804` (the fix) + `f67edaf`
  (release metadata), pushed to `main`.
- Clean-worktree verification: `pnpm build` then `pnpm test` — 445 files /
  5584 tests, 0 failures. The first worktree run failed only because a fresh
  checkout has no `dist/` and the process-level tests need `pnpm build` first.
- `harnessed release-preflight` on the clean release tree: 4/4
  (changelog / version / git-clean / tag-absent). Tag `v5.0.13` pushed;
  publish run `42492300009` succeeded (4 jobs); GitHub release carries 9
  assets; npm `latest` = 5.0.13.

## Post-release incident (recorded, fixed forward)

- CI on the v5.0.13 push went red on 3 jobs with the same failure:
  `tests/eval/fixtures.test.ts`. Root cause: the eval goldens were recorded
  on a machine where `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` was set, so
  they said `teams_active: true` while CI produced `false` — a
  machine-dependent golden.
- Fix (forward, no re-release): the eval runner now PINS the env var for
  every scenario, the same hermeticity move as the `GIT_CEILING_DIRECTORIES`
  pin. Suite passes 14/14 with the env unset / `0` / `1`; re-recording
  changes 0 golden bytes. The OFF branch stays covered by
  `tests/cli/gates.test.ts` (stubbed env). The published package was
  unaffected: `fixtures/` is not in the npm `files` list.

## Carried forward

- Phase 84 AC13 (real-machine binary auto-update) remained open at ship time —
  verified 2026-11-09 on this machine; two real-machine-only bugs found and
  fixed (see `phases/84-auto-update/progress.md` tail section).
