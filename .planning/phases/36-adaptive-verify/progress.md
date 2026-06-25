# Phase 36 progress — scale-adaptive verify strength

> PWF progress tracker. Update on each task flip / blocker. LAST v11.0 phase.

## Status: PLANNED (ready-to-execute) — not yet started

| Task | State | Notes |
|------|-------|-------|
| T36.1 surface verify_mode | ⬜ pending | injectState.ts + bin parity; injectState.test.ts cells |
| T36.2 gate + e2e | ⬜ pending | biome/tsc/vitest serialized 1466 + PowerShell e2e |

## Log
- 2026-06-25 — Phase 36 opened + planned. Research: `assessScale` (scale.ts) + `checkpoint complete` already COMPUTE+STORE `verify_mode` on the envelope (schema field exists), but NOTHING renders it → it never reaches the agent. Design (brainstorming): surface it as a `VERIFY-MODE: <mode> — <directive>` advisory line in `buildWorkflowStateBlock` + bin parity, mirroring SHIP-READY/RETRO-DUE, riding Phase 35's per-turn hook. PLAN.md ready-to-execute.

## Blocked
- (none)
