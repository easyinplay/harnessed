# ADR-0011: execute-task workflow + ralph-loop SDK introduction + dual-signal completion + per-phase model tier + Wave 0 transparency gate flip + schemaVersion + provenance gate + Task Session 复用 (phase 2.2 — 9 章节 errata 合并)

## Status

**Accepted (phase 2.2 W6 — 2026-05-15)** — phase 2.2 plan-phase Wave 0 sketch（T0.2）→ Wave 6 fill-out（T6.1）→ Accepted at phase 2.2 ship。

> Phase 2.2 execute-task workflow + ralph-loop full integration 的合并 ADR — 沿袭 ADR 0008 / 0009 / 0010 多决策合并 errata 模式（B-20 lock）。**2026-05-15 discuss-phase delta absorbed**：原 6 章节扩 9 章节（加 § 7 SchemaVersion / § 8 Provenance gate / § 9 Task Session 复用）。**T4.4 DEFERRED → v0.3.0 checkpoint 完整版**（T1.2 SC4 PARTIAL → B-35 fallback branch triggered；closure infra v0.3.0 ready）。

## Context

Phase 2.2 是 v0.2.0 sub-task loop 里程碑的核心 phase — 把 v0.1.0 routing engine v1 + Phase 2.1 ship 后的 6 install method runtime-ready 升级为「真实 SDK spawn subagent + ralph-loop 完整闭合」。实装 execute-task workflow 主线 4 phase chain（`01-clarify` → `02-code` → `03-test` → `04-deliver`），每子任务 verbatim COMPLETE 回流主流程。

并办 Phase 2.1 deferred — transparency CI gate `ENFORCE` flip 为 `true` + 全史 verdict 文档迁移到结构化 marker + reviewer 洞察的 CI gate freshness check 扩展（README/PROJECT-SPEC 状态节）— **一次性根治** transparency 反模式（phase 1.4 T1 + phase 1.5 H1/M1 连续 2 phase 复发后的结构性根治）。

**discuss-phase delta (2026-05-15)** absorbed 3 个 ⭐⭐+ items 来自 intel 3-project (OMC + omo + ECC) 扩展：CD-5 FULL schemaVersion 单一兼容门 (ECC ⭐⭐⭐)、CD-6 BEFORE-W4 provenance gate hard fail (ECC ⭐⭐)、CD-4 PIGGY-W1 Task Session 复用 conditional (omo ⭐⭐)。EE-4 plan 4 维量化阈值 schema (omo ⭐⭐) deferred → Phase 2.4 doctor 完整版 absorb OR 独立 phase 2.5。

本 ADR 覆盖 Phase 2.2 9 大决策线，合并入单 ADR（B-20）— 沿袭 phase 1.4 ADR 0008 多决策合并 errata 模式。ADR 编号 `0011` 由 phase 2.2 plan-phase Wave 0 实占（intel § 0 SSOT 引用纪律 + Phase 2.1 T1.9 CONTRIBUTING.md 项目级规则）— Phase 2.1 D-08 暂记 `0011` 仅参考，本 plan-phase 实占值与之一致。

### A7 守恒约束（ADR 0001-0010 main body 不可改）

