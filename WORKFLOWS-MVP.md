# harnessed — MVP Workflows 设计 (v2)

> 状态：✅ 已通过 `/plan-eng-review`，schema 锁定
> 3 个 MVP composition workflow 的展开描述
> 每个 workflow = 一个 `workflows/<name>/SKILL.md` 文件 + phases schema frontmatter（PROJECT-SPEC § 10）

---

## 设计原则

1. **每个 workflow 是一个 composition skill**：不写代码，只写「指挥棒」prompt 描述步骤
2. **phases schema 标准化**：所有 workflow 套 `workflows/SCHEMA.md` 定义的 yaml frontmatter（详见 PROJECT-SPEC § 10），plan-feature 作为 reference implementation
3. **上游依赖隐式声明**：phases[*].upstream 字段让 setup 引擎反向构建依赖图自动安装
4. **路由感知**：通过 `routing/*.md`（SSOT）感知触发条件，B+C 混合实现（详见 PROJECT-SPEC § 9）
5. **可中断 + 可恢复**：pause 点持久化到 `.harnessed/checkpoints/`，session 断了 `harnessed resume` 即可继续

---

## Workflow 1: `/harnessed:research`（v0.1.0 ship）

### 目标

多源调研路由：根据查询类型自动选择 Tavily / Exa / ctx7。

### 上游依赖

| 上游 | 用在哪一步 | 必需性 |
|------|-----------|-------|
| Tavily MCP | 默认查询（关键词、新闻、文档） | 必需 |
| Exa MCP | 描述式 / 学术 / 批量 URL | 必需 |
| ctx7 (CLI) | 库 / API 文档 | 必需 |

### Phases Schema

```yaml
# workflows/research/SKILL.md frontmatter（节选）
phases:
  - id: 01-classify-intent
    layer: orchestration
    upstream: harnessed-router      # 内置路由引擎，从 routing/search.md 决策
    invokes: [classify_search_intent]
    inputs: [user_query]
    outputs: .harnessed/checkpoints/01-intent.json

  - id: 02-dispatch
    layer: execution
    upstream: tavily-mcp | exa-mcp | ctx7      # 多分支
    branch_on: $01.outputs.intent_class
    branches:
      ctx7:
        invokes: ["npx ctx7@latest library", "npx ctx7@latest docs"]
      tavily:
        invokes: [tavily_search, tavily_extract, tavily_research]
      exa:
        invokes: [exa_search, web_fetch_exa]
      parallel:
        invokes: [tavily_search, exa_search]
    outputs: .harnessed/checkpoints/02-results.md

  - id: 03-merge
    layer: execution
    upstream: harnessed-router
    inputs: [$02.outputs]
    outputs: .harnessed/checkpoints/03-final.md
    pause: optional_human_review     # 用户可选审查
```

### 路由规则（routing/search.md 节选 — 符合 § 9 SSOT schema）

```yaml
---
trigger:
  keywords: [文档, docs, api, 怎么用, how to use, 库, framework]
  contexts: []

hard_route:
  default: tavily
  branches:
    - condition: "查询涉及具体库/框架/SDK API"
      route: ctx7
    - condition: "描述式 / 语义 / 学术 / 批量已知 URL"
      route: exa
    - condition: "关键词 / 时效 / 站点结构"
      route: tavily
    - condition: "拿不准"
      route: parallel
      members: [tavily, exa]

soft_hint:
  description_template: "多源调研路由 — Tavily 默认，Exa 处理描述式/学术，ctx7 处理库文档"

fallback:
  on_hook_fail: degrade_to_soft_hint
  on_both_fail: prompt_user
---
```

### 设计决策（已敲定）

- ✅ 意图分类用**规则匹配优先 + LLM 兜底**（routing/search.md hard_route 命中即定，未命中走 LLM）
- ✅ 多源合并策略：v0.1 简单按来源分段展示，不做 dedup；v0.2+ 基于 URL hash 去重
- ✅ ctx7 是 CLI 不是 MCP — 通过 `installers/cli-npm.ts` 抽象（manifest type=`cli-npm`）
- ✅ **MCP installer 强制 `--scope project`**（避开 v2.1.122 user scope bug，CC issue #54803 已知未修），所有 MCP server 配置写到项目 `.mcp.json`，禁直接编辑 `~/.claude.json`
- ✅ **Windows native 平台 npx 自动注入 `cmd /c` wrapper**（跨 OS 兼容，v0.1 cross-OS 基线必含）

---

## Workflow 2: `/harnessed:execute-task`（v0.2.0 ship）

### 目标

子任务的完整执行流程：澄清 → 编码（karpathy 心法）→ 交付保证（ralph-loop）。

### 上游依赖

