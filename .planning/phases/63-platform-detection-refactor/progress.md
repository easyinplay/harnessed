# Phase 63 progress

- 2026-09-22 立项:task_plan / findings 落盘;实施交给 subagent(TDD,顺序 T6→T5→T1→T2→T3→T4→T7→T8)。
- 2026-09-22 T6 完成:`tests/installers/platform-golden.test.ts` 在旧代码上 10/10 绿(claude descriptor 字面量 golden:无 env / 双目录 / pin=claude / HARNESSED_PLATFORM=claude / override×3 / resolvers / getHarnessedRoot)。
- 2026-09-22 T5 完成:`tests/setup-i18n.ts` 清 `CODEX_*` / `CLAUDE_CODE_SESSION_ID` / `HARNESSED_PLATFORM`;golden 文件内加泄漏断言。
- 2026-09-22 T1 完成:`detectPlatform` 按 ADR 0040 重写(resolveHost + override 只换根),:145 注释更新;先红 6 格后绿。旧测试「override 强制 claude」按 SPEC 改为「override 只换根」。
- 2026-09-22 T2 完成:codex `settingsPath: null` / `sessionIdEnv: 'CODEX_SESSION_ID'`;`setup --platform` pin 写所选宿主 stateRoot(codex 不建 ~/.claude);先红 3 格后绿。
- 2026-09-22 T3 完成:getSettingsPath → `string | null`,tsc 找出 23 处错误(12 文件 + `src/cli/uninstall.ts`,F2 未列),全部显式处理;`tests/platform/settingsPath-null.test.ts` fs 打桩断言 codex 下不打开 config.toml;ccHookAdd install/uninstall 补 codex 格。
- 2026-09-22 T4 完成:删 `src/checkpoint/hookStateRoot.ts` 与 `sessionIdEnvName`,hook 入口 import detectPlatform;`pnpm build:hooks` 重生成 bin;bin 端到端 + 无 typebox + 无复制品测试先红 3 格后绿。
- 2026-09-22 T7 完成:`tests/cli/nestedHarness-codex.test.ts` + research.test.ts codex 格(临时回退 sessionIdEnv=null 验证 3 格红)。
- 2026-09-22 T8 完成:ADR 0040 + docs/adr/README 索引 + CHANGELOG `[Unreleased]`。
- 2026-09-22 验证:tsc 0;biome 无新告警;`scripts/check-*.mjs` 8 个全 0;build:hooks 重跑字节一致、bin 无 typebox。全量 vitest(--maxWorkers=4)本机 2876/14 失败、CODEX_SESSION_ID=probe-sess 下 2880/10 失败 —— 失败全部是 5s 超时 / 1 个 Windows EPERM rename(机器负载:单次全量 800s+,基线旧代码同样 5 个超时,setup-agent-teams A3 在旧代码上单独跑也超时);所有失败文件 + 本 phase 相关文件在 CODEX_SESSION_ID 下单独重跑 26 文件 248/248 绿。另修 `tests/integration/dual-platform.test.ts` 两处旧 descriptor 断言(settingsPath 改 null,SPEC 授权)。全量绿与 CI 三 OS 待 CI 确认。
- 2026-09-22 灰区 1 裁定 (a) 落地:setup --platform X 写本侧 pin 后,另一宿主 stateRoot 下已存在且不同的 pin 改写为 X(不新建/不删除/不 mkdir);setup-platform.test.ts 新增 4 格(切换 2 格先红后绿,无 pin 不新建 / 已一致不重写);ADR 0040 代价第 2 条删除、Decision 第 2 条补切换语义;CHANGELOG 同步。
