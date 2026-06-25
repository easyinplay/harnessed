# Phase 34 SUMMARY — session-scoped workflow state (Spec 2/D)

> v11.0 Phase 34 (REQ-v110-session-state), the first v11.0 phase. Executed local 2026-06-25 (not yet shipped). Plan: [PLAN.md](./PLAN.md). Findings: [findings.md](./findings.md).

## What shipped

Two concurrent CC sessions in the **same repo** now hold independent workflow active-task pointers,
via a **composite key** `<repoKey>::<sessionId>` overlaid on the Phase 15 `workflows.json` store. The
single-session path (no session id) is byte-identical to before. Closes the v5.0 deferred Spec 2/D.

- **T34.1** NEW `activeKey(cwd?)` in `src/checkpoint/workflowStore.ts` — `repoKey(cwd)` +
  (`process.env.CLAUDE_CODE_SESSION_ID?.trim()` ? `::<sid>` : ``). When no session id,
  `activeKey()===repoKey()`. TDD red(5)→green(14/14). No schema change (composite key is a legal
  `Record<string,…>` map-key).
- **T34.2** rewire the two workflow-slot accesses in `src/checkpoint/state.ts` to `activeKey`:
  read (`store.workflows[activeKey()] ?? store.workflows[repoKey()] ?? null`, session→bare fallback) +
  write (`store.workflows[activeKey()] = s`). TDD red(2)→green(24/24). `retro_meta` / `learnings` /
  the D7 legacy mirror left on `repoKey` (deliberate — repo properties, not session).

## Verify (self-verified)

- biome clean; tsc exit 0.
- **full vitest serialized exit 0** (authoritative). The 10 parallel-run failures were ALL
  `tests/integration/*` install/e2e subprocess tests — flaky under heavy parallelism (7/7 green run
  isolated; matches the orphan-MCP/starvation project memory, NOT a regression). My touched suites
  `workflowStore.test.ts` + `state-store.test.ts` = 24/24 green isolated.
- **PowerShell real-binary e2e PASS**: built `dist/cli.mjs`; `CLAUDE_CODE_SESSION_ID=sessE2E` +
  `harnessed checkpoint start task` → `workflows.json` key `<repo>::sessE2E`; empty env + same command
  → bare `<repo>` key; the two slots coexist (no collision).

## Decisions (execute-time refinements, transparent)

- **Composite key, NOT the v5.0 sketch's `sessions/<id>.json`.** The v5.0 design (2026-06-05) predated
  Phase 15, which already replaced the `current-workflow.json` singleton with the repo-keyed
  `workflows.json` map. A separate `sessions/` dir would be a second SoT diverging from that store.
  Overlaying the session on the existing key is KARPATHY-minimal, additive, reuses the one write+lock
  path. REQ-v110-session-state was refined to this mechanism (sketch-then-refine, ADR-011). Rejected
  nested map (needs schemaVersion bump, breaks additive-optional).
- **Env var is `CLAUDE_CODE_SESSION_ID`** (verified CC exposes it to Bash), not the sketch's
  `CLAUDE_SESSION_ID`. Subagents carry `CLAUDE_CODE_CHILD_SESSION=1` + inherit the parent's id → their
  checkpoint writes land in the parent's session slot (correct: same workflow), no special-casing.
- **`retro_meta` + `learnings` stay keyed by `repoKey`** — retro cadence + learnings are repo
  properties; two sessions in one repo share them. Only the workflow slot (state.ts:91/109) flips.

## Commits (local, no push)

- `9a1d2af` docs(34-PLAN) — plan + PWF 三件套 + REQ refine
- (this) feat(34) — `activeKey` + state.ts rewire + tests + SUMMARY/STATE digest

## Out of scope (held)

- NO `sessions/` dir, NO stale-slot GC/TTL (slots are tiny; deferred until a real need).
- per-turn injection hook (Phase 35) + scale-adaptive verify (Phase 36) — next phases.
- schema / schemaVersion — UNCHANGED.
