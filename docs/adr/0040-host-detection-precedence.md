# ADR 0040 — 宿主判定优先级:显式 > 宿主 env 嗅探 > pin > 目录探测;override 只换状态根

- **Status**: Accepted
- **Date**: 2026-09-22
- **Amends**: v9.0 Phase C(28)的 `detectPlatform()` 优先级(override-first → `HARNESSED_PLATFORM`
  → claude stateRoot pin → claude-first 目录探测 → claude);Phase 35 codex `sessionIdEnv: null`。
- **Relates to**: `.planning/specs/2026-09-22-codex-host-parity-v16.md`「宿主判定」节;
  `.planning/phases/63-platform-detection-refactor/`
- **Milestone**: v16.0 Codex Host Parity / Phase 63(patch)

## Context

v9.0 起 harnessed 有两个宿主 descriptor(claude / codex),但判定是**按机器**的:同一台机器上
`~/.claude` 存在就是 claude,除非设 `HARNESSED_PLATFORM` 或写一份机器级 `.platform` pin。
同时装了 Claude Code 和 codex 的机器(维护者本机即是)因此只能二选一 —— 在 codex 会话里跑
`harnessed` 也会解析到 claude,状态写进 `~/.claude/harnessed`,反之亦然。

另外三处缺陷叠在同一条判定链上:

1. **`HARNESSED_ROOT_OVERRIDE` 排第一并强制 claude。** 它本是测试隔离钩子,却同时短路了平台
   判定,测试里无法同时得到「隔离根 + codex descriptor」。
2. **hook bin 手抄了一份优先级。** `src/checkpoint/hookStateRoot.ts` 与 `injectStateMain.ts` 的
   `sessionIdEnvName` 为了让 bin 不打包 typebox 而复制了判定逻辑;复制品已经与 CLI 漂移过一次
   (外部审查 L7:codex pin 下 hook 读 `~/.claude/harnessed`,注入静默为空)。
   `src/platform/platform.ts` 本身只依赖 `node:` 内置模块,复制品从来没有必要。
3. **codex 的 `settingsPath` 指向 `config.toml`。** 所有「读 / 写 settings.json」的调用方在 codex 上
   会去打开 TOML(其中含凭据),靠 JSON.parse 失败兜底。

实测(codex-cli 0.154.0):codex 的 hook 进程**没有**任何 `CODEX_*` env,但 codex 会话里的
shell(模型经工具调用的 `harnessed` CLI)带 `CODEX_SESSION_ID`,其值与 hook stdin 的
`session_id` 相同。Claude Code 对 Bash 工具与 hook 都暴露 `CLAUDE_CODE_SESSION_ID`。

## Decision

```
detectPlatform() 优先级(自上而下,首个命中即返回):
  1. 命令行 --platform(经 HARNESSED_PLATFORM 传入进程)   ← 显式
  2. HARNESSED_PLATFORM env                                ← 显式
  3. 宿主 env 嗅探:仅一个存在(非空)时生效
       CLAUDE_CODE_SESSION_ID → claude
       CODEX_SESSION_ID       → codex
     两者同时存在(一个宿主里启动了另一个)→ 判歧义,落到 4
  4. .platform pin:先读 codex stateRoot/.platform,再读 claude stateRoot/.platform
  5. 目录探测(~/.claude 优先,其次 ~/.codex)
  6. claude
HARNESSED_ROOT_OVERRIDE:只替换解析结果的 stateRoot,不再短路平台解析
```

1. **宿主 env 嗅探排在 pin 之前。** 会话 env 是「此刻在哪个宿主里」的直接证据,pin 是机器级
   偏好;前者更具体。两个 env 同时出现不可判定(嵌套启动时外层 env 会被继承),交给 pin。
2. **pin 按宿主读写。** `setup --platform <id>` 把 pin 写到所选宿主自己的 stateRoot;读取时 codex
   stateRoot 优先。codex-only 机器不会为了存 pin 而长出 `~/.claude`。旧版本写在 claude
   stateRoot 的 `codex` pin 仍被读取(第二顺位),无需迁移。切换宿主时(先 codex 再 claude,或反之),
   另一宿主 stateRoot 下**已存在**且内容不同的 pin 一并改写为新值,避免旧 pin 因读取顺位靠前而压住
   新选择;另一侧没有 pin 时不新建文件、不建目录(codex-only 机器仍不出现 `~/.claude`),也不删除任何文件。
