# Phase 66 SUMMARY — codex agents / exec spawn / doctor 矩阵(v16.0 / 3)

**状态**:T0-T5 完成(2026-09-30)· T1 随 npm **4.45.0** 发布 · T3b-T5 待发
3230 测试绿(`--no-file-parallelism`)· tsc 0 · 全域 lint 0 · 十道 `check-*.mjs` 全 0 · eval golden 零变化

## 交付

| T | 内容 | commit |
|---|---|---|
| T0 | 四项前置实测(见下) | findings F5-F8 |
| T1 | role-prompts → `<CODEX_HOME>/agents/harnessed-<sub>.toml`,供会话内 `spawn_agent(agent_type:)` 引用 | `54aad96`(已发 4.45.0) |
| T2/T3 | `codexExecSpawn` + 五类具名错误(`spawnFailure.ts`) | `54aad96` |
| T3b | spawn 按宿主分派(`spawnDispatch.ts`)—— 补上「已实现但无调用方」的缺口 | `80aeb94` |
| T4 | 失败分类进 leaf 账本 + `checkpoint fail --failure <kind>` | `80aeb94` |
| T5 | doctor 描述符化 + `--matrix` / `--host`,`skipped` 成一等状态 | `80aeb94` |
| T6 | HostAdapter 契约文档(`docs/`) | 见下「未完成」 |

## T0 实测结论(四项,均在 codex-cli 0.155.1 / Windows)

1. **`codex exec` 可用形状**:`--ephemeral --json -o <file> -s <sandbox> --skip-git-repo-check "<prompt>"`。
   三个必须照做的坑:Windows 上不能 `shell: true`(prompt 会被按空格重切);`--skip-git-repo-check` 必要;
   `stdio[0]='ignore'` 时 stderr 仍打印 stdin 提示但无害。
   **隔离 `CODEX_HOME` 跑不通**(本机无 `auth.json`,隔离即未认证)→ 只能真实 home + `--ephemeral`。
2. **env 传播成立**:harnessed 注入的 env 在子会话的 hook 进程里可见 → 首选识别办法是 hook 侧读自己注入的 env。
   退路也可行:hook stdin 的 `session_id` == JSONL 首个 `thread.started` 事件的 `thread_id`。
   Phase 64 那条「hook 进程无 `CODEX_*`」在 exec 路径同样成立 → `--platform codex` 不能省。
3. **`-s read-only` 确实挡工具调用,但 exitCode 仍是 0**(模型自己回 BLOCKED)。
   → **成功判据不能看 exit code**;默认 sandbox 取 `workspace-write`(leaf 要写文件)。
4. **agents toml 能被 `spawn_agent(agent_type:)` 引用且 role 指令生效**;exec 模式下模型有 `spawn_agent`。
   不存在的 role → `unknown agent_type`,只有 `item.started` 没有 `item.completed`,turn 仍 exit 0。

## 立项前提被推翻 / 更正的

1. **SPEC 的「`sdkSpawn` 宿主层」说法不准确**(F2b)。claude 侧是 in-process SDK `query()` 而非子进程,
   codex 侧只能是子进程 —— 不是给一个函数加分支,是两条并列路径。而且 `harnessed run` 在宿主会话内
   本就被 `isNestedHarnessContext()` 挡掉,所以这条路补的是 **CI / headless 面**,交互面 Phase 65 已覆盖。
2. **agents toml 与 `codex exec` 是两套机制**(F1 + F2)。`codex exec` **不能**指定 agent role
   (`--help` 只有 `-p, --profile`,那是 config profile)。agents toml 的价值落在会话内 `spawn_agent`。
   同时确认:codex 从 `<CODEX_HOME>/agents/` **目录发现** role,这条路不碰 `config.toml`,与硬边界相容。
3. **goal 是 ADR-0039 删掉的东西**(F2d)。删除理由正是「原生 `/goal` 从未被实证」;codex 侧的 TUI
   可见性同样未实证。维护者裁定移出本 phase,进 TODOS 并附可执行实测步骤。