phase 2.2 沿袭 ADR 0003 / 0005 / 0007 / 0008 / 0009 / 0010 errata 风格 — **不动 ADR 0001-0010 main body**（A7 守恒）。`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 14-字段 contract main body **不动** — contract v1.2 reconcile 仅通过本 ADR § Decision 4 inline 记录。本 ADR 0011 起 phase 2.2 ship 时刻 frozen；v0.2.3+ 演化走 ADR 0012+ errata。

## Decisions

### 1. SDK 引入 (B-04)

`@anthropic-ai/claude-agent-sdk` INTRODUCE NOW — phase-1.5 deferral 触发条件已满足（real spawn + dual-signal completion 都被它 hard-block；详 `.planning/research/v0.2.0-execute-task-ralph.md` § 1-3 HIGH conf）。

**Wave 1 实测（T1.1 + T1.2 SC4，commit `e03d1bc` + `fab49fe`）**：

- **SDK version anchor**：`@anthropic-ai/claude-agent-sdk@0.3.142`（`package.json` dependencies；`pnpm-lock.yaml` integrity verified by T1.4 smoke test `tests/sdk-import.smoke.test.ts`，commit `5a8a8ac1...` resolved hash）
- **AgentDefinition SDK input layer = 5 字段**（research baseline 写 4，T1.1 实测 `.d.ts` shape 含 `disallowedTools` 为 SDK 透传字段）：`description / tools? / disallowedTools? / prompt / model?` —— B-04 inline correction note (PATTERNS § 2.3)
- **prompt-inject layer = 9 字段**（research baseline 写 10，T1.1 实测 disallowedTools 已移至 SDK input layer，剩 9）：`skills / mcpServers / memory / maxTurns / background / effort / permissionMode / initialPrompt / criticalSystemReminder_EXPERIMENTAL`
- **SC1 / SC2 / SC3 verify outcome**：`outputFormat: { type: 'json_schema', schema: COMPLETION_SCHEMA }` ✅ accepted；`agents` map subagent definition ✅ accepted；`SDKResultMessage.structured_output` 字段 ✅ surface（type `unknown`，consumer narrow via `'structured_output' in result` type-guard，避 biome `noExplicitAny`）
- **SC4 verify outcome = PARTIAL**：`query()` options 有 `resume?: string`（SDK API 暴露），但 spike 测 resume 后 agent 状态保留情况 partial（session_id 透传 OK，但 memory + tools state 在 SDK 0.3.142 未完整保留）—— B-35 fallback branch triggered → CD-4 DEFERRED → v0.3.0 checkpoint 完整版（详 § 9）
- **Tier A / Tier B / Tier C 路径选定**：选 Tier A（PRIMARY structured_output + FALLBACK `<promise>COMPLETE</promise>` 双发射）；Tier B (`@anthropic-ai/sdk` 替代，未启) 仅作 v0.3.0 escape hatch；Tier C (自实装 IPC) reject（YAGNI）
- **lockfile diff lines**：`pnpm-lock.yaml` +143L（SDK 0.3.142 + 8 transitive deps）；`package.json` +1L
- **3-OS CI verify**：CI run 25928xxx 3 平台 ubuntu / macos / windows `success`（SDK ESM import smoke pass）
- **B-06 spike 文件**：`scripts/spike-outputFormat-agents.mjs` 在 T1.1 spike 后 **not committed**（throwaway）

### 2. ralph-wiggum keep (B-05)

`ralph-wiggum` 官方 plugin **不切换** — 官方 plugin interactive-TUI-Stop-hook-only + jq 依赖撞 Win 红旗（R6 closed）；`ralphLoopWrap` 自实装是**永久架构**。

**Wave 2 实测（T2.4，commit `e133f51`）**：

- **`src/routing/lib/ralphLoop.ts` 升级前 wc**：42L；**升级后 wc**：49L（≤50 hard limit B-26 守住，余量 1L）
- **isComplete 4-layer 签名**：`isComplete(output: string): boolean` —— 内部 try `JSON.parse(output)` 走 outer PRIMARY + outer FALLBACK；catch → inner FALLBACK raw string `extractPromise(output)`
- **`resumeSessionId` 闭包透传签名**：`ralphLoopWrap(maxIter, spawn: (resumeSessionId?: string) => Promise<string>, resumeSessionId?: string)` —— T4.1 sdkSpawn 接收 `options.resume` field
- **Win compat verify (B-31)**：3-OS CI matrix sentinel 全绿（ubuntu / macos / windows-latest 全 pass，无 jq 依赖，全 Node ESM 路径）
- **接 SDK callback 不替换 wrapper**：phase 2.2 升级 = `lib/sdkSpawn.ts` NEW + ralphLoop 加 `resumeSessionId` 透传 + `isComplete` 4-layer expand —— wrapper 主体 spawn → check → retry 三段保留

### 3. dual-signal completion 4-layer (B-02)

Completion = **4-layer dual-signal**（`.planning/phase-2.2/RESEARCH.md` § 1.3 refine CONTEXT D-02）:

| Layer | Signal | Source | Test cell ref |
|-------|--------|--------|---------------|
| **L1 Outer PRIMARY** | `subtype === 'success'` + `structured_output.status === 'COMPLETE'` | SDK `query()` `outputFormat: { type: 'json_schema', schema: COMPLETION_SCHEMA }` | `tests/routing/isComplete.test.ts` L1 (3 cells) |
| **L2 Outer FALLBACK** | `<promise>COMPLETE</promise>` extract on `env.text ?? env.result` | `promiseExtract.ts` (Phase 1.5 ship, 32L) | `isComplete.test.ts` L2 (3 cells) |
| **L3 Inner PRIMARY / FALLBACK** | subagent `<promise>` grep on raw string output（JSON.parse catch path） | `promiseExtract.ts` Tier A | `isComplete.test.ts` L3 (4 cells) |
| **L4 All-fail** | none of L1-L3 → return false → ralph-loop retry | (none — degraded path) | `isComplete.test.ts` L4 (4 cells) |

Outer schema constrains 主 agent 最终轮（PRIMARY 信号）；inner layer 是每个 `Task` spawn 独立 signal —— `<promise>` grep 在两层都 load-bearing（B-07 双 path 覆盖）。

**`COMPLETION_SCHEMA` inline (T2.2，`src/routing/completionSchema.ts`)**:

```typescript
export const COMPLETION_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['COMPLETE', 'PARTIAL', 'BLOCKED'] },
    phase: { type: 'string', enum: ['01-clarify', '02-code', '03-test', '04-deliver'] },
    summary: { type: 'string' },
    blockers: { type: 'array', items: { type: 'string' } },
  },
  required: ['status', 'phase'],
} as const
```

**`isComplete()` 调用 snippet** (`src/routing/lib/ralphLoop.ts`):

```typescript
export function isComplete(output: string): boolean {
  try {
    const env = JSON.parse(output) as SdkResultEnvelope
    if (env.subtype === 'success' && env.structured_output?.status === 'COMPLETE') return true  // L1
    return extractPromise(env.text ?? env.result ?? '') === 'COMPLETE'                          // L2
  } catch {
    return extractPromise(output) === 'COMPLETE'                                                // L3
  }
}
```

**Wave 5 实测 30 sample harness（T5.5，commit `16dbb4b`）**：mocked SDK 注 `structured_output.status='COMPLETE'` 路径 → 30/30 COMPLETE 100% rate（L1 命中；wiring round-trip 验证，非 real Claude inference）。SAMPLES.md § "known miss" empty。

### 4. contract v1.2 reconcile (B-01)

14 字段 `AgentDefinition` 类型 **byte-identical 不变**（harnessed factory-internal contract；`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 main body **不动** A7 守恒）；`query()` 调用前 unpack **5 字段**（T1.1 实测修正：原 research 写 4 字段）作 SDK 物理 input；其余 **9 字段**（T1.1 实测修正：原 research 写 10 字段，`disallowedTools` 已迁至 SDK input layer）通过 prompt template inject 拼入 SystemPrompt 上下文。

