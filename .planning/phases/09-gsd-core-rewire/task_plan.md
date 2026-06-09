# Phase 9 — GSD Core re-wire · task_plan

> planning-with-files persistence layer (three-layer-stack Plan stage).
> Reconstructed retroactively 2026-06-10 (phase shipped in v4.3.0 before the
> "always produce PWF三件套" rule was confirmed). Full executable plan:
> [`09-PLAN.md`](./09-PLAN.md) (GSD gsd-planner output — authoritative task spec).
> This file = the digest checklist + file/dependency map; progress in
> [`progress.md`](./progress.md); discoveries in [`findings.md`](./findings.md).

## Goal

Additively wire 12 GSD Core 1.4.1 (`@opengsd/gsd-core`) capabilities + 4 stage-gate
triggers into the composition registry. Keystone: `gsd-execute-phase` NOT wired
(execute stays harnessed self-owned).

## Tasks

- [x] **T1** — append 12 gsd capabilities to `workflows/capabilities.yaml` (new bucket, tail), mirroring `gsd-discuss-phase` entry shape (impl/install_type/skill_dir/cmd/since:v5.1/category/description/fires_when).
  - files: `workflows/capabilities.yaml`
  - acceptance: automated 12/12 shape check; keystone guard throws if `gsd-execute-phase` present; `grep -c '^  gsd-execute-phase:' == 0`.
- [x] **T2** — create NEW `workflows/judgments/stage-phase-gate.yaml` (4 triggers: spec/ui/secure/ai-integration design-contract gates).
  - files: `workflows/judgments/stage-phase-gate.yaml` (NEW)
  - acceptance: matches `JudgmentTriggersFile` schema (root `triggers`, per-trigger description/fires_when/skips_when?/invokes[].capability); `check-workflow-schema` green.
- [x] **T3** — green gate.
  - acceptance: capability-resolver + check-workflow-schema + biome + tsc + targeted vitest green; additive-only (no existing entry mutated).

## Dependency order

T1 → T2 (triggers reference T1's capability names) → T3 (validates both).

## Acceptance (phase)

12 capabilities present + 4 triggers + keystone intact + green. Requirements:
REQ-v51-gsd-rewire, REQ-v51-gsd-judgments, REQ-v51-validation (partial).
