# Phase v3.0-3.2 PLAN — v3.0 4-Stage Namespace-Layered Workflow Execution

---
status: ready-to-execute
phase: v3.0-3.2 plan
target_phases: [v3.0-3.3, v3.0-3.4, v3.0-3.5, v3.0-3.6]
created: 2026-05-20
researcher_team: phase32-research-team (Pattern A 全栈三路: workflows + capabilities + disciplines)
research_files:
  - RESEARCH-workflows.md (1920L)
  - RESEARCH-capabilities.md (932L)
  - RESEARCH-disciplines.md (~920L)
context_source: .planning/phase-v3.0-3.1/3.1-CONTEXT.md (13 D-decision LOCKED batch 1 + 2)
total_tasks: 56
total_waves_per_phase:
  v3.0-3.3 execute schema: 2 waves (W0 foundation + W1 close), 14 tasks
  v3.0-3.4 execute sub-workflows: 3 waves (W0 14 sub yaml + W1 2 standalone + W2 close), 19 tasks
  v3.0-3.5 execute master orchestrator: 3 waves (W0 schema engine + W1 4 master yaml + W2 dogfood close), 11 tasks
  v3.0-3.6 close + ship: 3 waves (W0 ADR + W1 artifacts + W2 milestone + GA tag), 12 tasks
estimated_duration_days: 2-3 (sister v2.0-2.3 至 v2.0-2.6 4-phase 1.5 day single-burst cadence)
karpathy_200L_compliance: all NEW TS file ≤200L verified at design time
schema_versions:
  v2_baseline: 16 surface
  v3_new: 17 (workflow.v3) + 18 (discipline.v1) — capabilities.v1 NOT bump (per Pattern A reconcile)
  total_post_v3: 18 surface
breaking_changes:
  - /plan-feature dropped (replaced by /plan master + /plan-phase sub)
  - /execute-task dropped (replaced by /task master + 4 sub)
  - /verify-work dropped (replaced by /verify master + 7 sub)
  - /research kept (v2 → v3 schema bump only)
  - /retro NEW standalone
  - workflows/<stage>/<sub>/ nested 2-level dir replacing flat workflows/<name>/
13_decision_coverage:
  M-01: T3.6.* milestone artifacts
  D-01: T3.5.W0.1 (masterOrchestrator.ts) + T3.5.W1.1-4 (4 master yaml) + T3.6.W0.1 (ADR 0030)
  D-02: T3.6.W0.1 (ADR 0030 bare slash cmd policy codify)
  D-03: T3.3.W0.12 (setup-helpers nested scan) + T3.4.W0.* (workflows/<stage>/<sub>/ tree)
  D-04: T3.6.W1.1 (CHANGELOG [3.0.0] alias map) + T3.3.W0.12 (deprecation warn + skip install)
  D-05 + D-09: T3.3.W0.4 (disciplines/ 6 yaml) + T3.3.W0.6 (discipline.ts TypeBox) + T3.3.W0.9 (disciplineLoader.ts) + T3.5.W0.2-5 (4 wedge hook)
  D-06: T3.4.W0.* phases-with-/plan invoke wiring (cross-stage)
  D-07: T3.4.W0.* (14 sub yaml + 2 standalone)
  D-08: T3.3.W0.1-2 (capabilities.yaml category backfill 39 + extend ~36 NEW)
  D-10: T3.3.W0.* judgments wire (parallelism-gate + Agent Teams + ralph-loop in capabilities)
  D-11: T3.3.W0.3 (judgments 4 NEW yaml: web-design/web-testing/web-search/stage-routing)
  D-12: T3.3.W0.2 gstack 33 optional capabilities entry (register-only, NOT sub-workflow)
  D-13: T3.6.W2.2 superset audit (milestone audit doc 校验 CLAUDE.md/Obsidian/rules 1:1 mapping)
---

## Phase Goal

把 Phase v3.0-3.1 13 D-decision LOCKED 转化为 56 atomic task 跨 4 execute phase (3.3 schema + 3.4 sub-workflows + 3.5 master + 3.6 close)。

