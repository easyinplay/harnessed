# Phase 3.2 PLAN-CHECK Report

**Date**: 2026-05-17
**Plans verified**: PLAN.md (534L) + task_plan.md (1279L)
**Cross-sources**: RESEARCH.md (1309L) + PATTERNS.md (425L) + 3.2-CONTEXT.md + 3.2-KICKOFF.md
**Verdict**: **ISSUES FOUND** (20/23 atomic tasks issue-free, miss: T2.1 / T2.3 / T2.6 — 1 BLOCKER + 3 WARNING; revision iter 1/3 triggered)

---

## EE-4 4-dimension quantitative scores (Phase 2.4 W2 SSOT, RELAX baseline)

| Dim | Score | Threshold | Verdict | Evidence |
|-----|-------|-----------|---------|----------|
| **file_references_verified** | 14/14 = 100% | >=0.8 | PASS | doctor.ts:175L verified (vs KICKOFF 215L stale — planner correctly absorbed R2 1.4 correction); origin-check.ts:80L; loadPhases.ts:30L; state.ts:76L; engineHook.ts:48L; schemaVersion.ts:72L; cli-audit.test.ts:114L; execute-task/phases.yaml:27L (plan cites 28L, off-by-1 trivial); ci.yml:276L with L200-211 README step verified (continue-on-error true at L201, warning at L208); doctor.ts L80 platform finder verified; doctor.ts L130 checkOriginUrl verified; doctor.ts L147 await checkOriginUrl results push verified |
| **reference_sources_real** | 11/11 = 100% | >=0.8 | PASS | RESEARCH 1.4 / 2.2 / 2.3 / 4 / 5 / 8.3 / 9.3 / 10.1 全 accessible 经 read 验证; PATTERNS 1-5 17 target table 与 RESEARCH 一致; CONTEXT D-01~D-04 verbatim 与 PLAN.md frontmatter 一致 |
| **concrete_acceptance** | 23/23 = 100% | >=0.8 | PASS | 每 task acceptance_criteria 全机械 grep/wc/test/typecheck cmd; T0.1 verbatim mock block; T1.1 grep >=10 surface; T1.4 grep platform finder verbatim; T1.6 anti-pattern guard NOT-grep mustache; T2.3 NOT-grep spawn/execaCommand D-03 guard; T3.6 A7 守恒 git diff wc -l == 0 |
| **business_logic_assumptions** | 0 BLOCKER | =0 | PASS | weasel word grep (assume/should be/probably/likely) 0 matches in PLAN.md action/verify/done blocks |

**Overall**: **4/4 PASS** — EE-4 量化全通过。

---

## Goal-backward verification (4 ROADMAP acceptance × R7.1 + R7.4)

| # | Acceptance | Status | Evidence |
|---|------------|--------|----------|
| 1 | PROBE 三选一 doctor 任一前缀场景跑通 (R7.4) | YES | T1.4 probe-gstack.ts 4-state branch verbatim from RESEARCH 1.4 + T1.5 doctor 6th check dispatch + T3.1 e2e 3 fixture prefix matrix |
| 2 | JINJA template 替换正确含 missing var throw fail-loud (R7.4) | YES | T1.6 interpolate.ts verbatim RESEARCH 2.2 + T1.8 6 fixture per RESEARCH 2.3 table |
| 3 | plan-feature 5-phase WIRED 跑通 + checkpoint 集成 (R7.1) | MOSTLY | T2.3 run.ts uses activatePhase + completePhase; T2.6 integration fixture 1 (5 phase happy yields 5 checkpoint entries); BUT run.ts sessionId 一直 undefined (dispatchSkillStub 不返 sessionId), must_haves key_link sessionId propagate spec mismatched — see W-01 |
| 4 | CEO veto 时 halt_workflow + checkpoint paused 保留 (R7.1) | PARTIAL | T2.3 run.ts: if vetoed then statePause then return paused-veto; BUT statePause is called BEFORE activatePhase, so NO current-workflow.json exists for the to-be-vetoed phase. state.ts:66-67 pause early-returns null no-op if state missing yields 不写任何 paused state yields Phase 3.1 resume 无 paused state 可读 — see B-01 |

