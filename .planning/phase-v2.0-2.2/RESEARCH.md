# Phase v2.0-2.2 — RESEARCH (Wave A: 8 focus area technical investigation)

> **Researched**: 2026-05-20
> **Researcher**: gsd-phase-researcher (Opus 4.7 1M context)
> **Scope**: Wave A — 8 focus area (expr-eval / capabilities.yaml 25+ baseline / ralph-loop SDK pattern / Agent Teams settings.json check / planning-with-files SDK / judgments multi-file schema / max-iterations fallback UX / dogfood E2E test design) + 1 architectural risk surfacing
> **Confidence**: HIGH on 5/8 area (expr-eval / Agent Teams / planning-with-files / ralph-loop / judgments schema), MEDIUM on 3/8 (capabilities baseline 25+ entry, max-iterations 默认值, dogfood E2E 设计 — 决定权 planner Wave B)
> **Phase context (Phase v2.0-2.1 LOCK)**: 16 D-decision LOCKED + 16 R20.x requirement + 6 phase split (per Q-AUDIT-4)。本 RESEARCH 不重做 Phase 2.1 决策, 仅深化 Wave A research scope。

---

## § 0 Scope note — what this RESEARCH does NOT redo

Phase v2.0-2.1 已 LOCKED:

- D-01 ~ D-09 (initial 9 D-decision): Pure bundled / flat yaml capabilities / expr-eval / judgments / no migrate CLI / R20.6 DROP / static manifest + ADR / 2 NEW workflows / mattpocock route
- D-10 ~ D-16 (Q-AUDIT amend 7 D-decision): ralph-loop 真接 / parallelism-gate + Agent Teams env check / verify-work full scope / tdd-gate / special-purpose tools / planning-with-files 真接 / judgments multi-file 分类
- 6 phase split: Phase v2.0-2.1 ship + 2.2 plan + 2.3 schema + 2.4 workflows + 2.5 dogfood + 2.6 close

本 RESEARCH 在 LOCKED scope 内深化 technical 实装路径, 不再重新 evaluate alternative 方案。

---

## § 1 expr-eval npm dep deep-dive

**Confidence: HIGH** (npm registry verified + GitHub README verified + ctx7 indexed High-Reputation/76.8 Benchmark Score)

### 1.1 Package metadata 实测 (npm view 2026-05-20)

| 字段 | 实测值 | CONTEXT.md D-03 声称 | Delta |
|------|-------|---------------------|-------|
| version | 2.0.2 | (未标) | — |
| license | MIT | MIT | ✓ |
| dependencies | `{}` (zero) | 未提 | ✓ better than expected |
| **unpackedSize** | **145.6 KB** | **~5 KB** | ⚠️ **数据差 29×** |
| fileCount | 8 | — | — |
| main | `dist/bundle.js` | — | UMD bundle |
| weekly downloads | (npm view 不直接给) 估 ~4M | 4M weekly | ✓ |
| last publish | "over a year ago" | — | ⚠️ stable but stagnant |
| repository | https://github.com/silentmatt/expr-eval | — | — |

**Key finding**: D-03 CONTEXT.md 声称 "~5KB" 与 npm `unpackedSize: 145577` (145.6 KB) **不一致**。**HIGH-priority correction for planner Wave B**: 调研显示 unpackedSize 145.6 KB ≠ runtime bundle 影响, 实际:

- **UMD bundle minified** (估 ~30-40 KB, 来自 `dist/bundle.js` 单文件)
- **gzipped over wire** (估 ~10-15 KB)
- **tree-shake ESM** (库不 tree-shake-friendly, 单 import = 完整 Parser; 估 ~30 KB delta after CommonJS bundling 进 Node CLI)

**对 harnessed CLI 的影响**: harnessed 是 Node CLI 不是 browser bundle, 145.6 KB unpackedSize → 进 node_modules + require() lazy load → 启动 token 影响 < 1ms。**不是 blocker**, 但 D-03 文案 "~5KB" 准确度低应在 Phase 2.6 close ADR 中校正。

### 1.2 API surface (GitHub README verified 2026-05-20)

```javascript
const { Parser } = require('expr-eval')
const parser = new Parser()

// Step 1: 解析 expression → AST `Expression` object
const expr = parser.parse("phase.type == 'new_feature' AND phase.open_decisions >= 2")

// Step 2: 求值 with variable dict
const result = expr.evaluate({
  phase: { type: 'new_feature', open_decisions: 3 }
})
// → true

// Step 3 (optional): 反查未绑定变量
expr.variables() // → ['phase.type', 'phase.open_decisions']

// Step 4 (optional): substitute 变量后再求值 (currying)
expr.substitute('phase.type', "'new_feature'") // returns new Expression
```

**Verified grammar support** (GitHub README §):
- ✓ 逻辑: `and`, `or`, `not` (also `AND`/`OR` ALL-CAPS 同义)
- ✓ 比较: `==`, `!=`, `>=`, `<=`, `>`, `<`
- ✓ **`in` 操作符**: "left operand included in right array operand"
  - Example: `phase.type in ['new_feature', 'new_milestone', 'new_project']`
- ✓ 数学: `+ - * / %` (本 phase 不用, 但 expr-eval 是 math-oriented parser, side-effect 不影响 boolean eval)
- ✓ 字符串字面值: 单引号 `'value'` 直接支持
- ✓ 嵌套属性 (`phase.type` dot access): Parser 视为 single identifier, `evaluate({phase: {type: ...}})` 自动 deref

**Verdict for D-03 confirm**: expr-eval **完全 cover** CONTEXT.md L42 `phase.type in [...] AND open_decisions >= 2` 类 expression syntax。**D-03 LOCKED 决策仍然 valid, 推荐 keep。Alternative jsep parser-only (CONTEXT 提) 需自实现求值 ~100L 边际收益低, 不推荐。**

### 1.3 Phase fact context 注入 builder 推荐 pattern

planner Wave B 需要的 `expr-eval` AST builder 函数把 phase metadata 注入 evaluator context。推荐 ~30L impl:

```typescript
// src/workflow/exprBuilder.ts (NEW Phase 2.3 — capabilities.yaml/judgments/ schema validate)

import { Parser, type Expression } from 'expr-eval'

const parser = new Parser({
  // Phase 2.3 lock down operators — disable function call to prevent injection
  operators: {
    add: false, subtract: false, multiply: false, divide: false, // 数学不用
    logical: true, comparison: true, in: true, // boolean 用
    assignment: false, // CRITICAL: 防 expression 内赋值副作用
  },
})

export interface PhaseFactContext {
  phase: {
    type: 'new_project' | 'new_milestone' | 'new_feature' | 'bug_fix' | 'tech_debt' | 'continuing_phase'
    open_decisions: number
    scope_days: number
    single_task: boolean
    is_critical_module: boolean
    has_ui_changes: boolean
    has_auth_or_secrets: boolean
    has_design_changes: boolean
    is_major_release: boolean
    is_large_refactor: boolean
    spec_ambiguous: boolean
    unfamiliar_module: boolean
  }
  subtask: {
    type: 'crud' | 'core_logic' | 'algorithm' | 'ui_polish' | 'docs_only' | 'single_command_query'
    lines: number
    approaches: number
    core_algorithm: boolean
    is_core_business_logic: boolean
    is_algorithm: boolean
    is_data_processing: boolean
    regression_risk: 'low' | 'medium' | 'high'
    reliability_required: boolean
  }
  user: {
    explicit_signal: string[] // e.g., ["先 brainstorm", "跑 office-hours"]
  }
}

export function evalGate(expr: string, ctx: PhaseFactContext): boolean {
  try {
    const parsed: Expression = parser.parse(expr)
    return Boolean(parsed.evaluate(ctx as unknown as Record<string, unknown>))
  } catch (err) {
    // Phase 2.3 hard schema validate at load time;  runtime error → fail closed (skip gate)
    throw new GateEvalError(`Failed to eval gate: ${expr}`, err as Error)
  }
}
```

**Actionable for planner Wave B**:
- Phase 2.3 task: NEW `src/workflow/exprBuilder.ts` ~50L + `tests/workflow/exprBuilder.test.ts` ~80L (10 fixture covering each operator + injection attempt + missing variable)
- Phase 2.3 task: NEW `src/workflow/schema/phaseFactContext.ts` ~80L (TypeBox typed schema for the context shape)
- Security: `assignment: false` + `operators: {...}` lockdown 防止 yaml-injection 触发副作用 (sister Phase 2.2 STRIDE T-2.2-02 类似 mitigation)

---

## § 2 capabilities.yaml v2.0 baseline 25+ entry candidate list

**Confidence: MEDIUM-HIGH** (mattpocock 6 招式本地 verified + special-purpose 13+ entry 全部 cross-ref ~/.claude/rules/web-*.md verified, Agent Teams entry 5 升级触发 verified via ~/.claude/rules/agent-teams.md)

