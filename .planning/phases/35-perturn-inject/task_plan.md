# Phase 35 task_plan — per-turn injection hook (Spec 3/G)

> PWF main plan. PLAN.md is the design contract; this is the task/acceptance SoT.

## Objective
Wire the existing `bin/harnessed-inject-state.mjs` as an opt-in UserPromptSubmit hook AND make the
injection read the current session's slot (Phase 34) via the cross-harness PlatformDescriptor seam
(no hardcoded `CLAUDE_CODE_SESSION_ID`).

## Tasks (dependency order)

- [x] **T35.1** `sessionIdEnv: string | null` on PlatformDescriptor — DONE 32/32
  - `src/installers/lib/platform.ts`: field + claude→`'CLAUDE_CODE_SESSION_ID'` / codex→`null` ✓
  - tests `tests/installers/platform.test.ts`: claude / codex / detectPlatform default / home-independent ✓
- [x] **T35.2** `activeKey()` via the seam — DONE 25/25 (de-hardcode Phase 34)
  - `src/checkpoint/workflowStore.ts`: `detectPlatform().sessionIdEnv` → read that env (null → bare) ✓
  - tests: claude+sid → composite; `HARNESSED_PLATFORM=codex` → bare even with CLAUDE_CODE_SESSION_ID set ✓
- [x] **T35.3** bin session-aware slot read — DONE 25/25 (parity preserved)
  - `bin/harnessed-inject-state.mjs`: `sessionIdEnvName()` (HARNESSED_PLATFORM→map) → 3-tier session→bare→legacy; `.planning` fs paths stay on bare repoKey ✓
  - tests: deterministic session env in existing cells + session-keyed read cell + codex bare cell; stdout byte-matches buildInjection ✓
- [x] **T35.4** opt-in UserPromptSubmit manifest — DONE 3/3
  - `manifests/optional/perturn-inject.yaml` (mirror dashboard-autospawn) ✓; `tests/installers/perturn-inject-manifest.test.ts` (schema-valid + UserPromptSubmit + optional/ path) ✓
- [x] **T35.5** gate + e2e — DONE
  - biome clean ✓; tsc exit 0 ✓; full vitest **serialized 1466/0** ✓ (1456 + 10 cells)
  - PowerShell e2e PASS ✓: two sessions (A=task, B=verify) → coexisting composite slots, session-aware bin injects each session's OWN workflow

## Constraints
- TDD mandatory (state read seam + cross-harness abstraction — error cost high).
- Biome preempt before every commit. Explicit file-list git add. Never push without user approval.
- Additive, no schema bump. anti-stale: codex sessionIdEnv stays `null` until a real env exists.
- Parity invariant: bin stdout ≡ `buildInjection` on identical `wf`.

## Acceptance (REQ-v110-perturn-inject)
UserPromptSubmit hook (opt-in) fires the injection each turn; injection reads `<repoKey>::<sid>` for the
active session (bare repoKey fallback; legacy last); session env resolved via descriptor `sessionIdEnv`
(claude→CLAUDE_CODE_SESSION_ID, codex→null), NOT hardcoded; additive no-bump; full serialized gate green.
