# Phase 35 progress — per-turn injection hook

> PWF progress tracker. Update on each task flip / blocker.

## Status: PLANNED (ready-to-execute) — not yet started

| Task | State | Notes |
|------|-------|-------|
| T35.1 sessionIdEnv on descriptor | ⬜ pending | platform.ts + platform.test.ts |
| T35.2 activeKey via seam | ⬜ pending | de-hardcode Phase 34; workflowStore.ts + test |
| T35.3 bin session-aware | ⬜ pending | 3-tier read; injectState.test.ts parity |
| T35.4 opt-in manifest | ⬜ pending | manifests/optional/perturn-inject.yaml (NEW) |
| T35.5 gate + e2e | ⬜ pending | biome/tsc/vitest serialized 1456 + PowerShell e2e |

## Log
- 2026-06-25 — Phase 35 opened + planned. Research: injection builder + bin ALREADY exist (parity-tested) but never wired as a CC hook; bin reads bare repoKey → would miss Phase 34's session slot. Feasibility proven (ccHookAdd supports UserPromptSubmit; dashboard-autospawn ships). User flagged `CLAUDE_CODE_SESSION_ID` hardcode as cross-harness coupling → design routes session-env through a NEW `PlatformDescriptor.sessionIdEnv` field (claude→CLAUDE_CODE_SESSION_ID, codex→null) + de-hardcodes Phase 34's activeKey. Wiring = opt-in (manifests/optional/). PLAN.md ready-to-execute.

## Blocked
- (none)