3. **override 只换根。** `{ ...resolved, stateRoot: override }`;pin 仍从宿主自己的 stateRoot 读,
   不从 override 目录读。
4. **codex descriptor**:`sessionIdEnv: 'CODEX_SESSION_ID'`、`settingsPath: null`。
   `getSettingsPath()` 返回 `string | null`,每个调用方显式处理 null(跳过并给出原因 / pass-skip,
   不抛错,不回退到其他文件)。`mcpConfigPath` 仍指向 `config.toml`,供 MCP / 插件登记探测
   (既有、有意的行为,不在本 ADR 范围)。
5. **单一真相源。** 删除 `hookStateRoot.ts` 与 `sessionIdEnvName` 复制品,hook 入口直接
   `import { detectPlatform }`;bin 由 `pnpm build:hooks` 重新生成,bundle 仍不含 typebox。

## Consequences

正向:

1. **双宿主机器按会话判定。** 同一台机器上,codex 会话里的 CLI 解析到 codex,Claude Code 会话里
   解析到 claude,状态各自落在自己的 stateRoot。
2. **claude 用户零变化。** 无宿主 env / 无 pin / claude pin / override 各组合下,claude descriptor
   逐字节不变(`tests/installers/platform-golden.test.ts` 在重写前的旧代码上先绿,锁住回归)。
   Claude Code 会话里 `CLAUDE_CODE_SESSION_ID` 命中第 3 级,结果仍是 claude。
3. **hook 与 CLI 不会再漂移。** 同一个函数,同一份 bundle 来源。
4. **settings 链不再触碰 `config.toml`。** codex 上的 hook 注册 / env-key 写入 / settings 探测
   全部显式跳过。

如实声明的行为变化(写入 CHANGELOG):

1. **override 不再强制 claude。** 在 codex 环境下设了 `HARNESSED_ROOT_OVERRIDE` 的脚本 / 测试
   现在得到 codex descriptor。测试侧由 vitest setupFile 清除 `CODEX_*` /
   `CLAUDE_CODE_SESSION_ID` / `HARNESSED_PLATFORM` 保证隔离,需要者显式设置。
2. **codex 会话内 `harnessed run` / `research` 被嵌套守卫拦截。** `sessionIdEnv` 非空后 issue #1
   的守卫在 codex 里生效(非 TTY 退出 1,`HARNESSED_ALLOW_NESTED=1` 可覆盖)。这是修复:
   嵌套 SDK spawn 在 codex 里同样会挂起。
3. **codex 下 workflow ledger 按会话分槽**(`activeKey` 使用 `CODEX_SESSION_ID`)。

代价与风险:

1. **codex hook 进程没有 `CODEX_SESSION_ID`。** hook 侧仍靠 pin / 目录探测判定;在双宿主机器上
   不设 pin 时,codex hook 会解析到 claude。codex hooks 的承载与会话 id 取用(stdin
   `session_id`)属于 Phase 64,不在本 ADR。

## Verification

- `tests/installers/platform-golden.test.ts`:claude descriptor 逐字节 golden(先在旧代码上绿)
- `tests/installers/platform-codex.test.ts`「ADR 0040 host precedence」:6 级 + 歧义 + override 只换根
- `tests/platform/settingsPath-null.test.ts`:codex 上 settings 链各调用方不打开 `config.toml`
- `tests/checkpoint/hookStateRoot.test.ts`:生成的 bin 端到端按 pin / `CODEX_SESSION_ID` 选根,
  bundle 不含 typebox、不含复制品
- `tests/cli/nestedHarness-codex.test.ts` + `tests/cli/research.test.ts`:codex 会话内嵌套守卫生效
- 全量 vitest 在设置 `CODEX_SESSION_ID` 的 shell 中再跑一次仍绿
