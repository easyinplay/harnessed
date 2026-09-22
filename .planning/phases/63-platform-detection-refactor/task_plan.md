# Phase 63 — 平台判定重构(v16.0 / 1a,patch)

SPEC:`.planning/specs/2026-09-22-codex-host-parity-v16.md` §「宿主判定」+ §「Phase 63」(唯一真相源)。
Status: complete (2026-09-22, commit 8f0ab14, CI run 35727355819 all green)

## 验收(全部满足才算完成)

- [x] `pnpm exec tsc --noEmit` 0 错误
- [x] 全量 vitest 绿(本机 + 在 codex shell env 下再跑一次:设 `CODEX_SESSION_ID=x` 后全量仍绿)
- [x] `pnpm build:hooks` 后 `git diff --exit-code bin/` 只含预期变化;bundle 不含 typebox
- [x] biome check 绿;`scripts/check-*.mjs` 硬门绿
- [x] CHANGELOG `[Unreleased]` 记录两处如实行为变化(override 只换根 / codex 会话内 run·research 被嵌套守卫拦截)
- [x] ADR 0040 落盘
- [x] CI 三 OS 绿

## 任务(顺序执行,TDD:先红后绿)

| T | 内容 | 文件 | 依赖 |
|---|---|---|---|
| T6 | **先写** claude 逐字节 golden(无 env / pin=claude / override / ~/.claude 存在与否)—— 在旧代码上必须绿,锁住回归 | `tests/installers/platform*.test.ts` | — |
| T5 | vitest setupFile 清 `CODEX_*` / `CLAUDE_CODE_SESSION_ID` / `HARNESSED_PLATFORM` | `tests/setup-i18n.ts` | — |
| T1 | `detectPlatform` 新优先级(显式 > env 嗅探[单一] > pin[codex 优先读] > 目录 > claude;双宿主 env = 歧义落 pin;override 只换 stateRoot)+ 更新 :145-160 注释。先写红测 | `src/platform/platform.ts` | T6 |
| T2 | codex descriptor `settingsPath: null`、`sessionIdEnv: 'CODEX_SESSION_ID'`;pin 按宿主读写(setup 写 codex pin 到 codex stateRoot;codex-only 不建 `~/.claude`) | `src/platform/platform.ts`, `src/cli/setup.ts` | T1 |
| T3 | `getSettingsPath()` → `string \| null`;12 处调用方显式处理 null(codex 上:hook/settings/env-key 类操作 skip 并给出可读原因,不抛) | 见 findings F2 清单 | T2 |
| T4 | 删 `hookStateRoot.ts` / `injectStateMain.ts` 的 precedence 与 sessionIdEnvName 复制品 → import `platform.ts`;重生成 bin | `src/checkpoint/*`, `bin/*.mjs` | T1 |
| T7 | nestedHarness 在 codex env 下生效的测试 | `tests/cli/*` | T2 |
| T8 | ADR 0040 + CHANGELOG | `docs/adr/0040-*.md`, `CHANGELOG.md` | 全部 |
