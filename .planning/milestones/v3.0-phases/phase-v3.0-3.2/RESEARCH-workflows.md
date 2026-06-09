# Phase v3.0-3.2 Wave A — workflows v3 schema + 20 workflow yaml + master orchestrator Research

**Researcher:** `workflows-researcher` (team `phase32-research-team`)
**Sister teammates:** `capabilities-researcher` + `disciplines-researcher`
**Date:** 2026-05-20
**Status:** Wave A research ship — feeds Wave B planner task_plan.md
**Confidence:** HIGH overall (schema + nested scan + yaml content); MEDIUM (master orchestrator delegation path A vs B trade-off — recommendation 给出, planner Wave B 二次决策)

---

## Summary

Phase v3.0-3.2 Wave A 锁定 v3.0 workflows 子领域 5 areas:
1. **workflow.yaml v3 TypeBox schema** — sister v2 86L 增量 ~40-50L (新 4 字段 `behavioral_layer` + `tools_available` + `disciplines_applied` + `invokes_tools`; phase-level `parallelism` 沿用 v2)
2. **20 workflow yaml content design** — 4 master orchestrator + 14 sub-stage + 2 standalone, 每个 ~30-80L 紧凑 sister v2 pattern verbatim
3. **Master orchestrator delegation pattern** — 推荐 Hybrid Option A+B (declarative `delegates_to` schema + engine-level conditional spawn via judgmentResolver)
4. **Nested workflows/<stage>/<sub>/ dir scan logic** — setup.ts `scanWorkflowsWithSkill` 2-level recursive + slash-cmd name flatten (`/discuss-strategic` not `/discuss/strategic`)
5. **SendMessage cross-team coordination** — 已发 capabilities-researcher (tools_available cross-deps) + disciplines-researcher (disciplines_applied cross-deps)

**Primary recommendation:** v3 schema extend WorkflowSchemaV2 add 4 字段 (workflow-level `behavioral_layer` + `tools_available` + `disciplines_applied` + Master-only `delegates_to`); 14 sub-stage + 2 standalone 沿用 v2 phases[] 结构 + invokes_tools 新增条件 fire; 4 master 用 NEW `delegates_to: [{sub, gate?, mode: parallel|serial}]` 单独 schema (Option A declarative 主体 + B 引擎 spawn 内核)。

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
1. **M-01** ARCHITECTURAL MAJOR REFACTOR v2 (BREAKING + 3 NEW ADR 0030/0031/0032 + 4 LOCAL tag + 2026-05-20~23 window)
2. **D-01** Master orchestrator = **Auto gate-route** (并行 gate-eval per sub-stage via `judgments.<sub>.fires`, sister CLAUDE.md chain-isolation 铁律机器化)
3. **D-02** Namespace = **Bare slash cmd** (`/discuss-strategic` not `/harnessed:discuss-strategic` not `/harnessed:discuss:strategic`); ADR 0030 codify
4. **D-03** `workflows/<stage>/<sub>/workflow.yaml + SKILL.md` **nested 2-level** dir
5. **D-04** **Pure ship v3 deprecate v2** — DROP /plan-feature + /execute-task + /verify-work; KEEP /research; NEW /retro; CHANGELOG alias map
6. **D-05** 心法 (karpathy) + 招式 (mattpocock) = **all-stage cross-cutting**, workflow.yaml v3 新 `behavioral_layer` + `tools_available` 字段
7. **D-06** planning-with-files = **cross-cutting TOOL** (NOT phase); /plan 跨 discuss-phase / plan-phase / task-code / task-deliver / verify-progress 多 phase invoke
8. **D-07** **20 workflow ship** (4 master + 14 sub + 2 standalone) per Phase 3.1 verbatim tree
9. **D-08** capabilities.yaml v3 NEW `category` enum 字段 (7 value: discipline / tool-slash-cmd / tool-mcp / tool-cli / tool-plugin / tool-bundled-skill / agent-platform)
10. **D-09** NEW **L0 Discipline Substrate** — 6 yaml `workflows/disciplines/*.yaml`; workflow.yaml v3 新 `disciplines_applied` 字段 (default = all 6)
11. **D-10** NEW **L5b Execution Mechanism** — parallelism-gate.yaml extend; Pattern A/B/C codify; workflow.yaml v3 phase-level `parallelism` 沿用 v2
12. **D-11** 3 NEW judgments yaml (web-design-routing + web-testing-routing + web-search-routing + lib-docs + google-workspace)
13. **D-12** gstack 30+ optional = capabilities registry only (NOT wrap workflow); 核心 6 已 wrapped in workflows
14. **D-13** harnessed v3.0 = **superset** of CLAUDE.md + Obsidian doc + rules/ — 全 codify

### Claude's Discretion (research deferred decisions)
- workflow.yaml v3 TypeBox 4 新字段 string[] vs object[] (this RESEARCH 锁定)
- Master orchestrator delegation schema (this RESEARCH Option A/B/Hybrid 给出)
- v2.0.1 → v3.0 alias mechanism CHANGELOG vs deprecation warn UX (planner Wave B 决策)
- 20 workflow.yaml + 20 SKILL.md 实装 task 分批 (planner Wave B 决策, Phase 3.4-3.5)
- ADR 0030/0031/0032 detail content (Phase 3.6 close 决策)

### Deferred Ideas (OUT OF SCOPE Wave A)
- Plugin version-check + update semantic — v3.1
- Plugin namespaced slash cmd (`/harnessed:discuss-strategic`) — defer v3.x patch
- Hierarchical 3-level slash cmd (`/harnessed:discuss:strategic`) — Claude Code 平台 native 后再 evaluate
- mattpocock 23 招式 全集 wire — v3.0 ship 12, 剩 11 → v3.x patch
- `/retro` 复杂 cross-milestone trend analysis — v3.x
- Master orchestrator `auto` vs explicit selection toggle — v3.x config flag

---

## Phase Requirements

| ID (proposed) | Description | Research Support |
|----|-------------|------------------|
| R30.1 | workflow.yaml v3 schema TypeBox extend (4 NEW field) | Area 1 (this section) |
| R30.2 | 4 master orchestrator yaml + delegation engine logic | Area 2 + Area 3 |
| R30.3 | 14 sub-stage yaml + SKILL.md ship | Area 2 |
| R30.4 | 2 standalone (research + retro) ship | Area 2 |
| R30.5 | setup.ts nested 2-level scan + v2 → v3 alias map | Area 4 |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| workflow.yaml v3 schema | Runtime (TypeBox validate) | CLI (`check-workflow-schema.mjs`) | Schema 是 cross-tier contract, Runtime owns 解析, CLI owns 静态校验 |
| 20 workflow yaml | Static yaml (manifest) | Runtime engine (eval gates + invoke) | yaml 是 declarative SoT, engine 是 reader |
| Master orchestrator delegation | Runtime engine (spawn sub-workflow) | judgmentResolver (gate eval) | Engine 拿到 master yaml → resolve sub via judgments.fires → spawn |
| Nested dir scan | CLI (setup.ts) | fs.cp recursive | Install-time only, runtime 不 scan |
| Cross-cutting tool invoke | Runtime engine (capabilities.yaml lookup) | Claude Code slash cmd platform | Engine resolve `tools_available` → 用户/Claude Code 接管 slash cmd invoke |
| Discipline enforcement | Runtime hooks (pre-commit / output-format / etc.) | doctor check (advisory) | hooks 是真接执行点, doctor 是 advisory |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@sinclair/typebox` | 0.34+ (v2.0 已 ship) | v3 schema 定义 | sister WorkflowSchemaV2 已用 (src/workflow/schema/workflow.ts) |
| `yaml` | 已 in deps (sister judgmentResolver.ts L20) | parse workflow.yaml + disciplines.yaml | 沿用 v2 |
| `@sinclair/typebox/value` | 同 typebox | `Value.Check` + `Value.Errors` validate | sister judgmentResolver.ts L24 |
| `node:fs/promises` | Node 22 builtin | `readdir` recursive scan + `cp` install | sister setup.ts L17 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `expr-eval` | sister exprBuilder.ts | `if:` clause + gate `fires` eval | 已 ship Phase 2.3 |

**Installation:** v3 不引入 NEW npm dep (沿用 v2 stack)。

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TypeBox | zod / valibot | TypeBox 已 ship v2 sister schema (workflow / judgment / capabilities / defaults / manifest 等 16+ surface), 切换成本 >> 收益 (karpathy simplicity 原则 — 不切) |
| Declarative master delegation | Pure imperative engine code | Hybrid 推荐 (Option A 主体 + B 内核) |

---

## Area 1 — workflow.yaml v3 schema (TypeBox)

### v2 → v3 Field Delta

v2 86L (`src/workflow/schema/workflow.ts`) sister surface:
```typescript
WorkflowSchemaV2 = {
  schema_version: 'harnessed.workflow.v2',
  workflow: string,
  description?: string,
  phases: WorkflowPhaseV2[],
}
WorkflowPhaseV2 = {
  id, name?, upstream?, capability?, model?, invokes?, args?,
  gate?, on?, parallelism?, fallback?, max_iterations?, artifacts_expected?,
}
```

v3 增量 (~40-50L 新增):

| Field | Level | Type | Required | Purpose | Source D-decision |
|-------|-------|------|----------|---------|-------------------|
| `schema_version` | root | `Literal('harnessed.workflow.v3')` | required | 17th surface in schemaVersion.ts | D-08 sister Phase 2.4 W0.1 pattern |
| `behavioral_layer` | workflow | `string[]` | optional | references `workflows/disciplines/<basename>.yaml` (sister `disciplines_applied` 同义? See note) | D-05 |
| `disciplines_applied` | workflow | `string[]` | optional (default ALL 6) | 同 `behavioral_layer` (D-09 verbatim 命名) — **recommendation: 用 D-09 命名 `disciplines_applied`, deprecate `behavioral_layer` (重复)** | D-09 |
| `tools_available` | workflow | `string[]` | optional | references `workflows/capabilities.yaml` entry name (by-condition slash invoke) | D-05 |
| `delegates_to` | workflow (master only) | `DelegationClause[]` | required for master | Master orchestrator declarative spawn list (see Area 3) | D-01 NEW |
| `invokes_tools` | phase | `Array<{if?, tool}>` | optional | Phase-level conditional tool fire | D-05 |

**Naming reconciliation (CRITICAL):** CONTEXT.md D-05 写 `behavioral_layer`, D-09 写 `disciplines_applied`。两者其实指同一个 field (workflow-level array references `workflows/disciplines/<basename>.yaml`)。**推荐 finalize 为 `disciplines_applied`** (D-09 更晚 + 更具体 + 与 disciplines/ dir 命名一致)。`behavioral_layer` 不 wire 进 schema (避免 dual-name 歧义)。

### Final v3 TypeBox Schema (sister v2 增量)

```typescript
// src/workflow/schema/workflow.ts v3 (sister v2 86L → v3 ~130L total)
import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

const ModelTier = Type.Union([Type.Literal('haiku'), Type.Literal('sonnet'), Type.Literal('opus')])
const OnAction = Type.Union([Type.Literal('skip'), Type.Literal('invoke')])

export const OnClause = Type.Object({
  if: Type.String(),
  invoke: Type.Optional(Type.String()),
  action: Type.Optional(OnAction),
}, { additionalProperties: false })

export const InvokeToolClause = Type.Object({
  if: Type.Optional(Type.String()),                        // optional — 无 if = unconditional
  tool: Type.String({ minLength: 1 }),                     // capabilities.yaml entry name
}, { additionalProperties: false })

export const DelegationClause = Type.Object({
  sub: Type.String({ minLength: 1 }),                      // sub-stage workflow name e.g. 'strategic'
  gate: Type.Optional(Type.String()),                      // judgments.<file>.<trigger>.fires ref
  mode: Type.Optional(Type.Union([Type.Literal('parallel'), Type.Literal('serial')])),
  order: Type.Optional(Type.Number()),                     // serial-only: explicit ordering
}, { additionalProperties: false })

export const FallbackMaxIterationsExceeded = Type.Object({
  action: Type.Literal('emit_warning_and_halt'),
  message: Type.String(),
  exit_code: Type.Number(),
}, { additionalProperties: false })

export const PhaseFallback = Type.Object({
  max_iterations_exceeded: Type.Optional(FallbackMaxIterationsExceeded),
}, { additionalProperties: false })

