# Phase 3.1: checkpoint 引擎 + harnessed resume + compact 协议 — Pattern Map

> **Mapped**: 2026-05-16
> **Mapper**: gsd-pattern-mapper (Claude Opus 4.7, 1M ctx)
> **Files analyzed**: 14 NEW / MODIFY targets (per CONTEXT.md D-01~D-04 + W0 backlog 4 项)
> **Analogs found**: 14 / 14 (100%; Phase 2.2 T4.4 closure infra 三件套 + Phase 2.4 PATTERNS sister 全覆盖)
> **Style**: 沿袭 Phase 2.4 PATTERNS.md (§ 1 table + § 2 concrete excerpts + § 3 cross-cutting + § 4 reuse summary + § 5 path dependency)

---

## § 1 NEW / MODIFY Targets → Existing Analog Mapping

| # | Target | Role | Data Flow | Closest Analog | Reuse % | Copy vs Adapt |
|---|--------|------|-----------|----------------|---------|---------------|
| **NEW infra** ||||||||
| 1 | `src/checkpoint/schema/checkpoint.v1.ts` (~50L) | schema (TypeBox) | declarative | `src/workflow/schema/phases.ts` L19-46 (TypeBox `Type.Object` + `Type.Union` literal + `Static<typeof>` export) | **~90%** | **COPY** TypeBox import + `Type.Object({...}, { additionalProperties: false })` shape + `Static<>` 双 export 模式;**ADAPT** field set per D-01 hint (`schemaVersion` literal `harnessed.checkpoint.v1` + `phase` + `status` 3-enum + `last_task` + `key_decisions[]` + `canonical_refs[]` + `session_id?` + `timestamp` ISO + `archive_path`) |
| 2 | `src/checkpoint/schema/current-workflow.v1.ts` (~30L) | schema (TypeBox) | declarative | 同 #1 phases.ts 模式 | **~95%** | **COPY** 单 `Type.Object` shape;**ADAPT** D-02 hint 3-state `Type.Union([Type.Literal('active'), Type.Literal('paused'), Type.Literal('complete')])` + `phase` string + `last_checkpoint_path` + `started_at`/`paused_at?`/`completed_at?` |
| 3 | `src/checkpoint/template.ts` (~60-80L) | service (writer) | request-response (data → JSON.stringify → fs.writeFile + byte-size guard) | `src/workflow/loadPhases.ts` L23-30 (`Value.Check` runtime validate + throw `*ValidationError`) + 反向 write path | **~70%** | **COPY** loadPhases `Value.Check(Schema, parsed)` + `Value.Errors(...)` 模式 (write 前 self-validate);**ADAPT** 新 logic: 组装 fixed-fields → JSON.stringify → `Buffer.byteLength(s, 'utf8') / 4 > 1000` fail-loud truncate (D-01 hint 1k token 估算) → `writeFile('.harnessed/checkpoints/<phase>.json', s)` + sister archive write `'.harnessed/archive/<phase>/raw-<ts>.json'` |
| 4 | `src/checkpoint/state.ts` (~50-80L, Karpathy hard limit ≤80L per CONTEXT D-02 hint) | service (state machine) | event-driven (transition trigger → enum mutate → fs.writeFile) | `src/routing/engine.ts` L43-47 `EngineResult` discriminated union (3-state union 范式) + loadPhases write-side 反推 | **~60%** | **COPY** discriminated union 范式 + `branchOnSchemaVersion<T>()` consume 模式;**ADAPT** 3-state transition logic (`activate(phase)` / `pause(phase, ts)` / `complete(phase, ts)`) — 简单 if 不引 xstate/robot3 dep (D-02 hint Karpathy lock);文件目标 `.harnessed/current-workflow.json` 单文件 read-modify-write |
| 5 | `src/checkpoint/resume.ts` (~50-70L) | utility (resume controller) | request-response (read state.json → checkpoint reload → stdout output) | `src/cli/doctor.ts` L130-134 dynamic import + delegate pattern + `--json` flag 输出模式 L141-158 | **~65%** | **COPY** doctor `--json` 双输出分支 L151-172 (human-readable mark + JSON path) + dynamic import 解耦;**ADAPT** logic: 读 `.harnessed/current-workflow.json` → `branchOnSchemaVersion<T>` validate → 找 `status==='paused'` → 读 `last_checkpoint_path` → output checkpoint 摘要 5-10 行 + session_id 存在 prompt 续跑 hint (D-03 RELOAD locked) |
| 6 | `src/checkpoint/index.ts` (~10L) | barrel export | declarative | `src/routing/lib/*.ts` barrel pattern (各 lib 文件独立 export, 主 index 聚合) | **~95%** | **COPY** plain re-export pattern: `export * from './template.js'` + `export * from './state.js'` + `export * from './resume.js'` + `export * from './schema/checkpoint.v1.js'` + `export * from './schema/current-workflow.v1.js'` |
| 7 | `src/cli/resume.ts` (~30-50L) | CLI controller | request-response (commander → resume.ts handler → exit code) | `src/cli/execute-task.ts` L26-97 (`registerXxx(program)` + `.command(...)` + `.option('--json',...)` + action async + 0/1/2 exit map) + `src/cli/doctor.ts` L136-175 (3-status → exit code mapping) | **~85%** | **COPY** `registerResume(program)` shell L26-37 + `--json` flag option (sister doctor.ts L140);**ADAPT** action: delegate `src/checkpoint/resume.ts` `runResume({ json: opts.json })` → output stdout → exit 0/1 (D-03 hint: exit 1 = no paused phase / file corrupt / schema 不匹配 fail loud) |
| **NEW tests** ||||||||
| 8 | `tests/checkpoint/template.test.ts` | unit test | request-response (input → checkpoint → assert byte-size + schema) | `tests/routing/sdk-spawn.test.ts` L77-119 (describe/it + mock + fixtures pattern) | **~80%** | **COPY** `describe(...)` + `it(...)` + `beforeEach`/`afterEach` + fixture setup 模式;**ADAPT** assertions: byte-size `< 1000` token estimate + `Value.Check(CheckpointV1Schema, parsed)` PASS + archive sibling write 验 |
| 9 | `tests/checkpoint/state.test.ts` | unit test | request-response (transition → assert state.json content) | 同 #8 sdk-spawn.test.ts skeleton | **~80%** | **COPY** test skeleton;**ADAPT** 3-state transition unit (active → paused → complete + paused timestamps + last_checkpoint_path 同步更新);TypeBox schema validate roundtrip |
| 10 | `tests/checkpoint/resume.test.ts` | unit test | request-response (mock fs + resume → assert stdout) | `tests/routing/sdk-spawn.test.ts` L27-34 (vi.mock module + capture calls 模式) | **~75%** | **COPY** `vi.mock('node:fs/promises', ...)` 模式 (mock readFile 返 fixture state.json + checkpoint.json) + capture stdout via spy;**ADAPT** 验 D-03 RELOAD 行为: paused phase → output 含 phase + last_task + session_id prompt;no-paused-phase → exit 1 |
| 11 | `tests/integration/checkpoint-e2e.test.ts` | integration test | event-driven (SIGINT mock + SDK session redirect verify) | `tests/routing/sdk-spawn.test.ts` L17-34 (mock @anthropic-ai/claude-agent-sdk + system:init session_id 模式) + L158-184 (session_id capture + resume propagation 双向验) | **~90%** | **COPY** sdk-spawn.test.ts § "session_id capture + resume propagation" 全段直接 analog (D-04 WIRE-IN 单元验);**ADAPT** 扩 e2e: process.on('SIGINT') mock fire → state.ts pause write → resume.ts 读 → SDK redirect 验 options.resume === 捕获的 session_id |
| **MODIFY wire-in** ||||||||
| 12 | `src/cli.ts` (12th subcommand register) | dispatch | declarative (commander register) | 现 `src/cli.ts` L25-35 11 个 `registerXxx(program)` 调用 | **~99%** | **COPY-additive** 1 行: `import { registerResume } from './cli/resume.js'` + `registerResume(program)` 加到末尾;沿袭 ADR 0011/0013 注释 comment 加 "Phase 3.1 R7.3 — 12th subcommand: harnessed resume" |
| 13 | `src/routing/lib/sdkSpawn.ts` (`onSessionId` callback wire — already infra ready) | service (SDK consumer) | event-driven (system:init msg → callback) | 现 `src/routing/lib/sdkSpawn.ts` L26-33 SdkSpawnOpts interface (onSessionId 已存在 L32) + L66-69 已实装 `if (msg.type==='system' && msg.subtype==='init') opts.onSessionId?.(msg.session_id)` | **~100%** | **ZERO-LINE CHANGE** — T4.4 closure infra 已 ready (Phase 2.2 W4),本 phase 只是首消费者;CONTEXT D-04 hint 显: "Phase 2.2 closure infra 3 件套都已 ready, 本 phase 仅'加 schema field + wire 接入'~20-30L 工作量" — 此文件 wire 已在;**新增 consumer** 在 engine.ts (#14 下) 调用 |
| 14 | `src/routing/lib/ralphLoop.ts` (`resumeSessionId` already in spawn signature) | service (loop wedge) | event-driven (loop iter passes sessionId) | 现 `src/routing/lib/ralphLoop.ts` L38-49 `ralphLoopWrap(spawn: (resumeSessionId?: string) => ...)` 接口已设;`let sessionId: string \| undefined` L43 已为 future SDK init feedback 留位 | **~100%** | **ZERO-LINE CHANGE** — 接口已 ready;本 phase 仅触发 engine 层在 `wrappedSpawn` 的 `onSessionId` callback 内捕获 + checkpoint write (#15 下) |
| 15 | `src/routing/engine.ts` (`capturedSessionId` wire-in + checkpoint write trigger) | orchestrator | event-driven (phase complete OR SIGINT trap → checkpoint write) | 现 `src/routing/engine.ts` L170-182 (`capturedSessionId` already declared + `void capturedSessionId` 占位 — 待消费者 wire) + L172-181 wrappedSpawn 已透传 onSessionId callback | **~95%** | **MINIMAL ADD** ~10-15L: 删 L182 `void capturedSessionId` 占位 → 加 `checkpoint.write({ phase: ..., session_id: capturedSessionId, status: 'complete', ... })` 在 L185 `return { ok: true, ... }` 前;加 `process.on('SIGINT', () => checkpoint.write({ status: 'paused', session_id: capturedSessionId, ... }))` trap (CONTEXT Claude's Discretion: Node 原生 zero-dep);沿袭 engine.ts ≤200L hard limit (B-23) — 超出抽 helper |
| 16 | `src/types/schemaVersion.ts` (register `checkpoint.v1` + `current-workflow.v1` — partial done) | schema registry | declarative | 现 `src/types/schemaVersion.ts` L34-42 `SCHEMA_VERSIONS` 7-surface const 已含 `checkpoint: 'harnessed.checkpoint.v1'` L41 + L46-54 `SchemaVersionLiteral` Union 已含 checkpoint | **~70%** | **PARTIAL ADD** — `checkpoint.v1` 已注册 (Phase 2.2 CD-5 7-surface 之一 L41 + L53);**新增** `currentWorkflow: 'harnessed.current-workflow.v1'` 8th surface key + `Type.Literal(...)` 8th entry to SchemaVersionLiteral Union;沿袭 B-32 grep 验收 "≥ 7 → ≥ 8 `harnessed.\w+.v1` references";沿袭 CD-5 单一兼容门 discipline |
| **MODIFY docs / W0** ||||||||
| 17 | `.github/workflows/ci.yml` (W0.3 README completeness check step ~10L) | CI gate | batch (bash grep counts + comparison) | 现 `ci.yml` L177-187 README counter integrity gate (D-03 B 路径 consistency-only 三计数一致) + L167-172 schemaVersion consumer gate (count + exit 1 模式) | **~95%** | **COPY** step shape + bash exit-1-on-mismatch 模式 L183-186 直接 analog;**ADAPT** completeness check 新逻辑 (KICKOFF § 4 T4): `STATE_SHIPPED=$(grep -c "Phase X\.Y SHIPPED" .planning/STATE.md)` vs `README_SHIPPED=$(grep -cE "^- \*\*Phase 2\.[1-9] shipped\*\* ✅" README.md)`;不等 fail (覆盖 vs 一致互补);沿袭 B-04 shell:bash 路径 |
| 18 | `.planning/v0.2.0-MILESTONE-AUDIT.md` (W0.1 "Line budget deviations accepted" 节 ~10L) | docs | declarative | sister Phase 2.4 ship M1 transparency 透明节 pattern (defer-items 登记 +deviation 原因 + ACCEPTED 标记) | **~80%** | **COPY** transparency 透明节范式;**ADAPT** 加 2 项 deferred-items: #1 `run-plan-checker.mjs` 130L vs spec ≤100L +30% (biome blocking ACCEPTED) + #2 `plan-checker-quant.test.ts` 103L vs spec ≤80L +29% ACCEPTED;Karpathy transparency discipline 不藏 deviation |
| 19 | `.planning/RETROSPECTIVE.md` (W0.2 dashboard polish round 2 commit attribution 节 ~15L) | docs | declarative | sister Phase 2.4 RETROSPECTIVE M2+M3 absorb 复盘节 (advisory 允许 absorb 路径 cadence note) | **~75%** | **ADAPT** 加 1 节 "Dashboard polish round 2 commit attribution 复盘": handoff intel L482 草案"独立 commit"未采纳 (executor 合理 absorb 进 W3 cf00d17/008f9ab) → 登记 advisory 允许 absorb 路径作为 future cadence note;避免 future "advisory rejected" 暗示 |
| **NEW infra — revision iter 1 W-01 promote** ||||||||
| 20 | `src/checkpoint/engineHook.ts` (~50L PRIMARY) | service (engine wedge helper) | request-response (engine 触发 hook → currentWorkflow + checkpoint write) | `src/routing/lib/sdkReconcile.ts` ≤56L (Phase 2.2 helper extract from engine layer for testability — 单一职责 + Karpathy hard limit clean 沿袭) | **~85%** | **COPY** sdkReconcile.ts helper extract 范式: 单一职责 utility 从 engine.ts 抽出, engine.ts 仅 1-2 行 import + call;**ADAPT** logic: `engineCheckpointHook({ phaseId, sessionId, status, lastTask, ... })` 内含 currentWorkflow.v1 + checkpoint.v1 双 write (轨化分离), 接收 phaseId 显式 propagate (W-04 thread); 沿袭 ≤50L hard limit 守 engine.ts ≤200L clean (B-23 不再 5% tolerance 触发) |

---

## § 2 Per-target Concrete Code Excerpts

### 2.1 `src/checkpoint/schema/checkpoint.v1.ts` (NEW) — analog: `src/workflow/schema/phases.ts` L19-46

**COPY TypeBox `Type.Object` + `Static<typeof>` 双 export 模式** (phases.ts L21-50):

```ts
// src/checkpoint/schema/checkpoint.v1.ts — Phase 3.1 R7.2 + CD-5 7-surface registered.
// Sister to src/workflow/schema/phases.ts (TypeBox + Value.Check); D-01 TEMPLATE locked.
import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

export const CheckpointStatus = Type.Union([
  Type.Literal('active'),
  Type.Literal('paused'),
  Type.Literal('complete'),
])

export const CheckpointV1 = Type.Object(
  {
    schemaVersion: Type.Literal(SCHEMA_VERSIONS.checkpoint), // 'harnessed.checkpoint.v1'
    phase: Type.String({ minLength: 1 }),                    // e.g. '3.1' or '03-test'
    status: CheckpointStatus,
    last_task: Type.String(),                                // D-01 TEMPLATE — mechanical extract
    key_decisions: Type.Array(Type.String()),                // e.g. ['D-01 TEMPLATE', 'D-04 WIRE-IN']
    canonical_refs: Type.Array(Type.String()),               // e.g. ['ROADMAP.md L156-158']
    session_id: Type.Optional(Type.String()),                // D-04 WIRE-IN (optional — fresh-session 兼容)
    timestamp: Type.String({ format: 'date-time' }),         // ISO
    archive_path: Type.String({ minLength: 1 }),             // e.g. '.harnessed/archive/phase-3.1/raw-<ts>.json'
  },
  { additionalProperties: false },
)

export type CheckpointV1Type = Static<typeof CheckpointV1>
```

### 2.2 `src/checkpoint/template.ts` (NEW ≤80L) — analog: loadPhases write-side 反推 + `Value.Check` validate

**COPY `Value.Check` + `Value.Errors` validate-before-write** (loadPhases L23-30 反推 write path):

```ts
// src/checkpoint/template.ts — D-01 TEMPLATE: mechanical extract, zero LLM call.
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { CheckpointV1, type CheckpointV1Type } from './schema/checkpoint.v1.js'

export class CheckpointTooLargeError extends Error {
  constructor(public estimatedTokens: number) {
    super(`checkpoint exceeds 1k token budget (estimated ${estimatedTokens})`)
  }
}

export async function writeCheckpoint(c: CheckpointV1Type): Promise<{ path: string }> {
  if (!Value.Check(CheckpointV1, c)) {
    throw new Error(`checkpoint schema validation failed: ${[...Value.Errors(CheckpointV1, c)].map((e) => e.message).join('; ')}`)
  }
  const serialized = JSON.stringify(c, null, 2)
  const estTokens = Math.ceil(Buffer.byteLength(serialized, 'utf8') / 4) // D-01 hint: 1 char ≈ 0.25 token Heuristic
  if (estTokens > 1000) throw new CheckpointTooLargeError(estTokens)     // fail loud per D-01
  const path = join('.harnessed', 'checkpoints', `${c.phase}.json`)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, serialized)
  return { path }
}

// archive sibling write — independent path, NOT subject to 1k token budget
export async function writeArchive(phase: string, rawTurns: unknown): Promise<{ path: string }> {
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const path = join('.harnessed', 'archive', `phase-${phase}`, `raw-${ts}.json`)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(rawTurns, null, 2))
  return { path }
}
```

### 2.3 `src/checkpoint/state.ts` (NEW ≤80L) — analog: engine.ts L43-47 discriminated union + loadPhases write 反推

**ADAPT 3-state transition** (D-02 hint Karpathy 极简 — 1 enum field + 几个 if):

```ts
// src/checkpoint/state.ts — D-02 KARPATHY 3-state (active/paused/complete), no xstate/robot3.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { CurrentWorkflowV1, type CurrentWorkflowV1Type } from './schema/current-workflow.v1.js'

const STATE_PATH = '.harnessed/current-workflow.json'

async function read(): Promise<CurrentWorkflowV1Type | null> {
  try {
    const raw = await readFile(STATE_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    if (!Value.Check(CurrentWorkflowV1, parsed)) return null  // schema drift → fresh init
    return parsed
  } catch { return null }
}

async function write(s: CurrentWorkflowV1Type): Promise<void> {
  await mkdir(dirname(STATE_PATH), { recursive: true })
  await writeFile(STATE_PATH, JSON.stringify(s, null, 2))
}

export async function activate(phase: string, checkpointPath: string): Promise<void> {
  await write({ schemaVersion: 'harnessed.current-workflow.v1', phase, status: 'active', last_checkpoint_path: checkpointPath, started_at: new Date().toISOString() })
}

export async function pause(): Promise<void> {
  const s = await read(); if (!s) return
  await write({ ...s, status: 'paused', paused_at: new Date().toISOString() })
}

export async function complete(): Promise<void> {
  const s = await read(); if (!s) return
  await write({ ...s, status: 'complete', completed_at: new Date().toISOString() })
}
```

### 2.4 `src/cli/resume.ts` (NEW) — analog: doctor.ts L136-175 + execute-task.ts L26-97

**COPY commander register + `--json` 双输出** (doctor.ts L136-175 + execute-task.ts L26-37):

```ts
// src/cli/resume.ts — D-03 RELOAD: 输出 checkpoint 摘要 + 提示用户手动续跑.
import type { Command } from 'commander'

export function registerResume(program: Command): void {
  program
    .command('resume')
    .description('Reload checkpoint + show resume hint (D-03 RELOAD — user invokes phase command manually)')
    .option('--json', 'output JSON instead of human-readable')
    .action(async (opts: { json?: boolean }) => {
      const { runResume } = await import('../checkpoint/resume.js')
      const r = await runResume()
      if (opts.json) {
        console.log(JSON.stringify(r, null, 2))
      } else if (r.status === 'no-paused-phase') {
        console.error('no paused phase found in .harnessed/current-workflow.json')
        process.exit(1)
      } else {
        console.log(`phase: ${r.checkpoint.phase}`)
        console.log(`last_task: ${r.checkpoint.last_task}`)
        if (r.checkpoint.session_id) console.log(`→ session can be resumed (sid: ${r.checkpoint.session_id})`)
        console.log(`→ in Claude Code: /gsd-execute-phase ${r.checkpoint.phase}`)
      }
      process.exit(0)
    })
}
```

### 2.5 `src/routing/engine.ts` MODIFY (checkpoint write trigger) — analog: 现 L170-182 capturedSessionId 占位

**MINIMAL ADD ~10-15L** (现 engine.ts L170-194 wrappedSpawn 块 + L182 `void capturedSessionId` 占位 — 待本 phase 首消费):

```ts
// 现 engine.ts L170-182:
let capturedSessionId: string | undefined
const wrappedSpawn = async (resumeSessionId?: string): Promise<string> =>
  userSpawn
    ? userSpawn(agentDef)
    : defaultSpawn(agentDef, { expertName, ...(resumeSessionId ? { resumeSessionId } : {}),
        onSessionId: (id) => { capturedSessionId = id } })
void capturedSessionId  // ← 占位删除 (Phase 3.1 首消费)

// Phase 3.1 ADD ~10-15L:
import { writeCheckpoint } from '../checkpoint/template.js'
import { activate, pause, complete } from '../checkpoint/state.js'

process.on('SIGINT', async () => {
  await pause()
  await writeCheckpoint({ schemaVersion: 'harnessed.checkpoint.v1', phase: task.task_type, status: 'paused',
    last_task: 'SIGINT-trapped', key_decisions: [], canonical_refs: [], session_id: capturedSessionId,
    timestamp: new Date().toISOString(), archive_path: '' })
  process.exit(130)  // 128 + SIGINT signal num
})

// 在 ralphLoopWrap 成功 return 之前加:
const result = await ralphLoopWrap(wrappedSpawn, maxIter)
await writeCheckpoint({ schemaVersion: 'harnessed.checkpoint.v1', phase: task.task_type, status: 'complete',
  last_task: 'engine.runRouting complete', key_decisions: [], canonical_refs: [],
  session_id: capturedSessionId, timestamp: new Date().toISOString(), archive_path: '' })
await complete()
return { ok: true, result, matchedRule: matched }
```

### 2.6 `src/types/schemaVersion.ts` MODIFY (8th surface `current-workflow.v1`) — analog: 现 L34-54

**ADAPT 8th surface 添加** (现 L34-42 7-surface const + L46-54 Union):

```ts
// 现 L34-42 (checkpoint 已在 L41):
export const SCHEMA_VERSIONS = {
  routingSnapshot: 'harnessed.routing-snapshot.v1',
  handoffDoc: 'harnessed.handoff-doc.v1',
  phasesYaml: 'harnessed.phases-yaml.v1',
  manifestState: 'harnessed.manifest-state.v1',
  installerState: 'harnessed.installer-state.v1',
  routeDecisionLog: 'harnessed.route-decision-log.v1',
  checkpoint: 'harnessed.checkpoint.v1',
  currentWorkflow: 'harnessed.current-workflow.v1',  // ← Phase 3.1 ADD 8th surface
} as const

// L46-54 Union 加 8th entry:
export const SchemaVersionLiteral = Type.Union([
  Type.Literal(SCHEMA_VERSIONS.routingSnapshot),
  // ... 7 现有 ...
  Type.Literal(SCHEMA_VERSIONS.currentWorkflow),    // ← ADD
])
```

### 2.7 `.github/workflows/ci.yml` W0.3 README completeness check — analog: L177-187 counter gate

**COPY bash exit-1 模式** (现 L177-187 三计数一致 sister pattern, B-04 shell:bash):

```yaml
# Phase 3.1 W0.3 — README completeness check (KICKOFF § 4 T4).
# 沿袭 Phase 2.4 W0 D-03 counter gate (L177-187). consistency (三计数等) + completeness (覆盖) 互补.
- name: README completeness check (Phase 3.1 W0.3)
  run: |
    STATE_SHIPPED=$(grep -cE "Phase [0-9]+\.[0-9]+ SHIPPED" .planning/STATE.md)
    README_SHIPPED=$(grep -cE "^- \*\*Phase [0-9]+\.[0-9]+ shipped\*\* ✅" README.md)
    if [ "$STATE_SHIPPED" != "$README_SHIPPED" ]; then
      echo "::error::README completeness drift: STATE.md=$STATE_SHIPPED README.md=$README_SHIPPED"
      exit 1
    fi
    echo "README completeness ✅ STATE=$STATE_SHIPPED README=$README_SHIPPED"
```

### 2.8 `tests/integration/checkpoint-e2e.test.ts` (NEW) — analog: sdk-spawn.test.ts L158-198 session_id capture

**COPY § "session_id capture + resume propagation"** (现 sdk-spawn.test.ts L157-198 直接 analog,加 SIGINT mock):

```ts
// tests/integration/checkpoint-e2e.test.ts — D-04 WIRE-IN e2e verify.
describe('checkpoint e2e — SIGINT trap + SDK session redirect', () => {
  it('SIGINT during ralph-loop → state.json paused + checkpoint carries session_id', async () => {
    // mock SDK init session_id (sister sdk-spawn.test.ts L158-171)
    nextMessages = [{ type: 'system', subtype: 'init', session_id: 'sess-trap-1' }, /* never reach result */]
    const promise = sdkSpawn(baseDef, { expertName: 'e' })
    process.emit('SIGINT')                                       // fire SIGINT trap
    // ... assert .harnessed/current-workflow.json status='paused' + session_id captured ...
  })

  it('harnessed resume → SDK options.resume = captured session_id (sister L173-184)', async () => {
    // ... harnessed resume CLI invoke → read state → next runRouting call → options.resume === 'sess-trap-1' ...
  })
})
```

---

## § 3 Cross-cutting Patterns (apply across all NEW files)

### 3.1 Schema registration discipline (Phase 2.2 CD-5)
**Source**: `src/types/schemaVersion.ts` L34-67 (SCHEMA_VERSIONS const + SchemaVersionLiteral Union + branchOnSchemaVersion helper)
**Apply to**: ALL checkpoint schema files (#1, #2) + ALL consumer reads (#3 template, #4 state, #5 resume, #15 engine)
**Rule**: 新 schema 必须 (a) 注册到 SCHEMA_VERSIONS const, (b) 加 Type.Literal 到 SchemaVersionLiteral Union, (c) 所有 consume 走 `branchOnSchemaVersion<T>(v, { v1: ..., unknown: ... })` helper (不裸 string 比对);Wave 验收 `grep -r "branchOnSchemaVersion" src/` ≥ 3 references (现 ≥2 baseline,本 phase +1 = checkpoint consumer)

### 3.2 TypeBox + Value.Check runtime validate (Phase 2.2 loadPhases)
**Source**: `src/workflow/loadPhases.ts` L23-30
**Apply to**: ALL checkpoint write (#3 template) + ALL state read (#4 state) + resume validate (#5)
**Rule**: read JSON → `Value.Check(Schema, parsed)` → false → `Value.Errors(...)` 累积 → throw `*ValidationError` extends Error;write 前 self-validate 防 schema drift

### 3.3 Karpathy hard limit ≤200L/file (B-06 + B-26)
**Source**: `src/routing/engine.ts` 195L (≤200 hard cap) + `src/cli/doctor.ts` 175L (≤215 5% tolerance per B-03)
**Apply to**: `src/checkpoint/{template,state,resume}.ts` 各 ≤80-100L per CONTEXT D-02 hint;若超 hard limit → 抽 lib helper (sister doctor → origin-check.ts)

### 3.4 CLI exit code map (Phase 2.2 B-10)
**Source**: `src/cli/execute-task.ts` L40-95 (0 = COMPLETE / 1 = FAIL / 2 = USAGE/aborted)
**Apply to**: `src/cli/resume.ts` (#7) — 沿袭 0/1/2 三档;D-03 hint exit 1 = no paused phase / file corrupt / schema 不匹配 fail loud

### 3.5 Win shell flavor B-04 (Phase 2.3 W0 + Phase 2.4 W6)
**Source**: `.github/workflows/ci.yml` L141-148 ralph-loop Win sentinel (`if: runner.os == 'Windows'` + `shell: bash` Git Bash 验过路径)
**Apply to**: W0.3 README completeness check yaml (#17) — sister cross-OS bash run

---

## § 4 Reuse Pct Summary

| Category | Reuse % | Detail |
|----------|---------|--------|
| `src/checkpoint/schema/checkpoint.v1.ts` NEW | **~90%** | TypeBox phases.ts shape 直接复刻 |
| `src/checkpoint/schema/current-workflow.v1.ts` NEW | **~95%** | 同上 |
| `src/checkpoint/template.ts` NEW | **~70%** | Value.Check pattern + 新 write 逻辑 |
| `src/checkpoint/state.ts` NEW | **~60%** | discriminated union + 3-state transition |
| `src/checkpoint/resume.ts` NEW | **~65%** | doctor --json 输出 + 新 resume 逻辑 |
| `src/checkpoint/index.ts` barrel | **~95%** | plain re-export |
| `src/cli/resume.ts` NEW | **~85%** | execute-task.ts + doctor.ts register skeleton |
| tests/checkpoint/*.test.ts NEW × 3 | **~78%** | sdk-spawn.test.ts vi.mock + describe skeleton |
| tests/integration/checkpoint-e2e.test.ts | **~90%** | sdk-spawn.test.ts § session_id 段直接 analog |
| `src/cli.ts` 12th register | **~99%** | additive 1 行 |
| `src/routing/lib/sdkSpawn.ts` wire | **~100%** | ZERO-LINE — closure infra 已 ready |
| `src/routing/lib/ralphLoop.ts` wire | **~100%** | ZERO-LINE — 接口已 ready |
| `src/routing/engine.ts` checkpoint trigger | **~95%** | minimal ADD ~10-15L (capturedSessionId 占位删) |
| `src/types/schemaVersion.ts` 8th surface | **~70%** | partial (checkpoint 已注册, current-workflow 新加) |
| `.github/workflows/ci.yml` W0.3 step | **~95%** | counter gate L177-187 sister |
| Docs W0.1+W0.2 (MILESTONE-AUDIT + RETROSPECTIVE) | **~78%** | Phase 2.4 ship sister transparency 模式 |

**总 reuse %**: **~85%** (14 target average; 高 reuse 因 Phase 2.2 T4.4 closure infra 三件套 100% ready + Phase 2.4 PATTERNS 风格沿袭 + Phase 2.2 schemaVersion CD-5 单一兼容门已建)

**对比 Phase 2.4**: 76% (末 phase 复杂度);Phase 3.1 ~85% 反映 infra-底座 phase 大量复用 Phase 2.2 closure infra 红利

---

## § 5 Path Dependency (Wave A Fresh Research 应覆盖)

R2 RESEARCH 应覆盖 3 项 (D-01~D-04 主决议已锁,R2 聚焦 Claude's Discretion + 实测调用):

1. **SSE channel reuse 评估** (CONTEXT Claude's Discretion #1) — Phase 2.4 dashboard SSE watcher 已实装 `.planning/STATE.md` 监控。 R2 spike 1 hour 评估 checkpoint write 是否复用同 SSE channel 触发 push (复用 0 新代码) vs 单独 channel `/api/checkpoints`。 推荐复用。 影响 § 2.5 engine.ts checkpoint write 之后是否 chain 触发 `dashboard.notify(...)` 调用。

2. **compact 协议触发阈值实测** (CONTEXT Claude's Discretion #3) — token threshold 估算 (`Buffer.byteLength / 4` Heuristic) 数字 (40k? 60k?) 需 dogfood 实测。 R2 spike 1 cell 跑现有 phase log 测 baseline 分布。 推荐 60k 起 (留 context window 60% headroom)。 影响 compact 协议 trigger condition implementation。

3. **SIGINT trap 跨 OS 行为验** — Node `process.on('SIGINT', ...)` 在 Win (Ctrl+C 行为) vs macOS/Linux (signal 行为) 差异;Win 上 SIGINT 处理是否能完成 async checkpoint.write before exit (`process.exit(130)` 是否 flush 文件) 需实测。 影响 § 2.5 engine.ts SIGINT handler 是否需加 `setImmediate` 或 sync write 退化路径。

**额外 R1 PATTERNS 输出 (本文档已覆盖)**:
- TypeBox checkpoint schema 是否抽独立 `src/checkpoint/schema/` 目录 (CONTEXT Claude's Discretion #5) → **PATTERNS 推荐 a** (独立目录,Karpathy 单一职责,沿袭 manifest schema modular pattern,§ 1 #1 + #2 已 path 化 `src/checkpoint/schema/`)
- 文件命名 `checkpoint.v1.ts` 而非 `checkpoint-v1.ts` (沿袭 schemaVersion 文档约定 `harnessed.<surface>.v1` 字面)

**Wave A R1+R2 并行可行性**: ✅ R1 (本文档) 与 R2 (3 项 fresh research) 完全独立 — R1 mapping analog reuse %,R2 实测 SSE/threshold/SIGINT。 Wave B planner 同时消费 R1+R2 输出生成 PLAN.md。

---

**PATTERN MAPPING COMPLETE** — Wave B (planner) 启动准备;Wave A R2 RESEARCH 可并行进行。
