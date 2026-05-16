# Phase 3.2: gstack 前缀探测 + workflow 变量插值 + plan-feature reference 实装 — Pattern Map

> **Mapped**: 2026-05-16
> **Mapper**: gsd-pattern-mapper (Claude Opus 4.7, 1M ctx)
> **Files analyzed**: 17 NEW / MODIFY targets (per CONTEXT.md D-01~D-04 + W0 backlog 3 项)
> **Analogs found**: 17 / 17 (100% — Phase 3.1 W3 engineHook + Phase 2.4 origin-check + Phase 2.2 loadPhases/schemaVersion 全覆盖)
> **Style**: 沿袭 Phase 3.1 PATTERNS.md (§ 1 table + § 2 concrete excerpts + § 3 cross-cutting + § 4 reuse summary + § 5 path dependency)

---

## § 1 NEW / MODIFY Targets → Existing Analog Mapping

| # | Target | Role | Data Flow | Closest Analog | Reuse % | Copy vs Adapt |
|---|--------|------|-----------|----------------|---------|---------------|
| **NEW infra (W1+W2)** ||||||||
| 1 | `src/cli/lib/probe-gstack.ts` (~50L PRIMARY) | utility (helper) | request-response (spawnSync × 2 → `'gstack-' \| '' \| null` discriminated) | `src/cli/lib/origin-check.ts` L1-80 (sister-share helper, spawnSync wrap + 3-tier status enum + `checkOrigin(cwd, opts)` 单职责) | **~90%** | **COPY** origin-check.ts header comment (Phase 2.4 W3 sister-share extract rationale + Karpathy ≤80L 守门) + `spawnSync('which', [...], { encoding: 'utf8' })` + Win finder switch (sister `doctor.ts` L80 `process.platform === 'win32' ? 'where' : 'which'`); **ADAPT** logic: probe `'gstack-office-hours'` 再 probe `'office-hours'` → 4 状态分支 (`gstack-only` / `bare-only` / `both`→fallback / `neither`→fail-loud); 返 `{ prefix: 'gstack-' \| '' \| null, source: 'detected' \| 'ambiguous' \| 'missing', detail: string }` discriminated union (D-01 PROBE locked) |
| 2 | `src/workflow/interpolate.ts` (~30L) | utility | request-response (string template + vars → string) | `src/workflow/loadPhases.ts` L23-30 (TypeBox + Value.Check + throw custom error class 模式) | **~50%** | **COPY** custom error class declaration shape (`InterpolationError extends Error`) + throw-on-failure 模式 (沿袭 PhasesValidationError L15-20);**ADAPT** core logic: regex `/\{\{\s*(\w+)\s*\}\}/g` 找所有 placeholder → `vars[name]` 替换 → undefined → throw `InterpolationError` (Karpathy fail-loud); escape `\{\{ not_a_var \}\}` literal preserve 走 negative-lookbehind 或 pre-pass replace 步骤 (D-02 JINJA locked); zero dep (sister Karpathy YAGNI Phase 3.1 D-02 KARPATHY) |
| 3 | `src/workflow/governance.ts` (~25L) | service (state reader) | request-response (read JSON + Value.Check → discriminated result) | `src/checkpoint/state.ts` L23-41 (readCurrentWorkflow 模式 — `branchOnSchemaVersion<T>()` + Value.Check + fail-soft null return) | **~70%** | **COPY** state.ts L23-41 read 模式直接 analog (read JSON → JSON.parse try → branchOnSchemaVersion → v1 Value.Check → null on fail);**ADAPT** GovernanceV1 schema 字段 + `isVetoed()` 单行 wrap (`(await readGovernance())?.status === 'vetoed'`); 沿袭 D-04 hint PUSH lazy-read 模式 (workflow phase 转换前 1 次 read, 不轮询) |
| 4 | `src/workflow/run.ts` (~80L NEW) | service (workflow runner) | event-driven (phase iter → governance poll → skill spawn stub → checkpoint write → next) | `src/checkpoint/engineHook.ts` L21-48 (single-responsibility orchestrator wedge + Phase 3.1 engine.ts ralphLoop iter 范式) | **~60%** | **COPY** engineHook.ts `activatePhase` / `completePhase` 单职责 pattern + Phase 3.1 engine.ts ralph-loop for-loop skeleton;**ADAPT** 5-phase 桩 iter (loadPhases → for phase: if isVetoed → state.pause() + return / else: spawnSkillStub(phase) → engineHook.completePhase) — WIRED 中庸 (D-03 locked) 不接外部 spawn; 每 phase 之间 sessionId propagate (Phase 3.1 D-04 WIRE-IN T4.4 closure consumer 二代) |
| 5 | `src/checkpoint/schema/governance.v1.ts` (~25L, **9th surface candidate**) | schema (TypeBox) | declarative | `src/checkpoint/schema/checkpoint.v1.ts` (Phase 3.1 sister TypeBox + `additionalProperties: false`) + currentWorkflow.v1.ts 单 `Type.Object` shape | **~95%** | **COPY** TypeBox import + `Type.Object({...}, { additionalProperties: false })` shape + `Static<>` 双 export 模式 — sister Phase 3.1 W1 T1.1 + T1.2 sister;**ADAPT** field set per D-04 sample: `schemaVersion: Type.Literal(SCHEMA_VERSIONS.governance)` + `status: Type.Union([Type.Literal('active'), Type.Literal('vetoed')])` + `reason: Type.Optional(Type.String())` + `vetoed_at: Type.Optional(Type.String({ format: 'date-time' }))` + `vetoed_by: Type.Optional(Type.String())`; **Wave 0 R2 决**: 推荐独立 9th surface (sister Phase 3.1 W1 8th surface 模式, single-responsibility) over 复用 current-workflow.v1 |
| **NEW config (W3)** ||||||||
| 6 | `workflows/plan-feature/workflow.yaml` (~40L) | config (DSL) | declarative | `workflows/execute-task/phases.yaml` (Phase 2.2 W3) `workflow:` + `phases:` array + per-phase `{id, name, upstream, model, skills, max_iterations}` | **~80%** | **COPY** YAML shape + per-phase fields (id/name/upstream/model/skills/max_iterations) — sister execute-task/phases.yaml L1-28 直接 analog;**ADAPT** 5 phase 自 R7.1 plan-feature 流水 (gstack-decision → brainstorm → gsd-discuss → gsd-plan → persist) + invokes JINJA template `invokes: '{{ gstack_prefix }}office-hours'` (D-02 模板) + `on_veto: halt_workflow` per-workflow level field (D-03 + D-04 contract);model tier: opus×2 (decision + discuss) / sonnet×2 (brainstorm + plan) / haiku (persist 省 token sister 04-deliver) |
| 7 | `skills/plan-feature-{decision,brainstorm,discuss,plan,persist}/SKILL.md` (~10L each × 5 = ~50L) | skill stub (markdown) | declarative | `.claude/skills/*/SKILL.md` 既存 patterns (description + body 桩) | **~85%** | **COPY** SKILL.md frontmatter + body shape (sister `.claude/skills/` 既存);**ADAPT** 5 桩 body 仅返 mock `{status:'ok', output:'<stub for plan-feature-{phase}>', decision:'mock-approved'}` — minimal Karpathy (specifics § Phase 3.2 D-03 stub sample), Phase 3.3+ dogfood 时换真 spawn |
| **MODIFY wire-in (W1)** ||||||||
| 8 | `src/cli/doctor.ts` 加 6th check `checkGstackPrefix` (~5-8L delta) | dispatch | declarative (register + dispatch) | 现 `src/cli/doctor.ts` L130-134 `checkOriginUrl` dynamic import + delegate 模式 + L142-148 `results: CheckResult[]` push | **~95%** | **COPY-additive** sister `checkOriginUrl` L130-134 范式: `async function checkGstackPrefix(): Promise<CheckResult> { const { probeGstack } = await import('./lib/probe-gstack.js'); const r = probeGstack(); return { name: 'gstack prefix', status: r.status, message: r.detail, fix: r.fix } }`; **ADD** L147 后加 `await checkGstackPrefix()` 进 results array; doctor.ts header L139 description 串 加 "gstack prefix"; **Karpathy 守门**: 6th check 主 logic 全在 helper (probe-gstack.ts ~50L), doctor.ts delta ≤8L → 215+8 = 223L 仍超 200 hard limit 5% tolerance 已用 (B-03); **planner 决**是否进一步 split 5 check 全 helper-ize 把 doctor.ts 拉回 ≤200L sister Phase 3.1 engine.ts W-01 PRIMARY extract precedent |
| 9 | `src/workflow/loadPhases.ts` extend interpolateInvokes step (~5-8L) | service (loader) | request-response | 现 `src/workflow/loadPhases.ts` L22-30 `loadPhases(yamlPath)` read → parseYaml → Value.Check 三步;模板插值 = 第 4 步 (在 parseYaml 之后, Value.Check 之前 OR Value.Check 之后 walk phases.invokes 字段) | **~80%** | **MINIMAL ADD** ~5-8L: import `interpolate` from `./interpolate.js` + 在 Value.Check pass 后 `for (const ph of parsed.phases) if (ph.invokes) ph.invokes = interpolate(ph.invokes, vars)`; vars 来源 `.harnessed/config.json` `gstack_prefix` field 走 read helper; **planner 决** vars 注入是 loadPhases 参数 (sig change `loadPhases(yamlPath, vars?)`) OR loadPhases 内部 lazy-read config (后者沿袭 state.ts L23-41 fail-soft 模式) |
| 10 | `src/types/schemaVersion.ts` 加 9th surface (~4-5L if D-04 决 NEW) | schema registry | declarative | 现 L36-44 SCHEMA_VERSIONS const 8 entry + L49-58 SchemaVersionLiteral Union 8 entry (Phase 3.1 W1 T1.1 8th surface 范式) | **~95%** | **COPY-additive** Phase 3.1 W1 T1.1 add 范式直接 analog: `governance: 'harnessed.governance.v1'` 加到 SCHEMA_VERSIONS const + `Type.Literal(SCHEMA_VERSIONS.governance)` 加到 SchemaVersionLiteral Union; **沿袭 CD-5** 单一兼容门 discipline + B-32 grep 验收 "≥ 8 → ≥ 9 `harnessed.\w+.v1` references" |
| **MODIFY W0 (must-fix first)** ||||||||
| 11 | `tests/unit/cli-audit.test.ts` (W0.1 env-dep CI red fix ~20-30L delta) | unit test | request-response (mock fs + spawn + assert exit code) | `tests/cli/doctor.test.ts` L6-8 完整 mock 套 (`vi.mock('node:child_process')` + `vi.mock('node:fs/promises')` + `vi.mock('node:fs')`) + `tests/cli/audit.test.ts` L9-10 runtime-layer mock 范式 | **~85%** | **COPY** doctor.test.ts L6-8 三件套完整 mock 范式 + L47-60 `mockSpawn()` helper 模式 (per-cell setup spawnSync responses);**ADAPT** 选 path A (拆 cli-audit.test.ts 仅 manifest-layer + add vi.mock spawnSync/readFileSync 覆盖 runtime layer) OR path B (删 cli-audit.test.ts 改 manifest-layer 进 cli/audit.test.ts); **planner 决** 推荐 path A 沿袭 doctor.test.ts 单文件双 layer mock 范式 (sister Phase 2.4 W1+W4 test pairing) |
| 12 | `.github/workflows/ci.yml` (W0.2 ENFORCE flip ~3L delta) | CI gate | declarative | 现 `ci.yml` L199-201 README completeness step `continue-on-error: true` (Phase 3.1 W0.3 warn-only round 1) + L114-116 + L132-134 Phase 2.3 sister `continue-on-error: true` deferred-items pattern | **~99%** | **MINIMAL DELETE** L201 `continue-on-error: true` 1 行 (ENFORCE flip → fail-on-drift); 沿袭 Phase 3.1 W0.3 注册 prereq 兑现 cadence; **不动** L114-116 + L132-134 其他 warn-only step (各自 Phase 自决何时 flip — 本 phase 仅 flip W0.3 README completeness 是本 phase prereq) |
| 13 | STATE.md + README.md format normalize (W0.2 prereq ~10L delta) | docs | declarative | sister Phase 2.2 STATUS_MARKER convention (line-start `- **Phase X.Y shipped** ✅` SSOT) — `README.md` L46-56 既有格式 line-start; `STATE.md` L23a 既有混合 (line-mid prose `Phase X.Y SHIPPED`) | **~80%** | **ADAPT** STATE.md 格式选 README line-start `- **Phase X.Y shipped** ✅` SSOT (sister Phase 2.2 convention); STATE.md per-phase entries 加 line-start marker 兼容 grep; ci.yml L203 `grep -cE` regex 已 robust handle 两 format (兼容门), 本 phase 仅 docs format normalize 让 W0.2 ENFORCE flip 后 STATE.md + README.md count equal; **planner 决** 具体 STATE.md 哪些 entries 需补 line-start marker (推荐 Phase 1.1~3.1 全 entry 一次清) |
| **NEW tests (W2+W3)** ||||||||
| 14 | `tests/workflow/interpolate.test.ts` (~50L, 6 fixtures) | unit test | request-response | `tests/cli/doctor.test.ts` describe/it/beforeEach skeleton (~100L) + sister Phase 3.1 W2 `tests/checkpoint/template.test.ts` Value.Check assert 模式 | **~80%** | **COPY** doctor.test.ts L62-100 describe/it skeleton + beforeEach mock reset 范式;**ADAPT** 6 fixtures (CONTEXT specifics § D-02 列): happy single var / 多 var / 未定义 var throw `InterpolationError` / 空 string / nested `{{ {{ var }} }}` unsupported throw / escape `\{\{ not_a_var \}\}` literal preserve — Karpathy fail-loud discipline |
| 15 | `tests/workflow/governance.test.ts` (~40L, 4 fixtures) | unit test | request-response (mock fs + assert state) | `tests/checkpoint/state.test.ts` (Phase 3.1 W2 sister, vi.mock fs/promises + Value.Check assert) — checkpoint state machine analog | **~85%** | **COPY** state.test.ts vi.mock('node:fs/promises') + readFile fixture 模式 + Value.Check assert 范式 (sister Phase 3.1 W2 直接 analog);**ADAPT** 4 fixtures: file missing → readGovernance() returns null + isVetoed() returns false / status='active' → isVetoed() false / status='vetoed' → isVetoed() true / corrupt JSON → null fail-soft (沿袭 state.ts L33-35 try/catch fail-soft 模式) |
| 16 | `tests/integration/plan-feature-wired.test.ts` (~80L, 2 fixtures) | integration test | event-driven (workflow runner + governance + checkpoint 三件 wire e2e) | `tests/integration/checkpoint-e2e.test.ts` (Phase 3.1 W4 sister, e2e workflow trigger + state assert) — workflow.run.ts 是首消费者 | **~80%** | **COPY** checkpoint-e2e.test.ts describe/it skeleton + sister Phase 3.1 e2e 验收 范式 (process state assert + fs assert);**ADAPT** 2 fixtures (CONTEXT D-03 + D-04): (a) 5 phase 全跑通 happy path → checkpoint 5 entries + state.complete 触发 / (b) 第 2 phase 前 governance.json status='vetoed' → state.pause + halt_workflow + 剩余 phase 不执行 + 最新 checkpoint phase=2 status='paused'; sessionId 传递 across 5 phase 验 |
| 17 | `tests/cli/doctor-gstack-probe.test.ts` (~60L, 5 fixtures) | unit test | request-response | 现 `tests/cli/doctor.test.ts` L62-100 5-check + --json + exit policy 全套 (Phase 2.4 W1 sister) | **~90%** | **COPY** doctor.test.ts mock spawnSync 全套 + cell skeleton 直接 analog;**ADAPT** 5 fixtures: cell 1 — `gstack-office-hours` only → prefix='gstack-' pass / cell 2 — `office-hours` only → prefix='' pass / cell 3 — both → fallback prompt + fail (CI/headless Karpathy fail-loud) / cell 4 — neither → fail + fix hint / cell 5 — `--json` 输出 prefix field structure verify (sister doctor.test.ts cell 4 `--json` 范式) |