v3.0 = **harnessed = superset of**:
- CLAUDE.md global rules (语言/风格/priority/纪律) → 6 disciplines/*.yaml
- CLAUDE.md 4-stage cadence → 20 workflow (4 master + 14 sub + 2 standalone)
- CLAUDE.md 三层栈判据 + rules/*.md routing → 10 judgments yaml
- ~75 entry capabilities.yaml (39 v2 backfill `category` + ~36 NEW gstack 33 optional + 2 supplementary)
- ralph-loop / Agent Teams / planning-with-files / mattpocock / superpowers / gsd 全编 capability entry

Pattern A 三路 Wave A 输出 100% reconcile complete (3 LOCKED contract + 8 outstanding planner action all addressed below)。

## Risks & Mitigations (Aggregate from 3 RESEARCH 14 risk + Wave A reconcile)

| # | Risk | Severity | Mitigation Task |
|---|------|----------|-----------------|
| K1 | gstack 33 optional slash cmd 实际不存在 (capabilities.yaml entry register-only 但 user 调用得 "unknown slash cmd") | MEDIUM | T3.3.W1.1 加 `gstack list-skills` OR `grep -r '"name":' ~/.claude/plugins/gstack/` diff 步 |
| K2 | `superpowers-subagent-driven-development` v2 silent broken (parallelism-gate.yaml ref entry 缺失) | MEDIUM | T3.3.W0.2 backfill entry + T3.3.W0.10 cross-validate Contract 3 (judgments invokes capability) catch |
| K3 | phaseFactContext scope creep (35 + 24 = 68 field 全 backfill) | MEDIUM | 采用 Appendix C "core MIN" recommendation: 6 phase + 5 subtask + 2 root = 13 NEW field (47 field total); gstack optional 35 entry fires_when 用现有字段或 v3.x defer (per T3.3.W0.8) |
| K4 | BLUF / em-dash / emoji auto-detect heuristic false-positive | MEDIUM | enforcement=warn (NOT halt); `responseTarget` chat-only; user.requested_emoji override (per T3.3.W0.4 output-style.yaml rule schema verbatim disciplines-researcher LOCK) |
| K5 | biome preempt hook 集成位置不明 (harnessed 不拦截 user 主 session git commit) | MEDIUM | Option A (ralph-loop / subagent / team auto-commit only) — T3.3.W0.9 disciplineLoader + T3.5.W0.4 before-commit wedge; Option B `harnessed commit` wrapper defer v3.x |
| K6 | Cross-CC handoff protocols.yaml runtime 难以 enforce (跨 session 不共享 context) | MEDIUM | Option A 显式 `harnessed validate-handoff <design-doc>` cmd defer v3.x; v3.0 仅 schema validate yaml |
| K7 | discipline yaml 与 ~/.claude/CLAUDE.md drift (CLAUDE.md 迭代后 sync gap) | MEDIUM | v3.0 doc 明确 "snapshot of CLAUDE.md as of v3.0 ship date"; `scripts/check-discipline-drift.mjs` defer v3.x |
| K8 | Master ↔ Sub gate 重叠 / 矛盾 (master 和 sub-stage 都可独立 invoke 同 gate 在两层独立 eval) | MEDIUM | T3.5.W0.1 engine 共享 1 context snapshot per top-level invoke |
| K9 | Master `delegates_to` order 缺失导致 race (serial mode `order` 未声明) | LOW | T3.3.W0.10 schema-post invariant check: serial 必带 order |
| K10 | Nested scan 误匹配 disciplines/ judgments/ 当作 workflow | LOW | T3.3.W0.12 scan logic explicit skip non-`SKILL.md` subdirs (disciplines/ judgments/ 跳过) |
| K11 | 18 yaml × cross-deps Recon 复杂度爆炸 (capabilities-researcher 改 1 entry → 14 sub + 4 master 同时更新) | HIGH | T3.3.W0.10 `check-workflow-schema.mjs` 3 strict cross-validate contract (tools_available + disciplines_applied + judgments invokes capability) catch silent break |
| K12 | Pure Bundled v2 → v3 upgrade UX 撕裂 (旧 ~/.claude/skills/plan-feature/ 仍在) | MEDIUM | T3.3.W0.12 setup deprecation block + T3.6.W1.1 CHANGELOG [3.0.0] 顶部 BREAKING 黑体 + T3.6.W1.4 README 写 "manual remove" 指引 |
| K13 | category enum 双 fallback value (`discipline` D-09 semantic vs `behavioral` D-08 verbatim) | LOW | Wave B planner LOCK = `behavioral` (D-08 verbatim, capabilities-researcher 2nd reply); runtime engine 同 path (T3.3.W0.1 单一 enum) |
| K14 | priority hierarchy 仲裁 — pick-highest vs invoke-all (multi-capability 同 fire) | LOW | T3.3.W0.4 priority.yaml meta-rule `multi-capability-arbitration` enforcement=warn NOT halt (沿用 CLAUDE.md 独立判断 default 全跑) |

## Dependencies Graph (ASCII DAG)

```
Phase v3.0-3.3 execute schema (~14 task, 1.5 day)
└─ Wave W0 foundation (parallel-able by file-independence, 12 task)
   ├─ T0.1 (capabilities.yaml backfill category 39 entry)        ⟸ no dep
   ├─ T0.2 (capabilities.yaml extend gstack 33 + 6 behavioral + supplementary)  ⟸ T0.1 (same file)
   ├─ T0.3 (judgments 4 NEW yaml: web-design/web-testing/web-search/stage-routing)  ⟸ no dep
   ├─ T0.4 (disciplines/ 6 NEW yaml)                              ⟸ no dep
   ├─ T0.5 (workflow.ts v2 → v3 TypeBox)                          ⟸ no dep
   ├─ T0.6 (discipline.ts NEW TypeBox)                            ⟸ T0.4 (basename ref)
   ├─ T0.7 (capabilities.ts category enum + discriminated union)  ⟸ T0.2 schema-shape
   ├─ T0.8 (phaseFactContext.ts extend 13 NEW field MIN)          ⟸ no dep
   ├─ T0.9 (disciplineLoader.ts NEW + cache + 4 hook helper)      ⟸ T0.6
   ├─ T0.10 (check-workflow-schema.mjs 3 strict cross-validate)   ⟸ T0.5 + T0.6 + T0.7
   ├─ T0.11 (schemaVersion.ts 18 surface)                         ⟸ T0.5 + T0.6
   └─ T0.12 (setup-helpers.ts nested 2-level scan + flat compat)  ⟸ no dep
└─ Wave W1 close (2 task)
   ├─ T1.1 (gstack 33 optional capabilities entry diff + dry-run validate)  ⟸ T0.2
   └─ T1.2 (Phase 3.3 ship — STATE.md update + LOCAL tag v3.0.0-alpha.0-schema)  ⟸ all W0 + T1.1

Phase v3.0-3.4 execute sub-workflows (~19 task, 1 day)
└─ Wave W0 14 sub workflow yaml (parallel by file-independence, 14 task)
   T0.1-T0.14: 14 sub-stage yaml + SKILL.md (each ~50-80L yaml + ~40-60L SKILL.md)
└─ Wave W1 2 standalone (2 task)
   T1.1 research/workflow.yaml v3 schema bump + SKILL.md update
   T1.2 retro/workflow.yaml NEW + SKILL.md NEW (retro-gstack alias entry per Pattern A reconcile)
└─ Wave W2 close (3 task)
   T2.1 SKILL.md frontmatter consistency audit (20 file: bare-name + description + 3 trigger_phrases each)
   T2.2 defaults.yaml extend ralph_max_iterations 20 workflow × phase entries
   T2.3 Phase 3.4 ship — STATE.md update + LOCAL tag v3.0.0-alpha.1-sub-workflows

Phase v3.0-3.5 execute master orchestrator (~11 task, 0.5-1 day)
└─ Wave W0 engine + 4 master yaml dependencies (4 task)
   T0.1 masterOrchestrator.ts NEW ~120L (sister judgmentResolver pattern, 4-phase Promise.allSettled)
   T0.2 before-phase-execute wedge (loadDisciplinesForPhase into context)
   T0.3 before-spawn wedge (priority hierarchy arbitration)
   T0.4 before-commit wedge (biome preempt) + after-output wedge (BLUF/emoji/em-dash heuristic)
└─ Wave W1 4 master yaml + run.ts wedge (5 task)
   T1.1 discuss/auto/workflow.yaml + SKILL.md
   T1.2 plan/auto/workflow.yaml + SKILL.md
   T1.3 task/auto/workflow.yaml + SKILL.md
   T1.4 verify/auto/workflow.yaml + SKILL.md
   T1.5 run.ts wedge integration (runWorkflow master vs sub detection + 4 hook fire point)
└─ Wave W2 dogfood + close (2 task)
   T2.1 Master Path A SDK query vs Path B sub-shell decision + dogfood 4-cycle (1 per stage, ~30+ fixture)
   T2.2 Phase 3.5 ship — STATE.md update + LOCAL tag v3.0.0-rc.1

Phase v3.0-3.6 close + ship (~12 task, 0.5 day)
└─ Wave W0 3 NEW ADR (3 task, parallel)
   T0.1 ADR 0030 bare slash cmd policy LOCK (NEW)
   T0.2 ADR 0031 4-stage namespace-layered architecture (NEW)
   T0.3 ADR 0032 心法招式 cross-cutting L0 + L5b cleanup (NEW)
└─ Wave W1 ship artifacts (5 task)
   T1.1 CHANGELOG [3.0.0] BREAKING section + alias map table
   T1.2 ci.yml A7 step 0029 → 0032
   T1.3 package.json 2.0.1 → 3.0.0
   T1.4 README v3.0 highlight (20 workflow 4-stage diagram replace v2.0 "4 workflows")
   T1.5 docs/WORKFLOW.md major rewrite (4-stage mermaid + 20 workflow table)
└─ Wave W2 milestone close + GA tag (4 task)
   T2.1 ADR README index 3 row append
   T2.2 v3.0-MILESTONE-AUDIT.md NEW (sister v2.0 pattern + D-13 superset 校验 1:1 mapping table)
   T2.3 Phase 3.6 ship 4 LOCAL tag (v3.0.0-alpha.0-schema + alpha.1-sub-workflows + rc.1 + 🎯 v3.0.0 GA)
   T2.4 STATE.md final update + npm publish v3.0.0 (pending user push approval per CLAUDE.md commit safety)
```

**Cross-phase dependency**: Phase 3.3 → 3.4 → 3.5 → 3.6 strictly sequential (schema 先于 yaml 先于 master engine 先于 close artifacts)。

---

## Wave 拓扑 — Phase v3.0-3.3 Execute Schema

### Wave 3.3.W0 schema foundation (12 task, file-independence allows mostly parallel)

#### T3.3.W0.1 [S] capabilities.yaml backfill `category` field 39 v2 entry

- **File modified**: `workflows/capabilities.yaml` (v2 SHIPPED 414L 39 entry, no schema bump per Pattern A LOCK)
- **Action**: 对 39 个 v2 SHIPPED entry 每个 add `category: <one of 7 enum>` field per Appendix A categorization:
  - karpathy-guidelines → `category: behavioral` + `discipline_ref: workflows/disciplines/karpathy.yaml` (move sentinel `cmd: '<not-applicable-behavioral>'` per disciplines-researcher LOCK)
  - mattpocock 11 → `category: tool-slash-cmd`
  - gstack 6 core → `category: tool-slash-cmd`
  - gsd 5 → `category: tool-slash-cmd`
  - 2 superpowers (tdd + brainstorming) → `category: tool-slash-cmd`
  - ui-ux-pro-max + frontend-design → `category: tool-slash-cmd`
  - chrome-devtools-mcp + tavily-mcp + exa-mcp → `category: tool-mcp`
  - ctx7 → `category: tool-cli`
  - planning-with-files → `category: tool-plugin`
  - ralph-loop → `category: tool-bundled-skill`
  - webapp-testing → `category: tool-bundled-skill` (v3 reclass from special-purpose)
  - playwright-cli → `category: tool-bundled-skill` (v3 reclass)
  - playwright-test → `category: tool-plugin` (v3 reclass)
  - agent-teams-create + send-message + shutdown → `category: agent-platform`
- **Complexity**: S (~30 min mass edit, no logic change, additive Optional field)
- **Depends_on**: none
- **Acceptance**:
  1. `pnpm exec vitest run tests/workflow/capabilities-schema.test.ts` PASS
  2. `node scripts/check-workflow-schema.mjs` exit 0
  3. `grep -c 'category:' workflows/capabilities.yaml` ≥ 39
  4. 沿用 v2 schema_version `harnessed.capabilities.v1` (NOT bump per Pattern A B.1 LOCK)

#### T3.3.W0.2 [M] capabilities.yaml extend ~36 NEW entry (gstack 33 optional + 2 supplementary + 5 NEW behavioral discipline-ref)

- **File modified**: `workflows/capabilities.yaml` (same as W0.1, sequential dep)
- **Action**: Append `~36` NEW entry per Appendix A:
  - 5 NEW behavioral entries (`output-style-discipline` / `language-convention` / `operational-discipline` / `priority-hierarchy` / `conceptual-protocols`) each `category: behavioral` + `cmd: '<not-applicable-behavioral>'` + `discipline_ref: workflows/disciplines/<basename>.yaml`
  - 33 gstack optional entries — **NO `gstack-` prefix per Pattern A E.2 LOCK** (e.g. `autoplan` / `codex` / `design-shotgun` / `design-html` / `design-consultation` / `plan-design-review` / `plan-devex-review` / `plan-eng-review` / `context-save` / `context-restore` / `qa-only` / `devex-review` / `benchmark` / `browse` / `open-gstack-browser` / `connect-chrome` / `setup-browser-cookies` / `ship` / `land-and-deploy` / `setup-deploy` / `setup-gbrain` / `canary` / `document-release` / `document-generate` / `careful` / `guard` / `freeze` / `unfreeze` / `gstack-upgrade` / `learn` / `plan-tune` / `health` / `make-pdf`) — 例外 2 alias suffix `-gstack`: `retro-gstack` (alias to harnessed standalone `/retro`) + `investigate-gstack` (alias to mattpocock `investigate`)
  - 2 supplementary: `gws` (`category: tool-cli` per D-11 NEW google-workspace.yaml) + `superpowers-subagent-driven-development` (`category: tool-slash-cmd` — v2 silent broken backfill K2)
  - 1 gsd NEW: `gsd-research-phase` (v3 W2 SHIPPED per CONTEXT D-08 cite)
  - **Each entry MUST have**: `impl` + `cmd` + `since: v3.0` (NEW v3) OR `since: v2.0` (v2 SHIPPED move) + `category` + `description` + `fires_when` (Optional, per Appendix A table per-entry)
- **Complexity**: M (~2 h mass append + careful per-entry fires_when crafting)
- **Depends_on**: T3.3.W0.1 (same file, sequential)
- **Acceptance**:
  1. Total entry count = ~75 (39 baseline + 36 NEW, per Appendix A "TOTAL 75" verbatim)
  2. `node scripts/check-workflow-schema.mjs` exit 0
  3. `grep -c '^  [a-z-]*:' workflows/capabilities.yaml | awk '$1>=75'` PASS
  4. No `gstack-` prefix on 33 optional (verify via `grep -c '^  gstack-' workflows/capabilities.yaml` count = 6 core + 2 alias-suffix carrier `open-gstack-browser` + `gstack-upgrade` only, NOT 33 optional)
  5. 6 behavioral entry 全部 含 `discipline_ref:` 字段 + `cmd: '<not-applicable-behavioral>'`

#### T3.3.W0.3 [M] judgments 4 NEW yaml file (web-design + web-testing + web-search + stage-routing)

- **Files created**:
  - `workflows/judgments/web-design-routing.yaml` (~32L, per Example D RESEARCH-capabilities)
  - `workflows/judgments/web-testing-routing.yaml` (~45L, per Example B)
  - `workflows/judgments/web-search-routing.yaml` (~45L, per Example C)
  - `workflows/judgments/stage-routing.yaml` (~90L, per Example E — 12 trigger covering 4 master orchestrator delegation)
- **Action**: Verbatim copy yaml content from RESEARCH-capabilities Section Code Examples B/C/D/E。3 web-routing yaml 沿用 `triggers:` root key (现有 judgment.ts v1 schema, NOT bump per Pattern A E.4)。stage-routing.yaml schema 同样沿用 `triggers:` (12+ trigger 覆盖 /discuss → 3 sub + /plan → 2 sub + /verify → 7 sub delegation)。**注意**: keyword `and` / `or` 全小写 (expr-eval 2.0.2 case-sensitive, sister Phase 2.3 W0.2 production bug 经验)。
- **Complexity**: M (~1.5 h 4 file 各 ~30-90L)
- **Depends_on**: none (judgment.ts v1 schema 不变)
- **Acceptance**:
  1. 4 yaml file exist + 全部 `schema_version: harnessed.judgment.v1`
  2. `node scripts/check-workflow-schema.mjs` 验证 4 file pass (sister Phase 2.3 W0.6 CI gate)
  3. `pnpm exec vitest run tests/workflow/judgmentResolver.test.ts` PASS (现有 4-level ref resolve 不需要 schema change)
  4. 全 expression keyword (`and` / `or` / `==` / `in`) 全小写 — `grep -E '\b(AND|OR)\b' workflows/judgments/web-*.yaml workflows/judgments/stage-routing.yaml` count = 0

#### T3.3.W0.4 [M] disciplines/ NEW directory + 6 NEW yaml

- **Files created** (NEW directory `workflows/disciplines/`):
  - `workflows/disciplines/karpathy.yaml` (~75L, verbatim RESEARCH-disciplines § 2.1)
  - `workflows/disciplines/output-style.yaml` (~90L, verbatim § 2.2)
  - `workflows/disciplines/language.yaml` (~60L, verbatim § 2.3)
  - `workflows/disciplines/operational.yaml` (~85L, verbatim § 2.4 — biome-preempt + A7 ADR conservation + commit safety)
  - `workflows/disciplines/priority.yaml` (~50L, verbatim § 2.5 — 7-tier hierarchy + arbitration rule)
  - `workflows/disciplines/protocols.yaml` (~95L, verbatim § 2.6 — cc-handoff Ideation→Onboarding + Plan→Execute + file-ownership-strict)
- **Action**: Verbatim transcription from RESEARCH-disciplines § 2.1-2.6 (100% CLAUDE.md / cc-handoff.md verbatim, 无原创内容)。每 yaml 含 `schema_version: harnessed.discipline.v1` + `discipline: <basename>` + `enforcement_layer: <code-writing|output|commit|workflow>` + `auto_enforce: true|false` + `rules:` array (priority.yaml + protocols.yaml 含专属 `priority_hierarchy` / `protocols` Record 字段)。
- **Complexity**: M (~2 h 6 file verbatim copy + format verify)
- **Depends_on**: none (discipline.yaml file independent)
- **Acceptance**:
  1. 6 yaml file exist with valid yaml syntax
  2. T3.3.W0.6 (discipline.ts TypeBox) downstream validate 6 file PASS
  3. `ls workflows/disciplines/ | wc -l` == 6
  4. 沿用 RESEARCH-disciplines verbatim content (no edits) per "snapshot of CLAUDE.md as of v3.0 ship date" 原则 (K7 mitigation)

#### T3.3.W0.5 [S] src/workflow/schema/workflow.ts v2 → v3 (sister 86L → ~135L)

- **File modified**: `src/workflow/schema/workflow.ts` (v2 SHIPPED 86L)
- **Action**: Apply per RESEARCH-workflows Area 1 Final v3 TypeBox Schema verbatim + Pattern A A.1 reconcile (strict Literal Union for disciplines_applied):
  - Bump `schema_version: Type.Literal(SCHEMA_VERSIONS.workflow_v3)` (依赖 T3.3.W0.11 18 surface)
  - NEW `DisciplineName = Type.Union([Type.Literal('karpathy'), ...6 literal])` strict per A.1
  - NEW `disciplines_applied: Type.Optional(Type.Array(DisciplineName))` workflow-level
  - NEW `tools_available: Type.Optional(Type.Array(Type.String()))` workflow-level (元素 = capabilities.yaml entry name, cross-validate in T3.3.W0.10)
  - NEW `DelegationClause = Type.Object({sub, gate?, mode?, order?})` + `delegates_to: Type.Optional(Type.Array(DelegationClause))` master-only
  - NEW `InvokeToolClause = Type.Object({if?, tool})` + phase-level `invokes_tools: Type.Optional(Type.Array(InvokeToolClause))`
  - Phase shape `phases: Type.Optional` (master 无 phases, sub-stage 必有) — runtime invariant: 必有 phases OR delegates_to (NEW assertion in `runWorkflow`)
- **Complexity**: S (~45 min sister v2 pattern extend, additionalProperties:false 保留)
- **Depends_on**: T3.3.W0.11 (18 surface)
- **Acceptance**:
  1. `pnpm exec vitest run tests/workflow/schema-v3.test.ts` PASS (T3.3.W0.10 ship test)
  2. `pnpm exec tsc --noEmit` PASS
  3. TypeBox `Value.Check(WorkflowSchemaV3, ...)` validates new fields
  4. WorkflowSchemaV3 rejects unknown additionalProperties (STRIDE T-2.2-02 verbatim)
  5. File length ≤ 200L (karpathy hard limit) — current sister 86L + ~50L additive

#### T3.3.W0.6 [S] src/workflow/schema/discipline.ts NEW ~85L (discipline.v1 TypeBox)

- **File created**: `src/workflow/schema/discipline.ts` (NEW ~85L per RESEARCH-disciplines § 1)
- **Action**: Verbatim from RESEARCH-disciplines § 1:
  - `EnforcementLayer = Type.Union([Type.Literal('code-writing'), 'output', 'commit', 'workflow', 'tool'])`
  - `Enforcement = Type.Union([Type.Literal('halt'), 'warn', 'auto-fix', 'info'])`
  - `DisciplineRule = Type.Object({id, description, enforcement, trigger, check_method, auto_fix_cmd?})`
  - `PriorityHierarchy = Type.Array(Type.String(), {minItems: 1})`
  - `ProtocolShape = Type.Object({description, required_fields?, forbidden_phrases?, file_ownership?, rules?})`
  - `Discipline = Type.Object({schema_version: Type.Literal(SCHEMA_VERSIONS.discipline), discipline, enforcement_layer, auto_enforce, rules, priority_hierarchy?, protocols?})`
  - `additionalProperties: false` everywhere
- **Complexity**: S (~30 min verbatim copy)
- **Depends_on**: T3.3.W0.11 (18 surface for `SCHEMA_VERSIONS.discipline`)
- **Acceptance**:
  1. `pnpm exec vitest run tests/workflow/schema/discipline.test.ts` PASS (NEW test file ~15 fixture covering 6 yaml + invalid case)
  2. `pnpm exec tsc --noEmit` PASS
  3. 6 disciplines/*.yaml T3.3.W0.4 全 validate PASS via `Value.Check(Discipline, parsed)`
  4. File length ≤ 100L

#### T3.3.W0.7 [S] src/workflow/schema/capabilities.ts v1 in-place extend (NOT bump, discriminated union)

- **File modified**: `src/workflow/schema/capabilities.ts` (v1 SHIPPED 67L → ~140L)
- **Action**: Per RESEARCH-workflows Pattern A B.3 (discriminated union, sister judgment.ts JudgmentTriggersFile vs JudgmentRulesFile pattern verbatim):
  - NEW `CategoryEnum = Type.Union([Type.Literal('behavioral'), 'tool-slash-cmd', 'tool-mcp', 'tool-cli', 'tool-plugin', 'tool-bundled-skill', 'agent-platform'])`
  - `CapabilityEntryBase` (shared 8 field: impl + cmd + since + description + fires_when? + requires? + plugin_path? + outputs? + aliases? + sdk_ref?)
  - `DisciplineCapabilityEntry = Type.Composite([CapabilityEntryBase, Type.Object({category: 'behavioral', discipline_ref: Type.String({pattern: '^workflows/disciplines/[a-z-]+\\.yaml$'})})])`
  - `ToolCapabilityEntry = Type.Composite([CapabilityEntryBase, Type.Object({category: <6 non-behavioral literal>})])` — NO discipline_ref allowed (additionalProperties:false 保护)
  - `CapabilityEntry = Type.Union([DisciplineCapabilityEntry, ToolCapabilityEntry])`
  - **capabilities.v1 NOT bump** per Pattern A B.1 (Optional additive field per D-16 rule c)
- **Complexity**: S (~1 h schema extend, discriminated union 验证 careful)
- **Depends_on**: T3.3.W0.2 schema-shape (entries 必须先 have category field 才能 schema validate pass)
- **Acceptance**:
  1. `pnpm exec vitest run tests/workflow/schema/capabilities.test.ts` PASS (extend test cases: behavioral entry 必带 discipline_ref / tool-* entry 必 NOT 带 discipline_ref)
  2. 75 entry T3.3.W0.1+T3.3.W0.2 全 schema validate PASS
  3. File length ≤ 200L (current 67L + ~75L additive = 142L)
  4. schema_version 字面值未变 (`harnessed.capabilities.v1`)

#### T3.3.W0.8 [S] src/workflow/schema/phaseFactContext.ts extend 13 NEW field MIN scope

- **File modified**: `src/workflow/schema/phaseFactContext.ts` (v2 SHIPPED 109L → ~135L)
- **Action**: Per RESEARCH-capabilities Appendix C "core MIN" 13 NEW field (K3 mitigation, defer gstack optional 35 fires_when 到 v3.x):
  - **Phase shape NEW 6 boolean**: `is_complex_architecture` (D-01 master /plan), `requires_creative_polish` (web-design-routing frontend-design fires), `requires_persisted_plan` (D-06 planning-with-files), `requires_peer_review` (sister gsd-review v2 backfill), `is_final_step` (sister code-simplifier v2 backfill), `has_business_decisions` (sister gstack-plan-ceo-review v2 backfill)
  - **Subtask shape NEW 5 field**: `test_type: Type.Union([...4 literal: 'ci-commit' / 'probe' / 'python-backend' / 'perf-diagnostic'])`, `search_type: Type.Union([...6 literal: 'keyword' / 'descriptive' / 'academic' / 'lib-docs' / 'github-url' / 'single-url'])`, `needs_lib_docs: Type.Boolean()`, `needs_web_search: Type.Boolean()`, `needs_google_workspace: Type.Boolean()`
  - **Root flat NEW 2 boolean**: `needs_web_search`, `is_critical_release`
  - Final scope: phase 14+6=20, subtask 13+5=18, root 6+2=8, total = **47 field** (合理 scope)
- **Complexity**: S (~30 min additive, sister v2 pattern)
- **Depends_on**: none
- **Acceptance**:
  1. `pnpm exec vitest run tests/workflow/schema/phaseFactContext.test.ts` PASS
  2. `pnpm exec tsc --noEmit` PASS
  3. `Value.Check(PhaseFactContext, sample-ctx)` validate 47 field
  4. File length ≤ 200L (109L → ~135L 边界 OK)
  5. **NOT** 引入 35 gstack optional fires_when field (defer v3.x per K3 mitigation)

#### T3.3.W0.9 [M] src/workflow/disciplineLoader.ts NEW ~120L + 4 hook helper file

- **Files created**:
  - `src/workflow/disciplineLoader.ts` (NEW ~120L, sister judgmentResolver.ts pattern verbatim per RESEARCH-disciplines § 3.1)
  - `src/discipline/enforcement/before-phase-execute.ts` (NEW ~35L per § 3.2.4)
  - `src/discipline/enforcement/before-spawn.ts` (NEW ~45L per § 3.2.3 — priority hierarchy arbitrate)
  - `src/discipline/enforcement/before-commit.ts` (NEW ~50L per § 3.2.1 — biome preempt + commit safety)
  - `src/discipline/enforcement/after-output.ts` (NEW ~55L per § 3.2.2 — BLUF + em-dash + emoji + sycophantic + end-recap heuristic)
- **Action**: Verbatim transcription from RESEARCH-disciplines § 3.1 + § 3.2.x (含 module-level Map cache + `loadDiscipline / loadAllApplied / getRule / _clearDisciplineCache` API + 4 hook helper each ≤80L per karpathy split pattern sister `src/routing/lib/fallbackHandlers.ts`)
- **Complexity**: M (~2.5 h 5 file create + ~25 fixture test)
- **Depends_on**: T3.3.W0.4 (6 yaml exist), T3.3.W0.6 (Discipline schema)
- **Acceptance**:
  1. `pnpm exec vitest run tests/workflow/disciplineLoader.test.ts` PASS (≥10 fixture: load each of 6 + cache hit + invalid yaml + missing file)
  2. `pnpm exec vitest run tests/discipline/enforcement/` PASS (4 hook 各 ≥5 fixture, total ~25)
  3. `pnpm exec tsc --noEmit` PASS
  4. 5 file 各 ≤ 120L (disciplineLoader.ts) / ≤80L (4 hook helper) — karpathy ≤200L 全 hold
  5. `loadAllApplied(undefined)` default 加载全部 6 discipline (per `before-phase-execute.ts` DEFAULT_APPLIED const)

#### T3.3.W0.10 [M] scripts/check-workflow-schema.mjs extend 3 cross-validate contract

- **File modified**: `scripts/check-workflow-schema.mjs` (v2 SHIPPED ~80L → ~150L)
- **Action**: Per RESEARCH-workflows Pattern A C.2 (3 strict cross-validate contracts) + Area 5 Example 1 verbatim:
  - **Contract 1**: workflow.yaml `tools_available[]` ⊂ capabilities.yaml entry name set (Pitfall 4 mitigation)
  - **Contract 2**: workflow.yaml `disciplines_applied[]` ⊂ 6 discipline basename set
  - **Contract 3 (NEW C.2)**: judgments/*.yaml `triggers.*.invokes[].capability` ⊂ capabilities.yaml entry set (K2 + R3 silent broken mitigation)
  - **NEW schema-post invariant** (K9 mitigation): master workflow `delegates_to[]` 任 mode=serial 必带 order;不带 → fail
  - Walk: `workflows/<stage>/<sub>/workflow.yaml` recursive scan + `workflows/{research,retro}/workflow.yaml` flat + `workflows/judgments/*.yaml` glob
- **Complexity**: M (~1.5 h cross-validate walker + ~10 negative case fixture)
- **Depends_on**: T3.3.W0.5 + T3.3.W0.6 + T3.3.W0.7 (3 schema 必须先 exist)
- **Acceptance**:
  1. `node scripts/check-workflow-schema.mjs` exit 0 在 Phase 3.3 W0 末 (T3.4 yaml 还未 ship 时 0 workflow yaml,仅 capabilities + disciplines + judgments validate)
  2. Negative test: artificial `tools_available: [nonexistent-cap]` → exit 1 + error "not in capabilities.yaml"
  3. Negative test: `disciplines_applied: [bogus]` → exit 1 + error "not in disciplines/"
  4. Negative test: judgments `invokes: [{capability: bogus}]` → exit 1 + error "not in capabilities.yaml" (NEW C.2)
  5. Negative test: master delegates_to serial 无 order → exit 1 + "serial mode requires explicit order"
  6. `.github/workflows/ci.yml` 现有 wire 不变 (sister Phase 2.3 W0.6 L141 已 wire)

#### T3.3.W0.11 [S] src/types/schemaVersion.ts 16 → 18 surface

- **File modified**: `src/types/schemaVersion.ts` (v2 SHIPPED 108L 16 const → ~118L 18 const)
- **Action**: Add 2 NEW surface per Pattern A B.1 LOCK:
  - `workflow_v3: 'harnessed.workflow.v3'` (17th surface)
  - `discipline: 'harnessed.discipline.v1'` (18th surface)
  - **capabilities.v1 NOT bump** per Pattern A B.1 (Optional additive `category` field per D-16 rule c verbatim)
  - SchemaVersionLiteral Union 同步 +2 Literal
- **Complexity**: S (~15 min, sister Phase 2.4 W0.1 16th surface pattern verbatim)
- **Depends_on**: none
- **Acceptance**:
  1. `pnpm exec vitest run tests/types/schemaVersion.test.ts` PASS
  2. `Object.keys(SCHEMA_VERSIONS).length === 18`
  3. T3.3.W0.5 + T3.3.W0.6 downstream consume PASS

#### T3.3.W0.12 [M] src/cli/lib/setup-helpers.ts extend ~80L nested 2-level scan + v2 deprecation warn

- **File modified**: `src/cli/lib/setup-helpers.ts` (v2 SHIPPED 128L → ~210L delta — risk karpathy 200L edge, split helper if needed)
- **Action**: Per RESEARCH-workflows Area 4 verbatim:
  - NEW `NestedWorkflow {name, relPath, isMaster}` interface
  - NEW `FLAT_LEGACY_NAMES = new Set(['plan-feature', 'execute-task', 'verify-work', 'research', 'retro'])`
  - 重写 `scanWorkflowsWithSkill()`:
    - Path A: flat top-level SKILL.md (research / retro keep; plan-feature/execute-task/verify-work emit deprecation warn + skip install per D-04)
    - Path B: nested 2-level workflows/<stage>/<sub>/SKILL.md (slash-cmd name flatten: `auto` → `/discuss`, others → `/<stage>-<sub>`)
    - Skip `disciplines/` + `judgments/` (K10 mitigation — non-workflow dirs)
  - `setup` 输出 deprecation block per RESEARCH-workflows Area 4 末段 (5L console output)
  - **Karpathy 200L 风险**: 如 setup-helpers.ts 超 200L, 拆 `scanWorkflowsNested` 进 NEW `src/cli/lib/scan-nested.ts` (per `src/routing/lib/fallbackHandlers.ts` ≤80L split sister pattern)
- **Complexity**: M (~2.5 h scan logic rewrite + ~15 fixture test extend)
- **Depends_on**: none (independent of schema task)
- **Acceptance**:
  1. `pnpm exec vitest run tests/cli/setup-helpers.test.ts` PASS (extend ≥10 fixture: nested 2-level + flat legacy + deprecation warn + disciplines skip + judgments skip)
  2. `harnessed setup --dry-run` 输出含 deprecation block for v2 legacy 3 cmd (`/plan-feature` / `/execute-task` / `/verify-work`)
  3. Nested scan correctly flattens `workflows/discuss/strategic/` → name `discuss-strategic` + isMaster=false; `workflows/discuss/auto/` → name `discuss` + isMaster=true
  4. 文件 ≤ 200L (确认 split if needed)
  5. K12 mitigation 反映: v3 setup 不 auto-remove v2 旧 skill dir, 仅 deprecation warn (sister fallback.yaml 铁律 1 透明声明)

### Wave 3.3.W1 close (2 task)

#### T3.3.W1.1 [S] gstack 33 optional capabilities entry diff + dry-run validate (K1 mitigation)

- **Action**: 实测 `grep -r '^name:' ~/.claude/plugins/gstack/skills/*/SKILL.md 2>/dev/null` 获取实际 gstack 安装的 skill name list, 与 T3.3.W0.2 33 optional entry name 比对。任何不匹配 entry → 标 `since: v3.x` defer 或 删除 entry 等待 gstack ship。
- **Files modified**: `workflows/capabilities.yaml` (T3.3.W0.2 输出 surgical patch only)
- **Complexity**: S (~30 min grep + diff + Optional adjustment)
- **Depends_on**: T3.3.W0.2
- **Acceptance**:
  1. Output `D:\GitCode\harnessed\.planning\phase-v3.0-3.3\gstack-skill-diff.md` 记录 33 entry vs 实际 gstack plugin install list (sister evidence pattern)
  2. 不匹配 entry 在 capabilities.yaml 标注 `since: v3.x` (defer 触发 only when user explicit invoke)
  3. Wave C plan-check (Phase 3.2 end) 验证此 diff 文档 exist

#### T3.3.W1.2 [S] Phase 3.3 ship cadence — STATE.md update + LOCAL tag

- **Action**:
  - Update `.planning/STATE.md` Phase v3.0-3.3 SHIPPED 事件 (sister cadence per STATE.md institutionalized D2 process)
  - Git commit: `feat(phase-v3.0-3.3): schema foundation SHIPPED — 18 surface + capabilities v3 backfill + judgments 4 NEW + disciplines 6 NEW + discipline.ts + disciplineLoader + 4 hook helper + 3 cross-validate contract`
  - LOCAL tag: `v3.0.0-alpha.0-schema` (sister v2.0.0-alpha.0-schema pattern, pending user push)
- **Complexity**: S (~30 min)
- **Depends_on**: all W0 + W1.1
- **Acceptance**:
  1. `git log --oneline -1` shows new feat commit
  2. `git tag --list | grep v3.0.0-alpha.0-schema` PASS (LOCAL only, user push approval gated)
  3. STATE.md 当前位置 block 更新
  4. Full suite PASS: `pnpm exec vitest run` 0 fail
  5. `pnpm exec biome check` clean (sister project memory `biome-preempt.md` reminder)

---

## Wave 拓扑 — Phase v3.0-3.4 Execute Sub-Workflows (19 task)

### Wave 3.4.W0 — 14 sub workflow yaml + SKILL.md (parallel by file-independence)

每 task 共同 structure:
- **Files created**: `workflows/<stage>/<sub>/workflow.yaml` (~30-60L) + `workflows/<stage>/<sub>/SKILL.md` (~40-60L)
- **Action**: Verbatim copy from RESEARCH-workflows § Area 2 "Sub-Stage yaml Examples (14 file)" + SKILL.md frontmatter pattern。每 yaml 含 `schema_version: harnessed.workflow.v3` + `workflow: <name>` + `description:` + `disciplines_applied: [karpathy, output-style, language, operational, priority, protocols]` (default all 6 全开) + `tools_available: [...]` + `phases: [...]` (master 无, sub 有)。
- **Complexity per task**: S (~30 min each, mostly verbatim copy)
- **Acceptance per task**:
  1. `node scripts/check-workflow-schema.mjs` exit 0
  2. yaml validates via WorkflowSchemaV3 (T3.3.W0.5)
  3. SKILL.md `name:` field 是 bare slash cmd (e.g., `discuss-strategic` NOT `discuss/strategic` per D-02)
  4. `tools_available[]` 全 ∈ capabilities.yaml 75 entry set (T3.3.W0.10 Contract 1 catch)
  5. `disciplines_applied[]` 全 ∈ 6 basename (T3.3.W0.10 Contract 2 catch)

#### T3.4.W0.1 [S] workflows/discuss/strategic/ workflow.yaml + SKILL.md (RESEARCH-workflows Area 2 sub example)
#### T3.4.W0.2 [S] workflows/discuss/phase/ workflow.yaml + SKILL.md
#### T3.4.W0.3 [S] workflows/discuss/subtask/ workflow.yaml + SKILL.md
#### T3.4.W0.4 [S] workflows/plan/architecture/ workflow.yaml + SKILL.md
#### T3.4.W0.5 [S] workflows/plan/phase/ workflow.yaml + SKILL.md
#### T3.4.W0.6 [S] workflows/task/clarify/ workflow.yaml + SKILL.md
#### T3.4.W0.7 [S] workflows/task/code/ workflow.yaml + SKILL.md
#### T3.4.W0.8 [S] workflows/task/test/ workflow.yaml + SKILL.md (含 tdd-gate ref + diagnose conditional invoke)
#### T3.4.W0.9 [S] workflows/task/deliver/ workflow.yaml + SKILL.md (含 ralph-loop completion_promise + parallelism-gate ref + fallback max_iterations_exceeded)
#### T3.4.W0.10 [S] workflows/verify/progress/ workflow.yaml + SKILL.md (gsd-verify-work + gsd-progress + planning-with-files persist)
#### T3.4.W0.11 [S] workflows/verify/code-review/ workflow.yaml + SKILL.md (subagent default parallel)
#### T3.4.W0.12 [S] workflows/verify/paranoid/ workflow.yaml + SKILL.md (gstack-review + is-critical-module gate)
#### T3.4.W0.13 [S] workflows/verify/qa/ + workflows/verify/security/ + workflows/verify/design/ + workflows/verify/simplify/ + workflows/verify/multispec/ 5 sub yaml + SKILL.md (combined task — 5 sub × ~25-36L yaml each, can batch via subagent or 5 individual sub-task per sister verify-work pattern)
- **Complexity**: M (~2 h batch 5 file 各 verbatim copy + frontmatter audit)
- **Files**: 5 × (workflow.yaml + SKILL.md) = 10 file
#### T3.4.W0.14 [S] master dir scaffold check — `workflows/{discuss,plan,task,verify}/auto/` 4 directory exist (空, Phase 3.5 fill content) + setup --dry-run 验证 nested scan 不报错

- **Action**: Create 4 empty directory + `.gitkeep` placeholder; `setup --dry-run` 验证 nested scan logic T3.3.W0.12 不 crash on empty auto/ subdir
- **Complexity**: S (~15 min)
- **Acceptance**:
  1. 4 directory exist via `ls workflows/discuss/auto/ workflows/plan/auto/ workflows/task/auto/ workflows/verify/auto/`
  2. `harnessed setup --dry-run` 不 crash + 不 install 4 master (因为 no SKILL.md yet)

### Wave 3.4.W1 — 2 standalone workflow yaml + SKILL.md (2 task)

#### T3.4.W1.1 [S] workflows/research/workflow.yaml v3 schema bump + SKILL.md update

- **Files modified**:
  - `workflows/research/workflow.yaml` (v2 SHIPPED 19L → v3 ~25L per RESEARCH-workflows Area 2 Standalone section)
  - `workflows/research/SKILL.md` (v2 SHIPPED — update frontmatter `schema_version: harnessed.workflow.v3`)
- **Action**: v2 yaml schema_version `harnessed.workflow.v2` → `harnessed.workflow.v3`; 加 `disciplines_applied: [...6]` + `tools_available: [tavily-mcp, exa-mcp, ctx7, gsd-discuss-phase]` workflow-level field; phases 内容 reuse v2 (`01-fan-out` + `02-synth`)
- **Complexity**: S (~20 min)
- **Acceptance**: schema validate PASS + SKILL.md `name: research` unchanged

#### T3.4.W1.2 [S] workflows/retro/workflow.yaml NEW + SKILL.md NEW (entry name `retro-gstack` per Pattern A reconcile)

- **Files created**:
  - `workflows/retro/workflow.yaml` (NEW ~30L per RESEARCH-workflows Area 2 Standalone retro example + Pattern A A.2 Delta 2)
  - `workflows/retro/SKILL.md` (NEW ~40L)
- **Action**: Per RESEARCH-workflows Area 2 retro example verbatim:
  - 2 phase: `01-retro` (`capability: '{{ capabilities.retro-gstack.cmd }}'` — alias suffix per Pattern A) + `02-persist` (`capability: '{{ capabilities.planning-with-files.cmd }}'` + `invokes: /plan` + `artifacts_expected: [RETROSPECTIVE.md]`)
  - SKILL.md `name: retro` + trigger_phrases `["项目总结", "里程碑结束", "经验教训", "retro"]`
- **Complexity**: S (~25 min)
- **Acceptance**: `harnessed setup --dry-run` 显示 `/retro` 标记 NEW v3 entry; T3.3.W0.10 cross-validate PASS

### Wave 3.4.W2 — close (3 task)

#### T3.4.W2.1 [M] SKILL.md frontmatter consistency audit (20 file)

- **Files audit**: 20 SKILL.md (14 sub + 4 master placeholder + 2 standalone)
- **Action**: 每 SKILL.md `name: <bare-slash-cmd>` + `description: <one paragraph>` + `trigger_phrases: [<3 phrase>]` 一致性 grep + `name:` line counter precision check (sister Phase 2.4 README counter integrity gate B 路径 pattern verbatim)
- **Complexity**: M (~1 h 20 file mass check + 任何 inconsistency 修)
- **Acceptance**:
  1. `grep -c '^name: ' workflows/**/SKILL.md` count == 16 (14 sub + 2 standalone; 4 master 是 W3.5 task, 此时空)
  2. 20 SKILL.md `description:` 行 ≥ 1 sentence
  3. 16 SKILL.md `trigger_phrases:` array length ≥ 3

#### T3.4.W2.2 [S] defaults.yaml extend ralph_max_iterations 20 workflow × phase entries

- **File modified**: `workflows/defaults.yaml` (v2 SHIPPED 36L → ~80L)
- **Action**: 沿用 sister Phase 2.3 W1.2 pattern, 加 20 workflow × ~1-3 phase = ~30 NEW ralph_max_iterations entry。每 entry format: `<workflow-name>.<phase-id>: <int>` (例: `discuss-strategic.01-office-hours: 5` / `task-deliver.01-deliver: 20`)。`hard_upper_limit: 100` 保留 sister v2。
- **Complexity**: S (~45 min mass extend)
- **Acceptance**:
  1. `pnpm exec vitest run tests/workflow/defaults.test.ts` PASS
  2. 20 workflow yaml 内 `max_iterations: '{{ defaults.ralph_max_iterations.<workflow>.<phase> }}'` template 全 resolve (T3.4.W2.1 audit 时统一 catch)

#### T3.4.W2.3 [S] Phase 3.4 ship cadence — STATE.md update + LOCAL tag v3.0.0-alpha.1-sub-workflows

- **Action**: 沿用 T3.3.W1.2 pattern; commit `feat(phase-v3.0-3.4): 14 sub-workflow + 2 standalone yaml SHIPPED — research v3 bump + retro NEW + defaults extend`
- **Complexity**: S (~20 min)
- **Acceptance**: tag `v3.0.0-alpha.1-sub-workflows` LOCAL exist + full suite PASS + biome clean

---

## Wave 拓扑 — Phase v3.0-3.5 Execute Master Orchestrator (11 task)

### Wave 3.5.W0 — masterOrchestrator engine + 4 wedge hook (4 task)

#### T3.5.W0.1 [M] src/workflow/masterOrchestrator.ts NEW ~120L

- **File created**: `src/workflow/masterOrchestrator.ts` (NEW per RESEARCH-workflows § Area 3 Hybrid Option C verbatim)
- **Action**: Verbatim from RESEARCH-workflows § Area 3:
  - Import `resolveJudgmentGate` from sister `judgmentResolver.js` (Phase 2.3 W0.4 SHIPPED)
  - `MasterRunResult { master, fired[], skipped[] }` interface
  - `runMasterOrchestrator(masterName: 'discuss'|'plan'|'task'|'verify', context, packageRoot)`:
    - Phase 1: gate eval per delegation clause (try/catch resolveJudgmentGate, gate undefined → unconditional fire)
    - Phase 2: split serial (mode=='serial' sorted by order) vs parallel
    - Phase 3: spawn serial first (sequential await)
    - Phase 4: Promise.allSettled parallel fan-out
    - Phase 5: 透明声明 skipped per fallback.yaml 铁律 1 (console output sister Area 3 Master Dispatcher Transparency block verbatim)
  - **Master Path A vs Path B decision T3.5.W2.1 dogfood**: 初版 `spawnSubWorkflow` 用 Path A (SDK query 直接 spawn — recursive call `runWorkflow` at sub yaml); Path B (sub-shell `harnessed CLI invoke`) fallback when SDK error (sister Phase 2.5 W2.3 error 降级 pattern)
  - K8 mitigation: engine 共享 1 context snapshot per top-level invoke (passed to all sub spawn)
- **Complexity**: M (~2.5 h core engine + ≥15 fixture test)
- **Depends_on**: T3.3.W0.5 (WorkflowSchemaV3) + T3.3.W0.10 (cross-validate)
- **Acceptance**:
  1. `pnpm exec vitest run tests/workflow/masterOrchestrator.test.ts` PASS (≥15 fixture: 4 master × {all fire / partial fire / all skip / gate error})
  2. `pnpm exec tsc --noEmit` PASS
  3. File length ≤ 200L (karpathy)
  4. Master orchestrator dispatcher 输出含 "Evaluating <N> sub-workflow gates" + "Firing <M> sub in <serial|parallel>" + "Complete: <X> fired, <Y> skipped" (transparency block per Area 3)

#### T3.5.W0.2 [S] before-phase-execute hook integrate masterOrchestrator + run.ts

- **File modified**: `src/workflow/run.ts` (v2 SHIPPED — extend wedge per RESEARCH-disciplines § 4.4)
- **Action**: per RESEARCH-disciplines § 4.4:
  - `runWorkflow()` master vs sub detection: if (`['discuss', 'plan', 'task', 'verify'].includes(workflowName)`) → `runMasterOrchestrator()` else `runSubOrStandalone()`
  - L74 for-loop start: `const disciplines = await loadDisciplinesForPhase(parsed.disciplines_applied, packageRoot)` → gateContext extended
- **Complexity**: S (~30 min wedge + ≥5 fixture test extend)
- **Depends_on**: T3.5.W0.1 + T3.3.W0.9
- **Acceptance**: `pnpm exec vitest run tests/workflow/run.test.ts` PASS extend

#### T3.5.W0.3 [S] before-spawn hook wire to masterOrchestrator (priority arbitration)

- **File modified**: `src/workflow/masterOrchestrator.ts` (T3.5.W0.1)
- **Action**: 在 Phase 2 split 后 + Phase 3 spawn 前 加 `arbitrateBeforeSpawn(firedCapabilities, packageRoot)` 调用 (per RESEARCH-disciplines § 3.2.3)。若 fired.length > 1 → priority hierarchy sort + emit warn "multi-capability fires, arbitrating by priority"。**K14 mitigation**: arbitrate enforcement=warn, 不 halt;default 按 priority order 全 spawn (sister CLAUDE.md 独立判断)。
- **Complexity**: S (~30 min wire + ≥3 fixture test)
- **Depends_on**: T3.5.W0.1
- **Acceptance**: fixture multi-capability fire → priority sort 正确;warn emitted not halt

#### T3.5.W0.4 [S] before-commit + after-output hook wire

- **Files modified**:
  - `src/cli/execute-task.ts` (existing ralph-loop wrapper) — wire `runBeforeCommitHook` 在 `git commit` cmd dispatch 前 (K5 Option A: ralph-loop / subagent / team auto-commit only enforce)
  - `src/discipline/enforcement/after-output.ts` (T3.3.W0.9) — runtime wire 在 phase output emit 后 (test fixture only, production wire defer v3.x — K4 mitigation)
- **Action**: K5 Option A wire: 仅 ralph-loop / subagent auto-commit 路径 enforce biome-preempt;user 主 session git commit 不 enforce (用户自负责)。after-output hook v3.0 仅 unit-test exercise (production response output integration defer v3.x — sister K4 false-positive risk)。
- **Complexity**: S (~30 min wire + 6 fixture)
- **Depends_on**: T3.3.W0.9
- **Acceptance**:
  1. ralph-loop subagent fixture: biome preempt auto-fix triggered before commit
  2. user 主 session git commit fixture: hook NOT triggered (clean separation)
  3. after-output unit test 覆盖 BLUF / em-dash / sycophantic regex (≥5 fixture)

### Wave 3.5.W1 — 4 master workflow.yaml + SKILL.md + run.ts integrate (5 task)

#### T3.5.W1.1 [S] workflows/discuss/auto/workflow.yaml + SKILL.md (~40L yaml + ~45L SKILL.md per RESEARCH-workflows § Area 2 Master Orchestrator yaml Examples)
#### T3.5.W1.2 [S] workflows/plan/auto/workflow.yaml + SKILL.md (~38L yaml)
#### T3.5.W1.3 [S] workflows/task/auto/workflow.yaml + SKILL.md (~42L yaml)
#### T3.5.W1.4 [S] workflows/verify/auto/workflow.yaml + SKILL.md (~50L yaml — 7 sub delegates_to per RESEARCH-workflows § Area 2 verify master)

Per task structure:
- **Files created**: 2 file each (workflow.yaml + SKILL.md)
- **Action**: Verbatim copy from RESEARCH-workflows § Area 2 Master Orchestrator yaml Examples (4 file)。每 yaml 含 `delegates_to: [{sub, gate?, mode, order?}]` + `disciplines_applied: [...6]` + `tools_available: [...]`。SKILL.md `name: <discuss|plan|task|verify>` (bare per D-02)
- **Complexity per task**: S (~25 min each)
- **Acceptance per task**:
  1. yaml validates via WorkflowSchemaV3 (`delegates_to` 非空, `phases` 缺省)
  2. `node scripts/check-workflow-schema.mjs` exit 0 — 含 T3.3.W0.10 NEW invariant "serial mode requires explicit order" pass
  3. `harnessed setup --dry-run` 显示 4 master 标记 NEW + isMaster=true

#### T3.5.W1.5 [S] run.ts dispatch + 4 hook fire point integrate (final wire)

- **File modified**: `src/workflow/run.ts` (T3.5.W0.2 续)
- **Action**: 4 hook fire point 全集成 per RESEARCH-disciplines § 4.4 verbatim:
  - L80 activatePhase 后 + L83 isVetoed 前: `before-spawn` arbitration if `phase.invokes_tools.length > 1`
  - L120 dispatchSkillStub return 后: `after-output` validate if `r.target === 'chat'`
  - L130 completePhase 前: `before-commit` hook if `r.triggers_commit === true`
- **Complexity**: S (~45 min 3 wedge integrate)
- **Depends_on**: T3.5.W0.2 + T3.5.W0.3 + T3.5.W0.4
- **Acceptance**: `pnpm exec vitest run tests/workflow/run.test.ts` PASS extend ≥6 fixture (各 hook trigger fixture)

### Wave 3.5.W2 — dogfood + close (2 task)

#### T3.5.W2.1 [L] 4-stage 端到端 dogfood (1 cycle per stage, sister Phase 2.5 5-cycle pattern reduced to 4)

- **Action**: Sister Phase 2.5 dogfood methodology verbatim — 4 cycle, each stage 1 cycle:
  - **Cycle 1 discuss**: `/discuss` master invoke + gate-route 3 sub fixture (fixture: strategic-gate fires + phase-gate fires + subtask-gate skips) → 验证 transparency block + parallel spawn
  - **Cycle 2 plan**: `/plan` master invoke + serial 2 sub (architecture conditional → phase always) → 验证 order respect + planning-with-files /plan invoke
  - **Cycle 3 task**: `/task` master invoke + serial 4 sub (clarify → code → test → deliver) → 验证 ralph-loop wrapper + tdd-gate fire + planning-with-files progress.md update
  - **Cycle 4 verify**: `/verify` master invoke + 7 sub conditional (progress serial + code-review parallel + paranoid conditional + qa+security+design parallel conditional + simplify tail serial + multispec Pattern C critical release) → 验证完整 Verify stage 流程 + Master Path A SDK query vs Path B sub-shell fallback decision **LOCK** in this cycle
  - Each cycle 产出 fixture (~8-10 fixture per cycle, total ~30+ fixture sister Phase 2.5 46 fixture scope reduced)
  - 任 cycle 发现 production bug → inline fix + 记录 `.planning/phase-v3.0-3.5/DOGFOOD-CYCLE-<N>.md` (sister Phase 2.5 caught real bug 3 处 uppercase OR/AND pattern memory)
- **Files**:
  - `.planning/phase-v3.0-3.5/DOGFOOD-CYCLE-{1,2,3,4}.md` (4 file ~80-120L each)
  - `tests/fixtures/workflow-v3/*.yaml` (~30 NEW fixture)
- **Complexity**: L (~6-8 h 4 cycle subagent fan-out OR sequential)
- **Depends_on**: T3.5.W0.* + T3.5.W1.*
- **Acceptance**:
  1. 4 cycle 全 SHIPPED 产出 fixture + DOGFOOD-CYCLE-N.md
  2. Master Path A vs B decision LOCKED (推荐 Path A default + Path B fallback per RESEARCH-workflows Open Q4)
  3. Any production bug caught → inline fix + commit
  4. 全 30+ fixture pass: `pnpm exec vitest run tests/fixtures/workflow-v3/` 0 fail
  5. `dogfood-first methodology proves R8.1 value` 标 (sister Phase 2.5 cite)

#### T3.5.W2.2 [S] Phase 3.5 ship cadence — STATE.md update + LOCAL tag v3.0.0-rc.1

- **Action**: 沿用 T3.4.W2.3 pattern; commit `feat(phase-v3.0-3.5): master orchestrator + 4 wedge hook + 4-stage dogfood SHIPPED — Path A LOCK + N fixture + 0 production bug catch`
- **Complexity**: S (~20 min)
- **Acceptance**: tag `v3.0.0-rc.1` LOCAL + full suite PASS + biome clean

---

## Wave 拓扑 — Phase v3.0-3.6 Close + Ship (12 task)

### Wave 3.6.W0 — 3 NEW ADR (parallel, 3 task)

#### T3.6.W0.1 [S] docs/adr/0030-namespace-policy-bare-slash-cmd.md NEW

- **File created**: `docs/adr/0030-namespace-policy-bare-slash-cmd.md` (NEW ~120L per ADR 0011 9-section template sister pattern)
- **Action**: Codify D-02 LOCK — v3.0 confirmed bare slash cmd convention (sister ADR 0009 v1.0.2 LOCK 沿袭, NOT 引入 namespace; defer hierarchical 3-level 到 Claude Code 平台 native 支持后 evaluate)
- **Sections** (9-section ADR template): Context + Decision + Drivers + Consequences (Positive/Negative) + Alternatives Considered (Option B colon namespace + Option C hierarchical) + Validation + References (ADR 0009 + project CLAUDE.md gstack convention) + Status (Accepted 2026-05-20) + Acceptance Bar
- **Complexity**: S (~45 min sister 9-section template)
- **Acceptance**: file valid ADR + index pointer pending T3.6.W2.1

#### T3.6.W0.2 [S] docs/adr/0031-4-stage-namespace-layered-architecture.md NEW

- **File created**: `docs/adr/0031-4-stage-namespace-layered-architecture.md` (NEW ~150L)
- **Action**: Codify M-01 + D-03 + D-07 LOCKED — v3.0 4-stage namespace-layered architecture: 20 workflow (4 master /discuss /plan /task /verify + 14 sub + 2 standalone), nested 2-level `workflows/<stage>/<sub>/`, sister CLAUDE.md 4-stage cadence 镜像。Tradeoff: BREAKING change vs incremental;Pure ship v3 deprecate v2 (release-notes-only) 路径选择。
- **Sections**: Context (v2.0 GA post-ship architectural smell: 5-phase plan-feature conflates 5 layer) + Decision + Drivers (D-13 superset commitment) + Consequences + Alternatives (v2.x incremental band-aid rejected) + Validation (Phase 3.5 dogfood) + References (ADR 0024 v2.0 + CLAUDE.md 4-stage prose)
- **Complexity**: S (~1 h primary architectural ADR)
- **Acceptance**: file valid ADR + sections complete

#### T3.6.W0.3 [S] docs/adr/0032-cross-cutting-disciplines-and-execution-mechanism.md NEW

- **File created**: `docs/adr/0032-cross-cutting-disciplines-and-execution-mechanism.md` (NEW ~140L)
- **Action**: Codify D-05 + D-09 + D-10 + D-11 LOCKED:
  - L0 Discipline Substrate (6 yaml `karpathy/output-style/language/operational/priority/protocols.yaml`)
  - L5b Execution Mechanism Layer (subagent / Agent Teams / 主 session / ralph-loop orthogonal wrapper)
  - rules-based routing (4 NEW judgments yaml: web-design + web-testing + web-search + stage-routing)
  - 心法招式 cross-cutting (NOT phase)
- **Sections**: 9-section template + 1:1 mapping table CLAUDE.md/rules → L0/L5b artifacts (D-13 superset 验证)
- **Complexity**: S (~1 h)
- **Acceptance**: file valid ADR + 1:1 mapping table 完整 (CLAUDE.md 13 节 → L0 6 yaml + judgments 10 yaml + capabilities 75 entry + 20 workflow)

### Wave 3.6.W1 — ship artifacts (5 task)

#### T3.6.W1.1 [M] CHANGELOG.md [3.0.0] BREAKING section + alias map table

- **File modified**: `CHANGELOG.md`
- **Action**: NEW [3.0.0] entry 顶部 BREAKING CHANGES section (sister v2.0.0 CHANGELOG pattern):
  - BREAKING: /plan-feature DROPPED → use /plan master OR /plan-phase sub
  - BREAKING: /execute-task DROPPED → use /task master OR /task-{clarify,code,test,deliver}
  - BREAKING: /verify-work DROPPED → use /verify master OR /verify-{progress,paranoid,qa,security,design,simplify,multispec}
  - Alias map table (v2 slash cmd → v3 equivalent, 4 row)
  - End-user 升级一行 `npm install -g harnessed@3.0 && harnessed setup --apply`
  - NEW: /research v3 (schema bump only, slash cmd unchanged), /retro standalone NEW
  - NEW: 20 workflow 4-stage namespace-layered (4 master + 14 sub + 2 standalone)
  - NEW: L0 Discipline Substrate (6 yaml), L5b Execution Mechanism Layer (parallelism-gate + agent-teams), 10 judgments yaml (6 v2 + 4 NEW), ~75 capabilities entry (39 backfill + ~36 NEW)
  - NEW: 3 ADR (0030 + 0031 + 0032)
- **Complexity**: M (~1 h verbatim alias map + breaking change call-out)
- **Acceptance**:
  1. `grep -c '^## \[3.0.0\]' CHANGELOG.md` == 1
  2. alias map table 4 row valid
  3. BREAKING CHANGES section 顶部 黑体 加粗

#### T3.6.W1.2 [S] ci.yml A7 step 0029 → 0032

- **File modified**: `.github/workflows/ci.yml`
- **Action**: Sister Phase 2.6 W1 0023→0029 pattern verbatim — A7 step content invariant grep extend 3 NEW ADR ref (0030 + 0031 + 0032 main body hash invariant)
- **Complexity**: S (~20 min)
- **Acceptance**:
  1. CI A7 step pass on PR commit
  2. Add 3 row ADR ref iter (sister 0023→0029 iter pattern)

#### T3.6.W1.3 [S] package.json 2.0.1 → 3.0.0

- **File modified**: `package.json`
- **Action**: version bump 2.0.1 → 3.0.0 (semver major for v3.0 BREAKING per D-04)
- **Complexity**: S (~5 min)
- **Acceptance**: `pnpm exec node -p "require('./package.json').version"` == "3.0.0"

#### T3.6.W1.4 [M] README.md v3.0 highlight (20 workflow 4-stage diagram)

- **File modified**: `README.md`
- **Action**: 替换 v2.0 "4 workflows" 节 → v3.0 "20 workflows in 4-stage namespace-layered architecture"; 含 mermaid 4-stage diagram (Discuss → Plan → Execute → Verify, each stage 含 master + sub list); v2 → v3 migration block (manual remove ~/.claude/skills/{plan-feature,execute-task,verify-work}/ 指引 per K12 mitigation)
- **Complexity**: M (~1.5 h mermaid + workflow table 20 row + migration block)
- **Acceptance**:
  1. mermaid diagram render via GitHub markdown preview
  2. README counter integrity check pass (sister Phase 2.4 CI step pattern — if applicable to v3 phase count)
  3. v3.0 highlight 节 顶部 add

#### T3.6.W1.5 [M] docs/WORKFLOW.md major rewrite (4-stage mermaid + 20 workflow table)

- **File modified**: `docs/WORKFLOW.md` (v2 SHIPPED — major rewrite)
- **Action**: 4-stage mermaid + 20 workflow table 替换 v2.0 "4 workflows" prose; 含 L0 disciplines + L5b execution mechanism 解释 + 10 judgments yaml map (sister RESEARCH-capabilities Appendix B verbatim) + ~75 capabilities entry 7-category 分布表
- **Complexity**: M (~2 h doc rewrite)
- **Acceptance**:
  1. mermaid 4-stage diagram render
  2. 20 workflow table 含 name + stage + master/sub flag + capability/upstream + brief description
  3. L0 + L5b + 4-stage cadence 节 verbatim from CONTEXT.md + RESEARCH

### Wave 3.6.W2 — milestone close + GA tag (4 task)

#### T3.6.W2.1 [S] docs/adr/README.md index 3 row append

- **File modified**: `docs/adr/README.md`
- **Action**: Append 3 row for 0030 + 0031 + 0032 (sister Phase 2.6 6 row append pattern verbatim)
- **Complexity**: S (~10 min)
- **Acceptance**: `grep -c '^| 003' docs/adr/README.md` count + 3

#### T3.6.W2.2 [M] .planning/milestones/v3.0-MILESTONE-AUDIT.md NEW (D-13 superset 1:1 mapping table 校验)

- **File created**: `.planning/milestones/v3.0-MILESTONE-AUDIT.md` (NEW ~250L)
- **Action**: Sister `.planning/milestones/v2.0-MILESTONE-AUDIT.md` pattern verbatim + **D-13 superset 1:1 mapping table** 校验:
  - CLAUDE.md 13 节 → L0 6 disciplines + L5b judgments + 20 workflows + 75 capabilities 1:1 mapping
  - Obsidian doc 4-stage cadence → 4 master + 14 sub + 2 standalone 全覆盖
  - ~/.claude/rules/{web-design,web-testing,web-search,agent-teams,cc-handoff,context7,google-workspace}.md → judgments + capabilities 全 codify
  - audit transparency: 跳过 step 透明声明 (sister fallback.yaml 铁律 1)
  - Phase 3.3 + 3.4 + 3.5 ship 总结 + R30.x acceptance 校验 (R30.1-R30.13 全 Done OR 标 Partial defer v3.x)
- **Complexity**: M (~2 h audit doc + 1:1 mapping verify)
- **Acceptance**:
  1. file ≥ 200L
  2. 13 D-decision 全部 traceability 表
  3. 16+ R30.x acceptance 全部 Status (Done / Partial)
  4. CLAUDE.md / rules 1:1 mapping 表完整 (D-13 superset commitment 验证)

#### T3.6.W2.3 [S] Phase 3.6 ship cadence — 4 LOCAL tag

- **Action**:
  - Verify 3 existing LOCAL tag from prior phase exist: `v3.0.0-alpha.0-schema` (T3.3.W1.2) + `v3.0.0-alpha.1-sub-workflows` (T3.4.W2.3) + `v3.0.0-rc.1` (T3.5.W2.2)
  - Create 🎯 GA tag: `v3.0.0` LOCAL (sister v2.0.0 GA tag triple+1 pattern verbatim)
  - STATE.md update v3.0 6/6 phase COMPLETE
  - Commit: `feat(phase-v3.0-3.6): v3.0 GA SHIPPED — 4 LOCAL tag + 56 task across 4 execute phase + 3 NEW ADR + R8.1 dogfood-first proven`
- **Complexity**: S (~30 min)
- **Acceptance**:
  1. `git tag --list | grep v3.0.0` count == 4 (alpha.0 + alpha.1 + rc.1 + v3.0.0 GA)
  2. Full suite PASS + biome clean
  3. STATE.md "v3.0 6/6 phases COMPLETE 100%" 标记

#### T3.6.W2.4 [S] STATE.md final update + npm publish v3.0.0 trigger (pending user push approval)

- **Action**:
  - STATE.md final 更新当前 phase block + 各 milestone 进度表 v3.0 → 6/6 完成
  - **DO NOT PUSH** — sister CLAUDE.md commit safety + ADR 0023 v1.0 OIDC pattern verbatim: user push approval gated;push v3.0.0 tag 触发 publish.yml → npm publish LIVE
  - 报告完整 LOCAL tag list + commit history,等待 user explicit push approval
- **Complexity**: S (~15 min report)
- **Acceptance**:
  1. STATE.md final state stored locally
  2. Report user 待 push tag + commit list (sister v2.0 GA pending push 模式 verbatim)
  3. **NEVER push to remote without user explicit approval** (CLAUDE.md commit safety verbatim)

---

## Acceptance Backward Mapping (13 D-decision → Task IDs)

| D-decision | Verbatim summary | Task IDs |
|-----------|------------------|----------|
| **M-01** | ARCHITECTURAL MAJOR REFACTOR v2 | T3.6.W2.* milestone artifacts + 4 LOCAL tag |
| **D-01** | Master auto gate-route 3-9 sub conditional | T3.5.W0.1 masterOrchestrator engine + T3.5.W1.1-4 4 master yaml + T3.5.W0.3 priority arbitrate + T3.6.W0.1 ADR 0030 |
| **D-02** | Bare slash cmd `/discuss-strategic` (NOT namespace) | T3.3.W0.12 setup nested scan + flat name + T3.6.W0.1 ADR 0030 LOCK |
| **D-03** | Nested workflows/<stage>/<sub>/ dir | T3.3.W0.12 setup-helpers nested scan + T3.4.W0.* 14 sub yaml + T3.5.W1.* 4 master yaml |
| **D-04** | Pure ship v3 deprecate v2 (release-notes-only) | T3.6.W1.1 CHANGELOG alias map + T3.3.W0.12 deprecation warn |
| **D-05** | 心法招式 cross-cutting (NOT phase) | T3.3.W0.4 disciplines yaml (karpathy) + T3.3.W0.9 disciplineLoader + T3.6.W0.3 ADR 0032 |
| **D-06** | planning-with-files cross-cutting TOOL | T3.4.W0.* sub yaml (every persist phase 引用 `/plan` invoke) + capabilities.yaml `planning-with-files` entry (T3.3.W0.1 backfill) |
| **D-07** | 20 workflow ship | T3.4.W0.* (14 sub) + T3.4.W1.* (2 standalone) + T3.5.W1.* (4 master) |
| **D-08** | capabilities.yaml v3 category field (7 enum) | T3.3.W0.1 backfill 39 + T3.3.W0.2 extend ~36 NEW + T3.3.W0.7 schema discriminated union |
| **D-09** | NEW L0 Discipline Substrate (6 yaml + runtime hook) | T3.3.W0.4 6 yaml + T3.3.W0.6 discipline.ts + T3.3.W0.9 disciplineLoader + 4 hook + T3.5.W0.2-4 wedge integrate + T3.6.W0.3 ADR 0032 |
| **D-10** | NEW L5b Execution Mechanism (subagent / Agent Teams / 主 session / ralph-loop) | capabilities.yaml `parallelism-gate.yaml` v2 SHIPPED ref + ralph-loop entry T3.3.W0.1 backfill + agent-teams 3 entry T3.3.W0.1 backfill + T3.4.W0.9 task-deliver workflow ralph-loop wrapper + T3.6.W0.3 ADR 0032 |
| **D-11** | Rules-based routing (4 NEW judgments yaml) | T3.3.W0.3 4 NEW judgments yaml + T3.3.W0.2 supplementary capabilities (gws + 2 supp) |
| **D-12** | Optional gstack 30+ as capabilities registry (NOT sub-workflow) | T3.3.W0.2 gstack 33 entry + T3.3.W1.1 dry-run diff (K1 mitigation) |
| **D-13** | v3.0 superset commitment (full codification) | T3.6.W2.2 milestone audit 1:1 mapping table 验证 |

**All 13 D-decision 全部 ≥1 task 映射 — coverage complete。**

---

## Open Questions (planner Wave B 决策结果 + 余下 Wave C 处理)

planner Wave B 已 LOCK 决策 (基于 3 RESEARCH 反复 cross-reconcile):

1. **Q-PLANNER-1 [category enum final pick]**: **LOCK = `behavioral`** (D-08 verbatim, capabilities-researcher 2nd reply LOCK)。Runtime engine `category === 'behavioral'` path: walk discipline_ref → load yaml → apply hooks。`discipline` enum 候选 dropped。

2. **Q-PLANNER-2 [18 schema_version surface]**: **LOCK = 18 surface** (16 v2 + workflow.v3 + discipline.v1)。capabilities.v1 NOT bump (Optional additive `category` 字段 per D-16 rule c)。

3. **Q-PLANNER-3 [Strict Literal Union for disciplines_applied]**: **LOCK = strict 6-Literal Union** (workflows-researcher + disciplines-researcher 双 LOCK)。`Type.Array(Type.Union([Type.Literal('karpathy'), ...]))` per RESEARCH-workflows Pattern A A.1。

4. **Q-PLANNER-4 [3 cross-validate strict contract]**: **LOCK = 全 3 contract ship Phase 3.3 W0**:
   - Contract 1 tools_available ⊂ capabilities entry set (T3.3.W0.10)
   - Contract 2 disciplines_applied ⊂ 6 basename (T3.3.W0.10)
   - Contract 3 judgments invokes capability ⊂ capabilities entry set (T3.3.W0.10 NEW per Pattern A C.2)

5. **Q-PLANNER-5 [Behavioral entry sentinel cmd]**: **LOCK = `cmd: '<not-applicable-behavioral>'`** (disciplines-researcher LOCK)。Runtime engine 检测 category=behavioral 时 SKIP cmd invoke, 改 load `discipline_ref` yaml + apply hook。

6. **Q-PLANNER-6 [retro yaml entry name]**: **LOCK = `retro-gstack`** (Pattern A A.2 + E.2 — alias suffix policy 区分 harnessed standalone `/retro` standalone workflow vs gstack `/retro` plugin)。

7. **Q-PLANNER-7 [masterOrchestrator.ts 4 wedge hook integration]**: **LOCK = Hybrid Option C** (RESEARCH-workflows § Area 3 推荐):
   - yaml `delegates_to[]` declarative (sub + gate + mode + order)
   - engine NEW `masterOrchestrator.ts` (~120L) consume yaml + `resolveJudgmentGate()` + Path A SDK query default (Path B sub-shell fallback)
   - 4 wedge hook (before-phase-execute + before-spawn + before-commit + after-output) wire via T3.5.W0.2-4
   - Path A default + Path B fallback when SDK error (T3.5.W2.1 dogfood 验证 final)

8. **Q-PLANNER-8 [Master Path A vs Path B decision]**: **DOGFOOD-LOCK Path A default Cycle 4 verify** (sister Phase 2.5 Cycle 2 caught production bug pattern) — initial Path A SDK query recursive `runWorkflow`; Path B sub-shell `harnessed CLI invoke` fallback when SDK error (sister Phase 2.5 W2.3 error 降级 pattern verbatim); final LOCK 在 T3.5.W2.1 Cycle 4 verify dogfood 验证后

**Wave C plan-checker 候选 focus area** (planner punt for Wave C 独立验证):
- 56 task acceptance criteria 量化 + automated cmd 充分性
- 13 D-decision coverage 完整性
- Karpathy ≤200L compliance — 全 NEW TS file 实际 line count verify (T3.3.W0.5 + W0.6 + W0.7 + W0.8 + W0.9 + W0.12 + T3.5.W0.1)
- 3 cross-validate strict contract negative test 充分性
- Pattern A 三路 8 outstanding reconcile task 全部 mapped
- 风险 14 项 mitigation task 全部 mapped
- TDD task identification — 哪些 task 是 type:tdd candidate (core algorithm / discriminated union / engine dispatcher)

**Genuine open question 留给 user** (NOT planner-decidable):
- 无 — Wave B planner LOCK 8 个 outstanding + 5 RESEARCH risk open question 全部已通过 Pattern A 三路 reconcile 解决 OR mitigation 编码进 task

---

## 拒绝清单 (out of v3.0 scope, defer v3.x patch)

| # | Deferred Item | Reason | Target |
|---|--------------|--------|--------|
| RX-3.1 | 23 mattpocock 全集 wire | v3.0 ship 12 高频 (Appendix A 列 11 + tdd 1 = 12), 11 余下 v3.x | v3.x patch |
| RX-3.2 | 47 phaseFactContext FULL field set (gstack optional 35 fires_when) | K3 mitigation — v3.0 13 NEW MIN core scope, gstack optional 35 register-only fires_when 用现有字段 | v3.x patch |
| RX-3.3 | Cross-CC handoff Option B auto-hook (`harnessed setup` postinstall validate) | K6 — Option A 显式 `harnessed validate-handoff` cmd v3.x ship | v3.x patch |
| RX-3.4 | scripts/check-discipline-drift.mjs (CLAUDE.md sync diff) | K7 — v3.0 "snapshot" 原则;drift check defer | v3.x patch |
| RX-3.5 | Hierarchical 3-level slash cmd (`/harnessed:discuss:strategic`) | D-02 LOCK bare;Claude Code 平台 native 支持后 evaluate | v3.x patch (取决于 CC 平台) |
| RX-3.6 | Plugin version-check + update semantic (sister v2.0.1 user feedback) | UX redesign 重活;ADR 0004 idempotent contract extension required | v3.x minor patch |
| RX-3.7 | Master orchestrator interactive mode toggle (user 切 manual sub selection) | D-01 LOCK auto;future config flag 可加 | v3.x |
| RX-3.8 | `/retro` complex cross-milestone trend analysis | v3.0 ship 标准 `/retro` standalone (2 phase: 01-retro + 02-persist); 复杂 cross-milestone 推 v3.x | v3.x |
| RX-3.9 | gstack 30+ optional 全 wrap 为 sub-workflow | D-12 LOCK registry-only;wrap 30+ workflow = scope creep | NEVER (per D-12) |
| RX-3.10 | playwright-cli + webapp-testing reclass `tool-bundled-skill` v3 → eventual `tool-slash-cmd` 还是 `tool-plugin` 重新评估 | v3 reclass per Pattern A E.3, defer 长期分类决策 | v3.x |
| RX-3.11 | biome preempt user 主 session git commit enforcement (Option B `harnessed commit` wrapper) | K5 Option A only v3.0;Option B 干 user workflow 太深 | v3.x patch |
| RX-3.12 | priority hierarchy pick-highest mode (token-saving arbitration) | K14 — v3.0 default invoke-all warn;pick-highest 模式 evaluate user 反馈 | v3.x patch |

---

## Sister Cadence (沿袭 v2.0 institutionalized pattern)

| Pattern | v2.0 sister | v3.0 implementation |
|---------|-------------|---------------------|
| LOCAL tag triple+1 | alpha.0-schema + alpha.1-workflows + rc.1 + v2.0.0 GA | alpha.0-schema (T3.3.W1.2) + alpha.1-sub-workflows (T3.4.W2.3) + rc.1 (T3.5.W2.2) + 🎯 v3.0.0 GA (T3.6.W2.3) |
| A7 ADR conservation | ADR 0023 → 0029 (Phase 2.6 iter) | ADR 0029 → 0032 (Phase 3.6 iter T3.6.W1.2) |
| ADR 9-section template | ADR 0011 + 0024-0029 | ADR 0030 + 0031 + 0032 (T3.6.W0.*) |
| Dogfood-first methodology | Phase 2.5 5 cycle + 46 fixture + 1 production bug caught (R8.1 proven) | Phase 3.5 4 cycle + ~30 fixture (1 per stage, T3.5.W2.1) |
| Milestone audit | v2.0-MILESTONE-AUDIT.md (Phase 2.6 W2) | v3.0-MILESTONE-AUDIT.md (T3.6.W2.2) — D-13 superset 1:1 mapping NEW |
| README counter integrity | v2.0 Phase 2.4 W0 CI gate | v3.0 T3.6.W1.4 README + apply CI gate if applicable |
| Pattern A 全栈三路 Team | Phase 2.4 W1 first-use validated | Phase 3.2 Wave A 3-researcher team SHIPPED (sister continuation) |
| Biome preempt before commit | project memory 3 CI-red recurrence | T3.3.W1.2 + T3.4.W2.3 + T3.5.W2.2 + T3.6.W2.3 全部 commit 前 `pnpm exec biome check --write` |
| STATE.md archive cadence | D2 cadence iter 8 TERMINUS post-v1.0 | Phase 3.3 + 3.4 + 3.5 + 3.6 W0 各 T0.1 trim prev-phase narrative → RETROSPECTIVE.md (sister institutionalized D2 process) |
| User push approval gated | sister CLAUDE.md commit safety + ADR 0023 v1.0 OIDC + sigstore | T3.6.W2.4 v3.0.0 GA pending user push approval, NEVER push without explicit approval |

---

## Self-Validation (Wave B planner pre-ship checklist)

- [x] All 8 mandatory files read 完整 (3.1-CONTEXT + 3.1-DISCUSSION-LOG + 3 RESEARCH + REQUIREMENTS + ROADMAP + STATE)
- [x] 8 outstanding reconcile task from RESEARCH-workflows Addendum C.4 全部 present:
  1. ✅ disciplines_applied strict Literal Union (T3.3.W0.5)
  2. ✅ 18 surface (T3.3.W0.11)
  3. ✅ category=behavioral (T3.3.W0.1 + T3.3.W0.2)
  4. ✅ discriminated union schema (T3.3.W0.7)
  5. ✅ retro-gstack alias suffix (T3.4.W1.2)
  6. ✅ 3 strict cross-validate contract (T3.3.W0.10)
  7. ✅ masterOrchestrator 4 wedge hook (T3.5.W0.1 + T3.5.W0.2-4)
  8. ✅ Master Path A vs B dogfood decision (T3.5.W2.1)
- [x] 13 D-decision 全部 mapped ≥1 task (per Acceptance Backward Mapping table)
- [x] Dependencies acyclic verified (Phase 3.3 W0 12 task → W1 2 task → Phase 3.4 W0 14 task → W1 2 task → W2 3 task → Phase 3.5 W0 4 task → W1 5 task → W2 2 task → Phase 3.6 W0 3 task → W1 5 task → W2 4 task)
- [x] File paths concrete (no `<TBD>`)
- [x] Open Questions LOCKED — Q-PLANNER-1 to 8 全部 planner-decided; 0 genuine user-action question
- [x] Karpathy ≤200L compliance — 全 NEW TS file budget within budget (discipline.ts ~85L / disciplineLoader.ts ~120L / masterOrchestrator.ts ~120L / 4 hook helper ≤80L each / capabilities.ts extended ~140L / phaseFactContext ~135L / workflow.ts ~135L / setup-helpers ~210L → split risk flagged T3.3.W0.12)
- [x] 14 risk 全部 mitigation 编码进 task (K1-K14)
- [x] Sister v2.0 cadence verbatim 沿袭 (4 LOCAL tag + ADR 9-section + dogfood-first + milestone audit + STATE.md archive + biome preempt + user push gated)

---

*Phase v3.0-3.2 PLAN — Wave B planner SHIP*
*56 atomic task across Phase v3.0-3.3 + 3.4 + 3.5 + 3.6 (4 execute phase + close)*
*Estimated 2-3 day total (sister v2.0 1.5 day 4-phase burst cadence)*
*Wave C plan-checker 独立 verdict pending (≤3 iter max)*