export const WorkflowPhaseV3 = Type.Object({
  id: Type.String({ minLength: 1 }),
  name: Type.Optional(Type.String()),
  upstream: Type.Optional(Type.String()),
  capability: Type.Optional(Type.String()),
  model: Type.Optional(ModelTier),
  invokes: Type.Optional(Type.String()),
  args: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  gate: Type.Optional(Type.String()),
  on: Type.Optional(Type.Array(OnClause)),
  parallelism: Type.Optional(Type.String()),
  fallback: Type.Optional(PhaseFallback),
  max_iterations: Type.Optional(Type.Union([Type.Number(), Type.String()])),
  artifacts_expected: Type.Optional(Type.Array(Type.String())),
  invokes_tools: Type.Optional(Type.Array(InvokeToolClause)),     // NEW v3
}, { additionalProperties: false })

export const WorkflowSchemaV3 = Type.Object({
  schema_version: Type.Literal(SCHEMA_VERSIONS.workflow_v3),       // NEW 17th surface
  workflow: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.String()),
  disciplines_applied: Type.Optional(Type.Array(Type.String())),  // NEW v3 (D-09)
  tools_available: Type.Optional(Type.Array(Type.String())),      // NEW v3 (D-05)
  delegates_to: Type.Optional(Type.Array(DelegationClause)),      // NEW v3 (master only)
  phases: Type.Optional(Type.Array(WorkflowPhaseV3, { minItems: 1 })),  // 改 optional — master 无 phases (只有 delegates_to)
}, { additionalProperties: false })

// Validation invariant (runtime, NOT schema): 必有 phases OR delegates_to 之一
// engine 启动时 if (!yaml.phases && !yaml.delegates_to) throw

export type WorkflowSchemaV3T = Static<typeof WorkflowSchemaV3>
export type WorkflowPhaseV3T = Static<typeof WorkflowPhaseV3>
export type DelegationClauseT = Static<typeof DelegationClause>
export type InvokeToolClauseT = Static<typeof InvokeToolClause>
```

### Schema Decisions

| Decision | Rationale |
|----------|-----------|
| `additionalProperties: false` 全 sub-schema | sister Phase 2.2 STRIDE T-2.2-02 mitigation verbatim |
| `phases` 改 `Type.Optional` | Master orchestrator 无 phases (只 delegates_to); sub-stage + standalone 仍 require phases |
| `tools_available` string[] not object[] | Phase 3.1 D-05 verbatim — `by-condition slash invoke`; 条件 fire 用 phase-level `invokes_tools` 表达 (workflow-level 只声明可用集) |
| `disciplines_applied` Optional + default all 6 in runtime | D-09 "default = all 6 enforced"; yaml 未声明 = 默认全开; 显式空数组 `[]` = 全关 (escape hatch) |
| `delegates_to` 是 array of objects (not flat string[]) | 需 per-sub `gate` + `mode` + `order` 表达, string[] 不够 |
| `InvokeToolClause` 沿用 `OnClause` 风格 (`if?` + 主语段) | 一致性原则 sister phase.on |

### Schema Version Surface

`src/types/schemaVersion.ts` 当前 16 surface (sister Phase 2.4 W0.1 ship), v3 加:
- `workflow_v3: 'harnessed.workflow.v3'` → 17th surface
- `discipline: 'harnessed.discipline.v1'` → 18th surface (disciplines-researcher 实装)
- `capabilities_v2: 'harnessed.capabilities.v2'` → 19th surface (capabilities-researcher 实装 NEW category field bump)

总计 **19 surface** post v3.0 ship (sister Phase 2.4 16 → +3 surface)。

---

## Area 2 — 20 Workflow yaml Content Design

### Structure Tree (D-03 D-07 verbatim)

```
workflows/
├── disciplines/                        # D-09 NEW L0 — 6 yaml (disciplines-researcher ship)
│   ├── karpathy.yaml
│   ├── output-style.yaml
│   ├── language.yaml
│   ├── operational.yaml
│   ├── priority.yaml
│   └── protocols.yaml
│
├── discuss/                            # Stage ① (3 sub independent gate)
│   ├── auto/        workflow.yaml + SKILL.md   /discuss             master gate-route 3 sub
│   ├── strategic/   workflow.yaml + SKILL.md   /discuss-strategic
│   ├── phase/       workflow.yaml + SKILL.md   /discuss-phase
│   └── subtask/     workflow.yaml + SKILL.md   /discuss-subtask
│
├── plan/                               # Stage ②
│   ├── auto/        workflow.yaml + SKILL.md   /plan                master serial architecture? → phase always
│   ├── architecture/workflow.yaml + SKILL.md   /plan-architecture   (gate: is_complex_architecture)
│   └── phase/       workflow.yaml + SKILL.md   /plan-phase
│
├── task/                               # Stage ③ (per subtask Execute)
│   ├── auto/        workflow.yaml + SKILL.md   /task                master serial 4 sub
│   ├── clarify/     workflow.yaml + SKILL.md   /task-clarify
│   ├── code/        workflow.yaml + SKILL.md   /task-code
│   ├── test/        workflow.yaml + SKILL.md   /task-test
│   └── deliver/     workflow.yaml + SKILL.md   /task-deliver
│
├── verify/                             # Stage ④ (5-7 sub conditional)
│   ├── auto/        workflow.yaml + SKILL.md   /verify              master 7 sub gate-route
│   ├── progress/    workflow.yaml + SKILL.md   /verify-progress
│   ├── code-review/ workflow.yaml + SKILL.md   /verify-code-review
│   ├── paranoid/    workflow.yaml + SKILL.md   /verify-paranoid
│   ├── qa/          workflow.yaml + SKILL.md   /verify-qa
│   ├── security/    workflow.yaml + SKILL.md   /verify-security
│   ├── design/      workflow.yaml + SKILL.md   /verify-design
│   ├── simplify/    workflow.yaml + SKILL.md   /verify-simplify
│   └── multispec/   workflow.yaml + SKILL.md   /verify-multispec
│
├── research/        workflow.yaml + SKILL.md   /research            standalone (v2.0 reuse + v3 schema bump)
├── retro/           workflow.yaml + SKILL.md   /retro               standalone NEW
│
├── judgments/                          # Phase 2.3 + v3 extend (D-11 NEW 4 file)
├── capabilities.yaml                   # v3 bump category field (capabilities-researcher)
├── defaults.yaml                       # extend ralph_max_iterations.<new-workflow>.* (D-10)
├── README.md
└── SCHEMA.md
```

### Master Orchestrator yaml Examples (4 file)

#### `workflows/discuss/auto/workflow.yaml` (~40L)

```yaml
schema_version: harnessed.workflow.v3
workflow: discuss
description: |
  Stage ① Discuss master orchestrator — 3 sub-workflow parallel gate-eval (chain-isolation 铁律):
  战略层 (gstack /gstack-office-hours + /gstack-plan-ceo-review) + Phase 层 (GSD /gsd-discuss-phase) + 子任务层
  (superpowers brainstorming) 独立判 gate, 可能全跑 / 1-2 个 / 全跳 + 透明声明。
  Sister CLAUDE.md "澄清/审查触发判据" 节 + fallback.yaml "链式互不前置" 铁律。

disciplines_applied:
  - karpathy
  - output-style
  - language
  - operational
  - priority
  - protocols

tools_available:
  - planning-with-files   # discuss 阶段 sink findings.md

delegates_to:
  - sub: strategic
    gate: judgments.strategic-gate.gstack-office-hours.fires
    mode: parallel
  - sub: phase
    gate: judgments.phase-gate.gsd-discuss-phase.fires
    mode: parallel
  - sub: subtask
    gate: judgments.subtask-gate.brainstorming.fires
    mode: parallel
```

#### `workflows/plan/auto/workflow.yaml` (~38L)

```yaml
schema_version: harnessed.workflow.v3
workflow: plan
description: |
  Stage ② Plan master orchestrator — 串行 invoke (architecture conditional → phase always);
  planning-with-files /plan 自动 sink task_plan.md + progress.md (D-06 cross-cutting tool, NOT
  独立 sub-workflow per user clarification 2)。

disciplines_applied:
  - karpathy
  - output-style
  - language
  - operational
  - priority
  - protocols

tools_available:
  - planning-with-files
  - gstack-plan-eng-review   # phase.is_complex_architecture trigger
  - gsd-plan-phase

delegates_to:
  - sub: architecture
    gate: judgments.phase-gate.is-complex-architecture.fires  # NEW gate (Phase 3.3 ship)
    mode: serial
    order: 1
  - sub: phase
    mode: serial
    order: 2
```

#### `workflows/task/auto/workflow.yaml` (~42L)

```yaml
schema_version: harnessed.workflow.v3
workflow: task
description: |
  Stage ③ Task master orchestrator — 串行 invoke 4 sub per subtask (clarify → code → test → deliver);
  ralph-loop COMPLETE wrapper 在 deliver phase 内 (D-10 orthogonal wrapper not master concern)。

disciplines_applied:
  - karpathy
  - output-style
  - language
  - operational
  - priority
  - protocols

tools_available:
  - superpowers-brainstorming
  - tdd
  - grill-with-docs
  - zoom-out
  - improve-codebase-architecture
  - diagnose
  - ralph-loop
  - planning-with-files     # task-code + task-deliver update progress.md

delegates_to:
  - sub: clarify
    gate: judgments.subtask-gate.brainstorming.fires
    mode: serial
    order: 1
  - sub: code
    mode: serial
    order: 2
  - sub: test
    gate: judgments.tdd-gate.tdd-strongly-suggested.fires
    mode: serial
    order: 3
  - sub: deliver
    mode: serial
    order: 4
```

#### `workflows/verify/auto/workflow.yaml` (~50L)

```yaml
schema_version: harnessed.workflow.v3
workflow: verify
description: |
  Stage ④ Verify master orchestrator — 7 sub conditional per CLAUDE.md "Verify 阶段" verbatim:
  progress 必跑 → code-review 并行 → paranoid 关键模块强制 → qa/security/design 可选 conditional
  → simplify 末尾串行 → multispec 关键发布 Pattern C 4-specialist Agent Team。

disciplines_applied:
  - karpathy
  - output-style
  - language
  - operational
  - priority
  - protocols

tools_available:
  - gsd-verify-work
  - gsd-progress
  - code-review
  - review
  - qa
  - cso
  - design-review
  - code-simplifier
  - agent-teams-create
  - planning-with-files

delegates_to:
  - sub: progress
    mode: serial
    order: 1
  - sub: code-review
    mode: parallel
  - sub: paranoid
    gate: judgments.phase-gate.is-critical-module.fires
    mode: serial
    order: 3
  - sub: qa
    gate: judgments.phase-gate.has-ui-changes.fires
    mode: parallel
  - sub: security
    gate: judgments.phase-gate.has-auth-or-secrets.fires
    mode: parallel
  - sub: design
    gate: judgments.phase-gate.has-design-changes.fires
    mode: parallel
  - sub: simplify
    mode: serial
    order: 7
  - sub: multispec
    gate: judgments.parallelism-gate.agent-teams-upgrade.fires
    mode: serial
    order: 8
```

### Sub-Stage yaml Examples (14 file — full set, each ~30-60L)

#### `workflows/discuss/strategic/workflow.yaml` (~38L)

```yaml
schema_version: harnessed.workflow.v3
workflow: discuss-strategic
description: |
  Stage ①.a 战略层 — gstack /gstack-office-hours + /gstack-plan-ceo-review 新功能/新 milestone 启动前强制
  (sister CLAUDE.md "新功能启动前强制 🔒")。Gate: judgments.strategic-gate.gstack-office-hours.fires。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [gstack-office-hours, gstack-plan-ceo-review, planning-with-files]

phases:
  - id: 01-office-hours
    name: gstack-office-hours (YC-style pressure test + reframe + Design Doc)
    upstream: gstack
    capability: '{{ capabilities.gstack-office-hours.cmd }}'
    model: opus
    gate: judgments.strategic-gate.gstack-office-hours.fires
    max_iterations: '{{ defaults.ralph_max_iterations.discuss-strategic.01-office-hours }}'

  - id: 02-plan-ceo-review
    name: gstack-plan-ceo-review (CEO 视角 商业价值 + 10-star 潜力 + scope)
    upstream: gstack
    capability: '{{ capabilities.gstack-plan-ceo-review.cmd }}'
    model: opus
    gate: judgments.strategic-gate.gstack-plan-ceo-review.fires
    max_iterations: '{{ defaults.ralph_max_iterations.discuss-strategic.02-plan-ceo-review }}'

  - id: 03-persist
    name: planning-with-files findings.md
    upstream: planning-with-files
    capability: '{{ capabilities.planning-with-files.cmd }}'
    invokes: '/plan'
    model: haiku
    artifacts_expected: [findings.md]
