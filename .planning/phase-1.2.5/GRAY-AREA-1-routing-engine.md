# GRAY-AREA-1: Main-Process-Driven Routing Engine 设计

> **目的**: capture A7' (superpower brainstorming + TDD 触发) + A8' (6 category × decision rules) + 部分 A3' (env quality layer enforcement) — phase 1.2.5 8 支柱 acceptance bar
> **依据**: R1 § 1.4 / § 2.3 / § 4.2 + R2 § 1 / § 4.1 / § 4.3 + ASSUMPTIONS § C P0-1 (a) / P0-2 (b) / P0-5 hybrid
> **状态**: ✅ 完成 (Wave B.2)

---

## § 1 Routing Engine 定位（D1.2.5-3 锁定）

**Main-process-driven** — routing engine 在主流程跑，不在 subagent 内（CC 架构禁止 subagent 内 install + reload — F33 finding 实证）。

```
┌─ Main Agent (orchestrator) ──────────────────────────────────┐
│  [Routing Engine v1 — phase 1.4 实装]                        │
│   1. 接收用户 task / 子任务 description                       │
│   2. 双层 router (L1 关键词 + L2 LLM supervisor):             │
│      L1 [Semantic Router style — v0.1 用 DMN 关键词]         │
│         读 .planning/decision_rules.yaml → match 关键词       │
│      L2 [LangGraph Supervisor — 仅复杂仲裁触发]               │
│         多专家 / 多优先级 / 用户 override → LLM 决策          │
│   3. 决策输出: { category, primary_skill, secondary_skill,    │
│                  conflict_policy, override_signals }          │
│   4. 检查 ~/.claude/skills/ 是否已装目标 skill                │
│      若没装: Bash(`claude plugin install <name>@<market>`)   │
│              + /reload-plugins (主进程 sync 刷新)             │
│   5. AgentDefinition factory:                                 │
│      skills: [primary_skill, secondary_skill]                 │
│      prompt: 含心法 4 原则 always-on inject + 当前子任务     │
│              context + override signals                       │
│      tools: 子任务允许的工具 (按 category 限定)              │
│   6. spawn subagent (Agent tool)                              │
│   7. 接收 final message → 解析 COMPLETE 信号 (verbatim)      │
│   8. 写 progress.md / state.json                              │
└──────────────────────────────────────────────────────────────┘
              ▼ Agent tool spawn (skills startup 全文注入)
┌─ Subagent (isolated, fork context) ──────────────────────────┐
│  - startup: skills 字段已注入 (无需自己 install)             │
│  - prompt 含心法 4 原则 + 子任务 description + override      │
│  - 执行 superpower brainstorming (子任务级澄清)              │
│  - 编码循环: 心法 always-on enforce × 招式 on-demand by phase│
│  - ralph-loop wrap "...COMPLETE" --completion-promise        │
│  - 输出 final message 含 verbatim "COMPLETE" 标记            │
└──────────────────────────────────────────────────────────────┘
```

---

## § 2 Decision Rules YAML Schema (P0-1 (a) lock)

`.planning/decision_rules.yaml` v1 schema (DMN Priority Hit Policy 风格)：