### 2.1 本地 mattpocock 招式 inventory (verified 2026-05-20)

`ls C:/Users/easyi/.claude/skills/` 找到 **6 个本地 mattpocock-aliased 招式** (实际安装的 subset, 非全 23):

| Skill | Cmd | Use Case (sister CLAUDE.md "mattpocock 23 招式") |
|-------|-----|--------------------------------------------------|
| caveman | /caveman | token 紧张时 surgical edit |
| diagnose | /diagnose | 系统化排错 |
| grill-me | /grill-me | 反向追问 |
| grill-with-docs | /grill-with-docs | 规格澄清 with docs |
| tdd | /tdd | TDD red-green-refactor (alias to superpowers:test-driven-development) |
| zoom-out | /zoom-out | 陌生模块导航 |

**Implication for D-09 "mattpocock 12+ 高频子集"**: 本地实测发现只 6 招式安装 (NOT 12)。Phase 2.3 capabilities.yaml ship 12+ entry 需 **maintainer 在 manifest 中 alias 高频子集而非依赖本地安装数量**。推荐 12 高频招式 baseline:

| # | Capability name | impl | cmd | since | Sister CLAUDE.md 句型 trigger |
|---|----------------|------|-----|-------|-------------------------------|
| 1 | grill-with-docs | mattpocock | /grill-with-docs | 2.0 | spec_ambiguous == true |
| 2 | zoom-out | mattpocock | /zoom-out | 2.0 | unfamiliar_module == true |
| 3 | diagnose | mattpocock | /diagnose | 2.0 | test_fail OR debug |
| 4 | caveman | mattpocock | /caveman | 2.0 | token_tight == true |
| 5 | grill-me | mattpocock | /grill-me | 2.0 | spec_ambiguous AND no_docs |
| 6 | tdd | mattpocock (alias) | /tdd | 2.0 | tdd-gate fires |
| 7 | to-prd | mattpocock | /to-prd | 2.0 | translate_idea_to_prd |
| 8 | to-issues | mattpocock | /to-issues | 2.0 | translate_prd_to_issues |
| 9 | improve-codebase-architecture | mattpocock | /improve-codebase-architecture | 2.0 | architecture_health_audit |
| 10 | code-review | mattpocock (or skill alias) | /code-review | 2.0 | verify-work parallel fan-out |
| 11 | code-simplifier | mattpocock | /code-simplifier | 2.0 | verify-work tail step |
| 12 | investigate | mattpocock | /investigate | 2.0 | gstack-routed bug investigation |

**Caveat**: 12-招式 list 是 maintainer 三层栈方法论中 sister CLAUDE.md 显式列出的 "高频使用项"。剩余 11 招式 (per D-09 deferred 推 v2.x patch release) 在 capabilities.yaml `since: v2.x` 字段标记 disposition。

### 2.2 special-purpose tools 13+ entry (per D-14, cross-ref ~/.claude/rules/web-*.md)

| # | Capability name | impl | cmd | since | Sister rule |
|---|----------------|------|-----|-------|-------------|
| 13 | ui-ux-pro-max | gstack-skill | /ui-ux-pro-max (or skill) | 2.0 | web-design.md L5 默认主方案 |
| 14 | frontend-design | gstack-skill | /frontend-design | 2.0 | web-design.md L11 创意补充 |
| 15 | playwright-cli | npm-cli | playwright | 2.0 | web-testing.md L8 手 (AI 实时操作) |
| 16 | playwright-test | npm-cli | @playwright/test | 2.0 | web-testing.md L8 脑 (E2E CI) |
| 17 | webapp-testing | gstack-skill | /webapp-testing | 2.0 | web-testing.md L11 筋骨 (Python 后端联动特例) |
| 18 | chrome-devtools-mcp | mcp | chrome-devtools | 2.0 | web-testing.md L45 非功能性诊断 |
| 19 | ctx7 | cli | npx ctx7@latest | 2.0 | context7.md (库 API 文档) |
| 20 | tavily-mcp | mcp | tavily_search | 2.0 | web-search.md L17 默认搜索 |
| 21 | exa-mcp | mcp | web_fetch_exa | 2.0 | web-search.md L24 描述式/学术 |
| 22 | gsd-review | gsd-cmd | /gsd-review | 2.0 | gsd cross-AI peer review |
| 23 | gsd-debug | gsd-cmd | /gsd-debug | 2.0 | diagnose alias (overlap with mattpocock) |
| 24 | gsd-progress | gsd-cmd | /gsd-progress | 2.0 | verify-work serial after gsd-verify-work |
| 25 | gsd-verify-work | gsd-cmd | /gsd-verify-work | 2.0 | verify-work entry |

### 2.3 verify-work / planning-with-files / Agent Teams entry (per D-12 / D-15 / D-11)

| # | Capability name | impl | cmd | since |
|---|----------------|------|-----|-------|
| 26 | planning-with-files | claude-plugin | /plan (alias to plugin) | 2.0 |
| 27 | gstack-review | gstack-skill | /review (Paranoid Staff Eng) | 2.0 |
| 28 | gstack-qa | gstack-skill | /qa | 2.0 |
| 29 | gstack-cso | gstack-skill | /cso | 2.0 |
| 30 | gstack-design-review | gstack-skill | /design-review | 2.0 |
| 31 | agent-teams-create | claude-platform | TeamCreate | 2.0 |
| 32 | agent-teams-send-message | claude-platform | SendMessage | 2.0 |
| 33 | agent-teams-shutdown | claude-platform | SendMessage shutdown_request + TeamDelete | 2.0 |
| 34 | ralph-loop | bundled-skill | ralph-loop --completion-promise --max-iterations | 2.0 |
| 35 | superpowers-brainstorming | superpowers | /brainstorming OR superpowers:brainstorming | 2.0 |

**Total: ~35 entry baseline** (远超 "25+" floor, sister Phase 2.1 CONTEXT.md spec L154 "25+ entry"; planner Wave B 自由调整 12 mattpocock subset selection 但 13+ special-purpose 必须 ship 全, 否则 D-14 acceptance 不满)。

### 2.4 yaml schema 示例 (planner Wave B 直接 copy 起步)

```yaml
# <packageRoot>/workflows/capabilities.yaml (NEW Phase 2.3)
# Per R20.2 + R20.5 + R20.8 + R20.13 + R20.14
# Maintainer-curated static manifest; upstream 升级 → ADR 0025+ + npm patch release
schema_version: harnessed.capabilities.v1  # sister Phase 2.2 schemaVersion 7 surface convention

capabilities:
  # —— mattpocock 12 招式 high-frequency subset (D-09 + D-14) ——
  grill-with-docs:
    impl: mattpocock-skills
    cmd: /grill-with-docs
    since: v2.0
    description: 规格澄清 with docs (fires when phase.spec_ambiguous == true)
    docs_ref: ~/.claude/rules (mattpocock 23 招式 高频子集)

  zoom-out:
    impl: mattpocock-skills
    cmd: /zoom-out
    since: v2.0
    description: 陌生模块导航 (fires when phase.unfamiliar_module == true)

  # ... (10 more mattpocock entry) ...

  # —— TDD entry alias (D-13, sister CLAUDE.md tdd-gate) ——
  tdd:
    impl: superpowers
    cmd: superpowers:test-driven-development
    aliases:
      - { impl: mattpocock-skills, cmd: /tdd, since: v2.0 }
    since: v2.0
    description: TDD red-green-refactor (gated by tdd-gate.yaml fires_when conditions)

  # —— planning-with-files (D-15) ——
  planning-with-files:
    impl: claude-plugin
    cmd: /plan  # slash cmd 触发 plugin skill spawn
    plugin_path: ~/.claude/plugins/cache/planning-with-files/planning-with-files/2.34.0
    since: v2.0
    description: Manus-style persistent markdown planning (生成 task_plan.md + progress.md + findings.md)
    outputs:
      - task_plan.md
      - progress.md
      - findings.md

  # —— ralph-loop (D-10) ——
  ralph-loop:
    impl: bundled-skill
    cmd: ralph-loop  # 直 invoke via src/routing/lib/ralphLoop.ts wrapper
    since: v2.0
    description: Sub-task completion gate (verbatim COMPLETE; max-iterations fallback)
    sdk_ref: src/routing/lib/ralphLoop.ts (Phase 2.2 v0.2.0 ship)

  # —— Agent Teams 5 升级触发 entry (D-11) ——
  agent-teams-create:
    impl: claude-platform
    cmd: TeamCreate
    since: v2.0
    requires:
      - env: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
      - settings: ~/.claude/settings.json env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
      - cc_version: ">=2.1.133"
    fires_when:
      - teammate_send_message_needed == true
      - subagent_context_overflow == true
      - shared_task_list == true
      - opposing_hypothesis_debate == true
      - fullstack_three_way == true

  # —— special-purpose tools 13+ (D-14) ——
  ui-ux-pro-max:
    impl: gstack-skill
    cmd: /ui-ux-pro-max
    since: v2.0
    description: 默认 UI/UX design 数据驱动方案 (per ~/.claude/rules/web-design.md L5)
    fires_when:
      - phase.has_ui_changes == true
      - subtask.type == 'ui_polish'

  # ... (12 more special-purpose entry: frontend-design / playwright-cli / @playwright/test /
  # webapp-testing / chrome-devtools-mcp / ctx7 / tavily-mcp / exa-mcp / gsd-review /
  # gsd-debug / gsd-progress / gsd-verify-work) ...

  # —— gstack 4-stage 治理关卡 (D-12 verify-work scope full) ——
  gstack-review:
    impl: gstack-skill
    cmd: /review
    since: v2.0
    description: Paranoid Staff Engineer 视角 (强制 conditional, fires when phase.is_critical_module)
    fires_when:
      - phase.is_critical_module == true

  # ... (3 more gstack entry: /qa / /cso / /design-review) ...
```