**Wave 2 实测（T2.1，commit `3ec2f32`，`src/routing/lib/sdkReconcile.ts` NEW = 56L）**：

```typescript
// SDK input layer — 5 字段（toSdkAgentDefinition unpack）
toSdkAgentDefinition(def: AgentDefinition): {
  description: string
  tools?: string[]
  disallowedTools?: string[]   // T1.1 finding — migrated from inject layer
  prompt: string
  model?: string
}

// Prompt-inject layer — 9 字段（injectFactoryInternalFields prepend）
injectFactoryInternalFields(def, basePrompt): string  // 沿 [skills / mcpServers /
                                                       //   memory / maxTurns / background /
                                                       //   effort / permissionMode /
                                                       //   initialPrompt /
                                                       //   criticalSystemReminder_EXPERIMENTAL]
```

**`agentDefinition.ts` 升级后 wc**：191L（不变 — reconcile fn 走 split `lib/sdkReconcile.ts` 56L per B-24 split 守护；H3 budget ≤200L 守住）。

**A7 守恒声明**：`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` main body 不动 — contract v1.2 errata 仅通过本 ADR § Decision 4 inline 记录。

### 5. per-phase model tier schema (B-08~B-13)

`workflows/<name>/phases.yaml` schema 加 `model:` **必填字段**（execute-task 主流程 phase 静态标 model）；**4 phase 默认表 final**（intel `.planning/intel/omc-comparison.md` 第 4 条 / CD-2 L106-127）：

| Phase ID | Model | Rationale |
|----------|-------|-----------|
| `01-clarify` | `opus` | 任务复杂度澄清 — 高推理需求 |
| `02-code` | `sonnet` | karpathy 心法 always-on — 代码生成 |
| `03-test` | `sonnet` | conditional TDD + mattpocock 招式 — 验证 |
| `04-deliver` | `haiku` | ralph-loop COMPLETE — 省 token 关键点 |

