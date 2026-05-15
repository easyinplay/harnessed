# Phase 2.2: execute-task workflow + ralph-loop full integration — Pattern Map

> **Mapped**: 2026-05-15
> **Mapper**: gsd-pattern-mapper (Claude Opus 4.7, 1M ctx)
> **Files analyzed**: 9 (per KICKOFF § 4 R1 explicit list)
> **Analogs found**: 9 / 9 (100% — all targets have on-repo prior art; reuse ratio HIGH)
> **Anti-stall**: 12 tool uses pre-Write (spec ×4 + targeted source reads ×8, all parallel-batched)
> **Style**: 沿袭 phase 1.5/2.1 PATTERNS.md(§ 1 table + § 2 concrete excerpts + § 3 schema + § 4 reuse summary + § 5 planner proposals)

---

## § 1 File → Analog Mapping Table

| # | New / Modified Target | Role | Data Flow | Closest Analog | Reuse % | Copy vs Adapt |
|---|----------------------|------|-----------|----------------|---------|---------------|
| 1 | `src/cli/execute-task.ts` (NEW, 10th register fn) | CLI controller | request-response (commander → engine.route → exit code) | `src/cli/research.ts` 93L (9th register fn, phase 1.4 T5.1) | **~80%** | **COPY** scaffold(register fn signature / `RawOpts` interface / `--apply` × `--dry-run` × `--non-interactive` H1 gate / `TaskContext` build / EngineResult three-state → exit codes 0/1/2);**ADAPT** 4-phase chain orchestration内联 + 新 flag `--model-tier inherit`(D-04 override 逃生口) |
| 2 | `engine.route()` SDK spawn 升级 | service / orchestrator | event-driven (async iterable `for await query()`) | 现有 `defaultSpawn` placeholder(`engine.ts` L80-84,抛 'engine.defaultSpawn is a placeholder')+ phase 1.4 W-1 SPIKE-REPORT § 3 main-process query() 实证 | **~50%** | **COPY** 三层 fallback(L1/L2/L3) + arbitrate → installAdapter → factory 链不动;**ADAPT** 替换 placeholder `defaultSpawn` 为 SDK `query()` async-iterable consumer(沿袭 RESEARCH § 3.1 `executeSubtask` shape),收集 `SDKResultMessage`(subtype-discriminated)+ session_id 抽取(`resume` for retry continuity) |
| 3 | `agentFactory` contract v1.2 reconcile | model / factory | transform (14 字段 internal → 4 字段 SDK input + 10 字段 prompt-inject) | `src/routing/agentDefinition.ts` L37-66 现 14 字段 `AgentDefinition` interface(Phase 2.1 H3 errata 已 191L)+ Phase 2.1 ADR 0010 errata fence pattern | **~60%** | **COPY** 14 字段 type 保留(harnessed-internal contract,**不删字段**)+ `createAgent()` factory 出口不动;**ADAPT** 加 `toSdkAgentDefinition(def): SdkAgentDef`(unpack `description`/`prompt`/`tools`/`model` 4 字段)+ `injectFactoryInternalFields(def, prompt): string`(其余 10 字段拼进 prompt,沿袭现 `COMPLETE_INSTRUCTION` prepend 模式);**主入口字段命名 reconcile** — KARPATHY_BASELINE prepend pattern 复用 |
| 4 | dual-signal `isComplete()` | utility / pure fn | transform (string → boolean,加 typed-field check) | `src/routing/lib/ralphLoop.ts` L11-14 现 `isComplete(output: string): boolean` 单 signal `extractPromise(output) === 'COMPLETE'` | **~40%** | **COPY** signature shape + FALLBACK 路径(`promiseExtract.extractPromise` 32L 不动);**ADAPT** 升级 input 类型 `string` → `SDKResultMessage`(参 RESEARCH § 4.2 `isComplete(result: SDKResultMessage): boolean`)+ PRIMARY check `subtype === 'success' && structured_output?.status === 'COMPLETE'`,PRIMARY 缺失再 fall 回 FALLBACK |
| 5 | `SystemPrompt` template structured output schema inject | utility / template | transform (const string + schema const export) | `src/routing/systemPrompt.ts` 53L 现 `SYSTEM_PROMPT` + `COMPLETE_INSTRUCTION` verbatim 1:1 contract § 5.4 pattern | **~85%** | **COPY** 现两个 template export 不动(verbatim contract 锁,drift 触发 ADR errata);**ADAPT** 新增 `export const COMPLETION_SCHEMA = {...}` TypeBox-like JSON schema const(沿袭 RESEARCH § 4.2 spec)+ 在 `SYSTEM_PROMPT` 末尾 append 一段 "if `outputFormat: { type: 'json_schema' }` is set, emit schema-conformant final turn AND `<promise>COMPLETE</promise>` both"(belt-and-suspenders) |
| 6 | `workflows/<name>/phases.yaml` schema + `model:` 字段 | config / schema | declarative (TypeBox spec) | `src/manifest/schema/spec.ts` 190L(Phase 2.1 加 `provides:` + Phase 1.5 加 `phase` + `triggers`)+ commander.js `--apply` flag pattern in `cli/install.ts` | **~70%** | **COPY** TypeBox `Type.Object` + `additionalProperties: false` + `Type.Union([Type.Literal(...)])` enum 模式(沿袭 L23-28 TypeEnum 模式);**ADAPT** 新 schema 位置由 planner 决(候选 (a) 折叠进 `spec.ts` 加 phases 顶层字段;(b) 新文件 `src/workflow/schema/phases.ts` — proposal § 5 D-WP-1);`model:` 4-enum(haiku/sonnet/opus/inherit)沿袭 SDK `AgentDefinition.model` 4-enum;4 phase 默认表(intel 第 4 条)进 ADR errata,不进 schema(YAGNI) |
| 7 | `workflows/execute-task/` skill 文件(SKILL.md + phases.yaml) | composition skill | declarative (workflow 编排指挥棒) | **无直接 analog**(harnessed 自家 workflow skill 是新概念)— 最接近 `workflows/research/*` 若存在,或退到 `decision_rules.yaml` v2 `mattpocock_phases:` 段 schema(phase 1.5 ship) | **~30%** | **ADAPT-mostly** — SKILL.md 文本沿袭 mattpocock skill 风格(YAML frontmatter `name` / `description` / `trigger_phrases` + Markdown 主体);phases.yaml 是新 YAML schema(本 phase 实装,见 row 6);proposal § 5 D-WP-2:**execute-task workflow skill 的 SKILL.md trigger 段** vs **CLI 命令 `harnessed execute-task` 直接触发** 两条入路如何并存 |
| 8 | transparency 全史迁移(F1 D-07b) | migration script | batch (1-line per file inject) | **无直接 script analog** — 但沿袭 Phase 2.1 T4.2 `migrate-decision-rules-v1-to-v2.mjs` pattern(若存在),或退到 `scripts/check-transparency-verdicts.mjs` 现 file walker(L18-25,recursive readdirSync + regex filename match) | **~50%** | **COPY** `walk(dir, out=[])` recursive walker(L18-25)+ filename regex `/PLAN-CHECK\.md$\|-AUDIT\.md$\|VERIFICATION\.md$/`;**ADAPT** 新文件 `scripts/migrate-add-transparency-markers.mjs` — 扫每文件,若已有 marker line(L14 `MARKER` regex)就 skip,否则在文件末尾(or after 第一个 `## ` 标题)inject 1-line `**状态**: PASSED (N/N, miss: none)` placeholder(具体 N/N + miss 由人工 review,但 marker scaffold 自动加);proposal § 5 D-WP-3:批量 inject vs 半自动列清单(reviewer item 21 倾向半自动避免误 verdict) |
| 9 | freshness check 扩展(F1 D-07c + reviewer item 21) | CI gate ext | batch (regex scan + cross-ref) | `scripts/check-transparency-verdicts.mjs` 44L 全文(现 line-prefix marker scan + regex L14-16) | **~75%** | **COPY** entire script structure(walk + violations array + exit code ENFORCE flip);**ADAPT** 加第二 walker 扫 `README.md` + `PROJECT-SPEC.md` 状态节(候选 (a) grep current `ROADMAP.md` latest-shipped phase 编号是否出现(简单 grep);(b) 结构化 `**当前版本**: vX.Y.Z (Phase N.M)` marker convention;(c) STATE.md 已完成节 cross-ref);proposal § 5 D-WP-4:三候选 form 由 R2 RESEARCH § 3 决,R1 只映射结构 |

