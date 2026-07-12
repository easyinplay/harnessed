# Phase 36 SUMMARY — scale-adaptive verify strength (Spec 3/H)

> v11.0 Phase 36 (REQ-v110-adaptive-verify), the LAST v11.0 phase. Executed local 2026-06-26 (not yet shipped). Plan: [PLAN.md](./PLAN.md). Findings: [findings.md](./findings.md).

## What shipped

The scale-adaptive `verify_mode` (`'light'|'full'`) now actually reaches the agent. `assessScale`
already computed it and `checkpoint complete` already stored it on the envelope — but nothing rendered
it. This phase surfaces it as a `VERIFY-MODE: <mode> — <directive>` advisory line in the per-turn
`<workflow-state>` breadcrumb (riding Phase 35's hook), so verification rigor scales with change size.
Closes the v5.0 deferred Spec 3/H and **completes v11.0**.

- **T36.1** Added the `VERIFY-MODE` line to `buildWorkflowStateBlock` (injectState.ts) + the bin's
  `workflowStateBlock` (byte-identical parity replica), after the RETRO-DUE block, guarded by
  `wf.verify_mode`:
  - `full`  → `VERIFY-MODE: full — run full verification (large/risky change: >5 files / >4 subs / >3 reqs)`
  - `light` → `VERIFY-MODE: light — scope verification to the changed surface (small change)`
  - absent → no line (byte-identical to before). Mirrors the SHIP-READY / RETRO-DUE precedent.

## Verify (self-verified)

- biome clean; tsc exit 0.
- **full vitest serialized 1470 passed / 0 failed** (1466 baseline + 4 cells: 3 builder full/light/absent
  + 1 bin-parity).
- **PowerShell real-binary e2e PASS**: a workflow envelope with `verify_mode:'full'` → bin stdout
  carries the full directive; `'light'` → the light directive; absent → no `VERIFY-MODE` line.

## Decisions (execute-time, transparent)

- **Surface in the breadcrumb** (chosen over a verify-prompt injection): verify_mode IS workflow-state,
  the breadcrumb is the per-turn surface Phase 35 wired, and the SHIP-READY/RETRO-DUE precedent makes it
  a one-line, zero-new-mechanism change.
- **No change to `assessScale` / thresholds / `collectScaleMetrics` / schema** — the decision + storage
  already shipped; only the render link was missing.
- **TS + bin directive strings kept byte-identical** — the `buildInjection`-vs-bin parity test fails on
  any drift.

## Commits (local, no push)

- `ac8b965` docs(36-PLAN) — plan + PWF 三件套 + REQ refine
- (this) feat(36) — VERIFY-MODE breadcrumb line (builder + bin parity) + tests + SUMMARY/STATE digest

## Out of scope (held)

- NO verify-prompt (`workflows/verify/*`) injection (rejected surface).
- NO assessScale threshold tuning, NO new schema field.
- v11.0 milestone-close (LIGHTWEIGHT) + release decision — SEPARATE gate after this lands.