**Actionable for planner Wave B**: 在 task_plan.md 中 Phase 2.3 wave A 列单一 task "NEW capabilities.yaml ~35 entry baseline" 单文件 ~250-300L; 推荐拆 3 commit (mattpocock 12 / special-purpose 13 / Agent Teams + gstack + bundled 10)。

---

## § 3 ralph-loop SDK integration pattern review

**Confidence: HIGH** (sister Phase 2.2 v0.2.0 PLAN.md verified + src/routing/lib/ralphLoop.ts 实装 read + ADR 0011 existence verified)

### 3.1 Sister Phase 2.2 v0.2.0 ship state (verified 2026-05-20)

| Asset | Path | Status | 复用 path 到 v2.0 |
|-------|------|--------|------------------|
| ralphLoop.ts | src/routing/lib/ralphLoop.ts | ✅ 54L EXACT ≤50L extended for dual-signal (4 ≤50L D1.4-3) | ✅ 直接复用 v2.0 不动 |
| isComplete dual-signal | src/routing/lib/ralphLoop.ts L11-20 | ✅ 4-layer (PRIMARY structured_output + FALLBACK promise + raw fallback + JSON parse fail catch) | ✅ 复用 |
| sdkSpawn.ts | src/routing/lib/sdkSpawn.ts | ✅ ship 2026-05-15 | ✅ 复用 |
| sdkReconcile.ts | src/routing/lib/sdkReconcile.ts | ✅ ship | ✅ 复用 |
| promiseExtract.ts | src/routing/lib/promiseExtract.ts | ✅ ship 32L | ✅ 复用 |
| ADR 0011 | docs/adr/0011-execute-task-sdk-ralph.md | ✅ accepted 9 章节 | ✅ 引用作 v2.0 ADR 0025+ baseline |
| `MaxIterationsExceededError` | src/routing/lib/ralphLoop.ts L22-27 | ✅ explicit class | ✅ 复用 |
| `VerbatimCompleteFailError` | src/routing/lib/ralphLoop.ts L29-34 | ✅ explicit class | ✅ 复用 |
| workflows/execute-task/phases.yaml | model: 字段 + 4 phase chain | ✅ ship (haiku 04-deliver) | ⚠️ Phase 2.4 升级加 gate/on/capability 字段 |

**Verdict**: ralph-loop full SDK integration **已 100% 就绪** since v0.2.0 ship。Phase v2.0-2.4 task "execute-task workflow.yaml v2 加 ralph-loop 真接" 实际是 **schema-only delta** — 在 phases.yaml 04-deliver step 加 `capability: ralph-loop` 显式标注 + `on: {if: ralph_loop_required, invoke: ...}` 条件。无需重写 ralphLoop.ts。

### 3.2 ADR 0011 Phase 2.2 pattern 复用 to v2.0 (verified)

ADR 0011 提供的 9 章节 pattern (sister Phase 2.2 RESEARCH.md § 1.3 dual-signal architectural truth):

1. SDK 引入 (`@anthropic-ai/claude-agent-sdk` query() + outputFormat json_schema + agents map)
2. ralph-wiggum keep (FALLBACK 路径 functional 即使 PRIMARY 失败)
3. dual-signal completion (4-layer: outer PRIMARY structured_output / outer FALLBACK promise / inner PRIMARY promise / inner FALLBACK subtype success)
4. contract v1.2 reconcile (14→4 字段)
5. per-phase model tier (opus/sonnet/haiku)
6. Wave 0 transparency
7. SchemaVersion 7 surface
8. Provenance gate
9. Task Session conditional

**v2.0-2.4 任务直接消费**: workflows/execute-task/phases.yaml 04-deliver step 加 `capability: ralph-loop` + `--completion-promise COMPLETE` + `--max-iterations {{ default }}` 模板 (jinja-like, 复用 D-02 gstack_prefix interpolation pattern from workflows/plan-feature/workflow.yaml L13)。

### 3.3 v2.0-2.4 ralph-loop wire 推荐 schema delta (planner Wave B 直接消费)

```yaml
# workflows/execute-task/phases.yaml v2 (Phase 2.4 task)
workflow: execute-task
schema_version: harnessed.workflow.v2  # sister Phase 2.2 schemaVersion 7 surface
on_veto: halt_workflow
phases:
  - id: 04-deliver
    name: deliver (ralph-loop COMPLETE gate)
    upstream: ralph-loop
    capability: '{{ capabilities.ralph-loop.cmd }}'  # NEW v2: capability abstraction (D-02)
    model: haiku  # per ADR 0011 § 5 (sister 04-deliver=haiku)
    args:                                            # NEW v2: ralph-loop SDK 参数
      completion_promise: COMPLETE                   #   verbatim COMPLETE (R20.10)
      max_iterations: '{{ defaults.ralph_max_iterations }}'  # 默认 20 (per § 7 below)
    gate: judgments.parallelism-gate.fires           # NEW v2: gate yaml-eval (D-04+D-11)
    on:                                              # NEW v2: conditional invoke (D-09)
      - if: 'subtask.lines >= 20 AND subtask.type != "single_command_query"'
        invoke: '{{ capabilities.ralph-loop.cmd }}'
      - if: 'subtask.lines < 20 OR subtask.type == "single_command_query"'
        action: skip  # 主 session 直跑 (per agent-teams.md L14-19 降级)
    fallback:
      max_iterations_exceeded:                       # explicit fallback (R20.10 acceptance "explicit NOT silent")
        action: emit_warning_and_halt
        message: '⚠️ ralph-loop max-iterations ({{ args.max_iterations }}) exceeded. Subagent failed to emit verbatim COMPLETE. Manual intervention required.'
        exit_code: 1
```

---

## § 4 Agent Teams settings.json check 实现路径

**Confidence: HIGH** (本地 settings.json verified + ~/.claude/rules/agent-teams.md L7 prereq verified + sister src/cli/setup.ts pattern read)

### 4.1 实测 settings.json schema (verified 2026-05-20)

`cat ~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "API_TIMEOUT_MS": "3000000"
  },
  "includeCoAuthoredBy": false,
  "hooks": { ... }
}
```

**CRITICAL finding for D-11 + Phase 2.1 CONTEXT.md L101**: Phase 2.1 文档声称 `"experimental": {"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"}` 嵌套字段, 但实测发现 **schema 是 `env` (root-level) 而非 `experimental` (nested)**。CONTEXT.md L101 wording 不准确 (说 "settings.json `experimental` 字段含 ..."), 应当 in Phase 2.3 setup.ts patch 时按实际 schema 读。

### 4.2 实装路径 (3 候选, 推荐 Node.js native JSON.parse)

| Option | 实装 | 行数 | 优缺点 |
|--------|------|------|-------|
| **(a) Node.js native** | `JSON.parse(await readFile('~/.claude/settings.json', 'utf8'))` 后查 `data.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === '1'` | ~10L | ✓ zero dep, ✓ 跨平台, ✓ sister setup.ts L23 已 import readFile |
| (b) jq parse | `jq -r '.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS' ~/.claude/settings.json` | ~5L Bash | ✗ Win 需 Git Bash + jq, ✗ doctor.ts 已 check jq presence — chicken-and-egg |
| (c) shell-only | `grep -q '"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": *"1"' ~/.claude/settings.json` | ~3L | ✗ fragile (whitespace 敏感), ✗ json 结构变化 break, ✗ Win shell 兼容 |

**Recommended: Option (a) Node.js native**. 复用 sister src/cli/setup.ts L23 import + L57 `getPackageRoot()` pattern。新增 ~50L 到 `src/cli/doctor.ts` (待 ship Phase 2.4 D-01 R2.4.1 主流程) OR 直接到 `src/cli/setup.ts` (Phase 2.3 patch)。