**R7.1** frontmatter covered; **R7.4** frontmatter covered.

---

## Carry-forward verification (revision can break)

| Item | Status | Evidence |
|------|--------|----------|
| D-01 PROBE zero-INTERACTIVE | PASS | task_plan.md L1252 anti-sneak guard NOT-grep INTERACTIVE prompt; T1.4 4-state branch no prompt |
| D-02 JINJA zero npm-dep | PASS | task_plan.md L1253 anti-sneak guard NOT-grep mustache/handlebars/nunjucks/liquid |
| D-03 WIRED 不接外部 spawn | PASS | task_plan.md L1254 anti-sneak guard NOT-grep spawn/spawnSync/execaCommand/exec |
| D-04 PUSH file-based no polling | PASS | task_plan.md L1255 anti-sneak guard NOT-grep setInterval/setTimeout/chokidar |
| Karpathy hard limit <=200L | PASS | task_plan.md L1227-1241 全 file wc 表 within limit; doctor.ts 175 to 180L <= 200L |
| schemaVersion 9th+10th surface CD-5 单一兼容门 | PASS | T1.1 +4L double-add; grep >=10 surface; T1.7 grep branchOnSchemaVersion >=4 (verified baseline 8 refs in 4 files) |
| W0.1 fix path A locked verbatim | PASS | T0.1 step 2 verbatim RESEARCH 8.3 mock audit-helpers block; src/cli/audit.ts 不动 anti-scope-creep verify |
| biome preempt per task | PASS | EVERY task action step 含 pnpm exec biome check write file |

---

## Deep work rule verification (5-task sampling)

5/5 tasks PASS — read_first / acceptance_criteria / action concrete 全合规 (T0.1 / T1.4 / T1.7 / T2.3 / T3.1 sampling).

---

## Risk inventory check

- W0.1 CI 3-OS green first acceptance bar: locked (Notes for Executor L1268-1273)
- W2 plan-feature 真 spawn sneak-in 防御: T2.3 acceptance NOT-grep spawn anti-pattern guard
- W3 e2e dogfood real cycle: PARTIAL — T3.1 用 mock spawnSync 不接真 gstack-office-hours; D-03 WIRED locked 桩 acceptable
- Threat model: 8 STRIDE threats (T-3.2-01~08) 全列 with mitigation per RESEARCH 11.4

---

## Issues found

