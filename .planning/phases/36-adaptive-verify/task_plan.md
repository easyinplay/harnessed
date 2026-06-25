# Phase 36 task_plan — scale-adaptive verify strength (Spec 3/H)

> PWF main plan. PLAN.md is the design contract. LAST v11.0 phase.

## Objective
Surface the already-computed `verify_mode` ('light'|'full') as an advisory line in the per-turn
`<workflow-state>` breadcrumb so verify rigor scales with change size — mirroring SHIP-READY/RETRO-DUE.

## Tasks

- [x] **T36.1** surface verify_mode in the breadcrumb — DONE 29/29
  - `src/checkpoint/injectState.ts` `buildWorkflowStateBlock`: `VERIFY-MODE: <mode> — <directive>` when `wf.verify_mode` set (after RETRO-DUE, before `</workflow-state>`) ✓
  - `bin/harnessed-inject-state.mjs` `workflowStateBlock`: parity replica ✓
  - tests: full → `VERIFY-MODE: full`; light → `VERIFY-MODE: light`; absent → no line; bin-parity cell ✓
  - directives byte-identical TS+bin ✓
- [x] **T36.2** gate + e2e — DONE
  - biome clean ✓; tsc exit 0 ✓; full vitest **serialized 1470/0** ✓ (1466 + 4 cells)
  - PowerShell e2e PASS ✓: verify_mode='full' → `VERIFY-MODE: full`; 'light' → light directive; absent → no line

## Constraints
- TDD mandatory (advisory surfaced to agent; low blast radius but state-rendering parity matters).
- Biome preempt before commit. Explicit file-list git add. Never push without user approval.
- Additive: absent verify_mode → byte-identical to today. No schema change. bin ≡ buildInjection parity.

## Acceptance (REQ-v110-adaptive-verify)
verify_mode surfaced each turn as a scale-appropriate directive (full/light); absent → unchanged;
no change to assessScale/thresholds/schema; full serialized gate green vs 1466.