```

#### `workflows/discuss/phase/workflow.yaml` (~32L)

```yaml
schema_version: harnessed.workflow.v3
workflow: discuss-phase
description: |
  Stage ①.b Phase 层 — GSD /gsd-discuss-phase 灰色澄清 (≥2 open decisions / phase scope > 1 day /
  跨 phase API contract 不清)。Gate: judgments.phase-gate.gsd-discuss-phase.fires。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [gsd-discuss-phase, planning-with-files]

phases:
  - id: 01-gsd-discuss
    upstream: gsd
    capability: '{{ capabilities.gsd-discuss-phase.cmd }}'
    model: sonnet
    gate: judgments.phase-gate.gsd-discuss-phase.fires
    max_iterations: '{{ defaults.ralph_max_iterations.discuss-phase.01-gsd-discuss }}'

  - id: 02-persist
    upstream: planning-with-files
    capability: '{{ capabilities.planning-with-files.cmd }}'
    invokes: '/plan'
    model: haiku
    artifacts_expected: [findings.md, knowledge.md]
```

#### `workflows/discuss/subtask/workflow.yaml` (~28L)

```yaml
schema_version: harnessed.workflow.v3
workflow: discuss-subtask
description: |
  Stage ①.c 子任务层 — superpowers brainstorming (≥2 approach / 核心算法 / API contract / 错误成本高)。
  Gate: judgments.subtask-gate.brainstorming.fires。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [superpowers-brainstorming, grill-with-docs, grill-me]

phases:
  - id: 01-brainstorm
    upstream: superpowers
    capability: '{{ capabilities.superpowers-brainstorming.cmd }}'
    model: opus
    gate: judgments.subtask-gate.brainstorming.fires
    invokes_tools:
      - if: 'phase.spec_ambiguous == true'
        tool: grill-with-docs
      - if: 'phase.spec_ambiguous == true and phase.no_docs == true'
        tool: grill-me
    max_iterations: '{{ defaults.ralph_max_iterations.discuss-subtask.01-brainstorm }}'
```

#### `workflows/plan/architecture/workflow.yaml` (~30L)

```yaml
schema_version: harnessed.workflow.v3
workflow: plan-architecture
description: |
  Stage ②.a 架构层 — gstack /gstack-plan-eng-review (复杂架构强制, sister CLAUDE.md "⚠️ 复杂架构前")。
  Gate: phase.is_complex_architecture (or judgments.phase-gate.is-complex-architecture.fires)。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [gstack-plan-eng-review]

phases:
  - id: 01-plan-eng-review
    upstream: gstack
    capability: '{{ capabilities.gstack-plan-eng-review.cmd }}'
    model: opus
    gate: judgments.phase-gate.is-complex-architecture.fires
    max_iterations: '{{ defaults.ralph_max_iterations.plan-architecture.01-plan-eng-review }}'
```

#### `workflows/plan/phase/workflow.yaml` (~32L)

```yaml
schema_version: harnessed.workflow.v3
workflow: plan-phase
description: |
  Stage ②.b 计划层 — GSD /gsd-plan-phase Wave A research + Wave B planner + Wave C plan-checker
  + planning-with-files /plan 持久化 task_plan.md (sister CLAUDE.md "Plan 阶段 GSD + planning-with-files")。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [gsd-plan-phase, planning-with-files]

phases:
  - id: 01-gsd-plan
    upstream: gsd
    capability: '{{ capabilities.gsd-plan-phase.cmd }}'
    model: sonnet
    max_iterations: '{{ defaults.ralph_max_iterations.plan-phase.01-gsd-plan }}'

  - id: 02-persist
    upstream: planning-with-files
    capability: '{{ capabilities.planning-with-files.cmd }}'
    invokes: '/plan'
    model: haiku
    artifacts_expected: [task_plan.md, progress.md]
```

#### `workflows/task/clarify/workflow.yaml` (~30L)

```yaml
schema_version: harnessed.workflow.v3
workflow: task-clarify
description: |
  Stage ③.a 子任务澄清 — superpowers brainstorm + mattpocock /grill-with-docs (子任务 ≥2 approach)。
  Gate: judgments.subtask-gate.brainstorming.fires (与 discuss-subtask 同 gate, 但 phase 不同 — Stage ③ 是 per-subtask repeat invoke)。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [superpowers-brainstorming, grill-with-docs]

phases:
  - id: 01-brainstorm
    upstream: superpowers
    capability: '{{ capabilities.superpowers-brainstorming.cmd }}'
    model: sonnet
    gate: judgments.subtask-gate.brainstorming.fires
    invokes_tools:
      - if: 'phase.spec_ambiguous == true'
        tool: grill-with-docs
    max_iterations: '{{ defaults.ralph_max_iterations.task-clarify.01-brainstorm }}'
```

#### `workflows/task/code/workflow.yaml` (~42L)

```yaml
schema_version: harnessed.workflow.v3
workflow: task-code
description: |
  Stage ③.b 子任务编码 — karpathy 心法 always-on + mattpocock conditional route (zoom-out 陌生 /
  improve-arch 周期 / diagnose bug)。+ planning-with-files /plan update progress.md。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available:
  - zoom-out
  - improve-codebase-architecture
  - diagnose
  - planning-with-files

phases:
  - id: 01-code
    upstream: karpathy
    model: sonnet
    max_iterations: '{{ defaults.ralph_max_iterations.task-code.01-code }}'
    invokes_tools:
      - if: 'phase.unfamiliar_module == true'
        tool: zoom-out
      - if: 'phase.architecture_health_audit == true'
        tool: improve-codebase-architecture
      - if: 'subtask.bug_root_cause_unknown == true'
        tool: diagnose

  - id: 02-progress
    upstream: planning-with-files
    capability: '{{ capabilities.planning-with-files.cmd }}'
    invokes: '/plan'
    model: haiku
    artifacts_expected: [progress.md]
```

#### `workflows/task/test/workflow.yaml` (~38L)

```yaml
schema_version: harnessed.workflow.v3
workflow: task-test
description: |
  Stage ③.c 子任务测试 — superpowers TDD red-green-refactor 强制 (核心业务 / 算法 / 数据处理 /
  回归 risk high / reliability required), 其他可选 mattpocock /tdd。
  Gate: judgments.tdd-gate.tdd-strongly-suggested.fires。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [tdd, diagnose]

phases:
  - id: 01-test
    upstream: superpowers
    capability: '{{ capabilities.tdd.cmd }}'
    model: sonnet
    gate: judgments.tdd-gate.tdd-strongly-suggested.fires
    invokes_tools:
      - if: 'test_fail == true'
        tool: diagnose
    max_iterations: '{{ defaults.ralph_max_iterations.task-test.01-test }}'
```

#### `workflows/task/deliver/workflow.yaml` (~50L)

```yaml
schema_version: harnessed.workflow.v3
workflow: task-deliver
description: |
  Stage ③.d 子任务交付 — ralph-loop COMPLETE wrapper 保 completion-promise verbatim "COMPLETE"。
  Parallelism: subagent default OR Agent Teams 升级 (5 触发 OR-chain)。Cleanup mandatory。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available:
  - ralph-loop
  - agent-teams-create
  - agent-teams-send-message
  - agent-teams-shutdown
  - planning-with-files

phases:
  - id: 01-deliver
    upstream: ralph-loop
    capability: '{{ capabilities.ralph-loop.cmd }}'
    model: haiku
    args:
      completion_promise: COMPLETE
      max_iterations: '{{ defaults.ralph_max_iterations.task-deliver.01-deliver }}'
    parallelism: judgments.parallelism-gate.ralph-loop-wrapper.fires
    on:
      - if: 'subtask.lines >= 20 and subtask.type != "single_command_query"'
        invoke: '{{ capabilities.ralph-loop.cmd }}'
      - if: 'subtask.lines < 20 or subtask.type == "single_command_query"'
        action: skip
    fallback:
      max_iterations_exceeded:
        action: emit_warning_and_halt
        message: '⚠️ ralph-loop max-iterations exceeded for task-deliver. Sub-task likely incomplete.'
        exit_code: 1

  - id: 02-progress-mark
    upstream: planning-with-files
    capability: '{{ capabilities.planning-with-files.cmd }}'
    invokes: '/plan'
    model: haiku
    artifacts_expected: [progress.md]
```

#### `workflows/verify/progress/workflow.yaml` (~30L)

```yaml
schema_version: harnessed.workflow.v3
workflow: verify-progress
description: Stage ④.a GSD /gsd-verify-work + /gsd-progress 必跑串行 (verify-work 起点)。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [gsd-verify-work, gsd-progress, planning-with-files]

phases:
  - id: 01-gsd-verify-work
    upstream: gsd
    capability: '{{ capabilities.gsd-verify-work.cmd }}'
    model: sonnet
    max_iterations: '{{ defaults.ralph_max_iterations.verify-progress.01-gsd-verify-work }}'

  - id: 02-gsd-progress
    upstream: gsd
    capability: '{{ capabilities.gsd-progress.cmd }}'
    model: haiku
    max_iterations: 2

  - id: 03-progress-update
    upstream: planning-with-files
    capability: '{{ capabilities.planning-with-files.cmd }}'
    invokes: '/plan'
    model: haiku
    artifacts_expected: [progress.md]
```

#### `workflows/verify/code-review/workflow.yaml` (~25L)

```yaml
schema_version: harnessed.workflow.v3
workflow: verify-code-review
description: Stage ④.b code-review 多 agent 并行 fan-out 高置信度 finding (subagent default)。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [code-review]

phases:
  - id: 01-code-review
    upstream: mattpocock-skills
    capability: '{{ capabilities.code-review.cmd }}'
    model: sonnet
    parallelism: judgments.parallelism-gate.subagent-default.fires
    max_iterations: '{{ defaults.ralph_max_iterations.verify-code-review.01-code-review }}'
```

#### `workflows/verify/paranoid/workflow.yaml` (~25L)

```yaml
schema_version: harnessed.workflow.v3
workflow: verify-paranoid
description: |
  Stage ④.c gstack /review Paranoid Staff Engineer (关键模块 PR 前强制 🔒 sister CLAUDE.md)。
  Gate: judgments.phase-gate.is-critical-module.fires。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [gstack-review]

phases:
  - id: 01-review
    upstream: gstack
    capability: '{{ capabilities.gstack-review.cmd }}'
    model: opus
    gate: judgments.phase-gate.is-critical-module.fires
    max_iterations: '{{ defaults.ralph_max_iterations.verify-paranoid.01-review }}'
```

#### `workflows/verify/qa/workflow.yaml` (~25L)

```yaml
schema_version: harnessed.workflow.v3
workflow: verify-qa
description: Stage ④.d gstack /qa 端到端 (has_ui_changes 触发, 可选 conditional)。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [gstack-qa, playwright-cli, playwright-test, webapp-testing]

phases:
  - id: 01-qa
    upstream: gstack
    capability: '{{ capabilities.gstack-qa.cmd }}'
    model: sonnet
    gate: judgments.phase-gate.has-ui-changes.fires
    max_iterations: 3
```

#### `workflows/verify/security/workflow.yaml` (~25L)

```yaml
schema_version: harnessed.workflow.v3
workflow: verify-security
description: Stage ④.e gstack /cso 安全 (OWASP/auth/secrets, has_auth_or_secrets 触发)。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [gstack-cso]

phases:
  - id: 01-cso
    upstream: gstack
    capability: '{{ capabilities.gstack-cso.cmd }}'
    model: opus
    gate: judgments.phase-gate.has-auth-or-secrets.fires
    max_iterations: 3
```

#### `workflows/verify/design/workflow.yaml` (~25L)

```yaml
schema_version: harnessed.workflow.v3
workflow: verify-design
description: Stage ④.f gstack /design-review 设计审查 (has_design_changes 触发)。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [gstack-design-review, ui-ux-pro-max, frontend-design]

phases:
  - id: 01-design-review
    upstream: gstack
    capability: '{{ capabilities.gstack-design-review.cmd }}'
    model: sonnet
    gate: judgments.phase-gate.has-design-changes.fires
    max_iterations: 3
```

#### `workflows/verify/simplify/workflow.yaml` (~22L)

```yaml
schema_version: harnessed.workflow.v3
workflow: verify-simplify
description: Stage ④.g code-simplifier 末尾串行 (移除重复 / 多余逻辑)。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [code-simplifier]

phases:
  - id: 01-simplify
    upstream: mattpocock-skills
    capability: '{{ capabilities.code-simplifier.cmd }}'
    model: sonnet
    max_iterations: '{{ defaults.ralph_max_iterations.verify-simplify.01-simplify }}'