---

## § 2 Per-target Concrete Code Excerpts

### 2.1 `src/cli/lib/probe-gstack.ts` (NEW ≤50L) — analog: `src/cli/lib/origin-check.ts` L1-80

**COPY origin-check.ts header + spawnSync wrap + 3-tier status enum + Win finder switch** (sister `doctor.ts` L80):

```ts
// src/cli/lib/probe-gstack.ts — Phase 3.2 W1 T1.1 — sister-share helper for
// doctor #6 (PROBE mode, D-01 LOCKED). Karpathy hard limit ≤50L per sister
// origin-check.ts pattern. Probes 3 states: `gstack-` only / `office-hours`
// only (bare) / both OR neither → fallback fail-loud.
import { spawnSync } from 'node:child_process'

export interface ProbeGstackResult {
  status: 'pass' | 'warn' | 'fail'
  prefix: 'gstack-' | '' | null  // null = ambiguous/missing
  detail: string
  fix?: string
}

function which(cmd: string): boolean {
  const finder = process.platform === 'win32' ? 'where' : 'which'
  const r = spawnSync(finder, [cmd], { encoding: 'utf8' })
  return r.status === 0 && (r.stdout?.trim().length ?? 0) > 0
}

export function probeGstack(): ProbeGstackResult {
  const hasPrefixed = which('gstack-office-hours')
  const hasBare = which('office-hours')
  if (hasPrefixed && !hasBare) return { status: 'pass', prefix: 'gstack-', detail: 'gstack-office-hours detected' }
  if (!hasPrefixed && hasBare) return { status: 'pass', prefix: '', detail: 'office-hours (bare) detected' }
  if (hasPrefixed && hasBare) return {
    status: 'fail', prefix: null,
    detail: 'both `gstack-office-hours` AND `office-hours` detected — ambiguous',
    fix: 'set `gstack_prefix` explicitly in .harnessed/config.json (one of: "gstack-", "")',
  }
  return {
    status: 'fail', prefix: null,
    detail: 'neither gstack-office-hours nor office-hours found in PATH',
    fix: 'install gstack (e.g. `npm i -g gstack-suite`) — see https://github.com/...',
  }
}
```