**Wave 3 实测（T3.1/T3.2/T3.3/T3.4，commits `97d4da2` → `b94e8bd`）**：

- **`src/workflow/schema/phases.ts`** = 50L（TypeBox 4-enum ModelTier `haiku / sonnet / opus / inherit`）
- **`src/workflow/loadPhases.ts`** = 30L（YAML parse + Value.Check direct path）
- **`workflows/execute-task/phases.yaml`** = 27L，4 phase × default tier
- **`tests/workflow/load-phases.test.ts`** = 106L，5 cells（valid / missing-model / non-4-enum / additionalProperties / inherit escape hatch）

**`--model-tier inherit` 解析 snippet** (CLI `src/cli/execute-task.ts`):

```typescript
const modelTier = opts.modelTier ?? 'auto'  // 'auto' = read phase.model; 'inherit' = skip phase.model
if (modelTier === 'inherit') agentDef.model = undefined  // 继承调用方 model
else if (modelTier === 'auto') agentDef.model = phase.model  // 读 phases.yaml
```

`--model-tier inherit` CLI flag = B-10 逃生口（不读 `phase.model`，继承调用方 model）；`agentFactory` 读 `phase.model` 填入 `AgentDefinition.model` —— zero new engine（intel "zero new engine" 理念）。

**GSD `/gsd-set-profile`（orchestration agent model）与 harnessed model tier（spawn subagent model）namespace 独立**（B-11）—— 文档明示，避免认知混淆。

### 6. Wave 0 transparency CI gate flip + freshness ext (B-14~B-19)

三动作 atomic（W3 lock 解除，phase 1.4 T1 + 1.5 H1/M1 连续 2 phase 复发后的结构性根治）:

1. **`scripts/check-transparency-verdicts.mjs` `ENFORCE = false` → `true`**（B-14, B-18 独立 atomic commit；T0.6 落地）
2. **13 verdict 文档 marker migration**（B-15 manual 1-by-1：10 ADD + 3 REPAIR — phase 1.1/1.2/1.3/1.4 PLAN-CHECK+VERIFICATION × 2 + 1.5 VERIFICATION + 2.1 VERIFICATION = 10 ADD；phase 1.5 PLAN-CHECK / v0.1.0 MILESTONE-AUDIT / 2.1 PLAN-CHECK = 3 REPAIR；T0.3 落地）
3. **Freshness ext 扩展**（B-16, B-17 RESEARCH § 3.5 +25L sketch；T0.4 落地）

**STATUS_MARKER regex（实测，`scripts/check-transparency-verdicts.mjs`）**:

```javascript
const STATUS_MARKER = /^\s*>?\s*\*{0,2}(?:Status|状态)\*{0,2}\s*[:：]\s*(.+)$/m
const FRONT_MATTER_DOCS = ['README.md', 'PROJECT-SPEC.md']  // simple base names
const ROADMAP_LATEST_RE = /^##\s+v\d+\.\d+\.\d+\s+—.*✅\s*SHIPPED/m
```

**`getLatestShippedToken()`** 读 `.planning/ROADMAP.md` 抽 latest `✅ SHIPPED` semver token；**`checkFreshness()`** 检测 `README.md` / `docs/PROJECT-SPEC.md` `Status:` marker 是否含 latest shipped token。

**`scripts/check-transparency-verdicts.mjs` 最终 wc**：75L（≤75 hard limit B-27 守住，T0.4-fix biome formatter auto-fix 后 71→75L）。

**Wave 0 必须最先（B-19）** —— 保 CI 不 red on gate violations 后续 wave；ENFORCE flip 独立 atomic commit（B-18），易 revert if migration miss。Wave 0 ship 后 CI run 25925xxx 3-OS 全绿 verify。

### 7. SchemaVersion 单一兼容门 (B-32 — delta D-16, intel CD-5 ⭐⭐⭐)

**naming 约定**：`harnessed.<surface>.v1`（e.g. `harnessed.routing-snapshot.v1`）—— **schemaVersion 字段是单一兼容门**，跨边界 artifact 演进 consumer 必须 branch on it。

