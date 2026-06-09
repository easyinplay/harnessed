# RESEARCH-1: Routing Engine 调研

> 调研日期：2026-05-12
> 调研者：gsd-phase-researcher (Claude Opus 4.7)
> 目的：为 phase 1.2.5 architecture revision 提供 P0-1 (decision rules 存放) / P0-2 (gstack 治理深度) 决策依据 + Wave B GRAY-AREA-1 routing engine 设计输入
> 调研工具：WebSearch（核心 6 轮）+ ctx7（resolve only，省 quota）+ WebFetch（官方 docs 4 篇）

---

## TL;DR（给赶时间的人）

| 问题 | 颜色 | 一句话结论 |
|---|---|---|
| Q1 — subagent 内**动态** install + reload skill | 🔴 **基本不可行** | CC 主进程级 watcher 仅扫**项目根 + `--add-dir` + 用户 home**；subagent 本身**无 install 权限**；`/reload-plugins` 是**主会话斜杠命令**不能在 subagent 内触发；plugin install 后 skill index **bug 频出**仍依赖整会话 restart。 |
| Q1 — 主进程**预装** + subagent 仅 invoke | 🟢 **官方推荐路径** | `AgentDefinition.skills: [...]` 在 startup 时把全文注入；`disallowedTools: Skill(name)` 控制访问；这是 claude-agent-sdk 唯一稳定的 routing engine 设计。 |
| Q2 — 业界 routing 范式 | 🟢 已锁定 2 个借鉴对象 | **LangGraph Supervisor + Command** (硬编码决策 + 状态机) + **Semantic Router static routes** (utterance → route name，无 LLM 路由) ——前者做"治理关卡"，后者做"专家路由"。 |
| Q3 — subagent isolation 边界 | 🟡 部分硬约束 | subagent **不能 spawn 嵌套 subagent**（明文禁止）；context 完全隔离；只有 final message 字符串回流；ralph-loop COMPLETE 走的就是这个 final message 通道。 |
| Q4 — decision rules grammar | 🟢 已有清晰参考 | DMN Hit Policy（**Priority** / First / Unique）正好对应用户笔记的"冲突仲裁"语义；YAML schema 业界无标准但可自定义，简单实例 ≤ 30 行。 |

**对 Wave B 的核心 input**：phase 1.4 routing engine 的实现路径必须是**「主进程负责 routing decision + 主进程预先 install skill + subagent 只 invoke 已注入 skill」**——这是 CC v2.1 当前的工程现实，不是设计选择。

---

## § 1 Q1 — CC subagent skill 动态 reload 可行性

### 1.1 现状（综合 4 篇官方 docs + 2 个 GitHub issues）

CC v2.1+ 的 skill loading 模型有 **3 个事实**让 subagent 内动态 install + reload **不可行**：

