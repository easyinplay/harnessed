---
phase: 36
milestone: v11.0
title: scale-adaptive verify strength (surface verify_mode in the per-turn breadcrumb)
status: ready-to-execute
created: 2026-06-25
requirement: REQ-v110-adaptive-verify
depends_on: [35]
blocks: []
verified_refs:
  - "src/checkpoint/scale.ts:20 assessScale → 'light'|'full' (exists — no change; the decision source)"
  - "src/cli/checkpoint.ts:209 writes verify_mode: assessScale(metrics) onto the envelope (exists — no change; the producer)"
  - "src/checkpoint/schema/currentWorkflow.v1.ts:81 verify_mode: Optional(Union('light','full')) (exists — no change)"
  - "src/checkpoint/injectState.ts:11 buildWorkflowStateBlock (exists — ADD a VERIFY-MODE advisory line, mirror SHIP-READY/RETRO-DUE)"
  - "bin/harnessed-inject-state.mjs workflowStateBlock (ship_ready ~L86 / retro_due ~L91 / </workflow-state> ~L96) (exists — parity ADD)"
  - "tests/checkpoint/injectState.test.ts:33 describe buildWorkflowStateBlock + reminderWf helper (exists — add verify_mode cells)"
  - "tests/checkpoint/injectState.test.ts:208 bin parity (exists — verify_mode flows through unchanged)"
---

# Phase 36 — scale-adaptive verify strength (Spec 3/H, LAST v11.0 phase)

## Goal

Make the already-computed `verify_mode` (`'light'|'full'`) actually reach the agent so verification
rigor scales with change size/risk. Today `assessScale` computes it and `checkpoint complete` stores
it on the envelope, but **nothing surfaces it** — so it never changes behavior. Surface it as an
advisory line in the per-turn `<workflow-state>` breadcrumb (riding Phase 35's UserPromptSubmit hook).
Closes the v5.0 deferred Spec 3/H and completes v11.0.

## Why this is a 1-surface change (research finding)

The scale machinery already exists and is tested:
- `src/checkpoint/scale.ts` — `assessScale(metrics)` → `'light'|'full'` (>5 files / >4 fired subs /
  >3 requirements ⇒ `full`), `collectScaleMetrics` (git-diff / ledger / REQUIREMENTS, fail-soft to 0).
- `src/cli/checkpoint.ts:209` — `checkpoint complete` writes `verify_mode: assessScale(metrics)` onto
  the workflow envelope. Schema field exists (currentWorkflow.v1.ts:81).

The ONLY gap: `verify_mode` is stored but never rendered. `buildWorkflowStateBlock` (and the bin's
parity replica) emit `phase` / `status` / `next` / `BREAK-LOOP` / `SHIP-READY` / `RETRO-DUE` — but not
`verify_mode`. So the advisory "the verify skill consumes it" (checkpoint.ts:201 comment) has no
consumer. This phase adds exactly that one line, mirroring the existing SHIP-READY/RETRO-DUE pattern.

## Design (locked via superpowers:brainstorming 2026-06-25, user-approved)

**Surface in the breadcrumb (chosen over a verify-prompt injection).** Add one advisory line to
`buildWorkflowStateBlock` (injectState.ts) when `wf.verify_mode` is set, exactly parallel to the
existing `SHIP-READY` / `RETRO-DUE` directive lines, and mirror it in the bin's `workflowStateBlock`
(the parity test guards equivalence). Rationale: verify_mode IS workflow-state, the breadcrumb is the
per-turn surface Phase 35 just wired, and the SHIP-READY/RETRO-DUE precedent makes it a one-line,
zero-new-mechanism addition. (Rejected: injecting into `workflows/verify/*` prompts — a new render
path, and invisible unless a verify sub is active.)

**Line shape** (uppercase directive, sister to SHIP-READY):
- `full`  → `VERIFY-MODE: full — run full verification (large/risky change: >5 files / >4 subs / >3 reqs)`
- `light` → `VERIFY-MODE: light — scope verification to the changed surface (small change)`

Emitted only when `verify_mode` is present (optional field absent → no line; byte-identical to today).

## Tasks

### T36.1 — surface verify_mode in the breadcrumb (TDD: red → green)
- **Files**: `src/checkpoint/injectState.ts` (`buildWorkflowStateBlock`) + `bin/harnessed-inject-state.mjs`
  (`workflowStateBlock`, parity replica). Add the `VERIFY-MODE: <mode> — <directive>` line after the
  `RETRO-DUE` block, before `</workflow-state>`, guarded by `if (wf.verify_mode)`.
- **Tests** (`tests/checkpoint/injectState.test.ts`): `verify_mode:'full'` → contains
  `VERIFY-MODE: full`; `'light'` → contains `VERIFY-MODE: light`; absent → no `VERIFY-MODE` line
  (use the existing `reminderWf` helper). Extend a bin-parity cell so the bin emits the same line
  (stdout byte-matches `buildInjection`).
- **Acceptance**: red→green; absent-field path byte-identical to today; bin≡builder parity; gate green.

### T36.2 — gate + end-to-end verify
- **Acceptance**: `corepack pnpm exec biome check --write` clean; `tsc` exit 0; full `vitest`
  **serialized** exit 0 vs the 1466 baseline (+ new cells). End-to-end (PowerShell): build `dist`; in a
  repo with a workflow whose envelope carries `verify_mode:'full'`, `node bin/harnessed-inject-state.mjs`
  → stdout contains the `VERIFY-MODE: full` directive; with `'light'` → the light directive; with no
  `verify_mode` → no VERIFY-MODE line.

## Out of scope (YAGNI)
- NO change to `assessScale` thresholds or `collectScaleMetrics` (the decision logic already ships).
- NO verify-prompt (`workflows/verify/*`) injection (rejected surface).
- NO new schema field (`verify_mode` already exists, optional).
- milestone-close (v11.0 complete after this) is a SEPARATE gate, not part of this phase.

## Goal-backward check
Goal = "verify rigor scales with change size by actually reaching the agent." The decision (`assessScale`)
and the stored signal (`verify_mode` on the envelope) already exist; the only missing link is rendering
it. T36.1 renders it in the per-turn breadcrumb (the Phase 35 surface) with a scale-appropriate
directive, guarded so the absent case is unchanged; T36.2 proves it end-to-end + gate. REQ-v110-adaptive-verify
is covered by surfacing the existing light/full decision to the agent each turn.