| 上游 | 用在哪一步 | 必需性 |
|------|-----------|-------|
| superpowers | 步骤 1（brainstorming）+ 步骤 3（TDD 可选） | 必需 |
| karpathy-skills | 步骤 2（编码心法） | 必需 |
| mattpocock-skills | 步骤 2（按需召唤 /diagnose, /zoom-out, /grill-with-docs） | 必需 |
| ralph-loop | 步骤 4（交付保证） | 必需 |

### Phases Schema

```yaml
phases:
  - id: 01-clarify
    layer: execution
    upstream: superpowers
    invokes: [brainstorming]
    inputs: [task_description]
    outputs: .harnessed/checkpoints/01-design-memo.md

  - id: 02-code
    layer: execution
    upstream: karpathy-skills
    invokes: [think-before-coding, surgical-changes, simplicity-first]
    inputs: [$01.outputs]
    outputs: .harnessed/checkpoints/02-code-progress.md
    on_demand_invoke:                          # 按需召唤 mattpocock
      from: mattpocock-skills
      tools: [/zoom-out, /diagnose, /grill-with-docs]
      trigger: routing/execute.md             # 触发规则在 routing 文件

  - id: 03-test
    layer: execution
    upstream: superpowers
    invokes: [test-driven-development]
    conditional:
      if: core_business_logic OR algorithm OR high_reliability
      then: required
      else: optional
    inputs: [$02.outputs]
    outputs: .harnessed/checkpoints/03-test-results.md

  - id: 04-deliver
    layer: execution
    upstream: ralph-loop
    invokes: [/ralph-loop]
    args:
      prompt_template: "完成 {task}. 标准: 功能完整+测试通过+karpathy simplicity. 输出 COMPLETE"
      max_iterations: 20
      completion_promise: "COMPLETE"
    inputs: [$01.outputs, $02.outputs, $03.outputs]
    outputs: .harnessed/checkpoints/04-delivered.md
    pause: human_review
```

### 设计决策(已敲定)

- ✅ 步骤 3 TDD 决策由 **harnessed 路由器判断**（基于任务类型 keywords），未命中再问用户
- ✅ ralph-loop completion criteria 模板按任务类型分模板（`templates/ralph-criteria/{ui,backend,algorithm}.md`），v0.2 先内置 3 个，后续社区贡献
- ✅ mattpocock 主动召唤逻辑：`routing/execute.md` 定义触发关键词（"陌生模块"→zoom-out, "排错"→diagnose 等），用户也可手动调用
- ✅ **ralph-loop `--completion-promise` 不可靠**（ralph-loop issue #1429），workflow 模板**强制 `--max-iterations` 兜底**（phases SCHEMA `args.max_iterations` 显式 required，禁省略）
- ✅ **Windows 用户兼容**：`harnessed doctor` 检查 `jq` 可用性 + `bash` 解析路径（强制 Git Bash，**不接受 WSL** — 路径冲突导致 ralph-loop 跑飞）；缺失时输出可执行修复命令

---

## Workflow 3: `/harnessed:plan-feature`（v0.3.0 ship — reference implementation）

### 目标

完整的「新功能规划」流程：决策 → 澄清 → 拆解 → 持久化。
**这是 phases schema 的 reference implementation**，其他 workflow 套这个范式。

### 上游依赖

| 上游 | 用在哪一步 | 必需性 |
|------|-----------|-------|
| gstack | 步骤 1（决策关卡） | 必需 |
| superpowers | 步骤 2（brainstorming） | 必需 |
| GSD | 步骤 3 + 4（discuss-phase + plan-phase） | 必需 |
| planning-with-files | 步骤 5（持久化） | 必需 |
| ui-ux-pro-max | 步骤 2（如果是 UI 功能） | 条件 |

### Phases Schema（完整版 — § 10 reference）

```yaml
phases:
  - id: 01-gstack-decision
    layer: governance
    upstream: gstack
    invokes: [/office-hours, /plan-ceo-review, /plan-eng-review]
    inputs: [user_request]
    outputs: .harnessed/checkpoints/01-decision.md
    pause: human_review
    on_veto: halt_workflow

  - id: 02-brainstorm
    layer: execution
    upstream: superpowers
    invokes: [brainstorming]
    inputs: [user_request, $01.outputs]
    outputs: .harnessed/checkpoints/02-design-memo.md
    conditional:
      if: ui_task_detected             # 从 routing/ui.md
      then_also_invoke: [ui-ux-pro-max]

  - id: 03-gsd-discuss
    layer: orchestration
    upstream: GSD
    invokes: [/gsd-discuss-phase]
    inputs: [$01.outputs, $02.outputs]
    outputs: gsd_phase_doc

  - id: 04-gsd-plan
    layer: orchestration
    upstream: GSD
    invokes: [/gsd-plan-phase]
    inputs: [$03.outputs]
    outputs: [PLAN.md, ROADMAP.md, REQUIREMENTS.md]

  - id: 05-persist
    layer: execution
    upstream: planning-with-files
    inputs: [$04.outputs]
    outputs: [task_plan.md, progress.md, findings.md]
    pause: human_review
```