### 2.2 `src/workflow/interpolate.ts` (NEW ≤30L) — analog: `src/workflow/loadPhases.ts` L15-30 custom error class

**COPY error class shape + ADAPT regex replace logic** (D-02 JINJA locked, zero-dep):

```ts
// src/workflow/interpolate.ts — Phase 3.2 W2 T2.1 (D-02 JINJA LOCKED).
// Karpathy YAGNI hard limit ≤30L — no mustache/handlebars dep (sister Phase 3.1
// D-02 KARPATHY 3-state precedent: zero FSM-lib for 3 states / zero template-lib
// for 2-line regex replace).

export class InterpolationError extends Error {
  constructor(public variable: string, public template: string) {
    super(`interpolate: variable '{{ ${variable} }}' not provided (template excerpt: ${template.slice(0, 60)}...)`)
    this.name = 'InterpolationError'
  }
}

const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g
const ESCAPE = /\\\{\\\{\s*(\w+)\s*\\\}\\\}/g  // \{\{ name \}\} literal preserve

export function interpolate(template: string, vars: Record<string, string>): string {
  // Step 1: stash escaped sequences with sentinel
  const SENTINEL = '\x00ESC\x00'
  const escaped: string[] = []
  let stashed = template.replace(ESCAPE, (_, name: string) => {
    escaped.push(`{{ ${name} }}`)
    return `${SENTINEL}${escaped.length - 1}${SENTINEL}`
  })
  // Step 2: replace real {{ var }} placeholders; throw on missing var
  stashed = stashed.replace(PLACEHOLDER, (_, name: string) => {
    if (!(name in vars)) throw new InterpolationError(name, template)
    return vars[name] ?? ''
  })
  // Step 3: restore escaped sequences
  return stashed.replace(new RegExp(`${SENTINEL}(\\d+)${SENTINEL}`, 'g'), (_, i) => escaped[Number(i)] ?? '')
}
```