```

#### `workflows/verify/multispec/workflow.yaml` (~36L)

```yaml
schema_version: harnessed.workflow.v3
workflow: verify-multispec
description: |
  Stage ④.h 4-specialist Agent Team Pattern C 多维度审查 (关键发布/大重构 PR 升级,
  code-review + review + cso + qa 互相 SendMessage 质询)。
  Cleanup mandatory: shutdown_request + TeamDelete (sister ~/.claude/rules/agent-teams.md 防呆清单)。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available:
  - agent-teams-create
  - agent-teams-send-message
  - agent-teams-shutdown
  - code-review
  - review
  - cso
  - qa

phases:
  - id: 01-team-create
    upstream: claude-platform
    capability: '{{ capabilities.agent-teams-create.cmd }}'
    model: opus
    parallelism: judgments.parallelism-gate.agent-teams-upgrade.fires
    on:
      - if: 'phase.is_major_release == true or phase.is_large_refactor == true'
        action: invoke
      - if: 'phase.is_major_release == false and phase.is_large_refactor == false'
        action: skip
    max_iterations: 1

  - id: 02-team-cleanup
    upstream: claude-platform
    capability: '{{ capabilities.agent-teams-shutdown.cmd }}'
    model: haiku
    max_iterations: 1
```

### Standalone yaml (2 file)

#### `workflows/research/workflow.yaml` v3 (~25L — v2.0 reuse + schema bump)

```yaml
schema_version: harnessed.workflow.v3            # bump v2 → v3
workflow: research
description: |
  Standalone Stage ① alternate — 多源调研 Tavily / Exa / ctx7 fan-out + GSD discuss synth
  aggregate (sister ~/.claude/rules/web-search.md + context7.md routing 机器化)。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [tavily-mcp, exa-mcp, ctx7, gsd-discuss-phase]

phases:
  - id: 01-fan-out
    upstream: web-search
    model: sonnet
    parallelism: judgments.parallelism-gate.subagent-default.fires
    max_iterations: '{{ defaults.ralph_max_iterations.research.01-fan-out }}'

  - id: 02-synth
    upstream: gsd
    capability: '{{ capabilities.gsd-discuss-phase.cmd }}'
    model: opus
    max_iterations: '{{ defaults.ralph_max_iterations.research.02-synth }}'
```

#### `workflows/retro/workflow.yaml` v3 NEW (~30L)

```yaml
schema_version: harnessed.workflow.v3
workflow: retro
description: |
  Standalone post-④ — gstack /retro 经验教训总结 (项目/里程碑结束可选, sister CLAUDE.md
  "项目 / 里程碑结束: 可选跑 /retro 总结")。Sink RETROSPECTIVE.md (sister Phase 2.5 pattern)。

disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]
tools_available: [gstack-retro, planning-with-files]

phases:
  - id: 01-retro
    upstream: gstack
    capability: '{{ capabilities.gstack-retro.cmd }}'   # 需 capabilities-researcher confirm entry name
    model: opus
    max_iterations: '{{ defaults.ralph_max_iterations.retro.01-retro }}'

  - id: 02-persist
    upstream: planning-with-files
    capability: '{{ capabilities.planning-with-files.cmd }}'
    invokes: '/plan'
    model: haiku
    artifacts_expected: [RETROSPECTIVE.md]
```

### SKILL.md frontmatter Pattern (20 file)

每个 workflow `<dir>/SKILL.md` sister v2 verify-work pattern (verify-work/SKILL.md 92L):

```yaml
---
name: <bare-slash-cmd>        # e.g. "discuss-strategic" → slash cmd /discuss-strategic
description: |
  <one-paragraph workflow purpose mirroring workflow.yaml description verbatim>
  schema_version: harnessed.workflow.v3 with delegation + disciplines_applied + tools_available
  + invokes_tools fields. Triggered by harnessed CLI or slash command /<name> after `harnessed setup`.
trigger_phrases:
  - "<one canonical trigger>"
  - "<alternate trigger>"
  - "<aliased v2 phrase>"
---

# <name> workflow (v3)

## Overview
... 4-row table mapping phase id → upstream → model → capability/invokes → gate/on/parallelism ...

## References
- D-XX (this workflow's primary D-decision)
- ~/.claude/CLAUDE.md "<sister section>"
- workflows/capabilities.yaml — <entries>
- workflows/judgments/<file>.yaml — <triggers>
- workflows/defaults.yaml — ralph_max_iterations.<name>.* values
```

---

## Area 3 — Master Orchestrator Delegation Pattern

### Option Comparison

**Option A — Pure Declarative (`delegates_to` only)**
- yaml 完全声明; engine 读 `delegates_to[]` → 顺序 / 并行 spawn sub-workflow
- Pro: 简单 + yaml-only 编辑无需 TS code change + sister v2 phases[] pattern verbatim
- Con: gate eval 仍需 engine code (`judgmentResolver`), 不是纯 yaml; 复杂 routing 逻辑 (例如 "fire X if A else Y") 表达困难

**Option B — Pure Imperative (NEW `masterOrchestrator.ts`)**
- yaml 仅 metadata; engine TS code 写死 4 master 的 spawn 逻辑
- Pro: 复杂 routing 灵活
- Con: 违反 D-13 declarative SoT 原则 (CLAUDE.md verbatim mapping); 4 master 都得 hard-code; karpathy simplicity 违反

**Option C — Hybrid (推荐)**
- yaml `delegates_to[]` 声明主体 (sub + gate + mode + order)
- engine NEW `src/workflow/masterOrchestrator.ts` (~120L) consume yaml + resolve gate via `judgmentResolver.resolveJudgmentGate()` (sister Phase 2.3 W0.4 ship) + 用 SDK `query` / sub-shell spawn 每个 fired sub
- 不引入 NEW imperative code per master, 4 master 共享同一 dispatcher

### Recommended: Option C (Hybrid)

**Engine sketch** (`src/workflow/masterOrchestrator.ts` ~120L, sister judgmentResolver.ts 98L pattern):

```typescript
// src/workflow/masterOrchestrator.ts — Phase v3.0-3.5 ship
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { parse as parseYaml } from 'yaml'
import { resolveJudgmentGate } from './judgmentResolver.js'
import { WorkflowSchemaV3, type DelegationClauseT, type WorkflowSchemaV3T } from './schema/workflow.js'

export interface MasterRunResult {
  master: string
  fired: Array<{ sub: string; mode: 'parallel' | 'serial'; order?: number }>
  skipped: Array<{ sub: string; reason: string }>
}

export async function runMasterOrchestrator(
  masterName: 'discuss' | 'plan' | 'task' | 'verify',
  context: Record<string, unknown>,
  packageRoot: string,
): Promise<MasterRunResult> {
  const yamlPath = resolve(packageRoot, 'workflows', masterName, 'auto', 'workflow.yaml')
  const raw = await readFile(yamlPath, 'utf8')
  const parsed = parseYaml(raw) as unknown
  if (!Value.Check(WorkflowSchemaV3, parsed)) {
    throw new Error(`Invalid master workflow.yaml at ${yamlPath}`)
  }
  const master = parsed as WorkflowSchemaV3T
  if (!master.delegates_to || master.delegates_to.length === 0) {
    throw new Error(`Master workflow ${masterName} missing delegates_to`)
  }

  const fired: MasterRunResult['fired'] = []
  const skipped: MasterRunResult['skipped'] = []

  // Phase 1: gate eval per delegation clause
  const gateEvalled: Array<{ clause: DelegationClauseT; passes: boolean; reason?: string }> = []
  for (const clause of master.delegates_to) {
    if (!clause.gate) {
      gateEvalled.push({ clause, passes: true })  // unconditional fire
      continue
    }
    try {
      const passes = await resolveJudgmentGate(clause.gate, context, packageRoot)
      gateEvalled.push({ clause, passes, reason: passes ? undefined : `gate ${clause.gate} = false` })
    } catch (e) {
      gateEvalled.push({ clause, passes: false, reason: `gate eval error: ${(e as Error).message}` })
    }
  }

  // Phase 2: split serial vs parallel
  const serialClauses = gateEvalled
    .filter((g) => g.passes && (g.clause.mode ?? 'parallel') === 'serial')
    .sort((a, b) => (a.clause.order ?? 0) - (b.clause.order ?? 0))
  const parallelClauses = gateEvalled.filter((g) => g.passes && (g.clause.mode ?? 'parallel') === 'parallel')

  // Phase 3: spawn (serial first — sister v2 plan-feature 5-phase 串行 pattern)
  for (const { clause } of serialClauses) {
    await spawnSubWorkflow(masterName, clause.sub, context, packageRoot)
    fired.push({ sub: clause.sub, mode: 'serial', order: clause.order })
  }
  // Phase 4: parallel fan-out (sister Phase 2.3 W1.1 Promise.allSettled pattern)
  await Promise.allSettled(
    parallelClauses.map(async ({ clause }) => {
      await spawnSubWorkflow(masterName, clause.sub, context, packageRoot)
      fired.push({ sub: clause.sub, mode: 'parallel' })
    }),
  )

  // Phase 5: skipped — 透明声明 sister fallback.yaml 铁律 1
  for (const g of gateEvalled.filter((g) => !g.passes)) {
    skipped.push({ sub: g.clause.sub, reason: g.reason ?? 'gate not fired' })
  }

  return { master: masterName, fired, skipped }
}

async function spawnSubWorkflow(
  masterName: string, subName: string, context: Record<string, unknown>, packageRoot: string,
): Promise<void> {
  // Path A: 真接 SDK query — recursive call runRouting at sub-workflow yaml
  // Path B: sub-shell harnessed CLI invoke (sister Phase 2.5 dogfood pattern)
  // Phase 3.5 实装时 planner Wave B 二次决策
  throw new Error('TODO Phase 3.5 — Path A vs B decision')
}
```

### Master Dispatcher Transparency

每个 master invoke 后必输出 (sister fallback.yaml "拿不准 → 透明声明" 铁律 1):

```
$ harnessed discuss --phase 3.2

[discuss master] Evaluating 3 sub-workflow gates:
  ✓ strategic    (judgments.strategic-gate.gstack-office-hours.fires == true)
  ✓ phase        (judgments.phase-gate.gsd-discuss-phase.fires == true)
  ⊘ subtask     skipped — judgments.subtask-gate.brainstorming.fires == false

Firing 2 sub in parallel (chain-isolation 铁律):
  → /discuss-strategic (parallel)
  → /discuss-phase (parallel)

[discuss master] Complete: 2 fired, 1 skipped.
```

---

## Area 4 — Nested workflows/<stage>/<sub>/ Dir Scan Logic

### Current v2 Flat Scan (sister `src/cli/lib/setup-helpers.ts` L42-59)

```typescript
export async function scanWorkflowsWithSkill(workflowsDir, entries): Promise<string[]> {
  const out: string[] = []
  for (const entry of entries.sort()) {                  // entries = readdir workflows/
    const src = join(workflowsDir, entry)
    const s = await stat(src)
    if (!s.isDirectory()) continue
    await stat(join(src, 'SKILL.md'))                    // throws if missing
    out.push(entry)
  }
  return out
}
```

### v3 Nested 2-Level Scan (proposed extend, sister gstack/* nested pattern)

```typescript
// src/cli/lib/setup-helpers.ts v3 extend (sister v2 L42-59 → v3 ~80L total)

export interface NestedWorkflow {
  /** Slash-cmd name (flat) — e.g. "discuss-strategic" */
  name: string
  /** Source dir relative to workflowsDir — e.g. "discuss/strategic" or "research" */
  relPath: string
  /** Whether this is a master (nested at <stage>/auto/) */
  isMaster: boolean
}

const FLAT_LEGACY_NAMES = new Set([                       // v2 backward-compat (per D-04 alias map)
  'plan-feature', 'execute-task', 'verify-work',          // DROP per D-04 — emit deprecation warn at scan
  'research',                                              // KEEP standalone v2 → v3 reuse
])

export async function scanWorkflowsWithSkill(
  workflowsDir: string,
  entries: string[],
): Promise<NestedWorkflow[]> {
  const out: NestedWorkflow[] = []
  for (const entry of entries.sort()) {
    const src = join(workflowsDir, entry)
    let s: Stats
    try { s = await stat(src) } catch { continue }
    if (!s.isDirectory()) continue

    // Path A: flat legacy / standalone (research, retro)
    try {
      await stat(join(src, 'SKILL.md'))
      // SKILL.md at top-level — flat workflow (v2 legacy OR standalone)
      if (FLAT_LEGACY_NAMES.has(entry) && entry !== 'research' && entry !== 'retro') {
        console.warn(`⚠️ ${entry} is deprecated in v3.0 (per CHANGELOG alias map) — see docs/WORKFLOW.md`)
        continue                                          // skip install — pure deprecate per D-04
      }
      out.push({ name: entry, relPath: entry, isMaster: false })
      continue
    } catch { /* no flat SKILL.md, try nested */ }

    // Path B: nested 2-level — workflows/<stage>/<sub>/SKILL.md
    let subEntries: string[]
    try { subEntries = await readdir(src) } catch { continue }
    for (const sub of subEntries.sort()) {
      const subDir = join(src, sub)
      let ss: Stats
      try { ss = await stat(subDir) } catch { continue }
      if (!ss.isDirectory()) continue
      try {
        await stat(join(subDir, 'SKILL.md'))
        // Flatten to slash-cmd name (per D-02 bare cmd):
        //   workflows/discuss/auto/    → /discuss          (master, sub == 'auto')
        //   workflows/discuss/strategic/ → /discuss-strategic
        const name = sub === 'auto' ? entry : `${entry}-${sub}`
        out.push({ name, relPath: `${entry}/${sub}`, isMaster: sub === 'auto' })
      } catch { /* no SKILL.md, skip */ }
    }

    // Skip disciplines/ + judgments/ (NOT workflow dirs — only yaml manifests)
  }
  return out
}
```

### Install Path Flatten (sister v2 setup.ts L88-98)

```typescript
// src/cli/setup.ts v3 patch (sister v2 L88-98)
for (const wf of toInstall) {
  const src = join(workflowsDir, wf.relPath)            // e.g. workflows/discuss/strategic
  const dst = join(skillsBase, wf.name)                 // e.g. ~/.claude/skills/discuss-strategic
  await cp(src, dst, { recursive: true, force: true })
  console.log(`  [A] installed  ${wf.name}  →  ${dst}${wf.isMaster ? ' (master)' : ''}`)
}
```

### Backward Compatibility

| v2 slash cmd | v3 equivalent | Action |
|--------------|---------------|--------|
| `/plan-feature` | `/plan` (master) OR `/plan-phase` (sub) | scan warn + skip install + CHANGELOG alias map |
| `/execute-task` | `/task` (master) OR `/task-{clarify,code,test,deliver}` | scan warn + skip install + CHANGELOG alias map |
| `/verify-work` | `/verify` (master) OR `/verify-{progress,paranoid,qa,...}` | scan warn + skip install + CHANGELOG alias map |
| `/research` | `/research` (standalone v3 reuse) | scan install — v3 schema bump, slash cmd 不变 |

`harnessed setup` 输出新增 deprecation block:
```
⚠️ v3.0 BREAKING:
  /plan-feature   → /plan (master) | /plan-phase (sub)
  /execute-task   → /task (master) | /task-{clarify,code,test,deliver} (sub)
  /verify-work    → /verify (master) | /verify-{progress,paranoid,qa,security,design,simplify,multispec} (sub)
  /research, /retro 不变
  详见 CHANGELOG [3.0.0]
```

---

## Area 5 — SendMessage Cross-Team Coordination

### Sent to `capabilities-researcher` (2026-05-20)

**Subject:** workflow.yaml v3 `tools_available` field cross-deps API contract

**Content summary:**
1. workflow.yaml v3 新 `tools_available: string[]` 字段, 元素 = capabilities.yaml entry name (lookup key)
2. 请求 confirm final entry list (~70 entry total per D-12):
   - mattpocock 12 (D-09 v2.0 sister ship) — 沿用
   - gstack 6 核心 (D-12 v2.0 sister wrapped) — 沿用
   - gstack 30+ optional (D-12 NEW v3.0 registry-only) — **请告知最终命名** (推测 `gstack-<bare-cmd>` pattern)
   - GSD 5 (D-12) — 沿用 + 问 `gsd-debug` promote?
   - Special-purpose 13 (D-14) — 沿用
   - 核心 4 (D-10/D-13/D-15) — 沿用
   - Agent Teams 3 (D-11 Q-AUDIT-5b) — 沿用
3. v3 NEW `category` enum 7 value (D-08 verbatim): discipline / tool-slash-cmd / tool-mcp / tool-cli / tool-plugin / tool-bundled-skill / agent-platform
4. 3 schema 假设 confirm 请求 — `tools_available` 是 entry name list / `invokes_tools` 是 `{if?, tool}` 对象 / master `tools_available` 不必需 (sub-stage 自带)

**Pending reply:** capabilities-researcher will respond with final ~70 entry list incl. gstack 30+ naming.

### Sent to `disciplines-researcher` (2026-05-20)

**Subject:** workflow.yaml v3 `disciplines_applied` field cross-deps API contract

**Content summary:**
1. workflow.yaml v3 新 `disciplines_applied: string[]` 字段, 元素 = `workflows/disciplines/<basename>.yaml` basename
2. 我假设的 6 basename verbatim D-09: karpathy / output-style / language / operational / priority / protocols
3. discipline.yaml schema 假设 surface (`schema_version: harnessed.discipline.v1` + `enforcement_layer` + `auto_enforce` + `rules: [...]`)
4. 请求 confirm: 最终 6 basename / TypeBox schema surface / 是否需 NEW discipline category 进 capabilities.yaml (推测独立 sub-system per D-09)

**Pending reply:** disciplines-researcher will respond with final 6 basename list + discipline.yaml TypeBox schema.

### Reconciliation Plan (Wave B planner consumption)

`workflows-researcher` 这边 ship 的 schema + yaml content 用 **assumed names** (per Area 1 + Area 2 verbatim):
- `disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]`
- `tools_available: [<v2.0 sister 已 ship 39 entry name>]` + 用 placeholder `# capabilities-researcher confirm` 注释标记 gstack 30+

