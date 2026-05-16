# Phase 3.1 Deferred Items

## #1 — tests/unit/cli-audit.test.ts 2 fixture failures (PRE-EXISTING, NOT W3 caused)

- **Discovered during**: Phase 3.1 W3 T3.3 (sdk-wire.test.ts run) — 2 cli-audit failures reported in full-suite run
- **Investigation**: `git stash` + isolated `vitest run tests/unit/cli-audit.test.ts` against current main HEAD (5c1f024 = T3.2 done) reproduced both failures → **CONFIRMED PRE-EXISTING**, not caused by T3.1 ralphLoop signature change or T3.2 engineHook + engine wedge
- **File last modified**: commit `221b653` Phase 1.2 T5.4 (2026-05-12)
- **Failure signature**: `expect(code).toBe(0)` got 1 at tests/unit/cli-audit.test.ts:96 (2 failures pair)
- **Scope decision**: Out-of-scope per executor SCOPE BOUNDARY rule — only auto-fix issues DIRECTLY caused by current task changes
- **Disposition**: defer to Phase 3.2+ (post-W3 ship) or a dedicated `fix(cli-audit-test)` patch session
- **Test count impact**: 572/574 pass (2 fail isolated); excluding these = 0 W3-caused regressions
- **W3 T3.3 verification**: sdk-wire.test.ts 7/7 pass in isolation ✓