---

## § 2 Per-target Concrete Code Excerpts

### 2.1 `src/cli/execute-task.ts` (10th register fn) — **analog: `src/cli/research.ts` 93L**

**COPY scaffold**(`research.ts` L27-92 → `execute-task.ts` 类比骨架):

```typescript
// 沿袭 research.ts L16-25 — RawOpts interface
interface RawOpts {
  workflow?: string                   // execute-task 主 workflow name(D-14 default = 'execute-task')
  task?: string                       // 描述任务的 prompt
  apply?: boolean
  dryRun?: boolean
  nonInteractive?: boolean
  model?: 'haiku' | 'sonnet' | 'opus'
  modelTier?: 'inherit'               // D-04 override 逃生口(`--model-tier inherit`)
  maxIterations?: number              // R6.4 默认 20
}

export function registerExecuteTask(program: Command): void {
  program
    .command('execute-task')
    .description('Run execute-task workflow (4-phase chain → ralph-loop COMPLETE)')
    .requiredOption('--task <text>', 'task description (required)')
    .option('--apply', 'execute the spawn (default: dry-run preview)')
    .option('--dry-run', 'force dry-run')
    .option('--non-interactive', 'CI / scripts — requires --apply or --dry-run')
    .option('--model <model>', "subagent model: 'haiku' | 'sonnet' | 'opus'")
    .option('--model-tier <tier>', "override: 'inherit' bypasses phase.model")
    .option('--max-iterations <n>', 'ralph-loop max iter (default 20)', parseInt)
    .action(async (raw: RawOpts) => {
      // H1 gate 1:1 copy from research.ts L37-43
      if (raw.nonInteractive && !raw.apply && !raw.dryRun) { /* exit 2 */ }
      if (!raw.task) { /* exit 2 */ }
      const taskCtx: TaskContext = { task: raw.task, task_type: 'execute-task' }
      // dry-run path → arbitrate-only(research.ts L52-72 pattern);apply path → real SDK spawn
      ...
    })
}
```

