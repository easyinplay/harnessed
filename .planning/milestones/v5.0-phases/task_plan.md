# task_plan — harnessed v5.0 State Machine Core (Spec 1: A/B/C/E/F)

> SoT: `.planning/v5.0/STATE-MACHINE-CORE-DESIGN.md` + `docs/adr/0033-*.md`
> All design decisions LOCKED (7 brainstorm + 3 eng-review D1/D2/D3). No open gray areas.
> Methodology: TDD on pure fns (ledger/evidence) · biome check --write pre-commit · NEVER push w/o approval.

## Goal
Add a structured progress ledger + fail-closed evidence guard + `status --recover`
to harnessed's workflow state machine, absorbing Trellis/comet patterns. Additive
optional schema (no version bump). Single SoT (`current-workflow.json`).

## Invariants (must not break)
- ADR-0029 gate fail-soft (gate eval error → fire) — UNCHANGED. Evidence guard is a
  separate fail-CLOSED posture.
- atomic write (writeFileAtomic/Sync) + proper-lockfile dir lock — reuse existing.
- KARPATHY-minimal — no FSM lib; ledger is a plain array, progression = field writes.
- Windows CI must stay green.

## Dependency order
schema → ledger/evidence (pure, TDD) → checkpoint CLI wiring → status/resume → generateCommands body → verify backfill → release gate

---

## Phase 1 — Schema extension  [status: pending]
**File:** `src/checkpoint/schema/currentWorkflow.v1.ts` (✓ exists)
- Add `EvidenceRef = {path, sha256}` (additionalProperties:false).
- Add `SubProgressEntry = {sub, status∈{pending,done,failed,skipped}, gate_fired:bool,
  reason?:string, evidence_status?∈{verified,none_declared,overridden}, evidence?:EvidenceRef[]}`.
- Add `sub_progress: Optional(Array(SubProgressEntry))` to `CurrentWorkflowV1`.
- **D1: do NOT touch `checkpoint.v1.ts`** (single SoT, no snapshot ledger copy).
**Acceptance:** existing `current-workflow.json` (no sub_progress) still `Value.Check`-passes;
new shape with sub_progress passes; `tsc --noEmit` clean; existing state tests green.

## Phase 2 — ledger.ts pure functions (TDD)  [status: pending]
**File:** `src/checkpoint/ledger.ts` (NEW)
- `seedLedger(plan: {fire:FireEntry[], skip:SkipEntry[]}): SubProgressEntry[]`
  — fire→{pending, gate_fired:true}; skip→{skipped, gate_fired:false, reason}.
- `markSub(entries, sub, status, opts?:{evidence?, evidence_status?}): SubProgressEntry[]`
  — pure, returns new array; throws if sub not in ledger.
- `nextPending(entries): string | null` — first pending sub (for recover "next").
**Tests:** `tests/checkpoint/ledger.test.ts` — seed fire/skip mapping; markSub transitions;
markSub unknown-sub throw; nextPending ordering; immutability (input not mutated).
**Acceptance:** RED first, then GREEN; no I/O in ledger.ts; biome clean.

## Phase 3 — evidence.ts (TDD)  [status: pending]
**File:** `src/checkpoint/evidence.ts` (NEW)
- `hashFile(path): Promise<string>` — sha256 hex (node:crypto).
- `checkArtifacts(sub, packageRoot): Promise<{status:'verified'|'none_declared', found:EvidenceRef[], missing:string[]}>`
  — reads leaf workflow.yaml `artifacts_expected`; none declared → none_declared;
  declared → stat each, hash present ones, list missing.
- `detectDrift(evidence:EvidenceRef[]): Promise<{path, was, now}[]>` — re-hash, diff.
**Tests:** `tests/checkpoint/evidence.test.ts` (tmpdir) — none_declared (no artifacts_expected);
verified (all present → found+sha); missing (declared but absent → missing list);
drift (mutate file → detected); no-drift (unchanged → empty).
**Acceptance:** RED→GREEN; tmpdir isolation; biome clean.

