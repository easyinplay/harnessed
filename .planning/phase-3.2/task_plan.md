# Phase 3.2 — task_plan.md

> **Authored**: 2026-05-16
> **Revised**: 2026-05-17 (planner-revision iter 1/3 — 1 BLOCKER + 3 WARNING absorbed per orchestrator tier-call decisions)
> **Author**: gsd-planner (Wave B + revision iter 1)
> **Sources**: CONTEXT.md D-01~D-04 + KICKOFF § 1-6 + PATTERNS § 1-5 (17 analog targets 100% hit) + RESEARCH § 1-18 (18 sections, W0.1 fix locked + 9th+10th surface 决 + W0.2 SSOT 决) + sister Phase 3.1 task_plan.md atomic structure + **PLAN-CHECK.md iter 1 (B-01 + W-01 + W-02 + W-03 orchestrator tier-call decisions)**
> **Style**: 沿袭 phase-3.1/task_plan.md per-task structure (files_modified / action concrete values / read_first / acceptance_criteria grep-verifiable / decision_source)
> **Task count**: 23 atomic tasks across 4 Waves (W0:4 / W1:8 / W2:6 / W3:5 / +biome lint preempt every commit) — count unchanged post-revision (T2.6 +1 fixture in same task cell; T2.1 +1 file in same task cell)
> **Hard limit verify**: every code-producing task 含 `wc -l ≤ N` acceptance criterion (Karpathy ≤200L hard limit B-06)

> ⚠️ **Schema registration discipline (CD-5 sister Phase 2.2 W2 T2.0 + Phase 3.1 W1 T1.1)**: 任何 NEW schema (config.v1 + governance.v1) 必走 `src/types/schemaVersion.ts` 单一 SSOT — 加 SCHEMA_VERSIONS const + Type.Literal Union; 任何 consume site (governance.ts readGovernance) 必走 `branchOnSchemaVersion<T>(v, { v1, unknown })` helper (不裸 string 比对); Wave 验收 `grep -r "branchOnSchemaVersion" src/` ≥ 4 references (Phase 3.1 baseline ≥3 + 本 phase governance consumer +1).

> ⚠️ **Biome lint preempt before commit** (project memory `feedback_biome-preempt.md` 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3): 任何 TS/JS commit 前必跑 `pnpm exec biome check --write`. CI biome step fail = 强制 rerun 3-OS 测试浪费.

> ⚠️ **D-decision 守门** (4 decisions LOCKED, executor 防 sneak-in per PATTERNS § 3.1):
> - **D-01 PROBE** locked → INTERACTIVE first-run prompt 不可 sneak-in (CI/headless unsupported)
> - **D-02 JINJA zero-dep** locked → mustache/handlebars npm dep 不可 sneak-in (Karpathy YAGNI)
> - **D-03 WIRED** locked → FULL real-spawn 不可 sneak-in (Phase 3.3+ dogfood scope)
> - **D-04 PUSH file-based + lazy-read 1 次 per phase boundary** locked → POLL setInterval/EVENT SIGUSR1 不可 sneak-in (Phase 2.4 SSE polling anti-pattern + Win signal 差异)

> ⚠️ **Planner-revision iter 1 守门** (1 BLOCKER + 3 WARNING absorbed per orchestrator tier-call decisions; see PLAN-CHECK.md iter 1):
> - **B-01 (BLOCKER)** T2.3 run.ts: activatePhase BEFORE isVetoed inside per-phase for-loop (statePause requires 'active' state to transition; covers veto-at-i=0 scenario) + T2.6 fixture 3 added (veto-at-i=0 with Phase 3.1 resume.ts proof)
> - **W-01 (WARNING)** T2.3 run.ts: `let sessionId` dead variable removed (sister Phase 3.1 W-04 BLOCKER lesson eliminate at source; WIRED stub returns no sessionId per D-03; Phase 3.3+ dogfood真 spawn 时 sessionId propagation 加)
> - **W-02 (WARNING)** T2.1: src/workflow/schema/phases.ts UNCONDITIONAL +4L extend (PhaseEntry add `invokes?: string` + PhasesSchema top-level add `on_veto?: 'halt_workflow'`) — Karpathy DRY: plan-feature workflow consumes same loader; extending parent schema cleaner than parallel
> - **W-03 (WARNING)** T0.3: W0.3-schema-decision.md adds "Path divergence from PATTERNS.md" section (schemas live under src/workflow/schema/ per consumer colocation rule; PATTERNS.md § 2.4 indicative checkpoint/schema/ sketch acknowledged + rationaled)

---

## Resolved Blocks (executor fill in-place, sister Phase 3.1 task_plan precedent)

> Resolved blocks 用于 executor 在跑 wave 时 surface 实测结果 (spike outcome / split decision / dogfood 结果) 锚定后续 task。

> **Resolved (T0.1 cli-audit fix outcome, PENDING)**: <PENDING — Wave 0 T0.1 fill: `corepack pnpm test -- --run tests/unit/cli-audit.test.ts 2>&1 | tail -10` post-Path-A-fix outcome (expect 0 fail, 4-5 pass); `corepack pnpm test 2>&1 | tail -10` full suite outcome (expect 596+ → 596+ pass / 0 fail); CI 3-OS green confirmation>

> **Resolved (T1.5 doctor.ts wc gate, PENDING)**: <PENDING — Wave 1 T1.5 fill: `wc -l src/cli/doctor.ts` post-6th-check 实测 (expect 175 → ~180L ≤ 200L Karpathy clean; **no** existing-helper split needed per RESEARCH § 1.4 verified baseline 175L NOT 215L stale)>

> **Resolved (T2.1 phases.ts wc gate, PENDING — planner-revision iter 1 W-02 NEW)**: <PENDING — Wave 2 T2.1 fill: `wc -l src/workflow/schema/phases.ts` post-W-02-extension 实测 (expect ~51 → ~54L ≤ 80L sister Phase 3.1 W1 schemas pattern)>

> **Resolved (T2.3 run.ts wc gate, PENDING — planner-revision iter 1 B-01 + W-01)**: <PENDING — Wave 2 T2.3 fill: `wc -l src/workflow/run.ts` post-B-01-reorder + W-01-dead-var-drop 实测 (expect ~78L ≤ 80L; B-01 reorder + W-01 drop net 0 LOC delta vs pre-revision draft); B-01 ordering proof outcome: `awk` line-order check passes (activatePhase line < isVetoed line)>

> **Resolved (T2.6 fixture 3 outcome, PENDING — planner-revision iter 1 B-01)**: <PENDING — Wave 2 T2.6 fill: veto-at-i=0 fixture pass + Phase 3.1 resume.ts integration proof (`runResume()` returns resumeCtx with phase='01-gstack-decision' + status='paused') outcome>

> **Resolved (T3.1 prefix matrix e2e, PENDING)**: <PENDING — Wave 3 T3.1 fill: 3-fixture prefix matrix e2e outcome (gstack- / '' / both ambiguous fail-loud); 写入 `.planning/phase-3.2/T3.1-prefix-matrix.md` if BLOCKER 发现>

---

## Deferred Items (Phase 3.2 carry-forward, will register at ship)

> **DEFERRED #X (Phase 3.2 prereq for Phase 3.3+)**: aliases.yaml + deprecation marker + known-good 版本组合 → Phase 3.3 (per ROADMAP L163-165 explicit Phase 3.3 scope)
> **DEFERRED #Y**: dashboard SSE governance.json watcher → Phase 3.3+ (本 phase SKIP per CONTEXT § Claude's Discretion + RESEARCH § 7.3)
> **DEFERRED #Z**: 路由命中率 ≥ 85% 验收 + token budget 监控 → Phase 3.4 (per ROADMAP L166-168)
> **DEFERRED #W-01a (planner-revision iter 1 NEW)**: sessionId propagation across phases — deferred to Phase 3.3+ dogfood 真 spawn 时 (when SDK session_id surfaces from real gsd-discuss / gsd-plan / gstack-office-hours spawn); WIRED mode (D-03) stub returns no sessionId so no propagation surface exists yet

---

## Wave 0 — Backlog 3 项 absorb + test infra setup (4 sub-tasks; T0.1 FIRST 必修)

### T0.1 — W0.1 cli-audit.test.ts env-dep CI red fix (Path A LOCKED) [FIRST TASK 必修]

- **files_modified**: `tests/unit/cli-audit.test.ts` (MODIFY ~+10-15L delta — add 1 vi.mock block)
- **read_first**:
  - `tests/unit/cli-audit.test.ts` L1-114 entire file (by Read — verify current 2 vi.mock at L13-14 + beforeEach L71-75)
  - `tests/cli/audit.test.ts` (by Read — sister Phase 2.4 W4 runtime-layer mock 范式 reference)
  - `src/cli/lib/audit-helpers.ts` L1-73 (by Read — verify auditOriginIntegrity / auditInstallCmdIntegrity / auditProvenance signatures)
  - `.planning/phase-3.2/RESEARCH.md` § 8 (W0.1 root cause + Path A locked recipe verbatim — offset 778 limit 120)
- **action**:
  1. Read `tests/unit/cli-audit.test.ts` to confirm L13-14 has the 2 existing vi.mock blocks (`fs/promises` + `validate.js`)
  2. **Path A LOCKED per RESEARCH § 8.3 verbatim** — Insert NEW vi.mock block AFTER L14 (after `vi.mock('../../src/manifest/validate.js', ...)` line):
     ```typescript
     // Phase 3.2 W0.1 fix (RESEARCH § 8.3 Path A LOCKED): mock runtime layer helpers
     // so manifest-only tests don't accidentally trigger real git/provenance
     // subprocesses (Phase 2.4 W4 added these as eager imports in src/cli/audit.ts L17-19).
     vi.mock('../../src/cli/lib/audit-helpers.js', () => ({
       auditOriginIntegrity: vi.fn(() => []),      // no findings = no exit-1 trigger
       auditInstallCmdIntegrity: vi.fn(() => []),
       auditProvenance: vi.fn(() => []),
     }))
     ```
  3. **Do NOT modify** `src/cli/audit.ts` (Path A test-only fix per RESEARCH § 8.6 — sister Phase 3.1 ship M+L+T pattern defer src changes when test-only fix exists)
  4. **Do NOT modify** existing 4 test cells L82-L114 (Path A is mock-add-only; expected outcome: L87 fail → pass + L96 fail → pass without changing test assertions)
  5. Run biome preempt locally: `pnpm exec biome check --write tests/unit/cli-audit.test.ts`
  6. Run local verify: `corepack pnpm test -- --run tests/unit/cli-audit.test.ts 2>&1 | tail -10`
  7. Run full suite verify: `corepack pnpm test 2>&1 | tail -10`
  8. **Update Resolved (T0.1) block** at task_plan.md top with outcome (PENDING → 实占 value: pass/fail count + full suite total)
- **acceptance_criteria**:
  - `grep -E "vi\.mock\('\.\./\.\./src/cli/lib/audit-helpers\.js'" tests/unit/cli-audit.test.ts | wc -l` == 1 (new mock block added)
  - `grep -E "auditOriginIntegrity:|auditInstallCmdIntegrity:|auditProvenance:" tests/unit/cli-audit.test.ts | wc -l` ≥ 3 (3 mock fns)
  - `corepack pnpm test -- --run tests/unit/cli-audit.test.ts 2>&1 | tail -3 | grep -E "Tests.*passed" | grep -v "fail"` exit 0 (0 fail)
  - `corepack pnpm test 2>&1 | tail -10 | grep -E "Test Files.*\d+ passed" | grep -v "failed"` exit 0 (full suite 0 fail)
  - **anti-scope-creep verify**: `git diff src/cli/audit.ts` empty (Path A test-only, src/ 不动)
  - **CI 3-OS green** post-push: GitHub Actions all 3 OS jobs green (first acceptance bar of Phase 3.2)