4. **`spawn_agent` 的参数签名我写错了并已更正**(Phase 65 findings F14,commit `31ea64d`)。
   上游有两个构造函数:v1 的 required 是 `None` 且**没有** `task_name`;`task_name` 是 **v2** 才加的。
   本机 `multi_agent_v2 = false` → v1 生效。我读源码时把 v2 的签名当成了 v1,T0.4 的实测把它抓了出来。
   已在发版前修掉(只动 codex 列,claude 金标零差异)。

## 实施中的关键判断

- **分派单开模块而非在 `run.ts` 写三行**:`run.ts` 被多个 suite `vi.mock`,在那里新增 import 就要改每一个
  mock factory(项目记忆 `mock-export-gap`);且路由决策本身值得单独测。
- **codex 分支丢弃 `resumeSessionId` / `onSessionId`**:`--ephemeral` 不落 session,`thread_id` 不是 resume
  token;若转发,`ralphLoopWrap` 会把它回喂成 `resumeSessionId`,每次重试都声称在 resume 一个不存在的 session。
- **`run.ts` 只 annotate 不做状态转移**:走 `markSub(...,'failed')` 会给同一次 attempt 二次自增
  `fail_count`,而那是 BREAK-LOOP / BUDGET-EXHAUSTED 的唯一输入。
- **golden fence**:schema 新增可选字段,用测试钉死未设置时该键不出现在序列化结果里(ledger 层 + CLI 层各一条),
  否则 13 份 eval golden 会集体漂移。
- **doctor 宿主标注被双向咬住**:过窄 → 单宿主名单断言红;过宽 → 「矩阵里不存在 `skipped` 格」断言红。
  两个方向都做了反向验证。`n/a`(未声明)与 `skipped`(声明了却被 check 自己拒)语义不同,后者即漂移信号。
- **agent role 的 `description` 必须过 host 渲染**:`mapRolePromptsText` 故意不渲染 `description` ——
  在 commands 面正确(那里它是 yaml frontmatter),在 agent role 面是 bug(它是 codex 要读的散文),
  `task-deliver` 那条带 `{{ host.team }}` 直接漏进产物,被测试当场逮住。分叉已写死在 `rolePrompts.ts` 注释里。
- **卸载双保险**:`harnessed-` 前缀**和**文件头 marker 同时命中才删;本机 33 个 GSD 的 toml 两者都不满足。

## 未完成 / 推迟

- **T6 的 README 部分**:`docs/` 的 HostAdapter 契约已交付,但 README 体系(root + 9 镜像)在本 phase 期间
  **正被另一个会话改动**,按共享工作树纪律不碰 → 进 TODOS,待那批改动落地后对齐。
- **goal 桥接** → TODOS(含四步实测步骤,只有维护者能做)。
- **未实测因而不得断言的**:codex agent 生命周期(session 作用域 / 退出是否回收 / 能否嵌套)、
  `request_user_input` 在本机是否默认启用。相关正文一律标 `TODO(未验证)`。

## Lessons

- **「已实现」不等于「可达」。** T2/T3 交付了 `codexExecSpawn` 与五类错误,但**没有调用方** ——
  发版时我只声明了 T1,把这两项按「built-but-unwired」如实排除在 CHANGELOG 之外,随后补 T3b 接线。
  这个模式在本项目反复出现,值得每次交付时主动问一句「用户从哪进得去」。
- **发版核实口径要用 registry 直查**:`npm dist-tag ls` 读本地 CLI 缓存,刚发完会显示上一版,
  据此判断会误以为发版失败(4.45.0 实测)。已更正项目记忆。
- **给 subagent 的约束若引用项目记忆,先确认那条规则在当前上下文适用**。批 C 那次把「改 TypeBox schema
  必须跑 build:schema」写进 brief,但那条针对 manifest schema,`src/checkpoint/schema/**` 并不参与
  `schemas/` 生成 —— 代价是两次 8 小时空转(Phase 65 教训,本 phase 已在 brief 里显式排除)。