**Register in `src/cli.ts`**:沿袭 L9 `import { registerResearch } from './cli/research.js'` + L23 `registerResearch(program)` 模式 — 新增 `import { registerExecuteTask } from './cli/execute-task.js'` + `registerExecuteTask(program)`(comment 改 "10 subcommands per ADR 0004 + 0007 + 0008 + 2.2-ADR").

---

### 2.2 `engine.route()` SDK spawn 升级 — **analog: `engine.ts` L62-112 现 stub spawn**

**当前 stub**(engine.ts L80-84):

```typescript
async function defaultSpawn(_def: AgentDefinition): Promise<string> {
  throw new Error(
    'engine.defaultSpawn is a placeholder — pass opts.spawn or use harnessed-research wrapper (T5.1).',
  )
}
```

**Phase 2.2 ADAPT**(沿袭 RESEARCH § 3.1 `executeSubtask` shape,主-process async-iterable consumer):

```typescript
// 替换 defaultSpawn(保留 fn signature 不变 — spawn callback type 接口契约不动)
import { query, type SDKResultMessage } from '@anthropic-ai/claude-agent-sdk'

async function sdkSpawn(def: AgentDefinition, opts: SpawnOpts): Promise<string> {
  const sdkDef = toSdkAgentDefinition(def)                              // 14 → 4 字段 unpack(§ 2.3)
  const q = query({
    prompt: injectFactoryInternalFields(def, def.initialPrompt),         // 10 字段 → prompt context
    options: {
      allowedTools: ['Read', 'Edit', 'Write', 'Grep', 'Glob', 'Bash', 'Task'],
      agents: { [opts.expertName]: sdkDef },
      outputFormat: { type: 'json_schema', schema: COMPLETION_SCHEMA },  // dual-signal PRIMARY
      ...(opts.resumeSessionId ? { resume: opts.resumeSessionId } : {}),
    },
  })
  let result: SDKResultMessage | undefined
  for await (const msg of q) {
    if (msg.type === 'system' && msg.subtype === 'init') opts.onSessionId?.(msg.session_id)
    if (msg.type === 'result') result = msg
  }
  if (!result) throw new SpawnFailError()
  return JSON.stringify({ subtype: result.subtype, structured_output: result.structured_output, text: result.result })
  // ↑ ralphLoop 的 isComplete 解析这个 JSON envelope(dual-signal)
}
```

