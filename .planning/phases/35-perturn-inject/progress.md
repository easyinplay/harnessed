# Phase 35 progress — per-turn injection hook

> PWF progress tracker. Update on each task flip / blocker.

## Status: COMPLETE — all tasks GREEN (pending close commit)

| Task | State | Notes |
|------|-------|-------|
| T35.1 sessionIdEnv on descriptor | ✅ done | platform.ts + platform.test.ts; 32/32 (no codex regression) |
| T35.2 activeKey via seam | ✅ done | de-hardcode; workflowStore.ts + codex→null cell; 25/25 |
| T35.3 bin session-aware | ✅ done | 3-tier session→bare→legacy; injectState parity + 2 new cells; 25/25 |
| T35.4 opt-in manifest | ✅ done | manifests/optional/perturn-inject.yaml + validation test; 3/3 |
| T35.5 gate + e2e | ✅ done | biome clean · tsc exit0 · vitest serialized 1466/0 · PowerShell 2-session e2e PASS |

## Log
- 2026-06-25 — Phase 35 opened + planned (research: injection builder + bin exist but never wired; bin read bare repoKey). User flagged `CLAUDE_CODE_SESSION_ID` hardcode → cross-harness seam design.
- 2026-06-25 — EXECUTED (TDD). T35.1 `sessionIdEnv` field (claude→CLAUDE_CODE_SESSION_ID, codex→null) red→green. T35.2 `activeKey` via `detectPlatform().sessionIdEnv` (de-hardcodes Phase 34) red→green; `HARNESSED_PLATFORM=codex`→bare proven. T35.3 bin session-aware (HARNESSED_PLATFORM→env map, 3-tier session→bare→legacy read; .planning fs paths stay on bare repoKey) red→green; parity preserved. T35.4 opt-in UserPromptSubmit manifest (mirror dashboard-autospawn) + schema-validation test. T35.5 gate: biome clean, tsc exit 0, **full vitest serialized 1466 passed / 0 failed** (1456 baseline + 10 cells). PowerShell e2e PASS: two sessions (A=task, B=verify) in one repo → coexisting composite slots, the session-aware bin injects each session's OWN workflow (not the legacy mirror).

## Blocked
- (none)

## Note
- e2e codex-isolation is covered by the injectState codex unit cell (no legacy mirror → bare authoritative). At the CLI/bin process boundary the D7 legacy mirror is always the last-tier fallback, so a single-workflow codex run still injects via legacy — correct 3-tier behavior, not session scoping. Two-session claude isolation is the meaningful process-boundary proof.