### 2.3 `src/workflow/governance.ts` (NEW ≤25L) — analog: `src/checkpoint/state.ts` L23-41 readCurrentWorkflow

**COPY state.ts read 模式直接 analog** (D-04 PUSH lazy-read locked):

```ts
// src/workflow/governance.ts — Phase 3.2 W2 T2.2 (D-04 PUSH LOCKED).
// Sister of src/checkpoint/state.ts:23-41 (fail-soft read + branchOnSchemaVersion).
// gstack writes .harnessed/governance.json (not in this phase scope); harnessed
// reads lazy-once before each workflow phase transition (NOT polling — sister
// Phase 2.4 SSE polling anti-pattern lesson).

import { readFile } from 'node:fs/promises'
import { Value } from '@sinclair/typebox/value'
import { branchOnSchemaVersion } from '../types/schemaVersion.js'
import { GovernanceV1, type GovernanceV1Type } from '../checkpoint/schema/governance.v1.js'

const GOV_PATH = '.harnessed/governance.json'

export async function readGovernance(): Promise<GovernanceV1Type | null> {
  let raw: string
  try { raw = await readFile(GOV_PATH, 'utf8') } catch { return null }
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { return null }
  const v = (parsed as { schemaVersion?: string }).schemaVersion ?? ''
  return branchOnSchemaVersion(v, {
    v1: () => (Value.Check(GovernanceV1, parsed) ? (parsed as GovernanceV1Type) : null),
    unknown: () => null,
  })
}

export async function isVetoed(): Promise<boolean> {
  return (await readGovernance())?.status === 'vetoed'
}
```

