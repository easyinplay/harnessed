# Phase 3.1 — task_plan.md

> **Authored**: 2026-05-16
> **Author**: gsd-planner (Wave B)
> **Sources**: CONTEXT.md D-01~D-04 + KICKOFF § 1-6 + PATTERNS § 1-5 (14 analog targets 100%) + RESEARCH § 1-12 (12 sections) + sister Phase 2.4 task_plan.md atomic structure
> **Style**: 沿袭 phase-2.4 task_plan.md per-task structure (files_modified / action concrete values / read_first / acceptance_criteria grep-verifiable / decision_source)
> **Task count**: 28 atomic tasks across 6 Waves (W0:5 / W1:4 / W2:4 / W3:3 / W4:5 / W5:6)
> **Hard limit verify**: every code-producing task 含 `wc -l ≤ N` acceptance criterion (Karpathy ≤200L hard limit B-06)

> ⚠️ **Schema registration discipline (CD-5 sister Phase 2.2 W2 T2.0)**: 任何 NEW schema (checkpoint.v1, current-workflow.v1) 必走 `src/types/schemaVersion.ts` 单一 SSOT — 加 SCHEMA_VERSIONS const + Type.Literal Union; 任何 consume site 必走 `branchOnSchemaVersion<T>(v, { v1, unknown })` helper (不裸 string 比对); Wave 验收 `grep -r "branchOnSchemaVersion" src/` ≥ 3 references (现 ≥2 baseline + 本 phase +1 checkpoint consumer).

> ⚠️ **Biome lint preempt before commit** (project memory `feedback_biome-preempt.md` 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3): 任何 TS/JS commit 前必跑 `pnpm exec biome check --write`. CI biome step fail = 强制 rerun 3-OS 测试浪费.

---

## Resolved Blocks (executor fill in-place, sister Phase 2.3/2.4 task_plan precedent)

> Resolved blocks 用于 executor 在跑 wave 时 surface 实测结果 (spike outcome / split decision / dogfood 结果) 锚定后续 task。

> **Resolved (T0.4, PENDING)**: <PENDING — Wave 0 T0.4 fill: `node scripts/run-plan-checker.mjs .planning/phase-2.4/` real-run outcome (exit code + per-file verdict + dimensions_passed); fr ≥ 0.80 verify outcome; 若 BLOCKER → add investigate cell + 1-line fix path>

> **Resolved (T3.2 engine.ts wc gate, PENDING)**: <PENDING — Wave 3 T3.2 fill: `wc -l src/routing/engine.ts` post-wedge 实测 (**W-01 orchestrator promote engineCheckpointHook.ts PRIMARY** target ≤ 200L Karpathy hard limit clean; no B-03 5% tolerance needed); engineHook.ts ≤ 50L PRIMARY extract verified (NOT fallback split — PRIMARY path)>

> **Resolved (T5.5 dogfood, PENDING)**: <PENDING — Wave 5 T5.5 fill: real SIGINT → harnessed resume → /gsd-execute-phase 3.1 cycle outcome (success OR hotfix needed); 写入 .planning/phase-3.1/DOGFOOD-T5.5.md>

---

## Deferred Items (Phase 3.1 carry-forward, registered per orchestrator revision iteration 1/3)

> **DEFERRED #1 (Phase 3.1 W0.3, orchestrator B-01 fix)**: README completeness check ENFORCE flip → Phase 3.2 W0 prereq, after STATE.md/README.md format normalization (sister Phase 2.3 EE-4 BLOCKER auto-spawn defer pattern). Current state: `continue-on-error: true` (warn-only round 1, advisory only). Close criteria: STATE.md `**Phase X.Y SHIPPED**` line-start pattern + README.md `- **Phase X.Y shipped** ✅` pattern statistics align, then flip `continue-on-error: false` + restore `::error::` enforce path.

> **DEFERRED #2 (Phase 3.1 W3, orchestrator B-02 fix)**: userSpawn session_id capture → Phase 3.4+ evaluate (real userSpawn usage statistics dogfooding 后定; current <5% niche YAGNI 守 fresh-session-only path). Rationale: extending userSpawn public API `(agentDef) => Promise<string>` with onSessionId out-param is breaking change > value at MVP; user-provided custom spawn is rare path; fresh-session reload (no SDK redirect) covered by D-04 fallback lock. Close criteria: Phase 3.4 dogfood data shows userSpawn usage > 10% OR explicit user request for session_id capture in userSpawn path.

---

## Wave 0 — Backlog 4 项 absorb + test infra setup (5 sub-tasks parallel)

### T0.1 — W0.1 AUDIT.md § 0.5 Line Budget Deviations Accepted (AUDIT actuals NOT KICKOFF stale)

- **files_modified**: `.planning/v0.2.0-MILESTONE-AUDIT.md` (MODIFY +~10L markdown)
- **action**:
  1. Read `.planning/v0.2.0-MILESTONE-AUDIT.md` L21-36 `tech_debt:` block (verify AUDIT actuals)
  2. **CRITICAL校对源** — RESEARCH § 10 W0.1 verified: AUDIT.md actuals = `doctor.ts 215L > 200` + `dashboard.mjs 610L ≤ 650L SKIP split` (NOT KICKOFF § 4 W0.1 stale 描述 `run-plan-checker.mjs 130L` + `plan-checker-quant.test.ts 103L`)
  3. Insert NEW `## § 0.5 Line Budget Deviations Accepted` section AFTER L36 (after `tech_debt:` block) BEFORE L37 `---`:
     ```markdown
     ## § 0.5 Line Budget Deviations Accepted

     > Karpathy 透明性纪律: per-file LOC > hard limit 但合理性论证后 accept; sister Phase 2.4 R-4 pattern.

     | File | LOC | Hard Limit | Tolerance | Rationale |
     |------|-----|-----------|-----------|-----------|
     | `src/cli/doctor.ts` | 215 | 200 | +7.5% | ADR 0013 § 1; 5 check + --json + 3 status enum 不可再 split (helper 已抽 origin-check.ts) |
     | `scripts/dashboard.mjs` | 610 | 650 default | (内) | B-26 dev tool 软 limit; SKIP proactive split 制造 churn (Phase 2.4 W3 T3.4 决断) |
     ```
- **read_first**:
  - `.planning/v0.2.0-MILESTONE-AUDIT.md` L1-50 (by Read)
  - `.planning/phase-3.1/RESEARCH.md` § 10 W0.1 (by Read offset 766 limit 30)
  - `.planning/phase-3.1/3.1-KICKOFF.md` L55-62 (by Read — verify KICKOFF stale 不抄)
- **acceptance_criteria**:
  - `grep -E "Line Budget Deviations Accepted" .planning/v0.2.0-MILESTONE-AUDIT.md | wc -l` == 1
  - `grep -E "doctor\.ts.*215" .planning/v0.2.0-MILESTONE-AUDIT.md | wc -l` ≥ 1
  - `grep -E "dashboard\.mjs.*610" .planning/v0.2.0-MILESTONE-AUDIT.md | wc -l` ≥ 1
  - **anti-stale verify** (NOT KICKOFF stale): `! grep -E "run-plan-checker.mjs.*130L|plan-checker-quant.test.ts.*103L" .planning/v0.2.0-MILESTONE-AUDIT.md § 0\.5` (W0.1 section 不含 stale 描述)
- **decision_source**: KICKOFF § 4 W0.1 (M1) + CONTEXT § Decisions W0.1 + RESEARCH § 10 W0.1 (校对源 AUDIT verified)

### T0.2 — W0.2 RETROSPECTIVE.md Advisory Absorb Path 节

- **files_modified**: `.planning/RETROSPECTIVE.md` (MODIFY +~15L markdown)
- **action**:
  1. Read RETROSPECTIVE.md L20-34 (M1 entry + Phase 2.4 milestone retro section)
  2. Insert NEW subsection AFTER L30 (after M1 entry) BEFORE L34 (Phase 2.4 milestone retro section):
     ```markdown
     ### Advisory Absorb Path — handoff intel "独立 commit" 草案被合理 absorb (Phase 2.4)

     > sister M2+M3 backlog absorption — Phase 2.4 handoff intel L482 draft "polish round 2 独立 commit" 未被 executor 采纳, 合理 absorb 进 W3 主 commit cluster (`cf00d17` + `008f9ab`)。 **advisory 允许 absorb 路径** = future cadence note: advisory 不是 hard mandate, executor 评估 scope coherence 决断 standalone vs absorb 都合理 (避免 future "advisory rejected" 暗示 / sister LinkedIn "草案不动" 反 pattern)。

     **Timeline**:
     - handoff intel L482 (Phase 2.4 W2-W3 boundary): "推 polish round 2 独立 commit 隔离观察"
     - executor decision (Phase 2.4 W3 cf00d17/008f9ab): absorb 进 main W3 commit cluster, dashboard.mjs 改动 atomic with cc-hook-installer
     - post-ship lesson: scope-coherent absorb 比强 standalone 干净 — 单 Wave 单 file 多 commit = artificial atomicity
     ```
- **read_first**:
  - `.planning/RETROSPECTIVE.md` L1-40 (by Read)
  - `.planning/phase-3.1/RESEARCH.md` § 10 W0.2 (by Read offset 787 limit 25)
- **acceptance_criteria**:
  - `grep -E "Advisory Absorb Path" .planning/RETROSPECTIVE.md | wc -l` ≥ 1
  - `grep -E "cf00d17|008f9ab" .planning/RETROSPECTIVE.md | wc -l` ≥ 2 (both commit hashes)
  - `grep -E "scope-coherent absorb" .planning/RETROSPECTIVE.md | wc -l` ≥ 1
- **decision_source**: KICKOFF § 4 W0.2 (M2+M3) + CONTEXT § Decisions W0.2 + RESEARCH § 10 W0.2

### T0.3 — W0.3 ci.yml README completeness check step (B-04 bash + sister Phase 2.4 D-03)

- **files_modified**: `.github/workflows/ci.yml` (MODIFY +~10L bash step)
- **action**:
  1. Find existing `README counter integrity gate` step via grep: `grep -n "README counter integrity" .github/workflows/ci.yml`
  2. **Pre-flight local verify** (B1 plan-check fix sister Phase 2.4 W0 T0.3 pattern): run grep locally first to confirm STATE.md vs README per-phase counts:
     ```bash
     STATE_COUNT=$(grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" .planning/STATE.md)
     README_COUNT=$(grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" README.md)
     echo "STATE=$STATE_COUNT README=$README_COUNT"
     ```
     If unequal, FIX README.md OR STATE.md to align BEFORE pushing CI (avoid first push CI red).
  3. Add step AFTER existing `README counter integrity gate` step. **WARN-ONLY round 1** per orchestrator B-01 decision (sister Phase 2.1 RETROSPECTIVE "transparency anti-pattern CI gate warn-only round 1" + Phase 2.3 W0 perf gate "moved out of CI critical path to nightly cron advisory" pattern); ENFORCE flip → Phase 3.2 后 STATE.md/README.md format normalization:
     ```yaml
     - name: README completeness check (Phase 3.1 W0.3 — STATE.md vs README per-phase shipped count) [WARN-ONLY round 1]
       continue-on-error: true  # ENFORCE=false round 1 (sister Phase 2.1 transparency CI warn-only pattern). Flip continue-on-error=false Phase 3.2 后 STATE.md/README.md format normalization (`**Phase X.Y SHIPPED**` line-start vs `- **Phase X.Y shipped** ✅`).
       run: |
         STATE_COUNT=$(grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" .planning/STATE.md)
         README_COUNT=$(grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" README.md)
         echo "STATE.md per-phase shipped count: $STATE_COUNT"
         echo "README.md per-phase shipped count: $README_COUNT"
         if [ "$STATE_COUNT" -ne "$README_COUNT" ]; then
           echo "::warning::README completeness drift (advisory, warn-only round 1): STATE=$STATE_COUNT README=$README_COUNT — fix in Phase 3.2 W0 prereq before ENFORCE flip"
         else
           echo "README completeness OK: STATE=$STATE_COUNT README=$README_COUNT"
         fi
     ```
  4. **STATE.md advisory absorb log entry**: Append entry to STATE.md (L60-90 range, event log section): "Phase 3.1 W0.3 README completeness check **WARN-ONLY round 1** (continue-on-error: true). ENFORCE flip → Phase 3.2 W0 prereq after STATE.md `**Phase X.Y SHIPPED**` line-start pattern + README.md `- **Phase X.Y shipped** ✅` pattern statistics align (sister Phase 2.1 transparency anti-pattern + Phase 2.3 perf nightly cron advisory)"
  5. **deferred-items #1 register entry** (in STATE.md deferred-items section OR a deferred-items registry file): "DEFERRED #1 (Phase 3.1 W0.3): README completeness check ENFORCE flip → Phase 3.2 W0 prereq, after STATE.md/README.md format normalization (sister Phase 2.3 EE-4 BLOCKER auto-spawn defer pattern)"
