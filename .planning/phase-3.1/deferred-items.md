# Phase 3.1 Deferred Items

## #1 — tests/unit/cli-audit.test.ts 2 fixture failures (PRE-EXISTING, NOT W3 caused) — ✅ RESOLVED 2026-05-17 (Phase 3.2 W0.1 commit b41a84a vi.mock audit-helpers.js Path A locally verified recipe)

- **Discovered during**: Phase 3.1 W3 T3.3 (sdk-wire.test.ts run) — 2 cli-audit failures reported in full-suite run
- **Investigation**: `git stash` + isolated `vitest run tests/unit/cli-audit.test.ts` against current main HEAD (5c1f024 = T3.2 done) reproduced both failures → **CONFIRMED PRE-EXISTING**, not caused by T3.1 ralphLoop signature change or T3.2 engineHook + engine wedge
- **File last modified**: commit `221b653` Phase 1.2 T5.4 (2026-05-12)
- **Failure signature**: `expect(code).toBe(0)` got 1 at tests/unit/cli-audit.test.ts:96 (2 failures pair)
- **Scope decision**: Out-of-scope per executor SCOPE BOUNDARY rule — only auto-fix issues DIRECTLY caused by current task changes
- **Disposition**: **Phase 3.2 W0 first task 必修** (priority bump 2026-05-16 post-Phase-3.1-ship CI verify) — Phase 3.1 ship 后 CI run 4e9c4ef + 791848e + fcec6bf 全 3-OS red on `corepack pnpm test` step.
- **Test count impact**: 572/574 pass (2 fail isolated); excluding these = 0 W3-caused regressions
- **W3 T3.3 verification**: sdk-wire.test.ts 7/7 pass in isolation ✓

### Post-ship root-cause analysis (2026-05-16, Phase 3.1 ship 后)

- **Local b6a0feb (Phase 2.4 last green CI) baseline verify**: 541 pass / **2 fail (same cli-audit cells)** / 4 skip. Both fixtures fail same way as Phase 3.1 HEAD.
- **But b6a0feb CI was green ✅** when shipped (sister Phase 2.4 H1+H2 hotfix accepted CI 25958873300).
- **Divergence verdict**: env-dependent test — CI runner env (Linux/macOS/Win) somehow makes cli-audit pass while local env fails. Phase 3.1 ship CI 同 env 但变 red (regression-class observable change, NOT real regression in production code).
- **Likely root cause**: Phase 2.4 W4 audit runtime-layer 加 (origin-check + install.cmd shell-eval injection + provenance gate hard-fail in `src/cli/audit.ts` 126→167L) 后, `tests/unit/cli-audit.test.ts` 未同步更新 mocks. 当 audit handler 执行时:
  - manifest-layer mock readdir/readFile/validate 走通
  - **runtime-layer** spawnSync `git config --get remote.origin.url` + readFileSync `package.json` 这些没 mock → 在 local env / CI runner 都触发某种 failure → exit 1
  - CI Win runner 可能因 spawnSync 行为不同 (path-sep, child_process env) 当时偶发 pass; Phase 3.1 W3 改 engine.ts 可能间接改变 import chain timing → CI 也复现
- **修方向 Phase 3.2 W0 first task**:
  - (a) 拆 `tests/unit/cli-audit.test.ts` 仅 manifest-layer (mock readdir/readFile/validate only) + 加 vi.mock spawnSync + vi.mock node:fs readFileSync 覆盖 runtime layer
  - (b) OR 删 `tests/unit/cli-audit.test.ts` 全 (Phase 2.4 W4 已加 `tests/cli/audit.test.ts` 5 cells covering runtime-layer fully), 改 manifest-layer 也进 cli/audit.test.ts
  - (c) Phase 3.2 W0 1-task fix-session: 选 (a) 路径 + commit + push (≤30L delta, ≤30 tool uses)
- **Status update**: 升级 Phase 3.2 W0 first task 必修, 沿袭 sister Phase 2.4 W0 5-item one-shot absorb pattern; 不留到 dedicated patch session.