```yaml
version: 1
hit_policy: P  # Priority — 多规则命中时按 priority 字段排序取最高

# === L1 路由：关键词 + 优先级 ===
rules:
  # ─── design category ────────────────────────────
  - id: ui-task-bold-style-override
    priority: 100  # 最高优先级 — 用户 explicit override
    domain: design
    when:
      task_type: ui-design
      override_keywords: ["做出风格", "design-led", "experimental", "独特", "creative", "distinctive"]
    decision:
      primary_expert: frontend-design
      secondary_expert: ui-ux-pro-max
      conflict_policy: primary_wins
      rationale: "用户明示 style-driven"
    install:
      - frontend-design  # anthropics/skills
      - ui-ux-pro-max    # midwayjs/midway/.codex/skills (D1.2.5-11 待实测 install path)
  
  - id: ui-task-default
    priority: 50  # 常规优先级
    domain: design
    when:
      task_type: ui-design
    decision:
      primary_expert: ui-ux-pro-max
      secondary_expert: frontend-design
      conflict_policy: primary_wins  # 数据驱动 + 标准化 优先
      rationale: "数据驱动 + 标准化 + 可解释"
  
  # ─── content category ───────────────────────────
  - id: pptx-file-task
    priority: 80
    domain: content
    when:
      task_type: pptx-file-operation
    decision:
      primary_expert: anthropics/skills/pptx
  
  - id: chinese-content-deck
    priority: 70
    domain: content
    when:
      task_type: slide-deck
      language: zh
    decision:
      primary_expert: jimliu/baoyu-skills/baoyu-slide-deck
      warn: "license: None — D1.2.5-10 pending license verify"
  
  # ─── testing category ──────────────────────────
  - id: perf-a11y-memory
    priority: 100  # 强制 — 笔记 explicit "不允许用 playwright 系列做这类诊断"
    domain: testing
    when:
      task_type: ["performance", "a11y", "memory-leak", "Core Web Vitals", "LCP"]
    decision:
      primary_expert: ChromeDevTools/chrome-devtools-mcp
      forbidden: [playwright-cli, "@playwright/test", webapp-testing]
  
  - id: e2e-with-python-backend
    priority: 70
    domain: testing
    when:
      task_type: e2e-test
      backend_language: python
    decision:
      primary_expert: anthropics/skills/webapp-testing
  
  - id: e2e-default
    priority: 50
    domain: testing
    when:
      task_type: e2e-test
    decision:
      primary_expert: "@playwright/test"
  
  - id: ai-explore-debug
    priority: 50
    domain: testing
    when:
      task_type: ["ai-explore", "interaction-debug", "element-ref"]
    decision:
      primary_expert: microsoft/playwright (CLI skill)
      rationale: "Bash 一行 / token 最省"
  
  # ─── search category ──────────────────────────
  - id: search-academic-or-batch-or-token-sensitive
    priority: 80
    domain: search
    when:
      task_type: search
      signals: ["学术", "论文", "describe", "批量 URL", "token-sensitive"]
    decision:
      primary_expert: exa-labs/exa-mcp-server
  
  - id: search-default
    priority: 50
    domain: search
    when:
      task_type: search
    decision:
      primary_expert: tavily-ai/tavily-mcp
  
  # ─── meta category ──────────────────────────
  - id: meta-create-skill
    priority: 50
    domain: meta
    when:
      task_type: skill-creation
    decision:
      primary_expert: anthropics/skills/skill-creator
  
  - id: meta-find-skill
    priority: 50
    domain: meta
    when:
      task_type: skill-discovery
    decision:
      primary_expert: vercel-labs/skills/find-skills
  
  # ─── engineering category (base layer 已装) ──
  # 详见 mattpocock_phases (GRAY-AREA-3 § 3.3)
  
# === L2 路由：LLM Supervisor (复杂仲裁仅 fallback) ===
fallback_supervisor:
  trigger: "L1 无 rule 命中 OR 多 rule 同 priority 冲突 OR 用户 prompt 含未列在 override_keywords 的语义"
  llm: claude-opus-4-7
  prompt_template: |
    Given user task: {task}
    Available experts: {category_experts}
    Decision rules context: {l1_rules}
    Output: { category, primary, secondary, rationale }

# === Deprecation 提示 ===
deprecated:
  - id: brave-search-mcp
    reason: "API 改 $5/月信用 + 强制信用卡"
    fallback: tavily-mcp + exa-mcp-server
```

---

## § 3 6 Category × Decision Rules 总览（A8' capture）

参考 R2 § 4.1 schema（已锁定，本 § 仅引用 + 关键 anchor）：

