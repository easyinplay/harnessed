# v5.0 Spec 1 — Verify-stage Review Findings (2026-06-05)

2 parallel reviewers (agent-skills:code-reviewer 5-dim + ecc:typescript-reviewer) over the
v5.0 state-machine diff (fc19318..8e4df17). Critical data-integrity module.

## P0 — BLOCK (fixed this round)

| # | File | Issue | Resolution |
|---|------|-------|------------|
| P0-A | `evidence.ts` | `checkArtifacts` resolves `artifacts_expected` relative to **packageRoot** (harnessed install dir), but artifacts (progress.md, review reports) are produced in the **user project cwd**. Real runs → stat misses → fail-closed BLOCKS every real `complete`. `detectDrift` uses cwd base while check used packageRoot → permanent false-positive drift. e2e passed only because packageRoot==cwd coincidence. | **Artifact base = `process.cwd()`**; store **absolute** paths in `evidence.found`; `detectDrift` re-hashes the stored absolute path (no cwd drift). yaml location still resolves from packageRoot (`resolveWorkflowYaml`). |
| P0-B | `checkpoint.ts` / `run.ts` / `gates.ts` | `sub`/`name`/`master` CLI positional arg → `resolveWorkflowYaml`/`join()` with no `checkPathSafe` guard → path traversal (`checkpoint complete ../../../etc/passwd`). `checkPathSafe` (path-guard.ts) exists but is never called here. | Call `checkPathSafe(arg)` at the top of each action handler. |

## P1 — HIGH (fixed this round)

| # | File | Issue | Resolution |
|---|------|-------|------------|
| P1-1 | `checkpoint.ts` parsePlan | `...(parsed as object)` spreads all untrusted `--plan` JSON keys (injection / proto surface) | Explicit pick `{master, fire, skip, parallelism}` — no spread. |
| P1-2 | `checkpoint.ts` / `status.ts` / `resume.ts` | Commander async `.action()` lacks top-level try/catch → `LockHeldError` etc → unhandled rejection crashes process instead of clean exit 1 | Wrap each action body in try/catch → `console.error` + `process.exit(1)`. |
| P1-3 | `evidence.ts` | `status:'none_declared'` returned when declared-but-missing → semantic overload, future-caller trap | Add third state `'missing'` (declared.length>0 && missing.length>0). caller still gates on `missing.length`. |
| P1-4 | `status.ts` buildRecoverLines | `failed`/`pending` subs render `evidence: none_declared` → misleading "✗ failed … none_declared" | Render evidence label only for `done` (+ reason for skipped); omit for pending/failed. |
| P1-5 | `checkpoint.ts` complete log | success log prints `result.status` not the actual ledger `evidence_status` → `--force` override shows `none_declared`, hides the override | Log the actual `evidence_status` written to the ledger. |

## P2 — deferred (note, not fixing now)
- Sequential drift I/O (status.ts/resume.ts loops) — fine at ledger scale (≤8 subs).
- `generateCommands.ts` spawnLoopSteps vs leafSpawnLoop duplicate text — consistency risk, cosmetic.
- `engineHook.ts:65` `!== false` vs `?? true` — works (type is boolean|undefined), cosmetic.
- `checkpoint.ts` second unlocked read-back for `nextPending` — theoretical TOCTOU only under parallel `complete` (current orchestration is serial). Documented as invariant.

## Clean (double-confirmed by both reviewers)
mutateSubProgress single-lock RMW (no deadlock, no lost-update) · ledger pure fns immutable ·
schema additive-optional (old files pass) · D1 single SoT (no checkpoint ledger copy) ·
ADR-0029 fail-soft vs ADR-0033 fail-closed not conflated · TypeBox Value.Check gates all disk writes.

## Required regression test
cwd ≠ packageRoot: artifact present in cwd → `checkArtifacts` verified; mutate → `detectDrift` flags.
(The current tests ran with packageRoot==cwd, masking P0-A.)
