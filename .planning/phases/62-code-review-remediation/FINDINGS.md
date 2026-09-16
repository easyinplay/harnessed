---
phase: 62
name: Code Review Report Remediation
status: in-progress
created: 2026-09-16
source: external review report (Qwen workspace, 2026-09-16), 39 findings — 7 high / 16 medium / 16 low
method: every finding verified against this tree before being called real; a fix
  counts only with a test that fails on the pre-fix code
---

# Phase 62 — Code Review Report Remediation

Verdicts: **REAL** (reproduced / confirmed by reading) · **PARTIAL** (real, but the
report's framing or fix is wrong in a way that matters) · **NOT REPRODUCED** ·
**PENDING** (not yet checked).

## High

| # | finding | verdict | fix | falsified |
|---|---|---|---|---|
| H1 | `checkpoint reopen` writes a stale snapshot back, undoing itself | **REAL** — on exactly the `status==='complete'` path reopen exists for | `mutateWorkflow` single-lock RMW; reopen + status flip in one write | yes: old code under a faithful whole-replace mock → `Expected "pending" / Received "done"` |
| H2 | Windows `npm.cmd` spawned shell-less → EINVAL → `update` silently broken | **REAL** — reproduced on Node 24.19.0 (`spawn EINVAL`; with shell → `11.17.0`) | Windows path runs the fixed string `npm view harnessed version` through `exec` (no injection surface, no DEP0190) | dogfood: doctor update check now reports `up to date (4.41.0)` |
| H3 | eval `--filter` pre-filter has an empty body → `--update-golden` rewrites every golden | **PARTIAL** — bug real; the report's fix (bare `continue` on dir name) would drop scenarios matched only by NAME, which lives inside the yaml | read the scenario name before running; skip only when neither dir nor name matches | yes: old runner overwrites a sentinel golden in a scenario outside the filter |
| H4 | rollback `unlink`s a directory for git-clone installs | **REAL** — clone target is a dir; ENOENT and EISDIR both recorded `backup:''`; rollback single-file `unlink` → EPERM/EISDIR → exit 1. The report's "deletes user data" does NOT happen today (unlink cannot remove a dir) — but a naive `rm -rf` fix would make it happen | backup records `sentinel: 'created' \| 'preexisting-dir'`; rollback removes `created` recursively, LEAVES `preexisting-dir`, and never deletes a directory from legacy metadata on a guess | yes: 3 cells fail on the old code, with `unlink` made to reject on a directory the way the real one does |
| H5 | `ccHookAdd` crashes on `settings.json` containing `null` | **REAL** — also a number, string, array (all valid JSON) | non-object top level → `settings-json-malformed` structured error, file untouched | yes: old code `TypeError: Cannot read properties of null (reading 'hooks')` |
| H6 | Windows `cmd.exe /c` arg re-parsing; `& \| < > ^` not screened | **REAL, and worse than reported** — besides `&` injection, the SHIPPED args `tavily-mcp@^0.2.0` / `exa-mcp-server@^3.2.0` already lose their `^` (cmd's escape char): a semver range silently became an exact pin on every Windows install. So the report's "add metachar detection to checkCmdString" is wrong twice: `&&` is legitimate in manifest cmd strings on every platform, and failing closed on `^` would break tavily/exa | new `lib/winSpawn.ts`: resolve PATH+PATHEXT; `.exe/.com` spawned DIRECTLY with no shell (native Claude Code / Codex installers ship these); only a `.cmd/.bat` shim goes through `cmd.exe /d /s /c` with cross-spawn's quote + double caret-escape (the shim's `%*` re-parses a second time) | yes, on a REAL cmd.exe + `%*` shim: caret, `&` URL, pipes, `%PATH%`, spaces, quotes arrive byte-identical; an injection stays one literal arg and writes no marker file; a control cell proves the old shape mangles the caret |
| H7 | security gate skips `hook_command` and `harness_overrides.*.cmd` | **REAL** | 3 paths added to `cmdPaths`; `ccHookAdd` re-screens `hook_command` at runtime (defense in depth) | yes: 5 malicious cases pass the old gate |

## Medium

| # | finding | verdict | notes |
|---|---|---|---|
| M1 | unlocked read → locked whole write, lost updates | **REAL, partly fixed** | `pause()` / `complete()` now go through `mutateWorkflow`; `checkpoint.ts` verify_mode / ship_ready / retro_due writes and `compact.ts` PENDING |
| M8 | `gc` keeps the lexicographically-last bin-backup | **REAL** — `'4.10.0' < '4.9.0'` as strings, so the NEWER backup was deleted; the existing fixture only used 0.8.0/0.9.0 where the two orders agree | fixed: `byVersion` via `compareVersions` (string fallback for non-semver names); falsified |
| M16 | `findPhaseContextExcerpt` substring-matches phase numbers | **REAL, and wider than reported** — phase "16" hit dir "1-"; ALSO the reverse: phase "1" never matched zero-padded dir "01-" (`"1".includes("01")` is false), so the standard GSD layout with a short phase string injected nothing | fixed: first numeric token of the phase string compared numerically to the dir number; both directions falsified |
| M2–M7, M9–M15 | | PENDING | |

## Low

| # | finding | verdict | notes |
|---|---|---|---|
| L2 | `spawnSync('npm')` shell-less on Windows always ENOENT | **PARTIAL** — NOT reproduced here (fnm provides an extensionless shim, status=0); real on a standard Node install that ships only `npm.cmd` | hardened with the same fixed-string-through-shell approach as H2 |
| L6 | reopen's follow-up read sees the rolled-back state | **REAL** — downstream of H1 | fixed by H1; cell 8 of the reopen suite fails on the old code |
| others | | PENDING | |

## Why the H1 bug survived its own test suite

`tests/cli/checkpoint-reopen.test.ts` mocked `writeCurrentWorkflow` as a **no-op**.
The real function replaces the record wholesale, so the rollback needed that write
to overwrite the ledger the other mock had just changed — which a no-op can never
do. The mock was kinder than the thing it stood in for, and hid exactly the defect
it existed to catch. The suite now models one shared record with a real
whole-replace.