```yaml
issues:
  - id: B-01
    severity: BLOCKER
    location: task_plan.md L795-815 (T2.3 run.ts veto branch) + PLAN.md L172-178 (key_link 4)
    finding: |
      T2.3 run.ts veto branch ordering causes "checkpoint paused 保留" acceptance fail
      when veto hits BEFORE phase 1 activation.

      Current implementation order: if (await isVetoed()) statePause + return BEFORE
      activatePhase(ph.id). state.ts:66-67 pause() reads existing state and early-returns
      null no-op if state missing.

      Scenario A (veto at i=0, no prior activate): statePause -> readCurrentWorkflow
      returns null -> silent no-op -> no paused state written -> Phase 3.1 resume cannot
      find paused state -> R7.1 acceptance "CEO veto 时 halt_workflow 不再续 (sister
      Phase 3.1 D-03 RELOAD resume)" cannot exercise resume path.

      Scenario B (veto at i>=1, after prior completePhase): completePhase wrote
      status=complete (engineHook.ts:47) -> statePause reads complete state ->
      paused-on-complete semantic violation (Phase 3.1 D-02 contract: pause is
      transition from active not from complete).
    recommendation: |
      Fix path (a): Reorder to activate BEFORE veto check inside the for-loop.
      This ensures every paused-veto path writes valid paused current-workflow
      that Phase 3.1 resume CLI can consume. Add T2.6 fixture 3: "veto BEFORE
      phase 1 -> paused state written + resume.ts can read it" — currently T2.6
      only tests veto at phase 2 (Scenario B) which hides this defect.

  - id: W-01
    severity: WARNING
    location: task_plan.md L793-815 (T2.3 sessionId) + PLAN.md L132 + L184-186 (key_link)
    finding: |
      T2.3 run.ts sessionId is dead code. let sessionId string-or-undefined declared
      but never assigned (dispatchSkillStub returns no sessionId per L778-782); the
      completePhase spread sessionId-conditional branch never taken.
      PLAN.md L132 must_haves claims sessionId propagate across phases, key_link
      L184-186 mentions sessionId — both mismatched. Phase 3.1 D-04 W-04 lesson:
      dead variable in original engine.ts was a BLOCKER (sister precedent).
    recommendation: |
      Path (a) preferred for D-03 WIRED scope: delete sessionId variable + remove
      sessionId from PLAN.md must_haves.truths L132 + remove key_link sessionId
      mention L184-186. Add Phase 3.3 prereq note in T3.4 RETROSPECTIVE.md as
      sessionId-propagate dogfood replacement target.

  - id: W-02
    severity: WARNING
    location: task_plan.md L661-691 (T2.1 loadPhases) + L681-684 (PhaseEntry schema)
    finding: |
      T2.1 step 4 treats PhaseEntry invokes field addition as CONDITIONAL (If
      PhasesSchema does NOT have invokes field ADD optional field). Verified
      src/workflow/schema/phases.ts:28-38 PhaseEntry does NOT have invokes field
      and additionalProperties false strictly rejects unknown fields.

      Result: loadPhases(workflows/plan-feature/workflow.yaml, ...) Value.Check
      against PhasesSchema fails on unknown invokes + workflow-level on_veto fields
      -> PhasesValidationError throw -> T2.6 integration fixture 1 happy path fails.

      T2.2 NEW planFeature.ts schema has its own invokes field BUT loadPhases.ts
      uses PhasesSchema not PlanFeatureWorkflowV1.
    recommendation: |
      Unconditional adds: (1) invokes Type.Optional(Type.String()) to PhaseEntry
      (1L); (2) on_veto Type.Optional(Type.Literal halt_workflow) to PhasesSchema
      top-level (1L), OR have runWorkflow use planFeature.ts schema instead of
      PhasesSchema (change loadPhases signature). T2.1 + T2.4 acceptance grep updates.

  - id: W-03
    severity: WARNING
    location: PLAN.md L16 + L108 (governance schema path) + PATTERNS.md 2.4
    finding: |
      PATTERNS 2.4 shows GovernanceV1 schema at src/checkpoint/schema/governance.v1.ts
      (sister Phase 3.1 location). PLAN.md L16 + L108 + task_plan.md T1.3 puts it at
      src/workflow/schema/governance.ts. Same for ConfigV1. Both valid; planner chose
      colocation with consumer (governance.ts, run.ts in src/workflow/) — but PATTERNS
      analog literally said checkpoint/schema/. Divergence is undocumented;
      PATTERNS compliance dimension downgraded if not recorded.
    recommendation: |
      Option (a) preferred: 1-line note in W0.3 schema decision record explicitly
      capturing the colocation rule. Option (b): Move schemas to checkpoint/schema/
      matching PATTERNS literal — larger delta. Option (a) is Karpathy-aligned.
```

---

## Verdict

## ISSUES FOUND (revision iteration 1/3 triggered)

**Orchestrator tier-call decisions**:
- B-01 -> fix path (a): reorder activate-then-veto-check in run.ts; add T2.6 fixture 3
- W-01 -> fix path (a): drop sessionId dead variable; update must_haves + key_links
- W-02 -> unconditional add invokes + on_veto fields to PhasesSchema; T2.1+T2.4 acceptance update
- W-03 -> fix path (a): add 1-line divergence note to W0.3 schema decision record

**Expected outcome post-revision**: All 4 ROADMAP acceptance fully deliverable; PATTERNS 2.4 divergence documented; loadPhases schema path coherent; D-03 WIRED scope cleanly contained.

---

*PLAN-CHECK iteration 1/3 — sister Phase 3.1 PLAN-CHECK.md format*
