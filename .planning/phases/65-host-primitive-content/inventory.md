# Phase 65 T1 — 逐处分类台账(236 处)

生成于 2026-09-24。只读分析产物;本文件是 T4-T8 的输入清单。

基线命令(与 SPEC / task_plan 一致):

```
rg -n "\bTask tool\b|Task / Agent|\bSendMessage\b|TeamCreate|TeamDelete|\bAgent\(|run_in_background|Agent Teams|subagent_type" workflows/
```

> 注:该命令 `rg -n` 打印 **202 行**,但含 **236 个 token 命中**(一行多命中共 34 次)。
> 236 = 按**命中**计,与 SPEC 口径一致。本台账逐命中一行,含同行第 2/3 个 token。

---

## STATUS: NEEDS_CLARIFICATION

四个问题在给定规则内无法判定,且会影响 T5/T6/T7/T11 的分工与验收。未自决。

### Q1 — `A-TPL` 与 `C` 按规则是互斥子类,实测里它们是两条正交轴

规则把 `A-TPL` 定义为**出处**(生成器渲染),把 `C` 定义为**语义**(宿主特有事实)。
实测:生成器渲染的 140 处命中里,**44 处是 C 语义** —— `TEAMS_STEP_EN/ZH` 整段、
`harnessed run` 警告句(「bypasses Agent Teams, and hangs inside Claude Code」)、
`TEAMS_TEARDOWN_*`、`DELIVERY_CONTRACT_*`。它们的正确处理既是 A-TPL(**必须**改
builder,不能手改)又是 C(**粒度**是整段变体,不是 token 替换)。

本台账采用 `C-TPL` 标法(出处 = TPL / 语义 = C),`A-TPL` 只留给真正的 token 级替换。
**请确认这个读法** —— 否则 T5(「模板句改写走生成器」)与 T6(「C 类整段变体入表」)
的分工边界重叠 44 处,两条任务线会互相覆盖同一批 builder 常量。

### Q2 — 37 处命中根本不在任何渲染面上

代码实测(非推断):

- `src/cli/prompt.ts:73-95` —— 只读 `capabilities.yaml` 的 `cmd` / `impl` / `aliases`,
  **`description` 与注释永不进 prompt**。
- `src/cli/gates.ts:288-306` —— `harnessed gates` 只输出 `{escalate_to_teams, reason}`,
  `judgments/*.yaml` 的 `description` **不出现在任何模型可见产物里**。
- `workflow.yaml` 的 `description:` / phase `name:` 不进 `harnessed prompt`(prompt.ts
  的数据源只有 role-prompts / capabilities / disciplines / defaults)。
- `disciplines/priority.*.yaml:30` 的命中是 **YAML 行尾注释**,被 parser 直接剥除。

受影响的 37 处:

| 文件 | 处数 | 渲染? |
| ---- | ---- | ----- |
| `workflows/capabilities.yaml` | 13(注释 + `description`) | 否(只有 L606 / L622 两个 `cmd:` 渲染) |
| `workflows/judgments/parallelism-gate.yaml` | 5 | 否 —— **与 task_plan T8「judgments 5 处的对应面」的前提冲突** |
| `workflows/disciplines/priority.{,zh-Hans.}yaml` | 2 | 否 |
| `workflows/{task/deliver,verify/multispec,verify/code-review}/workflow.yaml` | 17 | 否 |

问:这 37 处要 (a) 一并改措辞保持文档自洽、(b) 进 T11 新门的 allowlist 不动、
还是 (c) 只改会渲染的两处 `cmd:`?台账按 `A?` / `C?` 标出待裁。

### Q3 — 7 处是 harnessed 自有决策编号的**名字**,不是宿主指令

`D-11` 这条决策的名字就叫「Agent Teams 升级 5 触发 OR-chain」。出现在
`task/deliver/SKILL{,.zh-Hans}.md` 的 Overview + References、
`verify/multispec/SKILL{,.zh-Hans}.md` 的 Overview + References。

改名破坏与 `docs/adr/` / `.planning/` 的 cross-ref;不改则 codex 渲染产物里仍有
`Agent Teams` 字面,T11 的「零 CC 原语 token」门会红。建议 allowlist,需裁决。
台账标为 `?`。

### Q4 — 基线正则只覆盖工具名,漏掉同样是 CC 专属的行文 token

`workflows/` 下实测:

| token | 处数 |
| ----- | ---- |
| `CC-native` | 97 |
| `teammate` | 131 |
| `AskUserQuestion` | 74 |
| `Claude Code` | 64 |
| `~/.claude/` | 13 |
| `claude -p` | 2 |

其中 **`CC-native` 与 A 类命中同句**:`CC-native Task / Agent tool` / `CC-native Task / Agent 工具`。
只把后半句占位符化,codex 侧会渲染出 `CC-native spawn_agent tool` 这种混血。

T11 的验收写的是「codex 渲染产物在映射小节区间外**零 CC 原语 token**」。照字面执行,
这批必须进范围。问:(a) 至少把 `CC-native` 97 处纳入(建议加 `host.native_adj` 占位),
还是 (b) T11 门的 token 清单只锁定本台账这 236 处的 9 个 token?

---

## 小结

### 总数对账

| | |
| --- | --- |
| 命中总数 | **236** ✅ 与基线一致 |
| 涉及文件 | **57** ✅ |
| 生成器渲染span 内(`## How to invoke` / `## 如何调用` → `<!-- harnessed-generated:vX -->`) | **140** |
| span 外(手写正文 / yaml) | **96** |

> 巧合提醒:task_plan T5 写的「diff 复核 **96** 处」指的是 `Task / Agent` 这一个 token
> 的模板命中数(96 = 24 + 19×3 + 5×3,见 findings F6),**不是** span 外的 96。
> 两个 96 数值相同、含义相反。生成器实际要改的是 **140** 处(含 `Agent Teams` /
> `SendMessage` / `Agent(` / `run_in_background` 的模板命中)。

### 各类计数

| 类别 | 处数 | 说明 |
| ---- | ---- | ---- |
| **A-TPL** | 96 | token 级替换,全部来自生成器 |
| **C-TPL** | 44 | 整段变体,**但也来自生成器**(见 Q1) |
| **A-INLINE** | 28 | 手写正文的 token 级替换 |
| **C-INLINE** | 10 | 手写正文的整段变体 |
| **B** | 27 | 能力注册事实,不占位符化 |
| **A?**(不渲染) | 18 | 注释 / 非渲染 yaml 字段,待 Q2 |
| **C?**(不渲染) | 6 | 同上,整段语义 |
| **?** | 7 | 决策编号名(6)+ 折行计数假阳性(1),待 Q3 |
| **合计** | **236** | |

按三类汇总:**A = 142** / **B = 27** / **C = 60** / **待裁 ? = 7**。

### en / zh 配对情况

36 个「文件对 × 出处」分组逐组对账,**真实漂移 = 0**。

| 分组 | en | zh | 判定 |
| ---- | -- | -- | ---- |
| `task/deliver/SKILL.*` INLINE | 5 | 6 | **计数假阳性,非漂移** |
| `capabilities.yaml` / `judgments/parallelism-gate.yaml` / 3 个 `workflow.yaml` | 32 | 0 | **设计如此** —— 这些文件单 locale,无 `.zh-Hans.yaml` 兄弟(实测 `workflows/` 下只有 `disciplines/*` 5 个 + `host-primitives` + `role-prompts` 有 zh 兄弟) |
| 其余 34 组 | — | — | 全部 en == zh ✅ |

唯一的 1 处差额:`workflows/task/deliver/SKILL.md:28-29` 把同一句折行成
`… D-11 Agent` / `Teams 升级 5 触发 OR-chain …`,正则的 `Agent Teams` 跨行不匹配;
zh 兄弟 `:29` 未折行所以命中。**两侧文本内容对等**,只是命中计数差 1。
建议 T4 顺手把 en 这句重排成不折行,消除该假阳性(否则 T11 的门会两侧计数不一致)。

### A-TPL / C-TPL 涉及的 builder 清单

全部在 `scripts/rewrite-skill-invoke-sections.mjs`(该脚本 `:26-28` 自带纪律:
**Never hand-edit a rendered invoke section: change the builder here and re-run**)。

| builder / 常量 | 行 | 类别 | 每次渲染命中 | 渲染次数 | 命中数 |
| -------------- | -- | ---- | ------------ | -------- | ------ |
| `executionEn` 正文句 | `:304` | A-TPL | 1 (`Task / Agent`) | 19 | 19 |
| `executionZh` 正文句 | `:327` | A-TPL | 1 | 19 | 19 |
| `spawnLoopEn`(经 `executionEn` step 2) | `:139` | A-TPL | 1 | 19 | 19 |
| `spawnLoopZh`(经 `executionZh` step 2) | `:151` | A-TPL | 1 | 19 | 19 |
| `orchestratorEn` 正文句 | `:223` | A-TPL | 1 (`Task / Agent` 复数) | 5 | 5 |
| `orchestratorZh` 正文句 | `:266` | A-TPL | 1 | 5 | 5 |
| `spawnLoopEn`(经 `orchestratorEn` step 5b) | `:139` | A-TPL | 1 | 5 | 5 |
| `spawnLoopZh`(经 `orchestratorZh` step 5b) | `:151` | A-TPL | 1 | 5 | 5 |
| `orchestratorEn` `harnessed run` 警告 | `:225-226` | **C-TPL** | 1 (`Agent Teams`) | 5 | 5 |
| `orchestratorZh` 同上 | `:268-269` | **C-TPL** | 1 | 5 | 5 |
| `TEAMS_STEP_EN`(常量,`orchestratorEn` step 4) | `:173-174` | **C-TPL** | 3 (`Agent(` / `run_in_background` / `SendMessage`) | 5 | 15 |
| `TEAMS_STEP_ZH` | `:176-177` | **C-TPL** | 3 | 5 | 15 |
| `DELIVERY_CONTRACT_EN`(常量,仅 `research`) | `:162-163` | **C-TPL** | 1 (`SendMessage`) | 1 | 1 |
| `DELIVERY_CONTRACT_ZH` | `:165-166` | **C-TPL** | 1 | 1 | 1 |
| `TEAMS_TEARDOWN_EN[1]`(常量,仅 `auto`) | `:183` | **C-TPL** | 1 (`Agent Teams`) | 1 | 1 |
| `TEAMS_TEARDOWN_ZH[1]` | `:188` | **C-TPL** | 1 | 1 | 1 |
| | | | | **合计** | **140** |

6 个函数:`executionEn` / `executionZh` / `orchestratorEn` / `orchestratorZh` /
`spawnLoopEn` / `spawnLoopZh`;5 对常量:`TEAMS_STEP_*` / `DELIVERY_CONTRACT_*` /
`TEAMS_TEARDOWN_*`。

`interactiveEn` / `interactiveZh`(discuss 家族 + task-clarify)**零命中** —— 它们不 spawn。

渲染次数核对:24 个 skill 目录 = 19 execution + 5 orchestrator
(`auto` / `plan-auto` / `task-auto` / `verify-auto` / `ship-auto`);
`auto` 额外吃 `TEAMS_TEARDOWN_*`,`research` 额外吃 `DELIVERY_CONTRACT_*`。

---

## 逐处台账

类别图例:

- **A-TPL** — token 级替换,改 `rewrite-skill-invoke-sections.mjs` 的 builder 再重跑(T5)
- **A-INLINE** — token 级替换,手改正文(T4)
- **C-TPL** — 整段变体,但**整段文本在 builder 常量里**(T5 + T6 交界,见 Q1)
- **C-INLINE** — 整段变体,整段文本在正文里(T6)
- **B** — 能力注册事实,不占位符化,补 codex 条目(T7)
- **A? / C?** — 语义同上,但**不在任何渲染面**(见 Q2)
- **?** — 待裁(见 Q3)

### `workflows/auto/SKILL.md` — 7 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 49 | `workflows/auto/SKILL.md`:117 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.plural` | 生成器 `orchestratorEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 50 | `workflows/auto/SKILL.md`:120 | `Agent Teams` | **C-TPL** | `host.harnessed_run_warning_note` | 生成器 `orchestratorEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 51 | `workflows/auto/SKILL.md`:126 | `Agent(` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_EN`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 52 | `workflows/auto/SKILL.md`:126 | `run_in_background` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_EN`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 53 | `workflows/auto/SKILL.md`:126 | `SendMessage` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_EN`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 54 | `workflows/auto/SKILL.md`:128 | `Agent Teams` | **C-TPL** | `host.teams_teardown_note` | 生成器 `TEAMS_TEARDOWN_EN`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 55 | `workflows/auto/SKILL.md`:133 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/auto/SKILL.zh-Hans.md` — 7 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 33 | `workflows/auto/SKILL.zh-Hans.md`:115 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `orchestratorZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 34 | `workflows/auto/SKILL.zh-Hans.md`:118 | `Agent Teams` | **C-TPL** | `host.harnessed_run_warning_note` | 生成器 `orchestratorZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 35 | `workflows/auto/SKILL.zh-Hans.md`:124 | `Agent(` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_ZH`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 36 | `workflows/auto/SKILL.zh-Hans.md`:124 | `run_in_background` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_ZH`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 37 | `workflows/auto/SKILL.zh-Hans.md`:124 | `SendMessage` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_ZH`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 38 | `workflows/auto/SKILL.zh-Hans.md`:126 | `Agent Teams` | **C-TPL** | `host.teams_teardown_note` | 生成器 `TEAMS_TEARDOWN_ZH`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 39 | `workflows/auto/SKILL.zh-Hans.md`:131 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/capabilities.yaml` — 15 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 9 | `workflows/capabilities.yaml`:29 | `Agent Teams` | **B** | — | 注释 — bucket 索引;不渲染(prompt.ts 只读 cmd/impl/aliases)。T7 补 codex 条目时同步 |
| 10 | `workflows/capabilities.yaml`:575 | `Agent Teams` | **B** | — | 注释 — bucket 抬头;不渲染(prompt.ts 只读 cmd/impl/aliases)。T7 补 codex 条目时同步 |
| 11 | `workflows/capabilities.yaml`:576 | `Agent Teams` | **B** | — | 注释 — 前置条件;不渲染(prompt.ts 只读 cmd/impl/aliases)。T7 补 codex 条目时同步 |
| 12 | `workflows/capabilities.yaml`:585 | `TeamCreate` | **B** | — | 注释 — 上游 API 迁移记录;不渲染(prompt.ts 只读 cmd/impl/aliases)。T7 补 codex 条目时同步 |
| 13 | `workflows/capabilities.yaml`:585 | `TeamDelete` | **B** | — | 注释(同行第 2 token `TeamDelete`) |
| 14 | `workflows/capabilities.yaml`:598 | `Agent Teams` | **B** | — | 注释 — 5 触发 OR-chain 抬头;不渲染(prompt.ts 只读 cmd/impl/aliases)。T7 补 codex 条目时同步 |
| 15 | `workflows/capabilities.yaml`:599 | `SendMessage` | **B** | — | 注释 — 触发 1;不渲染(prompt.ts 只读 cmd/impl/aliases)。T7 补 codex 条目时同步 |
| 16 | `workflows/capabilities.yaml`:606 | `Agent(` | **B** | — | `cmd:` 注册表字段 — **唯一会渲染**的一类(prompt.ts:83 `Invoke \`<cmd>\``)。T7 加 codex 条目 |
| 17 | `workflows/capabilities.yaml`:606 | `run_in_background` | **B** | — | 同行第 2 token(`run_in_background`),同一 `cmd:` 值 |
| 18 | `workflows/capabilities.yaml`:610 | `Agent Teams` | **B** | — | `description:` 值;不渲染。T7 补 codex 侧描述 |
| 19 | `workflows/capabilities.yaml`:611 | `TeamCreate` | **B** | — | 同上 description 续行 |
| 20 | `workflows/capabilities.yaml`:622 | `SendMessage` | **B** | — | `cmd: SendMessage` 注册表字段 — 会渲染。T7 加 codex `cmd: send_input` |
| 21 | `workflows/capabilities.yaml`:626 | `Agent Teams` | **B** | — | `description:` 值;不渲染 |
| 22 | `workflows/capabilities.yaml`:635 | `Agent Teams` | **B** | — | `description:` 值;不渲染。claude = 按名请求 / codex = `close_agent` |
| 23 | `workflows/capabilities.yaml`:636 | `TeamDelete` | **B** | — | description 续行(`TeamDelete`) |

### `workflows/disciplines/priority.yaml` — 1 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 235 | `workflows/disciplines/priority.yaml`:30 | `Agent Teams` | **A?** | `host.team` | YAML 行尾注释;yaml parser 剥除,**永不渲染**。en/zh 成对。建议 allowlist 或顺手改措辞 |

### `workflows/disciplines/priority.zh-Hans.yaml` — 1 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 236 | `workflows/disciplines/priority.zh-Hans.yaml`:30 | `Agent Teams` | **A?** | `host.team` | YAML 行尾注释;yaml parser 剥除,**永不渲染**。en/zh 成对。建议 allowlist 或顺手改措辞 |

### `workflows/judgments/parallelism-gate.yaml` — 5 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 152 | `workflows/judgments/parallelism-gate.yaml`:2 | `Agent Teams` | **A?** | `host.team` | 文件头注释;**不渲染**(gates 只输出 {escalate_to_teams,reason})。与 task_plan T8「judgments 5 处」前提冲突 — 见 STATUS 节 Q2 |
| 153 | `workflows/judgments/parallelism-gate.yaml`:4 | `Agent Teams` | **C?** | `host.teams_cleanup_note` | 注释「Agent Teams lifecycle」;不渲染。同 Q2 |
| 154 | `workflows/judgments/parallelism-gate.yaml`:15 | `Task / Agent` | **A?** | `host.spawn_subagent.zh_tool` | `description:` 值;不渲染。同 Q2 |
| 155 | `workflows/judgments/parallelism-gate.yaml`:29 | `Agent Teams` | **A?** | `host.team` | `description:` 值「Claude Code Agent Teams 升级」;不渲染。同 Q2 |
| 156 | `workflows/judgments/parallelism-gate.yaml`:30 | `SendMessage` | **A?** | `host.send_message` | `description:` 值;不渲染。同 Q2 |

