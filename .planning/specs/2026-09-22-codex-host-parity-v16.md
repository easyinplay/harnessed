---
spec: v16.0 Codex Host Parity
status: ready-to-plan
created: 2026-09-22
supersedes_sections_of:
  - "~/.gstack/projects/easyinplay-harnessed/easyi-main-design-20260921-215730.md (Recommended Approach / Phase 1 部分被本 SPEC 取代;实测节与决策记录保留为证据)"
  - "~/.gstack/projects/easyinplay-harnessed/ceo-plans/2026-09-22-codex-host-parity.md (Accepted Scope Phase 1 细节被本 SPEC 取代)"
governance: "office-hours 2026-09-21 APPROVED → CEO review 2026-09-22 SCOPE_EXPANSION(outside voice 回收)→ codex 实测 → ENG review 2026-09-22(outside voice 11 条全裁)"
verified_refs:
  - "src/platform/platform.ts:24-26 仅 node:fs/os/path 依赖(exists, dep-free)"
  - "src/platform/platform.ts:164-166 HARNESSED_ROOT_OVERRIDE 强制 claude descriptor(exists)"
  - "src/platform/platform.ts:130 codex sessionIdEnv: null(exists)"
  - "src/checkpoint/hookStateRoot.ts precedence 复制品(exists)"
  - "src/checkpoint/injectStateMain.ts:67 sessionIdEnvName 复制品(exists)"
  - "scripts/build-hooks.mjs esbuild 生成 bin/harnessed-{stop-hook,inject-state}.mjs(exists; bin 是产物非手抄)"
  - "src/cli/lib/nestedHarness.ts:12-18 isNestedHarnessContext(exists)"
  - "src/installers/index.ts:61 CLAUDE_ONLY_METHODS(exists)"
  - "src/installers/ccHookAdd.ts:150 [...others, desired] 重排(exists)"
  - "src/installers/lib/hookEntry.ts:143 compiled 模式 \"<exe>\" <id>(exists)"
  - "getSettingsPath 调用方 12 文件(见 1a T3 清单,rg 核实)"
  - "src/cli/setup.ts:354,572 nonInteractive 分支(exists)"
  - "vitest.config setupFiles = tests/setup-i18n.ts(exists);tests 下 33 文件用 HARNESSED_ROOT_OVERRIDE"
  - "src/installers/ccPluginMarketplace.ts(exists, codex plugin add / marketplace add 路径)"
  - "docs/adr 末号 0039 → 新 ADR 0040 / 0041(NEW)"
  - "codex 契约(实测 0.154.0):见设计文档「Phase 1 第 0 步实测结果」+「ENG Review 收编」"
---

# v16.0 Codex Host Parity — 实施 SPEC(唯一真相源)

## 目标

harnessed 的运行时编排在 codex 上可用:状态断点注入、正文不再指挥调用不存在的 CC 工具、程序化 spawn、
对等可观测。CC 主力用户运行时行为不变。

## 已定边界(不再讨论)

- 不写 `~/.codex/config.toml`(TOML 仅经 codex CLI / app-server 写);任何代码与测试不读出其内容(含凭据)。
- 不写 `~/.codex/hooks.json`(位置信任键会毒化他人 hook)—— codex hooks 一律经本地 codex 插件承载。
- 不写 `~/.harnessed`。
- claude 宿主永不自动拉起 `codex exec`(外发边界,延续 2026-08-26)。
- 不在范围:跨宿主接力、AGENTS.md 同源生成、gemini 宿主(均在 TODOS.md,带触发条件)。

## 宿主判定(ADR 0040,NEW)

```
detectPlatform() 优先级(自上而下,首个命中即返回):
  1. 命令行 --platform(经 HARNESSED_PLATFORM 传入进程)   ← 显式
  2. HARNESSED_PLATFORM env                                ← 显式
  3. 宿主 env 嗅探:仅一个存在时生效
       CLAUDE_CODE_SESSION_ID → claude
       CODEX_SESSION_ID       → codex
     两者同时存在(嵌套启动)→ 判歧义,落到 4
  4. .platform pin:先读 codex stateRoot/.platform,再读 claude stateRoot/.platform
  5. 目录探测(~/.claude 优先,其次 ~/.codex)
  6. claude
HARNESSED_ROOT_OVERRIDE:只替换 stateRoot,不再短路平台解析(行为变更,ADR 记录)
```

## Phase 63 —— 1a 平台判定重构(patch 版本)

范围:纯结构 + 判定修正。**CC 运行时行为不变**;测试隔离与 codex 会话内 `harnessed run/research` 被拦截
是如实声明的行为变化(写入 CHANGELOG)。