### 设计决策(已敲定)

- ✅ **gstack 命令前缀双路径验证**（v0.1 dogfooding）：
  - `harnessed doctor` 同时探测 (a) plugin 化路径预留 `claude plugin list | grep gstack` + (b) 实证路径 `git clone https://github.com/garrytan/gstack` 后命令前缀（默认 `/office-hours`、可配置 `--no-prefix`、`--prefix gstack-` 三选一）
  - workflow 模板 `invokes` 字段**必须用变量插值**（`{{gstack.command_prefix}}/office-hours`），**禁止硬编码字面量**
  - 探测结果写 `.harnessed/config.json`，workflow 引擎读取
- ✅ 步骤 1 失败（CEO veto）→ `halt_workflow`，不自动回到 step 0；用户决定是否重新构思
- ✅ 步骤 2 「UI 任务识别」：完全走 routing/ui.md 的 `trigger.keywords` + `file_globs` 规则（B+C 混合）

---

## 跨 workflow 共享设计

### 1. 状态持久化目录（详见 PROJECT-SPEC § 12）

```
<user-project>/.harnessed/
├── current-workflow.json              # 当前活跃 workflow + phase id
├── checkpoints/                       # 摘要 — 进 context
│   ├── 01-decision.md                 # < 1k token/file，强制压缩
│   ├── 02-design-memo.md
│   └── ...
├── archive/                           # 完整原始产出 — 不进 context
│   └── 01-decision-full.md
├── routing-cache.json                 # 路由决策缓存
└── .harnessed-backup/                 # rollback 备份
```

**Compact 协议**：每个 pause 点写 checkpoint 时自动 summarize（< 1k token），原始内容写 archive。后续阶段**只读 checkpoint，不读 archive**。

### 2. 命令空间冲突处理

- harnessed 命令统一前缀：`/harnessed:*`
- 上游同名命令时（如 `/plan` 在多个 plugin 都有），harnessed 永远用前缀避免冲突
- `routing/governance.md` 显式声明仲裁规则
- `manifests/conflicts.yaml` 维护已知撞名清单

### 3. 错误降级（PROJECT-SPEC § 8.5 硬约束）

- 上游不可用 → fallback 到 manifest 标记的备选（如 Tavily 挂了 → Exa）
- 必需依赖缺失 → 提示用户跑 `harnessed doctor` 修复，输出可执行修复命令
- **不允许「静默跳过」** — 任何降级都必须显式告知用户
- hook 失败 → 降级回 soft_hint（B 层），不阻塞用户
- **上游 deprecate / rename 静默失败保护**：manifest 必填 `upstream_health: { stability, last_check, fallback_action }`；`harnessed doctor` weekly 检查上游 git origin URL + 6 月无 commit 标 stale；`manifests/aliases.yaml` 维护改名重定向（Homebrew tap 教训）

### 4. Session 恢复

```bash
# session 中断后
$ harnessed status
Active workflow: plan-feature
Current phase: 03-gsd-discuss (in progress)
Last checkpoint: .harnessed/checkpoints/02-design-memo.md (2 hours ago)

$ harnessed resume                    # 从 03 继续
[harnessed] Reading checkpoint 02-design-memo.md...
[harnessed] Re-invoking GSD /gsd-discuss-phase with prior context...
```

---

## 路由透明度设计（呼应 PROJECT-SPEC § 3 「强意见 + 透明度优先」）

每次路由决策必须可见输出（默认折叠，可展开）：

```
[harnessed:research] 检测到查询类型: 库 API 文档
  ↳ 路由决策: ctx7 (来源: routing/search.md:L23)
  ↳ 备选方案: tavily (用 --route=tavily 强制切换)
  ↳ 命令: npx ctx7@latest library "Next.js" "..."
[detail] ▶
```

用户始终能看见：当前路由决策 / 决策来源（哪个 routing 文件） / 备选方案 / 实际执行命令。

---

## MVP 后路线图（v0.5+）

- 加 `verify-uat` workflow（playwright + chrome-devtools）
- 加 `ship` workflow（code-review + code-simplifier）
- 加 `ui-design` workflow（ui-ux-pro-max + frontend-design）
- 跨 harness：`.codex/` `.cursor/` `.gemini/` manifest 抽象层（B 层 soft_hint 跨平台复用，C 层硬路由按 harness 实现）
- 可视化 dashboard（参考 ECC `ecc_dashboard.py`）
- MCP Docker（GitHub MCP）+ MCP HTTP（Vercel/Cloudflare MCP）类型支持