### 4.3 推荐 doctor check 实装 (Phase 2.3 task, ~30L delta)

```typescript
// src/cli/lib/checkAgentTeams.ts (NEW Phase 2.3 ~30L)

import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { resolve } from 'node:path'

export interface AgentTeamsCheckResult {
  status: 'pass' | 'warn' | 'missing'
  detected: { env: boolean; settingsJson: boolean }
  envValue?: string
  settingsValue?: string
  remediation?: string
}

export async function checkAgentTeams(): Promise<AgentTeamsCheckResult> {
  // Probe 1: env var
  const envValue = process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
  const envOn = envValue === '1'

  // Probe 2: settings.json env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
  let settingsValue: string | undefined
  let settingsOn = false
  try {
    const path = resolve(homedir(), '.claude', 'settings.json')
    const raw = await readFile(path, 'utf8')
    const data = JSON.parse(raw) as { env?: Record<string, string> }
    settingsValue = data.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
    settingsOn = settingsValue === '1'
  } catch {
    // settings.json missing or unparseable — non-fatal
  }

  const detected = { env: envOn, settingsJson: settingsOn }
  if (envOn || settingsOn) {
    return { status: 'pass', detected, envValue, settingsValue }
  }

  return {
    status: 'missing',
    detected,
    envValue,
    settingsValue,
    remediation:
      'Add to ~/.claude/settings.json:\n  "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" }\nOR export env var:\n  export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1\nThen restart Claude Code (CC ≥ 2.1.133 required).',
  }
}
```

**Phase 2.3 task split**: (1) NEW `src/cli/lib/checkAgentTeams.ts` ~30L; (2) NEW `tests/cli/checkAgentTeams.test.ts` ~80L 5 fixture (env-on / settings-on / both-on / missing-both / settings-malformed); (3) `src/cli/setup.ts` patch +20L wire `checkAgentTeams()` 在 Step A 之前; missing → warn + remediation prompt + 不阻塞 (per agent-teams.md L42 "Session-scoped, /resume 丢 teammates" 容忍策略); (4) `src/cli/doctor.ts` (Phase 2.4 ship 时) 同样 wire `checkAgentTeams()` 作 6th check (sister R2.4.1 5-check baseline +1)。

---

## § 5 planning-with-files SDK API

**Confidence: HIGH** (本地 plugin marketplace cache verified + SKILL.md read + canonical plan.md cmd verified)

### 5.1 本地实测发现 (verified 2026-05-20)

- ❌ **npm registry: 404 Not Found** — `planning-with-files` 不在 npm 注册 (sister CONTEXT.md L154 推断 SDK 不准确, planning-with-files 是 **Claude Code plugin** 不是 npm package)
- ✅ **本地 plugin cache**: `~/.claude/plugins/cache/planning-with-files/planning-with-files/2.34.0/` (verified)
- ✅ **plugin marketplace**: `~/.claude/plugins/marketplaces/planning-with-files/` (verified)
- ✅ **Multi-IDE skills/SKILL.md**: `.continue/skills/planning-with-files/SKILL.md` + `.factory/` + `.gemini/` + `.codebuddy/` + `.cursor/` 等 (multi-agent 兼容, 但 Claude Code 用 root plugin.json)

### 5.2 Invocation pattern (verified plan.md cmd)

```markdown
---
description: "Start Manus-style file-based planning. Creates task_plan.md, findings.md, progress.md for complex tasks."
---

Invoke the planning-with-files:planning-with-files skill and follow it exactly as presented to you.

Create the three planning files in the current project directory if they don't exist:
- task_plan.md — for phases, progress, and decisions
- findings.md — for research and discoveries
- progress.md — for session logging

Then guide the user through the planning workflow.
```

**Invocation = slash cmd `/plan`** (Claude Code plugin model), NOT npm SDK function call. plugin 内部:
- `commands/plan.md` (English canonical), `commands/plan-zh.md`, `plan-de.md`, `plan-es.md`, `plan-ar.md`
- `scripts/init-session.sh` (macOS/Linux) + `scripts/init-session.ps1` (Win) — 创建 3 file
- `scripts/session-catchup.py` (v2.2.0+) — 跨 session recovery

### 5.3 D-15 实装路径 reframe (CRITICAL for planner Wave B)

**Issue**: CONTEXT.md D-15 + REQUIREMENTS R20.15 文案声称 "planning-with-files SDK call" 但 planning-with-files 不是 SDK 是 Claude Code plugin。**v2.0-2.4 实装应当 reframe 为**:

| 方案 | 实装 | 推荐度 |
|------|------|-------|
| (a) **plugin slash cmd invocation** (sister workflows/plan-feature/workflow.yaml L13 `invokes: gstack-office-hours` 模式) | workflow.yaml phase 05-persist `invokes: '/plan'` + workflow engine spawn 触发 plugin | ⭐⭐⭐ Recommended |
| (b) plugin script 直接 spawn | workflow engine 直跑 `bash ~/.claude/plugins/cache/planning-with-files/.../scripts/init-session.sh` | ⭐⭐ 跨平台不友好 (Windows PowerShell 路径分支) |
| (c) Node.js fs API 自己写 task_plan.md / progress.md / findings.md | 完全自实装 ~100L (无 plugin 依赖) | ⭐ 失去 plugin v2.34 features (session-catchup / multi-IDE 同步) |

**Recommended: (a) slash cmd invocation**. workflow.yaml phase 05-persist:

```yaml
- id: 05-persist
  name: persist (planning-with-files MD persistence — D-15)
  upstream: planning-with-files
  capability: '{{ capabilities.planning-with-files.cmd }}'  # /plan
  model: haiku  # 文档生成省 token (sister current implementation L36)
  invokes: '/plan'
  on:
    - if: 'phase.scope_days > 1 OR phase.is_critical_module == true'  # per CLAUDE.md "复杂任务 5+ tool call"
      action: invoke
  artifacts_expected:
    - task_plan.md  # in .planning/<phase-id>/
    - progress.md
    - findings.md
  max_iterations: 5
```

**Actionable for planner Wave B**: Phase 2.4 task "wire planning-with-files plugin slash cmd to workflows/plan-feature/workflow.yaml phase 05-persist"; **不写自实装 fs.writeFile 替代 (rejected option c)**, 不直 spawn shell script (rejected option b)。capabilities.yaml `planning-with-files` entry 加 `requires: { plugin: planning-with-files >= 2.2.0 }` 表达依赖; `harnessed doctor` (Phase 2.4 R2.4.1) 加 plugin presence check 作 7th check (sister checkAgentTeams 作 6th, R2.4.1 MIN 5 → MIN 7)。

### 5.4 D-15 acceptance 修订建议

REQUIREMENTS R20.15 acceptance L484: "(b) plan-feature phase 05-persist 真接 SDK call (NOT mock)" 改为 **"(b) plan-feature phase 05-persist 真接 Claude Code plugin slash cmd `/plan` (NOT mock; sister workflows/plan-feature/workflow.yaml L13 invokes pattern)"**。Phase 2.6 close BREAKING CHANGES note 中说明 "planning-with-files 是 plugin 不是 npm SDK, terminology adjusted in v2.0"。

---

## § 6 judgments/ multi-file schema design