| Category | Base Layer (always 预装) | Extension Layer (按需装) | Decision Rule Anchor |
|---|---|---|---|
| **meta** | skill-creator + find-skills | (none) | 创建 → skill-creator / 搜索 → find-skills |
| **engineering** | mattpocock 10 + obra/superpowers + ralph-loop + code-review + code-simplifier | (none) | mattpocock 5 phase × 23 命令 — 详 GRAY-AREA-3 |
| **design** | (none) | ui-ux-pro-max + frontend-design | 默认 ui-ux-pro-max；override "做出风格" → frontend-design 主导 |
| **content** | (none) | pptx + docx + xlsx + pdf + baoyu-skills(21) | .pptx → pptx；中文 deck → baoyu (license warn)；微信微博 → baoyu-post-* |
| **testing** | (none) | webapp-testing + playwright-cli + @playwright/test + chrome-devtools-mcp | perf/a11y/memory → chrome-devtools-mcp 强制；E2E+Python → webapp-testing；E2E TS → @playwright/test；探查 → playwright-cli |
| **search** | (none) | tavily-mcp + exa-mcp-server | 默认 tavily；学术/描述式/批量 URL/token 敏感 → exa；整站抓取 → tavily 强制 |

详尽 schema 见 R2 § 4.1 + 本文件 § 2 (decision_rules.yaml)。

---

## § 4 Superpower brainstorming + TDD 触发规则（A7' capture）

P0-5 lock：**(a + b) hybrid** — hard-coded mandatory + heuristic + optional user-decide。

### 4.1 Mandatory TDD triggers (hard-coded)

routing engine 在 spawn subagent 前**强制**注入 TDD 准备：

```yaml
mandatory_tdd_triggers:
  - task_description_contains: ["核心业务逻辑", "core business logic", "algorithm", "数据处理", "data processing"]
  - task_description_contains: ["金融", "支付", "auth", "authentication", "security", "encryption", "credentials"]
  - module_classification: "core_business"     # manifest 标注
  - reliability_requirement: ">=99.9%"          # SLA 标注
  - changed_files_match_pattern: ["src/(auth|crypto|payment|core)/.*"]

action:
  inject_into_subagent_prompt: |
    [MANDATORY TDD MODE]
    本子任务命中 mandatory TDD trigger ({matched_trigger})。
    必须使用 mattpocock /tdd 或 obra/superpowers/test-driven-development:
    1. 先写测试 (red)
    2. 最小实现让测试通过 (green)
    3. refactor 不破坏 test (refactor)
    完成标准须含 "tests passing" 检查项。
  install_skills:
    - mattpocock/skills/engineering/tdd  # 或
    - obra/superpowers-skills (TDD)
```

### 4.2 Heuristic triggers (mattpocock /tdd 内置)

mattpocock /tdd skill 自带 "build features OR fix bugs one vertical slice at a time" detection — routing engine 不重复 detect，**直接 install + invoke**，让 skill 内置 heuristic 处理切片粒度。

### 4.3 Optional user-decide (避免过度 TDD)

```yaml
optional_tdd_triggers:
  - condition: "task description 不命中 mandatory triggers"
  - prompt_user: "此任务是否需要 TDD red-green-refactor? (y/N)"
  - default: "N"  # 避免给非核心任务过重负担
  - if_yes: install + invoke /tdd
```

### 4.4 Brainstorming triggers

```yaml
brainstorming_triggers:
  always_on:
    - subagent 启动 + 子任务 description 长度 < 100 字符（信息不足）
    - 子任务 description 含: ["TODO", "?", "unclear", "需要决定", "to decide"]
  
  preferred_skill_routing:
    - if user 在 GSD Discuss phase:
        use: mattpocock/skills/engineering/grill-with-docs
        rationale: "含 CONTEXT.md / ADR 持久化优势"
    - if user 在 Execute 子任务:
        use: obra/superpowers-skills/brainstorming
        rationale: "子任务级澄清，不写 ADR"
  
  rationale: |
    superpowers brainstorming 与 mattpocock /grill-with-docs 功能高度重叠
    — routing 按 phase 分配避免冗余调用
```

---

## § 5 GSD 环境质量层 Enforcement（A3' partial capture）

routing engine 在 spawn subagent 时**继承**主流程的环境质量基线（详 ASSUMPTIONS § B）：