| T | 内容 | 文件 | 验收 |
|---|---|---|---|
| T1 | 按上图重写 `detectPlatform` + 更新 :145-160 precedence 注释 | `src/platform/platform.ts` | 单测覆盖 6 级 + 歧义 + override 只换根 |
| T2 | codex descriptor:`settingsPath: null`、`sessionIdEnv: 'CODEX_SESSION_ID'`;pin 按宿主读写,codex-only 不创建 `~/.claude` | `src/platform/platform.ts`, `src/cli/setup.ts` | 单测 |
| T3 | `settingsPath` 可空后 12 个调用方显式处理(编译器兜底):`checkAgentTeams`、`check-guard-conflict`、`check-inject-invalidate`、`check-stale-hooks`、`guard-exemption`、`search-mcp-keys`、`settingsWriter`、`ccHookAdd`(install/uninstall)、`idempotent`、`readClaudeConfig` | `src/cli/lib/*`, `src/installers/**` | `tsc --noEmit` 0;codex 下这些路径 fs 打桩断言**从不打开 config.toml** |
| T4 | 删除 precedence / sessionIdEnvName 复制品,改 `import { detectPlatform }` | `src/checkpoint/hookStateRoot.ts`, `src/checkpoint/injectStateMain.ts`, `bin/*.mjs`(`pnpm build:hooks` 重生成) | bundle 断言不含 typebox;`git diff --exit-code bin/` 门绿 |
| T5 | vitest 全局清宿主 env(`CODEX_*`、`CLAUDE_CODE_SESSION_ID`、`HARNESSED_PLATFORM`),需要者显式设置 | `tests/setup-i18n.ts`(或新增 setupFile) | 在 codex shell 内跑全量 vitest 绿 |
| T6 | **CRITICAL 回归**:claude 判定与所有 descriptor 路径逐字节 golden(无 env / 有 pin / 有 override) | `tests/installers/platform*.test.ts` | golden 绿 |
| T7 | nestedHarness 在 codex 会话生效的行为测试 + CHANGELOG 声明 | `tests/cli/*` | 单测 |
| T8 | ADR 0040 | `docs/adr/0040-*.md` | — |

## Phase 64 —— 1b codex hooks 经本地插件(minor 版本)

```
harnessed setup --platform codex --with perturn-inject
   │
   ├─ 生成 ~/.codex/harnessed/marketplace/            (ADR 0041,NEW)
   │     .agents/plugins/marketplace.json   name: harnessed-local
   │     plugins/harnessed-<hook>/.codex-plugin/plugin.json
   │     plugins/harnessed-<hook>/hooks/hooks.json     ← 固定字面量命令
   │     plugins/harnessed-<hook>/hook.cjs             ← shim(npm 模式)
   ├─ codex plugin marketplace add <dir>(已存在则跳过)
   ├─ codex plugin add harnessed-<hook>@harnessed-local
   ├─ 安装信息写 PLUGIN_DATA(binary/npm 路径)  ← 升级只改这里,不动 hash
   └─ 信任:交互 → 征得同意 → app-server hooks/list + config/batchWrite(仅 harnessed-* 命名空间)
            非交互 → 默认不信任,除非 --trust-codex-hooks
            RPC 失败/方法缺失/超时 → 明示「hooks 待信任」+ 指引 codex 内 hook 审核;不报成功
```

- **命令字面量**(hash 稳定,升级 / 重装 / 换 Node 不失效):npm 模式 `node "${PLUGIN_ROOT}/hook.cjs" <id>`;
  binary 模式 `harnessed <id>`(PATH;doctor 验证)。`command` 与 `commandWindows` 双写;首 token 永不加引号。
  codex 路径**不调用** `resolveHookCommand`(CC 输出逐字节不变)。
- **每个 hook manifest 一个插件** `harnessed-<hook>@harnessed-local`;manifest 装 / 卸一一对应。
- **port 判定**:perturn-inject(UserPromptSubmit)、perturn-inject-invalidate(SessionStart)、dashboard-autospawn
  (SessionStart)、doc-discipline-gate(PreToolUse `Bash`,codex 工具名即 `Bash`)= port;stop-hook-recover = skip
  (依赖 CC transcript 形态)。
- **hook 侧宿主识别**:命令行参数 `--platform codex`(hook 进程无 `CODEX_*` env,实测);session key 取 stdin
  `session_id`(== shell `CODEX_SESSION_ID`,实测),与 CLI 同源。