**ralphLoopWrap callback 接 SDK**(ralphLoop.ts L32-42 升级):

```typescript
// ralphLoop.ts L32-42 现版本接 string spawn callback;升级后接 SDK-aware spawn
export async function ralphLoopWrap(
  spawn: (resumeSessionId?: string) => Promise<string>,   // 加 resumeSessionId 形参
  maxIter: number,
): Promise<string> {
  let last = '', sessionId: string | undefined
  for (let i = 0; i < maxIter; i++) {
    last = await spawn(sessionId)                          // resume 接续 iteration N-1
    if (isComplete(last)) return last                      // dual-signal(§ 2.4)
    // session_id callback 由 spawn 内部回调更新 sessionId 闭包
  }
  throw new MaxIterationsExceededError(maxIter)
}
```

**Karpathy 5 hard limit verify**:ralphLoop.ts 升级后从 42L → 估算 ~48L(加 sessionId 闭包 + 2 行注释),仍 ≤50L 主体(D1.4-3 lock 守得住);若超则 sessionId 闭包 split 到 lib/sessionCache.ts。

---

### 2.3 `agentFactory` contract v1.2 reconcile — **analog: `agentDefinition.ts` L37-66 现 14 字段**

**当前 14 字段 export interface**(agentDefinition.ts L37):

```typescript
export interface AgentDefinition {
  description: string           // ← SDK 4 字段 ①
  prompt: string                // ← SDK 4 字段 ②
  tools: string[]               // ← SDK 4 字段 ③
  model?: 'sonnet' | 'opus' | 'haiku'  // ← SDK 4 字段 ④
  // 其余 10 字段 — harnessed-internal(SDK 不识)
  disallowedTools?: string[]
  skills?: string[]
  mcpServers?: Record<string, ...>
  memory?: ...
  maxTurns?: number
  background?: string
  effort?: 'low' | 'medium' | 'high'
  permissionMode?: ...
  initialPrompt?: string
  criticalSystemReminder_EXPERIMENTAL?: string
}
```

**Phase 2.2 ADAPT — 加 reconcile helper**(新增 2 个内部 fn,不动 export interface):

```typescript
// 沿袭 KARPATHY_BASELINE prepend pattern(agentDefinition.ts L140 — `## 心法 (always-on baseline)` 注入 prompt)
import type { AgentDefinition as SdkAgentDef } from '@anthropic-ai/claude-agent-sdk'

/** Unpack 4 字段作 SDK query() options.agents 物理 input(D-01)。*/
export function toSdkAgentDefinition(def: AgentDefinition): SdkAgentDef {
  return {
    description: def.description,
    prompt: def.prompt,                  // 注:prompt 已含 KARPATHY_BASELINE + COMPLETE_INSTRUCTION + 10 字段 inject
    ...(def.tools ? { tools: def.tools } : {}),
    ...(def.model ? { model: def.model } : {}),
  }
}