- **read_first**:
  - `.github/workflows/ci.yml` (by Read — find existing `README counter integrity gate` step location)
  - `.planning/phase-3.1/RESEARCH.md` § 10 W0.3 (by Read offset 806 limit 30 — verified regex)
  - `.planning/STATE.md` + `README.md` (by Read — pre-flight count verify)
- **acceptance_criteria**:
  - `grep -E "README completeness check" .github/workflows/ci.yml | wc -l` == 1
  - `grep -E "continue-on-error: true" .github/workflows/ci.yml | wc -l` ≥ 1 (WARN-ONLY round 1 marker per B-01 orchestrator decision)
  - `grep -E "STATE_COUNT.*README_COUNT" .github/workflows/ci.yml | wc -l` ≥ 1
  - `grep -E "::warning::README completeness drift" .github/workflows/ci.yml | wc -l` ≥ 1 (advisory message, NOT `::error::`)
  - **step runs (warn-only, advisory)** — CI does NOT fail on drift round 1; step always exit 0 via continue-on-error (sister Phase 2.1 transparency CI warn-only pattern); replaces previous "exit 0" plan with advisory-only enforcement
  - STATE.md L60-90 contains advisory absorb log entry: `grep -E "Phase 3\.1 W0\.3.*WARN-ONLY round 1" .planning/STATE.md` ≥ 1
  - deferred-items #1 entry registered: `grep -E "DEFERRED #1.*Phase 3\.1 W0\.3.*README completeness.*Phase 3\.2" .planning/STATE.md` ≥ 1
- **decision_source**: KICKOFF § 4 W0.3 (T4) + CONTEXT § Decisions W0.3 + RESEARCH § 10 W0.3 + B-04 Win shell:bash + **orchestrator B-01 fix path (b) warn-only round 1** (sister Phase 2.1 RETROSPECTIVE "transparency anti-pattern CI gate warn-only round 1" + Phase 2.3 W0 perf gate "moved out of CI critical path to nightly cron advisory" pattern)

### T0.4 — W0.4 phase-2.4 self-check verify report

- **files_modified**: `.planning/phase-3.1/W0-T5-verify.md` (NEW ~10L verify report)
- **action**:
  1. Run `node scripts/run-plan-checker.mjs .planning/phase-2.4/` and capture (a) exit code (b) per-file JSON lines (verdict + dimensions_passed + scores)
  2. Create NEW `.planning/phase-3.1/W0-T5-verify.md` with template:
     ```markdown
     # W0.4 phase-2.4 self-check verify report

     **Date**: 2026-05-16
     **Command**: `node scripts/run-plan-checker.mjs .planning/phase-2.4/`
     **Exit code**: <captured>

     ## Per-file outcome (JSON lines)
     ```
     <paste output>
     ```

     ## Verdict
     - dimensions_passed: <N>/4
     - verdict: <PASS|WARNING|BLOCKER>
     - fr ≥ 0.80 verify: <PASS|FAIL>

     ## Resolution
     <if BLOCKER: investigate + fix; if PASS/WARNING: ACCEPTED, deferred-items #2 self-referential resolved>
     ```
  3. **Update Resolved (T0.4) block** at task_plan.md top with capture outcome (PENDING → 实占 value)
- **read_first**:
  - `scripts/run-plan-checker.mjs` (by Read — verify walker invocation works)
  - `.planning/phase-2.4/task_plan.md` (by Read — target of self-check)
  - `.planning/phase-3.1/RESEARCH.md` § 10 W0.4 (by Read offset 832 limit 20)
- **acceptance_criteria**:
  - `test -f .planning/phase-3.1/W0-T5-verify.md` exit 0
  - `grep -E "Exit code:|verdict:" .planning/phase-3.1/W0-T5-verify.md | wc -l` ≥ 2
  - **if BLOCKER outcome**: 1 cell investigate + 1 cell fix; **if PASS/WARNING**: 直接 ACCEPTED + Resolved block 顶 fill
- **decision_source**: KICKOFF § 4 W0.4 (T5) + CONTEXT § Decisions W0.4 + RESEARCH § 10 W0.4

### T0.5 — Test dirs setup + vitest config glob positive verify (W-03 orchestrator fix)

- **files_modified**: `tests/checkpoint/` + `tests/cli/` + `tests/integration/` (NEW directories via mkdir -p; files added W1+) + (conditionally) `vitest.config.ts` (MODIFY if include glob is restrictive — W-03 fallback)
- **action**:
  1. Create test dirs (idempotent):
     ```bash
     mkdir -p tests/checkpoint tests/cli tests/integration
     # No-op if already exist. Wave 1+ NEW test files prerequisite per W1 plan-check fix sister Phase 2.4 W0 T0.5.
     ```
  2. **W-03 orchestrator positive verify** — Read vitest.config.ts `include` glob field:
     ```bash
     grep -E "include:|tests/" vitest.config.ts
     ```
     - **Expected baseline**: include glob `tests/**/*.test.ts` (recursive **) — covers all 3 sub-dirs auto-discover (verified 2026-05-16: vitest.config.ts L5 `include: ['tests/**/*.test.ts']` already matches)
     - **W-03 fallback** (if glob is restrictive like `tests/*.test.ts` 单层非 recursive OR 不含 `tests/` 前缀): explicit add 3 dir globs to vitest.config.ts:
       ```typescript
       include: [
         'tests/**/*.test.ts',
         'tests/checkpoint/**/*.test.ts',
         'tests/cli/**/*.test.ts',
         'tests/integration/**/*.test.ts',
       ],
       ```
       NB: This is defensive; baseline glob already covers via `**`.
  3. Run a smoke vitest invocation (no test file changes) to confirm config syntax + discovery still works:
     ```bash
     corepack pnpm test -- --run --reporter=dot
     ```
     Expected: existing test suite still passes (no break from W-03 glob edit if applied).
- **read_first**:
  - `tests/` directory list (by Bash `ls tests/`) — verify pre-existing dirs not broken
  - `vitest.config.ts` (by Read — W-03 orchestrator positive verify glob covers tests dir recursively)
- **acceptance_criteria**:
  - `[ -d tests/checkpoint ] && [ -d tests/cli ] && [ -d tests/integration ]` exit 0
  - **W-03 positive verify** (orchestrator add): `grep -E "tests/" vitest.config.ts` exit 0 (glob references tests dir)
  - **If W-03 fallback applied** (vitest.config.ts edited with 3 explicit globs): `corepack pnpm test -- --run --reporter=dot` still passes (no break to existing suite); `grep -cE "tests/checkpoint|tests/cli|tests/integration" vitest.config.ts` ≥ 3 if explicit globs added (else baseline `tests/**` recursive glob suffices)
  - Wave 1+ NEW test file ship 时 vitest discovers (W-03 orchestrator verified positive — baseline `tests/**/*.test.ts` recursive glob covers 3 new dirs)
- **decision_source**: sister Phase 2.4 W0 T0.5 W1 plan-check fix mkdir pattern + **orchestrator W-03 add vitest config glob positive verify**

---

## Wave 1 — Schema + state machine (8-surface + 3-state)

### T1.1 — src/types/schemaVersion.ts MODIFY +4L (8th surface currentWorkflow) + src/routing/agentDefinition.ts MODIFY +3L (phaseId field per W-04 fix path (a))

- **files_modified**: `src/types/schemaVersion.ts` (MODIFY +4L) + `src/routing/agentDefinition.ts` (MODIFY +3L — W-04 orchestrator fix path (a): thread `phaseId` via TaskContext schema field)
- **action**:
  0. **W-04 fix path (a) — TaskContext schema extend**: Update `src/routing/agentDefinition.ts` L96-101 — add `phaseId?: string` optional field to `TaskContext` interface with JSDoc:
     ```typescript
     /** User task context (1:1 contract § 3). */
     export interface TaskContext {
       task: string
       override_keywords?: string[]
       task_type?: string
       cwd?: string
       /** Phase identifier (e.g., "3.1") for checkpoint paths; falls back to "unknown" if not provided.
        *  Phase 3.1 W-04 orchestrator fix path (a) — eliminates `(matched?.decision as any)?.phase` cast (Karpathy "Surgical Changes" + type safety). */
       phaseId?: string
     }
     ```
  1. L34-42 SCHEMA_VERSIONS const add 8th entry:
     ```typescript
     export const SCHEMA_VERSIONS = {
       // ... 7 existing ...
       checkpoint: 'harnessed.checkpoint.v1',
       currentWorkflow: 'harnessed.current-workflow.v1',  // ← Phase 3.1 ADD 8th surface
     } as const
     ```
  2. L46-54 SchemaVersionLiteral Union add 8th literal:
     ```typescript
     export const SchemaVersionLiteral = Type.Union([
       // ... 7 existing literals ...
       Type.Literal(SCHEMA_VERSIONS.checkpoint),
       Type.Literal(SCHEMA_VERSIONS.currentWorkflow),  // ← ADD
     ])
     ```
  3. L13-20 JSDoc comment block — list 8th surface: `current-workflow : workflow state machine (active / paused / complete)`
- **read_first**:
  - `src/types/schemaVersion.ts` L1-68 entire file (by Read)
  - `.planning/phase-3.1/RESEARCH.md` § 4.2 (by Read offset 435 limit 25)
  - `.planning/phase-3.1/PATTERNS.md` § 2.6 (by Read offset 226 limit 25)
- **acceptance_criteria**:
  - `grep -cE "harnessed\.\w+\.v1" src/types/schemaVersion.ts | awk '$1 >= 8'` (grep count ≥ 8, sister Phase 2.2 W2 grep gate auto-bump)
  - `grep -E "currentWorkflow: 'harnessed\.current-workflow\.v1'" src/types/schemaVersion.ts | wc -l` == 1
  - `grep -q "phaseId" src/routing/agentDefinition.ts` (W-04 fix path (a) — TaskContext.phaseId field added)
  - `! grep -rE "decision as any" src/routing/` (W-04 fix path (a) — no `as any` cast remains in src/routing/)
  - `pnpm typecheck` exit 0 (TypeScript Static<typeof> infer Union 不 break + TaskContext.phaseId optional propagates clean)
  - `wc -l src/types/schemaVersion.ts` ≤ 75 (现 68L + 4L)
  - `wc -l src/routing/agentDefinition.ts` ≤ +3L delta (TaskContext +1 field + 1 JSDoc line + blank)
- **decision_source**: D-02 schema lock + CD-5 Phase 2.2 W2 T2.0 + RESEARCH § 4.2 + PATTERNS § 2.6 + **orchestrator W-04 fix path (a) thread phaseId via TaskContext schema**

### T1.2 — src/checkpoint/schema/{checkpoint.v1, currentWorkflow.v1, index}.ts NEW ~85L

- **files_modified**: `src/checkpoint/schema/checkpoint.v1.ts` (NEW ~50L) + `src/checkpoint/schema/currentWorkflow.v1.ts` (NEW ~30L) + `src/checkpoint/schema/index.ts` (NEW ~5L barrel)
- **action**: Verbatim PATTERNS § 2.1 + RESEARCH § 4.4 (cwd field added per § 1.3 mitigation):
  ```typescript
  // src/checkpoint/schema/checkpoint.v1.ts NEW ~50L
  import { type Static, Type } from '@sinclair/typebox'
  import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

  export const CheckpointStatus = Type.Union([
    Type.Literal('active'),
    Type.Literal('paused'),
    Type.Literal('complete'),
  ])

  export const CheckpointV1 = Type.Object({
    schemaVersion: Type.Literal(SCHEMA_VERSIONS.checkpoint),
    phase: Type.String({ minLength: 1 }),
    status: CheckpointStatus,
    last_task: Type.String(),
    key_decisions: Type.Array(Type.String()),
    canonical_refs: Type.Array(Type.String()),
    session_id: Type.Optional(Type.String()),
    cwd: Type.String({ minLength: 1 }),                 // § 1.3 cwd 匹配陷阱 mitigation
    timestamp: Type.String({ format: 'date-time' }),
    archive_path: Type.String({ minLength: 1 }),
  }, { additionalProperties: false })
  export type CheckpointV1Type = Static<typeof CheckpointV1>
  ```

  ```typescript
  // src/checkpoint/schema/currentWorkflow.v1.ts NEW ~30L
  import { type Static, Type } from '@sinclair/typebox'
  import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

  export const WorkflowStatus = Type.Union([
    Type.Literal('active'),
    Type.Literal('paused'),
    Type.Literal('complete'),
  ])

  export const CurrentWorkflowV1 = Type.Object({
    schemaVersion: Type.Literal(SCHEMA_VERSIONS.currentWorkflow),
    phase: Type.String({ minLength: 1 }),
    status: WorkflowStatus,
    last_checkpoint_path: Type.String(),
    started_at: Type.String({ format: 'date-time' }),
    paused_at: Type.Optional(Type.String({ format: 'date-time' })),
    completed_at: Type.Optional(Type.String({ format: 'date-time' })),
  }, { additionalProperties: false })
  export type CurrentWorkflowV1Type = Static<typeof CurrentWorkflowV1>
  ```

  ```typescript
  // src/checkpoint/schema/index.ts NEW ~5L barrel
  export * from './checkpoint.v1.js'
  export * from './currentWorkflow.v1.js'
  ```