## Phase 4 — checkpoint.ts CLI wiring  [status: pending]
**File:** `src/cli/checkpoint.ts` (✓ exists) + `src/checkpoint/state.ts` ledger helpers
- `checkpoint start <master> --plan <json>` — parse gates JSON → seedLedger → activate()
  writes current-workflow.json with sub_progress. Empty/absent --plan → empty ledger (D3 degrade).
- `checkpoint complete <sub> [--force]` — checkArtifacts:
  - missing & !force → exit 1 (fail-CLOSED), entry stays pending, print missing list.
  - missing & force → markSub done, evidence_status='overridden'.
  - verified → markSub done, evidence_status='verified', evidence=found.
  - none_declared → markSub done, evidence_status='none_declared'.
- `checkpoint fail <sub>` — markSub failed.
- All writes via existing writeCurrentWorkflow (atomic + locked).
**Tests:** extend `tests/checkpoint/*` — start seeds ledger; complete block on missing;
--force override sets overridden; none_declared path; fail transition.
**Acceptance:** fail-closed exit code verified; biome + tsc clean.

## Phase 5 — status.ts --recover + resume.ts drift  [status: pending]
**Files:** `src/cli/status.ts` (✓), `src/checkpoint/resume.ts` (✓)
- `status --recover` — read current-workflow.json; render per-sub status w/ markers +
  evidence_status + next pending + `→ next: harnessed prompt <sub>`; re-hash evidence →
  drift warns. Empty ledger → graceful "no ledger — run gates + start" (D3).
- `resume` — existing flow + re-hash evidence from current-workflow.json ledger → drift warn.
**Tests:** `tests/cli/status-recover.test.ts` — full ledger render; empty-ledger degrade;
drift line on mismatch; none_declared rendered distinctly (not "verified").
**Acceptance:** recover output stable; biome + tsc clean.

## Phase 6 — generateCommands ORCHESTRATOR body  [status: pending]
**File:** `src/cli/lib/generateCommands.ts` (✓)
- ORCHESTRATOR body deterministically emits the `gates → checkpoint start --plan` →
  per-sub `prompt`+spawn+`checkpoint complete` → `checkpoint fail` on error sequence (D3).
- Regenerate affected command markdown (harnessed-generated marker).
**Tests:** extend generateCommands tests — body contains gates→start sequence; complete/fail steps.
**Acceptance:** generated body snapshot updated; biome + tsc clean.

## Phase 7 — verify/* artifacts_expected backfill (D2-followup)  [status: pending]
**Files:** `workflows/verify/{paranoid,security,code-review,qa,simplify,design,multispec,progress}/workflow.yaml`
- Audit each verify leaf; add `artifacts_expected: [<report path>]` where missing so the
  evidence guard is real (not none_declared) for the verify stage.
**Acceptance:** every verify leaf declares ≥1 artifact; check-workflow-schema passes;
no none_declared for verify subs in an e2e run.

## Phase 8 — Release gate  [status: pending]
- e2e PowerShell: gates task → start --plan → complete (missing⇒exit1 / --force⇒pass /
  none_declared) → status --recover → mutate artifact ⇒ drift warn.
- `pnpm exec biome check --write` · `tsc --noEmit` · full `vitest run` green.
- Bump package.json → 5.0.0; CHANGELOG.md v5.0.0 entry; update .planning/STATE.md.
- **STOP — report to user. Do NOT push without explicit approval.**

---

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | | |

## Decisions (locked — see ADR-0033)
- D1 single SoT (no checkpoint snapshot ledger copy).
- D2 three-state evidence_status (verified/none_declared/overridden).
- D3 two-step gates→start; generated body enforces; recover degrades on empty ledger.
- ledger-only progression (no transition-event machine); additive optional schema (no bump).