**3 rules**:
1. **Consumer 必须 branch-on-version** —— 读取 artifact 时显式 switch on `schemaVersion`，非匹配版本走 graceful path（不 crash）
2. **未知 enum 值 graceful degrade** —— adapter-specific 字符串值不 fail（沿袭 ECC `ecc.session.v1` 模式），未知 enum 视作 `unknown`-bucket
3. **新增字段必须 nested** —— 不能 top-level（防 schemaVersion bump 失控）

**Wave 2 实测（T2.0，commit `4d71b1d`，`src/types/schemaVersion.ts` NEW = 68L）**：

```typescript
export type SchemaVersion<S extends string> = `harnessed.${S}.v1`

export const SCHEMA_VERSIONS = {
  routingSnapshot:   'harnessed.routing-snapshot.v1',
  handoffDoc:        'harnessed.handoff-doc.v1',
  phasesYaml:        'harnessed.phases-yaml.v1',
  manifestState:     'harnessed.manifest-state.v1',
  installerState:    'harnessed.installer-state.v1',
  routeDecisionLog:  'harnessed.route-decision-log.v1',
  checkpoint:        'harnessed.checkpoint.v1',
} as const

export function branchOnSchemaVersion<T>(
  v: string,
  handlers: { v1: () => T; unknown: () => T },
): T { /* ... */ }
```

**7 surface 列表** (B-32):
1. `harnessed.routing-snapshot.v1` —— routing engine arbitrate output snapshot
2. `harnessed.handoff-doc.v1` —— phase → phase handoff document
3. `harnessed.phases-yaml.v1` —— `workflows/<name>/phases.yaml`
4. `harnessed.manifest-state.v1` —— `.harnessed/state/manifest.json`
5. `harnessed.installer-state.v1` —— `.harnessed/state/installer.json`
6. `harnessed.route-decision-log.v1` —— routing decision audit log
7. `harnessed.checkpoint.v1` —— execute-task workflow checkpoint envelope

**TypeBox `SchemaVersionLiteral` union** 作 refinement on `schemaVersion` field（避字符串 drift compile error）。**`branchOnSchemaVersion<T>()` helper** —— 编码 rule (a) + (b)：consumer 提供 `{ v1, unknown }` handlers，未知 version 走 `unknown()` graceful degrade。

**Unit test (10 cells, `tests/types/schemaVersion.test.ts`)**：3 surface-count / 3 TypeBox accept-reject / 3 branch helper / 1 unknown graceful。

**纯学不 vendor**（intel CD-5 实施约束）—— 引擎层算法结构，不引入 ECC 外部代码。

### 8. Provenance gate hard fail (B-33 + B-34 — delta D-17, intel CD-6 ⭐⭐)

**`provenance.schema.json`** = 32L JSON Schema Draft 2020-12，4 字段：

| Field | Type | Description |
|-------|------|-------------|
| `source` | enum | `curated` / `learned` / `imported` / `evolved`（沿袭 ECC SKILL-PLACEMENT-POLICY.md 4 类） |
| `created_at` | ISO 8601 date-time | 创建时刻 |
| `confidence` | number 0-1 | 来源可信度（curated=1.0；evolved 视演化次数 decay） |
| `author` | string non-empty | 作者署名（subagent name OR human user OR ralph-loop iteration id） |

`additionalProperties: false` strict。

**Enforce path** (B-34，Wave 4 T4.0 ship，commit `2e5a18b`)：`scripts/check-provenance.mjs` = 70L（≤80 hard limit），沿袭 `check-transparency-verdicts.mjs` walker pattern `ENFORCE = true`。

**Walker scope (R8 mitigation)**：仅扫 **runtime artifact 三 root**：

```javascript
const RUNTIME_ROOTS = [
  '.harnessed/sessions',
  '.harnessed/checkpoints',
  '.harnessed/route-logs',
]
```

**Curated paths NOT scanned**：`workflows/**` + `manifest.yaml` + `docs/**` —— R8 隔离 curated vs runtime（intel CD-6 实施约束）。

**Enforce mechanism**：任何 runtime artifact（routing 决策日志 / handoff doc / failed-route 记录 / checkpoint 修复 / session learnings）必须 sibling `.provenance.json`，否则 **hard fail**（CI red + commit reject）。

**为什么 BEFORE-W4 是 hard gate**：Wave 4 ralph-loop full integration 真实 spawn 一启动即产 runtime artifact 洪流 —— 之前不上 gate = 之后追溯 curated 装配上游 vs runtime 生成物污染极痛（ECC 实证）。WARN-ONLY 不够：开发者会忘记 → 污染累积。

