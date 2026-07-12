---
phase: 34
milestone: v11.0
title: session-scoped workflow state (composite-key ledger pointer)
status: ready-to-execute
created: 2026-06-25
requirement: REQ-v110-session-state
depends_on: [15]
blocks: [35]
verified_refs:
  - "src/checkpoint/workflowStore.ts:60 repoKey(cwd) (exists — add sibling activeKey)"
  - "src/checkpoint/workflowStore.ts:77 readStoreRaw legacy compat-read surfaces under repoKey() (exists — unchanged)"
  - "src/checkpoint/state.ts:91 readCurrentWorkflow → store.workflows[repoKey()] ?? null (exists — flip to activeKey + bare fallback)"
  - "src/checkpoint/state.ts:109 writeCurrentWorkflowUnlocked → store.workflows[repoKey()] = s (exists — flip to activeKey)"
  - "src/cli/checkpoint.ts:271 repoKey() keys retro_meta (exists — STAYS repoKey, do NOT touch)"
  - "src/checkpoint/learnings.ts:86 appendLearning(repoKey()) (exists — STAYS repoKey, repo artifact)"
  - "src/checkpoint/schema/workflowStore.v1 WorkflowStoreV1.workflows = Record(String, …) (exists — composite key is a legal map-key, NO schema change)"
  - "process.env.CLAUDE_CODE_SESSION_ID (verified CC exposes to Bash: 60552b8e-… — NEW read in activeKey)"
  - "tests/checkpoint/workflowStore.test.ts (exists — add activeKey cells)"
  - "tests/checkpoint/state-store.test.ts (exists — add read-fallback / write-keying / concurrent-session cells)"
---

# Phase 34 — session-scoped workflow state (Spec 2/D)

## Goal

Let two concurrent CC sessions in the **same repo** hold independent active-task pointers,
without breaking the single-session path (which must stay byte-identical to today). Closes the
v5.0 deferred **Spec 2/D**.

End state: the per-repo `workflows.json` store (Phase 15) gains a session dimension via a
**composite key** `<repoKey>::<sessionId>`. When `CLAUDE_CODE_SESSION_ID` is present the active
workflow lives under the composite slot; when absent (single-session, scripts, CI) the bare
`repoKey` slot is used exactly as today.

## Design (locked via superpowers:brainstorming 2026-06-25)

**Why composite key, not the v5.0 sketch's `sessions/<id>.json`**: the v5.0 design (2026-06-05)
predated Phase 15, which already replaced the `current-workflow.json` singleton with the
repo-keyed `workflows.json` map. A separate `sessions/` dir would be a second SoT diverging from
that store (two read/write/lock paths). Overlaying the session on the existing store's **key** is
KARPATHY-minimal, additive, and reuses the one funneled write+lock path. (Rejected: nested map
`workflows[repoKey][sessionId]` — needs a `Record<string,Record<…>>` schema change + schemaVersion
bump, breaks the additive-optional invariant.)

**`activeKey(cwd?)`** = `repoKey(cwd)` + (`sid` ? `'::' + sid` : `''`), where
`sid = process.env.CLAUDE_CODE_SESSION_ID?.trim()` (falsy/empty → no suffix). When there is no
session id, `activeKey() === repoKey()`, so every downstream read/write is the today path verbatim.

