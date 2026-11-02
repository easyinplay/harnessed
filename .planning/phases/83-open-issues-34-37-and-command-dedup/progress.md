# Phase 83 Progress

## 2026-11-01

- Triaged the four newly filed issues #34-#37 against the current `main` (v5.0.7, commit `742e111`).
- Measured the local install: compiled binary channel, version **4.49.2**, npm latest 5.0.7.
- Root-caused the duplicate slash command: 26 stale `~/.claude/commands/*.md` files from the
  v3.4.4 command-file era coexist with the same 26 workflow skills, and the local 4.49.2 binary
  predates `legacyCommandCleanup.ts`, so nothing ever removed them.
- Root-caused #35: `refreshOwnedUpdate()` already does every repair the duplicate needs, but it is
  wired only into the npm channel continuation, never into the compiled binary path.
- Wrote `task_plan.md` with four disjoint workstreams (W1 #34, W2 #35, W3 #36, W4 #37) and
  `findings.md` with F1-F6.
- Checked the #34 network premise from this host: `api.github.com`, `github.com` and the npm
  registry all answered 200, so the fix is justified by host-independence rather than a local repro.

## 2026-11-02

- W1 #34 — **complete**. `resolveLatestRelease` now returns the api.github.com asset endpoint as the
  primary download URL (same host as the metadata hop) with `browser_download_url` kept as fallback;
  `.sha256.sig` resolves as its OWN release asset; transient network failures retry (3 attempts,
  no retry on 4xx); the failure message names the release, the tried URL, `npm i -g harnessed@latest`
  and `HARNESSED_UPDATE_SOURCE_DIR`.
  New: `src/cli/lib/selfUpdateBinary.ts` + `tests/cli/lib/selfUpdateBinary-issue34.test.ts` (7 tests).
- W2 #35 — **complete**. Root cause: `refreshOwnedUpdate()` already performs all three repairs
  (refresh workflow skills, re-register owned hooks, `removeLegacyClaudeCommands`) but was wired
  only into the npm `--update-continuation` handover; the plain compiled `harnessed update` path
  stopped after the binary swap. Fix: the OLD binary hands the refresh to the NEW binary
  (the NEW binary owns the NEW assets `<stateRoot>/assets/<newVersion>`) by spawning `execPath`
  with the hidden internal flag `--internal-owned-refresh`; the NEW binary runs the refresh and
  exits 0/1. Fail-soft: a failed handover prints `harnessed setup` as the next step and never
  changes the update's exit code.
  New: `src/cli/lib/ownedRefresh.ts`, `src/cli/lib/ownedRefreshFlag.ts`,
  `tests/cli/lib/ownedRefresh.test.ts` (9 tests).
  Changed: `src/cli.ts` (internal entry point, NOT a public command — the CLI surface contract
  pins 32 public commands + 11 README locales), `src/cli/update.ts` (compiled `updated` branch),
  `tests/cli/update.test.ts` (expects the handover + the new stdout line).
- W3 #36 — **complete**. `harnessedHookTeardown.ts` gained a version-agnostic first-party
  registration identity (`harnessedHookRegistrations`); `ccHookAdd.ts` counts a stale
  `assets/<oldVersion>/…` entry as OURS so it is collapsed into the single current entry instead of
  duplicating it; `refreshOwnedUpdate.ts` now skips a hook only when there is NO first-party
  registration of it at all (a stale one is re-installed so it migrates); `gc.ts` keeps an
  `assets/<version>` directory that the host `settings.json` still references (fail-soft on an
  unreadable settings.json, both call sites benefit with no change); `check-stale-hooks.ts` points
  at `harnessed setup` / `harnessed update` for a version-stale hook and keeps the uninstall advice
  for a genuinely orphaned entry.
  New: `tests/installers/issue36-hook-identity.test.ts`; changed: `tests/installers/ccHookAdd.test.ts`,
  `tests/cli/gc-compiled.test.ts`, `tests/cli/check-stale-hooks.test.ts`, `tests/unit/refresh-owned-update.test.ts`.
- W4 #37 — **complete**. The ownership-lock retry budget went from `{5, 25, 250}` (~0.6 s) to
  `{30, 250, 4000}` (exported as `INSTALL_OWNERSHIP_LOCK_RETRIES`), so a queued contender waits its
  turn instead of dying with `ELOCKED`; `installers/index.ts` classifies `ELOCKED` as its own
  `lock-contention` reason; `setup.ts` counts a lock-contention failure as a retryable warning
  ("re-run `harnessed setup` to finish them") and keeps exit 0, while every other failure kind
  still exits 1.
  New: `tests/installers/runInstallLockContention.test.ts`; changed: `tests/unit/installers-ownershipLock.test.ts`,
  `tests/cli/setup-failure-exit.test.ts`, `tests/integration/installer-contract.test.ts`,
  `tests/unit/uninstallers-declaredTeardown.test.ts` (mock factories gained the new helper export).
- **Local duplicate slash command — fixed on this machine.** All 26 `~/.claude/commands/*.md` files
  were harnessed-owned (verified with the repo's own `shouldOverwriteFile` rule) and were removed
  with the repo's own `removeLegacyClaudeCommands`; the files were first copied to
  `~/.claude/harnessed/backups/legacy-commands-20261102/` so the operation stays reversible.
  `~/.claude/commands/` is now empty and the 26 workflow skills (incl. `retro`) are intact, so the
  slash-command picker shows one `/retro` again.

## Status

- W1 #34 — complete
- W2 #35 — complete
- W3 #36 — complete
- W4 #37 — complete
- Local duplicate-command cleanup — complete
- Integration verification — **complete**: `tsc --noEmit` exit 0; `biome check src/ tests/` exit 0
  (1 pre-existing warning in the untouched `src/cli/facts.ts`); full `vitest run` 424 files passed /
  4 skipped, **5375 tests passed** / 43 skipped / 1 todo (baseline was 5273 — the four fixes add
  102); all 13 `scripts/check-*.mjs` CI gates exit 0; `git diff --check` exit 0.
- Commit + push — in progress
- Release / tag / npm publish — NOT started, needs explicit user confirmation