**CI integration**：`.github/workflows/ci.yml` 加 step "Provenance gate (Phase 2.2 W4 hard fail — CD-6)" 在 transparency gate 之后 W4 工作开始之前。

**4-step hard-fail synthetic test PASS verify**：
1. clean repo → exit 0
2. artifact 无 sibling `.provenance.json` → exit 1 + violation reported
3. sibling added → exit 0
4. cleanup → exit 0

CI run T4.0 ship 后 3-OS 全绿。

### 9. Task Session 复用 conditional (B-35 + B-36 — delta D-18, intel CD-4 ⭐⭐)

**Decision: conditional on Wave 1 SDK SC4 verify outcome → FAIL branch triggered → DEFERRED → v0.3.0**

**Wave 1 spike SC4 verify outcome (B-35, commit `e03d1bc`)**：

- `query()` options `resume?: string` API ✅ 暴露 (SDK 0.3.142 `.d.ts` confirmed)
- `system:init` message `session_id` ✅ 可 capture via `onSessionId` callback
- 但 spike 测 resume 后 agent state 保留 **PARTIAL**：session_id 透传 OK，但 omo `task_sessions[task_key]` 语义（memory / tools state / conversation history 全 carry）在 SDK 0.3.142 未完整保留 —— 业务级 session 复用语义未达成

**Branch outcome** (B-36)：

| SC4 outcome | Decision | Phase 2.2 action |
|-------------|----------|------------------|
| ~~pass~~ | ~~Wave 4 ralph-loop integration 集成 `task_session_id`~~ | ~~执行实装~~ |
| **PARTIAL → fail** ✅ | **CD-4 加入 deferred → v0.3.0 checkpoint 完整版** | **T4.4 SKIPPED；spec 保留作 v0.3.0 参考** |

**T4.4 DEFERRED 标记** (commit `643f29e`)：

- `task_plan.md` Wave 4 T4.4 加 **SKIPPED Resolved block** L9 后
- `phases.yaml` schema **不引入** `task_session_id` 字段（沿袭 § 7 rule 3 "新字段必须 nested" — 不引入即不需 v2 bump）
- `tests/routing/task-session.test.ts` **NOT created**
- `src/manifest/schema/spec.ts` + `src/workflow/schema/phases.ts` **0 diff**

**v0.3.0 closure infra ready (B-36 forward-compat)**：

T4.1 + T4.2 + T4.3 已铺好 v0.3.0 集成所需的 closure 三件套（commits `60e1241` / `bad8be1` / `7c12e7a`）：

```typescript
// 1. sdkSpawn.onSessionId — session_id capture from system:init msg
opts.onSessionId?.(msg.session_id)  // src/routing/lib/sdkSpawn.ts L68

// 2. ralphLoopWrap.resumeSessionId — closure 闭包 透传 spawn (resumeSessionId?)
ralphLoopWrap(maxIter, spawn, resumeSessionId)  // src/routing/lib/ralphLoop.ts L39

// 3. engine.wrappedSpawn capturedSessionId — let capturedSessionId persists
let capturedSessionId: string | undefined  // src/routing/engine.ts L171
```

v0.3.0 实施仅需 consumer 接入此三件套 + `harnessed.phases.v1` schema bump 加 `task_session_id?` field —— 无需重构 closure infra。

**Wave 4 T4.3 测试覆盖 (commit `7c12e7a`)**：8 cells `tests/routing/sdk-spawn.test.ts` 含 cell 5 (system:init → onSessionId callback) / cell 6 (resumeSessionId → options.resume) / cell 7 (absent resumeSessionId → options.resume NOT set) —— closure infra 测试覆盖 v0.3.0 ready 即使 T4.4 consumer DEFERRED。

**Schema interaction with § 7 (B-32)**：FAIL branch → `harnessed.phases-yaml.v1` schema **不动**（沿袭 § 7 rule 3：未加 `task_session_id` 字段，无需 v2 bump）。

## A7 Conservation