| 环境质量项 | routing engine 的 enforcement |
|---|---|
| **CI 守恒 (3 平台 / Node 22)** | subagent 不直接 enforce — 但 subagent 启动时 inject "在 windows-latest 跑代码时遵循 R03 § 3.7 cmd /c wrapper" 到 prompt 字段 |
| **Lockfile 一致性** | subagent 内 `corepack pnpm install` 必须 `--frozen-lockfile`（已在 mattpocock /improve-codebase-architecture 等 skill 默认）|
| **Cross-OS** | subagent prompt 含 `process.platform === 'win32'` 分支处理（参考 phase 1.2 实证 F18 教训）|
| **EOL 行尾** | subagent 写文件后 main agent 在 commit 前 check（如用 `Get-Content -Raw` PowerShell match `\r\n` 或读字节流；不能仅用 `git ls-files --eol`，因新文件未 commit 时该命令不暴露 EOL — M2 sister review caveat）；fail 则 ralph-loop COMPLETE 拒绝接受。**phase 1.3 实装时确定具体 enforcement 接口** |
| **A7 守恒** | subagent 不允许改 `docs/adr/000{1,2,3,4,5}-*.md` main body — install_type=skill 的 skill 不应触碰 ADR；如触碰则 routing engine 拒绝 |

---

## § 6 main agent system prompt 模板（含 verbatim COMPLETE 强制 — F33 红旗 P1 mitigation）

```yaml
main_agent_system_prompt:
  - section: identity
    content: "You are harnessed orchestrator. Manage subagent dispatch + skill installation + decision routing."
  
  - section: subagent_final_message_handling
    content: |
      [CRITICAL]
      When you receive a subagent's final message via the Agent tool result:
      1. **DO NOT summarize** the COMPLETE marker.
      2. Look for the literal string "COMPLETE" verbatim in the final message.
      3. If "COMPLETE" found → mark task done in progress.md.
      4. If not found → ralph-loop continues; spawn new subagent with retry context.
      5. Always preserve the subagent's verbatim final message in progress.md
         under § A.4 task entry.
    rationale: |
      F33 P1 红旗 mitigation: subagent final message 可能被主 agent summarize,
      会让 ralph-loop COMPLETE 检测失效.
  
  - section: skill_install_workflow
    content: |
      Before spawning a subagent for a task, check ~/.claude/skills/ for
      required skills (per decision_rules.yaml decision output).
      Missing skill → run `claude plugin install <name>@<marketplace>` +
      `/reload-plugins` (your own slash command, not subagent's).
      Verify install with fresh subagent invoke (F33-followup P1 fallback).
```

---

## § 7 capture verification (Wave D 用)

| Acceptance Bar | 本文档 capture | 状态 |
|---|---|---|
| **A7'** mandatory TDD triggers | § 4.1 yaml schema | ✅ |
| **A7'** heuristic (mattpocock 内置) | § 4.2 | ✅ |
| **A7'** optional user-decide | § 4.3 | ✅ |
| **A7'** brainstorming triggers | § 4.4 (always-on + phase-routing) | ✅ |
| **A8'** 6 category × decision rules | § 3 + § 2 decision_rules.yaml | ✅ (含 base/extension layer + anchor) |
| **A3'** env quality enforcement | § 5 inheritance table | ✅ |
| Routing engine main-process-driven | § 1 architecture diagram + § 6 main prompt | ✅ |
| F33 mitigation (verbatim COMPLETE) | § 6 main_agent_system_prompt | ✅ |

A7' + A8' + A3' partial 100% capture ✅

---

## § 8 References

- `RESEARCH-1-routing-engine.md` § 1.4 (alternative 设计图) / § 2.3 (双层 router) / § 4.2 (decision rules grammar)
- `RESEARCH-2-skill-ecosystem.md` § 1 (6 category 全景) / § 4.1 (categories yaml) / § 4.3 (TDD hybrid)
- `ASSUMPTIONS.md` § C P0-1/P0-5 lock + § D D1.2.5-3 / -5 / -6 / -12
- 用户笔记 § "测试工具职责矩阵" / § "Web 搜索路由规则"
- CLAUDE.md UI / 测试 / 搜索 路由部分
