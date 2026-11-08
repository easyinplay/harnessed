# Progress

## 2026-11-08
- Read the question against upstream `open-gsd/gsd-core#1355` (CLOSED) and the
  locally installed GSD 1.18.0.
- Confirmed GSD 1.18.0 already implements the transport fix: `run_in_background=true`
  plus `gsd_stall_watch` marker collection from the agent output file, plus
  `resolveTeamsStatus` + a stderr warning before the first spawn.
- Confirmed harnessed's SDK path never forms a team; the exposed surface is the
  CC-native slash-command path driven by the MAIN session.
- Confirmed harnessed has the file-based delivery contract in prose but no
  deterministic bounded wait, and that `harnessed gates` never consults
  `checkAgentTeams()`.
- Confirmed `harnessed setup` auto-enables `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`,
  so the exposure is the default state on Claude Code.
- Claude Code second opinion obtained (the local endpoint DOES answer with the
  pinned `glm-5.3`; the `unrecognized_model` stderr line is a warning, not a
  failure, and this phase's earlier note that treated it as fatal was wrong).
  First pass (flash-mapped tier): adopt (c) both, with (a) load-bearing.
  Re-check on the default glm-5.3 tier: pick (a) as the load-bearing fix and
  REJECT (b) outright, because setup auto-enables the env key so refusing
  teammate mode would be permanently true, would kill teammate escalation on
  every default install, and would fix no robustness. The shipped scoping
  (capability absent -> refuse escalation; capability present -> the
  completion signal is the result file with a bounded wait) matches the
  stronger model.
- Locked the Phase 86 plan to the transport pattern, not to importing GSD's
  orchestrator.
- Transport unit landed (worker was interrupted by a platform error AFTER
  writing the files, so its report was lost): `src/cli/lib/resultArtifact.ts`
  (deterministic result path), `src/cli/prompt.ts` (`## Result delivery` section
  + `result_file` in `--json`), `src/cli/checkpoint.ts` (`--wait` bounded wait
  with `result-wait-timeout`). Re-verified independently: 3 files / 28 tests
  passed, `typecheck` passed.
- Teams-awareness unit landed: pure `resolveAgentTeamsStatus`, gates fail-closed
  when agent-teams is unavailable, `parallelism` transport contract fields,
  and the two host-primitives cells. Verified: 6 files / 83 tests passed,
  extended set 11 files / 148 tests passed, `typecheck` passed.
- Known-open at this point: the claude byte goldens are red because
  host-primitives and the prompt body changed (legitimate re-record reason),
  and `docs/host-contract.md` §4.3 carries stale C-class cell lengths.
- Closeout unit landed: `generateCommands.ts` + `scripts/rewrite-skill-invoke-sections.mjs`
  now teach the result-file + bounded-wait contract in BOTH renderings (slash
  command and SKILL invoke section), the marker moved to v4.13.0, 68 SKILL files
  were re-rendered (0 unrelated line changes), 6 claude goldens were re-recorded,
  and the `docs/host-contract.md` §4.3 byte-length table was resynced.
- The re-render surfaced a pre-existing drift in `workflows/auto/SKILL.md`
  (a hand-edited nested-ledger clause that the builder never carried); the
  builder was folded back to that clause so the re-render could not silently
  delete a real behavioural constraint.
- Full suite after the closeout: 5 failed files / 441 passed, 9 failed tests.
  Two failures belong to Phase 86 (marker assertion + eval goldens) and are being
  fixed; the remaining 7 belong to concurrent uncommitted work by another agent
  (README-en.md deletion breaking the 11-locale CLI surface contract, and the
  Phase 85 installer force-update authorization work).
- Fixed the two Phase 86 failures: the generated-marker assertion is now
  version-agnostic (it still pins the semver shape, the position inside the
  invoke section, and the "marker is the last line" invariant), and 9 eval
  goldens were re-recorded after reviewing every diff line (7 gates
  `parallelism` field additions, 2 delivery-contract wording changes, 0
  unrelated differences).
- Final full suite: 443 passed / 4 skipped files, 5587 passed / 43 skipped /
  1 todo tests. The 6 remaining failures are all owned by the concurrent
  uncommitted work (README-en.md deletion → the 11-locale CLI surface contract;
  the Phase 85 installer force-update authorization work). `typecheck`, `lint`
  (one pre-existing warning), `validate:schema` and `git diff --check` pass.
- Public command surface is unchanged (33 top-level commands); no
  `TeamCreate` / `TeamDelete` literal was introduced.
- Commit `2811a18` was verified in an isolated worktree (clean tree, no
  concurrent uncommitted work): `corepack pnpm build` then `corepack pnpm test`
  → 445 passed / 4 skipped files, 5584 passed / 43 skipped / 1 todo tests, zero
  failures. The first worktree run failed only because a fresh checkout has no
  `dist/` and the process-level tests require `pnpm build` first.
- Released as **v5.0.13**: commits `4b8c804` (the fix) + `f67edaf` (release
  metadata), pushed to `main`; `harnessed release-preflight` on the clean
  release tree reported 4/4 (changelog / version / git-clean / tag-absent);
  annotated tag `v5.0.13` pushed; publish run `42492300009` succeeded (4 jobs);
  GitHub release `v5.0.13` carries 9 assets (3 platforms x binary + sha256 +
  sha256.sig); npm `harnessed@5.0.13` is published and `dist-tags.latest` is
  5.0.13.
- CI on the v5.0.13 push went RED on 3 jobs (quality ubuntu / test windows /
  test macos), all with the SAME single failing test: `tests/eval/fixtures.test.ts`.
  Root cause: the eval goldens are recorded from a real `harnessed gates` run, and
  the plan now carries the agent-teams capability probe — the goldens were
  recorded on a machine where `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (harnessed
  setup writes it into `~/.claude/settings.json`), so they said
  `teams_active: true` while CI, where nothing enables it, produced `false`.
  The golden was machine-dependent; the clean-tree local verification missed it
  precisely because the local machine HAS the flag on.
- Fix (forward, no re-release): the eval runner now PINS
  `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` for every scenario, the same
  hermeticity move as the existing `GIT_CEILING_DIRECTORIES` pin (ambient env
  leaking into goldens → 3-OS red). Proof: the suite passes 14/14 with the env
  unset, `'0'` and `'1'`, and re-recording changes 0 golden bytes. The OFF
  branch stays covered by `tests/cli/gates.test.ts` (stubbed env), not by a
  machine-dependent golden. The published package is unaffected: `fixtures/` is
  not in the npm `files` list, so v5.0.13's shipped behaviour is unchanged.
