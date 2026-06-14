# Phase 23 CONTEXT — Windows install reliability (4.5.1 hotfix)

> Surfaced by dogfooding the fresh v4.5.0 `harnessed setup` on Windows (2026-06-14): 6 force-update failures. Design locked via AskUserQuestion (bash scope = git-clone-with-setup + verify only; bash-absent = clear error). Takes priority over Phase 22 (ship-reminder, still pending). Ships as npm 4.5.1.

## Goal

Fix the Windows install failures `harnessed setup` (force-update path) hits, so all 14 base manifests install/verify on Windows. Plus two smaller correctness fixes (backup EISDIR, stale version string) and a timeout bump.

## Root causes (verified)

- **A — `spawnCmd` uses `cmd.exe /c` on Windows; manifests use POSIX shell builtins.** `src/installers/lib/spawn.ts` Windows branch runs `cmd.exe /c <cmd>` (only pre-expands `~/`). cmd.exe cannot run `rm -rf`, `cp -R`, `mkdir -p`, `test -f`, `grep`, `|`. So:
  - `frontend-design`, `ui-ux-pro-max` (`git-clone-with-setup` install cmds use `rm`/`cp`/`mkdir`) → "'rm' is not recognized".
  - `gsd` (verify cmd `test -f ~/.claude/skills/gsd-plan-phase/SKILL.md`) → cmd.exe can't run `test` → "verify exit 1 ≠ expected 0".
  - (Normal install hides this: idempotent checks use native detection on Windows per `idempotent.ts` v3.9.9. Only **force-update** re-runs the real install cmd + verify, exposing it.)
- **B — backup EISDIR.** `src/installers/lib/backup.ts:110` does `await readFile(file.target)`; when `file.target` is a directory (gstack overwrites a dir), readFile throws `EISDIR: illegal operation on a directory, read`.
- **C — stale `setup.bundled_summary`.** `messages/{en,zh}.json` `setup.bundled_summary` says "harnessed v3.0 — 23 workflows bundled" (v3.0 hardcoded; 23 ≠ actual count, which is 26 skills / 27 workflows).
- **D — 60s install timeout.** `DEFAULT_INSTALL_TIMEOUT_MS = 60_000`. `npx --yes skills@... add ...` (playwright-test, mattpocock-skills) times out on Windows cold cache. Possibly partly network, but a longer ceiling helps.

## Locked decisions

- **D1 — bash scope = git-clone-with-setup install + ALL verify cmds** (chosen): on Windows, route ONLY (a) the `git-clone-with-setup` install spawn and (b) every installer's verify spawn through Git Bash (`bash -c`). npm/npx/claude/mcp INSTALL cmds (`.cmd` shims) stay on `cmd.exe` (they work today; surgical, low-risk). Implementation: add an opt `{ posixShell?: boolean }` to `spawnCmd`; the git-clone-with-setup installer + all ~6 verify call sites pass `posixShell: true`.
- **D2 — bash-absent = clear error** (chosen): if `bash` is not resolvable on Windows, return a clear install failure ("Git Bash required for this component on Windows — install Git for Windows"). Not a silent cmd.exe fallback. (git-clone-with-setup already requires `git`, which ships Git Bash, so this only bites a genuinely broken environment.)
- **D3 — bash resolution**: spawn `bash` and let PATH resolve it (Git for Windows adds it); on ENOENT, surface the D2 clear error. Do NOT hardcode `C:\Program Files\Git\...` (respects custom install locations); PATH is the contract.
- **D4 — `~` handling under bash**: do NOT pre-expand `~/` when routing through bash (bash expands `~` natively to the same `%USERPROFILE%` home). The existing `expandTildeForWindows` stays for the cmd.exe path only.
- **D5 — backup skips directories**: in `backup()`, stat the target; if it is a directory, skip the readFile-based file backup (git-clone-with-setup is pure-create per its own IMPL NOTE; a dir target needs no byte-backup). No EISDIR.
- **D6 — timeout 60s → 120s**: bump `DEFAULT_INSTALL_TIMEOUT_MS` to 120_000 (Windows cold npm/npx cache). Verify timeout unchanged.
- **D7 — TDD red-first** for the pure/testable parts (spawn shell selection, backup dir-skip); the cross-platform spawn is verified by Windows CI + a unit test asserting the bash arg vector on win32.

## Scope

- `src/installers/lib/spawn.ts`: add `posixShell` opt; on win32 + posixShell → `spawn('bash', ['-c', joined], …)` with ENOENT → clear-error InstallResult; cmd.exe path unchanged for non-posix.
- `src/installers/gitCloneWithSetup.ts`: pass `posixShell: true` on the install spawn.
- All verify spawn sites (`npmCli.ts`, `mcpStdioAdd.ts`, `mcpHttpAdd.ts`, `ccPluginMarketplace.ts`, `npxSkillInstaller.ts`, `gitCloneWithSetup.ts`): pass `posixShell: true` on the verify spawn.
- `src/installers/lib/backup.ts`: stat target; skip byte-backup for directories.
- `src/installers/lib/spawn.ts`: `DEFAULT_INSTALL_TIMEOUT_MS` 60_000 → 120_000.
- `messages/en.json` + `messages/zh.json`: `setup.bundled_summary` → current version + correct count.
- tests: spawn shell-selection (win32 posixShell → bash; non-posix → cmd.exe), backup dir-skip, + full gate.

## Out of scope (do NOT touch)

- Rewriting manifests to be cross-platform (D1 chose bash routing — manifest authors keep writing POSIX).
- The npm/npx/claude/mcp install shell path (stays cmd.exe — works today).
- Phase 22 (ship-reminder) — deferred behind this hotfix.
- The skills-CLI timeout root cause (network) — D6 just raises the ceiling.

## Invariants

- POSIX (non-Windows) spawn path unchanged (`/bin/sh -c`).
- B1 shell-escape `checkCmdString` gate still runs before every spawn (bash path included).
- No silent behavior change for npm/mcp installs on Windows.
- KARPATHY-minimal; TDD red→green; full gate green vs the post-4.5.0 baseline; **Windows CI green is the real proof**; biome preempt; NEVER push without approval.

## Acceptance

1. On win32 with `posixShell: true`, `spawnCmd` invokes `bash -c "<cmd>"` (not cmd.exe); on win32 without it, still `cmd.exe /c`; on POSIX, `/bin/sh -c` unchanged. (unit, mocked spawn)
2. bash ENOENT on win32 → a clear InstallResult error naming Git Bash. (unit)
3. git-clone-with-setup install + all verify calls pass `posixShell: true`. (grep/structural)
4. backup() skips byte-backup when the target is a directory (no EISDIR). (unit, tmp dir)
5. `DEFAULT_INSTALL_TIMEOUT_MS === 120_000`.
6. `setup.bundled_summary` shows the real version + workflow count (no "v3.0" / "23").
7. Full test gate green; biome clean; Windows CI green.