/** 其余 10 字段拼接进 prompt 上下文 — 沿袭 COMPLETE_INSTRUCTION prepend 现 pattern。*/
export function injectFactoryInternalFields(def: AgentDefinition, basePrompt: string): string {
  const parts: string[] = [basePrompt]
  if (def.criticalSystemReminder_EXPERIMENTAL) parts.push(`## CRITICAL\n${def.criticalSystemReminder_EXPERIMENTAL}`)
  if (def.skills?.length) parts.push(`## Available skills\n- ${def.skills.join('\n- ')}`)
  if (def.maxTurns) parts.push(`## Turn budget\n${def.maxTurns} turns max.`)
  // ... 其余 7 字段同款 markdown 段拼接
  return parts.join('\n\n')
}
```

**A7 守恒**:`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` main body **不动**(contract v1.1 → v1.2 reconcile 走 ADR errata,沿袭 Phase 2.1 ADR 0010 errata pattern);agentDefinition.ts 现 191L,加 2 fn 估算 +30-40L → ~230L,**超 ≤200L hard limit**(H3 errata cap),需 split 到 `agentDefinition.factory.ts` 或 lib/sdkReconcile.ts(planner 决,proposal § 5 D-WP-5)。

---

### 2.4 dual-signal `isComplete()` — **analog: `ralphLoop.ts` L11-14**

**当前单 signal**(ralphLoop.ts L11-14):

```typescript
export function isComplete(output: string): boolean {
  return extractPromise(output) === 'COMPLETE'
}
```

**Phase 2.2 dual-signal upgrade**(沿袭 RESEARCH § 4.2 spec):

```typescript
// 升级 — accept JSON envelope(sdkSpawn 输出) OR raw string(test mock backward compat)
import type { SDKResultMessage } from '@anthropic-ai/claude-agent-sdk'

export function isComplete(output: string): boolean {
  // 尝试 PRIMARY — SDK envelope 解析
  try {
    const env = JSON.parse(output) as { subtype?: string; structured_output?: { status?: string }; text?: string }
    if (env.subtype === 'success' && env.structured_output?.status === 'COMPLETE') return true
    // SDK envelope 但 PRIMARY 失败(schema 没设 / error_max_structured_output_retries)→ fall 到 FALLBACK
    if (env.text && extractPromise(env.text) === 'COMPLETE') return true
    return false
  } catch {
    // 非 JSON(raw string,test mock 或 degraded path)→ 退到现 FALLBACK 行为
    return extractPromise(output) === 'COMPLETE'
  }
}
```

**Test compatibility**:现有 `routing-engine.test.ts` 传 raw string mock(`async () => 'COMPLETE'` 或 `<promise>COMPLETE</promise>`)— catch 分支保住向后兼容,Phase 2.2 新测加 JSON envelope 路径。

---

## § 3 Schema Change Patterns

### 3.1 phases.yaml TypeBox schema(沿袭 `spec.ts` L20-189 模式)

**位置 candidates**(proposal § 5 D-WP-1 by planner):

- **(a) 折叠进 `src/manifest/schema/spec.ts`** — 加顶层字段 `phases: Type.Optional(PhasesSchema)`,parse 时区分 manifest YAML vs phases YAML;**优点**:无新文件 / 共享 TypeBox import;**缺点**:语义混(manifest 是 install 描述,phases 是 workflow 编排,两概念不同 yaml file)
- **(b) 新文件 `src/workflow/schema/phases.ts`** — 独立 TypeBox schema + 独立 validator;**优点**:职责清 / namespace 独立 / 沿袭 spec.ts pattern 1:1;**缺点**:多 1 文件
- **推荐**:**(b) 新文件** — Karpathy "do one thing well",workflow schema 与 manifest schema 是两个不同 SSOT。

**TypeBox 模板**(沿袭 spec.ts L23-35 `Type.Union([Type.Literal(...)])` 模式):

```typescript
// src/workflow/schema/phases.ts(NEW,估算 ~80-100L)
import { Type } from '@sinclair/typebox'

const ModelTier = Type.Union([
  Type.Literal('haiku'),
  Type.Literal('sonnet'),
  Type.Literal('opus'),
  Type.Literal('inherit'),     // D-04 override 逃生口
])

const PhaseEntry = Type.Object(
  {
    id: Type.String({ minLength: 1 }),      // e.g. '01-clarify'
    name: Type.String({ minLength: 1 }),    // human-readable
    upstream: Type.String({ minLength: 1 }), // e.g. 'superpowers brainstorming'
    model: ModelTier,                        // 必填(D-04 intel 第 4 条)
    skills: Type.Optional(Type.Array(Type.String())),
    max_iterations: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  },
  { additionalProperties: false },
)

