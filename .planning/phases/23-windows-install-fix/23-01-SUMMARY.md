# Phase 23 SUMMARY — Windows install reliability (4.5.1 hotfix)

> Status: ✅ implemented & gate-green 2026-06-14. Ships as npm **4.5.1**. Details: this dir + `23-CONTEXT.md` (locked D1–D7).

## What shipped

Four fixes against the 6 Windows `harnessed setup` force-update failures dogfooded on v4.5.0:

- **A — POSIX-shell routing (D1/D2/D3/D4).** `spawnCmd` gained `opts.posixShell`. On win32 + `posixShell` → `spawn('bash', ['-c', joined])` (Git Bash; PATH-resolved, no `~` pre-expand — bash expands natively); ENOENT → clear `bash-missing` InstallResult ("Git Bash is required … install Git for Windows … re-run `harnessed setup`"). Non-posix win32 path unchanged (`cmd.exe /c` + `expandTildeForWindows`). POSIX unchanged (`/bin/sh -c`). B1 `checkCmdString` gate still runs first on every path.
  - Call sites passing `posixShell: true`: `gitCloneWithSetup` **install** + **verify**; `npmCli` verify; `npxSkillInstaller` verify. npm/npx **install** spawns stay on cmd.exe (`.cmd` shims, work today).
  - mcp/ccPlugin installers need no change — they already verify via fs-read of `~/.claude.json` (v3.0.3 hotfix), no spawn.
  - idempotent-check fallback (`idempotent.ts:196`) stays cmd.exe — Windows native detection short-circuits before it; outside locked D1 scope.
- **B — backup EISDIR (D5).** `backup()` now records a sentinel entry (`backup: ''`) on `EISDIR` (target is a dir, e.g. force-update overwriting an existing skill dir) instead of crashing "illegal operation on a directory, read". git-clone-with-setup is pure-create; dir rollback out of scope by its own contract.
- **C — stale `setup.bundled_summary` (msg).** Dropped hardcoded `v3.0` + stale `23 workflows` count in `messages/en.json` + `messages/zh-Hans.json`; now a generic share-only line. Also dropped stale `v3.0` from `agent_teams.missing_explanation`.
- **D — timeout 60s→120s (D6).** `DEFAULT_INSTALL_TIMEOUT_MS = 120_000` (Windows cold npm/npx cache).

## Acceptance (all met)

1. ✓ win32+posixShell → `bash -c`; win32 plain → `cmd.exe /c`; POSIX → `/bin/sh -c` (unit, forced `process.platform`).
2. ✓ bash ENOENT on win32 → `bash-missing` error naming Git Bash + git-scm.com (unit).
3. ✓ git-clone-with-setup install + all spawn-based verify sites pass `posixShell: true` (mcp/ccPlugin are fs-verify, no spawn).
4. ✓ backup() EISDIR sentinel, no crash (unit).
5. ✓ `DEFAULT_INSTALL_TIMEOUT_MS === 120_000`.
6. ✓ `bundled_summary` de-staled (no `v3.0` / `23`).
7. ✓ Gate green: tsc clean; biome clean; 1311 passed / 5 skipped / 1 todo (perf test was a one-run flake under full-suite concurrency, passes isolated). Windows CI = real proof on push.

## Files touched

- `src/installers/lib/spawn.ts` — `posixShell` branch + `bash-missing` error + timeout 120s.
- `src/installers/lib/backup.ts` — EISDIR sentinel branch.
- `src/installers/{gitCloneWithSetup,npmCli,npxSkillInstaller}.ts` — `posixShell: true` call sites.
- `messages/en.json` + `messages/zh-Hans.json` — de-staled strings.
- `tests/unit/installers-lib-spawn.test.ts` — 4 new tests (win32 bash / win32 cmd.exe / POSIX no-op / bash-missing).
- `tests/unit/installers-lib-backup.test.ts` — 1 new test (EISDIR sentinel).
- `tests/cli/setup-agent-teams.test.ts` — assertions synced to de-staled message.

## Next

CHANGELOG `[4.5.1]` + bump + `harnessed release-preflight` + tag + push — **needs explicit user approval** (commit safety). Phase 22 (ship-reminder) still deferred behind this.
