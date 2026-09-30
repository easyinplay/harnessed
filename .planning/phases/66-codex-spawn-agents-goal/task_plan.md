# Phase 66 — codex agents / exec spawn / doctor 矩阵(v16.0 / 3,minor)

SPEC:`.planning/specs/2026-09-22-codex-host-parity-v16.md` §「Phase 66」(唯一真相源)
+ 本文件「开工细化」(对 SPEC 的落地修正,依据 `findings.md` 的 F1-F4 核实)。
Status: T0-T5 complete (2026-09-30) — 详 SUMMARY.md;剩 T6 的 README 部分(推迟)与 T7 收口

## 开工细化(对 SPEC 的修正,逐条给理由)

- **R1 goal 移出本 phase**(维护者 2026-09-29 裁定,F2d)。仓库里 goal 是 ADR-0039 删掉的东西,
  删除理由正是「从未实证」;codex 侧的 TUI 可见性同样未实证。进 TODOS + 可执行实测步骤,
  实测通过再单独立项(需新 ADR 推翻 0039 相关部分)。
- **R2 「`sdkSpawn` 宿主层」改为两条并列路径**(F2b)。claude 是 in-process SDK `query()`,
  codex 是子进程 `codex exec` —— 不是给一个函数加分支。共享面只有两端:输入 `AgentDefinition`、
  输出 envelope 形状。新增 `codexExecSpawn`,由一个薄分派按宿主选路。
- **R3 本 phase 的 spawn 补的是 CI / headless 面**(F2b)。`harnessed run` 在宿主会话内被
  `isNestedHarnessContext()` 挡掉;交互面已由 Phase 65 的正文原语化覆盖(指挥模型用 `spawn_agent`)。
  **不要**把 codex exec 接到交互路径上。
- **R4 agents toml 只服务会话内 `spawn_agent(agent_type: …)`**(F1 + F2)。`codex exec` **不能**
  指定 agent role,那条路径自带完整 prompt。两者不要互相假设。
- **R5 五类具名错误照抄 `TrustFailure` 形状**(F2c),不另发明。注入点是 `runCheckpointFail`
  (今天没有分类入口)。
- **R6 doctor 矩阵要先给 CHECKS 加描述符**(F2e);`skipped` 要成为一等状态,不再伪装成 `pass`。

## T0 —— 前置实测(先做,结论写进 findings 再动代码)

| # | 实测项 | 方法 | 不通过时的退路 |
|---|---|---|---|
| T0.1 ✅ | 通过。形状 + 三个坑见 F5。**隔离 `CODEX_HOME` 跑不通**(无 auth.json),只能真实 home + `--ephemeral` | | |
| T0.2 ✅ | **env 传播成立** → 首选识别办法 = hook 侧读自己注入的 env。退路亦可行(stdin `session_id` == JSONL 首事件 `thread_id`)。hook 进程仍无 `CODEX_*` → `--platform codex` 不能省。见 F7 | | |
| T0.3 ✅ | 确实挡,**但 exitCode 仍是 0** → 成功判据不能看 exit code。默认 sandbox 需为 `workspace-write`(leaf 要写文件)。见 F6 | | |
| T0.4 ✅ | **能引用且 role 指令生效**;exec 模式下模型有 `spawn_agent`。**签名是 `agent_type` + `message`,无 `task_name`**(SPEC 与 Phase 65 文本已按此更正,commit `31ea64d`)。不存在的 role → `unknown agent_type`,只有 `item.started` 无 `item.completed`,turn 仍 exit 0。见 F8 | | |

**安全**:一律隔离 `CODEX_HOME` 或用 `harnessed-probe-*` 命名空间并清理;不读不写
`~/.codex/config.toml`;claude 宿主的产品代码永不自动拉起 `codex exec`(开发期手动实测不等于产品行为)。

## 任务(T0 结论出来后再定稿顺序)

| T | 内容 | 主要文件 | 验收 |
|---|---|---|---|
| T1 ✅ | role-prompts → `~/.codex/agents/harnessed-<sub>.toml` 生成器(`name` / `description` 必填 / `developer_instructions`);命名空间前缀防撞名(F1 重名会被 codex 跳过并告警) | `src/installers/lib/codexAgentRoles.ts`(NEW) | 生成物快照;`description` 非空;安装 / 卸载往返 |
| T2 ✅ | `codexExecSpawn`:子进程 `codex exec --ephemeral --json -o <file> --skip-git-repo-check`,`shell:false` + 绝对路径(F5);成功判据看 `-o` 内容 + 事件流**而非 exit code**(F6) | `src/workflow/lib/codexExecSpawn.ts`(NEW) | 单测(mock 进程);**测试钉死:仅当本进程宿主为 codex** |
| T3 ✅ | 五类具名错误(分派另见 T3b):`SpawnTimeout` / `SpawnExitNonZero` / `SpawnOutputMalformed` / `SpawnAuthFailed` / `SpawnRefused`;超时重试 1 次 | `src/workflow/lib/spawnFailure.ts`(NEW), `run.ts` | 五态单测;类型信息不再被压成字符串 |
| T4 ✅ | 错误分类入账本:schema 加可选字段 + `runCheckpointFail` 的注入点 | `src/checkpoint/schema/currentWorkflow.v1.ts`, `src/cli/checkpoint.ts` | 往返测试;**既有 eval golden 不许变**(11+2 份) |
| T5 ✅ | doctor 描述符化 + `--host <id>` / 矩阵视图;`skipped` 成为一等状态 | `doctor-registry.ts`, `doctor.ts`, `check-builtin.ts` | 计数断言同步;矩阵输出快照 |
| T6 🔶 | HostAdapter 契约(`docs/`)✅;**README 部分推迟** —— 10 个 README 正被另一会话改动,按共享工作树纪律不碰,已进 TODOS(把 Phase 63-66 的宿主差异集中成一份可读契约) | `README*.md`, `docs/` | 文档门绿 |
| T7 ✅ | CHANGELOG `[Unreleased]` / SUMMARY / STATE / TODOS(goal 四步实测步骤 + README 推迟项) | docs | — |

## 验收(phase 级)

- [x] T0 四项实测有结论并写进 findings(F5-F8;四项全部通过,无需走退路)
- [x] `tsc --noEmit` 0;全域 `corepack pnpm lint` 0;十道 `check-*.mjs` 全 0
- [x] 三份渲染金标 + eval golden 无回归(13 份零字节变化)
- [x] codex exec spawn 仅在宿主为 codex 时可达(钉在模块入口,claude 宿主既抛错也到不了 spawn)
- [x] 本机 vitest 3230 绿;CI 三 OS 绿(逐 commit 核实)
- [x] CHANGELOG / SUMMARY / STATE / TODOS

## 不做(明确排除)

- **goal 桥接**(R1)→ TODOS,附可执行实测步骤
- 把 codex exec 接到交互路径(R3)
- 读 / 写 `~/.codex/config.toml`
- claude 宿主自动拉起 `codex exec`