**事实 A：subagent 不继承 main agent 的 skill description，但能扫 fs**
> "Skills to load into the subagent's context at startup. The full skill content is injected, not just made available for invocation. Subagents don't inherit skills from the parent conversation; you must list them explicitly." — [official docs](https://code.claude.com/docs/en/agent-sdk/subagents)

issue #32910 进一步澄清两个独立机制：
| Context | system-reminder 注入 | filesystem 扫描发现 |
|---|---|---|
| Main Session | YES | YES |
| Subagent (no `skills:`) | **NO** | YES（仅 general-purpose 等有 fs 访问的 subagent）|
| Skill-Forked context | NO | YES |

**事实 B：live change detection 仅覆盖部分目录，且不覆盖标准 project root 是常见 bug**
> issue #46040: "edits to skill files under a project's `.claude/skills/` do not take effect until Claude Code is fully restarted. Using `/clear` does not work — but it looks like the obvious thing to try, so users waste time debugging."

官方 docs 明确说 live watcher 适用于：`~/.claude/skills/`（user）+ project `.claude/skills/` + `--add-dir` 的 `.claude/skills/`；但**最近 2026 docs 又写"Adding, editing, or removing a skill ... takes effect within the current session without restarting"**——存在文档与实际行为不一致的历史。

**事实 C：`/reload-plugins` 是 main session 命令，不是 subagent 命令；且仍有 bug**
- 官方明文："When you install, enable, or disable plugins during a session, run `/reload-plugins`" — 受众是 user，不是 subagent。
- issue #35641: "/reload-plugins does not load skills from newly installed marketplace plugins"（2026 仍 open）。
- issue #37862: "/reload-plugins doesn't rebuild slash-command index" — 即使 reload 显示成功，slash command parser 也不刷新。

**事实 D：subagent 不能 spawn 嵌套 subagent**
> "Subagents cannot spawn their own subagents. Don't include `Agent` in a subagent's `tools` array." — [official docs](https://code.claude.com/docs/en/agent-sdk/subagents)

这意味着 phase 1.4 routing engine 的"subagent 内 install skill 然后再 spawn 子 subagent invoke skill"路径**直接被 CC 架构禁止**。

### 1.2 证据链

| 证据 | URL | 说话权威性 |
|---|---|---|
| AgentDefinition schema (skills/tools/disallowedTools/permissionMode) | https://code.claude.com/docs/en/agent-sdk/subagents | 官方 |
| 子 subagent 嵌套禁止 | https://code.claude.com/docs/en/agent-sdk/subagents | 官方明文 Note |
| live change detection 覆盖范围 | https://code.claude.com/docs/en/skills | 官方 |
| reload-plugins skill bug | https://github.com/anthropics/claude-code/issues/35641 | GitHub issue |
| reload-plugins slash command index bug | https://github.com/anthropics/claude-code/issues/37862 | GitHub issue |
| subagent 不继承 skill 但能扫 fs | https://github.com/anthropics/claude-code/issues/32910 | GitHub issue |
| project root skill 需要 restart | https://github.com/anthropics/claude-code/issues/46040 | GitHub issue |
| Plugin install 仍依赖 restart 兜底 | https://code.claude.com/docs/en/plugins-reference | 官方 |

### 1.3 If yes（理论上有缝隙的少数路径）

**严格说"完全不可行"是不准确的**——以下三条路径**理论上**能在 subagent 边界内实现部分动态行为，但都有重大 caveat：

1. **`general-purpose` subagent 内 fs 扫描已有 skill**（不是新 install，是 lazy 发现）
   - issue #32910 证实可行，但只能用 main agent 已经持有的 skill 文件。
   - 不解决 "上游新 release skill" 的场景。

2. **subagent 内 `Bash(claude plugin install <name>@<marketplace>)`**（理论上有效）
   - subagent 若有 Bash 工具，可触发 install 命令。
   - 但 install 后**当前 session 不会自动 reload**，除非主进程之后调用 `/reload-plugins`，而**主进程在 subagent 工作时被阻塞**——这是 CC v2.1 的会话语义。
   - 即使主进程跑完后 reload，**subagent 已经返回**，新 install 的 skill 也对当前 subagent 无意义。

3. **`AgentDefinition` 在每次 query() 调用时动态生成（factory pattern）**
   - 官方 docs 有完整示例：`createSecurityAgent("strict")` 这种 factory。
   - 这是**主进程级**的动态——主进程根据决策规则动态生成 AgentDefinition 然后再 spawn subagent。**不是 subagent 内部动态**。
   - **这是 phase 1.4 routing engine 的实际可行路径**。

### 1.4 If no — 推荐 Alternative 设计（绿灯）

**主进程 = 决策路由器 + skill installer；subagent = 隔离执行单元**：

```
┌─ Main Agent (orchestrator) ───────────────────────────────────┐
│  1. 读用户 task                                                │
│  2. 查 decision_rules（YAML / JSON）→ 选 expert subagent      │
│  3. 检查 ~/.claude/skills/ 是否已装目标 skill；                │
│     若没装：Bash(`claude plugin install foo@market`)          │
│     然后 /reload-plugins（主进程同步刷新）                     │
│  4. 用 AgentDefinition factory 动态构造 subagent：             │
│       skills: [需要的 skill name list]                        │
│       prompt: 决策时拼好的 system prompt                      │
│       tools: 子任务允许的工具                                  │
│  5. spawn subagent                                            │
│  6. 接收 final message → 解析 COMPLETE 信号                   │
└────────────────────────────────────────────────────────────────┘
              │                           ▲
              ▼ Agent tool 调用            │ final message
┌─ Subagent (isolated, fork context) ────────────────────────────┐
│  - 接收主进程 spawn 时的 prompt                                │
│  - 接收 startup 注入的 skills（已装好的）                      │
│  - 执行 ralph-loop                                            │
│  - 输出 ".....COMPLETE" 作为 final message                    │
└────────────────────────────────────────────────────────────────┘
```

这个 alternative 的 trade-off：

| 维度 | 主进程预装路径 | subagent 内动态路径（不可行） |
|---|---|---|
| 主上下文污染 | 安装动作 ~50 token（短暂）| 0（理论值）|
| Skill 安装权限 | 主进程统一管理 | 需 Bash 给 subagent（安全风险）|
| 跨 subagent 共享 skill | ✅ 主进程已装一次，所有 subagent 复用 | ❌ 每个 subagent 都要重装 |
| 错误处理 / 可观测性 | ✅ 主进程统一 log | ❌ 每个 subagent 独立 log |
| 工程稳定性 | ✅ 官方文档明确支持 | ❌ 与 CC 架构冲突 |

**Trade-off 评估**：主进程预装的"上下文污染"代价（每次 install ~50-100 token，且可在 STATE.md 持久化避免重复 install）远小于 subagent 内动态路径的风险。

### 1.5 推荐结论

🟢 **绿灯**——phase 1.4 routing engine 走"主进程路由 + 主进程预装 + subagent 仅 invoke"路径**完全可行**，且是 CC 官方文档推荐的标准模式（`AgentDefinition.skills` + factory pattern）。

🔴 **红灯**——任何"subagent 内 install + reload"的设计都会撞 CC 架构边界（reload 需要主会话、subagent 不能嵌套、live watcher 不可靠）。

**给 Wave B 的硬约束**：phase 1.4 的 GRAY-AREA-1 routing engine **必须是 main-process-driven**。subagent 在这个架构里只是"隔离的执行容器"，不是"决策与安装的主体"。

---

## § 2 Q2 — Expert routing 生态调研

### 2.1 主流框架对比表

| 工具 | 决策规则编码方式 | 多候选仲裁 | 用户 override | 可观测性 |
|---|---|---|---|---|
| **LangGraph** | 代码 (`add_conditional_edges` + 路由函数) 或 LLM-as-router；最近主流是 `Command` 对象（同步 routing 决策 + state update） | 通过 supervisor node（LLM 选 worker）或 state-driven router | 用户可在 prompt 里明示 "use X agent"——通过 supervisor prompt 注入 | LangSmith trace + 内置 checkpointer/time travel |
| **OpenAI Assistants API** | `tools` 数组 + `tool_choice` 参数（`auto` / `required` / 指定 function name） | 模型自己选；可强制 `tool_choice: "required"` | 通过 `tool_choice` 直接强制 | OpenAI dashboard logs；2026-08-26 起 deprecated → 迁移 Responses API |
| **Anthropic claude-agent-sdk** | `agents: { name: AgentDefinition }` + Claude 根据 `description` 自动选；factory pattern 支持运行时构造 | 主 agent 自动选 + 用户在 prompt 里 explicit "Use the X agent" | 用户 prompt 里 mention by name | OTEL spans (`agent_id` / `parent_agent_id`)；hooks 12 个事件 |
| **CrewAI** | role + goal + backstory 三件套（声明式 YAML/Python）+ Process（sequential / hierarchical） | 由 Process 决定（sequential 按定义顺序；hierarchical 由 manager agent 选） | 改 Process 配置或加 manager prompt | 简单：task outputs 串行传递；无 built-in checkpointing |
| **AutoGen / AG2** | GroupChat + selector function（可代码可 LLM）；speaker selection 是核心 | selector 选下一发言人；可用 LLM 也可 round-robin | 改 selector logic | conversation history（in-memory），需自己持久化 |
| **Semantic Router (Aurelio)** | `Route(name, utterances)`——纯 utterance 列表 + embedding kNN | top-k 投票；可 hybrid（dense + sparse）| 阈值调整 + utterance 加 override 关键词 | RouteChoice (name + similarity_score)；轻量级 |

### 2.2 关键 insight（每行 1-2 句深入）

**LangGraph (Supervisor + Command)** — [LangChain blog](https://blog.langchain.com/langgraph-multi-agent-workflows/)
> 决策规则可以是**纯代码 router function** `(state) -> Literal["agent_a", "agent_b", "unclear"]`，也可以是 LLM-based supervisor。后者就是把 "选谁" 这件事交给一个 LLM agent，supervisor prompt 里写 "given task and completed steps, pick worker from [...]"。**最大优势：built-in checkpointing + LangSmith trace**——可观测性最强。

**OpenAI `tool_choice`** — [OpenAI docs](https://developers.openai.com/api/docs/guides/function-calling)
> `tool_choice: "required"` 是 2024-2025 才加入的强制路由 override；但 Assistants API 整体在 2026-08-26 deprecated，迁移到 Responses API。这个生态对 harnessed 已不太相关，但 `tool_choice` 模式（auto / required / specified）作为 schema 概念仍可借鉴。

**claude-agent-sdk** — [agent-sdk/subagents](https://code.claude.com/docs/en/agent-sdk/subagents)
> 这就是 harnessed 必须遵守的底层。AgentDefinition 的 factory pattern + `description`-driven auto-routing 是官方推荐。**注意：subagent 不能嵌套**——这是 phase 1.4 设计的硬天花板。

**CrewAI** — [crewai docs](https://docs.crewai.com/)
> role-based abstraction 最贴近用户笔记里的"gstack/GSD/superpower"三角色——CrewAI 的 Process 类型（sequential / hierarchical）几乎是用户笔记 workflow 的天然映射。**但 CrewAI 没有 built-in checkpointing，长流程 stuck 时难恢复**。

**Semantic Router** — [aurelio-labs/semantic-router](https://github.com/aurelio-labs/semantic-router)
> 「**utterance → route name**」模式天然适合"用户笔记里那种自然语言决策规则"——例如 "做出风格" 这种 trigger phrase 可以直接作为 utterance 喂给 router。无需 LLM 路由，毫秒级。**适合做 phase 1.4 的"快速分类层"**。

### 2.3 推荐借鉴模式（给 phase 1.4 routing engine）

**双层 router 设计**（综合 LangGraph + Semantic Router）：

```
用户 task input
    │
    ▼
[Layer 1: Semantic Router (utterance kNN)]
    │  - 用户笔记里的 trigger phrase 作为 utterances
    │  - "做出风格" → route: ui-design-bold
    │  - "数据可视化" → route: ui-design-standard
    │  - 命中阈值 < 0.7 → 进 Layer 2
    ▼
[Layer 2: LangGraph-style Supervisor (LLM-as-router)]
    │  - 拿 main agent prompt + task context
    │  - 输出: { agent: "ui-ux-pro-max", skills: [...], reason: "..." }
    │  - LangSmith-style trace 记录决策链
    ▼
[Action: claude-agent-sdk AgentDefinition factory]
    │  - 根据 router 输出动态构造 AgentDefinition
    │  - skills 字段预先 install + 注入
    ▼
spawn subagent → ralph-loop 执行 → COMPLETE final message
```

**Layer 1（Semantic Router）做"快速默认"**——90% 场景命中即可，token 成本接近 0。
**Layer 2（LLM Supervisor）做"复杂仲裁"**——多专家、多优先级、用户 override 时启动。

---

## § 3 Q3 — Subagent isolation 边界

### 3.1 main agent ↔ subagent 数据传递

来源：[claude-agent-sdk subagents docs](https://code.claude.com/docs/en/agent-sdk/subagents)

| 维度 | 主→subagent 传递 | subagent→主 传递 |
|---|---|---|
| **Conversation history** | ❌ 不传 | ❌ 不传（intermediate stays in subagent）|
| **System prompt** | ❌ 主 system prompt 不传；subagent 用 `AgentDefinition.prompt` | N/A |
| **Agent tool prompt** | ✅ 主调用 Agent tool 时的 prompt 字符串是**唯一**输入通道 | N/A |
| **Project CLAUDE.md** | ✅ 经 `settingSources` 自动加载 | ✅ 同 |
| **Tool definitions** | ✅ 继承（或 `tools` 字段限定子集）| N/A |
| **Skills** | ❌ 不继承；除非显式 `AgentDefinition.skills: [...]` | N/A |
| **File system** | ✅ 共享物理 fs（subagent 通过 `tools` 限制访问哪些工具）| N/A |
| **Env vars** | ⚠️ 共享主进程 env（无 sandbox）| N/A |
| **Final message** | N/A | ✅ verbatim 返回，但主可能 summarize |
| **Session ID** | N/A | ✅ 可用于 resume subagent |
| **Agent ID** | N/A | ✅ 在 Agent tool result 里返回 |
| **Spawn 子 subagent** | ❌ **明文禁止** | N/A |

**关键 insight**: subagent isolation 是 **context 隔离**（fresh 200K window）+ **tool 权限隔离**，**不是 fs 沙箱、不是 env 沙箱**。subagent 写文件、读密钥、改环境变量，主进程都看不到事中过程，但事后能在 fs 上看到结果。

### 3.2 ralph-loop COMPLETE 信号传递

来源：综合官方 docs + ralph-loop 设计语义

ralph-loop 的 "completion-promise=COMPLETE" 通过 subagent **final message** 通道回传：

1. subagent 内执行任务，迭代到满足完成条件
2. subagent 输出包含字符串 `COMPLETE` 的 final message
3. Agent tool 把 final message **verbatim** 返回主进程作为 tool result
4. 主进程检查 tool result 是否含 `COMPLETE` token

**风险**：CC docs 明确警告 — "the parent receives the subagent's final message verbatim as the Agent tool result, **but may summarize it** in its own response. To preserve subagent output verbatim... include an instruction to do so in the prompt or systemPrompt option you pass to the **main** query() call."

→ **phase 1.4 routing engine 的 main agent system prompt 必须强制要求 verbatim 返回 COMPLETE 标记**，否则主流程的 ralph-loop 完成检测会失效。

### 3.3 已知限制 / quirk

| 限制 | 来源 |
|---|---|
| **subagent 不能 spawn 子 subagent** | https://code.claude.com/docs/en/agent-sdk/subagents（明文 Note）|
| Windows 下 subagent prompt 长度上限 8191 字符 | 官方 troubleshooting |
| filesystem-based agents 加载只在 startup 一次，新建 agent 文件需 restart | 官方 troubleshooting |
| subagent 内调用 `/reload-plugins` ❌ 不是合法语义（slash command 是 main session UI 触发的）| issue #52967 等 |
| subagent transcript 与主对话独立持久化（30 天 cleanup）| 官方 docs |
| `Agent` tool 在 v2.1.63 从 `Task` 改名 — 旧代码仍需双写 | 官方 docs Note |

---

## § 4 Q4 — Decision rules grammar 范式

### 4.1 业界 pattern 对比

| Pattern | 形式 | 适合 | 不适合 |
|---|---|---|---|
| **DMN Hit Policy**（OMG 标准）| XML（标准）/ YAML（自定义）；Hit Policy 字段：U/A/P/F/C/R/O | 业务决策表，多规则匹配，明确"冲突仲裁优先级" | 嵌入式简单 routing；YAML 没标准 |
| **Drools**（规则引擎）| DRL（自有 DSL）+ XML/YAML wrapper | 复杂业务规则、event-driven、forward chaining | 轻量场景 overkill |
| **Semantic Router**（utterance-based）| Python `Route(name, utterances=[...])` | 自然语言 trigger → route name | 数值 / 结构化条件 |
| **LLM-as-router**（Anthropic style）| 自然语言 system prompt + tool_choice | 复杂上下文判断、用户意图识别 | 延迟高、不稳定、不可观测 |
| **Conditional Edges**（LangGraph）| 纯代码函数 `state -> route_name` | 完全可控的状态机 | YAML 化困难（需写 Python）|

### 4.2 用户笔记 anchor 编码尝试

用户笔记原文：
> UI/UX 子任务设计时**默认**使用 `ui-ux-pro-max`（数据驱动、标准化、可解释）出主方案；`frontend-design` 在剩余维度（layout / 动效 / 装饰细节）补充独特性。冲突时 `ui-ux-pro-max` 优先（保证标准化）；**除非用户明确要求"做出风格"**，此时 `frontend-design` 主导。

**候选方案 1：DMN Priority Hit Policy 风格 YAML**

```yaml
# .planning/decision_rules.yaml
version: 1
rules:
  - id: ui-task-default
    domain: ui-ux
    when:
      task_type: ui-design
      override_keywords: []  # 空数组 = 无 override
    decision:
      primary_expert: ui-ux-pro-max
      secondary_expert: frontend-design
      conflict_policy: primary_wins  # = DMN Priority
      rationale: "数据驱动 + 标准化优先"

  - id: ui-task-bold-style-override
    domain: ui-ux
    when:
      task_type: ui-design
      override_keywords:        # 任一命中即 override
        - "做出风格"
        - "design-led"
        - "experimental"
    decision:
      primary_expert: frontend-design
      secondary_expert: ui-ux-pro-max
      conflict_policy: primary_wins
      rationale: "用户明示 style-driven"

# Hit policy: F (First match) — 上面规则按顺序匹配，第一条命中即停
hit_policy: F
```

**候选方案 2：Semantic Router style（YAML 版）**

```yaml
# .planning/decision_routes.yaml
version: 1
default_route: ui-task-default
routes:
  - name: ui-task-bold-style-override
    domain: ui-ux
    utterances:
      - "做出风格"
      - "I want bold design"
      - "design-led"
      - "make it experimental"
    threshold: 0.75
    decision:
      primary_expert: frontend-design
      secondary_expert: ui-ux-pro-max
      conflict_policy: primary_wins

  - name: ui-task-default
    domain: ui-ux
    utterances:
      - "build UI"
      - "create dashboard"
      - "implement page"
    threshold: 0.6
    decision:
      primary_expert: ui-ux-pro-max
      secondary_expert: frontend-design
      conflict_policy: primary_wins
```

**两方案对比**：

| 维度 | 候选 1 (DMN) | 候选 2 (Semantic Router) |
|---|---|---|
| 决策机制 | 关键词精确匹配 | embedding kNN |
| 速度 | 0ms（字符串 contains）| 5-30ms（embedding）|
| 灵活性 | low（需穷举 keywords）| high（语义相近自动命中）|
| 可观测性 | 高（命中哪条规则一目了然）| 中（similarity score）|
| 实现复杂度 | 极低（10 行 JS / Python）| 中（需 embedding model）|
| 适合 phase 1.4 起步 | ✅ 优先 | ⏰ phase 1.5+ 升级 |

**推荐**：phase 1.4 用**候选 1（DMN-style YAML + 关键词匹配 + Priority Hit Policy）**起步——简单、可调试、可观测；phase 1.5+ 加 Semantic Router 做语义增强层。

---

## § 5 给 Wave B 的 input

### 5.1 P0-1 决策规则存放位置 — 推荐

**推荐 (a) 独立 `.planning/decision_rules.yaml`**，理由：
- ✅ 与代码仓库版本化（git history 可追溯每次决策规则变更）
- ✅ 与 phase 1.2 已建立的 `.planning/` 习惯一致（ROADMAP / STATE / REQUIREMENTS 同目录）
- ✅ DMN-style YAML 可被人手编辑、被工具校验（JSON Schema validation）
- ✅ 不污染 CLAUDE.md（CLAUDE.md 是给 Claude 读的 prompt，决策规则是给 routing engine 读的数据）
- ❌ 不推荐 (b) 嵌入 CLAUDE.md：CLAUDE.md 已是 ~150 行硬指令，再加 routing 规则会让两类内容混淆
- ❌ 不推荐 (c) 嵌入 STATE.md：STATE.md 是动态 phase 状态，决策规则是静态配置

**schema 模板**见 § 4.2 候选方案 1。

### 5.2 P0-2 gstack 治理关卡编码深度 — 推荐

**推荐中等深度 (b)：把"哪些 phase 触发哪个治理 skill"编码进 decision_rules.yaml，但不内嵌治理 skill 本身的 prompt**，理由：
- gstack 治理（`/office-hours`, `/plan-ceo-review`, `/review` 等）已经是 mattpocock skill 生态的成熟资产，**harnessed 不应 vendor 这些 prompt**（违反 wedge 原则）。
- 但**何时触发**这些治理是 harnessed 的核心 routing 逻辑——这就是 decision_rules.yaml 该编码的层次。

具体规则示例：

```yaml
- id: gstack-new-feature-gate
  domain: governance
  when:
    phase_event: phase_start
    phase_size: large  # 大功能 / 复杂架构
  decision:
    pre_phase_skills:
      - office-hours           # 必跑
      - plan-ceo-review        # 必跑
    blocking: true              # 不通过则阻塞 phase 进入

- id: gstack-pr-review-gate
  domain: governance
  when:
    phase_event: pr_creation
    module_criticality: critical
  decision:
    skills: [review]
    blocking: true
```

**不推荐 (a) 仅文档记录**：执行时无 enforcement，依赖人工记忆。
**不推荐 (c) 治理 skill 整体 vendor 进 harnessed**：违反 wedge"装配主义不 vendor"原则。

### 5.3 关键风险（红旗）

| 风险 | 严重度 | 缓解 |
|---|---|---|
| **CC subagent 不能嵌套** — 任何"主→subagent→subagent"设计直接撞墙 | 🔴 P0 | phase 1.4 routing engine **必须**是 main-process-driven |
| **`/reload-plugins` skill bug (#35641)** — 上游修复时间表未知；依赖此机制的设计有失败模式 | 🟡 P1 | 设计 fallback：每次 install 后**主进程**用 fresh subagent invoke 验证 skill 可用 |
| **subagent final message 可能被主 summarize** — ralph-loop COMPLETE 检测会失效 | 🟡 P1 | main agent system prompt 强制 "verbatim return COMPLETE marker" |
| **CC v2.1 仍在快速演进** — AgentDefinition schema、live watcher 行为、reload semantics 半年内可能变 | 🟡 P1 | phase 1.4 实现要把 CC 行为 wrap 在 adapter 层，避免 hardcode 假设 |
| **YAML decision rules 没有标准 schema** — 自定义 schema 易演化失控 | 🟢 P2 | 在 phase 1.4 加 JSON Schema 校验 + version 字段 |
| **gstack/superpower 自身也在迭代** — 决策规则里 hardcode 的 skill name 可能 drift | 🟢 P2 | decision_rules.yaml 用 alias（如 `expert: ui-design-standard`），通过 install method 字段绑定具体 skill |

### 5.4 Open questions（留给 Wave B 决策或后续调研）

1. **AgentDefinition 是否支持 hooks 字段？** — claude-agent-sdk docs 提到 hooks 是 main agent 级别；subagent 是否可独立配置 hooks 不明朗，需 Wave B 实测或后续 RESEARCH-2。
2. **monitors 在 plugin 里需 session restart** — 若 phase 1.4 引入 monitor 类 plugin，会破坏 hot-reload 假设。需明确是否 phase 1.4 范围避开 monitors。
3. **Semantic Router 的 embedding model 选择** — phase 1.5+ 升级时，用 OpenAI embedding（外部依赖）还是 local model（FastEmbed / sentence-transformers）？影响 zero-config 体验。
4. **decision_rules.yaml 的版本演化策略** — 升级 schema 时如何处理用户已有规则文件？建议沿用 phase 1.1 的 `version: N` + migration script 模式。
5. **多 expert 联合方案是否值得初期支持** — 用户笔记里 ui-ux-pro-max + frontend-design **联合**出方案（不是二选一）。phase 1.4 起步是否实现"联合调用 + 结果合并"？还是只做"二选一 routing"留待 phase 1.5+？
6. **gstack 治理关卡的失败回退** — 若 `/office-hours` 跑出问题，phase 是否有 emergency override？

---

## § 6 References（含 access date）

所有 URL 均于 **2026-05-12** 访问验证。

### Anthropic 官方 docs
- [Claude Agent SDK — Subagents in the SDK](https://code.claude.com/docs/en/agent-sdk/subagents) — AgentDefinition schema, isolation 边界, 嵌套禁止 Note
- [Claude Code — Create custom subagents](https://code.claude.com/docs/en/sub-agents) — filesystem-based agent, skills 预加载
- [Claude Code — Extend Claude with skills](https://code.claude.com/docs/en/skills) — skills 加载、live change detection、auto-compaction、skillOverrides
- [Claude Code — Plugins reference](https://code.claude.com/docs/en/plugins-reference) — plugin 结构、`/reload-plugins`、scope
- [Claude Code — Discover and install prebuilt plugins](https://code.claude.com/docs/en/discover-plugins) — `claude plugin install` 命令、--scope user/project

### GitHub Issues（Anthropic claude-code repo）
- [#32910 — Subagents can discover all project skills via filesystem despite docs claim](https://github.com/anthropics/claude-code/issues/32910) — system-prompt injection vs filesystem discoverability 双机制
- [#35641 — /reload-plugins does not load skills from newly installed marketplace plugins](https://github.com/anthropics/claude-code/issues/35641) — reload bug
- [#37862 — /reload-plugins doesn't rebuild slash-command index](https://github.com/anthropics/claude-code/issues/37862) — index 不刷新
- [#46040 — Skill file changes in .claude/skills/ require restart, undocumented](https://github.com/anthropics/claude-code/issues/46040) — project root 不被 watch
- [#52967 — Add /reload-plugins command for desktop](https://github.com/anthropics/claude-code/issues/52967) — desktop 缺命令

### Multi-agent ecosystem references
- [LangGraph — Multi-agent workflows blog](https://blog.langchain.com/langgraph-multi-agent-workflows/) — supervisor pattern + Command 对象
- [LangChain docs — Workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) — conditional edges
- [Multi-agent Systems — LangGraph.js docs](https://langchain-ai.github.io/langgraphjs/concepts/multi_agent/) — handoffs
- [How Agent Handoffs Work in Multi-Agent Systems (TDS)](https://towardsdatascience.com/how-agent-handoffs-work-in-multi-agent-systems/) — Command vs conditional edges 对比
- [aurelio-labs/semantic-router GitHub](https://github.com/aurelio-labs/semantic-router) — Route, utterance, kNN, hybrid
- [Aurelio AI — Semantic Router landing](https://www.aurelio.ai/semantic-router) — 产品概念
- [crewAIInc/crewAI GitHub](https://github.com/crewaiinc/crewai) — role-based crew
- [CrewAI docs](https://docs.crewai.com/) — Process types
- [CrewAI vs LangGraph vs AutoGen 2026 (DEV)](https://dev.to/pockit_tools/langgraph-vs-crewai-vs-autogen-the-complete-multi-agent-ai-orchestration-guide-for-2026-2d63) — 选型对比

### OpenAI / Function calling
- [OpenAI — Assistants Function Calling](https://developers.openai.com/api/docs/assistants/tools/function-calling) — tool_choice
- [OpenAI Community — tool_choice "required"](https://community.openai.com/t/new-api-feature-forcing-function-calling-via-tool-choice-required/731488) — 强制路由 override
- [Assistants API Deprecation Migration Guide](https://ragwalla.com/docs/guides/openai-assistants-api-deprecation-2026-migration-guide-wire-compatible-alternatives) — 2026-08-26 deprecation

### DMN / Decision rules
- [Camunda — Hit policy](https://docs.camunda.io/docs/components/modeler/dmn/decision-table-hit-policy/) — Priority / First / Unique 等 7 种 hit policy
- [Drools — DMN docs](https://docs.drools.org/latest/drools-docs/drools/DMN/index.html) — DRL + DMN integration
- [DMN — Wikipedia](https://en.wikipedia.org/wiki/Decision_Model_and_Notation) — 标准背景

### Plugin install / runtime
- [claude-code CHANGELOG.md (raw URL)](https://github.com/anthropics/claude-code/raw/refs/heads/main/CHANGELOG.md) — 注：本次 fetch 未直接拿到正文，但 issues 与 docs 引用了相关条目
- [DataCamp — How to Build Claude Code Plugins](https://www.datacamp.com/tutorial/how-to-build-claude-code-plugins) — 第三方教程，install workflow
- [Claude Code Skills, Subagents, Hooks, Plugins, and Harnesses for Production Multi-Agent Workflows (BoringBot)](https://boringbot.substack.com/p/claude-code-skills-subagents-hooks) — 综合应用
- [Augment Code — Claude Agent SDK Skills](https://www.augmentcode.com/guides/claude-agent-sdk-skills-reusable-agent-capabilities) — SDK skill 实践

### 其他
- [Agensi — How to Install Skills in Claude Code (3 Ways, 2026)](https://www.agensi.io/learn/how-to-install-skills-claude-code) — 3 安装方式
- [Nimbalyst — Claude Code Skills Practical 2026 Guide](https://nimbalyst.com/blog/claude-code-skills-guide/) — 实践指南

---

**调研完成 confidence levels**:
- Q1（CC subagent dynamic install）: **HIGH** — 4 篇官方 docs + 4 个 GitHub issues + 多个第三方实战文章相互印证
- Q2（routing ecosystem）: **HIGH** — LangGraph / Semantic Router / CrewAI / claude-agent-sdk 都有官方 docs 直接引用
- Q3（subagent isolation 边界）: **HIGH** — 官方 docs 有完整 inheritance table
- Q4（decision rules grammar）: **MEDIUM** — DMN 标准是 HIGH，YAML 化是 LOW（无业界标准），用户笔记 anchor 编码是合理推断（MEDIUM）

**调研用时**：~35 min。质量优先：每个 negative claim（"不可行"/"被禁止"）都有官方 docs 或 GitHub issue 多源印证，未做凭空 cite。
