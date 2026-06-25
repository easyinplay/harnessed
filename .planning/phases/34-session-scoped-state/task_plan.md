# Phase 34 task_plan — session-scoped workflow state (Spec 2/D)

> PWF main plan. SoT for task list + acceptance. Mirrors PLAN.md tasks; PLAN.md is the design contract.

## Objective
Composite-key `<repoKey>::<sessionId>` overlay on the Phase 15 `workflows.json` store so concurrent
same-repo CC sessions get independent active-task pointers; single-session path byte-identical.

## Tasks (dependency order)

- [ ] **T34.1** `activeKey()` in `src/checkpoint/workflowStore.ts` (TDD red→green)
  - new export `activeKey(cwd?)` = `repoKey(cwd)` + (`CLAUDE_CODE_SESSION_ID?.trim()` ? `::<sid>` : ``)
  - tests in `tests/checkpoint/workflowStore.test.ts`: sid set / unset / empty / cwd passthrough
  - accept: `activeKey()===repoKey()` when no sid; gate green
- [ ] **T34.2** rewire workflow slot to `activeKey` in `src/checkpoint/state.ts` (TDD red→green)
  - L91 read: `store.workflows[activeKey()] ?? store.workflows[repoKey()] ?? null`
  - L109 write: `store.workflows[activeKey()] = s`
  - DO NOT touch: D7 legacy mirror (L114), retro_meta (checkpoint.ts:271), learnings (learnings.ts:86)
  - tests in `tests/checkpoint/state-store.test.ts`: sid slot / no-sid bare slot / read-fallback / concurrent 2-sid isolation
  - accept: pre-existing no-sid cells green unchanged; gate green
- [ ] **T34.3** gate + e2e verify
  - biome --write clean; tsc clean; vitest green vs 1446 baseline + new cells
  - PowerShell e2e: sid set → composite key in workflows.json + status --recover resolves; unset → bare key; coexist

## Constraints
- TDD mandatory (core data-structure / state SoT keying — error cost high).
- Biome preempt before every commit (`corepack pnpm exec biome check --write`).
- Additive, no schema bump, no schemaVersion change.
- Explicit file-list git add (never `-A`); never push without user approval.
- < 5 files touched (2 src + 2 test).

## Acceptance (REQ-v110-session-state)
sid → `<repoKey>::<sid>` slot; no sid → bare `repoKey` unchanged; read fallback session→bare→null;
2 concurrent sids no collision; retro_meta stays repoKey; additive no-bump; full gate green vs 1446.