export const PhasesSchema = Type.Object(
  {
    workflow: Type.String({ minLength: 1 }),  // e.g. 'execute-task'
    phases: Type.Array(PhaseEntry, { minItems: 1 }),
  },
  { additionalProperties: false },
)
```

### 3.2 ADR errata fence pattern(沿袭 Phase 2.1 ADR 0010 errata)

spec.ts L93-96 + L133-135 + L152-156 注释块 pattern(`// ADR <N> errata — <topic> (phase <X.Y> T<N>)`)— Phase 2.2 ADR 编号实占后,**所有 schema 改动行**加同款 fence。例:

```typescript
// ADR <实占N> errata — per-phase model tier schema (phase 2.2 W3 — F5).
// `model` is 4-enum(haiku/sonnet/opus/inherit), defaults per intel 第 4 条 表:
//   01-clarify=opus/sonnet, 02-code=sonnet, 03-test=sonnet/haiku, 04-deliver=haiku.
// `--model-tier inherit` CLI flag override 逃生口(D-04)。
const ModelTier = Type.Union([...])
```

---

## § 4 Pattern Reuse Summary

**Weighted reuse %**(per-target reuse × LoC estimate):

| Target | Reuse % | New LoC est. | Weighted contribution |
|--------|---------|--------------|----------------------|
| execute-task.ts(new) | 80% | ~110 | high reuse — research.ts 1:1 scaffold |
| engine.route() SDK spawn | 50% | ~60 modify(199L → ~210L,临界 200L hard limit,可能 split) | medium — 半 stub replace |
| agentFactory v1.2 | 60% | ~40 add | medium — 加 2 helper fn |
| dual-signal isComplete | 40% | ~15 modify | low — 升级 + JSON envelope parse |
| systemPrompt schema inject | 85% | ~25 add(schema const + 1 prompt 段) | high — verbatim template 不动 |
| phases.yaml schema | 70% | ~90 new file | high — spec.ts pattern 1:1 |
| workflows/execute-task/ skill | 30% | ~60 SKILL.md + ~50 phases.yaml | low — 新概念 |
| transparency 全史迁移 script | 50% | ~80 new script | medium — walker copy |
| freshness check ext | 75% | ~50 add to existing script | high — 同款 walker + 第二 regex set |
| **Total weighted reuse** | **~62%** | **~580 LoC** | — |

**Lib helper sufficiency**(沿袭 Phase 2.1 PATTERNS § 5 校验):

- ✅ `lib/ralphLoop.ts` — 升级接 SDK callback,**无需新 helper**(sessionId 闭包就地)
- ✅ `lib/promiseExtract.ts` — FALLBACK 路径不动,32L hard limit 守住
- ✅ `lib/skillInstall.ts` — Phase 2.1 已 ship,execute-task install adapter 复用(D1.4-4 模式)
- ⚠️ **新 helper 候选**:`lib/sdkReconcile.ts`(若 agentDefinition.ts ≤200L hard limit 守不住 → split toSdkAgentDefinition + injectFactoryInternalFields 到此);planner 决(proposal § 5 D-WP-5)
- ⚠️ **新 schema validator 候选**:`src/workflow/loadPhases.ts`(parse + validate phases.yaml + emit `PhaseEntry[]`,沿袭 `src/manifest/loadManifest.ts` 现 pattern)

**Truly NEW patterns this phase**(无 prior art):

1. **SDK async-iterable consumer**(`for await (const msg of query(...))`)— Phase 1.4 W-1 SPIKE-REPORT § 3 只是单 sample 实证,Phase 2.2 是首次生产路径接入。无 in-repo prior art,沿袭 RESEARCH § 3.1 spec。
2. **`outputFormat` + `agents`-map 组合**(RESEARCH § 4 open question)— ctx7 分别文档化两特性,组合未见 jointly doc;Wave 1 spike-test 验证(degraded fallback path:若组合不兼容,structured_output 应用 main-agent turn,subagent completion 退到 `<promise>` FALLBACK)。**这是真实新代码模式,非 copy-from-existing**。
3. **JSON envelope 协议 between sdkSpawn 与 ralphLoopWrap**(§ 2.2 + § 2.4)— 现 spawn callback 返 raw string,Phase 2.2 sdkSpawn 返 JSON envelope({ subtype, structured_output, text })供 isComplete 双 path 解析。新 IPC 协议(虽进程内,但 callback boundary 新约定)。