### `workflows/plan/architecture/SKILL.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 157 | `workflows/plan/architecture/SKILL.md`:64 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 158 | `workflows/plan/architecture/SKILL.md`:70 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/plan/architecture/SKILL.zh-Hans.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 165 | `workflows/plan/architecture/SKILL.zh-Hans.md`:63 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 166 | `workflows/plan/architecture/SKILL.zh-Hans.md`:69 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/plan/auto/SKILL.md` — 6 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 131 | `workflows/plan/auto/SKILL.md`:65 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.plural` | 生成器 `orchestratorEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 132 | `workflows/plan/auto/SKILL.md`:68 | `Agent Teams` | **C-TPL** | `host.harnessed_run_warning_note` | 生成器 `orchestratorEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 133 | `workflows/plan/auto/SKILL.md`:74 | `Agent(` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_EN`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 134 | `workflows/plan/auto/SKILL.md`:74 | `run_in_background` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_EN`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 135 | `workflows/plan/auto/SKILL.md`:74 | `SendMessage` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_EN`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 136 | `workflows/plan/auto/SKILL.md`:79 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/plan/auto/SKILL.zh-Hans.md` — 6 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 107 | `workflows/plan/auto/SKILL.zh-Hans.md`:64 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `orchestratorZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 108 | `workflows/plan/auto/SKILL.zh-Hans.md`:67 | `Agent Teams` | **C-TPL** | `host.harnessed_run_warning_note` | 生成器 `orchestratorZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 109 | `workflows/plan/auto/SKILL.zh-Hans.md`:73 | `Agent(` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_ZH`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 110 | `workflows/plan/auto/SKILL.zh-Hans.md`:73 | `run_in_background` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_ZH`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 111 | `workflows/plan/auto/SKILL.zh-Hans.md`:73 | `SendMessage` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_ZH`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 112 | `workflows/plan/auto/SKILL.zh-Hans.md`:78 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/plan/phase/SKILL.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 90 | `workflows/plan/phase/SKILL.md`:66 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 91 | `workflows/plan/phase/SKILL.md`:72 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/plan/phase/SKILL.zh-Hans.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 88 | `workflows/plan/phase/SKILL.zh-Hans.md`:65 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 89 | `workflows/plan/phase/SKILL.zh-Hans.md`:71 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/research/SKILL.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 119 | `workflows/research/SKILL.md`:59 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 120 | `workflows/research/SKILL.md`:65 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 121 | `workflows/research/SKILL.md`:69 | `SendMessage` | **C-TPL** | `host.delivery_contract_note` | 生成器 `DELIVERY_CONTRACT_EN`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/research/SKILL.zh-Hans.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 104 | `workflows/research/SKILL.zh-Hans.md`:57 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 105 | `workflows/research/SKILL.zh-Hans.md`:63 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 106 | `workflows/research/SKILL.zh-Hans.md`:67 | `SendMessage` | **C-TPL** | `host.delivery_contract_note` | 生成器 `DELIVERY_CONTRACT_ZH`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/retro/SKILL.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 86 | `workflows/retro/SKILL.md`:59 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 87 | `workflows/retro/SKILL.md`:65 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/retro/SKILL.zh-Hans.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 84 | `workflows/retro/SKILL.zh-Hans.md`:58 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 85 | `workflows/retro/SKILL.zh-Hans.md`:64 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/role-prompts.yaml` — 5 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 40 | `workflows/role-prompts.yaml`:376 | `Agent Teams` | **A-INLINE** | `host.team` | task-deliver checklist;S3 渲染面(T8)。配对:zh-Hans 同位 |
| 41 | `workflows/role-prompts.yaml`:379 | `Agent Teams` | **A-INLINE** | `host.team` | task-deliver description;S3 渲染面(T8)。配对:zh-Hans 同位 |
| 42 | `workflows/role-prompts.yaml`:529 | `SendMessage` | **A-INLINE** | `host.send_message` | verify-multispec responsibility;S3 渲染面(T8)。配对:zh-Hans 同位 |
| 43 | `workflows/role-prompts.yaml`:535 | `SendMessage` | **C-INLINE** | `host.delivery_contract_note.checklist` | 断言「平台丢弃 teammate 最终消息」= CC 事实;整条入表。配对:zh-Hans 同位 |
| 44 | `workflows/role-prompts.yaml`:541 | `SendMessage` | **A-INLINE** | `host.send_message` | verify-multispec description;S3 渲染面(T8)。配对:zh-Hans 同位 |

### `workflows/role-prompts.zh-Hans.yaml` — 5 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 26 | `workflows/role-prompts.zh-Hans.yaml`:353 | `Agent Teams` | **A-INLINE** | `host.team` | task-deliver checklist;S3 渲染面(T8)。配对:en 同位 |
| 27 | `workflows/role-prompts.zh-Hans.yaml`:356 | `Agent Teams` | **A-INLINE** | `host.team` | task-deliver description;S3 渲染面(T8)。配对:en 同位 |
| 28 | `workflows/role-prompts.zh-Hans.yaml`:503 | `SendMessage` | **A-INLINE** | `host.send_message` | verify-multispec responsibility;S3 渲染面(T8)。配对:en 同位 |
| 29 | `workflows/role-prompts.zh-Hans.yaml`:509 | `SendMessage` | **C-INLINE** | `host.delivery_contract_note.checklist` | 断言「平台丢弃 teammate 最终消息」= CC 事实;整条入表。配对:en 同位 |
| 30 | `workflows/role-prompts.zh-Hans.yaml`:515 | `SendMessage` | **A-INLINE** | `host.send_message` | verify-multispec description;S3 渲染面(T8)。配对:en 同位 |

