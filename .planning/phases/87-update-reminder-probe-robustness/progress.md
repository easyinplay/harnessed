# Progress

## 2026-11-09
- Read GSD 1.18.0's Codex update check as the reference
  (`~/.codex/hooks/gsd-check-update.cmd` + `.js` + worker): a detached
  background worker writes a cache file atomically, the visible banner reads
  the cache, and the version source is the npm registry.
- Claude Code second opinion (two rounds, local endpoint):
  - Round 1: keep the codex PLUGIN shape (ADR 0041), fix the weaknesses:
    absolute path, npm registry as the version source, atomic write plus a
    fallback to the last good cache.
  - Round 2 (after the publish-order question): agreed the binary channel is
    GitHub-primary with an npm-registry fallback, because the GitHub release
    is the authoritative source for the assets the update downloads.
  - Round 3 (after the shell measurement): WITHDREW the absolute-path
    recommendation. No single literal satisfies cmd + pwsh + sh.
- Measured the local failure: `~/.codex/harnessed/update-reminder-codex.json`
  was `state:'unknown', latest:null` while npm had 5.0.13 and the installed
  binary was 5.0.12. One failed probe had erased a known "behind" fact.
- Measured the shell matrix for an absolute first token (cmd / pwsh / sh, with
  and without a space in the path). See findings.md.
- Implemented:
  - `src/cli/lib/latestPublishedVersion.ts` (new): GitHub releases first, npm
    registry over plain HTTP as the fallback, `ensureProxyDispatcher()` before
    each outbound call, 3 s per source, closed failure-reason set.
  - `src/cli/lib/updateReminderCache.ts`: `stale` and `lastError` fields with
    strict validation; `shouldRefreshReminder` honors the short retry of a
    retained observation.
  - `src/cli/updateReminderWorkerMain.ts`: a failed probe keeps the last
    successful observation (marked stale, retried in 1 h) instead of erasing
    it; a retained observation does not drive the automatic update.
  - `src/cli/updateReminderHookMain.ts`: the reminder line says `(last known)`.
  - `src/compile/updateReminderEntrypoint.ts`: the binary channel uses the new
    probe module.
- Verification (independently re-run in the main session, not taken from the
  worker's report):
  - `biome check` on the 8 touched files: clean.
  - `tsc --noEmit`: exit 0.
  - `vitest run` on the three touched test files: 3 files / 67 tests passed.
  - `pnpm build`: exit 0; only `bin/harnessed-update-reminder{,-worker}.mjs`
    changed.
  - Real network, three paths, against the built module:
    GitHub first -> 5.0.13 in 599 ms; GitHub unreachable -> npm fallback ->
    5.0.13 in 1.70 s; both unreachable -> `latest:null`,
    reason `github-unavailable`.
  - Real behavior, four paths, against the built worker and hook:
    a failed probe with a known-behind cache -> the record keeps
    `latest:5.0.13` / `state:behind` with `stale:true`, `retryAfter` in one
    hour and `lastError`, and the hook prints
    `Harnessed update available: 5.0.12 -> 5.0.13 (last known). Run /harnessed-update.`;
    `shouldRefreshReminder` is false one second before `retryAfter` and true
    at it; a failed probe with NO previous record -> `unknown` / `latest:null`
    with the one hour backoff, unchanged.
  - Full `pnpm test`: 445 files passed, 2 failed, 5661 tests with 5 failures.
    The 5 failures are in `tests/unit/host-native-targets.test.ts` (1) and
    `tests/unit/installers-force-update-auth.test.ts` (4). CONTROL: with this
    phase's changes stashed, the same two files still fail with the same 5
    cases (5 failed | 87 passed). They belong to the Phase 85 in-flight work
    (`src/installers/**`), which this phase does not touch.
- The foreground bundle does not contain the probe: `registry.npmjs.org` and
  `x-ratelimit-remaining` are absent from `bin/harnessed-update-reminder.mjs`
  and present in the worker bundle.

## Release receipt (v5.0.14, 2026-11-09)
- Commits: `80d48ae` (README cleanup) + `79dcfd6` (probe robustness) +
  `3c9f3e6` (STATE correction) + `c4ec11b` (release preparation).
- Clean-worktree verification (a linked worktree at the release commit, so the
  maintainer's in-flight Phase 85 work was never touched): `pnpm install
  --frozen-lockfile` + `pnpm build` exit 0 and produced NO tree difference (the
  committed artifacts are byte-identical to a fresh build), and `pnpm test` was
  446 files / 5608 tests with 0 failures. That is the same suite that fails 5
  cases in the maintainer's working tree, which confirms those 5 belong to the
  Phase 85 work and not to this release.
- `harnessed release-preflight` in that clean worktree: 4/4 pass (changelog,
  version 5.0.14, git-clean, tag-absent).
- CI: `42500290590` (README) 9/9 success, `42502901367` (probe fix) 9/9
  success, `42503655806` (release prep) success.
- Publish run `42503917114`: 4 jobs success (npm publish, binary ubuntu /
  windows / macos).
- GitHub Release `v5.0.14` carries 9 assets (3 platforms x binary + sha256 +
  sha256.sig). npm `harnessed@5.0.14` is published and `dist-tags.latest` is
  5.0.14 (registry direct query, not the local cache).
- The published tarball was unpacked and checked: `README-en.md` is GONE. The
  v5.0.13 tarball still carried it, so this release is the one that drops the
  duplicate English mirror from the npm package.