- **read_first**:
  - `src/workflow/schema/phases.ts` (by Read — TypeBox Type.Object + Static<typeof> sister analog, PATTERNS § 1 #1 90% reuse)
  - `src/manifest/schema/spec.ts` (by Read — modular schema pattern, RESEARCH § 4.3 锚)
  - `.planning/phase-3.1/PATTERNS.md` § 2.1 (by Read offset 43 limit 35)
  - `src/types/schemaVersion.ts` post-T1.1 (by Read — verify SCHEMA_VERSIONS.currentWorkflow 已加)
- **acceptance_criteria**:
  - `wc -l src/checkpoint/schema/checkpoint.v1.ts` ≤ 60
  - `wc -l src/checkpoint/schema/currentWorkflow.v1.ts` ≤ 40
  - `wc -l src/checkpoint/schema/index.ts` ≤ 10
  - `pnpm typecheck` exit 0 (TypeBox Static<typeof> infer 正确)
  - `grep -q "session_id" src/checkpoint/schema/checkpoint.v1.ts` (D-04 WIRE-IN optional field 加)
  - `grep -q "cwd" src/checkpoint/schema/checkpoint.v1.ts` (§ 1.3 critical constraint 加)
- **decision_source**: D-01 schema lock + D-02 schema lock + RESEARCH § 4.4 + § 1.3 + PATTERNS § 2.1 + § 1 #1 #2 90-95% reuse

### T1.3 — src/checkpoint/state.ts NEW ~60L (3-state read/write)

- **files_modified**: `src/checkpoint/state.ts` (NEW ~60L hard limit per D-02 hint)
- **action**: Verbatim PATTERNS § 2.3 + RESEARCH § 4.2 (Value.Check validate write-side sister loadPhases L23-30):
  ```typescript
  // src/checkpoint/state.ts NEW ~60L (D-02 KARPATHY 3-state; no xstate/robot3)
  import { readFile, writeFile, mkdir } from 'node:fs/promises'
  import { dirname } from 'node:path'
  import { Value } from '@sinclair/typebox/value'
  import { CurrentWorkflowV1, type CurrentWorkflowV1Type } from './schema/currentWorkflow.v1.js'
  import { SCHEMA_VERSIONS } from '../types/schemaVersion.js'

  const STATE_PATH = '.harnessed/current-workflow.json'

  export async function readCurrentWorkflow(): Promise<CurrentWorkflowV1Type | null> {
    try {
      const raw = await readFile(STATE_PATH, 'utf8')
      const parsed = JSON.parse(raw)
      if (!Value.Check(CurrentWorkflowV1, parsed)) return null
      return parsed
    } catch { return null }
  }

  export async function writeCurrentWorkflow(s: CurrentWorkflowV1Type): Promise<void> {
    if (!Value.Check(CurrentWorkflowV1, s)) {
      throw new Error(`current-workflow schema validation failed: ${[...Value.Errors(CurrentWorkflowV1, s)].map(e => e.message).join('; ')}`)
    }
    await mkdir(dirname(STATE_PATH), { recursive: true })
    await writeFile(STATE_PATH, JSON.stringify(s, null, 2))
  }

  export async function activate(phase: string, checkpointPath: string): Promise<void> {
    await writeCurrentWorkflow({
      schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
      phase, status: 'active',
      last_checkpoint_path: checkpointPath,
      started_at: new Date().toISOString(),
    })
  }

  export async function pause(): Promise<void> {
    const s = await readCurrentWorkflow(); if (!s) return
    await writeCurrentWorkflow({ ...s, status: 'paused', paused_at: new Date().toISOString() })
  }

  export async function complete(): Promise<void> {
    const s = await readCurrentWorkflow(); if (!s) return
    await writeCurrentWorkflow({ ...s, status: 'complete', completed_at: new Date().toISOString() })
  }
  ```
- **read_first**:
  - `src/workflow/loadPhases.ts` L1-50 (by Read — Value.Check validate pattern + ValidationError sister)
  - `src/checkpoint/schema/currentWorkflow.v1.ts` post-T1.2 (by Read — type import target)
  - `.planning/phase-3.1/PATTERNS.md` § 2.3 (by Read offset 117 limit 45)
  - `.planning/phase-3.1/RESEARCH.md` § 4.2 (by Read offset 435 limit 25)
- **acceptance_criteria**:
  - `wc -l src/checkpoint/state.ts` ≤ 80 (Karpathy D-02 hint ≤ 80L)
  - `grep -cE "activate|pause|complete" src/checkpoint/state.ts` ≥ 3 (3 transition fns exported)
  - `grep -q "Value.Check" src/checkpoint/state.ts` (write-side self-validate per loadPhases pattern)
  - `grep -q "SCHEMA_VERSIONS.currentWorkflow" src/checkpoint/state.ts` (CD-5 single 兼容门)
  - `pnpm typecheck` exit 0
- **decision_source**: D-02 KARPATHY 3-state lock + RESEARCH § 4.2 + PATTERNS § 2.3

### T1.4 — tests/checkpoint/schema.test.ts + state.test.ts + engineHook.test.ts NEW ~200L (14 fixture, +1 for W-01 engineHook unit test)

- **files_modified**: `tests/checkpoint/schema.test.ts` (NEW ~80L) + `tests/checkpoint/state.test.ts` (NEW ~80L) + `tests/checkpoint/engineHook.test.ts` (NEW ~40L 1+ fixture per W-01 orchestrator) — W-01 fixture scaffolds in Wave 1; full assertion passes after Wave 3 T3.2 lands engineHook.ts implementation
- **action**: Per PLAN.md Wave 1 behavior block 13 fixture + W-01 orchestrator engineHook fixture:

  **W-01 additional**: `tests/checkpoint/engineHook.test.ts` 1+ fixture (unit test for engineHook.ts PRIMARY extract):
  - Test 14 (engineHook.completePhase happy): given (phaseId='3.1', sessionId='sess-abc', status='complete') → verify writeCheckpoint called with {phase:'3.1', session_id:'sess-abc'} + state.complete() called + .harnessed/current-workflow.json + .harnessed/checkpoints/3.1.json paths written correctly via fs mock
  - Test 14a (engineHook.activatePhase): given phaseId='3.1' → verify state.activate('3.1', '.harnessed/checkpoints/3.1.json') called + returns {checkpointPath: '.harnessed/checkpoints/3.1.json'}
  - Test 14b (engineHook phaseId='unknown' WARN): given phaseId='unknown' → verify console.error called with WARN message + checkpoint still written to .harnessed/checkpoints/unknown.json (Karpathy fail-loud non-blocking per W-04 mitigation)
  - Note: Wave 1 ships scaffolding + fixtures; full assertion runs after Wave 3 T3.2 lands engineHook.ts implementation (Wave 1 test fixture asserts contract; Wave 3 implementation passes assertions)
  - schema.test.ts (6 fixture): SCHEMA_VERSIONS 8-surface grep / branchOnSchemaVersion checkpoint.v1 routes v1 / branchOnSchemaVersion current-workflow.v1 routes v1 / branchOnSchemaVersion unknown routes unknown / Value.Check CheckpointV1 happy / Value.Check CheckpointV1 missing field returns false
  - state.test.ts (7 fixture): activate(phase, path) writes status='active' + started_at / activate creates dir recursive / pause() reads + writes paused + paused_at preserves started_at / complete() reads + writes complete + completed_at / readCurrentWorkflow returns null on JSON corrupt / readCurrentWorkflow returns null on schema drift / writeCurrentWorkflow throws on invalid input
  - Use `vi.mock('node:fs/promises', ...)` sister Phase 2.2 sdk-spawn.test.ts L27-34 pattern
  - Run `pnpm exec biome check --write` before commit
- **read_first**:
  - `tests/routing/sdk-spawn.test.ts` L27-119 (by Read — vi.mock + describe/it pattern, PATTERNS § 1 #8 80% reuse)
  - `src/checkpoint/state.ts` post-T1.3 (by Read — system under test)
  - `src/checkpoint/schema/*.ts` post-T1.2 (by Read — schemas under test)
- **acceptance_criteria**:
  - `pnpm test -- --run tests/checkpoint/schema.test.ts` exit 0; ≥ 6 it() blocks pass
  - `pnpm test -- --run tests/checkpoint/state.test.ts` exit 0; ≥ 7 it() blocks pass
  - `pnpm test -- --run tests/checkpoint/engineHook.test.ts` exit 0; ≥ 1 it() block pass (full pass after Wave 3 T3.2 lands engineHook.ts; Wave 1 ships scaffold + assertions)
  - `wc -l tests/checkpoint/schema.test.ts` ≤ 100
  - `wc -l tests/checkpoint/state.test.ts` ≤ 100
  - `wc -l tests/checkpoint/engineHook.test.ts` ≤ 60
- **decision_source**: PLAN.md Wave 1 behavior block + PATTERNS § 1 #8 #9 80% reuse + sister sdk-spawn.test.ts pattern + **orchestrator W-01 promote engineCheckpointHook PRIMARY + unit test cell added**

---

## Wave 2 — Template + archive + budget enforcement (D-01)

### T2.1 — src/checkpoint/template.ts NEW ~80L (writeCheckpoint + estimateTokens + enforceBudget)

- **files_modified**: `src/checkpoint/template.ts` (NEW ~80L Karpathy hard limit)
- **action**: Verbatim PATTERNS § 2.2 + RESEARCH § 3.3 truncate fallback ordering:
  ```typescript
  // src/checkpoint/template.ts NEW ~80L (D-01 TEMPLATE: zero LLM call lock per JSDoc)
  // Phase 3.1 R7.2 — checkpoint 摘要 < 1k token + archive 完整双轨写.
  import { mkdir, writeFile } from 'node:fs/promises'
  import { dirname, join } from 'node:path'
  import { Value } from '@sinclair/typebox/value'
  import { CheckpointV1, type CheckpointV1Type } from './schema/checkpoint.v1.js'

  export class CheckpointTooLargeError extends Error {
    constructor(public estimatedTokens: number) {
      super(`checkpoint exceeds 1k token budget (estimated ${estimatedTokens})`)
      this.name = 'CheckpointTooLargeError'
    }
  }

  /** Heuristic: 1 token ≈ 4 bytes UTF-8 (OpenAI sister rule ±20% accuracy 中英混合).
   *  1000 token budget 留 ~50% margin per RESEARCH § 3.2 typical 350-450 token checkpoint. */
  export function estimateTokens(c: CheckpointV1Type): number {
    return Math.ceil(Buffer.byteLength(JSON.stringify(c), 'utf8') / 4)
  }

  /** 2-level truncate fallback per RESEARCH § 3.3 ordering (last_task → key_decisions slice 3). */
  export function enforceBudget(c: CheckpointV1Type, maxTokens = 1000): CheckpointV1Type {
    if (estimateTokens(c) <= maxTokens) return c
    let t: CheckpointV1Type = { ...c, last_task: c.last_task.slice(0, 200) }
    if (estimateTokens(t) <= maxTokens) return t
    t = { ...t, key_decisions: t.key_decisions.slice(0, 3) }
    if (estimateTokens(t) <= maxTokens) return t
    throw new CheckpointTooLargeError(estimateTokens(t))
  }

  export async function writeCheckpoint(c: CheckpointV1Type): Promise<{ path: string }> {
    if (!Value.Check(CheckpointV1, c)) {
      throw new Error(`checkpoint schema validation failed: ${[...Value.Errors(CheckpointV1, c)].map((e) => e.message).join('; ')}`)
    }
    const enforced = enforceBudget(c)
    const path = join('.harnessed', 'checkpoints', `${enforced.phase}.json`)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, JSON.stringify(enforced, null, 2))
    return { path }
  }
  ```
- **read_first**:
  - `src/workflow/loadPhases.ts` L20-40 (by Read — Value.Check + Value.Errors sister pattern)
  - `src/checkpoint/schema/checkpoint.v1.ts` post-T1.2 (by Read — type import target)
  - `.planning/phase-3.1/PATTERNS.md` § 2.2 (by Read offset 77 limit 40)
  - `.planning/phase-3.1/RESEARCH.md` § 3 (by Read offset 337 limit 80)
- **acceptance_criteria**:
  - `wc -l src/checkpoint/template.ts` ≤ 80 (Karpathy hard limit)
  - `grep -q "Buffer.byteLength" src/checkpoint/template.ts` (Heuristic per D-01)
  - `grep -q "CheckpointTooLargeError" src/checkpoint/template.ts` (fail-loud per D-01)
  - **D-01 zero LLM call verify**: `! grep -E "query\(|anthropic|@anthropic-ai" src/checkpoint/template.ts` (无 LLM API import)
  - `pnpm typecheck` exit 0
- **decision_source**: D-01 TEMPLATE lock + RESEARCH § 3.1 + § 3.3 + PATTERNS § 2.2

### T2.2 — src/checkpoint/archive.ts NEW ~40L (writeArchive raw dump)

- **files_modified**: `src/checkpoint/archive.ts` (NEW ~40L)
- **action**:
  ```typescript
  // src/checkpoint/archive.ts NEW ~40L (Phase 3.1 R7.2 — archive 完整 raw turn 历史, NOT subject to 1k token budget)
  import { mkdir, writeFile } from 'node:fs/promises'
  import { dirname, join } from 'node:path'

  /** Archive sibling write — independent path from .harnessed/checkpoints/<phase>.json.
   *  NOT subject to 1k token budget (archive serves 回溯 only, never enters context per R7.2 lock). */
  export async function writeArchive(phase: string, rawTurns: unknown): Promise<{ path: string }> {
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    const path = join('.harnessed', 'archive', `phase-${phase}`, `raw-${ts}.json`)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, JSON.stringify(rawTurns, null, 2))
    return { path }
  }
  ```
- **read_first**:
  - `.planning/phase-3.1/PATTERNS.md` § 2.2 (by Read offset 107 limit 15 — archive section)
  - `.planning/phase-3.1/RESEARCH.md` § 8 (by Read offset 689 limit 25)
- **acceptance_criteria**:
  - `wc -l src/checkpoint/archive.ts` ≤ 50
  - `grep -q "writeArchive" src/checkpoint/archive.ts` exports
  - `grep -q "phase-\\${phase}" src/checkpoint/archive.ts` (path 沿袭 D-01 hint `.harnessed/archive/phase-<X.Y>/raw-<ts>.json`)
  - `pnpm typecheck` exit 0
- **decision_source**: D-01 TEMPLATE archive 子项 + R7.2 lock + RESEARCH § 8 + PATTERNS § 2.2

### T2.3 — src/checkpoint/index.ts NEW ~10L barrel export

- **files_modified**: `src/checkpoint/index.ts` (NEW ~10L)
- **action**:
  ```typescript
  // src/checkpoint/index.ts NEW ~10L barrel export (sister manifest schema modular pattern per RESEARCH § 4.3)
  export * from './schema/index.js'
  export * from './template.js'
  export * from './state.js'
  export * from './archive.js'
  // Wave 4 will add: export * from './sigintTrap.js'; export * from './compact.js'; export * from './resume.js'
  ```
- **read_first**:
  - `src/routing/lib/*.ts` (by Bash `ls src/routing/lib/*.ts` — verify barrel pattern sister via existing engine layer)
  - `.planning/phase-3.1/PATTERNS.md` § 1 #6 (by Read offset 21 limit 4)
- **acceptance_criteria**:
  - `wc -l src/checkpoint/index.ts` ≤ 15 (Wave 4 will ADD 3 more lines)
  - `grep -cE "export \\*" src/checkpoint/index.ts` ≥ 4 (Wave 2 ends with 4 exports; Wave 4 adds 3 more = 7 total)
  - `pnpm typecheck` exit 0
- **decision_source**: PATTERNS § 1 #6 95% reuse barrel pattern + Karpathy 单一职责

### T2.4 — tests/checkpoint/template.test.ts + archive.test.ts NEW ~140L (9 fixture)

- **files_modified**: `tests/checkpoint/template.test.ts` (NEW ~80L 5 fixture) + `tests/checkpoint/archive.test.ts` (NEW ~60L 4 fixture)
- **action**: Per PLAN.md Wave 2 behavior block 9 fixture:
  - template.test.ts (5 fixture): writeCheckpoint valid input writes file + returns path / Value.Check fails throws / estimateTokens returns Math.ceil(byte/4) / enforceBudget truncates last_task to 200 char / enforceBudget throws CheckpointTooLargeError on truly oversized
  - archive.test.ts (4 fixture): writeArchive writes to expected path / writeArchive creates parent dir recursive / writeArchive accepts 1MB raw (no budget) / writeArchive timestamp ISO replaced for filename safety
  - Use `vi.mock('node:fs/promises', ...)` sister pattern
  - Run `pnpm exec biome check --write` before commit
- **read_first**:
  - `tests/routing/sdk-spawn.test.ts` (by Read — vi.mock pattern reference)
  - `src/checkpoint/template.ts` + `src/checkpoint/archive.ts` post-T2.1+T2.2 (by Read — system under test)
- **acceptance_criteria**:
  - `pnpm test -- --run tests/checkpoint/template.test.ts` exit 0; ≥ 5 it() pass
  - `pnpm test -- --run tests/checkpoint/archive.test.ts` exit 0; ≥ 4 it() pass
  - **D-01 fail-loud verify**: 1 test asserts `expect(() => enforceBudget(oversized)).toThrow(CheckpointTooLargeError)`
  - `wc -l tests/checkpoint/template.test.ts` ≤ 100
  - `wc -l tests/checkpoint/archive.test.ts` ≤ 80
- **decision_source**: PLAN.md Wave 2 behavior block + PATTERNS § 1 #8 80% reuse

---

## Wave 3 — T4.4 closure infra dead-wiring 激活 (ralphLoop + engine.ts)

### T3.1 — src/routing/lib/ralphLoop.ts MODIFY +5L (sessionId capture activation)

- **files_modified**: `src/routing/lib/ralphLoop.ts` (MODIFY +5L hard limit ≤ 60L total)
- **action**: Per PLAN.md Wave 3 Option (a) preferred — extend spawn callback signature with onSessionId out-param:
  ```typescript
  // Phase 3.1 — sessionId activation (Phase 2.2 W4 T4.1 dead-wiring 首消费者 per RESEARCH § 1.5).
  // L38-49 之前签名: spawn: (resumeSessionId?: string) => Promise<string>
  // L38-49 改后签名: spawn: (resumeSessionId?: string, onSessionId?: (id: string) => void) => Promise<string>
  export async function ralphLoopWrap(
    spawn: (resumeSessionId?: string, onSessionId?: (id: string) => void) => Promise<string>,
    maxIter: number,
  ): Promise<string> {
    let last = ''
    let sessionId: string | undefined
    for (let i = 0; i < maxIter; i++) {
      last = await spawn(sessionId, (id) => { sessionId = id })  // ← capture for iter 2+ retry (Phase 3.1 dead-wiring 激活)
      if (isComplete(last)) return last
    }
    throw new MaxIterationsExceededError(maxIter)
  }
  ```
  Update L37 JSDoc: "Anchor 4 wedge — `resumeSessionId` flows through `spawn` so T4.1 sdkSpawn can attach SDK session resume (CD-4 **激活 Phase 3.1**; T4.4 dead-wiring 首消费者)."
- **read_first**:
  - `src/routing/lib/ralphLoop.ts` L1-49 entire file (by Read)
  - `src/routing/lib/sdkSpawn.ts` L26-69 (by Read — closure infra wire reference)
  - `.planning/phase-3.1/RESEARCH.md` § 1.5 (by Read offset 227 limit 12)
- **acceptance_criteria**:
  - `wc -l src/routing/lib/ralphLoop.ts` ≤ 55 (现 49L + ~5L)
  - `grep -q "sessionId = id" src/routing/lib/ralphLoop.ts` (capture activation verified)
  - `grep -q "onSessionId" src/routing/lib/ralphLoop.ts` (callback signature verified)
  - `pnpm typecheck` exit 0 (downstream consumers update T3.2 必跟进)
  - `pnpm test -- --run tests/routing/ralph-loop*.test.ts` exit 0 (现存测试不破)
- **decision_source**: D-04 WIRE-IN + RESEARCH § 1.5 dead-wiring 激活 + PATTERNS § 1 #14 100% reuse (signature ready, capture activation 新增)

### T3.2 — src/routing/engine.ts MODIFY (wedge) + src/checkpoint/engineHook.ts NEW ≤50L PRIMARY (W-01 orchestrator promote PRIMARY path; engine.ts ≤200L Karpathy hard limit clean restored)

- **files_modified**: `src/checkpoint/engineHook.ts` (NEW ≤50L PRIMARY path per W-01 orchestrator decision) + `src/routing/engine.ts` (MODIFY: wedge import + 1-2 hook call lines + wrappedSpawn signature extend ~5-7L; final ≤ 200L Karpathy hard limit clean — no B-03 tolerance needed) + `src/routing/agentDefinition.ts` (already MODIFY in T1.1 — `phaseId` field consumed here)
- **action**: Per orchestrator W-01 + W-04 fix coordinated rewrite:

  **Step 1 — NEW `src/checkpoint/engineHook.ts` ≤50L PRIMARY** (extracted from engine.ts; analog `src/routing/lib/sdkReconcile.ts` ≤56L Phase 2.2 pattern, helper extract from engine layer for testability):
  ```typescript
  // src/checkpoint/engineHook.ts — Phase 3.1 W-01 orchestrator PRIMARY path.
  // Extracted from engine.ts to keep engine.ts ≤ 200L Karpathy hard limit clean.
  // Analog: src/routing/lib/sdkReconcile.ts ≤56L (Phase 2.2 helper extract pattern).
  import { writeCheckpoint } from './template.js'
  import { activate, complete as completeWorkflow } from './state.js'
  import { SCHEMA_VERSIONS } from '../types/schemaVersion.js'

  export interface EngineCheckpointHookCtx {
    phaseId: string
    sessionId?: string
    status: 'active' | 'complete'  // 'paused' goes through sigintTrap.ts, not this hook
    lastTask?: string
    keyDecisions?: string[]
    canonicalRefs?: string[]
  }

  /** Activate + write checkpoint on phase start (status='active'). */
  export async function activatePhase(phaseId: string): Promise<{ checkpointPath: string }> {
    const checkpointPath = `.harnessed/checkpoints/${phaseId}.json`
    await activate(phaseId, checkpointPath)
    return { checkpointPath }
  }

  /** Write final checkpoint + transition workflow status='complete' on phase success. */
  export async function completePhase(ctx: EngineCheckpointHookCtx): Promise<void> {
    if (ctx.phaseId === 'unknown') {
      console.error('[harnessed] WARN engineHook: phaseId="unknown" — checkpoint paths fall back to .harnessed/checkpoints/unknown.json (Karpathy fail-loud non-blocking)')
    }
    await writeCheckpoint({
      schemaVersion: SCHEMA_VERSIONS.checkpoint,
      phase: ctx.phaseId, status: 'complete',
      last_task: ctx.lastTask ?? 'engine.runRouting complete',
      key_decisions: ctx.keyDecisions ?? [],
      canonical_refs: ctx.canonicalRefs ?? [],
      ...(ctx.sessionId ? { session_id: ctx.sessionId } : {}),
      cwd: process.cwd(),
      timestamp: new Date().toISOString(),
      archive_path: `.harnessed/archive/phase-${ctx.phaseId}/`,
    })
    await completeWorkflow()
  }
  ```

  **Step 2 — `src/routing/engine.ts` wedge edits**:
  1. Delete L182 `void capturedSessionId` placeholder
  2. Add 1-line import (top of file):
     ```typescript
     import { activatePhase, completePhase } from '../checkpoint/engineHook.js'
     ```
  3. Update wrappedSpawn (L172-181) signature — extend with `onSessionIdInner?: (id: string) => void` propagate (~5-7L):
     ```typescript
     const wrappedSpawn = async (resumeSessionId?: string, onSessionIdInner?: (id: string) => void): Promise<string> =>
       userSpawn
         ? userSpawn(agentDef)
         : defaultSpawn(agentDef, {
             expertName,
             ...(resumeSessionId ? { resumeSessionId } : {}),
             onSessionId: (id) => {
               capturedSessionId = id
               onSessionIdInner?.(id)  // ← propagate to ralphLoop iter 2+ retry capture
             },
           })
     // L182 `void capturedSessionId` — REMOVED (Phase 3.1 首消费者 + W-01 wedge)
     ```
  4. **W-04 fix path (a)** — phaseId via TaskContext (NO `as any` cast). Add before `try {`:
     ```typescript
     // Phase 3.1 — W-04 orchestrator fix path (a): phaseId via task.phaseId (TaskContext schema field added in T1.1).
     const phaseId = task.phaseId ?? 'unknown'
     await activatePhase(phaseId)
     ```
  5. Before `return { ok: true, result, matchedRule: matched }` — add 1-line hook call:
     ```typescript
     await completePhase({ phaseId, sessionId: capturedSessionId, status: 'complete' })
     ```
  6. **Update Resolved (T3.2 engine.ts wc gate) block** at task_plan.md top with 实占 wc 数值 (target ≤200L Karpathy hard limit clean — NO B-03 tolerance needed per W-01 orchestrator fix)
  7. **NO fallback split needed** — engine.ts wedge ≤200L by construction (engineHook.ts is PRIMARY extraction, not fallback)

  Note: `writeCheckpoint` / `activate` / `completeWorkflow` / `SCHEMA_VERSIONS` imports MOVE from engine.ts to engineHook.ts (no longer in engine.ts; W-01 wedge keeps engine.ts dependency surface minimal).
- **read_first**:
  - `src/routing/engine.ts` L1-195 entire file (by Read)
  - `src/checkpoint/state.ts` + `src/checkpoint/template.ts` post-W1+W2 (by Read — consumed by engineHook.ts)
  - `src/routing/lib/sdkReconcile.ts` (by Read — ≤56L helper extract analog per W-01 orchestrator + PATTERNS.md cross-ref)
  - `src/routing/agentDefinition.ts` post-T1.1 (by Read — verify TaskContext.phaseId field added)
  - `src/routing/lib/ralphLoop.ts` post-T3.1 (by Read — signature consistency verify)
  - `.planning/phase-3.1/RESEARCH.md` § 1.5 (by Read offset 227 limit 12)
  - `.planning/phase-3.1/PATTERNS.md` § 2.5 (by Read offset 191 limit 35)
- **acceptance_criteria**:
  - `! grep -q "void capturedSessionId" src/routing/engine.ts` (placeholder 删 verified)
  - `grep -qE "activatePhase|completePhase" src/routing/engine.ts` (hook call verified)
  - `grep -q "task.phaseId" src/routing/engine.ts` (W-04 fix path (a) verified)
  - `! grep -q "as any" src/routing/engine.ts` (W-04 Karpathy "Surgical Changes" hard守 — no `as any` cast)
  - `wc -l src/routing/engine.ts` ≤ 200 (**Karpathy hard limit clean restored** per W-01 orchestrator; no B-03 5% tolerance needed)
  - `wc -l src/checkpoint/engineHook.ts` ≤ 50 (W-01 orchestrator PRIMARY ≤50L hard limit)
  - `grep -q "EngineCheckpointHookCtx" src/checkpoint/engineHook.ts` (interface exported for testability)
  - `grep -q "WARN engineHook: phaseId" src/checkpoint/engineHook.ts` (Karpathy fail-loud warn-only for phaseId fallback per W-04 mitigation)
  - `pnpm typecheck` exit 0
  - `pnpm test -- --run tests/routing/engine.test.ts` exit 0 (现存测试不破)
- **decision_source**: D-04 WIRE-IN + RESEARCH § 1.5 + PATTERNS § 2.5 + **orchestrator W-01 promote engineCheckpointHook.ts PRIMARY (engine.ts ≤200L clean)** + **orchestrator W-04 fix path (a) thread phaseId via TaskContext + delete `as any`**

### T3.3 — tests/checkpoint/sdk-wire.test.ts NEW ~100L (6 fixture mock SDK)

- **files_modified**: `tests/checkpoint/sdk-wire.test.ts` (NEW ~100L)
- **action**: Per PLAN.md Wave 3 behavior block 6 fixture. Sister `tests/routing/sdk-spawn.test.ts` L17-184 mock @anthropic-ai/claude-agent-sdk + system:init session_id pattern (PATTERNS § 1 #11 90% reuse):
  - Test 1: SDK system:init session_id 'sess-abc' → engine capturedSessionId === 'sess-abc'
  - Test 2: iter 1 captures sessionId → iter 2 spawn(sessionId='sess-abc') passes to SDK options.resume
  - Test 3: SDK never emits system:init → checkpoint write {session_id: undefined} (Optional field omitted)
  - Test 4: SDK options.resume returns fresh session → fallback fresh + reload checkpoint (RESEARCH § 1.4 silent error mode)
  - Test 5: ralphLoopWrap returns successfully → engine completePhase({status:'complete', sessionId: captured}) called (engineHook.ts PRIMARY per W-01 orchestrator extract)
  - Test 6: assert sessionId reaches checkpoint via engineHook.completePhase path (verified in T3.2 commit)
  - **Test 7 (B-02 userSpawn fallback fixture per orchestrator fix path (b))**: provide `userSpawn` returning fixed agentDef → verify capturedSessionId remains `undefined` after ralphLoopWrap returns + completePhase ctx.sessionId === undefined + checkpoint.json `session_id` field NOT set (Optional field omitted) + downstream `resume.ts` hits fresh-session reload path (no SDK redirect; resumeHint includes "fresh session — context reloaded from checkpoint" per D-04 fallback lock). Documents userSpawn as fresh-session-only path (no session_id capture by design — userSpawn signature `(agentDef) => Promise<string>` has no onSessionId out-param; YAGNI per orchestrator B-02 fix path (b))
  - Run `pnpm exec biome check --write` before commit
- **read_first**:
  - `tests/routing/sdk-spawn.test.ts` L1-200 entire file (by Read — PATTERNS § 1 #11 direct analog)
  - `src/routing/engine.ts` + `src/routing/lib/ralphLoop.ts` post-T3.1+T3.2 (by Read — system under test)
  - `.planning/phase-3.1/PATTERNS.md` § 2.8 (by Read offset 269 limit 25)
- **acceptance_criteria**:
  - `pnpm test -- --run tests/checkpoint/sdk-wire.test.ts` exit 0; ≥ 7 it() pass (was ≥ 6, +1 for B-02 userSpawn fallback fixture)
  - `grep -cE "it\\(['\"]" tests/checkpoint/sdk-wire.test.ts` ≥ 7
  - `grep -q "vi.mock" tests/checkpoint/sdk-wire.test.ts` (mock SDK pattern sister)
  - `grep -q "userSpawn" tests/checkpoint/sdk-wire.test.ts` (B-02 fallback fixture present)
  - `grep -qE "fresh-session-only|no session_id capture|fresh session" tests/checkpoint/sdk-wire.test.ts` (B-02 documentation assertion)
  - `wc -l tests/checkpoint/sdk-wire.test.ts` ≤ 140 (+20L for B-02 fixture)
- **decision_source**: PLAN.md Wave 3 behavior block + PATTERNS § 1 #11 #2.8 90% reuse + sister sdk-spawn.test.ts + **orchestrator B-02 fix path (b) userSpawn fresh-session-only documented + fallback fixture**

---

## Wave 4 — SIGINT trap + harnessed resume CLI + compact placeholder

### T4.1 — src/checkpoint/sigintTrap.ts NEW ~25L (Node native + isShuttingDown + 30s timeout)

- **files_modified**: `src/checkpoint/sigintTrap.ts` (NEW ~25L)
- **action**: Verbatim RESEARCH § 2.3 implementation template:
  ```typescript
  // src/checkpoint/sigintTrap.ts NEW ~25L (D-02 Karpathy YAGNI — Node native zero-dep per RESEARCH § 2.1).
  import { writeCheckpoint } from './template.js'
  import { pause } from './state.js'
  import { SCHEMA_VERSIONS } from '../types/schemaVersion.js'

  let isShuttingDown = false

  export function registerSigintTrap(getActiveContext: () => { phase: string; sessionId?: string; lastTask: string } | null): void {
    process.on('SIGINT', () => {
      if (isShuttingDown) {
        console.error('\n[harnessed] force quit (2nd Ctrl+C) — checkpoint may be incomplete')
        process.exit(130)
      }
      isShuttingDown = true
      console.error('\n[harnessed] SIGINT — writing checkpoint (Ctrl+C again to force quit)...')
      const ctx = getActiveContext()
      if (!ctx) { process.exit(130); return }
      const timeout = setTimeout(() => {
        console.error('[harnessed] checkpoint write timeout — force exit')
        process.exit(130)
      }, 30000)
      Promise.all([
        writeCheckpoint({
          schemaVersion: SCHEMA_VERSIONS.checkpoint,
          phase: ctx.phase, status: 'paused',
          last_task: ctx.lastTask, key_decisions: [], canonical_refs: [],
          ...(ctx.sessionId ? { session_id: ctx.sessionId } : {}),
          cwd: process.cwd(), timestamp: new Date().toISOString(),
          archive_path: `.harnessed/archive/phase-${ctx.phase}/`,
        }),
        pause(),
      ])
        .then(() => { clearTimeout(timeout); console.error('[harnessed] checkpoint written. Run `harnessed resume` to continue.'); process.exit(130) })
        .catch((err) => { clearTimeout(timeout); console.error('[harnessed] checkpoint write failed:', err); process.exit(1) })
    })
  }
  ```
- **read_first**:
  - `.planning/phase-3.1/RESEARCH.md` § 2 (by Read offset 241 limit 100)
  - `src/checkpoint/template.ts` + `src/checkpoint/state.ts` post-W2 + W1 (by Read — type imports)
- **acceptance_criteria**:
  - `wc -l src/checkpoint/sigintTrap.ts` ≤ 35 (Karpathy hard limit)
  - `grep -q "process.on\\(['\"]SIGINT['\"]" src/checkpoint/sigintTrap.ts` (Node native YAGNI)
  - `grep -q "isShuttingDown" src/checkpoint/sigintTrap.ts` (double Ctrl+C防 per RESEARCH § 2.2)
  - `grep -q "30000" src/checkpoint/sigintTrap.ts` (30s timeout fallback per RESEARCH § 2.2)
  - `grep -q "process.exit(130)" src/checkpoint/sigintTrap.ts` (standard SIGINT exit code 128+2)
  - `pnpm typecheck` exit 0
- **decision_source**: D-02 KARPATHY hint + CONTEXT § Discretion SIGINT trap + RESEARCH § 2.3 verbatim template

### T4.2 — src/checkpoint/compact.ts NEW ~30L (shouldCompact 75% placeholder)

- **files_modified**: `src/checkpoint/compact.ts` (NEW ~30L MVP placeholder)
- **action**: Per RESEARCH § 7 推 75% threshold:
  ```typescript
  // src/checkpoint/compact.ts NEW ~30L (Phase 3.1 MVP placeholder — RESEARCH § 7 推 75% threshold).
  // Sister Claude Code "noisy workflow" override 50% + 平日 70% 中间; harnessed compact subcommand 推 Phase 3.4.
  export const DEFAULT_THRESHOLD_PCT = 75
  export const DEFAULT_CONTEXT_WINDOW = 200_000  // sonnet/opus 4.x baseline; 1M ctx defer Phase 3.4

  export interface CompactOpts {
    contextWindow?: number
    thresholdPct?: number
  }

  /** True when currentTokens ≥ thresholdPct% of contextWindow.
   *  Phase 3.1 MVP: 仅 judge fn, trigger consumer (harnessed compact subcommand) 推 Phase 3.4 token budget 监控. */
  export function shouldCompact(currentTokens: number, opts: CompactOpts = {}): boolean {
    const cw = opts.contextWindow ?? DEFAULT_CONTEXT_WINDOW
    const pct = opts.thresholdPct ?? DEFAULT_THRESHOLD_PCT
    return currentTokens >= (cw * pct / 100)
  }
  ```
- **read_first**:
  - `.planning/phase-3.1/RESEARCH.md` § 7 (by Read offset 649 limit 40)
- **acceptance_criteria**:
  - `wc -l src/checkpoint/compact.ts` ≤ 35 (Karpathy hard limit)
  - `grep -q "DEFAULT_THRESHOLD_PCT = 75" src/checkpoint/compact.ts` (RESEARCH § 7 推 75%)
  - `grep -q "DEFAULT_CONTEXT_WINDOW = 200_000" src/checkpoint/compact.ts`
  - `grep -q "shouldCompact" src/checkpoint/compact.ts` (export verify)
  - `pnpm typecheck` exit 0
- **decision_source**: CONTEXT § Discretion compact threshold + RESEARCH § 7 推 75%

### T4.3 — src/checkpoint/resume.ts NEW ~60L (runResume + cwd guard + branchOnSchemaVersion)

- **files_modified**: `src/checkpoint/resume.ts` (NEW ~60L)
- **action**: Verbatim RESEARCH § 5.2 with cwd guard (§ 1.3) integrated:
  ```typescript
  // src/checkpoint/resume.ts NEW ~60L (D-03 RELOAD: 输出 checkpoint 摘要 + 用户手动续跑, 不偷袭).
  import { readFile } from 'node:fs/promises'
  import { Value } from '@sinclair/typebox/value'
  import { readCurrentWorkflow } from './state.js'
  import { CheckpointV1, type CheckpointV1Type } from './schema/checkpoint.v1.js'

  export type ResumeResult =
    | { status: 'no-paused-phase'; error: string }
    | { status: 'corrupt'; error: string; path: string }
    | { status: 'ok'; checkpoint: CheckpointV1Type; cwdWarn?: string; resumeHint: string }

  export async function runResume(): Promise<ResumeResult> {
    const current = await readCurrentWorkflow()
    if (!current) return { status: 'no-paused-phase', error: 'no .harnessed/current-workflow.json found' }
    if (current.status !== 'paused') return { status: 'no-paused-phase', error: `workflow status is '${current.status}', not 'paused'` }
    let raw: string
    try { raw = await readFile(current.last_checkpoint_path, 'utf8') }
    catch (e: any) { return { status: 'corrupt', error: `checkpoint missing: ${e?.message ?? e}`, path: current.last_checkpoint_path } }
    let parsed: unknown
    try { parsed = JSON.parse(raw) }
    catch (e: any) { return { status: 'corrupt', error: `checkpoint JSON parse failed: ${e?.message ?? e}`, path: current.last_checkpoint_path } }
    if (!Value.Check(CheckpointV1, parsed)) {
      return { status: 'corrupt', error: `checkpoint schema validation failed: ${[...Value.Errors(CheckpointV1, parsed)].map(e => e.message).join('; ')}`, path: current.last_checkpoint_path }
    }
    const checkpoint = parsed
    const cwd = process.cwd()
    const cwdWarn = checkpoint.cwd !== cwd ? `⚠ checkpoint cwd '${checkpoint.cwd}' ≠ current cwd '${cwd}' — SDK session resume may fail (§ 1.3)` : undefined
    const sidHint = checkpoint.session_id ? ` (session_id: ${checkpoint.session_id} — SDK will redirect to original session)` : ' (fresh session — context reloaded from checkpoint)'
    const resumeHint = `→ in Claude Code: /gsd-execute-phase ${checkpoint.phase}${sidHint}`
    return { status: 'ok', checkpoint, ...(cwdWarn ? { cwdWarn } : {}), resumeHint }
  }
  ```
- **read_first**:
  - `.planning/phase-3.1/RESEARCH.md` § 5.2 + § 1.3 (by Read offset 520 limit 70 + offset 193 limit 15)
  - `src/checkpoint/schema/checkpoint.v1.ts` + `src/checkpoint/state.ts` post-W1 (by Read — type imports)
- **acceptance_criteria**:
  - `wc -l src/checkpoint/resume.ts` ≤ 70 (Karpathy hard limit)
  - `grep -q "no-paused-phase" src/checkpoint/resume.ts` (D-03 fail-loud status)
  - `grep -q "cwd !== cwd\\|checkpoint.cwd" src/checkpoint/resume.ts` (§ 1.3 cwd guard)
  - `grep -q "resumeHint" src/checkpoint/resume.ts` (D-03 RELOAD hint output)
  - `grep -q "Value.Check" src/checkpoint/resume.ts` (TypeBox validate per loadPhases pattern)
  - `pnpm typecheck` exit 0
- **decision_source**: D-03 RELOAD lock + RESEARCH § 5.2 + § 1.3 cwd guard + PATTERNS § 1 #5 65% reuse

### T4.4 — src/cli/resume.ts NEW ~40L + src/cli.ts MODIFY +2L (12th subcommand register)

- **files_modified**: `src/cli/resume.ts` (NEW ~40L) + `src/cli.ts` (MODIFY +2L 11 → 12 subcommand) + `src/checkpoint/index.ts` (MODIFY +3L barrel add sigintTrap/compact/resume)
- **action**: Verbatim PATTERNS § 2.4 sister doctor.ts L141-172 --json pattern:
  ```typescript
  // src/cli/resume.ts NEW ~40L (Phase 3.1 R7.3 — 12th subcommand harnessed resume).
  import type { Command } from 'commander'

  export function registerResume(program: Command): void {
    program
      .command('resume')
      .description('Reload checkpoint from paused workflow + print resume hint (D-03 RELOAD — user invokes phase command manually)')
      .option('--json', 'output JSON instead of human-readable')
      .action(async (opts: { json?: boolean }) => {
        const { runResume } = await import('../checkpoint/resume.js')
        const r = await runResume()
        if (opts.json) {
          console.log(JSON.stringify(r, null, 2))
          process.exit(r.status === 'ok' ? 0 : 1)
          return
        }
        if (r.status === 'no-paused-phase') { console.error(`✗ ${r.error}`); process.exit(1) }
        if (r.status === 'corrupt') { console.error(`✗ ${r.error}\n    path: ${r.path}`); process.exit(1) }
        if (r.cwdWarn) console.error(r.cwdWarn)
        console.log(`phase: ${r.checkpoint.phase}`)
        console.log(`last_task: ${r.checkpoint.last_task}`)
        if (r.checkpoint.key_decisions.length) console.log(`key_decisions: ${r.checkpoint.key_decisions.slice(0, 5).join(', ')}`)
        console.log(r.resumeHint)
        process.exit(0)
      })
  }
  ```

  `src/cli.ts` MODIFY +2L:
  ```typescript
  import { registerResume } from './cli/resume.js'  // ← L13 ADD
  // L22 comment update: "12 subcommands per ADR 0004 + 0007 + 0008 + 0011 + 0012 + 0013 + 0014 draft"
  registerResume(program)  // ← L36 ADD (between registerGc and program.parse)
  ```

  `src/checkpoint/index.ts` MODIFY +3L (Wave 2 T2.3 ended with 4 exports; add Wave 4 exports):
  ```typescript
  export * from './sigintTrap.js'
  export * from './compact.js'
  export * from './resume.js'
  ```
- **read_first**:
  - `src/cli.ts` L1-37 entire file (by Read — 11 subcommand pattern)
  - `src/cli/doctor.ts` L136-175 (by Read — --json flag + exit code pattern, PATTERNS § 1 #7 85% reuse)
  - `src/cli/execute-task.ts` L26-97 (by Read — registerXxx skeleton sister)
  - `src/checkpoint/resume.ts` post-T4.3 (by Read — runResume delegate target)
- **acceptance_criteria**:
  - `wc -l src/cli/resume.ts` ≤ 45 (Karpathy hard limit)
  - `grep -cE "register\\w+\\(program\\)" src/cli.ts | awk '$1 == 12'` (12 subcommand verified)
  - `grep -q "registerResume" src/cli.ts` (import + call site verified)
  - `grep -q "--json" src/cli/resume.ts` (CI-friendly flag per D-03 + sister doctor pattern)
  - `wc -l src/checkpoint/index.ts` ≤ 15 (4 → 7 exports)
  - `pnpm build` exit 0 (TypeScript compile clean)
  - `node ./dist/cli.mjs resume --help` exit 0 (subcommand registered runtime)
- **decision_source**: D-03 RELOAD + R7.3 12th subcommand + PATTERNS § 2.4 + § 1 #7 85% reuse + sister doctor.ts pattern

### T4.5 — tests/checkpoint/sigint.test.ts + compact.test.ts + tests/cli/resume.test.ts NEW ~230L (16 fixture)

- **files_modified**: `tests/checkpoint/sigint.test.ts` (NEW ~100L 5 fixture) + `tests/checkpoint/compact.test.ts` (NEW ~40L 4 fixture) + `tests/cli/resume.test.ts` (NEW ~90L 7 fixture)
- **action**: Per PLAN.md Wave 4 behavior block 16 fixture:
  - sigint.test.ts (5 fixture): SIGINT → paused + checkpoint write / double SIGINT force quit 130 / no-active workflow silent exit 130 / async write 30s timeout / status=complete no-op
  - compact.test.ts (4 fixture): under threshold returns false / at threshold returns true / over threshold returns true / custom override 50% works
  - resume.test.ts (7 fixture): paused happy stdout含 phase+last_task+hint / no current-workflow exit 1 / status=active exit 1 / checkpoint corrupt exit 1 / cwd mismatch warn stderr / --json schema verify / session_id absent fallback hint
  - Use `vi.spyOn(process, 'exit')` for exit code assertions
  - SIGINT tests use `process.emit('SIGINT')` + mock setTimeout for 30s timeout test
  - Sister Phase 2.4 W5 ralph-loop Win sentinel 5 fixture cross-OS verification pattern
  - Run `pnpm exec biome check --write` before commit
- **read_first**:
  - `tests/routing/sdk-spawn.test.ts` (by Read — vi.mock + describe/it pattern)
  - `src/checkpoint/sigintTrap.ts` + `src/checkpoint/compact.ts` + `src/checkpoint/resume.ts` + `src/cli/resume.ts` post-T4.1-T4.4 (by Read — system under test)
  - `tests/routing/ralph-loop-win-sentinel.test.ts` (by Read — sister Phase 2.4 W5 5 fixture cross-OS pattern)
- **acceptance_criteria**:
  - `pnpm test -- --run tests/checkpoint/sigint.test.ts` exit 0; ≥ 5 it() pass
  - `pnpm test -- --run tests/checkpoint/compact.test.ts` exit 0; ≥ 4 it() pass
  - `pnpm test -- --run tests/cli/resume.test.ts` exit 0; ≥ 7 it() pass
  - `wc -l tests/checkpoint/sigint.test.ts` ≤ 120
  - `wc -l tests/checkpoint/compact.test.ts` ≤ 50
  - `wc -l tests/cli/resume.test.ts` ≤ 110
  - **D-03 fail-loud verify**: 3+ tests assert `expect(exitSpy).toHaveBeenCalledWith(1)` (resume fail paths)
  - **D-04 fallback verify**: 1 test asserts session_id absent → hint contains 'fresh session — context reloaded from checkpoint'
- **decision_source**: PLAN.md Wave 4 behavior block + PATTERNS § 1 #10 75% reuse + sister Phase 2.4 W5 cross-OS pattern

---

## Wave 5 — e2e dogfood + ADR 0014 + ship + v0.3.0 alpha.1 close

### T5.1 — tests/integration/phase-3.1-e2e.test.ts NEW ~80L (e2e SIGINT → resume → SDK redirect)

- **files_modified**: `tests/integration/phase-3.1-e2e.test.ts` (NEW ~80L)
- **action**: Per PATTERNS § 2.8 sister `tests/routing/sdk-spawn.test.ts` L158-198 § "session_id capture + resume propagation" direct analog with SIGINT mock added:
  ```typescript
  // tests/integration/phase-3.1-e2e.test.ts NEW ~80L — D-04 WIRE-IN e2e end-to-end verify.
  import { describe, it, expect, vi, beforeEach } from 'vitest'

  describe('Phase 3.1 e2e — SIGINT → resume → SDK redirect (D-04 WIRE-IN)', () => {
    it('SIGINT during ralph-loop → current-workflow paused + checkpoint session_id captured', async () => {
      // setup: mock SDK init session_id 'sess-trap-1' (sister sdk-spawn.test.ts L158-171)
      // assert: .harnessed/current-workflow.json status='paused' + paused_at + checkpoint.session_id === 'sess-trap-1'
    })
    it('harnessed resume CLI → outputs session_id hint + exit 0', async () => {
      // setup: state from previous test (paused + session_id captured)
      // assert: runResume() returns {status:'ok', checkpoint:{session_id:'sess-trap-1'}, resumeHint contains 'sess-trap-1'}
    })
    it('next runRouting call → SDK options.resume === captured session_id (mock SDK)', async () => {
      // setup: harnessed resume returned hint; user invokes /gsd-execute-phase 3.1 (simulated by direct engine.runRouting call)
      // assert: defaultSpawn invoked with opts.resumeSessionId === 'sess-trap-1' (sister sdk-spawn.test.ts L173-184 verification)
    })
  })
  ```
  Run `pnpm exec biome check --write` before commit.
- **read_first**:
  - `tests/routing/sdk-spawn.test.ts` L157-198 (by Read — § "session_id capture + resume propagation" direct analog)
  - `.planning/phase-3.1/PATTERNS.md` § 2.8 (by Read offset 269 limit 25)
- **acceptance_criteria**:
  - `pnpm test -- --run tests/integration/phase-3.1-e2e.test.ts` exit 0; ≥ 3 it() pass
  - `wc -l tests/integration/phase-3.1-e2e.test.ts` ≤ 100
  - `grep -q "sess-trap-1\\|sess-" tests/integration/phase-3.1-e2e.test.ts` (mock session_id verify)
- **decision_source**: PLAN.md Wave 5 + PATTERNS § 1 #11 90% reuse + § 2.8 sister sdk-spawn.test.ts direct analog

### T5.2 — docs/adr/0014-checkpoint-engine-resume-compact.md NEW ~150L (9 章节 errata)

- **files_modified**: `docs/adr/0014-checkpoint-engine-resume-compact.md` (NEW ~150L — Wave 0 sketch L1-50 → Wave 5 fill L51-150)
- **action**:
  1. `ls docs/adr/ | grep -E '^[0-9]{4}-.*\.md$' | sort | tail -1` 确认 latest = `0013-*` (Phase 2.4 ship); next = `0014`
  2. **绝不预占** — 实际 ls 结果 = 0013 → next = 0014 实占
  3. NEW file `docs/adr/0014-checkpoint-engine-resume-compact.md` with 9 章节 (sister Phase 2.4 ADR 0013 9 章节 errata pattern):
     ```markdown
     # ADR 0014: Phase 3.1 — checkpoint 引擎 + harnessed resume + compact 协议

     Status: Accepted (phase 3.1 W5 — 2026-05-16)
     Date: 2026-05-16

     ## Context
     Phase 3.1 把 v0.3.0 milestone 第 1 phase (4 phase 中第 1, infra 底座) 装配为 checkpoint 引擎 (摘要 + archive 双轨写) + `harnessed resume` 12th CLI subcommand + compact 协议 75% threshold placeholder + Phase 2.2 T4.4 closure infra 三件套 dead-wiring 激活 + W0 backlog 4 项一次根治。

     ## Decisions
     ### 1. D-01 TEMPLATE checkpoint 摘要 (zero LLM call)
     `src/checkpoint/template.ts` 机械 extract 固定 JSON fields; `Buffer.byteLength/4` Heuristic 估 token; fail-loud truncate (last_task → 200 char → key_decisions slice 3 → throw CheckpointTooLargeError). Karpathy YAGNI + R7.2 验收"单 checkpoint < 1k token"指向机械拼装。

     ### 2. D-02 KARPATHY 极简 3-state current-workflow.json
     `src/checkpoint/state.ts` `active`/`paused`/`complete` enum; schemaVersion 7-surface → 8-surface (`harnessed.current-workflow.v1` 加 SCHEMA_VERSIONS + Union); 不引 xstate/robot3 dep。 6-state FSM textbook 推 v0.4 (D-02 evaluated rejected)。

     ### 3. D-03 RELOAD harnessed resume (不偷袭用户)
     `src/cli/resume.ts` 12th subcommand + `src/checkpoint/resume.ts` runResume; 输出 checkpoint 摘要 + human hint; 用户保留"忘记重开"自由。 AUTO-REPLAY 推 v0.4 dogfooding 验证 (D-03 evaluated rejected)。

     ### 4. D-04 WIRE-IN T4.4 closure infra 激活
     Phase 2.2 W4 T4.1 ship 三件套 (sdkSpawn.onSessionId + ralphLoopWrap.resumeSessionId + engine.wrappedSpawn capturedSessionId) 1 milestone 闲置后首消费者; ralphLoop.ts L43 dead-wiring + engine.ts L182 void placeholder 删 + checkpoint.write trigger + 30L cross 2 files (RESEARCH § 1.5 实测 KICKOFF "20-30L" 偏低 5-10L)。

     ### 5. § 1.3 cwd 匹配陷阱 mitigation
     code.claude.com `<encoded-cwd>` 路径 critical constraint — checkpoint schema 加 `cwd` field; resume cwd mismatch → stderr warn (不强 block, RELOAD lock 不偷袭)。

     ### 6. § 2 SIGINT Node native + isShuttingDown + 30s timeout
     `process.on('SIGINT', ...)` Karpathy YAGNI 零 dep; Win double Ctrl+C force quit 是 Windows OS 行为; exit 130 standard SIGINT code; setTimeout fallback 防 fs hang。

     ### 7. § 7 compact threshold 75% MVP placeholder
     sister Claude Code 平日 70% / noisy 50% 中间; harnessed compact subcommand 推 Phase 3.4 token budget 监控。

     ### 8. W0 backlog 4 项 absorb
     W0.1 AUDIT § 0.5 Line Budget Deviations Accepted (AUDIT actuals NOT KICKOFF stale per RESEARCH § 10 校对源) + W0.2 RETROSPECTIVE Advisory Absorb Path + W0.3 ci.yml README completeness check (B-04 bash) + W0.4 phase-2.4 self-check ≥0.80 fr verify report。

     ### 9. § 12 6-wave topology rationale + A7 conservation
     W0 backlog → W1 schema+state → W2 template+archive → W3 SDK wire-in → W4 SIGINT+CLI → W5 e2e+ship; ADR 0001-0013 main body 0 diff verify (A7 守恒 sister Phase 2.4 T6.2); ci.yml A7 iter 1-0013 → 1-0014; baseline tag adr-0014-accepted。

     ## A7 Conservation
     ADR 0001-0013 main body untouched; baseline tag 1-13 → 1-14; ci.yml A7 iter 1-0013 → 1-0014;
     docs/AGENT-DEFINITION-FACTORY-CONTRACT.md + docs/INSTALLER-CONTRACT.md main body 不动。

     ## References
     - .planning/phase-3.1/{3.1-KICKOFF, 3.1-CONTEXT, PATTERNS, RESEARCH, PLAN, task_plan}.md
     - .planning/ROADMAP.md L156-158 (Phase 3.1 拆分 + 验收)
     - .planning/REQUIREMENTS.md L255-303 (R7 cluster, R7.2 + R7.3)
     - docs/PROJECT-SPEC.md § 12 (checkpoint mech 立项参数)
     - code.claude.com/docs/en/agent-sdk/sessions § "Capture the session ID" + "Resume by ID" + "Resume across hosts"
     ```
- **read_first**:
  - `docs/adr/0013-phase-2.4-doctor-ee4-dashboard-c-path.md` (by Read — Phase 2.4 ADR 9 章节 sister pattern)
  - `.planning/phase-3.1/{3.1-CONTEXT, RESEARCH, PATTERNS}.md` (by Read — D-01~D-04 + § sections refs)
- **acceptance_criteria**:
  - `ls docs/adr/0014-*.md` 命中 1 file
  - `grep -cE "^### [1-9]\\. " docs/adr/0014-*.md | awk '$1 == 9'` (9 章节 verified)
  - `grep -q "Status: Accepted" docs/adr/0014-*.md`
  - `wc -l docs/adr/0014-*.md` ≤ 250 (Karpathy hard limit sister Phase 2.4 ADR 0013 185L)
- **decision_source**: KICKOFF § 1 ADR convention + sister Phase 2.4 ADR 0013 9 章节 + B-35 + B-36 SSOT 引用纪律

### T5.3 — STATE.md + RETROSPECTIVE.md + ROADMAP.md 续编 (Phase 3.1 SHIPPED)

- **files_modified**: `.planning/STATE.md` (MODIFY 续编 + entry #31) + `.planning/RETROSPECTIVE.md` (MODIFY Phase 3.1 milestone retrospective) + `.planning/ROADMAP.md` (MODIFY Phase 3.1 ✅ + v0.3.0 1/4)
- **action**:
  1. STATE.md L24 "下一 phase" 改 "v0.3.0 Phase 3.2 — gstack 前缀探测 + workflow 变量插值 + plan-feature reference 实装"
  2. STATE.md L24a 当前位置 改 "Phase 3.1 SHIPPED" + 6 Wave summary
  3. STATE.md 加 entry #31 (sister entry #30 Phase 3.1 启动 pattern):
     ```markdown
     31. ✅ ~~**Phase 3.1 SHIPPED**~~ (2026-05-16) — v0.3.0 milestone 第 1 phase, checkpoint 引擎 + harnessed resume + compact 协议. 6 Waves W0-W5 全 ship (W0 backlog 4 项 + W1 schema/state + W2 template/archive + W3 SDK wire-in T4.4 closure infra 激活 + W4 SIGINT + CLI resume + compact + W5 e2e dogfood); 28 atomic tasks; tests +~62; ADR 0014 9 章节 errata accepted; baseline tag adr-0014-accepted + milestone tag v0.3.0-alpha.1-checkpoint; A7 守恒 ADR 0001-0013 main body 0 diff verified.
     ```
  4. RETROSPECTIVE.md add Phase 3.1 milestone retrospective section (sister Phase 2.4 ship 模板): W0 cluster (4 项 vs Phase 2.4 5 项) + W3 T4.4 dead-wiring 1 milestone 闲置后激活 lesson + W5 dogfood real SIGINT cycle outcome + cumulative metric (tests 543 → ~605, +62)
  5. ROADMAP.md Phase 3.1 ☐ → ✅; v0.3.0 1/4 ship 标记; Phase 3.2 启动 prereq 列表 (gstack 前缀探测 / workflow 变量插值 / plan-feature reference 实装)
- **read_first**:
  - `.planning/STATE.md` L1-100 + L600+ (by Read — current state + entry pattern)
  - `.planning/RETROSPECTIVE.md` L1-100 (by Read — Phase 2.4 milestone retro 模板)
  - `.planning/ROADMAP.md` L128-175 (by Read — v0.3.0 section)
- **acceptance_criteria**:
  - `grep -q "Phase 3\\.1 SHIPPED" .planning/STATE.md` (entry #31)
  - `grep -q "下一 phase.*Phase 3\\.2" .planning/STATE.md` OR equivalent (next pointer)
  - `grep -q "Phase 3\\.1.*milestone retrospective\\|Phase 3\\.1 retro" .planning/RETROSPECTIVE.md`
  - `grep -q "Phase 3\\.1.*✅" .planning/ROADMAP.md`
  - 3 docs consistent (no drift between STATE / RETRO / ROADMAP)
- **decision_source**: sister Phase 2.4 W6 T6.3 STATE/RETRO/ROADMAP 续编 pattern + B-04 +1 metric cumulative

### T5.4 — A7 守恒 verify + ci.yml A7 iter bump (explicit `ADR 0001-0013` → `ADR 0001-0014` per W-02 orchestrator)

- **files_modified**: `.github/workflows/ci.yml` (MODIFY explicit `ADR 0001-0013` → `ADR 0001-0014` literal updates + `0013` digit literal extensions in loop bounds)
- **action**:
  1. **A7 守恒 verify command** (sister Phase 2.4 W6 T6.2 verbatim):
     ```bash
     git diff adr-0013-accepted..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/001[0-3]-*.md" | wc -l
     # Expected: 0 (ADR 0001-0013 main body 0 diff)
     ```
     若不 0 → MUST revert 改动到 ADR 0001-0013 main body (A7 hard mandate)
  2. **W-02 orchestrator explicit literal updates** (use exact string match, NOT naked "1-0013"):
     - **Edit `.github/workflows/ci.yml` L60**: `ADR 0001-0013` → `ADR 0001-0014` (step name "A7 acceptance bar — ADR 0001-0013 main body 守恒")
     - **Edit `.github/workflows/ci.yml` L85**: `ADR 0001-0013 main body unchanged` → `ADR 0001-0014 main body unchanged` (echo summary line)
     - **Loop bound expand** (L63 + L74 `for n in 0001 ... 0013; do`): append ` 0014` → `for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014; do` (both loops)
     - **Comment update L34** (Phase 2.4 ADR 0013 errata listing): append ` + Phase 3.1 ADR 0014 errata` → existing comment chain
     - **Comment update L55** (Phase 2.4 加 ADR 0013 description): leave Phase 2.4 history intact; OPTIONALLY add new comment line below for Phase 3.1 加 ADR 0014 (checkpoint engine + harnessed resume)
     - **Comment update L59**: `baseline tag iterate 扩到 13 个 (1-0012 → 1-0013, Phase 2.4 W6 T6.2 落地).` → append ` 扩到 14 个 (1-0013 → 1-0014, Phase 3.1 W5 T5.4 落地).`
  3. **Loop bound verify scope** (grep `0013` ci.yml to catch any other literals): run `grep -nE "0013" .github/workflows/ci.yml` and review each hit; bump `0013` → `0013 0014` in loops or `0013` → `0014` in version-range step names as appropriate per orchestrator W-02 rule
- **read_first**:
  - `.github/workflows/ci.yml` (by Read — find A7 verification step + verify L34 + L55 + L60 + L85 current literal contents per W-02 orchestrator)
  - sister Phase 2.4 W6 T6.2 commit history (by Bash `git log --oneline --grep="A7" --since="2026-05-15"` to find sister commit pattern)
- **acceptance_criteria**:
  - **A7 verify**: `test $(git diff adr-0013-accepted..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/001[0-3]-*.md" | wc -l) -eq 0` exit 0
  - `grep -q "ADR 0001-0014" .github/workflows/ci.yml` (W-02 explicit step-name update verified, replaces ambiguous `1-0014` substring check)
  - `! grep -q "ADR 0001-0013" .github/workflows/ci.yml` (W-02 no stale ADR range; old literal fully replaced)
  - `grep -E "for n in.*0014" .github/workflows/ci.yml | wc -l` ≥ 1 (loop bound expanded to include 0014)
  - `grep -q "ADR 0001-0014 main body unchanged" .github/workflows/ci.yml` (W-02 L85 echo summary verified)
- **decision_source**: sister Phase 2.4 W6 T6.2 + A7 守恒 hard mandate + B-23 sister precedent + **orchestrator W-02 explicit `ADR 0001-0014` literal (not naked `1-0014` substring)**

### T5.5 — Phase 3.1 dogfood (real SIGINT cycle acceptance per ROADMAP L158)

- **files_modified**: `.planning/phase-3.1/DOGFOOD-T5.5.md` (NEW ~20L outcome report) + (optionally) hotfix commits if dogfood fails
- **action**: REAL self-dogfood cycle (本 phase 自身 acceptance per ROADMAP "人为中断 session 后从 03 phase 续跑成功"):
  1. Start any harnessed routing workflow (e.g., research workflow OR mock plan-feature)
  2. Press Ctrl+C mid-ralph-loop iteration
  3. Verify `.harnessed/current-workflow.json` status='paused' + paused_at
  4. Verify `.harnessed/checkpoints/<phase>.json` exists + session_id captured (if SDK emitted)
  5. Run `node ./dist/cli.mjs resume` (production binary, NOT npx) → expect:
     - stdout: phase / last_task / key_decisions / "→ in Claude Code: /gsd-execute-phase X.Y (session_id: ... — SDK will redirect)"
     - exit 0
  6. In Claude Code: invoke `/gsd-execute-phase 3.1` (or whatever phase was paused)
  7. Verify ralph-loop iter resumes via SDK options.resume (capturedSessionId 复用 successful)
  8. Capture outcome to `.planning/phase-3.1/DOGFOOD-T5.5.md`:
     ```markdown
     # DOGFOOD T5.5 — Phase 3.1 self-acceptance (ROADMAP L158)
     **Date**: 2026-05-16
     **Cycle**: SIGINT → harnessed resume → /gsd-execute-phase 3.1
     **Outcome**: <PASS|HOTFIX_NEEDED>
     **Detail**: <transcript snippets, stdout output, exit codes>
     **Hotfix (if needed)**: <1-line commit ref + fix description sister Phase 2.4 W6 deferred-items #3 EE-4 step reorder pattern>
     ```
  9. **Update Resolved (T5.5) block** at task_plan.md top with outcome
- **read_first**:
  - `.planning/ROADMAP.md` L156-158 (by Read — acceptance bar verbatim)
  - `src/cli/resume.ts` post-T4.4 (by Read — CLI behavior reference)
  - sister Phase 2.4 W6 deferred-items #3 RESOLVED commit history (by Bash `git log --oneline --grep="deferred-items #3"`)
- **acceptance_criteria**:
  - `test -f .planning/phase-3.1/DOGFOOD-T5.5.md` exit 0
  - `grep -E "Outcome:.*PASS|Outcome:.*HOTFIX_NEEDED" .planning/phase-3.1/DOGFOOD-T5.5.md | wc -l` ≥ 1
  - **if HOTFIX_NEEDED**: 1+ commit ref captured + hotfix shipped within Wave 5 (sister Phase 2.4 W6 #3 1-line step reorder fix pattern); re-run dogfood after hotfix → PASS
  - Resolved (T5.5) block at task_plan.md top filled with outcome (no longer PENDING)
- **decision_source**: ROADMAP L156-158 Phase 3.1 验收 + sister Phase 2.4 W6 deferred-items #3 hotfix-within-ship-wave pattern

### T5.6 — Baseline tag adr-0014-accepted + milestone tag v0.3.0-alpha.1-checkpoint

- **files_modified**: git tags only (no file modifications) + optionally `.planning/STATE.md` (post-tag entry update)
- **action**:
  1. Pre-flight verify (sister Phase 2.4 W6 T6.4):
     ```bash
     git tag --list 'adr-0014-accepted'           # expect empty (no pre-existing)
     git tag --list 'v0.3.0-alpha.1-checkpoint'   # expect empty (no pre-existing)
     gh run list --workflow=ci.yml --limit=1 --json conclusion -q '.[0].conclusion'  # expect "success"
     ```
  2. Create + push tags:
     ```bash
     git tag adr-0014-accepted
     git tag v0.3.0-alpha.1-checkpoint
     git push origin adr-0014-accepted v0.3.0-alpha.1-checkpoint
     ```
  3. Wait for CI 3-OS run (Win Git Bash + macOS + Linux) → all conclusion success
  4. Update STATE.md with tag confirmation (entry #31 ext if needed)
- **read_first**:
  - sister Phase 2.4 W6 T6.4 commit history (by Bash `git log --oneline --grep="milestone tag" --since="2026-05-15"`)
- **acceptance_criteria**:
  - `git tag --list 'adr-0014-accepted' | grep -q .` (tag exists)
  - `git tag --list 'v0.3.0-alpha.1-checkpoint' | grep -q .` (tag exists)
  - `git log adr-0014-accepted -1 --format=%H` 一致 with HEAD (or expected commit)
  - `gh run list --workflow=ci.yml --limit=1 --json conclusion -q '.[0].conclusion'` == `"success"` (post-tag CI 3-OS green)
  - 3 OS matrix all success: `gh run view <run-id> --json jobs -q '.jobs[].conclusion' | sort -u` == `"success"`
- **decision_source**: sister Phase 2.4 W6 T6.4 baseline + milestone tag pattern + F8 ship acceptance bar

---

## § Wave 拓扑约束 (per RESEARCH § 12 verified)

- **Wave 0 必须最先** (4 项 backlog 不解,后续 wave CI 不稳; sister Phase 2.4 W0 pattern; 5 sub-tasks parallel)
- **Wave 1 → Wave 2 顺序依赖** (schema 先 / template+archive 消费 schema; loadPhases.ts Value.Check pattern sister 复用)
- **Wave 2 → Wave 3 顺序依赖** (template + estimateTokens 先 / engine.ts checkpoint.write 调 writeCheckpoint)
- **Wave 3 → Wave 4 顺序依赖** (sdkWire 先 / sigintTrap 调 writeCheckpoint with session_id, CLI resume 调 readCheckpoint with cwd guard)
- **Wave 4 → Wave 5 顺序依赖** (功能全 ready 后才 e2e dogfood + ship)
- **可 W1+W2 部分并行**: schema (W1) 与 template (W2) 实装可并 — schema 是 type-only 不阻 template 起草 (但 template 测试需 schema ready); planner 决断保守串行 (减少 merge conflict 风险)
- **无 wave 间 cross-Wave 并行** — 本 phase scope 高度 sequential (checkpoint engine 核心模块, 每 wave 依前 wave artifact); sister Phase 2.4 7 wave 缩 1 wave to 6 wave (本 phase scope 略 < Phase 2.4)

---

## § Risks (sister Phase 2.4 ASSUMPTIONS § C R-table)

- **R1**: ralphLoop signature 改 (T3.1 +5L) → 现有 caller (engine.ts T3.2 必跟进) typecheck break → LOW; 同 wave 双 file 同 commit
- **R2**: engine.ts 195→~210L 超 hard limit 5% → LOW; B-03 tolerance 容 (sister doctor.ts 215L); fallback split `src/routing/lib/engineCheckpointHook.ts` ≤ 50L if > 215
- **R3**: SDK 0.3.142 session resume "memory + tools state 未完整保留" (ADR 0011 § 1 实验性) → MEDIUM; 本 phase mock SDK 测试 + dogfood (T5.5) real-API 实测 outcome captured
- **R4**: cwd mismatch silent fresh session (§ 1.3 critical) → MEDIUM; resume.ts cwd guard warn user + checkpoint schema cwd field 强制 verify
- **R5**: SIGINT cross-OS Win double Ctrl+C force quit → LOW; isShuttingDown flag + exit 130 + sister Phase 2.4 W5 ralph-loop Win sentinel pattern
- **R6**: README completeness check (T0.3) 第一 push CI red (pre-flight count drift) → LOW; B1 plan-check fix pre-flight local verify sister Phase 2.4 W0 T0.3
- **R7**: Phase 3.1 dogfood (T5.5) fail → LOW-MED; sister Phase 2.4 W6 deferred-items #3 hotfix-within-ship-wave pattern (1-line fix + re-run dogfood)
- **R8**: ADR 0014 编号实占 (T5.2) 冲突 → LOW; solo 单线性 + ls tail-1 max+1 sister Phase 2.3 T0.1 pattern
- **R9**: A7 verify (T5.4) ADR 0001-0013 main body diff > 0 → LOW; ship-time verify hard gate revert 任何 main body 改动
- **R10**: tests/checkpoint/ + tests/cli/ + tests/integration/ vitest config 不 auto-discover → LOW; vitest 4.0 现有 `tests/**/*.test.ts` glob 覆盖 (W0 T0.5 mkdir + W1+ test ship 即触发 discover); 若不 discover → vitest.config.ts include pattern explicit add

---

## § Acceptance bar mapping (Wave → F1-F6 sister Phase 2.4 F1-F8)

| Wave | F-bar | Reproduction Command | Pass Criteria |
|------|-------|----------------------|---------------|
| 0 | F1 | `grep -E "Line Budget Deviations Accepted" .planning/v0.2.0-MILESTONE-AUDIT.md && grep -E "Advisory Absorb Path" .planning/RETROSPECTIVE.md && grep -E "README completeness check" .github/workflows/ci.yml && ls .planning/phase-3.1/W0-T5-verify.md && ls -d tests/checkpoint tests/cli tests/integration` | 4 backlog items committed + W0-T5-verify.md exists + 3 test dirs exist |
| 1 | F2 | `grep -cE "harnessed\\.\\w+\\.v1" src/types/schemaVersion.ts \| awk '$1 >= 8' && pnpm typecheck && pnpm test -- --run tests/checkpoint/schema.test.ts tests/checkpoint/state.test.ts` | 8-surface verified + typecheck clean + 13 fixture pass + Karpathy hard limit ≤ 80L per file |
| 2 | F3 | `wc -l src/checkpoint/template.ts src/checkpoint/archive.ts src/checkpoint/index.ts && pnpm test -- --run tests/checkpoint/template.test.ts tests/checkpoint/archive.test.ts` | template ≤ 80L + archive ≤ 50L + index ≤ 15L + 9 fixture pass + D-01 fail-loud verify |
| 3 | F4 | `! grep -q "void capturedSessionId" src/routing/engine.ts && grep -q "writeCheckpoint" src/routing/engine.ts && grep -q "sessionId = id" src/routing/lib/ralphLoop.ts && test $(wc -l < src/routing/engine.ts) -le 215 && pnpm test -- --run tests/checkpoint/sdk-wire.test.ts` | dead-wiring 激活 verified + engine.ts ≤ 215L + 6 fixture pass mock SDK |
| 4 | F5 | `grep -cE "register\\w+\\(program\\)" src/cli.ts \| awk '$1 == 12' && pnpm build && node ./dist/cli.mjs resume --help && pnpm test -- --run tests/checkpoint/sigint.test.ts tests/checkpoint/compact.test.ts tests/cli/resume.test.ts` | 12 subcommand + build clean + resume --help works + 16 fixture pass |
| 5 | F6 | `ls docs/adr/0014-*.md && grep -cE "^### [1-9]\\. " docs/adr/0014-*.md \| awk '$1 == 9' && test $(git diff adr-0013-accepted..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/001[0-3]-*.md" \| wc -l) -eq 0 && grep -q "Phase 3\\.1 SHIPPED" .planning/STATE.md && git tag --list 'adr-0014-accepted' && git tag --list 'v0.3.0-alpha.1-checkpoint' && gh run list --workflow=ci.yml --limit=1 --json conclusion -q '.[0].conclusion'` (expect "success") | ADR 0014 9 章节 + A7 0 diff + STATE updated + 2 tag exist + CI 3-OS green |

---

## § Phase 3.1 vs 2.4 / v0.3.0 boundary (sister Phase 2.4 § 8 boundary table)

| 维度 | Phase 2.4 (ship) | Phase 3.1 (本) | v0.3.0+ remainder (3.2-3.4) |
|------|------------------|-----------------|------------------------------|
| workflow | doctor 完整版 + EE-4 plan-checker absorb + dashboard C 路径 absorb + Win sentinel ✅ | **checkpoint 引擎 + harnessed resume + compact 协议** | Phase 3.2 plan-feature workflow + gstack 前缀探测 |
| schema | plan-review-schema.yaml + 3 处 enum (cc-hook) ✅ | **checkpoint.v1 + current-workflow.v1 (8th surface)** | Phase 3.3 manifest aliases.yaml + deprecation marker |
| ADR | 0013 单一覆盖 ✅ | 0014 errata 9 章节 (Wave 0 sketch → Wave 5 fill) | 各 phase 各 1 ADR cadence |
| CLI | 11 subcommand ✅ | **12th subcommand harnessed resume** | (frozen) |
| installer | 7 method (cc-hook-add 7th) ✅ | (不动) | (不动) |
| 治理 gate | EE-4 4 维 plan-checker BLOCKER manual rerun ✅ | (不动) | Phase 3.4 routing 命中率 ≥ 85% 验收 + EE-4 auto-spawn rerun |
| SDK closure | T4.4 三件套 ready 未 consumer ✅ | **T4.4 dead-wiring 首消费者 激活** | (frozen — Phase 3.2+ consumer 持续) |
| dashboard | C 路径 3 子 + SSE watcher ✅ | (复用 STATE.md watcher zero-code per CONTEXT § Discretion) | Phase 3.4 cross-phase history view |
| sample 命中 | 30 doctor fixture + 30 plan-checker fixture ✅ | (不动) | Phase 3.4 100+ sample × multi-model 验收 |
| milestone | v0.2.0 4/4 close ✅ | **v0.3.0 1/4 alpha.1-checkpoint** | v0.3.0 alpha.2/.3/.4 + v0.3.0 close |

---

**TASK PLAN COMPLETE** — 28 atomic tasks across 6 Waves W0-W5; ready for execute-plan handoff.
