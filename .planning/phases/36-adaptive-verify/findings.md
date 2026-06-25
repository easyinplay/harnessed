# Phase 36 findings — scale-adaptive verify strength

> PWF findings. Research + locked decisions + gotchas. Distilled. LAST v11.0 phase.

## Brainstorming decision (superpowers:brainstorming 2026-06-25, user-approved)

- **Surface `verify_mode` as a breadcrumb advisory line** (chosen `a` over a verify-prompt injection).
  Mirror the existing SHIP-READY / RETRO-DUE directive lines in `buildWorkflowStateBlock` + the bin's
  parity replica. Rationale: verify_mode IS workflow-state; the breadcrumb is the per-turn surface
  Phase 35 just wired; the SHIP-READY precedent makes it a one-line, zero-new-mechanism change. Rejected
  the verify-prompt path (new render path, invisible unless a verify sub is active).
- **Line shape**: `VERIFY-MODE: full — run full verification (large/risky change: >5 files / >4 subs /
  >3 reqs)` and `VERIFY-MODE: light — scope verification to the changed surface (small change)`. Emit
  only when `wf.verify_mode` is set (absent → no line → byte-identical to today).

## Codebase research (grep-verified)

- **Decision already ships**: `src/checkpoint/scale.ts:20` `assessScale(m)` → `'full'` when
  `changedFiles>5 || firedSubs>4 || requirements>3`, else `'light'`. `collectScaleMetrics` is the
  impure git/.planning collector (fail-soft to 0 → deterministic `'light'` in a non-git/non-GSD repo).
- **Producer already ships**: `src/cli/checkpoint.ts:209` `checkpoint complete` writes
  `verify_mode: assessScale(metrics)` onto the envelope (comment L201: "advisory; consumed by the verify
  skill" — but there is NO consumer). Schema: `currentWorkflow.v1.ts:81`
  `verify_mode: Optional(Union('light','full'))`.
- **The gap**: `buildWorkflowStateBlock` (injectState.ts) and the bin's `workflowStateBlock` render
  `phase`/`status`/`next`/`BREAK-LOOP`/`SHIP-READY`/`RETRO-DUE` but NOT `verify_mode`. So the stored
  signal never reaches the agent. This phase adds the missing render line, parity-guarded.
- **Test seams**: `tests/checkpoint/injectState.test.ts:33` `describe('buildWorkflowStateBlock')` +
  `reminderWf` helper (used by the SHIP-READY/RETRO-DUE cells); bin-parity describe at :208.

## Gotchas
- bin `workflowStateBlock` line numbers shifted after Phase 35 (sessionIdEnvName + readWorkflow grew):
  ship_ready ~L86 / retro_due ~L91 / `</workflow-state>` ~L96. Insert the VERIFY-MODE block after
  retro_due, before the closing push, in BOTH the TS builder and the bin (parity).
- Keep the TS and bin directive strings byte-identical — the parity test (`buildInjection` vs bin
  stdout) fails on any drift.

## TDD posture
TDD MANDATORY — state-rendering with a bin/TS parity invariant (drift silently breaks the hot-path
injection). Low blast radius (advisory text) but the parity contract is real. No TDD-skip.

## After this phase
- v11.0 is COMPLETE (3/3). Milestone-close (LIGHTWEIGHT, sister to v10.0) + a release decision are a
  SEPARATE gate after Phase 36 lands — not part of this phase.
