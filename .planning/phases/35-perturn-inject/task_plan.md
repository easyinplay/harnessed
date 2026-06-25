# Phase 35 task_plan — per-turn injection hook (Spec 3/G)

> PWF main plan. PLAN.md is the design contract; this is the task/acceptance SoT.

## Objective
Wire the existing `bin/harnessed-inject-state.mjs` as an opt-in UserPromptSubmit hook AND make the
injection read the current session's slot (Phase 34) via the cross-harness PlatformDescriptor seam
(no hardcoded `CLAUDE_CODE_SESSION_ID`).

## Tasks (dependency order)

- [ ] **T35.1** `sessionIdEnv: string | null` on PlatformDescriptor (TDD red→green)
  - `src/installers/lib/platform.ts`: interface field + claude→`'CLAUDE_CODE_SESSION_ID'` / codex→`null`
  - tests `tests/installers/platform.test.ts`: claude / codex / detectPlatform default
- [ ] **T35.2** `activeKey()` via the seam (TDD red→green) — de-hardcode Phase 34
  - `src/checkpoint/workflowStore.ts`: `detectPlatform().sessionIdEnv` → read that env (null → bare)
  - tests `tests/checkpoint/workflowStore.test.ts`: claude+sid → composite; HARNESSED_PLATFORM=codex → bare even with CLAUDE_CODE_SESSION_ID set; no env → bare
- [ ] **T35.3** bin session-aware slot read (TDD red→green via parity)
  - `bin/harnessed-inject-state.mjs`: session env (HARNESSED_PLATFORM→map, default claude) → 3-tier read session→bare→legacy
  - tests `tests/checkpoint/injectState.test.ts`: deterministic session env in existing parity cells + NEW session-keyed read cell; stdout still byte-matches buildInjection
- [ ] **T35.4** opt-in UserPromptSubmit manifest (NEW)
  - `manifests/optional/perturn-inject.yaml` (mirror dashboard-autospawn): cc-hook-add / UserPromptSubmit / `node bin/harnessed-inject-state.mjs`
  - test: validate vs `schemas/manifest.v1.schema.json`; install resolves optional path; setup auto-glob excludes
- [ ] **T35.5** gate + e2e
  - biome --write clean; tsc exit 0; full vitest **serialized** exit 0 vs 1456 baseline + new cells
  - PowerShell e2e: session-scoped inject reads the right session's state; codex platform → bare; manifest installs a UserPromptSubmit entry idempotently

## Constraints
- TDD mandatory (state read seam + cross-harness abstraction — error cost high).
- Biome preempt before every commit. Explicit file-list git add. Never push without user approval.
- Additive, no schema bump. anti-stale: codex sessionIdEnv stays `null` until a real env exists.
- Parity invariant: bin stdout ≡ `buildInjection` on identical `wf`.

## Acceptance (REQ-v110-perturn-inject)
UserPromptSubmit hook (opt-in) fires the injection each turn; injection reads `<repoKey>::<sid>` for the
active session (bare repoKey fallback; legacy last); session env resolved via descriptor `sessionIdEnv`
(claude→CLAUDE_CODE_SESSION_ID, codex→null), NOT hardcoded; additive no-bump; full serialized gate green.