### 2.4 `src/checkpoint/schema/governance.v1.ts` (NEW ≤25L) — analog: `src/checkpoint/schema/checkpoint.v1.ts` + currentWorkflow.v1.ts

**COPY Phase 3.1 sister TypeBox shape直接复刻** (9th surface candidate, Wave 0 R2 lock):

```ts
// src/checkpoint/schema/governance.v1.ts — Phase 3.2 W1 T1.2 — 9th surface
// (D-04 PUSH + CD-5 single 兼容门 discipline). Sister Phase 3.1 W1 T1.1 + T1.2
// (checkpoint.v1 + currentWorkflow.v1 sister TypeBox shape).
import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

export const GovernanceStatus = Type.Union([
  Type.Literal('active'),
  Type.Literal('vetoed'),
])

export const GovernanceV1 = Type.Object(
  {
    schemaVersion: Type.Literal(SCHEMA_VERSIONS.governance),  // 'harnessed.governance.v1'
    status: GovernanceStatus,
    reason: Type.Optional(Type.String()),
    vetoed_at: Type.Optional(Type.String({ format: 'date-time' })),
    vetoed_by: Type.Optional(Type.String()),  // e.g. 'CEO' (gstack role)
  },
  { additionalProperties: false },
)

export type GovernanceV1Type = Static<typeof GovernanceV1>
```

### 2.5 `src/cli/doctor.ts` MODIFY (加 6th check) — analog: 现 L130-148

**MINIMAL ADD ~5-8L** (沿袭 L130-134 `checkOriginUrl` dynamic import + delegate 模式):

```ts
// 现 L130-134 (checkOriginUrl sister):
async function checkOriginUrl(): Promise<CheckResult> {
  const { checkOrigin } = await import('./lib/origin-check.js')
  const r = checkOrigin(process.cwd(), { allowFork: true })
  return { name: 'origin URL', status: r.status, message: r.detail, fix: r.fix }
}

// Phase 3.2 W1 ADD ~6L (6th check):
async function checkGstackPrefix(): Promise<CheckResult> {
  const { probeGstack } = await import('./lib/probe-gstack.js')
  const r = probeGstack()
  return { name: 'gstack prefix', status: r.status, message: r.detail, fix: r.fix }
}

// 现 L142-148 (results array — ADD 1 行 push):
const results: CheckResult[] = [
  checkNodeVersion(),
  await checkMcpScope(),
  checkJq(),
  checkWinBash(),
  await checkOriginUrl(),
  await checkGstackPrefix(),  // ← Phase 3.2 W1 ADD 6th check
]
// description 串 L139 加 'gstack prefix' (e.g. 'Preflight checks (Node / MCP / jq / Win bash / origin / gstack prefix)')
```

### 2.6 `src/workflow/run.ts` (NEW ≤80L) — analog: `src/checkpoint/engineHook.ts` L21-48 + Phase 3.1 engine.ts ralph-loop iter

**ADAPT 5-phase iter + governance gate + checkpoint write** (D-03 WIRED 中庸 locked):

```ts
// src/workflow/run.ts — Phase 3.2 W2 T2.3 (D-03 WIRED LOCKED, D-04 PUSH consume).
// Sister Phase 3.1 W3 engineHook.ts pattern: single-responsibility orchestrator
// wedge. WIRED 中庸: 5-phase 桩跑 governance + checkpoint 真 wire, 不接外部 spawn.
import { loadPhases } from './loadPhases.js'
import { interpolate } from './interpolate.js'
import { isVetoed } from './governance.js'
import { activatePhase, completePhase } from '../checkpoint/engineHook.js'
import { pause as statePause } from '../checkpoint/state.js'

export interface WorkflowRunResult { status: 'complete' | 'paused-veto'; phasesRun: number }

// 5-phase stub spawner — Phase 3.3+ dogfood 时换真 spawn (gsd-discuss/plan/execute).
async function spawnSkillStub(skillId: string): Promise<{ status: 'ok'; output: string }> {
  return { status: 'ok', output: `<stub for ${skillId}>` }
}

export async function runWorkflow(yamlPath: string, vars: Record<string, string>): Promise<WorkflowRunResult> {
  const phases = loadPhases(yamlPath)
  let sessionId: string | undefined
  for (const ph of phases.phases) {
    // D-04 PUSH lazy-read governance gate (1 read per phase, not polling)
    if (await isVetoed()) {
      await statePause()
      return { status: 'paused-veto', phasesRun: phases.phases.indexOf(ph) }
    }
    await activatePhase(ph.id)
    // interpolate skill invokes (e.g. '{{ gstack_prefix }}office-hours')
    const invoke = ph.skills?.[0] ?? ph.id
    const resolved = interpolate(invoke, vars)
    const r = await spawnSkillStub(resolved)
    await completePhase({ phaseId: ph.id, ...(sessionId ? { sessionId } : {}), status: 'complete', lastTask: `phase ${ph.id} complete: ${r.output}` })
  }
  return { status: 'complete', phasesRun: phases.phases.length }
}
```