### `workflows/ship/auto/SKILL.md` — 6 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 227 | `workflows/ship/auto/SKILL.md`:59 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.plural` | 生成器 `orchestratorEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 228 | `workflows/ship/auto/SKILL.md`:62 | `Agent Teams` | **C-TPL** | `host.harnessed_run_warning_note` | 生成器 `orchestratorEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 229 | `workflows/ship/auto/SKILL.md`:68 | `Agent(` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_EN`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 230 | `workflows/ship/auto/SKILL.md`:68 | `run_in_background` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_EN`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 231 | `workflows/ship/auto/SKILL.md`:68 | `SendMessage` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_EN`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 232 | `workflows/ship/auto/SKILL.md`:73 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/ship/auto/SKILL.zh-Hans.md` — 6 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 219 | `workflows/ship/auto/SKILL.zh-Hans.md`:57 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `orchestratorZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 220 | `workflows/ship/auto/SKILL.zh-Hans.md`:60 | `Agent Teams` | **C-TPL** | `host.harnessed_run_warning_note` | 生成器 `orchestratorZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 221 | `workflows/ship/auto/SKILL.zh-Hans.md`:66 | `Agent(` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_ZH`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 222 | `workflows/ship/auto/SKILL.zh-Hans.md`:66 | `run_in_background` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_ZH`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 223 | `workflows/ship/auto/SKILL.zh-Hans.md`:66 | `SendMessage` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_ZH`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 224 | `workflows/ship/auto/SKILL.zh-Hans.md`:71 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/ship/preflight/SKILL.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 233 | `workflows/ship/preflight/SKILL.md`:51 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 234 | `workflows/ship/preflight/SKILL.md`:57 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/ship/preflight/SKILL.zh-Hans.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 225 | `workflows/ship/preflight/SKILL.zh-Hans.md`:48 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 226 | `workflows/ship/preflight/SKILL.zh-Hans.md`:54 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/task/auto/SKILL.md` — 7 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 205 | `workflows/task/auto/SKILL.md`:42 | `Agent Teams` | **A-INLINE** | `host.team` | 「completion gate orthogonal wrapper」节正文;en/zh 成对同 key |
| 206 | `workflows/task/auto/SKILL.md`:75 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.plural` | 生成器 `orchestratorEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 207 | `workflows/task/auto/SKILL.md`:78 | `Agent Teams` | **C-TPL** | `host.harnessed_run_warning_note` | 生成器 `orchestratorEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 208 | `workflows/task/auto/SKILL.md`:84 | `Agent(` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_EN`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 209 | `workflows/task/auto/SKILL.md`:84 | `run_in_background` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_EN`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 210 | `workflows/task/auto/SKILL.md`:84 | `SendMessage` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_EN`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 211 | `workflows/task/auto/SKILL.md`:89 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/task/auto/SKILL.zh-Hans.md` — 7 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 212 | `workflows/task/auto/SKILL.zh-Hans.md`:42 | `Agent Teams` | **A-INLINE** | `host.team` | 「completion gate orthogonal wrapper」节正文;en/zh 成对同 key |
| 213 | `workflows/task/auto/SKILL.zh-Hans.md`:74 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `orchestratorZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 214 | `workflows/task/auto/SKILL.zh-Hans.md`:77 | `Agent Teams` | **C-TPL** | `host.harnessed_run_warning_note` | 生成器 `orchestratorZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 215 | `workflows/task/auto/SKILL.zh-Hans.md`:83 | `Agent(` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_ZH`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 216 | `workflows/task/auto/SKILL.zh-Hans.md`:83 | `run_in_background` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_ZH`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 217 | `workflows/task/auto/SKILL.zh-Hans.md`:83 | `SendMessage` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_ZH`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 218 | `workflows/task/auto/SKILL.zh-Hans.md`:88 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/task/code/SKILL.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 203 | `workflows/task/code/SKILL.md`:78 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 204 | `workflows/task/code/SKILL.md`:84 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/task/code/SKILL.zh-Hans.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 184 | `workflows/task/code/SKILL.zh-Hans.md`:76 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 185 | `workflows/task/code/SKILL.zh-Hans.md`:82 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/task/deliver/SKILL.md` — 7 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 145 | `workflows/task/deliver/SKILL.md`:5 | `Agent Teams` | **A-INLINE** | `host.team` | frontmatter `description:`;en/zh 成对同 key |
| 146 | `workflows/task/deliver/SKILL.md`:70 | `Agent Teams` | **A-INLINE** | `host.team` | 三级标题;en/zh 成对同 key |
| 147 | `workflows/task/deliver/SKILL.md`:73 | `SendMessage` | **A-INLINE** | `host.send_message` | 5 触发 OR-chain 第 1 条;en/zh 成对同 key |
| 148 | `workflows/task/deliver/SKILL.md`:79 | `Agent Teams` | **C-INLINE** | `host.teams_cleanup_note` | 整句含「CC 2.1.178+ 无 teardown 工具 / 团目录 session 退出自动清理」两条 CC 生命周期事实 → 整段入表;en/zh 成对 |
| 149 | `workflows/task/deliver/SKILL.md`:112 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 150 | `workflows/task/deliver/SKILL.md`:118 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 151 | `workflows/task/deliver/SKILL.md`:132 | `Agent Teams` | **?** | — | References 节「D-11 — Agent Teams 升级 5 触发」= harnessed 自有决策编号的**名字**。改名破坏 decision cross-ref,见 Q3 |

### `workflows/task/deliver/SKILL.zh-Hans.md` — 8 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 137 | `workflows/task/deliver/SKILL.zh-Hans.md`:5 | `Agent Teams` | **A-INLINE** | `host.team` | frontmatter `description:`;en/zh 成对同 key |
| 138 | `workflows/task/deliver/SKILL.zh-Hans.md`:29 | `Agent Teams` | **?** | — | **en/zh 计数差的唯一来源**:en SKILL.md:28-29 同句被折行成 `D-11 Agent` / `Teams 升级`,正则漏匹配。内容对等 — 计数假阳性,非漂移。内含决策名 D-11,见 Q3 |
| 139 | `workflows/task/deliver/SKILL.zh-Hans.md`:70 | `Agent Teams` | **A-INLINE** | `host.team` | 三级标题;en/zh 成对同 key |
| 140 | `workflows/task/deliver/SKILL.zh-Hans.md`:73 | `SendMessage` | **A-INLINE** | `host.send_message` | 5 触发 OR-chain 第 1 条;en/zh 成对同 key |
| 141 | `workflows/task/deliver/SKILL.zh-Hans.md`:79 | `Agent Teams` | **C-INLINE** | `host.teams_cleanup_note` | 整句含「CC 2.1.178+ 无 teardown 工具 / 团目录 session 退出自动清理」两条 CC 生命周期事实 → 整段入表;en/zh 成对 |
| 142 | `workflows/task/deliver/SKILL.zh-Hans.md`:111 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 143 | `workflows/task/deliver/SKILL.zh-Hans.md`:117 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 144 | `workflows/task/deliver/SKILL.zh-Hans.md`:131 | `Agent Teams` | **?** | — | References 节「D-11 — Agent Teams 升级 5 触发」= harnessed 自有决策编号的**名字**。改名破坏 decision cross-ref,见 Q3 |

### `workflows/task/deliver/workflow.yaml` — 9 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 122 | `workflows/task/deliver/workflow.yaml`:6 | `Agent Teams` | **A?** | `host.team` | 文件头注释;不渲染 |
| 123 | `workflows/task/deliver/workflow.yaml`:6 | `Agent Teams` | **A?** | `host.team` | 同行第 2 token |
| 124 | `workflows/task/deliver/workflow.yaml`:21 | `Agent Teams` | **C?** | `host.teams_step_note` | 注释「Agent Teams route conditional」;不渲染 |
| 125 | `workflows/task/deliver/workflow.yaml`:45 | `Agent Teams` | **A?** | `host.team` | `description:` 值;不渲染 |
| 126 | `workflows/task/deliver/workflow.yaml`:45 | `Agent Teams` | **A?** | `host.team` | 同行第 2 token |
| 127 | `workflows/task/deliver/workflow.yaml`:48 | `Agent Teams` | **C?** | `host.teams_cleanup_note` | `description:` 值,含「团目录 session 退出自动清理」CC 事实;不渲染 |
| 128 | `workflows/task/deliver/workflow.yaml`:49 | `Agent Teams` | **C?** | `host.teams_cleanup_note` | 同上续行 |
| 129 | `workflows/task/deliver/workflow.yaml`:67 | `Agent Teams` | **A?** | `host.team` | phase `name:` 值;不渲染(engine 内部标识) |
| 130 | `workflows/task/deliver/workflow.yaml`:83 | `Agent Teams` | **A?** | `host.team` | 注释;不渲染 |

### `workflows/task/test/SKILL.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 98 | `workflows/task/test/SKILL.md`:105 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 99 | `workflows/task/test/SKILL.md`:111 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/task/test/SKILL.zh-Hans.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 96 | `workflows/task/test/SKILL.zh-Hans.md`:100 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 97 | `workflows/task/test/SKILL.zh-Hans.md`:106 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/auto/SKILL.md` — 6 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 70 | `workflows/verify/auto/SKILL.md`:88 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.plural` | 生成器 `orchestratorEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 71 | `workflows/verify/auto/SKILL.md`:91 | `Agent Teams` | **C-TPL** | `host.harnessed_run_warning_note` | 生成器 `orchestratorEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 72 | `workflows/verify/auto/SKILL.md`:97 | `Agent(` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_EN`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 73 | `workflows/verify/auto/SKILL.md`:97 | `run_in_background` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_EN`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 74 | `workflows/verify/auto/SKILL.md`:97 | `SendMessage` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_EN`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 75 | `workflows/verify/auto/SKILL.md`:102 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/auto/SKILL.zh-Hans.md` — 6 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 62 | `workflows/verify/auto/SKILL.zh-Hans.md`:87 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `orchestratorZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 63 | `workflows/verify/auto/SKILL.zh-Hans.md`:90 | `Agent Teams` | **C-TPL** | `host.harnessed_run_warning_note` | 生成器 `orchestratorZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 64 | `workflows/verify/auto/SKILL.zh-Hans.md`:96 | `Agent(` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_ZH`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 65 | `workflows/verify/auto/SKILL.zh-Hans.md`:96 | `run_in_background` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_ZH`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 66 | `workflows/verify/auto/SKILL.zh-Hans.md`:96 | `SendMessage` | **C-TPL** | `host.teams_step_note` | 生成器 `TEAMS_STEP_ZH`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 67 | `workflows/verify/auto/SKILL.zh-Hans.md`:101 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/code-review/SKILL.md` — 4 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 115 | `workflows/verify/code-review/SKILL.md`:5 | `Task / Agent` | **A-INLINE** | `host.spawn_subagent.zh_tool` | frontmatter `description:`(中文行文);en/zh 成对同 key |
| 116 | `workflows/verify/code-review/SKILL.md`:32 | `Task / Agent` | **A-INLINE** | `host.spawn_subagent.zh_tool` | Overview 正文;en/zh 成对同 key |
| 117 | `workflows/verify/code-review/SKILL.md`:60 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 118 | `workflows/verify/code-review/SKILL.md`:66 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/code-review/SKILL.zh-Hans.md` — 4 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 100 | `workflows/verify/code-review/SKILL.zh-Hans.md`:5 | `Task / Agent` | **A-INLINE** | `host.spawn_subagent.zh_tool` | frontmatter `description:`(中文行文);en/zh 成对同 key |
| 101 | `workflows/verify/code-review/SKILL.zh-Hans.md`:32 | `Task / Agent` | **A-INLINE** | `host.spawn_subagent.zh_tool` | Overview 正文;en/zh 成对同 key |
| 102 | `workflows/verify/code-review/SKILL.zh-Hans.md`:59 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 103 | `workflows/verify/code-review/SKILL.zh-Hans.md`:65 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/code-review/workflow.yaml` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 92 | `workflows/verify/code-review/workflow.yaml`:4 | `Task / Agent` | **A?** | `host.spawn_subagent.zh_tool` | 文件头注释;不渲染(workflow.yaml description/name 不进 prompt,已查 prompt.ts) |
| 93 | `workflows/verify/code-review/workflow.yaml`:18 | `Task / Agent` | **A?** | `host.spawn_subagent.zh_tool` | `description:` 值;不渲染。单 locale 文件(无 zh 兄弟) |

### `workflows/verify/design/SKILL.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 78 | `workflows/verify/design/SKILL.md`:72 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 79 | `workflows/verify/design/SKILL.md`:78 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/design/SKILL.zh-Hans.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 76 | `workflows/verify/design/SKILL.zh-Hans.md`:71 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 77 | `workflows/verify/design/SKILL.zh-Hans.md`:77 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/eval-review/SKILL.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 56 | `workflows/verify/eval-review/SKILL.md`:54 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 57 | `workflows/verify/eval-review/SKILL.md`:60 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/eval-review/SKILL.zh-Hans.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 45 | `workflows/verify/eval-review/SKILL.zh-Hans.md`:53 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 46 | `workflows/verify/eval-review/SKILL.zh-Hans.md`:59 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/multispec/SKILL.md` — 17 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 186 | `workflows/verify/multispec/SKILL.md`:6 | `SendMessage` | **A-INLINE** | `host.send_message` | frontmatter description;成对(zh-Hans 同位) |
| 187 | `workflows/verify/multispec/SKILL.md`:6 | `Agent Teams` | **A-INLINE** | `host.team` | 同行第 2 token;成对(zh-Hans 同位) |
| 188 | `workflows/verify/multispec/SKILL.md`:27 | `Agent Teams` | **?** | — | Overview「D-11 Agent Teams + Pattern A」= 决策编号名字,见 Q3;成对(zh-Hans 同位) |
| 189 | `workflows/verify/multispec/SKILL.md`:36 | `Agent(` | **C-INLINE** | `host.multispec_spawn_note` | 整段断言「团在第一个 spawn 时隐式形成 / CC 2.1.178+ 无建团步骤」= CC 事实 → 整段入表;成对(zh-Hans 同位) |
| 190 | `workflows/verify/multispec/SKILL.md`:36 | `run_in_background` | **C-INLINE** | `host.multispec_spawn_note` | 同行第 2 token(`run_in_background`) |
| 191 | `workflows/verify/multispec/SKILL.md`:37 | `SendMessage` | **A-INLINE** | `host.send_message` | 正文;成对(zh-Hans 同位) |
| 192 | `workflows/verify/multispec/SKILL.md`:39 | `Agent Teams` | **C-INLINE** | `host.teams_cleanup_note` | 整段含「团目录 session 退出自动清理 / 无独立 teardown 工具」;成对(zh-Hans 同位) |
| 193 | `workflows/verify/multispec/SKILL.md`:45 | `Agent Teams` | **B** | — | Capability refs 节逐字复述 capabilities.yaml 注册事实(`agent-teams-create ... cmd:`)→ 不占位符化,随 T7 改为按宿主渲染;成对(zh-Hans 同位) |
| 194 | `workflows/verify/multispec/SKILL.md`:45 | `Agent(` | **B** | — | 同行 `Agent(` |
| 195 | `workflows/verify/multispec/SKILL.md`:45 | `run_in_background` | **B** | — | 同行 `run_in_background` |
| 196 | `workflows/verify/multispec/SKILL.md`:46 | `Agent Teams` | **B** | — | `agent-teams-send-message ... cmd: SendMessage` 注册事实;成对(zh-Hans 同位) |
| 197 | `workflows/verify/multispec/SKILL.md`:46 | `SendMessage` | **B** | — | 同行 `SendMessage` |
| 198 | `workflows/verify/multispec/SKILL.md`:47 | `Agent Teams` | **B** | — | `agent-teams-shutdown` 注册事实;成对(zh-Hans 同位) |
| 199 | `workflows/verify/multispec/SKILL.md`:63 | `Agent Teams` | **A-INLINE** | `host.team` | 二级标题「Routing rules (bundled Agent Teams routing …)」;成对(zh-Hans 同位) |
| 200 | `workflows/verify/multispec/SKILL.md`:79 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 201 | `workflows/verify/multispec/SKILL.md`:85 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 202 | `workflows/verify/multispec/SKILL.md`:98 | `Agent Teams` | **?** | — | References「D-11 Agent Teams 4-specialist Pattern C upgrade」= 决策编号名字,见 Q3;成对(zh-Hans 同位) |

### `workflows/verify/multispec/SKILL.zh-Hans.md` — 17 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 167 | `workflows/verify/multispec/SKILL.zh-Hans.md`:6 | `SendMessage` | **A-INLINE** | `host.send_message` | frontmatter description;成对(en 同位) |
| 168 | `workflows/verify/multispec/SKILL.zh-Hans.md`:6 | `Agent Teams` | **A-INLINE** | `host.team` | 同行第 2 token;成对(en 同位) |
| 169 | `workflows/verify/multispec/SKILL.zh-Hans.md`:27 | `Agent Teams` | **?** | — | Overview「D-11 Agent Teams + Pattern A」= 决策编号名字,见 Q3;成对(en 同位) |
| 170 | `workflows/verify/multispec/SKILL.zh-Hans.md`:35 | `Agent(` | **C-INLINE** | `host.multispec_spawn_note` | 整段断言「团在第一个 spawn 时隐式形成 / CC 2.1.178+ 无建团步骤」= CC 事实 → 整段入表;成对(en 同位) |
| 171 | `workflows/verify/multispec/SKILL.zh-Hans.md`:35 | `run_in_background` | **C-INLINE** | `host.multispec_spawn_note` | 同行第 2 token(`run_in_background`) |
| 172 | `workflows/verify/multispec/SKILL.zh-Hans.md`:37 | `SendMessage` | **A-INLINE** | `host.send_message` | 正文;成对(en 同位) |
| 173 | `workflows/verify/multispec/SKILL.zh-Hans.md`:38 | `Agent Teams` | **C-INLINE** | `host.teams_cleanup_note` | 整段含「团目录 session 退出自动清理 / 无独立 teardown 工具」;成对(en 同位) |
| 174 | `workflows/verify/multispec/SKILL.zh-Hans.md`:44 | `Agent Teams` | **B** | — | Capability refs 节逐字复述 capabilities.yaml 注册事实(`agent-teams-create ... cmd:`)→ 不占位符化,随 T7 改为按宿主渲染;成对(en 同位) |
| 175 | `workflows/verify/multispec/SKILL.zh-Hans.md`:44 | `Agent(` | **B** | — | 同行 `Agent(` |
| 176 | `workflows/verify/multispec/SKILL.zh-Hans.md`:44 | `run_in_background` | **B** | — | 同行 `run_in_background` |
| 177 | `workflows/verify/multispec/SKILL.zh-Hans.md`:45 | `Agent Teams` | **B** | — | `agent-teams-send-message ... cmd: SendMessage` 注册事实;成对(en 同位) |
| 178 | `workflows/verify/multispec/SKILL.zh-Hans.md`:45 | `SendMessage` | **B** | — | 同行 `SendMessage` |
| 179 | `workflows/verify/multispec/SKILL.zh-Hans.md`:46 | `Agent Teams` | **B** | — | `agent-teams-shutdown` 注册事实;成对(en 同位) |
| 180 | `workflows/verify/multispec/SKILL.zh-Hans.md`:62 | `Agent Teams` | **A-INLINE** | `host.team` | 二级标题「Routing rules (bundled Agent Teams routing …)」;成对(en 同位) |
| 181 | `workflows/verify/multispec/SKILL.zh-Hans.md`:77 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 182 | `workflows/verify/multispec/SKILL.zh-Hans.md`:83 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 183 | `workflows/verify/multispec/SKILL.zh-Hans.md`:96 | `Agent Teams` | **?** | — | References「D-11 Agent Teams 4-specialist Pattern C upgrade」= 决策编号名字,见 Q3;成对(en 同位) |

### `workflows/verify/multispec/workflow.yaml` — 6 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 159 | `workflows/verify/multispec/workflow.yaml`:4 | `SendMessage` | **A?** | `host.send_message` | 文件头注释;不渲染 |
| 160 | `workflows/verify/multispec/workflow.yaml`:14 | `Agent Teams` | **C?** | `host.teams_cleanup_note` | 注释「Cleanup mandatory (bundled Agent Teams discipline)」;不渲染 |
| 161 | `workflows/verify/multispec/workflow.yaml`:24 | `SendMessage` | **A?** | `host.send_message` | `description:` 值;不渲染 |
| 162 | `workflows/verify/multispec/workflow.yaml`:26 | `Agent Teams` | **C?** | `host.teams_cleanup_note` | `description:` 值含 CC 清理事实;不渲染 |
| 163 | `workflows/verify/multispec/workflow.yaml`:51 | `Agent Teams` | **A?** | `host.team` | 注释;不渲染 |
| 164 | `workflows/verify/multispec/workflow.yaml`:64 | `Agent Teams` | **A?** | `host.team` | 注释;不渲染 |

### `workflows/verify/paranoid/SKILL.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 113 | `workflows/verify/paranoid/SKILL.md`:62 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 114 | `workflows/verify/paranoid/SKILL.md`:68 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/paranoid/SKILL.zh-Hans.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 94 | `workflows/verify/paranoid/SKILL.zh-Hans.md`:61 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 95 | `workflows/verify/paranoid/SKILL.zh-Hans.md`:67 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/progress/SKILL.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 82 | `workflows/verify/progress/SKILL.md`:58 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 83 | `workflows/verify/progress/SKILL.md`:64 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/progress/SKILL.zh-Hans.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 80 | `workflows/verify/progress/SKILL.zh-Hans.md`:56 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 81 | `workflows/verify/progress/SKILL.zh-Hans.md`:62 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/qa/SKILL.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 60 | `workflows/verify/qa/SKILL.md`:90 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 61 | `workflows/verify/qa/SKILL.md`:96 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/qa/SKILL.zh-Hans.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 47 | `workflows/verify/qa/SKILL.zh-Hans.md`:89 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 48 | `workflows/verify/qa/SKILL.zh-Hans.md`:95 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/second-opinion/SKILL.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 58 | `workflows/verify/second-opinion/SKILL.md`:67 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 59 | `workflows/verify/second-opinion/SKILL.md`:73 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/second-opinion/SKILL.zh-Hans.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 68 | `workflows/verify/second-opinion/SKILL.zh-Hans.md`:66 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 69 | `workflows/verify/second-opinion/SKILL.zh-Hans.md`:72 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/security/SKILL.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 31 | `workflows/verify/security/SKILL.md`:59 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 32 | `workflows/verify/security/SKILL.md`:65 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/security/SKILL.zh-Hans.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 24 | `workflows/verify/security/SKILL.zh-Hans.md`:58 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 25 | `workflows/verify/security/SKILL.zh-Hans.md`:64 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/simplify/SKILL.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 7 | `workflows/verify/simplify/SKILL.md`:59 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 8 | `workflows/verify/simplify/SKILL.md`:65 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/simplify/SKILL.zh-Hans.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 5 | `workflows/verify/simplify/SKILL.zh-Hans.md`:58 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 6 | `workflows/verify/simplify/SKILL.zh-Hans.md`:64 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/validate-phase/SKILL.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 3 | `workflows/verify/validate-phase/SKILL.md`:54 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `executionEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 4 | `workflows/verify/validate-phase/SKILL.md`:60 | `Task / Agent` | **A-TPL** | `host.spawn_subagent` | 生成器 `spawnLoopEn`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

### `workflows/verify/validate-phase/SKILL.zh-Hans.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| 1 | `workflows/verify/validate-phase/SKILL.zh-Hans.md`:53 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `executionZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |
| 2 | `workflows/verify/validate-phase/SKILL.zh-Hans.md`:59 | `Task / Agent` | **A-TPL** | `host.spawn_subagent.zh_tool` | 生成器 `spawnLoopZh`(rewrite-skill-invoke-sections.mjs)渲染 — 禁止手改 |

---

## 提议的 primitive / key 词表

去重后 **9 个 primitive / 12 个可寻址占位符**(A 类 token 级 3 primitive / 5 占位符;
C 类整段 6 primitive / 7 占位符)。B 类不占位符化,单列在最后。

`workflows/host-primitives.yaml` + `.zh-Hans.yaml`(T2 已落骨架)已含 `spawn_subagent`
与 `send_message` 两个 primitive —— 下表标 `已有` 的直接复用,标 `NEW` 的待 T2 续填。

codex 侧文本**只用 findings F4 已验证的工具名与参数**
(`spawn_agent(task_name, message)` / `send_input(target, items, interrupt)` /
`wait_agent` / `list_agents` / `close_agent` / `resume_agent`)。
凡需断言 codex **行为**(生命周期 / session 作用域 / 自动清理 / 能否嵌套)之处,一律写
`TODO(未验证)`,不编造。

### A 类 —— token 级占位符

#### 1. `host.spawn_subagent` — 已有

| | claude(逐字,渲染还原) | codex(建议) |
| - | ---------------------- | ------------ |
| `default` | `Task / Agent tool` | `spawn_agent tool` |
| `zh_tool` | `Task / Agent 工具` | `spawn_agent 工具` |
| `plural` **NEW** | `Task / Agent tools` | `spawn_agent tools` |

`plural` 只被 `orchestratorEn:223`(`YOU spawn with CC-native Task / Agent tools.`)用到。
zh 侧 `orchestratorZh:266` 无复数形态,用 `zh_tool` 即可 —— 但两个 locale 文件仍须声明
同一套 key(parity 门要求),zh 文件的 `plural` 填 `Task / Agent 工具` / `spawn_agent 工具`。

覆盖:**103 处**(96 A-TPL + 4 A-INLINE(code-review SKILL en/zh ×2)+ 3 A?(parallelism-gate:15、
code-review/workflow.yaml:4,18))。

#### 2. `host.send_message` — 已有

| | claude | codex |
| - | ------ | ----- |
| `default` | `SendMessage` | `send_input` |

两个 locale 同值(工具名是专有名词,不翻译)。
覆盖:**13 处**(2 A-INLINE role-prompts ×2 组 = 4、multispec SKILL en/zh ×2 = 4、
deliver SKILL en/zh = 2、A? parallelism-gate:30 + multispec/workflow.yaml:4,24 = 3)。
> `SendMessage` 在 `TEAMS_STEP_*` / `DELIVERY_CONTRACT_*` 里的 7 处属 C-TPL,
> 由整段 key 承载,**不**走本占位符。

#### 3. `host.team` — NEW

| | claude | codex |
| - | ------ | ----- |
| `default`(en 文件) | `Agent Teams` | `a multi-agent formation (repeated \`spawn_agent\`)` |
| `default`(zh 文件) | `Agent Teams` | `多 agent 编队(多次 \`spawn_agent\`)` |

claude 两个 locale 同值(专有名词)。codex 侧 **v1 没有品牌化的「编队」概念**,
F4 实测的编队方式就是多次 `spawn_agent`,所以这里给的是描述性短语而非工具名。

⚠️ 本 key 是词表里唯一一个 codex 侧**不是工具名**的 A 类 token。若整句读起来别扭
(例如「escalate to Agent Teams」→「escalate to a multi-agent formation」),
该句应改判为 C 类整段。T4 逐句复核时请确认。

覆盖:**42 处**(A-INLINE 20 + A? 14 + 其余分布见台账)。

### C 类 —— 整段变体

#### 4. `host.harnessed_run_warning_note` — NEW(10 处,全 C-TPL)

claude 逐字(`orchestratorEn:225-226`):

```
Do NOT pipe to `harnessed run <name>` — that is the CI/headless path (in-process SDK spawn
that blocks the session, bypasses Agent Teams, and hangs inside Claude Code).
```

claude 逐字(`orchestratorZh:268-269`):

```
**不要** pipe 到 `harnessed run <name>` —— 那是 CI/headless 路径(in-process SDK spawn,会阻塞
session、绕过 Agent Teams,在 Claude Code 内部调用时会挂死)。
```

codex 草稿(en):

```
Do NOT pipe to `harnessed run <name>` — that is the CI/headless path (an in-process SDK
spawn that blocks this session).
```

codex 草稿(zh):

```
**不要** pipe 到 `harnessed run <name>` —— 那是 CI/headless 路径(in-process SDK spawn,
会阻塞本 session)。
```

理由:「in-process SDK spawn 阻塞 session」是 harnessed 自身事实,宿主中立,保留;
「绕过 Agent Teams / 在 Claude Code 内部挂死」是 CC 专属事实,**删除而非改写**
(改写就得断言 codex 上会不会挂,而这未实测)。

> 同族但**不在 236 内**:`executionEn:306-307` / `executionZh:329-330` 的执行型变体
> (`that blocks the session inside Claude Code`)不含本次基线的任何 token,却含
> `Claude Code`。若 Q4 取 (a),这 38 处(19×2)需并入本 key 的 `execution` 变体。

#### 5. `host.teams_step_note` — NEW(30 处,全 C-TPL)

claude 逐字 = `TEAMS_STEP_EN`(`:173-174`)与 `TEAMS_STEP_ZH`(`:176-177`)常量全文,
整段包含四条 CC 专属事实:隐式成团 / 无建团工具 / `team_name` 被忽略 / 按名 shutdown。

codex 草稿(en):

```
4. If `parallelism.escalate_to_teams === true`: spawn one agent per fired sub with
`spawn_agent(task_name: <sub>, message: <that sub's `harnessed prompt <sub>` prompt>)`.
Coordinate with `send_input(target, items)`; `wait_agent` blocks until one finishes and
`list_agents` enumerates the running set. When a sub is finished, close it with
`close_agent`. Still checkpoint each sub (`complete` / `fail`) as below.
TODO(未验证): codex agent lifecycle — whether agents are session-scoped, whether anything
is cleaned up automatically on exit, and whether an agent may spawn another. Do not rely
on any of it until measured.
```

codex 草稿(zh):

```
4. 若 `parallelism.escalate_to_teams === true`:对每个 fired sub 用
`spawn_agent(task_name: <sub>, message: <该 sub 的 `harnessed prompt <sub>` prompt>)` spawn
一个 agent。用 `send_input(target, items)` 协调;`wait_agent` 阻塞等待其中一个结束,
`list_agents` 列出运行中的集合。某个 sub 完成后用 `close_agent` 关闭它。
每个 sub 仍按下方 checkpoint(`complete` / `fail`)。
TODO(未验证):codex agent 的生命周期 —— 是否 session-scoped、退出时是否自动清理、
能否嵌套 spawn。实测之前不得依赖。
```

**必须删掉的一句**:claude 版开头的 `read ~/.claude/rules/agent-teams.md` ——
codex 上该文件不存在(findings F7b 已就 S2 同一问题定调:codex 变体不引用外部文件,
改为内联要点)。

#### 6. `host.teams_teardown_note` — NEW(2 处 C-TPL,仅 `auto` 渲染)

claude 逐字 = `TEAMS_TEARDOWN_EN` / `TEAMS_TEARDOWN_ZH` 两条 bullet 全文
(`:181-189`)。含 CC 专属事实:团目录 session 退出自动删除 / 无 teardown 工具 /
Agent Teams 是 session-scoped / `/resume` 丢失 / 与 `-p` 不兼容 / issue #7 挂 11 小时。

codex 草稿(en):

```
   - **Close every agent before you finish — MUST-in-finally, not best-effort**: regardless
     of whether every sub reached COMPLETE, call `close_agent` for each agent you spawned
     and confirm it stopped. An agent you never closed keeps consuming tokens.
     TODO(未验证): whether codex reclaims running agents on session exit — this note
     deliberately asserts nothing about it, so close them explicitly.
   - **Headless runs sequentially**: in a headless run `harnessed gates` already returns
     `escalate_to_teams: false`. Run the fired subs sequentially in-session instead of
     spawning agents.
```

(zh 草稿同构,略 —— T6 落表时逐句对译。)

⚠️ 第二条 bullet 的 claude 版把 `escalate_to_teams: false` 的**理由**写成
「Agent Teams 是 session-scoped、`/resume` 即丢、与 `-p` 不兼容」。codex 侧理由未知,
草稿只陈述**行为**(gates 返回 false)不陈述**理由**。

#### 7. `host.delivery_contract_note` — NEW(2 处 C-TPL,仅 `research` 渲染)

claude 逐字 = `DELIVERY_CONTRACT_EN`(`:162-163`)/ `DELIVERY_CONTRACT_ZH`(`:165-166`)。
核心断言:**named/background teammate 的最终消息被平台丢弃**,只有阻塞调用才返回文本。

codex 草稿(en):

```
delivery contract: instruct the agent to write its findings to a file (and read it back),
or to return them with `send_input` to this session; call `wait_agent` before you read.
TODO(未验证): whether codex hands a spawned agent's final text back to the caller —
until measured, do not rely on it, so that the COMPLETE promise and the findings reach
you by file or by `send_input` either way.
```

(zh 草稿同构。)

#### 8. `host.delivery_contract_note.checklist` — NEW(2 处 C-INLINE)

`role-prompts.yaml:535` / `role-prompts.zh-Hans.yaml:509` 的 checklist 单行版,
断言与 #7 相同但措辞不同 → 作为 #7 的 `checklist` 变体,**不复用 #7 的整段**。

claude 逐字(en):

```
Delivery contract: a named/background teammate's FINAL message is discarded by the platform — every finding must arrive via SendMessage to the lead or be written to a file the lead reads back; never rely on the teammate's last output
```

codex 草稿(en):

```
Delivery contract: every finding must arrive via `send_input` to the lead or be written to a file the lead reads back; call `wait_agent` before reading. TODO(未验证): whether codex returns a spawned agent's final message to the lead — do not rely on it.
```

#### 9. `host.teams_cleanup_note` — NEW(2 处 C-INLINE + 6 处 C?)

⚠️ **本 key 需要按站点分变体** —— 各站点的 claude 原文措辞**不同**,不能共用一个
verbatim 值:

| 变体 | 站点 | 处数 | claude 原文要点 |
| ---- | ---- | ---- | --------------- |
| `.deliver` | `task/deliver/SKILL{,.zh-Hans}.md:79` | 2 | 「lead 按名请求每个 teammate shut down;CC 2.1.178+ 无 teardown 工具,团目录 session 退出时自动清理」 |
| `.multispec` | `verify/multispec/SKILL.md:39` / `.zh-Hans.md:38` | 2 | 「团目录在 session 退出时自动清理,无独立 teardown 工具,剩下的纪律是别把 teammate 落在运行态」 |
| (待 Q2) | `parallelism-gate.yaml:4`、`deliver/workflow.yaml:48,49`、`multispec/workflow.yaml:14,26` | 6 | 不渲染面 |

codex 侧所有变体共享同一条骨架:

```
收尾前对每个 spawn 出来的 agent 调 `close_agent` 并确认它停了。
TODO(未验证):codex 是否在 session 退出时回收运行中的 agent —— 未实测,所以显式关闭。
```

#### 10. `host.multispec_spawn_note` — NEW(4 处 C-INLINE)

站点:`verify/multispec/SKILL.md:36`(2 token)/ `.zh-Hans.md:35`(2 token)。

claude 逐字(en):

```
`Agent(name, run_in_background=true)` — the team forms implicitly on the FIRST spawn (CC
2.1.178+ has no create step / no create tool), teammates 互相 SendMessage 质询 findings 是否
真问题 (NOT fire-and-forget)
```

codex 草稿(en):

```
`spawn_agent(task_name: <specialist>, message: <brief>)` ×4 — there is no create step;
the four agents cross-question each other's findings with `send_input` (NOT
fire-and-forget)
```

(zh 草稿同构。)

### B 类 —— 不占位符化,补 codex 侧注册条目(T7)

27 处,全部是 `capabilities.yaml` Bucket 5 的注册事实,或正文里对该注册表的逐字复述
(`verify/multispec/SKILL{,.zh-Hans}.md` 的 `## Capability refs` 节)。

| capability | claude(现值) | codex(建议新增) |
| ---------- | ------------- | ----------------- |
| `agent-teams-create` | `impl: claude-platform`<br>`cmd: 'Agent(name, run_in_background=true)'` | `impl: codex-platform`<br>`cmd: 'spawn_agent(task_name, message)'` |
| `agent-teams-send-message` | `impl: claude-platform`<br>`cmd: SendMessage` | `impl: codex-platform`<br>`cmd: send_input` |
| `agent-teams-shutdown` | `impl: claude-platform`<br>`cmd: 'ask the <teammate-name> teammate to shut down'` | `impl: codex-platform`<br>`cmd: close_agent` |

只有 `cmd:` 两处(`:606` / `:622`)会真正渲染进 prompt
(`src/cli/prompt.ts:83` 的 `Invoke \`<cmd>\``);其余 25 处是注释 / `description:` /
正文复述,渲染面为零(见 Q2)。

`agent-teams-shutdown` 的 codex 值从「一句自然语言请求」变成「一个真工具名」——
`capabilityResolver` 按宿主选值后,`verify-multispec` phase 02 的语义从「确认都停了」
变成「调用 `close_agent`」。这是 codex 侧更强的保证,但**不要**顺势把 claude 侧
的 phase 描述也改掉(金标)。

> 额外注意(不在 236 内):`verify/multispec/SKILL{,.zh-Hans}.md` 的 phase 表里已有
> `{{ capabilities.agent-teams-create.cmd }}` / `{{ capabilities.agent-teams-shutdown.cmd }}`
> 占位符。它们今天渲染成 CC 原语,T7 补完 codex 条目后自动按宿主取值 —— 无需在
> T4/T6 里动它们。

### 词表规模小结

| | 数量 |
| - | ---- |
| primitive | **9**(A 类 3 + C 类 6) |
| 可寻址占位符(含 variant) | **12**(A 类 5 + C 类 7) |
| 其中 T2 骨架已有 | 2 primitive / 3 占位符 |
| 待 T2 续填 | 7 primitive / 9 占位符 |
| B 类 codex 注册条目 | 3 capability × (`impl` + `cmd`) |
| 需按站点再分变体的 key | 1(`host.teams_cleanup_note`,3 个变体) |

---
---

# 增量扩写 —— Q4 裁定后的新 token 范围(2026-09-24 第二轮)

> 本节**增量追加**,上方 236 处台账与编号(#1-#236)原样保留未动。
> 新增行用 `D` 前缀编号(D1-D280),与旧编号不冲突。

## 裁定执行确认

| 裁定 | 本轮执行 |
| ---- | -------- |
| Q1 采纳正交两轴 | `C-TPL` 标法保留;新增行沿用同一标法 |
| Q2 不渲染面 → allowlist | 新增 **31 处** 标 `ALLOWLIST`(不改措辞);旧台账的 `A?` / `C?` 24 处同并入 allowlist |
| Q3 决策编号保留、描述原语化 | 旧台账 7 处 `?` 改判 → `D-11 — {{ host.team }} 升级 5 触发 OR-chain`,**不进 allowlist**;ADR 正文零改动 |
| Q4 全部纳入 | 5 类新 token 全扫,见下 |

> Q3 的 7 处在旧表里仍标 `?`(未重排旧表,按约定)。裁定后的类别是 **A-INLINE / key = `host.team`**,
> 站点:`task/deliver/SKILL.md:132`、`task/deliver/SKILL.zh-Hans.md:29,131`、
> `verify/multispec/SKILL.md:27,98`、`verify/multispec/SKILL.zh-Hans.md:27,96`。

## 新 token 扫描口径

```
rg -n "CC-native|Claude Code|\bteammate\b|\bteammates\b|AskUserQuestion|~/\.claude/" workflows/
```

两点口径修正(与你给的数字的差异,先说清):

1. **`teammate` 用词边界而非子串**。子串计数 131,词边界计数 `teammate` 118 + `teammates` 5 = **123**。
   差的 8 处全是同一个**标识符** `teammate_send_message_needed` —— 那是
   `src/cli/lib/gateContext.ts:28-29` 读的 gate fact key,**不是行文**,改名会改判据。
   已整体排除,不进台账。
2. `teammates`(复数)单列,需要 `host.teammate.plural` 变体。

扫描结果:**70 文件 / 371 处命中**。

## 去重

| | 处数 |
| --- | --- |
| 扫描命中 | 371 |
| − 已落在既有 C 类整段 span 内(由该 key 一并承载) | **91** |
| = **新增处数** | **280** |

91 处 dedup 的分布:`teammate` 50 / `Claude Code` 29 / `~/.claude/` 10 / `teammates` 2。
它们落在 `host.teams_step_note`(含全部 10 处 `~/.claude/rules/agent-teams.md`)、
`host.harnessed_run_warning_note`、`host.teams_teardown_note`、
`host.delivery_contract_note*`、`host.teams_cleanup_note*`、`host.multispec_spawn_note` 里。

## 280 处新增的分类

| 类别 | 处数 | 面 | 处理 |
| ---- | ---- | -- | ---- |
| **NEW-A-TPL** | **168** | 生成器 span | 改 builder 再重跑(批 A) |
| **NEW-A-INLINE** | **33** | 渲染面正文 | 手改(批 B / 批 C) |
| **NEW-C-INLINE** | **13** | 渲染面正文 | 整段入表(批 B / 批 C) |
| **ALLOWLIST** | **31** | 不渲染 | 不改,进门 allowlist |
| **B-covered** | **6** | 渲染面 | 已被 B 类 codex `cmd` 值吸收,不另立 key |
| **NEW-?** | **24** | 渲染面 | `Claude Code plugin`,见 Q5 |
| **NEW-?-doc** | **5** | 不渲染 | 同 Q5,但本行不渲染 |
| **合计** | **280** | | |

**实际需要动手的 = 168 + 33 + 13 = 214 处**(Q5 裁定后可能再 +24)。

### NEW-A-TPL 168 处的 builder 归属

| builder / 站点 | token | 每次渲染 | 渲染数 | 命中 |
| -------------- | ----- | -------- | ------ | ---- |
| `executionEn:304` | `CC-native` | 1 | 19 | 19 |
| `executionZh:327` | `CC-native` | 1 | 19 | 19 |
| `spawnLoopEn:139` | `CC-native` | 1 | 19+5 | 24 |
| `spawnLoopZh:151` | `CC-native` | 1 | 19+5 | 24 |
| `orchestratorEn:223` | `CC-native` | 1 | 5 | 5 |
| `orchestratorZh:266` | `CC-native` | 1 | 5 | 5 |
| `executionEn:311` step 3 | `AskUserQuestion` | 1 | 19 | 19 |
| `executionZh:334` step 3 | `AskUserQuestion` | 1 | 19 | 19 |
| `orchestratorEn:239` step 5c | `AskUserQuestion` | 1 | 5 | 5 |
| `orchestratorZh:282` step 5c | `AskUserQuestion` | 1 | 5 | 5 |
| `orchestratorEn:209-210` step 1 | `AskUserQuestion` | 2(isAuto)/ 1 | 1 + 4 | 6 |
| `orchestratorZh:253-254` step 1 | `AskUserQuestion` | 2(isAuto)/ 1 | 1 + 4 | 6 |
| `interactiveEn:358-359` step 2 | `AskUserQuestion` | 2(isMaster)/ 1 | 1 + 4 | 6 |
| `interactiveZh:396-397` step 2 | `AskUserQuestion` | 2(isMaster)/ 1 | 1 + 4 | 6 |
| | | | **合计** | **168** |

**新面**:`interactiveEn` / `interactiveZh` 在第一轮(236)是**零命中**,本轮因
`AskUserQuestion` 首次进入范围。5 个 interactive 渲染:
`discuss`(= `discuss/auto`,isMaster)/ `discuss-strategic` / `discuss-phase` /
`discuss-subtask` / `task-clarify`。批 A 的 builder 覆盖面因此从 6 个函数扩到 **8 个**。

`CC-native` 96 处与第一轮 `Task / Agent` 的 96 处**逐站点一一对应**(同一句)。

### en / zh 配对(增量部分)

40 组逐组对账,**真实漂移 = 0**。3 组计数不等,全部有解释:

| 分组 | en | zh | 原因 |
| ---- | -- | -- | ---- |
| `role-prompts.*` | 12 | 11 | en `:5` 是 en 侧独有的文件头注释(`# time (Claude Code slash command install path).`)→ ALLOWLIST,无需对齐 |
| `verify/multispec/SKILL.*` | 14 | 12 | 两侧同一段落的**折行位置不同**:en `:35/:38/:40` 与 zh `:35/:37/:39` 属 `host.multispec_spawn_note` + `host.teams_cleanup_note.multispec` 两个整段,整段内容对等 |
| `capabilities` / `language` / 3 个 `judgments` / 4 个 `workflow.yaml` | 32 | 0 | 单 locale 文件,无 zh 兄弟(`workflows/disciplines/language.yaml` 亦然 —— `prompt.ts:198` 注释明写「Reads the en base」) |

其余 37 组全部 en == zh ✅。

加上第一轮:**全 phase 真实 en/zh 漂移 = 0**;唯一待修的是
`task/deliver/SKILL.md:28-29` 的折行(第一轮已记),它让门的两侧计数不一致。

---

## STATUS: NEEDS_CLARIFICATION(第二轮,1 条)

### Q5 —— `Claude Code plugin`(29 处)不是宿主原语命名,是**分发渠道事实**

29 处(渲染面 24 + 不渲染 5),站点:

| 文件 | 处数 | 渲染 |
| ---- | ---- | ---- |
| `workflows/task/code/SKILL{,.zh-Hans}.md` | 10 | 是 |
| `workflows/task/deliver/SKILL{,.zh-Hans}.md` | 8 | 是 |
| `workflows/plan/phase/SKILL{,.zh-Hans}.md` | 6 | 是 |
| `workflows/capabilities.yaml:511,520` | 2 | 否(注释 + `description`) |
| `workflows/{task/code,plan/phase}/workflow.yaml` | 3 | 否 |

典型原文:

```
02-progress-mark invokes Claude Code plugin slash cmd `/plan` to mark subtask complete
requires the `planning-with-files` Claude Code plugin to be installed via the
Claude Code plugin marketplace; outputs: task_plan.md + progress.md + findings.md
```

**为什么不能套 `{{ host.name }}`**:渲染成 `Codex plugin` / `Codex plugin marketplace`
会凭空造出一个**不存在的事物**。findings F8 已实测 codex 上 `pluginsRegistry: null`
(`platform.ts:135`)→ `readInstalledPlugins` 返回空集 → **每个 `install_type: plugin`
的能力在 codex 上都告警**,`planning-with-files` 正是其中之一。
而 task_plan「不做」节明写:F8 不在 Phase 65 修。

三个候选,我不自决:

- **(a) 整段变体**:立 `host.plugin_install_note`,claude 侧逐字保留,codex 侧写
  `TODO(未验证):codex 上 planning-with-files 的获取方式未定(F8 的 plugin 告警未修),
  此步在 codex 上可能不可用`。诚实,但会在 codex 产物里留 3 个 TODO。
- **(b) 降为宿主中立措辞**:`Claude Code plugin slash cmd \`/plan\`` →
  `the \`/plan\` slash command (provided by \`planning-with-files\`)`,两宿主同文,
  不提分发渠道。**claude 侧金标会变** —— 需要你确认这属于「可接受的内容变更」
  而非「金标必须逐字节不变」。
- **(c) 移出 Phase 65**:归入 F8 的 TODO,本 phase 的 T11 门把 `Claude Code plugin`
  加进 allowlist(按短语而非按 `Claude Code` 整词),等 F8 修时一并处理。

我的倾向是 **(c)**:它和 F8 是同一个问题的两半(正文说「装这个 plugin」+ 运行时
「这个 plugin 在 codex 上必然告警」),分开修会先产出一份自相矛盾的 codex 产物。
但这会让 T11 的 allowlist 多一条短语例外 —— 需要你点头。

> 注意:**`Claude Code` 的其余 35 处与本问题无关**,照常按 `host.name` 处理
> (`disciplines/language.yaml:15,33`、`judgments/*`、`role-prompts.yaml:5` 等)。
> 29 + 35 = 64 ✅ 与总数一致。

---

## 增量台账(D1-D280)

#### `workflows/auto/SKILL.md` — 5 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D1 | `workflows/auto/SKILL.md`:117 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `orchestratorEn` 渲染 — 禁止手改 |
| D2 | `workflows/auto/SKILL.md`:122 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorEn(isAuto)` 渲染 — 禁止手改 |
| D3 | `workflows/auto/SKILL.md`:122 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorEn(isAuto)` 渲染 — 禁止手改 |
| D4 | `workflows/auto/SKILL.md`:133 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D5 | `workflows/auto/SKILL.md`:137 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorEn` 渲染 — 禁止手改 |

#### `workflows/auto/SKILL.zh-Hans.md` — 5 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D6 | `workflows/auto/SKILL.zh-Hans.md`:115 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `orchestratorZh` 渲染 — 禁止手改 |
| D7 | `workflows/auto/SKILL.zh-Hans.md`:120 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorZh(isAuto)` 渲染 — 禁止手改 |
| D8 | `workflows/auto/SKILL.zh-Hans.md`:120 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorZh(isAuto)` 渲染 — 禁止手改 |
| D9 | `workflows/auto/SKILL.zh-Hans.md`:131 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D10 | `workflows/auto/SKILL.zh-Hans.md`:135 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorZh` 渲染 — 禁止手改 |

#### `workflows/capabilities.yaml` — 21 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D11 | `workflows/capabilities.yaml`:511 | `Claude Code` | **NEW-?-doc** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5;且本行不渲染 |
| D12 | `workflows/capabilities.yaml`:520 | `Claude Code` | **NEW-?-doc** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5;且本行不渲染 |
| D13 | `workflows/capabilities.yaml`:587 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D14 | `workflows/capabilities.yaml`:590 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D15 | `workflows/capabilities.yaml`:590 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D16 | `workflows/capabilities.yaml`:592 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D17 | `workflows/capabilities.yaml`:592 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D18 | `workflows/capabilities.yaml`:599 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D19 | `workflows/capabilities.yaml`:601 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D20 | `workflows/capabilities.yaml`:602 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D21 | `workflows/capabilities.yaml`:610 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D22 | `workflows/capabilities.yaml`:610 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D23 | `workflows/capabilities.yaml`:626 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D24 | `workflows/capabilities.yaml`:631 | `teammate` | **B-covered** | — | `cmd: 'ask the <teammate-name> teammate to shut down'` —— 会渲染,但已是 B 类注册值;codex 侧 `cmd: close_agent` 一并解决,**不**走 host.teammate |
| D25 | `workflows/capabilities.yaml`:631 | `teammate` | **B-covered** | — | `cmd: 'ask the <teammate-name> teammate to shut down'` —— 会渲染,但已是 B 类注册值;codex 侧 `cmd: close_agent` 一并解决,**不**走 host.teammate |
| D26 | `workflows/capabilities.yaml`:635 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D27 | `workflows/capabilities.yaml`:636 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D28 | `workflows/capabilities.yaml`:638 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D29 | `workflows/capabilities.yaml`:638 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D30 | `workflows/capabilities.yaml`:1261 | `~/.claude/` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D31 | `workflows/capabilities.yaml`:1264 | `CC-native` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |

#### `workflows/disciplines/karpathy.yaml` — 1 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D32 | `workflows/disciplines/karpathy.yaml`:65 | `~/.claude/` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |

#### `workflows/disciplines/karpathy.zh-Hans.yaml` — 1 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D33 | `workflows/disciplines/karpathy.zh-Hans.yaml`:63 | `~/.claude/` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |

#### `workflows/disciplines/language.yaml` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D34 | `workflows/disciplines/language.yaml`:15 | `Claude Code` | **NEW-A-INLINE** | `host.name` | 渲染面正文,token 级替换 |
| D35 | `workflows/disciplines/language.yaml`:33 | `Claude Code` | **NEW-A-INLINE** | `host.name` | 渲染面正文,token 级替换 |

#### `workflows/discuss/auto/SKILL.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D36 | `workflows/discuss/auto/SKILL.md`:68 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `interactiveEn` 渲染 — 禁止手改 |
| D37 | `workflows/discuss/auto/SKILL.md`:68 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `interactiveEn` 渲染 — 禁止手改 |

#### `workflows/discuss/auto/SKILL.zh-Hans.md` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D38 | `workflows/discuss/auto/SKILL.zh-Hans.md`:67 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `interactiveZh` 渲染 — 禁止手改 |
| D39 | `workflows/discuss/auto/SKILL.zh-Hans.md`:67 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `interactiveZh` 渲染 — 禁止手改 |

#### `workflows/discuss/phase/SKILL.md` — 1 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D40 | `workflows/discuss/phase/SKILL.md`:64 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `interactiveEn` 渲染 — 禁止手改 |

#### `workflows/discuss/phase/SKILL.zh-Hans.md` — 1 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D41 | `workflows/discuss/phase/SKILL.zh-Hans.md`:63 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `interactiveZh` 渲染 — 禁止手改 |

#### `workflows/discuss/strategic/SKILL.md` — 1 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D42 | `workflows/discuss/strategic/SKILL.md`:68 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `interactiveEn` 渲染 — 禁止手改 |

#### `workflows/discuss/strategic/SKILL.zh-Hans.md` — 1 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D43 | `workflows/discuss/strategic/SKILL.zh-Hans.md`:67 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `interactiveZh` 渲染 — 禁止手改 |

#### `workflows/discuss/subtask/SKILL.md` — 1 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D44 | `workflows/discuss/subtask/SKILL.md`:69 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `interactiveEn` 渲染 — 禁止手改 |

#### `workflows/discuss/subtask/SKILL.zh-Hans.md` — 1 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D45 | `workflows/discuss/subtask/SKILL.zh-Hans.md`:68 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `interactiveZh` 渲染 — 禁止手改 |

#### `workflows/judgments/parallelism-gate.yaml` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D46 | `workflows/judgments/parallelism-gate.yaml`:29 | `Claude Code` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D47 | `workflows/judgments/parallelism-gate.yaml`:30 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |

#### `workflows/judgments/web-search-routing.yaml` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D48 | `workflows/judgments/web-search-routing.yaml`:53 | `Claude Code` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D49 | `workflows/judgments/web-search-routing.yaml`:55 | `Claude Code` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |

#### `workflows/plan/architecture/SKILL.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D50 | `workflows/plan/architecture/SKILL.md`:64 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D51 | `workflows/plan/architecture/SKILL.md`:70 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D52 | `workflows/plan/architecture/SKILL.md`:74 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/plan/architecture/SKILL.zh-Hans.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D53 | `workflows/plan/architecture/SKILL.zh-Hans.md`:63 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D54 | `workflows/plan/architecture/SKILL.zh-Hans.md`:69 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D55 | `workflows/plan/architecture/SKILL.zh-Hans.md`:73 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

#### `workflows/plan/auto/SKILL.md` — 4 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D56 | `workflows/plan/auto/SKILL.md`:65 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `orchestratorEn` 渲染 — 禁止手改 |
| D57 | `workflows/plan/auto/SKILL.md`:70 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorEn` 渲染 — 禁止手改 |
| D58 | `workflows/plan/auto/SKILL.md`:79 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D59 | `workflows/plan/auto/SKILL.md`:83 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorEn` 渲染 — 禁止手改 |

#### `workflows/plan/auto/SKILL.zh-Hans.md` — 4 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D60 | `workflows/plan/auto/SKILL.zh-Hans.md`:64 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `orchestratorZh` 渲染 — 禁止手改 |
| D61 | `workflows/plan/auto/SKILL.zh-Hans.md`:69 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorZh` 渲染 — 禁止手改 |
| D62 | `workflows/plan/auto/SKILL.zh-Hans.md`:78 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D63 | `workflows/plan/auto/SKILL.zh-Hans.md`:82 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorZh` 渲染 — 禁止手改 |

#### `workflows/plan/phase/SKILL.md` — 6 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D64 | `workflows/plan/phase/SKILL.md`:5 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D65 | `workflows/plan/phase/SKILL.md`:37 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D66 | `workflows/plan/phase/SKILL.md`:38 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D67 | `workflows/plan/phase/SKILL.md`:66 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D68 | `workflows/plan/phase/SKILL.md`:72 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D69 | `workflows/plan/phase/SKILL.md`:76 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/plan/phase/SKILL.zh-Hans.md` — 6 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D70 | `workflows/plan/phase/SKILL.zh-Hans.md`:5 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D71 | `workflows/plan/phase/SKILL.zh-Hans.md`:37 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D72 | `workflows/plan/phase/SKILL.zh-Hans.md`:37 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D73 | `workflows/plan/phase/SKILL.zh-Hans.md`:65 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D74 | `workflows/plan/phase/SKILL.zh-Hans.md`:71 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D75 | `workflows/plan/phase/SKILL.zh-Hans.md`:75 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

#### `workflows/plan/phase/workflow.yaml` — 1 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D76 | `workflows/plan/phase/workflow.yaml`:18 | `Claude Code` | **NEW-?-doc** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5;且本行不渲染 |

#### `workflows/research/SKILL.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D77 | `workflows/research/SKILL.md`:59 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D78 | `workflows/research/SKILL.md`:65 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D79 | `workflows/research/SKILL.md`:70 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/research/SKILL.zh-Hans.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D80 | `workflows/research/SKILL.zh-Hans.md`:57 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D81 | `workflows/research/SKILL.zh-Hans.md`:63 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D82 | `workflows/research/SKILL.zh-Hans.md`:68 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

#### `workflows/retro/SKILL.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D83 | `workflows/retro/SKILL.md`:59 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D84 | `workflows/retro/SKILL.md`:65 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D85 | `workflows/retro/SKILL.md`:69 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/retro/SKILL.zh-Hans.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D86 | `workflows/retro/SKILL.zh-Hans.md`:58 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D87 | `workflows/retro/SKILL.zh-Hans.md`:64 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D88 | `workflows/retro/SKILL.zh-Hans.md`:68 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

#### `workflows/role-prompts.yaml` — 12 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D89 | `workflows/role-prompts.yaml`:5 | `Claude Code` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D90 | `workflows/role-prompts.yaml`:191 | `AskUserQuestion` | **NEW-A-INLINE** | `host.ask_user` | 渲染面正文,token 级替换 |
| D91 | `workflows/role-prompts.yaml`:376 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D92 | `workflows/role-prompts.yaml`:377 | `teammate` | **NEW-C-INLINE** | `host.teams_cleanup_note.checklist` | 整条断言「CC 2.1.178+ 无 delete 工具 / 团目录 session 退出自动删除」= CC 事实 → 新整段 key(task-deliver checklist) |
| D93 | `workflows/role-prompts.yaml`:377 | `teammate` | **NEW-C-INLINE** | `host.teams_cleanup_note.checklist` | 同行第 2 token |
| D94 | `workflows/role-prompts.yaml`:526 | `teammates` | **NEW-A-INLINE** | `host.teammate.plural` | 渲染面正文,token 级替换 |
| D95 | `workflows/role-prompts.yaml`:530 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D96 | `workflows/role-prompts.yaml`:533 | `teammates` | **NEW-A-INLINE** | `host.teammate.plural` | 渲染面正文,token 级替换 |
| D97 | `workflows/role-prompts.yaml`:534 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D98 | `workflows/role-prompts.yaml`:536 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D99 | `workflows/role-prompts.yaml`:538 | `teammates` | **NEW-C-INLINE** | `host.teams_cleanup_note.multispec_checklist` | 整条断言「no delete tool exists / team dirs removed at session exit」= CC 事实 → 新整段 key(verify-multispec checklist) |
| D100 | `workflows/role-prompts.yaml`:538 | `teammate` | **NEW-C-INLINE** | `host.teams_cleanup_note.multispec_checklist` | 同行第 2 token |

#### `workflows/role-prompts.zh-Hans.yaml` — 11 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D101 | `workflows/role-prompts.zh-Hans.yaml`:177 | `AskUserQuestion` | **NEW-A-INLINE** | `host.ask_user` | 渲染面正文,token 级替换 |
| D102 | `workflows/role-prompts.zh-Hans.yaml`:353 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D103 | `workflows/role-prompts.zh-Hans.yaml`:354 | `teammate` | **NEW-C-INLINE** | `host.teams_cleanup_note.checklist` | 整条断言「CC 2.1.178+ 无 delete 工具 / 团目录 session 退出自动删除」= CC 事实 → 新整段 key(task-deliver checklist) |
| D104 | `workflows/role-prompts.zh-Hans.yaml`:354 | `teammate` | **NEW-C-INLINE** | `host.teams_cleanup_note.checklist` | 同行第 2 token |
| D105 | `workflows/role-prompts.zh-Hans.yaml`:501 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D106 | `workflows/role-prompts.zh-Hans.yaml`:504 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D107 | `workflows/role-prompts.zh-Hans.yaml`:507 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D108 | `workflows/role-prompts.zh-Hans.yaml`:508 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D109 | `workflows/role-prompts.zh-Hans.yaml`:510 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D110 | `workflows/role-prompts.zh-Hans.yaml`:512 | `teammate` | **NEW-C-INLINE** | `host.teams_cleanup_note.multispec_checklist` | 整条断言「no delete tool exists / team dirs removed at session exit」= CC 事实 → 新整段 key(verify-multispec checklist) |
| D111 | `workflows/role-prompts.zh-Hans.yaml`:512 | `teammate` | **NEW-C-INLINE** | `host.teams_cleanup_note.multispec_checklist` | 同行第 2 token |

#### `workflows/ship/auto/SKILL.md` — 4 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D112 | `workflows/ship/auto/SKILL.md`:59 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `orchestratorEn` 渲染 — 禁止手改 |
| D113 | `workflows/ship/auto/SKILL.md`:64 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorEn` 渲染 — 禁止手改 |
| D114 | `workflows/ship/auto/SKILL.md`:73 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D115 | `workflows/ship/auto/SKILL.md`:77 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorEn` 渲染 — 禁止手改 |

#### `workflows/ship/auto/SKILL.zh-Hans.md` — 4 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D116 | `workflows/ship/auto/SKILL.zh-Hans.md`:57 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `orchestratorZh` 渲染 — 禁止手改 |
| D117 | `workflows/ship/auto/SKILL.zh-Hans.md`:62 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorZh` 渲染 — 禁止手改 |
| D118 | `workflows/ship/auto/SKILL.zh-Hans.md`:71 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D119 | `workflows/ship/auto/SKILL.zh-Hans.md`:75 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorZh` 渲染 — 禁止手改 |

#### `workflows/ship/preflight/SKILL.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D120 | `workflows/ship/preflight/SKILL.md`:51 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D121 | `workflows/ship/preflight/SKILL.md`:57 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D122 | `workflows/ship/preflight/SKILL.md`:61 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/ship/preflight/SKILL.zh-Hans.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D123 | `workflows/ship/preflight/SKILL.zh-Hans.md`:48 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D124 | `workflows/ship/preflight/SKILL.zh-Hans.md`:54 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D125 | `workflows/ship/preflight/SKILL.zh-Hans.md`:58 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

#### `workflows/task/auto/SKILL.md` — 4 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D126 | `workflows/task/auto/SKILL.md`:75 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `orchestratorEn` 渲染 — 禁止手改 |
| D127 | `workflows/task/auto/SKILL.md`:80 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorEn` 渲染 — 禁止手改 |
| D128 | `workflows/task/auto/SKILL.md`:89 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D129 | `workflows/task/auto/SKILL.md`:93 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorEn` 渲染 — 禁止手改 |

#### `workflows/task/auto/SKILL.zh-Hans.md` — 4 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D130 | `workflows/task/auto/SKILL.zh-Hans.md`:74 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `orchestratorZh` 渲染 — 禁止手改 |
| D131 | `workflows/task/auto/SKILL.zh-Hans.md`:79 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorZh` 渲染 — 禁止手改 |
| D132 | `workflows/task/auto/SKILL.zh-Hans.md`:88 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D133 | `workflows/task/auto/SKILL.zh-Hans.md`:92 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorZh` 渲染 — 禁止手改 |

#### `workflows/task/clarify/SKILL.md` — 1 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D134 | `workflows/task/clarify/SKILL.md`:69 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `interactiveEn` 渲染 — 禁止手改 |

#### `workflows/task/clarify/SKILL.zh-Hans.md` — 1 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D135 | `workflows/task/clarify/SKILL.zh-Hans.md`:66 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `interactiveZh` 渲染 — 禁止手改 |

#### `workflows/task/code/SKILL.md` — 8 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D136 | `workflows/task/code/SKILL.md`:7 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D137 | `workflows/task/code/SKILL.md`:63 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D138 | `workflows/task/code/SKILL.md`:66 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D139 | `workflows/task/code/SKILL.md`:66 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D140 | `workflows/task/code/SKILL.md`:78 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D141 | `workflows/task/code/SKILL.md`:84 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D142 | `workflows/task/code/SKILL.md`:88 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D143 | `workflows/task/code/SKILL.md`:98 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |

#### `workflows/task/code/SKILL.zh-Hans.md` — 8 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D144 | `workflows/task/code/SKILL.zh-Hans.md`:7 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D145 | `workflows/task/code/SKILL.zh-Hans.md`:63 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D146 | `workflows/task/code/SKILL.zh-Hans.md`:66 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D147 | `workflows/task/code/SKILL.zh-Hans.md`:66 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D148 | `workflows/task/code/SKILL.zh-Hans.md`:76 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D149 | `workflows/task/code/SKILL.zh-Hans.md`:82 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D150 | `workflows/task/code/SKILL.zh-Hans.md`:86 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D151 | `workflows/task/code/SKILL.zh-Hans.md`:96 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |

#### `workflows/task/code/workflow.yaml` — 2 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D152 | `workflows/task/code/workflow.yaml`:7 | `Claude Code` | **NEW-?-doc** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5;且本行不渲染 |
| D153 | `workflows/task/code/workflow.yaml`:24 | `Claude Code` | **NEW-?-doc** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5;且本行不渲染 |

#### `workflows/task/deliver/SKILL.md` — 10 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D154 | `workflows/task/deliver/SKILL.md`:8 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D155 | `workflows/task/deliver/SKILL.md`:73 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D156 | `workflows/task/deliver/SKILL.md`:75 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D157 | `workflows/task/deliver/SKILL.md`:81 | `teammate` | **NEW-C-INLINE** | `host.teams_cleanup_note.deliver` | 与 236 台账 `:79` 同一整段的续行 —— 由同一 key 承载,不新增 key |
| D158 | `workflows/task/deliver/SKILL.md`:98 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D159 | `workflows/task/deliver/SKILL.md`:100 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D160 | `workflows/task/deliver/SKILL.md`:101 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D161 | `workflows/task/deliver/SKILL.md`:112 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D162 | `workflows/task/deliver/SKILL.md`:118 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D163 | `workflows/task/deliver/SKILL.md`:122 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/task/deliver/SKILL.zh-Hans.md` — 10 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D164 | `workflows/task/deliver/SKILL.zh-Hans.md`:8 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D165 | `workflows/task/deliver/SKILL.zh-Hans.md`:73 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D166 | `workflows/task/deliver/SKILL.zh-Hans.md`:75 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D167 | `workflows/task/deliver/SKILL.zh-Hans.md`:81 | `teammate` | **NEW-C-INLINE** | `host.teams_cleanup_note.deliver` | 同上;en 同位 `:81` |
| D168 | `workflows/task/deliver/SKILL.zh-Hans.md`:98 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D169 | `workflows/task/deliver/SKILL.zh-Hans.md`:100 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D170 | `workflows/task/deliver/SKILL.zh-Hans.md`:101 | `Claude Code` | **NEW-?** | — | **`Claude Code plugin`** —— 陈述 `planning-with-files` 的**分发渠道**,不是宿主原语命名。codex 上该 plugin 不存在(findings F8:`pluginsRegistry: null`,plugin 类能力全告警)。换成 `{{ host.name }} plugin` 会产出「Codex plugin marketplace」这一**不存在的事物**。见 Q5 |
| D171 | `workflows/task/deliver/SKILL.zh-Hans.md`:111 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D172 | `workflows/task/deliver/SKILL.zh-Hans.md`:117 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D173 | `workflows/task/deliver/SKILL.zh-Hans.md`:121 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

#### `workflows/task/deliver/workflow.yaml` — 1 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D174 | `workflows/task/deliver/workflow.yaml`:49 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |

#### `workflows/task/test/SKILL.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D175 | `workflows/task/test/SKILL.md`:105 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D176 | `workflows/task/test/SKILL.md`:111 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D177 | `workflows/task/test/SKILL.md`:115 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/task/test/SKILL.zh-Hans.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D178 | `workflows/task/test/SKILL.zh-Hans.md`:100 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D179 | `workflows/task/test/SKILL.zh-Hans.md`:106 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D180 | `workflows/task/test/SKILL.zh-Hans.md`:110 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

#### `workflows/verify/auto/SKILL.md` — 4 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D181 | `workflows/verify/auto/SKILL.md`:88 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `orchestratorEn` 渲染 — 禁止手改 |
| D182 | `workflows/verify/auto/SKILL.md`:93 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorEn` 渲染 — 禁止手改 |
| D183 | `workflows/verify/auto/SKILL.md`:102 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D184 | `workflows/verify/auto/SKILL.md`:106 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorEn` 渲染 — 禁止手改 |

#### `workflows/verify/auto/SKILL.zh-Hans.md` — 4 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D185 | `workflows/verify/auto/SKILL.zh-Hans.md`:87 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `orchestratorZh` 渲染 — 禁止手改 |
| D186 | `workflows/verify/auto/SKILL.zh-Hans.md`:92 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorZh` 渲染 — 禁止手改 |
| D187 | `workflows/verify/auto/SKILL.zh-Hans.md`:101 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D188 | `workflows/verify/auto/SKILL.zh-Hans.md`:105 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `orchestratorZh` 渲染 — 禁止手改 |

#### `workflows/verify/code-review/SKILL.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D189 | `workflows/verify/code-review/SKILL.md`:60 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D190 | `workflows/verify/code-review/SKILL.md`:66 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D191 | `workflows/verify/code-review/SKILL.md`:70 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/verify/code-review/SKILL.zh-Hans.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D192 | `workflows/verify/code-review/SKILL.zh-Hans.md`:59 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D193 | `workflows/verify/code-review/SKILL.zh-Hans.md`:65 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D194 | `workflows/verify/code-review/SKILL.zh-Hans.md`:69 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

#### `workflows/verify/design/SKILL.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D195 | `workflows/verify/design/SKILL.md`:72 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D196 | `workflows/verify/design/SKILL.md`:78 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D197 | `workflows/verify/design/SKILL.md`:82 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/verify/design/SKILL.zh-Hans.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D198 | `workflows/verify/design/SKILL.zh-Hans.md`:71 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D199 | `workflows/verify/design/SKILL.zh-Hans.md`:77 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D200 | `workflows/verify/design/SKILL.zh-Hans.md`:81 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

#### `workflows/verify/eval-review/SKILL.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D201 | `workflows/verify/eval-review/SKILL.md`:54 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D202 | `workflows/verify/eval-review/SKILL.md`:60 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D203 | `workflows/verify/eval-review/SKILL.md`:64 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/verify/eval-review/SKILL.zh-Hans.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D204 | `workflows/verify/eval-review/SKILL.zh-Hans.md`:53 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D205 | `workflows/verify/eval-review/SKILL.zh-Hans.md`:59 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D206 | `workflows/verify/eval-review/SKILL.zh-Hans.md`:63 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

#### `workflows/verify/multispec/SKILL.md` — 14 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D207 | `workflows/verify/multispec/SKILL.md`:5 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D208 | `workflows/verify/multispec/SKILL.md`:7 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D209 | `workflows/verify/multispec/SKILL.md`:35 | `teammate` | **NEW-C-INLINE** | `host.multispec_spawn_note` | 与 236 台账 `:36` 同一整段的起始行 —— 同 key 承载 |
| D210 | `workflows/verify/multispec/SKILL.md`:38 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D211 | `workflows/verify/multispec/SKILL.md`:40 | `teammate` | **NEW-C-INLINE** | `host.teams_cleanup_note.multispec` | 与 236 台账 `:39` 同一整段的续行 —— 同 key 承载 |
| D212 | `workflows/verify/multispec/SKILL.md`:47 | `teammate` | **B-covered** | — | B 类逐字复述 `agent-teams-shutdown` 的 cmd;随 T7 按宿主渲染 |
| D213 | `workflows/verify/multispec/SKILL.md`:47 | `teammate` | **B-covered** | — | B 类逐字复述 `agent-teams-shutdown` 的 cmd;随 T7 按宿主渲染 |
| D214 | `workflows/verify/multispec/SKILL.md`:48 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D215 | `workflows/verify/multispec/SKILL.md`:49 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D216 | `workflows/verify/multispec/SKILL.md`:50 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D217 | `workflows/verify/multispec/SKILL.md`:51 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D218 | `workflows/verify/multispec/SKILL.md`:79 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D219 | `workflows/verify/multispec/SKILL.md`:85 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D220 | `workflows/verify/multispec/SKILL.md`:89 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/verify/multispec/SKILL.zh-Hans.md` — 12 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D221 | `workflows/verify/multispec/SKILL.zh-Hans.md`:5 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D222 | `workflows/verify/multispec/SKILL.zh-Hans.md`:7 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D223 | `workflows/verify/multispec/SKILL.zh-Hans.md`:39 | `teammate` | **NEW-C-INLINE** | `host.teams_cleanup_note.multispec` | 同上;en 同位 `:40` |
| D224 | `workflows/verify/multispec/SKILL.zh-Hans.md`:46 | `teammate` | **B-covered** | — | 同上;en 同位 `:47` |
| D225 | `workflows/verify/multispec/SKILL.zh-Hans.md`:46 | `teammate` | **B-covered** | — | 同上;en 同位 `:47` |
| D226 | `workflows/verify/multispec/SKILL.zh-Hans.md`:47 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D227 | `workflows/verify/multispec/SKILL.zh-Hans.md`:48 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D228 | `workflows/verify/multispec/SKILL.zh-Hans.md`:49 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D229 | `workflows/verify/multispec/SKILL.zh-Hans.md`:50 | `teammate` | **NEW-A-INLINE** | `host.teammate` | 渲染面正文,token 级替换 |
| D230 | `workflows/verify/multispec/SKILL.zh-Hans.md`:77 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D231 | `workflows/verify/multispec/SKILL.zh-Hans.md`:83 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D232 | `workflows/verify/multispec/SKILL.zh-Hans.md`:87 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

#### `workflows/verify/multispec/workflow.yaml` — 6 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D233 | `workflows/verify/multispec/workflow.yaml`:14 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D234 | `workflows/verify/multispec/workflow.yaml`:16 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D235 | `workflows/verify/multispec/workflow.yaml`:17 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D236 | `workflows/verify/multispec/workflow.yaml`:24 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D237 | `workflows/verify/multispec/workflow.yaml`:25 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |
| D238 | `workflows/verify/multispec/workflow.yaml`:59 | `teammate` | **ALLOWLIST** | — | 不渲染(注释 / 非渲染 yaml 字段)—— 按 Q2 裁定进门 allowlist,不改措辞 |

#### `workflows/verify/paranoid/SKILL.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D239 | `workflows/verify/paranoid/SKILL.md`:62 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D240 | `workflows/verify/paranoid/SKILL.md`:68 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D241 | `workflows/verify/paranoid/SKILL.md`:72 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/verify/paranoid/SKILL.zh-Hans.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D242 | `workflows/verify/paranoid/SKILL.zh-Hans.md`:61 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D243 | `workflows/verify/paranoid/SKILL.zh-Hans.md`:67 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D244 | `workflows/verify/paranoid/SKILL.zh-Hans.md`:71 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

#### `workflows/verify/progress/SKILL.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D245 | `workflows/verify/progress/SKILL.md`:58 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D246 | `workflows/verify/progress/SKILL.md`:64 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D247 | `workflows/verify/progress/SKILL.md`:68 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/verify/progress/SKILL.zh-Hans.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D248 | `workflows/verify/progress/SKILL.zh-Hans.md`:56 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D249 | `workflows/verify/progress/SKILL.zh-Hans.md`:62 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D250 | `workflows/verify/progress/SKILL.zh-Hans.md`:66 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

#### `workflows/verify/qa/SKILL.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D251 | `workflows/verify/qa/SKILL.md`:90 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D252 | `workflows/verify/qa/SKILL.md`:96 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D253 | `workflows/verify/qa/SKILL.md`:100 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/verify/qa/SKILL.zh-Hans.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D254 | `workflows/verify/qa/SKILL.zh-Hans.md`:89 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D255 | `workflows/verify/qa/SKILL.zh-Hans.md`:95 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D256 | `workflows/verify/qa/SKILL.zh-Hans.md`:99 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

#### `workflows/verify/second-opinion/SKILL.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D257 | `workflows/verify/second-opinion/SKILL.md`:67 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D258 | `workflows/verify/second-opinion/SKILL.md`:73 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D259 | `workflows/verify/second-opinion/SKILL.md`:77 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/verify/second-opinion/SKILL.zh-Hans.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D260 | `workflows/verify/second-opinion/SKILL.zh-Hans.md`:66 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D261 | `workflows/verify/second-opinion/SKILL.zh-Hans.md`:72 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D262 | `workflows/verify/second-opinion/SKILL.zh-Hans.md`:76 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

#### `workflows/verify/security/SKILL.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D263 | `workflows/verify/security/SKILL.md`:59 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D264 | `workflows/verify/security/SKILL.md`:65 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D265 | `workflows/verify/security/SKILL.md`:69 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/verify/security/SKILL.zh-Hans.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D266 | `workflows/verify/security/SKILL.zh-Hans.md`:58 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D267 | `workflows/verify/security/SKILL.zh-Hans.md`:64 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D268 | `workflows/verify/security/SKILL.zh-Hans.md`:68 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

#### `workflows/verify/simplify/SKILL.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D269 | `workflows/verify/simplify/SKILL.md`:59 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D270 | `workflows/verify/simplify/SKILL.md`:65 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D271 | `workflows/verify/simplify/SKILL.md`:69 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/verify/simplify/SKILL.zh-Hans.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D272 | `workflows/verify/simplify/SKILL.zh-Hans.md`:58 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D273 | `workflows/verify/simplify/SKILL.zh-Hans.md`:64 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D274 | `workflows/verify/simplify/SKILL.zh-Hans.md`:68 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

#### `workflows/verify/validate-phase/SKILL.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D275 | `workflows/verify/validate-phase/SKILL.md`:54 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionEn` 渲染 — 禁止手改 |
| D276 | `workflows/verify/validate-phase/SKILL.md`:60 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopEn` 渲染 — 禁止手改 |
| D277 | `workflows/verify/validate-phase/SKILL.md`:64 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionEn` 渲染 — 禁止手改 |

#### `workflows/verify/validate-phase/SKILL.zh-Hans.md` — 3 处

| # | 文件:行 | 命中 token | 类别 | 提议 key | 备注 |
| - | ------- | ---------- | ---- | -------- | ---- |
| D278 | `workflows/verify/validate-phase/SKILL.zh-Hans.md`:53 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `executionZh` 渲染 — 禁止手改 |
| D279 | `workflows/verify/validate-phase/SKILL.zh-Hans.md`:59 | `CC-native` | **NEW-A-TPL** | `host.native` | 生成器 `spawnLoopZh` 渲染 — 禁止手改 |
| D280 | `workflows/verify/validate-phase/SKILL.zh-Hans.md`:63 | `AskUserQuestion` | **NEW-A-TPL** | `host.ask_user` | 生成器 `executionZh` 渲染 — 禁止手改 |

---

## 批 A / 批 D 共享文本核实(重点)

### 结论:**今天已经不是逐字相同,两批必须用不同的 variant,不能共用一个 key 值。**

`src/cli/lib/generateCommands.ts:204-211` 的注释写:

```
// 4.34.0 — MUST stay in lockstep with the Agent Teams step 4 in
// workflows/*/SKILL.md (see scripts/rewrite-skill-invoke-sections.mjs).
```

逐字比对 `TEAMS_STEP_EN`(`rewrite-skill-invoke-sections.mjs:174`)与
`generateCommands.ts:212` 的 step 4,**发现 5 处分歧**:

| # | SKILL(批 A) | COMMAND(批 D) |
| - | ------------ | -------------- |
| 1 | (无) | 多一句前导 `this stage needs multiple subagents to coordinate (SendMessage / shared contract). ` 并把 `read` 改成 `Read` |
| 2 | `prompt>)\` and the team forms` | `prompt>)\`; the team forms` |
| 3 | `FIRST spawn, with this session as lead`(有逗号) | `FIRST spawn with this session as lead`(无逗号) |
| 4 | `(the \`team_name\` input is accepted but ignored` | `(\`team_name\` is accepted but ignored` |
| 5 | (无 —— 这些话在 `TEAMS_TEARDOWN_EN` 里,且只有 `auto` 渲染) | 多两句尾部:`— shutdown is a REQUEST, so re-ask rather than assume, and shut every teammate down before you finish (a teammate you never stopped keeps burning tokens and can hang the host). The team directory is removed automatically at session exit; there is no teardown tool.` |

即:**批 D 的版本把 `TEAMS_TEARDOWN_*` 的内容内联进了 step 4**,而批 A 把它拆成
`auto` 专属的两条 bullet。这是语义层面的结构差异,不是排版差异。

同类分歧在另两句上同样存在:

| 概念 | 批 A(SKILL) | 批 D(COMMAND) |
| ---- | ------------ | -------------- |
| `harnessed run` 警告(orchestrator) | `— that is the CI/headless path (in-process SDK spawn\nthat blocks the session, bypasses Agent Teams, and hangs inside Claude Code).` | `— that is the CI/headless path (SDK spawn, blocks the session, no Agent Teams, no clarification round-trip).`(`:221`) |
| `harnessed run` 警告(execution) | `(in-process SDK spawn\nthat blocks the session inside Claude Code).` | `(SDK spawn).`(`:262`) |

**反例(说明 lockstep 纪律本身是可行的)**:`factsStepEn`(mjs `:197`)与
`generateCommands.ts:201` 的 `1b.` 步**逐字节相同**,那条注释写的是 "copied verbatim"。
所以问题出在 `TEAMS_STEP` 这一条的维护上,不是机制上。

### 因此的处理方案

金标要求 **claude 侧渲染产物逐字节不变** —— 批 A 与批 D 的 claude 产物今天就不同,
共用一个 key 值必然让其中一个金标红。方案:

**同一 primitive,两个 variant**:

```
host.teams_step_note.skill     → 批 A(TEAMS_STEP_EN / TEAMS_STEP_ZH)
host.teams_step_note.command   → 批 D(generateCommands.ts:212)
host.harnessed_run_warning_note.orchestrator         → 批 A
host.harnessed_run_warning_note.execution            → 批 A
host.harnessed_run_warning_note.command_orchestrator → 批 D
host.harnessed_run_warning_note.command_execution    → 批 D
```

两个好处:(1) 两侧金标各自保住;(2) **lockstep 纪律从「两处文本要靠人维护成一样」
升级为「两个 variant 在同一张表里相邻」**,漂移肉眼可见 —— 这比原注释提供的保证更强。
codex 侧两个 variant 可以填同一段文本(它们没有历史包袱),等于顺手把漂移收敛掉。

### 批 D 的独立普查(不在 236 / 280 内)

`generateCommands.ts` 是 **en-only**(`LANG_DIRECTIVE:71` 告诉模型用什么语言回答,
不产 zh 文件),所以批 D 没有 zh 半边。

| token | 处数(含注释) |
| ----- | -------------- |
| `CC-native` | 7 |
| `teammate` | 6 |
| `Agent Teams` | 5 |
| `AskUserQuestion` | 4 |
| `~/.claude/` | 4 |
| `Task / Agent` | 3 |
| `SendMessage` | 2 |
| `run_in_background` | 1 |

findings F7b 已量清:真正进产物的是 6 行(`:89` / `:190` / `:212` / `:221` / `:252` / `:263`)。
其中 `:263` 的 `~/.claude/skills/${name}/SKILL.md` 是 **`host.skills_dir` 的唯一活站点**
—— `workflows/` 下 13 处 `~/.claude/` 里 10 处在 `teams_step_note` 内(整句删除)、
3 处是注释(allowlist),**`workflows/` 侧零活站点**。F7b 已定调:该路径应由
`getSkillsDir()` 派生,不是字面量 —— 也就是说批 D 这一处可以**不走 `host.*` 表**,
直接调函数。表里仍留 `host.skills_dir` 供 SKILL 正文将来引用。

---

## 面 → 站点 分工清单(互不重叠)

### 批 A —— `scripts/rewrite-skill-invoke-sections.mjs`

改 builder 后重跑,覆盖全部 `## How to invoke` / `## 如何调用` span。

| | 处数 |
| --- | --- |
| 第一轮 A-TPL | 96 |
| 第一轮 C-TPL | 44 |
| 第二轮 NEW-A-TPL | 168 |
| **合计** | **308** |

要改的 **8 个函数 + 5 对常量**:
`executionEn` / `executionZh` / `orchestratorEn` / `orchestratorZh` /
`spawnLoopEn` / `spawnLoopZh` / **`interactiveEn`** / **`interactiveZh`**(新增);
`TEAMS_STEP_*` / `DELIVERY_CONTRACT_*` / `TEAMS_TEARDOWN_*`。

改完必须 `node scripts/rewrite-skill-invoke-sections.mjs` 重跑并 bump `NEW_MARKER`
(当前 `v4.12.0`),否则 `skip-current` 会让改动不落地。

**触及文件**:48 个 `SKILL{,.zh-Hans}.md` 的 span 内区域。批 B 不得进入这些行区间。

### 批 B —— `workflows/**/SKILL*.md` 的 span 外 inline

| | 处数 |
| --- | --- |
| 第一轮 A-INLINE(SKILL 文件部分) | 24 |
| 第一轮 C-INLINE | 10 |
| 第一轮 `?` → Q3 裁定后的 A-INLINE | 7 |
| 第一轮 B(multispec 正文复述,随 T7 联动) | 12 |
| 第二轮 NEW-A-INLINE(SKILL 部分) | 20 |
| 第二轮 NEW-C-INLINE(SKILL 部分) | 5 |
| 第二轮 B-covered(multispec 正文) | 4 |
| **合计** | **82** |

**触及文件**(10 个):
`verify/multispec/SKILL{,.zh-Hans}.md` / `task/deliver/SKILL{,.zh-Hans}.md` /
`verify/code-review/SKILL{,.zh-Hans}.md` / `task/auto/SKILL{,.zh-Hans}.md` /
`task/code/SKILL{,.zh-Hans}.md`(仅 Q5 待裁部分)/ `plan/phase/SKILL{,.zh-Hans}.md`(同)。

### 批 C —— `workflows/**/*.yaml`

| 子项 | 处数 | 动作 |
| ---- | ---- | ---- |
| `capabilities.yaml` B 类 `cmd:` | 2(`:606` `:622`)+ `:631` | 补 codex 条目(T7) |
| `capabilities.yaml` 其余 | 13 + 20 | **allowlist,不改** |
| `role-prompts.{,zh-Hans.}yaml` 渲染面 | 10(第一轮)+ 22(第二轮) | 手改 / 整段入表(T8) |
| `disciplines/language.yaml` | 2 | 手改 `host.name`(**渲染面** —— `prompt.ts:191-208` 解析 `preserve-english-categories`,`:150` 加载全部 rule) |
| `disciplines/priority.*.yaml` | 2 | allowlist |
| `judgments/parallelism-gate.yaml` | 5 + 2 | allowlist |
| `judgments/web-search-routing.yaml` | 2 | allowlist |
| `disciplines/karpathy.*.yaml` | 2 | allowlist |
| 4 个 `workflow.yaml` | 17 + 10 | allowlist |
| **需改小计** | **39** | |
| **allowlist 小计** | **58** | |

> `disciplines/language.yaml` 是本轮**新发现的渲染面** —— 第一轮不在范围,
> 因为它不含任何基线 token。它有 zh 兄弟吗?**没有**,en-only(按设计)。

### 批 D —— `src/cli/lib/generateCommands.ts`

6 行进产物(F7b),en-only,无 zh。与批 A 共享概念但**不共享文本**(见上)。
`:263` 的 skills 路径改走 `getSkillsDir()`,不走 `host.*` 表。

### 批次互斥性核对

| | 批 A | 批 B | 批 C | 批 D |
| --- | --- | --- | --- | --- |
| 文件类型 | `.mjs` 生成器 | `SKILL*.md` span 外 | `*.yaml` | `.ts` |
| 重叠风险 | 与批 B 同文件不同行区间 —— **以 `<!-- harnessed-generated -->` 标记为界** | 同左 | 无 | 无 |

唯一的物理重叠是批 A / 批 B 共用 48 个 `SKILL*.md`。建议批 A **先跑**(重跑生成器会
整段重写 span),批 B 再改 span 外 —— 反过来会让批 B 的改动被生成器覆盖。

---

## 扩充后的词表

**14 个 primitive / 25 个可寻址占位符**(A 类 8 primitive / 11 占位符;
C 类 6 primitive / 14 占位符)。相较第一轮的 9 / 12,新增 5 primitive / 13 占位符。

### A 类新增 primitive

| primitive | variant | claude(逐字) | codex(建议) | 活站点 |
| --------- | ------- | ------------- | ------------- | ------ |
| `native` | `default` | `CC-native` | `codex-native` | 96 TPL + 1 allowlist |
| `name` | `default` | `Claude Code` | `Codex` | 35(另 29 待 Q5) |
| `teammate` | `default` | `teammate` | `agent` | 61 |
| | `plural` | `teammates` | `agents` | 3 |
| `ask_user` | `default` | `AskUserQuestion` | `request_user_input` | 74 |
| `skills_dir` | `default` | `~/.claude/skills` | `~/.agents/skills` | 0(仅批 D,且建议走 `getSkillsDir()`) |

#### `host.native` 拆分可还原性核对(你点名要的)

6 个生成器站点逐一验证「两个占位符渲染后拼起来 == 原文」:

| 站点 | 占位后写法 | 是否相邻 | 还原 |
| ---- | ---------- | -------- | ---- |
| `executionEn:304` | `{{ host.native }} {{ host.spawn_subagent }} (keeps…` | ✅ 相邻 | `CC-native Task / Agent tool` ✅ |
| `executionZh:327` | `{{ host.native }} {{ host.spawn_subagent.zh_tool }} spawn subagent(…` | ✅ 相邻 | `CC-native Task / Agent 工具` ✅ |
| `orchestratorEn:223` | `{{ host.native }} {{ host.spawn_subagent.plural }}.` | ✅ 相邻 | `CC-native Task / Agent tools` ✅ |
| `orchestratorZh:266` | `{{ host.native }} {{ host.spawn_subagent.zh_tool }}做 spawn。` | ✅ 相邻 | `CC-native Task / Agent 工具` ✅ |

> **更正(批 A 实施,2026-09-24)**:本表 `orchestratorZh:266` 行原写作
> `{{ host.spawn_subagent.zh_tool }} 做 spawn。`(占位符与 `做` 之间有一个空格),
> 与站点原文不符 —— 原文是 `CC-native Task / Agent 工具做 spawn。`,`工具` 与 `做`
> **之间没有空格**。照抄会给 5 个 orchestrator zh 产物各塞一个多余空格,直接打红
> claude 逐字节金标。上表已改为正确写法。
>
> **教训(批 B / 批 C 照办)**:本文件「提议 key 映射」栏里的占位后写法是**示意**,
> 不是可直接粘贴的成品。落地前一律 `sed -n` 取站点原文逐字节核对空白与标点,
> 尤其是 CJK 与 ASCII 交界处 —— 那里的空格肉眼几乎看不出来。
| `spawnLoopEn:139` | `Spawn a {{ host.native }} subagent ({{ host.spawn_subagent }}) with…` | ❌ 中间隔 ` subagent (` | ✅ 仍可还原(两个独立占位符) |
| `spawnLoopZh:151` | `用 {{ host.native }} subagent({{ host.spawn_subagent.zh_tool }})以该…` | ❌ 中间隔 ` subagent(` | ✅ 仍可还原 |

**结论:6 个站点全部可逐字节还原**,其中 4 个相邻、2 个中间隔词。
按你的方向拆成独立 primitive 成立,无需为任何站点破例。

`CC-native` 唯一不与 spawn 同句的站点是 `capabilities.yaml:1264`(注释,allowlist),
所以「单独复用」这条目前没有活站点,但保留独立 primitive 仍然对 —— 批 D 的
`generateCommands.ts:89/190/252` 三处也是 `CC-native` + spawn 组合,拆开后同样能用。

#### `host.ask_user` 的可用性问题(照你的约束处理)

codex 侧填工具名 `request_user_input`(上游
`codex-rs/core/src/tools/handlers/request_user_input{,_spec}.rs` 确有该工具),
但**不在正文里断言它一定可用**。

token 级占位符没法夹带 caveat,所以建议把 caveat 放进 **R4 的映射小节**
(`<!-- harnessed:host-map:start -->` 区间,只有 codex 渲染插入),一行:

```
- request_user_input — TODO(未验证):本机是否默认启用未测(`codex features list` 的
  `default_mode_request_user_input` 是某个模式的 flag,不是工具本身的开关)。
```

这样 74 处正文保持干净,caveat 只出现一次。

### C 类新增 / 扩充的整段 key

| primitive | variant | 站点 | 处数 |
| --------- | ------- | ---- | ---- |
| `harnessed_run_warning_note` | `orchestrator` | 批 A `orchestratorEn/Zh:225-226/268-269` | 10 |
| | `execution` **NEW** | 批 A `executionEn/Zh:306-307/329-330` | 19 en(zh 因折行不命中,内容同样需改) |
| | `command_orchestrator` **NEW** | 批 D `:221` | 1 |
| | `command_execution` **NEW** | 批 D `:262` | 1 |
| `teams_step_note` | `skill` **(原 default)** | 批 A `TEAMS_STEP_*` | 30 |
| | `command` **NEW** | 批 D `:212` | 1 |
| `teams_cleanup_note` | `deliver` | `task/deliver/SKILL*.md:79,81` | 4 |
| | `multispec` | `verify/multispec/SKILL.md:39,40` / `.zh:38,39` | 4 |
| | `checklist` **NEW** | `role-prompts*.yaml:377/354` | 4 |
| | `multispec_checklist` **NEW** | `role-prompts*.yaml:538/512` | 4 |
| `teams_teardown_note` | `default` | 批 A `TEAMS_TEARDOWN_*` | 2 |
| `delivery_contract_note` | `default` / `checklist` | 批 A + role-prompts | 4 |
| `multispec_spawn_note` | `default` | `verify/multispec/SKILL.md:35,36` / `.zh:35` | 5 |

> `harnessed_run_warning_note.execution` 的 zh 侧值得单说:zh 原文把
> `Claude` / `Code` 折行拆开(`…在 Claude` + `Code 内部会阻塞 session)。`),
> 所以 `Claude Code` 正则不命中 —— 但它**确实是 CC 专属事实**,必须一起改。
> 这是「正则漏检但语义在范围内」的第二个实例(第一个是 `deliver/SKILL.md:28-29`)。

---

## 可落盘的 `workflows/host-primitives.yaml` 片段

> 只给 `primitives:` 节。claude 值逐字取自原文(金标要求)。
> 长整段用 `|-` block scalar。两个文件的 **key 集合完全一致**。
> `TODO(未验证)` 按约束保留在 codex 值里。

### `workflows/host-primitives.yaml`(en)

```yaml
primitives:
  # ── A 类:token 级 ────────────────────────────────────────────────────────
  spawn_subagent:
    default:
      claude: "Task / Agent tool"
      codex: "spawn_agent tool"
    zh_tool:
      claude: "Task / Agent 工具"
      codex: "spawn_agent 工具"
    plural:
      claude: "Task / Agent tools"
      codex: "spawn_agent tools"

  send_message:
    default:
      claude: "SendMessage"
      codex: "send_input"

  # 编队:codex v1 无品牌化概念,编队方式就是多次 spawn_agent(findings F4)。
  team:
    default:
      claude: "Agent Teams"
      codex: "a multi-agent formation (repeated `spawn_agent`)"

  # 形容词前缀,与 spawn_subagent 相邻或隔词组合使用。
  native:
    default:
      claude: "CC-native"
      codex: "codex-native"

  name:
    default:
      claude: "Claude Code"
      codex: "Codex"

  teammate:
    default:
      claude: "teammate"
      codex: "agent"
    plural:
      claude: "teammates"
      codex: "agents"

  # 可用性未实测 — caveat 放 host-map 小节,不进正文(见 inventory Q4 处理说明)。
  ask_user:
    default:
      claude: "AskUserQuestion"
      codex: "request_user_input"

  skills_dir:
    default:
      claude: "~/.claude/skills"
      codex: "~/.agents/skills"

  # ── C 类:整段 ───────────────────────────────────────────────────────────
  harnessed_run_warning_note:
    orchestrator:
      claude: |-
        Do NOT pipe to `harnessed run <name>` — that is the CI/headless path (in-process SDK spawn
        that blocks the session, bypasses Agent Teams, and hangs inside Claude Code).
      codex: |-
        Do NOT pipe to `harnessed run <name>` — that is the CI/headless path (an in-process SDK
        spawn that blocks this session).
    execution:
      claude: |-
        Do NOT pipe to `harnessed run <name>` — that is the CI/headless path (in-process SDK spawn
        that blocks the session inside Claude Code).
      codex: |-
        Do NOT pipe to `harnessed run <name>` — that is the CI/headless path (an in-process SDK
        spawn that blocks this session).
    command_orchestrator:
      claude: "Do NOT pipe to `harnessed run <name>` — that is the CI/headless path (SDK spawn, blocks the session, no Agent Teams, no clarification round-trip)."
      codex: "Do NOT pipe to `harnessed run <name>` — that is the CI/headless path (SDK spawn, blocks the session, no clarification round-trip)."
    command_execution:
      claude: "Do NOT pipe to `harnessed run <name>` — that is the CI/headless path (SDK spawn)."
      codex: "Do NOT pipe to `harnessed run <name>` — that is the CI/headless path (SDK spawn)."

  teams_step_note:
    skill:
      claude: '4. If `parallelism.escalate_to_teams === true`: read `~/.claude/rules/agent-teams.md`, then drive the fired subs as an Agent Team. There is NO create step and no create tool — spawn one background teammate per fired sub with `Agent(name: <sub>, run_in_background: true, prompt: <that sub''s `harnessed prompt <sub>` prompt>)` and the team forms implicitly on the FIRST spawn, with this session as lead (the `team_name` input is accepted but ignored — the name is session-derived). Coordinate via `SendMessage`; when a sub is finished, ask that teammate to shut down BY NAME (e.g. "ask the verify-qa teammate to shut down"). Still checkpoint each sub (`complete` / `fail`) as below.'
      codex: '4. If `parallelism.escalate_to_teams === true`: spawn one agent per fired sub with `spawn_agent(task_name: <sub>, message: <that sub''s `harnessed prompt <sub>` prompt>)`. Coordinate with `send_input(target, items)`; `wait_agent` blocks until one finishes and `list_agents` enumerates the running set. When a sub is finished, close it with `close_agent`. Still checkpoint each sub (`complete` / `fail`) as below. TODO(未验证): codex agent lifecycle — whether agents are session-scoped, whether anything is reclaimed automatically on exit, and whether an agent may spawn another. Do not rely on any of it until measured.'
    command:
      claude: '4. If `parallelism.escalate_to_teams === true`: this stage needs multiple subagents to coordinate (SendMessage / shared contract). Read `~/.claude/rules/agent-teams.md`, then drive the fired subs as an Agent Team. There is NO create step and no create tool — spawn one background teammate per fired sub with `Agent(name: <sub>, run_in_background: true, prompt: <that sub''s `harnessed prompt <sub>` prompt>)`; the team forms implicitly on the FIRST spawn with this session as lead (`team_name` is accepted but ignored — the name is session-derived). Coordinate via `SendMessage`; when a sub is finished, ask that teammate to shut down BY NAME (e.g. "ask the verify-qa teammate to shut down") — shutdown is a REQUEST, so re-ask rather than assume, and shut every teammate down before you finish (a teammate you never stopped keeps burning tokens and can hang the host). The team directory is removed automatically at session exit; there is no teardown tool. Still checkpoint each sub (`complete` / `fail`) as below.'
      codex: '4. If `parallelism.escalate_to_teams === true`: this stage needs multiple agents to coordinate. Spawn one agent per fired sub with `spawn_agent(task_name: <sub>, message: <that sub''s `harnessed prompt <sub>` prompt>)`. Coordinate with `send_input(target, items)`; `wait_agent` blocks until one finishes and `list_agents` enumerates the running set. Close each finished agent with `close_agent`, and close every agent you spawned before you finish (an agent you never closed keeps burning tokens). Still checkpoint each sub (`complete` / `fail`) as below. TODO(未验证): codex agent lifecycle — session scope, automatic reclamation on exit, nesting. Not asserted here.'

  # 两条 bullet 各带 3 个前导空格(原文如此)。block scalar 会把公共缩进吃掉,
  # 所以这里用双引号 + \n —— 逐字节还原过,见 inventory「金标自检」节。
  teams_teardown_note:
    default:
      claude: "   - **Shut every teammate down before you finish — MUST-in-finally, not best-effort**: regardless of whether every sub reached COMPLETE, max_iterations was exhausted, or you consider the work done, ask each teammate to shut down by name before you end the run, and confirm it actually stopped. Shutdown is a REQUEST: the teammate finishes its current tool call first and may reject with a reason, so re-ask rather than assume. The team directory is removed automatically at session exit (there is no teardown tool), but a teammate you never stopped keeps consuming tokens and can hang the host (headless especially — issue #7: an 11h hang, work complete but the process never exited).\n   - **Headless never spawns teams**: in a headless session (`claude -p`) `harnessed gates` already returns `escalate_to_teams: false` (Agent Teams are session-scoped — lost on `/resume`, incompatible with `-p`). Do NOT spawn teammates or background-`Agent` in headless even if you think it would parallelize — run the fired subs sequentially in-session instead."
      codex: "   - **Close every agent before you finish — MUST-in-finally, not best-effort**: regardless of whether every sub reached COMPLETE, max_iterations was exhausted, or you consider the work done, call `close_agent` for each agent you spawned and confirm it stopped. An agent you never closed keeps consuming tokens and can hang the host (headless especially — issue #7: an 11h hang, work complete but the process never exited). TODO(未验证): whether codex reclaims running agents on session exit — this note deliberately asserts nothing about it, so close them explicitly.\n   - **Headless runs sequentially**: in a headless run `harnessed gates` already returns `escalate_to_teams: false`. Do NOT spawn agents in headless even if you think it would parallelize — run the fired subs sequentially in-session instead."

  delivery_contract_note:
    default:
      claude: "delivery contract: use a BLOCKING Agent/Task call — only a blocking call returns the subagent's final text as your tool result. A named/background teammate's final message is DISCARDED by the platform; if you must run it that way, instruct the agent to write its findings to a file (and read it back) or SendMessage them to the main session — otherwise the COMPLETE promise and the findings never reach you."
      codex: "delivery contract: instruct the agent to write its findings to a file (and read it back), or to return them with `send_input` to this session; call `wait_agent` before you read. TODO(未验证): whether codex hands a spawned agent's final text back to the caller — until measured, do not rely on it, so that the COMPLETE promise and the findings reach you by file or by `send_input` either way."
    checklist:
      claude: "Delivery contract: a named/background teammate's FINAL message is discarded by the platform — every finding must arrive via SendMessage to the lead or be written to a file the lead reads back; never rely on the teammate's last output"
      codex: "Delivery contract: every finding must arrive via `send_input` to the lead or be written to a file the lead reads back; call `wait_agent` before reading. TODO(未验证): whether codex returns a spawned agent's final message to the lead — do not rely on it."

  teams_cleanup_note:
    deliver:
      claude: |-
        任 1 fire → escalate subagent fan-out → Agent Teams Pattern A/B/C。Cleanup mandatory
        per agent-teams.md 防呆清单 (lead 按名请求每个 teammate shut down; CC 2.1.178+ 无 teardown
        工具,团目录 session 退出时自动清理 —— 剩下的纪律是别把 teammate 落在运行态) — engine-level
        wiring, NOT yaml schema scope。
      codex: |-
        任 1 fire → escalate subagent fan-out → 多 agent 编队 Pattern A/B/C。Cleanup mandatory
        (对每个 spawn 出来的 agent 调 `close_agent` 并确认它停了 —— 别把 agent 落在运行态) —
        engine-level wiring, NOT yaml schema scope。
        TODO(未验证):codex 是否在 session 退出时回收运行中的 agent。
    multispec:
      claude: |-
        Agent Teams cleanup discipline — 团目录在 session 退出时自动清理,无独立 teardown 工具,
        剩下的纪律是别把 teammate 落在运行态)。
      codex: |-
        cleanup discipline — 对每个 spawn 出来的 agent 调 `close_agent` 并确认它停了,
        别把 agent 落在运行态)。TODO(未验证):codex 的 session 退出回收行为。
    checklist:
      claude: "Cleanup: ask each teammate to shut down by name — that request IS the teardown (CC 2.1.178+ has no delete tool); the team's shared dirs are removed automatically at session exit, and a teammate that ignores the request is only guaranteed stopped when the session ends"
      codex: "Cleanup: call `close_agent` for each agent you spawned and confirm it stopped. TODO(未验证): whether codex reclaims agents at session exit — close them explicitly rather than relying on it"
    multispec_checklist:
      claude: "Cleanup MANDATORY: ask each of the 4 teammates to shut down by name and confirm it stopped — that request IS the teardown (no delete tool exists); the team dirs are removed automatically at session exit, and a teammate that ignores the request is only guaranteed stopped when the session ends"
      codex: "Cleanup MANDATORY: call `close_agent` for each of the 4 agents and confirm it stopped. TODO(未验证): whether codex reclaims agents at session exit — close them explicitly rather than relying on it"

  multispec_spawn_note:
    default:
      claude: |-
        `Agent(name, run_in_background=true)` — the team forms implicitly on the FIRST spawn (CC
        2.1.178+ has no create step / no create tool), teammates 互相 SendMessage 质询 findings 是否
        真问题 (NOT fire-and-forget)
      codex: |-
        `spawn_agent(task_name: <specialist>, message: <brief>)` ×4 — there is no create step;
        the four agents cross-question each other's findings with `send_input` (NOT
        fire-and-forget)
```

### `workflows/host-primitives.zh-Hans.yaml`(zh-Hans)

key 集合与上文**完全一致**。差异只在需要本地化行文的值;工具名 / API 名两文件同值
(专有名词不翻译,已是既有文件头注释里写明的设计)。

```yaml
primitives:
  # ── A 类:token 级 ────────────────────────────────────────────────────────
  spawn_subagent:
    default:
      claude: "Task / Agent tool"
      codex: "spawn_agent tool"
    zh_tool:
      claude: "Task / Agent 工具"
      codex: "spawn_agent 工具"
    plural:
      claude: "Task / Agent 工具"
      codex: "spawn_agent 工具"

  send_message:
    default:
      claude: "SendMessage"
      codex: "send_input"

  team:
    default:
      claude: "Agent Teams"
      codex: "多 agent 编队(多次 `spawn_agent`)"

  native:
    default:
      claude: "CC-native"
      codex: "codex-native"

  name:
    default:
      claude: "Claude Code"
      codex: "Codex"

  # 中文行文里原文也写 teammate(专有名词),故 claude 侧两 locale 同值。
  teammate:
    default:
      claude: "teammate"
      codex: "agent"
    plural:
      claude: "teammate"
      codex: "agent"

  ask_user:
    default:
      claude: "AskUserQuestion"
      codex: "request_user_input"

  skills_dir:
    default:
      claude: "~/.claude/skills"
      codex: "~/.agents/skills"

  # ── C 类:整段 ───────────────────────────────────────────────────────────
  harnessed_run_warning_note:
    orchestrator:
      claude: |-
        **不要** pipe 到 `harnessed run <name>` —— 那是 CI/headless 路径(in-process SDK spawn,会阻塞
        session、绕过 Agent Teams,在 Claude Code 内部调用时会挂死)。
      codex: |-
        **不要** pipe 到 `harnessed run <name>` —— 那是 CI/headless 路径(in-process SDK spawn,
        会阻塞本 session)。
    execution:
      claude: |-
        **不要** pipe 到 `harnessed run <name>` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
        Code 内部会阻塞 session)。
      codex: |-
        **不要** pipe 到 `harnessed run <name>` —— 那是 CI/headless 路径(in-process SDK spawn,
        会阻塞本 session)。
    # 批 D(generateCommands.ts)是 en-only;两个 command variant 在 zh 文件中仅为
    # key parity 存在,值与 en 文件相同,渲染时不会被 zh 侧引用。
    command_orchestrator:
      claude: "Do NOT pipe to `harnessed run <name>` — that is the CI/headless path (SDK spawn, blocks the session, no Agent Teams, no clarification round-trip)."
      codex: "Do NOT pipe to `harnessed run <name>` — that is the CI/headless path (SDK spawn, blocks the session, no clarification round-trip)."
    command_execution:
      claude: "Do NOT pipe to `harnessed run <name>` — that is the CI/headless path (SDK spawn)."
      codex: "Do NOT pipe to `harnessed run <name>` — that is the CI/headless path (SDK spawn)."

  teams_step_note:
    skill:
      claude: '4. 若 `parallelism.escalate_to_teams === true`:读 `~/.claude/rules/agent-teams.md`,然后把 fired subs 作为 Agent Team 驱动。**没有建团步骤、也没有建团工具** —— 对每个 fired sub 用 `Agent(name: <sub>, run_in_background: true, prompt: <该 sub 的 `harnessed prompt <sub>` prompt>)` spawn 一个后台 teammate,团在**第一个** spawn 时隐式形成,本 session 即 lead(`team_name` 入参被接受但忽略 —— 团名由 session 派生)。用 `SendMessage` 协调;某个 sub 完成后,**按名**请求该 teammate 关闭(例如「ask the verify-qa teammate to shut down」)。每个 sub 仍按下方 checkpoint(`complete` / `fail`)。'
      codex: '4. 若 `parallelism.escalate_to_teams === true`:对每个 fired sub 用 `spawn_agent(task_name: <sub>, message: <该 sub 的 `harnessed prompt <sub>` prompt>)` spawn 一个 agent。用 `send_input(target, items)` 协调;`wait_agent` 阻塞等待其中一个结束,`list_agents` 列出运行中的集合。某个 sub 完成后用 `close_agent` 关闭它。每个 sub 仍按下方 checkpoint(`complete` / `fail`)。TODO(未验证):codex agent 的生命周期 —— 是否 session-scoped、退出时是否自动回收、能否嵌套 spawn。实测之前不得依赖。'
    command:
      # en-only 面,值同 en 文件(仅为 key parity 存在)。
      claude: '4. If `parallelism.escalate_to_teams === true`: this stage needs multiple subagents to coordinate (SendMessage / shared contract). Read `~/.claude/rules/agent-teams.md`, then drive the fired subs as an Agent Team. There is NO create step and no create tool — spawn one background teammate per fired sub with `Agent(name: <sub>, run_in_background: true, prompt: <that sub''s `harnessed prompt <sub>` prompt>)`; the team forms implicitly on the FIRST spawn with this session as lead (`team_name` is accepted but ignored — the name is session-derived). Coordinate via `SendMessage`; when a sub is finished, ask that teammate to shut down BY NAME (e.g. "ask the verify-qa teammate to shut down") — shutdown is a REQUEST, so re-ask rather than assume, and shut every teammate down before you finish (a teammate you never stopped keeps burning tokens and can hang the host). The team directory is removed automatically at session exit; there is no teardown tool. Still checkpoint each sub (`complete` / `fail`) as below.'
      codex: '4. If `parallelism.escalate_to_teams === true`: this stage needs multiple agents to coordinate. Spawn one agent per fired sub with `spawn_agent(task_name: <sub>, message: <that sub''s `harnessed prompt <sub>` prompt>)`. Coordinate with `send_input(target, items)`; `wait_agent` blocks until one finishes and `list_agents` enumerates the running set. Close each finished agent with `close_agent`, and close every agent you spawned before you finish (an agent you never closed keeps burning tokens). Still checkpoint each sub (`complete` / `fail`) as below. TODO(未验证): codex agent lifecycle — session scope, automatic reclamation on exit, nesting. Not asserted here.'

  teams_teardown_note:
    default:
      claude: "   - **收尾前必须关闭每个 teammate —— finally 强制契约,非尽力而为**:无论是否每个 sub 都到达 COMPLETE、max_iterations 是否耗尽、或你是否认为工作已完成,收尾前都要**按名**请求每个 teammate 关闭,并确认它真的停了。关闭是**请求**:teammate 会先做完当前 tool call,也可能带理由拒绝 —— 所以要复查重发,不要假定。团目录在 session 退出时**自动**删除(没有 teardown 工具),但你没停掉的 teammate 会持续烧 token 并可能挂起宿主(headless 尤甚 —— issue #7:挂 11 小时,工作已完成但进程从不退出)。\n   - **headless 绝不 spawn team**:headless session(`claude -p`)下 `harnessed gates` 已返回 `escalate_to_teams: false`(Agent Teams 是 session-scoped —— `/resume` 即丢,与 `-p` 不兼容)。即使你认为能并行,headless 下也**不要** spawn teammate 或背景 `Agent` —— 改为在 session 内顺序驱动 fired subs。"
      codex: "   - **收尾前必须关闭每个 agent —— finally 强制契约,非尽力而为**:无论是否每个 sub 都到达 COMPLETE、max_iterations 是否耗尽、或你是否认为工作已完成,收尾前都要对每个 spawn 出来的 agent 调 `close_agent` 并确认它真的停了。没停掉的 agent 会持续烧 token 并可能挂起宿主(headless 尤甚 —— issue #7:挂 11 小时,工作已完成但进程从不退出)。TODO(未验证):codex 是否在 session 退出时回收运行中的 agent —— 本条刻意不作断言,所以要显式关闭。\n   - **headless 顺序执行**:headless 下 `harnessed gates` 已返回 `escalate_to_teams: false`。即使你认为能并行,headless 下也**不要** spawn agent —— 改为在 session 内顺序驱动 fired subs。"

  delivery_contract_note:
    default:
      claude: "交付契约:必须用**阻塞式** Agent/Task 调用 —— 只有阻塞调用会把 subagent 的最终文本作为 tool result 返回给你。named/background teammate 的最终消息会被平台**丢弃**;若必须那样跑,要求 agent 把发现写入文件(你再读回)或 SendMessage 回主 session —— 否则 COMPLETE promise 和研究发现永远到不了你手里。"
      codex: "交付契约:要求 agent 把发现写入文件(你再读回)或用 `send_input` 回传本 session;读之前先调 `wait_agent`。TODO(未验证):codex 是否把 spawn 出来的 agent 的最终文本回传给调用方 —— 实测之前不得依赖,所以无论如何都要走文件或 `send_input`,保证 COMPLETE promise 和研究发现到得了你手里。"
    checklist:
      claude: "交付契约:named/background teammate 的**最终消息**会被平台丢弃 —— 每条发现必须经 SendMessage 发给 lead 或写入文件由 lead 读回;绝不依赖 teammate 的最后一条输出"
      codex: "交付契约:每条发现必须经 `send_input` 发给 lead 或写入文件由 lead 读回;读之前先调 `wait_agent`。TODO(未验证):codex 是否把 agent 的最终消息回传给 lead —— 不得依赖"

  teams_cleanup_note:
    deliver:
      # 注意:zh SKILL 正文用的是**全角**标点(，（）；),与生成器渲染的 zh 段(半角)不同。
      claude: |-
        任 1 触发 → 升级 subagent fan-out → Agent Teams Pattern A/B/C。清理是强制的，
        遵循 agent-teams.md 防呆清单（lead 按名请求每个 teammate shut down；CC 2.1.178+ 已无
        teardown 工具，团目录在 session 退出时自动清理——剩下的纪律是别把 teammate 落在运行态）
        ——属于 engine 级别的连接，NOT yaml schema 的职责范围。
      codex: |-
        任 1 触发 → 升级 subagent fan-out → 多 agent 编队 Pattern A/B/C。清理是强制的
        (对每个 spawn 出来的 agent 调 `close_agent` 并确认它停了——别把 agent 落在运行态)
        ——属于 engine 级别的连接,NOT yaml schema 的职责范围。
        TODO(未验证):codex 是否在 session 退出时回收运行中的 agent。
    multispec:
      claude: |-
        必跑「按名请求每个 teammate shut down」（bundled Agent Teams cleanup discipline——团目录在
        session 退出时自动清理，无独立 teardown 工具，剩下的纪律是别把 teammate 落在运行态）。
      codex: |-
        必跑「对每个 agent 调 `close_agent` 并确认它停了」(cleanup discipline——别把 agent
        落在运行态)。TODO(未验证):codex 的 session 退出回收行为。
    checklist:
      claude: "清理:按名请求每个 teammate shut down —— 这个请求**就是**清场手段(CC 2.1.178+ 已无 delete 工具);团目录在 session 退出时自动删除,而无视请求的 teammate 只保证在 session 结束时停止"
      codex: "清理:对每个 spawn 出来的 agent 调 `close_agent` 并确认它停了。TODO(未验证):codex 是否在 session 退出时回收 agent —— 显式关闭,不要依赖它"
    multispec_checklist:
      claude: "清理强制:按名请求 4 个 teammate 各自 shut down 并确认真的停了 —— 这个请求**就是**清场手段(已无 delete 工具);团目录在 session 退出时自动删除,而无视请求的 teammate 只保证在 session 结束时停止"
      codex: "清理强制:对 4 个 agent 各自调 `close_agent` 并确认真的停了。TODO(未验证):codex 是否在 session 退出时回收 agent —— 显式关闭,不要依赖它"

  multispec_spawn_note:
    default:
      claude: |-
        `Agent(name, run_in_background=true)` spawn 4 个后台 teammate（code-review + gstack-review +
        gstack-cso + gstack-qa），团在**第一个** spawn 时隐式形成（CC 2.1.178+ 无建团步骤、无建团
        工具）；teammate 互相 SendMessage 质询 findings 是否真问题（NOT fire-and-forget）
      codex: |-
        `spawn_agent(task_name: <specialist>, message: <brief>)` ×4 spawn 4 个 agent(code-review +
        gstack-review + gstack-cso + gstack-qa),没有建团步骤;agent 之间用 `send_input` 互相质询
        findings 是否真问题(NOT fire-and-forget)
```

### 落盘前的两个注意点

1. **`zh` 文件里 4 个 `command_*` / `teams_step_note.command` 的值是 en 文本**。
   批 D 是 en-only,这些 key 在 zh 文件中只为满足 parity 门而存在。若你不接受
   「zh 文件里放 en 值」,替代方案是把 command 面拆成独立的
   `workflows/host-primitives.command.yaml`(无 locale 维度)—— 但那要改
   `check-yaml-i18n-parity` 的作用面判定。**倾向前者**(简单,且值本来就不该被 zh 渲染引用)。

2. **`harnessed_run_warning_note.execution` 的 claude 值含换行**,是原文的折行位置。
   还原时必须连换行一起还原,否则金标红。`|-` block scalar 保留内部换行、去掉末尾换行 —— 正确。

---

## 金标自检(词表落盘前已跑)

词表不是手抄稿 —— 上面两个 YAML 片段做过机器校验,结果如下。

### 1. 解析 + key 集合对等

| 检查 | 结果 |
| ---- | ---- |
| 两个片段 YAML 解析 | ✅ 通过 |
| primitive 数 | 14 / 14 |
| 可寻址占位符数(含 variant) | 25 / 25 |
| `only en` / `only zh` 差集 | 空 / 空 ✅ |
| 每个 cell 同时有 `claude` + `codex` 列 | ✅ 25/25(渲染器对缺列 throw) |

### 2. claude 值逐字节还原

把每个 C 类 `claude` 值拿去 `includes()` 当前真实产物,**25/25 命中**:

| 值 | 比对基准 |
| -- | -------- |
| `teams_step_note.skill` en/zh | `workflows/auto/SKILL{,.zh-Hans}.md` |
| `harnessed_run_warning_note.orchestrator` en/zh | 同上 |
| `harnessed_run_warning_note.execution` en/zh | `workflows/retro/SKILL{,.zh-Hans}.md` |
| `teams_teardown_note` en/zh | `workflows/auto/SKILL{,.zh-Hans}.md` |
| `delivery_contract_note.default` en/zh | `workflows/research/SKILL{,.zh-Hans}.md` |
| `delivery_contract_note.checklist` en/zh | `workflows/role-prompts{,.zh-Hans}.yaml` |
| `teams_cleanup_note.checklist` / `.multispec_checklist` en/zh | 同上 |
| `teams_cleanup_note.deliver` en/zh | `workflows/task/deliver/SKILL{,.zh-Hans}.md` |
| `teams_cleanup_note.multispec` en/zh | `workflows/verify/multispec/SKILL{,.zh-Hans}.md` |
| `multispec_spawn_note` en/zh | 同上 |
| `harnessed_run_warning_note.command_*` / `teams_step_note.command` | `src/cli/lib/generateCommands.ts`(批 D) |

A 类拼接还原同样验过:
`{{ host.native }} {{ host.spawn_subagent }}` → `CC-native Task / Agent tool` ✅ /
`.plural` → `CC-native Task / Agent tools` ✅ / zh `.zh_tool` → `CC-native Task / Agent 工具` ✅。

### 3. 第一轮首稿踩到的 5 个坑(已修,记下来免得 T6 重犯)

| 坑 | 症状 | 修法 |
| -- | ---- | ---- |
| **block scalar 吃掉公共缩进** | `teams_teardown_note` 两条 bullet 原文各带 **3 个前导空格**,`\|-` 会把它们剥光 → 渲染出 `- **Shut…` 而非 `   - **Shut…`,金标红 | 该 key 改用**双引号 + `\n`**,不用 block scalar |
| **zh SKILL 正文是全角标点** | `task/deliver/SKILL.zh-Hans.md` / `verify/multispec/SKILL.zh-Hans.md` 用 `，（）；`,而**生成器渲染的 zh 段用半角** `,()`;首稿按半角抄 → 3 个 key 金标红 | 按文件实际字符抄,已在对应 key 上加注释 |
| 同上 | 同一个 repo 里 zh 半角 / 全角**两套并存**,取决于是生成器渲染还是手写 | T6 改这些 key 时必须逐文件确认,不能跨文件复制 |

> **给 T6 的一句话**:C 类 `claude` 值一律从真实文件 `sed -n` 抠出来,不要从 builder 源码
> 或本文档转抄 —— builder 里是带转义的 JS 模板字面量,肉眼抄必错。

### 4. 复核脚本

三个一次性脚本留在 scratchpad(未进仓库):`classify.mjs` / `delta.mjs` / `golden.mjs`。
`golden.mjs` 值得在 T2/T6 落盘后重跑一次 —— 它就是「claude 侧逐字节金标」的最小可执行版本,
比等 CI 快。落盘后可考虑把它的断言搬进 `tests/cli/hostPrimitives.test.ts`。

---
---

# 词表落盘记录(2026-09-24 第三轮)

## Q5 裁定 = (c) 移出 Phase 65 并入 F8,T11 门按短语 allowlist,外加映射小节 caveat

裁定理由(维护者,记录在案):

- **(b) 直接否决**:它会改 claude 金标,而「claude 渲染逐字节不变」是本 phase 的铁律,
  不能为措辞让步。
- `Claude Code plugin` 不是宿主原语,是**上游组件的分发渠道的客观名称** —— 就像
  「npm 包」不会因宿主改名。`{{ host.name }}` 套上去会造出「Codex plugin marketplace」
  这个不存在的事物,比保留原文更坏。
- codex 上这些 plugin 确实不可用,但那是**能力层**问题(F8:`pluginsRegistry: null` →
  plugin 类能力全告警),归 `capabilityResolver` 的告警机制管,不是正文措辞能解决的。
  Phase 65 改措辞既治不了它,又会先产出一份自相矛盾的 codex 产物。

**缓解(维护者补充)**:光 allowlist 会让 codex 用户读到「装某某 Claude Code plugin」
而去做一件做不到的事。所以在 R4 映射小节里加一行 caveat(仅 codex 渲染插入),
说明这类组件在本宿主不可用、harnessed 会在能力解析时告警。

→ 落地位置:`workflows/host-primitives{,.zh-Hans}.yaml` 的 **`host_map_notes.codex`**
(第 2 条)。该 key **不在 `primitives:` 下** —— `loadHostPrimitives` 只读
`primitives`(`src/cli/lib/hostPrimitives.ts:110`),所以它不参与占位符渲染、
不受 parity / `default` 契约约束,T10 直接消费即可,claude 产物拿到零字节。

`Claude Code` 其余 35 处照常走 `host.name`。

## 落盘结果

| 文件 | 状态 |
| ---- | ---- |
| `workflows/host-primitives.yaml` | 已覆盖写入(14 primitive / 28 占位符 / 56 cell) |
| `workflows/host-primitives.zh-Hans.yaml` | 同上,key 集合完全一致 |

### 与 T2 骨架 3 条的差异:**零差异**

`spawn_subagent.default` / `spawn_subagent.zh_tool` / `send_message.default` 六个 cell
的值与骨架**逐字相同**,已由 `tests/cli/hostPrimitives.test.ts` 的
「base file carries the Phase 65 skeleton entries verbatim」用例确认通过。

### 占位符数 25 → **28**(对上一轮报告的修正)

落盘时撞上一条上一轮没看到的硬契约:
`tests/cli/hostPrimitives.test.ts` 断言 **every primitive declares a `default` variant**
(裸占位符契约)。我的 3 个 C 类 primitive 原本没有 `default`:

| primitive | 原变体 | 补的 `default` |
| --------- | ------ | -------------- |
| `harnessed_run_warning_note` | orchestrator / execution / command_orchestrator / command_execution | 别名 → `.execution`(每 locale 19 次渲染,最广) |
| `teams_step_note` | skill / command | 别名 → `.skill`(30 处 vs 1 处) |
| `teams_cleanup_note` | deliver / multispec / checklist / multispec_checklist | 别名 → `.checklist`(最短、最通用的同一纪律) |

用 **YAML 锚点 / 别名**(`&x` / `*x`)实现,不复制文本 —— `default` 与被别名的变体
是同一个对象,永远不会漂移。调用点仍应显式写变体名;`default` 只为满足契约存在。

## 验证 exit code

| 命令 | exit | 结果 |
| ---- | ---- | ---- |
| `corepack pnpm exec vitest run tests/cli/hostPrimitives.test.ts tests/cli/renderGolden.test.ts` | **0** | 2 files / **32 tests passed**;**金标绿**(正文尚无占位符,表变大未影响产物 ✅) |
| `corepack pnpm exec vitest run tests/cli/renderSkillTemplatesHost.test.ts`(额外自查) | **0** | 1 file / 13 tests passed |
| `node scripts/check-yaml-i18n-parity.mjs` | **0** | `all en↔zh-Hans yaml pairs in structural parity (drift-only).` |
| `corepack pnpm exec biome check --write <改动文件>` | **1** | ⚠️ 非失败 —— `Checked 0 files. No files were processed in the specified paths.` biome 不处理 `.yaml` / `.md`(本次只改了这两类)。`biome.json:9-18` 的 `includes` 是 `**` 加排除项,没有排除它们,是 biome 本身无 yaml/markdown handler。**无需处理**。 |

> `check-yaml-i18n-parity.mjs` 在我运行时**未被并行改动影响**,正常通过。

## 校验脚本(批 A / 批 B 改写时反复用)

**路径**(scratchpad,未进仓库):

```
C:\Users\easyi\AppData\Local\Temp\claude\D--GitCode-harnessed\60552b8e-eaf8-41df-b654-95d4a0d5dc6c\scratchpad\golden.mjs
```

**用法**:

```bash
cd /d/GitCode/harnessed
node "C:/Users/easyi/AppData/Local/Temp/claude/D--GitCode-harnessed/60552b8e-eaf8-41df-b654-95d4a0d5dc6c/scratchpad/golden.mjs"
```

**它断言什么**(当前 ALL GREEN,exit 0):

1. **28 个 C 类 `claude` 值逐字节还原** —— 拿表里的值去 `includes()` 它必须重现的真实
   产物(`workflows/**/SKILL*.md` / `role-prompts*.yaml` / `src/cli/lib/generateCommands.ts`)。
   失败时打印**分歧字符偏移**和前后 40 字,直接定位到哪个空格/标点错了。
2. **A 类拼接还原** —— `{{ host.native }} {{ host.spawn_subagent }}` → `CC-native Task / Agent tool`
   等 3 组。
3. **结构契约**(镜像 `tests/cli/hostPrimitives.test.ts`)—— en/zh shape parity、
   每 primitive 有 `default`、每 cell 双列齐全。

**为什么值得单独留着**:它是「claude 侧逐字节金标」的最小可执行版本,~1 秒出结果,
而 `renderGolden` 要跑整条 install 路径。批 A / 批 B 每改一个 key 就跑一次,
不要等 CI。落盘稳定后可把它的断言搬进 `tests/cli/hostPrimitives.test.ts`。

> ⚠️ 脚本里 `yaml` 包走的是绝对路径 import
> (`file:///D:/GitCode/harnessed/node_modules/.pnpm/yaml@2.9.0/...`)——
> 因为 scratchpad 在仓库外,解析不到 `yaml`。换机器或升级 yaml 版本要改这一行。

## 给批 D 的 lockstep 注释替换文案

`src/cli/lib/generateCommands.ts:204-211` 现在这段:

```
    // 4.34.0 — MUST stay in lockstep with the Agent Teams step 4 in
    // workflows/*/SKILL.md (see scripts/rewrite-skill-invoke-sections.mjs). CC
    // v2.1.178+ removed the two team lifecycle tools: ...
```

**建议替换为**(批 D 取用;我没有改该文件):

```
    // Phase 65 — this step's text is NOT maintained by hand any more. It is
    // `host.teams_step_note.command` in workflows/host-primitives.yaml; the
    // sister SKILL.md rendering is `host.teams_step_note.skill` in the SAME
    // primitive, so the two wordings sit adjacent in one table and any drift
    // between them is visible on sight instead of relying on this comment.
    //
    // History: the pre-Phase-65 comment claimed the two were kept "in lockstep",
    // but they had already diverged in 5 places (an extra lead-in sentence, `and`
    // vs `;`, a dropped comma, `the \`team_name\` input is` vs \`team_name\` is`,
    // and two trailing sentences this surface inlined from TEAMS_TEARDOWN_*).
    // Both wordings are preserved verbatim in their own variant so each side's
    // golden stays byte-identical; the codex column of both variants is a single
    // convergent text, which is where the drift actually gets retired.
    //
    // Deliberately not naming the removed CC team lifecycle tools here —
    // tests/workflow/agentTeamsApiMigration.test.ts fails on those literals
    // anywhere in the live instruction surface, and this generator IS that surface.
```

同理,`:221` / `:262` 的两句 `harnessed run` 警告改取
`host.harnessed_run_warning_note.command_orchestrator` / `.command_execution`,
`:263` 的 `~/.claude/skills/<name>/SKILL.md` 按 F7b 改走 `getSkillsDir()`
(**不**过 `host.*` 表 —— 路径该由 descriptor 派生,不是文案)。

## 映射小节 caveat 文案(已落盘,此处备查)

三条,位于两个 yaml 的 `host_map_notes.codex`,仅 codex 渲染插入:

1. **`request_user_input` 可用性** —— 工具在上游存在,但本机是否默认启用未实测;
   `codex features list` 的 `default_mode_request_user_input` 是模式 flag 不是工具开关;
   澄清 round-trip 不可用时**不要猜**,输出 `STATUS: NEEDS_CLARIFICATION`。
2. **Claude Code plugin 类组件**(Q5 缓解)—— 正文里的这类名称是组件真实的分发渠道,
   不是「codex 上也有、只是叫法不同」,所以措辞原样保留;**但在本宿主上并未安装**,
   harnessed 在能力解析阶段按 capability 逐条告警;遇到这类步骤视为**不可用**并记录 skip,
   不要自行找等价物替代。
3. **codex agent 生命周期** —— session 作用域 / 退出是否自动回收 / 能否嵌套三者全未实测,
   本产物不作任何断言;请对每个 agent 显式 `close_agent`。

逐字文案见 `workflows/host-primitives.yaml` 末尾的 `host_map_notes:` 节(zh 侧同位)。

---

# 批 A 落地记录(2026-09-24 第四轮)

## 词表增补:`harnessed_run_warning_note.{orchestrator,execution}_tail`(经裁决授权)

**为什么必须加**:该 primitive 的整句值带字面 `<name>`,而渲染链上没有任何环节替换它 ——
`renderHostPrimitives`(`src/cli/lib/hostPrimitives.ts:157-186`)是纯查表 splice,
`renderSkillTemplates.ts` 只跑 capabilities + host 两趟,`src/` 全域无 `<name>` 替换。
builder 写盘在前、占位渲染在后,渲染时已拿不到 skill 名。台账第一轮/第二轮都没发现这点。

**解法(裁决采纳)**:切分点取 claude 与 codex 措辞的**最后一个共同字节** —— `(` 之后立即
分叉(`in-process` vs `an in-process`)。builder 保留字面前缀(它有名字),占位符只供尾段:

```
Do NOT pipe to `harnessed run ${name}` — that is the CI/headless path ({{ host.harnessed_run_warning_note.execution_tail }}
**不要** pipe 到 `harnessed run ${name}` —— 那是 CI/headless 路径({{ host.harnessed_run_warning_note.execution_tail }}
```

- `default` 改为别名 `.execution_tail`(使用面最广的**活**变体,19×2 渲染)。
- 两个 tail 的 codex 值逐字相同(codex 列删除了 CC 专属断言,两种措辞收敛成一种),
  用 YAML 标量锚点 `&harnessed_run_codex_tail` 复用,不复制文本。
- 整句变体 `.orchestrator` / `.execution` **保留但无活站点**,作为「前缀 + 尾段拼回来是什么」
  的可读参照;`golden.mjs` 新增 8 条 compose 断言(2 locale × 2 variant × 2 host)钉住
  「前缀 + tail === 整句参照」,所以参照不会悄悄腐烂。
- `.command_orchestrator` / `.command_execution` 仍归批 D:`generateCommands.ts` 在 TS 里跑、
  手上有工作流名,能自己替换 `<name>`,所以那两个保持整句。

词表规模:14 primitive / **30** 可寻址占位符 / **60** cell(原 28 / 56)。

## 金标口径变更(经裁决授权,改测试不改产品)

`tests/cli/renderGolden.test.ts` 原本哈希安装目录下**每一个**文件,包含 en 安装时
`cp` 留下的未渲染 `SKILL.zh-Hans.md`(`renderSkillTemplates.ts:135,153`:en 安装
`localeBodySelected === false`,既不渲染也不剥除)。zh 源带上占位符是本 phase 的本意,
却会让那 29 个死副本的 hash 必然变化 —— 把本意误判成回归。

新增 `LOCALE_SIBLING_RX`,claude 金标与 codex sanity **共用同一口径**(两侧都排除),
fixture 用脚本只删 key 不动 hash(`git diff --numstat` = `0 29`,零 insertion 即证明)。
`:170` 那条「en 安装留 sibling / zh 安装剥除」的产品行为断言**保留**,改为对真实安装树
做存在性判定,不再读金标 key。

**遗留(不在本 phase)**:en 安装确实会往 `~/.claude/skills/<name>/` 丢一份带未解析
`{{ host.* }}` 的 `SKILL.zh-Hans.md`。CC 只读 `SKILL.md`,无实际危害;
后续选项 = en 安装也剥除 sibling / 也渲染它。

## 给 T12 的对等判据建议(en/zh `host.*` 占位符集合**故意不等**)

en 侧用 `spawn_subagent.default` / `.plural`,zh 侧用 `spawn_subagent.zh_tool` —— 这是词表
设计使然(工具名不翻译,但中文行文里的量词要本地化),不是漂移。`check-skill-i18n-parity`
把 `host.*` 纳入时**不能比 variant 集合相等**,否则必红。建议判据(按严格度递增,取其一):

1. **比 primitive 集合**:`{p | p.v ∈ 占位符集}` 两侧必须相等。抓得住「一侧整段漏改」,
   放得过 variant 差异。实现最省,推荐作为起点。
2. **比 primitive 集合 + 每 primitive 的出现次数**:再抓一层「同一 primitive 少了一处」。
3. **比归一化后的 variant**:给词表加一个 `locale_variant_of:` 之类的等价类声明
   (`zh_tool ≡ default`),再比归一化集合。最严格,但要动已定稿的词表结构,
   且等价类本身会成为新的维护面 —— 除非 1/2 被实测证明漏检,否则不建议。

无论取哪条,`{{ capabilities.X }}` 那半边的现有逻辑不动。
