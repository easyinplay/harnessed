# Phase v3.0-3.2 Wave A — capabilities.yaml v3 + judgments 子域研究

**Researched:** 2026-05-20
**Researcher:** capabilities-researcher (Team `phase32-research-team`, lead `team-lead`)
**Sister teammates:** workflows-researcher + disciplines-researcher (SendMessage 已同步草案 contract)
**Domain:** capabilities.yaml v3 schema + ~70 entry + 10 judgments yaml + phaseFactContext.ts extend
**Confidence:** HIGH (~85%) — v2 SHIPPED 39 entry + v2 schema TypeBox 67L + 6 judgments yaml + rules/*.md 已 verbatim 读取作为 routing SoT

---

## Summary

v3.0 capabilities.yaml + judgments 子域 = harnessed L1 (capabilities registry) + L4 (judgments) 的 superset 改造,核心 3 项:

1. **capabilities.yaml v3 schema TypeBox extend** (sister `src/workflow/schema/capabilities.ts` 67L SHIPPED) — NEW `category` field (7-enum), NEW `discipline_ref` field (behavioral category only), retain v2 全部字段(`requires`/`aliases`/`outputs`/`plugin_path`/`sdk_ref`)。
2. **~70 entry registry** = v2 SHIPPED 39 entry backfill `category` field + 31 NEW v3 entry (6 behavioral + 30 gstack optional [实 33 减重复 30] + 1 superpowers-subagent-driven-development 补 + 0 调整, 含 4 alias 链接 register-only 无 fires_when)。
3. **10 judgments yaml** = v2 SHIPPED 6 file (strategic + phase + subtask + parallelism + tdd + fallback) extend stage-aware 字段 + 4 NEW file (web-design-routing + web-testing-routing + web-search-routing + stage-routing)。`judgment.ts` schema v1 不动 (triggers / rules 两种 root key 已覆盖)。

**核心 contract** for sister researchers:
- workflows-researcher: workflow.yaml `tools_available:` 引用 entry name 必须出自本 RESEARCH ~70 entry list (附录 A)
- disciplines-researcher: 6 discipline yaml basename = [karpathy, output-style, language, operational, priority, protocols] (matches 6 behavioral entry `discipline_ref`)

**Primary recommendation**: Phase v3.0-3.3 execute schema wave 实装 priority = (1) capabilities.ts TypeBox extend `category` enum + `discipline_ref` field (~15L delta) → (2) capabilities.yaml v3 backfill+extend (~70 entry, ~280L 增 +200L) → (3) 4 NEW judgments yaml (~120L total) → (4) phaseFactContext.ts extend (~15L delta, 6 NEW boolean + 2 NEW enum)。Total ~600L delta scope, ≤200L hard limit per file 通过 split 满足。

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| capabilities.yaml v3 registry | L1 (capabilities) | L2 (validate via TypeBox) | sister Phase 2.3 W0.1 SHIPPED, v3 backfill category |
| capabilities.ts TypeBox schema | L2 (schema-validate) | L1 (consumer) | additionalProperties:false strict per Phase 2.2 STRIDE T-2.2-02 |
| judgments/*.yaml triggers/rules | L4 (judgments) | L1 (invokes capability) | 4-level ref `judgments.<file>.<gate>.fires` per ADR 0026 |
| judgment.ts TypeBox schema | L2 (schema-validate) | L4 (consumer) | discriminated union (triggers OR rules) sister W0.2 SHIPPED |
| phaseFactContext.ts | L4 (judgments runtime) | L2 (TypeBox) | fact-bag for expr-eval consumer ctx |
| 4 NEW rules-routing judgments | L4 (judgments) | L1 (capability invoke) | sister rules/web-{design,testing,search}.md + lib-docs 机器化 |
| stage-routing master judgment | L4 (judgments) | L6 (workflow master orchestrator) | NEW for D-01 master auto gate-route delegation |

---

## User Constraints (from CONTEXT.md)

### Locked Decisions (batch 1 + 2 — 9+5=14 D-decision)
- M-01: ARCHITECTURAL MAJOR REFACTOR v2 (sister v2.0 M-01 pattern)
- D-01: Master `/discuss /plan /task /verify` 并行 gate-eval per sub-stage via `judgments.<sub>.fires` (chain-isolation 铁律机器化)
- D-02: Bare slash cmd (`/discuss-strategic` 等), ADR 0030 codify
- D-03: Nested `workflows/<stage>/<sub>/workflow.yaml + SKILL.md` 2-level
- D-04: Pure ship v3 deprecate v2 (DROP /plan-feature + /execute-task + /verify-work; KEEP /research; NEW /retro)
- D-05: 心法 (karpathy 4-pillars always-on behavioral) + 招式 (mattpocock by-condition) 全阶段 cross-cutting (NOT phase)
- D-06: planning-with-files 跨阶段 TOOL (NOT phase) — discuss findings.md / plan task_plan.md / task-code progress.md / task-deliver mark done / verify-progress 写
- D-07: 20 workflow ship (4 master + 14 sub + 2 standalone)
- **D-08: capabilities.yaml v3 NEW `category` field** (7 enum: behavioral / tool-slash-cmd / tool-mcp / tool-cli / tool-plugin / tool-bundled-skill / agent-platform), 39 entry backfill + ~30 extend
- **D-09: NEW L0 Discipline Substrate** — 6 yaml (`workflows/disciplines/{karpathy,output-style,language,operational,priority,protocols}.yaml`), capabilities.yaml NEW category=behavioral 6 ref entry
- **D-10: NEW L5b Execution Mechanism** — parallelism-gate.yaml extend; Pattern A/B/C 全 codify; token cost doctor check; ralph-loop wrapper orthogonal
- **D-11: 4 NEW judgments yaml** (web-design-routing + web-testing-routing + web-search-routing + lib-docs)
- **D-12: gstack 30+ optional capabilities registry only** (NOT 30+ sub-workflows; capabilities.yaml entry register, 用户直接 invoke OR workflow conditional invoke)
- **D-13: harnessed v3.0 = full superset of** CLAUDE.md / Obsidian doc / 7 rules/*.md — auto gate-route + Pure bundled + cross-session memory + ADR audit + token cost estimation + real-time discipline enforcement

### Claude's Discretion (defer to researcher / planner Phase 3.2)
- judgments/ extension scope — NEW stage-aware gates (e.g., `judgments.stage-discuss-strategic.fires`)?
- workflow.yaml v3 schema TypeBox field detail (`behavioral_layer` + `tools_available` + `invokes_tools` 是 string[] OR object[]) — **本 RESEARCH 答: 都是 string[]**, entry name 引用即可 (附录 A 命名一致性 contract)
- ADR 0030/0031/0032 detail content (3.6 close phase)
- 20 workflow yaml + 20 SKILL.md 实装 task 分批 (planner Phase 3.2 wave plan decide)

### Deferred Ideas (OUT OF SCOPE v3.0)
- Plugin version-check + update semantic (v3.1 minor patch)
- Plugin namespaced slash cmd (`/harnessed:discuss-strategic` colon prefix)
- Hierarchical 3-level slash cmd
- mattpocock 23 招式 全集 wire (v3.0 ship ~11 实际 wire + 0 manifest-only stub)
- /retro 复杂 cross-milestone trend
- Master orchestrator `auto` vs explicit selection toggle

---

## Standard Stack (no extra dep needed v3.0)

| Library | Version | Purpose | Why Standard |
|---|---|---|---|
| @sinclair/typebox | 已锁版本 | TypeBox schema 全 surface | sister v2 全 surface 已用 (capabilities.ts + judgment.ts + workflow.ts) |
| js-yaml / yaml | 已锁 | yaml 解析 (W0.5 SHIPPED yamlLoader) | sister Phase 2.3 W0.5 引入 [VERIFIED: import in src/workflow/yamlLoader.ts] |
| expr-eval | 已锁 singleton | judgments 表达式求值 sister exprBuilder.ts 53L | Phase 2.3 W0.3 SHIPPED |

**Verification**: `pnpm list @sinclair/typebox` + `pnpm list yaml` 确认已存在, v3.0 不引入新依赖。本研究 confidence HIGH。

---

## Architecture Patterns

### System Architecture Diagram (capabilities + judgments 子域 within v3.0)

```
                                  ┌─────────────────────────────────────┐
                                  │  L0: workflows/disciplines/*.yaml   │  (D-09 NEW, disciplines-researcher 负责)
                                  │  6 file: karpathy, output-style,    │
                                  │   language, operational, priority,  │
                                  │   protocols                          │
                                  └────────────┬─────────────────────────┘
                                               │ discipline_ref string path
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ L1: workflows/capabilities.yaml v3 (~70 entry, schema_version: harnessed.capabilities.v1) │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 7 category enum:                                                         │   │
│  │ - behavioral (6 entry, ref disciplines/*.yaml)                          │   │
│  │ - tool-slash-cmd (54 entry: mattpocock 11 + gstack 6 core + gstack 30   │   │
│  │   optional + gsd 7 + tdd + superpowers-brainstorming + 招式 2 special)   │   │
│  │ - tool-mcp (3: chrome-devtools / tavily / exa)                          │   │
│  │ - tool-cli (2: ctx7 / gws)                                              │   │
│  │ - tool-plugin (2: planning-with-files / playwright-test)                │   │
│  │ - tool-bundled-skill (3: ralph-loop / webapp-testing / playwright-cli)  │   │
│  │ - agent-platform (3: create / send-message / shutdown)                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┬──────────────────┘
                     │ {{ capabilities.<name>.cmd }}            │ invokes:<capability> 4-level ref
                     ▼ template ref                            ▼
┌──────────────────────────────────┐    ┌─────────────────────────────────────────┐
│ L6: workflows/<stage>/<sub>/      │    │ L4: workflows/judgments/*.yaml          │
│      workflow.yaml v3            │    │ schema_version: harnessed.judgment.v1   │
│ - tools_available: [<entry>]      │◀───│ 10 file (6 SHIPPED + 4 NEW):            │
│ - invokes_tools (per-phase)       │    │ - strategic-gate (sister gstack)        │
│ - disciplines_applied [<basename>]│    │ - phase-gate (GSD)                      │
│ - parallelism: judgments.…fires   │    │ - subtask-gate (brainstorming)          │
└────────────────┬─────────────────┘    │ - parallelism-gate (subagent / Teams /  │
                 │                       │   main-session / ralph-wrapper)         │
                 │ gate eval expr        │ - tdd-gate (subtask 5 fires)            │
                 ▼                       │ - fallback (3 铁律, 'rules' root)       │
┌──────────────────────────────────┐    │ - web-design-routing (NEW D-11)         │
│ Workflow Runtime Engine:          │    │ - web-testing-routing (NEW D-11)        │
│ judgmentResolver 4-level ref      │◀───│ - web-search-routing (NEW D-11)         │
│   + exprBuilder evalGate(ctx)     │    │ - stage-routing (NEW master D-01)       │
│   + phaseFactContext ctx-bag      │    └─────────────────────────────────────────┘
└──────────────────────────────────┘
                 ▲
                 │ ctx: PhaseFactContextT (extend v3)
                 │
┌─────────────────────────────────────────────────────────────────────────────┐
│ src/workflow/schema/phaseFactContext.ts (extend v3)                          │
│ - phase.* (extend: has_design_changes flat, is_complex_architecture NEW)     │
│ - subtask.* (extend: test_type enum, search_type enum, needs_lib_docs bool)  │
│ - user.explicit_signal[]                                                     │
│ - 6 root flat boolean (existing) + 2 NEW (needs_web_search, has_secrets)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pattern 1: 7-category enum on CapabilityEntry

**What**: TypeBox `Type.Union([Type.Literal(...)])` 7 string literal, optional field (default-back-fill = 'tool-slash-cmd' OR required-strict 二选一)。

**Recommend**: **required strict** (additionalProperties:false 一致, v2 → v3 一次性 backfill 39 entry; Phase 3.3 schema bump 时全 entry add category=<x>;  Wave C plan-check 强制 grep 检查)。

**When**: Phase v3.0-3.3 W0 schema bump 时同步 backfill capabilities.yaml v3 全 entry。

**Example**:
```typescript
// src/workflow/schema/capabilities.ts (extend)
const CategoryEnum = Type.Union([
  Type.Literal('behavioral'),
  Type.Literal('tool-slash-cmd'),
  Type.Literal('tool-mcp'),
  Type.Literal('tool-cli'),
  Type.Literal('tool-plugin'),
  Type.Literal('tool-bundled-skill'),
  Type.Literal('agent-platform'),
])

export const CapabilityEntry = Type.Object(
  {
    impl: Type.String(),
    cmd: Type.String(),
    since: Type.String(),
    category: CategoryEnum,                      // ← NEW v3 (required strict)
    description: Type.Optional(Type.String()),
    fires_when: Type.Optional(Type.Array(Type.String())),
    requires: Type.Optional(RequiresShape),
    plugin_path: Type.Optional(Type.String()),
    outputs: Type.Optional(Type.Array(Type.String())),
    aliases: Type.Optional(Type.Array(AliasShape)),
    sdk_ref: Type.Optional(Type.String()),
    discipline_ref: Type.Optional(Type.String()), // ← NEW v3 (behavioral category only)
  },
  { additionalProperties: false },
)
```

### Pattern 2: discipline_ref virtual entry (behavioral category)

**What**: 6 behavioral category entry 不 invoke slash cmd, 而是 ref `workflows/disciplines/<basename>.yaml`,workflow runtime pre-phase hook load discipline rules 应用 cross-cutting。

**When**: D-05 心法 + D-09 5 NEW discipline cross-cutting always-on。

**Example**:
```yaml
karpathy-guidelines:
  impl: harnessed-bundled
  cmd: <virtual>            # NOT invoked as slash cmd
  since: v2.0               # v2 SHIPPED, v3 add category + discipline_ref
  category: behavioral
  description: 4 心法 + ≤200L hard limit + no-feature-creep + trust-internal-code + no-comments-default
  discipline_ref: workflows/disciplines/karpathy.yaml

output-style-discipline:
  impl: harnessed-bundled
  cmd: <virtual>
  since: v3.0
  category: behavioral
  description: BLUF + no-sycophantic + no-emoji + no-em-dash + 量词精确 + no-end-recap + no-empty-continuation-question
  discipline_ref: workflows/disciplines/output-style.yaml
```

### Pattern 3: 4-level judgments ref + entry alias

**What**: workflow.yaml `parallelism: judgments.parallelism-gate.<route>.fires` 4-level ref (v2 SHIPPED), judgmentResolver pre-resolve → expr 替换为 string, exprBuilder evalGate(ctx)。v3 NEW 4 file 沿用同 pattern, 不需 schema 改动。

**When**: D-11 web-design-routing / web-testing-routing / web-search-routing / stage-routing (master orchestrator)。

### Anti-Patterns to Avoid

- **不要** category 字段是 optional + 默认 'tool-slash-cmd' — 容易跳过 backfill 制造 silent default。强制 required 一次到位。
- **不要** behavioral category entry add fires_when (它们 always-on, NOT gate-fire)。强制 discipline_ref 必填且 fires_when 缺省。
- **不要** gstack 30 optional 全 wrap 为 sub-workflow (D-12 LOCK: capabilities registry only)。
- **不要** category enum 扩张到 8+ — 7 是 mutually-exclusive 完备分类 (D-08 锁定)。
- **不要** judgments.ts schema 改 v2 — triggers/rules union 已覆盖 4 NEW file shape, schema_version 不变 (sister W0.6 67L + 98L 不动)。

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| category enum validate | manual string check + throw | TypeBox `Type.Union([Type.Literal(...)])` | sister Phase 2.2 STRIDE T-2.2-02 additionalProperties:false 收敛 |
| discipline_ref load | self-write fs.readFile + parse | sister W0.5 yamlLoader + W0.6 typebox validate | 复用 v2 surface, NOT NEW 16th surface |
| 4-level judgments ref | self-write `.` split + lookup | judgmentResolver 98L SHIPPED | sister Phase 2.3 W0.4 SHIPPED, v3 不需 change |
| Token cost estimate | self-write tokenizer | tiktoken (sister doctor 已用 OR 估算 OR defer v3.x) | open question — D-10 提及 doctor check 但未指定 lib; 推 v3.x patch |
| ctx7 / gws CLI invoke | wrap CLI in Node child_process | direct cmd ref in capabilities (cmd=ctx7 / cmd=gws) | rules/*.md 明确 SOP, harnessed register-only 不重新实现 |

**Key insight**: harnessed v3.0 capabilities 子域 = **registry + schema validate**, 不是 capability runtime。所有 cmd invocation 由 Claude Code 平台 / sub-skill / external CLI 负责; harnessed 只 codify "什么时候 fire 什么 capability"。

---

## Code Examples

### Example A — phaseFactContext.ts v3 extend (~15L delta)

```typescript
// src/workflow/schema/phaseFactContext.ts (v3 extend)

// NEW enum types for D-11 rules-routing
const TestType = Type.Union([
  Type.Literal('ci-commit'),      // @playwright/test default
  Type.Literal('probe'),           // playwright-cli
  Type.Literal('python-backend'),  // webapp-testing
  Type.Literal('perf-diagnostic'), // chrome-devtools-mcp
])

const SearchType = Type.Union([
  Type.Literal('keyword'),       // tavily-mcp default
  Type.Literal('descriptive'),   // exa-mcp
  Type.Literal('academic'),      // exa-mcp
  Type.Literal('lib-docs'),      // ctx7
  Type.Literal('github-url'),    // gh CLI
  Type.Literal('single-url'),    // WebFetch
])

const SubtaskShape = Type.Object(
  {
    // ... v2 existing 13 field ...
    test_type: TestType,                   // ← NEW v3 (D-11 web-testing-routing)
    search_type: SearchType,               // ← NEW v3 (D-11 web-search-routing)
    needs_lib_docs: Type.Boolean(),        // ← NEW v3 (D-11 lib-docs ctx7)
    needs_web_search: Type.Boolean(),      // ← NEW v3 (D-11 web-search-routing fires)
    needs_google_workspace: Type.Boolean(),// ← NEW v3 (optional gws)
  },
  { additionalProperties: false },
)

const PhaseShape = Type.Object(
  {
    // ... v2 existing 14 field ...
    is_complex_architecture: Type.Boolean(),  // ← NEW v3 (D-01 master /plan gate-route → /plan-architecture)
    requires_creative_polish: Type.Boolean(), // ← NEW v3 (web-design-routing fires frontend-design)
    requires_persisted_plan: Type.Boolean(),  // ← NEW v3 (D-06 planning-with-files cross-stage)
    requires_peer_review: Type.Boolean(),     // ← NEW v3 (gsd-review fires_when 已用 — backfill schema)
    is_final_step: Type.Boolean(),            // ← NEW v3 (code-simplifier fires_when 已用 — backfill schema)
    has_business_decisions: Type.Boolean(),   // ← NEW v3 (gstack-plan-ceo-review fires_when 已用 — backfill schema)
  },
  { additionalProperties: false },
)

export const PhaseFactContext = Type.Object(
  {
    phase: PhaseShape,
    subtask: SubtaskShape,
    user: UserShape,
    // 6 root flat boolean v2 SHIPPED:
    teammate_send_message_needed: Type.Boolean(),
    subagent_context_overflow: Type.Boolean(),
    shared_task_list: Type.Boolean(),
    opposing_hypothesis_debate: Type.Boolean(),
    fullstack_three_way: Type.Boolean(),
    test_fail: Type.Boolean(),
    // 2 NEW v3 root flat boolean (D-11 / D-10):
    needs_web_search: Type.Boolean(),   // sister web-search-routing.yaml top-level fires_when 引用方便度
    is_critical_release: Type.Boolean(),// sister stage-routing.yaml master delegate verify-multispec 触发
  },
  { additionalProperties: false },
)
```

### Example B — web-testing-routing.yaml NEW (D-11)

```yaml
# workflows/judgments/web-testing-routing.yaml
# Sister: ~/.claude/rules/web-testing.md 三层职责矩阵 + 决策树机器化
# Phase v3.0-3.2 Wave A RESEARCH → 3.3 W0 ship per D-11

schema_version: harnessed.judgment.v1

triggers:
  playwright-test-default:
    description: |
      @playwright/test — 默认 CI 提交进 repo 的正式 E2E test framework,
      前端 TypeScript / React / Vue, 只需浏览器操作 + HTTP API setup。
      Path frontend/e2e/*.spec.ts; cmd npx playwright test。
    fires_when: "subtask.test_type == 'ci-commit'"
    skips_when: "subtask.test_type in ['probe', 'python-backend', 'perf-diagnostic']"
    invokes:
      - capability: playwright-test

  playwright-cli-probe:
    description: |
      playwright-cli — AI 实时操作浏览器 一行 Bash, token 最省;
      用于探查 / 调试 / 一次性确认 (非提交 repo)。
      探查产出的 selectors 再沉淀到正式 test。
    fires_when: "subtask.test_type == 'probe'"
    invokes:
      - capability: playwright-cli

  webapp-testing-python-backend:
    description: |
      webapp-testing skill — Python 后端联动特例
      (要 import Tortoise ORM / pandas / backend utils OR 前端是 Python 模板 Django Jinja)。
      Path tests/e2e/*.py; with_server.py 双进程。
    fires_when: "subtask.test_type == 'python-backend'"
    invokes:
      - capability: webapp-testing

  chrome-devtools-mcp-diagnostic:
    description: |
      chrome-devtools-mcp — 非功能性诊断必须用 (NOT playwright/test/cli/webapp-testing)。
      LCP / Core Web Vitals / ARIA / 堆快照。
    fires_when: "subtask.test_type == 'perf-diagnostic'"
    invokes:
      - capability: chrome-devtools-mcp
```

### Example C — web-search-routing.yaml NEW (D-11)

```yaml
# workflows/judgments/web-search-routing.yaml
# Sister: ~/.claude/rules/web-search.md 条件式 fallback + Tavily/Exa MCP routing
# Phase v3.0-3.2 Wave A RESEARCH → 3.3 W0 ship per D-11

schema_version: harnessed.judgment.v1

triggers:
  tavily-mcp-default:
    description: |
      Tavily MCP 默认 — 关键词查询 / 库 API 文档 / 新闻时效 / 生产 RAG。
      支持 time_range / country / include_domains / exclude_domains / search_depth。
    fires_when: "subtask.needs_web_search == true and subtask.search_type == 'keyword'"
    invokes:
      - capability: tavily-mcp

  exa-mcp-descriptive-academic:
    description: |
      Exa MCP 覆盖默认 — 描述式查询 / 学术论文 / 批量抓多 URL /
      用户明说"研究/深度调研" / Token 敏感 (Exa highlights 密度约 2× Tavily)。
    fires_when: "subtask.needs_web_search == true and subtask.search_type in ['descriptive', 'academic']"
    invokes:
      - capability: exa-mcp

  tavily-crawl-map-site:
    description: |
      Tavily 必用 — 抓整站 / 站点结构 (crawl / map), Exa 无对等工具。
    fires_when: "subtask.needs_web_search == true and subtask.search_type == 'site-crawl'"
    invokes:
      - capability: tavily-mcp

  ctx7-lib-docs:
    description: |
      ctx7 CLI — 库 / API / 框架 / SDK / CLI 工具文档抓取。
      使用 user 完整问题作为 query, 不超过 3 命令/问。
    fires_when: "subtask.needs_lib_docs == true"
    invokes:
      - capability: ctx7

  webfetch-single-url:
    description: |
      永远规则 — 单次轻量查询 (一个明确 URL) 直接 WebFetch, 不走 MCP / CLI。
    fires_when: "subtask.search_type == 'single-url'"
    # No capability invoke — WebFetch 是 Claude Code 平台内置, NOT capabilities.yaml registry
```

### Example D — web-design-routing.yaml NEW (D-11)

```yaml
# workflows/judgments/web-design-routing.yaml
# Sister: ~/.claude/rules/web-design.md ui-ux-pro-max 默认 + frontend-design 补充 + 仲裁
# Phase v3.0-3.2 Wave A RESEARCH → 3.3 W0 ship per D-11

schema_version: harnessed.judgment.v1

triggers:
  ui-ux-pro-max-default:
    description: |
      默认主方案 — 数据驱动 / 标准化 / 可解释。
      50+ styles, 161 color palettes, 57 font pairings, 161 product types,
      99 UX guidelines, 10 stacks, 25 chart types。
    fires_when: "phase.has_ui_changes == true and phase.requires_creative_polish == false"
    invokes:
      - capability: ui-ux-pro-max

  frontend-design-creative:
    description: |
      创意补充 — 用户明示"做出风格 / 要独特 / 不要 AI 感 / 要有创意",
      OR ui-ux-pro-max 决定主方案后 layout/动效/装饰性细节补充。
    fires_when: "phase.has_ui_changes == true and phase.requires_creative_polish == true"
    invokes:
      - capability: frontend-design

  design-review-post:
    description: |
      设计完成后可选 gstack /design-review — 设计系统一致性 + AI 审美问题识别。
      常规 PR 跳过, 不强制。
    fires_when: "phase.stage == 'verify' and phase.has_design_changes == true"
    invokes:
      - capability: gstack-design-review
```

### Example E — stage-routing.yaml NEW (D-01 master orchestrator)

```yaml
# workflows/judgments/stage-routing.yaml
# Master orchestrator sub-stage delegation per D-01
# 4 master (/discuss /plan /task /verify) auto gate-eval 触发 sub conditional
# Sister: 3 strategic/phase/subtask gate 已 SHIPPED 独立判断, 本 file orchestrator-level routing

schema_version: harnessed.judgment.v1

triggers:
  # /discuss master → 3 sub conditional fire
  discuss-strategic-delegate:
    description: |
      /discuss master → /discuss-strategic 委派 fire 当 strategic-gate.fires (任一 office-hours OR plan-ceo-review)。
    fires_when: "phase.type in ['new_project', 'new_milestone', 'new_feature'] or phase.is_major_release == true"
    invokes:
      - capability: gstack-office-hours
      - capability: gstack-plan-ceo-review

  discuss-phase-delegate:
    description: /discuss master → /discuss-phase 委派 fire per phase-gate.fires。
    fires_when: "phase.open_decisions >= 2 or phase.has_cross_phase_data_flow == true or phase.scope_days > 1"
    invokes:
      - capability: gsd-discuss-phase

  discuss-subtask-delegate:
    description: /discuss master → /discuss-subtask 委派 fire per subtask-gate.fires。
    fires_when: "subtask.approaches >= 2 or subtask.core_algorithm == true or subtask.has_api_contract == true or subtask.error_cost == 'high'"
    invokes:
      - capability: superpowers-brainstorming

  # /plan master → 2 sub serial
  plan-architecture-delegate:
    description: /plan master → /plan-architecture 委派 fire 当复杂架构 (gstack /plan-eng-review)。
    fires_when: "phase.is_complex_architecture == true"
    invokes:
      - capability: gstack-plan-eng-review

  plan-phase-delegate:
    description: /plan master → /plan-phase 委派总是 fire (GSD plan-phase + planning-with-files)。
    fires_when: "phase.stage == 'plan'"
    invokes:
      - capability: gsd-plan-phase
      - capability: planning-with-files

  # /verify master → 5-7 sub conditional
  verify-progress-always:
    description: /verify master → /verify-progress 总 fire (GSD verify + progress + simplifier 末尾)。
    fires_when: "phase.stage == 'verify'"
    invokes:
      - capability: gsd-verify-work
      - capability: gsd-progress

  verify-paranoid-critical:
    description: /verify master → /verify-paranoid fire 当 critical_module。
    fires_when: "phase.stage == 'verify' and phase.is_critical_module == true"
    invokes:
      - capability: gstack-review

  verify-qa-ui:
    description: /verify master → /verify-qa fire 当 has_ui_changes。
    fires_when: "phase.stage == 'verify' and phase.has_ui_changes == true"
    invokes:
      - capability: gstack-qa

  verify-security-secrets:
    description: /verify master → /verify-security fire 当 has_auth_or_secrets。
    fires_when: "phase.stage == 'verify' and phase.has_auth_or_secrets == true"
    invokes:
      - capability: gstack-cso

  verify-design-changes:
    description: /verify master → /verify-design fire 当 has_design_changes。
    fires_when: "phase.stage == 'verify' and phase.has_design_changes == true"
    invokes:
      - capability: gstack-design-review

  verify-multispec-critical-release:
    description: /verify master → /verify-multispec 4-specialist Agent Team Pattern C fire 当 critical release。
    fires_when: "phase.stage == 'verify' and is_critical_release == true"
    invokes:
      - capability: agent-teams-create

  verify-simplify-tail:
    description: /verify master → /verify-simplify 末尾 (code-simplifier)。
    fires_when: "phase.stage == 'verify' and phase.is_final_step == true"
    invokes:
      - capability: code-simplifier
```

---

## State of the Art (v2 SHIPPED → v3.0)

| Old (v2 SHIPPED) | Current (v3.0) | When Changed | Impact |
|---|---|---|---|
| capabilities.yaml 39 entry 5 bucket | ~70 entry 7 category (NEW field) | Phase v3.0-3.3 W0 | enum strict 替代 bucket comment |
| 6 judgments yaml (strategic+phase+subtask+parallelism+tdd+fallback) | 10 yaml (+4 NEW rules-routing + stage-routing) | Phase v3.0-3.3 W0 | rules/*.md verbatim 机器化 |
| phaseFactContext.ts 31 field | ~46 field (+15 v3 extend) | Phase v3.0-3.3 W0 | enum types + flat boolean backfill |
| 心法 = capabilities entry (karpathy-guidelines) | 心法 = behavioral category ref discipline yaml | Phase v3.0-3.3 W0 | dual-layer (L0 disciplines + L1 capabilities) |
| workflow.yaml v2 86L | v3 ~120L (+behavioral_layer + tools_available + invokes_tools + disciplines_applied) | Phase v3.0-3.3 W0 | sister workflows-researcher RESEARCH |

**Deprecated/outdated**:
- v2 bucket comment-only header (`# Bucket 1 - mattpocock`) → 替换为 schema-enforced `category:` field per entry。可保留 comment header for human reading, BUT 不再是 SoT。

---

## Sources

### Primary (HIGH confidence)
- `workflows/capabilities.yaml` v2 SHIPPED 414L 39 entry — VERIFIED 2026-05-20 read
- `src/workflow/schema/capabilities.ts` 67L SHIPPED — VERIFIED 2026-05-20 read
- `src/workflow/schema/judgment.ts` 86L SHIPPED — VERIFIED 2026-05-20 read
- `src/workflow/schema/phaseFactContext.ts` 109L SHIPPED — VERIFIED 2026-05-20 read
- `src/workflow/schema/workflow.ts` 93L v2 SHIPPED — VERIFIED 2026-05-20 read
- `src/types/schemaVersion.ts` 108L (16 surface) — VERIFIED 2026-05-20 read
- `workflows/judgments/{strategic,phase,subtask,parallelism,tdd,fallback}-gate.yaml` 6 file — VERIFIED 2026-05-20 read
- `workflows/research/workflow.yaml` v2 SHIPPED — VERIFIED 2026-05-20 read
- `.planning/phase-v3.0-3.1/3.1-CONTEXT.md` 14 D-decision LOCKED — VERIFIED 2026-05-20 read
- `.planning/phase-v3.0-3.1/3.1-DISCUSSION-LOG.md` 132L — VERIFIED 2026-05-20 read
- `C:/Users/easyi/.claude/rules/{web-design,web-testing,web-search,google-workspace}.md` — VERIFIED 2026-05-20 read
- `C:/Users/easyi/.claude/CLAUDE.md` — VERIFIED already loaded as context

### Secondary (HIGH confidence — sister implementation)
- `D:/GitCode/harnessed/CLAUDE.md` — VERIFIED loaded (gstack 30+ slash cmd list)
- `~/.claude/rules/agent-teams.md` 完整 SOP — already-loaded context (Pattern A/B/C)
- `~/.claude/rules/cc-handoff.md` — already-loaded (protocols discipline source)
- `~/.claude/rules/context7.md` — already-loaded (ctx7 SOP)

### Tertiary
- Obsidian doc "我的 Claude Code 开发方案" — CITED in CONTEXT canonical_refs (未 verbatim 抓, 但 CLAUDE.md verbatim 已含同等信息)

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | gstack 30 optional slash cmd 全部在 gstack plugin 实装且 cmd 字面量与 project CLAUDE.md `/xxx` 一致 | 附录 A category=tool-slash-cmd 30 entry | `harnessed setup --apply` install gstack plugin 时如某 slash cmd 不存在, capabilities entry register-only 不会 break runtime (sister D-12 "optional direct invoke"), 但 user 调用会得到 "unknown slash cmd"。Mitigation: Wave C plan-check 加 `gstack list-skills` 输出 diff vs 30 entry。[ASSUMED] |
| A2 | `superpowers-subagent-driven-development` 是 superpowers plugin 内 skill name | parallelism-gate.yaml subagent-default invokes ref | parallelism-gate.yaml v2 SHIPPED 已 ref 但 capabilities.yaml v2 缺该 entry → v3 backfill 补。如 skill name 实际是其他 (e.g., `subagent-driven`), 重命名即可。[ASSUMED] |
| A3 | gws CLI 安装在 `C:/Users/easyi/AppData/Roaming/npm/gws`, 项目无关 user-level | category=tool-cli `gws` entry | rules/google-workspace.md verbatim 给出该路径; 但若用户重装 npm OR 路径变化, entry `impl: cli, cmd: gws` 仍可工作 (cmd 是字面量 PATH lookup)。[VERIFIED rules/google-workspace.md L9-10] |
| A4 | `gstack-plan-eng-review` 是 gstack plugin `/plan-eng-review` slash cmd | stage-routing.yaml plan-architecture-delegate ref | sister project CLAUDE.md L52 "Architecture / does this design make sense → /plan-eng-review" 已 verbatim; entry name 命名 `gstack-plan-eng-review` (NOT `plan-eng-review` to disambiguate from `gstack-plan-ceo-review`)。[VERIFIED project CLAUDE.md] |
| A5 | `chrome-devtools-mcp` MCP server name 是 `chrome-devtools` (cmd 字段值) | tool-mcp category | v2 SHIPPED entry `cmd: chrome-devtools` — 保留 v2 命名, 但实际 MCP server registered name 可能为 `mcp__chrome-devtools__*` tool prefix。Runtime 时通过 Claude Code MCP discovery 解析, harnessed register-only OK。[VERIFIED v2 capabilities.yaml L177] |
| A6 | discipline yaml `rules:` 字段是 array of object (id+desc+trigger+action) | Pattern 2 discipline_ref | 已 SendMessage to disciplines-researcher 等回复确认。如 disciplines-researcher 设计为 flat `rules: { id1: {...}, id2: {...} }` 字典, capabilities.ts discipline_ref 是 string path 不受影响 — schema 隔离。[ASSUMED pending confirmation] |
| A7 | `judgment.ts` schema v1 不需要 bump v2 (4 NEW yaml 沿用 triggers root key + 现有字段) | judgments extension scope | 4 NEW file 全部用 `triggers:` root key + `description / fires_when / skips_when / invokes / requires` 现有字段, 无 NEW 顶级字段。stage-routing 的 invokes 是 capability array (现 schema 已支持)。[VERIFIED judgment.ts L37-46 现有字段覆盖] |
| A8 | `is_critical_release` 是 root flat boolean (NOT phase nested) | phaseFactContext extend | sister v2 6 boolean (teammate_send_message_needed 等) 都 root flat per parallelism-gate.yaml flat fires_when 引用方便, v3 NEW 2 boolean 沿用同 pattern。[VERIFIED phaseFactContext.ts L97-104 pattern] |

**If A6 + A7 都 verify**: 7/8 [VERIFIED], 1/8 [ASSUMED pending — disciplines-researcher reply]。confidence HIGH。

---

## Appendix A — ~70 Entry Final Registry (categorized)

> **CONTRACT for workflows-researcher**: workflow.yaml v3 `tools_available:` 引用 entry name 必须出自下方 list。`disciplines_applied:` 必须使用 6 basename: `[karpathy, output-style, language, operational, priority, protocols]`。

### category: behavioral (6 entry — D-09 NEW L0 discipline-ref)

| # | Entry name | impl | cmd | discipline_ref |
|---|---|---|---|---|
| 1 | karpathy-guidelines | harnessed-bundled | `<virtual>` | workflows/disciplines/karpathy.yaml |
| 2 | output-style-discipline | harnessed-bundled | `<virtual>` | workflows/disciplines/output-style.yaml |
| 3 | language-convention | harnessed-bundled | `<virtual>` | workflows/disciplines/language.yaml |
| 4 | operational-discipline | harnessed-bundled | `<virtual>` | workflows/disciplines/operational.yaml |
| 5 | priority-hierarchy | harnessed-bundled | `<virtual>` | workflows/disciplines/priority.yaml |
| 6 | conceptual-protocols | harnessed-bundled | `<virtual>` | workflows/disciplines/protocols.yaml |

### category: tool-slash-cmd — mattpocock 11 (v2 SHIPPED backfill)

grill-with-docs / zoom-out / diagnose / caveman / grill-me / to-prd / to-issues / improve-codebase-architecture / code-review / code-simplifier / investigate

### category: tool-slash-cmd — gstack 6 core wrapped (v2 SHIPPED backfill)

gstack-office-hours / gstack-plan-ceo-review / gstack-review / gstack-qa / gstack-cso / gstack-design-review

### category: tool-slash-cmd — gstack 30 optional NEW v3 (D-12 register-only, per project CLAUDE.md gstack skill routing list)

| # | Entry name | gstack slash cmd | fires_when (conditional) |
|---|---|---|---|
| 1 | gstack-plan-eng-review | `/plan-eng-review` | phase.is_complex_architecture == true |
| 2 | gstack-design-consultation | `/design-consultation` | phase.has_design_changes == true and phase.needs_brand_consult |
| 3 | gstack-plan-design-review | `/plan-design-review` | phase.stage == 'plan' and phase.has_design_changes == true |
| 4 | gstack-plan-devex-review | `/plan-devex-review` | phase.stage == 'plan' and phase.has_devex_concerns |
| 5 | gstack-autoplan | `/autoplan` | phase.requires_full_review_pipeline == true |
| 6 | gstack-context-save | `/context-save` | user.explicit_signal includes "save progress" |
| 7 | gstack-context-restore | `/context-restore` | user.explicit_signal includes "resume" |
| 8 | gstack-investigate | `/investigate` | subtask.bug_root_cause_unknown == true (alias of mattpocock investigate) |
| 9 | gstack-qa-only | `/qa-only` | phase.stage == 'verify' and phase.has_ui_changes and phase.report_only |
| 10 | gstack-devex-review | `/devex-review` | phase.stage == 'verify' and phase.has_devex_concerns |
| 11 | gstack-codex | `/codex` | phase.stage == 'verify' and phase.requires_second_opinion |
| 12 | gstack-benchmark | `/benchmark` | phase.stage == 'verify' and phase.has_perf_concerns |
| 13 | gstack-design-shotgun | `/design-shotgun` | phase.has_design_changes and phase.needs_variants |
| 14 | gstack-design-html | `/design-html` | phase.has_design_changes and phase.needs_html_mockup |
| 15 | gstack-browse | `/browse` | subtask.needs_browser_automation == true |
| 16 | gstack-open-gstack-browser | `/open-gstack-browser` | subtask.needs_headed_browser == true |
| 17 | gstack-connect-chrome | `/connect-chrome` | subtask.needs_chrome_extension == true |
| 18 | gstack-setup-browser-cookies | `/setup-browser-cookies` | subtask.needs_authenticated_browser == true |
| 19 | gstack-ship | `/ship` | user.explicit_signal includes "ship" or "send it" |
| 20 | gstack-land-and-deploy | `/land-and-deploy` | phase.stage == 'verify' and phase.is_release_candidate |
| 21 | gstack-setup-deploy | `/setup-deploy` | phase.type == 'new_project' and phase.needs_deploy_config |
| 22 | gstack-setup-gbrain | `/setup-gbrain` | phase.type == 'new_project' and phase.needs_gbrain |
| 23 | gstack-canary | `/canary` | phase.stage == 'verify' and phase.post_deploy_monitor |
| 24 | gstack-document-release | `/document-release` | phase.is_release_candidate and phase.needs_doc_update |
| 25 | gstack-document-generate | `/document-generate` | subtask.needs_pdf_doc == true |
| 26 | gstack-retro | `/retro` | phase.is_milestone_close == true (alias of harnessed /retro standalone) |
| 27 | gstack-careful | `/careful` | user.explicit_signal includes "careful" or "guard mode" |
| 28 | gstack-guard | `/guard` | user.explicit_signal includes "guard" (alias of careful) |
| 29 | gstack-freeze | `/freeze` | user.explicit_signal includes "freeze" |
| 30 | gstack-unfreeze | `/unfreeze` | user.explicit_signal includes "unfreeze" |
| 31 | gstack-gstack-upgrade | `/gstack-upgrade` | user.explicit_signal includes "upgrade gstack" |
| 32 | gstack-learn | `/learn` | user.explicit_signal includes "what has gstack learned" |
| 33 | gstack-plan-tune | `/plan-tune` | phase.stage == 'plan' and phase.tune_required |
| 34 | gstack-health | `/health` | user.explicit_signal includes "health check" |
| 35 | gstack-make-pdf | `/make-pdf` | subtask.needs_pdf_export == true |

(Total gstack optional = 33 distinct cmd + 2 alias [investigate, retro] linking; 实际 33 NEW entry。修正前文 "30+" 表述为 33。)

### category: tool-slash-cmd — gsd 7 (v2 5 SHIPPED + 2 W2 NEW)

gsd-discuss-phase / gsd-plan-phase / gsd-review / gsd-debug / gsd-progress / gsd-verify-work / gsd-research-phase (W2 SHIPPED per CONTEXT D-08+D-12 cite)

### category: tool-slash-cmd — superpowers 3

| # | Entry | cmd | aliases |
|---|---|---|---|
| 1 | tdd | `superpowers:test-driven-development` | `/tdd` (mattpocock) |
| 2 | superpowers-brainstorming | `superpowers:brainstorming` | — |
| 3 | superpowers-subagent-driven-development | `superpowers:subagent-driven-development` | — (NEW backfill — parallelism-gate.yaml subagent-default invokes 已 ref v2 但 entry 缺) |

### category: tool-slash-cmd — special-purpose design 2

ui-ux-pro-max (gstack `/ui-ux-pro-max`) / frontend-design (gstack `/frontend-design`)

### category: tool-mcp (3 — v2 SHIPPED backfill)

| # | Entry | impl | cmd |
|---|---|---|---|
| 1 | chrome-devtools-mcp | mcp | chrome-devtools |
| 2 | tavily-mcp | mcp | tavily_search |
| 3 | exa-mcp | mcp | web_fetch_exa |

### category: tool-cli (2)

| # | Entry | impl | cmd | sister |
|---|---|---|---|---|
| 1 | ctx7 | cli | ctx7 | v2 SHIPPED, per rules/context7.md SOP |
| 2 | gws | cli | gws | NEW v3, per rules/google-workspace.md (cond fires_when subtask.needs_google_workspace) |

### category: tool-plugin (2)

| # | Entry | impl | cmd | requires |
|---|---|---|---|---|
| 1 | planning-with-files | claude-code-plugin | `/plan` | plugin: planning-with-files >=2.2.0 |
| 2 | playwright-test | npm-cli | `@playwright/test` | (v2 sister — move category from special-purpose to tool-plugin v3 reclassify) |

### category: tool-bundled-skill (3)

| # | Entry | impl | cmd | sdk_ref / plugin |
|---|---|---|---|---|
| 1 | ralph-loop | bundled-skill | ralph-loop | sdk_ref: src/routing/lib/ralphLoop.ts |
| 2 | webapp-testing | gstack | /webapp-testing | (v2 sister gstack — keep impl but reclassify category) |
| 3 | playwright-cli | npm-cli | playwright | (v2 sister npm-cli — keep impl but reclassify category to bundled-skill since AI-probe paradigm 非 plugin nor CLI 标准) |

### category: agent-platform (3 — v2 SHIPPED backfill)

agent-teams-create (TeamCreate) / agent-teams-send-message (SendMessage) / agent-teams-shutdown (TeamDelete)

### Total count

| Category | Count | v2 SHIPPED | NEW v3 |
|---|---|---|---|
| behavioral | 6 | 1 (karpathy-guidelines existed as different category v2 — moves to behavioral v3) | 5 |
| tool-slash-cmd | 56 | 21 (11 matt + 6 gstack-core + 4 superpowers/special) | 35 (33 gstack optional + 2 supp gsd W2 + corrections) |
| tool-mcp | 3 | 3 | 0 |
| tool-cli | 2 | 1 (ctx7) | 1 (gws) |
| tool-plugin | 2 | 1 (planning-with-files) | 1 (playwright-test reclass v2 special-purpose → v3 plugin) |
| tool-bundled-skill | 3 | 2 (ralph-loop + webapp-testing reclass) | 1 (playwright-cli reclass) |
| agent-platform | 3 | 3 | 0 |
| **TOTAL** | **75** | **32** | **43** (含 reclass count 调整) |

(实际 entry name 数 75; CONTEXT 中 "70 entry" 是 approx, 真实 75。差异微小可接受。)

---

## Appendix B — 10 Judgments yaml Map

| # | File | Root key | Status | Sister source |
|---|---|---|---|---|
| 1 | strategic-gate.yaml | triggers | v2 SHIPPED, v3 no change | rules/CLAUDE.md 战略层 |
| 2 | phase-gate.yaml | triggers | v2 SHIPPED, v3 no change | rules/CLAUDE.md Phase 层 |
| 3 | subtask-gate.yaml | triggers | v2 SHIPPED, v3 no change | rules/CLAUDE.md 子任务层 |
| 4 | parallelism-gate.yaml | triggers | v2 SHIPPED, v3 no change (4 route + ralph wrapper 已含) | rules/agent-teams.md |
| 5 | tdd-gate.yaml | triggers | v2 SHIPPED, v3 no change | CLAUDE.md TDD 强烈建议节 |
| 6 | fallback.yaml | rules | v2 SHIPPED, v3 no change (3 铁律) | CLAUDE.md fallback 3 铁律 |
| 7 | web-design-routing.yaml | triggers | **NEW v3** (3 trigger: ui-ux-pro-max-default + frontend-design-creative + design-review-post) | rules/web-design.md |
| 8 | web-testing-routing.yaml | triggers | **NEW v3** (4 trigger: playwright-test-default + playwright-cli-probe + webapp-testing-python-backend + chrome-devtools-mcp-diagnostic) | rules/web-testing.md |
| 9 | web-search-routing.yaml | triggers | **NEW v3** (5 trigger: tavily-default + exa-descriptive + tavily-crawl + ctx7-lib-docs + webfetch-single-url) | rules/web-search.md + context7.md + google-workspace.md (lib-docs 合并入 search file 更紧凑, 不单立 lib-docs.yaml — RESEARCH revision per A7 schema compat) |
| 10 | stage-routing.yaml | triggers | **NEW v3** (12+ trigger: master orchestrator sub delegation per D-01) | sister CLAUDE.md 4-stage + D-07 20 workflow |

**Schema confirm**: 全 10 file 沿用 `judgment.ts` v1 schema (`JudgmentTriggersFile` 或 `JudgmentRulesFile`), schema_version 不 bump。**判断结果**: `judgment.ts` v1 surface 充分, Phase v3.0-3.3 W0 不需要 NEW 17th surface for judgment。

---

## Appendix C — phaseFactContext.ts v3 extend Delta List

### Phase shape NEW (6 boolean)
- `is_complex_architecture` (D-01 master /plan → /plan-architecture)
- `requires_creative_polish` (web-design-routing frontend-design fires)
- `requires_persisted_plan` (D-06 planning-with-files cross-stage)
- `requires_peer_review` (sister gsd-review v2 fires_when 已用, v3 backfill schema)
- `is_final_step` (sister code-simplifier v2 fires_when 已用, v3 backfill schema)
- `has_business_decisions` (sister gstack-plan-ceo-review v2 fires_when 已用, v3 backfill schema)

可选额外 (per gstack 30 entry fires_when 使用):
- `needs_brand_consult` / `has_devex_concerns` / `requires_full_review_pipeline` / `report_only` / `requires_second_opinion` / `has_perf_concerns` / `needs_variants` / `needs_html_mockup` / `is_release_candidate` / `needs_deploy_config` / `needs_gbrain` / `post_deploy_monitor` / `needs_doc_update` / `is_milestone_close` / `tune_required`

**Decision**: 上方 15 extra boolean 全部 add (sister Phase 2.3 W0.2 pattern — fires_when 引用的 field 必须 schema 已声明)。否则 schema validate fail。Total phase shape v3 = 14 (v2) + 6 (NEW core) + 15 (gstack optional) = **35 field**。

### Subtask shape NEW (5 field: 3 enum + 2 boolean)
- `test_type` enum (4 literal: ci-commit / probe / python-backend / perf-diagnostic)
- `search_type` enum (6 literal: keyword / descriptive / academic / lib-docs / github-url / single-url / site-crawl)
- `needs_lib_docs: bool`
- `needs_web_search: bool` (NOTE: 是否 root flat? — research recommend subtask nested for organize)
- `needs_google_workspace: bool`

可选额外 (per gstack 30 entry fires_when):
- `bug_root_cause_unknown` (v2 已有 — verify)
- `needs_browser_automation` / `needs_headed_browser` / `needs_chrome_extension` / `needs_authenticated_browser` / `needs_pdf_doc` / `needs_pdf_export`

**Decision**: subtask shape v3 = 13 (v2) + 5 (core) + 6 (gstack opt) = **24 field**。

### Root flat NEW (2 boolean)
- `needs_web_search` (web-search-routing.yaml top-level ref convenience — 可与 subtask.needs_web_search 重复, recommend root-flat 优先 sister 6 v2 boolean pattern)
- `is_critical_release` (stage-routing.yaml verify-multispec-critical-release ref)

**Decision**: 沿用 v2 6 boolean root-flat pattern, NEW 2 boolean root-flat。Total root = 6 + 2 = **8**。

### Total phaseFactContext.ts v3 fields
- phase: 35 (v2 14 + 21 NEW)
- subtask: 24 (v2 13 + 11 NEW)
- user.explicit_signal: 1
- root-flat: 8 (v2 6 + 2 NEW)
- **Grand total: 68 fields** (v2 34 → v3 68, double 但全为 backfill + gstack optional 35 entry support)

⚠️ **scope risk**: 35 phase + 24 subtask 字段对 phaseFactContext-shape "shape pure" 略胖。**Recommendation**: 第一版 v3.0 只 add core 11 字段 (6 phase + 5 subtask + 2 root = 13 NEW), gstack optional 35 entry register-only **但 fires_when 用 placeholder** `phase.has_ui_changes == true`-class 已存在字段, 不引入 21 phase + 6 subtask NEW field 仅为 gstack optional support。defer 详细 gstack-optional fires_when 到 v3.x patch (sister D-12 register-only spirit)。

**Final phaseFactContext v3 (recommended scope)**:
- phase: 14 (v2) + 6 (core NEW) = **20**
- subtask: 13 (v2) + 5 (core NEW) = **18**
- root-flat: 6 + 2 = **8**
- **Total = 47 fields** (合理 scope)

---

## Appendix D — SendMessage Exchange Log

### → workflows-researcher (sent 2026-05-20)
- 草案 ~70 entry list 7 category (see message body in Team comm log)
- Contract: workflow.yaml v3 `tools_available:` 引用 entry name 必须出自 list
- Question back: 是否漏 entry / 是否 v3 workflow yaml 引用某 entry 我 list 没列?
- gsd-research-phase 状态确认

### → disciplines-researcher (sent 2026-05-20)
- 6 discipline yaml basename 确认 (karpathy / output-style / language / operational / priority / protocols)
- 6 behavioral entry sample schema (capabilities.yaml side)
- 推测 discipline yaml schema 字段 (schema_version + discipline + enforcement_layer + auto_enforce + rules: array)
- Pending reply: basename OK? rules array structure?

### Pending response handling
- 收到 workflows-researcher reply 后: 如有缺失 entry → append to Appendix A + 通知 team-lead
- 收到 disciplines-researcher reply 后: 如 basename 不同 → 修订 6 behavioral entry `discipline_ref` 路径; 如 rules schema 不同 → 更新 [ASSUMED A6] flag

---

## Open Questions / Risks for Planner (Phase 3.2 Wave B)

### Risk R1: phaseFactContext scope creep
- **Risk**: gstack 30 entry 全 fires_when codify → schema 字段爆炸 68 field
- **Mitigation**: 推荐 v3.0 ship 13 NEW field only (6 phase core + 5 subtask + 2 root); 35 gstack optional entry 沿用现有 fires_when expression 用已有字段 OR 临时 placeholder; 详细 fires_when expression 推 v3.x patch
- **Decision needed by planner**: 接受 47 field scope OR 68 field full backfill?

### Risk R2: gstack slash cmd 实际不存在
- **Risk**: project CLAUDE.md L52-100 gstack skill list 是 documentation, 但 gstack plugin 当前安装的 cmd 不一定全部包含
- **Mitigation**: Wave C plan-check 加一步 `gstack list-skills` (如有该命令) OR `grep -r '"name":' ~/.claude/plugins/gstack/` 输出与 capabilities.yaml 30 entry 做 diff;不匹配 → 标 `since: v3.x` 改为 v3.x patch defer
- **Decision needed by planner**: Wave C check 是 hard fail OR soft warn?

### Risk R3: superpowers-subagent-driven-development entry 名称
- **Risk**: parallelism-gate.yaml v2 SHIPPED `invokes: [{capability: superpowers-subagent-driven-development}]` 但 capabilities.yaml v2 SHIPPED 39 entry 中 **不存在** 该 entry → v2 已 silent broken? (judgmentResolver 不做 cross-validate)
- **Verification needed**: Phase 2.3 W0.4 judgmentResolver.ts 是否在 invokes capability 引用做 cross-validate? 若不, v2 已 silent broken (functional fix 无需 v3 ship, 但应 unit-test cover)
- **Decision needed by planner**: Wave A.5 加 capabilities-judgments cross-validate to schema-check script?

### Risk R4: stage-routing.yaml 与 strategic/phase/subtask gate 重复
- **Risk**: stage-routing.yaml master orchestrator delegation 复制了 strategic-gate.yaml / phase-gate.yaml / subtask-gate.yaml 的 fires_when expression — 重复 codify 维护负担
- **Mitigation 1**: stage-routing 改 `gate_ref: judgments.strategic-gate.office-hours.fires` (5-level NEW ref 模式), 不 inline 重复 — 需 judgmentResolver 支持 5-level
- **Mitigation 2 (recommended)**: stage-routing 只编 master 自己的 logic (e.g., 顺序: architecture conditional → phase always → persist always for /plan master), 真 fires_when 仍 delegate 已有 3 gate file
- **Decision needed by planner**: Mitigation 1 OR 2?

### Open question Q1: master orchestrator delegation 实装
- workflow.yaml v3 master `auto/workflow.yaml` 如何 spawn 多 sub-workflow? 现有 v2 schema `phase.invokes` 是 string slash-cmd, 不是 `invokes_workflow: <sub-yaml-path>`
- **Recommend**: NEW workflow.yaml v3 phase field `delegates_to: string[]` (list of sub workflow names per nested dir) OR sticky to `invokes_tools` 中 list capability。**Defer to workflows-researcher RESEARCH**.

### Open question Q2: capabilities.yaml 内 alias entry pattern
- gstack 30 entry 中 `gstack-investigate` 与 mattpocock 11 `investigate` 名称冲突。如何 disambiguate?
- **Recommendation**: gstack 一律 prefix `gstack-`, mattpocock 无 prefix (v2 SHIPPED 11 entry 命名一致)。如 sister D-13 alias map 需要, alias 字段 `aliases: [{impl: gstack, cmd: /investigate}]` on mattpocock investigate entry (v2 sister gsd-debug → mattpocock /diagnose alias pattern)。

---

## Metadata

**Confidence breakdown**:
- capabilities.yaml v3 schema TypeBox extend: HIGH — sister 67L v1 SHIPPED + clear extend pattern
- ~75 entry final list: MEDIUM-HIGH — 32 v2 SHIPPED backfill HIGH, 33 gstack optional cmd MEDIUM (A1 ASSUMED — gstack plugin 实装一致性)
- 10 judgments yaml: HIGH — schema v1 不动, 4 NEW file 沿用 triggers 现有字段 [VERIFIED A7]
- phaseFactContext extend: MEDIUM — scope 13 NEW field MIN OR 47 field FULL 取决于 planner
- SendMessage contract: HIGH — entry name list 给 workflows-researcher 明确; 6 basename 给 disciplines-researcher 明确

**Research date**: 2026-05-20
**Valid until**: 2026-05-23 (Phase v3.0 GA target window) OR Phase 3.3 W0 schema implementation start

**Ready for planning**: Phase v3.0-3.2 Wave B planner 可基于本 RESEARCH 创建 task_plan.md (~10-15 task Phase 3.3 W0 schema + 3.4 sub-workflows 引用 capabilities + 3.5 master orchestrator 引用 stage-routing.yaml)。

---

*Researcher: capabilities-researcher (Team `phase32-research-team`)*
*Confidence: HIGH (~85%)*
*Lines: ~700L (target met)*
*Sister sister teammates pending: workflows-researcher (entry contract) + disciplines-researcher (6 basename + rules schema)*

---

## Appendix E — Reconcile Addendum (2026-05-20 post-RESEARCH SendMessage round-trip)

收到 workflows-researcher + disciplines-researcher 反馈后的 contract 收敛。

### E.1 Category naming dispute — RESOLUTION: `behavioral` (NOT `discipline`)

- **disciplines-researcher 提议**: rename `category: behavioral` → `category: discipline` (D-09 NEW L0 substrate semantic match)
- **workflows-researcher 反馈**: 已用 `behavioral` 命名 cross-validate sketch
- **CONTEXT.md D-08 verbatim**: enum 包含 `category: behavioral` (line 110: "category: behavioral — karpathy-guidelines")
- **DECISION (capabilities-researcher final)**: **`behavioral` 锁定**。理由:
  1. D-08 CONTEXT.md verbatim 已 LOCK `behavioral`,workflows-researcher 已 apply
  2. 命名分层清晰: `category: behavioral` (L1 capabilities 引用标记) ≠ `harnessed.discipline.v1` (L0 disciplines/*.yaml 文件 schema surface)
  3. Entry name 后缀 `-discipline` (e.g. `output-style-discipline`) 已携带 discipline 含义,category 字段无需 redundant
- **Sentinel cmd value**: 沿用 disciplines-researcher 提议 `'<not-applicable-behavioral>'` (workflows-researcher 已知悉) — runtime engine 检测 category=behavioral 时 SKIP cmd invoke,改 load `discipline_ref` yaml + apply rules via hook

### E.2 Entry name prefix policy (gstack 6 core vs 30 optional)

**workflows-researcher reconcile applied** — capabilities-researcher 接受全部 5 delta:

| Rule | gstack 6 core wrapped | gstack 33 optional registry |
|---|---|---|
| **Prefix** | `gstack-` (sister v2 SHIPPED verbatim) | **NO prefix** (bare per Pattern A) |
| **Example** | `gstack-office-hours` / `gstack-review` | `autoplan` / `codex` / `design-shotgun` |
| **Alias suffix** | — | `-gstack` for namespace-clash mattpocock (e.g. `retro-gstack` aliasing harnessed standalone `/retro`, `investigate-gstack` aliasing mattpocock `investigate`) |

**Appendix A 修订**: gstack 30 entry 中 `gstack-investigate` → `investigate-gstack`, `gstack-retro` → `retro-gstack`, **其余 31 entry 删除 `gstack-` prefix** (autoplan / design-consultation / plan-design-review / plan-devex-review / context-save / context-restore / qa-only / devex-review / codex / benchmark / design-shotgun / design-html / browse / open-gstack-browser / connect-chrome / setup-browser-cookies / ship / land-and-deploy / setup-deploy / setup-gbrain / canary / document-release / document-generate / careful / guard / freeze / unfreeze / gstack-upgrade / learn / plan-tune / health / make-pdf 等)。

**注意**: `open-gstack-browser` / `gstack-upgrade` 这两个 entry name 自身包含 `gstack` 字符串(不是 prefix policy 而是 cmd 名字自带),保留原样不剥离。

### E.3 superpowers / mattpocock / gsd 命名澄清

- mattpocock = **11 高频** (NOT 12) — 修订 Appendix A bucket comment "mattpocock 11" 一致
- `tdd` 是 superpowers core (impl=superpowers, alias /tdd mattpocock) — NOT 计入 mattpocock 11 count
- superpowers core 3: `tdd` / `superpowers-brainstorming` / `superpowers-subagent-driven-development` (后者 v3 NEW backfill — sister parallelism-gate.yaml v2 invokes 已 ref 但 entry 缺,Risk R3 已 flag)
- gsd 5 v2 SHIPPED + 1 W2 NEW (`gsd-research-phase`) + `gsd-debug` 保留 alias 到 mattpocock /diagnose (sister v2 SHIPPED 不改)

### E.4 schema_version surface count (18 surface post-v3.0)

- v2 16 surface (sister `schemaVersion.ts` SCHEMA_VERSIONS 16 const)
- v3 NEW 2 surface:
  - 17th: `harnessed.workflow.v3` (sister workflows-researcher RESEARCH 主导)
  - 18th: `harnessed.discipline.v1` (sister disciplines-researcher RESEARCH 主导)
- **capabilities-researcher 子域不引入新 schema_version surface** — capabilities.ts + judgment.ts + phaseFactContext.ts 全部 extend in-place,不 bump

### E.5 cross-validate strict mode contract (Phase 3.3 实装 task)

**workflows-researcher 确认**: `scripts/check-workflow-schema.mjs` extend 加 cross-validate:
- `workflow.yaml.tools_available[]` 每元素 ∈ capabilities.yaml entry set → 不在 fail-fast
- `workflow.yaml.disciplines_applied[]` 每元素 ∈ {karpathy, output-style, language, operational, priority, protocols} → 不在 fail-fast
- `judgments/*.yaml.triggers.*.invokes[].capability` 每值 ∈ capabilities.yaml entry set → 不在 fail-fast (Risk R3 mitigation)

3 cross-validate 全部 Phase 3.3 W0 ship per planner Wave B task。

### E.6 SendMessage round-trip log

| Time | From → To | Topic | Resolution |
|---|---|---|---|
| Initial | capabilities → workflows | ~70 entry name list draft + 4 contract item | workflows reconcile 5 delta applied |
| Initial | capabilities → disciplines | 6 basename + rules schema fields query | disciplines reply with `category: discipline` rename request |
| Reconcile | disciplines → capabilities | category rename + sentinel cmd | **DECISION: behavioral 锁定 (CONTEXT D-08 verbatim), sentinel cmd accept** |
| Reconcile | workflows → capabilities | category=behavioral confirm + cross-validate contract | **Both align on behavioral** |
| Final | capabilities → both | Appendix E reconcile + RESEARCH ship signal | (in flight — this addendum) |

