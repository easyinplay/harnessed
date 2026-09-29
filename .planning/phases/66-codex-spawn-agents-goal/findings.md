# Phase 66 findings —— 开工前的 codex 侧契约核实(2026-09-29)

## F1 `~/.codex/agents/*.toml` 有真实消费方,且**不需要写 config.toml**

上游 `codex-rs/agent-roles/src/loader.rs`:

- `load_agent_roles()` 走两条独立来源:config 的 `[agents]` 段(`agents_toml_from_layer`,`:175`)
  **以及** 目录发现 `discover_agent_roles_in_dir(&config_folder.join("agents"))`(`:76-78`)。
- 目录发现这条路**不碰 config.toml** → 与 v16.0 的硬边界(不写 `~/.codex/config.toml`)相容。
- 调用时 `role_name_hint: None`(`:303`),role name 取自**文件内容**而非文件名 —— 与本机已装的
  GSD agents 一致:每个 toml 里有 `name = "gsd-…"`。
- `description` **必填**:`validate_required_agent_role_description` 的错误文案是
  「agent role `<name>` must define a description」。
- 同名 role 重复 → 跳过 + 告警(`:311-322`),所以 harnessed 写入必须用不易撞名的前缀。

本机现状:`~/.codex/agents/` 已有 **33 个** GSD 装的 toml。字段形状极简:
`description` / `developer_instructions`(block 字符串)/ `name`。

**结论**:SPEC 的「role-prompts → `~/.codex/agents/*.toml`」有真实消费方(供会话内
`spawn_agent(agent_type: …)` 引用),不是造无用产物。

## F2 `codex exec` **不能**指定 agent role

`codex exec --help` 无 `--agent` / `--role`;只有 `-p, --profile <CONFIG_PROFILE_V2>`(config profile,
不是 agent role)。可用的相关参数:`--ephemeral`(不落 session 文件)、`--json`(JSONL 事件)、
`-o, --output-last-message <FILE>`、`-m, --model`、`-s, --sandbox <read-only|workspace-write|danger-full-access>`。

**因此两条 spawn 路径的能力不同**,Phase 66 的设计必须分开对待:

| 路径 | 能否用 agents toml | 说明 |
|---|---|---|
| 会话内 `spawn_agent(agent_type: …)` | **能** | 模型侧工具,agent role 由 codex 解析 |
| 进程级 `codex exec` | **不能** | 只能把角色指令拼进 prompt 文本 |

所以 agents toml 的价值落在**会话内**那条路径;`codex exec` 那条要么自带完整 prompt,
要么就没必要读 agents 目录。SPEC 把两者并列写在一个 phase 里,但它们不是同一个机制。

## F2b `sdkSpawn` 在 claude 侧是 **in-process SDK query,不是子进程**

`src/workflow/lib/sdkSpawn.ts:69` 调 `@anthropic-ai/claude-agent-sdk` 的 `query()`(`:21`,`:100`),
返回 JSON envelope 字符串(`:143-148`)。而 codex 侧只能是**子进程** `codex exec`。

**所以 SPEC 的「`sdkSpawn` 宿主层」这个说法不准确** —— 不是给一个函数加分支,是两种根本不同的机制
并列。共享的只有前后两端:输入侧 `AgentDefinition`(`src/workflow/run.ts:212` `buildAgentDef`),
输出侧 envelope 形状。中间的执行完全不同。

另一个前提:`harnessed run` / `harnessed research` 在宿主会话内是**被 gate 掉的**
(`src/cli/run.ts:211` / `research.ts:83`,`isNestedHarnessContext()` → exit 1,逃生口
`HARNESSED_ALLOW_NESTED=1`)。claude 上的交互路径根本不走 sdkSpawn,而是生成的命令体指挥
**主会话自己** spawn(`generateCommands.ts:230`)。
→ **codex exec spawn 补的是 CI / headless 面**,不是交互面;交互面在 Phase 65 已经由正文原语化覆盖。

