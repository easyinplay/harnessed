# Phase 36 task_plan — scale-adaptive verify strength (Spec 3/H)

> PWF main plan. PLAN.md is the design contract. LAST v11.0 phase.

## Objective
Surface the already-computed `verify_mode` ('light'|'full') as an advisory line in the per-turn
`<workflow-state>` breadcrumb so verify rigor scales with change size — mirroring SHIP-READY/RETRO-DUE.

## Tasks

- [ ] **T36.1** surface verify_mode in the breadcrumb (TDD red→green)
  - `src/checkpoint/injectState.ts` `buildWorkflowStateBlock`: add `VERIFY-MODE: <mode> — <directive>` line when `wf.verify_mode` set (after RETRO-DUE, before `</workflow-state>`)
  - `bin/harnessed-inject-state.mjs` `workflowStateBlock`: parity replica
  - tests `tests/checkpoint/injectState.test.ts`: full → `VERIFY-MODE: full`; light → `VERIFY-MODE: light`; absent → no line; bin parity
  - directive: full → "run full verification (large/risky change: >5 files / >4 subs / >3 reqs)"; light → "scope verification to the changed surface (small change)"
- [ ] **T36.2** gate + e2e
  - biome --write clean; tsc exit 0; full vitest **serialized** exit 0 vs 1466 baseline + new cells
  - PowerShell e2e: envelope verify_mode='full' → bin emits VERIFY-MODE: full; 'light' → light; absent → none

## Constraints
- TDD mandatory (advisory surfaced to agent; low blast radius but state-rendering parity matters).
- Biome preempt before commit. Explicit file-list git add. Never push without user approval.
- Additive: absent verify_mode → byte-identical to today. No schema change. bin ≡ buildInjection parity.

## Acceptance (REQ-v110-adaptive-verify)
verify_mode surfaced each turn as a scale-appropriate directive (full/light); absent → unchanged;
no change to assessScale/thresholds/schema; full serialized gate green vs 1466.