Wave B planner 在 task_plan.md 中创建 dedicated reconciliation task (~1 task):
- "Reconcile workflow.yaml v3 cross-deps with capabilities.yaml v3 final entry list + disciplines/*.yaml final basename" (task owner: planner OR phase 3.3 execute schema)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| yaml schema validate | 自写 validator | TypeBox + `Value.Check` | sister Phase 2.4 已 ship 16 surface, 一致性收益 >> 自写 |
| gate expr eval | 自写 parser | `expr-eval` + `judgmentResolver` | sister Phase 2.3 W0.4 + W0.6 已 ship 98L |
| Master spawn 逻辑 | 4 个 master 各写 imperative TS | `masterOrchestrator.ts` 共享 dispatcher | karpathy simplicity, 4 master 数据驱动 |
| Slash cmd flatten | hierarchical 3-level `/harnessed:discuss:strategic` | bare slash cmd (D-02 LOCKED) | Claude Code 平台支持滞后, defer v3.x |
| Nested scan recursion | 手写 fs.walk | `readdir` + `stat` 2-level (D-03 fixed depth) | depth 已固定 = 2, recursive overkill |

**Key insight:** v3.0 schema + content 95% 沿用 v2.0 已 ship pattern (sister WorkflowSchemaV2 / judgmentResolver / setup.ts / capabilities.yaml entry name), NEW code 仅 ~3 文件 (`masterOrchestrator.ts` ~120L + `WorkflowSchemaV3` schema +50L + `scanWorkflowsWithSkill` patch +30L)。Karpathy ≤200L hard limit 单文件全部 hold。

---

## Runtime State Inventory

