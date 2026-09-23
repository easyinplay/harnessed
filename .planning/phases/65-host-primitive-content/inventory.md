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