**Confidence: HIGH** (sister ~/.claude/rules/*.md 多 file pattern verified + sister ~/.claude/CLAUDE.md 「澄清/审查触发判据」section verbatim quote available + TypeBox schema pattern 复用 sister src/manifest/schema/spec.ts)

### 6.1 6-file 拆分 (verbatim per CONTEXT.md L139-149 + ROADMAP v2.0 R20.4)

```
<packageRoot>/workflows/judgments/
├── strategic-gate.yaml      # gstack /office-hours + /plan-ceo-review 触发
├── phase-gate.yaml          # GSD /gsd-discuss-phase 触发
├── subtask-gate.yaml        # superpowers brainstorming 触发
├── parallelism-gate.yaml    # subagent / Agent Teams / 主 session 路由 (D-11)
├── tdd-gate.yaml            # TDD red-green-refactor 强制条件 (D-13)
└── fallback.yaml            # 3 铁律: 拿不准跳过 / 用户明示覆盖 / 链式互不前置
```

### 6.2 各 file schema (推荐 planner Wave B 直接 ship)

```yaml
# workflows/judgments/strategic-gate.yaml (NEW Phase 2.3 — 机器化 CLAUDE.md 「战略层」节 verbatim)
schema_version: harnessed.judgment.v1
triggers:
  office-hours:
    description: gstack /office-hours strategic ideation 触发
    fires_when: "phase.type in ['new_project', 'new_milestone', 'new_feature']"
    skips_when: "phase.type in ['bug_fix', 'tech_debt', 'continuing_phase'] OR phase.scope_locked_in_history == true"
    invokes: '{{ capabilities.gstack-office-hours.cmd }}'
    fallback_action: skip_with_transparency  # per fallback.yaml chain ref
  plan-ceo-review:
    description: gstack /plan-ceo-review 战略评估 触发
    fires_when: "phase.type == 'new_feature' AND phase.has_business_decisions == true"
    skips_when: "phase.scope_locked_in_history == true"
    invokes: '{{ capabilities.gstack-plan-ceo-review.cmd }}'
```

```yaml
# workflows/judgments/phase-gate.yaml (NEW Phase 2.3 — 机器化 CLAUDE.md 「Phase 层」节 verbatim)
schema_version: harnessed.judgment.v1
triggers:
  gsd-discuss-phase:
    description: GSD /gsd-discuss-phase 灰色澄清 触发
    fires_when: "phase.open_decisions >= 2 OR phase.has_cross_phase_data_flow == true OR phase.scope_days > 1"
    skips_when: "phase.single_task == true OR (phase.same_module_as_prior AND phase.same_pattern_as_prior) OR phase.scope_days < 1"
    invokes: '{{ capabilities.gsd-discuss-phase.cmd }}'
    fallback_action: skip_with_transparency
```

```yaml
# workflows/judgments/subtask-gate.yaml
schema_version: harnessed.judgment.v1
triggers:
  brainstorming:
    description: superpowers brainstorming 子任务级澄清 触发
    fires_when: "subtask.approaches >= 2 OR subtask.core_algorithm == true OR subtask.has_api_contract == true OR subtask.error_cost == 'high'"
    skips_when: "subtask.type in ['crud', 'standard_lib_call'] OR subtask.lines < 20 OR (subtask.bug_fix AND subtask.root_cause_known)"
    invokes: '{{ capabilities.superpowers-brainstorming.cmd }}'
    fallback_action: skip_with_transparency
```

```yaml
# workflows/judgments/parallelism-gate.yaml (NEW Phase 2.3 — 机器化 CLAUDE.md 「子任务并行执行机制」 + ~/.claude/rules/agent-teams.md 5 升级触发)
schema_version: harnessed.judgment.v1
triggers:
  subagent-default:
    description: 默认 subagent fan-out (Task/Agent 工具)
    fires_when: "subtask.parallel_count <= 3 AND subtask.communication_needed == false"
    invokes: 'spawn-via-task-tool'
  main-session-fallback:
    description: 主 session 直跑 (降级)
    fires_when: "subtask.lines < 20 OR subtask.type == 'single_command_query'"
    invokes: 'inline'
  agent-teams-upgrade:
    description: Agent Teams 升级 (5 触发条件, 任一命中即升级 per ~/.claude/rules/agent-teams.md L7-12)
    fires_when: "teammate_send_message_needed == true OR subagent_context_overflow == true OR shared_task_list == true OR opposing_hypothesis_debate == true OR fullstack_three_way == true"
    requires:
      - capabilities.agent-teams-create  # check via checkAgentTeams() (§ 4 above)
    invokes: '{{ capabilities.agent-teams-create.cmd }}'
    fallback_action: skip_with_transparency
    fallback_reason: 'Agent Teams 不可用 (settings.json 缺 CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)。降级 subagent fan-out。'
  ralph-loop-wrapper:
    description: ralph-loop 正交 wrapper (NOT 路径选择, 套在任意 invoke 外层)
    fires_when: "subtask.completion_required == true"  # 总是 true 当 phase 出现 ship 节点
    wraps: ['subagent-default', 'main-session-fallback', 'agent-teams-upgrade']
    invokes: '{{ capabilities.ralph-loop.cmd }}'
```

```yaml
# workflows/judgments/tdd-gate.yaml (NEW Phase 2.3 — 机器化 CLAUDE.md Stage ③ TDD section + D-13)
schema_version: harnessed.judgment.v1
triggers:
  tdd-strongly-suggested:
    description: TDD red-green-refactor 强制条件 (sister CLAUDE.md "强烈建议开启")
    fires_when: "subtask.is_core_business_logic == true OR subtask.is_algorithm == true OR subtask.is_data_processing == true OR subtask.regression_risk == 'high' OR subtask.reliability_required == true"
    skips_when: "subtask.type in ['crud', 'ui_polish', 'docs_only']"
    invokes: '{{ capabilities.tdd.cmd }}'  # superpowers:test-driven-development 或 alias /tdd
    fallback_action: warn_and_continue   # NOT skip — TDD 强烈建议; user explicit override 才 skip
```

```yaml
# workflows/judgments/fallback.yaml (NEW Phase 2.3 — 机器化 CLAUDE.md 「Fallback 三条铁律」 verbatim per D-16)
schema_version: harnessed.judgment.v1
rules:
  uncertain-skip-transparently:
    description: 铁律 1 — 拿不准 → 倾向跳过, 透明声明 (sister CLAUDE.md)
    trigger: gate_eval_uncertain  # workflow runtime 触发当 gate eval throw GateEvalError
    action: skip_with_transparency
    output_template: '⚠️ 跳过 {{ gate_name }}, 因为 {{ reason }}。如果你认为需要请明说。'
  user-explicit-override:
    description: 铁律 2 — 用户明示 → 覆盖判据 (词法匹配 user 输入)
    trigger: user_input_signal_detected
    override_signals:
      - "先 brainstorm"
      - "跑 office-hours"
      - "讨论一下"
      - "office-hours"
      - "brainstorm"
      - "深度调研"
    action: invoke_forced  # 即使 fires_when==false 也强制 invoke
  chain-isolation:
    description: 铁律 3 — 链式互不前置 (跳过战略层 ≠ 必须跳过 phase 层)
    trigger: parent_gate_skipped
    action: continue_independent_eval  # 每层独立 eval, 防"上层没跑下层不敢跑"死板
```

### 6.3 workflow.yaml gate reference path 实测可行性 (D-16)

CONTEXT.md L150: "workflow.yaml gate field reference path: `gate: judgments.strategic-gate.fires` (NOT `judgments.fires`)"。expr-eval Parser 视 `judgments.strategic-gate.fires` 为 dot-access identifier chain — **expr-eval 不直接支持 file boundary semantics**, 需要 workflow engine 在 evalGate() 前 **预 resolve judgments.<file>.<trigger>.fires_when**:

```typescript
// src/workflow/judgmentResolver.ts (NEW Phase 2.3 ~60L)
import { load as parseYaml } from 'js-yaml'  // sister Phase 2.1 reusable
import { evalGate } from './exprBuilder.js'
import type { PhaseFactContext } from './phaseFactContext.js'

export async function resolveJudgmentGate(
  gateRef: string,  // e.g., "judgments.parallelism-gate.agent-teams-upgrade.fires"
  ctx: PhaseFactContext,
  packageRoot: string
): Promise<boolean> {
  // Parse 4-segment ref
  const [root, fileName, triggerName, fieldName] = gateRef.split('.')
  if (root !== 'judgments') throw new Error(`Invalid gate ref: ${gateRef}`)

  // Load yaml from packageRoot/workflows/judgments/<fileName>.yaml
  const yamlPath = resolve(packageRoot, 'workflows', 'judgments', `${fileName}.yaml`)
  const yamlSrc = await readFile(yamlPath, 'utf8')
  const judgment = parseYaml(yamlSrc) as JudgmentFile  // TypeBox validate per § 6.4

  // Extract expression
  const trigger = judgment.triggers[triggerName]
  if (!trigger) throw new Error(`Trigger ${triggerName} not found in ${fileName}`)

  const expr = fieldName === 'fires' ? trigger.fires_when : trigger.skips_when
  return evalGate(expr, ctx)  // §1.3 above
}
```

### 6.4 TypeBox schema validate strategy

```typescript
// src/workflow/schema/judgment.ts (NEW Phase 2.3 ~50L)
import { Type, type Static } from '@sinclair/typebox'  // sister src/manifest/schema/spec.ts pattern

export const JudgmentTrigger = Type.Object({
  description: Type.String(),
  fires_when: Type.String(),  // expr-eval expression
  skips_when: Type.Optional(Type.String()),
  invokes: Type.Optional(Type.String()),
  requires: Type.Optional(Type.Array(Type.String())),
  fallback_action: Type.Optional(Type.Union([
    Type.Literal('skip_with_transparency'),
    Type.Literal('warn_and_continue'),
    Type.Literal('invoke_forced'),
    Type.Literal('continue_independent_eval'),
  ])),
}, { additionalProperties: false })  // sister T-2.2-02 mitigation

export const JudgmentFile = Type.Object({
  schema_version: Type.Literal('harnessed.judgment.v1'),  // sister Phase 2.2 schemaVersion 7 surface
  triggers: Type.Record(Type.String(), JudgmentTrigger),
}, { additionalProperties: false })

export type JudgmentFileT = Static<typeof JudgmentFile>
```

**Actionable for planner Wave B**: Phase 2.3 wave 拓扑:
- Wave 1: `src/workflow/exprBuilder.ts` + `tests/workflow/exprBuilder.test.ts` (~10 fixture)
- Wave 2: `src/workflow/schema/judgment.ts` + `src/workflow/judgmentResolver.ts` + tests (~12 fixture)
- Wave 3: `workflows/judgments/{strategic,phase,subtask,parallelism,tdd,fallback}-gate.yaml` 6 file (~50-80L each)
- Wave 4: TypeBox schema validate CI step 守恒 yaml schema invariant (sister ci.yml A7 step pattern)

---

## § 7 ralph-loop max-iterations 默认值 + fallback abort path UX

**Confidence: MEDIUM-HIGH** (sister R6.4 "强制 max-iterations" verified + sister Phase 2.2 ralphLoop.ts L22-34 explicit error class verified + sister current workflows/execute-task/phases.yaml max_iterations=20 verified)

### 7.1 默认值推荐

| Workflow | Phase | max_iterations | Rationale |
|----------|-------|----------------|-----------|
| execute-task | 01-clarify | **5** | brainstorming 通常 ≤5 round 收敛 (sister current workflows/execute-task/phases.yaml L11) |
| execute-task | 02-code | **20** | code 实装 iterative refine 上限 (sister current L17) |
| execute-task | 03-test | **15** | TDD red-green-refactor 多 cycle (sister current L22) |
| execute-task | 04-deliver | **20** | ralph-loop COMPLETE gate 主迭代 (sister current L27, ADR 0011 D-04) |
| plan-feature | 01-gstack-decision | **1** | governance gate, 1 round 决策即结 (sister current workflows/plan-feature/workflow.yaml L16) |
| plan-feature | 02-brainstorm | **5** | sister current L20 |
| plan-feature | 03-gsd-discuss | **3** | sister current L26 |
| plan-feature | 04-gsd-plan | **3** | sister current L33 |
| plan-feature | 05-persist | **5** | sister current L40 |
| research (NEW v2.0) | 01-fan-out | **3** | multi-source fan-out + dedup, 3 round 足 |
| research (NEW v2.0) | 02-synth | **3** | discuss synth 收敛 |
| verify-work (NEW v2.0) | 01-gsd-verify-work | **3** | serial 收敛 |
| verify-work (NEW v2.0) | 02-code-review (parallel) | **5** | 多 agent fan-out 收敛 |
| verify-work (NEW v2.0) | 03-gstack-review (conditional) | **3** | Paranoid Staff Eng 收敛 |
| verify-work (NEW v2.0) | 04-code-simplifier | **5** | refine 收敛 |

**Schema 推荐**: 在 `<packageRoot>/workflows/defaults.yaml` (NEW Phase 2.3) 集中 default 表, workflow.yaml `{{ defaults.ralph_max_iterations.execute-task.04-deliver }}` interpolation:

```yaml
# <packageRoot>/workflows/defaults.yaml (NEW Phase 2.3 — single source of default)
schema_version: harnessed.defaults.v1
ralph_max_iterations:
  execute-task:
    01-clarify: 5
    02-code: 20
    03-test: 15
    04-deliver: 20
  plan-feature:
    01-gstack-decision: 1
    02-brainstorm: 5
    03-gsd-discuss: 3
    04-gsd-plan: 3
    05-persist: 5
  research:
    01-fan-out: 3
    02-synth: 3
  verify-work:
    01-gsd-verify-work: 3
    02-code-review: 5
    03-gstack-review: 3
    04-code-simplifier: 5
hard_upper_limit: 100  # sister Phase 2.2 STRIDE T-2.2-05 DoS mitigation
```

### 7.2 Fallback abort path UX (per D-10 acceptance "explicit NOT silent")

sister ralphLoop.ts L22-34 已 ship 2 explicit error class:

```typescript
export class MaxIterationsExceededError extends Error {
  constructor(public iterations: number) {
    super(`ralph-loop max-iterations exceeded after ${iterations} attempts`)
    this.name = 'MaxIterationsExceededError'
  }
}

export class VerbatimCompleteFailError extends Error {
  constructor(public lastMessage: string) {
    super('subagent final message lacked verbatim <promise>COMPLETE</promise> (F33 P1 mitigation)')
    this.name = 'VerbatimCompleteFailError'
  }
}
```

**UX text suggestion** (workflow engine catch error 后输出 to stderr + exit code):

```
❌ ralph-loop max-iterations exceeded (20/20).

Sub-task: {{ subtask.summary }}
Workflow: {{ workflow.name }} / phase {{ phase.id }}
Last subagent output (truncated): {{ last_message_first_500_chars }}

The subagent attempted 20 iterations without emitting verbatim "<promise>COMPLETE</promise>".
This indicates one of:
  1. Sub-task is genuinely incomplete (escalate to user / re-scope)
  2. Subagent is stuck in a loop (review prompt / system instructions)
  3. max-iterations too low (override via --max-iterations <N>, hard upper limit 100)

Manual options:
  A) Continue with current state: `harnessed workflow resume --skip-completion-gate`
  B) Re-run from last checkpoint: `harnessed workflow resume --from-checkpoint`
  C) Abort cleanly: exit 1 (no further action; .planning/<phase-id>/progress.md retains state)

Exit code: 1
```

**Actionable for planner Wave B**: Phase 2.4 task "wire ralph-loop fallback UX 到 workflow engine catch handler" — `src/workflow/engineHook.ts` (NEW or extend existing engine.ts) 加 try-catch `MaxIterationsExceededError` 输出上面 UX text + exit 1; `tests/workflow/ralph-fallback.test.ts` 5 fixture verify text 格式 + exit code。

---

## § 8 Dogfood end-to-end test design (Phase 2.5)

**Confidence: MEDIUM** (sister Phase 4.3 DOGFOOD-T2.X.md 60L 3-axis pattern verified + planner Wave B 自由调整设计)

### 8.1 Sister Phase 4.3 dogfood pattern (verified 2026-05-19)

Phase 4.3 DOGFOOD-T2.X.md 60L pattern (commit 772c647) 结构:

```markdown
# Phase X.Y T2.N — Dogfood Report (3-axis empirical evidence)
**Date**: YYYY-MM-DD
**Phase**: X.Y — milestone label
**Anchors**: R{N} + R{M} + milestone marker
**Verdict:** PASS/FAIL (N/N axes verified, miss: ...)

## Axis A — R{N} ... (NEW infra)
**Setup**: ...
**Action**: shell commands verifying setup
**Acceptance**: bar reached
**Status**: ✅ PASS / ❌ FAIL

## Axis B — R{N} ... (cluster)
...

## Axis C — milestone close cluster (CHANGELOG + archive + tag)
...

## Aggregate verification
- R{N} acceptance "...": ✅
- Full test suite gate: ✅ N+ passed
- CI gates: ✅ ...

## Disposition
- ✅ T2.N dogfood PASS N/N axes verified miss: none
...
```

### 8.2 Phase 2.5 dogfood E2E test scenario design

**Goal**: 1 个 real harnessed phase 端到端 trigger 全 16 R20.x within harnessed itself (self-hosting verification, sister CLAUDE.md "dogfooding 内在动力" R8.1)

**Recommended scenario**: Phase 2.5 dogfood 自身。即 **Phase v2.0-2.5 实装时, 在 5 day-end 中, 选 4 day 各跑一个完整 4-stage Discuss → Plan → Execute → Verify cycle, 第 5 day 整合产出 DOGFOOD-T5.X.md**。每个 cycle 触发不同 R20.x 子集:

| Cycle | Real Phase | R20.x triggered | 4-stage 覆盖 | 关键 dogfood signal |
|-------|-----------|----------------|--------------|---------------------|
| **Cycle 1** | 自身 Phase 2.5 W1 "parallelism-gate dogfood task" | R20.11 parallelism-gate + R20.16 fallback (Agent Teams settings 缺时 skip_with_transparency) | Stage ③ Execute | Agent Teams 升级实际 round-trip;若 missing 走 fallback subagent fan-out |
| **Cycle 2** | 自身 Phase 2.5 W2 "verify-work 4-specialist Agent Team dogfood task" | R20.12 verify-work full scope + R20.11 升级 + R20.14 special-purpose tools (/qa /cso /design-review conditional) | Stage ④ Verify | 4-specialist Agent Team (code-review + gstack/review + /cso + /qa) 实际 round-trip Pattern C 多维度审查 (sister agent-teams.md L61) |
| **Cycle 3** | 自身 Phase 2.5 W3 "tdd-gate + planning-with-files dogfood task" | R20.13 tdd-gate + R20.15 planning-with-files + R20.10 ralph-loop COMPLETE | Stage ② Plan + Stage ③ Execute | TDD 自动 invoke;/plan slash cmd 生成 task_plan.md + progress.md + findings.md 3 file;ralph-loop verbatim COMPLETE gate 真转一圈 |
| **Cycle 4** | 自身 Phase 2.5 W4 "special-purpose tools + mattpocock + fallback 3 铁律 dogfood task" | R20.8 + R20.9 + R20.14 + R20.16 + judgments/fallback.yaml 3 铁律全 (user explicit signal + chain isolation + uncertain-skip) | Stage ① Discuss + Stage ③ Execute | mattpocock /grill-with-docs 自动 invoke when phase.spec_ambiguous;user "先 brainstorm" 词法 override force invoke;skip strategic-gate ≠ skip phase-gate (chain_isolation 验证) |
| **Cycle 5 (integration)** | 整合 4 cycle 产出 DOGFOOD-T5.X.md 报告 | aggregate 全 16 R20.x verified | 全 4-stage | 1 报告 5-axis verdict PASS, 全 R20.1-R20.16 至少一次 触发 trace |

### 8.3 推荐 DOGFOOD-T5.X.md 报告结构 (planner Wave B Phase 2.5 task)

```markdown
# Phase v2.0-2.5 T5.X — Dogfood Report (5-axis empirical evidence: 4 cycle + 1 aggregate)
**Date**: 2026-06-04 (estimated, target window 2026-05-22 ~ 2026-06-05)
**Phase**: v2.0-2.5 — v2.0 4-stage 机器化 deepening
**Anchors**: R20.1-R20.16 (16/16 all triggered) + 🎯 v2.0.0-rc tag target
**Verdict:** PASS (5/5 axes verified, miss: none) | FAIL (...) — depends on actual outcome

## Axis A — Cycle 1 parallelism-gate + fallback dogfood
**Setup**: ...
**Action**: ...
**R20.11 / R20.16 acceptance trace**: ...
**Status**: ✅ PASS / ❌ FAIL

## Axis B — Cycle 2 verify-work 4-specialist Agent Team dogfood
...

## Axis C — Cycle 3 tdd-gate + planning-with-files dogfood
...

## Axis D — Cycle 4 special-purpose tools + mattpocock + fallback 3 铁律 dogfood
...

## Axis E — Aggregate cross-cycle integration verification
- R20.1-R20.9 (initial 9): ✅ all triggered in cycle 1-4
- R20.10-R20.16 (Q-AUDIT 7): ✅ all triggered in cycle 1-4
- Full test suite gate: ✅ N+ passed
- CI gates: ✅ A7 守恒 + transparency + (NEW Phase 2.4) schema validate
- 🎯 v2.0.0-rc tag prep: ✅ ready for Phase 2.6 close

## Disposition
- ✅ T5.X dogfood PASS 5/5 axes verified miss: none
- ✅ R20.1-R20.16 all triggered at least once in 4-stage cycle
- ✅ Ready for Phase v2.0-2.6 close (BREAKING + ADR 0024-0029+ + CHANGELOG + 🎯 v2.0.0 GA tag)
```

**Actionable for planner Wave B**: Phase 2.5 task split (推荐 5 wave 1-day each):
- Wave 1 (~1 day): parallelism-gate dogfood cycle 1 + DOGFOOD-T5.1.md
- Wave 2 (~1 day): verify-work dogfood cycle 2 + DOGFOOD-T5.2.md
- Wave 3 (~1 day): tdd-gate + planning-with-files dogfood cycle 3 + DOGFOOD-T5.3.md
- Wave 4 (~1 day): special-purpose tools + fallback 3 铁律 dogfood cycle 4 + DOGFOOD-T5.4.md
- Wave 5 (~1 day): aggregate integration + DOGFOOD-T5.X.md 5-axis report

---

## § 9 Architectural risks NOT covered in Phase v2.0-2.1 D-decision

Phase v2.0-2.1 16 D-decision LOCKED 后, 本 Wave A 研究中 surface 出来的 **1 个 HIGH-priority architectural risk** + 4 个 MEDIUM-priority refinement, planner Wave B 应评估是否触发 gstack `/plan-eng-review` (per CONTEXT.md L93 "Phase v2.0-2.2 plan-phase 启动前如复杂架构判据触发 → 必须跑 gstack /plan-eng-review")。

### 9.1 HIGH — planning-with-files 是 plugin NOT npm SDK (terminology drift)

**Risk**: REQUIREMENTS R20.15 acceptance + CONTEXT.md L153-154 + Phase 2.1 user annotation 都 称为 "planning-with-files SDK" / "真接 SDK call"。本 RESEARCH § 5 实测 **planning-with-files 不是 npm package (404)**, 是 Claude Code plugin (slash cmd `/plan`)。Acceptance bar 用词 "SDK call" 在实装时 **不可能满足** (无 SDK 可 call)。

**Impact**: Phase 2.4 实装时若 maintainer 按字面 "SDK call" 推进, 会浪费 ~1 day 寻找不存在的 npm package, 或写 wrap fs.writeFile 自实装 (rejected option c, 失去 plugin v2.34 features)。

**Mitigation** (planner Wave B 行动):
- 在 PLAN.md `## Open Questions` 节列入: "planning-with-files 是 plugin NOT SDK, R20.15 / D-15 acceptance 应改 'plugin slash cmd invocation'"
- 在 Phase 2.6 close ADR 0027+ 写 errata 节 (sister ADR 0011 errata 9 章节 pattern)
- 推荐 触发 gstack `/plan-eng-review` 1 round 仲裁是否升级到 user Q-AUDIT-5 重新 LOCK acceptance text。

### 9.2 MEDIUM — expr-eval unpackedSize 145.6 KB vs CONTEXT.md "~5KB" 数据差 29×

**Risk**: CONTEXT.md L34 + D-03 称 "~5KB MIT 4M weekly"。实测 unpackedSize 145.6 KB。bundle size 影响虽 < 1ms node CLI 启动, 但 **D-03 决策依据被部分削弱** (原推 expr-eval 理由含 "5KB minimal")。

**Impact**: 不阻塞 Phase 2.3 实装。但 Phase 2.6 close ADR 0025+ "expr-eval npm dep 引入" 节文案应校正数据。

**Mitigation**: 在 RESEARCH.md § 1.1 已校正; planner Wave B 在 PLAN.md `## Known Discrepancies` 节列入。

### 9.3 MEDIUM — judgments/ multi-file expr-eval reference path 4 层深 (per CONTEXT.md L150 + ROADMAP risk L381)

**Risk**: `gate: judgments.parallelism-gate.agent-teams-upgrade.fires` 4 层深 ref。expr-eval native 不理解 file boundary; 需 workflow engine 预 resolve (per § 6.3 judgmentResolver.ts ~60L)。

**Impact**: Phase 2.3 schema design 阶段 +60L implementation cost (已估 in § 6 wave 拓扑)。如未在 Phase 2.3 ship, Phase 2.4 workflow.yaml gate 字段实际无法 eval (silent NOOP)。

**Mitigation**: 已 surface in § 6.3 推荐 `src/workflow/judgmentResolver.ts` ~60L; planner Wave B Phase 2.3 wave 2 任务必含 judgmentResolver + tests。Sister ROADMAP v2.0 关键风险 L381 已标 "Phase 2.3 schema design 阶段 TypeBox + Phase 2.5 dogfood expr-eval AST builder 验证"。

### 9.4 MEDIUM — Agent Teams settings.json schema location (per Phase 2.1 CONTEXT.md L101 错误描述)

**Risk**: CONTEXT.md L101 + D-11 文案 说 settings.json `experimental` 嵌套字段。实测是 `env` (root-level) 字段。doctor / setup check 代码若按字面 D-11 实装会 false-negative (settings 实际有 flag 但读不到)。

**Impact**: Phase 2.3 task `checkAgentTeams()` 实装 (§ 4 上 ~30L) 若 maintainer 按字面 CONTEXT.md L101 写 `data.experimental?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, 实际 100% 用户 false-negative。

**Mitigation**: § 4.3 推荐实装已 用 `data.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`。planner Wave B 在 Phase 2.3 task 任务描述中显式标注 "schema is `env` (root-level) NOT `experimental` (nested)"。

### 9.5 LOW — mattpocock 本地实测 6 招式 vs D-09 "12+ 高频子集" 数量缺口

**Risk**: 本地 mattpocock 安装只 6 招式 (caveman / diagnose / grill-me / grill-with-docs / tdd / zoom-out)。D-09 要求 12+ entry。

**Impact**: Phase 2.3 capabilities.yaml 12 mattpocock entry **不依赖 local install 数量**, 是 maintainer 在 manifest 中 alias 高频子集; **不是 blocker**。但 Phase 2.5 dogfood test 若 trigger to-prd / to-issues / improve-codebase-architecture 等 6 个未本地安装的招式, 会 fail (slash cmd 不存在)。

**Mitigation**: § 2.1 推荐 12 招式 list 标注 dogfood test 限定 本地已安装 6 招式; 剩 6 招式 (to-prd / to-issues / improve-codebase-architecture / code-review / code-simplifier / investigate) 在 capabilities.yaml `since: v2.x` 字段标 "manifest entry only, dogfood deferred when locally available"。

---

## § 10 Confidence breakdown + sources + open questions

### 10.1 Confidence per area

| Focus area | Confidence | Reason |
|-----------|-----------|--------|
| § 1 expr-eval | HIGH | npm verified + GitHub README verified + ctx7 indexed 76.8 score |
| § 2 capabilities.yaml 25+ baseline | MEDIUM-HIGH | 本地 mattpocock subset verified, 13+ special-purpose cross-ref ~/.claude/rules/web-*.md verified, 但 12-招式 high-frequency selection 是 maintainer 主观判断 (planner Wave B 自由调整) |
| § 3 ralph-loop SDK | HIGH | sister Phase 2.2 v0.2.0 PLAN.md + ralphLoop.ts 实装 + ADR 0011 9 章节 verified |
| § 4 Agent Teams check | HIGH | 本地 settings.json schema verified + sister src/cli/setup.ts pattern read |
| § 5 planning-with-files | HIGH | 本地 plugin cache verified + canonical plan.md cmd verified + SKILL.md verified |
| § 6 judgments/ schema | HIGH | sister ~/.claude/rules/*.md pattern verified + CLAUDE.md verbatim section quote + TypeBox sister Phase 2.1 spec.ts pattern verified |
| § 7 max-iterations 默认值 | MEDIUM-HIGH | sister current phases.yaml max_iterations 值 verified + sister R6.4 强制 verified; **但 research / verify-work NEW workflows max_iterations 是 maintainer 主观推荐, planner Wave B 自由调整** |
| § 8 dogfood E2E | MEDIUM | sister Phase 4.3 60L pattern verified, 但 5-cycle vs 4-cycle vs 1-cycle integration 设计是 planner Wave B 决策 |

### 10.2 Sources

**HIGH 优先级 (primary)**:

- npm registry `npm view expr-eval` 实测 2026-05-20 (version 2.0.2 / unpackedSize 145.6 KB / MIT / zero deps)
- GitHub https://github.com/silentmatt/expr-eval README (grammar verified: in / and / or / == / != / >= / <= / > / <)
- ctx7 `/silentmatt/expr-eval` (High Reputation / Benchmark 76.8 / 41 snippets)
- 本地 `~/.claude/settings.json` (Agent Teams env schema verified)
- 本地 `~/.claude/skills/` directory listing (mattpocock 6 招式 + planning-with-files + ...)
- 本地 `~/.claude/plugins/cache/planning-with-files/planning-with-files/2.34.0/` (plugin v2.34 multi-IDE structure)
- 本地 `~/.claude/plugins/cache/planning-with-files/.../commands/plan.md` (canonical English plan cmd)
- 本地 `~/.claude/plugins/cache/.../.continue/skills/planning-with-files/SKILL.md` (Manus-style pattern verified)
- D:/GitCode/harnessed/.planning/phase-v2.0-2.1/2.1-CONTEXT.md (16 D-decision LOCKED)
- D:/GitCode/harnessed/.planning/phase-v2.0-2.1/2.1-DISCUSSION-LOG.md (Q1-Q-AUDIT outcome)
- D:/GitCode/harnessed/.planning/REQUIREMENTS.md § R20 (16 R20.x acceptance)
- D:/GitCode/harnessed/.planning/ROADMAP.md § v2.0 (6 phase scope + 4 关键风险)
- D:/GitCode/harnessed/.planning/phase-2.2/PLAN.md (sister v0.2.0 ralph-loop SDK integration 9-章节 ADR 0011 pattern)
- D:/GitCode/harnessed/src/routing/lib/ralphLoop.ts (54L 实装 + 2 error class)
- D:/GitCode/harnessed/workflows/execute-task/phases.yaml + workflows/plan-feature/workflow.yaml (sister current 4-phase + 5-phase model: + jinja interpolation pattern)
- D:/GitCode/harnessed/src/cli/setup.ts (sister 250L Step A+B parallel pattern, v1.0.3 ship)
- D:/GitCode/harnessed/.planning/phase-4.3/DOGFOOD-T2.X.md (sister 60L 3-axis pattern)
- ~/.claude/CLAUDE.md (维护 三层栈方法论原型, 191L verbatim source for judgments/)
- ~/.claude/rules/agent-teams.md (5 升级触发 + 防呆清单 verbatim)
- ~/.claude/rules/web-design.md / web-testing.md / web-search.md (special-purpose tools 13+ entry source)

**MEDIUM 优先级 (secondary)**:
- WebSearch (planning-with-files / OthmanAdi / v2.34 multi-IDE expansion 2026 updates)
- WebFetch https://github.com/silentmatt/expr-eval (bundle size + API verification)

### 10.3 Open questions (planner Wave B 决策)

1. **Q-OPEN-1**: planning-with-files 实装 path (a) plugin slash cmd `/plan` invocation vs (b) script direct spawn vs (c) fs.writeFile 自实装。本 RESEARCH § 5.3 推荐 (a)。**是否触发 gstack `/plan-eng-review` 仲裁?** (per 9.1 HIGH risk)
2. **Q-OPEN-2**: capabilities.yaml v2.0 baseline 实际 entry count (25 / 35 / 全 23 mattpocock + ...)。本 RESEARCH § 2.4 推荐 35 baseline (mattpocock 12 高频 + special-purpose 13 + Agent Teams 5 + bundled 5)。planner Wave B 自由调整 mattpocock subset selection。
3. **Q-OPEN-3**: research workflow + verify-work workflow max_iterations 默认值。本 RESEARCH § 7.1 推荐 3-5 各 phase。planner Wave B Phase 2.4 实装时 dogfood test 验证收敛性。
4. **Q-OPEN-4**: Phase 2.5 dogfood test 拆 5 cycle vs 4 cycle vs 1 integration cycle。本 RESEARCH § 8.2 推荐 4 cycle + 1 aggregate report。planner Wave B Phase 2.5 wave 拓扑 决定。
5. **Q-OPEN-5**: judgments/ 6 file 是否需要再拆? sister ~/.claude/rules/*.md 有 7 file (agent-teams / cc-handoff / context7 / google-workspace / web-design / web-search / web-testing)。本 RESEARCH § 6.1 推荐 6 file (与 D-16 文案一致); planner Wave B 评估是否加 7th file (cc-handoff-gate.yaml) 覆盖跨 CC 实例 hand-off 场景 (per ~/.claude/rules/cc-handoff.md)。

---

## § 11 Metadata

**Research date**: 2026-05-20
**Valid until**: 2026-06-05 (v2.0 milestone target window end)
**Confidence breakdown**:
- expr-eval: HIGH (npm + GitHub + ctx7 cross-verified)
- capabilities baseline: MEDIUM-HIGH (12 mattpocock high-frequency = maintainer 主观, 13+ special-purpose 全 verified)
- ralph-loop pattern: HIGH (sister v0.2.0 ship verified)
- Agent Teams: HIGH (本地 settings.json schema verified)
- planning-with-files: HIGH (plugin verified, ⚠️ acceptance text reframe needed per 9.1 risk)
- judgments multi-file: HIGH (CLAUDE.md verbatim + TypeBox sister verified)
- max-iterations: MEDIUM-HIGH (current values verified, research/verify-work NEW workflows 主观推荐)
- dogfood E2E: MEDIUM (planner Wave B 决策)

**1 HIGH-priority architectural risk surfaced** (9.1 planning-with-files plugin NOT npm SDK terminology drift) — planner Wave B 强烈建议在 PLAN.md Open Questions 节列入 + 评估 gstack `/plan-eng-review` 仲裁。

**4 MEDIUM-priority refinements** (9.2 expr-eval size data / 9.3 judgments 4-deep ref path / 9.4 settings.json env vs experimental / 9.5 mattpocock local 6 vs manifest 12+) — 全部已在对应 § 给 mitigation, planner Wave B 直接消费 RESEARCH 推荐避免实装时踩坑。

---

*Phase v2.0-2.2 Wave A — RESEARCH 完成 2026-05-20*
*Next: Wave B planner consumption → produce PLAN.md (target ~2500L 25-35 atomic tasks 覆盖 6 phase v2.0-2.2~2.6 scope)*
*复杂架构判据 16 R20.x → 推荐 gstack `/plan-eng-review` 1 round 强烈建议 (per CONTEXT.md L93 transparency 段)*