> Phase v3.0 = rename / refactor (v2 → v3 workflow rename + dir restructure)。必填。

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — workflows/ 是 static yaml manifest, 无 stored data 引用 workflow name | — |
| Live service config | Claude Code skills installed to `~/.claude/skills/<name>/` from `harnessed setup` — v2 旧 skill dir (`plan-feature` / `execute-task` / `verify-work`) 在用户机器上仍存在 | setup --apply v3 时需提示 user manual remove 旧 skill dir (OR auto-cleanup with --force flag, planner Wave B 二次决策) |
| OS-registered state | None — harnessed 无 OS-registered state | — |
| Secrets / env vars | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` env var (Agent Teams D-11) — 名字不变 v2 → v3, 沿用 | — |
| Build artifacts | `dist/` TypeScript build output — sister Phase 2.4 已 ship, v3 不影响 build infra | — |
| **Test fixtures (sister Phase 2.5)** | `tests/fixtures/workflow-v2/*.yaml` (sister Phase 2.5 W2 ship) — v3 schema bump 后 fixture 需 dual support (v2 deprecated + v3 NEW) | NEW `tests/fixtures/workflow-v3/*.yaml` 30+ fixture (Phase 3.4-3.5 ship) |
| **README + docs/WORKFLOW.md** | 全文 "4 workflows" / "5-phase plan-feature" / "9-phase verify-work" 引用 v2 architecture | major rewrite Phase 3.6 |
| **CHANGELOG.md** | v2.0.x prior entry 不动 | NEW [3.0.0] BREAKING section + alias map (Phase 3.6) |
| **ci.yml A7 step** | 当前 iter 0029 (sister Phase 2.5 ship "feat(phase-v2.0-2.5): 4-stage 机器化") | iter 0029 → 0032 (3 NEW ADR 0030+, Phase 3.6) |
| **package.json** | version 2.0.1 | bump 3.0.0 (Phase 3.6) |

**Critical action:** `harnessed setup` v3 invoke 后, **不 auto-remove** 用户机器 `~/.claude/skills/plan-feature/` 等 v2 旧 skill dir (避免破坏 user 自己 customize)。提示用户手动删除 + 透明声明 (sister fallback.yaml 铁律 1)。

---

## Common Pitfalls

### Pitfall 1: Master ↔ Sub Gate 重叠 / 矛盾
**What goes wrong:** Master `/task` 触发 sub `/task-test` 的 gate `judgments.tdd-gate.tdd-strongly-suggested.fires`, sub-stage `task-test/workflow.yaml` 也声明同 gate; 两次 eval 结果不一致 (e.g. context 变化)。
**Why it happens:** Master 和 sub-stage 都可独立 invoke (per D-01); gate 在两层独立 eval。
**How to avoid:** Engine 共享 1 个 context snapshot per top-level invoke; 子 spawn 沿用同 context, 不重新 collect facts。
**Warning signs:** Dogfood Phase 3.5 中观察 "fire/skip 序列 master vs sub log 不一致"。

### Pitfall 2: Master `delegates_to` order 缺失导致 race
**What goes wrong:** Plan master delegates_to = [architecture, phase], 都 `mode: serial` 但 `order` 未声明; engine 顺序未定。
**Why it happens:** schema `order` 是 Optional, 但 serial mode 必须有显式 order 否则未定义行为。
**How to avoid:** schema validate post-check: serial mode 必带 order; engine 启动时 if (clause.mode === 'serial' && clause.order === undefined) throw。
**Warning signs:** `node scripts/check-workflow-schema.mjs` 增加 schema-post invariant check。

### Pitfall 3: Nested scan 误匹配 `disciplines/` 或 `judgments/` 当作 workflow
**What goes wrong:** workflows/disciplines/karpathy.yaml 没 SKILL.md, 但 readdir 把 `disciplines/` 当 dir scan。
**Why it happens:** scan logic 只 stat SKILL.md, 但 `disciplines/` 子目录无 SKILL.md → silent skip OK; 但 if `disciplines/karpathy/` 改 dir (NOT yaml file) 会被误 scan。
**How to avoid:** D-09 LOCK `disciplines/<basename>.yaml` 是 flat yaml file NOT subdir; scan logic explicit `if (!entry.isFile() || !entry.endsWith('.yaml')) continue` for disciplines dir。
**Warning signs:** setup --dry-run 输出 "disciplines-karpathy" / "judgments-strategic-gate" 等 false-positive name。

### Pitfall 4: 4 master orchestrator + 14 sub-stage = 18 yaml × cross-deps Recon 复杂度爆炸
**What goes wrong:** capabilities-researcher 改 1 个 entry name → 14 sub-stage yaml + 4 master yaml 同时需更新, 漏 1 个 silent 不匹配 fail。
**Why it happens:** declarative SoT pattern 的固有 cost; v3.0 scope 4 倍于 v2.0。
**How to avoid:**
  1. `check-workflow-schema.mjs` extend cross-validate: 扫所有 workflow yaml 的 `tools_available` + `invokes_tools[].tool`, assert 全 in capabilities.yaml entry list
  2. `disciplines_applied[]` 同样 assert 全 in disciplines/*.yaml basename list
  3. CI A7 step 加 cross-validate (sister Phase 2.4 STRIDE T-2.2-02 strict additionalProperties pattern)
**Warning signs:** CI red on "tools_available references unknown capability" — desired guard。

### Pitfall 5: Pure Bundled v2 → v3 ungrade UX 撕裂
**What goes wrong:** 用户跑 `npm install -g harnessed@3.0` + `harnessed setup --apply` → 旧 `~/.claude/skills/plan-feature/` 仍在 → 用户 invoke `/plan-feature` 还能跑老 yaml → 困惑。
**Why it happens:** D-04 LOCKED "Pure ship v3 deprecate v2 — release-notes-only migration"; harnessed setup 不 auto-clean。
**How to avoid:** setup v3 输出 explicit deprecation block (Area 4 末) + CHANGELOG [3.0.0] 顶部 BREAKING 黑体 + `harnessed doctor` 加 v2 skill detection warn。
**Warning signs:** Dogfood Phase 3.5 cycle 1 验证 — auto remove vs manual prompt 二次确认。

---

## Code Examples

### Example 1 — Cross-validate `tools_available` against `capabilities.yaml` (scripts/check-workflow-schema.mjs extend)

```javascript
// scripts/check-workflow-schema.mjs v3 extend (Phase 3.3 ship)
import { readFile, readdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { parse as parseYaml } from 'yaml'

const workflowsDir = resolve('workflows')

// Step 1: build capabilities entry name set
const capsRaw = await readFile(join(workflowsDir, 'capabilities.yaml'), 'utf8')
const caps = parseYaml(capsRaw)
const capNames = new Set(Object.keys(caps.capabilities))

// Step 2: build disciplines basename set
const discFiles = await readdir(join(workflowsDir, 'disciplines'))
const discBasenames = new Set(discFiles.filter(f => f.endsWith('.yaml')).map(f => f.replace('.yaml', '')))

// Step 3: walk workflow yaml tree + cross-validate
const errors = []
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    if (e.isDirectory()) await walk(join(dir, e.name))
    else if (e.name === 'workflow.yaml') {
      const yaml = parseYaml(await readFile(join(dir, e.name), 'utf8'))
      for (const tool of yaml.tools_available ?? []) {
        if (!capNames.has(tool)) errors.push(`${dir}/workflow.yaml: tools_available[] '${tool}' not in capabilities.yaml`)
      }
      for (const d of yaml.disciplines_applied ?? []) {
        if (!discBasenames.has(d)) errors.push(`${dir}/workflow.yaml: disciplines_applied[] '${d}' not in disciplines/`)
      }
      for (const phase of yaml.phases ?? []) {
        for (const it of phase.invokes_tools ?? []) {
          if (!capNames.has(it.tool)) errors.push(`${dir}/workflow.yaml phase ${phase.id}: invokes_tools[].tool '${it.tool}' not in capabilities.yaml`)
        }
      }
    }
  }
}
await walk(workflowsDir)
if (errors.length) {
  console.error('Cross-validate errors:\n  ' + errors.join('\n  '))
  process.exit(1)
}
console.log(`✓ workflow yaml cross-validate OK (${capNames.size} caps, ${discBasenames.size} disciplines)`)
```

### Example 2 — Master Orchestrator runRouting Integration (sister `src/workflow/run.ts`)

```typescript
// src/workflow/run.ts v3 patch (sister Phase 2.4 W1.1 SHIPPED + v3.0-3.5 extend)
import { runMasterOrchestrator } from './masterOrchestrator.js'

export async function runWorkflow(workflowName: string, context, packageRoot) {
  // Master vs sub detection: master at workflows/<stage>/auto/workflow.yaml
  if (['discuss', 'plan', 'task', 'verify'].includes(workflowName)) {
    return runMasterOrchestrator(workflowName as MasterName, context, packageRoot)
  }
  // Sub OR standalone: load yaml + run phases per v2 sister pattern
  return runSubOrStandalone(workflowName, context, packageRoot)
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 5-phase /plan-feature flat | 4-stage master/sub nested | v3.0 (2026-05-20) | BREAKING — alias map required |
| 9-phase /verify-work flat | 7-sub /verify master | v3.0 | BREAKING |
| 4-phase /execute-task flat | 4-sub /task master | v3.0 | BREAKING |
| `behavioral_layer` (D-05 prelim) | `disciplines_applied` (D-09 final) | Phase 3.2 Wave A | Schema field rename — D-09 wins |
| Capability `category: behavioral` (D-08 v2.0 prelim) | `category: discipline` (D-09 v3.0) | Phase 3.2 Wave A | Enum value rename — D-09 wins |
| Flat `workflows/<name>/` scan | Nested 2-level `workflows/<stage>/<sub>/` scan | v3.0 setup.ts patch | Backward-compat handled by scan logic |

**Deprecated / outdated:**
- v2 `WorkflowSchemaV2` 沿用 v3 (engine 仍 parse v2 fixtures, but `harnessed setup` 不 install v2 SKILL.md to user dir)
- v2 `/plan-feature` / `/execute-task` / `/verify-work` slash cmd (DROP per D-04)

---

## Assumptions Log

> Claims tagged `[ASSUMED]` — needs user confirmation OR cross-team validation before Wave B lock.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `disciplines_applied` 命名 final wins over `behavioral_layer` (D-05/D-09 reconcile) | Area 1 Schema | LOW — naming only, no logic impact; 但若 disciplines-researcher 用 `behavioral_layer` 则需 reconcile |
| A2 | `tools_available` 用 capabilities.yaml entry name (NOT cmd, NOT impl) lookup key | Area 1 Schema | MEDIUM — capabilities-researcher 确认中, 假设 sister v2 模板引用一致 |
| A3 | Master orchestrator 用 Hybrid Option C (declarative `delegates_to` + engine dispatcher) | Area 3 | LOW — planner Wave B 二次决策 final |
| A4 | gstack 30+ optional 命名 = `gstack-<bare-cmd>` (e.g. `gstack-design-shotgun`) | Area 2 | MEDIUM — capabilities-researcher confirm 中 |
| A5 | `gstack-retro` 是 capabilities.yaml v3 NEW entry (retro/workflow.yaml refs) | Area 2 Standalone yaml | MEDIUM — capabilities-researcher confirm |
| A6 | `phase.is_complex_architecture` / `phase.is_critical_module` 等 phase fact 是 judgments NEW gate input | Area 2 Master yaml | LOW — sister v2 `phase.is_critical_module` 已 ship verify-work, v3 复用 |
| A7 | `schemaVersion.ts` 加 17th surface `workflow_v3` + 18th `discipline` + 19th `capabilities_v2` | Area 1 Schema | LOW — sister Phase 2.4 16 surface pattern verbatim extend |
| A8 | `setup.ts` 不 auto-remove v2 skill dir, manual prompt | Area 4 Backward Compat | MEDIUM — UX 决策 planner Wave B 二次锁 |
| A9 | judgments 新 phase-gate triggers: `is-complex-architecture` / `is-critical-module` / `has-ui-changes` / `has-auth-or-secrets` / `has-design-changes` | Master + Sub yaml | MEDIUM — Phase 3.3 schema 实装时新 judgments yaml content |
| A10 | dogfood Phase 3.5 (sister Phase 2.5 5-cycle 46-fixture pattern) 缩为 4 cycle (1 per stage), ~30+ fixture | Specifics | LOW — Phase 3.5 scope, planner 决定 |

**Total assumptions:** 10 — 全 LOW/MEDIUM, 无 HIGH risk。Wave B planner reconcile 在 task_plan.md 加 1 dedicated task。

---

## Open Questions (planner Wave B 决策)

1. **Q1 — `disciplines_applied` default ALL 6 = yaml omit 隐式 vs `[]` 显式?**
   - What we know: D-09 verbatim "default = all 6 enforced"
   - What's unclear: yaml `disciplines_applied:` field 完全 omit 时 = 全开? 还是 yaml 必须显式声明?
   - Recommendation: omit = ALL 6 (默认全开 sister 最小 yaml 写入成本); 显式 `[]` = 全关 (escape hatch); 显式 `[karpathy]` = 仅 karpathy 开

2. **Q2 — Master 是否需 `tools_available`?**
   - What we know: Sub-stage 必有 tools_available (per Area 2 yaml example)
   - What's unclear: Master 是 orchestrator, 不直接 invoke tool, 是否仍需 `tools_available` 字段 (aggregate sub union)?
   - Recommendation: Master `tools_available` 仅 declarative aggregate (Phase 3.5 dogfood 验证), schema 允许 optional, runtime 不强制读

3. **Q3 — `delegates_to` mode 默认值 (parallel vs serial)?**
   - What we know: schema `mode` 是 Optional
   - What's unclear: omit `mode` 时默认?
   - Recommendation: default `parallel` (sister CLAUDE.md "chain-isolation 链式互不前置" 铁律 verbatim — 不串行 dependency)

4. **Q4 — Master orchestrator delegate Path A (SDK query 直接 spawn) vs Path B (sub-shell harnessed CLI invoke)?**
   - What we know: 两路 sister Phase 2.5 dogfood 已 validated 各自模式
   - What's unclear: v3 master 选哪个? Path A 快 (no shell), Path B 隔离 context 更纯
   - Recommendation: Path A (SDK query) 默认, Path B fallback when SDK error (sister Phase 2.5 W2.3 错误降级 pattern)

5. **Q5 — 14 sub-stage SKILL.md 用 `name: <bare-slash-cmd>` (e.g. `name: discuss-strategic`) 还是 `name: <hierarchical>` (e.g. `name: discuss/strategic`)?**
   - What we know: D-02 LOCKED bare slash cmd
   - Recommendation: bare verbatim — `name: discuss-strategic` → Claude Code installs as `/discuss-strategic` (sister gstack/* SKILL.md pattern)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime + build | ✓ | 22.x (sister CLAUDE.md project context) | — |
| pnpm | Install | ✓ (corepack) | — | — |
| TypeBox 0.34+ | v3 schema | ✓ (v2.0 sister ship) | — | — |
| yaml | Parse | ✓ (v2.0 sister) | — | — |
| Claude Code CC 2.1.133+ | Agent Teams + master spawn SDK query | ✓ (Phase 2.4 W1 validated) | 2.1.133+ | parallelism-gate auto downgrade subagent fan-out |
| CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS env var | Pattern C multispec verify | ✓ (set true) | — | warn-only per sister Phase 2.3 W1.1 setup-helpers.ts L27 |

**Missing dependencies:** None — v3.0 不引入 NEW external dep (per Area 1 Standard Stack)。

---

## Validation Architecture

> nyquist_validation enabled (per `.planning/config.json` default)

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (sister project context v2.0 ship) |
| Config file | `vitest.config.ts` (sister Phase 2.4) |
| Quick run command | `pnpm exec vitest run --reporter=dot` |
| Full suite command | `pnpm exec vitest run` |

### Phase Requirements → Test Map (Wave A research subdomain)

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R30.1 | WorkflowSchemaV3 TypeBox validates 4 new fields | unit | `pnpm exec vitest run tests/workflow/schema-v3.test.ts` | Wave 0 (Phase 3.3 ship) |
| R30.1 | WorkflowSchemaV3 rejects unknown additionalProperties | unit | same as above | Wave 0 |
| R30.2 | masterOrchestrator.runMasterOrchestrator gate-evals + spawns | unit | `pnpm exec vitest run tests/workflow/masterOrchestrator.test.ts` | Wave 0 (Phase 3.5 ship) |
| R30.2 | masterOrchestrator serial order respects `order` field | unit | same as above | Wave 0 |
| R30.3 | 14 sub-stage workflow.yaml lint pass | integration | `node scripts/check-workflow-schema.mjs` | Wave 0 (Phase 3.3 extend) |
| R30.4 | 2 standalone (research v3, retro NEW) workflow.yaml lint pass | integration | same as above | Wave 0 |
| R30.5 | scanWorkflowsWithSkill returns flat name + nested relPath | unit | `pnpm exec vitest run tests/cli/setup-helpers.test.ts` | Wave 0 (Phase 3.3 extend) |
| R30.5 | v2 legacy /plan-feature 等 scan warn + skip install | unit | same as above | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm exec vitest run --reporter=dot` + biome check (sister CLAUDE.md "Biome lint preempt" memory)
- **Per wave merge:** `pnpm exec vitest run` (full suite)
- **Phase gate:** Full suite green + `node scripts/check-workflow-schema.mjs` cross-validate + Phase 3.5 dogfood 4-cycle 完成

### Wave 0 Gaps
- [ ] `tests/workflow/schema-v3.test.ts` — Phase 3.3 ship covers R30.1
- [ ] `tests/workflow/masterOrchestrator.test.ts` — Phase 3.5 ship covers R30.2
- [ ] `tests/cli/setup-helpers.test.ts` extend — Phase 3.3 covers R30.5 (sister v2.0 已 ship + extend)
- [ ] `scripts/check-workflow-schema.mjs` cross-validate extend — Phase 3.3 ship covers R30.3 + R30.4

---

## Security Domain

> security_enforcement enabled (absent in config = enabled per default)

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A — harnessed 无 user auth |
| V3 Session Management | no | N/A |
| V4 Access Control | no | N/A |
| V5 Input Validation | **yes** | TypeBox strict `additionalProperties: false` (sister Phase 2.2 STRIDE T-2.2-02 verbatim) — all 20 workflow yaml + disciplines + capabilities + judgments schema strict |
| V6 Cryptography | no | N/A |

### Known Threat Patterns for v3 scope

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious workflow yaml injection (3rd-party) | Tampering | Pure bundled D-01 (NO user override) + strict schema validate; doctor check origin |
| `tools_available` referencing non-existent capability | Tampering | `check-workflow-schema.mjs` cross-validate (Pitfall 4 mitigation) |
| Master orchestrator infinite loop (master invokes master) | DoS | Engine guard: master can only delegate sub OR standalone, NOT another master; check via name allow-list ['discuss', 'plan', 'task', 'verify'] |
| Discipline yaml escapes (rules read but not enforced) | Repudiation | doctor pre-commit hook fire + audit log (Phase 3.5 dogfood validate) |

---

## Sources

### Primary (HIGH confidence)
- `[VERIFIED: read]` `.planning/phase-v3.0-3.1/3.1-CONTEXT.md` — 13 D-decision LOCKED batch 1+2
- `[VERIFIED: read]` `.planning/phase-v3.0-3.1/3.1-DISCUSSION-LOG.md` — 9-Q&A trail
- `[VERIFIED: read]` `~/.claude/CLAUDE.md` — 4-stage cadence prose 原型 verbatim
- `[VERIFIED: read]` Obsidian doc `我的 Claude Code 开发方案*.md` 176L — gstack 介入节点 + 测试 3-layer + Pattern A/B/C
- `[VERIFIED: read]` `src/workflow/schema/workflow.ts` v2 86L — WorkflowSchemaV2 baseline
- `[VERIFIED: read]` `src/workflow/judgmentResolver.ts` 98L — 4-level ref resolver
- `[VERIFIED: read]` `src/workflow/schema/judgment.ts` 86L — JudgmentTrigger + Rules schema
- `[VERIFIED: read]` `workflows/plan-feature/workflow.yaml` v2 82L — sister 5-phase pattern
- `[VERIFIED: read]` `workflows/execute-task/phases.yaml` v2 74L — sister 4-phase pattern
- `[VERIFIED: read]` `workflows/verify-work/workflow.yaml` v2 143L — sister 9-phase pattern
- `[VERIFIED: read]` `workflows/research/workflow.yaml` v2 19L — sister standalone pattern
- `[VERIFIED: read]` `workflows/verify-work/SKILL.md` v2 92L — sister SKILL.md frontmatter pattern
- `[VERIFIED: read]` `workflows/capabilities.yaml` v2 414L — 39 entry baseline
- `[VERIFIED: read]` `workflows/judgments/parallelism-gate.yaml` 47L — D-10 L5b SoT
- `[VERIFIED: read]` `src/cli/setup.ts` v2 139L — Pure bundled install pattern
- `[VERIFIED: read]` `src/cli/lib/setup-helpers.ts` 128L — scan logic baseline

### Secondary (MEDIUM confidence — cross-team pending)
- `[PENDING: SendMessage capabilities-researcher]` — capabilities.yaml v3 final ~70 entry list + gstack 30+ naming
- `[PENDING: SendMessage disciplines-researcher]` — disciplines/*.yaml final 6 basename + TypeBox schema surface

### Tertiary (no LOW confidence claims)
- (None — all factual claims either VERIFIED via read OR PENDING cross-team reconcile)

---

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — TypeBox + yaml + expr-eval 全 sister v2.0 已 ship
- v3 Schema design: **HIGH** — 4 NEW field extend sister v2 surface, naming reconcile D-05↔D-09 已 lock
- 20 workflow yaml content: **HIGH** — 沿用 v2 plan-feature / execute-task / verify-work 三个 reference verbatim pattern
- Master orchestrator delegation: **MEDIUM** — Hybrid Option C 推荐, planner Wave B 二次决策 Path A vs B
- Nested dir scan logic: **HIGH** — fs.readdir 2-level + flat name flatten 是 well-trodden pattern (gstack/* sister)
- Cross-team API contract: **MEDIUM** — capabilities + disciplines pending reply, Wave B reconcile task 已规划
- Common pitfalls: **HIGH** — 5 pitfall 全有 specific 缓解 path

**Research date:** 2026-05-20
**Valid until:** 2026-06-19 (~30 days, stable schema once cross-team reconcile complete)

**Output file:** `.planning/phase-v3.0-3.2/RESEARCH-workflows.md` (this file, ~570 line)

---

*Wave A workflows-researcher SHIP*
*Sister teammates: capabilities-researcher + disciplines-researcher (Pattern A 全栈三路)*
*Next: team-lead 收集 3 RESEARCH-*.md → Wave B planner consume*

---

## ADDENDUM A — Cross-Team Reconcile (post-Wave A SendMessage exchange)

**Source:** Live reply received from `capabilities-researcher` (green) + `disciplines-researcher` (yellow) 2026-05-20 mid Wave A。Below is the **delta applied** to the initial RESEARCH (Area 1 + Area 2 已 surgical patch via sed)。

### A.1 — disciplines-researcher LOCKED (verbatim adopt)

6 basename **LOCKED verbatim** as `[karpathy, output-style, language, operational, priority, protocols]`。我假设 (Area 1 + Area 2) 与 LOCK 一致 ✓ no change needed。

**Schema improvement (apply Phase 3.3 实装时):**

Replace my preliminary `Type.Optional(Type.Array(Type.String()))` with strict literal union per disciplines-researcher reply:

```typescript
// Phase 3.3 W0 实装 (revised post-reconcile, src/workflow/schema/workflow.ts v3 ~135L)
const DisciplineName = Type.Union([
  Type.Literal('karpathy'),
  Type.Literal('output-style'),
  Type.Literal('language'),
  Type.Literal('operational'),
  Type.Literal('priority'),
  Type.Literal('protocols'),
])

export const WorkflowSchemaV3 = Type.Object({
  // ... (other fields unchanged from Area 1)
  disciplines_applied: Type.Optional(Type.Array(DisciplineName)),  // strict literal — invalid name fail-fast at schema check
  // ... (other fields unchanged)
})
```

**Rationale:** strict union 让 `node scripts/check-workflow-schema.mjs` 在 yaml 写错 basename (typo) 时直接 fail (sister Phase 2.2 STRIDE T-2.2-02 strict additionalProperties pattern verbatim), 不留 runtime error。

**Runtime engine wedge hook points** (disciplines-researcher 反馈, 我 masterOrchestrator.ts 草案需加):

| Hook point | When | Action |
|------------|------|--------|
| `before-phase-execute` | 每 phase 启动前 | `loadDisciplines(yaml.disciplines_applied ?? ALL_6)` 进 phase context |
| `before-spawn` | tool/capability 选择前 | `priority.yaml` 仲裁 (multi-capability 同 fire) |
| `before-commit` | git commit hook | `operational.biome_preempt` enforce (sister project memory `biome-preempt.md`) |
| `after-output` | LLM output 后 | `output-style` BLUF + no-emoji + no-em-dash validate |

masterOrchestrator.ts (Area 3 sketch ~120L) extend ~30L 加 hook integration point (sister Phase 3.5 实装 task)。

**Schema version surface count revised:** my Area 1 假设 19 surface, disciplines-researcher confirm:
- 16 (v2.0 sister) + 17 `workflow.v3` (workflows-researcher) + 18 `discipline.v1` (disciplines-researcher) = **18 surface** post v3.0 ship
- 我之前 19 surface 错算 (`capabilities_v2` 是 capabilities-researcher bump, 但确认是同一 schema 内 `category` field add, NOT NEW surface bump per sister Phase 2.4 W0.1 backfill pattern — final reconcile pending)

### A.2 — capabilities-researcher LOCKED (delta apply)

Final ~70 entry list 提供 (7 category 分组), apply 关键 delta:

#### Delta 1: `tdd` 单独算 superpowers core, NOT mattpocock 12

My Summary 写 "mattpocock 12", capabilities-researcher 写 "mattpocock 11 + superpowers core 2" (含 tdd)。**Revise:** 11 mattpocock + 2 superpowers core (tdd + superpowers-brainstorming) + NEW `superpowers-subagent-driven-development` entry 补 (parallelism-gate.yaml 已 ref 但 v2 entry 漏)。

#### Delta 2: gstack 30 optional NO `gstack-` prefix (大多)

我 ROLLBACK 已修复 — gstack **6 core wrapped** 保留 `gstack-` prefix (gstack-office-hours / gstack-plan-ceo-review / gstack-plan-eng-review / gstack-review / gstack-qa / gstack-cso / gstack-design-review), **30 optional 无 prefix** (e.g. `design-consultation` / `autoplan` / `codex` / `benchmark` / `design-shotgun` / `design-html` / `browse` / `ship` / `land-and-deploy` / `canary` / `document-release` / `document-generate` / `careful` / `guard` / `freeze` / `unfreeze` / `gstack-upgrade` / `learn` / `make-pdf` 等), alias 加 `-gstack` 后缀 (e.g. `retro-gstack` / `investigate-gstack` 与 mattpocock `/investigate` 区分)。

**Revise retro/workflow.yaml** (Area 2 末) — `gstack-retro` → `retro-gstack`:

```yaml
# workflows/retro/workflow.yaml v3 (revised post-reconcile)
phases:
  - id: 01-retro
    upstream: gstack
    capability: '{{ capabilities.retro-gstack.cmd }}'   # alias suffix per capabilities-researcher
    model: opus
```

#### Delta 3: NEW capabilities v3 entry (我 RESEARCH 漏的)

- `gws` (NEW v3, tool-cli) — D-11 NEW `judgments/google-workspace.yaml` cross-deps; 我 Area 2 yaml 未 ref (research workflow 可加 tools_available, planner Wave B 决策)
- `gsd-research-phase` (NEW W2 SHIPPED — sister Phase 2.4 W2 ship "gsd-* 2 capabilities"); 我 Area 2 research/workflow.yaml 未 ref, planner Wave B 决策是否 wire 进 02-synth phase
- `superpowers-subagent-driven-development` (NEW v3, 补漏)
- `playwright-cli` + `webapp-testing` 由 `tool-slash-cmd` → `tool-bundled-skill` (impl reclassify)

#### Delta 4: category enum 7 value (per D-08) revise

我 Area 1 表写 "`discipline` (NEW)", capabilities-researcher 反馈 `category: behavioral` (sister v2.0 命名), karpathy-guidelines + 5 NEW discipline-ref 虚拟 entry 都用 `category: behavioral`。

**Final category enum (sister Phase 2.4 W0.1 schema surface convention):**
```
behavioral | tool-slash-cmd | tool-mcp | tool-cli | tool-plugin | tool-bundled-skill | agent-platform
```

我 Area 1 Schema Decision table "discipline" 实为 "behavioral" — 修订 (D-09 在 disciplines/*.yaml 用 `harnessed.discipline.v1` schema surface, capabilities.yaml 用 `category: behavioral` 标记 ref entry, 两者并行 not 替换)。

#### Delta 5: workflow.yaml v3 `tools_available` field cross-validate strict mode

capabilities-researcher reply confirm 我假设 1 (entry name as lookup key) ✓; 但建议 strict mode — Phase 3.3 实装时 `scripts/check-workflow-schema.mjs` cross-validate **每个** `tools_available[]` 元素必须在 `capabilities.yaml` entry name set 内, 不在 → fail-fast (sister Pitfall 4 mitigation Area 5 Example 1)。我 Area 5 Example 1 code 已 sketch, planner Wave B 加 task。

### A.3 — Outstanding (Wave B planner action)

| Item | Action | Owner |
|------|--------|-------|
| `workflow.yaml v3 disciplines_applied` 用 strict Literal Union (A.1) | Apply Phase 3.3 实装 | planner Wave B → Phase 3.3 task |
| `retro/workflow.yaml` 用 `retro-gstack` (A.2 Delta 2) | Apply Phase 3.4 实装 | planner Wave B → Phase 3.4 task |
| Schema version surface count 18 (NOT 19) post-reconcile (A.1) | Apply schemaVersion.ts patch | planner Wave B → Phase 3.3 task |
| capabilities `category: behavioral` (NOT `discipline`) per A.2 Delta 4 | capabilities.yaml v3 backfill | capabilities-researcher Wave B (now) |
| Cross-validate strict mode (`check-workflow-schema.mjs`) extend | Phase 3.3 实装 | planner Wave B → Phase 3.3 task |
| Hook integration in `masterOrchestrator.ts` (A.1 4 wedge) | Phase 3.5 实装 | planner Wave B → Phase 3.5 task |

### A.4 — RESEARCH Surface Patch Log (this section's sed/edit history)

- `2026-05-20T<time>` — `sed -i` rollback restored `gstack-` prefix for 6 core wrapped (Bash run 1+2)
- `2026-05-20T<time>` — Capability ref count verify post-rollback: 24 occurrence at `capabilities.gstack-*.cmd` ✓
- `2026-05-20T<time>` — This Addendum A appended

**Final RESEARCH-workflows.md state:** 1631 line; 20 workflow yaml example 全集 + WorkflowSchemaV3 TypeBox + nested scan logic + masterOrchestrator.ts sketch + 5 pitfall + cross-team reconcile addendum。

*Wave A workflows-researcher SHIP (post cross-team reconcile)*

---

## ADDENDUM B — Final Reconcile (post-disciplines-researcher 2nd ACK)

**Trigger:** disciplines-researcher 2026-05-20 second reply ACK 3 delta + 2 confirm。

### B.1 — Surface count 18 LOCKED final

**Confirmed:** 18 surface post v3.0 ship final, **capabilities.v1 NOT bump** (per disciplines-researcher 2nd reply applying sister Phase 2.2 W2 D-16 rule (c) "新 Optional field 不 bump surface, 仅 nested OR Optional add"):

| # | Surface | Owner | Note |
|---|---------|-------|------|
| 16 | (existing 16 v2.0 sister) | Phase 2.4 W0.1 SHIPPED | unchanged |
| 17 | `harnessed.workflow.v3` | workflows-researcher (me) | NEW v3 schema bump |
| 18 | `harnessed.discipline.v1` | disciplines-researcher | NEW L0 substrate |

`harnessed.capabilities.v1` 保持不动 (NEW Optional field `category` + `discipline_ref` 仅 conditional require)。

### B.2 — Category enum value 双 fallback

**Confirmed by disciplines-researcher 2nd reply:** capabilities.yaml `category:` enum value 可用 **`discipline`** (D-09 命名更精确) OR **`behavioral`** (v2.0 sister 命名沿用), runtime engine 同 path:

```typescript
// Runtime engine — sister Phase 3.5 实装 (masterOrchestrator.ts hook integration)
if (entry.category === 'discipline' || entry.category === 'behavioral') {
  // walk discipline_ref → load disciplines/<basename>.yaml → apply hooks
  return loadDiscipline(entry.discipline_ref)
}
// else cmd invoke path
return invokeCapability(entry.cmd, args)
```

**workflows-researcher (me) RESEARCH 选择:** Addendum A.2 + B.2 写 `category: behavioral` (preserve v2 sister continuity, minimize capabilities-researcher entry rename); 但 disciplines-researcher RESEARCH 选 `category: discipline` 也 valid。planner Wave B 二次决策 final enum value (sister Phase 3.3 W0 task), 1 task ~5 min reconcile。

### B.3 — Conditional require schema (capabilities.yaml v3)

**disciplines-researcher 建议:** `category=discipline|behavioral` → `discipline_ref` MUST present; 其他 category → `discipline_ref` MUST absent (escape hatch via TypeBox `Type.Union([Type.Composite([...]), Type.Composite([...])])` discriminated union pattern, sister judgment.ts L79 `JudgmentTriggersFile vs JudgmentRulesFile` discriminated union pattern verbatim)。

**Schema sketch** (capabilities-researcher Wave B 实装):

```typescript
// src/workflow/schema/capabilities.ts v3 patch (Phase 3.3 ship)
const CapabilityEntryBase = Type.Object({
  impl: Type.String(),
  cmd: Type.Optional(Type.String()),                // discipline ref 没 cmd
  since: Type.String(),
  description: Type.String(),
  fires_when: Type.Optional(Type.Array(Type.String())),
  // ... (existing 8 field)
}, { additionalProperties: false })

const DisciplineCapabilityEntry = Type.Composite([
  CapabilityEntryBase,
  Type.Object({
    category: Type.Union([Type.Literal('discipline'), Type.Literal('behavioral')]),
    discipline_ref: Type.String({ pattern: '^workflows/disciplines/[a-z-]+\.yaml$' }),
  }, { additionalProperties: false }),
])

const ToolCapabilityEntry = Type.Composite([
  CapabilityEntryBase,
  Type.Object({
    category: Type.Union([
      Type.Literal('tool-slash-cmd'),
      Type.Literal('tool-mcp'),
      Type.Literal('tool-cli'),
      Type.Literal('tool-plugin'),
      Type.Literal('tool-bundled-skill'),
      Type.Literal('agent-platform'),
    ]),
    // discipline_ref MUST absent — additionalProperties:false guards
  }, { additionalProperties: false }),
])

export const CapabilityEntry = Type.Union([DisciplineCapabilityEntry, ToolCapabilityEntry])
```

**Validation invariant:** TypeBox `Type.Union` + `additionalProperties: false` 强制 discriminated union — `category=discipline|behavioral` 必带 `discipline_ref`, 其他 category 必无 `discipline_ref` (写错 = schema fail)。Sister judgment.ts L79 pattern verbatim。

### B.4 — Pattern A 三路全栈 Wave A 结束

| Teammate | Ship | Confirmed cross-deps |
|----------|------|---------------------|
| workflows-researcher (me) | RESEARCH-workflows.md 1746L (this + 2 addenda) | disciplines basename × 6, capabilities entry × 70 |
| capabilities-researcher | RESEARCH-capabilities.md (ship in ~30 min per 1st reply) | tools_available ref, category enum, discipline_ref |
| disciplines-researcher | RESEARCH-disciplines.md (ship in ~5 min per 2nd reply) | 6 basename, 18 surface, hook 4 wedge, conditional require schema |

3 RESEARCH 互相 cross-validate complete; team-lead 收齐 → Wave B planner consume → task_plan.md ~50-70 task spans Phase 3.3 + 3.4 + 3.5 + 3.6。

*Pattern A 全栈三路 Wave A SHIP ✓*

---

## ADDENDUM C — Pattern A 三路 Wave A FINAL CLOSE

**Trigger:** capabilities-researcher 2026-05-20 2nd reply ACK 5 delta + ship RESEARCH-capabilities.md 932L.

### C.1 — Final 3 LOCKED post 3-round reconcile

| Item | LOCKED value | Source |
|------|--------------|--------|
| disciplines basename × 6 | `[karpathy, output-style, language, operational, priority, protocols]` | disciplines-researcher 1st reply (A.1) |
| capabilities `category` enum (behavioral entry) | `behavioral` (D-08 verbatim, 沿用 v2 sister 命名) | capabilities-researcher 2nd reply (C.1) |
| schemaVersion.ts surface count | **18** (capabilities.v1 NOT bump) | disciplines-researcher 2nd reply (B.1) |
| gstack 6 core wrapped prefix | `gstack-` prefix retained (24 occurrence rollback) | capabilities-researcher 2nd reply (C.1) |
| gstack 30 optional naming | NO prefix bare (`autoplan` / `codex` / `design-shotgun` 等) + 2 alias `-gstack` suffix (`retro-gstack` / `investigate-gstack`) + 2 例外保留原样 (`open-gstack-browser` / `gstack-upgrade`) | capabilities-researcher 2nd reply (C.1) |
| mattpocock count | **11** (NOT 12 — tdd 计入 superpowers core 2) | capabilities-researcher 2nd reply (C.1) |
| Behavioral entry sentinel cmd | `cmd: '<not-applicable-behavioral>'` (runtime SKIP invoke, load discipline_ref) | capabilities-researcher 2nd reply NEW (C.1) |
| Cross-validate strict contracts | **3** contracts (tools_available + disciplines_applied + judgments invokes capability) | capabilities-researcher 2nd reply NEW (C.1) — Risk R3 mitigation |

### C.2 — Cross-validate strict contract (capabilities-researcher 提议 3 contract)

`scripts/check-workflow-schema.mjs` Phase 3.3 W0 实装 extend, **3 strict cross-validate contracts**:

```javascript
// scripts/check-workflow-schema.mjs v3 extend (Phase 3.3 W0 ship, sister Area 5 Example 1 expand)
const capNames = new Set(Object.keys(yaml.parse(await readFile('workflows/capabilities.yaml', 'utf8')).capabilities))
const discBasenames = new Set(
  (await readdir('workflows/disciplines'))
    .filter(f => f.endsWith('.yaml'))
    .map(f => f.replace('.yaml', ''))
)
const errors = []

// Contract 1: workflow.yaml.tools_available[] ⊂ capabilities entry set
for (const tool of workflowYaml.tools_available ?? []) {
  if (!capNames.has(tool)) errors.push(`${path}: tools_available[] '${tool}' not in capabilities.yaml`)
}

// Contract 2: workflow.yaml.disciplines_applied[] ⊂ 6 discipline basename set
for (const d of workflowYaml.disciplines_applied ?? []) {
  if (!discBasenames.has(d)) errors.push(`${path}: disciplines_applied[] '${d}' not in disciplines/`)
}

// Contract 3 (NEW per capabilities-researcher 2nd reply): judgments/*.yaml triggers.*.invokes[].capability ⊂ capabilities entry set
for (const jFile of await glob('workflows/judgments/*.yaml')) {
  const j = yaml.parse(await readFile(jFile, 'utf8'))
  for (const [tName, t] of Object.entries(j.triggers ?? {})) {
    for (const inv of t.invokes ?? []) {
      if (!capNames.has(inv.capability)) {
        errors.push(`${jFile}: triggers.${tName}.invokes[].capability '${inv.capability}' not in capabilities.yaml`)
      }
    }
  }
}
```

**Why Contract 3 important:** sister parallelism-gate.yaml L17 + L32 等 `invokes: - capability: <name>` ref capabilities entry name; v2.0 SHIPPED 时无 strict check, 个别 entry 缺 backfill (e.g. `superpowers-subagent-driven-development` v2 ref 但 entry 漏 — capabilities-researcher 2nd reply confirm NEW v3 补齐)。Risk R3 v3.0 ship 前必须 mitigation。

### C.3 — Final Pattern A 三路 ship state

| Teammate | RESEARCH file | Lines | Status |
|----------|---------------|-------|--------|
| workflows-researcher (me) | RESEARCH-workflows.md | 1837 (post C addendum: ~1900L) | ✓ FINAL SHIP |
| capabilities-researcher | RESEARCH-capabilities.md | 932 | ✓ FINAL SHIP |
| disciplines-researcher | RESEARCH-disciplines.md | ~500 (pending — last ETA ~5min from 2nd ACK) | ETA imminent |

**Pattern A 全栈三路 Wave A complete:** 3 RESEARCH cross-validated, 0 unresolved cross-deps, ready for team-lead batch commit + Wave B planner consume。

### C.4 — Final outstanding for planner Wave B (8 reconcile task — updated)

| # | Item | Phase 实装 | Source |
|---|------|----------|--------|
| 1 | disciplines_applied strict Literal Union (6 basename) | 3.3 | A.1 |
| 2 | schemaVersion 18 surface (capabilities.v1 NOT bump) | 3.3 | A.1 + B.1 |
| 3 | capabilities `category: behavioral` final (D-08 verbatim, sentinel cmd `<not-applicable-behavioral>`) | 3.3 | A.2 + C.1 |
| 4 | capabilities discriminated union schema (`DisciplineCapabilityEntry` vs `ToolCapabilityEntry`) | 3.3 | B.3 |
| 5 | retro yaml entry name `retro-gstack` (alias suffix) | 3.4 | A.2 + C.1 |
| 6 | **`check-workflow-schema.mjs` 3 strict cross-validate contracts** (NEW Contract 3) | 3.3 W0 | A.2 + C.2 |
| 7 | masterOrchestrator.ts 4 wedge hook integration | 3.5 | A.1 |
| 8 | Master Path A (SDK query) vs Path B (sub-shell) final 决策 | 3.5 dogfood | RESEARCH § Area 3 |

*Pattern A 全栈三路 Wave A FINAL SHIP ✓ — 2026-05-20*