ADR 0001-0010 main body **untouched**；baseline tag iteration `adr-0001-accepted` ... `adr-0010-accepted` → 加 `adr-0011-accepted`（phase 2.2 Wave 6 T6.5 ship 打）。`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 14-字段 contract main body **不动** —— contract v1.2 reconcile 仅本 ADR § Decision 4 inline 记录（5 字段 unpack + 9 字段 inject）；`docs/INSTALLER-CONTRACT.md` main body **不动**。

### A7 守恒验收命令（phase 2.2 ship 后 0001-0011 iterate）

```bash
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011; do
  diff_out=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md")
  [ -z "$diff_out" ] || { echo "A7 violated for ADR ${n}"; exit 1; }
done
echo "A7 ✅ ADR 0001-0011 main body unchanged"
```

phase 2.2 ship 前 A7 守恒 ADR 0001-0010 验收（实测 0 diff，Wave 6 T6.3 落地）:

```bash
git diff adr-0010-accepted..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/0010-*.md" | wc -l   # = 0 lines (A7 守恒)
```

### CI A7 step

`.github/workflows/ci.yml` A7 step 两处 `for n in 0001 ... 0010` loop 加 `0011`；step name `ADR 0001-0010` → `ADR 0001-0011`（Wave 6 T6.2 落地 — baseline tag iteration `1-10 → 1-0011`）。

### Errata-path note

phase 2.2 ship 时 Wave 6 T6.5 打 `adr-0011-accepted` baseline tag（本 ADR main body 自 Draft → Accepted 时刻 0 diff stable）。push 后 CI A7 step 实测 11 ADR baseline tag 全绿。任一非空 diff 即 fail。

本 ADR 0011 起 phase 2.2 ship 时刻 frozen —— 任何 v0.2.3+ 演化（新 SDK 升级 / dual-signal layer 调整 / per-phase model tier 真实模型 routing / Wave 0+ 后续 transparency 防线 / schemaVersion v2 bump / provenance gate scope 扩展 / Task Session 完整版升级）必须开 ADR 0012+ errata；本 ADR 0011 main body 不可改（与 ADR 0001-0010 同等守恒规则）。

## References

### 内部依据

- `docs/adr/0008-routing-engine-v1-errata.md` § Decision（routing engine v1 base —— 本 ADR § Decision 1 SDK 引入扩展 spawn 真实化）
- `docs/adr/0009-routing-l2-engineering-23-shi-errata.md` § Decision 1（contract v1.1 14 字段 —— § Decision 4 reconcile 起点）+ § Decision 3（systemPrompt verbatim COMPLETE marker —— § Decision 3 dual-signal outer layer 起点）
- `docs/adr/0010-installer-schema-extension-errata.md` § Decision 5（agentDefinition.ts H3 budget ≤200L errata —— § Decision 4 split rationale 起点）
- `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1（14 字段 contract main body —— A7 守恒不动；本 ADR § Decision 4 inline reconcile）
- `docs/INSTALLER-CONTRACT.md`（main body 不动）
- `docs/TRANSPARENCY-VERDICT-CHECKLIST.md`（Phase 2.1 T1.7 ship —— § Decision 6 freshness ext 扩展 + § Status freshness markers 新章节）
- `scripts/check-transparency-verdicts.mjs` 75L（Phase 2.1 T1.7 ship 45L + Phase 2.2 T0.4 +25L freshness ext + T0.4-fix biome formatter）
- `scripts/check-provenance.mjs` 70L (Phase 2.2 T4.0 NEW)
- `provenance.schema.json` 32L (Phase 2.2 T4.0 NEW)
- `src/routing/engine.ts` 195L —— § Decision 1 spawn placeholder 替换（real sdkSpawn integration via T4.2，wrappedSpawn closure）
- `src/routing/lib/sdkSpawn.ts` 91L (Phase 2.2 T4.1 NEW) —— `query()` async-iterable consumer + onSessionId callback (CD-4 closure ready)
- `src/routing/lib/sdkReconcile.ts` 56L (Phase 2.2 T2.1 NEW) —— `toSdkAgentDefinition()` 14→5 unpack + `injectFactoryInternalFields()` 9-field inject
- `src/routing/agentDefinition.ts` 191L —— ≤200 H3 budget 守住，reconcile split 到 sdkReconcile.ts
- `src/routing/completionSchema.ts` (Phase 2.2 T2.2 NEW) —— Unified COMPLETION_SCHEMA + SdkResultEnvelope interface
- `src/routing/systemPrompt.ts` 66L —— § Decision 3 outer PRIMARY schema segment append (T2.3)
- `src/routing/lib/ralphLoop.ts` 49L —— § Decision 2 + § Decision 3 升级（≤50L 守住 per B-26，isComplete 4-layer + resumeSessionId 闭包）
- `src/routing/lib/promiseExtract.ts` 32L (Phase 1.5 ship) —— § Decision 3 outer/inner FALLBACK 路径不动
- `src/types/schemaVersion.ts` 68L (Phase 2.2 T2.0 NEW) —— 7-surface SchemaVersion + branchOnSchemaVersion helper
- `src/workflow/schema/phases.ts` 50L (Phase 2.2 T3.1 NEW) —— TypeBox per-phase model tier schema
- `src/workflow/loadPhases.ts` 30L (Phase 2.2 T3.2 NEW) —— YAML parse + Value.Check direct path
- `workflows/execute-task/phases.yaml` 27L (Phase 2.2 T3.3 NEW) —— 4 phase × intel CD-2 默认表
- `workflows/execute-task/SKILL.md` (Phase 2.2 T5.3 NEW) —— execute-task workflow skill manifest
- `src/cli/execute-task.ts` (Phase 2.2 T5.1 NEW) —— `harnessed execute-task` subcommand
- `.planning/phase-2.2/2.2-KICKOFF.md` § 1.2 F1-F8 (acceptance bars)
- `.planning/phase-2.2/2.2-CONTEXT.md` D-01~D-18（discuss-phase 锁 + 2026-05-15 delta D-16/D-17/D-18）
- `.planning/phase-2.2/2.2-DISCUSSION-LOG.md` —— delta gray area 5~8 alternatives (CD-5 / CD-6 / EE-4 / CD-4)
- `.planning/phase-2.2/PATTERNS.md` § 2.1 ~ § 2.4 + § 5 D-WP-1 ~ D-WP-6
- `.planning/phase-2.2/RESEARCH.md` D2.2-1~D2.2-7（researcher 决议 + § 1.3 4-layer dual-signal table + § 1.4 unified schema + § 1.6 spike outline + § 2.3 marker templates + § 3.5 freshness ext sketch）
- `.planning/phase-2.2/ASSUMPTIONS.md` § B 36 lock（合并 CONTEXT 18 incl delta + PATTERNS 7 + RESEARCH 7 + intel CD-5/CD-6/CD-4）
- `.planning/phase-2.2/PLAN.md` Wave 0-6 + § 6 F1-F8 reproduction commands
- `.planning/phase-2.2/SAMPLES.md` (Phase 2.2 T5.4 NEW) —— 30 sample baseline + selection rationale
- `.planning/phase-2.2/task_plan.md` T0.1~T6.5 atomic tasks（含 T1.2 SC4 / T2.0 schemaVersion prep / T4.0 provenance prep / T4.4 SKIPPED Resolved block）