## F2c spawn 错误分类今天是断的

`src/workflow/run.ts:365-388` 的 catch 把所有非-MaxIterations 异常**压成一条字符串**:
`output: \`sdkSpawn failed for ${skillName}: ${err.message}\``。`SpawnFailError`(`sdkSpawn.ts:38`)与
`SpawnTimeoutError`(`:49`)的类型信息在这里丢失,leaf 账本侧也没有 error-kind 字段。

`runCheckpointFail`(`src/cli/checkpoint.ts:559`)不输出 JSON,是「写账本 + stderr + exit 1」;
CLI 只有 `--summary` / `--failing-tests` / `--force`(`:38`),**没有分类入口**。要让五类具名错误进账本,
这是唯一注入点。

**现成先例**:`src/installers/lib/codexHookTrust.ts:47-56` 的 `TrustFailure` 判别联合
(`method-missing` / `timeout` / `bad-output` / `spawn-failed` / `rpc-error`)+ `RpcOutcome<T>` ——
Phase 66 的 spawn 错误分类照抄这个形状即可,不要另发明。

## F2d goal 在本仓是**被删掉的东西**(裁决:本 phase 不做)

ADR-0036 曾引入三级完成保证链(ralph-loop plugin → 宿主原生 `/goal` → self-loop),
**ADR-0039 在 4.43.0 整档 supersede 并删除**,删除理由之一正是「tier 2(原生 `/goal`)从未被实证」
(`docs/adr/0039-*.md:27`)。仓库里现存的只有注释与文档残留
(`generateCommands.ts:227` 「`/goal` fallback are both gone」等)。

**维护者 2026-09-29 裁定:Phase 66 不做 goal**。在 codex 侧同样未实证(`thread/goal/set` 对运行中
TUI 是否可见,只有维护者能测)的情况下重新引入,等于重犯 ADR-0039 指出的那个错。
改为进 TODOS 并附可直接执行的实测步骤;实测通过再单独立项(那时需要一份新 ADR 说明为何推翻 0039
的相关部分)。

## F2e doctor 现状:24 个 check,无 host 参数,CHECKS 无元数据

`src/cli/lib/doctor-registry.ts:27` 导出 `CHECKS: readonly CheckFn[]`,`CheckFn = () => Promise<CheckResult>`
—— **没有 name / 适用宿主等元数据**;平台差异靠各 check 自己 `detectPlatform()` 后早退,
而且 skip 被伪装成 `pass`(`check-codex-hooks.ts:116-117`)。`doctor.ts:16` 只有 `--json`。

矩阵视图要给每条 check 加描述符(`{ name, hosts, fn }`),这会破坏
`tests/cli/doctor.test.ts:223,231,267` 三处计数断言(`toBe(24)` / `toHaveLength(24)`)——属预期,同步改。

## F3 待实测(T0,尚未做)

- harnessed 经 `codex exec` 注入的 env 是否进入**子会话的 hook 快照**(Phase 64 实测过:hook 进程
  本身无 `CODEX_*`,而 shell 子进程有;子会话的 hook 看到什么未知)。不进则改为按 stdin `session_id`
  登记子会话识别。
- SPEC 称「Windows 上 `read-only` 沙箱工具调用实测失败」—— 该结论写于 2026-09-22,需对当前
  codex-cli 0.155.1 复测再采信。
- `thread/goal/set` 对**运行中 TUI** 是否即时可见 —— 这条只有维护者能测(需要开着 TUI)。

## F4 安全边界(沿用 v16.0,不重新讨论)

- 不读 / 不写 `~/.codex/config.toml`(含 `experimental_bearer_token`)。
- claude 宿主**永不自动**拉起 `codex exec`(外发边界)。开发期手动实测不等于产品行为。
- live 实验一律走 `harnessed-probe-*` 命名空间并清理。
