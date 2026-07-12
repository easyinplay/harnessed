# Phase 12 — findings (grounded impl references)

> planning-with-files findings. Grounded 2026-06-11 (grep-over-assume). Plan in `12-PLAN.md`, requirement REQ-v60-sentinel-gate.

## Locked design (discuss 2026-06-11)

Extend the **existing** fail-closed evidence guard (ADR-0033), halt + `--force` override. NOT a standalone `before-complete.ts`. NOT timestamp-staleness. NOT warn-only.

## Evidence guard model (`src/checkpoint/evidence.ts`) — verified

- `checkArtifacts(sub, packageRoot): Promise<{status: 'verified'|'missing'|'none_declared', found: EvidenceRefType[], missing: string[]}>`.
- Resolves sub's leaf `workflow.yaml` under `packageRoot`, reads `phases[].artifacts_expected`, stats each **relative to `process.cwd()`** (user project), three-state.
- `EvidenceRefType = { path: string (absolute), sha256: string }`.
- Pure-ish: only fs/crypto touch of the state-machine core; no state-file I/O (caller owns that).
- **Extension point**: add sibling pure fn `checkPlanningSync(cwd, workflowState)` here, same three-state contract.

## Complete path (`src/cli/checkpoint.ts` action==='complete', L148-211) — verified

- `const result = await checkArtifacts(sub, getPackageRoot())`.
- **Block**: `if (result.missing.length > 0 && !opts.force) → console.error(...) + process.exit(1)` (fail-CLOSED, ledger stays pending).
- Else resolves `evidenceStatus` ∈ overridden/verified/none_declared → `mutateSubProgress(markIfSeeded(...,'done',...))` → `completePhase(...)` → exit 0.
- **Wire point**: after `checkArtifacts`, also call `checkPlanningSync`; merge its `missing` into the block decision (same `!opts.force` gate, same `--force` → overridden). Keep the single mark.

## State API (`src/checkpoint/state.ts`) — verified

- `readCurrentWorkflow(): Promise<CurrentWorkflowV1Type | null>` — gives `{ phase, status, started_at, ... }` (fail-soft null on missing/corrupt).
- `CurrentWorkflowV1Type` has `phase: string`, `started_at: string (ISO)`, `status`.
- `mutateSubProgress(fn)` — atomic locked read-modify-write of ledger (reuse, do not add a new store).

## `checkPlanningSync` predicate (to finalize in plan)

- If `<cwd>/.planning/` dir does NOT exist → `none_declared` (non-GSD user; no block).
- If `.planning/` exists: the active workflow's progress doc must be present (existence = hard gate, robust). Candidate: `.planning/STATE.md` present AND (optionally) touched within workflow lifetime (`mtime >= started_at`). Keep the HARD gate = existence; staleness (mtime) is at most a transparent warn (user rejected pure-timestamp gating). Plan locks the exact predicate + which doc(s).
- Cross-platform: stat via `node:fs/promises` (sister checkArtifacts); avoid brittle mtime equality.

## Tests

- Sister: `tests/checkpoint/` (evidence + checkpoint complete tests exist). Add `checkPlanningSync` unit tests + a complete-path block/override/na test. Mock `.planning/` presence + workflow state.

## Open for plan

- Exact synced predicate (STATE.md existence only, or + mtime>=started_at warn).
- Block message wording (name the unsynced doc).
- Whether checkPlanningSync needs packageRoot or only cwd + workflowState.