### 外部参考

- `@anthropic-ai/claude-agent-sdk@0.3.142` (`/nothflare/claude-agent-sdk-docs` ctx7 821 snippets, 2026-05-15) —— `outputFormat: { type: 'json_schema' }` structured-outputs.md + `agents` map subagents.md + `AgentDefinition` 5-field SDK input shape + 9-field factory-internal inject (T1.1 verified) + `SDKResultMessage.structured_output` (T1.1 SC3 verified) + `resume?: string` option (SC4 PARTIAL → B-35 fallback)
- `.planning/research/v0.2.0-execute-task-ralph.md`（HIGH conf, 2026-05-15, valid ~2026-06-15）—— § 1-3 SDK INTRODUCE + ralph-wiggum keep + dual-signal v1 4-layer table (§ 1.3) + 5-phase orchestration + reject list
- `.planning/intel/omc-comparison.md` —— § 0 SSOT 引用纪律 + 第 4 条 per-phase model tier intel actionable (L106-127) + CD-2 4 phase default table + CD-5 (L149-157, 源 ECC, ⭐⭐⭐ schemaVersion 单一兼容门) + CD-6 (L159-167, 源 ECC, ⭐⭐ provenance gate) + CD-4 (L139-147, 源 omo, ⭐⭐ Task Session 复用) + EE-4 (L74-82, 源 omo, ⭐⭐ plan 4 维量化阈值 —— deferred to Phase 2.4)
- `.planning/ROADMAP.md` v0.2.0 Phase 2.2 —— Goal + 必含项 + 验收 5 项 + 关键风险
