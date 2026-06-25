# Phase 35 SUMMARY — per-turn injection hook (Spec 3/G)

> v11.0 Phase 35 (REQ-v110-perturn-inject). Executed local 2026-06-25 (not yet shipped). Plan: [PLAN.md](./PLAN.md). Findings: [findings.md](./findings.md).

## What shipped

The per-turn `<workflow-state>` + `<project-context>` injection now (a) can fire **every turn** via an
opt-in **UserPromptSubmit** hook and (b) reads the **active session's** workflow slot — with the
session-id env resolved **through the PlatformDescriptor seam**, so the harness stays cross-harness
(not welded to Claude Code). Closes the v5.0 deferred Spec 3/G + completes the Phase 34 integration.

- **T35.1** NEW `sessionIdEnv: string | null` on `PlatformDescriptor` (platform.ts): claude →
  `'CLAUDE_CODE_SESSION_ID'`, codex → `null` (no verified codex session env → single-session; anti-stale).
- **T35.2** `activeKey()` (workflowStore.ts) **de-hardcoded** off `CLAUDE_CODE_SESSION_ID` onto
  `detectPlatform().sessionIdEnv` → reads that env (null → bare `repoKey`). Same behavior for claude;
  `HARNESSED_PLATFORM=codex` now yields bare even when CC's env is set.
- **T35.3** `bin/harnessed-inject-state.mjs` made session-aware: `sessionIdEnvName()` mirrors the
  descriptor (HARNESSED_PLATFORM→map, default claude); `readWorkflow` is now 3-tier
  (session `<repoKey>::<sid>` → bare `repoKey` → legacy singleton). The `.planning/` fs paths keep
  using the bare `repoKey` (the composite key is not a real directory). Parity with `buildInjection`
  preserved.
- **T35.4** NEW opt-in `manifests/optional/perturn-inject.yaml` — `cc-hook-add` registering
  `node bin/harnessed-inject-state.mjs` on `UserPromptSubmit` (mirror of `dashboard-autospawn.yaml`).
  `manifests/optional/` is opt-in by construction (explicit `harnessed install`; `setup` auto-glob
  covers only tools+skill-packs).

## Verify (self-verified)

- biome clean; tsc exit 0.
- **full vitest serialized 1466 passed / 0 failed** (1456 baseline + 10 cells: platform sessionIdEnv 4,
  workflowStore codex 1, injectState session+codex 2, perturn-inject-manifest 3).
- **PowerShell real-binary e2e PASS**: two sessions in one repo (A=`task`, B=`verify`) seeded via the
  real CLI → two coexisting `<repoKey>::<sid>` slots; the session-aware bin injects each session's OWN
  workflow (A→`phase: task`, B→`phase: verify`), reading the composite slot, not the legacy mirror.

## Decisions (execute-time refinements, transparent)

- **Cross-harness session seam** (user-flagged): `CLAUDE_CODE_SESSION_ID` is CC-specific; routed through
  `PlatformDescriptor.sessionIdEnv` instead, AND de-hardcoded Phase 34's `activeKey` onto the same seam
  (Phase 34 committed but not pushed → zero-cost). New platforms add one descriptor field, no call-site
  churn — consistent with the Phase 26–28 seam philosophy.
- **Feasibility self-resolved** (no `/plan-eng-review`): `ccHookAdd` already supports `UserPromptSubmit`
  and a SessionStart hook (`dashboard-autospawn`) already ships.
- **Opt-in, not default-on**: per-turn injection has a ~1500-token cost and only matters in a
  harnessed-workflow repo; the bin exits 0 silently with no workflow → enabled hook elsewhere is a no-op.
- **bin replicates a minimal platform→sessionEnv** (HARNESSED_PLATFORM-or-default), not full
  `detectPlatform` — the `.platform`-pin / auto-probe precedence governs state-root, already handled via
  `HARNESSED_ROOT_OVERRIDE`; parity test sets matching signals. Documented in the bin + findings.

## Commits (local, no push)

- `488efe3` docs(35-PLAN) — plan + PWF 三件套 + REQ refine
- (this) feat(35) — sessionIdEnv seam + activeKey de-hardcode + bin session-aware + opt-in manifest + tests + SUMMARY/STATE digest

## Out of scope (held)

- NO default-on wiring; NO codex session env (descriptor `null` until a real one exists).
- NO change to `buildInjection` (pure builder, no production reader but the bin).
- scale-adaptive verify (Phase 36) — next + last v11.0 phase.
- schema / schemaVersion — UNCHANGED.