- **decision_source**: KICKOFF § 4 W0.1 + CONTEXT § Decisions W0.1 (Phase 3.1 deferred #1 priority bump 必修 first task) + RESEARCH § 8 (root cause + Path A locked recipe verbatim) + PATTERNS § 2.9 (mock pattern)

### T0.2 — W0.2 STATE.md 11 line-start markers + ci.yml ENFORCE flip (deferred #1 兑现)

- **files_modified**: `.planning/STATE.md` (MODIFY +~13L new section) + `.github/workflows/ci.yml` (MODIFY ~3L: delete `continue-on-error: true` + ::warning → ::error + add `exit 1`)
- **read_first**:
  - `.planning/STATE.md` L1-80 (by Read — verify current 历史 section 缺失 + identify insertion point after L34-37 表格)
  - `README.md` L40-60 (by Read — verify 11 line-start markers L46-56 as SSOT reference)
  - `.github/workflows/ci.yml` L195-215 (by Read — locate L200-211 README completeness check step exact line offsets)
  - `.planning/phase-3.2/RESEARCH.md` § 9 (W0.2 SSOT decision + STATE.md fix recipe verbatim — offset 906 limit 90)
- **action**:
  1. **STATE.md insert NEW section** AFTER existing 各里程碑进度 表格 (L34-37 area) BEFORE next section header. Insert verbatim per RESEARCH § 9.3:
     ```markdown
     ## 已完成 phase ship 历史 (W0.2 — README sync SSOT)

     > 与 README.md L46-56 一一对应; grep gate `^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped` 计 count 与 README 等

     - **Phase 3.1 SHIPPED** ✅ (2026-05-16) — checkpoint 引擎 + harnessed resume 12th CLI + compact 75% placeholder
     - **Phase 2.4 SHIPPED** ✅ (2026-05-16) — doctor 完整版 + EE-4 4 维 SSOT + dashboard C 路径
     - **Phase 2.3 SHIPPED** ✅ (2026-05-16) — extension MVP + karpathy SKILL-ONLY + 30/30 routing 100%
     - **Phase 2.2 SHIPPED** ✅ (2026-05-15) — execute-task workflow + SDK 0.3.142 + per-phase model tier
     - **Phase 2.1 SHIPPED** ✅ (2026-05-15) — 6 install method runtime-ready + transparency CI gate
     - **Phase 1.5 SHIPPED** ✅ (2026-05-14) — DAG resolver + Semantic Router L2 stub + 23 招式 routing
     - **Phase 1.4 SHIPPED** ✅ (2026-05-13) — routing engine v1 + AgentDefinition factory
     - **Phase 1.3 SHIPPED** ✅ (2026-05-13) — categorization schema + decision_rules.yaml v1
     - **Phase 1.2.5 architecture revision SHIPPED** ✅ (2026-05-12) — ADR 0006 wedge 升级
     - **Phase 1.2 SHIPPED** ✅ (2026-05-12) — cli-npm + mcp-stdio runtime + 5 CLI subcommands
     - **Phase 1.1 + 1.1.1 hotfix SHIPPED** ✅ (2026-05-12) — schema v1 frozen + 10 manifest + 3 ADR
     ```
  2. **ci.yml ENFORCE flip** — Find L200-211 `README completeness check` step (Phase 3.1 W0.3 注册). Modify 3 lines:
     - DELETE L201 `continue-on-error: true` line entirely
     - Change L210 `echo "::warning::README completeness drift (advisory, warn-only round 1)..."` → `echo "::error::README completeness drift: STATE=$STATE_COUNT README=$README_COUNT"`
     - ADD `exit 1` line immediately after the `::error::` line (within the same `if` branch)
     - Rename step title `[WARN-ONLY round 1]` → `[ENFORCE Phase 3.2 W0.2]` (sister ci.yml 命名 cadence)
  3. Run biome preempt: `pnpm exec biome check --write` (yaml files not biome-linted but harmless; only applies if any .ts touched in same commit)
  4. Local verify:
     ```bash
     STATE=$(grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" .planning/STATE.md)
     README=$(grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" README.md)
     echo "STATE=$STATE README=$README"  # expect STATE ≥ 11 == README 11
     ```
- **acceptance_criteria**:
  - `grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" .planning/STATE.md` ≥ 11 (post-fix; will become 12 after T3.3 adds Phase 3.2 entry)
  - `grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" README.md` == 11 (unchanged baseline)
  - `! grep -A1 "README completeness check" .github/workflows/ci.yml | grep -E "continue-on-error: true"` (ENFORCE flip verify — continue-on-error: true on README step DELETED)
  - `grep -E "::error::README completeness drift" .github/workflows/ci.yml | wc -l` ≥ 1 (severity escalated)
  - `grep -E "已完成 phase ship 历史" .planning/STATE.md | wc -l` ≥ 1 (new section header present)
  - `grep -E "ENFORCE Phase 3.2 W0\.2" .github/workflows/ci.yml | wc -l` ≥ 1 (step rename verify)
- **decision_source**: KICKOFF § 4 W0.2 (Phase 3.1 W0.3 deferred #1 兑现) + CONTEXT § Decisions W0.2 + RESEARCH § 9.1 Option A (README format SSOT) + § 9.3 recipe verbatim + § 9.4 ENFORCE flip recipe verbatim

### T0.3 — W0.3 schemaVersion 9th + 10th surface double-add decision record + W-03 path divergence section (planner-revision iter 1)

- **files_modified**: `.planning/phase-3.2/W0.3-schema-decision.md` (NEW ~40L decision record incl W-03 divergence section per planner-revision iter 1)
- **read_first**:
  - `.planning/phase-3.2/RESEARCH.md` § 4 (W0.3 9th surface decision Option B — offset 475 limit 90)
  - `.planning/phase-3.2/RESEARCH.md` § 10 (double-add config + governance + .harnessed file separation — offset 1000 limit 60)
  - `src/types/schemaVersion.ts` L1-72 (by Read — verify 8 current surfaces + Phase 3.1 W1 T1.1 8th surface 加入历史)
  - `.planning/phase-3.2/PATTERNS.md` § 2.4 L157-162 (W-03 source: sketches GovernanceV1 at src/checkpoint/schema/governance.v1.ts — indicative-of-pattern, not literal-path)
  - `.planning/phase-3.2/PLAN-CHECK.md` L134-148 (W-03 finding verbatim — planner-revision iter 1 source authority)
- **action**:
  1. Create NEW file `.planning/phase-3.2/W0.3-schema-decision.md` with content:
     ```markdown
     # W0.3 schemaVersion 9th + 10th surface decision record

     **Phase**: 3.2 W0.3 prereq
     **Date**: 2026-05-16
     **Revised**: 2026-05-17 (planner-revision iter 1 — W-03 path divergence section added)
     **Sources**: RESEARCH § 4.1 Option B + § 10.1 Option B + sister Phase 3.1 W1 T1.1 8th surface 模式 + PLAN-CHECK.md iter 1 W-03

     ## Decision

     **NEW double-add 2 surfaces**: `harnessed.config.v1` (9th, D-01 PROBE gstack_prefix store) + `harnessed.governance.v1` (10th, D-04 PUSH veto status).

     ## Rationale

     1. **Karpathy single-responsibility** (§ 4.1): governance 是外部 (gstack) push 的独立 lifecycle, NOT workflow lifecycle. 复用 `harnessed.current-workflow.v1` 加 optional `governance?: {...}` field 会 muddy state machine semantic, 违反 Karpathy single-responsibility 心法.
     2. **Race condition isolation** (§ 10.1): gstack 写 governance.json 不能动 harnessed 自家 current-workflow.v1 / config.json. 若 1 文件存 2 surface, gstack 写时需 read + merge + write — race风险. 双独立文件零 coupling.
     3. **Sister Phase 3.1 W1 8th surface precedent**: Phase 3.1 加 `currentWorkflow.v1` 是 7→8 双加 1 (单 +1). 本 phase 双 +2 仍同 pattern (SCHEMA_VERSIONS const + SchemaVersionLiteral Union 各加 entries). cost ~30L NEW schemas + 4L cross 2 处 (acceptable trade-off).
     4. **sister Phase 3.1 5-path .harnessed/ 模式延续** (§ 10.2): `.harnessed/` 已有 5 path (backup / state/manifest / state/installer / checkpoints/ / archive/ / current-workflow.json); 本 phase 加 2 file 自然延续 single-purpose pattern.

     ## Path divergence from PATTERNS.md (planner-revision iter 1 W-03 documented)

     **Divergence noted**: PATTERNS.md § 2.4 sketches GovernanceV1 schema at `src/checkpoint/schema/governance.v1.ts` (sister Phase 3.1 checkpoint/schema/ colocation pattern reference). This plan places it at `src/workflow/schema/governance.ts` instead. Same applies to ConfigV1 at `src/workflow/schema/config.ts` (vs PATTERNS sketch checkpoint/schema/config.v1.ts).

     **Rationale (Karpathy colocation rule)**: schemas live with primary consumers.
     - `GovernanceV1` primary consumer: `src/workflow/governance.ts readGovernance/isVetoed` + `src/workflow/run.ts runWorkflow` — both under `src/workflow/`
     - `ConfigV1` primary consumer (write side): `src/cli/doctor.ts` via `src/cli/lib/probe-gstack.ts` helper; (read side, downstream): `src/workflow/run.ts → loadPhases interpolate` consumes `gstack_prefix` as JINJA vars source — workflow/ side is the heavier consumer surface

     **Sister precedent**: `src/workflow/schema/phases.ts` (Phase 2.2 W3) already established workflow/schema/ colocation for workflow-domain schemas. Phase 3.1 checkpoint/schema/ colocation was for checkpoint-domain schemas (currentWorkflow.v1 + checkpoint.v1). Phase 3.2 governance + config schemas are workflow-domain (consumed by workflow/run.ts + workflow/governance.ts), therefore workflow/schema/ is correct colocation.

     **PATTERNS.md § 2.4 reclassification**: the path string `src/checkpoint/schema/governance.v1.ts` in PATTERNS.md § 2.4 was *indicative-of-pattern* (citing Phase 3.1 checkpoint/schema/ as TypeBox shape direct analog), NOT *literal-path mandate*. No schema move-to-checkpoint/ required. Karpathy-aligned: smallest change with clearest consumer locality.

     ## Schema specs

     ### `.harnessed/config.json` ↔ `src/workflow/schema/config.ts` (9th surface)

     ```typescript
     export const ConfigV1 = Type.Object({
       schemaVersion: Type.Literal(SCHEMA_VERSIONS.config),  // 'harnessed.config.v1'
       gstack_prefix: Type.Union([Type.Literal('gstack-'), Type.Literal('')]),
     })
     ```

     - Owner (writer): harnessed `src/cli/doctor.ts checkGstackPrefix` (auto-write after probe single-hit) OR user manual edit (ambiguous both-hits fallback per D-01)
     - Reader: harnessed `src/workflow/run.ts` (vars source for JINJA interpolate)
     - LOC: ~15L NEW

     ### `.harnessed/governance.json` ↔ `src/workflow/schema/governance.ts` (10th surface)

     ```typescript
     export const GovernanceV1 = Type.Object({
       schemaVersion: Type.Literal(SCHEMA_VERSIONS.governance),  // 'harnessed.governance.v1'
       status: Type.Union([Type.Literal('active'), Type.Literal('vetoed')]),
       reason: Type.Optional(Type.String({ maxLength: 500 })),
       vetoed_at: Type.Optional(Type.String({ format: 'date-time' })),
       vetoed_by: Type.Optional(Type.String({ maxLength: 100 })),
     })
     ```

     - Owner (writer): **external — gstack** (NOT in harnessed scope per D-04 lock; gstack 自身职责)
     - Reader: harnessed `src/workflow/governance.ts readGovernance / isVetoed`
     - LOC: ~25L NEW
     - Threat mitigation (RESEARCH § 11.4): maxLength caps prevent DOS; fixed path prevents traversal; TypeBox strict prevents schema drift attack (graceful null on unknown surface)

     ## Implementation order

     - W1 T1.1: `src/types/schemaVersion.ts` MODIFY +4L (SCHEMA_VERSIONS 加 config + governance; SchemaVersionLiteral Union 加 2 Type.Literal)
     - W1 T1.2: `src/workflow/schema/config.ts` NEW ~15L
     - W1 T1.3: `src/workflow/schema/governance.ts` NEW ~25L
     - W1 T1.7: `src/workflow/governance.ts` NEW ~25L (consume governance.v1 via branchOnSchemaVersion)
     - W2 T2.1 (planner-revision iter 1 W-02): `src/workflow/schema/phases.ts` MODIFY +4L UNCONDITIONAL (add invokes + on_veto Optional fields per W-02 — NOT a new schema surface, parent schema extension only)

     ## Verification

     - `grep -cE "harnessed\.\w+\.v1" src/types/schemaVersion.ts` ≥ 10 post-W1 T1.1
     - `grep -r "branchOnSchemaVersion" src/ | wc -l` ≥ 4 post-W1 T1.7 (Phase 3.1 baseline 3 + governance.ts consumer)
     - `grep -E "Path divergence from PATTERNS" .planning/phase-3.2/W0.3-schema-decision.md | wc -l` ≥ 1 (W-03 planner-revision iter 1 守门)
     ```
- **acceptance_criteria**:
  - `test -f .planning/phase-3.2/W0.3-schema-decision.md` exit 0
  - `grep -E "config\.v1|governance\.v1" .planning/phase-3.2/W0.3-schema-decision.md | wc -l` ≥ 4 (both surfaces referenced)
  - `grep -E "Option B" .planning/phase-3.2/W0.3-schema-decision.md | wc -l` ≥ 1
  - **W-03 planner-revision iter 1守门**: `grep -E "Path divergence from PATTERNS" .planning/phase-3.2/W0.3-schema-decision.md | wc -l` ≥ 1 (divergence section header present)
  - **W-03 守门**: `grep -E "indicative-of-pattern|colocation rule|src/workflow/schema/" .planning/phase-3.2/W0.3-schema-decision.md | wc -l` ≥ 2 (rationale captured)
  - `wc -l .planning/phase-3.2/W0.3-schema-decision.md` ≥ 40 ≤ 120 (+10L for W-03 section vs pre-revision ~30L)
- **decision_source**: KICKOFF § 4 W0.3 + CONTEXT § Decisions W0.3 + RESEARCH § 4.1 Option B + § 10.1 Option B + **planner-revision iter 1 W-03 LOCKED** (path divergence note added per orchestrator tier-call decision, source: `.planning/phase-3.2/PLAN-CHECK.md` L134-148)

### T0.4 — Test dirs setup + vitest config positive verify (sister Phase 3.1 W0 T0.5)

- **files_modified**: `tests/workflow/` + `tests/workflow/schema/` + `tests/integration/` (NEW directories via mkdir -p)
- **read_first**:
  - `tests/` directory list (by Bash `ls tests/`) — verify pre-existing dirs not broken
  - `vitest.config.ts` (by Read — positive verify glob covers tests dirs recursively per sister Phase 3.1 W-03 orchestrator fix)
- **action**:
  1. Create test dirs (idempotent):
     ```bash
     mkdir -p tests/workflow tests/workflow/schema tests/integration
     # No-op if already exist (tests/integration may already exist from Phase 3.1 W5)
     ```
  2. Positive verify vitest.config.ts include glob:
     ```bash
     grep -E "include:|tests/" vitest.config.ts
     ```
     - **Expected baseline**: include glob `tests/**/*.test.ts` (recursive **) — covers all NEW sub-dirs auto-discover
     - **Fallback** (if restrictive glob): add explicit 3 globs (`tests/workflow/**/*.test.ts`, `tests/workflow/schema/**/*.test.ts`, `tests/integration/**/*.test.ts`)
  3. Smoke run: `corepack pnpm test -- --run --reporter=dot 2>&1 | tail -3` (no break to existing 596+ suite)
- **acceptance_criteria**:
  - `[ -d tests/workflow ] && [ -d tests/workflow/schema ] && [ -d tests/integration ]` exit 0
  - `grep -E "tests/" vitest.config.ts` exit 0 (glob references tests dir)
  - `corepack pnpm test -- --run --reporter=dot 2>&1 | tail -3 | grep -v "failed"` exit 0 (existing suite still passes)
- **decision_source**: sister Phase 3.1 W0 T0.5 mkdir + vitest positive verify pattern

---

## Wave 1 — Schemas (9th+10th surface) + probe + interpolate + governance + doctor 6th check

### T1.1 — src/types/schemaVersion.ts MODIFY 8 → 10 surface (double-add config + governance)

- **files_modified**: `src/types/schemaVersion.ts` (MODIFY +4L: 2 SCHEMA_VERSIONS entries + 2 SchemaVersionLiteral Type.Literal)
- **read_first**:
  - `src/types/schemaVersion.ts` L1-72 entire file (by Read — verify 8 existing surfaces + Phase 3.1 W1 T1.1 加入历史)
  - `.planning/phase-3.2/RESEARCH.md` § 4.3 (9th surface register code excerpt verbatim — offset 512 limit 25)
  - `.planning/phase-3.2/PATTERNS.md` § 2.7 (10th surface 加 cost analog — offset 259 limit 25)
  - `.planning/phase-3.2/W0.3-schema-decision.md` (decision record from T0.3)
- **action**:
  1. L36-44 SCHEMA_VERSIONS const — add 2 entries after `currentWorkflow:`:
     ```typescript
     export const SCHEMA_VERSIONS = {
       routingSnapshot: 'harnessed.routing-snapshot.v1',
       handoffDoc: 'harnessed.handoff-doc.v1',
       phasesYaml: 'harnessed.phases-yaml.v1',
       manifestState: 'harnessed.manifest-state.v1',
       installerState: 'harnessed.installer-state.v1',
       routeDecisionLog: 'harnessed.route-decision-log.v1',
       checkpoint: 'harnessed.checkpoint.v1',
       currentWorkflow: 'harnessed.current-workflow.v1', // Phase 3.1 W1 T1.1 ADD 8th surface
       config: 'harnessed.config.v1',                    // ← Phase 3.2 W1 T1.1 ADD 9th surface (D-01 PROBE gstack_prefix)
       governance: 'harnessed.governance.v1',            // ← Phase 3.2 W1 T1.1 ADD 10th surface (D-04 PUSH veto status)
     } as const
     ```
  2. L49-58 SchemaVersionLiteral Union — add 2 Type.Literal entries:
     ```typescript
     export const SchemaVersionLiteral = Type.Union([
       Type.Literal(SCHEMA_VERSIONS.routingSnapshot),
       Type.Literal(SCHEMA_VERSIONS.handoffDoc),
       Type.Literal(SCHEMA_VERSIONS.phasesYaml),
       Type.Literal(SCHEMA_VERSIONS.manifestState),
       Type.Literal(SCHEMA_VERSIONS.installerState),
       Type.Literal(SCHEMA_VERSIONS.routeDecisionLog),
       Type.Literal(SCHEMA_VERSIONS.checkpoint),
       Type.Literal(SCHEMA_VERSIONS.currentWorkflow),
       Type.Literal(SCHEMA_VERSIONS.config),      // ← Phase 3.2 W1 T1.1 ADD
       Type.Literal(SCHEMA_VERSIONS.governance),  // ← Phase 3.2 W1 T1.1 ADD
     ])
     ```
  3. L13-20 JSDoc comment block — update surface list to mention "10 surfaces (Phase 3.2 W1 T1.1 ADD config + governance for D-01 + D-04 plan-feature workflow infra)"
  4. Run biome preempt: `pnpm exec biome check --write src/types/schemaVersion.ts`
- **acceptance_criteria**:
  - `grep -cE "harnessed\.\w+\.v1" src/types/schemaVersion.ts` ≥ 10 (sister Phase 3.1 grep gate auto-bump)
  - `grep -E "config: 'harnessed\.config\.v1'" src/types/schemaVersion.ts | wc -l` == 1
  - `grep -E "governance: 'harnessed\.governance\.v1'" src/types/schemaVersion.ts | wc -l` == 1
  - `grep -E "Type\.Literal\(SCHEMA_VERSIONS\.(config|governance)\)" src/types/schemaVersion.ts | wc -l` == 2
  - `pnpm typecheck 2>&1 | tail -3` exit 0 (TypeScript Static<typeof> infer Union 不 break)
  - `wc -l src/types/schemaVersion.ts` ≤ 80 (现 72L + 4L = 76L)
- **decision_source**: T0.3 W0.3 decision record + RESEARCH § 4.1 Option B + § 10.1 Option B + PATTERNS § 2.7 (CD-5 single 兼容门 discipline)

### T1.2 — src/workflow/schema/config.ts NEW (ConfigV1 9th surface, D-01 PROBE store)

- **files_modified**: `src/workflow/schema/config.ts` (NEW ~15L TypeBox ConfigV1)
- **read_first**:
  - `src/types/schemaVersion.ts` post-T1.1 (verify SCHEMA_VERSIONS.config entry exists)
  - `src/checkpoint/schema/currentWorkflow.v1.ts` (Phase 3.1 W1 sister TypeBox shape direct analog)
  - `.planning/phase-3.2/RESEARCH.md` § 10.3 (config.v1 schema verbatim — offset 1030 limit 20)
- **action**:
  1. Verify directory exists: `mkdir -p src/workflow/schema` (idempotent; loadPhases.ts already imports from `./schema/phases.ts` so dir exists)
  2. Create NEW file `src/workflow/schema/config.ts` verbatim per RESEARCH § 10.3:
     ```typescript
     // src/workflow/schema/config.ts — Phase 3.2 W1 T1.2 (D-01 PROBE 9th surface).
     // Sister Phase 3.1 W1 T1.2 (currentWorkflow.v1.ts TypeBox shape). Stores
     // gstack_prefix from doctor 6th check (probe-gstack.ts) for JINJA vars source.
     import { type Static, Type } from '@sinclair/typebox'
     import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

     export const ConfigV1 = Type.Object(
       {
         schemaVersion: Type.Literal(SCHEMA_VERSIONS.config),  // 'harnessed.config.v1'
         gstack_prefix: Type.Union([Type.Literal('gstack-'), Type.Literal('')]),
       },
       { additionalProperties: false },
     )
     export type ConfigV1Type = Static<typeof ConfigV1>
     ```
  3. Run biome preempt: `pnpm exec biome check --write src/workflow/schema/config.ts`
- **acceptance_criteria**:
  - `test -f src/workflow/schema/config.ts` exit 0
  - `grep -q "Type.Literal(SCHEMA_VERSIONS.config)" src/workflow/schema/config.ts`
  - `grep -q "additionalProperties: false" src/workflow/schema/config.ts` (strict)
  - `grep -E "export type ConfigV1Type = Static" src/workflow/schema/config.ts | wc -l` == 1
  - `wc -l src/workflow/schema/config.ts` ≤ 20 (~15L target)
  - `pnpm typecheck 2>&1 | tail -3` exit 0
- **decision_source**: T0.3 + T1.1 + RESEARCH § 10.3 + PATTERNS § 2.4 (TypeBox sister Phase 3.1 W1 shape direct复刻)

### T1.3 — src/workflow/schema/governance.ts NEW (GovernanceV1 10th surface, D-04 PUSH veto)

- **files_modified**: `src/workflow/schema/governance.ts` (NEW ~25L TypeBox GovernanceV1)
- **read_first**:
  - `src/types/schemaVersion.ts` post-T1.1 (verify SCHEMA_VERSIONS.governance entry exists)
  - `src/checkpoint/schema/checkpoint.v1.ts` (Phase 3.1 W1 T1.2 sister TypeBox shape direct analog with Union + maxLength caps)
  - `.planning/phase-3.2/RESEARCH.md` § 4.2 (GovernanceV1 schema verbatim — offset 487 limit 25)
- **action**:
  1. Create NEW file `src/workflow/schema/governance.ts` verbatim per RESEARCH § 4.2:
     ```typescript
     // src/workflow/schema/governance.ts — Phase 3.2 W1 T1.3 (D-04 PUSH 10th surface).
     // Sister Phase 3.1 W1 T1.2 (checkpoint.v1.ts TypeBox Union shape direct analog).
     // gstack writes .harnessed/governance.json (NOT in harnessed scope); harnessed
     // reads lazy-once per workflow phase boundary (see governance.ts isVetoed).
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
         reason: Type.Optional(Type.String({ maxLength: 500 })),    // DOS cap per RESEARCH § 11.4
         vetoed_at: Type.Optional(Type.String({ format: 'date-time' })),
         vetoed_by: Type.Optional(Type.String({ maxLength: 100 })),  // e.g. 'CEO'
       },
       { additionalProperties: false },
     )
     export type GovernanceV1Type = Static<typeof GovernanceV1>
     ```
  2. Run biome preempt: `pnpm exec biome check --write src/workflow/schema/governance.ts`
- **acceptance_criteria**:
  - `test -f src/workflow/schema/governance.ts` exit 0
  - `grep -q "Type.Literal(SCHEMA_VERSIONS.governance)" src/workflow/schema/governance.ts`
  - `grep -q "maxLength: 500" src/workflow/schema/governance.ts` (DOS mitigation per § 11.4)
  - `grep -q "additionalProperties: false" src/workflow/schema/governance.ts` (strict, threat mitigation T-3.2-01)
  - `grep -E "export (type GovernanceV1Type|const GovernanceV1|const GovernanceStatus)" src/workflow/schema/governance.ts | wc -l` == 3
  - `wc -l src/workflow/schema/governance.ts` ≤ 30
  - `pnpm typecheck 2>&1 | tail -3` exit 0
- **decision_source**: T0.3 + T1.1 + RESEARCH § 4.2 verbatim + PATTERNS § 2.4 (Phase 3.1 sister TypeBox 95% reuse)

### T1.4 — src/cli/lib/probe-gstack.ts NEW (D-01 PRIMARY helper, sister origin-check.ts)

- **files_modified**: `src/cli/lib/probe-gstack.ts` (NEW ~40-50L helper)
- **read_first**:
  - `src/cli/lib/origin-check.ts` L1-80 entire file (by Read — sister 80L helper pattern direct analog)
  - `src/cli/doctor.ts` L79-95 (by Read — sister `checkJq` Win shell flavor pattern direct copy)
  - `.planning/phase-3.2/RESEARCH.md` § 1.4 (4 状态 message table + fix hints verbatim — offset 330 limit 12)
  - `.planning/phase-3.2/PATTERNS.md` § 2.1 (probe-gstack.ts excerpt — offset 42 limit 40)
- **action**:
  1. Create NEW file `src/cli/lib/probe-gstack.ts` (sister origin-check.ts header + RESEARCH § 1.2 implementation):
     ```typescript
     // src/cli/lib/probe-gstack.ts — Phase 3.2 W1 T1.4 — D-01 PROBE PRIMARY helper
     // (sister Phase 2.4 W3 origin-check.ts sister-share extract pattern for Karpathy
     // ≤200L 守门 — keeps doctor.ts ≤200L). Probes 3 valid states + 1 ambiguous +
     // 1 missing = 4 outcome branches. Win shell flavor sister checkJq L80-83.
     import { spawnSync } from 'node:child_process'

     export type GstackPrefix = 'gstack-' | ''
     export interface ProbeResult {
       status: 'pass' | 'fail'
       prefix?: GstackPrefix
       detail: string
       fix?: string
     }

     function probeOne(cmd: string): boolean {
       // sister doctor.ts L80 checkJq pattern: process.platform === 'win32' ? 'where' : 'which'
       // Node spawnSync 不继承 shell context, 跨 Win-shell 唯一稳路径 (RESEARCH § 1.2 verified).
       const finder = process.platform === 'win32' ? 'where' : 'which'
       const r = spawnSync(finder, [cmd], { encoding: 'utf8' })
       return r.status === 0 && (r.stdout?.trim().length ?? 0) > 0
     }

     export function probeGstackPrefix(): ProbeResult {
       const hasGstack = probeOne('gstack-office-hours')
       const hasBare = probeOne('office-hours')
       // 4-state branch per D-01 PROBE locked (RESEARCH § 1.4 message table verbatim)
       if (hasGstack && !hasBare) {
         return { status: 'pass', prefix: 'gstack-', detail: 'gstack-office-hours found' }
       }
       if (!hasGstack && hasBare) {
         return { status: 'pass', prefix: '', detail: 'office-hours found (--no-prefix mode)' }
       }
       if (hasGstack && hasBare) {
         return {
           status: 'fail',
           detail: 'both gstack-office-hours AND office-hours found — ambiguous',
           fix: "edit .harnessed/config.json manually: '{\"gstack_prefix\":\"gstack-\"}' OR '{\"gstack_prefix\":\"\"}'",
         }
       }
       return {
         status: 'fail',
         detail: 'neither gstack-office-hours nor office-hours found in PATH',
         fix: 'install gstack: `npm i -g @gstack/cli` (or your preferred install method)',
       }
     }
     ```
  2. Run biome preempt: `pnpm exec biome check --write src/cli/lib/probe-gstack.ts`
- **acceptance_criteria**:
  - `test -f src/cli/lib/probe-gstack.ts` exit 0
  - `grep -q "process.platform === 'win32' ? 'where' : 'which'" src/cli/lib/probe-gstack.ts` (sister checkJq pattern verbatim)
  - `grep -q "gstack-office-hours" src/cli/lib/probe-gstack.ts` (PROBE target #1)
  - `grep -q "office-hours" src/cli/lib/probe-gstack.ts` (PROBE target #2)
  - `grep -cE "status: 'pass'|status: 'fail'" src/cli/lib/probe-gstack.ts` ≥ 4 (4-state branches)
  - `grep -E "export (interface ProbeResult|function probeGstackPrefix|type GstackPrefix)" src/cli/lib/probe-gstack.ts | wc -l` == 3
  - `wc -l src/cli/lib/probe-gstack.ts` ≤ 50 (Karpathy PRIMARY helper hard limit)
  - `pnpm typecheck 2>&1 | tail -3` exit 0
- **decision_source**: D-01 PROBE locked + RESEARCH § 1.2 + § 1.4 verbatim + PATTERNS § 2.1 (origin-check.ts 90% reuse)

### T1.5 — src/cli/doctor.ts MODIFY +5L (6th check checkGstackPrefix dispatch)

- **files_modified**: `src/cli/doctor.ts` (MODIFY +5-8L — add async checkGstackPrefix + push to results array + description string update)
- **read_first**:
  - `src/cli/doctor.ts` L128-148 (by Read — verify checkOriginUrl pattern L130-134 + results array L142-148 exact lines)
  - `src/cli/lib/probe-gstack.ts` (T1.4 output — verify probeGstackPrefix export signature)
  - `.planning/phase-3.2/PATTERNS.md` § 2.5 (doctor.ts 6th check excerpt verbatim — offset 186 limit 30)
- **action**:
  1. Read current `src/cli/doctor.ts` to confirm L130-134 checkOriginUrl exists and L142-148 results array structure
  2. Add async function `checkGstackPrefix` immediately AFTER `checkOriginUrl` (around L135, before `export function registerDoctor`):
     ```typescript
     // Phase 3.2 W1 T1.5 — 6th check: gstack command prefix PROBE (D-01 LOCKED).
     // Sister Phase 2.4 W1 T1.2 checkOriginUrl L130-134 dynamic import + delegate pattern.
     async function checkGstackPrefix(): Promise<CheckResult> {
       const { probeGstackPrefix } = await import('./lib/probe-gstack.js')
       const r = probeGstackPrefix()
       return { name: 'gstack prefix', status: r.status, message: r.detail, fix: r.fix }
     }
     ```
  3. Modify L139 description string — change `'Preflight checks (Node / MCP scope / jq / Win bash / origin URL)'` → `'Preflight checks (Node / MCP scope / jq / Win bash / origin URL / gstack prefix)'`
  4. Modify L142-148 results array — push 6th entry:
     ```typescript
     const results: CheckResult[] = [
       checkNodeVersion(),
       await checkMcpScope(),
       checkJq(),
       checkWinBash(),
       await checkOriginUrl(),
       await checkGstackPrefix(),  // ← Phase 3.2 W1 T1.5 ADD 6th check (D-01 PROBE)
     ]
     ```
  5. Run biome preempt: `pnpm exec biome check --write src/cli/doctor.ts`
  6. Local verify `wc -l src/cli/doctor.ts` ≤ 200 (expected 175 → ~180L Karpathy clean, no B-03 tolerance needed)
  7. **Update Resolved (T1.5) block** at task_plan.md top with `wc -l` actual outcome
- **acceptance_criteria**:
  - `grep -q "checkGstackPrefix" src/cli/doctor.ts`
  - `grep -q "await import('./lib/probe-gstack.js')" src/cli/doctor.ts` (dynamic import sister pattern)
  - `grep -q "await checkGstackPrefix()" src/cli/doctor.ts` (results array push)
  - `grep -q "gstack prefix" src/cli/doctor.ts` (description string + name field)
  - `wc -l src/cli/doctor.ts` ≤ 200 (Karpathy hard limit, no B-03 5% tolerance needed per RESEARCH § 1.4 baseline 175L verified)
  - `pnpm typecheck 2>&1 | tail -3` exit 0
  - `corepack pnpm test -- --run tests/cli/doctor.test.ts 2>&1 | tail -5` exit 0 (existing doctor tests pass; 6th check tests in T1.8)
- **decision_source**: D-01 PROBE locked + T1.4 + RESEARCH § 1.1 + PATTERNS § 2.5 verbatim

### T1.6 — src/workflow/interpolate.ts NEW (D-02 JINJA zero-dep throw-on-missing)

- **files_modified**: `src/workflow/interpolate.ts` (NEW ~25-30L pure fn)
- **read_first**:
  - `src/workflow/loadPhases.ts` L15-30 (sister PhasesValidationError class shape + throw pattern)
  - `.planning/phase-3.2/RESEARCH.md` § 2.2 (interpolate.ts implementation verbatim — offset 365 limit 25)
  - `.planning/phase-3.2/RESEARCH.md` § 3 (throw vs fallback decision — Karpathy fail-loud locked — offset 425 limit 50)
  - `.planning/phase-3.2/PATTERNS.md` § 2.2 (interpolate.ts excerpt — offset 85 limit 35)
- **action**:
  1. Create NEW file `src/workflow/interpolate.ts` verbatim per RESEARCH § 2.2:
     ```typescript
     // src/workflow/interpolate.ts — Phase 3.2 W1 T1.6 (D-02 JINJA LOCKED).
     // Karpathy YAGNI hard limit ≤30L — no mustache/handlebars dep (sister Phase 3.1
     // D-02 KARPATHY 3-state precedent: zero FSM-lib for 3 states / zero template-lib
     // for 2-line regex replace). Throws on undefined var per RESEARCH § 3 (fail-loud,
     // 行业 strict 推荐 jinja2 strict_variables=True + handlebars strict:true).

     export class InterpolationError extends Error {
       constructor(message: string) {
         super(message)
         this.name = 'InterpolationError'
       }
     }

     const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g

     /** Substitute {{ var }} placeholders in template with vars[name].
      *  Throws InterpolationError on undefined var (fail-loud per RESEARCH § 3).
      *  `\w` = [A-Za-z0-9_] — single-word vars only (no dot-path, no nested).
      *  Edge: nested {{ a.b }} → throws (\w 不命中 '.'); escape `\{\{ literal \}\}` is
      *  not supported as syntax — author should not place literal `{{ ... }}` in yaml. */
     export function interpolate(template: string, vars: Record<string, string>): string {
       return template.replace(PLACEHOLDER, (_match, name: string) => {
         if (!(name in vars)) {
           throw new InterpolationError(
             `undefined template variable '${name}' (template excerpt: ${template.slice(0, 80)})`,
           )
         }
         return vars[name]
       })
     }
     ```
  2. Run biome preempt: `pnpm exec biome check --write src/workflow/interpolate.ts`
- **acceptance_criteria**:
  - `test -f src/workflow/interpolate.ts` exit 0
  - `grep -q "class InterpolationError extends Error" src/workflow/interpolate.ts`
  - `grep -q "\\\\{\\\\{\\\\s\\*(\\\\w+)\\\\s\\*\\\\}\\\\}" src/workflow/interpolate.ts` OR (simpler regex grep) `grep -q "PLACEHOLDER" src/workflow/interpolate.ts`
  - `grep -q "throw new InterpolationError" src/workflow/interpolate.ts` (Karpathy fail-loud)
  - `! grep -E "mustache|handlebars|nunjucks" src/workflow/interpolate.ts` (zero-dep守门, D-02 anti-pattern guard per PATTERNS § 3.1)
  - `wc -l src/workflow/interpolate.ts` ≤ 30 (D-02 spec hard limit per RESEARCH § 2.2)
  - `pnpm typecheck 2>&1 | tail -3` exit 0
- **decision_source**: D-02 JINJA locked + RESEARCH § 2.2 verbatim + § 3 throw-on-missing locked + PATTERNS § 2.2 (50% reuse error class shape, regex NEW)

### T1.7 — src/workflow/governance.ts NEW (D-04 PUSH lazy-read sister state.ts)

- **files_modified**: `src/workflow/governance.ts` (NEW ~25L fail-soft reader)
- **read_first**:
  - `src/checkpoint/state.ts` L23-41 (by Read — sister readCurrentWorkflow fail-soft pattern direct analog)
  - `src/workflow/schema/governance.ts` (T1.3 output — verify GovernanceV1 / GovernanceV1Type exports)
  - `src/types/schemaVersion.ts` post-T1.1 (verify branchOnSchemaVersion still has same signature)
  - `.planning/phase-3.2/RESEARCH.md` § 4.4 (readGovernance/isVetoed verbatim — offset 533 limit 30)
  - `.planning/phase-3.2/PATTERNS.md` § 2.3 (governance.ts excerpt verbatim — offset 122 limit 35)
- **action**:
  1. Create NEW file `src/workflow/governance.ts` verbatim per RESEARCH § 4.4 + PATTERNS § 2.3:
     ```typescript
     // src/workflow/governance.ts — Phase 3.2 W1 T1.7 (D-04 PUSH LOCKED).
     // Sister src/checkpoint/state.ts L23-41 readCurrentWorkflow fail-soft pattern
     // (direct analog). gstack writes .harnessed/governance.json (NOT in harnessed
     // scope per D-04); harnessed reads lazy-once per workflow phase boundary
     // (NOT polling per Phase 2.4 SSE anti-pattern lesson + D-04 anti-pattern guard).

     import { readFile } from 'node:fs/promises'
     import { Value } from '@sinclair/typebox/value'
     import { branchOnSchemaVersion } from '../types/schemaVersion.js'
     import { GovernanceV1, type GovernanceV1Type } from './schema/governance.js'

     const GOV_PATH = '.harnessed/governance.json'

     /** Read .harnessed/governance.json with fail-soft null on missing/corrupt/drift.
      *  Sister state.ts:23-41. Missing file = active (no veto) by design — D-04 PUSH
      *  default is active unless gstack explicitly writes vetoed state. */
     export async function readGovernance(): Promise<GovernanceV1Type | null> {
       let raw: string
       try {
         raw = await readFile(GOV_PATH, 'utf8')
       } catch {
         return null  // missing file = active fail-soft
       }
       let parsed: unknown
       try {
         parsed = JSON.parse(raw)
       } catch {
         return null  // corrupt JSON = active fail-soft
       }
       const v = (parsed as { schemaVersion?: string }).schemaVersion ?? ''
       return branchOnSchemaVersion(v, {
         v1: () => (Value.Check(GovernanceV1, parsed) ? (parsed as GovernanceV1Type) : null),
         unknown: () => null,  // CD-5 rule (b) graceful degrade — threat T-3.2-01 mitigation
       })
     }

     /** Lazy check whether workflow execution should halt due to gstack veto.
      *  Called from runWorkflow BEFORE each phase transition (NOT polling timer). */
     export async function isVetoed(): Promise<boolean> {
       return (await readGovernance())?.status === 'vetoed'
     }
     ```
  2. Run biome preempt: `pnpm exec biome check --write src/workflow/governance.ts`
- **acceptance_criteria**:
  - `test -f src/workflow/governance.ts` exit 0
  - `grep -q "import.*branchOnSchemaVersion" src/workflow/governance.ts` (CD-5 single 兼容门 discipline)
  - `grep -q "Value.Check(GovernanceV1" src/workflow/governance.ts` (TypeBox runtime validate per PATTERNS § 3.4)
  - `grep -E "export (async function readGovernance|async function isVetoed)" src/workflow/governance.ts | wc -l` == 2
  - `grep -q "'.harnessed/governance.json'" src/workflow/governance.ts` (fixed path, threat T-3.2-03 mitigation)
  - `! grep -E "setInterval|setTimeout.*[Pp]oll" src/workflow/governance.ts` (D-04 anti-pattern guard — NO polling timer per PATTERNS § 3.1)
  - `wc -l src/workflow/governance.ts` ≤ 30 (D-04 spec hard limit)
  - `pnpm typecheck 2>&1 | tail -3` exit 0
  - `grep -r "branchOnSchemaVersion" src/ | wc -l` ≥ 4 (Phase 3.1 baseline 3 + governance.ts consumer +1)
- **decision_source**: D-04 PUSH locked + T1.1 + T1.3 + RESEARCH § 4.4 verbatim + § 7.1 lazy read + PATTERNS § 2.3 (70% reuse state.ts)

### T1.8 — Wave 1 tests (5 files, 23 fixtures total)

- **files_modified**: `tests/cli/probe-gstack.test.ts` (NEW ~60L 5 fixture) + `tests/workflow/interpolate.test.ts` (NEW ~50L 6 fixture) + `tests/workflow/schema/config.test.ts` (NEW ~40L 4 fixture) + `tests/workflow/schema/governance.test.ts` (NEW ~40L 4 fixture) + `tests/workflow/governance.test.ts` (NEW ~50L 4 fixture)
- **read_first**:
  - `tests/cli/doctor.test.ts` L1-100 (sister mock + cell skeleton direct analog per PATTERNS § 2.17)
  - `tests/checkpoint/state.test.ts` (sister Phase 3.1 W2 fs/promises mock pattern direct analog per PATTERNS § 2.15)
  - `tests/checkpoint/schema.test.ts` (sister Phase 3.1 W1 TypeBox Value.Check assert pattern)
  - All T1.2 + T1.3 + T1.4 + T1.6 + T1.7 NEW source files (verify export signatures)
  - `.planning/phase-3.2/RESEARCH.md` § 2.3 (interpolate 6 fixture table — offset 396 limit 12) + § 11.1 (test count target — offset 1068 limit 15)
- **action**:
  1. **`tests/cli/probe-gstack.test.ts` NEW** ~60L (5 fixture, sister doctor.test.ts skeleton):
     - Mock `node:child_process` spawnSync via `vi.mock('node:child_process')`
     - Fixture 1: cell `gstack-office-hours only → prefix='gstack-' pass` — mock spawnSync 1st call (where/which gstack-office-hours) returns `{status:0, stdout:'/usr/local/bin/gstack-office-hours\n'}`, 2nd call (office-hours) returns `{status:1, stdout:''}`; assert probeGstackPrefix returns `{status:'pass', prefix:'gstack-', detail:'gstack-office-hours found'}`
     - Fixture 2: cell `office-hours only → prefix='' pass` — mock inverse; assert prefix=''
     - Fixture 3: cell `both → fail + fix hint` — mock both return status:0; assert status='fail' + fix contains 'edit .harnessed/config.json'
     - Fixture 4: cell `neither → fail + install hint` — mock both return status:1; assert status='fail' + fix contains 'install gstack'
     - Fixture 5: cell `Win shell flavor matrix` — set `Object.defineProperty(process, 'platform', { value: 'win32' })`; assert spawnSync called with `'where'` not `'which'`
  2. **`tests/workflow/interpolate.test.ts` NEW** ~50L (6 fixture per RESEARCH § 2.3 table):
     - Fixture 1: happy single var — `interpolate('{{ prefix }}office-hours', {prefix:'gstack-'})` returns `'gstack-office-hours'`
     - Fixture 2: happy multi var — `interpolate('{{ a }}/{{ b }}', {a:'x', b:'y'})` returns `'x/y'`
     - Fixture 3: undefined var throws — `interpolate('{{ unknown }}', {prefix:'gstack-'})` throws InterpolationError + error message contains 'undefined template variable'
     - Fixture 4: empty string value — `interpolate('{{ prefix }}cmd', {prefix:''})` returns `'cmd'` (--no-prefix scenario, R7.4)
     - Fixture 5: nested unsupported throws — `interpolate('{{ a.b }}', {a:'x'})` throws InterpolationError (\w 不命中 '.')
     - Fixture 6: empty template + empty vars — `interpolate('', {})` returns `''`
  3. **`tests/workflow/schema/config.test.ts` NEW** ~40L (4 fixture):
     - Fixture 1: happy — `Value.Check(ConfigV1, {schemaVersion:'harnessed.config.v1', gstack_prefix:'gstack-'})` returns true
     - Fixture 2: empty prefix — `Value.Check(ConfigV1, {schemaVersion:'harnessed.config.v1', gstack_prefix:''})` returns true (--no-prefix valid)
     - Fixture 3: invalid prefix value — `Value.Check(ConfigV1, {schemaVersion:'harnessed.config.v1', gstack_prefix:'$(rm -rf /)'})` returns false (T-3.2-05 threat mitigation)
     - Fixture 4: extra field rejected — `Value.Check(ConfigV1, {schemaVersion:'harnessed.config.v1', gstack_prefix:'gstack-', extra:'x'})` returns false (additionalProperties: false)
  4. **`tests/workflow/schema/governance.test.ts` NEW** ~40L (4 fixture):
     - Fixture 1: happy active — `Value.Check(GovernanceV1, {schemaVersion:'harnessed.governance.v1', status:'active'})` returns true
     - Fixture 2: happy vetoed with metadata — `Value.Check(GovernanceV1, {schemaVersion:'harnessed.governance.v1', status:'vetoed', reason:'product strategy 不符', vetoed_at:'2026-05-16T12:00:00Z', vetoed_by:'CEO'})` returns true
     - Fixture 3: invalid status — `Value.Check(GovernanceV1, {schemaVersion:'harnessed.governance.v1', status:'malicious'})` returns false
     - Fixture 4: huge reason DOS attempt — `Value.Check(GovernanceV1, {schemaVersion:'harnessed.governance.v1', status:'vetoed', reason:'x'.repeat(501)})` returns false (maxLength 500 cap per § 11.4)
  5. **`tests/workflow/governance.test.ts` NEW** ~50L (4 fixture, sister state.test.ts vi.mock fs):
     - Mock `node:fs/promises` readFile via vi.mock
     - Fixture 1: missing file → null+active — readFile rejects with ENOENT; assert `await readGovernance()` returns null + `await isVetoed()` returns false
     - Fixture 2: active state — readFile returns `'{"schemaVersion":"harnessed.governance.v1","status":"active"}'`; assert isVetoed returns false
     - Fixture 3: vetoed state — readFile returns vetoed JSON; assert isVetoed returns true + readGovernance returns valid object
     - Fixture 4: corrupt JSON → null fail-soft — readFile returns `'{not valid json'`; assert readGovernance returns null + isVetoed returns false (no throw, threat T-3.2-01 graceful)
  6. Run biome preempt: `pnpm exec biome check --write tests/cli/probe-gstack.test.ts tests/workflow/`
  7. Run local verify: `corepack pnpm test -- --run tests/cli/probe-gstack.test.ts tests/workflow/ 2>&1 | tail -10`
- **acceptance_criteria**:
  - `corepack pnpm test -- --run tests/cli/probe-gstack.test.ts 2>&1 | tail -5 | grep -E "Tests.*5 passed"` (5 fixtures pass)
  - `corepack pnpm test -- --run tests/workflow/interpolate.test.ts 2>&1 | tail -5 | grep -E "Tests.*6 passed"` (6 fixtures pass)
  - `corepack pnpm test -- --run tests/workflow/schema/ 2>&1 | tail -5 | grep -E "Tests.*8 passed"` (4+4 fixtures pass)
  - `corepack pnpm test -- --run tests/workflow/governance.test.ts 2>&1 | tail -5 | grep -E "Tests.*4 passed"` (4 fixtures pass)
  - `corepack pnpm test 2>&1 | tail -10 | grep -E "Tests.*\d+ passed" | grep -v "failed"` exit 0 (full suite still green, 596+ → ~619+)
- **decision_source**: T1.2 + T1.3 + T1.4 + T1.6 + T1.7 + RESEARCH § 2.3 + § 11.1 test count target + PATTERNS § 2.14-2.17 (test mock direct analog)

---

## Wave 2 — Workflow runner + plan-feature reference + 5 skill stubs + loadPhases extend + integration

### T2.1 — src/workflow/loadPhases.ts MODIFY +5-8L + src/workflow/schema/phases.ts MODIFY +4L (extend sig vars param + interpolate step + UNCONDITIONAL PhasesSchema extension per planner-revision iter 1 W-02 fix)

- **files_modified**:
  - `src/workflow/loadPhases.ts` (MODIFY ~+5-8L: signature change + interpolate walk)
  - `src/workflow/schema/phases.ts` (MODIFY ~+4L: UNCONDITIONAL add `invokes?: string` to PhaseEntry + `on_veto?: 'halt_workflow'` to PhasesSchema top-level — per planner-revision iter 1 W-02 orchestrator decision)
- **read_first**:
  - `src/workflow/loadPhases.ts` L1-30 entire file (verify current sig + Value.Check pattern at L23-30)
  - `src/workflow/interpolate.ts` (T1.6 — verify interpolate export sig)
  - `src/workflow/schema/phases.ts` L1-51 ENTIRE file (verify L28-38 PhaseEntry + L40-46 PhasesSchema + L28+L45 `additionalProperties: false` strict-reject baseline — planner-revision verified L28-38 PhaseEntry has NO `invokes` + L40-46 PhasesSchema has NO `on_veto` → unconditional add required)
  - `.planning/phase-3.2/PATTERNS.md` § 2 row #9 (loadPhases extend pattern — offset 26 limit 5)
  - `.planning/phase-3.2/PLAN-CHECK.md` L113-132 (W-02 finding verbatim — planner-revision iter 1 source authority)
- **action**:
  1. Read current `src/workflow/loadPhases.ts`. Confirm L23 signature is `export function loadPhases(yamlPath: string): PhasesSchemaType`. Read current `src/workflow/schema/phases.ts` L28-46 to confirm baseline (no `invokes`, no `on_veto`, `additionalProperties: false` on both PhaseEntry + PhasesSchema).
  2. **Step A — UNCONDITIONAL extend `src/workflow/schema/phases.ts`** (planner-revision iter 1 W-02 LOCKED — Karpathy DRY rationale: plan-feature workflow consumes same `loadPhases` loader per CONTEXT D-03 WIRED + RESEARCH § 5 yaml DSL recommendation; extending parent schema is cleaner than parallel schema):
     - Add to `PhaseEntry` Object (insert in the field block before closing `}`, e.g., after `max_iterations` line):
       ```typescript
       invokes: Type.Optional(Type.String()), // Phase 3.2 W2 T2.1 — JINJA placeholder (e.g., '{{ gstack_prefix }}office-hours'); interpolated at loadPhases
       ```
     - Add to `PhasesSchema` top-level Object (insert before `phases:` field):
       ```typescript
       on_veto: Type.Optional(Type.String({ pattern: '^halt_workflow$' })), // Phase 3.2 W2 T2.1 — workflow-level veto policy per RESEARCH § 5.2 DRY (NOT per-phase)
       ```
     - **Karpathy hard limit check**: `wc -l src/workflow/schema/phases.ts` — current ~51L + 2L = ~53-54L ≤ 80L (sister Phase 3.1 W1 schemas ≤ 80L pattern; well within 200L hard limit)
     - **Why unconditional (W-02 audit lesson)**: with `additionalProperties: false` on both PhaseEntry + PhasesSchema, `loadPhases('workflows/plan-feature/workflow.yaml', vars)` Value.Check fails on unknown `invokes` + `on_veto` fields → PhasesValidationError throw → T2.6 integration fixture 1 happy path fails. Conditional language ("If schema does NOT have, ADD") removed per planner-revision iter 1.
  3. **Step B — Sig change** `src/workflow/loadPhases.ts` (planner decision per RESEARCH § 5 + orchestrator pre-planning decision #4 explicit dependency injection):
     ```typescript
     // OLD: export function loadPhases(yamlPath: string): PhasesSchemaType
     // NEW: export function loadPhases(yamlPath: string, vars?: Record<string, string>): PhasesSchemaType
     ```
  4. **Step C** — After existing Value.Check pass (after L29-30 area), ADD interpolate walk step:
     ```typescript
     import { interpolate } from './interpolate.js'  // ← add to imports
     // ... existing parse + Value.Check ...
     // Phase 3.2 W2 T2.1 — JINJA interpolate invokes field (D-02 LOCKED).
     // Backward-compat: vars omitted → no interpolate (existing callers unchanged).
     if (vars) {
       for (const ph of parsed.phases) {
         if (ph.invokes) ph.invokes = interpolate(ph.invokes, vars)
       }
     }
     return parsed
     ```
  5. **Forward-look note**: sister `workflows/execute-task/phases.yaml` (current 4-phase reference) does not currently use `invokes` or `on_veto` — this PhasesSchema extension is forward-looking for plan-feature/workflow.yaml (T2.4), but stays backward-compatible since both fields are `Type.Optional`. Execute-task callers see no behavior change.
  6. Run biome preempt: `pnpm exec biome check --write src/workflow/loadPhases.ts src/workflow/schema/phases.ts`
  7. Run existing tests: `corepack pnpm test -- --run tests/workflow/ 2>&1 | tail -5` (no break to existing loadPhases tests; sister `workflows/execute-task` validation still passes since added fields are Optional)
  8. **Update Resolved (T2.1) block** at task_plan.md top with `wc -l src/workflow/schema/phases.ts` actual outcome
- **acceptance_criteria**:
  - `grep -E "export function loadPhases.*vars\?\: Record" src/workflow/loadPhases.ts | wc -l` == 1 (sig change applied)
  - `grep -q "import.*interpolate" src/workflow/loadPhases.ts`
  - `grep -E "phase\.invokes|ph\.invokes" src/workflow/loadPhases.ts | wc -l` ≥ 1 (interpolate walk added)
  - `wc -l src/workflow/loadPhases.ts` ≤ 40 (现 30L + 5-8L delta)
  - **W-02 unconditional extend守门 (planner-revision iter 1)**: `grep -q "invokes" src/workflow/schema/phases.ts` exit 0 (PhaseEntry extension applied unconditionally)
  - **W-02 unconditional extend守门**: `grep -q "on_veto" src/workflow/schema/phases.ts` exit 0 (PhasesSchema top-level extension applied unconditionally)
  - **W-02 Karpathy hard limit**: `wc -l src/workflow/schema/phases.ts` ≤ 80 (~51 + 2L extension = ~54L; sister Phase 3.1 W1 schemas pattern)
  - **W-02 happy-path validation**: `Value.Check(PhasesSchema, parsedYaml)` returns true for plan-feature/workflow.yaml (T2.6 fixture 1 should pass; verified via integration test in T2.6)
  - `pnpm typecheck 2>&1 | tail -3` exit 0
  - `corepack pnpm test -- --run tests/workflow/ 2>&1 | tail -5 | grep -v "failed"` exit 0 (existing tests pass; backward-compat vars omitted + Optional fields preserve sister workflows behavior)
- **decision_source**: D-02 JINJA locked + RESEARCH § 5 + orchestrator pre-planning decision #4 explicit dependency injection over lazy-read (Karpathy testability) + **planner-revision iter 1 W-02 LOCKED** (unconditional PhasesSchema extension per orchestrator tier-call decision, source: `.planning/phase-3.2/PLAN-CHECK.md` L113-132)

### T2.2 — src/workflow/schema/planFeature.ts NEW (~30L plan-feature DSL schema)

- **files_modified**: `src/workflow/schema/planFeature.ts` (NEW ~30L TypeBox DSL schema)
- **read_first**:
  - `src/workflow/schema/phases.ts` (sister execute-task workflow DSL schema as direct analog)
  - `workflows/execute-task/phases.yaml` L1-28 (sister DSL reference for field set)
  - `.planning/phase-3.2/RESEARCH.md` § 5.1 + § 5.3 (yaml DSL sample + Path A single-responsibility — offset 568 limit 90)
- **action**:
  1. Create NEW file `src/workflow/schema/planFeature.ts`:
     ```typescript
     // src/workflow/schema/planFeature.ts — Phase 3.2 W2 T2.2 (D-03 WIRED LOCKED).
     // Sister src/workflow/schema/phases.ts — separate DSL schema per RESEARCH § 5.3
     // Path A single-responsibility (NOT union with phases.ts; future workflow types
     // 易加). Defines plan-feature 5-phase reference DSL with:
     //   - workflow-level `on_veto` (NOT per-phase per RESEARCH § 5.2 DRY)
     //   - phase-level optional `invokes` (JINJA placeholder accepted, interpolated at loadPhases)
     import { type Static, Type } from '@sinclair/typebox'

     export const PlanFeaturePhase = Type.Object(
       {
         id: Type.String({ minLength: 1 }),
         name: Type.String({ minLength: 1 }),
         upstream: Type.String({ minLength: 1 }),
         model: Type.Union([Type.Literal('opus'), Type.Literal('sonnet'), Type.Literal('haiku')]),
         invokes: Type.Optional(Type.String()),  // JINJA placeholder (e.g. '{{ gstack_prefix }}office-hours')
         skills: Type.Array(Type.String()),
         max_iterations: Type.Integer({ minimum: 1 }),
       },
       { additionalProperties: false },
     )

     export const PlanFeatureWorkflowV1 = Type.Object(
       {
         workflow: Type.Literal('plan-feature'),
         on_veto: Type.Optional(Type.Literal('halt_workflow')),
         phases: Type.Array(PlanFeaturePhase, { minItems: 1 }),
       },
       { additionalProperties: false },
     )
     export type PlanFeatureWorkflowV1Type = Static<typeof PlanFeatureWorkflowV1>
     ```
  2. Run biome preempt: `pnpm exec biome check --write src/workflow/schema/planFeature.ts`
- **acceptance_criteria**:
  - `test -f src/workflow/schema/planFeature.ts` exit 0
  - `grep -q "workflow: Type.Literal('plan-feature')" src/workflow/schema/planFeature.ts`
  - `grep -q "on_veto:.*halt_workflow" src/workflow/schema/planFeature.ts` (workflow-level on_veto per RESEARCH § 5.2)
  - `grep -q "invokes: Type.Optional" src/workflow/schema/planFeature.ts` (optional invokes field accepts JINJA placeholder)
  - `grep -q "additionalProperties: false" src/workflow/schema/planFeature.ts` (strict)
  - `wc -l src/workflow/schema/planFeature.ts` ≤ 40
  - `pnpm typecheck 2>&1 | tail -3` exit 0
- **decision_source**: D-03 WIRED locked + RESEARCH § 5.3 Path A + sister phases.ts pattern

### T2.3 — src/workflow/run.ts NEW (~78L workflow runner D-03 WIRED + D-04 PUSH gate) — REVISED iter 1 per B-01 + W-01

- **files_modified**: `src/workflow/run.ts` (NEW ~78L workflow runner)
- **read_first**:
  - `src/checkpoint/engineHook.ts` L1-48 ENTIRE file (verify `activatePhase(phaseId) → {checkpointPath}` + `completePhase(EngineCheckpointHookCtx)` + `EngineCheckpointHookCtx.status` is `'active' | 'complete'` only — planner-revision verified Phase 3.1 hook surface DOES NOT export paused status; 'paused' goes through `sigintTrap.ts` per L17 comment — therefore B-01 fix path uses `activatePhase + statePause` chain, NOT `engineCheckpointHook({status:'paused'})`)
  - `src/checkpoint/state.ts` L1-77 ENTIRE file (verify `pause()` early-return-null on missing state L66-67 — drives B-01 ordering requirement: activate writes state FIRST, statePause then reads-and-transitions paused; corrupts on prior `complete` state per Phase 3.1 D-02 contract "pause is transition from active not from complete")
  - `src/workflow/loadPhases.ts` post-T2.1 (verify new sig accepts vars param)
  - `src/workflow/governance.ts` (T1.7 — verify isVetoed export)
  - `src/workflow/interpolate.ts` (T1.6 — verify interpolate export)
  - `.planning/phase-3.2/RESEARCH.md` § 7.1 (runWorkflow sample verbatim — offset 727 limit 25)
  - `.planning/phase-3.2/PATTERNS.md` § 2.6 (run.ts excerpt verbatim — offset 218 limit 40)
  - `.planning/phase-3.2/PLAN-CHECK.md` L66-111 (B-01 + W-01 finding verbatim — planner-revision iter 1 source authority)
- **action**:
  1. Create NEW file `src/workflow/run.ts` ~78L per RESEARCH § 7.1 + PATTERNS § 2.6 with **B-01 reorder + W-01 sessionId drop applied**:
     ```typescript
     // src/workflow/run.ts — Phase 3.2 W2 T2.3 (D-03 WIRED LOCKED + D-04 PUSH consume).
     // Sister Phase 3.1 W3 engineHook.ts wedge pattern (workflow runner 二代消费者 of
     // checkpoint engine). WIRED 中庸: 5-phase 桩跑 governance + checkpoint 真 wire,
     // 不接外部 spawn (Phase 3.3+ dogfood 时换真 gsd-discuss/plan/execute spawn).
     //
     // PLANNER-REVISION ITER 1:
     //  - B-01 fix: activate-BEFORE-veto-check inside for-loop ensures every paused-veto
     //    path writes valid paused current-workflow.json that Phase 3.1 resume.ts can
     //    consume (sister Phase 3.1 D-02 contract: pause transitions from active).
     //  - W-01 fix: sessionId dead variable removed (dispatchSkillStub returns no
     //    sessionId per D-03 WIRED stub; sister Phase 3.1 W-04 dead-var lesson
     //    [BLOCKER]); sessionId propagation deferred to Phase 3.3+ dogfood true spawn.
     import { loadPhases } from './loadPhases.js'
     import { isVetoed } from './governance.js'
     import { activatePhase, completePhase } from '../checkpoint/engineHook.js'
     import { pause as statePause } from '../checkpoint/state.js'

     export interface WorkflowRunResult {
       status: 'complete' | 'paused-veto' | 'failed'
       phasesRun: number
       lastPhaseId?: string
     }

     /** 5-phase stub spawner — D-03 WIRED LOCKED. Phase 3.3+ dogfood 时换真 spawn
      *  (gsd-discuss / gsd-plan / gstack-office-hours via dispatchSpawn). */
     async function dispatchSkillStub(skillName: string): Promise<{ status: 'ok' | 'fail'; output: string; decision?: string }> {
       // RESEARCH § 6.2 minimal 3-field mock (Karpathy YAGNI; elapsed_ms dropped)
       return {
         status: 'ok',
         output: `<stub for ${skillName}>`,
         decision: 'mock-approved',
       }
     }

     /** Run a workflow YAML to completion OR governance veto OR skill failure.
      *  - activatePhase writes 'active' current-workflow.json BEFORE veto-check (B-01 fix).
      *  - lazy isVetoed() PUSH gate AFTER activate (1 read per phase boundary, NOT polling).
      *  - If vetoed: statePause() transitions active→paused (Phase 3.1 D-02 contract).
      *  - completePhase via Phase 3.1 engineHook (二代消费者).
      *  - WIRED mode: NO sessionId propagation (stub returns none); Phase 3.3+ dogfood true
      *    spawn 时 sessionId 字段加 (W-01 deferred per planner-revision iter 1). */
     export async function runWorkflow(
       yamlPath: string,
       vars: Record<string, string>,
     ): Promise<WorkflowRunResult> {
       const parsed = loadPhases(yamlPath, vars)  // interpolates {{ var }} per T2.1
       for (let i = 0; i < parsed.phases.length; i++) {
         const ph = parsed.phases[i]
         if (!ph) continue
         // B-01 fix: activatePhase BEFORE isVetoed — guarantees current-workflow.json
         // 'active' state exists for statePause() to transition; covers veto-at-i=0
         // scenario (T2.6 fixture 3) where no prior phase exists to seed state.
         await activatePhase(ph.id)
         // D-04 PUSH lazy-read governance gate (1 read per phase boundary, NOT polling).
         // Phase 3.1 resume.ts can now consume the paused state written by statePause().
         if (await isVetoed()) {
           await statePause()
           return { status: 'paused-veto', phasesRun: i, lastPhaseId: ph.id }
         }
         const skillName = ph.skills?.[0] ?? ph.id
         const r = await dispatchSkillStub(skillName)
         if (r.status !== 'ok') {
           return { status: 'failed', phasesRun: i, lastPhaseId: ph.id }
         }
         // W-01 fix: NO sessionId spread (dead var removed); WIRED stub returns no
         // sessionId per D-03; Phase 3.3+ dogfood true spawn 时 add session_id field.
         await completePhase({
           phaseId: ph.id,
           status: 'complete',
           lastTask: `phase ${ph.id} complete: ${r.output}`,
         })
       }
       return { status: 'complete', phasesRun: parsed.phases.length }
     }
     ```
  2. Run biome preempt: `pnpm exec biome check --write src/workflow/run.ts`
  3. **Karpathy hard limit check**: `wc -l src/workflow/run.ts` — target ~78L ≤ 80L (B-01 reorder + W-01 dead-var drop net 0 LOC delta vs pre-revision draft); if > 80L, extract dispatchSkillStub to `src/workflow/dispatchSkill.ts` helper (anti-pattern guard per RESEARCH § 13.1 #1)
  4. **Update Resolved (T2.3) block** at task_plan.md top with `wc -l` outcome + B-01 ordering proof outcome
- **acceptance_criteria**:
  - `test -f src/workflow/run.ts` exit 0
  - `grep -q "isVetoed()" src/workflow/run.ts` (D-04 PUSH gate)
  - `grep -q "statePause()" src/workflow/run.ts` (Phase 3.1 D-02 reuse — paused state writer)
  - `grep -q "activatePhase" src/workflow/run.ts` && `grep -q "completePhase" src/workflow/run.ts` (Phase 3.1 engineHook 二代消费)
  - `grep -q "dispatchSkillStub" src/workflow/run.ts` (D-03 WIRED stub locked)
  - **B-01 ordering守门 (planner-revision iter 1)** — verify activatePhase appears BEFORE isVetoed inside the per-phase iteration body. Run heuristic: extract for-loop block and confirm `activatePhase` line precedes `isVetoed` line:
    ```bash
    # Capture the for-loop body region; activatePhase line# MUST be < isVetoed line#
    awk '/for \(let i/,/^   *}$/' src/workflow/run.ts | grep -nE "activatePhase|isVetoed" | head -2
    # Expected output line ordering:
    #   N: ... activatePhase(ph.id)
    #   M: ... if (await isVetoed())   where M > N
    ```
    Stricter awk alternative: `awk '/await activatePhase\(ph\.id\)/{a=NR} /if \(await isVetoed\(\)\)/{v=NR} END{exit !(a>0 && v>0 && a<v)}' src/workflow/run.ts` exit 0
  - **W-01 dead var守门 (planner-revision iter 1)**: `! grep -E "let sessionId" src/workflow/run.ts` (sessionId declaration MUST NOT exist; sister Phase 3.1 W-04 dead-var BLOCKER lesson — eliminate at source)
  - **W-01 dead var守门**: `! grep -E "sessionId \? \{ sessionId \}|\.\.\.sessionId" src/workflow/run.ts` (no conditional spread; completePhase call has no sessionId field per D-03 WIRED stub mode)
  - `! grep -E "setInterval|setTimeout.*[Pp]oll" src/workflow/run.ts` (D-04 anti-pattern guard)
  - `! grep -E "spawn\(|spawnSync\(|execaCommand|exec\(" src/workflow/run.ts` (D-03 WIRED guard — no real spawn in this phase)
  - `wc -l src/workflow/run.ts` ≤ 80 (D-03 spec hard limit; revised draft ~78L)
  - `pnpm typecheck 2>&1 | tail -3` exit 0
- **decision_source**: D-03 WIRED locked + D-04 PUSH locked + RESEARCH § 7.1 verbatim + PATTERNS § 2.6 (60% reuse engineHook pattern) + **planner-revision iter 1 B-01 + W-01 LOCKED** (activate-before-veto reorder + sessionId dead-var drop per orchestrator tier-call decisions, source: `.planning/phase-3.2/PLAN-CHECK.md` L66-111)

### T2.4 — workflows/plan-feature/workflow.yaml NEW (~40L 5-phase DSL + JINJA + on_veto)

- **files_modified**: `workflows/plan-feature/workflow.yaml` (NEW ~40L DSL config)
- **read_first**:
  - `workflows/execute-task/phases.yaml` L1-28 (sister 4-phase DSL direct reference)
  - `src/workflow/schema/planFeature.ts` (T2.2 — verify schema field set)
  - `.planning/phase-3.2/RESEARCH.md` § 5.1 (yaml sample verbatim — offset 568 limit 50)
  - `.planning/REQUIREMENTS.md` L257-261 (R7.1 5-phase scope: gstack-decision → brainstorm → gsd-discuss → gsd-plan → persist)
- **action**:
  1. Verify directory exists: `mkdir -p workflows/plan-feature`
  2. Create NEW file `workflows/plan-feature/workflow.yaml` per RESEARCH § 5.1 verbatim:
     ```yaml
     # workflows/plan-feature/workflow.yaml — Phase 3.2 W2 T2.4 (D-03 WIRED LOCKED)
     # 5-phase reference implementation; Phase 3.3+ dogfood 时换真 gsd-discuss/plan/execute spawn.
     # R7.1 acceptance: 30 plan-feature 场景跑通 + CEO veto halt_workflow
     # R7.4 acceptance: 用户三种前缀场景任一都跑通 (JINJA `{{ gstack_prefix }}` 插值)
     workflow: plan-feature
     on_veto: halt_workflow  # workflow-level (NOT per-phase per RESEARCH § 5.2 DRY) — D-04 PUSH 任 1 phase 转换前 read = vetoed → 全 halt
     phases:
       - id: 01-gstack-decision
         name: gstack-decision (governance gate — CEO/EM/Designer/Paranoid/QA/CSO)
         upstream: gstack
         model: opus              # 高层决策 = opus
         invokes: '{{ gstack_prefix }}office-hours'  # ← D-02 JINJA 插值 (gstack-office-hours OR office-hours)
         skills: ['plan-feature-decision']
         max_iterations: 1
       - id: 02-brainstorm
         name: brainstorm (execution + ui-ux-pro-max UI 任务)
         upstream: superpowers
         model: sonnet            # 设计澄清 = sonnet
         skills: ['plan-feature-brainstorm']
         max_iterations: 5
       - id: 03-gsd-discuss
         name: gsd-discuss (orchestration — phase discussion)
         upstream: gsd
         model: sonnet
         invokes: 'gsd-discuss-phase'  # GSD 命令固定无 prefix
         skills: ['plan-feature-discuss']
         max_iterations: 3
       - id: 04-gsd-plan
         name: gsd-plan (orchestration — phase planning)
         upstream: gsd
         model: sonnet
         invokes: 'gsd-plan-phase'
         skills: ['plan-feature-plan']
         max_iterations: 3
       - id: 05-persist
         name: persist (planning-with-files MD persistence)
         upstream: planning-with-files
         model: haiku             # 文档写入 = haiku 省 token (sister Phase 2.2 CD-2 04-deliver=haiku)
         skills: ['plan-feature-persist']
         max_iterations: 5
     ```
  3. **DO NOT** add per-phase `on_veto` (workflow-level only per RESEARCH § 5.2 DRY)
  4. **DO NOT** hardcode prefix in any invokes (R7.4 acceptance "用户三种前缀场景任一都跑通" requires JINJA placeholder)
- **acceptance_criteria**:
  - `test -f workflows/plan-feature/workflow.yaml` exit 0
  - `grep -q "^workflow: plan-feature" workflows/plan-feature/workflow.yaml`
  - `grep -q "^on_veto: halt_workflow" workflows/plan-feature/workflow.yaml` (workflow-level, NOT phase-level)
  - `grep -q "{{ gstack_prefix }}office-hours" workflows/plan-feature/workflow.yaml` (JINJA placeholder, R7.4)
  - `grep -cE "^  - id: 0[1-5]-" workflows/plan-feature/workflow.yaml` == 5 (5 phases per R7.1)
  - `grep -E "model: (opus|sonnet|haiku)" workflows/plan-feature/workflow.yaml | wc -l` == 5 (per-phase model tier)
  - `grep -cE "skills: \['plan-feature-" workflows/plan-feature/workflow.yaml` == 5 (each phase references its skill stub)
  - **anti-stale verify**: `! grep -E "invokes: 'gstack-office-hours'|invokes: \"gstack-office-hours\"" workflows/plan-feature/workflow.yaml` (no hardcoded prefix per R7.4 anti-pattern guard)
  - `wc -l workflows/plan-feature/workflow.yaml` ≤ 50
- **decision_source**: D-03 WIRED + D-02 JINJA + R7.1 + R7.4 + RESEARCH § 5.1 verbatim + PATTERNS § 2 row #6 (~80% reuse execute-task/phases.yaml)

### T2.5 — skills/plan-feature-{decision,brainstorm,discuss,plan,persist}/SKILL.md NEW × 5

- **files_modified**: 5 NEW SKILL.md files (~15L each = ~75L total)
- **read_first**:
  - `skills/karpathy-baseline/SKILL.md` (sister stub frontmatter + body pattern direct analog)
  - `.planning/phase-3.2/RESEARCH.md` § 6.1 (5 stub format verbatim — offset 651 limit 35)
  - T2.4 workflows/plan-feature/workflow.yaml (verify 5 skill name strings match: plan-feature-decision/brainstorm/discuss/plan/persist)
- **action**:
  1. Create 5 directories: `mkdir -p skills/plan-feature-{decision,brainstorm,discuss,plan,persist}`
  2. For each of 5 skill stubs, create `SKILL.md` per RESEARCH § 6.1 template:
     ```markdown
     ---
     name: plan-feature-<PHASE>
     description: Plan-feature workflow phase <NN> stub — <ROLE> (mock, Phase 3.3+ dogfood 时换真 <UPSTREAM> spawn)
     allowed-tools: ['Read', 'Edit', 'Bash']
     ---

     # Plan-feature: <PHASE-NAME> — STUB

     Phase 3.2 D-03 WIRED reference implementation. Returns mock decision output for workflow runtime verification.

     ## Stub behavior

     This skill stub returns a mock result to simulate phase success transition:

     ```json
     {
       "status": "ok",
       "output": "<stub for plan-feature-<PHASE>>",
       "decision": "mock-approved"
     }
     ```

     Phase 3.3+ dogfood: replace stub with actual `<INVOKE>` spawn + decision capture.
     ```
  3. **Per-stub PHASE / ROLE / UPSTREAM / INVOKE mapping** (RESEARCH § 6.1 table):
     - `decision`: ROLE=governance gate; UPSTREAM=gstack; INVOKE=`{{ gstack_prefix }}office-hours`
     - `brainstorm`: ROLE=execution + ui-ux-pro-max UI; UPSTREAM=superpowers; INVOKE=N/A (no real spawn equivalent)
     - `discuss`: ROLE=orchestration phase discussion; UPSTREAM=gsd; INVOKE=`gsd-discuss-phase`
     - `plan`: ROLE=orchestration phase planning; UPSTREAM=gsd; INVOKE=`gsd-plan-phase`
     - `persist`: ROLE=planning-with-files MD persistence; UPSTREAM=planning-with-files; INVOKE=N/A
- **acceptance_criteria**:
  - `ls skills/plan-feature-*/SKILL.md | wc -l` == 5
  - `for d in decision brainstorm discuss plan persist; do test -f "skills/plan-feature-$d/SKILL.md" && grep -q "name: plan-feature-$d" "skills/plan-feature-$d/SKILL.md"; done` exit 0 (all 5 frontmatter present)
  - `grep -l "STUB" skills/plan-feature-*/SKILL.md | wc -l` == 5 (all marked stub)
  - `grep -l "mock-approved" skills/plan-feature-*/SKILL.md | wc -l` == 5 (all reference mock decision)
  - All 5 files `wc -l ≤ 25` (template + customization fits ~15-20L)
- **decision_source**: D-03 WIRED + R7.1 + RESEARCH § 6.1 verbatim + sister karpathy-baseline/SKILL.md pattern

### T2.6 — Wave 2 tests (4 files, 11 fixtures total) — REVISED iter 1 per B-01 (added fixture 3 veto-at-i=0)

- **files_modified**: `tests/workflow/run.test.ts` (NEW ~60L 3 fixture) + `tests/workflow/loadPhases-interpolate.test.ts` (NEW ~40L 3 fixture) + `tests/workflow/schema/planFeature.test.ts` (NEW ~30L 2 fixture) + `tests/integration/plan-feature-wired.test.ts` (NEW ~110L 3 fixture — **B-01 fixture 3 added per planner-revision iter 1**)
- **read_first**:
  - All T2.1-T2.5 NEW source files (verify exports)
  - `src/checkpoint/engineHook.ts` + `src/checkpoint/state.ts` (mock targets)
  - `src/checkpoint/resume.ts` (Phase 3.1 W3 — verify `runResume()` export for B-01 fixture 3 integration assertion)
  - `tests/checkpoint/state.test.ts` + `tests/checkpoint/engineHook.test.ts` (Phase 3.1 W2 sister mock + assert patterns)
  - `tests/integration/phase-3.1-e2e.test.ts` (Phase 3.1 W5 e2e sister skeleton)
  - `.planning/phase-3.2/RESEARCH.md` § 11.1 (test count target — offset 1068 limit 15) + § 11.2 (sampling rate)
  - `.planning/phase-3.2/PLAN-CHECK.md` L66-96 (B-01 finding verbatim — planner-revision iter 1 source authority for fixture 3)
- **action**:
  1. **`tests/workflow/run.test.ts` NEW** ~60L (3 fixture):
     - Setup: vi.mock `../../src/workflow/governance.js` (isVetoed) + vi.mock `../../src/checkpoint/engineHook.js` (activatePhase + completePhase) + vi.mock `../../src/checkpoint/state.js` (pause)
     - Fixture 1: `5 phase happy path → status='complete', phasesRun=5` — isVetoed always returns false; activatePhase + completePhase called 5 times each; runWorkflow returns `{status:'complete', phasesRun:5}`
     - Fixture 2: `veto at phase 2 → status='paused-veto', phasesRun=1` — isVetoed returns false on 1st call, true on 2nd call; activatePhase called 2 times (phases 1 + 2 — per B-01 reorder activate runs BEFORE veto check); statePause called once; completePhase called 1 time (phase 1 only); runWorkflow returns `{status:'paused-veto', phasesRun:1, lastPhaseId:'02-brainstorm'}`
     - Fixture 3: `dispatchSkillStub returns ok mock` — verify dispatchSkillStub output format `{status:'ok', output:<contains "stub for ...">, decision:'mock-approved'}` for each phase
  2. **`tests/workflow/loadPhases-interpolate.test.ts` NEW** ~40L (3 fixture):
     - Setup: vi.mock `node:fs/promises` readFile to return yaml fixture string
     - Fixture 1: `yaml + vars → invokes interpolated` — feed yaml string with `invokes: '{{ gstack_prefix }}office-hours'` + `{gstack_prefix:'gstack-'}`; assert returned phases[0].invokes === 'gstack-office-hours'
     - Fixture 2: `undefined var throws` — feed yaml with `{{ unknown }}` + `{gstack_prefix:'gstack-'}`; assert loadPhases throws InterpolationError
     - Fixture 3: `vars omitted → no interpolate (backward-compat)` — feed yaml with `{{ ... }}` placeholders + no vars arg; assert loadPhases returns parsed phases with literal `{{ ... }}` strings preserved (no throw)
  3. **`tests/workflow/schema/planFeature.test.ts` NEW** ~30L (2 fixture):
     - Fixture 1: `valid DSL parse` — `Value.Check(PlanFeatureWorkflowV1, {workflow:'plan-feature', on_veto:'halt_workflow', phases:[{id:'01-x', name:'X', upstream:'gstack', model:'opus', skills:['x'], max_iterations:1}]})` returns true
     - Fixture 2: `invalid extra field rejected` — `Value.Check(PlanFeatureWorkflowV1, {workflow:'plan-feature', extra:'x', phases:[...]})` returns false
  4. **`tests/integration/plan-feature-wired.test.ts` NEW** ~110L (3 fixture, e2e wire-test):
     - Setup: use real `workflows/plan-feature/workflow.yaml`; for each fixture, manually seed/cleanup `.harnessed/governance.json` + remove `.harnessed/current-workflow.json` + remove `.harnessed/checkpoints/` directory (avoid prior-fixture state bleed); mock governance.json fs read (default missing → null + active)
     - **Fixture 1: `5 phase happy → 5 checkpoint entries + state.complete`** — no governance.json (missing → fail-soft active); provide vars `{gstack_prefix:'gstack-'}`; run runWorkflow; assert (a) returns `{status:'complete', phasesRun:5}` (b) checkpoint engineHook activatePhase called with each of 5 phase IDs (c) completePhase called 5 times in sequence; (d) `Value.Check(PhasesSchema, parsedYaml)` returns true (W-02 happy-path validate守门 — PhasesSchema extension accepts `invokes` + `on_veto`)
     - **Fixture 2: `veto at phase 2 → state.pause + halt + remaining phases 不执行`** — pre-cleanup state then run; mock governance.json to return `{schemaVersion:'harnessed.governance.v1', status:'vetoed', reason:'test', vetoed_at:'2026-05-17T00:00:00Z'}` after phase 1 completes (use vi.fn returnValueOnce per call sequence); assert (a) runWorkflow returns `{status:'paused-veto', phasesRun:1}` (b) statePause called exactly once (c) completePhase NOT called for phases 3/4/5 (d) activatePhase called for phases 1 + 2 only (per B-01 reorder: phase 2 activates BEFORE veto-check)
     - **Fixture 3 (PLANNER-REVISION ITER 1 — B-01 守门, veto-at-i=0 scenario)**:
       - **Setup**: pre-write `.harnessed/governance.json` = `{schemaVersion:'harnessed.governance.v1', status:'vetoed', reason:'product strategy block', vetoed_at:'2026-05-17T00:00:00Z', vetoed_by:'CEO'}`; remove `.harnessed/current-workflow.json` + remove `.harnessed/checkpoints/` (clean slate proves activate-then-pause writes paused state from scratch).
       - **Action**: `await runWorkflow('workflows/plan-feature/workflow.yaml', {gstack_prefix:'gstack-'})`
       - **Assert (a)** — return value: `{status:'paused-veto', phasesRun:0, lastPhaseId:'01-gstack-decision'}` (phase 0 = first phase since loop counter i=0 at first iter; phasesRun=0 means no phase completed; veto hit BEFORE skill dispatch but AFTER activatePhase write per B-01 reorder)
       - **Assert (b)** — current-workflow.json paused state written: `await readCurrentWorkflow()` returns `{schemaVersion:'harnessed.current-workflow.v1', phase:'01-gstack-decision', status:'paused', last_checkpoint_path:'.harnessed/checkpoints/01-gstack-decision.json', started_at:<ISO>, paused_at:<ISO>}` (B-01 proof: activatePhase wrote active state THEN statePause transitioned to paused — readable by Phase 3.1 resume infra; reading-and-no-op early-return-null defect from pre-revision plan WOULD have left state missing → resume cannot find paused state → R7.1 acceptance fail)
       - **Assert (c)** — checkpoint path exists: `test -f .harnessed/checkpoints/01-gstack-decision.json` exit 0 OR projected checkpointPath returned from activatePhase available (sister Phase 3.1 engineHook.ts L23 returns `{checkpointPath}`); note: per current run.ts logic, completePhase is NOT called on veto path so the checkpoint.json file is NOT written by run.ts (consistent with paused-veto semantic); fixture asserts only the projected path string matches sister engineHook contract
       - **Assert (d)** — Phase 3.1 resume.ts integration: `import { runResume } from '../../src/checkpoint/resume.js'` (or sister Phase 3.1 resume export); `const resumeCtx = await runResume()`; assert resumeCtx is truthy + `resumeCtx.phase === '01-gstack-decision'` + `resumeCtx.status === 'paused'` (R7.1 acceptance proof: "veto halt + checkpoint paused 保留" satisfied — Phase 3.1 resume infra successfully consumes the paused state written by B-01 fix path)
       - **Assert (e)** — skill dispatch NOT called: `dispatchSkillStub` (or mock spy on activatePhase) called exactly 1 time (phase 0 only); completePhase called 0 times (veto hit before dispatch + complete)
       - **Cleanup**: `afterEach` removes `.harnessed/governance.json` + `.harnessed/current-workflow.json` + `.harnessed/checkpoints/` to avoid state bleed
       - **Why fixture 3 added (planner-revision iter 1)**: Fixture 2 only covers veto at i≥1 (Scenario B) which hides the B-01 defect; Fixture 3 covers Scenario A (veto at i=0, no prior activate) which exercises the activate-before-veto reorder. Without fixture 3, regression to pre-revision ordering would pass tests silently.
  5. Run biome preempt: `pnpm exec biome check --write tests/workflow/ tests/integration/`
  6. Run local verify: `corepack pnpm test -- --run tests/workflow/ tests/integration/plan-feature-wired.test.ts 2>&1 | tail -10`
  7. **Update Resolved (T2.6) block** at task_plan.md top with fixture 3 pass outcome + resume integration proof
- **acceptance_criteria**:
  - `corepack pnpm test -- --run tests/workflow/run.test.ts 2>&1 | tail -5 | grep -E "Tests.*3 passed"` (3 fixtures pass)
  - `corepack pnpm test -- --run tests/workflow/loadPhases-interpolate.test.ts 2>&1 | tail -5 | grep -E "Tests.*3 passed"`
  - `corepack pnpm test -- --run tests/workflow/schema/planFeature.test.ts 2>&1 | tail -5 | grep -E "Tests.*2 passed"`
  - `corepack pnpm test -- --run tests/integration/plan-feature-wired.test.ts 2>&1 | tail -5 | grep -E "Tests.*3 passed"` (3 fixtures pass — **B-01 fixture 3 veto-at-i=0 added per planner-revision iter 1**)
  - **B-01 守门 (planner-revision iter 1)**: `grep -E "veto.*i=0|veto-at-i=0|Fixture 3.*B-01" tests/integration/plan-feature-wired.test.ts | wc -l` ≥ 1 (fixture 3 marker present in test file as code comment OR describe-block name)
  - **B-01 resume proof守门**: `grep -E "runResume|resumeCtx" tests/integration/plan-feature-wired.test.ts | wc -l` ≥ 1 (fixture 3 asserts Phase 3.1 resume.ts can consume the paused state)
  - **W-02 happy-path validate守门 (planner-revision iter 1)**: `grep -E "Value\.Check.*PhasesSchema|PhasesSchema.*parsedYaml" tests/integration/plan-feature-wired.test.ts | wc -l` ≥ 1 (fixture 1 asserts PhasesSchema extension accepts plan-feature/workflow.yaml unconditionally)
  - `corepack pnpm test 2>&1 | tail -10 | grep -E "Tests.*\d+ passed" | grep -v "failed"` exit 0 (full suite green, ~619 → ~630 — net +11 fixture: T2.6 = 3+3+2+3 = 11 fixture vs pre-revision 10)
- **decision_source**: D-03 WIRED + D-04 PUSH + R7.1 + R7.4 + RESEARCH § 11.1 test count + PATTERNS § 2.16 (Phase 3.1 W4 e2e analog) + **planner-revision iter 1 B-01 LOCKED** (fixture 3 veto-at-i=0 added per orchestrator tier-call decision, source: `.planning/phase-3.2/PLAN-CHECK.md` L66-96; W-02 happy-path validate assertion added in fixture 1)

---

## Wave 3 — E2E prefix matrix dogfood + ADR 0015 + STATE/RETRO/ROADMAP + A7 + ship tags

### T3.1 — tests/integration/plan-feature-prefix-e2e.test.ts NEW (~80L 3 prefix matrix fixture)

- **files_modified**: `tests/integration/plan-feature-prefix-e2e.test.ts` (NEW ~80L 3 fixture)
- **read_first**:
  - `src/cli/lib/probe-gstack.ts` (T1.4 — verify probeGstackPrefix export)
  - `src/workflow/interpolate.ts` (T1.6 — verify interpolate export)
  - `src/workflow/run.ts` (T2.3 — verify runWorkflow signature)
  - `tests/integration/plan-feature-wired.test.ts` (T2.6 — sister e2e skeleton)
  - `workflows/plan-feature/workflow.yaml` (T2.4 — verify JINJA placeholder location)
  - `.planning/REQUIREMENTS.md` L275-279 (R7.4 acceptance "用户三种前缀场景任一都跑通")
- **action**:
  1. Create NEW file `tests/integration/plan-feature-prefix-e2e.test.ts` with 3 fixture covering R7.4 acceptance prefix matrix:
     - Setup: vi.mock `node:child_process` spawnSync + vi.mock `node:fs/promises` readFile (for governance.json fs/promises path)
     - **Fixture 1: `gstack- mode end-to-end (R7.4 case 1)`** —
       - mock spawnSync `where/which gstack-office-hours` → status:0, stdout:'/path/to/gstack-office-hours\n'; `where/which office-hours` → status:1
       - Call probeGstackPrefix() → assert returns `{status:'pass', prefix:'gstack-', ...}`
       - Then call runWorkflow('workflows/plan-feature/workflow.yaml', {gstack_prefix:'gstack-'}) → assert (a) returns `{status:'complete', phasesRun:5}` (b) phase 1 invokes was interpolated to 'gstack-office-hours' (assert via spy on loadPhases or by parse intermediate)
     - **Fixture 2: `bare '' mode end-to-end (--no-prefix, R7.4 case 2)`** —
       - mock spawnSync inverse: gstack-office-hours fails, office-hours succeeds
       - Call probeGstackPrefix() → assert returns `{status:'pass', prefix:'', ...}`
       - Call runWorkflow with `{gstack_prefix:''}` → assert (a) `{status:'complete', phasesRun:5}` (b) phase 1 invokes interpolated to 'office-hours' (empty prefix concat)
     - **Fixture 3: `both/neither ambiguous fail-loud (R7.4 case 3)`** —
       - mock spawnSync both succeed → probeGstackPrefix returns `{status:'fail', detail:contains 'ambiguous', fix:contains 'edit .harnessed/config.json'}`
       - OR mock spawnSync both fail → returns `{status:'fail', detail:contains 'neither', fix:contains 'install gstack'}`
       - Assert doctor would fail at this state (exit 1); user provides manual `.harnessed/config.json` → runWorkflow then succeeds
  2. Run biome preempt: `pnpm exec biome check --write tests/integration/plan-feature-prefix-e2e.test.ts`
  3. Run local verify: `corepack pnpm test -- --run tests/integration/plan-feature-prefix-e2e.test.ts 2>&1 | tail -10`
  4. **Update Resolved (T3.1) block** at task_plan.md top with outcome
- **acceptance_criteria**:
  - `corepack pnpm test -- --run tests/integration/plan-feature-prefix-e2e.test.ts 2>&1 | tail -5 | grep -E "Tests.*3 passed"` (3 fixtures pass — R7.4 acceptance)
  - `corepack pnpm test 2>&1 | tail -10 | grep -E "Tests.*\d+ passed" | grep -v "failed"` exit 0 (full suite green)
  - `grep -E "gstack-|bare|ambiguous|neither" tests/integration/plan-feature-prefix-e2e.test.ts | wc -l` ≥ 4 (3-prefix-matrix coverage verified)
- **decision_source**: R7.4 acceptance "用户三种前缀场景任一都跑通" + RESEARCH § 11.1 functional dimension + § 1.4 4-state branches

### T3.2 — docs/adr/0015-gstack-probe-interpolate-plan-feature.md NEW (9 章节 errata)

- **files_modified**: `docs/adr/0015-gstack-probe-interpolate-plan-feature.md` (NEW ~150L 9 章节 errata)
- **read_first**:
  - `docs/adr/0014-checkpoint-engine-resume-compact.md` (sister Phase 3.1 ADR 9 章节 errata template direct analog)
  - `docs/adr/0013-phase-2.4-doctor-ee4-dashboard-c-path.md` (sister Phase 2.4 ADR pattern)
  - All 4 D-decision sources: CONTEXT.md D-01~D-04 verbatim + KICKOFF
  - All Wave A R1+R2 sources: PATTERNS.md § 1-5 + RESEARCH.md § 1-18
  - `.planning/phase-3.2/PLAN-CHECK.md` (planner-revision iter 1 absorption footnote — B-01 + W-01 + W-02 + W-03 fixes captured in ADR closing footnote)
- **action**:
  1. Create NEW file `docs/adr/0015-gstack-probe-interpolate-plan-feature.md` with 9 章节 errata per sister Phase 3.1 ADR 0014 pattern. Section headers:
     ```markdown
     # ADR 0015: Phase 3.2 — gstack probe + workflow interpolate + plan-feature reference (WIRED)

     **Status**: Accepted
     **Date**: 2026-MM-DD (ship)
     **Phase**: v0.3.0 milestone 2/4
     **Supersedes/Extends**: ADR 0014 (Phase 3.1 checkpoint engine — first consumer of Phase 3.1 engineHook = workflow.run.ts in this phase)

     ## Context
     [v0.3.0 milestone Phase 3.2 scope + R7.1 + R7.4 acceptance bar]

     ## Decision Summary (9 sections)

     ### 1. D-01 PROBE — doctor 6th check (gstack 前缀探测)
     [Win shell flavor sister checkJq + 4-state branch + .harnessed/config.json 9th surface]

     ### 2. D-02 JINJA — `{{ var }}` 模板替换 zero-dep + throw-on-missing fail-loud
     [regex /\{\{\s*(\w+)\s*\}\}/g + InterpolationError class + Karpathy YAGNI lock + 行业 strict 推荐]

     ### 3. D-03 WIRED — plan-feature 5-phase reference (governance gate + skill stub mock)
     [中庸 SKELETON-vs-FULL trade-off + dispatchSkillStub minimal 3-field mock + Phase 3.3+ dogfood prereq]

     ### 4. D-04 PUSH — governance.json file-based lazy-read (NOT polling)
     [.harnessed/governance.json 10th surface + sister state.ts fail-soft + Phase 2.4 SSE polling anti-pattern lesson + Win signal cross-OS 差异 reject]

     ### 5. § 4 + § 10 — schemaVersion 9th + 10th surface double-add (config.v1 + governance.v1 Option B)
     [Karpathy single-responsibility 双独立文件 + race isolation + sister Phase 3.1 7→8 surface precedent extended to 8→10]

     ### 6. § 8 — W0.1 cli-audit env-dep CI red fix Path A LOCKED
     [Root cause: Phase 2.4 W4 eager import sync miss in tests/unit/cli-audit.test.ts; Fix: vi.mock audit-helpers ~10-15L; src/ unchanged]

     ### 7. § 9 — W0.2 STATE.md/README.md format SSOT normalize (Option A README format)
     [11 line-start markers added to STATE.md + ci.yml ENFORCE flip (Phase 3.1 W0.3 deferred #1 兑现)]

     ### 8. § 10 — .harnessed/ 双独立文件 (.harnessed/config.json + .harnessed/governance.json)
     [single-responsibility per file + sister 5-path .harnessed/ pattern extended to 7-path; race condition isolation between harnessed-internal vs gstack-external writers]

     ### 9. § 12 — 4-wave topology (W0-W3, sister Phase 3.1 6-wave 缩 2 因 WIRED scope 更小)
     [23 atomic task vs Phase 3.1 28 task; ~280L src delta vs Phase 3.1 ~370L; ~44 NEW fixture vs Phase 3.1 ~28 (planner-revision iter 1 +1 fixture)]

     ## Consequences
     [Phase 3.3+ aliases.yaml + deprecation 启动 prereq; Phase 3.4 routing hit rate ≥ 85% acceptance carry-forward]

     ## A7 conservation iter 1-0014 → 1-0015
     [git diff adr-0014-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-4]-*.md | wc -l == 0]

     ## Planner-revision iter 1 absorption (BLOCKER + 3 WARNING fixes)
     [B-01 BLOCKER: T2.3 run.ts activatePhase-BEFORE-isVetoed reorder + T2.6 fixture 3 (veto-at-i=0 with Phase 3.1 resume.ts proof) absorbed — sister Phase 3.1 D-02 contract preserved (pause transitions from active)]
     [W-01 WARNING: T2.3 sessionId dead variable dropped at source (sister Phase 3.1 W-04 BLOCKER lesson eliminate at source); WIRED mode stub returns no sessionId per D-03; sessionId propagation deferred Phase 3.3+ dogfood真 spawn]
     [W-02 WARNING: T2.1 src/workflow/schema/phases.ts UNCONDITIONAL +4L extend (invokes + on_veto Optional fields) — Karpathy DRY: extending parent schema cleaner than parallel schema]
     [W-03 WARNING: W0.3-schema-decision.md "Path divergence from PATTERNS.md" section added — schemas live under src/workflow/schema/ per consumer colocation rule, PATTERNS.md § 2.4 indicative-of-pattern not literal-path]
     ```
  2. Fill each section with concrete sources (CONTEXT decision_source quotes + RESEARCH section refs + PATTERNS analog refs) — sister ADR 0014 format
  3. Run biome preempt (markdown not biome-linted, harmless)
- **acceptance_criteria**:
  - `test -f docs/adr/0015-gstack-probe-interpolate-plan-feature.md` exit 0
  - `grep -cE "^### [1-9]\." docs/adr/0015-gstack-probe-interpolate-plan-feature.md` ≥ 9 (9 sections)
  - `grep -E "D-01 PROBE|D-02 JINJA|D-03 WIRED|D-04 PUSH" docs/adr/0015-gstack-probe-interpolate-plan-feature.md | wc -l` ≥ 4
  - `grep -E "9th|10th|config\.v1|governance\.v1" docs/adr/0015-gstack-probe-interpolate-plan-feature.md | wc -l` ≥ 4
  - `grep -E "W0\.1|W0\.2|Path A|README format SSOT" docs/adr/0015-gstack-probe-interpolate-plan-feature.md | wc -l` ≥ 4
  - `grep -E "Planner-revision iter 1|B-01|W-01|W-02|W-03" docs/adr/0015-gstack-probe-interpolate-plan-feature.md | wc -l` ≥ 4 (revision absorption footnote)
  - `wc -l docs/adr/0015-gstack-probe-interpolate-plan-feature.md` ≥ 100 ≤ 220 (+~20L for revision footnote vs pre-revision 200)
- **decision_source**: D-01~D-04 + W0.1 + W0.2 + W0.3 + RESEARCH § 4 + § 8 + § 9 + § 10 + § 12 + sister Phase 3.1 ADR 0014 9 章节 pattern + planner-revision iter 1 absorption (B-01 + W-01 + W-02 + W-03)

### T3.3 — STATE.md continue Phase 3.2 SHIPPED entry (12th 历史 marker + event log)

- **files_modified**: `.planning/STATE.md` (MODIFY — append Phase 3.2 SHIPPED entry to W0.2 历史 section + event log entry)
- **read_first**:
  - `.planning/STATE.md` post-T0.2 (verify W0.2 历史 section was added with 11 markers)
  - `.planning/STATE.md` event log section (verify entry # range — Phase 3.1 ship was entry #34/35/36)
- **action**:
  1. **Append to "已完成 phase ship 历史" section** (added in T0.2) — add Phase 3.2 entry at top:
     ```markdown
     - **Phase 3.2 SHIPPED** ✅ (2026-MM-DD) — gstack 前缀探测 + workflow 变量插值 + plan-feature 5-phase WIRED + governance PUSH veto (12th 历史 marker; R7.1 + R7.4 acceptance)
     ```
  2. **Append event log entry** (next sequential entry # after Phase 3.2 discuss/plan #36-37 area):
     ```markdown
     - **Phase 3.2 SHIPPED 2026-MM-DD** (entry #38): 4 Wave 23 atomic task ship; D-01 PROBE (doctor 6th check 175→~180L Karpathy clean) + D-02 JINJA (interpolate.ts ≤30L zero-dep throw-on-missing) + D-03 WIRED (5-phase 桩 + dispatchSkillStub + Phase 3.1 engineHook 二代消费) + D-04 PUSH (governance.json 10th surface lazy-read); schemaVersion 8→10 double-add (config.v1 + governance.v1 Option B Karpathy single-responsibility); W0.1 cli-audit env-dep Path A fix (CI 3-OS green achieved); W0.2 README SSOT (STATE.md 11→12 markers + ci.yml ENFORCE flip = Phase 3.1 W0.3 deferred #1 兑现); ADR 0015 9 章节 accepted + A7 守恒 iter 1-0014→1-0015; planner-revision iter 1 absorbed (B-01 activate-before-veto reorder + T2.6 fixture 3 + W-01 sessionId dead-var dropped + W-02 phases.ts unconditional extend + W-03 path divergence section); baseline adr-0015-accepted + milestone v0.3.0-alpha.2-plan-feature tags; v0.3.0 2/4 progress
     ```
- **acceptance_criteria**:
  - `grep -cE "^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped" .planning/STATE.md` == 12 (11 历史 + Phase 3.2 NEW)
  - `grep -E "Phase 3\.2 SHIPPED" .planning/STATE.md | wc -l` ≥ 2 (历史 entry + event log entry)
  - `grep -E "entry #3[8-9]|entry #4[0-9]" .planning/STATE.md | grep -i "phase 3.2" | wc -l` ≥ 1 (sequential event log entry added)
  - **README sync verify (W0.2 ENFORCE active)**: README.md will be updated 同步 by separate manual edit (advisory — not strict acceptance for this task); CI ENFORCE step now strictly enforces drift
- **decision_source**: ship cadence + T0.2 W0.2 SSOT normalize prereq + sister Phase 3.1 ship pattern

### T3.4 — RETROSPECTIVE.md Phase 3.2 milestone retro entry

- **files_modified**: `.planning/RETROSPECTIVE.md` (MODIFY — append Phase 3.2 milestone retro section)
- **read_first**:
  - `.planning/RETROSPECTIVE.md` (verify Phase 3.1 milestone retro section format)
- **action**:
  1. Append Phase 3.2 milestone retrospective section after Phase 3.1 section:
     ```markdown
     ## Phase 3.2 Milestone Retrospective (2026-MM-DD shipped, v0.3.0 2/4)

     ### What Worked
     - **W0.1 Path A locked verbatim from RESEARCH § 8.3** — fix recipe ready before execution; ~10-15L vi.mock add fixed 2 fail without src/ changes; CI 3-OS green achieved on first push (first acceptance bar)
     - **W0.2 README SSOT + STATE.md 11 markers** — Phase 3.1 W0.3 deferred #1 兑现; ci.yml ENFORCE flip via 3-line semantic change (delete + ::warning→::error + exit 1)
     - **schemaVersion 9th + 10th surface double-add** — sister Phase 3.1 7→8 surface precedent extended seamlessly; CD-5 single 兼容门 + Karpathy single-responsibility lock prevented config/governance coupling
     - **D-03 WIRED 中庸 trade-off** — 5-phase 桩 + governance gate validated workflow runtime behavior without scope-creep to FULL real spawn (Phase 3.3+ dogfood); dispatchSkillStub minimal 3-field mock (Karpathy YAGNI)
     - **D-04 PUSH lazy-read pattern** — sister Phase 3.1 readCurrentWorkflow fail-soft模式直接复刻 (70% reuse); ~10ms overhead per workflow run negligible vs Phase 3.3+ SDK spawn cost ~500ms/phase
     - **Planner-revision iter 1 caught 1 BLOCKER + 3 WARNING before execution** — B-01 activate-before-veto ordering insight (statePause requires 'active' state to transition from; veto-at-i=0 scenario hidden by initial test plan); W-01 sessionId dead-var elimination at source (sister Phase 3.1 W-04 lesson); W-02 phases.ts unconditional extension (Karpathy DRY over parallel-schema); W-03 PATTERNS path divergence documented (colocation rule beats indicative-of-pattern sketches)

     ### What Was Inefficient
     - **doctor.ts 175L baseline mismatch** — KICKOFF described as "215L" (Phase 2.4 ship-time stale); RESEARCH § 1.4 local verify caught actual 175L → 加 6th check 175→~180L ≤ 200L Karpathy clean without existing-helper split (saved ~1 task)
     - **PROBE 测试 spawnSync mock surface 较多** — 5 fixture cover 3 valid states + 1 ambiguous + 1 missing + Win shell flavor matrix; per-fixture spawnSync mock setup repetitive (sister checkJq matrix similar issue)
     - **Initial T2.3 + T2.6 plan missed B-01 ordering defect** — statePause early-return-null on missing state semantic was implicit in sister Phase 3.1 D-02 docs; planner draft assumed "veto check first" (intuitive) without checking sister state.ts L66-67 contract. Lesson: when consuming sister-phase infra, read the ENTIRE consumer-relevant contract file (not just exports), and write a fixture that covers boundary edge-case (i=0) early to validate ordering. Planner-revision iter 1 caught this in 1 iter — desirable outcome of the iter 1-3 budget.

     ### Patterns Established
     - **workflow.run.ts as Phase 3.1 engineHook 二代消费者** — first consumer was engine.ts (Phase 3.1 W3); workflow runner is second; pattern: any new phase iter logic should `activatePhase / completePhase` via engineHook + use `state.pause` for halt scenarios
     - **PUSH gate at phase boundary AFTER activate** — `await activatePhase(ph.id); if (await isVetoed()) { await statePause(); return paused-veto }` 2-line pattern (B-01 planner-revision iter 1 ordering); reusable for future external-veto scenarios (e.g., resource quota, security freeze)
     - **JINJA interpolate single-word only** — `\w` regex enforces no dot-path / nested; users get fail-loud throw with template excerpt for debug locality
     - **Sister schema extension over parallel schema (W-02 lesson)** — when 2 workflow types share loadPhases loader, extend parent schema with Optional fields rather than creating parallel schema; Karpathy DRY + cheaper Value.Check surface
     - **Path divergence documentation rule (W-03 lesson)** — when PATTERNS.md analog references include path strings, treat as indicative-of-pattern; document divergence in W0.3-style decision record when actual consumer colocation differs

     ### Lessons for Phase 3.3+
     - **plan-feature dogfood**: Phase 3.3 should consume plan-feature workflow itself (recursive — use plan-feature workflow to plan Phase 3.3 aliases.yaml feature); dispatchSkillStub → real spawn via gstack-office-hours + gsd-discuss-phase + gsd-plan-phase + planning-with-files
     - **sessionId propagation (W-01 deferred)**: Phase 3.3+ true spawn introduces SDK session_id surface — re-add sessionId field to runWorkflow + completePhase + thread through ContextCtx; W-01 W-04 sister lesson: don't introduce dead vars before the surface exists
     - **aliases.yaml + deprecation marker** prereq carry-forward to Phase 3.3
     - **dashboard SSE governance.json watcher** integration可能 Phase 3.3+ (sister Phase 2.4 dashboard SSE channel复用)
     ```
- **acceptance_criteria**:
  - `grep -E "Phase 3\.2 Milestone Retrospective" .planning/RETROSPECTIVE.md | wc -l` ≥ 1
  - `grep -E "Path A locked|README SSOT|schemaVersion.*double-add|WIRED 中庸|PUSH lazy-read" .planning/RETROSPECTIVE.md | wc -l` ≥ 3 (key wins captured)
  - `grep -E "doctor\.ts 175L|baseline mismatch|B-01 ordering defect" .planning/RETROSPECTIVE.md | wc -l` ≥ 1 (inefficiency captured)
  - `grep -E "engineHook 二代|PUSH gate.*AFTER activate|JINJA.*single-word|parallel schema|Path divergence" .planning/RETROSPECTIVE.md | wc -l` ≥ 3 (pattern established incl planner-revision iter 1 lessons)
- **decision_source**: ship cadence + sister Phase 3.1 milestone retro pattern + 5 key R1+R2 critical findings + 2 anti-pattern lessons + planner-revision iter 1 absorption lessons

### T3.5 — ROADMAP.md Phase 3.2 ✅ + v0.3.0 2/4 + Phase 3.3 prereq

- **files_modified**: `.planning/ROADMAP.md` (MODIFY — Phase 3.2 mark shipped + v0.3.0 progress + Phase 3.3 prereq carry)
- **read_first**:
  - `.planning/ROADMAP.md` L155-175 (verify current Phase 3.1 ✅ SHIPPED marker format + Phase 3.2/3.3/3.4 entries)
- **action**:
  1. Modify L160-162 Phase 3.2 entry — add ✅ SHIPPED marker (sister Phase 3.1 L156 format):
     ```markdown
     - **Phase 3.2：gstack 前缀探测 + workflow 变量插值 + plan-feature reference 实装** ✅ SHIPPED 2026-MM-DD
       - 三选一探测；`invokes` 字段插值；governance 层 pause + on_veto
       - 验收：用户 gstack 装哪种前缀都能跑通 ✅ (T3.1 prefix matrix 3 fixture all pass)
       - ship 总结：4 Waves W0-W3 全 ship 23 atomic task; D-01 PROBE doctor 6th check + D-02 JINJA zero-dep + D-03 WIRED 5-phase 桩 + D-04 PUSH governance.json 10th surface; schemaVersion 8→10 (config.v1 + governance.v1 double-add); workflow.run.ts ≤80L Phase 3.1 engineHook 二代消费; W0.1 cli-audit env-dep Path A fix + CI 3-OS green; W0.2 STATE.md 12 markers + ci.yml ENFORCE flip (deferred #1 兑现); planner-revision iter 1 absorbed (B-01 + W-01 + W-02 + W-03 LOCKED); ADR 0015 9 章节; baseline adr-0015-accepted + milestone v0.3.0-alpha.2-plan-feature
     ```
  2. Modify v0.3.0 milestone summary (around L130 area or wherever v0.3.0 milestone progress is tracked) — bump from 1/4 → 2/4
  3. Phase 3.3 entry — add prereq note (sister Phase 3.2 ship 后 carry-forward):
     ```markdown
     - **Phase 3.3：aliases.yaml + deprecation marker + known-good 版本组合**
       - manifest 重定向；doctor warning；release 流程冻结 known-good lock
       - 验收：模拟上游改名场景 install 通过
       - **prereq (Phase 3.2 ship carry)**: dogfood plan-feature workflow ourselves (use 5-phase 流水 to plan Phase 3.3 aliases.yaml feature); sessionId propagation (W-01 W-04 deferred — add when SDK session_id surfaces from real spawn)
     ```
- **acceptance_criteria**:
  - `grep -E "Phase 3\.2.*✅ SHIPPED" .planning/ROADMAP.md | wc -l` ≥ 1
  - `grep -E "v0\.3\.0.*2/4|2 of 4" .planning/ROADMAP.md | wc -l` ≥ 1 (milestone bumped)
  - `grep -E "Phase 3\.3.*prereq.*Phase 3\.2 ship carry" .planning/ROADMAP.md | wc -l` ≥ 1 (forward-carry registered)
- **decision_source**: ship cadence + sister Phase 3.1 ROADMAP marker pattern

### T3.6 — A7 守恒 verify + T3.7 baseline + milestone tags push

- **files_modified**: (no file modification — git tags only)
- **read_first**:
  - `docs/adr/` directory listing (verify ADR 0001-0014 unchanged + 0015 NEW)
- **action**:
  1. **A7 conservation verify** (sister Phase 3.1 T5.4 pattern):
     ```bash
     git diff adr-0014-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-4]-*.md | wc -l
     ```
     Expected: `0` (no diff to ADR 0001-0014; only ADR 0015 is new)
     If non-zero, investigate any unintended edit to prior ADR — fix before tag push
  2. **Baseline tag push**: `git tag adr-0015-accepted` + `git push origin adr-0015-accepted`
  3. **Milestone tag push**: `git tag v0.3.0-alpha.2-plan-feature` + `git push origin v0.3.0-alpha.2-plan-feature`
  4. **Verify on remote**: `git ls-remote --tags origin | grep -E "adr-0015-accepted|v0\.3\.0-alpha\.2-plan-feature" | wc -l` ≥ 2
- **acceptance_criteria**:
  - `git diff adr-0014-accepted..HEAD -- docs/adr/000[1-9]-*.md docs/adr/001[0-4]-*.md | wc -l` == 0 (A7 守恒)
  - `git tag --list | grep -E "^adr-0015-accepted$"` exit 0
  - `git tag --list | grep -E "^v0\.3\.0-alpha\.2-plan-feature$"` exit 0
  - `git ls-remote --tags origin | grep -E "adr-0015-accepted|v0\.3\.0-alpha\.2-plan-feature" | wc -l` ≥ 2 (pushed to remote)
  - Full test suite `corepack pnpm test 2>&1 | tail -10 | grep -v "failed"` exit 0 (final ship verify, ~640+ tests / 0 fail)
- **decision_source**: ship cadence + sister Phase 3.1 T5.4 + T5.6 baseline + milestone tag pattern + v0.3.0 alpha versioning convention (.alpha.1-checkpoint Phase 3.1 → .alpha.2-plan-feature Phase 3.2)

---

## Notes for Executor

### Per-commit biome preempt (MEMORY rule, mandatory)

Before EVERY commit touching .ts files:
```bash
pnpm exec biome check --write <modified-files>
```

Per project memory `feedback_biome-preempt.md`: 3 CI-red recurrences in Phase 2.1.1 / 2.2 / 2.3 from skipping this step. Biome lint failure = forced 3-OS rerun + wasted CI cycles.

### Per-wave full suite verify

After each Wave 完成时:
```bash
corepack pnpm test 2>&1 | tail -10
```

Expected progression:
- Post-W0: 596+ → 596+ pass / 0 fail (W0.1 fixed 2 fail, no new tests added yet)
- Post-W1: 596+ → ~619+ pass (23 new fixture from T1.8)
- Post-W2: ~619 → ~630+ pass (11 new fixture from T2.6 — planner-revision iter 1 +1 fixture)
- Post-W3: ~630 → ~633+ pass (3 new fixture from T3.1)

### Karpathy hard limit verify (every code-producing task)

```bash
# Per-file ≤200L hard limit:
wc -l src/cli/lib/probe-gstack.ts          # ≤ 50
wc -l src/workflow/interpolate.ts          # ≤ 30
wc -l src/workflow/governance.ts           # ≤ 30
wc -l src/workflow/run.ts                  # ≤ 80 (~78L post-B-01+W-01 revision)
wc -l src/workflow/schema/config.ts        # ≤ 20
wc -l src/workflow/schema/governance.ts    # ≤ 30
wc -l src/workflow/schema/planFeature.ts   # ≤ 40
wc -l src/workflow/schema/phases.ts        # ≤ 80 (~54L post-W-02 extension)
wc -l src/cli/doctor.ts                    # ≤ 200
wc -l src/workflow/loadPhases.ts           # ≤ 40
wc -l src/types/schemaVersion.ts           # ≤ 80
```

### Schema discipline CD-5 verify (post-W1)

```bash
grep -cE "harnessed\.\w+\.v1" src/types/schemaVersion.ts  # ≥ 10 (8 → 10 double-add)
grep -r "branchOnSchemaVersion" src/ | wc -l               # ≥ 4 (Phase 3.1 baseline 3 + governance consumer)
```

### D-decision anti-sneak guards (every commit reviewing diff)

- D-01 PROBE: `! grep -E "INTERACTIVE.*first-run|prompt user.*prefix" src/cli/` (no INTERACTIVE sneak-in)
- D-02 JINJA: `! grep -E "mustache|handlebars|nunjucks|liquid" src/workflow/interpolate.ts package.json` (zero-dep守门)
- D-03 WIRED: `! grep -E "spawn\(|spawnSync\(|execaCommand|exec\(" src/workflow/run.ts` (no real spawn in run.ts)
- D-04 PUSH: `! grep -E "setInterval|setTimeout.*[Pp]oll|chokidar.*governance" src/workflow/governance.ts src/workflow/run.ts` (no polling timer)

### Planner-revision iter 1 anti-regression guards (NEW — every commit on Wave 2 files)

- **B-01 ordering guard**: `awk '/await activatePhase\(ph\.id\)/{a=NR} /if \(await isVetoed\(\)\)/{v=NR} END{exit !(a>0 && v>0 && a<v)}' src/workflow/run.ts` exit 0 (activatePhase line MUST precede isVetoed line)
- **W-01 dead var guard**: `! grep -E "let sessionId" src/workflow/run.ts` (sessionId variable MUST NOT exist; sister Phase 3.1 W-04 lesson)
- **W-02 unconditional extension guard**: `grep -q "invokes" src/workflow/schema/phases.ts && grep -q "on_veto" src/workflow/schema/phases.ts` exit 0 (UNCONDITIONAL PhasesSchema extension applied)
- **W-03 divergence note guard**: `grep -E "Path divergence from PATTERNS" .planning/phase-3.2/W0.3-schema-decision.md | wc -l` ≥ 1 (divergence section present)

### Anti-stall protocol

If any task estimated > 40 tool uses → split atomic. Current task budget per task:
- T0.1 (W0.1 fix): ≤ 20 tool uses (read + edit + verify)
- T1.4 (probe-gstack.ts NEW): ≤ 25 tool uses
- T1.8 (5 test files): ≤ 35 tool uses (split if exceeding)
- T2.1 (loadPhases + phases.ts extend): ≤ 20 tool uses (planner-revision iter 1: +1 file vs pre-revision, still atomic)
- T2.3 (run.ts NEW): ≤ 25 tool uses
- T2.5 (5 SKILL.md): ≤ 20 tool uses (loop write 5 files)
- T2.6 (4 test files): ≤ 40 tool uses (planner-revision iter 1: +1 fixture vs pre-revision 35, B-01 fixture 3 needs Phase 3.1 resume.ts integration; split if exceeding)
- T3.2 (ADR 0015 9 章节): ≤ 30 tool uses

### First acceptance bar gate (W0.1 CI green)

**Phase 3.2 cannot proceed past Wave 0 until CI 3-OS green**. If T0.1 fix doesn't achieve 0 fail on first commit:
1. Investigate via `corepack pnpm test -- --run tests/unit/cli-audit.test.ts 2>&1 | tail -50` local output
2. Cross-check vi.mock surface against RESEARCH § 8.3 fix recipe verbatim
3. If still failing, escalate to investigate cell (RESEARCH § 8.6 Path B src change as fallback, but only with planner approval — not autonomous)

---

*Task plan: 23 atomic tasks × 4 Waves (W0:4 / W1:8 / W2:6 / W3:5) — count unchanged post-planner-revision iter 1 (T2.6 +1 fixture in same task cell; T2.1 +1 file in same task cell)*
*Authored: 2026-05-16 — Wave B planner output*
*Revised: 2026-05-17 — planner-revision iter 1/3 (1 BLOCKER + 3 WARNING absorbed per orchestrator tier-call decisions; see PLAN-CHECK.md iter 1)*
*Karpathy hard limit verified per task; D-decision anti-sneak guards inline; planner-revision iter 1 anti-regression guards added*