---

## § 5 Decision Proposals for the Planner

**These are PROPOSALS, not LOCKS** — Wave B planner 决,Wave C plan-checker 审。

### D-WP-1: phases.yaml schema 位置

- **(a)** 折叠进 `src/manifest/schema/spec.ts`(语义混)
- **(b)** 新文件 `src/workflow/schema/phases.ts`(职责清)— **推荐**
- Decision driver:Karpathy "do one thing well" + 命名空间独立 + spec.ts 已 190L 临界

### D-WP-2: execute-task workflow skill 双入路

- **(a) CLI `harnessed execute-task` 是唯一入路**,SKILL.md trigger_phrases 仅文档化 not enforce
- **(b) SKILL.md trigger 段实装**(GSD orchestration agent 识别 trigger 自动召唤 CLI)— 但本 phase 不 ship,推 Phase 2.3 extension category
- **推荐**:**(a)** — Phase 2.2 scope 只到 CLI + 4-phase chain;SKILL.md 内 trigger_phrases 是 forward-looking 文档,实装推 2.3

### D-WP-3: transparency 全史迁移 script structure

- **(a) 全自动 inject**(扫所有缺 marker 文件,末尾 append `**状态**: PASSED (N/N, miss: none)` placeholder)
- **(b) 半自动列清单**(扫输出迁移 candidate list,人工 fill + commit)— reviewer item 21 倾向
- **(c) hybrid**(已 ship phase 自动 inject `PASSED`;in-progress phase 列清单人工)
- **推荐**:**(c) hybrid** — 已 ship phase verdict 已锁不会改;in-progress 不 inject 避免误 verdict

### D-WP-4: freshness check 具体形态

- **(a) 简单 grep**(README/PROJECT-SPEC 必含当前 ROADMAP latest-shipped phase 编号)
- **(b) 结构化 marker convention**(`**当前版本**: vX.Y.Z (Phase N.M)` 行)
- **(c) STATE.md cross-ref**(扫 STATE.md 已完成节,与 README/PROJECT-SPEC 状态节比对)
- Decision driver:R2 RESEARCH § 3 调研 false-positive 风险 + 实装复杂度,R1 不预定

### D-WP-5: agentDefinition.ts ≤200L hard limit 守法

- **(a) 加 2 helper fn inline**(预计超 200L → 触发 H3 errata 第 2 次)
- **(b) split 到 `lib/sdkReconcile.ts`**(沿袭 Phase 1.5 promiseExtract.ts split 模式)— **推荐**
- Decision driver:Karpathy 5 hard limit 严守(KICKOFF § 3.5),split 是 phase 1.5 ship 验证模式

### D-WP-6: 30 子任务 SAMPLES.md 选取标准

- 沿袭 phase 1.4 SAMPLES.md R3 frozen selection rationale(CONTEXT 已锁)
- proposal:复用 phase 1.4 30 sample 中 15 个 + 新增 15 个 execute-task 专属(覆盖 4-phase chain 各 phase trigger + ralph-loop max-iter 退场 + structured_output PRIMARY vs FALLBACK 路径)
- planner 决具体清单

### D-WP-7: ADR 单一 errata vs 拆分(D-09 已锁单一 but 内部章节划分)

- D-09 锁定**单一 ADR** 覆盖 Phase 2.2 全决策
- proposal § 章节:
  1. SDK 引入(D2.2-1)
  2. ralph-wiggum keep(D2.2-2)
  3. dual-signal completion(D2.2-3)
  4. contract v1.2 reconcile(D-01)
  5. per-phase model tier schema errata(D-04)
  6. Wave 0 transparency CI gate flip + freshness ext(D-07)
- ADR 编号实占由 plan-phase Wave 0 决定(不预占,intel § 0 SSOT 引用纪律)

---

**phase 2.2 PATTERNS.md complete** — 9 target 全有 analog mapping;~62% weighted reuse(中-高,因 SDK 接入是新代码模式);7 proposal 待 Wave B planner 决。