**Read fallback (single→multi seamless)**: `store.workflows[activeKey()] ?? store.workflows[repoKey()] ?? null`.
session-key slot → bare `repoKey` slot → null. An in-flight workflow started without session-scoping
(or surfaced by `readStoreRaw`'s legacy compat-read under `repoKey()`) stays readable once the
session has an id. When no sid, the first branch already IS the bare key (second branch redundant,
harmless).

**Write**: `store.workflows[activeKey()] = s` only. No migration/move of a bare slot (harmless: the
read-fallback covers the in-flight bare slot until the session-keyed slot exists, then shadows it).
The D7 dual-write mirror to the legacy `statePath()` singleton (state.ts:114) is session-agnostic and
**unchanged** (rollback anchor).

**`retro_meta` stays keyed by `repoKey`** (checkpoint.ts:271): retro cadence is a repo property, not a
session one — two sessions in one repo share the retro counter. Deliberate asymmetry. `learnings`
likewise stays `repoKey` (repo artifact). Only the **workflow slot** (state.ts:91/109) flips.

**Schema**: NO change, NO schemaVersion bump. `WorkflowStoreV1.workflows` is `Record(String, …)`; a
composite key is a legal map-key string; values are unchanged `CurrentWorkflowV1` envelopes. Old
stores `Value.Check`-pass unchanged.

## Tasks

### T34.1 — `activeKey()` in workflowStore.ts (TDD: red → green)
- **File**: `src/checkpoint/workflowStore.ts` (NEW export `activeKey`, sibling to `repoKey`).
  - `export function activeKey(cwd: string = process.cwd()): string` → `repoKey(cwd)` + composite suffix from `process.env.CLAUDE_CODE_SESSION_ID?.trim()` (empty/unset → bare `repoKey(cwd)`).
- **Tests** (`tests/checkpoint/workflowStore.test.ts`): sid set → `<repoKey>::<sid>`; sid unset → bare `repoKey` (=== `repoKey()`); sid empty/whitespace → bare; cwd passthrough to `repoKey`. Save/restore `process.env.CLAUDE_CODE_SESSION_ID` per cell. Red first.
- **Acceptance**: red→green; `activeKey()===repoKey()` when no sid (byte-identical guarantee); biome/tsc/vitest green.

### T34.2 — rewire the workflow slot to `activeKey` (TDD: red → green)
- **File**: `src/checkpoint/state.ts`.
  - L91 read: `return store.workflows[activeKey()] ?? store.workflows[repoKey()] ?? null` (import `activeKey` alongside `repoKey`).
  - L109 write: `store.workflows[activeKey()] = s`.
  - Do NOT touch the D7 legacy `statePath()` mirror (L114), retro_meta, or learnings.
- **Tests** (`tests/checkpoint/state-store.test.ts`): with sid → read/write land in `<repoKey>::<sid>` slot; without sid → bare `repoKey` slot (existing behavior, existing cells stay green); read-fallback: write under bare repoKey, then set sid → read still returns it (session-key absent → bare branch); concurrent: two distinct sids → two slots, no collision (write A, write B, both readable under their sids, neither clobbers).
- **Acceptance**: red→green; all pre-existing state-store cells green unchanged (no-sid path intact); biome/tsc/vitest green.

### T34.3 — gate + end-to-end verify
- **Acceptance**: `corepack pnpm exec biome check --write` clean; `tsc` clean; full `vitest` green vs the 1446 baseline (+ new activeKey / slot-keying cells). End-to-end (PowerShell): with `CLAUDE_CODE_SESSION_ID` set, `harnessed checkpoint start <m> --plan <json>` → `workflows.json` shows a `<repoKey>::<sid>` key; `harnessed status --recover` resolves that session's ledger; unset the env → a second `harnessed checkpoint start` lands in the bare `repoKey` key, both slots coexist; existing single-session e2e (no env) byte-identical.

## Out of scope (YAGNI)
- NO `sessions/` directory, NO separate-file SoT (rejected mechanism).
- NO stale session-slot GC / TTL eviction (slots are tiny; deferred until a real need).
- NO per-turn injection hook (Phase 35) — `status --recover` already resolves per-session via activeKey, so no inject change is needed here.
- NO scale-adaptive verify (Phase 36).
- `retro_meta` / `learnings` keying — explicitly UNCHANGED (repoKey).
- schema / schemaVersion — UNCHANGED.

## Goal-backward check
Goal = "concurrent same-repo sessions get independent pointers; single-session byte-identical."
T34.1 introduces the one key function that encodes the session dimension (and degrades to `repoKey`
when absent → the byte-identical guarantee). T34.2 routes the two workflow-slot accesses through it
with a bare-repoKey read-fallback (seamless single→multi). T34.3 proves both paths + the gate. The
asymmetry (retro_meta/learnings stay repoKey) is enforced by only touching state.ts:91/109. Every
acceptance clause of REQ-v110-session-state is covered; the schema/no-bump invariant holds by
construction (composite key is a plain map-key).
