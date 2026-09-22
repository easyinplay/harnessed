# Phase 63 SUMMARY — 平台判定重构(v16.0 / 1a)

**完成**:2026-09-22 · commit `8f0ab14` · CI run 35727355819 三 OS + binary/installer smoke 全绿。

## 交付
- `detectPlatform` 按 ADR 0040:`HARNESSED_PLATFORM` > 单一宿主 env 嗅探(并存 = 歧义)> pin(codex 先读)> 目录 > claude;
  `HARNESSED_ROOT_OVERRIDE` 只换 stateRoot。
- codex descriptor:`settingsPath: null`、`sessionIdEnv: 'CODEX_SESSION_ID'`;`getSettingsPath()` 可空,13 个调用方显式 skip
  (F2 漏列 `src/cli/uninstall.ts`,tsc 捕获)。
- 删 `src/checkpoint/hookStateRoot.ts` 与 `sessionIdEnvName` 复制品,hook 入口 import `platform.ts`(bin 无 typebox)。
- `setup --platform` 按宿主写 pin,切换时同步改写另一侧已存在的不同 pin(维护者裁定灰区 → 选项 a)。
- vitest setupFile 清宿主 env;ADR 0040;CHANGELOG `[Unreleased]` 如实记录行为变化。

## 证据
- 新测试:`tests/installers/platform-golden.test.ts`(旧代码上先绿 10/10)、`tests/platform/settingsPath-null.test.ts`、
  `tests/cli/nestedHarness-codex.test.ts`、`setup-platform` 切换 4 格;相关 45 文件 508/508 本机绿。
- 全量本机因负载超时(基线旧代码同样 5 个超时),以 CI 为准。

## Lessons
- 实施 subagent 的内联 `node -e` / 重定向继续在仓库根产生 0 字节碎片(本 phase 清 17 个);brief 应显式要求脚本落 scratchpad。