| T | 内容 | 验收 |
|---|---|---|
| T1 | 插件 / marketplace 生成器 + shim;`cc-hook-add` 在 codex 分派到生成器(不再 harness-mismatch) | 生成物快照测试;三 shell(cmd/pwsh/sh)契约测试真跑生成的命令(Windows CI 跑 pwsh) |
| T2 | 信任客户端(app-server JSON-RPC:initialize → hooks/list → config/batchWrite upsert `hooks.state`) | 成功 / 方法缺失 / 超时 / 非 JSON 四态单测(mock 进程);只触碰 `harnessed-*` 前缀 key |
| T3 | setup 同意交互 + `--trust-codex-hooks` + 非交互默认不信任 | 单测 |
| T4 | uninstall:plugin remove → 删空 cache 目录 → batchWrite 删信任条目(先实测删除语义;不支持则文档化残留)→ 删 marketplace 目录 | 往返测试 |
| T5 | doctor:插件已装、信任状态(trusted/untrusted/modified/未知)、shim 链路、binary 在 PATH;数据源限 hooks/list、插件目录、`codex features list`,不读 config.toml | 单测 + fs 打桩 |
| T6 | 真实 payload fixture(脱敏,`tests/fixtures/codex-hooks/0.154/`)驱动 hook 输入解析一致性测试;fixture 漂移提示仅在 codex minor 版本变化时 | 单测 |
| T7 | `pnpm test:codex-live`(`scripts/codex-live/`):hooks/list 与信任在隔离 CODEX_HOME;注入可见性在真实 home 用命名空间探针插件并清理;记录每 hook durationMs,预算 p95 < 1s;`commandWindows` 比较直接 `node` 与 `cmd /c` | 发版前手动跑,结果入 VERIFICATION |
| T8 | ADR 0041(codex hooks 经本地插件 + 信任模型) | — |

## Phase 65 —— 2 正文宿主原语化(minor 版本)

- 占位语法 `{{spawn_subagent}}` / `{{send_message}}` / `{{agent_team}}` / `{{background_agent}}`,带变体参数
  (如 `{{spawn_subagent:cc-native}}`)使 claude 渲染可逐字还原原措辞;en 与 zh-Hans 同写法(ASCII)。
- 计数基线:`workflows/` 57 文件 236 处,正则
  `\bTask tool\b|Task / Agent|\bSendMessage\b|TeamCreate|TeamDelete|\bAgent\(|run_in_background|Agent Teams|subagent_type`。
- **金标分层**:改写前快照;commands 的 claude 渲染逐字节一致;skills(共享目录 `~/.agents/skills`)用结构化 diff 门,
  差异只允许在占位替换处与生成器插入的映射小节(固定起止标记)。
- `scripts/check-host-primitives.mjs`:精确 token + allowlist 计数;映射小节区间唯一豁免。
- codex 命令交付形态:`~/.codex/prompts` 本机不存在,默认以 skill 形态交付(Phase 65 开工再确认)。
- 验收:i18n 对等门绿;codex 渲染产物区间外零 CC 原语 token;eval golden 覆盖 codex 渲染。

## Phase 66 —— 3 agents + spawn + goal + doctor 矩阵(minor 版本)

- **T0 前置实测**:harnessed spawn 注入的 env 是否进入子会话 hook 快照;不进则改为按 stdin `session_id`
  登记子会话识别。子会话标记机制独立于 `nestedHarness`。
- role-prompts → `~/.codex/agents/*.toml`(参照已装 GSD agents 格式)。
- `sdkSpawn` 宿主层:codex = `codex exec --ephemeral --json -o <file>`,仅当本进程宿主为 codex(测试钉死);
  五类具名错误(SpawnTimeout / SpawnExitNonZero / SpawnOutputMalformed / SpawnAuthFailed / SpawnRefused)入 leaf
  账本,超时重试 1 次;sandbox 策略显式定(Windows 上 `read-only` 工具调用实测失败)。exec 不可行 → 退化为
  prompt 让模型用原生 `multi_agent`,记显式降级。
- goal 桥接:app-server `thread/goal/set`(threadId = `CODEX_THREAD_ID`,跨进程持久已实测);运行中 TUI 能否
  即时感知 → **需维护者在 TUI 实测**;不能感知则记显式降级。
- doctor `--host all` 矩阵(从一致性测试结果派生);README / 站点表述更新;HostAdapter 契约收口。

## 发版节奏

63 → patch;64 / 65 / 66 → 各一个 minor。每 phase:三 OS CI 绿 + `pnpm test:codex-live`(64 起)+ 维护者确认后打 tag。

## 并行化

顺序执行,无并行机会:63 是后续全部的前置;65 与 64 共享 setup 渲染路径;66 依赖 64 的插件与 65 的原语。