### 2.7 `src/types/schemaVersion.ts` MODIFY (9th surface `governance.v1`) — analog: 现 L36-58 (Phase 3.1 W1 T1.1 8th surface 范式)

**COPY-additive Phase 3.1 8th surface 范式直接 analog** (CD-5 单一兼容门 discipline):

```ts
// 现 L36-44 (SCHEMA_VERSIONS const, 8 entry — currentWorkflow 是 Phase 3.1 加的 8th):
export const SCHEMA_VERSIONS = {
  routingSnapshot: 'harnessed.routing-snapshot.v1',
  handoffDoc: 'harnessed.handoff-doc.v1',
  phasesYaml: 'harnessed.phases-yaml.v1',
  manifestState: 'harnessed.manifest-state.v1',
  installerState: 'harnessed.installer-state.v1',
  routeDecisionLog: 'harnessed.route-decision-log.v1',
  checkpoint: 'harnessed.checkpoint.v1',
  currentWorkflow: 'harnessed.current-workflow.v1',
  governance: 'harnessed.governance.v1',  // ← Phase 3.2 W1 ADD 9th surface (D-04 PUSH)
} as const

// L49-58 Union 加 9th entry:
export const SchemaVersionLiteral = Type.Union([
  // ... 8 现有 ...
  Type.Literal(SCHEMA_VERSIONS.governance),  // ← ADD
])
```

### 2.8 `.github/workflows/ci.yml` W0.2 ENFORCE flip — analog: 现 L199-201

**MINIMAL DELETE 1 行** (Phase 3.1 W0.3 warn-only round 1 → Phase 3.2 W0.2 兑现):

```yaml
# 现 L199-201:
- name: README completeness check (Phase 3.1 W0.3 — STATE.md vs README per-phase shipped count) [WARN-ONLY round 1]
  continue-on-error: true   # ← Phase 3.2 W0.2 DELETE this line (ENFORCE flip)
  run: |
    STATE_COUNT=$(grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" .planning/STATE.md)
    # ... 既有 logic 不动 ...

# 改名 [WARN-ONLY round 1] → [ENFORCE Phase 3.2 W0.2] 沿袭 ci.yml 命名 cadence
```

### 2.9 `tests/unit/cli-audit.test.ts` W0.1 fix — analog: `tests/cli/doctor.test.ts` L6-8 三件套 mock

**COPY doctor.test.ts 三件套 mock 范式** (path A: 拆 manifest-layer + add runtime-layer mock):

```ts
// 现 tests/unit/cli-audit.test.ts L13-14 只 mock 2 件:
vi.mock('node:fs/promises', () => ({ readdir: vi.fn(), readFile: vi.fn() }))
vi.mock('../../src/manifest/validate.js', () => ({ validateManifestFile: vi.fn() }))

// Phase 3.2 W0.1 ADD 2 行 (cover Phase 2.4 W4 runtime layer):
vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))
vi.mock('node:fs', () => ({ readFileSync: vi.fn() }))

// 加 mock imports + 在 beforeEach 中 reset; per-cell setup mock responses (sister
// tests/cli/doctor.test.ts L62-100 mockSpawn() helper 范式 — origin-check + provenance
// spawn 默 happy state, install.cmd 默 clean string);  原 4 case 不动, 仅补全 missing mocks
// 让 b6a0feb 复现 CI red 路径 PASS.
```

---

## § 3 Cross-cutting Patterns (apply across all NEW files)

### 3.1 D-decision 守门 (4 decisions LOCKED, executor 防 sneak-in)

| ID | Locked Decision | Anti-pattern to Guard |
|----|------------------|------------------------|
| **D-01 PROBE** | doctor runtime spawn `which`/`where` 探三选一 + fallback fail-loud | INTERACTIVE first-run prompt sneak-in (CI/headless env 不支持 sister Phase 2.4 `--json` flag CI-friendly lesson) |
| **D-02 JINJA** | zero-dep regex str.replace `{{ var }}` | mustache/handlebars npm dep sneak-in (zero-dep守门 sister Phase 3.1 D-02 KARPATHY 3-state precedent) |
| **D-03 WIRED** | 5-phase 桩跑 governance + checkpoint, 不接外部 spawn | FULL real-spawn sneak-in (scope 太大, Phase 3.3+ dogfood; SKELETON 也 rejected 因无法验 R7.1 30 场景) |
| **D-04 PUSH** | file-based `.harnessed/governance.json` + lazy-read 1 次 per phase 转换 | POLL `setInterval` sneak-in (sister Phase 2.4 SSE polling anti-pattern lesson → 改 EventSource); EVENT SIGUSR1 cross-OS Win signal 差异 |

### 3.2 Karpathy hard limit ≤200L/file (B-06 + B-26)
**Source**: `src/routing/engine.ts` 200L (≤200 hard cap, W-01 PRIMARY extract restored) + `src/cli/doctor.ts` 175L (≤215 5% tolerance per B-03 已用)
**Apply to**: `src/cli/lib/probe-gstack.ts` ≤50L (PRIMARY split helper); `src/workflow/{interpolate,governance,run}.ts` 各 ≤30/25/80L per CONTEXT D-03 hint; `src/cli/doctor.ts` 加 6th check 后 ~223L (超 5% tolerance) → **planner 决** 是否进一步 helper-ize 既存 5 check 把 doctor.ts 拉回 ≤200L (sister engine.ts W-01 precedent)

### 3.3 Schema registration discipline (Phase 2.2 CD-5)
**Source**: `src/types/schemaVersion.ts` L36-72 (SCHEMA_VERSIONS const + SchemaVersionLiteral Union + branchOnSchemaVersion helper)
**Apply to**: governance.v1 schema (#5) + governance.ts consumer (#3) + run.ts (#4) loadPhases consume
**Rule**: 新 schema 必 (a) 注册到 SCHEMA_VERSIONS, (b) 加 Type.Literal 到 SchemaVersionLiteral Union, (c) 所有 consume 走 `branchOnSchemaVersion<T>(v, { v1: ..., unknown: ... })` (不裸 string 比对); Wave 验收 `grep -r "branchOnSchemaVersion" src/` ≥ 4 references (Phase 3.1 baseline ≥3, 本 phase +1 = governance consumer)

### 3.4 TypeBox + Value.Check runtime validate (Phase 2.2 loadPhases sister)
**Source**: `src/workflow/loadPhases.ts` L23-30 + `src/checkpoint/state.ts` L23-41
**Apply to**: governance.ts read (#3) + run.ts loadPhases consume (#4) + governance.v1.ts schema (#5)
**Rule**: read JSON → `branchOnSchemaVersion` → `Value.Check(Schema, parsed)` → false → null fail-soft (state.ts L33-35 模式); write 前 self-validate 防 schema drift (template.ts L60-64 模式)

### 3.5 biome preempt before commit (MEMORY 全局 rule)
**Source**: `~/.claude/projects/D--GitCode-harnessed/memory/feedback_biome-preempt.md` (Phase 2.1.1 / 2.2 / 2.3 3 次 CI-red recurrences)
**Apply to**: ALL NEW .ts files (probe-gstack / interpolate / governance / run / governance.v1 / 5 skill stubs)
**Rule**: 每次 commit 前 local 跑 `pnpm exec biome check --write` (B-04 sister Win bash flavor compat)

### 3.6 Win shell flavor B-04 (Phase 2.3 W0 + Phase 2.4 W6 + Phase 3.1 sister)
**Source**: `src/cli/doctor.ts` L80 + L98-126 (Win `where`/`which` switch + WSL probe)
**Apply to**: probe-gstack.ts (#1) — `process.platform === 'win32' ? 'where' : 'which'` direct sister `doctor.ts` L80 范式;Win Git Bash 必走 (sister Phase 2.4 W3 doctor MIN 5-check Win bash flavor 经验)

### 3.7 CLI exit code map (Phase 2.2 B-10) + 3-tier status (Phase 2.4 W1 B-06)
**Source**: `src/cli/doctor.ts` L20-25 CheckResult interface + L142-173 dispatch
**Apply to**: doctor.ts 6th check (#8) 沿袭 pass/warn/fail 3-tier + warn ≠ fail exit policy (B-06); probe-gstack.ts (#1) result shape 沿袭 origin-check.ts `OriginCheckResult` 3-tier

---

## § 4 Reuse Pct Summary

| Category | Reuse % | Detail |
|----------|---------|--------|
| `src/cli/lib/probe-gstack.ts` NEW | **~90%** | origin-check.ts spawnSync wrap + Win finder switch 直接 analog |
| `src/workflow/interpolate.ts` NEW | **~50%** | error class shape COPY, regex replace logic NEW (low-reuse — JINJA mechanism 自实) |
| `src/workflow/governance.ts` NEW | **~70%** | state.ts L23-41 readCurrentWorkflow 模式直接 analog |
| `src/workflow/run.ts` NEW | **~60%** | engineHook.ts wedge 模式 + Phase 3.1 engine.ts ralph-loop skeleton (workflow runner 新 logic mid-reuse) |
| `src/checkpoint/schema/governance.v1.ts` NEW | **~95%** | Phase 3.1 W1 sister TypeBox shape 直接复刻 |
| `workflows/plan-feature/workflow.yaml` NEW | **~80%** | execute-task/phases.yaml DSL 沿袭 + JINJA invokes 新加 |
| `skills/plan-feature-*/SKILL.md` NEW × 5 | **~85%** | SKILL.md frontmatter + body 桩 既存 patterns |
| `src/cli/doctor.ts` 加 6th check | **~95%** | sister `checkOriginUrl` L130-134 范式直接 analog |
| `src/workflow/loadPhases.ts` extend | **~80%** | 既存 loadPhases L22-30 加 interpolate 1 步 |
| `src/types/schemaVersion.ts` 9th surface | **~95%** | Phase 3.1 W1 T1.1 8th surface ADD 范式直接 analog |
| `tests/unit/cli-audit.test.ts` W0.1 fix | **~85%** | doctor.test.ts L6-8 三件套 mock 范式 |
| `.github/workflows/ci.yml` W0.2 flip | **~99%** | 1-line DELETE `continue-on-error: true` |
| STATE.md + README.md W0.2 normalize | **~80%** | Phase 2.2 STATUS_MARKER convention 沿袭 |
| `tests/workflow/interpolate.test.ts` NEW | **~80%** | doctor.test.ts describe/it skeleton + Value.Check assert 沿袭 |
| `tests/workflow/governance.test.ts` NEW | **~85%** | Phase 3.1 W2 state.test.ts vi.mock 模式直接 analog |
| `tests/integration/plan-feature-wired.test.ts` NEW | **~80%** | Phase 3.1 W4 checkpoint-e2e.test.ts e2e 范式沿袭 |
| `tests/cli/doctor-gstack-probe.test.ts` NEW | **~90%** | doctor.test.ts L62-100 5-cell + --json 全套直接 analog |

**总 reuse %**: **~83%** (17 target average; 高 reuse 因 Phase 3.1 checkpoint infra 三件套 (state/engineHook/template) 100% ready + Phase 2.4 origin-check + doctor.test.ts mock 范式直接 analog + schemaVersion CD-5 单一兼容门已建)

**对比 Phase 3.1**: ~85% (infra-底座 phase 大量复用 Phase 2.2 closure infra 红利); Phase 3.2 ~83% 反映 workflow-装配 phase 仍高度沿用 Phase 3.1 checkpoint infra + Phase 2.4 doctor pattern, 仅 interpolate.ts (~50% NEW) + run.ts (~60% NEW) 是真新机制. 沿袭 sister 95% 门槛 ✅

---

## § 5 Path Dependency (Wave 0 → W1 → W2 → W3 → W4 ship)

**W0 first (must-fix CI green prereq)**:
1. **W0.1** `tests/unit/cli-audit.test.ts` env-dep CI red fix (~20-30L delta, ≤30 tool uses) → CI 3-OS green = Phase 3.2 first acceptance bar
2. **W0.2** STATE.md + README.md format normalize → ci.yml L201 `continue-on-error: true` DELETE (W0.3 ENFORCE flip) → CI README completeness fail-on-drift
3. **W0.3** schemaVersion 9th surface 决 (Wave A R2 research 已 hint 推荐 NEW `harnessed.governance.v1`) → governance.v1.ts schema NEW (~25L) + schemaVersion register (~4-5L) ship

**W1 infra (probe + schema)**:
4. `src/cli/lib/probe-gstack.ts` NEW (≤50L PRIMARY) — depends on nothing
5. `src/cli/doctor.ts` 加 6th check (~6L delta) — depends on #4 probe-gstack helper
6. `tests/cli/doctor-gstack-probe.test.ts` NEW (~60L 5 fixtures) — depends on #4 + #5

**W2 infra (interpolate + governance + run)**:
7. `src/workflow/interpolate.ts` NEW (≤30L) — depends on nothing
8. `src/workflow/governance.ts` NEW (≤25L) — depends on W0.3 governance.v1 schema
9. `src/workflow/loadPhases.ts` extend interpolate step (~5-8L) — depends on #7
10. `src/workflow/run.ts` NEW (≤80L) — depends on #7 + #8 + #9 + Phase 3.1 engineHook (already ready)
11. `tests/workflow/interpolate.test.ts` NEW (~50L 6 fixtures) — depends on #7
12. `tests/workflow/governance.test.ts` NEW (~40L 4 fixtures) — depends on #8

**W3 config + integration**:
13. `workflows/plan-feature/workflow.yaml` NEW (~40L) — depends on #10 run.ts (validates phase iter schema)
14. `skills/plan-feature-{decision,brainstorm,discuss,plan,persist}/SKILL.md` NEW × 5 (~50L) — depends on nothing (stubs)
15. `tests/integration/plan-feature-wired.test.ts` NEW (~80L 2 fixtures) — depends on #10 + #13 + #14 (e2e wire)

**W4 ship**:
16. ADR errata 0015 (plan-feature reference + governance v1 9th surface lock) — sister Phase 3.1 ADR 0014 范式
17. STATE.md per-phase entry add (Phase 3.2 SHIPPED marker) + README.md `- **Phase 3.2 shipped** ✅` line — sister Phase 3.1 ship cadence

**Wave A R1+R2 并行 deliverables (本 R1 + 已 ship R2)**:
- R1 (本 PATTERNS.md): 17 target analog mapping + reuse % + cross-cutting D-decision 守门 + Karpathy 守门
- R2 (RESEARCH.md sister-ship): 9th surface 决 (推荐 NEW governance.v1) + Win shell flavor probe behavior 实测 + JINJA escape syntax 决

**Wave B planner 输入**: 同时消费 R1 (本文档) + R2 (RESEARCH.md) 生成 PLAN.md (4 wave 拆分 W0.1 → W0.2 → W0.3 → W1 → W2 → W3 → W4)

---

**PATTERN MAPPING COMPLETE** — Wave B (planner) 启动准备;Wave A R2 RESEARCH 可并行进行 / 已 ship。
